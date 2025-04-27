import { CircularProgress, Container, Stack, Typography } from '@mui/material'
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
import GenerateButton from '../../components/GenerateButton'
import StorageBanner from '../../components/StorageBanner'
import { useData } from '../../contexts/dataHooks'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { Bounty, Building, Character, FixerJob, Gang, Item, JobDifficulty } from '../../graphql/types'
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
    const { readerMode, viewPreferences, viewPrefsLoaded, updateViewPreference } = useUserPreferences()
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
        if (isEqual(buildings, prevBuildingsDataRef.current)) return

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
            console.warn('Failed to generate building:', error)
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

    const handleEditClick = (ID: string) => {
        const building = buildings.find((building) => building.ID === ID)
        if (building) {
            setBuildingToEdit(building)
            setEditDialogOpen(true)
        }
    }

    const handleEditSave = (editedTarget: Building) => {
        setBuildings((prevBuildings) =>
            prevBuildings.map((building) => (building.ID === editedTarget.ID ? editedTarget : building))
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
            <Stack direction="row" alignItems="center" spacing={2} mr={1.5}>
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
                <GenerateButton isGenerating={isGenerating} handleGenerate={handleGenerateBuilding} />
                <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={buildings.length === 0} />
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
                    targetArray={buildings}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.BUILDING}
                    onEdit={handleEditClick}
                />
            ) : (
                <GridView
                    targetArray={buildings}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.BUILDING}
                    onEdit={handleEditClick}
                />
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
                onSave={handleEditSave as (target: Building | Gang | FixerJob | Character | Item | Bounty) => void}
                target={buildingToEdit}
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
