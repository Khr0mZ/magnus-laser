import { PaletteMode, createTheme, keyframes } from '@mui/material'
import colors from './colors'

const dataStream = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 0% 100%;
  }
`

const randomGlitch = keyframes`
  0%, 100% {
    opacity: 0;
  }
  10%, 15% {
    opacity: 1;
    transform: translate(10px, -5px) skew(-10deg);
  }
  20% {
    opacity: 0;
  }
  30%, 33% {
    opacity: 1;
    transform: translate(-5px, 3px) skew(5deg);
  }
  35% {
    opacity: 0;
  }
  70%, 72% {
    opacity: 1;
    transform: translate(7px, -10px) skew(-5deg);
  }
  75% {
    opacity: 0;
  }
  85%, 88% {
    opacity: 1;
    transform: translate(-3px, 8px) skew(10deg);
  }
  90% {
    opacity: 0;
  }
`

const powerLines = keyframes`
  0% {
    opacity: 0.5;
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}50;
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 10px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}50;
  }
  100% {
    opacity: 0.5;
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}50;
  }
`

const digitalNoise = keyframes`
  0%, 100% {
    background-position: 0 0;
    filter: hue-rotate(0deg);
  }
  10% {
    background-position: -5% -10%;
    filter: hue-rotate(45deg);
  }
  20% {
    background-position: -15% 5%;
    filter: hue-rotate(90deg);
  }
  30% {
    background-position: 7% -25%;
    filter: hue-rotate(180deg);
  }
  40% {
    background-position: 20% 25%;
    filter: hue-rotate(120deg);
  }
  50% {
    background-position: -25% 10%; 
    filter: hue-rotate(0deg);
  }
  60% {
    background-position: 15% 5%;
    filter: hue-rotate(30deg);
  }
  70% {
    background-position: 5% -15%;
    filter: hue-rotate(285deg);
  }
  80% {
    background-position: -10% -10%;
    filter: hue-rotate(185deg);
  }
  90% {
    background-position: 10% 15%;
    filter: hue-rotate(125deg);
  }
`

const flicker = keyframes`
  0% {
    opacity: 1;
  }
  4% {
    opacity: 0.8;
  }
  6% {
    opacity: 0.4;
  }
  8% {
    opacity: 0.9;
  }
  10% {
    opacity: 0.7;
  }
  12% {
    opacity: 1;
  }
  14% {
    opacity: 0.3;
  }
  16% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  72% {
    opacity: 0.2;
  }
  74% {
    opacity: 0.5;
  }
  76% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
