import { Box, Button, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonGlitch, pulseGlowGreen, pulseGlowRed, scanlineFlow } from '../../components/common/Animations'
import EditDialog from '../../components/common/EditDialog'
import GridView from '../../components/common/GridView'
import TableView from '../../components/common/TableView'
import ViewToggle from '../../components/common/ViewToggle'
import { WarningDialog } from '../../components/common/WarningDialog'
import StorageBanner from '../../components/StorageBanner'
import { useData } from '../../contexts/dataHooks'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { ViewPreferencesContext } from '../../contexts/ViewPreferencesContext'
import { Building, Gang } from '../../graphql/types'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { generateRandomGang } from '../../utils/generatorGang'
import { clearGangs, saveGangs, saveViewPreference } from '../../utils/storage'

// Add window.gangsDataLoaded declaration
declare global {
    interface Window {
        gangsDataLoaded?: boolean
    }
}

const GangView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.GANG')}`)
    const { readerMode } = useContext(ReaderModeContext)
    const { viewPreferences, viewPrefsLoaded, updateViewPreference } = useContext(ViewPreferencesContext)
    const { gangs: dataGangs, setGangs: setDataGangs, isLoading } = useData()
    const [gangs, setGangs] = useState<Gang[]>([])

    // Use view preference from context
    const [compactView, setCompactView] = useState(() => {
        return viewPrefsLoaded ? viewPreferences[ModuleTypes.GANG] : false
    })

    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [gangToDelete, setGangToDelete] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [gangToEdit, setGangToEdit] = useState<Gang | null>(null)
    const prevGangsRef = useRef<number>(0)
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.GANG])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        if (dataGangs.length > 0) {
            setGangs(dataGangs)
            prevGangsRef.current = dataGangs.length
        }
    }, [dataGangs])

    // Save gangs to storage when they change in local state
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Always save the data when it exists
        if (gangs.length > 0) {
            saveGangs(gangs as Gang[])
            setDataGangs(gangs) // Update context data
        }

        // Update length reference
        prevGangsRef.current = gangs.length
    }, [gangs, setDataGangs])

    const handleGenerateGang = async () => {
        setIsGenerating(true)
        try {
            const newGang = await generateRandomGang(t)
            setGangs((prevGangs) => [newGang, ...prevGangs])
            setIsSaving(true)
        } catch (error) {
            console.error('Failed to generate gang:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = async () => {
        setGangs([])
        await clearGangs()
        setDataGangs([]) // Update context data
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setGangToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (gangToDelete !== null) {
            setGangs((prevGangs) => prevGangs.filter((_, i) => i !== gangToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setGangToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setGangToDelete(null)
    }

    const handleEditClick = (index: number) => {
        setGangToEdit(gangs[index])
        setEditDialogOpen(true)
    }

    const handleEditSave = (editedItem: Gang) => {
        setGangs((prevGangs) => prevGangs.map((gang) => (gang.ID === editedItem.ID ? editedItem : gang)))
        setIsSaving(true)
        setEditDialogOpen(false)
        setGangToEdit(null)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setGangToEdit(null)
    }

    const handleViewChange = async (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView === null) return

        const isTableView = newView === 'table'
        setCompactView(isTableView)

        // Save view preference to storage and update context
        await saveViewPreference(ModuleTypes.GANG, isTableView)
        updateViewPreference(ModuleTypes.GANG, isTableView)
    }

    // Show loading spinner while data is loading
    if (isLoading) {
        return (
            <Container
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '80vh',
                }}
            >
                <CircularProgress
                    size={60}
                    thickness={4}
                    sx={{
                        color: colors.neons.cyan.default,
                        boxShadow: `0 0 20px ${colors.neons.cyan.default}`,
                    }}
                />
            </Container>
        )
    }

    return (
        <Container maxWidth={false}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography
                    variant="h1"
                    className="glitch-text"
                    data-text={t('gangs.title', 'Gang Generator')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('gangs.title', 'Gang Generator')}
                </Typography>
                {viewPrefsLoaded && <ViewToggle compactView={compactView} onViewChange={handleViewChange} />}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateGang}
                        disabled={isGenerating}
                        sx={{
                            position: 'relative',
                            bgcolor: readerMode ? '#e8f5e8' : 'rgba(20, 40, 30, 0.8)',
                            borderColor: readerMode ? '#2e7d32' : colors.neons.green.default,
                            color: readerMode ? '#1b7d2e' : colors.neons.green.default,
                            textShadow: readerMode ? 'none' : `0 0 8px ${colors.neons.green.light}`,
                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                            letterSpacing: readerMode ? 'normal' : '0.05em',
                            overflow: 'hidden',
                            padding: '6px 16px',
                            border: readerMode ? '1px solid #2e7d32' : `1px solid ${colors.neons.green.default}80`,
                            transition: 'all 0.3s',
                            animation: readerMode ? 'none' : `${pulseGlowGreen} 3s infinite`,
                            boxShadow: readerMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                            ...(readerMode
                                ? {
                                      '&:hover': {
                                          bgcolor: '#d7edd7',
                                          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                                          transform: 'translateY(-1px)',
                                      },
                                      '&.Mui-disabled': {
                                          bgcolor: '#f5f5f5',
                                          color: 'rgba(0, 0, 0, 0.38)',
                                          border: '1px solid rgba(0, 0, 0, 0.12)',
                                      },
                                  }
                                : {
                                      '&::before': {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          opacity: 0.2,
                                          zIndex: -1,
                                          background: `linear-gradient(135deg, transparent 0%, ${colors.neons.green.default}50 50%, transparent 100%)`,
                                          backgroundSize: '200% 200%',
                                          animation: `${scanlineFlow} 3s ease infinite`,
                                      },
                                      '&::after': {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          background: 'rgba(0, 255, 0, 0.1)',
                                          opacity: 0,
                                          transition: 'all 0.3s',
                                      },
                                      '&:hover': {
                                          backgroundColor: 'rgba(0, 60, 0, 0.6)',
                                          transform: 'translateY(-2px) scale(1.05)',
                                          boxShadow: `0 0 15px ${colors.neons.green.default}, inset 0 0 15px ${colors.neons.green.default}30`,
                                          color: colors.neons.green.light,
                                          textShadow: `0 0 8px ${colors.neons.green.light}`,
                                          '&::after': {
                                              opacity: 0.2,
                                          },
                                          '.generate-text': {
                                              animation: `${buttonGlitch} 0.3s ease both`,
                                          },
                                      },
                                  }),
                        }}
                    >
                        {isGenerating ? t('common.generating') : t('common.generate')}
                    </Button>
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllClick}
                    disabled={gangs.length === 0}
                    sx={{
                        position: 'relative',
                        bgcolor: readerMode ? '#ffebee' : 'rgba(40, 0, 0, 0.8)',
                        borderColor: readerMode ? '#c2161a' : colors.neons.red.default,
                        color: readerMode ? '#a01017' : colors.neons.red.default,
                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.red.default}`,
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        letterSpacing: readerMode ? 'normal' : '0.05em',
                        overflow: 'hidden',
                        padding: '6px 16px',
                        border: readerMode ? '1px solid #c2161a' : `1px solid ${colors.neons.red.default}80`,
                        transition: 'all 0.3s',
                        animation: readerMode ? 'none' : `${pulseGlowRed} 3s infinite`,
                        boxShadow: readerMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                        ...(readerMode
                            ? {
                                  '&:hover': {
                                      bgcolor: '#fde2e4',
                                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                                      transform: 'translateY(-1px)',
                                  },
                                  '&.Mui-disabled': {
                                      bgcolor: '#f5f5f5',
                                      color: 'rgba(0, 0, 0, 0.38)',
                                      border: '1px solid rgba(0, 0, 0, 0.12)',
                                  },
                              }
                            : {
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      opacity: 0.2,
                                      zIndex: -1,
                                      background: `linear-gradient(135deg, transparent 0%, ${colors.neons.red.default}50 50%, transparent 100%)`,
                                      backgroundSize: '200% 200%',
                                      animation: `${scanlineFlow} 3s ease infinite`,
                                  },
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      background: 'rgba(255, 0, 0, 0.1)',
                                      opacity: 0,
                                      transition: 'all 0.3s',
                                  },
                                  '&.Mui-disabled': {
                                      borderColor: 'rgba(255, 0, 0, 0.3)',
                                      color: 'rgba(255, 0, 0, 0.5)',
                                      bgcolor: 'rgba(40, 10, 10, 0.4)',
                                      animation: `${pulseGlowRed} 4s infinite`,
                                      boxShadow: '0 0 8px rgba(255, 0, 0, 0.2)',
                                      textShadow: `0 0 3px rgba(255, 0, 0, 0.3)`,
                                      opacity: 0.8,
                                      '&::before': {
                                          opacity: 0.1,
                                          animation: `${scanlineFlow} 6s ease infinite`,
                                      },
                                      '&::after': {
                                          opacity: 0.05,
                                      },
                                      '.button-text': {
                                          opacity: 0.8,
                                          textShadow: `0 0 5px rgba(255, 0, 0, 0.4)`,
                                      },
                                  },
                                  '&:hover': {
                                      borderColor: colors.neons.red.light,
                                      color: colors.neons.red.light,
                                      backgroundColor: 'rgba(60, 0, 0, 0.6)',
                                      animation: `${buttonGlitch} 0.3s cubic-bezier(.25,.46,.45,.94) both infinite`,
                                      boxShadow: `0 0 15px ${colors.neons.red.default}, inset 0 0 15px ${colors.neons.red.default}30`,
                                      transform: 'translateY(-2px) scale(1.05)',
                                      '&::after': {
                                          opacity: 0.2,
                                      },
                                      '.button-text': {
                                          animation: `${buttonGlitch} 0.3s ease infinite`,
                                      },
                                  },
                              }),
                    }}
                >
                    {t('common.clear')}
                </Button>
            </Stack>

            {gangs.length === 0 ? (
                <Typography
                    variant="body1"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                        fontFamily: '"Orbitron", monospace',
                        letterSpacing: '1px',
                        padding: '2rem',
                        border: `1px dashed ${colors.neons.cyan.default}40`,
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 30, 40, 0.2)',
                        display: 'inline-block',
                        position: 'relative',
                    }}
                >
                    {t('common.noItems', { type: t('modules.GANG').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <TableView
                    items={gangs}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.GANG}
                    onEdit={handleEditClick}
                />
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {gangs.map((gang, index) => (
                        <GridView
                            key={index}
                            item={gang}
                            index={index}
                            onDelete={handleDeleteClick}
                            moduleType={ModuleTypes.GANG}
                            onEdit={handleEditClick}
                        />
                    ))}
                </Grid>
            )}

            {/* Confirmation dialogs */}
            <WarningDialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteConfirmMessage', { type: t(`modules.${ModuleTypes.GANG}`).toLowerCase() })}
                moduleType={ModuleTypes.GANG}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', { type: t(`modules.${ModuleTypes.GANG}`).toLowerCase() })}
                moduleType={ModuleTypes.GANG}
                isDelete={true}
                isClearAll={true}
            />

            {/* Edit dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (item: Gang | Building) => void}
                item={gangToEdit}
                moduleType={ModuleTypes.GANG}
                isGeneratingImage={isGeneratingImage}
                setIsGeneratingImage={setIsGeneratingImage}
                setIsSaving={setIsSaving}
                setGangs={setGangs}
                setGangToEdit={setGangToEdit}
            />
        </Container>
    )
}

export default GangView
