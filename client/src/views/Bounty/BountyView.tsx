import { Box, CircularProgress, Container, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { isEqual } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton.tsx'
import CyberpunkCheckbox from '../../components/CyberpunkCheckbox.tsx'
import CyberpunkFormControlLabel from '../../components/CyberpunkFormControlLabel.tsx'
import GenerateButton from '../../components/GenerateButton.tsx'
import StorageBanner from '../../components/StorageBanner.tsx'
import EditDialog from '../../components/common/EditDialog/EditDialog.tsx'
import GridView from '../../components/common/GridView.tsx'
import TableView from '../../components/common/TableView.tsx'
import ViewToggle from '../../components/common/ViewToggle.tsx'
import { WarningDialog } from '../../components/common/WarningDialog.tsx'
import { useData } from '../../contexts/dataHooks.ts'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { Bounty, Building, Character, FixerJob, Gang, Item } from '../../graphql/types.ts'
import colors from '../../utils/colors.ts'
import { ModuleTypes } from '../../utils/constants.ts'
import { generateRandomBounty } from '../../utils/generators/generatorBounty.ts'
import { clearBounties, saveBounties, saveViewPreference } from '../../utils/storage.ts'

// Add window.bountiesDataLoaded declaration
declare global {
    interface Window {
        bountiesDataLoaded?: boolean
    }
}

const BountyView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.BOUNTY')}`)
    const { readerMode, viewPreferences, viewPrefsLoaded, updateViewPreference } = useUserPreferences()
    const {
        bounties: dataBounties,
        setBounties: setDataBounties,
        isLoading,
        characters,
        setCharacters: setDataCharacters,
    } = useData()
    const [bounties, setBounties] = useState<Bounty[]>([])

    // Use view preference from context
    const [compactView, setCompactView] = useState(() => {
        return viewPrefsLoaded ? viewPreferences[ModuleTypes.BOUNTY] : false
    })

    console.log({ dataBounties, characters })

    // Add state for generator preferences
    const [preferExistingCharacter, setPreferExistingCharacter] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bountyToDelete, setBountyToDelete] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [bountyToEdit, setBountyToEdit] = useState<Bounty | null>(null)
    const prevBountiesRef = useRef<number>(0)
    const prevBountiesDataRef = useRef<Bounty[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const syncingFromContextRef = useRef(false)
    const updatingContextRef = useRef(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.BOUNTY])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        // Prevent infinite loop - only update if we're not currently updating context
        if (updatingContextRef.current) return

        // Mark that we're syncing from context
        syncingFromContextRef.current = true

        // Always sync with context data, even if empty
        setBounties(dataBounties)
        prevBountiesRef.current = dataBounties.length
        prevBountiesDataRef.current = structuredClone(dataBounties)

        // Reset the syncing flag after state update
        setTimeout(() => {
            syncingFromContextRef.current = false
        }, 0)
    }, [dataBounties])

    // Save bounties to storage when they change
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Skip if the change was triggered by syncing from context
        if (syncingFromContextRef.current) return

        // Check if the data has actually changed to avoid unnecessary saves
        if (isEqual(bounties, prevBountiesDataRef.current)) return

        // Set updating context flag
        updatingContextRef.current = true

        console.log('saving bounties', bounties)

        // Always save the data when it exists
        if (bounties.length > 0) {
            saveBounties(bounties)
            setDataBounties(bounties) // Update context data
        } else if (prevBountiesRef.current > 0 && bounties.length === 0 && !isLoading) {
            // Only clear if we previously had bounties and now we don't
            // AND we're not still loading data
            clearBounties()
            setDataBounties([])
        }

        // Update references
        prevBountiesRef.current = bounties.length
        prevBountiesDataRef.current = structuredClone(bounties)

        // Reset the context updating flag after state update
        setTimeout(() => {
            updatingContextRef.current = false
        }, 0)
    }, [bounties, setDataBounties, isLoading])

    const handleGenerateBounty = async () => {
        setIsGenerating(true)
        try {
            const { newBounty, newCharacter } = await generateRandomBounty(
                bounties,
                characters,
                undefined,
                undefined,
                preferExistingCharacter
            )
            console.log('newCharacter', newCharacter)
            // Update context states - our effect hooks will handle saving to storage
            if (newCharacter) {
                setDataCharacters([...characters, newCharacter])
            }
            setBounties((prevBounties) => [newBounty, ...prevBounties])
            setIsSaving(true)
        } catch (error) {
            console.warn('Failed to generate bounty:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = async () => {
        setBounties([])
        await clearBounties()
        setDataBounties([]) // Update context data
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setBountyToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (bountyToDelete !== null) {
            // Directly remove the selected bounty
            setBounties((prevBounties) => prevBounties.filter((_, i) => i !== bountyToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setBountyToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setBountyToDelete(null)
    }

    const handleEditClick = (index: number) => {
        setBountyToEdit(bounties[index])
        setEditDialogOpen(true)
    }

    const handleEditSave = (editedTarget: Bounty) => {
        setBounties((prevBounties) =>
            prevBounties.map((bounty) => (bounty.ID === editedTarget.ID ? editedTarget : bounty))
        )
        setIsSaving(true)
        setEditDialogOpen(false)
        setBountyToEdit(null)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setBountyToEdit(null)
    }

    const handleViewChange = async (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView === null) return

        const isTableView = newView === 'table'
        setCompactView(isTableView)

        // Save view preference to storage and update context
        await saveViewPreference(ModuleTypes.BOUNTY, isTableView)
        updateViewPreference(ModuleTypes.BOUNTY, isTableView)
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
                    data-text={t('bounties.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('bounties.title')}
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
                {t('modules.BOUNTY_DESCRIPTION')}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <GenerateButton isGenerating={isGenerating} handleGenerate={handleGenerateBounty} />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                            }}
                        >
                            {t('fixerJobs.useExisting')}
                        </Typography>
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            disabled={characters.length === 0}
                            control={
                                <CyberpunkCheckbox
                                    readerMode={readerMode}
                                    checked={preferExistingCharacter}
                                    onChange={(e) => setPreferExistingCharacter(e.target.checked)}
                                    disabled={characters.length === 0}
                                />
                            }
                            label={t('fixerJobs.useExistingCharacters')}
                        />
                    </Stack>
                </Box>
                <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={bounties.length === 0} />
            </Stack>

            {bounties.length === 0 ? (
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
                    {t('common.noItems', { type: t('modules.BOUNTY').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <TableView
                    targetArray={bounties}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.BOUNTY}
                    onEdit={handleEditClick}
                />
            ) : (
                <GridView
                    targetArray={bounties}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.BOUNTY}
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
                    type: t(`modules.${ModuleTypes.BOUNTY}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.BOUNTY}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: t(`modules.${ModuleTypes.BOUNTY}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.BOUNTY}
                isDelete={true}
                isClearAll={true}
            />

            {/* Edit dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (target: Gang | Building | FixerJob | Character | Item | Bounty) => void}
                target={bountyToEdit}
                moduleType={ModuleTypes.BOUNTY}
                setIsSaving={setIsSaving}
            />
        </Container>
    )
}

export default BountyView
