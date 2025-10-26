import { useUserPreferences } from '@/contexts/userPreferencesHooks'
import { Box, Dialog, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface ImageDialogProps {
    image: string
    onClose: () => void
}

const ImageDialog = (props: ImageDialogProps) => {
    const { image, onClose } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    return (
        <Dialog
            open={image !== ''}
            onClose={onClose}
            maxWidth={false}
            fullScreen
            aria-labelledby="fullscreen-image-title"
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                    },
                },
            }}
            onClick={onClose}
            keepMounted={false}
            disablePortal={false}
            disableEnforceFocus={false}
            disableAutoFocus={false}
        >
            <Box
                sx={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 0,
                    margin: 0,
                    position: 'relative',
                    overflowY: 'hidden',
                    '&::after': !readerMode
                        ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.9) 100%)',
                              pointerEvents: 'none',
                              zIndex: 1,
                          }
                        : {},
                }}
            >
                <Box
                    component="img"
                    src={image}
                    alt={t('common.itemImageAlt', { name: 'token' })}
                    id="fullscreen-image-title"
                    tabIndex={0}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        position: 'absolute',
                        padding: 0,
                        top: 0,
                        left: 0,
                    }}
                />
            </Box>
            <Typography
                variant="caption"
                sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: readerMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                    zIndex: 10,
                    textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                    padding: '8px 16px',
                    backdropFilter: 'blur(5px)',
                    backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                    margin: '0 auto',
                    width: 'fit-content',
                    borderRadius: '4px',
                }}
            >
                {t('common.clickToClose')}
            </Typography>
        </Dialog>
    )
}

export default ImageDialog
