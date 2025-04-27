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
import { generateRandomCharacter } from '../../utils/generators/generatorCharacter.ts'
import { clearCharacters, saveCharacters, saveViewPreference } from '../../utils/storage.ts'

// Add window.charactersDataLoaded declaration
declare global {
    interface Window {
        charactersDataLoaded?: boolean
    }
}

const CharacterView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('modules.CHARACTER')}`)
    const { readerMode, viewPreferences, viewPrefsLoaded, updateViewPreference } = useUserPreferences()
    const { characters: dataCharacters, setCharacters: setDataCharacters, isLoading } = useData()
    const [characters, setCharacters] = useState<Character[]>([])

    // Use view preference from context
    const [compactView, setCompactView] = useState(() => {
        return viewPrefsLoaded ? viewPreferences[ModuleTypes.CHARACTER] : false
    })

    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [characterToDelete, setCharacterToDelete] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null)
    const prevCharactersRef = useRef<number>(0)
    const prevCharactersDataRef = useRef<Character[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const syncingFromContextRef = useRef(false)
    const updatingContextRef = useRef(false)

    // Update local state when view preferences change
    useEffect(() => {
        if (viewPrefsLoaded) {
            setCompactView(viewPreferences[ModuleTypes.CHARACTER])
        }
    }, [viewPreferences, viewPrefsLoaded])

    // Update local state when data context changes
    useEffect(() => {
        // Prevent infinite loop - only update if we're not currently updating context
        if (updatingContextRef.current) return

        // Mark that we're syncing from context
        syncingFromContextRef.current = true

        // Always sync with context data, even if empty
        setCharacters(dataCharacters)
        prevCharactersRef.current = dataCharacters.length
        prevCharactersDataRef.current = structuredClone(dataCharacters)

        // Reset the syncing flag after state update
        setTimeout(() => {
            syncingFromContextRef.current = false
        }, 0)
    }, [dataCharacters])

    // Save characters to storage when they change
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }

        // Skip if the change was triggered by syncing from context
        if (syncingFromContextRef.current) return

        // Check if the data has actually changed to avoid unnecessary saves
        if (isEqual(characters, prevCharactersDataRef.current)) return

        // Set updating context flag
        updatingContextRef.current = true

        // Always save the data when it exists
        if (characters.length > 0) {
            saveCharacters(characters)
            setDataCharacters(characters) // Update context data
        } else if (prevCharactersRef.current > 0 && characters.length === 0 && !isLoading) {
            // Only clear if we previously had characters and now we don't
            // AND we're not still loading data
            clearCharacters()
            setDataCharacters([])
        }

        // Update references
        prevCharactersRef.current = characters.length
        prevCharactersDataRef.current = structuredClone(characters)

        // Reset the context updating flag after state update
        setTimeout(() => {
            updatingContextRef.current = false
        }, 0)
    }, [characters, setDataCharacters, isLoading])

    const handleGenerateCharacter = async () => {
        setIsGenerating(true)
        try {
            const newCharacter = await generateRandomCharacter()
            setCharacters((prevCharacters) => [newCharacter, ...prevCharacters])
            setIsSaving(true)
        } catch (error) {
            console.warn('Failed to generate character:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = async () => {
        setCharacters([])
        await clearCharacters()
        setDataCharacters([]) // Update context data
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setCharacterToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (characterToDelete !== null) {
            setCharacters((prevCharacters) => prevCharacters.filter((_, i) => i !== characterToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setCharacterToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setCharacterToDelete(null)
    }

    const handleEditClick = (ID: string) => {
        const character = characters.find((character) => character.ID === ID)
        if (character) {
            setCharacterToEdit(character)
            setEditDialogOpen(true)
        }
    }

    const handleEditSave = (editedTarget: Character) => {
        setCharacters((prevCharacters) =>
            prevCharacters.map((character) => (character.ID === editedTarget.ID ? editedTarget : character))
        )
        setIsSaving(true)
        setEditDialogOpen(false)
        setCharacterToEdit(null)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setCharacterToEdit(null)
    }

    const handleViewChange = async (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView === null) return

        const isTableView = newView === 'table'
        setCompactView(isTableView)

        // Save view preference to storage and update context
        await saveViewPreference(ModuleTypes.CHARACTER, isTableView)
        updateViewPreference(ModuleTypes.CHARACTER, isTableView)
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
                    data-text={t('characters.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('characters.title')}
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
                {t('modules.CHARACTER_DESCRIPTION')}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <GenerateButton isGenerating={isGenerating} handleGenerate={handleGenerateCharacter} />
                <ClearAllButton handleClearAllClick={handleClearAllClick} disabled={characters.length === 0} />
            </Stack>

            {characters.length === 0 ? (
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
                    {t('common.noItems', { type: t('modules.CHARACTER').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <TableView
                    targetArray={characters}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.CHARACTER}
                    onEdit={handleEditClick}
                />
            ) : (
                <GridView
                    targetArray={characters}
                    onDelete={handleDeleteClick}
                    moduleType={ModuleTypes.CHARACTER}
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
                    type: t(`modules.${ModuleTypes.CHARACTER}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.CHARACTER}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: t(`modules.${ModuleTypes.CHARACTER}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.CHARACTER}
                isDelete={true}
                isClearAll={true}
            />

            {/* Edit dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (target: Gang | Building | FixerJob | Character | Item | Bounty) => void}
                target={characterToEdit}
                moduleType={ModuleTypes.CHARACTER}
                isGeneratingImage={isGeneratingImage}
                setIsGeneratingImage={setIsGeneratingImage}
                setIsSaving={setIsSaving}
                setCharacters={setCharacters}
                setCharacterToEdit={setCharacterToEdit}
            />
        </Container>
    )
}

export default CharacterView
