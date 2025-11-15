#!/bin/bash

# Magnus Laser Companion Server Runner
# Starts the server on port 8080
# Works on Linux, macOS, and Windows (Git Bash)

PORT=8080

echo "Starting Magnus Laser Companion Server on port $PORT..."
echo "Server will be available at:"
echo "  - HTTP API: http://localhost:$PORT"
echo "  - Health check: http://localhost:$PORT/health"
echo "  - WebSocket: ws://localhost:$PORT/signal"
echo ""

# Kill any existing server on the port
echo "Checking for existing server on port $PORT..."

# Detect OS and use appropriate command
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    # Linux and macOS
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k $PORT/tcp 2>/dev/null || true
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    if command -v netstat >/dev/null 2>&1; then
        # Extract PIDs and kill them
        for pid in $(netstat -ano | grep ":$PORT" | grep LISTENING | awk '{print $5}' | sort -u); do
            taskkill //PID $pid //F 2>/dev/null || true
        done
    fi
fi

# Run the server with cargo
cargo run -- --port $PORT
