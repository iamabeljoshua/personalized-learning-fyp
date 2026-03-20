# CLAUDE.md — Agentic Tutor Project Brief

Read this entire file before writing any code. This is the architectural contract for the project.

---

## What We Are Building

A deeply personalised AI-powered agentic tutor system. Students first complete a one-time onboarding that captures who they are — learning style, pace, prior knowledge level, interests, and personal context (e.g. a football fan). This profile is permanent and applies to everything they learn.

After onboarding, students create **Learning Goals**. A learning goal is a topic the student wants to learn, with an optional source document upload for RAG grounding. Each learning goal gets its own independently generated adaptive curriculum, content system, quiz history, and progress tracker — all personalised using the student's profile. A student can have multiple active learning goals at the same time.

The system generates a structured learning outline per goal, text content per lesson written in the student's voice, audio narration, Manim-animated video explainers, and MCQ quizzes. A Bayesian Knowledge Tracing (BKT) engine continuously assesses understanding per goal and triggers outline adaptation when confidence drops below defined thresholds.

This is a BSc Final Year Project at the University of London. The goal is a working, demonstrable system.

---

## Monorepo Structure

```
agentic-tutor/
├── package.json              # root — convenience scripts only, NOT a pnpm workspace
├── CLAUDE.md
├── .env                      # single env file shared by all services
├── .env.example
├── docker-compose.yml        # full stack (all services)
├── docker-compose.dev.yml    # dev mode (infra only: postgres, redis, ollama, manim)
│
├── apps/
│   ├── backend/              # NestJS + TypeScript
│   ├── frontend/             # React + Vite + TailwindCSS
│   └── ai-service/           # Python + FastAPI
│
└── infra/
    └── scripts/
        ├── pull-models.sh    # ollama pull llama3.2
        └── seed.ts           # seeds a test student + pre-generated module
```

### Key rules
- `backend` and `frontend` are independent JS projects — each has its own `package.json` and `node_modules`
- `ai-service` is a completely independent Python project with its own `.venv` — pnpm does not touch it
- Root `package.json` contains only convenience run scripts — no workspaces, no shared packages
- pnpm is the JS package manager

---

## How to Run

### Local dev (use this while building — fastest iteration)
```bash
# Terminal 1 — infrastructure only
docker compose -f docker-compose.dev.yml up

# Terminal 2 — NestJS backend
cd apps/backend && pnpm dev

# Terminal 3 — Python AI service
cd apps/ai-service
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 4 — React frontend
cd apps/frontend && pnpm dev
```

Manim always runs inside Docker even in dev mode because its native dependencies (Cairo, LaTeX, FFmpeg) are painful to install. The Python service calls `docker exec` into the Manim container to render scenes.

