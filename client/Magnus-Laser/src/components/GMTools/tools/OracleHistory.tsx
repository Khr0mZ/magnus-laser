import DeleteOutline from '@mui/icons-material/DeleteOutline'
import NoteAdd from '@mui/icons-material/NoteAdd'
import Refresh from '@mui/icons-material/Refresh'
import { Box, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { OpenQuestionResult, OracleResult } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    generateRandomEncounter,
    type EncounterTime,
    type EncounterZone,
} from '../../../utils/generators/soloPlayTablesExpanded'
import { rollOpenQuestion, rollOracle } from '../../../utils/generators/soloPlayUtils'
import Scrollbar from 'smooth-scrollbar'
import { WarningDialog } from '../../common/WarningDialog'
import { useGMToolsDataStore, type HistoryNote, type RandomTableResult } from '../GMToolsDataStore'
import { getCyberpunkPaperStyle, getCyberpunkTextFieldStyle, getSectionTitleStyle } from '../GMToolsStyles'
import { allGenerators, formatResult } from './randomTablesData'

type UnifiedHistoryItem =
    | { kind: 'oracle'; id: string; timestamp: number; data: OracleResult }
    | { kind: 'openQuestion'; id: string; timestamp: number; data: OpenQuestionResult }
    | { kind: 'randomTable'; id: string; timestamp: number; data: RandomTableResult }
    | { kind: 'note'; id: string; timestamp: number; data: HistoryNote }

const OracleHistory = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const {
        oracleHistory,
        openQuestionHistory,
        randomTableResults,
        historyNotes,
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
        selectedCampaign,
        clearHistoryByCampaign,
    } = useGMToolsDataStore()

    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)

    const encounterZone: EncounterZone = 'moderate'
    const encounterTime: EncounterTime = 'day'

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

    const handleConfirmClearAll = () => {
        if (selectedCampaign) {
            clearHistoryByCampaign(selectedCampaign)
        } else {
            clearOracleHistory()
            clearOpenQuestionHistory()
            clearRandomTableResults()
            clearHistoryNotes()
        }
        setClearAllDialogOpen(false)
    }

    const unifiedHistory = useMemo(() => {
        const filterByCampaign = <T extends { campaignId?: string }>(items: T[]): T[] => {
            if (selectedCampaign === null) return items
            return items.filter((item) => item.campaignId === selectedCampaign)
        }

        const items: UnifiedHistoryItem[] = [
            ...filterByCampaign(oracleHistory).map((r) => ({ kind: 'oracle' as const, id: r.id, timestamp: r.timestamp, data: r })),
            ...filterByCampaign(openQuestionHistory).map((r) => ({
                kind: 'openQuestion' as const,
                id: r.id,
                timestamp: r.timestamp,
                data: r,
            })),
            ...filterByCampaign(randomTableResults).map((r) => ({
                kind: 'randomTable' as const,
                id: r.id,
                timestamp: r.timestamp,
                data: r,
            })),
            ...filterByCampaign(historyNotes).map((n) => ({ kind: 'note' as const, id: n.id, timestamp: n.timestamp, data: n })),
        ]
        return items.sort((a, b) => a.timestamp - b.timestamp).slice(-50)
    }, [oracleHistory, openQuestionHistory, randomTableResults, historyNotes, selectedCampaign])

    const totalResults = unifiedHistory.length

    // Auto-scroll to bottom when new entries are added
    const containerRef = useRef<HTMLDivElement>(null)
    const prevTotalRef = useRef(totalResults)
    const lastInsertedIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (totalResults > prevTotalRef.current && containerRef.current) {
            const targetId = lastInsertedIdRef.current
            lastInsertedIdRef.current = null

            const scrollToTarget = () => {
                const scrollbarContainer = containerRef.current?.closest(
                    '.smooth-scrollbar-container'
                ) as HTMLElement
                if (!scrollbarContainer) return
                const scrollbarInstance = Scrollbar.get(scrollbarContainer)
                if (!scrollbarInstance) return

                if (targetId) {
                    const el = containerRef.current?.querySelector(`[data-history-id="${targetId}"]`)
                    if (el) {
                        scrollbarInstance.scrollIntoView(el as HTMLElement, { alignToTop: false })
                        return
                    }
                }
                scrollbarInstance.scrollTo(0, 999999, 300)
            }
            scrollToTarget()
            setTimeout(scrollToTarget, 50)
            setTimeout(scrollToTarget, 150)
        }
        prevTotalRef.current = totalResults
    }, [totalResults])

    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.cyan.default)
    const paperStyle = getCyberpunkPaperStyle(readerMode, colors.neons.cyan.default)

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

    // Insert a text note at a given timestamp
    const handleInsertNote = useCallback(
        (timestamp: number) => {
            const id = uuidv4()
            lastInsertedIdRef.current = id
            addHistoryNote({ id, timestamp, content: '', campaignId: selectedCampaign ?? undefined })
        },
        [addHistoryNote, selectedCampaign]
    )

    const getInsertTimestamp = useCallback(
        (index: number) => {
            if (unifiedHistory.length === 0) return Date.now()
            if (index === 0) return unifiedHistory[0].timestamp - 1
            if (index >= unifiedHistory.length) return unifiedHistory[unifiedHistory.length - 1].timestamp + 1
            return Math.floor((unifiedHistory[index - 1].timestamp + unifiedHistory[index].timestamp) / 2)
        },
        [unifiedHistory]
    )

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
                        borderBottom: hovered
                            ? `1px dashed ${colors.neons.yellow.default}40`
                            : '1px solid transparent',
                    }}
                >
                    {hovered && <NoteAdd sx={{ fontSize: 16, color: colors.neons.yellow.default }} />}
                </Box>
            </Tooltip>
        )
    }

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
        <Box ref={containerRef} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" sx={{ ...titleStyle, mb: 0 }}>
                    {t('soloPlay.oracle.history')} ({totalResults})
                </Typography>
                {totalResults > 0 && (
                    <Tooltip disableInteractive title={t('common.clearAll')}>
                        <IconButton
                            size="small"
                            onClick={() => setClearAllDialogOpen(true)}
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
                            mt: 2,
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
                                <Box key={item.id} data-history-id={item.id}>
                                    <NoteInsertZone index={idx} />
                                    {renderCard()}
                                </Box>
                            )
                        })}
                        <NoteInsertZone index={unifiedHistory.length} />
                    </>
                )}
            </Stack>

            <WarningDialog
                open={clearAllDialogOpen}
                onClose={() => setClearAllDialogOpen(false)}
                onConfirm={handleConfirmClearAll}
                title={t('common.clearAll')}
                message={
                    selectedCampaign
                        ? t('soloPlay.oracle.clearCampaignWarning', {
                              count: totalResults,
                              campaign: selectedCampaign,
                              defaultValue: `This will permanently delete all ${totalResults} results from campaign "${selectedCampaign}". This action cannot be undone.`,
                          })
                        : t('soloPlay.oracle.clearAllWarning', {
                              count: totalResults,
                              defaultValue: `This will permanently delete all ${totalResults} results from the history. This action cannot be undone.`,
                          })
                }
                confirmText={t('common.clearAll')}
                confirmColor="red"
            />
        </Box>
    )
}

export default OracleHistory
