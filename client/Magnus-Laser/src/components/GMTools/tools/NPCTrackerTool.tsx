import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import {
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
import type { NPCTrackerEntry } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    generateNPCByRole,
    generateRandomName,
    generateHandle,
    generateRelationship,
} from '../../../utils/generators/soloPlayTablesExpanded'
import { npcMoodTable, getRandomFromArray } from '../../../utils/generators/soloPlayTables'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkSelectStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

type NPCStatus = 'ALIVE' | 'DEAD' | 'MISSING' | 'UNKNOWN'

const STATUS_COLORS: Record<NPCStatus, string> = {
    ALIVE: colors.neons.green.default,
    DEAD: colors.neons.red.default,
    MISSING: colors.neons.yellow.default,
    UNKNOWN: colors.grays.gray600,
}

const NPCTrackerTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { npcTracker, addNPCEntry, updateNPCEntry, deleteNPCEntry } = useGMToolsDataStore()

    // Create dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [npcName, setNpcName] = useState('')
    const [role, setRole] = useState('')
    const [firstEncounter, setFirstEncounter] = useState('')
    const [relationship, setRelationship] = useState('')
    const [mood, setMood] = useState('')
    const [status, setStatus] = useState<NPCStatus>('ALIVE')
    const [notes, setNotes] = useState('')

    // Edit dialog
    const [editingNPC, setEditingNPC] = useState<NPCTrackerEntry | null>(null)

    const accentColor = colors.neons.orange.default
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, accentColor)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, accentColor)
    const titleStyle = getSectionTitleStyle(readerMode, accentColor)
    const selectStyle = getCyberpunkSelectStyle(readerMode, accentColor)

    const handleRandomName = () => {
        const result = generateRandomName()
        const handle = Math.random() > 0.5 ? ` "${generateHandle()}"` : ''
        setNpcName(result.name + handle)
    }

    const handleRandomRole = () => {
        const result = generateNPCByRole()
        setRole(result.role)
        if (!npcName.trim()) setNpcName(`${result.npc.name}`)
        if (notes.trim() === '') setNotes(result.npc.notes || '')
    }

    const handleRandomMood = () => setMood(getRandomFromArray(npcMoodTable))
    const handleRandomRelationship = () => setRelationship(generateRelationship())

    const handleCreate = () => {
        if (!npcName.trim()) return
        const entry: NPCTrackerEntry = {
            id: uuidv4(),
            name: npcName,
            role: role || undefined,
            firstEncounter: firstEncounter || 'Unknown',
            relationship: relationship || undefined,
            mood: mood || undefined,
            status,
            notes: notes || undefined,
            createdAt: Date.now(),
        }
        addNPCEntry(entry)
        setNpcName('')
        setRole('')
        setFirstEncounter('')
        setRelationship('')
        setMood('')
        setStatus('ALIVE')
        setNotes('')
        setDialogOpen(false)
    }

    const handleSaveEdit = () => {
        if (!editingNPC) return
        updateNPCEntry(editingNPC.id, {
            name: editingNPC.name,
            role: editingNPC.role,
            firstEncounter: editingNPC.firstEncounter,
            relationship: editingNPC.relationship,
            mood: editingNPC.mood,
            status: editingNPC.status,
            notes: editingNPC.notes,
        })
        setEditingNPC(null)
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.npcTracker.title')}
                </Typography>
                <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setDialogOpen(true)} sx={buttonStyle}>
                    {t('soloPlay.npcTracker.add')}
                </Button>
            </Stack>

            {npcTracker.length === 0 ? (
                <Typography variant="body2" sx={{ color: colors.grays.gray600, fontStyle: 'italic', textAlign: 'center', fontFamily: '"Lexend", sans-serif', py: 2 }}>
                    {t('soloPlay.npcTracker.noNPCs')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {npcTracker.map((npc) => (
                        <Paper key={npc.id} sx={{ ...getCyberpunkPaperStyle(readerMode, STATUS_COLORS[npc.status]), p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                color: readerMode ? colors.grays.gray000 : STATUS_COLORS[npc.status],
                                                fontFamily: '"Orbitron", sans-serif',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {npc.name}
                                        </Typography>
                                        <Chip
                                            label={t(`soloPlay.npcTracker.status.${npc.status}`)}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${STATUS_COLORS[npc.status]}30`,
                                                color: STATUS_COLORS[npc.status],
                                                fontSize: '0.6rem',
                                                height: 18,
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    </Stack>
                                    {npc.role && (
                                        <Typography variant="caption" sx={{ color: colors.neons.cyan.default, fontFamily: '"Lexend", sans-serif', display: 'block' }}>
                                            {npc.role}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" sx={{ color: colors.grays.gray500, fontFamily: '"Lexend", sans-serif', display: 'block' }}>
                                        {t('soloPlay.npcTracker.firstEncounter')}: {npc.firstEncounter}
                                    </Typography>
                                    {npc.relationship && (
                                        <Typography variant="caption" sx={{ color: colors.grays.gray600, display: 'block' }}>
                                            {t('soloPlay.npcTracker.relationship')}: {npc.relationship}
                                        </Typography>
                                    )}
                                    {npc.mood && (
                                        <Typography variant="caption" sx={{ color: colors.neons.yellow.default, display: 'block' }}>
                                            {t('soloPlay.npcTracker.mood')}: {npc.mood}
                                        </Typography>
                                    )}
                                    {npc.notes && (
                                        <Typography variant="caption" sx={{ color: colors.grays.gray600, display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                            {npc.notes}
                                        </Typography>
                                    )}
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title={t('common.edit')}>
                                        <IconButton size="small" onClick={() => setEditingNPC({ ...npc })} sx={{ color: colors.neons.purple.default, border: `1px solid ${colors.neons.purple.default}40`, borderRadius: 0, '&:hover': { backgroundColor: `${colors.neons.purple.default}20` } }}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('common.delete')}>
                                        <IconButton size="small" onClick={() => deleteNPCEntry(npc.id)} sx={{ color: colors.neons.red.default, border: `1px solid ${colors.neons.red.default}40`, borderRadius: 0, '&:hover': { backgroundColor: `${colors.neons.red.default}20` } }}>
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* Create NPC Dialog */}
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
                    {t('soloPlay.npcTracker.create')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="flex-end">
                            <TextField fullWidth label={t('soloPlay.npcTracker.nameLabel')} value={npcName} onChange={(e) => setNpcName(e.target.value)} placeholder="Enter or generate a name" sx={textFieldStyle} />
                            <Tooltip title={t('soloPlay.npcTracker.randomName')}>
                                <IconButton onClick={handleRandomName} sx={{ color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: 0 }}>
                                    <Casino />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="flex-end">
                            <TextField fullWidth label={t('soloPlay.npcTracker.roleLabel')} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Solo, Fixer, Netrunner..." sx={textFieldStyle} />
                            <Tooltip title={t('soloPlay.npcTracker.randomRole')}>
                                <IconButton onClick={handleRandomRole} sx={{ color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: 0 }}>
                                    <Casino />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <TextField fullWidth label={t('soloPlay.npcTracker.firstEncounter')} value={firstEncounter} onChange={(e) => setFirstEncounter(e.target.value)} placeholder="Session 3, at Afterlife bar" sx={textFieldStyle} />
                        <Stack direction="row" spacing={1} alignItems="flex-end">
                            <TextField fullWidth label={t('soloPlay.npcTracker.relationship')} value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Ally, rival, informant..." sx={textFieldStyle} />
                            <Tooltip title={t('soloPlay.npcTracker.randomRelationship')}>
                                <IconButton onClick={handleRandomRelationship} sx={{ color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: 0 }}>
                                    <Casino />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="flex-end">
                            <TextField fullWidth label={t('soloPlay.npcTracker.mood')} value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Hostile, friendly..." sx={textFieldStyle} />
                            <Tooltip title={t('soloPlay.npcTracker.randomMood')}>
                                <IconButton onClick={handleRandomMood} sx={{ color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: 0 }}>
                                    <Casino />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: readerMode ? '#666' : accentColor }}>{t('soloPlay.npcTracker.statusLabel')}</InputLabel>
                            <Select value={status} onChange={(e) => setStatus(e.target.value as NPCStatus)} label={t('soloPlay.npcTracker.statusLabel')} sx={selectStyle}>
                                <MenuItem value="ALIVE">{t('soloPlay.npcTracker.status.ALIVE')}</MenuItem>
                                <MenuItem value="DEAD">{t('soloPlay.npcTracker.status.DEAD')}</MenuItem>
                                <MenuItem value="MISSING">{t('soloPlay.npcTracker.status.MISSING')}</MenuItem>
                                <MenuItem value="UNKNOWN">{t('soloPlay.npcTracker.status.UNKNOWN')}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth label={t('soloPlay.npcTracker.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} sx={textFieldStyle} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}40` }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>{t('common.cancel')}</Button>
                    <Button onClick={handleCreate} variant="outlined" disabled={!npcName.trim()} sx={buttonStyle}>{t('common.create')}</Button>
                </DialogActions>
            </Dialog>

            {/* Edit NPC Dialog */}
            <Dialog
                open={!!editingNPC}
                onClose={() => setEditingNPC(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.purple.default}40`,
                        boxShadow: readerMode ? '0 4px 20px rgba(0,0,0,0.15)' : `0 0 30px ${colors.neons.purple.default}40`,
                    },
                }}
            >
                <DialogTitle sx={{ fontFamily: '"Orbitron", sans-serif', color: readerMode ? colors.grays.gray000 : colors.neons.purple.default, borderBottom: `1px solid ${colors.neons.purple.default}40` }}>
                    {t('soloPlay.npcTracker.edit')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    {editingNPC && (
                        <Stack spacing={2}>
                            <TextField fullWidth label={t('soloPlay.npcTracker.nameLabel')} value={editingNPC.name} onChange={(e) => setEditingNPC({ ...editingNPC, name: e.target.value })} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)} />
                            <TextField fullWidth label={t('soloPlay.npcTracker.roleLabel')} value={editingNPC.role || ''} onChange={(e) => setEditingNPC({ ...editingNPC, role: e.target.value })} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)} />
                            <TextField fullWidth label={t('soloPlay.npcTracker.firstEncounter')} value={editingNPC.firstEncounter} onChange={(e) => setEditingNPC({ ...editingNPC, firstEncounter: e.target.value })} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)} />
                            <TextField fullWidth label={t('soloPlay.npcTracker.relationship')} value={editingNPC.relationship || ''} onChange={(e) => setEditingNPC({ ...editingNPC, relationship: e.target.value })} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)} />
                            <TextField fullWidth label={t('soloPlay.npcTracker.mood')} value={editingNPC.mood || ''} onChange={(e) => setEditingNPC({ ...editingNPC, mood: e.target.value })} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)} />
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: readerMode ? '#666' : colors.neons.purple.default }}>{t('soloPlay.npcTracker.statusLabel')}</InputLabel>
                                <Select value={editingNPC.status} onChange={(e) => setEditingNPC({ ...editingNPC, status: e.target.value as NPCStatus })} label={t('soloPlay.npcTracker.statusLabel')} sx={getCyberpunkSelectStyle(readerMode, colors.neons.purple.default)}>
                                    <MenuItem value="ALIVE">{t('soloPlay.npcTracker.status.ALIVE')}</MenuItem>
                                    <MenuItem value="DEAD">{t('soloPlay.npcTracker.status.DEAD')}</MenuItem>
                                    <MenuItem value="MISSING">{t('soloPlay.npcTracker.status.MISSING')}</MenuItem>
                                    <MenuItem value="UNKNOWN">{t('soloPlay.npcTracker.status.UNKNOWN')}</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField fullWidth label={t('soloPlay.npcTracker.notes')} value={editingNPC.notes || ''} onChange={(e) => setEditingNPC({ ...editingNPC, notes: e.target.value })} multiline rows={2} sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)} />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.purple.default}40` }}>
                    <Button onClick={() => setEditingNPC(null)} sx={{ color: colors.grays.gray600 }}>{t('common.cancel')}</Button>
                    <Button onClick={handleSaveEdit} variant="outlined" sx={getCyberpunkButtonStyle(readerMode, colors.neons.purple.default)}>{t('common.save')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default NPCTrackerTool
