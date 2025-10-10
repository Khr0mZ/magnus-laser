import { FolderOpen, Save, UploadFile } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    FormControlLabel,
    Grid,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    buttonGlitch,
    flicker,
    glitch,
    neonColorCycle,
    neonPulse,
    pulseGlowBlue,
    pulseGlowCyan,
    pulseGlowGreen,
    scanlineFlow,
    severeGlitch,
} from '../../components/common/Animations'
import { WarningDialog } from '../../components/common/WarningDialog'
import StorageBanner from '../../components/StorageBanner'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors'
import { db } from '../../utils/db'
import {
    loadCombatSimData,
    loadGeminiApiKey,
    loadHuggingFaceApiKey,
    loadOpenAIApiKey,
    notifyDataImported,
    notifyPreferencesChanged,
    saveBounties,
    saveBuildings,
    saveCharacters,
    saveCombatSimData,
    saveFixerJobs,
    saveGangs,
    saveGeminiApiKey,
    saveHuggingFaceApiKey,
    saveItems,
    saveMapMarkers,
    saveOpenAIApiKey,
    savePreferences,
} from '../../utils/storage'

const SettingsView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('common.settings')}`)
    const { readerMode, animationsEnabled, toggleAnimations, loaderEnabled, toggleLoader, toggleReaderMode } =
        useUserPreferences()
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()
    const [importDialogOpen, setImportDialogOpen] = useState(false)

    const [huggingFaceApiKey, setHuggingFaceApiKey] = useState('')
    const [openAIApiKey, setOpenAIApiKey] = useState('')
    const [geminiApiKey, setGeminiApiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Load API keys on component mount
    useEffect(() => {
        const loadApiKeys = async () => {
            try {
                const savedHuggingFaceApiKey = await loadHuggingFaceApiKey()
                setHuggingFaceApiKey(savedHuggingFaceApiKey)

                const savedOpenAIApiKey = await loadOpenAIApiKey()
                setOpenAIApiKey(savedOpenAIApiKey)

                const savedGeminiApiKey = await loadGeminiApiKey()
                setGeminiApiKey(savedGeminiApiKey)
            } catch (error) {
                console.warn('Error loading API keys:', error)
            }
        }

        loadApiKeys()
    }, [])

    const handleHuggingFaceApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHuggingFaceApiKey(event.target.value)
    }

    const handleOpenAIApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOpenAIApiKey(event.target.value)
    }

    const handleGeminiApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGeminiApiKey(event.target.value)
    }

    const handleSaveApiKeys = async () => {
        await saveHuggingFaceApiKey(huggingFaceApiKey)
        await saveOpenAIApiKey(openAIApiKey)
        await saveGeminiApiKey(geminiApiKey)
        setIsSaving(true)

        // Show success notification
        enqueueSnackbar('', {
            variant: 'success',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
            content: (key) => (
                <Alert
                    severity="success"
                    sx={{
                        bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                        color: readerMode ? '#333' : '#fff',
                        borderLeft: '4px solid',
                        borderColor: 'success.main',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    onClose={() => closeSnackbar(key)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Save sx={{ mr: 1 }} />
                        <Typography variant="body2">API keys saved successfully</Typography>
                    </Box>
                </Alert>
            ),
        })

        setTimeout(() => setIsSaving(false), 1000)
    }

    // Function to handle data export
    const handleExport = async () => {
        try {
            const data: Record<string, unknown> = {}

            // Export all application data from Dexie
            const [gangs, buildings, fixerJobs, characters, items, bounties, preferences, mapMarkers] =
                await Promise.all([
                    db.gangs.toArray(),
                    db.buildings.toArray(),
                    db.fixerJobs.toArray(),
                    db.characters.toArray(),
                    db.items.toArray(),
                    db.bounties.toArray(),
                    db.preferences.toArray(),
                    db.mapMarkers.toArray(),
                ])

            if (gangs.length > 0) data.gangs = gangs
            if (buildings.length > 0) data.buildings = buildings
            if (fixerJobs.length > 0) data.fixerJobs = fixerJobs
            if (characters.length > 0) data.characters = characters
            if (items.length > 0) data.items = items
            if (bounties.length > 0) data.bounties = bounties
            if (preferences.length > 0) data.preferences = preferences[0] // Only one preferences object
            if (mapMarkers.length > 0) data.mapMarkers = mapMarkers

            // Export combat simulator data
            const combatSimData = await loadCombatSimData()
            if (combatSimData.boardMaps.length > 0) data.combatSimBoardMaps = combatSimData.boardMaps
            if (combatSimData.tokens.length > 0) data.combatSimTokens = combatSimData.tokens
            if (combatSimData.maps.length > 0) data.combatSimMaps = combatSimData.maps
            if (combatSimData.walls.length > 0) data.combatSimWalls = combatSimData.walls
            if (combatSimData.images.length > 0) data.combatSimImages = combatSimData.images

            // Create a JSON file to download
            const fileName = `magnus-laser-data-${new Date().toISOString().split('T')[0]}.json`
            const dataStr = JSON.stringify(data, null, 2)
            const dataBlob = new Blob([dataStr], { type: 'application/json' })

            // Use more reliable approach for downloading
            const downloadLink = document.createElement('a')
            downloadLink.href = URL.createObjectURL(dataBlob)
            downloadLink.download = fileName

            // Make link invisible
            downloadLink.style.display = 'none'
            document.body.appendChild(downloadLink)

            // Programmatically click the link
            downloadLink.click()

            // Clean up
            setTimeout(() => {
                document.body.removeChild(downloadLink)
                URL.revokeObjectURL(downloadLink.href)
            }, 100)

            // Show success notification
            enqueueSnackbar('', {
                variant: 'success',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                content: (key) => (
                    <Alert
                        severity="success"
                        sx={{
                            bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                            color: readerMode ? '#333' : '#fff',
                            borderLeft: '4px solid',
                            borderColor: 'success.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}
                        onClose={() => closeSnackbar(key)}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2">
                                {`Exported ${Object.keys(data).length} collections successfully`}
                            </Typography>
                        </Box>
                    </Alert>
                ),
            })
        } catch (error) {
            console.warn('Failed to export data:', error)

            // Show error notification
            enqueueSnackbar('', {
                variant: 'error',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                content: (key) => (
                    <Alert
                        severity="error"
                        sx={{
                            bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                            color: readerMode ? '#333' : '#fff',
                            borderLeft: '4px solid',
                            borderColor: 'error.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}
                        onClose={() => closeSnackbar(key)}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2">Failed to export data</Typography>
                        </Box>
                    </Alert>
                ),
            })
        }
    }

    // Function that opens the warning dialog before import
    const handleImportClick = () => {
        setImportDialogOpen(true)
    }

    // Function to handle data import after confirmation
    const handleImportConfirmed = () => {
        setImportDialogOpen(false)

        try {
            // Create file input element
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'application/json'

            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return

                const reader = new FileReader()
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target?.result as string)

                        // Import all application data and count collections and registries
                        let importedCollections = 0
                        let importedRegistries = 0

                        // Process each key in the imported data
                        for (const key of Object.keys(data)) {
                            const value = data[key]

                            // Use the appropriate save function for each type of data
                            switch (key) {
                                case 'gangs':
                                    await saveGangs(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'buildings':
                                    await saveBuildings(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'fixerJobs':
                                    await saveFixerJobs(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'characters':
                                    await saveCharacters(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'items':
                                    await saveItems(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'bounties':
                                    await saveBounties(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'preferences':
                                    await savePreferences(value)
                                    importedCollections += 1
                                    break
                                case 'mapMarkers':
                                    await saveMapMarkers(value)
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'combatSimBoardMaps':
                                    await saveCombatSimData({ boardMaps: value })
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'combatSimTokens':
                                    await saveCombatSimData({ tokens: value })
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'combatSimMaps':
                                    await saveCombatSimData({ maps: value })
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'combatSimWalls':
                                    await saveCombatSimData({ walls: value })
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                case 'combatSimImages':
                                    await saveCombatSimData({ images: value })
                                    importedCollections += 1
                                    if (Array.isArray(value)) importedRegistries += value.length
                                    break
                                default:
                                    // Skip unknown keys
                                    break
                            }
                        }

                        // Notify that data has been imported for immediate UI updates
                        notifyDataImported()

                        // Show success notification if any collections imported
                        if (importedCollections > 0) {
                            // Make sure to trigger a preferences update if any data might have changed
                            if (data['preferences']) {
                                notifyPreferencesChanged()
                            }

                            enqueueSnackbar('', {
                                variant: 'success',
                                autoHideDuration: 3000,
                                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                                content: (key) => (
                                    <Alert
                                        severity="success"
                                        sx={{
                                            bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                                            color: readerMode ? '#333' : '#fff',
                                            borderLeft: '4px solid',
                                            borderColor: 'success.main',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                        }}
                                        onClose={() => closeSnackbar(key)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <UploadFile sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                {`Imported ${importedRegistries} registries in ${importedCollections} collections successfully`}
                                            </Typography>
                                        </Box>
                                    </Alert>
                                ),
                            })
                        } else {
                            // Show warning notification if no collections were imported
                            enqueueSnackbar('', {
                                variant: 'warning',
                                autoHideDuration: 3000,
                                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                                content: (key) => (
                                    <Alert
                                        severity="warning"
                                        sx={{
                                            bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                                            color: readerMode ? '#333' : '#fff',
                                            borderLeft: '4px solid',
                                            borderColor: 'warning.main',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                        }}
                                        onClose={() => closeSnackbar(key)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2">No collections found in import file</Typography>
                                        </Box>
                                    </Alert>
                                ),
                            })
                        }
                    } catch (error) {
                        console.warn('Failed to parse import file:', error)

                        // Show error notification
                        enqueueSnackbar('', {
                            variant: 'error',
                            autoHideDuration: 3000,
                            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                            content: (key) => (
                                <Alert
                                    severity="error"
                                    sx={{
                                        bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                                        color: readerMode ? '#333' : '#fff',
                                        borderLeft: '4px solid',
                                        borderColor: 'error.main',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                    }}
                                    onClose={() => closeSnackbar(key)}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2">Failed to parse import file</Typography>
                                    </Box>
                                </Alert>
                            ),
                        })
                    }
                }
                reader.readAsText(file)
            }

            // Trigger file selection
            input.click()
        } catch (error) {
            console.warn('Failed to import data:', error)

            // Show error notification
            enqueueSnackbar('', {
                variant: 'error',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                content: (key) => (
                    <Alert
                        severity="error"
                        sx={{
                            bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                            color: readerMode ? '#333' : '#fff',
                            borderLeft: '4px solid',
                            borderColor: 'error.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}
                        onClose={() => closeSnackbar(key)}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2">Failed to import data</Typography>
                        </Box>
                    </Alert>
                ),
            })
        }
    }

    return (
        <Container maxWidth={false} sx={{ pt: 0.5, pb: 1 }}>
            {/* Import Warning Dialog */}
            <WarningDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onConfirm={handleImportConfirmed}
                title={t('dashboard.importData')}
                message={t('dashboard.importDescriptionWarning')}
                confirmText={t('dashboard.confirmImport', 'Import')}
            />
            {/* Storage Banner */}
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />

            <Typography
                variant="h3"
                className="glitch-text"
                data-text={t('modules.SETTINGS')}
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                }}
            >
                {t('settings.title')}
            </Typography>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t('modules.SETTINGS_DESCRIPTION')}
            </Typography>

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 3 }}>
                {/* Export Data Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        onClick={handleExport}
                        sx={{
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            height: '100%',
                            border: readerMode
                                ? '1px solid rgba(0, 180, 180, 0.2)'
                                : '1px solid rgba(0, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                animation: `${neonPulse} 2s infinite`,
                                cursor: 'pointer',
                                '& .card-icon': {
                                    opacity: 0.4,
                                    filter: `drop-shadow(0 0 ${readerMode ? '10px' : '20px'} ${
                                        colors.neons.cyan.default
                                    })`,
                                    animation: `${flicker} 4s infinite, ${neonColorCycle} 5s infinite`,
                                },
                                '& .card-title': {
                                    animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                                    color: colors.neons.cyan.default,
                                    textShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 15px rgba(0,0,0,0.5)`,
                                    fontWeight: 700,
                                },
                                '& .card-description': {
                                    color: readerMode ? colors.neons.green.dark : colors.neons.green.light,
                                    textShadow: readerMode
                                        ? `0 0 3px ${colors.neons.green.light}, 0 0 5px rgba(0,0,0,0.2)`
                                        : `0 0 3px ${colors.neons.green.dark}, 0 0 5px rgba(0,0,0,0.9)`,
                                    fontWeight: 600,
                                    animation: `${neonColorCycle} 8s linear infinite`,
                                },
                                '& .card-subdescription': {
                                    color: colors.grays.gray900,
                                    textShadow: readerMode ? `0 0 2px rgba(0,0,0,0.2)` : `0 0 3px rgba(0,0,0,0.9)`,
                                    fontWeight: 500,
                                },
                                '& .card-glitch-overlay': {
                                    opacity: readerMode ? 0.1 : 0.15,
                                },
                                '& .card-scanlines': {
                                    opacity: readerMode ? 0.1 : 0.3,
                                },
                                '& .data-corruption': {
                                    opacity: readerMode ? 0.7 : 1,
                                },
                                '&::before': {
                                    opacity: readerMode ? 0.3 : 0.5,
                                    background: readerMode ? 'rgba(200, 250, 250, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                },
                            },
                        }}
                    >
                        <Box
                            className="card-icon"
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: colors.neons.green.default,
                                transition: 'all 0.5s',
                                opacity: 0.15,
                                zIndex: 3,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <Save sx={{ fontSize: '180px', color: 'inherit', opacity: 0.7 }} />
                        </Box>
                        <CardContent
                            sx={{
                                minHeight: '180px',
                                position: 'relative',
                                zIndex: 4,
                                padding: 3,
                                backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                                backdropFilter: 'blur(5px)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                variant="h4"
                                className="card-title"
                                data-text={t('dashboard.exportData')}
                                sx={{
                                    color: colors.neons.cyan.default,
                                    transition: 'all 0.3s',
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                                    mb: 3,
                                    textAlign: 'center',
                                    fontSize: '1.7rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: '-10px',
                                        left: '25%',
                                        width: '50%',
                                        height: '1px',
                                        background: `linear-gradient(to right, transparent, ${colors.neons.yellow.default}, transparent)`,
                                        boxShadow: `0 0 5px ${colors.neons.yellow.default}`,
                                    },
                                    '&::before': {
                                        content: 'attr(data-text)',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        color: readerMode ? colors.grays.gray900 : colors.neons.blue.default,
                                        opacity: readerMode ? 1 : 0.5,
                                        filter: readerMode ? 'none' : 'blur(1px)',
                                        animation: readerMode ? 'none' : `${severeGlitch} 5s infinite`,
                                        display: 'block',
                                    },
                                    '&:hover::before': {
                                        opacity: readerMode ? 1 : 0.7,
                                    },
                                }}
                            >
                                {t('dashboard.exportData')}
                            </Typography>
                            <Typography
                                variant="body1"
                                className="card-description"
                                sx={{
                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                    fontSize: '1.1rem',
                                    textAlign: 'center',
                                    px: 2,
                                    fontWeight: 500,
                                    textShadow: readerMode ? 'none' : '0 0 2px rgba(0,0,0,0.5)',
                                    position: 'relative',
                                    zIndex: 5,
                                    background: 'rgba(10, 15, 30, 0.5)',
                                    borderRadius: '4px',
                                    py: 1,
                                    mx: 'auto',
                                    width: '90%',
                                    border: `1px solid ${colors.neons.green.default}50`,
                                }}
                            >
                                {t('dashboard.exportDescription')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                {/* Import Data Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        onClick={handleImportClick}
                        sx={{
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            height: '100%',
                            border: readerMode
                                ? '1px solid rgba(0, 180, 180, 0.2)'
                                : '1px solid rgba(0, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                animation: `${neonPulse} 2s infinite`,
                                cursor: 'pointer',
                                '& .card-icon': {
                                    opacity: 0.4,
                                    filter: `drop-shadow(0 0 ${readerMode ? '10px' : '20px'} ${
                                        colors.neons.cyan.default
                                    })`,
                                    animation: `${flicker} 4s infinite, ${neonColorCycle} 5s infinite`,
                                },
                                '& .card-title': {
                                    animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                                    color: colors.neons.cyan.default,
                                    textShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 15px rgba(0,0,0,0.5)`,
                                    fontWeight: 700,
                                },
                                '& .card-description': {
                                    color: readerMode ? colors.neons.green.dark : colors.neons.green.light,
                                    textShadow: readerMode
                                        ? `0 0 3px ${colors.neons.green.light}, 0 0 5px rgba(0,0,0,0.2)`
                                        : `0 0 3px ${colors.neons.green.dark}, 0 0 5px rgba(0,0,0,0.9)`,
                                    fontWeight: 600,
                                    animation: `${neonColorCycle} 8s linear infinite`,
                                },
                                '& .card-subdescription': {
                                    color: colors.grays.gray900,
                                    textShadow: readerMode ? `0 0 2px rgba(0,0,0,0.2)` : `0 0 3px rgba(0,0,0,0.9)`,
                                    fontWeight: 500,
                                },
                                '& .card-glitch-overlay': {
                                    opacity: readerMode ? 0.1 : 0.15,
                                },
                                '& .card-scanlines': {
                                    opacity: readerMode ? 0.1 : 0.3,
                                },
                                '& .data-corruption': {
                                    opacity: readerMode ? 0.7 : 1,
                                },
                                '&::before': {
                                    opacity: readerMode ? 0.3 : 0.5,
                                    background: readerMode ? 'rgba(200, 250, 250, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                },
                            },
                        }}
                    >
                        <Box
                            className="card-icon"
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: colors.neons.blue.default,
                                transition: 'all 0.5s',
                                opacity: 0.15,
                                zIndex: 3,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <FolderOpen sx={{ fontSize: '180px', color: 'inherit', opacity: 0.7 }} />
                        </Box>
                        <CardContent
                            sx={{
                                minHeight: '180px',
                                position: 'relative',
                                zIndex: 4,
                                padding: 3,
                                backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                                backdropFilter: 'blur(5px)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                variant="h4"
                                className="card-title"
                                data-text={t('dashboard.importData')}
                                sx={{
                                    color: colors.neons.cyan.default,
                                    transition: 'all 0.3s',
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                                    mb: 3,
                                    textAlign: 'center',
                                    fontSize: '1.7rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: '-10px',
                                        left: '25%',
                                        width: '50%',
                                        height: '1px',
                                        background: `linear-gradient(to right, transparent, ${colors.neons.yellow.default}, transparent)`,
                                        boxShadow: `0 0 5px ${colors.neons.yellow.default}`,
                                    },
                                    '&::before': {
                                        content: 'attr(data-text)',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        color: readerMode ? colors.grays.gray900 : colors.neons.blue.default,
                                        opacity: readerMode ? 1 : 0.5,
                                        filter: readerMode ? 'none' : 'blur(1px)',
                                        animation: readerMode ? 'none' : `${severeGlitch} 5s infinite`,
                                        display: 'block',
                                    },
                                    '&:hover::before': {
                                        opacity: readerMode ? 1 : 0.7,
                                    },
                                }}
                            >
                                {t('dashboard.importData')}
                            </Typography>
                            <Typography
                                variant="body1"
                                className="card-description"
                                sx={{
                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                    fontSize: '1.1rem',
                                    textAlign: 'center',
                                    px: 2,
                                    fontWeight: 500,
                                    textShadow: readerMode ? 'none' : '0 0 2px rgba(0,0,0,0.5)',
                                    position: 'relative',
                                    zIndex: 5,
                                    background: 'rgba(10, 15, 30, 0.5)',
                                    borderRadius: '4px',
                                    py: 1,
                                    mx: 'auto',
                                    width: '90%',
                                    border: `1px solid ${colors.neons.green.default}50`,
                                }}
                            >
                                {t('dashboard.importDescription')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                {/* Display Card */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card
                        sx={{
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            height: '100%',
                            border: readerMode
                                ? '1px solid rgba(0, 180, 180, 0.2)'
                                : '1px solid rgba(0, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                        }}
                    >
                        <CardContent
                            sx={{
                                minHeight: '200px',
                                position: 'relative',
                                zIndex: 4,
                                padding: 3,
                                backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                                backdropFilter: 'blur(5px)',
                                height: '100%',
                            }}
                        >
                            <Typography
                                variant="h4"
                                className="card-title"
                                data-text={t('settings.display')}
                                sx={{
                                    color: colors.neons.cyan.default,
                                    transition: 'all 0.3s',
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                                    mb: 3,
                                    textAlign: 'center',
                                    fontSize: '1.7rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: '-10px',
                                        left: '25%',
                                        width: '50%',
                                        height: '1px',
                                        background: `linear-gradient(to right, transparent, ${colors.neons.yellow.default}, transparent)`,
                                        boxShadow: `0 0 5px ${colors.neons.yellow.default}`,
                                    },
                                    '&::before': {
                                        content: 'attr(data-text)',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        color: readerMode ? colors.grays.gray900 : colors.neons.blue.default,
                                        opacity: readerMode ? 1 : 0.5,
                                        filter: readerMode ? 'none' : 'blur(1px)',
                                        animation: readerMode ? 'none' : `${severeGlitch} 5s infinite`,
                                        display: 'block',
                                    },
                                    '&:hover::before': {
                                        opacity: readerMode ? 1 : 0.7,
                                    },
                                }}
                            >
                                {t('settings.display')}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />
                            <Stack direction="column" spacing={2}>
                                <Stack
                                    direction="row"
                                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                                    spacing={2}
                                >
                                    <Typography variant="body1">{t('settings.readerMode')}</Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={!readerMode}
                                                onChange={async () => {
                                                    await toggleReaderMode()
                                                }}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: colors.neons.green.default,
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(25, 220, 140, 0.08)',
                                                        },
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: colors.neons.green.dark,
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray500,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {!readerMode ? 'Enabled' : 'Disabled'}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </Stack>
                                <Stack
                                    direction="row"
                                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                                    spacing={2}
                                >
                                    <Typography variant="body1">{t('settings.enableAnimations')}</Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={animationsEnabled}
                                                onChange={toggleAnimations}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: colors.neons.green.default,
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(25, 220, 140, 0.08)',
                                                        },
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: colors.neons.green.dark,
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray500,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {animationsEnabled ? 'Enabled' : 'Disabled'}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </Stack>
                                <Stack
                                    direction="row"
                                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                                    spacing={2}
                                >
                                    <Typography variant="body1">
                                        {t('settings.enableLoader') || 'Enable Startup Loader'}
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={loaderEnabled}
                                                onChange={async () => {
                                                    await toggleLoader()
                                                }}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: colors.neons.green.default,
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(25, 220, 140, 0.08)',
                                                        },
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: colors.neons.green.dark,
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray500,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {loaderEnabled ? 'Enabled' : 'Disabled'}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* API Keys Card */}
                <Grid size={{ xs: 12, md: 9 }}>
                    <Card
                        sx={{
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            height: '100%',
                            border: readerMode
                                ? '1px solid rgba(0, 180, 180, 0.2)'
                                : '1px solid rgba(0, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                        }}
                    >
                        <CardContent
                            sx={{
                                minHeight: '200px',
                                position: 'relative',
                                zIndex: 4,
                                padding: 3,
                                backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                                backdropFilter: 'blur(5px)',
                                height: '100%',
                            }}
                        >
                            <Typography
                                variant="h4"
                                className="card-title"
                                data-text={t('settings.apiKeys')}
                                sx={{
                                    color: colors.neons.cyan.default,
                                    transition: 'all 0.3s',
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                                    mb: 3,
                                    textAlign: 'center',
                                    fontSize: '1.7rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: '-10px',
                                        left: '25%',
                                        width: '50%',
                                        height: '1px',
                                        background: `linear-gradient(to right, transparent, ${colors.neons.yellow.default}, transparent)`,
                                        boxShadow: `0 0 5px ${colors.neons.yellow.default}`,
                                    },
                                    '&::before': {
                                        content: 'attr(data-text)',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        color: readerMode ? colors.grays.gray900 : colors.neons.blue.default,
                                        opacity: readerMode ? 1 : 0.5,
                                        filter: readerMode ? 'none' : 'blur(1px)',
                                        animation: readerMode ? 'none' : `${severeGlitch} 5s infinite`,
                                        display: 'block',
                                    },
                                    '&:hover::before': {
                                        opacity: readerMode ? 1 : 0.7,
                                    },
                                }}
                            >
                                {t('settings.apiKeys')}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    {t('settings.huggingFaceApiKey')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {t('settings.huggingFaceApiKeyDescription')}
                                </Typography>

                                <TextField
                                    fullWidth
                                    label={t('settings.apiKeyLabel')}
                                    value={huggingFaceApiKey}
                                    onChange={handleHuggingFaceApiKeyChange}
                                    type="password"
                                    variant="outlined"
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            color: readerMode ? '#333' : '#fff',
                                            '& fieldset': {
                                                borderColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.23)'
                                                    : 'rgba(0, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.5)'
                                                    : colors.neons.cyan.default,
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '4px',
                                            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
                                            p: 0.5,
                                            py: 0.25,
                                            border: readerMode
                                                ? '1px solid rgba(0, 0, 0, 0.23)'
                                                : `1px solid ${colors.neons.cyan.default}`,
                                        },
                                        '&:hover .MuiInputLabel-root': {
                                            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
                                        },
                                    }}
                                />

                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    {t('settings.openAIApiKey')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {t('settings.openAIApiKeyDescription')}
                                </Typography>

                                <TextField
                                    fullWidth
                                    label={t('settings.openAIApiKeyLabel')}
                                    value={openAIApiKey}
                                    onChange={handleOpenAIApiKeyChange}
                                    type="password"
                                    variant="outlined"
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            color: readerMode ? '#333' : '#fff',
                                            '& fieldset': {
                                                borderColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.23)'
                                                    : 'rgba(0, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.5)'
                                                    : colors.neons.cyan.default,
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '4px',
                                            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
                                            p: 0.5,
                                            py: 0.25,
                                            border: readerMode
                                                ? '1px solid rgba(0, 0, 0, 0.23)'
                                                : `1px solid ${colors.neons.cyan.default}`,
                                        },
                                        '&:hover .MuiInputLabel-root': {
                                            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
                                        },
                                    }}
                                />

                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    {t('settings.geminiApiKey')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {t('settings.geminiApiKeyDescription')}
                                </Typography>

                                <TextField
                                    fullWidth
                                    label={t('settings.geminiApiKeyLabel')}
                                    value={geminiApiKey}
                                    onChange={handleGeminiApiKeyChange}
                                    type="password"
                                    variant="outlined"
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            color: readerMode ? '#333' : '#fff',
                                            '& fieldset': {
                                                borderColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.23)'
                                                    : 'rgba(0, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: readerMode
                                                    ? 'rgba(0, 0, 0, 0.5)'
                                                    : colors.neons.cyan.default,
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '4px',
                                            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
                                            p: 0.5,
                                            py: 0.25,
                                            border: readerMode
                                                ? '1px solid rgba(0, 0, 0, 0.23)'
                                                : `1px solid ${colors.neons.cyan.default}`,
                                        },
                                        '&:hover .MuiInputLabel-root': {
                                            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
                                        },
                                    }}
                                />

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSaveApiKeys}
                                    sx={{
                                        height: '56px',
                                        position: 'relative',
                                        bgcolor: readerMode ? '#e8f5e8' : 'rgba(20, 40, 30, 0.8)',
                                        borderColor: readerMode ? '#2e7d32' : colors.neons.green.default,
                                        color: readerMode ? '#1b7d2e' : colors.neons.green.default,
                                        textShadow: readerMode ? 'none' : `0 0 8px ${colors.neons.green.light}`,
                                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                        letterSpacing: readerMode ? 'normal' : '0.05em',
                                        overflow: 'hidden',
                                        padding: '6px 16px',
                                        border: readerMode
                                            ? '1px solid #2e7d32'
                                            : `1px solid ${colors.neons.green.default}80`,
                                        transition: 'all 0.3s',
                                        animation: readerMode ? 'none' : `${pulseGlowGreen} 3s infinite`,
                                        boxShadow: readerMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                                        ...(readerMode
                                            ? {
                                                  '&:hover': {
                                                      bgcolor: '#d7edd7',
                                                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                                                      transform: 'translateY(-1px)',
                                                  },
                                                  '&.Mui-disabled': {
                                                      bgcolor: '#f5f5f5',
                                                      color: 'rgba(0, 0, 0, 0.38)',
                                                      border: '1px solid rgba(0, 0, 0, 0.12)',
                                                  },
                                              }
                                            : {
                                                  '&::before': {
                                                      content: '""',
                                                      position: 'absolute',
                                                      top: 0,
                                                      left: 0,
                                                      width: '100%',
                                                      height: '100%',
                                                      opacity: 0.2,
                                                      zIndex: -1,
                                                      background: `linear-gradient(135deg, transparent 0%, ${colors.neons.green.default}50 50%, transparent 100%)`,
                                                      backgroundSize: '200% 200%',
                                                      animation: `${scanlineFlow} 3s ease infinite`,
                                                  },
                                                  '&::after': {
                                                      content: '""',
                                                      position: 'absolute',
                                                      top: 0,
                                                      left: 0,
                                                      width: '100%',
                                                      height: '100%',
                                                      background: 'rgba(0, 255, 0, 0.1)',
                                                      opacity: 0,
                                                      transition: 'all 0.3s',
                                                  },
                                                  '&:hover': {
                                                      backgroundColor: 'rgba(0, 60, 0, 0.6)',
                                                      transform: 'translateY(-2px) scale(1.05)',
                                                      boxShadow: `0 0 15px ${colors.neons.green.default}, inset 0 0 15px ${colors.neons.green.default}30`,
                                                      color: colors.neons.green.light,
                                                      textShadow: `0 0 8px ${colors.neons.green.light}`,
                                                      '&::after': {
                                                          opacity: 0.2,
                                                      },
                                                      '.generate-text': {
                                                          animation: `${buttonGlitch} 0.3s ease both`,
                                                      },
                                                  },
                                              }),
                                    }}
                                >
                                    {t('common.save')}
                                </Button>
                            </Box>

                            <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
                                {t('settings.apiKeySecurityNote')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    )
}

export default SettingsView
