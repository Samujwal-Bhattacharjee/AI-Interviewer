# API Contract — Phase 2

> OpenAPI-compatible request/response schemas for the FastAPI backend.
> Frontend must never deviate from these schemas.
> FastAPI exposes this at: GET /docs (Swagger) and GET /redoc

---

## Base URLs

```
HTTP:      http://localhost:8000
WebSocket: ws://localhost:8000
```

Frontend env vars:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_DATA_MODE=mock | api
```

---

## Shared Types

```typescript
type Difficulty = "foundational" | "easy" | "medium" | "hard" | "expert";
type QuestionType = "conceptual" | "analytical" | "applied" | "behavioral" | "technical";
type AssessmentStatus = "pending" | "active" | "completed" | "abandoned";
type AssessmentDuration = "quick" | "standard" | "deep";
type RoleLevel = "beginner" | "junior" | "intermediate" | "senior";
type ConfidenceLevel = "low" | "medium" | "high";
type TrendDirection = "up" | "down" | "stable";
type EstimatedLevel = "novice" | "foundational" | "developing" | "proficient" | "advanced" | "expert";
type Importance = "critical" | "high" | "medium" | "low";
type Priority = "critical" | "high" | "medium" | "low";
```

---

## ROLES

### GET /api/roles

Returns all available target roles.

**Response 200:**
```json
[
  {
    "id": "role-001",
    "title": "Junior Software Engineer",
    "level": "junior",
    "description": "...",
    "technologies": ["Python", "JavaScript", "SQL"],
    "responsibilities": ["..."],
    "requirements": [
      {
        "competency_id": "comp-debugging",
        "target_level": 74,
        "importance": "critical"
      }
    ],
    "competencies": [
      {
        "id": "comp-debugging",
        "name": "Debugging",
        "category": "Engineering Practice",
        "description": "...",
        "subskills": ["Execution Tracing", "Edge Cases"]
      }
    ]
  }
]
```

---

### GET /api/roles/{role_id}

Returns a single role with full competency model.

**Path params:** `role_id: string`

**Response 200:** Same shape as single item above.

**Response 404:**
```json
{ "detail": "Role not found" }
```

---

### GET /api/roles/{role_id}/blueprint

Returns the assessment blueprint for a role (question areas, difficulty ranges).

**Path params:** `role_id: string`

**Response 200:**
```json
{
  "role_id": "role-001",
  "competency_areas": [
    {
      "competency_id": "comp-debugging",
      "concepts": ["race conditions", "execution tracing"],
      "question_areas": ["applied debugging", "systematic diagnosis"],
      "difficulty_range": { "min": 40, "max": 85 }
    }
  ],
  "estimated_questions": 10,
  "focus_areas": ["Debugging", "DSA", "Python"]
}
```

---

## ASSESSMENT SESSIONS

### POST /api/sessions

Creates a new assessment session.

**Request body:**
```json
{
  "user_id": "user-001",
  "target_role_id": "role-001",
  "level": "junior",
  "focus_competencies": ["comp-debugging", "comp-dsa"],
  "duration": "standard"
}
```

**Response 201:**
```json
{
  "id": "session-abc123",
  "user_id": "user-001",
  "target_role_id": "role-001",
  "started_at": "2026-09-25T10:30:00Z",
  "completed_at": null,
  "status": "pending",
  "question_count": 10,
  "current_question_index": 0,
  "focus_competencies": ["comp-debugging", "comp-dsa"],
  "duration": "standard"
}
```

---

### GET /api/sessions/{session_id}

Returns current session state.

**Response 200:**
```json
{
  "id": "session-abc123",
  "user_id": "user-001",
  "target_role_id": "role-001",
  "started_at": "2026-09-25T10:30:00Z",
  "completed_at": null,
  "status": "active",
  "question_count": 10,
  "current_question_index": 3,
  "focus_competencies": ["comp-debugging", "comp-dsa"],
  "duration": "standard"
}
```

---

### POST /api/sessions/{session_id}/start

Activates the session and returns the first question.

**Response 200:**
```json
{
  "session": { ... },
  "first_question": { ... },
  "adaptive_state": { ... }
}
```
(first_question and adaptive_state match the schemas below)

---

## INTERVIEW

### POST /api/sessions/{session_id}/next-question

Selects the next adaptive question. The backend owns all selection logic.

**Request body:** (empty — backend selects based on current state)
```json
{}
```

**Response 200:**
```json
{
  "question_id": "q-014",
  "competency": {
    "id": "comp-debugging",
    "name": "Debugging"
  },
  "difficulty": "hard",
  "question_type": "applied",
  "question": "You have a service that works correctly under low load but fails unpredictably under high concurrency...",
  "expected_concepts": ["race conditions", "shared state", "locking"],
  "follow_up_prompts": ["What tools would you use?"],
  "question_number": 4,
  "total_questions": 10
}
```

**Response 404:** Session not found.
**Response 409:** Session already complete.

---

### POST /api/sessions/{session_id}/answers

Submits a candidate's answer for evaluation.

**Request body:**
```json
{
  "question_id": "q-014",
  "transcript": "The issue is likely a race condition where multiple threads are accessing shared state...",
  "duration_ms": 18200
}
```

**Response 200:**
```json
{
  "attempt_id": "attempt-xyz",
  "question_id": "q-014",
  "correctness": 0.74,
  "evidence": [
    {
      "concept": "race conditions",
      "status": "demonstrated",
      "explanation": "Candidate correctly identified shared state as root cause",
      "confidence": 0.88
    },
    {
      "concept": "locking mechanisms",
      "status": "partial",
      "explanation": "Mentioned locks but did not specify mechanism",
      "confidence": 0.65
    },
    {
      "concept": "deadlocks",
      "status": "missing",
      "explanation": "Did not consider deadlock scenario",
      "confidence": 0.91
    }
  ],
  "updated_skill_estimates": [
    {
      "competency_id": "comp-debugging",
      "score": 52,
      "confidence": 0.78,
      "evidence_count": 9,
      "estimated_level": "developing",
      "trend": "up",
      "updated_at": "2026-09-25T10:45:00Z"
    }
  ],
  "adaptive_state": {
    "current_difficulty": "hard",
    "search_region": { "lower": "medium", "upper": "hard" },
    "last_action": "increase",
    "evidence_analyzed": true,
    "current_estimate": 52
  }
}
```

---

### GET /api/sessions/{session_id}/current-state

Returns the current interview state (for reconnection/refresh).

**Response 200:**
```json
{
  "session_id": "session-abc123",
  "status": "active",
  "current_question_index": 3,
  "total_questions": 10,
  "adaptive_state": {
    "current_difficulty": "hard",
    "search_region": { "lower": "medium", "upper": "hard" },
    "last_action": "increase",
    "evidence_analyzed": true,
    "current_estimate": 52
  },
  "skill_estimates": [
    {
      "competency_id": "comp-debugging",
      "score": 52,
      "confidence": 0.78,
      "evidence_count": 9,
      "estimated_level": "developing",
      "trend": "up",
      "updated_at": "2026-09-25T10:45:00Z"
    }
  ]
}
```

---

## SKILLS

### GET /api/users/{user_id}/skills

Returns all skill estimates for a user.

**Response 200:**
```json
[
  {
    "competency_id": "comp-debugging",
    "score": 46,
    "estimated_level": "developing",
    "confidence": 0.71,
    "confidence_level": "medium",
    "evidence_count": 4,
    "trend": "up",
    "updated_at": "2026-09-25T10:30:00Z"
  }
]
```

---

### GET /api/users/{user_id}/skills/{competency_id}

Returns a single skill estimate.

**Response 200:** Single `SkillEstimate` object (same shape as above).

---

### GET /api/users/{user_id}/skills/history

Returns temporal history for all skills.

**Response 200:**
```json
[
  {
    "competency_id": "comp-debugging",
    "history": [
      {
        "session_id": "session-001",
        "score": 38,
        "timestamp": "2026-07-01T10:00:00Z",
        "evidence_count": 2
      },
      {
        "session_id": "session-002",
        "score": 44,
        "timestamp": "2026-08-05T10:00:00Z",
        "evidence_count": 3
      }
    ]
  }
]
```

---

### GET /api/users/{user_id}/gaps?role_id={role_id}

Returns gap analysis between user's current skills and role requirements.

**Response 200:**
```json
[
  {
    "competency_id": "comp-debugging",
    "competency_name": "Debugging",
    "current_score": 46,
    "target_score": 74,
    "gap": -28,
    "priority": "critical"
  }
]
```

---

### GET /api/users/{user_id}/stats

Returns user summary stats.

**Response 200:**
```json
{
  "user_id": "user-001",
  "sessions_completed": 3,
  "target_role_id": "role-001",
  "target_role_title": "Junior Software Engineer",
  "last_session_at": "2026-09-25T10:30:00Z"
}
```

---

## REPORT

### GET /api/sessions/{session_id}/report

Returns the full assessment report for a completed session.

**Response 200:**
```json
{
  "session_id": "session-abc123",
  "completed_at": "2026-09-25T11:00:00Z",
  "target_role_id": "role-001",
  "overall_score": 61,
  "summary": "The candidate demonstrated strong DSA fundamentals but shows significant gaps in Debugging, particularly around concurrency issues.",
  "skill_estimates": [
    {
      "competency_id": "comp-debugging",
      "score": 46,
      "confidence": 0.71,
      "estimated_level": "developing",
      "trend": "up"
    }
  ],
  "gaps": [
    {
      "competency_id": "comp-debugging",
      "competency_name": "Debugging",
      "current_score": 46,
      "target_score": 74,
      "gap": -28,
      "priority": "critical"
    }
  ],
  "evidence": [
    {
      "question_id": "q-005",
      "competency_id": "comp-debugging",
      "concept": "race conditions",
      "status": "demonstrated",
      "explanation": "Correctly identified shared state issue",
      "confidence": 0.88
    }
  ],
  "recommendations": [
    "Practice concurrency debugging exercises focusing on race condition identification",
    "Review locking mechanisms and synchronization primitives"
  ]
}
```

**Response 404:** Session not found.
**Response 409:** Session not yet complete.

---

## IMPROVEMENT PLAN

### GET /api/users/{user_id}/plan

Returns the personalized improvement plan.

**Response 200:**
```json
{
  "user_id": "user-001",
  "generated_at": "2026-09-25T11:00:00Z",
  "focus_competencies": ["comp-debugging", "comp-system-design"],
  "estimated_improvement": 22,
  "tasks": [
    {
      "id": "task-001",
      "competency_id": "comp-debugging",
      "title": "Execution Tracing Exercises",
      "description": "Practice systematically tracing code execution...",
      "observed_weakness": "Execution tracing",
      "estimated_time": "3 hours",
      "priority": "high",
      "completed": false,
      "success_criteria": [
        "Trace through 3 multi-threaded programs without assistance"
      ]
    }
  ]
}
```

---

## REASSESSMENT

### POST /api/reassess

Starts a targeted reassessment session focused on weak competencies.

**Request body:**
```json
{
  "user_id": "user-001",
  "target_role_id": "role-001",
  "focus_competencies": ["comp-debugging", "comp-system-design"],
  "duration": "quick"
}
```

**Response 201:**
```json
{
  "session_id": "session-reassess-xyz",
  "focus_competencies": ["comp-debugging", "comp-system-design"],
  "question_count": 5,
  "status": "pending"
}
```

---

## WEBSOCKET

### WS /ws/sessions/{session_id}

Real-time interview event stream.

**Connection:**
```javascript
const ws = new WebSocket(`${WS_BASE_URL}/ws/sessions/${sessionId}`);
```

**Events from server to client:**

```typescript
// Session started
{
  "type": "session.started",
  "session_id": "session-abc123",
  "payload": { "question_count": 10 },
  "timestamp": "2026-09-25T10:30:00Z"
}

