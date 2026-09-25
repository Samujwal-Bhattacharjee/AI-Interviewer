# Current Architecture — ADAPTIVE
*Updated: 2026-09-25*

## Status Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| FastAPI backend | ✅ WORKING | Running on port 8000 |
| PostgreSQL | ✅ WORKING | pgserver embedded, port 5432 |
| Groq LLM evaluation | ✅ IMPLEMENTED | `GROQ_API_KEY` required in backend/.env |
| ElevenLabs TTS | ⚠️ PARTIAL | Code ready, `ELEVENLABS_API_KEY` not set → browser TTS fallback |
| Browser STT | ✅ WORKING | Web Speech API (Chrome/Edge), continuous mode |
| Adaptive engine | ✅ WORKING | Binary-search difficulty adjustment per answer |
| Answer evaluation | ✅ WORKING | Groq primary, semantic fallback |
| Skill estimation | ✅ WORKING | PostgreSQL-persisted, updated per answer |
| Session persistence | ✅ WORKING | Full recovery on server restart |
| Report generation | ✅ WORKING | From persisted session data |
| Course recommendations | ✅ IMPLEMENTED | Curated catalog, gap-derived |
| Targeted reassessment | ✅ IMPLEMENTED | From report → pre-fills focus competencies |
| WebSocket events | ✅ WORKING | session_ws.py handles events |
| GraphitiService | ⚠️ STUB | Non-blocking; needs Neo4j creds |
| Frontend API mode | ✅ WORKING | VITE_DATA_MODE=api |
| Mock fallback | ✅ CONTROLLED | DATA_MODE=mock only when explicitly set |

## Voice Loop State Machine

```
IDLE
  ↓ startSession()
SPEAKING  ← ElevenLabs (backend /api/voice/tts) OR browser SpeechSynthesis fallback
  ↓ audio.onended
LISTENING ← Web Speech API (browser SpeechRecognition)
  ↓ stopListening()
TRANSCRIBING ← 400ms flush wait
  ↓ transcript ready
EVALUATING ← POST /api/sessions/{id}/answers → Groq or semantic
  ↓ result
SPEAKING  ← next question
  ...
COMPLETE  ← when currentIndex >= totalQuestions
```

## Backend Pipeline (submit_answer)

```
POST /api/sessions/{id}/answers
  → AnswerEvaluator.evaluate()
      → Groq llama-3.3-70b-versatile (if GROQ_API_KEY set)
      → Semantic keyword fallback
  → QuestionAttempt stored
  → AnswerEvidence stored
  → SkillEstimator.update_estimate()
  → AdaptiveEngine.update_state()
  → session.current_question_index++
  → if index >= question_count: session.status = "completed"
  → return SubmitAnswerResponse
```

## Report Pipeline

```
GET /api/sessions/{id}/report
  → SkillEstimate (from PostgreSQL)
  → RoleCompetency targets (from PostgreSQL)
  → Gap analysis (current - target)
  → Evidence (from QuestionAttempt + AnswerEvidence)
  → CourseRecommendationService (curated catalog, gap-derived)
  → AssessmentReportSchema (with resources)
```

## Required Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/aiinterviewer
GROQ_API_KEY=gsk_...          # Required for LLM evaluation
GROQ_MODEL=llama-3.3-70b-versatile
ELEVENLABS_API_KEY=sk_...     # Optional — fallback to browser TTS
ELEVENLABS_VOICE_ID=          # Optional — uses Rachel voice by default
```

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_DATA_MODE=api
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/services/answer_evaluator.py` | Groq + semantic evaluation |
| `backend/app/services/adaptive_engine.py` | Question selection + difficulty adjustment |
| `backend/app/services/skill_estimator.py` | Score updates per answer |
| `backend/app/services/voice_service.py` | ElevenLabs TTS streaming |
| `backend/app/services/course_recommendation_service.py` | Curated course catalog |
| `backend/app/routers/sessions.py` | Core interview API |
| `backend/app/routers/voice.py` | TTS endpoint |
| `src/hooks/useInterview.ts` | Frontend state machine |
| `src/services/voiceService.ts` | Frontend TTS (ElevenLabs + browser fallback) |
| `src/features/report/ReportPage.tsx` | Report + resources + reassessment |
| `src/features/assessment/AssessmentPage.tsx` | Session creation + reassessment entry |

## What Needs API Keys to Fully Activate

1. **`GROQ_API_KEY`** — enables real LLM-based answer evaluation (without it: semantic fallback is used)
2. **`ELEVENLABS_API_KEY`** — enables AI voice TTS (without it: browser SpeechSynthesis used)
