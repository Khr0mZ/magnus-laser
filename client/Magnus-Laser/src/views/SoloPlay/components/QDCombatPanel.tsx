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
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomScrollbar from '../../../components/CustomScrollbar'
import CyberpunkCheckbox from '../../../components/CyberpunkCheckbox'
import CyberpunkFormControl from '../../../components/CyberpunkFormControl'
import CyberpunkFormControlLabel from '../../../components/CyberpunkFormControlLabel'
import { pulseGlowBlue, pulseGlowCyan } from '../../../components/common/Animations'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import WarningAmber from '@mui/icons-material/WarningAmber'
import type {
    NPCLevel,
    QDCombatSession,
    QDEdgerunner,
    QDEnemy,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { getKV, KV_KEYS, setKV } from '../../../utils/db'
import {
    calculateDamageForHit,
    compareAttacks,
    countEdgerunnerAttacks,
    countEnemyAttacks,
    countHits,
    createQDCombatSession,
    distributeEdgerunnerAttacks,
    distributeEnemyAttacks,
    generateAllAttacks,
    isEdgerunnerHardened,
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
    armorSP: 11,
    currentHP: 40,
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
    const [session, setSession] = useState<QDCombatSession | null>(null)

    // Setup dialog state
    const [setupDialogOpen, setSetupDialogOpen] = useState(false)
    const [sessionName, setSessionName] = useState('')
    const [edgerunners, setEdgerunners] = useState<Omit<QDEdgerunner, 'id'>[]>([
        { ...createEmptyEdgerunner(), name: 'Edgerunner 1' },
    ])
    const [enemies, setEnemies] = useState<Omit<QDEnemy, 'id'>[]>([{ ...createEmptyEnemy(), name: 'Enemy 1' }])

    // Tactics dialog state
    const [tacticsDialogOpen, setTacticsDialogOpen] = useState(false)
    const [edgerunnerTactics, setEdgerunnerTactics] = useState(10)
    const [enemyTactics, setEnemyTactics] = useState(10)

    // Load persisted session on mount
    useEffect(() => {
        getKV<QDCombatSession>(KV_KEYS.qdCombatSession).then((data) => {
            if (data) setSession(data)
        })
    }, [])

    // Persist session to IndexedDB on change
    useEffect(() => {
        setKV(KV_KEYS.qdCombatSession, session)
    }, [session])

    // Combat steps
    const combatSteps = [
        t('soloPlay.combat.steps.setup'),
        t('soloPlay.combat.steps.tactics'),
        t('soloPlay.combat.steps.counting'),
        t('soloPlay.combat.steps.attacking'),
        t('soloPlay.combat.steps.comparing'),
        t('soloPlay.combat.steps.outcome'),
        t('soloPlay.combat.steps.damage'),
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
            case 'DAMAGE':
                return 6
            case 'COMPLETE':
                return 7
            default:
                return 0
        }
    }

    // Handlers
    const handleStartCombat = () => {
        const newSession = createQDCombatSession(sessionName || 'Combat Session', edgerunners, enemies)
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

    const handleRollDamage = () => {
        if (!session) return

        const damageResults: QDCombatSession['damageResults'] = []
        // Track running SP/HP for each edgerunner across multiple hits
        const edgerunnerState = new Map(
            session.edgerunners.map(e => [e.id, { armorSP: e.armorSP, currentHP: e.currentHP }])
        )
        // Track existing critical injuries per target (for re-roll rule)
        const existingInjuries = new Map<string, string[]>()

        // For each enemy hit, calculate damage against the targeted edgerunner
        let unopposedIndex = 0
        for (const comp of session.comparisons) {
            if (comp.winner !== 'ENEMY' && comp.winner !== 'UNOPPOSED_ENEMY') continue
            if (!comp.enemyAttack) continue

            // Determine target edgerunner
            let targetId: string
            let targetName: string
            if (comp.edgerunnerAttack) {
                targetId = comp.edgerunnerAttack.combatantId
                targetName = comp.edgerunnerAttack.combatantName
            } else {
                // Unopposed: round-robin distribution
                const edgerunner = session.edgerunners[unopposedIndex % session.edgerunners.length]
                targetId = edgerunner.id
                targetName = edgerunner.name
                unopposedIndex++
            }

            const state = edgerunnerState.get(targetId) || { armorSP: 11, currentHP: 40 }
            const targetInjuries = existingInjuries.get(targetId) || []
            const result = calculateDamageForHit(comp.enemyAttack.weaponDamage, state.armorSP, targetInjuries)

            // Track new injury for re-roll
            if (result.criticalInjury) {
                targetInjuries.push(result.criticalInjury.nameKey)
                existingInjuries.set(targetId, targetInjuries)
            }

            damageResults.push({
                ...result,
                targetId,
                targetName,
                attackerName: comp.enemyAttack.combatantName,
                weaponName: comp.enemyAttack.weaponUsed,
            })

            // Update running state for subsequent hits
            state.currentHP -= result.damageAfterArmor
            if (result.armorReduced) state.armorSP -= 1
        }

        // Update edgerunner HP and SP in session
        const updatedEdgerunners = session.edgerunners.map(e => {
            const state = edgerunnerState.get(e.id)
            if (!state) return e
            return { ...e, armorSP: state.armorSP, currentHP: state.currentHP }
        })

        setSession((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                damageResults,
                edgerunners: updatedEdgerunners,
                phase: 'DAMAGE',
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
                <Paper
                    sx={{
                        p: 3,
                        backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10,15,25,0.95)',
                        border: `1px solid ${colors.neons.red.default}30`,
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
                        {t('soloPlay.combat.noCombatYet')}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.grays.gray500,
                            textAlign: 'center',
                            mt: 2,
                        }}
                    >
                        {t('soloPlay.combat.description')}
                    </Typography>
                </Paper>
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
                    {(session.phase === 'OUTCOME' || session.phase === 'DAMAGE') && (
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

                                    {/* Roll Damage Button - only in OUTCOME phase and if there are enemy hits */}
                                    {session.phase === 'OUTCOME' && session.enemyHits > 0 && (
                                        <Stack spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<Casino />}
                                                onClick={handleRollDamage}
                                                sx={{
                                                    backgroundColor: colors.neons.red.default,
                                                    '&:hover': { backgroundColor: colors.neons.red.dark },
                                                }}
                                            >
                                                {t('soloPlay.combat.rollDamage')}
                                            </Button>
                                        </Stack>
                                    )}

                                    {/* No damage message */}
                                    {session.phase === 'OUTCOME' && session.enemyHits === 0 && (
                                        <Typography variant="body2" align="center" sx={{ mb: 2, color: colors.neons.green.default }}>
                                            {t('soloPlay.combat.noDamageToResolve')}
                                        </Typography>
                                    )}

                                    {/* Damage Results */}
                                    {session.damageResults.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: colors.neons.red.default,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    mb: 1,
                                                }}
                                            >
                                                {t('soloPlay.combat.damageResults')}
                                            </Typography>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>{t('soloPlay.combat.target')}</TableCell>
                                                        <TableCell>{t('soloPlay.combat.weapon')}</TableCell>
                                                        <TableCell>{t('soloPlay.combat.diceRolled')}</TableCell>
                                                        <TableCell>{t('soloPlay.combat.totalDamage')}</TableCell>
                                                        <TableCell>{t('soloPlay.combat.armorSP')}</TableCell>
                                                        <TableCell>{t('soloPlay.combat.damageAfterArmor')}</TableCell>
                                                        <TableCell>{t('soloPlay.combat.criticalInjury')}</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {session.damageResults.map((dmg, idx) => (
                                                        <TableRow
                                                            key={idx}
                                                            sx={{
                                                                backgroundColor: dmg.hasCritical
                                                                    ? colors.neons.red.default + '20'
                                                                    : 'inherit',
                                                            }}
                                                        >
                                                            <TableCell>{dmg.targetName}</TableCell>
                                                            <TableCell>
                                                                {dmg.attackerName} ({dmg.weaponName})
                                                            </TableCell>
                                                            <TableCell>
                                                                [{dmg.diceResults.join(', ')}]
                                                            </TableCell>
                                                            <TableCell>{dmg.totalDamage}</TableCell>
                                                            <TableCell>
                                                                {dmg.armorSP}
                                                                {dmg.armorReduced && (
                                                                    <Typography
                                                                        component="span"
                                                                        variant="caption"
                                                                        sx={{ color: colors.neons.orange.default, ml: 0.5 }}
                                                                    >
                                                                        (-1)
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <strong>{dmg.damageAfterArmor}</strong>
                                                                {dmg.bonusDamage > 0 && (
                                                                    <Typography
                                                                        component="span"
                                                                        variant="caption"
                                                                        sx={{ color: colors.neons.red.default, ml: 0.5 }}
                                                                    >
                                                                        (+{dmg.bonusDamage} crit)
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {dmg.hasCritical && dmg.criticalInjury ? (
                                                                    <Stack spacing={0.25}>
                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                            <WarningAmber sx={{ color: colors.neons.red.default, fontSize: 16 }} />
                                                                            <Chip
                                                                                size="small"
                                                                                label={`${t(`soloPlay.combat.criticalInjuries.${dmg.criticalInjury.nameKey}.name`)} (${dmg.criticalInjury.roll})`}
                                                                                sx={{
                                                                                    backgroundColor: colors.neons.red.default,
                                                                                    color: '#fff',
                                                                                    fontWeight: 'bold',
                                                                                }}
                                                                            />
                                                                        </Stack>
                                                                        <Typography variant="caption" sx={{ color: colors.neons.orange.default, fontSize: '0.65rem' }}>
                                                                            {t(`soloPlay.combat.criticalInjuries.${dmg.criticalInjury.nameKey}.effect`)}
                                                                        </Typography>
                                                                    </Stack>
                                                                ) : (
                                                                    <Chip
                                                                        size="small"
                                                                        label={t('soloPlay.combat.noCritical')}
                                                                        sx={{
                                                                            backgroundColor: colors.grays.gray600,
                                                                            color: '#fff',
                                                                        }}
                                                                    />
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            {/* HP Summary */}
                                            <Paper sx={{ p: 1.5, mt: 1, backgroundColor: 'rgba(255, 0, 0, 0.05)' }}>
                                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                                    {t('soloPlay.combat.hpRemaining')}
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {session.edgerunners.map((e) => (
                                                        <Chip
                                                            key={e.id}
                                                            label={`${e.name}: ${e.currentHP} HP (SP ${e.armorSP})`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor:
                                                                    e.currentHP <= 0
                                                                        ? colors.neons.red.default
                                                                        : e.currentHP <= 20
                                                                          ? colors.neons.orange.default
                                                                          : colors.neons.green.default,
                                                                color: '#fff',
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Paper>

                                            {/* Critical Injury Summary */}
                                            {session.damageResults.some(d => d.hasCritical) && (
                                                <Paper
                                                    sx={{
                                                        p: 1.5,
                                                        mt: 1,
                                                        backgroundColor: `${colors.neons.orange.default}15`,
                                                        border: `1px solid ${colors.neons.orange.default}`,
                                                    }}
                                                >
                                                    <Stack spacing={1}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <WarningAmber sx={{ color: colors.neons.orange.default }} />
                                                            <Typography variant="body2" sx={{ color: colors.neons.orange.default, fontWeight: 'bold' }}>
                                                                {t('soloPlay.combat.criticalInjurySummary')}
                                                            </Typography>
                                                        </Stack>
                                                        {session.damageResults.filter(d => d.hasCritical && d.criticalInjury).map((dmg, idx) => (
                                                            <Typography key={idx} variant="caption" sx={{ color: colors.neons.orange.default }}>
                                                                <strong>{dmg.targetName}</strong>: {t(`soloPlay.combat.criticalInjuries.${dmg.criticalInjury!.nameKey}.name`)} — {t(`soloPlay.combat.criticalInjuries.${dmg.criticalInjury!.nameKey}.effect`)}
                                                            </Typography>
                                                        ))}
                                                    </Stack>
                                                </Paper>
                                            )}
                                        </Box>
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
            <Dialog
                open={setupDialogOpen}
                onClose={() => setSetupDialogOpen(false)}
                maxWidth="lg"
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
                                  border: `1px solid ${colors.neons.red.default}40`,
                                  boxShadow: `0 0 20px ${colors.neons.red.default}40`,
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
                                          'linear-gradient(to right, rgba(255, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 0, 0.03) 1px, transparent 1px)',
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
                                  color: '#d32f2f',
                                  borderBottom: '1px solid #eee',
                              }
                            : {
                                  color: colors.neons.red.default,
                                  textShadow: `0 0 5px ${colors.neons.red.default}`,
                                  fontFamily: '"Orbitron", monospace',
                                  borderBottom: `1px solid ${colors.neons.red.default}40`,
                                  position: 'relative',
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                  },
                              }
                    }
                >
                    <Typography
                        variant="h3"
                        component="div"
                        className="glitch-text"
                        data-text={t('soloPlay.combat.setupCombat')}
                    >
                        {t('soloPlay.combat.setupCombat')}
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
                        <Stack spacing={3} sx={{ mt: 1, pr: 3 }}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.combat.sessionName')}
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                            />

                            <Divider />

                            {/* Edgerunners Section */}
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: readerMode ? '#2e7d32' : colors.neons.green.default,
                                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                        }}
                                    >
                                        {t('soloPlay.combat.edgerunners')} ({edgerunners.length})
                                    </Typography>
                                    <IconButton onClick={addEdgerunner} sx={{ color: colors.neons.green.default }}>
                                        <PersonAdd />
                                    </IconButton>
                                </Stack>
                                <Stack spacing={2}>
                                    {edgerunners.map((e, index) => (
                                        <Paper
                                            key={index}
                                            sx={{
                                                p: 2,
                                                backgroundColor: readerMode
                                                    ? 'rgba(0, 128, 0, 0.03)'
                                                    : 'rgba(0, 255, 0, 0.05)',
                                                border: `1px solid ${
                                                    readerMode
                                                        ? 'rgba(46, 125, 50, 0.3)'
                                                        : colors.neons.green.default + '40'
                                                }`,
                                                borderRadius: '4px',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    borderColor: readerMode
                                                        ? 'rgba(46, 125, 50, 0.5)'
                                                        : colors.neons.green.default,
                                                    boxShadow: readerMode
                                                        ? 'none'
                                                        : `0 0 10px ${colors.neons.green.default}30`,
                                                },
                                            }}
                                        >
                                            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={t('common.name')}
                                                        value={e.name}
                                                        onChange={(ev) =>
                                                            updateEdgerunner(index, { name: ev.target.value })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        label={t('soloPlay.combat.attackSkill')}
                                                        value={e.attackSkillTotal}
                                                        onChange={(ev) =>
                                                            updateEdgerunner(index, {
                                                                attackSkillTotal: parseInt(ev.target.value) || 10,
                                                            })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={t('soloPlay.combat.weapon')}
                                                        value={e.weaponName}
                                                        onChange={(ev) =>
                                                            updateEdgerunner(index, { weaponName: ev.target.value })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={t('soloPlay.combat.damage')}
                                                        value={e.weaponDamage}
                                                        onChange={(ev) =>
                                                            updateEdgerunner(index, { weaponDamage: ev.target.value })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid
                                                    size={{ xs: 6, md: 1 }}
                                                    sx={{ display: 'flex', justifyContent: 'center' }}
                                                >
                                                    <IconButton
                                                        onClick={() => removeEdgerunner(index)}
                                                        disabled={edgerunners.length === 1}
                                                        sx={{ color: colors.neons.red.default }}
                                                    >
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        label={t('soloPlay.combat.armorSP')}
                                                        value={e.armorSP}
                                                        onChange={(ev) =>
                                                            updateEdgerunner(index, {
                                                                armorSP: parseInt(ev.target.value) || 0,
                                                            })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        label={t('soloPlay.combat.currentHP')}
                                                        value={e.currentHP}
                                                        onChange={(ev) =>
                                                            updateEdgerunner(index, {
                                                                currentHP: parseInt(ev.target.value) || 0,
                                                            })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                {/* Hardened Criteria & Abilities */}
                                                <Grid size={12}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: readerMode ? '#666' : colors.grays.gray600,
                                                            display: 'block',
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        {t('soloPlay.combat.hardenedCriteria')}:
                                                    </Typography>
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasHighRefEvasion}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasHighRefEvasion: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.refEvasion')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasHighAttack}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasHighAttack: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.attack15')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasHighWillBody}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasHighWillBody: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.willBody')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasLuxuryWeapon}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasLuxuryWeapon: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.luxuryWeapon')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasHighDexMov}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasHighDexMov: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.dexMov')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasHighAutoMartial}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasHighAutoMartial: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.autofireMartial')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasSoloRank4}
                                                                onChange={(ev) =>
                                                                    updateEdgerunner(index, {
                                                                        hasSoloRank4: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.soloRank4')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
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
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
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
                                                </Grid>
                                                {isEdgerunnerHardened(e as QDEdgerunner) && (
                                                    <Grid
                                                        size={{ xs: 6, md: 3 }}
                                                        sx={{ display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Chip
                                                            label={t('soloPlay.combat.hardened.label')}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: readerMode
                                                                    ? '#ed6c02'
                                                                    : colors.neons.yellow.default,
                                                                color: readerMode ? '#fff' : '#000',
                                                                fontWeight: 'bold',
                                                            }}
                                                        />
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>

                            <Divider />

                            {/* Enemies Section */}
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                        }}
                                    >
                                        {t('soloPlay.combat.enemies')} ({enemies.length})
                                    </Typography>
                                    <IconButton
                                        onClick={addEnemy}
                                        sx={{ color: readerMode ? '#d32f2f' : colors.neons.red.default }}
                                    >
                                        <PersonAdd />
                                    </IconButton>
                                </Stack>
                                <Stack spacing={2}>
                                    {enemies.map((e, index) => (
                                        <Paper
                                            key={index}
                                            sx={{
                                                p: 2,
                                                backgroundColor: readerMode
                                                    ? 'rgba(128, 0, 0, 0.03)'
                                                    : 'rgba(255, 0, 0, 0.05)',
                                                border: `1px solid ${
                                                    readerMode
                                                        ? 'rgba(211, 47, 47, 0.3)'
                                                        : colors.neons.red.default + '40'
                                                }`,
                                                borderRadius: '4px',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    borderColor: readerMode
                                                        ? 'rgba(211, 47, 47, 0.5)'
                                                        : colors.neons.red.default,
                                                    boxShadow: readerMode
                                                        ? 'none'
                                                        : `0 0 10px ${colors.neons.red.default}30`,
                                                },
                                            }}
                                        >
                                            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                                                <Grid size={{ xs: 12, md: 3 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={t('common.name')}
                                                        value={e.name}
                                                        onChange={(ev) => updateEnemy(index, { name: ev.target.value })}
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <CyberpunkFormControl
                                                        readerMode={readerMode}
                                                        label={t('soloPlay.combat.level')}
                                                    >
                                                        <Select
                                                            size="small"
                                                            value={e.level}
                                                            onChange={(ev) =>
                                                                updateEnemy(index, {
                                                                    level: ev.target.value as NPCLevel,
                                                                })
                                                            }
                                                            label={t('soloPlay.combat.level')}
                                                            sx={selectStyle}
                                                        >
                                                            <MenuItem value="MOOK">
                                                                {t('soloPlay.combat.levels.mook')}
                                                            </MenuItem>
                                                            <MenuItem value="LIEUTENANT">
                                                                {t('soloPlay.combat.levels.lieutenant')}
                                                            </MenuItem>
                                                            <MenuItem value="MINI_BOSS">
                                                                {t('soloPlay.combat.levels.miniBoss')}
                                                            </MenuItem>
                                                            <MenuItem value="BOSS">
                                                                {t('soloPlay.combat.levels.boss')}
                                                            </MenuItem>
                                                        </Select>
                                                    </CyberpunkFormControl>
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        label={t('soloPlay.combat.attackSkill')}
                                                        value={e.attackSkillTotal}
                                                        onChange={(ev) =>
                                                            updateEnemy(index, {
                                                                attackSkillTotal: parseInt(ev.target.value) || 10,
                                                            })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={t('soloPlay.combat.weapon')}
                                                        value={e.weaponName}
                                                        onChange={(ev) =>
                                                            updateEnemy(index, {
                                                                weaponName: ev.target.value,
                                                            })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={t('soloPlay.combat.damage')}
                                                        value={e.weaponDamage}
                                                        onChange={(ev) =>
                                                            updateEnemy(index, {
                                                                weaponDamage: ev.target.value,
                                                            })
                                                        }
                                                        variant="outlined"
                                                        sx={textFieldOutlinedStyle}
                                                    />
                                                </Grid>
                                                <Grid
                                                    size={{ xs: 12, md: 1 }}
                                                    sx={{ display: 'flex', justifyContent: 'center' }}
                                                >
                                                    <IconButton
                                                        onClick={() => removeEnemy(index)}
                                                        disabled={enemies.length === 1}
                                                        sx={{ color: colors.neons.red.default }}
                                                    >
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.isHardened}
                                                                onChange={(ev) =>
                                                                    updateEnemy(index, {
                                                                        isHardened: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hardened.label')}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <CyberpunkFormControlLabel
                                                        readerMode={readerMode}
                                                        control={
                                                            <CyberpunkCheckbox
                                                                readerMode={readerMode}
                                                                checked={e.hasSpeedware}
                                                                onChange={(ev) =>
                                                                    updateEnemy(index, {
                                                                        hasSpeedware: ev.target.checked,
                                                                    })
                                                                }
                                                            />
                                                        }
                                                        label={t('soloPlay.combat.hasSpeedware')}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>

                        </Stack>
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setSetupDialogOpen(false)}
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
                        onClick={handleStartCombat}
                        startIcon={<PlayArrow />}
                        sx={
                            readerMode
                                ? { color: '#d32f2f' }
                                : {
                                      bgcolor: 'rgba(40, 0, 0, 0.6)',
                                      color: colors.neons.red.default,
                                      border: `1px solid ${colors.neons.red.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(60, 0, 0, 0.8)',
                                          color: colors.neons.red.light,
                                          boxShadow: `0 0 10px ${colors.neons.red.default}60`,
                                          textShadow: `0 0 5px ${colors.neons.red.default}`,
                                          border: `1px solid ${colors.neons.red.default}70`,
                                      },
                                  }
                        }
                    >
                        {t('soloPlay.combat.startCombat')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tactics Dialog */}
            <Dialog
                open={tacticsDialogOpen}
                onClose={() => {}}
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
                        data-text={t('soloPlay.combat.tacticsCheck')}
                    >
                        {t('soloPlay.combat.tacticsCheck')}
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
                        <Typography
                            variant="body2"
                            sx={{ mb: 2, pr: 3, color: readerMode ? '#666' : colors.grays.gray600 }}
                        >
                            {t('soloPlay.combat.tacticsDescription')}
                        </Typography>
                        <Stack spacing={2} sx={{ pr: 3 }}>
                            <TextField
                                type="number"
                                label={t('soloPlay.combat.edgerunnerTactics')}
                                value={edgerunnerTactics}
                                onChange={(e) => setEdgerunnerTactics(parseInt(e.target.value) || 0)}
                                helperText={t('soloPlay.combat.tacticsHelp')}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                            />
                            <TextField
                                type="number"
                                label={t('soloPlay.combat.enemyTactics')}
                                value={enemyTactics}
                                onChange={(e) => setEnemyTactics(parseInt(e.target.value) || 0)}
                                helperText={t('soloPlay.combat.tacticsEnemyHelp')}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                            />
                        </Stack>
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleTacticsCheck}
                        startIcon={<Casino />}
                        sx={
                            readerMode
                                ? { color: '#0097a7' }
                                : {
                                      bgcolor: 'rgba(0, 40, 40, 0.6)',
                                      color: colors.neons.cyan.default,
                                      border: `1px solid ${colors.neons.cyan.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 60, 60, 0.8)',
                                          color: colors.neons.cyan.light,
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}60`,
                                          textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                          border: `1px solid ${colors.neons.cyan.default}70`,
                                      },
                                  }
                        }
                    >
                        {t('soloPlay.combat.rollTactics')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default QDCombatPanel
