import { Avatar, Box, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import NavigationPaths from '../../navigation'
import colors from '../../utils/colors'
import { pulseGlowGreen, pulseGlowRed, severeGlitch } from '../common/Animations.tsx'

export interface LogoButtonProps {
    isConnected?: boolean
}

const LogoButton = ({ isConnected = false }: LogoButtonProps) => {
    const navigate = useNavigate()
    const { readerMode } = useUserPreferences()

    return (
        <Button
            size={'large'}
            disableRipple
            disableFocusRipple
            onClick={() => navigate(NavigationPaths.DASHBOARD)}
            sx={{
                minHeight: '78px',
                padding: '12px 16px',
                minWidth: '70px',
                borderRadius: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                ...(readerMode
                    ? {
                          // Reader mode button style
                          '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                      }
                    : {
                          // Cyberpunk button style
                          '&:hover': {
                              backgroundColor: 'rgba(0, 255, 255, 0.1)',
                              '& .logo-glow': {
                                  opacity: 1,
                                  transform: 'scale(1.5)',
                                  filter: `drop-shadow(0 0 15px ${colors.neons.blue.default})`,
                                  animation: `${severeGlitch} 0.5s ease infinite`,
                              },
                              '&::after': {
                                  opacity: 1,
                                  width: '100%',
                              },
                          },
                          transition: 'all 0.3s',
                          position: 'relative',
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '0%',
                              height: '2px',
                              backgroundColor: colors.neons.pink.default,
                              boxShadow: `0 0 10px ${colors.neons.pink.default}`,
                              opacity: 0,
                              transition: 'all 0.3s ease-out',
                          },
                      }),
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Avatar
                    variant={'square'}
                    src={'/magnusLaserLogo.png'}
                    alt="Logo"
                    className="logo-glow"
                    sx={{
                        width: '50px',
                        height: '50px',
                        filter: `drop-shadow(0 0 0.5px ${colors.neons.cyan.default})`,
                        transition: 'all 0.3s',
                        transform: 'scale(1.5)',
                    }}
                />
                {/* Connected indicator */}
                <Box
                    className="logo-glow"
                    sx={{
                        position: 'absolute',
                        top: 'calc(50% - 5px)',
                        right: 'calc(50% - 5px)',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isConnected ? colors.neons.green.default : colors.neons.orange.default,
                        border: `1px solid ${isConnected ? colors.neons.green.light : colors.neons.orange.light}`,
                        boxShadow: isConnected
                            ? `0 0 8px ${colors.neons.green.default}, 0 0 16px ${colors.neons.green.light}60`
                            : `0 0 4px ${colors.neons.orange.default}80`,
                        animation: readerMode
                            ? 'none'
                            : isConnected
                            ? `${pulseGlowGreen} 2s infinite`
                            : `${pulseGlowRed} 3s infinite`,
                        transition: 'all 0.3s ease-in-out',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isConnected ? colors.neons.green.light : colors.neons.orange.light,
                            transform: 'translate(-50%, -50%)',
                            opacity: 0.8,
                        },
                    }}
                />
            </Box>
        </Button>
    )
}

export default LogoButton
