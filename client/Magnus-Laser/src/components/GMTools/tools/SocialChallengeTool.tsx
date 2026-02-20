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
    NPCImportance,
    SocialCheck,
    SocialChallengeSession,
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

const IMPORTANCE_CHECKS: Record<NPCImportance, number> = {
    BACKGROUND: 0,
    SUPPORTING: 1,
    KEY: 3,
}

const SocialChallengeTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const {
        socialChallengeSessions,
        addSocialChallengeSession,
        updateSocialChallengeSession,
        deleteSocialChallengeSession,
    } = useGMToolsDataStore()

    // Create dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [name, setName] = useState('')
    const [goal, setGoal] = useState('')
    const [npcName, setNpcName] = useState('')
    const [importance, setImportance] = useState<NPCImportance>('KEY')
    const [numChecks, setNumChecks] = useState(3)

    // Roll dialog
    const [rollDialogOpen, setRollDialogOpen] = useState(false)
    const [rollSessionId, setRollSessionId] = useState<string | null>(null)
    const [rollCheckIndex, setRollCheckIndex] = useState<number>(-1)
    const [edgerunnerSkill, setEdgerunnerSkill] = useState('')
    const [npcSkill, setNpcSkill] = useState('')
    const [edgerunnerRoll, setEdgerunnerRoll] = useState('')
    const [edgerunnerTotal, setEdgerunnerTotal] = useState('')
    const [npcRoll, setNpcRoll] = useState('')
    const [npcTotal, setNpcTotal] = useState('')

    const accentColor = colors.neons.purple.default
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, accentColor)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, accentColor)
    const titleStyle = getSectionTitleStyle(readerMode, accentColor)
    const selectStyle = getCyberpunkSelectStyle(readerMode, accentColor)

    const handleCreate = () => {
        if (!name.trim() || !npcName.trim()) return
        const checks = importance === 'KEY' ? numChecks : IMPORTANCE_CHECKS[importance]

        // Pre-create check slots for KEY NPCs
        const checkSlots: SocialCheck[] = []
        if (importance === 'KEY') {
            for (let i = 0; i < checks; i++) {
                checkSlots.push({ checkNumber: i + 1, edgerunnerSkill: '', npcSkill: '' })
            }
        } else if (importance === 'SUPPORTING') {
            checkSlots.push({ checkNumber: 1, edgerunnerSkill: '', npcSkill: '' })
        }

        const session: SocialChallengeSession = {
            id: uuidv4(),
            name,
            goal,
            npcName,
            npcImportance: importance,
            numberOfChecks: checks,
            checks: checkSlots,
            currentCheck: 0,
            edgerunnerWins: 0,
            npcWins: 0,
            isComplete: importance === 'BACKGROUND',
            success: importance === 'BACKGROUND' ? true : undefined,
            createdAt: Date.now(),
        }
        addSocialChallengeSession(session)
        setName('')
        setGoal('')
        setNpcName('')
        setImportance('KEY')
        setNumChecks(3)
        setDialogOpen(false)
    }

    const handleOpenRoll = (sessionId: string, checkIndex: number) => {
        const session = socialChallengeSessions.find((s) => s.id === sessionId)
        if (!session) return
        const check = session.checks[checkIndex]
        setRollSessionId(sessionId)
        setRollCheckIndex(checkIndex)
        setEdgerunnerSkill(check.edgerunnerSkill || '')
        setNpcSkill(check.npcSkill || '')
        setEdgerunnerRoll('')
        setEdgerunnerTotal('')
        setNpcRoll('')
        setNpcTotal('')
        setRollDialogOpen(true)
    }

    const handleRollCheck = () => {
        if (!rollSessionId || rollCheckIndex < 0) return
        const session = socialChallengeSessions.find((s) => s.id === rollSessionId)
        if (!session) return

        const eRoll = parseInt(edgerunnerRoll) || Math.floor(Math.random() * 10) + 1
        const eTotal = parseInt(edgerunnerTotal) || eRoll
        const nRoll = parseInt(npcRoll) || Math.floor(Math.random() * 10) + 1
        const nTotal = parseInt(npcTotal) || nRoll

        const winner: 'EDGERUNNER' | 'NPC' | 'TIE' = eTotal > nTotal ? 'EDGERUNNER' : eTotal < nTotal ? 'NPC' : 'TIE'

        const updatedChecks = [...session.checks]
        updatedChecks[rollCheckIndex] = {
            ...updatedChecks[rollCheckIndex],
            edgerunnerSkill: edgerunnerSkill || updatedChecks[rollCheckIndex].edgerunnerSkill,
            npcSkill: npcSkill || updatedChecks[rollCheckIndex].npcSkill,
            edgerunnerRoll: eRoll,
            edgerunnerTotal: eTotal,
            npcRoll: nRoll,
            npcTotal: nTotal,
            winner,
        }

        const eWins = updatedChecks.filter((c) => c.winner === 'EDGERUNNER').length
        const nWins = updatedChecks.filter((c) => c.winner === 'NPC').length
        const allResolved = updatedChecks.every((c) => c.winner !== undefined)
        const isComplete = allResolved
        const majorityNeeded = Math.ceil(session.numberOfChecks / 2)

        updateSocialChallengeSession(rollSessionId, {
            checks: updatedChecks,
            currentCheck: rollCheckIndex + 1,
            edgerunnerWins: eWins,
            npcWins: nWins,
            isComplete,
            success: isComplete ? eWins >= majorityNeeded : undefined,
            completedAt: isComplete ? Date.now() : undefined,
        })

        setRollDialogOpen(false)
    }

    const getProgressColor = (session: SocialChallengeSession) => {
        if (session.isComplete) return session.success ? colors.neons.green.default : colors.neons.red.default
        return accentColor
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.social.title')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.social.add')}
                </Button>
            </Stack>

            {socialChallengeSessions.length === 0 ? (
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
                    {t('soloPlay.social.noSessions')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {socialChallengeSessions.map((session) => (
                        <Paper
                            key={session.id}
                            sx={{
                                ...getCyberpunkPaperStyle(readerMode, getProgressColor(session)),
                                p: 2,
                            }}
                        >
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
                                    <Typography variant="caption" sx={{ color: colors.grays.gray500, fontFamily: '"Lexend", sans-serif', display: 'block' }}>
                                        {t('soloPlay.social.npc')}: {session.npcName} | {t('soloPlay.social.goal')}: {session.goal}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} mt={0.5}>
                                        <Chip
                                            label={t(`soloPlay.social.importance.${session.npcImportance}`)}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${accentColor}30`,
                                                color: accentColor,
                                                fontSize: '0.65rem',
                                                height: 18,
                                            }}
                                        />
                                        {session.npcImportance !== 'BACKGROUND' && (
                                            <Chip
                                                label={t('soloPlay.social.nChecks', { done: session.checks.filter((c) => c.winner).length, total: session.numberOfChecks })}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${colors.neons.cyan.default}30`,
                                                    color: colors.neons.cyan.default,
                                                    fontSize: '0.65rem',
                                                    height: 18,
                                                }}
                                            />
                                        )}
                                    </Stack>
                                </Box>
                                <Tooltip disableInteractive title={t('common.delete')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteSocialChallengeSession(session.id)}
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

                            {/* Progress */}
                            {session.npcImportance !== 'BACKGROUND' && session.numberOfChecks > 0 && (
                                <Box mt={1.5}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" sx={{ color: colors.neons.green.default, fontFamily: '"Lexend", sans-serif' }}>
                                            {t('soloPlay.social.edgerunnerWins')}: {session.edgerunnerWins}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: colors.neons.red.default, fontFamily: '"Lexend", sans-serif' }}>
                                            {t('soloPlay.social.npcWins')}: {session.npcWins}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(session.checks.filter((c) => c.winner).length / session.numberOfChecks) * 100}
                                        sx={{
                                            height: 6,
                                            borderRadius: 1,
                                            backgroundColor: readerMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                            '& .MuiLinearProgress-bar': { backgroundColor: getProgressColor(session) },
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Checks */}
                            {session.checks.length > 0 && session.npcImportance !== 'BACKGROUND' && (
                                <Accordion
                                    sx={{ mt: 1.5, backgroundColor: 'transparent', boxShadow: 'none', '&::before': { display: 'none' } }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMore sx={{ color: colors.grays.gray500 }} />}
                                        sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 0.5 } }}
                                    >
                                        <Typography variant="caption" sx={{ color: colors.grays.gray500, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {t('soloPlay.social.checks')}
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
                                                            check.winner === 'EDGERUNNER'
                                                                ? colors.neons.green.default
                                                                : check.winner === 'NPC'
                                                                  ? colors.neons.red.default
                                                                  : colors.grays.gray700
                                                        }30`,
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ color: readerMode ? colors.grays.gray000 : colors.grays.gray900, fontFamily: '"Lexend", sans-serif', fontWeight: 'bold' }}
                                                            >
                                                                #{check.checkNumber}
                                                                {check.edgerunnerSkill && `: ${check.edgerunnerSkill}`}
                                                                {check.npcSkill && ` vs ${check.npcSkill}`}
                                                            </Typography>
                                                            {check.edgerunnerTotal !== undefined && (
                                                                <Typography variant="caption" sx={{ color: colors.grays.gray600, display: 'block' }}>
                                                                    {t('soloPlay.social.edgerunnerVsNpc', { eTotal: check.edgerunnerTotal, nTotal: check.npcTotal })}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {check.winner === undefined ? (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => handleOpenRoll(session.id, idx)}
                                                                sx={getCyberpunkButtonStyle(readerMode, colors.neons.yellow.default)}
                                                            >
                                                                {t('soloPlay.social.resolve')}
                                                            </Button>
                                                        ) : check.winner === 'EDGERUNNER' ? (
                                                            <CheckCircle sx={{ color: colors.neons.green.default }} />
                                                        ) : check.winner === 'NPC' ? (
                                                            <Cancel sx={{ color: colors.neons.red.default }} />
                                                        ) : (
                                                            <Chip label={t('soloPlay.social.tie')} size="small" sx={{ backgroundColor: colors.grays.gray700, color: '#fff' }} />
                                                        )}
                                                    </Stack>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {/* Outcome */}
                            {session.isComplete && session.npcImportance !== 'BACKGROUND' && (
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
                                            ? t('soloPlay.social.success')
                                            : t('soloPlay.social.failure')}
                                    </Typography>
                                </Box>
                            )}

                            {session.npcImportance === 'BACKGROUND' && (
                                <Box sx={{ mt: 1, p: 1, backgroundColor: `${accentColor}10`, borderRadius: 1 }}>
                                    <Typography variant="caption" sx={{ color: colors.grays.gray500, fontStyle: 'italic' }}>
                                        {t('soloPlay.social.backgroundNote')}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* Create Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${accentColor}40`,
                        boxShadow: readerMode ? '0 4px 20px rgba(0,0,0,0.15)' : `0 0 30px ${accentColor}40`,
                    },
                }}
            >
                <DialogTitle sx={{ fontFamily: '"Orbitron", sans-serif', color: readerMode ? colors.grays.gray000 : accentColor, borderBottom: `1px solid ${accentColor}40` }}>
                    {t('soloPlay.social.create')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <TextField fullWidth label={t('soloPlay.social.sessionName')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('soloPlay.social.sessionNamePlaceholder')} sx={textFieldStyle} />
                        <TextField fullWidth label={t('soloPlay.social.npcNameLabel')} value={npcName} onChange={(e) => setNpcName(e.target.value)} placeholder={t('soloPlay.social.npcNamePlaceholder')} sx={textFieldStyle} />
                        <TextField fullWidth label={t('soloPlay.social.goal')} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t('soloPlay.social.goalPlaceholder')} multiline rows={2} sx={textFieldStyle} />
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: readerMode ? '#666' : accentColor }}>
                                {t('soloPlay.social.importanceLabel')}
                            </InputLabel>
                            <Select value={importance} onChange={(e) => setImportance(e.target.value as NPCImportance)} label={t('soloPlay.social.importanceLabel')} sx={selectStyle}>
                                <MenuItem value="BACKGROUND">{t('soloPlay.social.importance.BACKGROUND')}</MenuItem>
                                <MenuItem value="SUPPORTING">{t('soloPlay.social.importance.SUPPORTING')}</MenuItem>
                                <MenuItem value="KEY">{t('soloPlay.social.importance.KEY')}</MenuItem>
                            </Select>
                        </FormControl>
                        {importance === 'KEY' && (
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: readerMode ? '#666' : accentColor }}>
                                    {t('soloPlay.social.numChecks')}
                                </InputLabel>
                                <Select value={numChecks} onChange={(e) => setNumChecks(e.target.value as number)} label={t('soloPlay.social.numChecks')} sx={selectStyle}>
                                    <MenuItem value={3}>{t('soloPlay.social.checksOption', { n: 3 })}</MenuItem>
                                    <MenuItem value={5}>{t('soloPlay.social.checksOption', { n: 5 })}</MenuItem>
                                    <MenuItem value={7}>{t('soloPlay.social.checksOption', { n: 7 })}</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}40` }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>{t('common.cancel')}</Button>
                    <Button onClick={handleCreate} variant="outlined" disabled={!name.trim() || !npcName.trim()} sx={buttonStyle}>{t('common.create')}</Button>
                </DialogActions>
            </Dialog>

            {/* Roll Dialog */}
            <Dialog
                open={rollDialogOpen}
                onClose={() => setRollDialogOpen(false)}
                maxWidth="sm"
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
                    {t('soloPlay.social.resolveCheck')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2}>
                        <Typography variant="caption" sx={{ color: colors.grays.gray500, textTransform: 'uppercase' }}>
                            {t('soloPlay.social.edgerunnerSide')}
                        </Typography>
                        <TextField fullWidth label={t('soloPlay.social.skillLabel')} value={edgerunnerSkill} onChange={(e) => setEdgerunnerSkill(e.target.value)} placeholder={t('soloPlay.social.edgerunnerSkillPlaceholder')} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)} />
                        <Stack direction="row" spacing={1}>
                            <TextField fullWidth label={t('soloPlay.social.rollLabel')} type="number" value={edgerunnerRoll} onChange={(e) => setEdgerunnerRoll(e.target.value)} placeholder="d10" sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)} />
                            <TextField fullWidth label={t('soloPlay.social.totalLabel')} type="number" value={edgerunnerTotal} onChange={(e) => setEdgerunnerTotal(e.target.value)} placeholder={t('soloPlay.social.edgerunnerTotalPlaceholder')} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)} />
                        </Stack>
                        <Typography variant="caption" sx={{ color: colors.grays.gray500, textTransform: 'uppercase' }}>
                            {t('soloPlay.social.npcSide')}
                        </Typography>
                        <TextField fullWidth label={t('soloPlay.social.skillLabel')} value={npcSkill} onChange={(e) => setNpcSkill(e.target.value)} placeholder={t('soloPlay.social.npcSkillPlaceholder')} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)} />
                        <Stack direction="row" spacing={1}>
                            <TextField fullWidth label={t('soloPlay.social.rollLabel')} type="number" value={npcRoll} onChange={(e) => setNpcRoll(e.target.value)} placeholder="d10" sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)} />
                            <TextField fullWidth label={t('soloPlay.social.totalLabel')} type="number" value={npcTotal} onChange={(e) => setNpcTotal(e.target.value)} placeholder={t('soloPlay.social.npcTotalPlaceholder')} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)} />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.yellow.default}40` }}>
                    <Button onClick={() => setRollDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>{t('common.cancel')}</Button>
                    <Button onClick={handleRollCheck} variant="outlined" sx={getCyberpunkButtonStyle(readerMode, colors.neons.yellow.default)}>{t('soloPlay.social.resolve')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default SocialChallengeTool
