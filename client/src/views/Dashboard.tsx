import { Box, Card, CardContent, Container, Grid, Typography, keyframes } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ReaderModeContext } from '../contexts/ReaderModeContext'
import NavigationPaths from '../navigation'
import colors from '../utils/colors'
import { getModuleIcon } from '../utils/functions.tsx'
import { ModuleTypes } from '../utils/types'

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

const neonPulse = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
    border-color: ${colors.neons.cyan.default}80;
  }
  25% {
    box-shadow: 0 0 10px ${colors.neons.pink.default}, 0 0 20px ${colors.neons.pink.default}40;
    border-color: ${colors.neons.pink.default}80;
  }
  50% {
    box-shadow: 0 0 15px ${colors.neons.green.default}, 0 0 25px ${colors.neons.green.default}40;
    border-color: ${colors.neons.green.default}80;
  }
  75% {
    box-shadow: 0 0 10px ${colors.neons.purple.default}, 0 0 20px ${colors.neons.purple.default}40;
    border-color: ${colors.neons.purple.default}80;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
    border-color: ${colors.neons.cyan.default}80;
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

const scanlineAnimation = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 100%;
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

const circuitFlow = keyframes`
  0% {
    opacity: 0.1;
    background-position: 0% 0%;
  }
  15% {
    opacity: 0.2;
  }
  30% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.5;
    background-position: 100% 100%;
  }
  70% {
    opacity: 0.3;
  }
  85% {
    opacity: 0.2;
  }
  100% {
    opacity: 0.1;
    background-position: 0% 0%;
  }
`

// New animation for random glitches
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
    opacity: 0.7;
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}50;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 10px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}50;
  }
  100% {
    opacity: 0.7;
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}50;
  }
