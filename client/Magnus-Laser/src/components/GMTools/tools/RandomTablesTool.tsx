import Casino from '@mui/icons-material/Casino'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Masonry } from '@mui/lab'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    FormControl,
    Grid,
    MenuItem,
    Select,
    Typography,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import type { OpenQuestionTableConfig } from '../../../types/soloPlay'
import { type EncounterTime, type EncounterZone } from '../../../utils/generators/soloPlayTablesExpanded'
import { useGMToolsDataStore, type RandomTableResult } from '../GMToolsDataStore'
import { getCyberpunkButtonStyle, getCyberpunkSelectStyle } from '../GMToolsStyles'

import { categories, generateRandomTableContent, type OpenQuestionTableSelection } from './randomTablesData'

interface RandomTablesToolProps {
    selectionMode?: boolean
    selectedTableKeys?: string[]
    onToggleSelection?: (selection: OpenQuestionTableSelection) => void
}

const RandomTablesTool = ({
    selectionMode = false,
    selectedTableKeys = [],
    onToggleSelection,
}: RandomTablesToolProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { addRandomTableResult, selectedCampaign, addCampaign, setSelectedCampaign } = useGMToolsDataStore()

    const DEFAULT_CAMPAIGN = 'Default'

    const ensureCampaign = (): string => {
        if (selectedCampaign) return selectedCampaign
        addCampaign(DEFAULT_CAMPAIGN)
        setSelectedCampaign(DEFAULT_CAMPAIGN)
        return DEFAULT_CAMPAIGN
    }

    // Encounter selector state
    const [encounterZone, setEncounterZone] = useState<EncounterZone>('moderate')
    const [encounterTime, setEncounterTime] = useState<EncounterTime>('day')

    const handleGenerate = (selection: OpenQuestionTableSelection) => {
        const campaign = ensureCampaign()
        const newResult: RandomTableResult = {
            id: uuidv4(),
            type: selection.key,
            content: generateRandomTableContent(selection, t),
            timestamp: Date.now(),
            campaignId: campaign,
        }
        addRandomTableResult(newResult)
    }

    const handleTableAction = (selection: OpenQuestionTableSelection) => {
        if (selectionMode) {
            onToggleSelection?.(selection)
            return
        }
        handleGenerate(selection)
    }

    // Accordion summary style helper
    const accordionSx = {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&::before': { display: 'none' },
    }

    const accordionSummarySx = (color: string) => ({
        minHeight: 32,
        '&.Mui-expanded': { minHeight: 32 },
        '& .MuiAccordionSummary-content': { margin: '4px 0' },
        '& .MuiAccordionSummary-content.Mui-expanded': { margin: '4px 0' },
        borderBottom: readerMode ? '1px solid rgba(0,0,0,0.1)' : `1px solid ${color}20`,
    })

    const categoryLabelSx = (color: string) => ({
        color: readerMode ? colors.grays.gray000 : color,
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 'bold',
        fontSize: '0.65rem',
        letterSpacing: '2px',
        textTransform: 'uppercase' as const,
        textShadow: readerMode ? 'none' : `0 0 5px ${color}60`,
    })

    const sectionSubtitleSx = (color: string) => ({
        color,
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        letterSpacing: '1.5px',
        textTransform: 'uppercase' as const,
        textShadow: readerMode ? 'none' : `0 0 8px ${color}60`,
    })

    const getButtonOpacity = (key: string) => {
        if (!selectionMode) return 1
        return selectedTableKeys.includes(key) ? 1 : 0.5
    }

    const getButtonSx = (key: string, color: string): SxProps<Theme> => ({
        ...(getCyberpunkButtonStyle(readerMode, color) as Record<string, unknown>),
        textTransform: 'uppercase',
        justifyContent: 'flex-start',
        fontSize: '0.7rem',
        opacity: getButtonOpacity(key),
        transition: 'opacity 0.15s ease',
    })

    const encounterConfig: OpenQuestionTableConfig = { encounterZone, encounterTime }

    return (
        <Box>
            <Typography variant="subtitle2" sx={sectionSubtitleSx(colors.neons.green.default)} mb={1}>
                {t('soloPlay.tabs.tables')}
            </Typography>

            {/* Generator Categories */}
            <Masonry columns={2} spacing={0}>
                {categories.map((category) => (
                    <Accordion key={category.key} defaultExpanded sx={accordionSx} disableGutters>
                        <AccordionSummary
                            expandIcon={
                                <ExpandMore sx={{ color: readerMode ? colors.grays.gray400 : category.color }} />
                            }
                            sx={accordionSummarySx(category.color)}
                        >
                            <Typography variant="caption" sx={categoryLabelSx(category.color)}>
                                {t(`soloPlay.tables.categories.${category.key}`)}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pt: 1 }}>
                            <Grid container spacing={1} sx={{ mb: 1 }}>
                                {category.generators.map((gen) => (
                                    <Grid size={{ xs: 6 }} key={gen.key}>
                                        <Button
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Casino />}
                                            onClick={() => handleTableAction({ key: gen.key })}
                                            sx={getButtonSx(gen.key, category.color)}
                                            title={t(`soloPlay.tables.${gen.key}`)}
                                        >
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} noWrap>
                                                {t(`soloPlay.tables.${gen.key}`)}
                                            </Typography>
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                ))}
                {/* Encounters Section (special - needs zone/time selectors) */}
                <Accordion defaultExpanded sx={accordionSx} disableGutters>
                    <AccordionSummary
                        expandIcon={
                            <ExpandMore sx={{ color: readerMode ? colors.grays.gray400 : colors.neons.pink.default }} />
                        }
                        sx={accordionSummarySx(colors.neons.pink.default)}
                    >
                        <Typography variant="caption" sx={categoryLabelSx(colors.neons.pink.default)}>
                            {t('soloPlay.tables.categories.encounters')}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pt: 1 }}>
                        <Grid container spacing={1} sx={{ mb: 1 }}>
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        fullWidth
                                        value={encounterZone}
                                        onChange={(e) => setEncounterZone(e.target.value as EncounterZone)}
                                        sx={{
                                            ...getCyberpunkSelectStyle(readerMode, colors.neons.pink.default),
                                            fontSize: '0.75rem',
                                            height: 28,
                                        }}
                                    >
                                        <MenuItem value="corporate">{t('soloPlay.tables.zones.corporate')}</MenuItem>
                                        <MenuItem value="moderate">{t('soloPlay.tables.zones.moderate')}</MenuItem>
                                        <MenuItem value="combatZone">{t('soloPlay.tables.zones.combatZone')}</MenuItem>
                                        <MenuItem value="outskirts">{t('soloPlay.tables.zones.outskirts')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        fullWidth
                                        value={encounterTime}
                                        onChange={(e) => setEncounterTime(e.target.value as EncounterTime)}
                                        sx={{
                                            ...getCyberpunkSelectStyle(readerMode, colors.neons.pink.default),
                                            fontSize: '0.75rem',
                                            height: 28,
                                        }}
                                    >
                                        <MenuItem value="day">{t('soloPlay.tables.times.day')}</MenuItem>
                                        <MenuItem value="night">{t('soloPlay.tables.times.night')}</MenuItem>
                                        <MenuItem value="midnight">{t('soloPlay.tables.times.midnight')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Button
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Casino />}
                                    onClick={() => handleTableAction({ key: 'encounter', config: encounterConfig })}
                                    sx={getButtonSx('encounter', colors.neons.pink.default)}
                                    title={t('soloPlay.tables.encounter')}
                                >
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} noWrap>
                                        {t('soloPlay.tables.encounter')}
                                    </Typography>
                                </Button>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Masonry>
        </Box>
    )
}

export default RandomTablesTool