// Question started (new question ready)
{
  "type": "question.started",
  "session_id": "session-abc123",
  "payload": {
    "question_id": "q-014",
    "competency": { "id": "comp-debugging", "name": "Debugging" },
    "difficulty": "hard",
    "question": "...",
    "question_number": 4,
    "total_questions": 10
  },
  "timestamp": "..."
}

// Audio state changes
{
  "type": "audio.listening",
  "session_id": "session-abc123",
  "payload": {},
  "timestamp": "..."
}

{
  "type": "audio.transcribing",
  "session_id": "session-abc123",
  "payload": { "partial_transcript": "The system uses..." },
  "timestamp": "..."
}

// Answer received
{
  "type": "answer.received",
  "session_id": "session-abc123",
  "payload": { "transcript": "...", "duration_ms": 18200 },
  "timestamp": "..."
}

// Evaluation underway
{
  "type": "answer.evaluating",
  "session_id": "session-abc123",
  "payload": {},
  "timestamp": "..."
}

// Skill estimate updated
{
  "type": "skill.updated",
  "session_id": "session-abc123",
  "payload": {
    "competency_id": "comp-debugging",
    "score": 52,
    "confidence": 0.78,
    "evidence_count": 9,
    "estimated_level": "developing",
    "trend": "up"
  },
  "timestamp": "..."
}

