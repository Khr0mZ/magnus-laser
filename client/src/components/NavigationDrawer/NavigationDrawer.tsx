import { Elderly } from '@mui/icons-material'
import { Avatar, Box, Button, Drawer, FormControlLabel, keyframes, Stack, Typography } from '@mui/material'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import NavigationPaths from '../../navigation'
import colors from '../../utils/colors'
import { getModuleIcon } from '../../utils/functions.tsx'
import { ModuleTypes } from '../../utils/types'

// Define keyframe animations
const glitch = keyframes`
  0%, 100% { 
    transform: translate(0);
    text-shadow: -2px 0 ${colors.neons.cyan.default}, 2px 2px ${colors.neons.pink.default};
  }
  10% { 
    transform: translate(-3px, -2px);
    text-shadow: 2px -1px ${colors.neons.green.default}, -2px 2px ${colors.neons.blue.default};
  }
  20% { 
    transform: translate(3px, 2px);
    text-shadow: 2px 1px ${colors.neons.purple.default}, -1px -2px ${colors.neons.yellow.default};
  }
  30% { 
    transform: translate(-5px, -2px) skewX(10deg);
    text-shadow: -2px 0 ${colors.neons.red.default}, 2px 2px ${colors.neons.cyan.default};
  }
  40% { 
    transform: translate(0px, 0px) skewX(0);
    text-shadow: 0 0 ${colors.neons.green.default}, 0 0 ${colors.neons.cyan.default};
  }
  50% { 
    transform: translate(0px, 0px) skewX(-5deg);
    text-shadow: 2px 2px ${colors.neons.purple.default}, -2px -2px ${colors.neons.green.default};
  }
  60% { 
    transform: translateX(4px);
    text-shadow: 0 0 ${colors.neons.cyan.default}, 0 0 ${colors.neons.cyan.default};
  }
  70% { 
    transform: translate(-3px, 2px) skewX(15deg);
    text-shadow: 2px -1px ${colors.neons.pink.default}, -2px 2px ${colors.neons.green.default};
  }
  80% { 
    transform: translate(0px, 0px) skewX(0);
    text-shadow: -2px 0 ${colors.neons.green.default}, 2px 2px ${colors.neons.pink.default};
  }
  90% { 
    transform: translate(3px, -3px) skewY(3deg);
    text-shadow: -2px 0 ${colors.neons.cyan.default}, 2px 2px ${colors.neons.purple.default};
  }
`

const severeGlitch = keyframes`
  0% {
    clip-path: inset(40% 0 61% 0);
    transform: translate(-10px, 5px);
  }
  20% {
    clip-path: inset(92% 0 1% 0);
    transform: translate(10px, -3px) skewX(-15deg);
  }
  40% {
    clip-path: inset(43% 0 1% 0);
    transform: translate(2px, 10px);
  }
  60% {
    clip-path: inset(25% 0 58% 0);
    transform: translate(-15px, -2px) skewY(8deg);
  }
  80% {
    clip-path: inset(54% 0 7% 0);
    transform: translate(15px, -5px) skewX(25deg);
  }
  100% {
    clip-path: inset(58% 0 43% 0);
    transform: translate(-7px, 3px);
  }
`

const dataCorruption = keyframes`
  0% {
    opacity: 0.8;
    transform: translate(0, 0) skew(0deg);
    text-shadow: 0 0 0;
    clip-path: none;
  }
  5% {
    opacity: 0.1;
    transform: translate(-10px, 0) skew(-20deg);
    text-shadow: 5px 0 ${colors.neons.green.default};
    clip-path: inset(0 0 0 0);
  }
  10% {
    opacity: 0.8;
    transform: translate(0, 0) skew(0deg);
    text-shadow: 0 0 0;
    clip-path: none;
  }
  15% {
    opacity: 1;
    transform: translate(5px, 0) skew(10deg);
    text-shadow: -5px 0 ${colors.neons.pink.default};
    clip-path: inset(30% 0 0 0);
  }
  20%, 100% {
    opacity: 1;
    transform: translate(0, 0) skew(0deg);
    text-shadow: 0 0 0;
    clip-path: none;
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

const dataStream = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 0% 100%;
  }
`

