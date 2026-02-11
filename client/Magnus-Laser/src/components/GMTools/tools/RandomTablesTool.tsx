import Casino from '@mui/icons-material/Casino'
import ContentCopy from '@mui/icons-material/ContentCopy'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Refresh from '@mui/icons-material/Refresh'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
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
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import {
    actionFocusTable,
    adjectivesTable,
    detailFocusTable,
    getRandomFromArray,
    nightCityDistrictsTable,
} from '../../../utils/generators/soloPlayTables'
import {
    generateAdvertisement,
    generateApartment,
    generateBar,
    generateBlackIce,
    generateCargoContainer,
    generateCorporateConapt,
    generateCorpseLoot,
    generateCubeHotel,
    generateFashion,
    generateFashionware,
    generateFirearm,
    generateHandle,
    generateHotspot,
    generateKibbleFlavor,
    generateMissionItem,
    generateNPCByRole,
    generateRadioStation,
    generateRandomEncounter,
    generateRandomName,
    generateRelationship,
    generateSight,
    generateSmell,
    generateSound,
    generateTritiFizz,
    generateTVShow,
    generateVisitor,
    type EncounterTime,
    type EncounterZone,
} from '../../../utils/generators/soloPlayTablesExpanded'
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
    getCyberpunkSelectStyle,
    getCyberpunkTextFieldStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

// === Generator Types ===

interface GeneratorDef {
    key: string
    color: string
    generator: () => unknown
}

interface GeneratorCategory {
    key: string
    color: string
    defaultExpanded?: boolean
    generators: GeneratorDef[]
}

// === Wrapper generators for nested objects ===

const wrapNPCByRole = () => {
    const r = generateNPCByRole()
    return { role: r.role, name: r.npc.name, notes: r.npc.notes }
}

const wrapVenue = (gen: () => { name: string; description: string }) => () => {
    const r = gen()
    return { name: r.name, description: r.description }
}

const wrapPlace = (gen: () => { name: string; description: string }) => () => {
    const r = gen()
    return { name: r.name, description: r.description }
}

const wrapFlavorItem = (gen: () => { flavor: string; description: string }) => () => {
    const r = gen()
    return { flavor: r.flavor, description: r.description }
}

// === Categories with generators ===

