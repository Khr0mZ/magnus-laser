import Add from '@mui/icons-material/Add'
import AddCircleOutline from '@mui/icons-material/AddCircleOutline'
import AutoFixHigh from '@mui/icons-material/AutoFixHigh'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import RestartAlt from '@mui/icons-material/RestartAlt'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
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
import type { SoloPlayClock } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkTextFieldStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const ClocksTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Persisted state
    const { clocks, addClock, updateClock, rollClockDice, addDiceBack, useDevilsLuck, resetClock, deleteClock } =
        useGMToolsDataStore()

    // Local state for new clock form
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

    // Styles
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.cyan.default)
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.yellow.default)

    const handleAddClock = () => {
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
            devilsLuckUsed: false,
            rollHistory: [],
            isComplete: false,
            createdAt: Date.now(),
        }
        addClock(newClock)
        setClockName('')
        setClockTrigger('')
        setClockEvent('')
        setDicePool(5)
        setScaleUp(false)
        setDialogOpen(false)
    }

    const handleRollDice = (clockId: string) => {
        const result = rollClockDice(clockId)
        if (result) {
            setRollResult({ clockId, ...result })
            // Clear result after 5 seconds
            setTimeout(() => {
                setRollResult((prev) => (prev?.clockId === clockId ? null : prev))
            }, 5000)
        }
    }

    // Open edit dialog
    const handleOpenEdit = (clock: SoloPlayClock) => {
        setEditingClock(clock)
    }

    // Save edit
    const handleSaveEdit = () => {
        if (!editingClock) return
        updateClock(editingClock.id, {
            name: editingClock.name,
            trigger: editingClock.trigger,
            event: editingClock.event,
            scaleUp: editingClock.scaleUp,
        })
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
                        width: 24,
                        height: 24,
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
    const renderRollResult = (clockId: string) => {
        if (!rollResult || rollResult.clockId !== clockId) return null

        return (
            <Box
                sx={{
                    mt: 1.5,
                    p: 1.5,
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
                        fontFamily: '"Lexend", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        mb: 0.5,
                    }}
                >
                    {t('soloPlay.clocks.lastRoll')}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
                    {rollResult.diceRolled.map((die, i) => {
                        const isRemoved = die === 1 || (clocks.find((c) => c.id === clockId)?.scaleUp && die === 6)
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
                                    animation: isRemoved ? 'pulse 0.5s ease-in-out' : 'none',
                                }}
                            />
                        )
                    })}
                    <Typography
                        variant="body2"
                        sx={{
                            ml: 1,
                            color: rollResult.diceRemoved > 0 ? colors.neons.red.default : colors.neons.green.default,
                            fontFamily: '"Lexend", sans-serif',
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
                        variant="subtitle2"
                        sx={{
                            mt: 1,
                            color: colors.neons.red.default,
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            textShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.red.default}`,
                            animation: 'pulse 1s ease-in-out infinite',
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
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('gmTools.clocks')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.clocks.add')}
                </Button>
            </Stack>

            {/* Clock List */}
            <Box>
                {clocks.length === 0 ? (
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
                        {t('soloPlay.clocks.noClocks')}
                    </Typography>
                ) : (
                    <Stack spacing={1.5}>
                        {clocks.map((clock) => (
                            <Paper
                                key={clock.id}
                                sx={{
                                    ...getCyberpunkPaperStyle(
                                        readerMode,
                                        clock.isComplete ? colors.neons.red.default : colors.neons.cyan.default
                                    ),
                                    p: 2,
                                }}
                            >
                                {/* Header */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                color: readerMode
                                                    ? colors.grays.gray000
                                                    : clock.isComplete
                                                      ? colors.neons.red.default
                                                      : colors.neons.cyan.default,
                                                fontFamily: '"Orbitron", sans-serif',
                                                fontWeight: 'bold',
                                                letterSpacing: '0.5px',
                                            }}
                                        >
                                            {clock.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: colors.grays.gray500,
                                                fontFamily: '"Lexend", sans-serif',
                                                display: 'block',
                                            }}
                                        >
                                            {t('soloPlay.clocks.trigger')}: {clock.trigger}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: clock.isComplete
                                                    ? colors.neons.red.default
                                                    : colors.neons.yellow.default,
                                                fontFamily: '"Lexend", sans-serif',
                                                display: 'block',
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
                                                    fontSize: '0.65rem',
                                                    height: 18,
                                                }}
                                            />
                                        )}
                                        {clock.devilsLuckUsed && (
                                            <Chip
                                                label={t('soloPlay.clocks.devilsLuckUsed')}
                                                size="small"
                                                sx={{
                                                    mt: 0.5,
                                                    backgroundColor: colors.neons.purple.default,
                                                    color: '#fff',
                                                    fontSize: '0.65rem',
                                                    height: 18,
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        {/* Roll Dice Button */}
                                        <Tooltip disableInteractive title={t('soloPlay.clocks.rollDice')}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRollDice(clock.id)}
                                                    disabled={clock.isComplete}
                                                    sx={{
                                                        color: colors.neons.yellow.default,
                                                        border: `1px solid ${colors.neons.yellow.default}40`,
                                                        borderRadius: 0,
                                                        '&:hover': {
                                                            backgroundColor: `${colors.neons.yellow.default}20`,
                                                            boxShadow: `0 0 10px ${colors.neons.yellow.default}40`,
                                                        },
                                                        '&.Mui-disabled': {
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                        },
                                                    }}
                                                >
                                                    <Casino fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        {/* Add Dice Back (Reclaiming Time) */}
                                        <Tooltip disableInteractive title={t('soloPlay.clocks.addDiceBack')}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => addDiceBack(clock.id)}
                                                    disabled={
                                                        clock.remainingDice >= clock.initialDicePool || clock.isComplete
                                                    }
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        border: `1px solid ${colors.neons.green.default}40`,
                                                        borderRadius: 0,
                                                        '&:hover': {
                                                            backgroundColor: `${colors.neons.green.default}20`,
                                                            boxShadow: `0 0 10px ${colors.neons.green.default}40`,
                                                        },
                                                        '&.Mui-disabled': {
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                        },
                                                    }}
                                                >
                                                    <AddCircleOutline fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        {/* Devil's Luck: remove a d6 to refresh Luck Pool (once per clock) */}
                                        <Tooltip disableInteractive title={t('soloPlay.clocks.devilsLuck')}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => useDevilsLuck(clock.id)}
                                                    disabled={
                                                        clock.devilsLuckUsed ||
                                                        clock.remainingDice <= 0 ||
                                                        clock.isComplete
                                                    }
                                                    sx={{
                                                        color: colors.neons.purple.default,
                                                        border: `1px solid ${colors.neons.purple.default}40`,
                                                        borderRadius: 0,
                                                        '&:hover': {
                                                            backgroundColor: `${colors.neons.purple.default}20`,
                                                            boxShadow: `0 0 10px ${colors.neons.purple.default}40`,
                                                        },
                                                        '&.Mui-disabled': {
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                        },
                                                    }}
                                                >
                                                    <AutoFixHigh fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        {/* Reset Clock */}
                                        <Tooltip disableInteractive title={t('soloPlay.clocks.reset')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => resetClock(clock.id)}
                                                sx={{
                                                    color: colors.neons.cyan.default,
                                                    border: `1px solid ${colors.neons.cyan.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': {
                                                        backgroundColor: `${colors.neons.cyan.default}20`,
                                                        boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                                    },
                                                }}
                                            >
                                                <RestartAlt fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {/* Edit */}
                                        <Tooltip disableInteractive title={t('common.edit')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEdit(clock)}
                                                sx={{
                                                    color: colors.neons.purple.default,
                                                    border: `1px solid ${colors.neons.purple.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': {
                                                        backgroundColor: `${colors.neons.purple.default}20`,
                                                        boxShadow: `0 0 10px ${colors.neons.purple.default}40`,
                                                    },
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {/* Delete */}
                                        <Tooltip disableInteractive title={t('common.delete')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => deleteClock(clock.id)}
                                                sx={{
                                                    color: colors.neons.red.default,
                                                    border: `1px solid ${colors.neons.red.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': {
                                                        backgroundColor: `${colors.neons.red.default}20`,
                                                        boxShadow: `0 0 10px ${colors.neons.red.default}40`,
                                                    },
                                                }}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>

                                {/* Dice Pool Visualization */}
                                <Box mt={1.5}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: colors.grays.gray500,
                                            fontFamily: '"Lexend", sans-serif',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            display: 'block',
                                            mb: 0.5,
                                        }}
                                    >
                                        {t('soloPlay.clocks.dicePool')}: {clock.remainingDice}/{clock.initialDicePool}
                                    </Typography>
                                    {renderDicePool(clock)}
                                </Box>

                                {/* Roll Result */}
                                {renderRollResult(clock.id)}

                                {/* Complete State */}
                                {clock.isComplete && !rollResult?.clockId && (
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            p: 1,
                                            backgroundColor: `${colors.neons.red.default}20`,
                                            borderRadius: 1,
                                            border: `1px solid ${colors.neons.red.default}`,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
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
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Add Clock Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.cyan.default}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${colors.neons.cyan.default}40`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                    }}
                >
                    {t('soloPlay.clocks.createClock')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.clocks.clockName')}
                            value={clockName}
                            onChange={(e) => setClockName(e.target.value)}
                            placeholder={t('soloPlay.clocks.namePlaceholder')}
                            sx={textFieldStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.clocks.trigger')}
                            value={clockTrigger}
                            onChange={(e) => setClockTrigger(e.target.value)}
                            placeholder={t('soloPlay.clocks.triggerPlaceholder')}
                            sx={textFieldStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.clocks.event')}
                            value={clockEvent}
                            onChange={(e) => setClockEvent(e.target.value)}
                            placeholder={t('soloPlay.clocks.eventPlaceholder')}
                            sx={textFieldStyle}
                        />
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: colors.grays.gray500,
                                    fontFamily: '"Lexend", sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                {t('soloPlay.clocks.dicePool')}: {dicePool}d6
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: colors.grays.gray600,
                                    fontFamily: '"Lexend", sans-serif',
                                    display: 'block',
                                    mb: 1,
                                }}
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
                                sx={{
                                    color: colors.neons.cyan.default,
                                    '& .MuiSlider-markLabel': {
                                        color: colors.grays.gray600,
                                    },
                                }}
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
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                            fontFamily: '"Lexend", sans-serif',
                                        }}
                                    >
                                        {t('soloPlay.clocks.scaleUp')}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: colors.grays.gray600,
                                            fontFamily: '"Lexend", sans-serif',
                                        }}
                                    >
                                        {t('soloPlay.clocks.scaleUpHelp')}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.cyan.default}40` }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        sx={{
                            color: colors.grays.gray600,
                            '&:hover': { color: colors.grays.gray000 },
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleAddClock} variant="outlined" disabled={!clockName.trim()} sx={buttonStyle}>
                        {t('soloPlay.clocks.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Clock Dialog */}
            <Dialog
                open={!!editingClock}
                onClose={() => setEditingClock(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.purple.default}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${colors.neons.purple.default}40`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.purple.default,
                        borderBottom: `1px solid ${colors.neons.purple.default}40`,
                    }}
                >
                    {t('soloPlay.clocks.editClock')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    {editingClock && (
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.clocks.clockName')}
                                value={editingClock.name}
                                onChange={(e) => setEditingClock({ ...editingClock, name: e.target.value })}
                                sx={textFieldStyle}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.clocks.trigger')}
                                value={editingClock.trigger}
                                onChange={(e) => setEditingClock({ ...editingClock, trigger: e.target.value })}
                                sx={textFieldStyle}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.clocks.event')}
                                value={editingClock.event}
                                onChange={(e) => setEditingClock({ ...editingClock, event: e.target.value })}
                                sx={textFieldStyle}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editingClock.scaleUp}
                                        onChange={(e) =>
                                            setEditingClock({
                                                ...editingClock,
                                                scaleUp: e.target.checked,
                                            })
                                        }
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
                                label={t('soloPlay.clocks.scaleUp')}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.purple.default}40` }}>
                    <Button
                        onClick={() => setEditingClock(null)}
                        sx={{
                            color: colors.grays.gray600,
                            '&:hover': { color: colors.grays.gray000 },
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="outlined"
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.purple.default)}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ClocksTool
