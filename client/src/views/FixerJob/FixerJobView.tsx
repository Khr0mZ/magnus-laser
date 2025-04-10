import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Container,
    FormControlLabel,
    Grid,
    Stack,
    styled,
    Typography,
} from '@mui/material'
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
import { generateRandomFixerJob } from '../../utils/generators/generatorFixerJob'
import { clearFixerJobs, deleteImageBlob, saveFixerJobs, saveViewPreference } from '../../utils/storage'

// Add window.gangsDataLoaded declaration
declare global {
    interface Window {
        fixerJobsDataLoaded?: boolean
    }
}

// Define interface for the custom props
interface CyberpunkProps {
    readerMode?: boolean
}

// Custom cyberpunk styled checkbox
const CyberpunkCheckbox = styled(Checkbox, {
    shouldForwardProp: (prop) => prop !== 'readerMode',
})<CyberpunkProps>(({ readerMode }) => ({
    color: readerMode ? colors.neons.pink.default : colors.neons.cyan.default,
    '&.Mui-disabled': {
        color: readerMode ? 'unset' : `${colors.neons.cyan.dark}50`,
    },
    '&.Mui-checked': {
        color: readerMode ? colors.neons.pink.default : colors.neons.green.default,
    },
    '&:hover': {
        backgroundColor: readerMode ? 'rgba(46, 125, 50, 0.04)' : `${colors.neons.cyan.default}20`,
    },
    '& .MuiSvgIcon-root': {
        filter: readerMode ? 'none' : `drop-shadow(0 0 2px ${colors.neons.cyan.default})`,
        transition: 'all 0.3s',
    },
    '&.Mui-checked .MuiSvgIcon-root': {
        filter: readerMode ? 'none' : `drop-shadow(0 0 3px ${colors.neons.green.default})`,
        animation: readerMode ? 'none' : `${pulseGlowGreen} 3s infinite`,
    },
}))

// Cyberpunk styled checkbox label
const CyberpunkFormControlLabel = styled(FormControlLabel, {
    shouldForwardProp: (prop) => prop !== 'readerMode',
})<CyberpunkProps>(({ readerMode }) => ({
    '.MuiFormControlLabel-label': {
        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.default}`,
        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
        fontSize: '0.85rem',
        letterSpacing: '0.5px',
        transition: 'all 0.3s',
    },
    '&:hover .MuiFormControlLabel-label': {
        color: readerMode ? colors.neons.pink.default : colors.neons.green.default,
        '&.Mui-disabled': {
            color: readerMode ? colors.grays.gray500 : `${colors.neons.cyan.dark}20`,
        },
        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}`,
    },
}))

