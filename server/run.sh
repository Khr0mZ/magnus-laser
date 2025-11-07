#!/bin/bash

# Magnus Laser Companion Server Runner
# Starts the server on port 8080

echo "Starting Magnus Laser Companion Server on port 8080..."
echo "Server will be available at:"
echo "  - HTTP API: http://localhost:8080"
echo "  - Health check: http://localhost:8080/health"
echo "  - WebSocket: ws://localhost:8080/signal"
echo ""

# Kill any existing server on port 8080
echo "Checking for existing server on port 8080..."
if command -v lsof >/dev/null 2>&1; then
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
elif command -v netstat >/dev/null 2>&1; then
    # Windows fallback - try to kill process using port 8080
    for pid in $(netstat -ano | grep :8080 | grep LISTENING | awk '{print $5}'); do
        taskkill //PID $pid //F 2>/dev/null || true
    done
fi

# Run the server with cargo
cargo run -- --port 8080
