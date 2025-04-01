import SaveIcon from '@mui/icons-material/Save'
import { Alert, Box, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface StorageBannerProps {
    isSaving?: boolean
    onSavingDone?: () => void
}

const StorageBanner = ({ isSaving = false, onSavingDone }: StorageBannerProps) => {
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

    // Component doesn't render anything directly - notifications are handled by notistack
    return null
}

export default StorageBanner
