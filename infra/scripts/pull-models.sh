#!/usr/bin/env bash
set -euo pipefail

OLLAMA_HOST="${OLLAMA_URL:-http://localhost:11434}"

echo "Pulling llama3.2 model..."
curl -s "$OLLAMA_HOST/api/pull" -d '{"name": "llama3.2"}' | while read -r line; do
  status=$(echo "$line" | grep -o '"status":"[^"]*"' | head -1)
  [ -n "$status" ] && echo "$status"
done

echo "Model pull complete."
