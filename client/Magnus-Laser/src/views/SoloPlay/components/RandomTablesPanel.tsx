import Casino from '@mui/icons-material/Casino'
import ContentCopy from '@mui/icons-material/ContentCopy'
import Person from '@mui/icons-material/Person'
import Place from '@mui/icons-material/Place'
import Warning from '@mui/icons-material/Warning'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import {
    generateClue,
    generateComplication,
    generateEvent,
    generateQuickLocation,
    generateQuickNPC,
    generateRumor,
} from '../../../utils/generators/soloPlayUtils'
import {
    actionFocusTable,
    detailFocusTable,
    getRandomFromArray,
    npcMoodTable,
    npcMotivationTable,
    twistTable,
} from '../../../utils/generators/soloPlayTables'

interface GeneratedResult {
    id: string
    type: string
    content: string | Record<string, string>
    timestamp: number
}

const RandomTablesPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const [results, setResults] = useState<GeneratedResult[]>([])

    const addResult = (type: string, content: string | Record<string, string>) => {
        setResults((prev) => [
            {
                id: `${Date.now()}-${Math.random()}`,
                type,
                content,
                timestamp: Date.now(),
            },
            ...prev,
        ])
    }

    const handleGenerateNPC = () => {
        const npc = generateQuickNPC()
        addResult('NPC', npc)
    }

    const handleGenerateLocation = () => {
        const location = generateQuickLocation()
        addResult('LOCATION', location)
    }

    const handleGenerateEvent = () => {
        addResult('EVENT', generateEvent())
    }

    const handleGenerateComplication = () => {
        addResult('COMPLICATION', generateComplication())
    }

    const handleGenerateRumor = () => {
        addResult('RUMOR', generateRumor())
    }

    const handleGenerateClue = () => {
        addResult('CLUE', generateClue())
    }

    const handleGenerateTwist = () => {
        addResult('TWIST', getRandomFromArray(twistTable))
    }

    const handleGenerateAction = () => {
        const action = getRandomFromArray(actionFocusTable)
        const detail = getRandomFromArray(detailFocusTable)
        addResult('ACTION', `${action} + ${detail}`)
    }

    const handleGenerateMotivation = () => {
        addResult('MOTIVATION', getRandomFromArray(npcMotivationTable))
    }

    const handleGenerateMood = () => {
        addResult('MOOD', getRandomFromArray(npcMoodTable))
    }

    const handleClearResults = () => {
        setResults([])
    }

    const copyToClipboard = (content: string | Record<string, string>) => {
        const text =
            typeof content === 'string'
                ? content
                : Object.entries(content)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')
        navigator.clipboard.writeText(text)
    }

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'NPC':
                return colors.neons.cyan.default
            case 'LOCATION':
                return colors.neons.green.default
            case 'EVENT':
                return colors.neons.yellow.default
            case 'COMPLICATION':
                return colors.neons.red.default
            case 'RUMOR':
                return colors.neons.purple.default
            case 'CLUE':
                return colors.neons.blue.default
            case 'TWIST':
                return colors.neons.pink.default
            case 'ACTION':
                return colors.neons.orange.default
            case 'MOTIVATION':
                return colors.neons.cyan.light
            case 'MOOD':
                return colors.neons.green.light
            default:
                return colors.grays.gray600
        }
    }

    const generators = [
        {
            key: 'NPC',
            label: t('soloPlay.tables.generateNPC'),
            icon: <Person />,
            handler: handleGenerateNPC,
            color: colors.neons.cyan.default,
        },
        {
            key: 'LOCATION',
            label: t('soloPlay.tables.generateLocation'),
            icon: <Place />,
            handler: handleGenerateLocation,
            color: colors.neons.green.default,
        },
        {
            key: 'EVENT',
            label: t('soloPlay.tables.generateEvent'),
            icon: <Casino />,
            handler: handleGenerateEvent,
            color: colors.neons.yellow.default,
        },
        {
            key: 'COMPLICATION',
            label: t('soloPlay.tables.generateComplication'),
            icon: <Warning />,
            handler: handleGenerateComplication,
            color: colors.neons.red.default,
        },
        {
            key: 'RUMOR',
            label: t('soloPlay.tables.generateRumor'),
            icon: <Casino />,
            handler: handleGenerateRumor,
            color: colors.neons.purple.default,
        },
        {
            key: 'CLUE',
            label: t('soloPlay.tables.generateClue'),
            icon: <Casino />,
            handler: handleGenerateClue,
            color: colors.neons.blue.default,
        },
        {
            key: 'TWIST',
            label: t('soloPlay.tables.generateTwist'),
            icon: <Casino />,
            handler: handleGenerateTwist,
            color: colors.neons.pink.default,
        },
        {
            key: 'ACTION',
            label: t('soloPlay.tables.generateAction'),
            icon: <Casino />,
            handler: handleGenerateAction,
            color: colors.neons.orange.default,
        },
        {
            key: 'MOTIVATION',
            label: t('soloPlay.tables.generateMotivation'),
            icon: <Casino />,
            handler: handleGenerateMotivation,
            color: colors.neons.cyan.light,
        },
        {
            key: 'MOOD',
            label: t('soloPlay.tables.generateMood'),
            icon: <Casino />,
            handler: handleGenerateMood,
            color: colors.neons.green.light,
        },
    ]

    return (
        <Box>
            <Typography
                variant="h5"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    mb: 3,
                }}
            >
                {t('soloPlay.tables.title')}
            </Typography>

            <Grid container spacing={3}>
                {/* Generator Buttons */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card
                        sx={{
                            backgroundColor: readerMode
                                ? 'rgba(255, 255, 255, 0.9)'
                                : 'rgba(10, 15, 25, 0.95)',
                            border: `1px solid ${colors.neons.cyan.default}40`,
                        }}
                    >
                        <CardContent>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: readerMode
                                        ? colors.grays.gray000
                                        : colors.neons.cyan.default,
                                    mb: 2,
                                }}
                            >
                                {t('soloPlay.tables.generators')}
                            </Typography>
                            <Stack spacing={1}>
                                {generators.map((gen) => (
                                    <Button
                                        key={gen.key}
                                        variant="outlined"
                                        startIcon={gen.icon}
                                        onClick={gen.handler}
                                        fullWidth
                                        sx={{
                                            borderColor: gen.color,
                                            color: gen.color,
                                            justifyContent: 'flex-start',
                                            '&:hover': {
                                                borderColor: gen.color,
                                                backgroundColor: gen.color + '20',
                                            },
                                        }}
                                    >
                                        {gen.label}
                                    </Button>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card
                        sx={{
                            backgroundColor: readerMode
                                ? 'rgba(255, 255, 255, 0.9)'
                                : 'rgba(10, 15, 25, 0.95)',
                            border: `1px solid ${colors.neons.green.default}40`,
                        }}
                    >
                        <CardContent>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: readerMode
                                            ? colors.grays.gray000
                                            : colors.neons.green.default,
                                    }}
                                >
                                    {t('soloPlay.tables.results')} ({results.length})
                                </Typography>
                                {results.length > 0 && (
                                    <Button
                                        size="small"
                                        onClick={handleClearResults}
                                        sx={{ color: colors.neons.red.default }}
                                    >
                                        {t('soloPlay.tables.clearAll')}
                                    </Button>
                                )}
                            </Stack>

                            <Stack
                                spacing={1}
                                sx={{ maxHeight: 500, overflow: 'auto' }}
                            >
                                {results.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: colors.grays.gray600,
                                            fontStyle: 'italic',
                                            textAlign: 'center',
                                            py: 4,
                                        }}
                                    >
                                        {t('soloPlay.tables.noResults')}
                                    </Typography>
                                ) : (
                                    results.map((result) => (
                                        <Paper
                                            key={result.id}
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.05)'
                                                    : 'rgba(0, 0, 0, 0.3)',
                                                border: `1px solid ${getTypeColor(result.type)}30`,
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="flex-start"
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Chip
                                                        label={t(`soloPlay.tables.types.${result.type}`)}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getTypeColor(result.type),
                                                            color: colors.grays.gray000,
                                                            mb: 1,
                                                        }}
                                                    />
                                                    {typeof result.content === 'string' ? (
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                color: readerMode
                                                                    ? colors.grays.gray000
                                                                    : colors.grays.gray900,
                                                            }}
                                                        >
                                                            {result.content}
                                                        </Typography>
                                                    ) : (
                                                        <Box>
                                                            {Object.entries(result.content).map(
                                                                ([key, value]) => (
                                                                    <Typography
                                                                        key={key}
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: readerMode
                                                                                ? colors.grays.gray000
                                                                                : colors.grays.gray800,
                                                                        }}
                                                                    >
                                                                        <strong>
                                                                            {t(
                                                                                `soloPlay.tables.fields.${key}`
                                                                            )}
                                                                            :
                                                                        </strong>{' '}
                                                                        {value}
                                                                    </Typography>
                                                                )
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Tooltip title={t('soloPlay.tables.copy')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => copyToClipboard(result.content)}
                                                        sx={{ color: colors.grays.gray600 }}
                                                    >
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Paper>
                                    ))
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}

export default RandomTablesPanel

