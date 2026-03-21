#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

echo "=== Agentic Tutor — First Time Setup ==="
echo ""

# 1. Check prerequisites
echo "[1/6] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install it first."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose is required. Install it first."; exit 1; }
command -v ollama >/dev/null 2>&1 || { echo "Ollama is required. Install from https://ollama.com"; exit 1; }

# 2. Copy env files if they don't exist
echo "[2/6] Setting up environment files..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || echo "Warning: .env.example not found"
fi
if [ ! -f .env.docker ]; then
  echo "Error: .env.docker not found. Copy from .env.docker.example or create it."
  exit 1
fi
if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env 2>/dev/null || echo "Warning: apps/backend/.env.example not found"
fi

# 3. Start Ollama (native)
echo "[3/6] Starting Ollama..."
if ! pgrep -x "ollama" >/dev/null 2>&1; then
  ollama serve &>/dev/null &
  sleep 2
  echo "  Ollama started."
else
  echo "  Ollama already running."
fi

# 4. Pull LLM model
echo "[4/6] Pulling LLM model (this may take a few minutes on first run)..."
bash "$SCRIPT_DIR/pull-models.sh"

# 5. Start Docker services
echo "[5/6] Starting Docker services..."
docker compose up -d --build

# 6. Wait for services to be healthy
echo "[6/6] Waiting for services to be healthy..."
echo "  Waiting for postgres..."
until docker exec agentic-tutor-postgres-1 pg_isready -U tutor -d agentic_tutor >/dev/null 2>&1; do
  sleep 2
done
echo "  Postgres is ready."

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Services running:"
echo "  Ollama:     http://localhost:11434 (native)"
echo "  Backend:    http://localhost:3000"
echo "  Frontend:   http://localhost:5173"
echo "  AI Service: http://localhost:8000"
echo "  Swagger:    http://localhost:3000/docs"
echo "  Postgres:   localhost:5433"
echo "  Redis:      localhost:6379"
echo ""
echo "To run backend locally (with hot reload):"
echo "  cd apps/backend && pnpm install && pnpm start:dev"
echo ""
echo "To stop everything:"
echo "  docker compose down"
echo "  # Ollama runs separately — stop with: pkill ollama"
