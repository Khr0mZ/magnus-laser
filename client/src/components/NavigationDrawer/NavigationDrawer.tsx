import { Elderly } from '@mui/icons-material'
import { Avatar, Box, Button, Drawer, FormControlLabel, Stack, Typography } from '@mui/material'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import NavigationPaths from '../../navigation'
import colors from '../../utils/colors'
import { getModuleIcon } from '../../utils/functions.tsx'
import { ModuleTypes } from '../../utils/types'
import { flicker, glitch, neonColorCycle, severeGlitch } from '../common/Animations.tsx'

const NavigationDrawer = (): JSX.Element => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { t } = useTranslation()
    const { readerMode, toggleReaderMode } = useContext(ReaderModeContext)
    const [isHovered, setIsHovered] = useState(false)

    const pickColor = (navigationPath: NavigationPaths) => {
        return pathname.startsWith(navigationPath) ? colors.neons.cyan.default : colors.grays.gray700
    }

    const isActive = (navigationPath: NavigationPaths) => {
        return pathname.startsWith(navigationPath)
    }

    const drawerButton = (module: ModuleTypes) => {
        const navigationPath = NavigationPaths[module]
        const active = isActive(navigationPath)
        return (
            <Button
                key={module}
                disableRipple
                disableFocusRipple
                size={'large'}
                onClick={active ? undefined : () => navigate(navigationPath)}
                sx={{
                    color: pickColor(navigationPath),
                    position: 'relative',
                    ...(readerMode
                        ? {
                              // Reader mode button styles
                              '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              },
                              transition: 'all 0.2s',
                              // Apply active indicator in reader mode too
                              ...(active && {
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '2px',
                                      backgroundColor: colors.neons.pink.default,
                                  },
                              }),
                          }
                        : {
                              // Cyberpunk button styles
                              '&:hover': {
                                  animation: `${neonColorCycle} 3s linear infinite`,
                                  '& .MuiTypography-root': {
                                      position: 'relative',
                                      animation: `${neonColorCycle} 3s linear infinite`,
                                      '&::before': {
                                          content: 'attr(data-text)',
                                          position: 'absolute',
                                          left: -2,
                                          top: 0,
                                          opacity: 0.8,
                                          animation: `${glitch} 2s ease-out infinite alternate-reverse, ${neonColorCycle} 3s linear infinite`,
                                      },
                                      '&::after': {
                                          content: 'attr(data-text)',
                                          position: 'absolute',
                                          left: 2,
                                          top: 0,
                                          opacity: 0.8,
                                          animation: `${glitch} 3s ease-in infinite alternate, ${neonColorCycle} 3s linear infinite`,
                                      },
                                  },
                                  '& .icon-glitch': {
                                      animation: `${severeGlitch} 0.5s cubic-bezier(.25,.46,.45,.94) both infinite`,
                                      '&::after': {
                                          content: '""',
                                          position: 'absolute',
                                          top: -2,
                                          left: -2,
                                          right: -2,
                                          bottom: -2,
                                          background: `linear-gradient(45deg, ${colors.neons.pink.default}50 25%, transparent 25%, transparent 50%, ${colors.neons.cyan.default}50 50%, ${colors.neons.cyan.default}50 75%, transparent 75%, transparent)`,
                                          backgroundSize: '6px 6px',
                                          zIndex: -1,
                                          opacity: 0.5,
                                      },
                                  },
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: '100%',
                                      left: '0',
                                      width: '100%',
                                      height: '100%',
                                      background: `linear-gradient(to top, ${colors.neons.cyan.default}20, transparent)`,
                                      transform: 'perspective(20px) rotateX(40deg)',
                                      transformOrigin: 'top',
                                      opacity: 0.4,
                                      zIndex: -1,
                                      animation: `${neonColorCycle} 3s linear infinite`,
                                  },
                              },
                              transition: 'all 0.3s',
                              ...(active && {
                                  textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                  animation: `${flicker} 4s infinite`,
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '2px',
                                      backgroundColor: colors.neons.pink.default,
                                      boxShadow: `0 0 10px ${colors.neons.pink.default}`,
                                  },
                              }),
                          }),
                }}
            >
                <FormControlLabel
                    control={
                        <Box
                            className="icon-glitch"
                            sx={{
                                position: 'relative',
                                ...(readerMode
                                    ? {}
                                    : {
                                          '&::before': active
                                              ? {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: 'transparent',
                                                    boxShadow: `0 0 5px ${colors.neons.pink.default}`,
                                                    opacity: 0.5,
                                                    zIndex: -1,
                                                }
                                              : {},
                                          ...(active && {
                                              '&::after': {
                                                  content: '""',
                                                  position: 'absolute',
                                                  top: -2,
                                                  left: -2,
                                                  right: -2,
                                                  bottom: -2,
                                                  background: `radial-gradient(circle, ${colors.neons.cyan.default}30 0%, transparent 70%)`,
                                                  zIndex: -1,
                                                  opacity: 0.6,
                                              },
                                          }),
                                      }),
                            }}
                        >
                            {getModuleIcon(module, true)}
                        </Box>
                    }
                    label={
                        <Typography
                            variant={'caption'}
                            sx={{
                                position: 'relative',
                                transition: 'all 0.3s',
                                textTransform: 'uppercase',
                                ...(readerMode
                                    ? {}
                                    : {
                                          fontFamily: active ? '"Courier New", monospace' : 'inherit',
                                          letterSpacing: active ? '1px' : 'inherit',
                                          ...(active && {
                                              color: colors.neons.cyan.default,
                                              textShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                              '&::before': {
                                                  content: 'attr(data-text)',
                                                  position: 'absolute',
                                                  left: -2,
                                                  top: 0,
                                                  color: colors.neons.pink.default,
                                                  opacity: 0.8,
                                                  animation: `${glitch} 2s ease-out infinite alternate-reverse`,
                                              },
                                              '&::after': {
                                                  content: 'attr(data-text)',
                                                  position: 'absolute',
                                                  left: 2,
                                                  top: 0,
                                                  color: colors.neons.green.default,
                                                  opacity: 0.8,
                                                  animation: `${glitch} 3s ease-in infinite alternate`,
                                              },
                                          }),
                                      }),
                            }}
                            data-text={t(`modules.${module}`)}
                        >
                            {t(`modules.${module}`)}
                        </Typography>
                    }
                    labelPlacement={'bottom'}
                />
            </Button>
        )
    }

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
                    <Button
                        size={'large'}
                        disableRipple
                        disableFocusRipple
                        onClick={() => navigate(NavigationPaths.DASHBOARD)}
                        sx={{
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
                                          backgroundColor: 'rgba(0, 255, 139, 0.1)',
                                          '& .logo-glow': {
                                              opacity: 1,
                                              transform: 'scale(1.5)',
                                              filter: `drop-shadow(0 0 15px ${colors.neons.green.default})`,
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
                                          backgroundColor: colors.neons.green.default,
                                          boxShadow: `0 0 10px ${colors.neons.green.default}`,
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
                                    width: '40px',
                                    height: '40px',
                                    filter: `drop-shadow(0 0 0.5px ${colors.neons.cyan.default})`,
                                    transition: 'all 0.3s',
                                    transform: 'scale(1.5)',
                                }}
                            />
                        </Box>
                    </Button>
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
                        {Object.values(ModuleTypes).map((module) => drawerButton(module))}
                    </Stack>

                    {/* Reader Mode Toggle Button */}
                    <Button
                        size={'large'}
                        disableRipple
                        disableFocusRipple
                        onClick={toggleReaderMode}
                        sx={{
                            padding: '12px 16px',
                            minWidth: '70px',
                            borderRadius: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1,
                            ...(readerMode
                                ? {
                                      // Reader mode button style
                                      color: '#555',
                                      '&:hover': {
                                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                          '& svg': {
                                              transform: 'scale(1.1)',
                                          },
                                      },
                                      '& svg': {
                                          transition: 'transform 0.2s',
                                          width: 36,
                                          height: 36,
                                      },
                                  }
                                : {
                                      // Cyberpunk button style
                                      color: colors.neons.yellow.default,
                                      '&:hover': {
                                          backgroundColor: 'rgba(255, 255, 0, 0.1)',
                                          '& svg': {
                                              filter: `drop-shadow(0 0 5px ${colors.neons.yellow.default})`,
                                              animation: `${glitch} 1s ease infinite alternate`,
                                          },
                                          '&::after': {
                                              opacity: 1,
                                              width: '100%',
                                          },
                                      },
                                      '& svg': {
                                          filter: `drop-shadow(0 0 2px ${colors.neons.yellow.dark})`,
                                          width: 36,
                                          height: 36,
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
                                          backgroundColor: colors.neons.yellow.default,
                                          boxShadow: `0 0 10px ${colors.neons.yellow.default}`,
                                          opacity: 0,
                                          transition: 'all 0.3s ease-out',
                                      },
                                  }),
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {!readerMode ? (
                            <Elderly fontSize={'large'} />
                        ) : (
                            <Avatar
                                variant={'square'}
                                src={isHovered ? '/logoBlackTransparentEyes.png' : '/logoBlackTransparent.png'}
                                sx={{ width: 36, height: 36, opacity: isHovered ? 1 : 0.5, transition: 'all 0.3s' }}
                            />
                        )}
                        <Typography
                            variant="caption"
                            sx={{
                                mt: 0.5,
                                ...(readerMode
                                    ? {
                                          fontFamily: '"Orbitron", "Rajdhani", "Lexend", sans-serif',
                                          textTransform: 'uppercase',
                                      }
                                    : {}),
                            }}
                        >
                            {readerMode ? 'Chrome' : 'Flesh'}
                        </Typography>
                    </Button>
                </Stack>
            </Drawer>
        </Box>
    )
}

export default NavigationDrawer
