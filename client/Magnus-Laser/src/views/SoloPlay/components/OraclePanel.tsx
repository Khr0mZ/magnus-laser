import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import HelpOutline from '@mui/icons-material/HelpOutline'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    Grid,
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
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type {
    OpenQuestionCategory,
    OpenQuestionResult,
    OracleProbability,
    OracleResult,
} from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { rollOpenQuestion, rollOracle } from '../../../utils/generators/soloPlayUtils'

const OraclePanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Closed Question (Yes/No) Oracle
    const [closedQuestion, setClosedQuestion] = useState('')
    const [probability, setProbability] = useState<OracleProbability>('FIFTY_FIFTY')
    const [oracleHistory, setOracleHistory] = useState<OracleResult[]>([])

    // Open Question Oracle
    const [openQuestion, setOpenQuestion] = useState('')
    const [questionCategory, setQuestionCategory] = useState<OpenQuestionCategory>('ACTION')
    const [openQuestionHistory, setOpenQuestionHistory] = useState<OpenQuestionResult[]>([])

    const handleAskOracle = () => {
        if (!closedQuestion.trim()) return
        const result = rollOracle(closedQuestion, probability)
        setOracleHistory((prev) => [result, ...prev])
        setClosedQuestion('')
    }

    const handleAskOpenQuestion = () => {
        if (!openQuestion.trim()) return
        const result = rollOpenQuestion(openQuestion, questionCategory)
        setOpenQuestionHistory((prev) => [result, ...prev])
        setOpenQuestion('')
    }

    const handleClearOracleHistory = () => {
        setOracleHistory([])
    }

    const handleClearOpenHistory = () => {
        setOpenQuestionHistory([])
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

    const categoryOptions: { value: OpenQuestionCategory; label: string }[] = [
        { value: 'ACTION', label: t('soloPlay.oracle.categories.action') },
        { value: 'DESCRIPTION', label: t('soloPlay.oracle.categories.description') },
        { value: 'COMPLICATION', label: t('soloPlay.oracle.categories.complication') },
        { value: 'NPC_ACTION', label: t('soloPlay.oracle.categories.npcAction') },
        { value: 'NPC_MOOD', label: t('soloPlay.oracle.categories.npcMood') },
        { value: 'LOCATION', label: t('soloPlay.oracle.categories.location') },
        { value: 'OBJECT', label: t('soloPlay.oracle.categories.object') },
        { value: 'EVENT', label: t('soloPlay.oracle.categories.event') },
    ]

    return (
        <Grid container spacing={3}>
            {/* Closed Question Oracle */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Card
                    sx={{
                        backgroundColor: readerMode
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(10, 15, 25, 0.95)',
                        border: `1px solid ${colors.neons.cyan.default}40`,
                    }}
                >
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <Casino sx={{ color: colors.neons.cyan.default }} />
                            <Typography
                                variant="h5"
                                sx={{
                                    color: readerMode
                                        ? colors.grays.gray000
                                        : colors.neons.cyan.default,
                                }}
                            >
                                {t('soloPlay.oracle.closedQuestion')}
                            </Typography>
                            <Tooltip title={t('soloPlay.oracle.closedQuestionHelp')}>
                                <HelpOutline
                                    sx={{
                                        fontSize: 18,
                                        color: colors.grays.gray600,
                                        cursor: 'help',
                                    }}
                                />
                            </Tooltip>
                        </Stack>

                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.oracle.askQuestion')}
                                value={closedQuestion}
                                onChange={(e) => setClosedQuestion(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAskOracle()}
                                placeholder={t('soloPlay.oracle.questionPlaceholder')}
                                InputProps={{
                                    sx: {
                                        color: readerMode
                                            ? colors.grays.gray000
                                            : colors.grays.gray900,
                                    },
                                }}
                            />

                            <Stack direction="row" spacing={2} alignItems="center">
                                <FormControl sx={{ minWidth: 150 }}>
                                    <InputLabel>{t('soloPlay.oracle.probability')}</InputLabel>
                                    <Select
                                        value={probability}
                                        onChange={(e) =>
                                            setProbability(e.target.value as OracleProbability)
                                        }
                                        label={t('soloPlay.oracle.probability')}
                                    >
                                        {probabilityOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="contained"
                                    onClick={handleAskOracle}
                                    disabled={!closedQuestion.trim()}
                                    startIcon={<Casino />}
                                    sx={{
                                        backgroundColor: colors.neons.cyan.default,
                                        '&:hover': {
                                            backgroundColor: colors.neons.cyan.dark,
                                        },
                                    }}
                                >
                                    {t('soloPlay.oracle.roll')} (d100)
                                </Button>
                            </Stack>

                            {/* Ranges info */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: colors.grays.gray600,
                                    textAlign: 'center',
                                }}
                            >
                                {t('soloPlay.oracle.rangesInfo')}
                            </Typography>
                        </Stack>

                        {/* Oracle History */}
                        <Box mt={3}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={1}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: readerMode
                                            ? colors.grays.gray000
                                            : colors.neons.green.default,
                                    }}
                                >
                                    {t('soloPlay.oracle.history')}
                                </Typography>
                                {oracleHistory.length > 0 && (
                                    <IconButton
                                        onClick={handleClearOracleHistory}
                                        size="small"
                                        sx={{ color: colors.neons.red.default }}
                                    >
                                        <DeleteOutline />
                                    </IconButton>
                                )}
                            </Stack>

                            <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {oracleHistory.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}
                                    >
                                        {t('soloPlay.oracle.noHistory')}
                                    </Typography>
                                ) : (
                                    oracleHistory.map((result) => (
                                        <Paper
                                            key={result.id}
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.05)'
                                                    : 'rgba(0, 0, 0, 0.3)',
                                                border: `1px solid ${getAnswerColor(result.answer)}40`,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.grays.gray800,
                                                    fontStyle: 'italic',
                                                    mb: 0.5,
                                                }}
                                            >
                                                "{result.question}"
                                            </Typography>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                                flexWrap="wrap"
                                            >
                                                <Chip
                                                    label={t(
                                                        `soloPlay.oracle.answers.${result.answer}`
                                                    )}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getAnswerColor(
                                                            result.answer
                                                        ),
                                                        color: colors.grays.gray000,
                                                        fontWeight: 600,
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: colors.grays.gray600 }}
                                                >
                                                    d100={result.roll} ({t(`soloPlay.oracle.probabilities.${result.probability.toLowerCase()}`)})
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    ))
                                )}
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Open Question Oracle */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Card
                    sx={{
                        backgroundColor: readerMode
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(10, 15, 25, 0.95)',
                        border: `1px solid ${colors.neons.pink.default}40`,
                    }}
                >
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <HelpOutline sx={{ color: colors.neons.pink.default }} />
                            <Typography
                                variant="h5"
                                sx={{
                                    color: readerMode
                                        ? colors.grays.gray000
                                        : colors.neons.pink.default,
                                }}
                            >
                                {t('soloPlay.oracle.openQuestion')}
                            </Typography>
                            <Tooltip title={t('soloPlay.oracle.openQuestionHelp')}>
                                <HelpOutline
                                    sx={{
                                        fontSize: 18,
                                        color: colors.grays.gray600,
                                        cursor: 'help',
                                    }}
                                />
                            </Tooltip>
                        </Stack>

                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.oracle.askOpenQuestion')}
                                value={openQuestion}
                                onChange={(e) => setOpenQuestion(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAskOpenQuestion()}
                                placeholder={t('soloPlay.oracle.openQuestionPlaceholder')}
                                InputProps={{
                                    sx: {
                                        color: readerMode
                                            ? colors.grays.gray000
                                            : colors.grays.gray900,
                                    },
                                }}
                            />

                            <Stack direction="row" spacing={2} alignItems="center">
                                <FormControl sx={{ minWidth: 180 }}>
                                    <InputLabel>{t('soloPlay.oracle.category')}</InputLabel>
                                    <Select
                                        value={questionCategory}
                                        onChange={(e) =>
                                            setQuestionCategory(
                                                e.target.value as OpenQuestionCategory
                                            )
                                        }
                                        label={t('soloPlay.oracle.category')}
                                    >
                                        {categoryOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="contained"
                                    onClick={handleAskOpenQuestion}
                                    disabled={!openQuestion.trim()}
                                    startIcon={<Casino />}
                                    sx={{
                                        backgroundColor: colors.neons.pink.default,
                                        '&:hover': {
                                            backgroundColor: colors.neons.pink.dark,
                                        },
                                    }}
                                >
                                    {t('soloPlay.oracle.generate')}
                                </Button>
                            </Stack>
                        </Stack>

                        {/* Open Question History */}
                        <Box mt={3}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={1}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: readerMode
                                            ? colors.grays.gray000
                                            : colors.neons.green.default,
                                    }}
                                >
                                    {t('soloPlay.oracle.history')}
                                </Typography>
                                {openQuestionHistory.length > 0 && (
                                    <IconButton
                                        onClick={handleClearOpenHistory}
                                        size="small"
                                        sx={{ color: colors.neons.red.default }}
                                    >
                                        <DeleteOutline />
                                    </IconButton>
                                )}
                            </Stack>

                            <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {openQuestionHistory.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}
                                    >
                                        {t('soloPlay.oracle.noHistory')}
                                    </Typography>
                                ) : (
                                    openQuestionHistory.map((result) => (
                                        <Paper
                                            key={result.id}
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.05)'
                                                    : 'rgba(0, 0, 0, 0.3)',
                                                border: `1px solid ${colors.neons.pink.default}40`,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.grays.gray800,
                                                    fontStyle: 'italic',
                                                    mb: 0.5,
                                                }}
                                            >
                                                "{result.question}"
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Chip
                                                    label={result.focus}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            colors.neons.green.default,
                                                        color: colors.grays.gray000,
                                                    }}
                                                />
                                                <Chip
                                                    label={result.detail}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: colors.neons.blue.default,
                                                        color: colors.grays.gray000,
                                                    }}
                                                />
                                            </Stack>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray200
                                                        : colors.grays.gray700,
                                                    mt: 1,
                                                }}
                                            >
                                                <strong>{result.focus}</strong> + {result.detail}
                                            </Typography>
                                        </Paper>
                                    ))
                                )}
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default OraclePanel