`

declare module '@mui/material/styles' {
    interface BreakpointOverrides {
        xs: true
        sm: true
        md: true
        lg: true
        xl: true
        xxl: true
    }

    interface Palette {
        neon: {
            cyan: string
            pink: string
            green: string
            blue: string
            purple: string
            yellow: string
            red: string
        }
        cyberpunk: {
            darkBg: string
            matrixBg: string
            panelBg: string
            scanline: string
            glitch: string
            datastream: string
        }
    }

    interface PaletteOptions {
        neon?: {
            cyan?: string
            pink?: string
            green?: string
            blue?: string
            purple?: string
            yellow?: string
            red?: string
        }
        cyberpunk?: {
            darkBg?: string
            matrixBg?: string
            panelBg?: string
            scanline?: string
            glitch?: string
            datastream?: string
        }
    }
}

export const PROJECT_MAX_WIDTH = 2000
export const SECTION_MAX_WIDTH = 1432

export const zIndexes = {
    gallery: 5,
    header: 50,
    drawer: 35,
    overlay: 20,
}

// TODO: change everything to rem

export const getDesignTokens = (mode: PaletteMode) => {
    const breakpointTheme = createTheme({
        // TODO: set new breakpoints
        breakpoints: {
            values: {
                xs: 0,
                sm: 479,
                md: 767,
                lg: 991,
                xl: 1200,
                xxl: 1600,
            },
        },
    })

    // Common palette values for both modes
    const commonPalette = {
        neon: {
            cyan: colors.neons.cyan.default,
            pink: colors.neons.pink.default,
            green: colors.neons.green.default,
            blue: colors.neons.blue.default,
            purple: colors.neons.purple.default,
            yellow: colors.neons.yellow.default,
            red: colors.neons.red.default,
        },
        cyberpunk: {
            darkBg: colors.cyberpunk.darkBg,
            matrixBg: colors.cyberpunk.matrixBg,
            panelBg: colors.cyberpunk.panelBg,
            scanline: colors.cyberpunk.scanline,
            glitch: colors.cyberpunk.glitch,
            datastream: colors.cyberpunk.datastream,
        },
    }

    // Create the palette based on the mode
    const palette = {
        mode,
        ...(mode === 'dark' && {
            // Dark mode (cyberpunk)
            primary: {
                main: colors.neons.cyan.default,
                light: colors.neons.cyan.light,
                dark: colors.neons.cyan.dark,
            },
            secondary: {
                main: colors.neons.pink.default,
                light: colors.neons.pink.light,
                dark: colors.neons.pink.dark,
            },
            error: {
                main: colors.neons.red.default,
                light: colors.neons.red.light,
                dark: colors.neons.red.dark,
            },
            warning: {
                main: colors.neons.yellow.default,
                light: colors.neons.yellow.light,
                dark: colors.neons.yellow.dark,
            },
            info: {
                main: colors.neons.blue.default,
                light: colors.neons.blue.light,
                dark: colors.neons.blue.dark,
            },
            success: {
                main: colors.neons.green.default,
                light: colors.neons.green.light,
                dark: colors.neons.green.dark,
            },
            background: {
                default: colors.cyberpunk.darkBg,
                paper: colors.cyberpunk.panelBg,
            },
            text: {
                primary: colors.grays.gray900,
                secondary: colors.grays.gray700,
            },
            ...commonPalette,
        }),
        ...(mode === 'light' && {
            // Light mode (reader-friendly)
            primary: {
                main: '#1976d2', // Standard blue
                light: '#42a5f5',
                dark: '#1565c0',
            },
            secondary: {
                main: '#9c27b0', // Standard purple
                light: '#ba68c8',
                dark: '#7b1fa2',
            },
            error: {
                main: '#d32f2f', // Standard red
                light: '#ef5350',
                dark: '#c62828',
            },
            warning: {
                main: '#ed6c02', // Standard orange
                light: '#ff9800',
                dark: '#e65100',
            },
            info: {
                main: '#0288d1', // Standard light blue
                light: '#03a9f4',
                dark: '#01579b',
            },
            success: {
                main: '#2e7d32', // Standard green
                light: '#4caf50',
                dark: '#1b5e20',
            },
            background: {
                default: '#f8f9fa', // Light gray background
                paper: '#ffffff', // White paper
            },
            text: {
                primary: '#242424', // Dark gray, not pure black for better readability
                secondary: '#565656', // Medium gray
            },
            ...commonPalette,
        }),
    }

    const muiTheme = createTheme({
        ...breakpointTheme,
        typography: {
            fontFamily: '"Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif',

            h1: {
                fontSize: '4rem',
                fontWeight: 700,
                lineHeight: '1.2',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: mode === 'light' ? '#242424' : undefined,
            },
            h2: {
                fontSize: '3rem',
                fontWeight: 600,
                lineHeight: '1.2',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: mode === 'light' ? '#242424' : colors.neons.cyan.default,
            },
            h3: {
                fontSize: '2rem',
                fontWeight: 600,
                lineHeight: '1.2',
                letterSpacing: '0.03em',
                color: mode === 'light' ? '#242424' : undefined,
            },
            h4: {
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: '1.2',
                letterSpacing: '0.02em',
                color: mode === 'light' ? '#242424' : undefined,
            },
            h5: {
                fontSize: '1.25rem',
                fontWeight: 500,
                lineHeight: '1.2',
                letterSpacing: '0.02em',
                color: mode === 'light' ? '#242424' : undefined,
            },
            h6: {
                fontSize: '1.0rem',
                fontWeight: 500,
                lineHeight: '1.2',
                letterSpacing: '0.01em',
                color: mode === 'light' ? '#242424' : undefined,
            },
            body1: {
                fontFamily: '"Rajdhani", "Lexend", sans-serif',
                letterSpacing: '0.015em',
                color: mode === 'light' ? '#242424' : undefined,
            },
            body2: {
                fontFamily: '"Rajdhani", "Lexend", sans-serif',
                letterSpacing: '0.01em',
                color: mode === 'light' ? '#242424' : undefined,
            },
            button: {
                fontFamily: '"Orbitron", "Rajdhani", "Lexend", sans-serif',
                letterSpacing: '0.05em',
                fontWeight: 600,
                textTransform: 'uppercase',
            },
            caption: {
                color: mode === 'light' ? '#242424' : undefined,
            },
            subtitle1: {
                color: mode === 'light' ? '#242424' : undefined,
            },
            subtitle2: {
                color: mode === 'light' ? '#242424' : undefined,
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    '@global': {
                        ...(mode === 'light' && {
                            '*': {
                                fontFamily: '"Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif',
                            },
                        }),
                    },
                    body: {
                        ...(mode === 'dark' && {
                            // Cyberpunk theme styles
                            backgroundImage: 'linear-gradient(to bottom, rgba(5, 7, 24, 0.97), rgba(5, 7, 24, 0.97))',
                            backgroundAttachment: 'fixed',
                            position: 'relative',
                            // Digital grid effect
                            '&::before': {
                                content: '""',
                                position: 'fixed',
                                top: '70px',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'url("/magnusLaserLogo.png")',
                                backgroundPosition: 'center',
                                backgroundSize: '100vh',
                                backgroundRepeat: 'no-repeat',
                                opacity: 0.25,
                                zIndex: -1,
                                backgroundColor: 'transparent',
                                filter: 'drop-shadow(0 0 15px rgba(0, 255, 139, 0.3))',
                            },
                            // Main background grid
                            '&::after': {
                                content: '""',
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: `
                                    radial-gradient(${colors.neons.cyan.default}30 0.5px, transparent 0.5px),
                                    linear-gradient(to right, ${colors.neons.cyan.default}20 0.5px, transparent 0.5px),
                                    linear-gradient(to bottom, ${colors.neons.cyan.default}20 0.5px, transparent 0.5px)
                                `,
                                backgroundSize: '20px 20px, 10px 10px, 10px 10px',
                                opacity: 0.07,
                                zIndex: -2,
                                pointerEvents: 'none',
                            },
                        }),
                        ...(mode === 'light' && {
                            // Reader-friendly theme styles
                            backgroundImage: 'none',
                            backgroundColor: '#f8f9fa',
                            backgroundAttachment: 'fixed',
                            position: 'relative',
                            // Keep the Magnus Laser Logo in reader mode
                            '&::before': {
                                content: '""',
                                position: 'fixed',
                                top: '70px',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'url("/magnusLaserLogo.png")',
                                backgroundPosition: 'center',
                                backgroundSize: '100vh',
                                backgroundRepeat: 'no-repeat',
                                opacity: 0.25, // Lower opacity for reader mode
                                zIndex: -1,
                                backgroundColor: 'transparent',
                                filter: 'saturate(90%) brightness(105%)', // Adjust filter for light mode
                            },
                            '&::after': {
                                content: 'none',
                            },
                            // Custom reader-friendly styles
                            color: '#242424',
                            lineHeight: 1.6,
                        }),
                    },
                    // Scanlines overlay
                    '#root': {
                        position: 'relative',
                        minHeight: '100vh',
                        zIndex: 1,
                        ...(mode === 'dark' && {
                            '&::before': {
                                content: '""',
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: `repeating-linear-gradient(180deg, 
                                    ${colors.cyberpunk.scanline}, 
                                    ${colors.cyberpunk.scanline} 1px, 
                                    transparent 1px, 
                                    transparent 2px)`,
                                pointerEvents: 'none',
                                zIndex: 3,
                                opacity: 0.2,
                            },
                        }),
                        ...(mode === 'light' && {
                            '&::before': {
                                content: 'none',
                            },
                        }),
                    },
                    // Additional animated elements
                    'body > .cyber-power-line1': {
                        content: '""',
                        position: 'fixed',
                        top: '20%',
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: colors.neons.green.default,
                        opacity: 0.3,
                        animation: `${powerLines} 4s ease-in-out infinite`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-power-line2': {
                        content: '""',
                        position: 'fixed',
                        top: '60%',
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: colors.neons.cyan.default,
                        opacity: 0.3,
                        animation: `${powerLines} 6s ease-in-out infinite`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-data-stream': {
                        content: '""',
                        position: 'fixed',
                        top: 0,
                        right: '15%',
                        width: '1px',
                        height: '100%',
                        opacity: 0.15,
                        backgroundImage: `linear-gradient(0deg, transparent 20%, 
                            ${colors.neons.cyan.default} 40%, 
                            ${colors.neons.cyan.default} 60%, 
                            transparent 80%)`,
                        backgroundSize: '1px 30px',
                        animation: `${dataStream} 8s linear infinite`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-data-stream2': {
                        content: '""',
                        position: 'fixed',
                        top: 0,
                        left: '25%',
                        width: '1px',
                        height: '100%',
                        opacity: 0.15,
                        backgroundImage: `linear-gradient(0deg, transparent 10%, 
                            ${colors.neons.green.default} 30%, 
                            ${colors.neons.green.default} 70%, 
                            transparent 90%)`,
                        backgroundSize: '1px 50px',
                        animation: `${dataStream} 12s linear infinite`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-glitch': {
                        content: '""',
                        position: 'fixed',
                        bottom: '30%',
                        right: '20%',
                        width: '20px',
                        height: '100px',
                        backgroundColor: colors.neons.pink.default,
                        opacity: 0,
                        animation: `${randomGlitch} 8s infinite 1s`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-glitch-block': {
                        content: '""',
                        position: 'fixed',
                        top: '55%',
                        left: '45%',
                        width: '80px',
                        height: '40px',
                        backgroundColor: `${colors.neons.cyan.default}20`,
                        borderLeft: `1px solid ${colors.neons.cyan.default}`,
                        opacity: 0,
                        animation: `${randomGlitch} 15s infinite 3s`,
                        zIndex: -10,
                        pointerEvents: 'none',
                        boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                    },
                    'body > .cyber-glitch-small': {
                        content: '""',
                        position: 'fixed',
                        top: '15%',
                        right: '35%',
                        width: '3px',
                        height: '6px',
                        backgroundColor: colors.neons.green.default,
                        opacity: 0,
                        animation: `${randomGlitch} 5s infinite 0.5s`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-noise': {
                        content: '""',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `
                            radial-gradient(${colors.neons.pink.default}50 0.5px, transparent 0.5px),
                            radial-gradient(${colors.neons.green.default}50 0.3px, transparent 0.3px)
                        `,
                        backgroundSize: '40px 40px, 30px 30px',
                        backgroundPosition: '0 0, 20px 20px',
                        opacity: 0.03,
                        animation: `${digitalNoise} 20s linear infinite`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-flicker': {
                        content: '""',
                        position: 'fixed',
                        bottom: '80%',
                        left: '10%',
                        width: '2px',
                        height: '2px',
                        backgroundColor: colors.neons.cyan.default,
                        boxShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}`,
                        animation: `${flicker} 6s infinite`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    'body > .cyber-flicker2': {
                        content: '""',
                        position: 'fixed',
                        bottom: '20%',
                        left: '80%',
                        width: '3px',
                        height: '3px',
                        backgroundColor: colors.neons.green.default,
                        boxShadow: `0 0 10px ${colors.neons.green.default}, 0 0 20px ${colors.neons.green.default}`,
                        animation: `${flicker} 8s infinite 2s`,
                        zIndex: -10,
                        pointerEvents: 'none',
                    },
                    '::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '::-webkit-scrollbar-track': {
                        background: 'rgba(0, 0, 0, 0.4)',
                    },
                    '::-webkit-scrollbar-thumb': {
                        background: `linear-gradient(to bottom, ${colors.neons.cyan.default}, ${colors.neons.green.default})`,
                        borderRadius: '4px',
                    },
                    '::-webkit-scrollbar-thumb:hover': {
                        background: `linear-gradient(to bottom, ${colors.neons.pink.default}, ${colors.neons.purple.default})`,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light'
                            ? {
                                  // Reader mode paper
                                  backgroundColor: '#ffffff',
                                  backgroundImage: 'none',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                  borderRadius: '4px',
                                  border: 'none',
                                  position: 'relative',
                                  zIndex: 10,
                              }
                            : {
                                  // Cyberpunk paper
                                  backgroundImage:
                                      'linear-gradient(to bottom, rgba(20, 20, 30, 0.8), rgba(20, 20, 30, 0.8)), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)',
                                  boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
                                  borderRadius: '4px',
                                  border: `1px solid rgba(0, 255, 255, 0.2)`,
                                  position: 'relative',
                                  zIndex: 10,
                              }),
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light'
                            ? {
                                  // Reader mode button
                                  textTransform: 'uppercase',
                                  borderRadius: '4px',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  zIndex: 10,
                                  transition: 'background-color 0.3s',
                              }
                            : {
                                  // Cyberpunk button
                                  textTransform: 'uppercase',
                                  borderRadius: '2px',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  zIndex: 10,
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      backgroundImage:
                                          'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                      transform: 'translateX(-100%)',
                                      transition: 'transform 0.3s',
                                  },
                                  '&:hover::before': {
                                      transform: 'translateX(100%)',
                                  },
                              }),
                    },
                    contained: {
                        boxShadow: mode === 'light' ? 'none' : `0 0 10px ${colors.neons.cyan.default}`,
                    },
                    outlined: {
                        borderWidth: '1px',
                        '&:hover': {
                            borderWidth: '1px',
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light'
                            ? {
                                  // Reader mode app bar
                                  backgroundColor: '#ffffff',
                                  backgroundImage: 'none',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                  borderBottom: '1px solid #e0e0e0',
                              }
                            : {
                                  // Cyberpunk app bar
                                  backgroundImage: `linear-gradient(to right, ${colors.cyberpunk.darkBg}, ${colors.cyberpunk.matrixBg})`,
                                  boxShadow: `0 0 15px ${colors.neons.cyan.dark}`,
                                  borderBottom: `1px solid ${colors.neons.cyan.default}`,
                              }),
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light'
                            ? {
                                  // Reader mode input
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '4px',
                                  border: '1px solid #e0e0e0',
                                  transition: 'all 0.3s',
                                  '&:hover': {
                                      borderColor: '#bbbbbb',
                                  },
                                  '&.Mui-focused': {
                                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                                      borderColor: '#1976d2',
                                  },
                              }
                            : {
                                  // Cyberpunk input
                                  backgroundColor: 'rgba(10, 12, 20, 0.8)',
                                  borderRadius: '4px',
                                  border: `1px solid ${colors.neons.cyan.dark}`,
                                  transition: 'all 0.3s',
                                  '&:hover': {
                                      boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                  },
                                  '&.Mui-focused': {
                                      boxShadow: `0 0 15px ${colors.neons.cyan.default}`,
                                      border: `1px solid ${colors.neons.cyan.default}`,
                                  },
                              }),
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light'
                            ? {
                                  // Reader mode card
                                  backgroundColor: '#3a3f44',
                                  backgroundImage: 'none',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                  borderRadius: '8px',
                                  border: 'none',
                                  position: 'relative',
                                  zIndex: 10,
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  overflow: 'hidden',
                                  color: 'white',
                                  '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                      backgroundColor: '#414649',
                                  },
                                  '&::after': {
                                      content: 'none',
                                  },
                              }
                            : {
                                  // Cyberpunk card
                                  backgroundImage:
                                      'linear-gradient(to bottom, rgba(20, 20, 30, 0.8), rgba(20, 20, 30, 0.8)), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.02) 2px, rgba(0, 255, 255, 0.02) 4px)',
                                  boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)',
                                  border: `1px solid rgba(0, 255, 255, 0.2)`,
                                  borderRadius: '4px',
                                  position: 'relative',
                                  zIndex: 10,
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '3px',
                                      background: `linear-gradient(to right, ${colors.neons.green.default}, ${colors.neons.cyan.default})`,
                                  },
                              }),
                    },
                },
            },
            MuiCardContent: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light' && {
                            padding: '16px',
                            '&:last-child': {
                                paddingBottom: '16px',
                            },
                            '& .MuiTypography-root': {
                                color: 'white',
                            },
                        }),
                    },
                },
            },
            MuiCardHeader: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light' && {
                            paddingBottom: '8px',
                            borderBottom: '1px solid #4d5256',
                        }),
                    },
                    title: {
                        ...(mode === 'light' && {
                            fontWeight: 600,
                            color: 'white',
                        }),
                    },
                    subheader: {
                        ...(mode === 'light' && {
                            color: 'rgba(255, 255, 255, 0.8)',
                        }),
                    },
                },
            },
            MuiSvgIcon: {
                styleOverrides: {
                    root: {
                        ...(mode === 'light' && {
                            '&.MuiCard-root &': {
                                color: 'white',
                            },
                        }),
                    },
                },
            },
            MuiTypography: {
                styleOverrides: {
                    root: {
                        position: 'relative',
                        zIndex: 10,
                    },
                },
            },
            MuiContainer: {
                styleOverrides: {
                    root: {
                        position: 'relative',
                        zIndex: 5,
                    },
                },
            },
            MuiGrid: {
                styleOverrides: {
                    root: {
                        position: 'relative',
                        zIndex: 5,
                    },
                },
            },
        },
    })

    return {
        ...breakpointTheme,
        palette: palette,
        components: muiTheme.components,
        typography: muiTheme.typography,
        breakpoints: muiTheme.breakpoints,
    }
}
