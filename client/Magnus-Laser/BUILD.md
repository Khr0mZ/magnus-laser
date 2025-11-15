# Building Magnus Laser

This guide explains how to build Magnus Laser for different platforms.

## Prerequisites

- Node.js 20+
- Rust (latest stable)
- System dependencies (see platform-specific sections)

## Quick Build

### Windows
```bash
npm run tauri:build:windows
```

### Linux (requires Linux environment)
```bash
npm run tauri:build:linux
```

### macOS
```bash
npm run tauri:build:macos
```

## Building for Linux from Windows

Cross-compiling Rust from Windows to Linux is complex and requires additional setup. We recommend using one of these approaches:

### Option 1: GitHub Actions (Recommended)

The project includes a GitHub Actions workflow that automatically builds Linux binaries. Simply push your changes to the repository, and the workflow will build Linux artifacts.

1. Push your changes to GitHub
2. Go to the "Actions" tab in your repository
3. Download the Linux artifacts from the completed workflow

### Option 2: WSL2 (Windows Subsystem for Linux)

If you have WSL2 installed:

1. Open WSL2 terminal
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   sudo apt-get update
   sudo apt-get install -y libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libgtk-3-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```
4. Install Rust and Node.js in WSL2
5. Run: `npm run tauri:build:linux`

### Option 3: Docker

You can use Docker to build Linux binaries:

```bash
docker run --rm -v ${PWD}:/workspace -w /workspace/client/Magnus-Laser \
  -e TAURI_PRIVATE_KEY -e TAURI_KEY_PASSWORD \
  ubuntu:22.04 bash -c "
    apt-get update && \
    apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm ci && \
    npm run build && \
    npm run tauri:build:linux
  "
```

## Build Outputs

After building, you'll find the executables in:

- **Windows**: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`
- **Linux**: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/`
- **macOS**: `src-tauri/target/x86_64-apple-darwin/release/bundle/`

The bundle directory contains:
- `.deb` files (Debian/Ubuntu)
- `.AppImage` files (Universal Linux)
- `.tar.gz` archives (Portable)

## Troubleshooting

### Linux Build Fails

If building for Linux fails, ensure you have all required system dependencies installed. See the GitHub Actions workflow (`.github/workflows/build-linux.yml`) for the complete list.

### Cross-compilation Issues

If you're trying to cross-compile from Windows to Linux and encounter issues, use one of the recommended options above (GitHub Actions, WSL2, or Docker).

