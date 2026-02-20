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
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type {
    NetrunCheckType,
    QDNetrunCheck,
    QDNetrunSession,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { getArchitectureSize, getChecksForFloors } from '../../../utils/generators/soloPlayUtils'
import { rollD10 } from '../../../utils/generators/soloPlayTables'

const QDNetrunPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Session state
    const [session, setSession] = useState<QDNetrunSession | null>(null)

    // Setup dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [sessionName, setSessionName] = useState('')
    const [location, setLocation] = useState('')
    const [goal, setGoal] = useState('')
    const [floors, setFloors] = useState(4)

    // Check setup state
    const [checkDialogOpen, setCheckDialogOpen] = useState(false)
    const [currentCheckType, setCurrentCheckType] = useState<NetrunCheckType>('PASSWORD')
    const [currentCheckDescription, setCurrentCheckDescription] = useState('')
    const [currentCheckDV, setCurrentCheckDV] = useState(6)
    const [currentCheckOpposed, setCurrentCheckOpposed] = useState(10)
    const [playerSkillTotal, setPlayerSkillTotal] = useState(14)

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

    const handleReset = () => {
        setSession(null)
        setSessionName('')
        setLocation('')
        setGoal('')
        setFloors(4)
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
            case 'CONTROL_NODE':
                return colors.neons.purple.default
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
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.blue.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.netrun.setupNetrun')}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.sessionName')}
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.location')}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={t('soloPlay.netrun.locationPlaceholder')}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.goal')}
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={t('soloPlay.netrun.goalPlaceholder')}
                            multiline
                            rows={2}
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('soloPlay.netrun.floors')}</InputLabel>
                            <Select
                                value={floors}
                                onChange={(e) => setFloors(e.target.value as number)}
                                label={t('soloPlay.netrun.floors')}
                            >
                                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                                    <MenuItem key={num} value={num}>
                                        {num} {t('soloPlay.netrun.floors')} ({getChecksForFloors(num)}{' '}
                                        {t('soloPlay.netrun.checksLabel')})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Paper
                            sx={{
                                p: 1.5,
                                backgroundColor: `${colors.neons.cyan.default}10`,
                                border: `1px solid ${colors.neons.cyan.default}40`,
                            }}
                        >
                            <Typography variant="caption" sx={{ color: colors.grays.gray500 }}>
                                {t('soloPlay.netrun.sizeInfo')}
                            </Typography>
                        </Paper>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleStartNetrun}
                        variant="contained"
                        disabled={!sessionName.trim() || !location.trim() || !goal.trim()}
                        sx={{
                            backgroundColor: colors.neons.blue.default,
                            '&:hover': {
                                backgroundColor: colors.neons.blue.dark,
                            },
                        }}
                    >
                        {t('soloPlay.netrun.startNetrun')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Check Dialog */}
            <Dialog open={checkDialogOpen} onClose={() => setCheckDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.netrun.makeCheck')} #{session?.currentCheck ? session.currentCheck + 1 : 1}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('soloPlay.netrun.checkType')}</InputLabel>
                            <Select
                                value={currentCheckType}
                                onChange={(e) => setCurrentCheckType(e.target.value as NetrunCheckType)}
                                label={t('soloPlay.netrun.checkType')}
                            >
                                <MenuItem value="PASSWORD">{t('soloPlay.netrun.checkTypes.PASSWORD')}</MenuItem>
                                <MenuItem value="FILE">{t('soloPlay.netrun.checkTypes.FILE')}</MenuItem>
                                <MenuItem value="CONTROL_NODE">
                                    {t('soloPlay.netrun.checkTypes.CONTROL_NODE')}
                                </MenuItem>
                                <MenuItem value="BLACK_ICE">{t('soloPlay.netrun.checkTypes.BLACK_ICE')}</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label={t('soloPlay.netrun.checkDescription')}
                            value={currentCheckDescription}
                            onChange={(e) => setCurrentCheckDescription(e.target.value)}
                            placeholder={t('soloPlay.netrun.checkDescriptionPlaceholder')}
                        />

                        {currentCheckType !== 'BLACK_ICE' ? (
                            <TextField
                                fullWidth
                                type="number"
                                label={t('soloPlay.netrun.dv')}
                                value={currentCheckDV}
                                onChange={(e) => setCurrentCheckDV(parseInt(e.target.value) || 6)}
                                helperText={t('soloPlay.netrun.dvHelp')}
                            />
                        ) : (
                            <TextField
                                fullWidth
                                type="number"
                                label={t('soloPlay.netrun.opposedStat')}
                                value={currentCheckOpposed}
                                onChange={(e) => setCurrentCheckOpposed(parseInt(e.target.value) || 10)}
                                helperText={t('soloPlay.netrun.opposedHelp')}
                            />
                        )}

                        <TextField
                            fullWidth
                            type="number"
                            label={t('soloPlay.netrun.playerSkill')}
                            value={playerSkillTotal}
                            onChange={(e) => setPlayerSkillTotal(parseInt(e.target.value) || 14)}
                            helperText={t('soloPlay.netrun.playerSkillHelp')}
                        />

                        {currentCheckType === 'BLACK_ICE' && (
                            <Paper
                                sx={{
                                    p: 1.5,
                                    backgroundColor: `${colors.neons.red.default}10`,
                                    border: `1px solid ${colors.neons.red.default}40`,
                                }}
                            >
                                <Typography variant="caption" sx={{ color: colors.neons.red.default }}>
                                    {t('soloPlay.netrun.blackIceWarning')}
                                </Typography>
                            </Paper>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCheckDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleRollCheck}
                        variant="contained"
                        startIcon={<Casino />}
                        sx={{
                            backgroundColor:
                                currentCheckType === 'BLACK_ICE'
                                    ? colors.neons.red.default
                                    : colors.neons.cyan.default,
                            '&:hover': {
                                backgroundColor:
                                    currentCheckType === 'BLACK_ICE'
                                        ? colors.neons.red.dark
                                        : colors.neons.cyan.dark,
                            },
                        }}
                    >
                        {t('soloPlay.netrun.rollCheck')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default QDNetrunPanel
