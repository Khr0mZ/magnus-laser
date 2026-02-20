import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import NoteAdd from '@mui/icons-material/NoteAdd'
import Refresh from '@mui/icons-material/Refresh'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
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
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import CyberpunkFormControl from '../../../components/CyberpunkFormControl'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { OpenQuestionResult, OracleProbability, OracleResult } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    generateRandomEncounter,
    type EncounterTime,
    type EncounterZone,
} from '../../../utils/generators/soloPlayTablesExpanded'
import { rollOpenQuestion, rollOracle } from '../../../utils/generators/soloPlayUtils'
import { useGMToolsDataStore, type HistoryNote, type RandomTableResult } from '../GMToolsDataStore'
import {
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkSelectStyle,
    getCyberpunkTabsStyle,
    getCyberpunkTextFieldStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'
import RandomTablesTool from './RandomTablesTool'
import { allGenerators, formatResult } from './randomTablesData'

// === Unified history types ===

type UnifiedHistoryItem =
    | { kind: 'oracle'; id: string; timestamp: number; data: OracleResult }
    | { kind: 'openQuestion'; id: string; timestamp: number; data: OpenQuestionResult }
    | { kind: 'randomTable'; id: string; timestamp: number; data: RandomTableResult }
    | { kind: 'note'; id: string; timestamp: number; data: HistoryNote }

const OracleTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [tabValue, setTabValue] = useState(0)

    // Persisted state
    const {
        oracleHistory,
        openQuestionHistory,
        randomTableResults,
        historyNotes,
        addOracleResult,
        addOpenQuestionResult,
        updateOracleResult,
        updateOpenQuestionResult,
        clearOracleHistory,
        clearOpenQuestionHistory,
        updateRandomTableResult,
        deleteRandomTableResult,
        clearRandomTableResults,
        addHistoryNote,
        updateHistoryNote,
        deleteHistoryNote,
        clearHistoryNotes,
    } = useGMToolsDataStore()

    // Local state for inputs
    const [closedQuestion, setClosedQuestion] = useState('')
    const [probability, setProbability] = useState<OracleProbability>('FIFTY_FIFTY')
    const [openQuestion, setOpenQuestion] = useState('')

    // Clear all confirmation dialog
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)

    // Encounter defaults for rerolling encounter results from unified history
    const encounterZone: EncounterZone = 'moderate'
    const encounterTime: EncounterTime = 'day'

    const handleAskOracle = () => {
        if (!closedQuestion.trim()) return
        const result = rollOracle(closedQuestion, probability)
        addOracleResult(result)
        setClosedQuestion('')
    }

    const handleAskOpenQuestion = () => {
        if (!openQuestion.trim()) return
        const result = rollOpenQuestion(openQuestion)
        addOpenQuestionResult(result)
        setOpenQuestion('')
    }

    const getAnswerColor = (answer: OracleResult['answer']): string => {
        switch (answer) {
            case 'YES':
                return colors.neons.green.default
            case 'YES_WITH_COMPLICATION':
                return colors.neons.cyan.default
            case 'COMPLICATED':
                return colors.neons.yellow.default
            case 'NO_WITH_COMPLICATION':
                return colors.neons.orange.default
            case 'NO':
                return colors.neons.red.default
            default:
                return colors.grays.gray600
        }
    }

    const probabilityOptions: { value: OracleProbability; label: string }[] = [
        { value: 'CERTAIN', label: t('soloPlay.oracle.probabilities.certain') },
        { value: 'LIKELY', label: t('soloPlay.oracle.probabilities.likely') },
        { value: 'FIFTY_FIFTY', label: t('soloPlay.oracle.probabilities.fifty_fifty') },
        { value: 'UNLIKELY', label: t('soloPlay.oracle.probabilities.unlikely') },
        { value: 'IMPOSSIBLE', label: t('soloPlay.oracle.probabilities.impossible') },
    ]

    // Random table result handlers
    const handleReroll = (result: RandomTableResult) => {
        if (result.type === 'encounter') {
            const encounter = generateRandomEncounter(encounterZone, encounterTime)
            const zoneLabel = t(`soloPlay.tables.zones.${encounterZone}`)
            const timeLabel = t(`soloPlay.tables.times.${encounterTime}`)
            updateRandomTableResult(result.id, {
                content: `Zone: ${zoneLabel}\nTime: ${timeLabel}\nEncounter: ${encounter}`,
            })
            return
        }
        const gen = allGenerators[result.type]
        if (!gen) return
        updateRandomTableResult(result.id, { content: formatResult(gen.generator()) })
    }

    // Reroll handlers for oracle and open question
    const handleRerollOracle = (result: OracleResult) => {
        const newResult = rollOracle(result.question, result.probability)
        updateOracleResult(result.id, { roll: newResult.roll, answer: newResult.answer })
    }

    const handleRerollOpenQuestion = (result: OpenQuestionResult) => {
        const newResult = rollOpenQuestion(result.question)
        updateOpenQuestionResult(result.id, {
            verb: newResult.verb,
            noun: newResult.noun,
            adjective: newResult.adjective,
        })
    }

    const handleClearAll = () => {
        setClearAllDialogOpen(true)
    }

    const handleConfirmClearAll = () => {
        clearOracleHistory()
        clearOpenQuestionHistory()
        clearRandomTableResults()
        clearHistoryNotes()
        setClearAllDialogOpen(false)
    }

    // Build unified history sorted by timestamp
    const unifiedHistory = useMemo(() => {
        const items: UnifiedHistoryItem[] = [
            ...oracleHistory.map((r) => ({ kind: 'oracle' as const, id: r.id, timestamp: r.timestamp, data: r })),
            ...openQuestionHistory.map((r) => ({
                kind: 'openQuestion' as const,
                id: r.id,
                timestamp: r.timestamp,
                data: r,
            })),
            ...randomTableResults.map((r) => ({
                kind: 'randomTable' as const,
                id: r.id,
                timestamp: r.timestamp,
                data: r,
            })),
            ...historyNotes.map((n) => ({ kind: 'note' as const, id: n.id, timestamp: n.timestamp, data: n })),
        ]
        return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
    }, [oracleHistory, openQuestionHistory, randomTableResults, historyNotes])

    const totalResults =
        oracleHistory.length + openQuestionHistory.length + randomTableResults.length + historyNotes.length

    // Styles
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)
    const selectStyle = getCyberpunkSelectStyle(readerMode, colors.neons.cyan.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.cyan.default)
    const pinkButtonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.pink.default)
    const tabsStyle = getCyberpunkTabsStyle(readerMode, colors.neons.cyan.default)
    const paperStyle = getCyberpunkPaperStyle(readerMode, colors.neons.cyan.default)
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.cyan.default)

    // Shared action button style
    const actionButtonSx = (color: string) => ({
        color,
        border: `1px solid ${color}40`,
        borderRadius: 0,
        padding: '2px',
        '&:hover': {
            backgroundColor: `${color}20`,
            boxShadow: `0 0 10px ${color}40`,
        },
    })

    // Render an oracle result card
    const renderOracleResult = (result: OracleResult) => {
        const answerColor = getAnswerColor(result.answer)
        return (
            <Paper key={result.id} sx={{ ...paperStyle, p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                            label={t('soloPlay.oracle.closedQuestion')}
                            size="small"
                            sx={{
                                backgroundColor: readerMode
                                    ? colors.neons.cyan.default
                                    : `${colors.neons.cyan.default}20`,
                                color: readerMode ? '#fff' : colors.neons.cyan.default,
                                border: readerMode ? 'none' : `1px solid ${colors.neons.cyan.default}60`,
                                height: 18,
                                fontSize: '0.55rem',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                            }}
                        />
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip disableInteractive title={t('soloPlay.tables.reroll')}>
                            <IconButton
                                size="small"
                                onClick={() => handleRerollOracle(result)}
                                sx={actionButtonSx(colors.neons.cyan.default)}
                            >
                                <Refresh sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip disableInteractive title={t('common.delete')}>
                            <IconButton
                                size="small"
                                onClick={() => useGMToolsDataStore.getState().deleteOracleResult(result.id)}
                                sx={actionButtonSx(colors.neons.red.default)}
                            >
                                <DeleteOutline sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
                <Typography
                    variant="caption"
                    sx={{
                        color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                        display: 'block',
                        fontStyle: 'italic',
                    }}
                >
                    &ldquo;{result.question}&rdquo;
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5} flexWrap="wrap">
                    <Chip
                        label={t(`soloPlay.oracle.answers.${result.answer}`)}
                        size="small"
                        sx={{
                            backgroundColor: readerMode ? answerColor : `${answerColor}30`,
                            color: readerMode ? '#fff' : answerColor,
                            border: readerMode ? 'none' : `1px solid ${answerColor}`,
                            height: 22,
                            fontSize: '0.7rem',
                            fontFamily: '"Lexend", sans-serif',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            boxShadow: readerMode ? 'none' : `0 0 8px ${answerColor}40`,
                        }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            color: colors.grays.gray500,
                            fontFamily: '"Lexend", sans-serif',
                        }}
                    >
                        d100={result.roll} ({t(`soloPlay.oracle.probabilities.${result.probability.toLowerCase()}`)})
                    </Typography>
                </Stack>
            </Paper>
        )
    }

    // Render an open question result card
    const renderOpenQuestionResult = (result: OpenQuestionResult) => {
        return (
            <Paper
                key={result.id}
                sx={{
                    ...getCyberpunkPaperStyle(readerMode, colors.neons.pink.default),
                    p: 1.5,
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                            label={t('soloPlay.oracle.openQuestion')}
                            size="small"
                            sx={{
                                backgroundColor: readerMode
                                    ? colors.neons.pink.default
                                    : `${colors.neons.pink.default}20`,
                                color: readerMode ? '#fff' : colors.neons.pink.default,
                                border: readerMode ? 'none' : `1px solid ${colors.neons.pink.default}60`,
                                height: 18,
                                fontSize: '0.55rem',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                            }}
                        />
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip disableInteractive title={t('soloPlay.tables.reroll')}>
                            <IconButton
                                size="small"
                                onClick={() => handleRerollOpenQuestion(result)}
                                sx={actionButtonSx(colors.neons.pink.default)}
                            >
                                <Refresh sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip disableInteractive title={t('common.delete')}>
                            <IconButton
                                size="small"
                                onClick={() => useGMToolsDataStore.getState().deleteOpenQuestionResult(result.id)}
                                sx={actionButtonSx(colors.neons.red.default)}
                            >
                                <DeleteOutline sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
                <Typography
                    variant="caption"
                    sx={{
                        color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                        display: 'block',
                        fontStyle: 'italic',
                    }}
                >
                    &ldquo;{result.question}&rdquo;
                </Typography>
                <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                    <Chip
                        label={result.verb}
                        size="small"
                        sx={{
                            backgroundColor: readerMode
                                ? colors.neons.green.default
                                : `${colors.neons.green.default}30`,
                            color: readerMode ? '#fff' : colors.neons.green.default,
                            border: readerMode ? 'none' : `1px solid ${colors.neons.green.default}`,
                            height: 22,
                            fontSize: '0.7rem',
                            fontFamily: '"Lexend", sans-serif',
                            fontWeight: 'bold',
                            boxShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}40`,
                        }}
                    />
                    <Chip
                        label={result.noun}
                        size="small"
                        sx={{
                            backgroundColor: readerMode ? colors.neons.blue.default : `${colors.neons.blue.default}30`,
                            color: readerMode ? '#fff' : colors.neons.blue.default,
                            border: readerMode ? 'none' : `1px solid ${colors.neons.blue.default}`,
                            height: 22,
                            fontSize: '0.7rem',
                            fontFamily: '"Lexend", sans-serif',
                            fontWeight: 'bold',
                            boxShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.blue.default}40`,
                        }}
                    />
                    {result.adjective && (
                        <Chip
                            label={result.adjective}
                            size="small"
                            sx={{
                                backgroundColor: readerMode
                                    ? colors.neons.purple.default
                                    : `${colors.neons.purple.default}30`,
                                color: readerMode ? '#fff' : colors.neons.purple.default,
                                border: readerMode ? 'none' : `1px solid ${colors.neons.purple.default}`,
                                height: 22,
                                fontSize: '0.7rem',
                                fontFamily: '"Lexend", sans-serif',
                                fontWeight: 'bold',
                                boxShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.purple.default}40`,
                            }}
                        />
                    )}
                </Stack>
            </Paper>
        )
    }

    // Insert a text note at a given timestamp
    const handleInsertNote = useCallback(
        (timestamp: number) => {
            addHistoryNote({ id: uuidv4(), timestamp, content: '' })
        },
        [addHistoryNote]
    )

    // Compute the timestamp for a note inserted at a given position in the sorted list
    const getInsertTimestamp = useCallback(
        (index: number) => {
            if (unifiedHistory.length === 0) return Date.now()
            if (index === 0) return unifiedHistory[0].timestamp + 1
            if (index >= unifiedHistory.length) return unifiedHistory[unifiedHistory.length - 1].timestamp - 1
            return Math.floor((unifiedHistory[index - 1].timestamp + unifiedHistory[index].timestamp) / 2)
        },
        [unifiedHistory]
    )

    // Note insert zone component — clickable zone that expands on hover
    const NoteInsertZone = ({ index }: { index: number }) => {
        const [hovered, setHovered] = useState(false)
        return (
            <Tooltip disableInteractive title={hovered ? t('soloPlay.oracle.notes.addNote') : ''}>
                <Box
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onClick={() => handleInsertNote(getInsertTimestamp(index))}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: hovered ? 32 : 12,
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        borderRadius: 1,
                        backgroundColor: hovered ? `${colors.neons.yellow.default}10` : 'transparent',
                        borderTop: hovered ? `1px dashed ${colors.neons.yellow.default}40` : '1px solid transparent',
                        borderBottom: hovered ? `1px dashed ${colors.neons.yellow.default}40` : '1px solid transparent',
                    }}
                >
                    {hovered && <NoteAdd sx={{ fontSize: 16, color: colors.neons.yellow.default }} />}
                </Box>
            </Tooltip>
        )
    }

    // Render a history note card
    const renderHistoryNote = (note: HistoryNote) => {
        const noteColor = colors.neons.yellow.default
        return (
            <Paper
                key={note.id}
                sx={{
                    ...getCyberpunkPaperStyle(readerMode, noteColor),
                    p: 1.5,
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip
                        label={t('soloPlay.oracle.notes.note')}
                        size="small"
                        sx={{
                            backgroundColor: readerMode ? noteColor : `${noteColor}20`,
                            color: readerMode ? '#fff' : noteColor,
                            border: readerMode ? 'none' : `1px solid ${noteColor}60`,
                            height: 18,
                            fontSize: '0.55rem',
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                        }}
                    />
                    <Tooltip disableInteractive title={t('common.delete')}>
                        <IconButton
                            size="small"
                            onClick={() => deleteHistoryNote(note.id)}
                            sx={actionButtonSx(colors.neons.red.default)}
                        >
                            <DeleteOutline sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <TextField
                    fullWidth
                    multiline
                    size="small"
                    value={note.content}
                    placeholder={t('soloPlay.oracle.notes.notePlaceholder')}
                    onChange={(e) => updateHistoryNote(note.id, { content: e.target.value })}
                    sx={{
                        ...getCyberpunkTextFieldStyle(readerMode, noteColor),
                        '& .MuiOutlinedInput-root': {
                            color: readerMode ? colors.grays.gray000 : colors.grays.gray800,
                            fontFamily: '"Lexend", sans-serif',
                            fontSize: '0.85rem',
                            '& fieldset': {
                                borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                                borderColor: `${noteColor}40`,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: noteColor,
                            },
                        },
                    }}
                />
            </Paper>
        )
    }

    // Render a random table result card
    const renderRandomTableResult = (result: RandomTableResult) => {
        const resultColor = allGenerators[result.type]?.color || colors.neons.green.default

        return (
            <Paper
                key={result.id}
                sx={{
                    ...getCyberpunkPaperStyle(readerMode, resultColor),
                    p: 1.5,
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                            label={t('soloPlay.oracle.randomTables')}
                            size="small"
                            sx={{
                                backgroundColor: readerMode
                                    ? colors.neons.green.default
                                    : `${colors.neons.green.default}20`,
                                color: readerMode ? '#fff' : colors.neons.green.default,
                                border: readerMode ? 'none' : `1px solid ${colors.neons.green.default}60`,
                                height: 18,
                                fontSize: '0.55rem',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: resultColor,
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                fontSize: '0.6rem',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                textShadow: readerMode ? 'none' : `0 0 5px ${resultColor}60`,
                            }}
                        >
                            {t(`soloPlay.tables.${result.type}`, result.type)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip disableInteractive title={t('soloPlay.tables.reroll')}>
                            <IconButton
                                size="small"
                                onClick={() => handleReroll(result)}
                                sx={actionButtonSx(resultColor)}
                            >
                                <Refresh sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip disableInteractive title={t('common.delete')}>
                            <IconButton
                                size="small"
                                onClick={() => deleteRandomTableResult(result.id)}
                                sx={actionButtonSx(colors.neons.red.default)}
                            >
                                <DeleteOutline sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                <TextField
                    fullWidth
                    multiline
                    size="small"
                    value={result.content}
                    onChange={(e) => updateRandomTableResult(result.id, { content: e.target.value })}
                    sx={{
                        ...getCyberpunkTextFieldStyle(readerMode, resultColor),
                        '& .MuiOutlinedInput-root': {
                            color: readerMode ? colors.grays.gray000 : colors.grays.gray800,
                            fontFamily: '"Lexend", sans-serif',
                            fontSize: '0.85rem',
                            '& fieldset': {
                                borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                                borderColor: `${resultColor}40`,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: resultColor,
                            },
                        },
                    }}
                />
            </Paper>
        )
    }

    return (
        <Box>
            <Typography variant="h6" sx={titleStyle}>
                {t('gmTools.oracle')}
            </Typography>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ ...tabsStyle, mb: 2 }} variant="fullWidth">
                <Tab label={t('soloPlay.oracle.closedQuestion')} />
                <Tab label={t('soloPlay.oracle.openQuestion')} />
                <Tab label={t('soloPlay.oracle.randomTables')} />
            </Tabs>

            {/* Tab 0: Closed Question */}
            {tabValue === 0 && (
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        size="small"
                        label={t('soloPlay.oracle.askQuestion')}
                        value={closedQuestion}
                        onChange={(e) => setClosedQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskOracle()}
                        placeholder={t('soloPlay.oracle.questionPlaceholder')}
                        sx={textFieldStyle}
                    />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('soloPlay.oracle.probability')}
                            fullWidth={false}
                            sx={{ minWidth: 140 }}
                        >
                            <Select
                                value={probability}
                                onChange={(e) => setProbability(e.target.value as OracleProbability)}
                                label={t('soloPlay.oracle.probability')}
                                size="small"
                                sx={selectStyle}
                            >
                                {probabilityOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>

                        <Button
                            variant="outlined"
                            onClick={handleAskOracle}
                            disabled={!closedQuestion.trim()}
                            size="small"
                            startIcon={<Casino />}
                            sx={buttonStyle}
                        >
                            {t('soloPlay.oracle.roll')} (d100)
                        </Button>
                    </Stack>
                </Stack>
            )}

            {/* Tab 1: Open Question */}
            {tabValue === 1 && (
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        size="small"
                        label={t('soloPlay.oracle.askOpenQuestion')}
                        value={openQuestion}
                        onChange={(e) => setOpenQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskOpenQuestion()}
                        placeholder={t('soloPlay.oracle.openQuestionPlaceholder')}
                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.pink.default)}
                    />

                    <Button
                        variant="outlined"
                        onClick={handleAskOpenQuestion}
                        disabled={!openQuestion.trim()}
                        size="small"
                        startIcon={<Casino />}
                        sx={pinkButtonStyle}
                    >
                        {t('soloPlay.oracle.generate')} (Verb + Noun + Adjective)
                    </Button>
                </Stack>
            )}

            {/* Tab 2: Random Tables */}
            {tabValue === 2 && <RandomTablesTool hideResults />}

            {/* Unified History - always visible */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} mt={2}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                        fontFamily: '"Lexend", sans-serif',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                    }}
                >
                    {t('soloPlay.oracle.history')} ({totalResults})
                </Typography>
                {totalResults > 0 && (
                    <Tooltip disableInteractive title={t('common.clearAll')}>
                        <IconButton
                            size="small"
                            onClick={handleClearAll}
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

            <Stack spacing={0}>
                {unifiedHistory.length === 0 ? (
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.grays.gray600,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            fontFamily: '"Lexend", sans-serif',
                        }}
                    >
                        {t('soloPlay.oracle.noHistory')}
                    </Typography>
                ) : (
                    <>
                        {unifiedHistory.map((item, idx) => {
                            const renderCard = () => {
                                switch (item.kind) {
                                    case 'oracle':
                                        return renderOracleResult(item.data)
                                    case 'openQuestion':
                                        return renderOpenQuestionResult(item.data)
                                    case 'randomTable':
                                        return renderRandomTableResult(item.data)
                                    case 'note':
                                        return renderHistoryNote(item.data)
                                }
                            }
                            return (
                                <Box key={item.id}>
                                    <NoteInsertZone index={idx} />
                                    {renderCard()}
                                </Box>
                            )
                        })}
                        <NoteInsertZone index={unifiedHistory.length} />
                    </>
                )}
            </Stack>

            {/* Clear All Confirmation Dialog */}
            <Dialog
                open={clearAllDialogOpen}
                onClose={() => setClearAllDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.red.default}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${colors.neons.red.default}40`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.red.default,
                        borderBottom: `1px solid ${colors.neons.red.default}40`,
                        fontSize: '1rem',
                    }}
                >
                    {t('common.clearAll')}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, mt: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: readerMode ? colors.grays.gray200 : colors.grays.gray700,
                            fontFamily: '"Lexend", sans-serif',
                        }}
                    >
                        {t('soloPlay.oracle.clearAllWarning', {
                            count: totalResults,
                            defaultValue: `This will permanently delete all ${totalResults} results from the history. This action cannot be undone.`,
                        })}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.red.default}40` }}>
                    <Button
                        onClick={() => setClearAllDialogOpen(false)}
                        sx={{
                            color: colors.grays.gray600,
                            '&:hover': { color: colors.grays.gray000 },
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirmClearAll}
                        variant="outlined"
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.red.default)}
                    >
                        {t('common.clearAll')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default OracleTool
