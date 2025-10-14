import FlagIcon from '@mui/icons-material/Flag'
import SaveIcon from '@mui/icons-material/Save'
import { Alert, Box, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface StorageBannerProps {
    isSaving?: boolean
    onSavingDone?: () => void
    roundCompleteRound?: number | null
    onRoundCompleteDone?: () => void
}

const StorageBanner = ({
    isSaving = false,
    onSavingDone,
    roundCompleteRound = null,
    onRoundCompleteDone,
}: StorageBannerProps) => {
    const { t } = useTranslation()
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()

    // Show save banner when isSaving is true
    useEffect(() => {
        if (isSaving) {
            const key = enqueueSnackbar('', {
                variant: 'success',
                persist: false,
                autoHideDuration: 2000,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                content: (key) => (
                    <Alert
                        severity="success"
                        sx={{
                            bgcolor: 'rgba(10, 15, 30, 0.9)',
                            color: '#fff',
                            borderLeft: '4px solid',
                            borderColor: 'success.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}
                        onClose={() => {
                            closeSnackbar(key)
                            if (onSavingDone) onSavingDone()
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SaveIcon sx={{ mr: 1 }} />
                            <Typography variant="body2">{t('common.dataSavedToLocalStorage')}</Typography>
                        </Box>
                    </Alert>
                ),
            })

            // Set a timeout to auto-close and call onSavingDone
            setTimeout(() => {
                closeSnackbar(key)
                if (onSavingDone) onSavingDone()
            }, 2000)
        }
    }, [isSaving, enqueueSnackbar, closeSnackbar, t, onSavingDone])

    // Show round complete banner when roundCompleteRound is provided
    useEffect(() => {
        if (roundCompleteRound !== null && roundCompleteRound !== undefined) {
            const key = enqueueSnackbar('', {
                variant: 'info',
                persist: false,
                autoHideDuration: 2000,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                content: (key) => (
                    <Alert
                        severity="info"
                        sx={{
                            bgcolor: 'rgba(10, 15, 30, 0.9)',
                            color: '#fff',
                            borderLeft: '4px solid',
                            borderColor: 'info.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}
                        onClose={() => {
                            closeSnackbar(key)
                            if (onRoundCompleteDone) onRoundCompleteDone()
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FlagIcon sx={{ mr: 1 }} />
                            <Typography variant="body2">
                                {t('combatSim.roundComplete', { round: roundCompleteRound })}
                            </Typography>
                        </Box>
                    </Alert>
                ),
            })

            setTimeout(() => {
                closeSnackbar(key)
                if (onRoundCompleteDone) onRoundCompleteDone()
            }, 2000)
        }
    }, [roundCompleteRound, enqueueSnackbar, closeSnackbar, t, onRoundCompleteDone])

    // Component doesn't render anything directly - notifications are handled by notistack
    return null
}

export default StorageBanner
