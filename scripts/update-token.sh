#!/bin/bash
# Extract Claude Code OAuth token from macOS Keychain and update .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${1:-$PROJECT_DIR/.env}"

echo "Extracting token from macOS Keychain..."

CREDENTIALS=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null)

if [ -z "$CREDENTIALS" ]; then
  echo "Error: Could not find Claude Code credentials in Keychain"
  echo "Make sure you're logged in with: claude /login"
  exit 1
fi

TOKEN=$(echo "$CREDENTIALS" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
EXPIRES_AT=$(echo "$CREDENTIALS" | grep -o '"expiresAt":[0-9]*' | cut -d':' -f2)

if [ -z "$TOKEN" ]; then
  echo "Error: Could not extract accessToken from credentials"
  exit 1
fi

# Calculate expiry time
if [ -n "$EXPIRES_AT" ]; then
  EXPIRES_DATE=$(date -r $((EXPIRES_AT / 1000)) "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "unknown")
  echo "Token expires: $EXPIRES_DATE"
fi

# Update or create .env file
if [ -f "$ENV_FILE" ]; then
  if grep -q "^CLAUDE_CODE_OAUTH_TOKEN=" "$ENV_FILE"; then
    sed -i '' "s|^CLAUDE_CODE_OAUTH_TOKEN=.*|CLAUDE_CODE_OAUTH_TOKEN=$TOKEN|" "$ENV_FILE"
    echo "Updated token in $ENV_FILE"
  else
    echo "CLAUDE_CODE_OAUTH_TOKEN=$TOKEN" >> "$ENV_FILE"
    echo "Added token to $ENV_FILE"
  fi
else
  echo "CLAUDE_CODE_OAUTH_TOKEN=$TOKEN" > "$ENV_FILE"
  echo "Created $ENV_FILE with token"
fi

echo "Done!"