### Full Docker (demo mode)
```bash
docker compose up --build
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Main API | NestJS + TypeScript |
| Database ORM | TypeORM |
| Database | PostgreSQL + pgvector extension |
| Cache + Async Queues | Redis + BullMQ |
| File handling | NestJS Multer (uploads), local filesystem (media) |
| AI Agent framework | LangGraph (Python) |
| LLM | Ollama + LLaMA 3.2 (primary), OpenAI (fallback) |
| TTS | OpenAI TTS API (primary), browser Speech API stub (fallback) |
| Embeddings | sentence-transformers (local, Python) |
| Video generation | Manim Community Edition (Docker subprocess) |
| Knowledge Tracing | Custom BKT — Bayesian Knowledge Tracing (Python) |
| Frontend | React + Vite + TailwindCSS |
| Containerisation | Docker + Docker Compose |

---

## Service Responsibilities

### `apps/backend` — NestJS (TypeScript)
This is the BFF (Backend for Frontend). The frontend only ever talks to this.

Responsibilities:
- All REST API endpoints
- Session-based authentication — student identity is always resolved from the session, never from URL params
- PostgreSQL via TypeORM (all DB reads and writes happen here)
- Redis cache + BullMQ job queues for async content generation
- File uploads (source documents for learning goals) and media file serving
- HTTP client that calls the Python AI service when AI computation is needed
- Business logic: quiz scoring, KT threshold checks, outline version management, learning goal lifecycle

### `apps/ai-service` — FastAPI (Python)
Purely computational. No direct DB access. No file serving. Receives requests from NestJS and returns results as JSON.

Responsibilities:
- Pipeline orchestrator — coordinates all processors in sequence
- LLM calls via Ollama or OpenAI (through the LLMProvider adapter)
- TTS audio generation (through the TTSProvider adapter)
- Manim scene code generation + subprocess rendering
- BKT knowledge tracing computation (pure math, no LLM)
- RAG: document chunking, local embedding, pgvector retrieval
- AdaptationGraph — the one LangGraph component, handles curriculum adaptation loop

### `apps/frontend` — React + Vite
Student-facing UI. Talks exclusively to NestJS. Never calls the Python service directly.

---

## AI Service — Pipeline Architecture

The Python service uses a **pipeline orchestrator pattern**, not a full agent framework. Most of what happens is deterministic and sequential — known inputs, known outputs, no dynamic tool selection needed. Wrapping plain function calls in an agent framework adds complexity without value.

The one genuine exception is the adaptation loop, which requires inspecting state, reasoning about what to regenerate, and potentially cycling — that's where **LangGraph is used, scoped only to adaptation**.

### Processors (plain Python classes, no framework)

| Processor | What it does |
|---|---|
| `ProfileProcessor` | Takes onboarding form data → builds and returns a structured `StudentContext` object |
| `CurriculumProcessor` | Takes goal topic + StudentContext → calls LLM → returns outline JSON. Queries RAG if source doc exists |
| `ContentProcessor` | Takes outline node + StudentContext → generates text via LLM, triggers TTS, triggers Manim |
| `AssessmentProcessor` | Takes concept + StudentContext → calls LLM → returns MCQ question set |
| `BKTProcessor` | Takes quiz attempt + current KT state → runs Bayesian update → returns new state. Pure math, no LLM |

### AdaptationGraph (LangGraph — the only graph in the system)

This is the one genuinely agentic component because the execution path is not predetermined:

1. Inspect the current outline and failing concept nodes
2. Reason about how many forward nodes need regeneration
3. Call CurriculumProcessor with modified context
4. Verify new nodes are coherent in sequence
5. Loop back to step 3 if the result isn't good enough

That cycle with conditional branching and state is what LangGraph is for. Everything else is just a function call.

### Orchestrator

```python
class TutorPipeline:
    def generate_outline(self, goal, student_context): ...
    def generate_content(self, node, student_context): ...
    def process_quiz_result(self, attempt, kt_state):
        updated_kt = self.bkt.update(kt_state, attempt)
        if updated_kt.p_known < 0.40:
            return self.adaptation_graph.run(...)  # LangGraph kicks in here
        return updated_kt
```

### Student context injection
At every generation call the full `StudentContext` is injected into the LLM prompt — interests, learning style, vocabulary level, pace. A football fan learning physics gets football analogies throughout. This is what makes content personalised.

### Adaptation rules
- KT confidence < 40% → triggers AdaptationGraph
- KT confidence < 30% → triggers concept-level regeneration within the graph
- Adaptation is always forward-only — completed content is never touched
- Previous outline versions are preserved so students can roll back
- Adaptations happen silently — no notification to the student

---

## Content Generation Flow

```
Curriculum Agent generates outline
  → NestJS stores outline + creates ContentItems with status "pending"
  → NestJS pushes content generation jobs to BullMQ queue
      → Content Agent generates text (LLM + student context + RAG if available)
      → Content Agent triggers TTS → audio file saved to media storage
      → Content Agent generates Manim scene code → renders via Docker subprocess → video saved
  → NestJS updates ContentItem status to "ready"
  → Frontend polls /content/:nodeId/status until ready