`

const Dashboard = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    useDocumentTitle(`RNG Manager - ${t('modules.DASHBOARD')}`)

    return (
        <Container maxWidth={false}>
            <Box
                sx={{
                    position: 'relative',
                    mb: 4,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-10px',
                        left: 0,
                        width: '100%',
                        height: '1px',
                        background: `linear-gradient(to right, transparent, ${colors.neons.cyan.default}, transparent)`,
                        boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    },
                }}
            >
                <Typography
                    variant="h1"
                    className="glitch-text"
                    data-text={t('modules.DASHBOARD')}
                    sx={{
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    }}
                >
                    {t('modules.DASHBOARD')}
                </Typography>
                <Typography
                    variant="h2"
                    sx={{
                        color: colors.neons.green.default,
                        textShadow: `0 0 8px ${colors.neons.green.default}`,
                    }}
                >
                    {t('dashboard.welcome')}
                </Typography>
                <Typography
                    variant="h3"
                    sx={{
                        color: colors.grays.gray700,
                        mt: 1,
                    }}
                >
                    {t('dashboard.description')}
                </Typography>
            </Box>

            <Box
                className="grid-bg"
                sx={{
                    padding: 2,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: readerMode ? 'rgba(240, 245, 250, 0.85)' : 'rgba(5, 7, 24, 0.95)',
                    border: `1px solid ${readerMode ? 'rgba(100, 180, 200, 0.3)' : `${colors.neons.cyan.default}40`}`,
                    // Digital grid effect
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(0deg, 
                            ${readerMode ? 'rgba(200, 220, 240, 0.1)' : colors.cyberpunk.scanline} 25%, 
                            transparent 25%, 
                            transparent 50%, 
                            ${readerMode ? 'rgba(200, 220, 240, 0.1)' : colors.cyberpunk.scanline} 50%, 
                            ${readerMode ? 'rgba(200, 220, 240, 0.1)' : colors.cyberpunk.scanline} 75%, 
                            transparent 75%, 
                            transparent)`,
                        backgroundSize: '100% 4px',
                        opacity: readerMode ? 0.2 : 0.3,
                        animation: `${scanlineAnimation} 10s linear infinite`,
                        pointerEvents: 'none',
                        zIndex: 0,
                    },
                    // Add bright background grid
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `
                            radial-gradient(${
                                readerMode ? 'rgba(100, 150, 180, 0.3)' : `${colors.neons.cyan.default}30`
                            } 0.5px, transparent 0.5px),
                            linear-gradient(to right, ${
                                readerMode ? 'rgba(100, 150, 180, 0.2)' : `${colors.neons.cyan.default}20`
                            } 0.5px, transparent 0.5px),
                            linear-gradient(to bottom, ${
                                readerMode ? 'rgba(100, 150, 180, 0.2)' : `${colors.neons.cyan.default}20`
                            } 0.5px, transparent 0.5px)
                        `,
                        backgroundSize: '20px 20px, 10px 10px, 10px 10px',
                        opacity: readerMode ? 0.3 : 0.1,
                        zIndex: 0,
                        pointerEvents: 'none',
                    },
                }}
            >
                {/* Power Lines - visible in both modes with different styles */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '10%',
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: readerMode ? 'rgba(0, 100, 100, 0.3)' : colors.neons.green.default,
                        opacity: readerMode ? 0.2 : 0.5,
                        animation: readerMode ? 'none' : `${powerLines} 3s ease-in-out infinite`,
                        boxShadow: readerMode
                            ? 'none'
                            : `0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}50`,
                        zIndex: 1,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: '40%',
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: readerMode ? 'rgba(0, 100, 150, 0.3)' : colors.neons.cyan.default,
                        opacity: readerMode ? 0.2 : 0.5,
                        animation: readerMode ? 'none' : `${powerLines} 4s ease-in-out infinite`,
                        boxShadow: readerMode
                            ? 'none'
                            : `0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}50`,
                        zIndex: 1,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: '70%',
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: readerMode ? 'rgba(100, 100, 150, 0.3)' : colors.neons.pink.default,
                        opacity: readerMode ? 0.2 : 0.5,
                        animation: readerMode ? 'none' : `${powerLines} 5s ease-in-out infinite`,
                        boxShadow: readerMode
                            ? 'none'
                            : `0 0 5px ${colors.neons.pink.default}, 0 0 10px ${colors.neons.pink.default}50`,
                        zIndex: 1,
                    }}
                />

                {/* Random glitch blocks - only visible in cyberpunk mode */}
                {!readerMode && (
                    <>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '20%',
                                left: '15%',
                                width: '50px',
                                height: '20px',
                                backgroundColor: colors.neons.pink.default,
                                opacity: 0,
                                animation: `${randomGlitch} 7s infinite`,
                                zIndex: 2,
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '60%',
                                right: '25%',
                                width: '30px',
                                height: '30px',
                                backgroundColor: colors.neons.green.default,
                                opacity: 0,
                                animation: `${randomGlitch} 10s infinite`,
                                zIndex: 2,
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '30%',
                                left: '40%',
                                width: '40px',
                                height: '15px',
                                backgroundColor: colors.neons.cyan.default,
                                opacity: 0,
                                animation: `${randomGlitch} 8s infinite 2s`,
                                zIndex: 2,
                            }}
                        />
                    </>
                )}

                <Grid container spacing={3} sx={{ position: 'relative', zIndex: 3 }}>
                    {Object.values(ModuleTypes).map((module) => (
                        <Grid item xs={12} md={6} lg={6} xl={6} xxl={4} key={module}>
                            <Card
                                onClick={() => {
                                    navigate(NavigationPaths[module])
                                }}
                                sx={{
                                    position: 'relative',
                                    backgroundColor: readerMode ? 'rgba(240, 242, 245, 0.9)' : 'rgba(5, 7, 24, 0.85)',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    height: '100%',
                                    border: readerMode
                                        ? '1px solid rgba(0, 180, 180, 0.2)'
                                        : '1px solid rgba(0, 255, 255, 0.2)',
                                    backdropFilter: 'blur(5px)',
                                    boxShadow: readerMode
                                        ? '0 0 15px rgba(0, 80, 80, 0.1)'
                                        : '0 0 15px rgba(0, 255, 255, 0.1)',
                                    '&:hover': {
                                        transform: 'translateY(-8px) scale(1.02)',
                                        animation: `${neonPulse} 2s infinite`,
                                        cursor: 'pointer',
                                        '& .card-icon': {
                                            opacity: 0.4,
                                            filter: `drop-shadow(0 0 ${readerMode ? '10px' : '20px'} ${
                                                colors.neons.cyan.default
                                            })`,
                                            animation: `${flicker} 4s infinite, ${neonColorCycle} 5s infinite`,
                                        },
                                        '& .card-title': {
                                            animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                                            color: colors.neons.cyan.default,
                                            textShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 15px rgba(0,0,0,0.5)`,
                                            fontWeight: 700,
                                        },
                                        '& .card-description': {
                                            color: readerMode ? colors.neons.green.dark : colors.neons.green.light,
                                            textShadow: readerMode
                                                ? `0 0 3px ${colors.neons.green.light}, 0 0 5px rgba(0,0,0,0.2)`
                                                : `0 0 3px ${colors.neons.green.dark}, 0 0 5px rgba(0,0,0,0.9)`,
                                            fontWeight: 600,
                                            animation: `${neonColorCycle} 8s linear infinite`,
                                        },
                                        '& .card-subdescription': {
                                            color: colors.grays.gray900,
                                            textShadow: readerMode
                                                ? `0 0 2px rgba(0,0,0,0.2)`
                                                : `0 0 3px rgba(0,0,0,0.9)`,
                                            fontWeight: 500,
                                        },
                                        '& .card-glitch-overlay': {
                                            opacity: readerMode ? 0.1 : 0.15,
                                        },
                                        '& .card-scanlines': {
                                            opacity: readerMode ? 0.1 : 0.3,
                                        },
                                        '& .card-circuit': {
                                            opacity: readerMode ? 0.1 : 0.25,
                                            animation: `${circuitFlow} 8s ease-in-out infinite`,
                                        },
                                        '& .data-corruption': {
                                            opacity: readerMode ? 0.7 : 1,
                                        },
                                        '&::before': {
                                            opacity: readerMode ? 0.3 : 0.5,
                                            background: readerMode ? 'rgba(200, 250, 250, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                        },
                                    },
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '3px',
                                        background: `linear-gradient(to right, ${colors.neons.green.default}, ${colors.neons.cyan.default})`,
                                        boxShadow: `0 0 ${readerMode ? '8px' : '15px'} ${colors.neons.cyan.default}`,
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: readerMode
                                            ? 'rgba(200, 255, 255, 0.05)'
                                            : 'rgba(0, 255, 255, 0.05)',
                                        opacity: 0,
                                        transition: 'opacity 0.3s',
                                        zIndex: 0,
                                    },
                                }}
                            >
                                {/* Digital circuit background */}
                                <Box
                                    className="card-circuit"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `
                                            radial-gradient(${colors.neons.cyan.default}40 1px, transparent 1px),
                                            linear-gradient(to right, ${colors.neons.cyan.default}20 1px, transparent 1px),
                                            linear-gradient(to bottom, ${colors.neons.cyan.default}20 1px, transparent 1px)
                                        `,
                                        backgroundSize: '20px 20px, 10px 10px, 10px 10px',
                                        opacity: 0.1,
                                        zIndex: 1,
                                        transition: 'all 0.5s',
                                    }}
                                />

                                {/* Scanlines effect */}
                                <Box
                                    className="card-scanlines"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `linear-gradient(0deg, 
                                            rgba(255, 255, 255, 0.03) 25%, 
                                            transparent 25%, 
                                            transparent 50%, 
                                            rgba(255, 255, 255, 0.03) 50%, 
                                            rgba(255, 255, 255, 0.03) 75%, 
                                            transparent 75%, 
                                            transparent)`,
                                        backgroundSize: '100% 4px',
                                        opacity: 0.1,
                                        zIndex: 2,
                                        transition: 'opacity 0.5s',
                                        pointerEvents: 'none',
                                    }}
                                />

                                {/* Glitch overlay */}
                                <Box
                                    className="card-glitch-overlay"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: `linear-gradient(45deg, 
                                            ${colors.neons.pink.default}10 25%, 
                                            transparent 25%, 
                                            transparent 50%, 
                                            ${colors.neons.cyan.default}10 50%, 
                                            ${colors.neons.cyan.default}10 75%, 
                                            transparent 75%, 
                                            transparent)`,
                                        backgroundSize: '6px 6px',
                                        opacity: 0,
                                        zIndex: 2,
                                        transition: 'opacity 0.3s',
                                        pointerEvents: 'none',
                                    }}
                                />

                                {/* Data corruption glitches that appear on hover */}
                                <Box
                                    className="data-corruption"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        zIndex: 3,
                                        transition: 'opacity 0.3s',
                                        pointerEvents: 'none',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: Math.random() * 100 + '%',
                                            left: 0,
                                            width: '100%',
                                            height: '1px',
                                            backgroundColor: colors.neons.cyan.default,
                                            opacity: 0.8,
                                            animation: `${severeGlitch} 3s infinite`,
                                        },
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            top: Math.random() * 100 + '%',
                                            left: 0,
                                            width: '100%',
                                            height: '1px',
                                            backgroundColor: colors.neons.pink.default,
                                            opacity: 0.8,
                                            animation: `${severeGlitch} 2s infinite`,
                                        },
                                    }}
                                />

                                {/* Data stream effect */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '30%',
                                        width: '1px',
                                        height: '100%',
                                        opacity: 0.2,
                                        backgroundImage: `linear-gradient(0deg, transparent 20%, 
                                            ${colors.neons.cyan.default} 40%, 
                                            ${colors.neons.cyan.default} 60%, 
                                            transparent 80%)`,
                                        backgroundSize: '1px 20px',
                                        animation: `${dataStream} 3s linear infinite`,
                                        zIndex: 2,
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '70%',
                                        width: '1px',
                                        height: '100%',
                                        opacity: 0.2,
                                        backgroundImage: `linear-gradient(0deg, transparent 10%, 
                                            ${colors.neons.green.default} 30%, 
                                            ${colors.neons.green.default} 70%, 
                                            transparent 90%)`,
                                        backgroundSize: '1px 30px',
                                        animation: `${dataStream} 4s linear infinite`,
                                        zIndex: 2,
                                    }}
                                />

                                {/* Random vertical glitch lines */}
                                <Box
                                    className="glitch-line"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '30%',
                                        width: '2px',
                                        height: '100%',
                                        backgroundColor: colors.neons.cyan.default,
                                        opacity: 0,
                                        animation: `${randomGlitch} 5s infinite 1s`,
                                        zIndex: 2,
                                    }}
                                />

                                <Box
                                    className="glitch-line"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: '20%',
                                        width: '3px',
                                        height: '100%',
                                        backgroundColor: colors.neons.pink.default,
                                        opacity: 0,
                                        animation: `${randomGlitch} 7s infinite 2s`,
                                        zIndex: 2,
                                    }}
                                />

                                <Box
                                    className="card-icon"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: colors.neons.green.default,
                                        transition: 'all 0.5s',
                                        opacity: 0.15,
                                        zIndex: 3,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                >
                                    {getModuleIcon(module, false, false)}
                                </Box>
                                <CardContent
                                    sx={{
                                        minHeight: '200px',
                                        position: 'relative',
                                        zIndex: 4,
                                        padding: 3,
                                        backgroundColor: readerMode
                                            ? 'rgba(240, 242, 245, 0.85)'
                                            : 'rgba(5, 7, 24, 0.6)',
                                        backdropFilter: 'blur(5px)',
                                        height: '100%',
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        className="card-title"
                                        data-text={t(`modules.${module}`)}
                                        sx={{
                                            color: readerMode ? colors.grays.gray900 : colors.neons.green.default,
                                            transition: 'all 0.3s',
                                            textShadow: `0 0 5px ${colors.neons.green.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                                            mb: 3,
                                            textAlign: 'center',
                                            fontSize: '1.7rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            position: 'relative',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: '-10px',
                                                left: '25%',
                                                width: '50%',
                                                height: '1px',
                                                background: `linear-gradient(to right, transparent, ${
                                                    readerMode ? colors.grays.gray900 : colors.neons.green.default
                                                }, transparent)`,
                                                boxShadow: `0 0 5px ${
                                                    readerMode ? colors.grays.gray000 : colors.neons.green.default
                                                }`,
                                            },
                                            '&::before': {
                                                content: 'attr(data-text)',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                width: '100%',
                                                height: '100%',
                                                color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                                                opacity: readerMode ? 1 : 0.5,
                                                filter: readerMode ? 'none' : 'blur(1px)',
                                                animation: readerMode ? 'none' : `${severeGlitch} 5s infinite`,
                                                display: 'block',
                                            },
                                            '&:hover::before': {
                                                opacity: readerMode ? 1 : 0.7,
                                            },
                                        }}
                                    >
                                        {t(`modules.${module}`)}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        className="card-description"
                                        sx={{
                                            color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                            fontSize: '1.1rem',
                                            textAlign: 'center',
                                            px: 2,
                                            fontWeight: 500,
                                            textShadow: readerMode ? 'none' : '0 0 2px rgba(0,0,0,0.5)',
                                            position: 'relative',
                                            zIndex: 5,
                                            background: 'rgba(10, 15, 30, 0.5)',
                                            borderRadius: '4px',
                                            py: 1,
                                            mx: 'auto',
                                            width: '90%',
                                            border: readerMode
                                                ? `1px solid rgba(0, 150, 150, 0.2)`
                                                : `1px solid ${colors.neons.green.default}20`,
                                        }}
                                    >
                                        {t('dashboard.createRandom', { module: t(`modules.${module}`).toLowerCase() })}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        className="card-subdescription"
                                        sx={{
                                            mt: 3,
                                            fontSize: '1rem',
                                            textAlign: 'center',
                                            px: 2,
                                            position: 'relative',
                                            zIndex: 5,
                                            fontWeight: 400,
                                            letterSpacing: '0.03em',
                                            py: 1,
                                            backdropFilter: 'blur(3px)',
                                            border: readerMode
                                                ? `1px solid rgba(0, 150, 150, 0.2)`
                                                : `1px solid ${colors.neons.green.default}20`,
                                            color: readerMode ? colors.grays.gray900 : colors.grays.gray900,
                                            background: readerMode ? colors.grays.gray000 : 'transparent',
                                        }}
                                    >
                                        {module === ModuleTypes.GANG && t('dashboard.gangDescription')}
                                        {module === ModuleTypes.BUILDING && t('dashboard.buildingDescription')}
                                        {module === ModuleTypes.CORPORATION && t('dashboard.corporationDescription')}
                                        {module === ModuleTypes.FIXER_JOB && t('dashboard.fixerJobDescription')}
                                        {module === ModuleTypes.NPC && t('dashboard.npcDescription')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    )
}

export default Dashboard