// Difficulty changed
{
  "type": "difficulty.changed",
  "session_id": "session-abc123",
  "payload": {
    "previous_difficulty": "medium",
    "new_difficulty": "hard",
    "action": "increase",
    "search_region": { "lower": "medium", "upper": "hard" }
  },
  "timestamp": "..."
}

// Interview state changed
{
  "type": "interview.state.changed",
  "session_id": "session-abc123",
  "payload": {
    "adaptive_state": {
      "current_difficulty": "hard",
      "search_region": { "lower": "medium", "upper": "hard" },
      "last_action": "increase",
      "evidence_analyzed": true,
      "current_estimate": 52
    }
  },
  "timestamp": "..."
}

// Question completed
{
  "type": "question.completed",
  "session_id": "session-abc123",
  "payload": { "question_id": "q-014", "correctness": 0.74 },
  "timestamp": "..."
}

// Interview completed
{
  "type": "interview.completed",
  "session_id": "session-abc123",
  "payload": { "overall_score": 61, "report_ready": true },
  "timestamp": "..."
}

// Error
{
  "type": "error",
  "session_id": "session-abc123",
  "payload": {
    "code": "STT_UNAVAILABLE",
    "message": "Speech-to-text service is unavailable"
  },
  "timestamp": "..."
}
```

**Events from client to server:**

```typescript
// Start listening (microphone activated)
{
  "type": "client.listening.start",
  "session_id": "session-abc123"
}