```

If Manim rendering fails, the system falls back gracefully to text + audio only. The student is never blocked.

---

## Knowledge Tracing — BKT

Standard four-parameter Bayesian Knowledge Tracing, tracked per concept node per student:
- `p_known` — prior probability student knows the concept
- `p_learn` — probability of learning after one opportunity
- `p_guess` — probability of correct answer without knowledge
- `p_slip` — probability of wrong answer despite knowledge

Updated after every quiz attempt. Computation happens in Python. State persisted in PostgreSQL by NestJS after receiving updated values from the AI service.

---

## RAG Pipeline

Source documents are attached to a **learning goal**, not to the student globally. When creating a learning goal, the student can optionally upload a PDF, notes, or syllabus for that specific topic. If present it becomes the ground truth for content generation for that goal only.

Flow: student creates learning goal + uploads doc → NestJS stores file linked to that goal → calls Python to embed → Python chunks + embeds with sentence-transformers → stores vectors in pgvector tagged with the goal ID → at generation time Curriculum and Content agents retrieve relevant chunks for that goal → prepend to LLM prompt as context.

The system works without an uploaded document — this is fully optional.

---

## API Surface (NestJS — high level)

The student identity is **always resolved from the authenticated session** on the backend. Student IDs never appear in URLs. All endpoints are implicitly scoped to the logged-in student.

```
# Auth
POST   /auth/register              register new student account
POST   /auth/login                 login, establish session
POST   /auth/logout                destroy session
GET    /auth/me                    get current session student

# Onboarding (one-time, separate from learning goals)
POST   /students/onboard           save student profile (learning style, pace, interests, etc.)
GET    /students/profile           get current student's profile
PATCH  /students/profile           update profile

# Learning Goals (students can have many)
GET    /goals                      list all learning goals for current student
POST   /goals                      create a new learning goal (topic + optional source doc upload)
GET    /goals/:goalId              get a specific learning goal + its active outline
DELETE /goals/:goalId              remove a learning goal

# Outlines (scoped to a learning goal)
GET    /goals/:goalId/outline              get active outline for this goal
GET    /goals/:goalId/outline/versions     list all versions
POST   /goals/:goalId/outline/rollback    switch active version

# Content (scoped to an outline node)
GET    /content/:nodeId            get content item (text, audio url, video url, status)
GET    /content/:nodeId/status     poll for generation status

# Quizzes
GET    /quizzes/:nodeId            get quiz for a concept node
POST   /quizzes/:nodeId/attempt    submit answers, get score, trigger KT update

# Progress (scoped to a learning goal)
GET    /goals/:goalId/progress     KT states + completion summary for this goal

# Source documents (attached to a learning goal)
POST   /goals/:goalId/documents    upload source document, trigger embedding
```

---

## Docker Services

```
postgres    — pgvector/pgvector:pg16
redis       — redis:alpine
ollama      — ollama/ollama  (pull-models.sh pulls llama3.2 on startup)
manim       — manimcommunity/manim:stable  (ai-service calls docker exec to render)
ai-service  — Python FastAPI on port 8000
backend     — NestJS on port 3000
frontend    — Vite dev server on port 5173
```

In `docker-compose.dev.yml` only postgres, redis, ollama, and manim run in Docker. The three app services run natively for hot reload.

---

## Environment Variables

Single `.env` at project root:

```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agentic_tutor
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=agentic_tutor

# Redis
REDIS_URL=redis://localhost:6379

# AI Service
AI_SERVICE_URL=http://localhost:8000
OLLAMA_URL=http://ollama:11434
OPENAI_API_KEY=                    # optional fallback

# Manim
MANIM_CONTAINER_NAME=manim

# Storage
MEDIA_STORAGE_PATH=./media
STORAGE_PROVIDER=local             # "local" | "s3" | "cloudinary"

