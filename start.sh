#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v python3.11 >/dev/null 2>&1; then
  echo "Python 3.11 is required for the saved scikit-learn model."
  exit 1
fi
if [ ! -d .venv ]; then python3.11 -m venv .venv; fi
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
