import { FolderOpen, Save, SaveAlt, UploadFile } from '@mui/icons-material'
import { Alert, Box, Card, CardContent, Container, Grid, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useSnackbar } from 'notistack'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
    flicker,
    glitch,
    neonColorCycle,
    neonPulse,
    pulseGlowCyan,
    severeGlitch,
} from '../../components/common/Animations.tsx'
import { WarningDialog } from '../../components/common/WarningDialog'
import { ReaderModeContext } from '../../contexts/ReaderModeContext.tsx'
import NavigationPaths from '../../navigation.ts'
import colors from '../../utils/colors.ts'
import { ModuleTypes } from '../../utils/constants'
import { APP_STORAGE_KEYS } from '../../utils/constants.ts'
import { getModuleIcon } from '../../utils/functions.tsx'
import { notifyDataImported } from '../../utils/storage'

const Dashboard = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    useDocumentTitle(`Magnus Laser - ${t('modules.DASHBOARD')}`)

    // Function to handle data export
    const handleExport = () => {
        try {
            const data: Record<string, unknown> = {}

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

    return (
        <Container maxWidth={false}>
            {/* Import Warning Dialog */}
            <WarningDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onConfirm={handleImportConfirmed}
                title={t('dashboard.importData')}
                message={t('dashboard.importDescriptionWarning')}
                confirmText={t('dashboard.confirmImport', 'Import')}
            />

            <Box
                sx={{
                    position: 'relative',
                    mb: 4,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-10px',
                        left: 0,
                        width: '100%',
                        height: '1px',
                    },
                }}
            >
                <Typography
                    variant="h1"
                    className="glitch-text"
                    data-text={t('modules.DASHBOARD')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    }}
                >
                    {t('modules.DASHBOARD')}
                </Typography>
                <Typography
                    variant="h2"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                        textShadow: `0 0 8px ${colors.neons.green.default}`,
                    }}
                >
                    {t('dashboard.welcome')}
                </Typography>
                <Typography
                    variant="h3"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.grays.gray700,
                        mt: 1,
                    }}
                >
                    {t('dashboard.description')}
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 3 }}>
                {/* Export Data Card */}
                <Grid item xs={6} md={3} lg={3} xl={3} xxl={2}>
                    <Card
                        onClick={handleExport}
                        sx={{
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            height: '100%',
                            animation: readerMode ? 'none' : `${pulseGlowCyan} 2s infinite`,
                            border: readerMode
                                ? '1px solid rgba(0, 180, 180, 0.2)'
                                : '1px solid rgba(0, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: readerMode ? '0 0 15px rgba(0, 80, 80, 0.1)' : '0 0 15px rgba(0, 255, 255, 0.1)',
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                animation: `${neonPulse} 2s infinite`,
                                cursor: 'pointer',
                                '& .card-icon': {
                                    opacity: 0.4,
                                    filter: `drop-shadow(0 0 ${readerMode ? '10px' : '20px'} ${
                                        colors.neons.green.default
                                    })`,
                                    animation: `${flicker} 4s infinite, ${neonColorCycle} 5s infinite`,
                                },
                                '& .card-title': {
                                    animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                                    color: colors.neons.green.default,
                                    textShadow: `0 0 10px ${colors.neons.green.default}, 0 0 15px rgba(0,0,0,0.5)`,
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
                                '& svg': {
                                    width: '60%',
                                    height: '60%',
                                },
                            }}
                        >
                            <Save fontSize="large" />
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
                                variant="h5"
                                className="card-title"
                                sx={{
                                    color: colors.neons.green.default,
                                    textShadow: `0 0 5px ${colors.neons.green.default}`,
                                    mb: 2,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {t('dashboard.exportData')}
                            </Typography>
                            <Typography
                                variant="body1"
                                className="card-description"
                                sx={{
                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                    fontSize: '1rem',
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
                <Grid item xs={6} md={3} lg={3} xl={3} xxl={2}>
                    <Card
                        onClick={handleImportClick}
                        sx={{
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            height: '100%',
                            animation: readerMode ? 'none' : `${pulseGlowCyan} 2s infinite`,
                            border: readerMode
                                ? '1px solid rgba(0, 180, 180, 0.2)'
                                : '1px solid rgba(0, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: readerMode ? '0 0 15px rgba(0, 80, 80, 0.1)' : '0 0 15px rgba(0, 255, 255, 0.1)',
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                animation: `${neonPulse} 2s infinite`,
                                cursor: 'pointer',
                                '& .card-icon': {
                                    opacity: 0.4,
                                    filter: `drop-shadow(0 0 ${readerMode ? '10px' : '20px'} ${
                                        colors.neons.blue.default
                                    })`,
                                    animation: `${flicker} 4s infinite, ${neonColorCycle} 5s infinite`,
                                },
                                '& .card-title': {
                                    animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                                    color: colors.neons.blue.default,
                                    textShadow: `0 0 10px ${colors.neons.blue.default}, 0 0 15px rgba(0,0,0,0.5)`,
                                    fontWeight: 700,
                                },
                                '& .card-description': {
                                    color: readerMode ? colors.neons.blue.dark : colors.neons.blue.light,
                                    textShadow: readerMode
                                        ? `0 0 3px ${colors.neons.blue.light}, 0 0 5px rgba(0,0,0,0.2)`
                                        : `0 0 3px ${colors.neons.blue.dark}, 0 0 5px rgba(0,0,0,0.9)`,
                                    fontWeight: 600,
                                    animation: `${neonColorCycle} 8s linear infinite`,
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
                                '& svg': {
                                    width: '60%',
                                    height: '60%',
                                },
                            }}
                        >
                            <FolderOpen fontSize="large" />
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
                                variant="h5"
                                className="card-title"
                                sx={{
                                    color: colors.neons.blue.default,
                                    textShadow: `0 0 5px ${colors.neons.blue.default}`,
                                    mb: 2,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {t('dashboard.importData')}
                            </Typography>
                            <Typography
                                variant="body1"
                                className="card-description"
                                sx={{
                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                    fontSize: '1rem',
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
                                    border: `1px solid ${colors.neons.blue.default}50`,
                                }}
                            >
                                {t('dashboard.importDescription')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Module Cards */}
                {Object.values(ModuleTypes).map((module) => (
                    <Grid item xs={12} md={6} lg={6} xl={6} xxl={4} key={module}>
                        <Card
                            onClick={() => {
                                navigate(NavigationPaths[module])
                            }}
                            sx={{
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                height: '100%',
                                animation: readerMode ? 'none' : `${pulseGlowCyan} 2s infinite`,
                                border: readerMode
                                    ? '1px solid rgba(0, 180, 180, 0.2)'
                                    : '1px solid rgba(0, 255, 255, 0.2)',
                                backdropFilter: 'blur(5px)',
                                boxShadow: readerMode
                                    ? '0 0 15px rgba(0, 80, 80, 0.1)'
                                    : '0 0 15px rgba(0, 255, 255, 0.1)',
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
                                {getModuleIcon(module, false, false)}
                            </Box>
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
                                    data-text={t(`modules.${module}`)}
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
                                    {t(`modules.${module}`)}
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
                                    {t('dashboard.createRandom', { module: t(`modules.${module}`).toLowerCase() })}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    className="card-subdescription"
                                    sx={{
                                        mt: 3,
                                        fontSize: '1rem',
                                        textAlign: 'center',
                                        px: 2,
                                        position: 'relative',
                                        zIndex: 5,
                                        fontWeight: 400,
                                        letterSpacing: '0.03em',
                                        py: 1,
                                        backdropFilter: 'blur(3px)',
                                        border: `1px solid ${colors.neons.cyan.default}50`,
                                    }}
                                >
                                    {module === ModuleTypes.GANG && t('dashboard.gangDescription')}
                                    {module === ModuleTypes.BUILDING && t('dashboard.buildingDescription')}
                                    {module === ModuleTypes.CORPORATION && t('dashboard.corporationDescription')}
                                    {module === ModuleTypes.FIXER_JOB && t('dashboard.fixerJobDescription')}
                                    {module === ModuleTypes.NPC && t('dashboard.npcDescription')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    )
}

export default Dashboard
