# Agentic Tutor

An AI-powered personalised tutoring system. Built as my BSc Final Year Project at the University of London.

Students complete a quick onboarding (learning style, interests, etc), then create learning goals on any topic. The system generates a full adaptive curriculum with text lessons, audio narration, animated video explainers, and quizzes - all personalised to who they are.

## Generated Example

The system is able to generate multi-media (text, audio, video) learning content for students, an example is the animated explainer video below explaining Newton's Laws of Motion:

https://github.com/user-attachments/assets/1973c64b-a115-4c8c-ace0-6833f8957791


## Prerequisites

- Node.js 22+
- pnpm
- Python 3.11+
- Docker & Docker Compose
- Ollama (https://ollama.com)

## Getting Started

First time setup (installs dependencies, pulls LLM model, sets up TTS, starts Docker):

```bash
pnpm setup
```

Then to run everything:

```bash
pnpm start
```

That's it. The setup script handles env files, dependencies, Ollama, Chatterbox TTS, and Docker containers. `pnpm start` boots all services and opens the app.

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- AI Service: http://localhost:8000

To stop, hit Ctrl+C in the terminal (stops TTS + Docker).

## Other Commands

```bash
pnpm dev:infra      # start just the infra (postgres, redis, manim)
pnpm dev:backend    # start backend in dev mode
pnpm dev:frontend   # start frontend in dev mode
pnpm dev:ai         # start AI service in dev mode
pnpm start:tts      # start Chatterbox TTS separately
pnpm pull-models    # pull the Ollama model
```

## Project Structure

```
apps/
  backend/     - NestJS API (TypeScript)
  frontend/    - React + Vite + Tailwind
  ai-service/  - FastAPI (Python) - LLM, TTS, video generation, knowledge tracing
```

The backend is the main API that the frontend talks to. The AI service handles all the heavy computation (LLM calls, TTS, Manim video rendering, BKT knowledge tracing) and is called internally by the backend.

## Notes

- Manim always runs in Docker even in dev mode because the native dependencies are a pain to install
- Chatterbox TTS runs natively on the host (not in Docker) - it needs GPU access for decent speed
- Ollama also runs natively - the setup script pulls llama3.2 automatically
- For better video generation, set `VIDEO_LLM_BASE_URL` and `VIDEO_LLM_API_KEY` in your env to point at a cloud model (Gemini, OpenAI, etc). Ollama works but the videos come out noticeably worse
