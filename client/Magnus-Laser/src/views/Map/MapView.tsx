import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton.tsx'
import Map from '../../components/common/Map/Map.tsx'
import { WarningDialog } from '../../components/common/WarningDialog.tsx'
import StorageBanner from '../../components/StorageBanner.tsx'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors.ts'
import { ModuleTypes } from '../../utils/constants.ts'
import { clearMapMarkers, CustomMarker, loadMapMarkers } from '../../utils/storage.ts'

const MapView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [isSaving, setIsSaving] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [markers, setMarkers] = useState<CustomMarker[]>([])

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
        <Container maxWidth={false}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={false} />
                    </Box>
                </Stack>
                <Paper
                    sx={{
                        p: 2,
                        height: '100%',
                        width: '100%',
                        bgcolor: colors.neons.cyan.default + '10',
                        border: `1px solid ${colors.neons.cyan.dark}`,
                        borderRadius: 0.5,
                        position: 'relative',
                    }}
                >
                    <Box sx={{ height: 'calc(100% - 0px)', width: '100%', position: 'relative' }}>
                        <Map center={[5150, 3350]} zoom={-4} markers={markers} setIsSaving={setIsSaving} t={t} />
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
