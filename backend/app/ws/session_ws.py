"""
app/ws/session_ws.py — WebSocket handler for real-time interview events.

Endpoint: WS /ws/sessions/{session_id}

Events from server to client:
  session.started, question.started, interview.state.changed,
  audio.listening, audio.transcribing, answer.received, answer.evaluating,
  skill.updated, difficulty.changed, question.completed, interview.completed, error

Events from client to server:
  client.listening.start, client.listening.stop, client.audio.chunk

Phase 2J: Wire audio.chunk to real STT pipeline.
Phase 2K: Write answer context to Graphiti after evaluation.
"""
import json
import logging
from datetime import datetime

from fastapi import WebSocket, WebSocketDisconnect

from app.schemas.ws import WSEvent

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections per session."""

    def __init__(self) -> None:
        # Map session_id -> list of active websocket connections
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if session_id not in self.active:
            self.active[session_id] = []
        self.active[session_id].append(ws)
        logger.info(f"WebSocket connected: session={session_id}")

    def disconnect(self, session_id: str, ws: WebSocket) -> None:
        if session_id in self.active:
            self.active[session_id].discard(ws) if hasattr(self.active[session_id], "discard") else None
            if ws in self.active[session_id]:
                self.active[session_id].remove(ws)
            if not self.active[session_id]:
                del self.active[session_id]
        logger.info(f"WebSocket disconnected: session={session_id}")

    async def broadcast(self, session_id: str, event: WSEvent) -> None:
        """Send an event to all clients connected to a session."""
        if session_id not in self.active:
            return
        payload = event.model_dump_json()
        dead = []
        for ws in self.active[session_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)

    async def send(self, ws: WebSocket, event: WSEvent) -> None:
        """Send an event to a single WebSocket."""
        await ws.send_text(event.model_dump_json())


# Global connection manager (singleton)
manager = ConnectionManager()


async def handle_session_ws(session_id: str, ws: WebSocket) -> None:
    """
    Main WebSocket handler for an interview session.

    Handles:
    - Connection lifecycle
    - Incoming client events (listening start/stop, audio chunks)
    - Error handling
    """
    await manager.connect(session_id, ws)

    # Notify client that session websocket is ready
    await manager.send(ws, WSEvent.make(
        "session.started",
        session_id,
        {"message": "WebSocket connection established"},
    ))

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send(ws, WSEvent.make(
                    "error",
                    session_id,
                    {"code": "INVALID_JSON", "message": "Invalid JSON received"},
                ))
                continue

            event_type = data.get("type", "")
            await _handle_client_event(session_id, ws, event_type, data)

    except WebSocketDisconnect:
        manager.disconnect(session_id, ws)
        logger.info(f"WebSocket disconnected normally: session={session_id}")
    except Exception as e:
        logger.error(f"WebSocket error session={session_id}: {e}")
        try:
            await manager.send(ws, WSEvent.make(
                "error",
                session_id,
                {"code": "INTERNAL_ERROR", "message": str(e)},
            ))
        except Exception:
            pass
        manager.disconnect(session_id, ws)


async def _handle_client_event(
    session_id: str,
    ws: WebSocket,
    event_type: str,
    data: dict,
) -> None:
    """Process a client event and send appropriate server response events."""

    if event_type == "client.listening.start":
        # Client activated microphone
        await manager.send(ws, WSEvent.make("audio.listening", session_id))

    elif event_type == "client.listening.stop":
        # Client stopped recording — simulate transcription
        await manager.send(ws, WSEvent.make("audio.transcribing", session_id, {
            "partial_transcript": "",
        }))
        # Phase 2J: Forward audio to STT, stream back partial transcripts
        # For now, emit answer.received immediately (caller will POST /answers)
        await manager.send(ws, WSEvent.make("answer.received", session_id, {
            "message": "Transcript ready. Submit via POST /api/sessions/{id}/answers",
        }))

    elif event_type == "client.audio.chunk":
        # Audio chunk for streaming STT — Phase 2J implementation
        # TODO: Forward chunk to STT provider, stream partial transcripts
        pass

    else:
        logger.warning(f"Unknown client event type: {event_type} session={session_id}")
        await manager.send(ws, WSEvent.make("error", session_id, {
            "code": "UNKNOWN_EVENT",
            "message": f"Unknown event type: {event_type}",
        }))