const categories: GeneratorCategory[] = [
    {
        key: 'core',
        color: colors.neons.green.default,
        defaultExpanded: true,
        generators: [
            { key: 'npc', color: colors.neons.cyan.default, generator: generateQuickNPC },
            { key: 'location', color: colors.neons.blue.default, generator: generateQuickLocation },
            { key: 'event', color: colors.neons.green.default, generator: generateQuickEvent },
            { key: 'complication', color: colors.neons.yellow.default, generator: generateQuickComplication },
            { key: 'rumor', color: colors.neons.pink.default, generator: generateQuickRumor },
            { key: 'clue', color: colors.neons.cyan.default, generator: generateQuickClue },
            { key: 'twist', color: colors.neons.red.default, generator: generateQuickTwist },
            { key: 'motivation', color: colors.neons.purple.default, generator: generateQuickMotivation },
            { key: 'mood', color: colors.neons.green.default, generator: generateQuickMood },
        ],
    },
    {
        key: 'words',
        color: colors.neons.orange.default,
        generators: [
            { key: 'action', color: colors.neons.orange.default, generator: () => getRandomFromArray(actionFocusTable) },
            { key: 'noun', color: colors.neons.blue.default, generator: () => getRandomFromArray(detailFocusTable) },
            { key: 'adjective', color: colors.neons.purple.default, generator: () => getRandomFromArray(adjectivesTable) },
        ],
    },
    {
        key: 'sensory',
        color: colors.neons.purple.default,
        generators: [
            { key: 'sight', color: colors.neons.purple.default, generator: generateSight },
            { key: 'sound', color: colors.neons.blue.default, generator: generateSound },
            { key: 'smell', color: colors.neons.green.default, generator: generateSmell },
        ],
    },
    {
        key: 'names',
        color: colors.neons.cyan.default,
        generators: [
            { key: 'nameMasc', color: colors.neons.cyan.default, generator: () => generateRandomName('masc') },
            { key: 'nameFemme', color: colors.neons.pink.default, generator: () => generateRandomName('femme') },
            { key: 'nameNB', color: colors.neons.purple.default, generator: () => generateRandomName('nonbinary') },
            { key: 'handle', color: colors.neons.orange.default, generator: generateHandle },
        ],
    },
    {
        key: 'nightCity',
        color: colors.neons.blue.default,
        generators: [
            { key: 'district', color: colors.neons.blue.default, generator: () => getRandomFromArray(nightCityDistrictsTable) },
            { key: 'hotspot', color: colors.neons.green.default, generator: wrapVenue(generateHotspot) },
            { key: 'bar', color: colors.neons.orange.default, generator: wrapVenue(generateBar) },
            { key: 'cubeHotel', color: colors.neons.yellow.default, generator: wrapPlace(generateCubeHotel) },
            { key: 'cargoContainer', color: colors.neons.cyan.default, generator: wrapPlace(generateCargoContainer) },
            { key: 'corporateConapt', color: colors.neons.purple.default, generator: wrapPlace(generateCorporateConapt) },
            { key: 'apartment', color: colors.neons.pink.default, generator: wrapPlace(generateApartment) },
        ],
    },
    {
        key: 'people',
        color: colors.neons.pink.default,
        generators: [
            { key: 'npcByRole', color: colors.neons.cyan.default, generator: wrapNPCByRole },
            { key: 'relationship', color: colors.neons.pink.default, generator: generateRelationship },
            { key: 'visitor', color: colors.neons.orange.default, generator: generateVisitor },
        ],
    },
    {
        key: 'things',
        color: colors.neons.yellow.default,
        generators: [
            { key: 'fashion', color: colors.neons.pink.default, generator: generateFashion },
            { key: 'fashionware', color: colors.neons.purple.default, generator: generateFashionware },
            { key: 'blackIce', color: colors.neons.red.default, generator: generateBlackIce },
            { key: 'firearm', color: colors.neons.orange.default, generator: generateFirearm },
            { key: 'kibbleFlavor', color: colors.neons.yellow.default, generator: wrapFlavorItem(generateKibbleFlavor) },
            { key: 'tritiFizz', color: colors.neons.green.default, generator: wrapFlavorItem(generateTritiFizz) },
        ],
    },
    {
        key: 'media',
        color: colors.neons.cyan.default,
        generators: [
            { key: 'radioStation', color: colors.neons.cyan.default, generator: generateRadioStation },
            { key: 'tvShow', color: colors.neons.blue.default, generator: generateTVShow },
            { key: 'advertisement', color: colors.neons.yellow.default, generator: generateAdvertisement },
        ],
    },
    {
        key: 'corpseLoot',
        color: colors.neons.red.default,
        generators: [
            { key: 'lootStreetrat', color: colors.neons.yellow.default, generator: () => generateCorpseLoot('streetrat') },
            { key: 'lootEdgerunner', color: colors.neons.orange.default, generator: () => generateCorpseLoot('edgerunner') },
            { key: 'lootCorporate', color: colors.neons.cyan.default, generator: () => generateCorpseLoot('corporate') },
        ],
    },
    {
        key: 'mission',
        color: colors.neons.green.default,
        generators: [
            { key: 'missionItemCorporate', color: colors.neons.cyan.default, generator: () => generateMissionItem('corporate') },
            { key: 'missionItemModerate', color: colors.neons.blue.default, generator: () => generateMissionItem('moderate') },
            { key: 'missionItemStreet', color: colors.neons.orange.default, generator: () => generateMissionItem('street') },
            { key: 'missionItemNomad', color: colors.neons.yellow.default, generator: () => generateMissionItem('nomad') },
        ],
    },
]

// Build flat lookup from all categories (for reroll + color)
const allGenerators: Record<string, GeneratorDef> = {}
for (const category of categories) {
    for (const gen of category.generators) {
        allGenerators[gen.key] = gen
    }
}
// Add encounter as special entry (handled separately but needs color lookup)
allGenerators['encounter'] = { key: 'encounter', color: colors.neons.red.default, generator: () => '' }

// Helper to capitalize first letter
const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

