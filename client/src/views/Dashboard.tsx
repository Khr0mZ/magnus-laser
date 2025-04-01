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

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 3 }}>
                {Object.values(ModuleTypes).map((module) => (
                    <Grid item xs={12} md={6} lg={6} xl={6} xxl={4} key={module}>
                        <Card
                            onClick={() => {
                                navigate(NavigationPaths[module])
                            }}
                            sx={{
                                position: 'relative',
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
                                        textShadow: readerMode ? `0 0 2px rgba(0,0,0,0.2)` : `0 0 3px rgba(0,0,0,0.9)`,
                                        fontWeight: 500,
                                    },
                                    '& .card-glitch-overlay': {
                                        opacity: readerMode ? 0.1 : 0.15,
                                    },
                                    '& .card-scanlines': {
                                        opacity: readerMode ? 0.1 : 0.3,
                                    },
                                    '& .data-corruption': {
                                        opacity: readerMode ? 0.7 : 1,
                                    },
                                    '&::before': {
                                        opacity: readerMode ? 0.3 : 0.5,
                                        background: readerMode ? 'rgba(200, 250, 250, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                    },
                                },
                            }}
                        >
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
                                    backgroundColor: readerMode ? 'rgba(50, 50, 255, 0.1)' : 'rgba(5, 7, 24, 0.6)',
                                    backdropFilter: 'blur(5px)',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    variant="h4"
                                    className="card-title"
                                    data-text={t(`modules.${module}`)}
                                    sx={{
                                        color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
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
                                                readerMode ? colors.grays.gray900 : colors.neons.green.default
                                            }`,
                                        },
                                        '&::before': {
                                            content: 'attr(data-text)',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            color: readerMode ? colors.grays.gray900 : colors.neons.green.default,
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
                                        background: readerMode ? colors.neons.blue.dark : 'transparent',
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
        </Container>
    )
}

export default Dashboard
