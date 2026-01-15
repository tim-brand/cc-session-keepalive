# CC Session Keepalive

A lightweight service that keeps your Claude Code sessions alive by periodically sending keepalive requests to claude.ai. Built with Bun and designed to run in Docker/Kubernetes.

## Why?

Claude Code has a 5-hour session window. If you don't use it, your session becomes inactive. This service sends periodic "ping" messages to keep your sessions fresh, so you always have capacity available when you need it.

## Features

- **Session Cookie Authentication** - Uses claude.ai session cookie (valid ~1 month), doesn't interfere with local CLI
- **Configurable Interval** - Default: 1 hour between keepalives
- **Silence Hours** - Skip keepalives during night hours (e.g., 01:00-07:00)
- **Timezone Support** - Configure silence hours in your local timezone
- **Health Endpoints** - `/health` and `/status` for Kubernetes probes
- **Lightweight** - Simple Bun-based Docker image (~150MB)

## Quick Start

### 1. Get Your Session Key

1. Open [claude.ai](https://claude.ai) in your browser
2. Open DevTools (`F12` or `Cmd+Option+I`)
3. Go to **Application** → **Cookies** → `https://claude.ai`
4. Find `sessionKey` and copy its value (starts with `sk-ant-sid01-`)

### 2. Create `.env` File

```bash
cp .env.example .env
```

Then edit `.env` and add your session key:

```env
SESSION_KEY=sk-ant-sid01-your-session-key-here
```

Or use the helper script:

```bash
./scripts/update-token.sh
```

### 3. Run with Docker

```bash
# Build
docker build -t cc-session-keepalive:local .

# Run
docker run --rm -p 3000:3000 --env-file .env cc-session-keepalive:local
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SESSION_KEY` | (required) | Session cookie from claude.ai |
| `PROMPT_INTERVAL_MS` | `3600000` | Interval between keepalives (default: 1 hour) |
| `PORT` | `3000` | HTTP server port |
| `TIMEZONE` | `Europe/Amsterdam` | Timezone for silence hours |
| `SILENCE_START` | `01:00` | Start of silence window (HH:MM) |
| `SILENCE_END` | `07:00` | End of silence window (HH:MM) |

## API Endpoints

### `GET /health`

Health check for Kubernetes liveness/readiness probes.

```json
{
  "status": "healthy",
  "isRunning": true,
  "hasError": false
}
```

### `GET /status`

Detailed status information.

```json
{
  "isRunning": true,
  "isInSilenceHours": false,
  "promptCount": 5,
  "skippedDueToSilence": 2,
  "lastPromptSent": "2026-01-15T10:00:00.000Z",
  "lastPromptSuccess": true,
  "lastError": null,
  "config": {
    "promptIntervalMs": 3600000,
    "promptIntervalHours": "1.0",
    "timezone": "Europe/Amsterdam",
    "silenceStart": "01:00",
    "silenceEnd": "07:00"
  }
}
```

## Kubernetes Deployment

### Create Secret

```bash
kubectl create secret generic claude-session \
  --from-literal=session-key=sk-ant-sid01-your-key-here
```

### Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cc-session-keepalive
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cc-session-keepalive
  template:
    metadata:
      labels:
        app: cc-session-keepalive
    spec:
      containers:
        - name: keepalive
          image: ghcr.io/tim-brand/cc-session-keepalive:latest
          ports:
            - containerPort: 3000
          env:
            - name: SESSION_KEY
              valueFrom:
                secretKeyRef:
                  name: claude-session
                  key: session-key
            - name: TIMEZONE
              value: "Europe/Amsterdam"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Type check
bun run typecheck
```

## Session Key Expiration

The session key from claude.ai is valid for approximately **1 month**. When it expires:

1. Log in to [claude.ai](https://claude.ai) in your browser
2. Extract the new `sessionKey` cookie
3. Update your deployment with the new key

The `/health` endpoint will return unhealthy when the session key is invalid, making it easy to monitor.

## License

MIT
