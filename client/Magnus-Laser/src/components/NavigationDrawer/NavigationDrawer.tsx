import { Box, Drawer, IconButton, Stack, Tooltip, keyframes } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { useSession } from '../../state/sessionStore'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { useGMToolsStore } from '../GMTools/GMToolsStore'
import WindowButtons from '../WindowButtons.tsx'
import DrawerButton from './DrawerButton'
import LogoButton from './LogoButton'

// Pulse glow animation for the X
const pulseGlow = keyframes`
    0%, 100% { 
        filter: drop-shadow(0 0 3px currentColor) drop-shadow(0 0 6px currentColor);
    }
    50% { 
        filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor) drop-shadow(0 0 24px currentColor);
    }
`

// Rotate animation for the outer ring
const rotateRing = keyframes`
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
`

// Data flow animation
const dataFlow = keyframes`
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
`

// Scan line animation for hamburger
const scanLine = keyframes`
    0% { top: 0; opacity: 1; }
    50% { opacity: 0.5; }
    100% { top: 100%; opacity: 1; }
`

// Breathing glow for hamburger
const breatheGlow = keyframes`
    0%, 100% { 
        box-shadow: 0 0 4px currentColor, 0 0 8px currentColor;
    }
    50% { 
        box-shadow: 0 0 8px currentColor, 0 0 16px currentColor, 0 0 24px currentColor;
    }
`

