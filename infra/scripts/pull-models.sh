#!/usr/bin/env bash
set -euo pipefail

# Pull LLM models into Ollama (running natively on host)
# Usage: ./infra/scripts/pull-models.sh [model_name]
# Default model: llama3.2

MODEL="${1:-llama3.2}"

if ! command -v ollama &>/dev/null; then
  echo "Ollama is not installed. Install from https://ollama.com"
  exit 1
fi

echo "Pulling $MODEL..."
ollama pull "$MODEL"
echo "Done."
