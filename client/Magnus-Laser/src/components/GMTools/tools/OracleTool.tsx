import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import {
    Box,
    Button,
    Chip,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CyberpunkFormControl from '../../../components/CyberpunkFormControl'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type {
    OracleProbability,
    OracleResult,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { rollOpenQuestion, rollOracle } from '../../../utils/generators/soloPlayUtils'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkSelectStyle,
    getCyberpunkButtonStyle,
    getCyberpunkTabsStyle,
    getCyberpunkPaperStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const OracleTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [tabValue, setTabValue] = useState(0)

    // Persisted state
    const {
        oracleHistory,
        openQuestionHistory,
        addOracleResult,
        addOpenQuestionResult,
        clearOracleHistory,
        clearOpenQuestionHistory,
    } = useGMToolsDataStore()

    // Local state for inputs
    const [closedQuestion, setClosedQuestion] = useState('')
    const [probability, setProbability] = useState<OracleProbability>('FIFTY_FIFTY')
    const [openQuestion, setOpenQuestion] = useState('')

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

    // Styles
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)
    const selectStyle = getCyberpunkSelectStyle(readerMode, colors.neons.cyan.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.cyan.default)
    const pinkButtonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.pink.default)
    const tabsStyle = getCyberpunkTabsStyle(readerMode, colors.neons.cyan.default)
    const paperStyle = getCyberpunkPaperStyle(readerMode, colors.neons.cyan.default)
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.cyan.default)

    return (
        <Box>
            <Typography variant="h6" sx={titleStyle}>
                {t('gmTools.oracle')}
            </Typography>

            <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                sx={{ ...tabsStyle, mb: 2 }}
                variant="fullWidth"
            >
                <Tab label={t('soloPlay.oracle.closedQuestion')} />
                <Tab label={t('soloPlay.oracle.openQuestion')} />
            </Tabs>

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

                    {/* Probability ranges info */}
                    <Paper sx={{ ...paperStyle, p: 1.5, opacity: 0.8 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                fontFamily: '"Lexend", sans-serif',
                                display: 'block',
                                textAlign: 'center',
                            }}
                        >
                            {t('soloPlay.oracle.rangesInfo')}
                        </Typography>
                    </Paper>

                    <Box>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                    fontFamily: '"Lexend", sans-serif',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {t('soloPlay.oracle.history')} ({oracleHistory.length})
                            </Typography>
                            {oracleHistory.length > 0 && (
                                <DeleteOutline
                                    fontSize="small"
                                    sx={{
                                        color: colors.neons.red.default,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            filter: `drop-shadow(0 0 5px ${colors.neons.red.default})`,
                                        },
                                    }}
                                    onClick={clearOracleHistory}
                                />
                            )}
                        </Stack>
                        <Stack spacing={1}>
                            {oracleHistory.slice(0, 20).map((result) => (
                                <Paper key={result.id} sx={{ ...paperStyle, p: 1.5 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                                    display: 'block',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                "{result.question}"
                                            </Typography>
                                            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5} flexWrap="wrap">
                                                <Chip
                                                    label={t(`soloPlay.oracle.answers.${result.answer}`)}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: readerMode
                                                            ? getAnswerColor(result.answer)
                                                            : `${getAnswerColor(result.answer)}30`,
                                                        color: readerMode ? '#fff' : getAnswerColor(result.answer),
                                                        border: readerMode ? 'none' : `1px solid ${getAnswerColor(result.answer)}`,
                                                        height: 22,
                                                        fontSize: '0.7rem',
                                                        fontFamily: '"Lexend", sans-serif',
                                                        fontWeight: 'bold',
                                                        letterSpacing: '0.5px',
                                                        boxShadow: readerMode ? 'none' : `0 0 8px ${getAnswerColor(result.answer)}40`,
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
                                        </Box>
                                        <DeleteOutline
                                            fontSize="small"
                                            sx={{
                                                color: colors.neons.red.default,
                                                cursor: 'pointer',
                                                opacity: 0.6,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    opacity: 1,
                                                    filter: `drop-shadow(0 0 5px ${colors.neons.red.default})`,
                                                },
                                            }}
                                            onClick={() => useGMToolsDataStore.getState().deleteOracleResult(result.id)}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            )}

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

                    <Box>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                    fontFamily: '"Lexend", sans-serif',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {t('soloPlay.oracle.history')} ({openQuestionHistory.length})
                            </Typography>
                            {openQuestionHistory.length > 0 && (
                                <DeleteOutline
                                    fontSize="small"
                                    sx={{
                                        color: colors.neons.red.default,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            filter: `drop-shadow(0 0 5px ${colors.neons.red.default})`,
                                        },
                                    }}
                                    onClick={clearOpenQuestionHistory}
                                />
                            )}
                        </Stack>
                        <Stack spacing={1}>
                            {openQuestionHistory.slice(0, 20).map((result) => (
                                <Paper
                                    key={result.id}
                                    sx={{
                                        ...getCyberpunkPaperStyle(readerMode, colors.neons.pink.default),
                                        p: 1.5,
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                                    display: 'block',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                "{result.question}"
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
                                                        backgroundColor: readerMode
                                                            ? colors.neons.blue.default
                                                            : `${colors.neons.blue.default}30`,
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
                                        </Box>
                                        <DeleteOutline
                                            fontSize="small"
                                            sx={{
                                                color: colors.neons.red.default,
                                                cursor: 'pointer',
                                                opacity: 0.6,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    opacity: 1,
                                                    filter: `drop-shadow(0 0 5px ${colors.neons.red.default})`,
                                                },
                                            }}
                                            onClick={() => useGMToolsDataStore.getState().deleteOpenQuestionResult(result.id)}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            )}
        </Box>
    )
}

export default OracleTool