// Format any generator result to string
const formatResult = (rawResult: unknown): string => {
    if (typeof rawResult === 'string') return rawResult
    if (typeof rawResult === 'object' && rawResult !== null) {
        return Object.entries(rawResult)
            .map(([key, value]) => `${capitalize(key)}: ${value}`)
            .join('\n')
    }
    return String(rawResult)
}

// === Component ===

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

    // Encounter selector state
    const [encounterZone, setEncounterZone] = useState<EncounterZone>('moderate')
    const [encounterTime, setEncounterTime] = useState<EncounterTime>('day')

    // Styles
    const titleStyle = getSectionTitleStyle(readerMode, colors.neons.green.default)
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)

    const handleGenerate = (type: string, generator: () => unknown) => {
        const newResult: RandomTableResult = {
            id: uuidv4(),
            type,
            content: formatResult(generator()),
            timestamp: Date.now(),
        }
        addRandomTableResult(newResult)
    }

    const handleGenerateEncounter = () => {
        const encounter = generateRandomEncounter(encounterZone, encounterTime)
        const zoneLabel = t(`soloPlay.tables.zones.${encounterZone}`)
        const timeLabel = t(`soloPlay.tables.times.${encounterTime}`)
        const newResult: RandomTableResult = {
            id: uuidv4(),
            type: 'encounter',
            content: `Zone: ${zoneLabel}\nTime: ${timeLabel}\nEncounter: ${encounter}`,
            timestamp: Date.now(),
        }
        addRandomTableResult(newResult)
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

    // Accordion summary style helper
    const accordionSx = {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&::before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
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

    return (
        <Box>
            <Typography variant="h6" sx={titleStyle}>
                {t('gmTools.randomTables')}
            </Typography>

            {/* Generator Categories */}
            {categories.map((category) => (
                <Accordion
                    key={category.key}
                    defaultExpanded={category.defaultExpanded}
                    sx={accordionSx}
                    disableGutters
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore sx={{ color: readerMode ? colors.grays.gray400 : category.color }} />}
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
                    </AccordionDetails>
                </Accordion>
            ))}

            {/* Encounters Section (special - needs zone/time selectors) */}
            <Accordion sx={accordionSx} disableGutters>
                <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: readerMode ? colors.grays.gray400 : colors.neons.red.default }} />}
                    sx={accordionSummarySx(colors.neons.red.default)}
                >
                    <Typography variant="caption" sx={categoryLabelSx(colors.neons.red.default)}>
                        {t('soloPlay.tables.categories.encounters')}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pt: 1 }}>
                    <Stack spacing={1} sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1}>
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <Select
                                    value={encounterZone}
                                    onChange={(e) => setEncounterZone(e.target.value as EncounterZone)}
                                    sx={{
                                        ...getCyberpunkSelectStyle(readerMode, colors.neons.red.default),
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <MenuItem value="corporate">{t('soloPlay.tables.zones.corporate')}</MenuItem>
                                    <MenuItem value="moderate">{t('soloPlay.tables.zones.moderate')}</MenuItem>
                                    <MenuItem value="combatZone">{t('soloPlay.tables.zones.combatZone')}</MenuItem>
                                    <MenuItem value="outskirts">{t('soloPlay.tables.zones.outskirts')}</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <Select
                                    value={encounterTime}
                                    onChange={(e) => setEncounterTime(e.target.value as EncounterTime)}
                                    sx={{
                                        ...getCyberpunkSelectStyle(readerMode, colors.neons.red.default),
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <MenuItem value="day">{t('soloPlay.tables.times.day')}</MenuItem>
                                    <MenuItem value="night">{t('soloPlay.tables.times.night')}</MenuItem>
                                    <MenuItem value="midnight">{t('soloPlay.tables.times.midnight')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                        <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            startIcon={<Casino />}
                            onClick={handleGenerateEncounter}
                            sx={{
                                ...getCyberpunkButtonStyle(readerMode, colors.neons.red.default),
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                            }}
                        >
                            {t('soloPlay.tables.encounter')}
                        </Button>
                    </Stack>
                </AccordionDetails>
            </Accordion>

            {/* Results */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} mt={2}>
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
                            const resultColor = allGenerators[result.type]?.color || colors.grays.gray600
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
                                            {t(`soloPlay.tables.${result.type}`, result.type)}
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

                                    {/* Content */}
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
