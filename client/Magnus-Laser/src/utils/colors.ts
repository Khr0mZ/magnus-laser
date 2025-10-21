// General colors - Cyberpunk theme

const grays = {
    gray000: '#121212', // Darker base
    gray100: '#1a1a1a',
    gray200: '#222222',
    gray300: '#333333',
    gray400: '#444444',
    gray500: '#666666',
    gray600: '#888888',
    gray700: '#aaaaaa',
    gray800: '#cccccc',
    gray900: '#eeeeee',
}

const neons = {
    cyan: {
        default: '#00FFFF', // Neon cyan
        light: '#7AFFFF',
        dark: '#00CCCC',
        glow: '0 0 10px #00FFFF, 0 0 20px #00FFFF50',
    },
    pink: {
        default: '#FF00FF', // Neon pink/magenta
        light: '#FF7AFF',
        dark: '#CC00CC',
        glow: '0 0 10px #FF00FF, 0 0 20px #FF00FF50',
    },
    green: {
        default: '#00FF8B', // Neon green
        light: '#7AFFB5',
        dark: '#00CC6E',
        glow: '0 0 10px #00FF8B, 0 0 20px #00FF8B50',
    },
    blue: {
        default: '#0099FF', // Electric blue
        light: '#66C2FF',
        dark: '#0077CC',
        glow: '0 0 10px #0099FF, 0 0 20px #0099FF50',
    },
    purple: {
        default: '#9900FF', // Neon purple
        light: '#CC66FF',
        dark: '#7A00CC',
        glow: '0 0 10px #9900FF, 0 0 20px #9900FF50',
    },
    yellow: {
        default: '#FFFF00', // Neon yellow
        light: '#FFFF7A',
        dark: '#CCCC00',
        glow: '0 0 10px #FFFF00, 0 0 20px #FFFF0050',
    },
    red: {
        default: '#FF0055', // Neon red
        light: '#FF668C',
        dark: '#CC0044',
        glow: '0 0 10px #FF0055, 0 0 20px #FF005550',
    },
    orange: {
        default: '#FF5E00', // Neon orange
        light: '#FF8F4D',
        dark: '#CC4B00',
        glow: '0 0 10px #FF5E00, 0 0 20px #FF5E0050',
    },
}

// Keep original colors but with cyberpunk shades
const reds = {
    default: '#FF0055', // Cyberpunk red
    light: '#FF668C',
    dark: '#CC0044',
}

const blues = {
    default: '#0099FF', // Electric blue
    light: '#66C2FF',
    dark: '#0077CC',
}

const greens = {
    default: '#00FF8B', // Neon green
    light: '#7AFFB5',
    dark: '#00CC6E',
}

const yellows = {
    default: '#FFFF00', // Neon yellow
    light: '#FFFF7A',
    dark: '#CCCC00',
}

const oranges = {
    default: '#FF5E00', // Cyber orange
    light: '#FF8F4D',
    dark: '#CC4B00',
}

const purples = {
    default: '#9900FF', // Neon purple
    light: '#CC66FF',
    dark: '#7A00CC',
}

const difficulty = {
    easy: {
        default: '#00FF8B', // Neon green
        light: '#7AFFB5',
        dark: '#00CC6E',
    },
    typical: {
        default: '#FFFF00', // Neon yellow
        light: '#FFFF7A',
        dark: '#CCCC00',
    },
    dangerous: {
        default: '#FF0055', // Neon red
        light: '#FF668C',
        dark: '#CC0044',
    },
}

const cyberpunk = {
    darkBg: '#050718', // Very dark blue-black base
    matrixBg: '#0c1b19', // Dark green-black for matrix-like effect
    panelBg: 'rgba(20, 20, 30, 0.8)', // Semi-transparent panel background
    scanline: 'rgba(255, 255, 255, 0.03)', // Barely visible scanline effect
    glitch: '#FF00FF', // Glitch effect color
    datastream: '#00FFFF', // Data stream color
}

const colors = {
    grays,
    reds,
    blues,
    greens,
    yellows,
    oranges,
    purples,
    difficulty,
    neons,
    cyberpunk,
}

export default colors