// Stop listening (answer complete)
{
  "type": "client.listening.stop",
  "session_id": "session-abc123"
}

// Audio chunk (for streaming STT)
{
  "type": "client.audio.chunk",
  "session_id": "session-abc123",
  "payload": { "audio_data": "<base64>" }
}
```

---

## Error Response Shape

All HTTP errors follow this format:
```json
{
  "detail": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

Common error codes:
- `SESSION_NOT_FOUND`
- `SESSION_COMPLETE`
- `SESSION_ABANDONED`
- `ROLE_NOT_FOUND`
- `USER_NOT_FOUND`
- `INVALID_ANSWER`
- `SERVICE_UNAVAILABLE`

---

## Frontend Service Interface Contracts

```typescript
// All services must implement these interfaces.
// MockXxxService and ApiXxxService are interchangeable.

interface IRoleService {
  getRoles(): Promise<TargetRole[]>;
  getRole(roleId: string): Promise<TargetRole>;
  getBlueprint(roleId: string): Promise<RoleBlueprint>;
}

interface IAssessmentService {
  createSession(config: AssessmentConfig): Promise<AssessmentSession>;
  getSession(sessionId: string): Promise<AssessmentSession>;
  startSession(sessionId: string): Promise<{ session: AssessmentSession; firstQuestion: InterviewQuestion; adaptiveState: AdaptiveState }>;
  getReport(sessionId: string): Promise<AssessmentReport>;
}

interface IInterviewService {
  getNextQuestion(sessionId: string): Promise<InterviewQuestion>;
  submitAnswer(sessionId: string, answer: AnswerSubmission): Promise<AnswerResult>;
  getCurrentState(sessionId: string): Promise<SessionState>;
}

interface ISkillService {
  getSkillProfile(userId: string): Promise<SkillEstimate[]>;
  getSkillHistory(userId: string): Promise<SkillHistory[]>;
  getGapAnalysis(userId: string, roleId: string): Promise<GapAnalysis[]>;
  getImprovementPlan(userId: string): Promise<ImprovementPlan>;
  getUserStats(userId: string): Promise<UserStats>;
}

interface IVoiceService {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  cancelListening(): void;
  playQuestion(text: string): Promise<void>;
  stopSpeaking(): void;
  readonly status: VoiceState;
  readonly transcript: string;
  readonly audioLevel: number;
  readonly error: string | null;
}
```
