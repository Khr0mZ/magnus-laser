import AutoAwesome from '@mui/icons-material/AutoAwesome'
import ContentCopy from '@mui/icons-material/ContentCopy'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Refresh from '@mui/icons-material/Refresh'
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
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { SoloMission } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    generateMissionFocus,
    generateMissionSummary,
    generateMissionTwist,
    generateRandomEmployer,
    generateRandomMission,
    generateRandomPayment,
} from '../../../utils/generators/soloPlayUtils'

const MissionBuilderPanel = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const [currentMission, setCurrentMission] = useState<SoloMission | null>(null)
    const [missionHistory, setMissionHistory] = useState<SoloMission[]>([])

    const handleGenerateMission = () => {
        const mission = generateRandomMission()
        setCurrentMission(mission)
    }

    const handleSaveMission = () => {
        if (currentMission) {
            setMissionHistory((prev) => [currentMission, ...prev])
        }
    }

    const handleDeleteMission = (missionId: string) => {
        setMissionHistory((prev) => prev.filter((m) => m.id !== missionId))
    }

    const handleRerollEmployer = () => {
        if (!currentMission) return
        setCurrentMission((prev) => {
            if (!prev) return prev
            return { ...prev, whoIsHiring: generateRandomEmployer() }
        })
    }

    const handleRerollPayment = () => {
        if (!currentMission) return
        setCurrentMission((prev) => {
            if (!prev) return prev
            return { ...prev, payment: generateRandomPayment() }
        })
    }

    const handleRerollSummary = () => {
        if (!currentMission) return
        setCurrentMission((prev) => {
            if (!prev) return prev
            return { ...prev, missionSummary: generateMissionSummary() }
        })
    }

    const handleRerollFocus = () => {
        if (!currentMission) return
        setCurrentMission((prev) => {
            if (!prev) return prev
            return { ...prev, focusAndSpecifics: generateMissionFocus() }
        })
    }

    const handleRerollTwist = () => {
        if (!currentMission) return
        setCurrentMission((prev) => {
            if (!prev) return prev
            return { ...prev, twist: generateMissionTwist() }
        })
    }

    const handleUpdateField = (field: keyof SoloMission, value: string) => {
        if (!currentMission) return
        setCurrentMission((prev) => {
            if (!prev) return prev
            return { ...prev, [field]: value }
        })
    }

    const getEmployerColor = (type: string): string => {
        switch (type) {
            case 'FIXER':
                return colors.neons.cyan.default
            case 'CORPO':
                return colors.neons.blue.default
            case 'GANG':
                return colors.neons.red.default
            case 'GOVERNMENT':
                return colors.neons.yellow.default
            case 'NOMAD':
                return colors.neons.orange.default
            default:
                return colors.neons.green.default
        }
    }

    const copyMissionToClipboard = (mission: SoloMission) => {
        const text = `
MISSION: ${mission.name}

WHO'S HIRING: ${mission.whoIsHiring.name} (${mission.whoIsHiring.type})

PAYMENT: ${mission.payment.description}

MISSION SUMMARY: ${mission.missionSummary}

FOCUS & SPECIFICS: ${mission.focusAndSpecifics}

${mission.twist ? `THE TWIST: ${mission.twist}` : ''}
        `.trim()
        navigator.clipboard.writeText(text)
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography
                    variant="h5"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    }}
                >
                    {t('soloPlay.mission.title')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={handleGenerateMission}
                    sx={{
                        backgroundColor: colors.neons.purple.default,
                        '&:hover': {
                            backgroundColor: colors.neons.purple.dark,
                        },
                    }}
                >
                    {t('soloPlay.mission.generateMission')}
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {/* Current Mission */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    {!currentMission ? (
                        <Paper
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                backgroundColor: readerMode
                                    ? 'rgba(255, 255, 255, 0.9)'
                                    : 'rgba(10, 15, 25, 0.95)',
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}
                            >
                                {t('soloPlay.mission.noMissionYet')}
                            </Typography>
                        </Paper>
                    ) : (
                        <Card
                            sx={{
                                backgroundColor: readerMode
                                    ? 'rgba(255, 255, 255, 0.9)'
                                    : 'rgba(10, 15, 25, 0.95)',
                                border: `1px solid ${colors.neons.purple.default}40`,
                            }}
                        >
                            <CardContent>
                                <Stack spacing={3}>
                                    {/* Mission Name */}
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.mission.name')}
                                        value={currentMission.name}
                                        onChange={(e) => handleUpdateField('name', e.target.value)}
                                        InputProps={{
                                            sx: {
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem',
                                            },
                                        }}
                                    />

                                    {/* Who's Hiring */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.neons.cyan.default,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t('soloPlay.mission.whoIsHiring')}
                                            </Typography>
                                            <Tooltip title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRerollEmployer}
                                                    sx={{ color: colors.neons.cyan.default }}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                label={currentMission.whoIsHiring.type}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getEmployerColor(
                                                        currentMission.whoIsHiring.type
                                                    ),
                                                    color: colors.grays.gray000,
                                                }}
                                            />
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.grays.gray900,
                                                }}
                                            >
                                                {currentMission.whoIsHiring.name}
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    {/* Payment */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.neons.green.default,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t('soloPlay.mission.payment')}
                                            </Typography>
                                            <Tooltip title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRerollPayment}
                                                    sx={{ color: colors.neons.green.default }}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: readerMode
                                                    ? colors.grays.gray000
                                                    : colors.grays.gray900,
                                            }}
                                        >
                                            {currentMission.payment.description}
                                        </Typography>
                                    </Box>

                                    {/* Mission Summary */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.neons.yellow.default,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t('soloPlay.mission.summary')}
                                            </Typography>
                                            <Tooltip title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRerollSummary}
                                                    sx={{ color: colors.neons.yellow.default }}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={currentMission.missionSummary}
                                            onChange={(e) =>
                                                handleUpdateField('missionSummary', e.target.value)
                                            }
                                        />
                                    </Box>

                                    {/* Focus and Specifics */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.neons.pink.default,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t('soloPlay.mission.focusAndSpecifics')}
                                            </Typography>
                                            <Tooltip title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRerollFocus}
                                                    sx={{ color: colors.neons.pink.default }}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={currentMission.focusAndSpecifics}
                                            onChange={(e) =>
                                                handleUpdateField('focusAndSpecifics', e.target.value)
                                            }
                                        />
                                    </Box>

                                    {/* The Twist */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.neons.red.default,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t('soloPlay.mission.twist')}
                                            </Typography>
                                            <Tooltip title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRerollTwist}
                                                    sx={{ color: colors.neons.red.default }}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={currentMission.twist || ''}
                                            onChange={(e) =>
                                                handleUpdateField('twist', e.target.value)
                                            }
                                            placeholder={t('soloPlay.mission.twistPlaceholder')}
                                        />
                                    </Box>

                                    {/* Actions */}
                                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                                        <Button
                                            startIcon={<ContentCopy />}
                                            onClick={() => copyMissionToClipboard(currentMission)}
                                            sx={{ color: colors.grays.gray600 }}
                                        >
                                            {t('soloPlay.mission.copy')}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveMission}
                                            sx={{
                                                backgroundColor: colors.neons.green.default,
                                                '&:hover': {
                                                    backgroundColor: colors.neons.green.dark,
                                                },
                                            }}
                                        >
                                            {t('soloPlay.mission.save')}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Mission History */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            mb: 2,
                        }}
                    >
                        {t('soloPlay.mission.savedMissions')}
                    </Typography>
                    <Stack spacing={2} sx={{ maxHeight: 600, overflow: 'auto' }}>
                        {missionHistory.length === 0 ? (
                            <Typography
                                variant="body2"
                                sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}
                            >
                                {t('soloPlay.mission.noSavedMissions')}
                            </Typography>
                        ) : (
                            missionHistory.map((mission) => (
                                <Paper
                                    key={mission.id}
                                    sx={{
                                        p: 2,
                                        backgroundColor: readerMode
                                            ? 'rgba(0, 0, 0, 0.05)'
                                            : 'rgba(0, 0, 0, 0.3)',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: readerMode
                                                ? 'rgba(0, 0, 0, 0.1)'
                                                : 'rgba(0, 0, 0, 0.5)',
                                        },
                                    }}
                                    onClick={() => setCurrentMission(mission)}
                                >
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                    >
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray000
                                                        : colors.grays.gray900,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {mission.name}
                                            </Typography>
                                            <Chip
                                                label={mission.whoIsHiring.type}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getEmployerColor(
                                                        mission.whoIsHiring.type
                                                    ),
                                                    color: colors.grays.gray000,
                                                    mt: 0.5,
                                                }}
                                            />
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteMission(mission.id)
                                            }}
                                            sx={{ color: colors.neons.red.default }}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Paper>
                            ))
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    )
}

export default MissionBuilderPanel

