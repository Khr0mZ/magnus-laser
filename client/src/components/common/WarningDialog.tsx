import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { ReactNode, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'

type WarningDialogProps = {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string | ReactNode
    confirmText?: string
    cancelText?: string
    confirmColor?: 'red' | 'cyan' | 'green' | 'blue'
    moduleType?: ModuleTypes
    isDelete?: boolean
    isClearAll?: boolean
}

export const WarningDialog = (props: WarningDialogProps) => {
    const {
        open,
        onClose,
        onConfirm,
        title,
        message,
        confirmText,
        cancelText,
        confirmColor = 'red',
        moduleType,
        isDelete = false,
        isClearAll = false,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    // For backward compatibility with existing delete functionality
    const resolvedTitle = isDelete
        ? isClearAll
            ? t(`common.clearAllConfirmTitle`)
            : t(`common.deleteConfirmTitle`)
        : title

    const resolvedMessage = isDelete
        ? isClearAll
            ? t(`common.clearAllConfirmMessage`, { type: moduleType ? t(`modules.${moduleType}`).toLowerCase() : '' })
            : t(`common.deleteConfirmMessage`, { type: moduleType ? t(`modules.${moduleType}`).toLowerCase() : '' })
        : message

    const resolvedConfirmText =
        confirmText || (isDelete ? t('common.delete', 'Delete') : t('common.confirm', 'Confirm'))
    const resolvedCancelText = cancelText || t('common.cancel', 'Cancel')

    // Get the appropriate color based on confirmColor prop
    const colorMap = {
        red: colors.neons.red,
        cyan: colors.neons.cyan,
        green: colors.neons.green,
        blue: colors.neons.blue,
    }

    const color = colorMap[confirmColor]

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
                          border: `1px solid ${color.default}40`,
                          boxShadow: `0 0 20px ${color.default}40`,
                          color: '#fff',
                          position: 'relative',
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              backgroundImage: `linear-gradient(to right, rgba(${
                                  confirmColor === 'red'
                                      ? '255, 0, 0'
                                      : confirmColor === 'green'
                                      ? '0, 255, 0'
                                      : confirmColor === 'blue'
                                      ? '0, 0, 255'
                                      : '0, 255, 255'
                              }, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(${
                                  confirmColor === 'red'
                                      ? '255, 0, 0'
                                      : confirmColor === 'green'
                                      ? '0, 255, 0'
                                      : confirmColor === 'blue'
                                      ? '0, 0, 255'
                                      : '0, 255, 255'
                              }, 0.03) 1px, transparent 1px)`,
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
                              color:
                                  confirmColor === 'red'
                                      ? '#d32f2f'
                                      : confirmColor === 'green'
                                      ? '#2e7d32'
                                      : confirmColor === 'blue'
                                      ? '#1976d2'
                                      : '#0097a7',
                              borderBottom: '1px solid #eee',
                          }
                        : {
                              color: color.default,
                              textShadow: `0 0 5px ${color.default}`,
                              fontFamily: '"Orbitron", monospace',
                              borderBottom: `1px solid ${color.default}40`,
                              position: 'relative',
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '10%',
                                  width: '80%',
                                  height: '1px',
                                  background: `linear-gradient(90deg, transparent, ${color.default}, transparent)`,
                              },
                          }
                }
            >
                {resolvedTitle}
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
                    {resolvedMessage}
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
                    {resolvedCancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    autoFocus
                    sx={
                        readerMode
                            ? {
                                  color:
                                      confirmColor === 'red'
                                          ? '#d32f2f'
                                          : confirmColor === 'green'
                                          ? '#2e7d32'
                                          : confirmColor === 'blue'
                                          ? '#1976d2'
                                          : '#0097a7',
                              }
                            : {
                                  bgcolor:
                                      confirmColor === 'red'
                                          ? 'rgba(40, 0, 0, 0.6)'
                                          : confirmColor === 'green'
                                          ? 'rgba(0, 40, 0, 0.6)'
                                          : confirmColor === 'blue'
                                          ? 'rgba(0, 0, 40, 0.6)'
                                          : 'rgba(0, 40, 40, 0.6)',
                                  color: color.default,
                                  border: `1px solid ${color.default}40`,
                                  '&:hover': {
                                      bgcolor:
                                          confirmColor === 'red'
                                              ? 'rgba(60, 0, 0, 0.8)'
                                              : confirmColor === 'green'
                                              ? 'rgba(0, 60, 0, 0.8)'
                                              : confirmColor === 'blue'
                                              ? 'rgba(0, 0, 60, 0.8)'
                                              : 'rgba(0, 60, 60, 0.8)',
                                      color: color.light,
                                      boxShadow: `0 0 10px ${color.default}60`,
                                      textShadow: `0 0 5px ${color.default}`,
                                      border: `1px solid ${color.default}70`,
                                  },
                              }
                    }
                >
                    {resolvedConfirmText}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
