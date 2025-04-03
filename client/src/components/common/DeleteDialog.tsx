import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'

type DeleteDialogProps = {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    moduleType: ModuleTypes
    isClearAll: boolean
}
export const DeleteDialog = (props: DeleteDialogProps) => {
    const { open, onClose, onConfirm, moduleType, isClearAll } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    const title = isClearAll ? t(`common.clearAllConfirmTitle`) : t(`common.deleteConfirmTitle`)
    const message = isClearAll
        ? t(`common.clearAllConfirmMessage`, { type: t(`modules.${moduleType}`).toLowerCase() })
        : t(`common.deleteConfirmMessage`, { type: t(`modules.${moduleType}`).toLowerCase() })

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: readerMode
                    ? {
                          bgcolor: '#ffffff',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                          color: '#333',
                      }
                    : {
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
                sx={
                    readerMode
                        ? {
                              color: '#d32f2f',
                              borderBottom: '1px solid #eee',
                          }
                        : {
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
                          }
                }
            >
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    sx={
                        readerMode
                            ? {
                                  color: '#666',
                                  mt: 2,
                              }
                            : {
                                  color: '#ddd',
                                  mt: 2,
                                  fontFamily: '"Rajdhani", sans-serif',
                              }
                    }
                >
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    sx={
                        readerMode
                            ? {
                                  color: '#0288d1',
                              }
                            : {
                                  bgcolor: 'rgba(10, 20, 30, 0.6)',
                                  color: colors.neons.cyan.default,
                                  border: `1px solid ${colors.neons.cyan.default}40`,
                                  '&:hover': {
                                      bgcolor: 'rgba(0, 30, 60, 0.8)',
                                      boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                  },
                              }
                    }
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={onConfirm}
                    autoFocus
                    sx={
                        readerMode
                            ? {
                                  color: '#d32f2f',
                              }
                            : {
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
                              }
                    }
                >
                    {t('common.delete', 'Delete')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
