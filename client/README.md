# Magnus Laser

A cyberpunk-themed application for managing tabletop RPG game elements. This application provides tools to manage gangs, buildings, corporations, fixer jobs, and NPCs for your tabletop RPG games.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

-   **Cyberpunk UI**: Immersive cyberpunk-themed interface with glitch effects, power lines, and neon elements
-   **Reader Mode**: Toggle between cyberpunk visual style and a cleaner reader mode for accessibility
-   **Multilingual Support**: Internationalization ready with i18next
-   **Dashboard**: Central hub showing all available modules
-   **Module Management**:
    -   Gangs: Create and manage gang organizations
    -   Buildings: Design and organize buildings and locations
    -   Corporations: Track corporation details and activities
    -   Fixer Jobs: Manage tasks and missions
    -   NPCs: Create and organize non-player characters

## Technologies Used

-   **Frontend**:

    -   React 18
    -   TypeScript
    -   Material-UI v5
    -   React Router v6
    -   i18next for internationalization
    -   @hello-pangea/dnd for drag-and-drop functionality
    -   notistack for notifications
    -   React Markdown for text formatting

-   **Build Tools**:
    -   Vite for fast development and building
    -   ESLint and Prettier for code quality
    -   GraphQL for API communication

## Getting Started

### Prerequisites

-   Node.js (v16 or later)
-   npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/cyber-manager.git
cd cyber-manager/client
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

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

-   `npm run dev` - Start the development server
-   `npm run build` - Build for production
-   `npm run ts` - Run TypeScript in watch mode
-   `npm run lint` - Run ESLint
-   `npm run ts:lint` - Run TypeScript and ESLint
-   `npm run preview` - Preview the production build
-   `npm run generate` - Generate GraphQL code

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
