import Add from '@mui/icons-material/Add'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
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
    InvestigationCheck,
    InvestigationComplexity,
    InvestigationSession,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkSelectStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const COMPLEXITY_CHECKS: Record<InvestigationComplexity, number> = {
    SIMPLE: 3,
    AVERAGE: 5,
    DIFFICULT: 7,
}

const InvestigationTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const {
        investigationSessions,
        addInvestigationSession,
        updateInvestigationSession,
        deleteInvestigationSession,
    } = useGMToolsDataStore()

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [name, setName] = useState('')
    const [goal, setGoal] = useState('')
    const [complexity, setComplexity] = useState<InvestigationComplexity>('AVERAGE')

    // Check dialog state
    const [checkDialogOpen, setCheckDialogOpen] = useState(false)
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [checkSkill, setCheckSkill] = useState('')
    const [checkDV, setCheckDV] = useState(13)
    const [checkDescription, setCheckDescription] = useState('')

    // Roll dialog
    const [rollDialogOpen, setRollDialogOpen] = useState(false)
    const [rollSessionId, setRollSessionId] = useState<string | null>(null)
    const [rollCheckIndex, setRollCheckIndex] = useState<number>(-1)
    const [rollValue, setRollValue] = useState('')
    const [rollSkillTotal, setRollSkillTotal] = useState('')

    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.green.default)
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.green.default)
    const selectStyle = getCyberpunkSelectStyle(readerMode, colors.neons.green.default)

    const handleCreate = () => {
        if (!name.trim() || !goal.trim()) return
        const numChecks = COMPLEXITY_CHECKS[complexity]
        const session: InvestigationSession = {
            id: uuidv4(),
            name,
            goal,
            complexity,
            numberOfChecks: numChecks,
            checks: [],
            currentCheck: 0,
            successCount: 0,
            failureCount: 0,
            isComplete: false,
            createdAt: Date.now(),
        }
        addInvestigationSession(session)
        setName('')
        setGoal('')
        setComplexity('AVERAGE')
        setDialogOpen(false)
    }

    const handleAddCheck = () => {
        if (!activeSessionId || !checkSkill.trim()) return
        const session = investigationSessions.find((s) => s.id === activeSessionId)
        if (!session || session.checks.length >= session.numberOfChecks) return

        const newCheck: InvestigationCheck = {
            checkNumber: session.checks.length + 1,
            skill: checkSkill,
            dv: checkDV,
            description: checkDescription,
        }

        updateInvestigationSession(activeSessionId, {
            checks: [...session.checks, newCheck],
        })

        setCheckSkill('')
        setCheckDV(13)
        setCheckDescription('')
        setCheckDialogOpen(false)
    }

    const handleOpenRoll = (sessionId: string, checkIndex: number) => {
        setRollSessionId(sessionId)
        setRollCheckIndex(checkIndex)
        setRollValue('')
        setRollSkillTotal('')
        setRollDialogOpen(true)
    }

    const handleRollCheck = () => {
        if (!rollSessionId || rollCheckIndex < 0) return
        const session = investigationSessions.find((s) => s.id === rollSessionId)
        if (!session) return

        const roll = parseInt(rollValue) || Math.floor(Math.random() * 10) + 1
        const skillTotal = parseInt(rollSkillTotal) || 0
        const total = roll + skillTotal
        const check = session.checks[rollCheckIndex]
        const success = total >= check.dv

        const updatedChecks = [...session.checks]
        updatedChecks[rollCheckIndex] = {
            ...check,
            roll,
            skillTotal,
            success,
        }

        const successCount = updatedChecks.filter((c) => c.success === true).length
        const failureCount = updatedChecks.filter((c) => c.success === false).length
        const allResolved = updatedChecks.every((c) => c.success !== undefined)
        const isComplete = allResolved && updatedChecks.length === session.numberOfChecks
        const majorityNeeded = Math.ceil(session.numberOfChecks / 2)

        updateInvestigationSession(rollSessionId, {
            checks: updatedChecks,
            currentCheck: rollCheckIndex + 1,
            successCount,
            failureCount,
            isComplete,
            success: isComplete ? successCount >= majorityNeeded : undefined,
            completedAt: isComplete ? Date.now() : undefined,
        })

        setRollDialogOpen(false)
    }

    const getProgressColor = (session: InvestigationSession) => {
        if (session.isComplete) return session.success ? colors.neons.green.default : colors.neons.red.default
        return colors.neons.cyan.default
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.investigation.title')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.investigation.add')}
                </Button>
            </Stack>

            {investigationSessions.length === 0 ? (
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.grays.gray600,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        fontFamily: '"Lexend", sans-serif',
                        py: 2,
                    }}
                >
                    {t('soloPlay.investigation.noSessions')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {investigationSessions.map((session) => (
                        <Paper
                            key={session.id}
                            sx={{
                                ...getCyberpunkPaperStyle(readerMode, getProgressColor(session)),
                                p: 2,
                            }}
                        >
                            {/* Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            color: readerMode ? colors.grays.gray000 : getProgressColor(session),
                                            fontFamily: '"Orbitron", sans-serif',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {session.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: colors.grays.gray500, fontFamily: '"Lexend", sans-serif', display: 'block' }}
                                    >
                                        {t('soloPlay.investigation.goal')}: {session.goal}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} mt={0.5}>
                                        <Chip
                                            label={t(`soloPlay.investigation.complexity.${session.complexity}`)}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${colors.neons.green.default}30`,
                                                color: colors.neons.green.default,
                                                fontSize: '0.65rem',
                                                height: 18,
                                            }}
                                        />
                                        <Chip
                                            label={t('soloPlay.investigation.nChecks', { done: session.checks.length, total: session.numberOfChecks })}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${colors.neons.cyan.default}30`,
                                                color: colors.neons.cyan.default,
                                                fontSize: '0.65rem',
                                                height: 18,
                                            }}
                                        />
                                    </Stack>
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                    {!session.isComplete && session.checks.length < session.numberOfChecks && (
                                        <Tooltip disableInteractive title={t('soloPlay.investigation.addCheck')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setActiveSessionId(session.id)
                                                    setCheckDialogOpen(true)
                                                }}
                                                sx={{
                                                    color: colors.neons.green.default,
                                                    border: `1px solid ${colors.neons.green.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': { backgroundColor: `${colors.neons.green.default}20` },
                                                }}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip disableInteractive title={t('common.delete')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => deleteInvestigationSession(session.id)}
                                            sx={{
                                                color: colors.neons.red.default,
                                                border: `1px solid ${colors.neons.red.default}40`,
                                                borderRadius: 0,
                                                '&:hover': { backgroundColor: `${colors.neons.red.default}20` },
                                            }}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>

                            {/* Progress Bar */}
                            <Box mt={1.5}>
                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="caption" sx={{ color: colors.neons.green.default, fontFamily: '"Lexend", sans-serif' }}>
                                        {t('soloPlay.investigation.successes')}: {session.successCount}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: colors.neons.red.default, fontFamily: '"Lexend", sans-serif' }}>
                                        {t('soloPlay.investigation.failures')}: {session.failureCount}
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={
                                        session.numberOfChecks > 0
                                            ? (session.checks.filter((c) => c.success !== undefined).length / session.numberOfChecks) * 100
                                            : 0
                                    }
                                    sx={{
                                        height: 6,
                                        borderRadius: 1,
                                        backgroundColor: readerMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: getProgressColor(session),
                                        },
                                    }}
                                />
                            </Box>

                            {/* Checks List */}
                            {session.checks.length > 0 && (
                                <Accordion
                                    sx={{
                                        mt: 1.5,
                                        backgroundColor: 'transparent',
                                        boxShadow: 'none',
                                        '&::before': { display: 'none' },
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMore sx={{ color: colors.grays.gray500 }} />}
                                        sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 0.5 } }}
                                    >
                                        <Typography variant="caption" sx={{ color: colors.grays.gray500, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {t('soloPlay.investigation.checks')}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ px: 0 }}>
                                        <Stack spacing={1}>
                                            {session.checks.map((check, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        p: 1,
                                                        borderRadius: 1,
                                                        backgroundColor: readerMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)',
                                                        border: `1px solid ${
                                                            check.success === true
                                                                ? colors.neons.green.default
                                                                : check.success === false
                                                                  ? colors.neons.red.default
                                                                  : colors.grays.gray700
                                                        }30`,
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                                                    fontFamily: '"Lexend", sans-serif',
                                                                    fontWeight: 'bold',
                                                                }}
                                                            >
                                                                #{check.checkNumber}: {check.skill} (DV {check.dv})
                                                            </Typography>
                                                            {check.description && (
                                                                <Typography variant="caption" sx={{ color: colors.grays.gray500 }}>
                                                                    {check.description}
                                                                </Typography>
                                                            )}
                                                            {check.roll !== undefined && (
                                                                <Typography variant="caption" sx={{ color: colors.grays.gray600, display: 'block' }}>
                                                                    {t('soloPlay.investigation.rollDetail', { roll: check.roll, skill: check.skillTotal, sum: (check.roll || 0) + (check.skillTotal || 0), dv: check.dv })}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {check.success === undefined ? (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => handleOpenRoll(session.id, idx)}
                                                                sx={getCyberpunkButtonStyle(readerMode, colors.neons.yellow.default)}
                                                            >
                                                                {t('soloPlay.investigation.roll')}
                                                            </Button>
                                                        ) : check.success ? (
                                                            <CheckCircle sx={{ color: colors.neons.green.default }} />
                                                        ) : (
                                                            <Cancel sx={{ color: colors.neons.red.default }} />
                                                        )}
                                                    </Stack>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {/* Outcome */}
                            {session.isComplete && (
                                <Box
                                    sx={{
                                        mt: 1.5,
                                        p: 1.5,
                                        backgroundColor: session.success ? `${colors.neons.green.default}20` : `${colors.neons.red.default}20`,
                                        borderRadius: 1,
                                        border: `1px solid ${session.success ? colors.neons.green.default : colors.neons.red.default}`,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            color: session.success ? colors.neons.green.default : colors.neons.red.default,
                                            fontFamily: '"Orbitron", sans-serif',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {session.success
                                            ? t('soloPlay.investigation.success')
                                            : t('soloPlay.investigation.failure')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: colors.grays.gray500 }}>
                                        {session.successCount} {t('soloPlay.investigation.successes')} / {session.failureCount} {t('soloPlay.investigation.failures')}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* Create Investigation Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.green.default}40`,
                        boxShadow: readerMode ? '0 4px 20px rgba(0,0,0,0.15)' : `0 0 30px ${colors.neons.green.default}40`,
                    },
                }}
            >
                <DialogTitle sx={{ fontFamily: '"Orbitron", sans-serif', color: readerMode ? colors.grays.gray000 : colors.neons.green.default, borderBottom: `1px solid ${colors.neons.green.default}40` }}>
                    {t('soloPlay.investigation.create')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.name')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('soloPlay.investigation.namePlaceholder')}
                            sx={textFieldStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.goal')}
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={t('soloPlay.investigation.goalPlaceholder')}
                            multiline
                            rows={2}
                            sx={textFieldStyle}
                        />
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: readerMode ? '#666' : colors.neons.green.default }}>
                                {t('soloPlay.investigation.complexityLabel')}
                            </InputLabel>
                            <Select
                                value={complexity}
                                onChange={(e) => setComplexity(e.target.value as InvestigationComplexity)}
                                label={t('soloPlay.investigation.complexityLabel')}
                                sx={selectStyle}
                            >
                                <MenuItem value="SIMPLE">{t('soloPlay.investigation.complexity.SIMPLE')} {t('soloPlay.investigation.complexityChecks', { n: 3 })}</MenuItem>
                                <MenuItem value="AVERAGE">{t('soloPlay.investigation.complexity.AVERAGE')} {t('soloPlay.investigation.complexityChecks', { n: 5 })}</MenuItem>
                                <MenuItem value="DIFFICULT">{t('soloPlay.investigation.complexity.DIFFICULT')} {t('soloPlay.investigation.complexityChecks', { n: 7 })}</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.green.default}40` }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreate} variant="outlined" disabled={!name.trim() || !goal.trim()} sx={buttonStyle}>
                        {t('common.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Check Dialog */}
            <Dialog
                open={checkDialogOpen}
                onClose={() => setCheckDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.cyan.default}40`,
                        boxShadow: readerMode ? '0 4px 20px rgba(0,0,0,0.15)' : `0 0 30px ${colors.neons.cyan.default}40`,
                    },
                }}
            >
                <DialogTitle sx={{ fontFamily: '"Orbitron", sans-serif', color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default, borderBottom: `1px solid ${colors.neons.cyan.default}40` }}>
                    {t('soloPlay.investigation.addCheck')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.skill')}
                            value={checkSkill}
                            onChange={(e) => setCheckSkill(e.target.value)}
                            placeholder={t('soloPlay.investigation.skillPlaceholder')}
                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.dv')}
                            type="number"
                            value={checkDV}
                            onChange={(e) => setCheckDV(parseInt(e.target.value) || 13)}
                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.checkDescription')}
                            value={checkDescription}
                            onChange={(e) => setCheckDescription(e.target.value)}
                            placeholder={t('soloPlay.investigation.descriptionPlaceholder')}
                            multiline
                            rows={2}
                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.cyan.default}40` }}>
                    <Button onClick={() => setCheckDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleAddCheck}
                        variant="outlined"
                        disabled={!checkSkill.trim()}
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.cyan.default)}
                    >
                        {t('soloPlay.investigation.addCheck')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Roll Check Dialog */}
            <Dialog
                open={rollDialogOpen}
                onClose={() => setRollDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.yellow.default}40`,
                        boxShadow: readerMode ? '0 4px 20px rgba(0,0,0,0.15)' : `0 0 30px ${colors.neons.yellow.default}40`,
                    },
                }}
            >
                <DialogTitle sx={{ fontFamily: '"Orbitron", sans-serif', color: readerMode ? colors.grays.gray000 : colors.neons.yellow.default, borderBottom: `1px solid ${colors.neons.yellow.default}40` }}>
                    {t('soloPlay.investigation.makeCheck')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.rollValue')}
                            type="number"
                            value={rollValue}
                            onChange={(e) => setRollValue(e.target.value)}
                            placeholder={t('soloPlay.investigation.rollPlaceholder')}
                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.investigation.skillTotal')}
                            type="number"
                            value={rollSkillTotal}
                            onChange={(e) => setRollSkillTotal(e.target.value)}
                            placeholder={t('soloPlay.investigation.totalPlaceholder')}
                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.yellow.default}40` }}>
                    <Button onClick={() => setRollDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleRollCheck}
                        variant="outlined"
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.yellow.default)}
                    >
                        {t('soloPlay.investigation.roll')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default InvestigationTool
