#!/bin/bash
# Update SESSION_KEY in .env file from claude.ai browser cookie

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${1:-$PROJECT_DIR/.env}"

echo "=== Claude Session Key Update ==="
echo ""
echo "To get your session key:"
echo "1. Open https://claude.ai in your browser"
echo "2. Open DevTools (F12 or Cmd+Option+I)"
echo "3. Go to Application → Cookies → https://claude.ai"
echo "4. Find 'sessionKey' and copy its value"
echo ""
read -p "Paste your session key (sk-ant-sid01-...): " SESSION_KEY

if [ -z "$SESSION_KEY" ]; then
  echo "Error: No session key provided"
  exit 1
fi

if [[ ! "$SESSION_KEY" =~ ^sk-ant-sid ]]; then
  echo "Warning: Session key doesn't start with 'sk-ant-sid', are you sure it's correct?"
  read -p "Continue anyway? (y/N): " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Update or create .env file
if [ -f "$ENV_FILE" ]; then
  if grep -q "^SESSION_KEY=" "$ENV_FILE"; then
    sed -i '' "s|^SESSION_KEY=.*|SESSION_KEY=$SESSION_KEY|" "$ENV_FILE"
    echo "Updated SESSION_KEY in $ENV_FILE"
  else
    echo "SESSION_KEY=$SESSION_KEY" >> "$ENV_FILE"
    echo "Added SESSION_KEY to $ENV_FILE"
  fi
else
  echo "SESSION_KEY=$SESSION_KEY" > "$ENV_FILE"
  echo "Created $ENV_FILE with SESSION_KEY"
fi

echo ""
echo "Done! You can now run the service with:"
echo "  docker run --rm -p 3000:3000 --env-file .env cc-session-keepalive:local"
