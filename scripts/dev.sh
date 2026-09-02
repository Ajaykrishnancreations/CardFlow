#!/usr/bin/env bash
# Start CardFlow backend (8080) + frontend (3000). Run from any directory:
#   ./scripts/dev.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_BIN="/tmp/cardflow-api"
API_LOG="/tmp/cardflow-api.log"
FE_LOG="/tmp/cardflow-frontend.log"

echo "→ Building backend..."
(cd "$ROOT/backend" && go build -o "$API_BIN" ./cmd/api/)

pkill -f "$API_BIN" 2>/dev/null || true
lsof -ti :8080 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

echo "→ Starting backend on http://127.0.0.1:8080"
(cd "$ROOT" && nohup "$API_BIN" >> "$API_LOG" 2>&1 &)

echo "→ Starting frontend on http://127.0.0.1:3000"
(cd "$ROOT/frontend" && nohup npm start >> "$FE_LOG" 2>&1 &)

sleep 4
FE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
BE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/ || echo "000")
echo ""
echo "Frontend: http://127.0.0.1:3000  ($FE)"
echo "Backend:  http://127.0.0.1:8080  ($BE)"
echo "Logs: $FE_LOG | $API_LOG"
