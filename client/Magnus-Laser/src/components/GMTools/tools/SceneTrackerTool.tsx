import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
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
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { SceneCheck, SceneEntry } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    generateRandomEncounter,
} from '../../../utils/generators/soloPlayTablesExpanded'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const SceneTrackerTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { scenes, addScene, updateScene, deleteScene } = useGMToolsDataStore()

    // Create dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [location, setLocation] = useState('')
    const [participants, setParticipants] = useState('')
    const [goal, setGoal] = useState('')
    const [notes, setNotes] = useState('')

    // Edit dialog state
    const [editingScene, setEditingScene] = useState<SceneEntry | null>(null)

    // Add check state
    const [checkDialogOpen, setCheckDialogOpen] = useState(false)
    const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
    const [checkDescription, setCheckDescription] = useState('')

    // Styles
    const accentColor = colors.neons.blue.default
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, accentColor)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, accentColor)
    const titleStyle = getSectionTitleStyle(readerMode, accentColor)

    const handleCreate = () => {
        if (!goal.trim()) return
        const nextNumber = scenes.length > 0 ? Math.max(...scenes.map((s) => s.sceneNumber)) + 1 : 1
        const scene: SceneEntry = {
            id: uuidv4(),
            sceneNumber: nextNumber,
            location: location.trim(),
            participants: participants
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean),
            goal: goal.trim(),
            checks: [],
            notes: notes.trim() || undefined,
            createdAt: Date.now(),
        }
        addScene(scene)
        setLocation('')
        setParticipants('')
        setGoal('')
        setNotes('')
        setDialogOpen(false)
    }

    const handleRandomLocation = () => {
        const zones = ['corporate', 'moderate', 'combatZone', 'outskirts'] as const
        const times = ['day', 'night', 'midnight'] as const
        const zone = zones[Math.floor(Math.random() * zones.length)]
        const time = times[Math.floor(Math.random() * times.length)]
        const encounter = generateRandomEncounter(zone, time)
        setLocation(encounter)
    }

    const handleAddCheck = () => {
        if (!activeSceneId || !checkDescription.trim()) return
        const scene = scenes.find((s) => s.id === activeSceneId)
        if (!scene) return

        const newCheck: SceneCheck = {
            checkNumber: scene.checks.length + 1,
            description: checkDescription.trim(),
            success: false,
        }

        updateScene(activeSceneId, {
            checks: [...scene.checks, newCheck],
        })

        setCheckDescription('')
        setCheckDialogOpen(false)
    }

    const handleToggleCheck = (sceneId: string, checkIndex: number) => {
        const scene = scenes.find((s) => s.id === sceneId)
        if (!scene) return

        const updatedChecks = [...scene.checks]
        updatedChecks[checkIndex] = {
            ...updatedChecks[checkIndex],
            success: !updatedChecks[checkIndex].success,
        }

        updateScene(sceneId, { checks: updatedChecks })
    }

    const handleDeleteCheck = (sceneId: string, checkIndex: number) => {
        const scene = scenes.find((s) => s.id === sceneId)
        if (!scene) return

        const updatedChecks = scene.checks
            .filter((_, i) => i !== checkIndex)
            .map((c, i) => ({ ...c, checkNumber: i + 1 }))

        updateScene(sceneId, { checks: updatedChecks })
    }

    const handleSaveEdit = () => {
        if (!editingScene) return
        updateScene(editingScene.id, {
            location: editingScene.location,
            participants: editingScene.participants,
            goal: editingScene.goal,
            outcome: editingScene.outcome,
            notes: editingScene.notes,
        })
        setEditingScene(null)
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.sceneTracker.title')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.sceneTracker.add')}
                </Button>
            </Stack>

            {scenes.length === 0 ? (
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
                    {t('soloPlay.sceneTracker.noScenes')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {scenes.map((scene) => {
                        const successCount = scene.checks.filter((c) => c.success).length
                        return (
                            <Paper
                                key={scene.id}
                                sx={{
                                    ...getCyberpunkPaperStyle(readerMode, accentColor),
                                    p: 2,
                                }}
                            >
                                {/* Header */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label={`#${scene.sceneNumber}`}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${accentColor}30`,
                                                    color: accentColor,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.7rem',
                                                    height: 22,
                                                }}
                                            />
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray000 : accentColor,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {scene.goal}
                                            </Typography>
                                        </Stack>
                                        {scene.location && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: colors.grays.gray500,
                                                    fontFamily: '"Lexend", sans-serif',
                                                    display: 'block',
                                                    mt: 0.5,
                                                }}
                                            >
                                                {t('soloPlay.sceneTracker.location')}: {scene.location}
                                            </Typography>
                                        )}
                                        {scene.participants.length > 0 && (
                                            <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                                                {scene.participants.map((p, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={p}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: `${colors.neons.cyan.default}20`,
                                                            color: colors.neons.cyan.default,
                                                            fontSize: '0.65rem',
                                                            height: 18,
                                                        }}
                                                    />
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        {/* Add Check */}
                                        <Tooltip title={t('soloPlay.sceneTracker.addCheck')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setActiveSceneId(scene.id)
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
                                        {/* Edit */}
                                        <Tooltip title={t('common.edit')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => setEditingScene({ ...scene })}
                                                sx={{
                                                    color: colors.neons.purple.default,
                                                    border: `1px solid ${colors.neons.purple.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': { backgroundColor: `${colors.neons.purple.default}20` },
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {/* Delete */}
                                        <Tooltip title={t('common.delete')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => deleteScene(scene.id)}
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

                                {/* Checks */}
                                {scene.checks.length > 0 && (
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
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: colors.grays.gray500,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                }}
                                            >
                                                {t('soloPlay.sceneTracker.checks')} ({successCount}/{scene.checks.length} {t('soloPlay.sceneTracker.passed')})
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 0 }}>
                                            <Stack spacing={0.5}>
                                                {scene.checks.map((check, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 1,
                                                            backgroundColor: readerMode
                                                                ? 'rgba(0,0,0,0.03)'
                                                                : 'rgba(0,0,0,0.3)',
                                                            border: `1px solid ${
                                                                check.success
                                                                    ? colors.neons.green.default
                                                                    : colors.grays.gray700
                                                            }30`,
                                                        }}
                                                    >
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: readerMode
                                                                        ? colors.grays.gray000
                                                                        : colors.grays.gray900,
                                                                    fontFamily: '"Lexend", sans-serif',
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                #{check.checkNumber}: {check.description}
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleToggleCheck(scene.id, idx)}
                                                                    sx={{
                                                                        color: check.success
                                                                            ? colors.neons.green.default
                                                                            : colors.neons.red.default,
                                                                    }}
                                                                >
                                                                    {check.success ? (
                                                                        <CheckCircle fontSize="small" />
                                                                    ) : (
                                                                        <Cancel fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteCheck(scene.id, idx)}
                                                                    sx={{ color: colors.grays.gray600 }}
                                                                >
                                                                    <DeleteOutline fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                )}

                                {/* Outcome */}
                                {scene.outcome && (
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            p: 1,
                                            backgroundColor: `${colors.neons.yellow.default}15`,
                                            borderRadius: 1,
                                            border: `1px solid ${colors.neons.yellow.default}40`,
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: colors.neons.yellow.default,
                                                fontFamily: '"Lexend", sans-serif',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {t('soloPlay.sceneTracker.outcome')}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                                fontFamily: '"Lexend", sans-serif',
                                            }}
                                        >
                                            {scene.outcome}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Notes */}
                                {scene.notes && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: colors.grays.gray600,
                                            fontFamily: '"Lexend", sans-serif',
                                            display: 'block',
                                            mt: 1,
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        {scene.notes}
                                    </Typography>
                                )}
                            </Paper>
                        )
                    })}
                </Stack>
            )}

            {/* Create Scene Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${accentColor}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${accentColor}40`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : accentColor,
                        borderBottom: `1px solid ${accentColor}40`,
                    }}
                >
                    {t('soloPlay.sceneTracker.create')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <Stack direction="row" spacing={1} alignItems="flex-end">
                            <TextField
                                fullWidth
                                label={t('soloPlay.sceneTracker.location')}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Downtown nightclub, rooftop..."
                                sx={textFieldStyle}
                            />
                            <Tooltip title={t('soloPlay.sceneTracker.randomLocation')}>
                                <IconButton
                                    onClick={handleRandomLocation}
                                    sx={{
                                        color: accentColor,
                                        border: `1px solid ${accentColor}40`,
                                        borderRadius: 0,
                                        '&:hover': { backgroundColor: `${accentColor}20` },
                                    }}
                                >
                                    <Casino />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <TextField
                            fullWidth
                            label={t('soloPlay.sceneTracker.participants')}
                            value={participants}
                            onChange={(e) => setParticipants(e.target.value)}
                            placeholder="V, Johnny, Rogue (comma separated)"
                            helperText={t('soloPlay.sceneTracker.participantsHelp')}
                            sx={textFieldStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.sceneTracker.goal')}
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Get info from the fixer about the heist"
                            sx={textFieldStyle}
                        />
                        <TextField
                            fullWidth
                            label={t('soloPlay.sceneTracker.notes')}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                            multiline
                            rows={2}
                            sx={textFieldStyle}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}40` }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleCreate}
                        variant="outlined"
                        disabled={!goal.trim()}
                        sx={buttonStyle}
                    >
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
                        border: `1px solid ${colors.neons.green.default}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${colors.neons.green.default}40`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                        borderBottom: `1px solid ${colors.neons.green.default}40`,
                    }}
                >
                    {t('soloPlay.sceneTracker.addCheck')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <TextField
                        fullWidth
                        label={t('soloPlay.sceneTracker.checkDescription')}
                        value={checkDescription}
                        onChange={(e) => setCheckDescription(e.target.value)}
                        placeholder="Persuasion check to convince the fixer..."
                        multiline
                        rows={2}
                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.green.default}40` }}>
                    <Button
                        onClick={() => setCheckDialogOpen(false)}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleAddCheck}
                        variant="outlined"
                        disabled={!checkDescription.trim()}
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.green.default)}
                    >
                        {t('soloPlay.sceneTracker.addCheck')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Scene Dialog */}
            <Dialog
                open={!!editingScene}
                onClose={() => setEditingScene(null)}
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
                    {t('soloPlay.sceneTracker.edit')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    {editingScene && (
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.sceneTracker.location')}
                                value={editingScene.location}
                                onChange={(e) =>
                                    setEditingScene({ ...editingScene, location: e.target.value })
                                }
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.sceneTracker.participants')}
                                value={editingScene.participants.join(', ')}
                                onChange={(e) =>
                                    setEditingScene({
                                        ...editingScene,
                                        participants: e.target.value
                                            .split(',')
                                            .map((p) => p.trim())
                                            .filter(Boolean),
                                    })
                                }
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.sceneTracker.goal')}
                                value={editingScene.goal}
                                onChange={(e) =>
                                    setEditingScene({ ...editingScene, goal: e.target.value })
                                }
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.sceneTracker.outcome')}
                                value={editingScene.outcome || ''}
                                onChange={(e) =>
                                    setEditingScene({
                                        ...editingScene,
                                        outcome: e.target.value || undefined,
                                    })
                                }
                                placeholder="What happened in this scene?"
                                multiline
                                rows={2}
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                            />
                            <TextField
                                fullWidth
                                label={t('soloPlay.sceneTracker.notes')}
                                value={editingScene.notes || ''}
                                onChange={(e) =>
                                    setEditingScene({
                                        ...editingScene,
                                        notes: e.target.value || undefined,
                                    })
                                }
                                multiline
                                rows={2}
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.purple.default}40` }}>
                    <Button
                        onClick={() => setEditingScene(null)}
                        sx={{ color: colors.grays.gray600 }}
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

export default SceneTrackerTool
