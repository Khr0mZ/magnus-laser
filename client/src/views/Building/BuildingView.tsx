import { Box, Button, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonGlitch, pulseGlowGreen, pulseGlowRed, scanlineFlow } from '../../components/common/Animations'
import EditDialog from '../../components/common/EditDialog/EditDialog'
import GridView from '../../components/common/GridView'
import JobDifficultySelector from '../../components/common/JobDifficultySelector'
import TableView from '../../components/common/TableView'
import ViewToggle from '../../components/common/ViewToggle'
import { WarningDialog } from '../../components/common/WarningDialog'
import StorageBanner from '../../components/StorageBanner'
import { useData } from '../../contexts/dataHooks'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { ViewPreferencesContext } from '../../contexts/ViewPreferencesContext'
import { Building, FixerJob, Gang, JobDifficulty } from '../../graphql/types'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { getJobDifficultyModifier } from '../../utils/functions'
import { generateRandomBuilding } from '../../utils/generators/generatorBuilding'
import { clearBuildings, saveBuildings, saveViewPreference } from '../../utils/storage'

// Add window interface augmentation
declare global {
    interface Window {
        buildingsDataLoaded?: boolean
    }
}

const BuildingView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.BUILDING')}`)
    const { readerMode } = useContext(ReaderModeContext)
    const { viewPreferences, viewPrefsLoaded, updateViewPreference } = useContext(ViewPreferencesContext)
    const { buildings: dataBuildings, setBuildings: setDataBuildings, isLoading } = useData()
    const [buildings, setBuildings] = useState<Building[]>([])

    // Use view preference from context
    const [compactView, setCompactView] = useState(() => {
        return viewPrefsLoaded ? viewPreferences[ModuleTypes.BUILDING] : false
    })

    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [buildingToDelete, setBuildingToDelete] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null)
    const [jobDifficulty, setJobDifficulty] = useState<JobDifficulty>(JobDifficulty.TYPICAL)
    const prevBuildingsRef = useRef<number>(0)
    const prevBuildingsDataRef = useRef<Building[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const syncingFromContextRef = useRef(false)
    const updatingContextRef = useRef(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.BUILDING])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        // Prevent infinite loop - only update if we're not currently updating context
        if (updatingContextRef.current) return

        // Mark that we're syncing from context
        syncingFromContextRef.current = true

        // Always sync with context data, even if empty
        setBuildings(dataBuildings)
        prevBuildingsRef.current = dataBuildings.length
        prevBuildingsDataRef.current = structuredClone(dataBuildings)

        // Reset the syncing flag after state update
        setTimeout(() => {
            syncingFromContextRef.current = false
        }, 0)
    }, [dataBuildings])

    // Save buildings to storage when they change
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Skip if the change was triggered by syncing from context
        if (syncingFromContextRef.current) return

        // Check if the data has actually changed to avoid unnecessary saves
        const hasChanged = JSON.stringify(buildings) !== JSON.stringify(prevBuildingsDataRef.current)
        if (!hasChanged) return

        // Set updating context flag
        updatingContextRef.current = true

        // Always save the data when it exists
        if (buildings.length > 0) {
            saveBuildings(buildings)
            setDataBuildings(buildings) // Update context data
        } else if (prevBuildingsRef.current > 0 && buildings.length === 0 && !isLoading) {
            // Only clear if we previously had buildings and now we don't
            // AND we're not still loading data
            clearBuildings()
            setDataBuildings([])
        }

        // Update references
        prevBuildingsRef.current = buildings.length
        prevBuildingsDataRef.current = structuredClone(buildings)

        // Reset the context updating flag after state update
        setTimeout(() => {
            updatingContextRef.current = false
        }, 0)
    }, [buildings, setDataBuildings, isLoading])

    const handleJobDifficultyChange = (_: React.MouseEvent<HTMLElement>, newJobType: JobDifficulty) => {
        if (newJobType !== null) setJobDifficulty(newJobType)
    }

    const handleGenerateBuilding = async () => {
        setIsGenerating(true)
        try {
            const newBuilding = await generateRandomBuilding(t, getJobDifficultyModifier(jobDifficulty))
            setBuildings((prevBuildings) => [newBuilding, ...prevBuildings])
            setIsSaving(true)
        } catch (error) {
            console.error('Failed to generate building:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = async () => {
        setBuildings([])
        await clearBuildings()
        setDataBuildings([])
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setBuildingToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (buildingToDelete !== null) {
            setBuildings((prevBuildings) => prevBuildings.filter((_, i) => i !== buildingToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setBuildingToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setBuildingToDelete(null)
    }

    const handleEditClick = (index: number) => {
        setBuildingToEdit(buildings[index])
        setEditDialogOpen(true)
    }

    const handleEditSave = (editedItem: Building) => {
        setBuildings((prevBuildings) =>
            prevBuildings.map((building) => (building.ID === editedItem.ID ? editedItem : building))
        )
        setIsSaving(true)
        setEditDialogOpen(false)
        setBuildingToEdit(null)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setBuildingToEdit(null)
    }

    const handleViewChange = async (_: React.MouseEvent<HTMLElement>, newView: string) => {
        if (newView === null) return

        const isTableView = newView === 'table'
        setCompactView(isTableView)

        // Save view preference to storage and update context
        await saveViewPreference(ModuleTypes.BUILDING, isTableView)
        updateViewPreference(ModuleTypes.BUILDING, isTableView)
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
        <Container maxWidth={false} sx={{ pt: 3 }}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('buildings.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('buildings.title')}
                </Typography>

                <Stack
                    direction="row"
                    sx={{
                        mb: 1,
                        flexWrap: 'wrap-reverse',
                        gap: 1,
                        justifyContent: 'flex-end',
                    }}
                >
                    <JobDifficultySelector
                        jobDifficulty={jobDifficulty}
                        onJobDifficultyChange={handleJobDifficultyChange}
                    />
                    {viewPrefsLoaded && <ViewToggle compactView={compactView} onViewChange={handleViewChange} />}
                </Stack>
            </Stack>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t('modules.BUILDING_DESCRIPTION')}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateBuilding}
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
                    disabled={buildings.length === 0}
                    className="button"
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

            {buildings.length === 0 ? (
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
                    {t('common.noItems', { type: t('modules.BUILDING').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <TableView
                    items={buildings}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.BUILDING}
                    onEdit={handleEditClick}
                />
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {buildings.map((building, index) => (
                        <GridView
                            key={index}
                            item={building}
                            index={index}
                            onDelete={handleDeleteClick}
                            moduleType={ModuleTypes.BUILDING}
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
                message={t('common.deleteConfirmMessage', { type: t(`modules.${ModuleTypes.BUILDING}`).toLowerCase() })}
                moduleType={ModuleTypes.BUILDING}
                isDelete={true}
                isClearAll={false}
            />

            <WarningDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: t(`modules.${ModuleTypes.BUILDING}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.BUILDING}
                isDelete={true}
                isClearAll={true}
            />

            {/* Edit dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (item: Building | Gang | FixerJob) => void}
                item={buildingToEdit}
                moduleType={ModuleTypes.BUILDING}
                isGeneratingImage={isGeneratingImage}
                setIsGeneratingImage={setIsGeneratingImage}
                setIsSaving={setIsSaving}
                setBuildings={setBuildings}
                setBuildingToEdit={setBuildingToEdit}
            />
        </Container>
    )
}

export default BuildingView
