#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TTS_DIR="$(cd "$SCRIPT_DIR/../chatterbox-tts" && pwd)"

cd "$TTS_DIR"

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating Python venv for Chatterbox TTS..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi

echo "Starting Chatterbox TTS server on http://localhost:8004..."
python3 server.py
