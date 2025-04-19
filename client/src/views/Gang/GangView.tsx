import { CircularProgress, Container, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { isEqual } from 'lodash'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton'
import EditDialog from '../../components/common/EditDialog/EditDialog'
import GridView from '../../components/common/GridView'
import TableView from '../../components/common/TableView'
import ViewToggle from '../../components/common/ViewToggle'
import { WarningDialog } from '../../components/common/WarningDialog'
import GenerateButton from '../../components/GenerateButton'
import StorageBanner from '../../components/StorageBanner'
import { useData } from '../../contexts/dataHooks'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { ViewPreferencesContext } from '../../contexts/ViewPreferencesContext'
import { Building, FixerJob, Gang } from '../../graphql/types'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { generateRandomGang } from '../../utils/generators/generatorGang'
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
    const prevGangsDataRef = useRef<Gang[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const syncingFromContextRef = useRef(false)
    const updatingContextRef = useRef(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.GANG])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        // Prevent infinite loop - only update if we're not currently updating context
        if (updatingContextRef.current) return

        // Mark that we're syncing from context
        syncingFromContextRef.current = true

        // Always sync with context data, even if empty
        setGangs(dataGangs)
        prevGangsRef.current = dataGangs.length
        prevGangsDataRef.current = structuredClone(dataGangs)

        // Reset the syncing flag after state update
        setTimeout(() => {
            syncingFromContextRef.current = false
        }, 0)
    }, [dataGangs])

    // Save gangs to storage when they change
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Skip if the change was triggered by syncing from context
        if (syncingFromContextRef.current) return

        // Check if the data has actually changed to avoid unnecessary saves
        if (isEqual(gangs, prevGangsDataRef.current)) return

        // Set updating context flag
        updatingContextRef.current = true

        // Always save the data when it exists
        if (gangs.length > 0) {
            saveGangs(gangs)
            setDataGangs(gangs) // Update context data
        } else if (prevGangsRef.current > 0 && gangs.length === 0 && !isLoading) {
            // Only clear if we previously had gangs and now we don't
            // AND we're not still loading data
            clearGangs()
            setDataGangs([])
        }

        // Update references
        prevGangsRef.current = gangs.length
        prevGangsDataRef.current = structuredClone(gangs)

        // Reset the context updating flag after state update
        setTimeout(() => {
            updatingContextRef.current = false
        }, 0)
    }, [gangs, setDataGangs, isLoading])

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
        <Container maxWidth={false} sx={{ pt: 3 }}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('gangs.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('gangs.title')}
                </Typography>
                {viewPrefsLoaded && <ViewToggle compactView={compactView} onViewChange={handleViewChange} />}
            </Stack>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t('modules.GANG_DESCRIPTION')}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <GenerateButton isGenerating={isGenerating} handleGenerate={handleGenerateGang} />
                <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={gangs.length === 0} />
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
                <GridView
                    items={gangs}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.GANG}
                    onEdit={handleEditClick}
                />
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
                onSave={handleEditSave as (item: Gang | Building | FixerJob) => void}
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
