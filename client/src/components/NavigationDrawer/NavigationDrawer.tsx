import { Box, Drawer, Stack } from '@mui/material'
import { useContext } from 'react'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { DataButton } from './DataManagement'
import DrawerButton from './DrawerButton'
import LogoButton from './LogoButton'
import ReaderModeButton from './ReaderModeButton'

const NavigationDrawer = (): JSX.Element => {
    const { readerMode } = useContext(ReaderModeContext)

    return (
        <Box sx={{ mb: 11 }}>
            <Drawer
                open
                variant={'permanent'}
                anchor={'top'}
                PaperProps={{
                    sx: {
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

                <Stack direction={'row'} sx={{ bgcolor: 'transparent', position: 'relative', zIndex: 15 }}>
                    <LogoButton />
                    <Stack
                        direction={'row'}
                        sx={{
                            bgcolor: 'transparent',
                            flex: 1,
                            justifyContent: 'center',
                            ml: -6,
                            position: 'relative',
                        }}
                    >
                        {Object.values(ModuleTypes).map((module) => (
                            <DrawerButton key={module} module={module} />
                        ))}
                    </Stack>

                    {/* Export Data Button */}
                    <DataButton type="export" />

                    {/* Import Data Button */}
                    <DataButton type="import" />

                    {/* Reader Mode Toggle Button */}
                    <ReaderModeButton />
                </Stack>
            </Drawer>
        </Box>
    )
}

export default NavigationDrawer