// Cyberpunk Hamburger Icon Component
const CyberpunkHamburger = ({ isOpen, color }: { isOpen: boolean; color: string }) => {
    const secondaryColor = isOpen ? colors.neons.orange.default : colors.neons.purple.default
    const tertiaryColor = colors.neons.pink.default

    return (
        <Box
            sx={{
                position: 'relative',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Outer frame - always visible */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: isOpen ? 38 : 34,
                    height: isOpen ? 38 : 28,
                    transform: 'translate(-50%, -50%)',
                    transition: 'all 0.4s ease-in-out',
                    // Corner brackets
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 6,
                        height: 6,
                        borderTop: `2px solid ${isOpen ? color : secondaryColor}`,
                        borderLeft: `2px solid ${isOpen ? color : secondaryColor}`,
                        boxShadow: isOpen ? `0 0 6px ${color}` : `0 0 4px ${secondaryColor}`,
                        transition: 'all 0.3s ease',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 6,
                        height: 6,
                        borderBottom: `2px solid ${isOpen ? color : secondaryColor}`,
                        borderRight: `2px solid ${isOpen ? color : secondaryColor}`,
                        boxShadow: isOpen ? `0 0 6px ${color}` : `0 0 4px ${secondaryColor}`,
                        transition: 'all 0.3s ease',
                    },
                }}
            />

            {/* Additional corners for hamburger */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: isOpen ? 38 : 34,
                    height: isOpen ? 38 : 28,
                    transform: 'translate(-50%, -50%)',
                    opacity: isOpen ? 0 : 1,
                    transition: 'all 0.3s ease',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 6,
                        height: 6,
                        borderTop: `2px solid ${tertiaryColor}`,
                        borderRight: `2px solid ${tertiaryColor}`,
                        boxShadow: `0 0 4px ${tertiaryColor}`,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: 6,
                        height: 6,
                        borderBottom: `2px solid ${tertiaryColor}`,
                        borderLeft: `2px solid ${tertiaryColor}`,
                        boxShadow: `0 0 4px ${tertiaryColor}`,
                    },
                }}
            />

            {/* Rotating ring when open */}
            {isOpen && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 42,
                        height: 42,
                        border: `1px dashed ${color}50`,
                        borderRadius: '50%',
                        animation: `${rotateRing} 8s linear infinite`,
                    }}
                />
            )}

            {/* Scan line effect for hamburger */}
            {!isOpen && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 28,
                        height: 20,
                        transform: 'translate(-50%, -50%)',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            width: '100%',
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
                            animation: `${scanLine} 2s ease-in-out infinite`,
                        },
                    }}
                />
            )}

            {/* Inner container */}
            <Box
                sx={{
                    position: 'relative',
                    width: 24,
                    height: 18,
                }}
            >
                {/* Top line / X line 1 */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        height: isOpen ? '3px' : '3px',
                        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        color: color,
                        top: isOpen ? '50%' : '0',
                        width: isOpen ? '28px' : '26px',
                        transform: isOpen ? 'translateX(-50%) translateY(-50%) rotate(45deg)' : 'translateX(-50%)',
                        borderRadius: '2px',
                        background: isOpen
                            ? `linear-gradient(90deg, ${secondaryColor}, ${color}, ${secondaryColor})`
                            : `linear-gradient(90deg, ${secondaryColor}, ${color}, ${color}, ${secondaryColor})`,
                        backgroundSize: '200% 100%',
                        boxShadow: isOpen
                            ? `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}80`
                            : `0 0 8px ${color}, 0 0 14px ${color}60`,
                        animation: isOpen
                            ? `${pulseGlow} 1.5s ease-in-out infinite, ${dataFlow} 2s linear infinite`
                            : `${breatheGlow} 3s ease-in-out infinite, ${dataFlow} 3s linear infinite`,
                    }}
                />

                {/* Middle line (hamburger only) */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        height: '3px',
                        transform: 'translateX(-50%) translateY(-50%)',
                        transition: 'all 0.3s ease-in-out',
                        opacity: isOpen ? 0 : 1,
                        width: isOpen ? 0 : '18px',
                        borderRadius: '2px',
                        background: `linear-gradient(90deg, ${color}, ${tertiaryColor}, ${color})`,
                        backgroundSize: '200% 100%',
                        boxShadow: `0 0 8px ${tertiaryColor}, 0 0 14px ${tertiaryColor}60`,
                        color: tertiaryColor,
                        animation: isOpen
                            ? 'none'
                            : `${breatheGlow} 3s ease-in-out infinite 0.5s, ${dataFlow} 2.5s linear infinite reverse`,
                    }}
                />

                {/* Bottom line / X line 2 */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        height: isOpen ? '3px' : '3px',
                        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        color: color,
                        bottom: isOpen ? 'auto' : '0',
                        top: isOpen ? '50%' : 'auto',
                        width: isOpen ? '28px' : '26px',
                        transform: isOpen ? 'translateX(-50%) translateY(-50%) rotate(-45deg)' : 'translateX(-50%)',
                        borderRadius: '2px',
                        background: isOpen
                            ? `linear-gradient(90deg, ${color}, ${secondaryColor}, ${color})`
                            : `linear-gradient(90deg, ${secondaryColor}, ${color}, ${color}, ${secondaryColor})`,
                        backgroundSize: '200% 100%',
                        boxShadow: isOpen
                            ? `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}80`
                            : `0 0 8px ${color}, 0 0 14px ${color}60`,
                        animation: isOpen
                            ? `${pulseGlow} 1.5s ease-in-out infinite 0.75s, ${dataFlow} 2s linear infinite reverse`
                            : `${breatheGlow} 3s ease-in-out infinite 1s, ${dataFlow} 3s linear infinite`,
                    }}
                />

                {/* Center dot when open */}
                {isOpen && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 6,
                            height: 6,
                            backgroundColor: secondaryColor,
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%',
                            boxShadow: `0 0 8px ${secondaryColor}, 0 0 16px ${secondaryColor}`,
                            animation: `${pulseGlow} 1s ease-in-out infinite`,
                            color: secondaryColor,
                        }}
                    />
                )}

                {/* Line endpoint dots for hamburger */}
                {!isOpen && (
                    <>
                        {/* Top line endpoints */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: -2,
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: secondaryColor,
                                boxShadow: `0 0 4px ${secondaryColor}`,
                                transform: 'translateY(-25%)',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: -2,
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: `0 0 4px ${color}`,
                                transform: 'translateY(-25%)',
                            }}
                        />
                        {/* Bottom line endpoints */}
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: -2,
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: `0 0 4px ${color}`,
                                transform: 'translateY(25%)',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: -2,
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: secondaryColor,
                                boxShadow: `0 0 4px ${secondaryColor}`,
                                transform: 'translateY(25%)',
                            }}
                        />
                    </>
                )}

                {/* X endpoint dots */}
                {isOpen && (
                    <>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -2,
                                right: -6,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: -2,
                                left: -6,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -2,
                                left: -6,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: secondaryColor,
                                boxShadow: `0 0 6px ${secondaryColor}, 0 0 12px ${secondaryColor}`,
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -6,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: secondaryColor,
                                boxShadow: `0 0 6px ${secondaryColor}, 0 0 12px ${secondaryColor}`,
                            }}
                        />
                    </>
                )}
            </Box>
        </Box>
    )
}

