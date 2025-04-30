import { CircularProgress, Container, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { isEqual } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton.tsx'
import EditDialog from '../../components/common/EditDialog/EditDialog.tsx'
import GridView from '../../components/common/GridView.tsx'
import TableView from '../../components/common/TableView.tsx'
import ViewToggle from '../../components/common/ViewToggle.tsx'
import { WarningDialog } from '../../components/common/WarningDialog.tsx'
import GenerateButton from '../../components/GenerateButton.tsx'
import StorageBanner from '../../components/StorageBanner.tsx'
import { useData } from '../../contexts/dataHooks.ts'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { Bounty, Building, Character, FixerJob, Gang, Item } from '../../graphql/types.ts'
import colors from '../../utils/colors.ts'
import { ModuleTypes } from '../../utils/constants.ts'
import { generateRandomItem } from '../../utils/generators/generatorItem.ts'
import { clearItems, saveItems, saveViewPreference } from '../../utils/storage.ts'

// Add window.itemsDataLoaded declaration
declare global {
    interface Window {
        itemsDataLoaded?: boolean
    }
}

const ItemView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.ITEM')}`)
    const { readerMode, viewPreferences, viewPrefsLoaded, updateViewPreference } = useUserPreferences()
    const { items: dataItems, setItems: setDataItems, isLoading } = useData()
    const [items, setItems] = useState<Item[]>([])

    // Use view preference from context
    const [compactView, setCompactView] = useState(() => {
        return viewPrefsLoaded ? viewPreferences[ModuleTypes.ITEM] : false
    })

    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [itemToEdit, setItemToEdit] = useState<Item | null>(null)
    const prevItemsRef = useRef<number>(0)
    const prevItemsDataRef = useRef<Item[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const syncingFromContextRef = useRef(false)
    const updatingContextRef = useRef(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.ITEM])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        // Prevent infinite loop - only update if we're not currently updating context
        if (updatingContextRef.current) return

        // Mark that we're syncing from context
        syncingFromContextRef.current = true

        // Always sync with context data, even if empty
        setItems(dataItems)
        prevItemsRef.current = dataItems.length
        prevItemsDataRef.current = structuredClone(dataItems)

        // Reset the syncing flag after state update
        setTimeout(() => {
            syncingFromContextRef.current = false
        }, 0)
    }, [dataItems])

    // Save items to storage when they change
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Skip if the change was triggered by syncing from context
        if (syncingFromContextRef.current) return

        // Check if the data has actually changed to avoid unnecessary saves
        if (isEqual(items, prevItemsDataRef.current)) return

        // Set updating context flag
        updatingContextRef.current = true

        // Always save the data when it exists
        if (items.length > 0) {
            saveItems(items)
            setDataItems(items) // Update context data
        } else if (prevItemsRef.current > 0 && items.length === 0 && !isLoading) {
            // Only clear if we previously had items and now we don't
            // AND we're not still loading data
            clearItems()
            setDataItems([])
        }

        // Update references
        prevItemsRef.current = items.length
        prevItemsDataRef.current = structuredClone(items)

        // Reset the context updating flag after state update
        setTimeout(() => {
            updatingContextRef.current = false
        }, 0)
    }, [items, setDataItems, isLoading])

    const handleGenerateItem = async () => {
        setIsGenerating(true)
        try {
            const newItem = await generateRandomItem(t)
            setItems((prevItems) => [newItem, ...prevItems])
            setIsSaving(true)
        } catch (error) {
            console.warn('Failed to generate item:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = async () => {
        setItems([])
        await clearItems()
        setDataItems([]) // Update context data
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setItemToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (itemToDelete !== null) {
            setItems((prevItems) => prevItems.filter((_, i) => i !== itemToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setItemToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setItemToDelete(null)
    }

    const handleEditClick = (ID: string) => {
        const item = items.find((item) => item.ID === ID)
        if (item) {
            setItemToEdit(item)
            setEditDialogOpen(true)
        }
    }

    const handleEditSave = (editedTarget: Item) => {
        setItems((prevItems) => prevItems.map((item) => (item.ID === editedTarget.ID ? editedTarget : item)))
        setIsSaving(true)
        setEditDialogOpen(false)
        setItemToEdit(null)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setItemToEdit(null)
    }

    const handleViewChange = async (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView === null) return

        const isTableView = newView === 'table'
        setCompactView(isTableView)

        // Save view preference to storage and update context
        await saveViewPreference(ModuleTypes.ITEM, isTableView)
        updateViewPreference(ModuleTypes.ITEM, isTableView)
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
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('items.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('items.title')}
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
                {t('modules.ITEM_DESCRIPTION')}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <GenerateButton isGenerating={isGenerating} handleGenerate={handleGenerateItem} />
                <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={items.length === 0} />
            </Stack>

            {items.length === 0 ? (
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
                    {t('common.noItems', { type: t('modules.ITEM').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <TableView
                    targetArray={items}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.ITEM}
                    onEdit={handleEditClick}
                />
            ) : (
                <GridView
                    targetArray={items}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.ITEM}
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
                    type: t(`modules.${ModuleTypes.ITEM}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.ITEM}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: t(`modules.${ModuleTypes.ITEM}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.ITEM}
                isDelete={true}
                isClearAll={true}
            />

            {/* Edit dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (target: Gang | Building | FixerJob | Character | Item | Bounty) => void}
                target={itemToEdit}
                moduleType={ModuleTypes.ITEM}
                isGeneratingImage={isGeneratingImage}
                setIsGeneratingImage={setIsGeneratingImage}
                setIsSaving={setIsSaving}
                setItems={setItems}
                setItemToEdit={setItemToEdit}
            />
        </Container>
    )
}

export default ItemView
