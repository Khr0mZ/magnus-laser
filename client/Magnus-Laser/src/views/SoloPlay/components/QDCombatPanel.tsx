import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import CheckCircle from '@mui/icons-material/CheckCircle'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonAdd from '@mui/icons-material/PersonAdd'
import PlayArrow from '@mui/icons-material/PlayArrow'
import RestartAlt from '@mui/icons-material/RestartAlt'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type {
    MoraleMentality,
    NPCLevel,
    QDCombatSession,
    QDEdgerunner,
    QDEnemy,
    StressPointType,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    compareAttacks,
    countEdgerunnerAttacks,
    countEnemyAttacks,
    countHits,
    createQDCombatSession,
    distributeEdgerunnerAttacks,
    distributeEnemyAttacks,
    generateAllAttacks,
    isEdgerunnerHardened,
    rollMoraleCheck,
    rollTacticsCheck,
} from '../../../utils/generators/soloPlayUtils'

// Default empty Edgerunner
const createEmptyEdgerunner = (): Omit<QDEdgerunner, 'id'> => ({
    name: '',
    hasHighRefEvasion: false,
    hasHighAttack: false,
    hasHighWillBody: false,
    hasLuxuryWeapon: false,
    hasHighDexMov: false,
    hasHighAutoMartial: false,
    hasSoloRank4: false,
    hasSpeedware: false,
    canDodgeBullets: false,
    weaponName: '',
    weaponDamage: '2d6',
    attackSkillTotal: 10,
})

// Default empty Enemy
const createEmptyEnemy = (): Omit<QDEnemy, 'id'> => ({
    name: '',
    level: 'MOOK',
    isHardened: false,
    hasSpeedware: false,
    weaponName: '',
    weaponDamage: '2d6',
    attackSkillTotal: 10,
})

const QDCombatPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Session state
    const [session, setSession] = useState<QDCombatSession | null>(null)

    // Setup dialog state
    const [setupDialogOpen, setSetupDialogOpen] = useState(false)
    const [sessionName, setSessionName] = useState('')
    const [edgerunners, setEdgerunners] = useState<Omit<QDEdgerunner, 'id'>[]>([
        { ...createEmptyEdgerunner(), name: 'Edgerunner 1' },
    ])
    const [enemies, setEnemies] = useState<Omit<QDEnemy, 'id'>[]>([{ ...createEmptyEnemy(), name: 'Enemy 1' }])
    const [stressPointType, setStressPointType] = useState<StressPointType>('HALF_INCAPACITATED')
    const [customStressCondition, setCustomStressCondition] = useState('')
    const [moraleMentality, setMoraleMentality] = useState<MoraleMentality>('TRAINED')

    // Tactics dialog state
    const [tacticsDialogOpen, setTacticsDialogOpen] = useState(false)
    const [edgerunnerTactics, setEdgerunnerTactics] = useState(10)
    const [enemyTactics, setEnemyTactics] = useState(10)

    // Combat steps
    const combatSteps = [
        t('soloPlay.combat.steps.setup'),
        t('soloPlay.combat.steps.tactics'),
        t('soloPlay.combat.steps.counting'),
        t('soloPlay.combat.steps.attacking'),
        t('soloPlay.combat.steps.comparing'),
        t('soloPlay.combat.steps.outcome'),
    ]

    const getActiveStep = () => {
        if (!session) return 0
        switch (session.phase) {
            case 'SETUP':
                return 0
            case 'TACTICS':
                return 1
            case 'COUNTING':
                return 2
            case 'ATTACKING':
                return 3
            case 'COMPARING':
                return 4
            case 'OUTCOME':
                return 5
            case 'COMPLETE':
                return 6
            default:
                return 0
        }
    }

    // Handlers
    const handleStartCombat = () => {
        const newSession = createQDCombatSession(sessionName || 'Combat Session', edgerunners, enemies, {
            stressPointType,
            customCondition: customStressCondition,
            mentality: moraleMentality,
        })
        newSession.phase = 'TACTICS'
        setSession(newSession)
        setSetupDialogOpen(false)
        setTacticsDialogOpen(true)
    }

    const handleTacticsCheck = () => {
        if (!session) return
        const result = rollTacticsCheck(edgerunnerTactics, enemyTactics)

        // Calculate attack counts
        const edgerunnerWon = result.winner === 'EDGERUNNER'
        const edgerunnerAttackCount = countEdgerunnerAttacks(session.edgerunners, edgerunnerWon)
        const enemyAttackCount = countEnemyAttacks(session.enemies, !edgerunnerWon)

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                tacticsWinner: result.winner,
                tacticsEdgerunnerRoll: result.edgerunnerRoll,
                tacticsEnemyRoll: result.enemyRoll,
                edgerunnerAttackCount,
                enemyAttackCount,
                phase: 'COUNTING',
            }
        })
        setTacticsDialogOpen(false)
    }

    const handleMakeAttacks = () => {
        if (!session) return

        const edgerunnerWon = session.tacticsWinner === 'EDGERUNNER'
        const edgerunnerDist = distributeEdgerunnerAttacks(session.edgerunners, edgerunnerWon)
        const enemyDist = distributeEnemyAttacks(session.enemies, !edgerunnerWon)

        const edgerunnerAttacks = generateAllAttacks(edgerunnerDist, true)
        const enemyAttacks = generateAllAttacks(enemyDist, false)

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                edgerunnerAttacks,
                enemyAttacks,
                phase: 'ATTACKING',
            }
        })
    }

    const handleCompareResults = () => {
        if (!session) return

        const comparisons = compareAttacks(session.edgerunnerAttacks, session.enemyAttacks, session.edgerunners)
        const { edgerunnerHits, enemyHits } = countHits(comparisons)

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                comparisons,
                edgerunnerHits,
                enemyHits,
                phase: 'COMPARING',
            }
        })
    }

    const handleDetermineOutcome = () => {
        if (!session) return

        let outcome: QDCombatSession['outcome']
        if (session.edgerunnerHits > session.enemyHits) {
            outcome = 'EDGERUNNER_WIN'
        } else if (session.enemyHits > session.edgerunnerHits) {
            outcome = 'ENEMY_WIN'
        } else {
            outcome = 'DRAW'
        }

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                outcome,
                phase: 'OUTCOME',
            }
        })
    }

    const handleCheckMorale = () => {
        if (!session) return

        const moraleResult = rollMoraleCheck(session.morale.mentality)

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                morale: {
                    ...prev.morale,
                    triggered: true,
                    roll: moraleResult.roll,
                    result: moraleResult.result,
                },
                outcome: moraleResult.result === 'FLEE' ? 'ENEMY_FLED' : prev.outcome,
            }
        })
    }

    const handleEndCombat = (manualOutcome?: QDCombatSession['outcome']) => {
        if (!session) return

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                outcome: manualOutcome || prev.outcome,
                isComplete: true,
                completedAt: Date.now(),
                phase: 'COMPLETE',
            }
        })
    }

    const handleResetCombat = () => {
        setSession(null)
        setSessionName('')
        setEdgerunners([{ ...createEmptyEdgerunner(), name: 'Edgerunner 1' }])
        setEnemies([{ ...createEmptyEnemy(), name: 'Enemy 1' }])
    }

    // Edgerunner/Enemy management
    const addEdgerunner = () => {
        setEdgerunners((prev) => [...prev, { ...createEmptyEdgerunner(), name: `Edgerunner ${prev.length + 1}` }])
    }

    const removeEdgerunner = (index: number) => {
        setEdgerunners((prev) => prev.filter((_, i) => i !== index))
    }

    const updateEdgerunner = (index: number, updates: Partial<Omit<QDEdgerunner, 'id'>>) => {
        setEdgerunners((prev) => prev.map((e, i) => (i === index ? { ...e, ...updates } : e)))
    }

    const addEnemy = () => {
        setEnemies((prev) => [...prev, { ...createEmptyEnemy(), name: `Enemy ${prev.length + 1}` }])
    }

    const removeEnemy = (index: number) => {
        setEnemies((prev) => prev.filter((_, i) => i !== index))
    }

    const updateEnemy = (index: number, updates: Partial<Omit<QDEnemy, 'id'>>) => {
        setEnemies((prev) => prev.map((e, i) => (i === index ? { ...e, ...updates } : e)))
    }

    const getMentalityLabel = (mentality: MoraleMentality) => {
        switch (mentality) {
            case 'LOST_TO_VIOLENCE':
                return t('soloPlay.combat.morale.lostToViolence')
            case 'EXPERIENCED':
                return t('soloPlay.combat.morale.experienced')
            case 'TRAINED':
                return t('soloPlay.combat.morale.trained')
            case 'INEXPERIENCED':
                return t('soloPlay.combat.morale.inexperienced')
            case 'UNSURE':
                return t('soloPlay.combat.morale.unsure')
        }
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography
                    variant="h5"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.red.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.combat.title')}
                </Typography>
                {!session ? (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setSetupDialogOpen(true)}
                        sx={{
                            backgroundColor: colors.neons.red.default,
                            '&:hover': { backgroundColor: colors.neons.red.dark },
                        }}
                    >
                        {t('soloPlay.combat.startCombat')}
                    </Button>
                ) : (
                    <Button
                        variant="outlined"
                        startIcon={<RestartAlt />}
                        onClick={handleResetCombat}
                        sx={{
                            borderColor: colors.neons.red.default,
                            color: colors.neons.red.default,
                        }}
                    >
                        {t('soloPlay.combat.reset')}
                    </Button>
                )}
            </Stack>

            {!session ? (
                <Typography
                    variant="body1"
                    sx={{
                        color: colors.grays.gray600,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        py: 4,
                    }}
                >
                    {t('soloPlay.combat.noCombatYet')}
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {/* Stepper */}
                    <Grid size={12}>
                        <Stepper activeStep={getActiveStep()} alternativeLabel>
                            {combatSteps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Grid>

                    {/* Combat Info Card */}
                    <Grid size={12}>
                        <Card
                            sx={{
                                backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 25, 0.95)',
                                border: `1px solid ${colors.neons.red.default}40`,
                            }}
                        >
                            <CardContent>
                                <Stack spacing={2}>
                                    {/* Header */}
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        flexWrap="wrap"
                                        gap={2}
                                    >
                                        <Typography variant="h6" sx={{ color: colors.neons.red.default }}>
                                            {session.name}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={`${session.edgerunners.length} ${t(
                                                    'soloPlay.combat.edgerunners'
                                                )}`}
                                                sx={{
                                                    backgroundColor: colors.neons.green.default,
                                                    color: colors.grays.gray000,
                                                }}
                                            />
                                            <Chip
                                                label={`${session.enemies.length} ${t('soloPlay.combat.enemies')}`}
                                                sx={{
                                                    backgroundColor: colors.neons.red.default,
                                                    color: colors.grays.gray000,
                                                }}
                                            />
                                        </Stack>
                                    </Stack>

                                    {/* Tactics Result */}
                                    {session.tacticsWinner && (
                                        <Paper
                                            sx={{
                                                p: 2,
                                                backgroundColor:
                                                    session.tacticsWinner === 'EDGERUNNER'
                                                        ? colors.neons.green.default + '20'
                                                        : colors.neons.red.default + '20',
                                            }}
                                        >
                                            <Typography variant="subtitle2">
                                                {t('soloPlay.combat.tacticsResult')}:{' '}
                                                <strong>
                                                    {session.tacticsWinner === 'EDGERUNNER'
                                                        ? t('soloPlay.combat.edgerunners')
                                                        : t('soloPlay.combat.enemies')}
                                                </strong>{' '}
                                                ({session.tacticsEdgerunnerRoll} vs {session.tacticsEnemyRoll})
                                            </Typography>
                                        </Paper>
                                    )}

                                    {/* Attack Counts */}
                                    {session.phase !== 'SETUP' && session.phase !== 'TACTICS' && (
                                        <Stack direction="row" spacing={2}>
                                            <Chip
                                                label={`${t('soloPlay.combat.edgerunnerAttacks')}: ${
                                                    session.edgerunnerAttackCount
                                                }`}
                                                sx={{ backgroundColor: colors.neons.green.default + '40' }}
                                            />
                                            <Chip
                                                label={`${t('soloPlay.combat.enemyAttacks')}: ${
                                                    session.enemyAttackCount
                                                }`}
                                                sx={{ backgroundColor: colors.neons.red.default + '40' }}
                                            />
                                        </Stack>
                                    )}

                                    {/* Action Buttons based on phase */}
                                    <Stack direction="row" spacing={2} flexWrap="wrap">
                                        {session.phase === 'COUNTING' && (
                                            <Button
                                                variant="contained"
                                                startIcon={<Casino />}
                                                onClick={handleMakeAttacks}
                                                sx={{ backgroundColor: colors.neons.cyan.default }}
                                            >
                                                {t('soloPlay.combat.makeAttacks')}
                                            </Button>
                                        )}
                                        {session.phase === 'ATTACKING' && (
                                            <Button
                                                variant="contained"
                                                startIcon={<PlayArrow />}
                                                onClick={handleCompareResults}
                                                sx={{ backgroundColor: colors.neons.purple.default }}
                                            >
                                                {t('soloPlay.combat.compareResults')}
                                            </Button>
                                        )}
                                        {session.phase === 'COMPARING' && (
                                            <Button
                                                variant="contained"
                                                startIcon={<CheckCircle />}
                                                onClick={handleDetermineOutcome}
                                                sx={{ backgroundColor: colors.neons.yellow.default }}
                                            >
                                                {t('soloPlay.combat.determineOutcome')}
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Attack Checks Results */}
                    {session.edgerunnerAttacks.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography sx={{ color: colors.neons.green.default }}>
                                        {t('soloPlay.combat.edgerunnerAttacks')} ({session.edgerunnerAttacks.length})
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('common.name')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.roll')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.total')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.weapon')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {session.edgerunnerAttacks
                                                .sort((a, b) => b.total - a.total)
                                                .map((atk) => (
                                                    <TableRow
                                                        key={atk.id}
                                                        sx={{
                                                            backgroundColor: atk.fumbled
                                                                ? colors.neons.red.default + '20'
                                                                : 'inherit',
                                                        }}
                                                    >
                                                        <TableCell>{atk.combatantName}</TableCell>
                                                        <TableCell>
                                                            {atk.roll}
                                                            {atk.fumbled && ' ⚠️'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <strong>{atk.total}</strong>
                                                        </TableCell>
                                                        <TableCell>{atk.weaponUsed}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    )}

                    {session.enemyAttacks.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography sx={{ color: colors.neons.red.default }}>
                                        {t('soloPlay.combat.enemyAttacks')} ({session.enemyAttacks.length})
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('common.name')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.roll')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.total')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.weapon')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {session.enemyAttacks
                                                .sort((a, b) => b.total - a.total)
                                                .map((atk) => (
                                                    <TableRow
                                                        key={atk.id}
                                                        sx={{
                                                            backgroundColor: atk.fumbled
                                                                ? colors.neons.red.default + '20'
                                                                : 'inherit',
                                                        }}
                                                    >
                                                        <TableCell>{atk.combatantName}</TableCell>
                                                        <TableCell>
                                                            {atk.roll}
                                                            {atk.fumbled && ' ⚠️'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <strong>{atk.total}</strong>
                                                        </TableCell>
                                                        <TableCell>{atk.weaponUsed}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    )}

                    {/* Comparison Results */}
                    {session.comparisons.length > 0 && (
                        <Grid size={12}>
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography sx={{ color: colors.neons.purple.default }}>
                                        {t('soloPlay.combat.comparison')} - {t('soloPlay.combat.edgerunnerHits')}:{' '}
                                        {session.edgerunnerHits}, {t('soloPlay.combat.enemyHits')}: {session.enemyHits}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('soloPlay.combat.edgerunner')}</TableCell>
                                                <TableCell align="center">{t('soloPlay.combat.vs')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.enemy')}</TableCell>
                                                <TableCell>{t('soloPlay.combat.winner')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {session.comparisons.map((comp, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    sx={{
                                                        backgroundColor:
                                                            comp.winner === 'EDGERUNNER' ||
                                                            comp.winner === 'UNOPPOSED_EDGERUNNER'
                                                                ? colors.neons.green.default + '20'
                                                                : comp.winner === 'ENEMY' ||
                                                                  comp.winner === 'UNOPPOSED_ENEMY'
                                                                ? colors.neons.red.default + '20'
                                                                : 'inherit',
                                                    }}
                                                >
                                                    <TableCell>
                                                        {comp.edgerunnerAttack
                                                            ? `${comp.edgerunnerAttack.combatantName} (${comp.edgerunnerAttack.total})`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell align="center">vs</TableCell>
                                                    <TableCell>
                                                        {comp.enemyAttack
                                                            ? `${comp.enemyAttack.combatantName} (${comp.enemyAttack.total})`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={
                                                                comp.dodged
                                                                    ? t('soloPlay.combat.dodged')
                                                                    : comp.winner === 'EDGERUNNER' ||
                                                                      comp.winner === 'UNOPPOSED_EDGERUNNER'
                                                                    ? t('soloPlay.combat.edgerunnerHit')
                                                                    : comp.winner === 'ENEMY' ||
                                                                      comp.winner === 'UNOPPOSED_ENEMY'
                                                                    ? t('soloPlay.combat.enemyHit')
                                                                    : t('soloPlay.combat.tie')
                                                            }
                                                            sx={{
                                                                backgroundColor:
                                                                    comp.winner === 'EDGERUNNER' ||
                                                                    comp.winner === 'UNOPPOSED_EDGERUNNER'
                                                                        ? colors.neons.green.default
                                                                        : comp.winner === 'ENEMY' ||
                                                                          comp.winner === 'UNOPPOSED_ENEMY'
                                                                        ? colors.neons.red.default
                                                                        : colors.grays.gray600,
                                                                color: colors.grays.gray000,
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    )}

                    {/* Outcome */}
                    {session.phase === 'OUTCOME' && (
                        <Grid size={12}>
                            <Card
                                sx={{
                                    backgroundColor:
                                        session.outcome === 'EDGERUNNER_WIN'
                                            ? colors.neons.green.default + '30'
                                            : session.outcome === 'ENEMY_WIN'
                                            ? colors.neons.red.default + '30'
                                            : colors.neons.yellow.default + '30',
                                    border: `2px solid ${
                                        session.outcome === 'EDGERUNNER_WIN'
                                            ? colors.neons.green.default
                                            : session.outcome === 'ENEMY_WIN'
                                            ? colors.neons.red.default
                                            : colors.neons.yellow.default
                                    }`,
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h5" align="center" gutterBottom>
                                        {t(`soloPlay.combat.outcomes.${session.outcome}`)}
                                    </Typography>
                                    <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                                        {t('soloPlay.combat.edgerunnerHits')}: {session.edgerunnerHits} |{' '}
                                        {t('soloPlay.combat.enemyHits')}: {session.enemyHits}
                                    </Typography>

                                    {/* Morale Check */}
                                    {!session.morale.triggered && (
                                        <Stack spacing={2} alignItems="center">
                                            <Typography variant="subtitle2">
                                                {t('soloPlay.combat.morale.checkQuestion')}
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                onClick={handleCheckMorale}
                                                sx={{ borderColor: colors.neons.yellow.default }}
                                            >
                                                {t('soloPlay.combat.morale.rollMorale')} (
                                                {getMentalityLabel(session.morale.mentality)})
                                            </Button>
                                        </Stack>
                                    )}

                                    {session.morale.triggered && (
                                        <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                                            <Typography variant="subtitle2">
                                                {t('soloPlay.combat.morale.result')}:{' '}
                                                <Chip
                                                    label={`${session.morale.roll} - ${
                                                        session.morale.result === 'FLEE'
                                                            ? t('soloPlay.combat.morale.flee')
                                                            : t('soloPlay.combat.morale.fight')
                                                    }`}
                                                    sx={{
                                                        backgroundColor:
                                                            session.morale.result === 'FLEE'
                                                                ? colors.neons.yellow.default
                                                                : colors.neons.red.default,
                                                    }}
                                                />
                                            </Typography>
                                        </Paper>
                                    )}

                                    <Divider sx={{ my: 2 }} />

                                    {/* End Combat Buttons */}
                                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleEndCombat('EDGERUNNER_WIN')}
                                            sx={{ color: colors.neons.green.default }}
                                        >
                                            {t('soloPlay.combat.edgerunnerWin')}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleEndCombat('ENEMY_WIN')}
                                            sx={{ color: colors.neons.red.default }}
                                        >
                                            {t('soloPlay.combat.enemyWin')}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleEndCombat('DRAW')}
                                            sx={{ color: colors.neons.yellow.default }}
                                        >
                                            {t('soloPlay.combat.draw')}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleEndCombat('ESCAPE')}
                                            sx={{ color: colors.neons.purple.default }}
                                        >
                                            {t('soloPlay.combat.escape')}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleEndCombat('ENEMY_FLED')}
                                            sx={{ color: colors.neons.cyan.default }}
                                        >
                                            {t('soloPlay.combat.enemyFled')}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleEndCombat('ENEMY_SURRENDERED')}
                                            sx={{ color: colors.neons.orange.default }}
                                        >
                                            {t('soloPlay.combat.enemySurrendered')}
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Combat Complete */}
                    {session.isComplete && (
                        <Grid size={12}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    backgroundColor: colors.neons.cyan.default + '10',
                                    border: `2px solid ${colors.neons.cyan.default}`,
                                }}
                            >
                                <Typography variant="h4" sx={{ color: colors.neons.cyan.default }}>
                                    {t('soloPlay.combat.combatComplete')}
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    {t(`soloPlay.combat.outcomes.${session.outcome}`)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Setup Dialog */}
            <Dialog open={setupDialogOpen} onClose={() => setSetupDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ color: colors.neons.red.default }}>{t('soloPlay.combat.setupCombat')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.combat.sessionName')}
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                        />

                        <Divider />

                        {/* Edgerunners Section */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" sx={{ color: colors.neons.green.default }}>
                                    {t('soloPlay.combat.edgerunners')} ({edgerunners.length})
                                </Typography>
                                <IconButton onClick={addEdgerunner} sx={{ color: colors.neons.green.default }}>
                                    <PersonAdd />
                                </IconButton>
                            </Stack>
                            <Stack spacing={2}>
                                {edgerunners.map((e, index) => (
                                    <Paper key={index} sx={{ p: 2, backgroundColor: 'rgba(0,255,0,0.05)' }}>
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <TextField
                                                    size="small"
                                                    label={t('common.name')}
                                                    value={e.name}
                                                    onChange={(ev) =>
                                                        updateEdgerunner(index, { name: ev.target.value })
                                                    }
                                                    sx={{ flex: 1 }}
                                                />
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    label={t('soloPlay.combat.attackSkill')}
                                                    value={e.attackSkillTotal}
                                                    onChange={(ev) =>
                                                        updateEdgerunner(index, {
                                                            attackSkillTotal: parseInt(ev.target.value) || 10,
                                                        })
                                                    }
                                                    sx={{ width: 100 }}
                                                />
                                                <TextField
                                                    size="small"
                                                    label={t('soloPlay.combat.weapon')}
                                                    value={e.weaponName}
                                                    onChange={(ev) =>
                                                        updateEdgerunner(index, { weaponName: ev.target.value })
                                                    }
                                                    sx={{ width: 150 }}
                                                />
                                                <TextField
                                                    size="small"
                                                    label={t('soloPlay.combat.damage')}
                                                    value={e.weaponDamage}
                                                    onChange={(ev) =>
                                                        updateEdgerunner(index, { weaponDamage: ev.target.value })
                                                    }
                                                    sx={{ width: 80 }}
                                                />
                                                <IconButton
                                                    onClick={() => removeEdgerunner(index)}
                                                    disabled={edgerunners.length === 1}
                                                    sx={{ color: colors.neons.red.default }}
                                                >
                                                    <DeleteOutline />
                                                </IconButton>
                                            </Stack>

                                            {/* Hardened Criteria */}
                                            <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>
                                                {t('soloPlay.combat.hardenedCriteria')}:
                                            </Typography>
                                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasHighRefEvasion}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasHighRefEvasion: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="caption">{t('soloPlay.combat.hardened.refEvasion')}</Typography>
                                                    }
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasHighAttack}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasHighAttack: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={<Typography variant="caption">{t('soloPlay.combat.hardened.attack15')}</Typography>}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasHighWillBody}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasHighWillBody: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={<Typography variant="caption">{t('soloPlay.combat.hardened.willBody')}</Typography>}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasLuxuryWeapon}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasLuxuryWeapon: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={<Typography variant="caption">{t('soloPlay.combat.hardened.luxuryWeapon')}</Typography>}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasHighDexMov}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasHighDexMov: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={<Typography variant="caption">{t('soloPlay.combat.hardened.dexMov')}</Typography>}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasHighAutoMartial}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasHighAutoMartial: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="caption">{t('soloPlay.combat.hardened.autofireMartial')}</Typography>
                                                    }
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasSoloRank4}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasSoloRank4: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={<Typography variant="caption">{t('soloPlay.combat.hardened.soloRank4')}</Typography>}
                                                />
                                            </Stack>

                                            {/* Special Abilities */}
                                            <Stack direction="row" spacing={2}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.hasSpeedware}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    hasSpeedware: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={t('soloPlay.combat.hasSpeedware')}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={e.canDodgeBullets}
                                                            onChange={(ev) =>
                                                                updateEdgerunner(index, {
                                                                    canDodgeBullets: ev.target.checked,
                                                                })
                                                            }
                                                        />
                                                    }
                                                    label={t('soloPlay.combat.canDodgeBullets')}
                                                />
                                                {isEdgerunnerHardened(e as QDEdgerunner) && (
                                                    <Chip
                                                        label={t('soloPlay.combat.hardened')}
                                                        size="small"
                                                        sx={{ backgroundColor: colors.neons.yellow.default }}
                                                    />
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Enemies Section */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" sx={{ color: colors.neons.red.default }}>
                                    {t('soloPlay.combat.enemies')} ({enemies.length})
                                </Typography>
                                <IconButton onClick={addEnemy} sx={{ color: colors.neons.red.default }}>
                                    <PersonAdd />
                                </IconButton>
                            </Stack>
                            <Stack spacing={2}>
                                {enemies.map((e, index) => (
                                    <Paper key={index} sx={{ p: 2, backgroundColor: 'rgba(255,0,0,0.05)' }}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <TextField
                                                size="small"
                                                label={t('common.name')}
                                                value={e.name}
                                                onChange={(ev) => updateEnemy(index, { name: ev.target.value })}
                                                sx={{ flex: 1, minWidth: 150 }}
                                            />
                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <InputLabel>{t('soloPlay.combat.level')}</InputLabel>
                                                <Select
                                                    value={e.level}
                                                    onChange={(ev) =>
                                                        updateEnemy(index, { level: ev.target.value as NPCLevel })
                                                    }
                                                    label={t('soloPlay.combat.level')}
                                                >
                                                    <MenuItem value="MOOK">{t('soloPlay.combat.levels.mook')}</MenuItem>
                                                    <MenuItem value="LIEUTENANT">
                                                        {t('soloPlay.combat.levels.lieutenant')}
                                                    </MenuItem>
                                                    <MenuItem value="MINI_BOSS">
                                                        {t('soloPlay.combat.levels.miniBoss')}
                                                    </MenuItem>
                                                    <MenuItem value="BOSS">{t('soloPlay.combat.levels.boss')}</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <TextField
                                                size="small"
                                                type="number"
                                                label={t('soloPlay.combat.attackSkill')}
                                                value={e.attackSkillTotal}
                                                onChange={(ev) =>
                                                    updateEnemy(index, {
                                                        attackSkillTotal: parseInt(ev.target.value) || 10,
                                                    })
                                                }
                                                sx={{ width: 100 }}
                                            />
                                            <TextField
                                                size="small"
                                                label={t('soloPlay.combat.weapon')}
                                                value={e.weaponName}
                                                onChange={(ev) => updateEnemy(index, { weaponName: ev.target.value })}
                                                sx={{ width: 120 }}
                                            />
                                            <TextField
                                                size="small"
                                                label={t('soloPlay.combat.damage')}
                                                value={e.weaponDamage}
                                                onChange={(ev) => updateEnemy(index, { weaponDamage: ev.target.value })}
                                                sx={{ width: 80 }}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={e.isHardened}
                                                        onChange={(ev) =>
                                                            updateEnemy(index, { isHardened: ev.target.checked })
                                                        }
                                                    />
                                                }
                                                label={t('soloPlay.combat.hardened')}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={e.hasSpeedware}
                                                        onChange={(ev) =>
                                                            updateEnemy(index, { hasSpeedware: ev.target.checked })
                                                        }
                                                    />
                                                }
                                                label={t('soloPlay.combat.hasSpeedware')}
                                            />
                                            <IconButton
                                                onClick={() => removeEnemy(index)}
                                                disabled={enemies.length === 1}
                                                sx={{ color: colors.neons.red.default }}
                                            >
                                                <DeleteOutline />
                                            </IconButton>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Morale Configuration */}
                        <Box>
                            <Typography variant="h6" sx={{ color: colors.neons.yellow.default, mb: 2 }}>
                                {t('soloPlay.combat.morale.title')}
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>{t('soloPlay.combat.morale.stressPoint')}</InputLabel>
                                    <Select
                                        value={stressPointType}
                                        onChange={(e) => setStressPointType(e.target.value as StressPointType)}
                                        label={t('soloPlay.combat.morale.stressPoint')}
                                    >
                                        <MenuItem value="HALF_INCAPACITATED">
                                            {t('soloPlay.combat.morale.halfIncapacitated')}
                                        </MenuItem>
                                        <MenuItem value="SERIOUSLY_WOUNDED">
                                            {t('soloPlay.combat.morale.seriouslyWounded')}
                                        </MenuItem>
                                        <MenuItem value="ROUND_5">{t('soloPlay.combat.morale.round5')}</MenuItem>
                                        <MenuItem value="CUSTOM">{t('soloPlay.combat.morale.custom')}</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>{t('soloPlay.combat.morale.mentality')}</InputLabel>
                                    <Select
                                        value={moraleMentality}
                                        onChange={(e) => setMoraleMentality(e.target.value as MoraleMentality)}
                                        label={t('soloPlay.combat.morale.mentality')}
                                    >
                                        <MenuItem value="LOST_TO_VIOLENCE">
                                            {t('soloPlay.combat.morale.lostToViolence')}
                                        </MenuItem>
                                        <MenuItem value="EXPERIENCED">
                                            {t('soloPlay.combat.morale.experienced')}
                                        </MenuItem>
                                        <MenuItem value="TRAINED">{t('soloPlay.combat.morale.trained')}</MenuItem>
                                        <MenuItem value="INEXPERIENCED">
                                            {t('soloPlay.combat.morale.inexperienced')}
                                        </MenuItem>
                                        <MenuItem value="UNSURE">{t('soloPlay.combat.morale.unsure')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                            {stressPointType === 'CUSTOM' && (
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t('soloPlay.combat.morale.customCondition')}
                                    value={customStressCondition}
                                    onChange={(e) => setCustomStressCondition(e.target.value)}
                                    sx={{ mt: 2 }}
                                />
                            )}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSetupDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleStartCombat}
                        variant="contained"
                        startIcon={<PlayArrow />}
                        sx={{
                            backgroundColor: colors.neons.red.default,
                            '&:hover': { backgroundColor: colors.neons.red.dark },
                        }}
                    >
                        {t('soloPlay.combat.startCombat')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tactics Dialog */}
            <Dialog open={tacticsDialogOpen} onClose={() => {}} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: colors.neons.cyan.default }}>{t('soloPlay.combat.tacticsCheck')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: colors.grays.gray600 }}>
                        {t('soloPlay.combat.tacticsDescription')}
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            type="number"
                            label={t('soloPlay.combat.edgerunnerTactics')}
                            value={edgerunnerTactics}
                            onChange={(e) => setEdgerunnerTactics(parseInt(e.target.value) || 0)}
                            helperText={t('soloPlay.combat.tacticsHelp')}
                        />
                        <TextField
                            type="number"
                            label={t('soloPlay.combat.enemyTactics')}
                            value={enemyTactics}
                            onChange={(e) => setEnemyTactics(parseInt(e.target.value) || 0)}
                            helperText={t('soloPlay.combat.tacticsEnemyHelp')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleTacticsCheck}
                        variant="contained"
                        startIcon={<Casino />}
                        sx={{ backgroundColor: colors.neons.cyan.default }}
                    >
                        {t('soloPlay.combat.rollTactics')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default QDCombatPanel
