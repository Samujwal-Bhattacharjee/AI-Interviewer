"""app/schemas/ws.py — WebSocket event schemas."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel

# All event types the server sends to the client
WS_EVENT_TYPES = [
    "session.started",
    "question.started",
    "interview.state.changed",
    "audio.listening",
    "audio.transcribing",
    "answer.received",
    "answer.evaluating",
    "skill.updated",
    "difficulty.changed",
    "question.completed",
    "interview.completed",
    "error",
]


class WSEvent(BaseModel):
    type: str
    session_id: str
    payload: dict[str, Any] = {}
    timestamp: datetime

    @classmethod
    def make(cls, event_type: str, session_id: str, payload: dict | None = None) -> "WSEvent":
        return cls(
            type=event_type,
            session_id=session_id,
            payload=payload or {},
            timestamp=datetime.utcnow(),
        )
