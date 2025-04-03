import { createTheme, PaletteMode } from '@mui/material'
import colors from './colors'

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
            },
            h2: {
                fontSize: '3rem',
                fontWeight: 600,
                lineHeight: '1.2',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            },
            h3: {
                fontSize: '2rem',
                fontWeight: 600,
                lineHeight: '1.2',
                letterSpacing: '0.03em',
            },
            h4: {
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: '1.2',
                letterSpacing: '0.02em',
            },
            h5: {
                fontSize: '1.25rem',
                fontWeight: 500,
                lineHeight: '1.2',
                letterSpacing: '0.02em',
            },
            h6: {
                fontSize: '1.0rem',
                fontWeight: 500,
                lineHeight: '1.2',
                letterSpacing: '0.01em',
            },
            body1: {
                letterSpacing: '0.015em',
            },
            body2: {
                letterSpacing: '0.01em',
            },
            button: {
                letterSpacing: '0.05em',
                fontWeight: 600,
                textTransform: 'uppercase',
            },
            caption: {},
            subtitle1: {},
            subtitle2: {},
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
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
                                filter: `drop-shadow(0 0 5px ${colors.neons.pink.default})`,
                                backgroundPosition: 'center',
                                backgroundSize: '100vh',
                                backgroundRepeat: 'no-repeat',
                                opacity: 0.25,
                                zIndex: -1,
                                backgroundColor: 'transparent',
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
                            },
                            // Custom reader-friendly styles
                            lineHeight: 1.6,
                        }),
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
                                  transform: 'none !important',
                                  transition: 'box-shadow 0.2s, background-color 0.2s',
                                  '&:hover': {
                                      transform: 'none !important',
                                  },
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
                                  transition: 'background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s',
                                  transform: 'none !important',
                                  '&:hover': {
                                      transform: 'none !important',
                                  },
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
                                  transition: 'box-shadow 0.2s, background-color 0.2s',
                                  transform: 'none !important',
                                  overflow: 'hidden',
                                  '&:hover': {
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                      backgroundColor: '#414649',
                                      transform: 'none !important',
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
            MuiTableRow: {
                styleOverrides: {
                    root: {
                        transition: 'all 0.2s',
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        transition: 'all 0.2s',
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
