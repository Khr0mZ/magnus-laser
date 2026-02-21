import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Close from '@mui/icons-material/Close'
import RestartAlt from '@mui/icons-material/RestartAlt'
import WarningAmber from '@mui/icons-material/WarningAmber'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import CustomScrollbar from '../../../components/CustomScrollbar'
import CyberpunkFormControl from '../../../components/CyberpunkFormControl'
import { pulseGlowBlue, pulseGlowCyan } from '../../../components/common/Animations'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type {
    NetrunCheckType,
    QDNetrunCheck,
    QDNetrunSession,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { getKV, KV_KEYS, setKV } from '../../../utils/db'
import { getArchitectureSize, getChecksForFloors } from '../../../utils/generators/soloPlayUtils'
import { rollD10 } from '../../../utils/generators/soloPlayTables'

const QDNetrunPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const textFieldOutlinedStyle = {
        '& .MuiOutlinedInput-root': {
            color: readerMode ? '#333' : '#fff',
            '& fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
            },
        },
        '& .MuiInputLabel-root': {
            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
            borderRadius: '4px',
            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
            p: 0.5,
            py: 0.25,
            border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
        },
        '&:hover .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
    }

    const selectStyle = {
        color: readerMode ? '#333' : '#fff',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
        },
        '& .MuiSvgIcon-root': {
            color: readerMode ? 'rgba(0, 0, 0, 0.54)' : '#fff',
        },
    }

    // Session state
    const [session, setSession] = useState<QDNetrunSession | null>(null)

    // Setup dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [sessionName, setSessionName] = useState('')
    const [location, setLocation] = useState('')
    const [goal, setGoal] = useState('')
    const [floors, setFloors] = useState(4)
    const [programs, setPrograms] = useState<string[]>([])
    const [newProgramName, setNewProgramName] = useState('')

    // Check setup state
    const [checkDialogOpen, setCheckDialogOpen] = useState(false)
    const [currentCheckType, setCurrentCheckType] = useState<NetrunCheckType>('PASSWORD')
    const [currentCheckDescription, setCurrentCheckDescription] = useState('')
    const [currentCheckDV, setCurrentCheckDV] = useState(6)
    const [currentCheckOpposed, setCurrentCheckOpposed] = useState(10)
    const [playerSkillTotal, setPlayerSkillTotal] = useState(14)

    // Load persisted session on mount
    useEffect(() => {
        getKV<QDNetrunSession>(KV_KEYS.qdNetrunSession).then((data) => {
            if (data) setSession(data)
        })
    }, [])

    // Persist session to IndexedDB on change
    useEffect(() => {
        setKV(KV_KEYS.qdNetrunSession, session)
    }, [session])

    const handleStartNetrun = () => {
        if (!sessionName.trim() || !location.trim() || !goal.trim()) return
        const numChecks = getChecksForFloors(floors)
        const newSession: QDNetrunSession = {
            id: uuidv4(),
            name: sessionName,
            location,
            goal,
            architectureSize: getArchitectureSize(floors),
            floors,
            numberOfChecks: numChecks,
            checks: [],
            currentCheck: 0,
            isComplete: false,
            success: false,
            successCount: 0,
            failureCount: 0,
            blackIceHits: 0,
            unsafeJackout: false,
            programs,
            programsLost: [],
            createdAt: Date.now(),
        }
        setSession(newSession)
        setDialogOpen(false)
    }

    const handleOpenCheckDialog = () => {
        if (!session || session.isComplete) return
        setCurrentCheckType('PASSWORD')
        setCurrentCheckDescription('')
        setCurrentCheckDV(6)
        setCurrentCheckOpposed(10)
        setCheckDialogOpen(true)
    }

    const handleRollCheck = () => {
        if (!session || session.isComplete) return

        const roll = rollD10()
        const total = roll + playerSkillTotal
        let success: boolean
        let blackIceHit = false

        if (currentCheckType === 'BLACK_ICE') {
            // Opposed check for Black ICE
            const enemyRoll = rollD10()
            const enemyTotal = enemyRoll + currentCheckOpposed
            success = total > enemyTotal
            if (!success) {
                blackIceHit = true
            }
        } else {
            // DV-based check
            success = total >= currentCheckDV
        }

        const check: QDNetrunCheck = {
            checkNumber: session.currentCheck + 1,
            checkType: currentCheckType,
            description: currentCheckDescription || `${currentCheckType} Check`,
            dv: currentCheckType !== 'BLACK_ICE' ? currentCheckDV : undefined,
            opposedStat: currentCheckType === 'BLACK_ICE' ? currentCheckOpposed : undefined,
            roll,
            skillTotal: playerSkillTotal,
            total,
            success,
            blackIceHit,
        }

        const newChecks = [...session.checks, check]
        const newCurrentCheck = session.currentCheck + 1
        const newSuccessCount = session.successCount + (success ? 1 : 0)
        const newFailureCount = session.failureCount + (success ? 0 : 1)
        const newBlackIceHits = session.blackIceHits + (blackIceHit ? 1 : 0)
        const isComplete = newCurrentCheck >= session.numberOfChecks

        // Calculate success - need majority
        const majority = Math.ceil(session.numberOfChecks / 2)
        const netrunSuccess = newSuccessCount >= majority

        // If failed and there were Black ICE hits, add unsafe jackout hit
        const unsafeJackout = isComplete && !netrunSuccess && newBlackIceHits > 0

        setSession({
            ...session,
            checks: newChecks,
            currentCheck: newCurrentCheck,
            successCount: newSuccessCount,
            failureCount: newFailureCount,
            blackIceHits: unsafeJackout ? newBlackIceHits + 1 : newBlackIceHits, // Extra hit from unsafe jackout
            unsafeJackout,
            isComplete,
            success: isComplete ? netrunSuccess : false,
            completedAt: isComplete ? Date.now() : undefined,
        })

        setCheckDialogOpen(false)
    }

    const handleRollProgramLoss = () => {
        if (!session) return
        const remaining = session.programs.filter(p => !session.programsLost.includes(p))
        if (remaining.length === 0) return
        const lostProgram = remaining[Math.floor(Math.random() * remaining.length)]
        setSession({ ...session, programsLost: [...session.programsLost, lostProgram] })
    }

    const handleReset = () => {
        setSession(null)
        setSessionName('')
        setLocation('')
        setGoal('')
        setFloors(4)
        setPrograms([])
        setNewProgramName('')
    }

    const getProgressPercentage = () => {
        if (!session) return 0
        return (session.currentCheck / session.numberOfChecks) * 100
    }

    const getCheckTypeColor = (checkType: NetrunCheckType) => {
        switch (checkType) {
            case 'PASSWORD':
                return colors.neons.cyan.default
            case 'FILE':
                return colors.neons.green.default
            case 'BLACK_ICE':
                return colors.neons.red.default
            default:
                return colors.neons.blue.default
        }
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography
                    variant="h5"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.netrun.title')}
                </Typography>
                {!session ? (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setDialogOpen(true)}
                        sx={{
                            backgroundColor: colors.neons.blue.default,
                            '&:hover': {
                                backgroundColor: colors.neons.blue.dark,
                            },
                        }}
                    >
                        {t('soloPlay.netrun.startNetrun')}
                    </Button>
                ) : (
                    <Button
                        variant="outlined"
                        startIcon={<RestartAlt />}
                        onClick={handleReset}
                        sx={{
                            borderColor: colors.neons.blue.default,
                            color: colors.neons.blue.default,
                        }}
                    >
                        {t('soloPlay.netrun.reset')}
                    </Button>
                )}
            </Stack>

            {!session ? (
                <Paper
                    sx={{
                        p: 3,
                        backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10,15,25,0.95)',
                        border: `1px solid ${colors.neons.blue.default}30`,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            color: colors.grays.gray600,
                            fontStyle: 'italic',
                            textAlign: 'center',
                        }}
                    >
                        {t('soloPlay.netrun.noNetrunYet')}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.grays.gray500,
                            textAlign: 'center',
                            mt: 2,
                        }}
                    >
                        {t('soloPlay.netrun.description')}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <Card
                            sx={{
                                backgroundColor: readerMode
                                    ? 'rgba(255, 255, 255, 0.9)'
                                    : 'rgba(10, 15, 25, 0.95)',
                                border: `1px solid ${colors.neons.blue.default}40`,
                            }}
                        >
                            <CardContent>
                                <Stack spacing={2}>
                                    {/* Header */}
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: readerMode
                                                    ? colors.grays.gray000
                                                    : colors.neons.blue.default,
                                                fontFamily: '"Orbitron", sans-serif',
                                            }}
                                        >
                                            {session.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colors.grays.gray600 }}>
                                            {t('soloPlay.netrun.location')}: {session.location}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colors.grays.gray600 }}>
                                            {t('soloPlay.netrun.goal')}: {session.goal}
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={1}>
                                            <Chip
                                                label={`${session.floors} ${t('soloPlay.netrun.floors')}`}
                                                size="small"
                                                sx={{ backgroundColor: colors.neons.purple.default }}
                                            />
                                            <Chip
                                                label={t(`soloPlay.netrun.sizes.${session.architectureSize}`)}
                                                size="small"
                                                sx={{ backgroundColor: colors.neons.cyan.default }}
                                            />
                                            <Chip
                                                label={`${session.numberOfChecks} ${t('soloPlay.netrun.checksLabel')}`}
                                                size="small"
                                                sx={{ backgroundColor: colors.neons.blue.default }}
                                            />
                                        </Stack>
                                    </Box>

                                    {/* Progress */}
                                    <Box>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mb={1}
                                        >
                                            <Typography variant="body2">
                                                {t('soloPlay.netrun.progress')}: {session.currentCheck}/
                                                {session.numberOfChecks}
                                            </Typography>
                                            <Typography variant="body2">
                                                {t('soloPlay.netrun.successes')}: {session.successCount}/
                                                {Math.ceil(session.numberOfChecks / 2)} {t('soloPlay.netrun.needed')}
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={getProgressPercentage()}
                                            sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: colors.neons.blue.default,
                                                },
                                            }}
                                        />
                                    </Box>

                                    {/* Black ICE warning */}
                                    {session.blackIceHits > 0 && (
                                        <Paper
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: `${colors.neons.red.default}20`,
                                                border: `1px solid ${colors.neons.red.default}`,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <WarningAmber sx={{ color: colors.neons.red.default }} />
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: colors.neons.red.default }}
                                                >
                                                    {t('soloPlay.netrun.blackIceHits')}: {session.blackIceHits}
                                                    {session.unsafeJackout && ` (${t('soloPlay.netrun.unsafeJackout')})`}
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    )}

                                    {/* Make Check Button */}
                                    {!session.isComplete && (
                                        <Button
                                            variant="contained"
                                            startIcon={<Casino />}
                                            onClick={handleOpenCheckDialog}
                                            fullWidth
                                            sx={{
                                                backgroundColor: colors.neons.blue.default,
                                                '&:hover': {
                                                    backgroundColor: colors.neons.blue.dark,
                                                },
                                            }}
                                        >
                                            {t('soloPlay.netrun.makeCheck')} #{session.currentCheck + 1}
                                        </Button>
                                    )}

                                    {/* Outcome */}
                                    {session.isComplete && (
                                        <Box
                                            sx={{
                                                p: 2,
                                                backgroundColor: session.success
                                                    ? colors.neons.green.default + '20'
                                                    : colors.neons.red.default + '20',
                                                borderRadius: 1,
                                                textAlign: 'center',
                                                border: `2px solid ${session.success ? colors.neons.green.default : colors.neons.red.default}`,
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    color: session.success
                                                        ? colors.neons.green.default
                                                        : colors.neons.red.default,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                }}
                                            >
                                                {session.success
                                                    ? t('soloPlay.netrun.success')
                                                    : t('soloPlay.netrun.failure')}
                                            </Typography>
                                            {!session.success && session.blackIceHits > 0 && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: colors.neons.red.default, mt: 1 }}
                                                >
                                                    {t('soloPlay.netrun.failureConsequences', {
                                                        hits: session.blackIceHits,
                                                    })}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {/* Program Loss */}
                                    {session.isComplete && session.blackIceHits > 0 && session.programs.length > 0 && (
                                        <Box
                                            sx={{
                                                p: 2,
                                                backgroundColor: readerMode
                                                    ? 'rgba(255, 0, 0, 0.05)'
                                                    : `${colors.neons.red.default}10`,
                                                borderRadius: 1,
                                                border: `1px solid ${colors.neons.red.default}40`,
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    mb: 1,
                                                }}
                                            >
                                                {t('soloPlay.netrun.programLoss')} ({session.blackIceHits} {t('soloPlay.netrun.hits')})
                                            </Typography>

                                            {/* Roll button - enabled while there are hits left to resolve */}
                                            {session.programsLost.length < session.blackIceHits &&
                                                session.programs.filter(p => !session.programsLost.includes(p)).length > 0 && (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<Casino />}
                                                    onClick={handleRollProgramLoss}
                                                    fullWidth
                                                    sx={{
                                                        mb: 1.5,
                                                        backgroundColor: colors.neons.red.default,
                                                        '&:hover': {
                                                            backgroundColor: colors.neons.red.dark,
                                                        },
                                                    }}
                                                >
                                                    {t('soloPlay.netrun.rollProgramLoss')} ({session.programsLost.length + 1}/{session.blackIceHits})
                                                </Button>
                                            )}

                                            {/* Lost programs */}
                                            {session.programsLost.length > 0 && (
                                                <Box mb={1}>
                                                    <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block', mb: 0.5 }}>
                                                        {t('soloPlay.netrun.programsDestroyed')}:
                                                    </Typography>
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {session.programsLost.map((prog, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={prog}
                                                                size="small"
                                                                icon={<WarningAmber />}
                                                                sx={{
                                                                    backgroundColor: colors.neons.red.default + '30',
                                                                    color: colors.neons.red.default,
                                                                    '& .MuiChip-icon': { color: colors.neons.red.default },
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Surviving programs */}
                                            {session.programs.filter(p => !session.programsLost.includes(p)).length > 0 && (
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block', mb: 0.5 }}>
                                                        {t('soloPlay.netrun.programsSurviving')}:
                                                    </Typography>
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {session.programs.filter(p => !session.programsLost.includes(p)).map((prog, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={prog}
                                                                size="small"
                                                                icon={<CheckCircle />}
                                                                sx={{
                                                                    backgroundColor: colors.neons.green.default + '30',
                                                                    color: colors.neons.green.default,
                                                                    '& .MuiChip-icon': { color: colors.neons.green.default },
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* Check Results */}
                                    {session.checks.length > 0 && (
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.grays.gray900,
                                                    mb: 1,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                }}
                                            >
                                                {t('soloPlay.netrun.checks')}
                                            </Typography>
                                            <Stack spacing={1}>
                                                {session.checks.map((check, index) => (
                                                    <Paper
                                                        key={index}
                                                        sx={{
                                                            p: 1.5,
                                                            backgroundColor: check.success
                                                                ? `${colors.neons.green.default}10`
                                                                : `${colors.neons.red.default}10`,
                                                            border: `1px solid ${check.success ? colors.neons.green.default : colors.neons.red.default}40`,
                                                        }}
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip
                                                                    label={`#${check.checkNumber}`}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: getCheckTypeColor(
                                                                            check.checkType
                                                                        ),
                                                                        color: '#fff',
                                                                        fontWeight: 'bold',
                                                                    }}
                                                                />
                                                                <Typography variant="body2">
                                                                    {t(`soloPlay.netrun.checkTypes.${check.checkType}`)}
                                                                    {check.dv && ` (DV${check.dv})`}
                                                                    {check.opposedStat &&
                                                                        ` (vs ${check.opposedStat})`}
                                                                </Typography>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{ fontFamily: '"Orbitron", sans-serif' }}
                                                                >
                                                                    {check.roll} + {check.skillTotal} ={' '}
                                                                    <strong>{check.total}</strong>
                                                                </Typography>
                                                                {check.success ? (
                                                                    <CheckCircle
                                                                        sx={{ color: colors.neons.green.default }}
                                                                    />
                                                                ) : (
                                                                    <Close sx={{ color: colors.neons.red.default }} />
                                                                )}
                                                                {check.blackIceHit && (
                                                                    <Tooltip disableInteractive title={t('soloPlay.netrun.blackIceHit')}>
                                                                        <WarningAmber
                                                                            sx={{ color: colors.neons.orange.default }}
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                            </Stack>
                                                        </Stack>
                                                        {check.description && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: colors.grays.gray500,
                                                                    display: 'block',
                                                                    mt: 0.5,
                                                                }}
                                                            >
                                                                {check.description}
                                                            </Typography>
                                                        )}
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Setup Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: readerMode
                            ? {
                                  bgcolor: '#ffffff',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                  color: '#333',
                              }
                            : {
                                  bgcolor: 'rgba(10, 15, 30, 0.95)',
                                  backdropFilter: 'blur(4px)',
                                  border: `1px solid ${colors.neons.blue.default}40`,
                                  boxShadow: `0 0 20px ${colors.neons.blue.default}40`,
                                  color: '#fff',
                                  position: 'relative',
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      backgroundImage:
                                          'linear-gradient(to right, rgba(0, 0, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 255, 0.03) 1px, transparent 1px)',
                                      backgroundSize: '20px 20px',
                                      pointerEvents: 'none',
                                      opacity: 0.5,
                                  },
                              },
                    },
                }}
            >
                <DialogTitle
                    sx={
                        readerMode
                            ? {
                                  color: '#1976d2',
                                  borderBottom: '1px solid #eee',
                              }
                            : {
                                  color: colors.neons.blue.default,
                                  textShadow: `0 0 5px ${colors.neons.blue.default}`,
                                  fontFamily: '"Orbitron", monospace',
                                  borderBottom: `1px solid ${colors.neons.blue.default}40`,
                                  position: 'relative',
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                  },
                              }
                    }
                >
                    <Typography
                        variant="h3"
                        component="div"
                        className="glitch-text"
                        data-text={t('soloPlay.netrun.setupNetrun')}
                    >
                        {t('soloPlay.netrun.setupNetrun')}
                    </Typography>
                </DialogTitle>
                <DialogContent
                    sx={{
                        py: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '80vh',
                        pr: 0,
                    }}
                >
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                    <Stack spacing={2} sx={{ mt: 1, pr: 3 }}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.sessionName')}
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.location')}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={t('soloPlay.netrun.locationPlaceholder')}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.goal')}
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={t('soloPlay.netrun.goalPlaceholder')}
                            multiline
                            rows={2}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        {/* Programs */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: readerMode ? '#333' : colors.neons.cyan.default,
                                    mb: 1,
                                    fontFamily: '"Orbitron", sans-serif',
                                }}
                            >
                                {t('soloPlay.netrun.programs')}
                            </Typography>
                            <Stack direction="row" spacing={1} mb={1}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t('soloPlay.netrun.addProgram')}
                                    value={newProgramName}
                                    onChange={(e) => setNewProgramName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newProgramName.trim()) {
                                            setPrograms([...programs, newProgramName.trim()])
                                            setNewProgramName('')
                                        }
                                    }}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        if (newProgramName.trim()) {
                                            setPrograms([...programs, newProgramName.trim()])
                                            setNewProgramName('')
                                        }
                                    }}
                                    disabled={!newProgramName.trim()}
                                    sx={{
                                        minWidth: 40,
                                        borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : colors.neons.cyan.default + '40',
                                        color: readerMode ? '#0097a7' : colors.neons.cyan.default,
                                    }}
                                >
                                    <Add />
                                </Button>
                            </Stack>
                            {programs.length > 0 && (
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                    {programs.map((prog, idx) => (
                                        <Chip
                                            key={idx}
                                            label={prog}
                                            size="small"
                                            onDelete={() => setPrograms(programs.filter((_, i) => i !== idx))}
                                            sx={{
                                                backgroundColor: readerMode ? '#e0f7fa' : colors.neons.cyan.default + '20',
                                                color: readerMode ? '#006064' : colors.neons.cyan.default,
                                                '& .MuiChip-deleteIcon': {
                                                    color: readerMode ? '#00838f' : colors.neons.cyan.default,
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('soloPlay.netrun.floors')}
                            fullWidth
                        >
                            <Select
                                value={floors}
                                onChange={(e) => setFloors(e.target.value as number)}
                                label={t('soloPlay.netrun.floors')}
                                sx={selectStyle}
                            >
                                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                                    <MenuItem key={num} value={num}>
                                        {num} {t('soloPlay.netrun.floors')} ({getChecksForFloors(num)}{' '}
                                        {t('soloPlay.netrun.checksLabel')})
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        <Paper
                            sx={{
                                p: 1.5,
                                backgroundColor: readerMode
                                    ? 'rgba(0, 128, 255, 0.05)'
                                    : `${colors.neons.cyan.default}10`,
                                border: `1px solid ${readerMode ? 'rgba(0, 0, 0, 0.12)' : `${colors.neons.cyan.default}40`}`,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ color: readerMode ? '#666' : colors.grays.gray500 }}
                            >
                                {t('soloPlay.netrun.sizeInfo')}
                            </Typography>
                        </Paper>
                    </Stack>
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        sx={
                            readerMode
                                ? { color: '#0288d1' }
                                : {
                                      bgcolor: 'rgba(10, 20, 30, 0.6)',
                                      color: colors.neons.cyan.default,
                                      border: `1px solid ${colors.neons.cyan.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 30, 60, 0.8)',
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                      },
                                  }
                        }
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleStartNetrun}
                        disabled={!sessionName.trim() || !location.trim() || !goal.trim()}
                        sx={
                            readerMode
                                ? { color: '#1976d2' }
                                : {
                                      bgcolor: 'rgba(0, 0, 40, 0.6)',
                                      color: colors.neons.blue.default,
                                      border: `1px solid ${colors.neons.blue.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 0, 60, 0.8)',
                                          color: colors.neons.blue.light,
                                          boxShadow: `0 0 10px ${colors.neons.blue.default}60`,
                                          textShadow: `0 0 5px ${colors.neons.blue.default}`,
                                          border: `1px solid ${colors.neons.blue.default}70`,
                                      },
                                  }
                        }
                    >
                        {t('soloPlay.netrun.startNetrun')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Check Dialog */}
            <Dialog
                open={checkDialogOpen}
                onClose={() => setCheckDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: readerMode
                            ? {
                                  bgcolor: '#ffffff',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                  color: '#333',
                              }
                            : {
                                  bgcolor: 'rgba(10, 15, 30, 0.95)',
                                  backdropFilter: 'blur(4px)',
                                  border: `1px solid ${colors.neons.cyan.default}40`,
                                  boxShadow: `0 0 20px ${colors.neons.cyan.default}40`,
                                  color: '#fff',
                                  position: 'relative',
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      backgroundImage:
                                          'linear-gradient(to right, rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
                                      backgroundSize: '20px 20px',
                                      pointerEvents: 'none',
                                      opacity: 0.5,
                                  },
                              },
                    },
                }}
            >
                <DialogTitle
                    sx={
                        readerMode
                            ? {
                                  color: '#0097a7',
                                  borderBottom: '1px solid #eee',
                              }
                            : {
                                  color: colors.neons.cyan.default,
                                  textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                  fontFamily: '"Orbitron", monospace',
                                  borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                                  position: 'relative',
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                  },
                              }
                    }
                >
                    <Typography
                        variant="h3"
                        component="div"
                        className="glitch-text"
                        data-text={`${t('soloPlay.netrun.makeCheck')} #${session?.currentCheck ? session.currentCheck + 1 : 1}`}
                    >
                        {t('soloPlay.netrun.makeCheck')} #{session?.currentCheck ? session.currentCheck + 1 : 1}
                    </Typography>
                </DialogTitle>
                <DialogContent
                    sx={{
                        py: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '80vh',
                        pr: 0,
                    }}
                >
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                    <Stack spacing={2} sx={{ mt: 1, pr: 3 }}>
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('soloPlay.netrun.checkType')}
                            fullWidth
                        >
                            <Select
                                value={currentCheckType}
                                onChange={(e) => setCurrentCheckType(e.target.value as NetrunCheckType)}
                                label={t('soloPlay.netrun.checkType')}
                                sx={selectStyle}
                            >
                                <MenuItem value="PASSWORD">{t('soloPlay.netrun.checkTypes.PASSWORD')}</MenuItem>
                                <MenuItem value="FILE">{t('soloPlay.netrun.checkTypes.FILE')}</MenuItem>
                                <MenuItem value="BLACK_ICE">{t('soloPlay.netrun.checkTypes.BLACK_ICE')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>

                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.checkDescription')}
                            value={currentCheckDescription}
                            onChange={(e) => setCurrentCheckDescription(e.target.value)}
                            placeholder={t('soloPlay.netrun.checkDescriptionPlaceholder')}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />

                        {currentCheckType !== 'BLACK_ICE' ? (
                            <TextField
                                fullWidth
                                type="number"
                                label={t('soloPlay.netrun.dv')}
                                value={currentCheckDV}
                                onChange={(e) => setCurrentCheckDV(parseInt(e.target.value) || 6)}
                                helperText={t('soloPlay.netrun.dvHelp')}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                            />
                        ) : (
                            <TextField
                                fullWidth
                                type="number"
                                label={t('soloPlay.netrun.opposedStat')}
                                value={currentCheckOpposed}
                                onChange={(e) => setCurrentCheckOpposed(parseInt(e.target.value) || 10)}
                                helperText={t('soloPlay.netrun.opposedHelp')}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                            />
                        )}

                        <TextField
                            fullWidth
                            type="number"
                            label={t('soloPlay.netrun.playerSkill')}
                            value={playerSkillTotal}
                            onChange={(e) => setPlayerSkillTotal(parseInt(e.target.value) || 14)}
                            helperText={t('soloPlay.netrun.playerSkillHelp')}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />

                        {currentCheckType === 'BLACK_ICE' && (
                            <Paper
                                sx={{
                                    p: 1.5,
                                    backgroundColor: readerMode
                                        ? 'rgba(128, 0, 0, 0.05)'
                                        : `${colors.neons.red.default}10`,
                                    border: `1px solid ${readerMode ? 'rgba(211, 47, 47, 0.3)' : `${colors.neons.red.default}40`}`,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{ color: readerMode ? '#d32f2f' : colors.neons.red.default }}
                                >
                                    {t('soloPlay.netrun.blackIceWarning')}
                                </Typography>
                            </Paper>
                        )}
                    </Stack>
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setCheckDialogOpen(false)}
                        sx={
                            readerMode
                                ? { color: '#0288d1' }
                                : {
                                      bgcolor: 'rgba(10, 20, 30, 0.6)',
                                      color: colors.neons.cyan.default,
                                      border: `1px solid ${colors.neons.cyan.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 30, 60, 0.8)',
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                      },
                                  }
                        }
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleRollCheck}
                        startIcon={<Casino />}
                        sx={
                            readerMode
                                ? {
                                      color:
                                          currentCheckType === 'BLACK_ICE' ? '#d32f2f' : '#0097a7',
                                  }
                                : {
                                      bgcolor:
                                          currentCheckType === 'BLACK_ICE'
                                              ? 'rgba(40, 0, 0, 0.6)'
                                              : 'rgba(0, 40, 40, 0.6)',
                                      color:
                                          currentCheckType === 'BLACK_ICE'
                                              ? colors.neons.red.default
                                              : colors.neons.cyan.default,
                                      border: `1px solid ${
                                          currentCheckType === 'BLACK_ICE'
                                              ? colors.neons.red.default
                                              : colors.neons.cyan.default
                                      }40`,
                                      '&:hover': {
                                          bgcolor:
                                              currentCheckType === 'BLACK_ICE'
                                                  ? 'rgba(60, 0, 0, 0.8)'
                                                  : 'rgba(0, 60, 60, 0.8)',
                                          boxShadow: `0 0 10px ${
                                              currentCheckType === 'BLACK_ICE'
                                                  ? colors.neons.red.default
                                                  : colors.neons.cyan.default
                                          }60`,
                                          textShadow: `0 0 5px ${
                                              currentCheckType === 'BLACK_ICE'
                                                  ? colors.neons.red.default
                                                  : colors.neons.cyan.default
                                          }`,
                                      },
                                  }
                        }
                    >
                        {t('soloPlay.netrun.rollCheck')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default QDNetrunPanel