const neonColorCycle = keyframes`
  0% {
    color: ${colors.neons.cyan.default};
    text-shadow: 0 0 10px ${colors.neons.cyan.default};
  }
  20% {
    color: ${colors.neons.pink.default};
    text-shadow: 0 0 10px ${colors.neons.pink.default};
  }
  40% {
    color: ${colors.neons.green.default};
    text-shadow: 0 0 10px ${colors.neons.green.default};
  }
  60% {
    color: ${colors.neons.purple.default};
    text-shadow: 0 0 10px ${colors.neons.purple.default};
  }
  80% {
    color: ${colors.neons.yellow.default};
    text-shadow: 0 0 10px ${colors.neons.yellow.default};
  }
  100% {
    color: ${colors.neons.cyan.default};
    text-shadow: 0 0 10px ${colors.neons.cyan.default};
  }
`

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
                                      backgroundColor: '#1976d2',
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
                                          animation: `${digitalNoise} 3s linear infinite`,
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
                                      backgroundColor: colors.neons.cyan.default,
                                      boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                  },
                              }),
                          }),
                }}
                title={t(`modules.${module}`)}
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
                                                  animation: `${digitalNoise} 4s ease infinite`,
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
                                              animation: `${dataCorruption} 8s ease-in-out infinite`,
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
        <Drawer
            open
            variant={'permanent'}
            anchor={'top'}
            PaperProps={{
                sx: {
                    ...(readerMode
                        ? {
                              // Reader mode drawer styles
                              backgroundColor: '#fff',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              borderBottom: '1px solid #e0e0e0',
                              position: 'relative',
                              zIndex: 10,
                          }
                        : {
                              // Cyberpunk drawer styles
                              backgroundImage: `linear-gradient(to right, ${colors.cyberpunk.darkBg}, ${colors.cyberpunk.matrixBg})`,
                              boxShadow: `0 0 15px ${colors.neons.cyan.dark}`,
                              borderBottom: `1px solid ${colors.neons.cyan.default}`,
                              position: 'relative',
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
                          }),
                },
            }}
        >
            {!readerMode && (
                <>
                    {/* Digital circuit pattern in background */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 4,
                            opacity: 0.08,
                            backgroundImage: `
                                radial-gradient(${colors.neons.cyan.default}30 1px, transparent 1px),
                                linear-gradient(to right, ${colors.neons.cyan.default}10 1px, transparent 1px),
                                linear-gradient(to bottom, ${colors.neons.cyan.default}10 1px, transparent 1px)
                            `,
                            backgroundSize: '20px 20px, 10px 10px, 10px 10px',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Data corruption glitches that randomly appear */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 12,
                            opacity: 0.4,
                            background: `linear-gradient(90deg, transparent 5%, ${colors.neons.pink.default}40 5%, ${colors.neons.pink.default}40 7%, transparent 7%, transparent 92%, ${colors.neons.cyan.default}40 92%, ${colors.neons.cyan.default}40 95%, transparent 95%)`,
                            backgroundSize: '300% 100%',
                            animation: `${severeGlitch} 10s steps(1) infinite`,
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Data stream effect in the background */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 5,
                            opacity: 0.05,
                            backgroundImage: `linear-gradient(0deg, transparent 24%, 
                                ${colors.cyberpunk.datastream} 25%, 
                                ${colors.cyberpunk.datastream} 26%, 
                                transparent 27%, transparent 74%, 
                                ${colors.cyberpunk.datastream} 75%, 
                                ${colors.cyberpunk.datastream} 76%, transparent 77%, transparent)`,
                            backgroundSize: '100% 4px',
                            animation: `${dataStream} 30s linear infinite`,
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}

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
                    title={t('modules.DASHBOARD')}
                >
                    <Box
                        style={{
                            position: 'relative',
                            width: '40px',
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
                                position: 'absolute',
                                ...(readerMode
                                    ? {
                                          transform: 'scale(1.5)',
                                      }
                                    : {
                                          filter: `drop-shadow(0 0 5px ${colors.neons.green.dark})`,
                                          transition: 'all 0.3s',
                                          transform: 'scale(1.5)',
                                          '&::before': {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              background: 'transparent',
                                              zIndex: -1,
                                              opacity: 0.5,
                                          },
                                          '&::after': {
                                              content: '""',
                                              position: 'absolute',
                                              top: -5,
                                              left: -5,
                                              width: 'calc(100% + 10px)',
                                              height: 'calc(100% + 10px)',
                                              border: `1px solid ${colors.neons.green.default}50`,
                                              zIndex: -1,
                                              opacity: 0,
                                              transition: 'all 0.3s',
                                          },
                                      }),
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
                        ...(readerMode
                            ? {}
                            : {
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: '50%',
                                      left: 0,
                                      width: '100%',
                                      height: '1px',
                                      backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                      boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                  },
                              }),
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
                    title={readerMode ? 'Switch to Chrome Mode' : 'Switch to Flesh Mode'}
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
    )
}

export default NavigationDrawer
