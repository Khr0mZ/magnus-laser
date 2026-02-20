import Casino from '@mui/icons-material/Casino'
import { Autocomplete, Box, Button, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CyberpunkFormControl from '../../../components/CyberpunkFormControl'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { OracleProbability } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { rollOpenQuestion, rollOracle } from '../../../utils/generators/soloPlayUtils'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkButtonStyle,
    getCyberpunkSelectStyle,
    getCyberpunkTextFieldStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'
import RandomTablesTool from './RandomTablesTool'

const OracleTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { addOracleResult, addOpenQuestionResult, selectedCampaign, campaigns, addCampaign, setSelectedCampaign } =
        useGMToolsDataStore()

    const [closedQuestion, setClosedQuestion] = useState('')
    const [probability, setProbability] = useState<OracleProbability>('FIFTY_FIFTY')
    const [openQuestion, setOpenQuestion] = useState('')

    const handleAskOracle = () => {
        if (!closedQuestion.trim()) return
        const result = rollOracle(closedQuestion, probability)
        addOracleResult({ ...result, campaignId: selectedCampaign ?? undefined })
        setClosedQuestion('')
    }

    const handleAskOpenQuestion = () => {
        if (!openQuestion.trim()) return
        const result = rollOpenQuestion(openQuestion)
        addOpenQuestionResult({ ...result, campaignId: selectedCampaign ?? undefined })
        setOpenQuestion('')
    }

    const probabilityOptions: { value: OracleProbability; label: string }[] = [
        { value: 'CERTAIN', label: t('soloPlay.oracle.probabilities.certain') },
        { value: 'LIKELY', label: t('soloPlay.oracle.probabilities.likely') },
        { value: 'FIFTY_FIFTY', label: t('soloPlay.oracle.probabilities.fifty_fifty') },
        { value: 'UNLIKELY', label: t('soloPlay.oracle.probabilities.unlikely') },
        { value: 'IMPOSSIBLE', label: t('soloPlay.oracle.probabilities.impossible') },
    ]

    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)
    const selectStyle = getCyberpunkSelectStyle(readerMode, colors.neons.cyan.default)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.cyan.default)
    const pinkButtonStyle = getCyberpunkButtonStyle(readerMode, colors.neons.pink.default)
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.cyan.default)

    const sectionSubtitleSx = (color: string) => ({
        color,
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        letterSpacing: '1.5px',
        textTransform: 'uppercase' as const,
        textShadow: readerMode ? 'none' : `0 0 8px ${color}60`,
    })

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" sx={{ ...titleStyle, mb: 0 }}>
                    {t('gmTools.oracle')} & {t('gmTools.randomTables')}
                </Typography>
                <Autocomplete
                    freeSolo
                    size="small"
                    value={selectedCampaign}
                    options={campaigns}
                    onChange={(_, newValue) => {
                        if (typeof newValue === 'string' && newValue.trim()) {
                            const trimmed = newValue.trim()
                            addCampaign(trimmed)
                            setSelectedCampaign(trimmed)
                        } else {
                            setSelectedCampaign(newValue as string | null)
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={t('soloPlay.oracle.campaign')}
                            variant="outlined"
                            size="small"
                            sx={{
                                ...getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default),
                                '& .MuiOutlinedInput-root': {
                                    color: readerMode ? '#333' : '#fff',
                                    fontSize: '0.75rem',
                                    fontFamily: '"Lexend", sans-serif',
                                    padding: '2px 8px !important',
                                    '& fieldset': {
                                        borderColor: readerMode
                                            ? 'rgba(0,0,0,0.23)'
                                            : `${colors.neons.cyan.default}4D`,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: readerMode
                                            ? 'rgba(0,0,0,0.5)'
                                            : colors.neons.cyan.default,
                                    },
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                    opacity: 1,
                                    fontStyle: 'italic',
                                },
                            }}
                        />
                    )}
                    slotProps={{
                        paper: {
                            sx: {
                                backgroundColor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
                                border: readerMode
                                    ? '1px solid rgba(0,0,0,0.1)'
                                    : `1px solid ${colors.neons.cyan.default}40`,
                                '& .MuiAutocomplete-option': {
                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray800,
                                    fontSize: '0.75rem',
                                    fontFamily: '"Lexend", sans-serif',
                                    '&:hover': { backgroundColor: `${colors.neons.cyan.default}20` },
                                    '&[aria-selected="true"]': {
                                        backgroundColor: `${colors.neons.cyan.default}30`,
                                    },
                                },
                            },
                        },
                        clearIndicator: {
                            sx: { color: readerMode ? colors.grays.gray400 : colors.neons.cyan.default },
                        },
                    }}
                    sx={{ flexGrow: 1, maxWidth: 220 }}
                />
            </Stack>

            {/* Closed Question */}
            <Typography variant="subtitle2" sx={sectionSubtitleSx(colors.neons.cyan.default)}>
                {t('soloPlay.oracle.closedQuestion')}
            </Typography>
            <Stack direction="row" spacing={2} mt={1} mb={2}>
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
                    sx={{ ...buttonStyle, minWidth: 90 }}
                >
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} noWrap>
                        {t('soloPlay.oracle.roll')}
                    </Typography>
                </Button>
            </Stack>

            {/* Open Question */}
            <Typography variant="subtitle2" sx={sectionSubtitleSx(colors.neons.pink.default)}>
                {t('soloPlay.oracle.openQuestion')}
            </Typography>
            <Stack spacing={2} mt={1} mb={2} direction="row">
                <TextField
                    fullWidth
                    size="small"
                    label={t('soloPlay.oracle.askOpenQuestion')}
                    value={openQuestion}
                    onChange={(e) => setOpenQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskOpenQuestion()}
                    placeholder={t('soloPlay.oracle.openQuestionPlaceholder')}
                    sx={{ ...getCyberpunkTextFieldStyle(readerMode, colors.neons.pink.default) }}
                />

                <Button
                    variant="outlined"
                    onClick={handleAskOpenQuestion}
                    disabled={!openQuestion.trim()}
                    size="small"
                    startIcon={<Casino />}
                    sx={{ ...pinkButtonStyle, minWidth: 90 }}
                >
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} noWrap>
                        {t('soloPlay.oracle.roll')}
                    </Typography>
                </Button>
            </Stack>

            {/* Random Tables */}
            <RandomTablesTool />
        </Box>
    )
}

export default OracleTool
