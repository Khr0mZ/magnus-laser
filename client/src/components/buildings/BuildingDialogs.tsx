import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import colors from '../../utils/colors'

type DeleteBuildingDialogProps = {
    open: boolean
    onClose: () => void
    onConfirm: () => void
}

export const DeleteBuildingDialog = ({ open, onClose, onConfirm }: DeleteBuildingDialogProps) => {
    const { t } = useTranslation()

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(10, 15, 30, 0.95)',
                    backdropFilter: 'blur(4px)',
                    border: `1px solid ${colors.neons.red.default}40`,
                    boxShadow: `0 0 20px ${colors.neons.red.default}40`,
                    color: '#fff',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage:
                            'linear-gradient(to right, rgba(255, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 0, 0.03) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        pointerEvents: 'none',
                        opacity: 0.5,
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    color: colors.neons.red.default,
                    textShadow: `0 0 5px ${colors.neons.red.default}`,
                    fontFamily: '"Orbitron", monospace',
                    borderBottom: `1px solid ${colors.neons.red.default}40`,
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        width: '80%',
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                    },
                }}
            >
                {t('buildings.deleteConfirmation.title', 'Confirm Deletion')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    sx={{
                        color: '#ddd',
                        mt: 2,
                        fontFamily: '"Rajdhani", sans-serif',
                    }}
                >
                    {t(
                        'buildings.deleteConfirmation.message',
                        'Are you sure you want to delete this building? This action cannot be undone.'
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        bgcolor: 'rgba(10, 20, 30, 0.6)',
                        color: colors.neons.cyan.default,
                        border: `1px solid ${colors.neons.cyan.default}40`,
                        '&:hover': {
                            bgcolor: 'rgba(0, 30, 60, 0.8)',
                            boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                        },
                    }}
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={onConfirm}
                    autoFocus
                    sx={{
                        bgcolor: 'rgba(40, 0, 0, 0.6)',
                        color: colors.neons.red.default,
                        border: `1px solid ${colors.neons.red.default}40`,
                        '&:hover': {
                            bgcolor: 'rgba(60, 0, 0, 0.8)',
                            color: colors.neons.red.light,
                            boxShadow: `0 0 10px ${colors.neons.red.default}60`,
                            textShadow: `0 0 5px ${colors.neons.red.default}`,
                            border: `1px solid ${colors.neons.red.default}70`,
                        },
                    }}
                >
                    {t('common.delete', 'Delete')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

type ClearAllBuildingsDialogProps = {
    open: boolean
    onClose: () => void
    onConfirm: () => void
}

export const ClearAllBuildingsDialog = ({ open, onClose, onConfirm }: ClearAllBuildingsDialogProps) => {
    const { t } = useTranslation()

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(10, 15, 30, 0.95)',
                    backdropFilter: 'blur(4px)',
                    border: `1px solid ${colors.neons.red.default}40`,
                    boxShadow: `0 0 20px ${colors.neons.red.default}40`,
                    color: '#fff',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage:
                            'linear-gradient(to right, rgba(255, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 0, 0.03) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        pointerEvents: 'none',
                        opacity: 0.5,
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    color: colors.neons.red.default,
                    textShadow: `0 0 5px ${colors.neons.red.default}`,
                    fontFamily: '"Orbitron", monospace',
                    borderBottom: `1px solid ${colors.neons.red.default}40`,
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        width: '80%',
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                    },
                }}
            >
                {t('buildings.clearConfirmation.title', 'Confirm Clear All')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    sx={{
                        color: '#ddd',
                        mt: 2,
                        fontFamily: '"Rajdhani", sans-serif',
                    }}
                >
                    {t(
                        'buildings.clearConfirmation.message',
                        'Are you sure you want to clear all buildings? This action cannot be undone.'
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        bgcolor: 'rgba(10, 20, 30, 0.6)',
                        color: colors.neons.cyan.default,
                        border: `1px solid ${colors.neons.cyan.default}40`,
                        '&:hover': {
                            bgcolor: 'rgba(0, 30, 60, 0.8)',
                            boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                        },
                    }}
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={onConfirm}
                    autoFocus
                    sx={{
                        bgcolor: 'rgba(40, 0, 0, 0.6)',
                        color: colors.neons.red.default,
                        border: `1px solid ${colors.neons.red.default}40`,
                        '&:hover': {
                            bgcolor: 'rgba(60, 0, 0, 0.8)',
                            color: colors.neons.red.light,
                            boxShadow: `0 0 10px ${colors.neons.red.default}60`,
                            textShadow: `0 0 5px ${colors.neons.red.default}`,
                            border: `1px solid ${colors.neons.red.default}70`,
                        },
                    }}
                >
                    {t('common.clearAll', 'Clear All')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
