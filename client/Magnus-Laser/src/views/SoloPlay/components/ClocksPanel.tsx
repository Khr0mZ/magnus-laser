import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import RestartAlt from '@mui/icons-material/RestartAlt'
import AddCircleOutline from '@mui/icons-material/AddCircleOutline'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    Paper,
    Slider,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { ClockRollResult, SoloPlayClock } from '../../../types/soloPlay'
import colors from '../../../utils/colors'

const ClocksPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Local state for clocks (this panel uses local state, GM Tools uses persisted state)
    const [clocks, setClocks] = useState<SoloPlayClock[]>([])

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [clockName, setClockName] = useState('')
    const [clockTrigger, setClockTrigger] = useState('')
    const [clockEvent, setClockEvent] = useState('')
    const [dicePool, setDicePool] = useState(5)
    const [scaleUp, setScaleUp] = useState(false)

    // Edit dialog state
    const [editingClock, setEditingClock] = useState<SoloPlayClock | null>(null)

    // Roll result state for animation
    const [rollResult, setRollResult] = useState<{
        clockId: string
        diceRolled: number[]
        diceRemoved: number
        isComplete: boolean
    } | null>(null)

    const handleCreateClock = () => {
        if (!clockName.trim()) return
        const newClock: SoloPlayClock = {
            id: uuidv4(),
            name: clockName,
            description: '',
            initialDicePool: dicePool,
            remainingDice: dicePool,
            trigger: clockTrigger || 'Each round / When a check fails',
            event: clockEvent || 'Event triggers!',
            scaleUp,
            rollHistory: [],
            isComplete: false,
            createdAt: Date.now(),
        }
        setClocks((prev) => [...prev, newClock])
        setClockName('')
        setClockTrigger('')
        setClockEvent('')
        setDicePool(5)
        setScaleUp(false)
        setDialogOpen(false)
    }

    const handleRollDice = (clockId: string) => {
        const clock = clocks.find((c) => c.id === clockId)
        if (!clock || clock.isComplete || clock.remainingDice <= 0) return

        // Roll all remaining dice
        const diceRolled: number[] = []
        for (let i = 0; i < clock.remainingDice; i++) {
            diceRolled.push(Math.floor(Math.random() * 6) + 1)
        }

        // Count dice to remove (1s, or 1s and 6s if scaleUp)
        let diceRemoved = 0
        for (const die of diceRolled) {
            if (die === 1) {
                diceRemoved++
            } else if (clock.scaleUp && die === 6) {
                diceRemoved++
            }
        }

        // Check for multiple ones (Degrees of Consequence)
        const onesCount = diceRolled.filter((d) => d === 1).length
        const multipleOnesBonus = onesCount >= 2

        const remainingAfter = Math.max(0, clock.remainingDice - diceRemoved)
        const isComplete = remainingAfter === 0

        const rollResultData: ClockRollResult = {
            timestamp: Date.now(),
            diceRolled,
            diceRemoved,
            remainingAfter,
            multipleOnesBonus,
        }

        setClocks((prev) =>
            prev.map((c) =>
                c.id === clockId
                    ? {
                          ...c,
                          remainingDice: remainingAfter,
                          rollHistory: [...c.rollHistory, rollResultData],
                          isComplete,
                          completedAt: isComplete ? Date.now() : undefined,
                      }
                    : c
            )
        )

        setRollResult({ clockId, diceRolled, diceRemoved, isComplete })

        // Clear result after 5 seconds
        setTimeout(() => {
            setRollResult((prev) => (prev?.clockId === clockId ? null : prev))
        }, 5000)
    }

    const handleAddDiceBack = (clockId: string) => {
        setClocks((prev) =>
            prev.map((clock) =>
                clock.id === clockId && clock.remainingDice < clock.initialDicePool
                    ? { ...clock, remainingDice: clock.remainingDice + 1 }
                    : clock
            )
        )
    }

    const handleResetClock = (clockId: string) => {
        setClocks((prev) =>
            prev.map((clock) =>
                clock.id === clockId
                    ? {
                          ...clock,
                          remainingDice: clock.initialDicePool,
                          rollHistory: [],
                          isComplete: false,
                          completedAt: undefined,
                      }
                    : clock
            )
        )
    }

    const handleDeleteClock = (clockId: string) => {
        setClocks((prev) => prev.filter((c) => c.id !== clockId))
    }

    const handleOpenEdit = (clock: SoloPlayClock) => {
        setEditingClock(clock)
    }

    const handleSaveEdit = () => {
        if (!editingClock) return
        setClocks((prev) =>
            prev.map((c) =>
                c.id === editingClock.id
                    ? {
                          ...c,
                          name: editingClock.name,
                          trigger: editingClock.trigger,
                          event: editingClock.event,
                          scaleUp: editingClock.scaleUp,
                      }
                    : c
            )
        )
        setEditingClock(null)
    }

    // Render dice pool visualization
    const renderDicePool = (clock: SoloPlayClock) => {
        const dice = []
        for (let i = 0; i < clock.initialDicePool; i++) {
            const isRemaining = i < clock.remainingDice
            dice.push(
                <Box
                    key={i}
                    sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '4px',
                        border: `2px solid ${isRemaining ? colors.neons.cyan.default : colors.grays.gray700}`,
                        backgroundColor: isRemaining
                            ? readerMode
                                ? colors.neons.cyan.default
                                : `${colors.neons.cyan.default}30`
                            : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isRemaining && !readerMode ? `0 0 8px ${colors.neons.cyan.default}60` : 'none',
                        transition: 'all 0.3s ease',
                        opacity: isRemaining ? 1 : 0.3,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            color: isRemaining
                                ? readerMode
                                    ? '#fff'
                                    : colors.neons.cyan.default
                                : colors.grays.gray700,
                        }}
                    >
                        d6
                    </Typography>
                </Box>
            )
        }
        return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {dice}
            </Stack>
        )
    }

    // Render last roll result
    const renderRollResult = (clock: SoloPlayClock) => {
        if (!rollResult || rollResult.clockId !== clock.id) return null

        return (
            <Box
                sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: readerMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 1,
                    border: `1px solid ${rollResult.isComplete ? colors.neons.red.default : colors.neons.yellow.default}40`,
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        color: colors.grays.gray500,
                        fontFamily: '"Orbitron", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        mb: 1,
                    }}
                >
                    {t('soloPlay.clocks.lastRoll')}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
                    {rollResult.diceRolled.map((die, i) => {
                        const isRemoved = die === 1 || (clock.scaleUp && die === 6)
                        return (
                            <Chip
                                key={i}
                                label={die}
                                size="small"
                                sx={{
                                    fontFamily: '"Orbitron", sans-serif',
                                    fontWeight: 'bold',
                                    backgroundColor: isRemoved ? colors.neons.red.default : colors.grays.gray800,
                                    color: '#fff',
                                    border: isRemoved ? `2px solid ${colors.neons.red.default}` : 'none',
                                    boxShadow: isRemoved ? `0 0 10px ${colors.neons.red.default}` : 'none',
                                }}
                            />
                        )
                    })}
                    <Typography
                        variant="body2"
                        sx={{
                            ml: 1,
                            color:
                                rollResult.diceRemoved > 0 ? colors.neons.red.default : colors.neons.green.default,
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                        }}
                    >
                        {rollResult.diceRemoved > 0
                            ? `-${rollResult.diceRemoved} ${t('soloPlay.clocks.diceRemoved')}`
                            : t('soloPlay.clocks.noDiceRemoved')}
                    </Typography>
                </Stack>
                {rollResult.isComplete && (
                    <Typography
                        variant="h6"
                        sx={{
                            mt: 1,
                            color: colors.neons.red.default,
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            textShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.red.default}`,
                        }}
                    >
                        ⚠️ {t('soloPlay.clocks.eventTriggered')} ⚠️
                    </Typography>
                )}
            </Box>
        )
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography
                    variant="h5"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.yellow.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.clocks.title')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                        backgroundColor: colors.neons.cyan.default,
                        '&:hover': { backgroundColor: colors.neons.cyan.dark },
                    }}
                >
                    {t('soloPlay.clocks.add')}
                </Button>
            </Stack>

            {clocks.length === 0 ? (
                <Paper
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10,15,25,0.95)',
                        border: `1px solid ${colors.neons.yellow.default}30`,
                    }}
                >
                    <Typography variant="body1" sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}>
                        {t('soloPlay.clocks.noClocks')}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {clocks.map((clock) => (
                        <Grid size={{ xs: 12, md: 6 }} key={clock.id}>
                            <Paper
                                sx={{
                                    p: 2,
                                    backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10,15,25,0.95)',
                                    border: `1px solid ${clock.isComplete ? colors.neons.red.default : colors.neons.cyan.default}40`,
                                    boxShadow: clock.isComplete
                                        ? `0 0 20px ${colors.neons.red.default}30`
                                        : 'none',
                                }}
                            >
                                {/* Header */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: readerMode
                                                    ? colors.grays.gray000
                                                    : clock.isComplete
                                                      ? colors.neons.red.default
                                                      : colors.neons.cyan.default,
                                                fontFamily: '"Orbitron", sans-serif',
                                            }}
                                        >
                                            {clock.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colors.grays.gray500 }}>
                                            {t('soloPlay.clocks.trigger')}: {clock.trigger}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: clock.isComplete
                                                    ? colors.neons.red.default
                                                    : colors.neons.yellow.default,
                                            }}
                                        >
                                            {t('soloPlay.clocks.event')}: {clock.event}
                                        </Typography>
                                        {clock.scaleUp && (
                                            <Chip
                                                label={t('soloPlay.clocks.scaleUp')}
                                                size="small"
                                                sx={{
                                                    mt: 0.5,
                                                    backgroundColor: colors.neons.orange.default,
                                                    color: '#fff',
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title={t('soloPlay.clocks.rollDice')}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRollDice(clock.id)}
                                                    disabled={clock.isComplete}
                                                    sx={{ color: colors.neons.yellow.default }}
                                                >
                                                    <Casino />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={t('soloPlay.clocks.addDiceBack')}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAddDiceBack(clock.id)}
                                                    disabled={
                                                        clock.remainingDice >= clock.initialDicePool ||
                                                        clock.isComplete
                                                    }
                                                    sx={{ color: colors.neons.green.default }}
                                                >
                                                    <AddCircleOutline />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={t('soloPlay.clocks.reset')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleResetClock(clock.id)}
                                                sx={{ color: colors.neons.cyan.default }}
                                            >
                                                <RestartAlt />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('common.edit')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEdit(clock)}
                                                sx={{ color: colors.neons.purple.default }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('common.delete')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClock(clock.id)}
                                                sx={{ color: colors.neons.red.default }}
                                            >
                                                <DeleteOutline />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>

                                {/* Dice Pool */}
                                <Box mt={2}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: colors.grays.gray500,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            display: 'block',
                                            mb: 1,
                                        }}
                                    >
                                        {t('soloPlay.clocks.dicePool')}: {clock.remainingDice}/{clock.initialDicePool}
                                    </Typography>
                                    {renderDicePool(clock)}
                                </Box>

                                {/* Roll Result */}
                                {renderRollResult(clock)}

                                {/* Complete State */}
                                {clock.isComplete && !rollResult?.clockId && (
                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 1.5,
                                            backgroundColor: `${colors.neons.red.default}20`,
                                            borderRadius: 1,
                                            border: `1px solid ${colors.neons.red.default}`,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                color: colors.neons.red.default,
                                                fontFamily: '"Orbitron", sans-serif',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {t('soloPlay.clocks.complete')}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create Clock Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.clocks.createClock')}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.clocks.clockName')}
                            value={clockName}
                            onChange={(e) => setClockName(e.target.value)}
                            placeholder="Bomb Timer / NCPD Arrival / Strike Team"
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.clocks.trigger')}
                            value={clockTrigger}
                            onChange={(e) => setClockTrigger(e.target.value)}
                            placeholder="Every round / When a check fails / Every in-game hour"
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.clocks.event')}
                            value={clockEvent}
                            onChange={(e) => setClockEvent(e.target.value)}
                            placeholder="The bomb explodes! / NCPD arrives / Strike team attacks"
                        />
                        <Box>
                            <Typography variant="caption" sx={{ color: colors.grays.gray500 }}>
                                {t('soloPlay.clocks.dicePool')}: {dicePool}d6
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: colors.grays.gray600, display: 'block', mb: 1 }}
                            >
                                {t('soloPlay.clocks.dicePoolHelp')}
                            </Typography>
                            <Slider
                                value={dicePool}
                                onChange={(_, v) => setDicePool(v as number)}
                                min={3}
                                max={10}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                                sx={{ color: colors.neons.cyan.default }}
                            />
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={scaleUp}
                                    onChange={(e) => setScaleUp(e.target.checked)}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: colors.neons.orange.default,
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: colors.neons.orange.default,
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2">{t('soloPlay.clocks.scaleUp')}</Typography>
                                    <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>
                                        {t('soloPlay.clocks.scaleUpHelp')}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleCreateClock}
                        variant="contained"
                        disabled={!clockName.trim()}
                        sx={{
                            backgroundColor: colors.neons.cyan.default,
                            '&:hover': { backgroundColor: colors.neons.cyan.dark },
                        }}
                    >
                        {t('soloPlay.clocks.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Clock Dialog */}
            <Dialog open={!!editingClock} onClose={() => setEditingClock(null)} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.purple.default,
                        fontFamily: '"Orbitron", sans-serif',
                    }}
                >
                    {t('soloPlay.clocks.editClock')}
                </DialogTitle>
                <DialogContent>
                    {editingClock && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.clocks.clockName')}
                                value={editingClock.name}
                                onChange={(e) => setEditingClock({ ...editingClock, name: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.clocks.trigger')}
                                value={editingClock.trigger}
                                onChange={(e) => setEditingClock({ ...editingClock, trigger: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.clocks.event')}
                                value={editingClock.event}
                                onChange={(e) => setEditingClock({ ...editingClock, event: e.target.value })}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editingClock.scaleUp}
                                        onChange={(e) =>
                                            setEditingClock({ ...editingClock, scaleUp: e.target.checked })
                                        }
                                    />
                                }
                                label={t('soloPlay.clocks.scaleUp')}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingClock(null)}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        sx={{
                            backgroundColor: colors.neons.purple.default,
                            '&:hover': { backgroundColor: colors.neons.purple.dark },
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ClocksPanel
