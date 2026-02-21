import { Box, Container, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton.tsx'
import { pulseGlowCyan, pulseGlowBlue } from '../../components/common/Animations'
import Map from '../../components/common/Map/Map.tsx'
import { WarningDialog } from '../../components/common/WarningDialog.tsx'
import StorageBanner from '../../components/StorageBanner.tsx'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors.ts'
import { ModuleTypes } from '../../utils/constants.ts'
import { clearMapMarkers, CustomMarker, loadMapMarkers } from '../../utils/storage.ts'

export type MapMode = 'red' | '2077'

const MapView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [isSaving, setIsSaving] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [markers, setMarkers] = useState<CustomMarker[]>([])
    const [mapMode, setMapMode] = useState<MapMode>('red')

    // Load markers on component mount
    useEffect(() => {
        loadMapMarkers().then((loadedMarkers) => {
            if (loadedMarkers) {
                setMarkers(loadedMarkers)
            }
        })
    }, [])

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearAllConfirm = async () => {
        await clearMapMarkers()
        setMarkers([])
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Box sx={{ p: 0, height: 'calc(100vh - 184px)', width: '100%', position: 'relative' }}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                    <Stack>
                        <Typography
                            variant="h3"
                            className="glitch-text"
                            data-text={t(`map.title`)}
                            sx={{
                                color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                flexGrow: 1,
                            }}
                        >
                            {t(`map.title`)}
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                                textShadow: `0 0 8px ${colors.neons.green.default}`,
                                mb: 1,
                            }}
                        >
                            {t(`modules.${ModuleTypes.MAP}_DESCRIPTION`)}
                        </Typography>
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ToggleButtonGroup
                            value={mapMode}
                            exclusive
                            onChange={(_e, value) => { if (value) setMapMode(value) }}
                            sx={{
                                background: readerMode ? '#f5f5f5' : 'rgba(0, 20, 40, 0.7)',
                                p: '2px',
                                border: readerMode
                                    ? `1px solid ${mapMode === 'red' ? colors.neons.cyan.default : colors.neons.blue.default}`
                                    : `1px solid ${mapMode === 'red' ? 'rgba(0, 200, 255, 0.3)' : 'rgba(0, 100, 255, 0.3)'}`,
                                borderRadius: '3px',
                                boxShadow: readerMode
                                    ? 'none'
                                    : mapMode === 'red'
                                    ? '0 0 10px rgba(0, 200, 255, 0.2)'
                                    : '0 0 10px rgba(0, 100, 255, 0.2)',
                                animation: readerMode
                                    ? 'none'
                                    : mapMode === 'red'
                                    ? `${pulseGlowCyan} 4s infinite`
                                    : `${pulseGlowBlue} 4s infinite`,
                                '& .MuiToggleButtonGroup-grouped': {
                                    border: 'none',
                                    borderRadius: '2px',
                                    '&:not(:first-of-type)': { borderLeft: 'none', marginLeft: '2px' },
                                },
                            }}
                        >
                            <ToggleButton
                                value="red"
                                sx={{
                                    color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.dark,
                                    bgcolor: 'transparent',
                                    border: 'none',
                                    px: 2, py: 0.5,
                                    letterSpacing: '1px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                    transition: 'all 0.3s',
                                    '&.Mui-selected': readerMode
                                        ? { bgcolor: colors.neons.cyan.light, color: colors.neons.cyan.dark }
                                        : {
                                            bgcolor: 'rgba(0, 40, 50, 0.9)',
                                            color: '#FFFFFF',
                                            boxShadow: `inset 0 0 10px ${colors.neons.cyan.default}40, 0 0 8px ${colors.neons.cyan.default}80`,
                                            textShadow: `0 0 8px ${colors.neons.cyan.default}, 0 0 15px ${colors.neons.cyan.default}`,
                                            '&:hover': { bgcolor: 'rgba(0, 50, 60, 0.95)' },
                                        },
                                    '&:hover': readerMode
                                        ? { bgcolor: colors.neons.cyan.light, color: colors.neons.cyan.dark }
                                        : { bgcolor: 'rgba(0, 30, 40, 0.7)', color: '#FFFFFF' },
                                    height: 32,
                                }}
                            >
                                RED
                            </ToggleButton>
                            <ToggleButton
                                value="2077"
                                sx={{
                                    color: readerMode ? colors.neons.blue.dark : colors.neons.blue.dark,
                                    bgcolor: 'transparent',
                                    border: 'none',
                                    px: 2, py: 0.5,
                                    letterSpacing: '1px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.blue.dark}`,
                                    transition: 'all 0.3s',
                                    '&.Mui-selected': readerMode
                                        ? { bgcolor: colors.neons.blue.light, color: colors.neons.blue.dark }
                                        : {
                                            bgcolor: 'rgba(0, 30, 50, 0.9)',
                                            color: '#FFFFFF',
                                            boxShadow: `inset 0 0 10px ${colors.neons.blue.default}40, 0 0 8px ${colors.neons.blue.default}80`,
                                            textShadow: `0 0 8px ${colors.neons.blue.default}, 0 0 15px ${colors.neons.blue.default}`,
                                            '&:hover': { bgcolor: 'rgba(0, 40, 60, 0.95)' },
                                        },
                                    '&:hover': readerMode
                                        ? { bgcolor: colors.neons.blue.light, color: colors.neons.blue.dark }
                                        : { bgcolor: 'rgba(0, 20, 40, 0.7)', color: '#FFFFFF' },
                                    height: 32,
                                }}
                            >
                                2077
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={false} />
                    </Box>
                </Stack>
                <Paper
                    sx={{
                        p: 0,
                        height: 'calc(100vh - 197px)',
                        width: '100%',
                        bgcolor: colors.neons.cyan.default + '10',
                        border: `1px solid ${colors.neons.cyan.dark}`,
                        borderRadius: 0.5,
                        position: 'relative',
                    }}
                >
                    <Box sx={{ height: 'calc(100% - 0px)', width: '100%', position: 'relative' }}>
                        <Map
                            center={mapMode === 'red' ? [5150, 3350] : [0.0, 0.0]}
                            zoom={mapMode === 'red' ? -4 : 14}
                            markers={markers}
                            setIsSaving={setIsSaving}
                            t={t}
                            mapMode={mapMode}
                        />
                    </Box>
                </Paper>
            </Box>
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={() => setClearAllDialogOpen(false)}
                onConfirm={handleClearAllConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage')}
                moduleType={ModuleTypes.MAP}
                isDelete={true}
                isClearAll={true}
            />
        </Container>
    )
}

export default MapView
