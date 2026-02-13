import Add from '@mui/icons-material/Add'
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
import type { IPEntry, IPTracker } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const IPTrackingTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { ipTrackers, addIPTracker, updateIPTracker, deleteIPTracker } = useGMToolsDataStore()

    // Create tracker dialog
    const [trackerDialogOpen, setTrackerDialogOpen] = useState(false)
    const [edgerunnerName, setEdgerunnerName] = useState('')

    // Add IP entry dialog
    const [entryDialogOpen, setEntryDialogOpen] = useState(false)
    const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null)
    const [entryDate, setEntryDate] = useState('')
    const [entrySpentOn, setEntrySpentOn] = useState('')
    const [entryAmount, setEntryAmount] = useState('')
    const [entryIsSpend, setEntryIsSpend] = useState(false)

    const accentColor = colors.neons.blue.default
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, accentColor)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, accentColor)
    const titleStyle = getSectionTitleStyle(readerMode, accentColor)

    const handleCreateTracker = () => {
        if (!edgerunnerName.trim()) return
        const tracker: IPTracker = {
            id: uuidv4(),
            edgerunnerName,
            totalIP: 0,
            spentIP: 0,
            entries: [],
        }
        addIPTracker(tracker)
        setEdgerunnerName('')
        setTrackerDialogOpen(false)
    }

    const handleOpenAddEntry = (trackerId: string, isSpend: boolean) => {
        setActiveTrackerId(trackerId)
        setEntryIsSpend(isSpend)
        setEntryDate(new Date().toLocaleDateString())
        setEntrySpentOn('')
        setEntryAmount('')
        setEntryDialogOpen(true)
    }

    const handleAddEntry = () => {
        if (!activeTrackerId || !entryAmount) return
        const tracker = ipTrackers.find((t) => t.id === activeTrackerId)
        if (!tracker) return

        const amount = parseInt(entryAmount) || 0
        if (amount <= 0) return

        const entry: IPEntry = {
            id: uuidv4(),
            edgerunnerName: tracker.edgerunnerName,
            date: entryDate || new Date().toLocaleDateString(),
            spentOn: entryIsSpend ? entrySpentOn || t('soloPlay.ipTracker.unspecifiedDefault') : t('soloPlay.ipTracker.earnedDefault'),
            ipAmount: entryIsSpend ? -amount : amount,
        }

        const newEntries = [entry, ...tracker.entries]
        const totalEarned = newEntries.filter((e) => e.ipAmount > 0).reduce((sum, e) => sum + e.ipAmount, 0)
        const totalSpent = newEntries.filter((e) => e.ipAmount < 0).reduce((sum, e) => sum + Math.abs(e.ipAmount), 0)

        updateIPTracker(activeTrackerId, {
            entries: newEntries,
            totalIP: totalEarned,
            spentIP: totalSpent,
        })

        setEntryDialogOpen(false)
    }

    const handleDeleteEntry = (trackerId: string, entryId: string) => {
        const tracker = ipTrackers.find((t) => t.id === trackerId)
        if (!tracker) return

        const newEntries = tracker.entries.filter((e) => e.id !== entryId)
        const totalEarned = newEntries.filter((e) => e.ipAmount > 0).reduce((sum, e) => sum + e.ipAmount, 0)
        const totalSpent = newEntries.filter((e) => e.ipAmount < 0).reduce((sum, e) => sum + Math.abs(e.ipAmount), 0)

        updateIPTracker(trackerId, {
            entries: newEntries,
            totalIP: totalEarned,
            spentIP: totalSpent,
        })
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.ipTracker.title')}
                </Typography>
                <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setTrackerDialogOpen(true)} sx={buttonStyle}>
                    {t('soloPlay.ipTracker.addTracker')}
                </Button>
            </Stack>

            {ipTrackers.length === 0 ? (
                <Typography variant="body2" sx={{ color: colors.grays.gray600, fontStyle: 'italic', textAlign: 'center', fontFamily: '"Lexend", sans-serif', py: 2 }}>
                    {t('soloPlay.ipTracker.noTrackers')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {ipTrackers.map((tracker) => {
                        const available = tracker.totalIP - tracker.spentIP
                        return (
                            <Paper key={tracker.id} sx={{ ...getCyberpunkPaperStyle(readerMode, accentColor), p: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                color: readerMode ? colors.grays.gray000 : accentColor,
                                                fontFamily: '"Orbitron", sans-serif',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {tracker.edgerunnerName}
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={0.5}>
                                            <Chip
                                                label={`${t('soloPlay.ipTracker.earned')}: ${tracker.totalIP}`}
                                                size="small"
                                                sx={{ backgroundColor: `${colors.neons.green.default}30`, color: colors.neons.green.default, fontSize: '0.65rem', height: 20 }}
                                            />
                                            <Chip
                                                label={`${t('soloPlay.ipTracker.spent')}: ${tracker.spentIP}`}
                                                size="small"
                                                sx={{ backgroundColor: `${colors.neons.red.default}30`, color: colors.neons.red.default, fontSize: '0.65rem', height: 20 }}
                                            />
                                            <Chip
                                                label={`${t('soloPlay.ipTracker.available')}: ${available}`}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${accentColor}30`,
                                                    color: accentColor,
                                                    fontSize: '0.65rem',
                                                    height: 20,
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title={t('soloPlay.ipTracker.earnIP')}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleOpenAddEntry(tracker.id, false)}
                                                sx={{
                                                    ...getCyberpunkButtonStyle(readerMode, colors.neons.green.default),
                                                    fontSize: '0.65rem',
                                                    px: 1,
                                                    minWidth: 'auto',
                                                }}
                                            >
                                                +IP
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={t('soloPlay.ipTracker.spendIP')}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleOpenAddEntry(tracker.id, true)}
                                                sx={{
                                                    ...getCyberpunkButtonStyle(readerMode, colors.neons.red.default),
                                                    fontSize: '0.65rem',
                                                    px: 1,
                                                    minWidth: 'auto',
                                                }}
                                            >
                                                -IP
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={t('common.delete')}>
                                            <IconButton size="small" onClick={() => deleteIPTracker(tracker.id)} sx={{ color: colors.neons.red.default, border: `1px solid ${colors.neons.red.default}40`, borderRadius: 0, '&:hover': { backgroundColor: `${colors.neons.red.default}20` } }}>
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>

                                {/* IP Entries */}
                                {tracker.entries.length > 0 && (
                                    <Accordion sx={{ mt: 1.5, backgroundColor: 'transparent', boxShadow: 'none', '&::before': { display: 'none' } }}>
                                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.grays.gray500 }} />} sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                                            <Typography variant="caption" sx={{ color: colors.grays.gray500, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {t('soloPlay.ipTracker.history')} ({tracker.entries.length})
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 0 }}>
                                            <Stack spacing={0.5}>
                                                {tracker.entries.map((entry) => (
                                                    <Stack
                                                        key={entry.id}
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        sx={{
                                                            p: 0.75,
                                                            borderRadius: 1,
                                                            backgroundColor: readerMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)',
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block' }}>
                                                                {entry.date}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: readerMode ? colors.grays.gray000 : colors.grays.gray800, fontFamily: '"Lexend", sans-serif' }}>
                                                                {entry.spentOn}
                                                            </Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontFamily: '"Orbitron", sans-serif',
                                                                    fontWeight: 'bold',
                                                                    color: entry.ipAmount > 0 ? colors.neons.green.default : colors.neons.red.default,
                                                                }}
                                                            >
                                                                {entry.ipAmount > 0 ? `+${entry.ipAmount}` : entry.ipAmount}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteEntry(tracker.id, entry.id)}
                                                                sx={{ color: colors.grays.gray600, p: 0.25 }}
                                                            >
                                                                <DeleteOutline sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                )}
                            </Paper>
                        )
                    })}
                </Stack>
            )}

            {/* Create Tracker Dialog */}
            <Dialog
                open={trackerDialogOpen}
                onClose={() => setTrackerDialogOpen(false)}
                maxWidth="xs"
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
                    {t('soloPlay.ipTracker.createTracker')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <TextField
                        fullWidth
                        label={t('soloPlay.ipTracker.edgerunnerName')}
                        value={edgerunnerName}
                        onChange={(e) => setEdgerunnerName(e.target.value)}
                        placeholder={t('soloPlay.ipTracker.namePlaceholder')}
                        sx={textFieldStyle}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}40` }}>
                    <Button onClick={() => setTrackerDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>{t('common.cancel')}</Button>
                    <Button onClick={handleCreateTracker} variant="outlined" disabled={!edgerunnerName.trim()} sx={buttonStyle}>{t('common.create')}</Button>
                </DialogActions>
            </Dialog>

            {/* Add IP Entry Dialog */}
            <Dialog
                open={entryDialogOpen}
                onClose={() => setEntryDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${entryIsSpend ? colors.neons.red.default : colors.neons.green.default}40`,
                        boxShadow: readerMode ? '0 4px 20px rgba(0,0,0,0.15)' : `0 0 30px ${entryIsSpend ? colors.neons.red.default : colors.neons.green.default}40`,
                    },
                }}
            >
                <DialogTitle sx={{ fontFamily: '"Orbitron", sans-serif', color: readerMode ? colors.grays.gray000 : entryIsSpend ? colors.neons.red.default : colors.neons.green.default, borderBottom: `1px solid ${entryIsSpend ? colors.neons.red.default : colors.neons.green.default}40` }}>
                    {entryIsSpend ? t('soloPlay.ipTracker.spendIP') : t('soloPlay.ipTracker.earnIP')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.ipTracker.amount')}
                            type="number"
                            value={entryAmount}
                            onChange={(e) => setEntryAmount(e.target.value)}
                            sx={getCyberpunkTextFieldStyle(readerMode, entryIsSpend ? colors.neons.red.default : colors.neons.green.default)}
                        />
                        {entryIsSpend && (
                            <TextField
                                fullWidth
                                label={t('soloPlay.ipTracker.spentOnLabel')}
                                value={entrySpentOn}
                                onChange={(e) => setEntrySpentOn(e.target.value)}
                                placeholder={t('soloPlay.ipTracker.spentOnPlaceholder')}
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)}
                            />
                        )}
                        <TextField
                            fullWidth
                            label={t('soloPlay.ipTracker.date')}
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            sx={getCyberpunkTextFieldStyle(readerMode, entryIsSpend ? colors.neons.red.default : colors.neons.green.default)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${entryIsSpend ? colors.neons.red.default : colors.neons.green.default}40` }}>
                    <Button onClick={() => setEntryDialogOpen(false)} sx={{ color: colors.grays.gray600 }}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleAddEntry}
                        variant="outlined"
                        disabled={!entryAmount}
                        sx={getCyberpunkButtonStyle(readerMode, entryIsSpend ? colors.neons.red.default : colors.neons.green.default)}
                    >
                        {t('common.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default IPTrackingTool
