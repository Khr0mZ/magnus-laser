# Magnus Laser

A cyberpunk-themed application for managing tabletop RPG game elements. This application provides tools to manage gangs, buildings, corporations, fixer jobs, and NPCs for your tabletop RPG games.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

-   Cyberpunk UI: Immersive interface with glitch effects, power lines, and neon elements.
-   Reader Mode: Toggle between cyberpunk visual style and a cleaner, more accessible reader mode.
-   Multilingual Support: Internationalization with i18next and react-i18next. (Only English atm)
-   Module Management:
    -   Dashboard: Central hub showing all modules.
    -   Characters: Create and manage player (TBD) and non-player characters.
    -   Gangs: Create and manage gang organizations.
    -   Buildings: Design and organize buildings and locations.
    -   Clubs: Manage nightlife and entertainment venues. (TBD)
    -   Items: Track equipment, weapons, and inventory.
    -   Gigs: Plan and manage missions and tasks.
    -   Bounties: Track and manage bounty hunting activities.
    -   Map: Interactive map with draggable markers.
    -   Settings: Configure API keys, reader mode, animations, and other preferences.
-   AI-Assisted Generation: Use Google Generative AI (Gemini), OpenAI, and Hugging Face to auto-generate modules' content.
-   Rich Text Editor: Integrated TipTap editor for notes and descriptions.
-   Interactive Map: Built with Leaflet and Leaflet Draw for world building and marker management.
-   Data Persistence: Offline storage powered by LocalForage for automatic saving and loading.
-   Data Import/Export: Export and import all application data as JSON files.
-   Notifications: Real-time in-app notifications with Notistack.
-   Cross-Platform Desktop App: Packaged with Tauri for macOS, Linux, and Windows.

## Technologies Used

-   **Frontend:**

    -   React 18 & React Router v6
    -   TypeScript
    -   Material-UI (MUI) v5
    -   i18next & react-i18next
    -   TipTap for rich text editing
    -   Leaflet & React Leaflet for interactive maps
    -   Leaflet Draw for map drawing tools
    -   LocalForage for offline data storage
    -   Notistack for notifications
    -   Google Generative AI SDK (@google/generative-ai)
    -   OpenAI & Hugging Face integrations
    -   GraphQL & GraphQL Code Generator
    -   ESLint & Prettier for code quality

-   **Desktop:**

    -   Tauri for building cross-platform desktop application

-   **Build Tools:**
    -   Vite
    -   TypeScript Compiler
    -   GraphQL Codegen

## Getting Started

### Prerequisites

-   Node.js (v16 or later)
-   npm or yarn
-   Rust (for Tauri development)
-   System dependencies for Tauri (see [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Installation

1. Clone the repository

    ```bash
    git clone https://github.com/yourusername/cyber-manager.git
    cd cyber-manager/client/Magnus-Laser
    ```

2. Install dependencies

    ```bash
    npm install
    # or
    yarn
    ```

3. Start the development server

    ```bash
    npm run dev
    # or
    yarn dev
    ```

4. For desktop development with Tauri:

    ```bash
    npm run tauri dev
    # or
    yarn tauri dev
    ```

5. To build the desktop application for production:

    ```bash
    npm run tauri build
    # or
    yarn tauri build
    ```

6. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

From within the `client/Magnus-Laser` directory:

-   `npm run dev` / `yarn dev`: Start Vite development server.
-   `npm run build` / `yarn build`: Build web app for production.
-   `npm run preview` / `yarn preview`: Preview production build.
-   `npm run ts` / `yarn ts`: Run TypeScript compiler in watch mode.
-   `npm run lint` / `yarn lint`: Run ESLint checks.
-   `npm run ts:lint` / `yarn ts:lint`: Run TypeScript and ESLint together.
-   `npm run generate` / `yarn generate`: Generate GraphQL types and hooks.
-   `npm run tauri dev` / `yarn tauri dev`: Launch the Tauri desktop app in development mode.
-   `npm run tauri build` / `yarn tauri build`: Build the Tauri desktop app for production.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
