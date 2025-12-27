import Add from '@mui/icons-material/Add'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import CyberpunkFormControl from '../../../components/CyberpunkFormControl'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { BeatType } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { generateBeatDescription, generateEmptyBeatChart } from '../../../utils/generators/soloPlayUtils'
import { useGMToolsDataStore, type BeatChart } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkSelectStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkTabsStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const BeatChartTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Persisted state
    const {
        beatCharts,
        addBeatChart,
        updateBeatChart,
        updateBeat,
        deleteBeatChart,
    } = useGMToolsDataStore()

    const [activeChartIndex, setActiveChartIndex] = useState(0)
    const [newChartName, setNewChartName] = useState('')
    const [newChartDevelopments, setNewChartDevelopments] = useState(6)
    const [isAddingChart, setIsAddingChart] = useState(false)
    const [editingChartId, setEditingChartId] = useState<string | null>(null)
    const [editingChartName, setEditingChartName] = useState('')

    // Styles
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.pink.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.pink.default)
    const tabsStyle = getCyberpunkTabsStyle(readerMode, colors.neons.pink.default)
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.pink.default)

    const handleAddChart = () => {
        if (!newChartName.trim()) return
        const newChart: BeatChart = {
            id: uuidv4(),
            name: newChartName,
            beats: generateEmptyBeatChart(newChartDevelopments),
            createdAt: Date.now(),
        }
        addBeatChart(newChart)
        setActiveChartIndex(beatCharts.length)
        setNewChartName('')
        setNewChartDevelopments(6)
        setIsAddingChart(false)
    }

    const handleDeleteChart = (chartId: string) => {
        const chartIndex = beatCharts.findIndex((c) => c.id === chartId)
        deleteBeatChart(chartId)
        if (activeChartIndex >= chartIndex && activeChartIndex > 0) {
            setActiveChartIndex(activeChartIndex - 1)
        }
    }

    const handleRenameChart = () => {
        if (!editingChartId || !editingChartName.trim()) return
        updateBeatChart(editingChartId, { name: editingChartName })
        setEditingChartId(null)
        setEditingChartName('')
    }

    const handleGenerateBeatContent = (chartId: string, beatId: string, beatType: BeatType) => {
        const description = generateBeatDescription(beatType)
        updateBeat(chartId, beatId, { description })
    }

    const getBeatColor = (type: BeatType): string => {
        switch (type) {
            case 'HOOK':
                return colors.neons.cyan.default
            case 'CLIMAX':
                return colors.neons.red.default
            case 'RESOLUTION':
                return colors.neons.green.default
            default:
                return colors.neons.pink.default
        }
    }

    const getChartProgress = (chart: BeatChart): number => {
        const completedBeats = chart.beats.filter((b) => b.completed).length
        return (completedBeats / chart.beats.length) * 100
    }

    const activeChart = beatCharts[activeChartIndex]

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('gmTools.beatChart')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setIsAddingChart(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.beats.newChart')}
                </Button>
            </Stack>

            {beatCharts.length === 0 ? (
                <Paper
                    sx={{
                        ...getCyberpunkPaperStyle(readerMode, colors.neons.pink.default),
                        p: 3,
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.grays.gray600,
                            fontStyle: 'italic',
                            fontFamily: '"Lexend", sans-serif',
                        }}
                    >
                        {t('soloPlay.beats.noCharts')}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Add />}
                        onClick={() => setIsAddingChart(true)}
                        sx={{ ...buttonStyle, mt: 2 }}
                    >
                        {t('soloPlay.beats.createFirst')}
                    </Button>
                </Paper>
            ) : (
                <>
                    {/* Chart Tabs */}
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <Tabs
                            value={activeChartIndex}
                            onChange={(_, v) => setActiveChartIndex(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ ...tabsStyle, flex: 1 }}
                        >
                            {beatCharts.map((chart, index) => (
                                <Tab
                                    key={chart.id}
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <span>{chart.name}</span>
                                            {index === activeChartIndex && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingChartId(chart.id)
                                                        setEditingChartName(chart.name)
                                                    }}
                                                    sx={{
                                                        p: 0.25,
                                                        color: colors.neons.pink.default,
                                                    }}
                                                >
                                                    <Edit sx={{ fontSize: 12 }} />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    }
                                />
                            ))}
                        </Tabs>
                        {activeChart && (
                            <Tooltip title={t('common.delete')}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDeleteChart(activeChart.id)}
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
                        )}
                    </Stack>

                    {/* Progress Bar */}
                    {activeChart && (
                        <Box mb={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: colors.grays.gray600,
                                        fontFamily: '"Lexend", sans-serif',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {t('soloPlay.beats.progress')}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: colors.neons.green.default,
                                        fontFamily: '"Orbitron", sans-serif',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    {activeChart.beats.filter((b) => b.completed).length}/{activeChart.beats.length}
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={getChartProgress(activeChart)}
                                sx={{
                                    height: 8,
                                    borderRadius: 0,
                                    backgroundColor: readerMode
                                        ? 'rgba(0,0,0,0.1)'
                                        : 'rgba(0, 255, 136, 0.1)',
                                    border: readerMode
                                        ? 'none'
                                        : `1px solid ${colors.neons.green.default}30`,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: colors.neons.green.default,
                                        boxShadow: readerMode
                                            ? 'none'
                                            : `0 0 10px ${colors.neons.green.default}80`,
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Beats Grid */}
                    {activeChart && (
                        <Box>
                            <Stack spacing={1}>
                                {activeChart.beats.map((beat) => {
                                    const beatColor = getBeatColor(beat.beatType)
                                    return (
                                        <Paper
                                            key={beat.id}
                                            sx={{
                                                ...getCyberpunkPaperStyle(readerMode, beatColor),
                                                p: 1,
                                                backgroundColor: beat.completed
                                                    ? readerMode
                                                        ? 'rgba(0, 128, 68, 0.1)'
                                                        : 'rgba(0, 255, 136, 0.1)'
                                                    : undefined,
                                                opacity: beat.completed ? 0.7 : 1,
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Checkbox
                                                    checked={beat.completed}
                                                    onChange={(e) =>
                                                        updateBeat(activeChart.id, beat.id, {
                                                            completed: e.target.checked,
                                                        })
                                                    }
                                                    size="small"
                                                    sx={{
                                                        color: beatColor,
                                                        '&.Mui-checked': {
                                                            color: colors.neons.green.default,
                                                        },
                                                    }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: beatColor,
                                                            fontFamily: '"Orbitron", sans-serif',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.65rem',
                                                            letterSpacing: '2px',
                                                            textTransform: 'uppercase',
                                                            textShadow: readerMode
                                                                ? 'none'
                                                                : `0 0 5px ${beatColor}60`,
                                                        }}
                                                    >
                                                        {t(`soloPlay.beats.types.${beat.beatType}`)}
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        variant="standard"
                                                        placeholder={t('soloPlay.beats.whatHappens')}
                                                        value={beat.description}
                                                        onChange={(e) =>
                                                            updateBeat(activeChart.id, beat.id, {
                                                                description: e.target.value,
                                                            })
                                                        }
                                                        InputProps={{
                                                            disableUnderline: true,
                                                            sx: {
                                                                fontSize: '0.85rem',
                                                                fontFamily: '"Lexend", sans-serif',
                                                                textDecoration: beat.completed
                                                                    ? 'line-through'
                                                                    : 'none',
                                                                color: beat.completed
                                                                    ? colors.grays.gray600
                                                                    : 'inherit',
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                                <Tooltip title={t('soloPlay.beats.generateIdea')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleGenerateBeatContent(
                                                                activeChart.id,
                                                                beat.id,
                                                                beat.beatType
                                                            )
                                                        }
                                                        sx={{
                                                            color: beatColor,
                                                            border: `1px solid ${beatColor}40`,
                                                            borderRadius: 0,
                                                            '&:hover': {
                                                                backgroundColor: `${beatColor}20`,
                                                                boxShadow: `0 0 10px ${beatColor}40`,
                                                            },
                                                        }}
                                                    >
                                                        <AutoAwesome fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Paper>
                                    )
                                })}
                            </Stack>
                        </Box>
                    )}
                </>
            )}

            {/* Add Chart Dialog */}
            <Dialog
                open={isAddingChart}
                onClose={() => setIsAddingChart(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : 'rgba(10, 20, 35, 0.98)',
                        border: readerMode ? 'none' : `1px solid ${colors.neons.pink.default}40`,
                        borderRadius: 0,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.pink.default,
                        letterSpacing: '2px',
                    }}
                >
                    {t('soloPlay.beats.newChart')}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            fullWidth
                            label={t('soloPlay.beats.chartName')}
                            value={newChartName}
                            onChange={(e) => setNewChartName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddChart()}
                            sx={textFieldStyle}
                        />
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('soloPlay.beats.developmentSteps')}
                            fullWidth
                        >
                            <Select
                                value={newChartDevelopments}
                                onChange={(e) => setNewChartDevelopments(e.target.value as number)}
                                label={t('soloPlay.beats.developmentSteps')}
                                sx={getCyberpunkSelectStyle(readerMode, colors.neons.pink.default)}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <MenuItem key={n} value={n}>
                                        {n} {t('soloPlay.beats.developments')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        <Typography
                            variant="caption"
                            sx={{
                                color: colors.grays.gray600,
                                fontStyle: 'italic',
                                fontFamily: '"Lexend", sans-serif',
                            }}
                        >
                            {t('soloPlay.beats.totalBeats', { count: newChartDevelopments + 3 })}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsAddingChart(false)}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleAddChart}
                        disabled={!newChartName.trim()}
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.green.default)}
                    >
                        {t('common.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rename Chart Dialog */}
            <Dialog
                open={!!editingChartId}
                onClose={() => setEditingChartId(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : 'rgba(10, 20, 35, 0.98)',
                        border: readerMode ? 'none' : `1px solid ${colors.neons.pink.default}40`,
                        borderRadius: 0,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.pink.default,
                        letterSpacing: '2px',
                    }}
                >
                    {t('soloPlay.beats.renameChart')}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t('soloPlay.beats.chartName')}
                        value={editingChartName}
                        onChange={(e) => setEditingChartName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameChart()}
                        sx={{ ...textFieldStyle, mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setEditingChartId(null)}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleRenameChart}
                        disabled={!editingChartName.trim()}
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.green.default)}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default BeatChartTool
