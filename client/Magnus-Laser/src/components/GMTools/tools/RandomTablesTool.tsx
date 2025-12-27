import Casino from '@mui/icons-material/Casino'
import ContentCopy from '@mui/icons-material/ContentCopy'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import Refresh from '@mui/icons-material/Refresh'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
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
import colors from '../../../utils/colors'
import { actionFocusTable, getRandomFromArray } from '../../../utils/generators/soloPlayTables'
import {
    generateQuickClue,
    generateQuickComplication,
    generateQuickEvent,
    generateQuickLocation,
    generateQuickMood,
    generateQuickMotivation,
    generateQuickNPC,
    generateQuickRumor,
    generateQuickTwist,
} from '../../../utils/generators/soloPlayUtils'
import { useGMToolsDataStore, type RandomTableResult } from '../GMToolsDataStore'
import {
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkTextFieldStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const generators = [
    { key: 'npc', color: colors.neons.cyan.default, generator: generateQuickNPC },
    { key: 'location', color: colors.neons.blue.default, generator: generateQuickLocation },
    { key: 'event', color: colors.neons.green.default, generator: generateQuickEvent },
    { key: 'complication', color: colors.neons.yellow.default, generator: generateQuickComplication },
    { key: 'rumor', color: colors.neons.pink.default, generator: generateQuickRumor },
    { key: 'clue', color: colors.neons.cyan.default, generator: generateQuickClue },
    { key: 'twist', color: colors.neons.red.default, generator: generateQuickTwist },
    { key: 'action', color: colors.neons.orange.default, generator: () => getRandomFromArray(actionFocusTable) },
    { key: 'motivation', color: colors.neons.purple.default, generator: generateQuickMotivation },
    { key: 'mood', color: colors.neons.green.default, generator: generateQuickMood },
]

// Helper to capitalize first letter of a string
const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

const RandomTablesTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Persisted state
    const {
        randomTableResults,
        addRandomTableResult,
        updateRandomTableResult,
        deleteRandomTableResult,
        clearRandomTableResults,
    } = useGMToolsDataStore()

    // Edit dialog state
    const [editingResult, setEditingResult] = useState<RandomTableResult | null>(null)
    const [editContent, setEditContent] = useState('')

    // Styles
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.green.default)
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)

    const handleGenerate = (type: string, generator: () => unknown) => {
        const rawResult = generator()
        let content: string

        if (typeof rawResult === 'string') {
            content = rawResult
        } else if (typeof rawResult === 'object' && rawResult !== null) {
            // Format as multiline with capitalized keys
            content = Object.entries(rawResult)
                .map(([key, value]) => `${capitalize(key)}: ${value}`)
                .join('\n')
        } else {
            content = String(rawResult)
        }

        const newResult: RandomTableResult = {
            id: uuidv4(),
            type,
            content,
            timestamp: Date.now(),
        }
        addRandomTableResult(newResult)
    }

    const handleReroll = (result: RandomTableResult) => {
        const gen = generators.find((g) => g.key === result.type)
        if (!gen) return

        const rawResult = gen.generator()
        let content: string

        if (typeof rawResult === 'string') {
            content = rawResult
        } else if (typeof rawResult === 'object' && rawResult !== null) {
            content = Object.entries(rawResult)
                .map(([key, value]) => `${capitalize(key)}: ${value}`)
                .join('\n')
        } else {
            content = String(rawResult)
        }

        updateRandomTableResult(result.id, { content })
    }

    const handleOpenEdit = (result: RandomTableResult) => {
        setEditingResult(result)
        setEditContent(result.content)
    }

    const handleSaveEdit = () => {
        if (!editingResult) return
        updateRandomTableResult(editingResult.id, { content: editContent })
        setEditingResult(null)
        setEditContent('')
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
    }

    return (
        <Box>
            <Typography variant="h6" sx={titleStyle}>
                {t('gmTools.randomTables')}
            </Typography>

            {/* Generator Buttons */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {generators.map((gen) => (
                    <Grid size={{ xs: 6 }} key={gen.key}>
                        <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            startIcon={<Casino />}
                            onClick={() => handleGenerate(gen.key, gen.generator)}
                            sx={{
                                ...getCyberpunkButtonStyle(readerMode, gen.color),
                                textTransform: 'uppercase',
                                justifyContent: 'flex-start',
                                fontSize: '0.7rem',
                            }}
                        >
                            {t(`soloPlay.tables.${gen.key}`)}
                        </Button>
                    </Grid>
                ))}
            </Grid>

            {/* Results */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                        fontFamily: '"Lexend", sans-serif',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                    }}
                >
                    {t('soloPlay.tables.results')} ({randomTableResults.length})
                </Typography>
                {randomTableResults.length > 0 && (
                    <Tooltip title={t('common.clearAll')}>
                        <IconButton
                            size="small"
                            onClick={clearRandomTableResults}
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

            <Box>
                {randomTableResults.length === 0 ? (
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.grays.gray600,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            fontFamily: '"Lexend", sans-serif',
                        }}
                    >
                        {t('soloPlay.tables.noResults')}
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {randomTableResults.map((result) => {
                            const gen = generators.find((g) => g.key === result.type)
                            const resultColor = gen?.color || colors.grays.gray600
                            const isMultiline = result.content.includes('\n')

                            return (
                                <Paper
                                    key={result.id}
                                    sx={{
                                        ...getCyberpunkPaperStyle(readerMode, resultColor),
                                        p: 1.5,
                                    }}
                                >
                                    {/* Header with type and actions */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: resultColor,
                                                fontFamily: '"Orbitron", sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '0.65rem',
                                                letterSpacing: '2px',
                                                textTransform: 'uppercase',
                                                textShadow: readerMode ? 'none' : `0 0 5px ${resultColor}60`,
                                            }}
                                        >
                                            {t(`soloPlay.tables.${result.type}`)}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title={t('soloPlay.tables.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReroll(result)}
                                                    sx={{
                                                        color: resultColor,
                                                        border: `1px solid ${resultColor}40`,
                                                        borderRadius: 0,
                                                        padding: '2px',
                                                        '&:hover': {
                                                            backgroundColor: `${resultColor}20`,
                                                            boxShadow: `0 0 10px ${resultColor}40`,
                                                        },
                                                    }}
                                                >
                                                    <Refresh sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenEdit(result)}
                                                    sx={{
                                                        color: colors.neons.purple.default,
                                                        border: `1px solid ${colors.neons.purple.default}40`,
                                                        borderRadius: 0,
                                                        padding: '2px',
                                                        '&:hover': {
                                                            backgroundColor: `${colors.neons.purple.default}20`,
                                                            boxShadow: `0 0 10px ${colors.neons.purple.default}40`,
                                                        },
                                                    }}
                                                >
                                                    <Edit sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.copy')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleCopy(result.content)}
                                                    sx={{
                                                        color: colors.neons.cyan.default,
                                                        border: `1px solid ${colors.neons.cyan.default}40`,
                                                        borderRadius: 0,
                                                        padding: '2px',
                                                        '&:hover': {
                                                            backgroundColor: `${colors.neons.cyan.default}20`,
                                                            boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                                        },
                                                    }}
                                                >
                                                    <ContentCopy sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.delete')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => deleteRandomTableResult(result.id)}
                                                    sx={{
                                                        color: colors.neons.red.default,
                                                        border: `1px solid ${colors.neons.red.default}40`,
                                                        borderRadius: 0,
                                                        padding: '2px',
                                                        '&:hover': {
                                                            backgroundColor: `${colors.neons.red.default}20`,
                                                            boxShadow: `0 0 10px ${colors.neons.red.default}40`,
                                                        },
                                                    }}
                                                >
                                                    <DeleteOutline sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>

                                    {/* Content - multiline format */}
                                    {isMultiline ? (
                                        <Stack spacing={0.5}>
                                            {result.content.split('\n').map((line, idx) => {
                                                const colonIndex = line.indexOf(':')
                                                if (colonIndex > 0) {
                                                    const label = line.substring(0, colonIndex)
                                                    const value = line.substring(colonIndex + 1).trim()
                                                    return (
                                                        <Box key={idx}>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                sx={{
                                                                    color: resultColor,
                                                                    fontFamily: '"Lexend", sans-serif',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                            >
                                                                {label}:{' '}
                                                            </Typography>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                sx={{
                                                                    color: readerMode
                                                                        ? colors.grays.gray000
                                                                        : colors.grays.gray800,
                                                                    fontFamily: '"Lexend", sans-serif',
                                                                    fontSize: '0.85rem',
                                                                }}
                                                            >
                                                                {value}
                                                            </Typography>
                                                        </Box>
                                                    )
                                                }
                                                return (
                                                    <Typography
                                                        key={idx}
                                                        variant="body2"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray000
                                                                : colors.grays.gray800,
                                                            fontFamily: '"Lexend", sans-serif',
                                                        }}
                                                    >
                                                        {line}
                                                    </Typography>
                                                )
                                            })}
                                        </Stack>
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: readerMode ? colors.grays.gray000 : colors.grays.gray800,
                                                fontFamily: '"Lexend", sans-serif',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {result.content}
                                        </Typography>
                                    )}
                                </Paper>
                            )
                        })}
                    </Stack>
                )}
            </Box>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingResult}
                onClose={() => setEditingResult(null)}
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
                    {t('soloPlay.tables.editResult')}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, mt: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={textFieldStyle}
                        placeholder={t('soloPlay.tables.editPlaceholder')}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.green.default}40` }}>
                    <Button
                        onClick={() => setEditingResult(null)}
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
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.green.default)}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default RandomTablesTool