// Modules to hide from appbar (available in GM Tools drawer)
const hiddenModules = [
    ModuleTypes.GANG,
    ModuleTypes.BUILDING,
    ModuleTypes.FIXER_JOB,
    ModuleTypes.ITEM,
    ModuleTypes.CHARACTER,
    ModuleTypes.BOUNTY,
    ModuleTypes.CHARACTER_CREATOR,
    //ModuleTypes.EDGERUNNERS,
]

// Check if we're in a Tauri/desktop environment
const isTauri = () =>
    typeof window !== 'undefined' &&
    typeof (window as typeof window & { __TAURI__?: { core?: { invoke?: (...args: unknown[]) => unknown } } }).__TAURI__
        ?.core?.invoke === 'function'

const NavigationDrawer = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { session, connected } = useSession()
    const { isDrawerOpen, toggleDrawer } = useGMToolsStore()

    // For players, show as connected if they have a session (they're in the session)
    // For DMs, show as connected only when WebRTC is connected
    const isConnected = Boolean(session && connected)

    // Filter out modules that are in the GM Tools drawer
    const visibleModules = Object.values(ModuleTypes).filter((module) => !hiddenModules.includes(module))

    return (
        <Box sx={{ mb: 11 }}>
            <Drawer
                open
                variant={'permanent'}
                anchor={'top'}
                slotProps={{
                    paper: {
                        sx: {
                            height: '80px',
                            // Cyberpunk drawer styles
                            backgroundImage: `linear-gradient(to right, ${colors.cyberpunk.darkBg}, ${colors.cyberpunk.matrixBg})`,
                            boxShadow: `0 0 15px ${colors.neons.cyan.dark}`,
                            borderBottom: `1px solid ${colors.neons.cyan.default}`,
                            position: 'fixed',
                            zIndex: 1200,
                            overflow: 'hidden',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '1px',
                                backgroundColor: colors.neons.cyan.default,
                                boxShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}`,
                            },
                            // Scanlines effect
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 11,
                                pointerEvents: 'none',
                                backgroundImage: `linear-gradient(0deg, 
                                ${colors.cyberpunk.scanline} 25%, 
                                transparent 25%, 
                                transparent 50%, 
                                ${colors.cyberpunk.scanline} 50%, 
                                ${colors.cyberpunk.scanline} 75%, 
                                transparent 75%, 
                                transparent)`,
                                backgroundSize: '100% 4px',
                                opacity: 0.3,
                            },
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 4,
                        opacity: readerMode ? 0.3 : 0.15,
                        backgroundImage: `
                                radial-gradient(${colors.neons.cyan.default}50 1px, transparent 1px),
                                linear-gradient(to right, ${colors.neons.cyan.default}50 1px, transparent 1px),
                                linear-gradient(to bottom, ${colors.neons.cyan.default}50 1px, transparent 1px)
                            `,
                        backgroundSize: '20px 20px, 10px 10px, 10px 10px',
                        pointerEvents: 'none',
                    }}
                />

                <Stack
                    data-tauri-drag-region
                    direction={'row'}
                    sx={{
                        bgcolor: 'transparent',
                        position: 'relative',
                        zIndex: 15,
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'center',
                    }}
                >
                    <LogoButton isConnected={isConnected} />
                    <Stack
                        data-tauri-drag-region
                        direction={'row'}
                        sx={{
                            bgcolor: 'transparent',
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative',
                            flexWrap: 'wrap',
                        }}
                    >
                        {visibleModules.map((module) => (
                            <DrawerButton key={module} module={module} />
                        ))}
                    </Stack>

                    {/* GM Tools Toggle Button */}
                    <Tooltip title={t('gmTools.title')}>
                        <IconButton
                            onClick={toggleDrawer}
                            sx={{
                                mr: 2,
                                width: 52,
                                height: 52,
                                borderRadius: 0,
                                position: 'relative',
                                overflow: 'hidden',
                                background: readerMode
                                    ? isDrawerOpen
                                        ? colors.grays.gray400
                                        : colors.grays.gray200
                                    : 'rgba(0, 20, 40, 0.8)',
                                border: readerMode
                                    ? `1px solid ${colors.grays.gray500}`
                                    : `1px solid ${
                                          isDrawerOpen ? colors.neons.red.default : colors.neons.cyan.default
                                      }`,
                                color: readerMode
                                    ? colors.grays.gray000
                                    : isDrawerOpen
                                      ? colors.neons.red.default
                                      : colors.neons.cyan.default,
                                boxShadow: readerMode
                                    ? '0 2px 8px rgba(0,0,0,0.1)'
                                    : isDrawerOpen
                                      ? `0 0 15px ${colors.neons.red.default}60, inset 0 0 15px ${colors.neons.red.default}20`
                                      : `0 0 15px ${colors.neons.cyan.default}60, inset 0 0 15px ${colors.neons.cyan.default}20`,
                                // Corner accents
                                '&::before': readerMode
                                    ? {}
                                    : {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '8px',
                                          height: '8px',
                                          borderTop: `2px solid ${
                                              isDrawerOpen ? colors.neons.red.default : colors.neons.cyan.default
                                          }`,
                                          borderLeft: `2px solid ${
                                              isDrawerOpen ? colors.neons.red.default : colors.neons.cyan.default
                                          }`,
                                      },
                                '&::after': readerMode
                                    ? {}
                                    : {
                                          content: '""',
                                          position: 'absolute',
                                          bottom: 0,
                                          right: 0,
                                          width: '8px',
                                          height: '8px',
                                          borderBottom: `2px solid ${
                                              isDrawerOpen ? colors.neons.red.default : colors.neons.cyan.default
                                          }`,
                                          borderRight: `2px solid ${
                                              isDrawerOpen ? colors.neons.red.default : colors.neons.cyan.default
                                          }`,
                                      },
                                '&:hover': {
                                    background: readerMode
                                        ? isDrawerOpen
                                            ? colors.grays.gray500
                                            : colors.grays.gray300
                                        : `rgba(0, 40, 60, 0.9)`,
                                    boxShadow: readerMode
                                        ? '0 4px 12px rgba(0,0,0,0.15)'
                                        : isDrawerOpen
                                          ? `0 0 25px ${colors.neons.red.default}80, inset 0 0 20px ${colors.neons.red.default}30`
                                          : `0 0 25px ${colors.neons.cyan.default}80, inset 0 0 20px ${colors.neons.cyan.default}30`,
                                },
                                transition: 'all 0.3s ease-in-out',
                            }}
                        >
                            <CyberpunkHamburger
                                isOpen={isDrawerOpen}
                                color={
                                    readerMode
                                        ? colors.grays.gray000
                                        : isDrawerOpen
                                          ? colors.neons.red.default
                                          : colors.neons.cyan.default
                                }
                            />
                        </IconButton>
                    </Tooltip>

                    {isTauri() && <WindowButtons />}
                </Stack>
            </Drawer>
        </Box>
    )
}

export default NavigationDrawer
