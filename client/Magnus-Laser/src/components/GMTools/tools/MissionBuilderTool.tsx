import AutoAwesome from '@mui/icons-material/AutoAwesome'
import ContentCopy from '@mui/icons-material/ContentCopy'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Refresh from '@mui/icons-material/Refresh'
import Save from '@mui/icons-material/Save'
import { Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
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
import CustomScrollbar from '../../CustomScrollbar'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getCyberpunkTextFieldStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const MissionBuilderTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Persisted state
    const { missions, currentMission, setCurrentMission, saveMission, deleteMission } = useGMToolsDataStore()

    // Styles
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.purple.default)
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.purple.default)

    const handleGenerateMission = () => {
        const mission = generateRandomMission()
        setCurrentMission(mission)
    }

    const handleSaveMission = () => {
        if (currentMission) {
            saveMission(currentMission)
        }
    }

    const handleReroll = (field: keyof SoloMission) => {
        if (!currentMission) return
        let updated: SoloMission
        switch (field) {
            case 'whoIsHiring':
                updated = { ...currentMission, whoIsHiring: generateRandomEmployer() }
                break
            case 'payment':
                updated = { ...currentMission, payment: generateRandomPayment() }
                break
            case 'missionSummary':
                updated = { ...currentMission, missionSummary: generateMissionSummary() }
                break
            case 'focusAndSpecifics':
                updated = { ...currentMission, focusAndSpecifics: generateMissionFocus() }
                break
            case 'twist':
                updated = { ...currentMission, twist: generateMissionTwist() }
                break
            default:
                return
        }
        setCurrentMission(updated)
    }

    const copyToClipboard = () => {
        if (!currentMission) return
        const text = `
MISSION: ${currentMission.name}
WHO'S HIRING: ${currentMission.whoIsHiring.name} (${currentMission.whoIsHiring.type})
PAYMENT: ${currentMission.payment.description}
SUMMARY: ${currentMission.missionSummary}
FOCUS: ${currentMission.focusAndSpecifics}
${currentMission.twist ? `TWIST: ${currentMission.twist}` : ''}
        `.trim()
        navigator.clipboard.writeText(text)
    }

    const getEmployerColor = (type: string): string => {
        switch (type) {
            case 'FIXER':
                return colors.neons.cyan.default
            case 'CORPO':
                return colors.neons.blue.default
            case 'GANG':
                return colors.neons.red.default
            default:
                return colors.neons.green.default
        }
    }

    const getMissionSectionStyle = (accentColor: string) => ({
        ...getCyberpunkPaperStyle(readerMode, accentColor),
        p: 1.5,
    })

    const getRerollButtonStyle = (accentColor: string) => ({
        color: accentColor,
        border: `1px solid ${accentColor}40`,
        borderRadius: 0,
        '&:hover': {
            backgroundColor: `${accentColor}20`,
            boxShadow: readerMode ? 'none' : `0 0 10px ${accentColor}40`,
        },
    })

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('gmTools.missionBuilder')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoAwesome />}
                    onClick={handleGenerateMission}
                    sx={buttonStyle}
                >
                    {t('soloPlay.mission.generateMission')}
                </Button>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                {/* Saved Missions List */}
                <Box
                    sx={{
                        width: 200,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        maxHeight: 'calc(100vh - 180px)',
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                            mb: 1,
                            flexShrink: 0,
                            fontFamily: '"Lexend", sans-serif',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('soloPlay.mission.savedMissions')} ({missions.length})
                    </Typography>
                    {missions.length === 0 ? (
                        <Typography
                            variant="body2"
                            sx={{
                                color: colors.grays.gray600,
                                fontStyle: 'italic',
                                textAlign: 'center',
                                py: 2,
                                fontFamily: '"Lexend", sans-serif',
                            }}
                        >
                            {t('soloPlay.mission.noSavedMissions')}
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                minHeight: 0,
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                '&::-webkit-scrollbar': {
                                    display: 'none',
                                },
                            }}
                        >
                            <Stack spacing={0.5}>
                                {missions.map((mission) => {
                                    const isSelected = currentMission?.id === mission.id
                                    return (
                                        <Paper
                                            key={mission.id}
                                            onClick={() => setCurrentMission(mission)}
                                            sx={{
                                                p: 1,
                                                cursor: 'pointer',
                                                backgroundColor: isSelected
                                                    ? `${colors.neons.purple.default}20`
                                                    : readerMode
                                                    ? 'rgba(0, 0, 0, 0.05)'
                                                    : 'rgba(0, 20, 40, 0.5)',
                                                border: isSelected
                                                    ? `1px solid ${colors.neons.purple.default}`
                                                    : '1px solid transparent',
                                                borderLeft: `3px solid ${colors.neons.purple.default}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    backgroundColor: `${colors.neons.purple.default}15`,
                                                    borderColor: `${colors.neons.purple.default}60`,
                                                },
                                            }}
                                        >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: isSelected ? 'bold' : 'normal',
                                                        fontFamily: '"Lexend", sans-serif',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        flex: 1,
                                                        color: isSelected ? colors.neons.purple.default : 'inherit',
                                                    }}
                                                >
                                                    {mission.name}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        deleteMission(mission.id)
                                                    }}
                                                    sx={{
                                                        color: colors.neons.red.default,
                                                        p: 0.25,
                                                        '&:hover': {
                                                            filter: `drop-shadow(0 0 5px ${colors.neons.red.default})`,
                                                        },
                                                    }}
                                                >
                                                    <DeleteOutline sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Stack>
                                        </Paper>
                                    )
                                })}
                            </Stack>
                        </Box>
                    )}
                </Box>

                {/* Current Mission */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {!currentMission ? (
                        <Paper
                            sx={{
                                ...getCyberpunkPaperStyle(readerMode, colors.neons.purple.default),
                                p: 3,
                                textAlign: 'center',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
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
                                {t('soloPlay.mission.noMissionYet')}
                            </Typography>
                        </Paper>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                maxHeight: 'calc(100vh - 180px)',
                                overflow: 'hidden',
                            }}
                        >
                            <CustomScrollbar scrollDirection="vertical">
                                <Stack spacing={2} sx={{ pt: 1.5 }}>
                                    {/* Mission Name */}
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('soloPlay.mission.name')}
                                        value={currentMission.name}
                                        sx={{ ...textFieldStyle }}
                                        onChange={(e) => setCurrentMission({ ...currentMission, name: e.target.value })}
                                    />

                                    {/* Who's Hiring */}
                                    <Paper sx={getMissionSectionStyle(colors.neons.cyan.default)}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.cyan.default,
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {t('soloPlay.mission.whoIsHiring')}
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        label={currentMission.whoIsHiring.type}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: readerMode
                                                                ? getEmployerColor(currentMission.whoIsHiring.type)
                                                                : `${getEmployerColor(
                                                                      currentMission.whoIsHiring.type
                                                                  )}30`,
                                                            color: readerMode
                                                                ? colors.grays.gray000
                                                                : getEmployerColor(currentMission.whoIsHiring.type),
                                                            border: readerMode
                                                                ? 'none'
                                                                : `1px solid ${getEmployerColor(
                                                                      currentMission.whoIsHiring.type
                                                                  )}`,
                                                            fontFamily: '"Lexend", sans-serif',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.7rem',
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontFamily: '"Lexend", sans-serif' }}
                                                    >
                                                        {currentMission.whoIsHiring.name}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                            <Tooltip disableInteractive title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReroll('whoIsHiring')}
                                                    sx={getRerollButtonStyle(colors.neons.cyan.default)}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>

                                    {/* Payment */}
                                    <Paper sx={getMissionSectionStyle(colors.neons.green.default)}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {t('soloPlay.mission.payment')}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: '"Lexend", sans-serif' }}>
                                                    {currentMission.payment.description}
                                                </Typography>
                                            </Box>
                                            <Tooltip disableInteractive title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReroll('payment')}
                                                    sx={getRerollButtonStyle(colors.neons.green.default)}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>

                                    {/* Mission Summary */}
                                    <Paper sx={getMissionSectionStyle(colors.neons.yellow.default)}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.yellow.default,
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {t('soloPlay.mission.summary')}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: '"Lexend", sans-serif' }}>
                                                    {currentMission.missionSummary}
                                                </Typography>
                                            </Box>
                                            <Tooltip disableInteractive title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReroll('missionSummary')}
                                                    sx={getRerollButtonStyle(colors.neons.yellow.default)}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>

                                    {/* Focus & Specifics */}
                                    <Paper sx={getMissionSectionStyle(colors.neons.pink.default)}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.pink.default,
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {t('soloPlay.mission.focusAndSpecifics')}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: '"Lexend", sans-serif' }}>
                                                    {currentMission.focusAndSpecifics}
                                                </Typography>
                                            </Box>
                                            <Tooltip disableInteractive title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReroll('focusAndSpecifics')}
                                                    sx={getRerollButtonStyle(colors.neons.pink.default)}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>

                                    {/* Twist */}
                                    <Paper sx={getMissionSectionStyle(colors.neons.red.default)}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.red.default,
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {t('soloPlay.mission.twist')}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: '"Lexend", sans-serif' }}>
                                                    {currentMission.twist || t('soloPlay.mission.noTwist')}
                                                </Typography>
                                            </Box>
                                            <Tooltip disableInteractive title={t('soloPlay.mission.reroll')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReroll('twist')}
                                                    sx={getRerollButtonStyle(colors.neons.red.default)}
                                                >
                                                    <Refresh fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>

                                    {/* Actions */}
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<ContentCopy />}
                                            onClick={copyToClipboard}
                                            sx={getCyberpunkButtonStyle(readerMode, colors.grays.gray600)}
                                        >
                                            {t('soloPlay.mission.copy')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Save />}
                                            onClick={handleSaveMission}
                                            sx={getCyberpunkButtonStyle(readerMode, colors.neons.green.default)}
                                        >
                                            {t('soloPlay.mission.save')}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CustomScrollbar>
                        </Box>
                    )}
                </Box>
            </Stack>
        </Box>
    )
}

export default MissionBuilderTool
