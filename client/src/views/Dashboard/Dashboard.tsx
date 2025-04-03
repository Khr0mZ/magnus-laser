import { Box, Card, CardContent, Container, Grid, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
    flicker,
    glitch,
    neonColorCycle,
    neonPulse,
    pulseGlowCyan,
    severeGlitch,
} from '../../components/common/Animations.tsx'
import { ReaderModeContext } from '../../contexts/ReaderModeContext.tsx'
import NavigationPaths from '../../navigation.ts'
import colors from '../../utils/colors.ts'
import { ModuleTypes } from '../../utils/constants'
import { getModuleIcon } from '../../utils/functions.tsx'

const Dashboard = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    useDocumentTitle(`Magnus Laser - ${t('modules.DASHBOARD')}`)

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
                                animation: readerMode ? 'none' : `${pulseGlowCyan} 2s infinite`,
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
                                    backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                                    backdropFilter: 'blur(5px)',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    variant="h4"
                                    className="card-title"
                                    data-text={t(`modules.${module}`)}
                                    sx={{
                                        color: colors.neons.cyan.default,
                                        transition: 'all 0.3s',
                                        textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
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
                                            background: `linear-gradient(to right, transparent, ${colors.neons.yellow.default}, transparent)`,
                                            boxShadow: `0 0 5px ${colors.neons.yellow.default}`,
                                        },
                                        '&::before': {
                                            content: 'attr(data-text)',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            color: readerMode ? colors.grays.gray900 : colors.neons.blue.default,
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
                                        border: `1px solid ${colors.neons.cyan.default}50`,
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
                                        border: `1px solid ${colors.neons.cyan.default}50`,
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
