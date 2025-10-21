import { Box, Drawer, Stack } from '@mui/material'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { useSession } from '../../state/sessionStore'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import WindowButtons from '../WindowButtons.tsx'
import DrawerButton from './DrawerButton'
import LogoButton from './LogoButton'

// Check if we're in a Tauri/desktop environment
const isTauri = () =>
    typeof window !== 'undefined' &&
    typeof (window as typeof window & { __TAURI__?: { core?: { invoke?: (...args: unknown[]) => unknown } } }).__TAURI__
        ?.core?.invoke === 'function'
const NavigationDrawer = () => {
    const { readerMode } = useUserPreferences()
    const { session, connected, role } = useSession()
    // For players, show as connected if they have a session (they're in the session)
    // For DMs, show as connected only when WebRTC is connected
    const isConnected = Boolean(session && (role === 'player' || connected))

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
                            zIndex: 10,
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
                        {Object.values(ModuleTypes).map((module) => (
                            <DrawerButton key={module} module={module} />
                        ))}
                    </Stack>
                    {isTauri() && <WindowButtons />}
                </Stack>
            </Drawer>
        </Box>
    )
}

export default NavigationDrawer