# App
FRONTEND_URL=http://localhost:5173
PORT=3000
```

---

## Frontend Pages (keep simple)

| Page | Route | Purpose |
|---|---|---|
| Register / Login | `/auth` | Account creation and login |
| Onboarding | `/onboard` | One-time profile setup: learning style, pace, interests, prior knowledge. Redirects to dashboard on complete |
| Dashboard | `/` | Lists all learning goals. Button to create a new goal |
| New Learning Goal | `/goals/new` | Enter topic, optional source doc upload. Triggers outline generation |
| Outline Viewer | `/goals/:goalId` | Tree view of curriculum for this goal. Node status indicators. Version switcher |
| Content Player | `/learn/:nodeId` | Tabs: Text, Audio, Video. Polls until content ready. Quiz button at bottom |
| Quiz | `/quiz/:nodeId` | MCQ one at a time. Score summary. Triggers KT update |
| Progress | `/goals/:goalId/progress` | KT states + completion for this specific goal |

No Nginx — Vite dev server is fine even for the demo.

---

## Build Order

Build strictly in this sequence — each phase unblocks the next:

1. Infrastructure — docker-compose files, env files, folder scaffolding with empty READMEs
2. TypeORM entities and DB connection for all core tables
3. NestJS skeleton — all modules scaffolded, TypeORM wired, session auth wired, no business logic yet
4. FastAPI skeleton — stub endpoints returning mock JSON so NestJS can wire up immediately
5. Auth module — register, login, logout, session middleware, `getCurrentStudent()` guard used by all protected routes
6. Onboarding module — one-time student profile creation and retrieval
7. Learning Goals module — CRUD for goals, source document upload per goal
8. LLM Provider adapter — abstract class, Ollama + OpenAI implementations, config-driven
9. ProfileProcessor — builds StudentContext from onboarding profile, fed into all downstream prompts
10. CurriculumProcessor — outline generation from goal topic + StudentContext
11. BKTProcessor — pure Bayesian computation, no LLM involved
12. AssessmentProcessor — MCQ generation per concept node
13. ContentProcessor (text) — lesson prose generation with StudentContext injection
14. TTS Provider — audio generation, save to media path
15. Manim Runner — LLM generates scene code, subprocess renders via Docker exec
16. RAG Pipeline — chunk + embed goal source doc, retrieve at generation time
17. AdaptationGraph (LangGraph) — triggered by KT thresholds, forward-only outline regeneration with verify loop
18. TutorPipeline orchestrator — wires all processors together, exposes clean methods to FastAPI endpoints
19. NestJS business logic — wire all controllers to real services and AI HTTP client
20. BullMQ queues — async content generation workers
21. Frontend — all pages connected to NestJS API, session-aware routing
22. End-to-end integration — run the full student journey, fix wiring bugs
23. Seed script — pre-generated demo student + learning goal so examiner sees a working product immediately
24. Full Docker build — docker compose up --build running cleanly

---

## Important Constraints

- **Session-based auth**: NestJS acts as a BFF — student identity is always resolved server-side from the session. Never pass studentId in URL params or request bodies for protected routes. Use a `getCurrentStudent()` guard/decorator to extract the student from session context
- **Onboarding is separate from learning goals**: a student completes onboarding once to build their profile. They then create learning goals independently. The profile feeds into every goal but is managed separately
- **Learning goals are the unit of learning**: each goal has its own outline, content, quizzes, KT states, and progress. One student, many goals, fully isolated per goal
- **Pipeline, not agents**: the Python service uses plain processor classes for all deterministic steps. LangGraph is used only for the AdaptationGraph — the one component with genuine conditional looping. Do not reach for LangGraph elsewhere
- **Offline-first**: default to Ollama + local embeddings + local file storage. Cloud APIs are fallbacks via env config
- **Python service is stateless**: no direct DB access. All persistence goes through NestJS. Python receives everything it needs in the request payload
- **TypeORM** for all ORM work in NestJS — not Prisma
- **Graceful degradation**: Manim fails → serve text + audio. TTS fails → serve text only. Never block the student
- **No shared packages** between services — duplicate types where needed, keep it simple
- **Frontend is simple** — no Nginx, Vite dev server is sufficient for demo
