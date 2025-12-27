import AutoAwesome from '@mui/icons-material/AutoAwesome'
import CheckCircle from '@mui/icons-material/CheckCircle'
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked'
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { BeatChartEntry, BeatType } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { generateBeatDescription } from '../../../utils/generators/soloPlayUtils'

const BeatChartPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const beatTypes: BeatType[] = [
        'HOOK',
        'DEVELOPMENT_1',
        'DEVELOPMENT_2',
        'DEVELOPMENT_3',
        'DEVELOPMENT_4',
        'DEVELOPMENT_5',
        'DEVELOPMENT_6',
        'CLIMAX',
        'RESOLUTION',
    ]

    const [beats, setBeats] = useState<BeatChartEntry[]>(
        beatTypes.map((beatType) => ({
            id: uuidv4(),
            beatType,
            description: '',
            completed: false,
        }))
    )

    const handleToggleComplete = (beatId: string) => {
        setBeats((prev) =>
            prev.map((beat) =>
                beat.id === beatId ? { ...beat, completed: !beat.completed } : beat
            )
        )
    }

    const handleUpdateDescription = (beatId: string, description: string) => {
        setBeats((prev) =>
            prev.map((beat) =>
                beat.id === beatId ? { ...beat, description } : beat
            )
        )
    }

    const handleUpdateOutcome = (beatId: string, outcome: string) => {
        setBeats((prev) =>
            prev.map((beat) =>
                beat.id === beatId ? { ...beat, outcome } : beat
            )
        )
    }

    const handleGenerateBeat = (beatId: string, beatType: BeatType) => {
        const description = generateBeatDescription(beatType)
        handleUpdateDescription(beatId, description)
    }

    const handleClearAll = () => {
        setBeats(
            beatTypes.map((beatType) => ({
                id: uuidv4(),
                beatType,
                description: '',
                completed: false,
            }))
        )
    }

    const getBeatColor = (beatType: BeatType): string => {
        switch (beatType) {
            case 'HOOK':
                return colors.neons.cyan.default
            case 'CLIMAX':
                return colors.neons.red.default
            case 'RESOLUTION':
                return colors.neons.green.default
            default:
                return colors.neons.yellow.default
        }
    }

    const getBeatLabel = (beatType: BeatType): string => {
        switch (beatType) {
            case 'HOOK':
                return t('soloPlay.beatChart.hook')
            case 'CLIMAX':
                return t('soloPlay.beatChart.climax')
            case 'RESOLUTION':
                return t('soloPlay.beatChart.resolution')
            default: {
                const num = beatType.split('_')[1]
                return `${t('soloPlay.beatChart.development')} ${num}`
            }
        }
    }

    const completedCount = beats.filter((b) => b.completed).length
    const progressPercentage = (completedCount / beats.length) * 100

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        }}
                    >
                        {t('soloPlay.beatChart.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.grays.gray600 }}>
                        {t('soloPlay.beatChart.progress')}: {completedCount}/{beats.length} (
                        {Math.round(progressPercentage)}%)
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    onClick={handleClearAll}
                    sx={{
                        borderColor: colors.neons.red.default,
                        color: colors.neons.red.default,
                    }}
                >
                    {t('soloPlay.beatChart.clearAll')}
                </Button>
            </Stack>

            {/* Progress Bar */}
            <Box
                sx={{
                    width: '100%',
                    height: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 4,
                    mb: 3,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: `${progressPercentage}%`,
                        height: '100%',
                        backgroundColor: colors.neons.cyan.default,
                        transition: 'width 0.3s ease',
                    }}
                />
            </Box>

            <Grid container spacing={2}>
                {beats.map((beat) => (
                    <Grid key={beat.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            sx={{
                                backgroundColor: readerMode
                                    ? beat.completed
                                        ? 'rgba(0, 255, 139, 0.1)'
                                        : 'rgba(255, 255, 255, 0.9)'
                                    : beat.completed
                                      ? 'rgba(0, 255, 139, 0.1)'
                                      : 'rgba(10, 15, 25, 0.95)',
                                border: `1px solid ${getBeatColor(beat.beatType)}40`,
                                opacity: beat.completed ? 0.8 : 1,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                color: getBeatColor(beat.beatType),
                                                fontWeight: 'bold',
                                                textDecoration: beat.completed
                                                    ? 'line-through'
                                                    : 'none',
                                            }}
                                        >
                                            {getBeatLabel(beat.beatType)}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleGenerateBeat(beat.id, beat.beatType)
                                                }
                                                sx={{ color: colors.neons.purple.default }}
                                            >
                                                <AutoAwesome fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleComplete(beat.id)}
                                                sx={{
                                                    color: beat.completed
                                                        ? colors.neons.green.default
                                                        : colors.grays.gray600,
                                                }}
                                            >
                                                {beat.completed ? (
                                                    <CheckCircle />
                                                ) : (
                                                    <RadioButtonUnchecked />
                                                )}
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder={t('soloPlay.beatChart.descriptionPlaceholder')}
                                        value={beat.description}
                                        onChange={(e) =>
                                            handleUpdateDescription(beat.id, e.target.value)
                                        }
                                        size="small"
                                        InputProps={{
                                            sx: {
                                                fontSize: '0.875rem',
                                            },
                                        }}
                                    />

                                    {beat.completed && (
                                        <TextField
                                            fullWidth
                                            placeholder={t('soloPlay.beatChart.outcomePlaceholder')}
                                            value={beat.outcome || ''}
                                            onChange={(e) =>
                                                handleUpdateOutcome(beat.id, e.target.value)
                                            }
                                            size="small"
                                            InputProps={{
                                                sx: {
                                                    fontSize: '0.875rem',
                                                    backgroundColor: 'rgba(0, 255, 139, 0.1)',
                                                },
                                            }}
                                        />
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )
}

export default BeatChartPanel

