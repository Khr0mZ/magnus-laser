# Magnus Laser Companion Server

This is the companion server for Magnus Laser that handles cloudflared tunneling and session management, allowing the web application to create sessions even when running in a browser.

## Features

- WebSocket signaling server for real-time communication
- Downloads cloudflared binary at build time for tunneling (no embedding)
- REST API for session management
- CORS support for web application integration

## API Endpoints

### Health Check

- `GET /health` - Check if server is running

### Host Management

- `POST /api/host/start` - Start a new hosting session
- `POST /api/host/stop` - Stop the current hosting session
- `GET /api/host/status` - Get current hosting status
- `POST /api/host/kick` - Kick a player from the session

### WebSocket Signaling

- `WS /signal` - WebSocket endpoint for signaling

## Running the Server

### Quick Start (Recommended)

**Linux/macOS:**
```bash
./run.sh
```

**Windows:**
```cmd
run.bat
```

Or if using Git Bash on Windows:
```bash
./run.sh
```

### Manual Commands

```bash
# Build and run in one step
cargo run -- --port 8080

# Or build separately then run
cargo build --release
./target/release/magnus-laser-server --port 8080

# Custom options
./target/release/magnus-laser-server --host 0.0.0.0 --port 8080
```

**Windows:**
```cmd
cargo run -- --port 8080
target\release\magnus-laser-server.exe --port 8080
```

## Cross-Platform Support

The server is designed to work on Windows, Linux, and macOS:

- **Cloudflared binary**: Automatically downloaded for your platform during build
- **Path resolution**: Works regardless of the directory you run the server from
- **Port configuration**: Configurable via command-line arguments (default: 3030)
- **Build system**: Uses Rust's cross-platform build tools (no external dependencies like curl required)

## Architecture

The server provides the same functionality as the Tauri backend but as a standalone HTTP/WebSocket server that can be accessed from web browsers. When the companion server is running, the Magnus Laser web application will automatically detect it and use it for session creation instead of requiring the desktop app.

## Security

The server runs on localhost by default and includes CORS headers to allow the web application to communicate with it. For production use, consider additional security measures.
