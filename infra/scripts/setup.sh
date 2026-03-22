#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

echo "=== Agentic Tutor — First Time Setup ==="
echo ""

# 1. Check prerequisites
echo "[1/8] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install it first."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose is required. Install it first."; exit 1; }
command -v ollama >/dev/null 2>&1 || { echo "Ollama is required. Install from https://ollama.com"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Install with: npm install -g pnpm"; exit 1; }

# 2. Copy env files if they don't exist
echo "[2/8] Setting up environment files..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || echo "Warning: .env.example not found"
fi
if [ ! -f .env.docker ]; then
  cp .env.docker.example .env.docker 2>/dev/null || echo "Warning: .env.docker.example not found"
fi
if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env 2>/dev/null || echo "Warning: apps/backend/.env.example not found"
fi
if [ ! -f apps/ai-service/.env ]; then
  cp apps/ai-service/.env.example apps/ai-service/.env 2>/dev/null || echo "Warning: apps/ai-service/.env.example not found"
fi

# 3. Install JS dependencies
echo "[3/8] Installing JS dependencies..."
cd "$ROOT_DIR/apps/backend" && pnpm install
cd "$ROOT_DIR/apps/frontend" && pnpm install
cd "$ROOT_DIR"

# 4. Setup AI service Python venv
echo "[4/8] Setting up AI service Python venv..."
AI_DIR="$ROOT_DIR/apps/ai-service"
if [ ! -d "$AI_DIR/.venv" ]; then
  python3 -m venv "$AI_DIR/.venv"
  source "$AI_DIR/.venv/bin/activate"
  pip install -r "$AI_DIR/requirements.txt" -q
  deactivate
  echo "  AI service venv created."
else
  echo "  AI service venv already exists."
fi

# 5. Start Ollama
echo "[5/8] Starting Ollama..."
if ! pgrep -x "ollama" >/dev/null 2>&1; then
  ollama serve &>/dev/null &
  sleep 2
  echo "  Ollama started."
else
  echo "  Ollama already running."
fi

# 6. Pull LLM model
echo "[6/8] Pulling LLM model..."
bash "$SCRIPT_DIR/pull-models.sh"

# 7. Clone and setup Chatterbox TTS
echo "[7/8] Setting up Chatterbox TTS..."
TTS_DIR="$ROOT_DIR/infra/chatterbox-tts"
if [ ! -d "$TTS_DIR" ]; then
  echo "  Cloning Chatterbox TTS server..."
  git clone https://github.com/devnen/Chatterbox-TTS-Server.git "$TTS_DIR"
fi
if [ ! -d "$TTS_DIR/.venv" ]; then
  echo "  Creating Python venv for Chatterbox..."
  python3 -m venv "$TTS_DIR/.venv"
  source "$TTS_DIR/.venv/bin/activate"
  echo "  Installing dependencies (this may take a few minutes)..."
  pip install -r "$TTS_DIR/requirements.txt" -q
  deactivate
else
  echo "  Chatterbox venv already exists."
fi

# 8. Start Docker services
echo "[8/8] Starting Docker services..."
docker compose up -d --build

echo "  Waiting for postgres..."
until docker exec agentic-tutor-postgres-1 pg_isready -U tutor -d agentic_tutor >/dev/null 2>&1; do
  sleep 2
done
echo "  Postgres is ready."

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To start everything:  pnpm start"
echo "To stop everything:   docker compose down && pkill ollama"
echo ""
