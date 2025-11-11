#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PERSONAS=(${PERSONAS:-loewith gehlen kant plessner marx})

if [[ ${#PERSONAS[@]} -eq 0 ]]; then
  echo "ERROR: Keine Personas definiert (env PERSONAS leer?)." >&2
  exit 1
fi

for persona in "${PERSONAS[@]}"; do
  echo "==== Packaging ${persona} ===="
  "${SCRIPT_DIR}/package_persona.sh" "${persona}"
done
