#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TTS_DIR="$ROOT_DIR/infra/chatterbox-tts"

cd "$ROOT_DIR"

echo "=== Agentic Tutor — Starting All Services ==="
echo ""

# 1. Start Docker services (postgres, redis, manim, ai-service, backend, frontend)
echo "[1/4] Starting Docker services..."
docker compose up -d --build
echo "  Docker services started."

# 2. Start Ollama if not running
echo "[2/4] Starting Ollama..."
if ! pgrep -x "ollama" >/dev/null 2>&1; then
  ollama serve &>/dev/null &
  sleep 2
  echo "  Ollama started."
else
  echo "  Ollama already running."
fi

# 3. Pull model if not already pulled
echo "[3/4] Checking LLM model..."
MODEL="${LLM_MODEL:-llama3.2}"
if ollama list 2>/dev/null | grep -q "$MODEL"; then
  echo "  Model $MODEL already available."
else
  echo "  Pulling $MODEL (this may take a few minutes)..."
  ollama pull "$MODEL"
  echo "  Model pulled."
fi

# 4. Start Chatterbox TTS
echo "[4/4] Starting Chatterbox TTS..."
if [ ! -d "$TTS_DIR" ]; then
  echo "  Error: Chatterbox not found. Run 'pnpm setup' first."
  exit 1
fi

cd "$TTS_DIR"
source .venv/bin/activate

# Suppress Chatterbox auto-opening its own UI by neutering webbrowser.open
NOOP_DIR=$(mktemp -d)
cat > "$NOOP_DIR/sitecustomize.py" << 'PYEOF'
import webbrowser as _wb
_wb.open = lambda *a, **kw: None
_wb.open_new = lambda *a, **kw: None
_wb.open_new_tab = lambda *a, **kw: None
PYEOF
export PYTHONPATH="${NOOP_DIR}${PYTHONPATH:+:$PYTHONPATH}"

# Open the frontend instead
if command -v open >/dev/null 2>&1; then
  (sleep 5 && open "http://localhost:5173") &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 5 && xdg-open "http://localhost:5173") &
fi

echo "  TTS server starting on http://localhost:8004..."
echo "  (Press Ctrl+C to stop TTS and all services)"
echo ""
echo "=== All services running ==="
echo "  Frontend:   http://localhost:5173"
echo "  Backend:    http://localhost:3000"
echo "  AI Service: http://localhost:8000"
echo "  Swagger:    http://localhost:3000/docs"
echo "  Ollama:     http://localhost:11434"
echo "  TTS:        http://localhost:8004"
echo ""

# TTS runs in foreground — Ctrl+C stops it, then we clean up
trap 'echo ""; echo "Stopping Docker services..."; cd "$ROOT_DIR"; docker compose down; echo "Done."; exit 0' INT TERM
python3 server.py
