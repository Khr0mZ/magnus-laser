import { FolderOpen, Save, SaveAlt, UploadFile } from '@mui/icons-material'
import { Alert, Box, Button, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useContext } from 'react'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { notifyDataImported } from '../../utils/storage'
import { glitch } from '../common/Animations.tsx'

// Storage keys used in the application for module data
// Note: User settings like view preferences and reader mode are deliberately excluded
const APP_STORAGE_KEYS = [
    'magnus-laser-gangs',
    'magnus-laser-buildings',
    // Add other module-related data keys here as needed
]

interface DataButtonProps {
    type: 'export' | 'import'
}

const DataButton = ({ type }: DataButtonProps): JSX.Element => {
    const { readerMode } = useContext(ReaderModeContext)
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()

    // Function to handle data export
    const handleExport = () => {
        try {
            const data: Record<string, any> = {}

            // Only export keys related to our application modules
            for (const key of APP_STORAGE_KEYS) {
                const value = localStorage.getItem(key)
                if (value) {
                    try {
                        data[key] = JSON.parse(value)
                    } catch {
                        // If parsing fails, store as string
                        data[key] = value
                    }
                }
            }

            // Create a JSON file to download
            const fileName = `cyber-manager-data-${new Date().toISOString().split('T')[0]}.json`
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
                            <SaveAlt sx={{ mr: 1 }} />
                            <Typography variant="body2">Data exported successfully</Typography>
                        </Box>
                    </Alert>
                ),
            })
        } catch (error) {
            console.error('Failed to export data:', error)

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

    // Function to handle data import
    const handleImport = () => {
        try {
            // Create file input element
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'application/json'

            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return

                const reader = new FileReader()
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target?.result as string)

                        // Only import keys related to our application modules
                        let importedItems = 0
                        for (const key of Object.keys(data)) {
                            if (APP_STORAGE_KEYS.includes(key)) {
                                localStorage.setItem(key, JSON.stringify(data[key]))
                                importedItems++
                            }
                        }

                        // Show success notification and notify components instead of reloading
                        if (importedItems > 0) {
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
                                            <UploadFile sx={{ mr: 1 }} />
                                            <Typography variant="body2">{`Imported ${importedItems} items successfully`}</Typography>
                                        </Box>
                                    </Alert>
                                ),
                            })

                            // Notify components about data changes
                            notifyDataImported()
                        } else {
                            // Show warning notification if no items were imported
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
                                            <Typography variant="body2">
                                                No application data found in import file
                                            </Typography>
                                        </Box>
                                    </Alert>
                                ),
                            })
                        }
                    } catch (error) {
                        console.error('Failed to parse import file:', error)

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
            console.error('Failed to import data:', error)

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

    const handleClick = type === 'export' ? handleExport : handleImport
    const Icon = type === 'export' ? Save : FolderOpen
    const label = type === 'export' ? 'Export' : 'Import'
    const color = type === 'export' ? colors.neons.green : colors.neons.blue

    return (
        <Button
            size={'large'}
            disableRipple
            disableFocusRipple
            onClick={handleClick}
            sx={{
                padding: '12px 16px',
                minWidth: '70px',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                ...(readerMode
                    ? {
                          // Reader mode button style
                          color: '#555',
                          '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              '& svg': {
                                  transform: 'scale(1.1)',
                              },
                          },
                          '& svg': {
                              transition: 'transform 0.2s',
                              width: 24,
                              height: 24,
                          },
                      }
                    : {
                          // Cyberpunk button style
                          color: color.default,
                          '&:hover': {
                              backgroundColor: `rgba(${type === 'export' ? '0, 255, 0' : '0, 0, 255'}, 0.1)`,
                              '& svg': {
                                  filter: `drop-shadow(0 0 5px ${color.default})`,
                                  animation: `${glitch} 1s ease infinite alternate`,
                              },
                              '&::after': {
                                  opacity: 1,
                                  width: '100%',
                              },
                          },
                          '& svg': {
                              filter: `drop-shadow(0 0 2px ${color.dark})`,
                              width: 24,
                              height: 24,
                          },
                          transition: 'all 0.3s',
                          position: 'relative',
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '0%',
                              height: '2px',
                              backgroundColor: color.default,
                              boxShadow: `0 0 10px ${color.default}`,
                              opacity: 0,
                              transition: 'all 0.3s ease-out',
                          },
                      }),
            }}
        >
            <Icon />
            <Typography
                variant="caption"
                sx={{
                    mt: 0.5,
                    ...(readerMode
                        ? {}
                        : {
                              fontFamily: '"Orbitron", "Rajdhani", "Lexend", sans-serif',
                              textTransform: 'uppercase',
                          }),
                }}
            >
                {label}
            </Typography>
        </Button>
    )
}

export { APP_STORAGE_KEYS, DataButton }
