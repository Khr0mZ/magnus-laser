import { Box, CircularProgress, Container, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { isEqual } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton'
import EditDialog from '../../components/common/EditDialog/EditDialog'
import GridView from '../../components/common/GridView'
import JobDifficultySelector from '../../components/common/JobDifficultySelector'
import TableView from '../../components/common/TableView'
import ViewToggle from '../../components/common/ViewToggle'
import { WarningDialog } from '../../components/common/WarningDialog'
import CyberpunkCheckbox from '../../components/CyberpunkCheckbox'
import CyberpunkFormControlLabel from '../../components/CyberpunkFormControlLabel'
import GenerateButton from '../../components/GenerateButton'
import StorageBanner from '../../components/StorageBanner'
import { useData } from '../../contexts/dataHooks'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { Building, FixerJob, Gang, JobDifficulty } from '../../graphql/types'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { generateRandomFixerJob } from '../../utils/generators/generatorFixerJob'
import { clearFixerJobs, saveFixerJobs, saveViewPreference } from '../../utils/storage'

// Add window.gangsDataLoaded declaration
declare global {
    interface Window {
        fixerJobsDataLoaded?: boolean
    }
}

const FixerJobView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.FIXER_JOB')}`)
    const { readerMode, viewPreferences, viewPrefsLoaded, updateViewPreference } = useUserPreferences()
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
        if (isEqual(fixerJobs, prevFixerJobsDataRef.current)) return

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
            const { newFixerJob, newGang, newBuilding } = await generateRandomFixerJob(
                t,
                gangs,
                buildings,
                undefined,
                preferExistingBuilding,
                preferExistingGang,
                jobDifficulty,
                undefined,
                undefined
            )
            // Update context states - our effect hooks will handle saving to storage
            let updatedGangs: Gang[] = []
            let updatedBuildings: Building[] = []
            if (newGang) {
                updatedGangs = [...gangs, newGang]
                setDataGangs(updatedGangs)
            }
            if (newBuilding) {
                updatedBuildings = [...buildings, newBuilding]
                setDataBuildings(updatedBuildings)
            }
            setFixerJobs((prevFixerJobs) => [newFixerJob, ...prevFixerJobs])
            setIsSaving(true)
        } catch (error) {
            console.error('Failed to generate fixer job:', error)
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
            // Directly remove the selected fixer job
            setFixerJobs((prevFixerJobs) => prevFixerJobs.filter((_, i) => i !== fixerJobToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setFixerJobToDelete(null)
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
            <Stack direction="row" alignItems="center" spacing={2} mr={1.5}>
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
                    <GenerateButton isGenerating={isGenerating} handleGenerate={handleGenerateFixerJob} />

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
                <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={fixerJobs.length === 0} />
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
                <GridView
                    items={fixerJobs}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.FIXER_JOB}
                    onEdit={handleEditClick}
                />
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