const FixerJobView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.FIXER_JOB')}`)
    const { readerMode } = useContext(ReaderModeContext)
    const { viewPreferences, viewPrefsLoaded, updateViewPreference } = useContext(ViewPreferencesContext)
    const {
        fixerJobs: dataFixerJobs,
        setFixerJobs: setDataFixerJobs,
        isLoading,
        gangs,
        buildings,
        setGangs: setDataGangs,
        setBuildings: setDataBuildings,
    } = useData()
    const [fixerJobs, setFixerJobs] = useState<FixerJob[]>([])

    // Use view preference from context
    const [compactView, setCompactView] = useState(() => {
        return viewPrefsLoaded ? viewPreferences[ModuleTypes.FIXER_JOB] : false
    })

    // Add state for generator preferences
    const [preferExistingBuilding, setPreferExistingBuilding] = useState(false)
    const [preferExistingGang, setPreferExistingGang] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [fixerJobToDelete, setFixerJobToDelete] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [fixerJobToEdit, setFixerJobToEdit] = useState<FixerJob | null>(null)
    const [jobDifficulty, setJobDifficulty] = useState<JobDifficulty>(JobDifficulty.TYPICAL)
    const prevFixerJobsRef = useRef<number>(0)
    const prevFixerJobsDataRef = useRef<FixerJob[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const syncingFromContextRef = useRef(false)
    const updatingContextRef = useRef(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.FIXER_JOB])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        // Prevent infinite loop - only update if we're not currently updating context
        if (updatingContextRef.current) return

        // Mark that we're syncing from context
        syncingFromContextRef.current = true

        // Always sync with context data, even if empty
        setFixerJobs(dataFixerJobs)
        prevFixerJobsRef.current = dataFixerJobs.length
        prevFixerJobsDataRef.current = structuredClone(dataFixerJobs)

        // Reset the syncing flag after state update
        setTimeout(() => {
            syncingFromContextRef.current = false
        }, 0)
    }, [dataFixerJobs])

    // Save fixer jobs to storage when they change
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Skip if the change was triggered by syncing from context
        if (syncingFromContextRef.current) return

        // Check if the data has actually changed to avoid unnecessary saves
        const hasChanged = JSON.stringify(fixerJobs) !== JSON.stringify(prevFixerJobsDataRef.current)
        if (!hasChanged) return

        // Set updating context flag
        updatingContextRef.current = true

        // Always save the data when it exists
        if (fixerJobs.length > 0) {
            saveFixerJobs(fixerJobs)
            setDataFixerJobs(fixerJobs) // Update context data
        } else if (prevFixerJobsRef.current > 0 && fixerJobs.length === 0 && !isLoading) {
            // Only clear if we previously had fixer jobs and now we don't
            // AND we're not still loading data
            clearFixerJobs()
            setDataFixerJobs([])
        }

        // Update references
        prevFixerJobsRef.current = fixerJobs.length
        prevFixerJobsDataRef.current = structuredClone(fixerJobs)

        // Reset the context updating flag after state update
        setTimeout(() => {
            updatingContextRef.current = false
        }, 0)
    }, [fixerJobs, setDataFixerJobs, isLoading])

    const handleJobDifficultyChange = (_: React.MouseEvent<HTMLElement>, newJobType: JobDifficulty) => {
        if (newJobType !== null) setJobDifficulty(newJobType)
    }

    const handleGenerateFixerJob = async () => {
        setIsGenerating(true)
        try {
            const {
                fixerJob: newFixerJob,
                newGangs,
                newBuildings,
            } = await generateRandomFixerJob(t, gangs, buildings, undefined, undefined, {
                preferExistingBuilding,
                preferExistingGang,
                jobDifficulty,
            })

            // Process any new buildings if needed
            const processedNewBuildings = newBuildings.map((building) => {
                // Only process if the image doesn't already start with 'data:'
                if (building.image && typeof building.image === 'string' && !building.image.startsWith('data:')) {
                    // If it's not a data URL but a plain string, it might need proper formatting
                    return {
                        ...building,
                        image: building.image.startsWith('data:')
                            ? building.image
                            : `data:image/jpeg;base64,${building.image}`,
                    }
                }
                return building
            })

            // Batch all updates together
            updatingContextRef.current = true

            // Update context states - our effect hooks will handle saving to storage
            if (newGangs.length > 0) {
                const updatedGangs = [...gangs, ...newGangs]
                setDataGangs(updatedGangs)
            }

            if (processedNewBuildings.length > 0) {
                const updatedBuildings = [...buildings, ...processedNewBuildings]
                setDataBuildings(updatedBuildings)
            }

            // Update fixer jobs
            setFixerJobs((prevFixerJobs) => [newFixerJob, ...prevFixerJobs])

            // Allow time for state updates before resetting the flag
            setTimeout(() => {
                updatingContextRef.current = false
                setIsSaving(true)
            }, 100)
        } catch (error) {
            console.error('Failed to generate fixer job:', error)
            updatingContextRef.current = false
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = async () => {
        setFixerJobs([])
        await clearFixerJobs()
        setDataFixerJobs([]) // Update context data
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setFixerJobToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (fixerJobToDelete !== null) {
            // Get the fixer job to be deleted
            const jobToDelete = fixerJobs[fixerJobToDelete]

            // Clean up all images in the fixer job
            const cleanupImages = async () => {
                try {
                    // Clean up main image if it's an image ID (not a data URL)
                    if (
                        jobToDelete.image &&
                        typeof jobToDelete.image === 'string' &&
                        !jobToDelete.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(jobToDelete.image)
                    }

                    // Clean up plot-related images
                    const plot = jobToDelete.plot

                    // Clean up plot place building image
                    if (
                        plot.plotPlace?.building?.image &&
                        typeof plot.plotPlace.building.image === 'string' &&
                        !plot.plotPlace.building.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.plotPlace.building.image)
                    }

                    // Clean up place complication images
                    if (
                        plot.plotPlace?.complication?.character?.image &&
                        typeof plot.plotPlace.complication.character.image === 'string' &&
                        !plot.plotPlace.complication.character.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.plotPlace.complication.character.image)
                    }

                    if (
                        plot.plotPlace?.complication?.item?.image &&
                        typeof plot.plotPlace.complication.item.image === 'string' &&
                        !plot.plotPlace.complication.item.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.plotPlace.complication.item.image)
                    }

                    if (
                        plot.plotPlace?.complication?.gang?.gang?.image &&
                        typeof plot.plotPlace.complication.gang.gang.image === 'string' &&
                        !plot.plotPlace.complication.gang.gang.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.plotPlace.complication.gang.gang.image)
                    }

                    // Clean up subject images
                    if (plot.subjectIfNotPlace) {
                        // Check if subject is a character
                        if (
                            'type' in plot.subjectIfNotPlace &&
                            'name' in plot.subjectIfNotPlace &&
                            'image' in plot.subjectIfNotPlace
                        ) {
                            if (
                                plot.subjectIfNotPlace.image &&
                                typeof plot.subjectIfNotPlace.image === 'string' &&
                                !plot.subjectIfNotPlace.image.startsWith('data:')
                            ) {
                                await deleteImageBlob(plot.subjectIfNotPlace.image)
                            }
                        }

                        // Check if subject is a gang
                        if ('gang' in plot.subjectIfNotPlace && plot.subjectIfNotPlace.gang?.image) {
                            if (
                                typeof plot.subjectIfNotPlace.gang.image === 'string' &&
                                !plot.subjectIfNotPlace.gang.image.startsWith('data:')
                            ) {
                                await deleteImageBlob(plot.subjectIfNotPlace.gang.image)
                            }
                        }
                    }

                    // Clean up plot complication images
                    if (
                        plot.complication?.character?.image &&
                        typeof plot.complication.character.image === 'string' &&
                        !plot.complication.character.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.complication.character.image)
                    }

                    if (
                        plot.complication?.item?.image &&
                        typeof plot.complication.item.image === 'string' &&
                        !plot.complication.item.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.complication.item.image)
                    }

                    if (
                        plot.complication?.gang?.gang?.image &&
                        typeof plot.complication.gang.gang.image === 'string' &&
                        !plot.complication.gang.gang.image.startsWith('data:')
                    ) {
                        await deleteImageBlob(plot.complication.gang.gang.image)
                    }
                } catch (error) {
                    console.error('Error cleaning up fixer job images:', error)
                }
            }

            // Clean up images before removing the fixer job
            cleanupImages().then(() => {
                // Now update state to remove the job
                setFixerJobs((prevFixerJobs) => prevFixerJobs.filter((_, i) => i !== fixerJobToDelete))
                setIsSaving(true)
                setDeleteDialogOpen(false)
                setFixerJobToDelete(null)
            })
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setFixerJobToDelete(null)
    }

    const handleEditClick = (index: number) => {
        setFixerJobToEdit(fixerJobs[index])
        setEditDialogOpen(true)
    }

    const handleEditSave = (editedItem: FixerJob) => {
        setFixerJobs((prevFixerJobs) =>
            prevFixerJobs.map((fixerJob) => (fixerJob.ID === editedItem.ID ? editedItem : fixerJob))
        )
        setIsSaving(true)
        setEditDialogOpen(false)
        setFixerJobToEdit(null)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setFixerJobToEdit(null)
    }

    const handleViewChange = async (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView === null) return

        const isTableView = newView === 'table'
        setCompactView(isTableView)

        // Save view preference to storage and update context
        await saveViewPreference(ModuleTypes.FIXER_JOB, isTableView)
        updateViewPreference(ModuleTypes.FIXER_JOB, isTableView)
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
                    data-text={t('fixerJobs.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('fixerJobs.title')}
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
                {t('modules.FIXER_JOB_DESCRIPTION')}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateFixerJob}
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

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            disabled={buildings.length === 0}
                            control={
                                <CyberpunkCheckbox
                                    readerMode={readerMode}
                                    checked={preferExistingBuilding}
                                    onChange={(e) => setPreferExistingBuilding(e.target.checked)}
                                    disabled={buildings.length === 0}
                                />
                            }
                            label={t('fixerJobs.useExistingBuildings')}
                        />
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            disabled={gangs.length === 0}
                            control={
                                <CyberpunkCheckbox
                                    readerMode={readerMode}
                                    checked={preferExistingGang}
                                    onChange={(e) => setPreferExistingGang(e.target.checked)}
                                    disabled={gangs.length === 0}
                                />
                            }
                            label={t('fixerJobs.useExistingGangs')}
                        />
                    </Stack>
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllClick}
                    disabled={fixerJobs.length === 0}
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

            {fixerJobs.length === 0 ? (
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
                    {t('common.noItems', { type: t('modules.FIXER_JOB').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <TableView
                    items={fixerJobs}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.FIXER_JOB}
                    onEdit={handleEditClick}
                />
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {fixerJobs.map((fixerJob, index) => (
                        <GridView
                            key={index}
                            item={fixerJob}
                            index={index}
                            onDelete={handleDeleteClick}
                            moduleType={ModuleTypes.FIXER_JOB}
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
                message={t('common.deleteConfirmMessage', {
                    type: t(`modules.${ModuleTypes.FIXER_JOB}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.FIXER_JOB}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: t(`modules.${ModuleTypes.FIXER_JOB}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.FIXER_JOB}
                isDelete={true}
                isClearAll={true}
            />

            {/* Edit dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (item: Gang | Building | FixerJob) => void}
                item={fixerJobToEdit}
                moduleType={ModuleTypes.FIXER_JOB}
                isGeneratingImage={isGeneratingImage}
                setIsGeneratingImage={setIsGeneratingImage}
                setIsSaving={setIsSaving}
                setFixerJobs={setFixerJobs}
                setFixerJobToEdit={setFixerJobToEdit}
            />
        </Container>
    )
}

export default FixerJobView
