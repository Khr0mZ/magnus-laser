import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import { Bounty, Building, Character, FixerJob, Gang, Item } from '../../../graphql/types'
import colors from '../../../utils/colors'
import { ModuleTypes } from '../../../utils/constants'
import CustomScrollbar from '../../CustomScrollbar'
import { pulseGlowBlue, pulseGlowCyan } from '../Animations'
import { WarningDialog } from '../WarningDialog'
import FormBounty from './FormBounty.tsx'
import { FormBuilding } from './FormBuilding'
import FormCharacter from './FormCharacter.tsx'
import FormFixerJob from './FormFixerJob/FormFixerJob'
import FormGang from './FormGang'
import FormItem from './FormItem.tsx'

type EditDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (target: Gang | Building | FixerJob | Character | Item | Bounty) => void
    target: Gang | Building | FixerJob | Character | Item | Bounty | null
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setBuildings?: Dispatch<SetStateAction<Building[]>>
    setBuildingToEdit?: Dispatch<SetStateAction<Building | null>>
    setGangs?: Dispatch<SetStateAction<Gang[]>>
    setGangToEdit?: Dispatch<SetStateAction<Gang | null>>
    setFixerJobs?: Dispatch<SetStateAction<FixerJob[]>>
    setFixerJobToEdit?: Dispatch<SetStateAction<FixerJob | null>>
    setCharacters?: Dispatch<SetStateAction<Character[]>>
    setCharacterToEdit?: Dispatch<SetStateAction<Character | null>>
    setItems?: Dispatch<SetStateAction<Item[]>>
    setItemToEdit?: Dispatch<SetStateAction<Item | null>>
}

export const EditDialog = (props: EditDialogProps) => {
    const {
        open,
        onClose,
        onSave,
        target,
        moduleType,
        setIsGeneratingImage,
        setIsSaving,
        isGeneratingImage,
        setBuildings,
        setBuildingToEdit,
        setGangs,
        setGangToEdit,
        setFixerJobs,
        setFixerJobToEdit,
        setCharacters,
        setCharacterToEdit,
        setItems,
        setItemToEdit,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [editedTarget, setEditedTarget] = useState<Gang | Building | FixerJob | Character | Item | Bounty | null>(
        null
    )
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false)
    const [fullscreenImage, setFullscreenImage] = useState(false)
    const [currentImageField, setCurrentImageField] = useState<string>('image')

    // Moved function definition before usage to fix linter error
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                handleChange(currentImageField, reader.result as string)
                // Reset file input value using the ref AFTER processing is done
                if (fileInputRef.current) {
                    fileInputRef.current.value = '' // Or null
                }
            }
            reader.readAsDataURL(file)
        }
        // Reset file input value so the same file can be selected again
        // Moved the reset logic into onloadend to ensure it happens after processing
        // if (event.target) {
        //     event.target.value = ''
        // }
    }

    // Reusable Select style
    const selectStyle = {
        color: readerMode ? '#333' : '#fff',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
        },
        '& .MuiSvgIcon-root': {
            color: readerMode ? 'rgba(0, 0, 0, 0.54)' : '#fff',
        },
    }

    // Reusable FormControl style with hover animations for InputLabels
    const formControlStyle = {
        '&:hover .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
        '& .MuiInputBase-root.Mui-focused + .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
    }

    // InputLabel style
    const inputLabelStyle = {
        color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
        borderRadius: '4px',
        bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
        p: 0.5,
        py: 0.25,
        border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
    }

    // Reusable TextField styles
    const textFieldOutlinedStyle = {
        '& .MuiOutlinedInput-root': {
            color: readerMode ? '#333' : '#fff',
            '& fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
            },
        },
        '& .MuiInputLabel-root': {
            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
            borderRadius: '4px',
            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
            p: 0.5,
            py: 0.25,
            border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
        },
        '&:hover .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
    }

    // Hidden file input element (moved down)
    const hiddenFileInput = (
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            accept="image/*"
        />
    )

    useEffect(() => {
        if (target) {
            setEditedTarget({ ...target })
        }
    }, [target])

    const handleChange = (field: string, value: unknown) => {
        setEditedTarget((prev) => {
            if (!prev) return prev

            // --- Custom Deep Update Logic ---
            const newState = JSON.parse(JSON.stringify(prev)) // Start with a deep clone
            const parts = field.split('.')
            let current = newState

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i]
                // Ensure the intermediate path exists and is an object
                if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
                    current[part] = {} // Create if not exists or not an object
                }
                // Move to the next level
                current = current[part]
            }

            // Set the value at the final part of the path
            current[parts[parts.length - 1]] = value
            return newState
            // --- End Custom Deep Update Logic ---
        })
    }

    const handleSave = async () => {
        if (editedTarget && target) {
            onSave(editedTarget)
            setIsSaving(true)
        }
        onClose()
    }

    // --- Image Handlers ---

    const handleImageUploadClick = (targetField: string = 'image') => {
        setCurrentImageField(targetField)
        fileInputRef.current?.click()
    }

    const handleImageRemove = async (targetField: string = 'image') => {
        if (!editedTarget) return

        // Note: We're no longer deleting the blob immediately. This will happen when Save is clicked.

        // Update the field to null in the local state only
        handleChange(targetField, null)

        // We're no longer calling setIsSaving(true) here to prevent notistack notification
        // The saving will happen when the user clicks the Save button
    }

    const openDeleteImageDialog = (targetField: string = 'image') => {
        setCurrentImageField(targetField) // Set which field we're updating
        setDeleteImageDialogOpen(true)
    }

    // Add a handler to toggle fullscreen image
    const toggleFullscreenImage = (targetField: string) => {
        setCurrentImageField(targetField) // Set which field to show in fullscreen
        setFullscreenImage(!fullscreenImage)
    }

    if (!editedTarget) return null

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="xl"
                fullWidth
                slotProps={{
                    paper: {
                        sx: readerMode
                            ? {
                                  bgcolor: colors.grays.gray800 + ' !important',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                  color: '#333',
                              }
                            : {
                                  bgcolor: 'rgba(10, 15, 30, 0.95)',
                                  backdropFilter: 'blur(4px)',
                                  border: `1px solid ${colors.neons.cyan.default}40`,
                                  boxShadow: `0 0 20px ${colors.neons.cyan.default}40`,
                                  color: '#fff',
                                  position: 'relative',
                                  '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      backgroundImage:
                                          'linear-gradient(to right, rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
                                      backgroundSize: '20px 20px',
                                      pointerEvents: 'none',
                                      opacity: 0.5,
                                  },
                              },
                    },
                }}
            >
                <DialogTitle
                    sx={
                        readerMode
                            ? {
                                  color: '#0288d1',
                                  borderBottom: '1px solid #eee',
                              }
                            : {
                                  color: colors.neons.cyan.default,
                                  textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                  fontFamily: '"Orbitron", monospace',
                                  borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                                  position: 'relative',
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                  },
                              }
                    }
                >
                    <Typography
                        variant="h3"
                        className="glitch-text"
                        component="div"
                        data-text={
                            moduleType === ModuleTypes.GANG
                                ? t('gangs.editTitle')
                                : moduleType === ModuleTypes.BUILDING
                                ? t('buildings.editTitle')
                                : moduleType === ModuleTypes.CHARACTER
                                ? t('characters.editTitle')
                                : moduleType === ModuleTypes.ITEM
                                ? t('items.editTitle')
                                : moduleType === ModuleTypes.BOUNTY
                                ? t('bounties.editTitle')
                                : t('fixerJobs.editTitle')
                        }
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        }}
                    >
                        {moduleType === ModuleTypes.GANG
                            ? t('gangs.editTitle')
                            : moduleType === ModuleTypes.BUILDING
                            ? t('buildings.editTitle')
                            : moduleType === ModuleTypes.CHARACTER
                            ? t('characters.editTitle')
                            : moduleType === ModuleTypes.ITEM
                            ? t('items.editTitle')
                            : moduleType === ModuleTypes.BOUNTY
                            ? t('bounties.editTitle')
                            : t('fixerJobs.editTitle')}
                    </Typography>
                </DialogTitle>
                <DialogContent
                    sx={{
                        py: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '80vh',
                        pr: 0,
                    }}
                >
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                        <Grid container spacing={2} sx={{ pr: 3, mt: 3 }}>
                            {moduleType === ModuleTypes.GANG ? (
                                <FormGang
                                    editedTarget={editedTarget as Gang}
                                    moduleType={moduleType}
                                    setIsSaving={setIsSaving}
                                    isGeneratingImage={isGeneratingImage}
                                    setIsGeneratingImage={setIsGeneratingImage}
                                    setGangs={setGangs}
                                    setGangToEdit={setGangToEdit}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    handleChange={handleChange}
                                    handleImageUploadClick={handleImageUploadClick}
                                    openDeleteImageDialog={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                />
                            ) : moduleType === ModuleTypes.BUILDING ? (
                                <FormBuilding
                                    editedTarget={editedTarget as Building}
                                    moduleType={moduleType}
                                    setIsSaving={setIsSaving}
                                    isGeneratingImage={isGeneratingImage}
                                    setIsGeneratingImage={setIsGeneratingImage}
                                    setBuildings={setBuildings}
                                    setBuildingToEdit={setBuildingToEdit}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    handleChange={handleChange}
                                    handleImageUploadClick={handleImageUploadClick}
                                    openDeleteImageDialog={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                />
                            ) : moduleType === ModuleTypes.FIXER_JOB ? (
                                <FormFixerJob
                                    editedTarget={editedTarget as FixerJob}
                                    moduleType={moduleType}
                                    setIsSaving={setIsSaving}
                                    isGeneratingImage={isGeneratingImage}
                                    setIsGeneratingImage={setIsGeneratingImage}
                                    setFixerJobs={setFixerJobs}
                                    setFixerJobToEdit={setFixerJobToEdit}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    handleChange={handleChange}
                                    handleImageUploadClick={handleImageUploadClick}
                                    openDeleteImageDialog={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                />
                            ) : moduleType === ModuleTypes.CHARACTER ? (
                                <FormCharacter
                                    editedTarget={editedTarget as Character}
                                    moduleType={moduleType}
                                    setIsSaving={setIsSaving}
                                    isGeneratingImage={isGeneratingImage}
                                    setIsGeneratingImage={setIsGeneratingImage}
                                    setCharacters={setCharacters}
                                    setCharacterToEdit={setCharacterToEdit}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                    handleChange={handleChange}
                                    handleImageUploadClick={handleImageUploadClick}
                                    openDeleteImageDialog={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                />
                            ) : moduleType === ModuleTypes.ITEM ? (
                                <FormItem
                                    editedTarget={editedTarget as Item}
                                    moduleType={moduleType}
                                    setIsSaving={setIsSaving}
                                    isGeneratingImage={isGeneratingImage}
                                    setIsGeneratingImage={setIsGeneratingImage}
                                    setItems={setItems}
                                    setItemToEdit={setItemToEdit}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                    handleChange={handleChange}
                                    handleImageUploadClick={handleImageUploadClick}
                                    openDeleteImageDialog={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                />
                            ) : moduleType === ModuleTypes.BOUNTY ? (
                                <FormBounty
                                    editedTarget={editedTarget as Bounty}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                    handleChange={handleChange}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                />
                            ) : (
                                <></>
                            )}
                        </Grid>
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={onClose}
                        sx={
                            readerMode
                                ? {
                                      color: '#0288d1',
                                  }
                                : {
                                      bgcolor: 'rgba(10, 20, 30, 0.6)',
                                      color: colors.neons.cyan.default,
                                      border: `1px solid ${colors.neons.cyan.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 30, 60, 0.8)',
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                      },
                                  }
                        }
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        sx={
                            readerMode
                                ? {
                                      color: colors.neons.green.dark,
                                  }
                                : {
                                      bgcolor: 'rgba(0, 20, 40, 0.6)',
                                      color: colors.neons.green.default,
                                      border: `1px solid ${colors.neons.green.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 40, 20, 0.8)',
                                          color: colors.neons.green.light,
                                          boxShadow: `0 0 10px ${colors.neons.green.default}60`,
                                          textShadow: `0 0 5px ${colors.neons.green.default}`,
                                          border: `1px solid ${colors.neons.green.default}70`,
                                      },
                                  }
                        }
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Image Delete Confirmation Dialog */}
            <WarningDialog
                open={deleteImageDialogOpen}
                onClose={() => setDeleteImageDialogOpen(false)}
                onConfirm={async () => {
                    await handleImageRemove(currentImageField)
                    setDeleteImageDialogOpen(false)
                }}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteImageConfirmation')}
                confirmColor="red"
                confirmText={t('common.delete')}
            />

            {/* Fullscreen Image Dialog */}
            <Dialog
                open={fullscreenImage}
                onClose={() => setFullscreenImage(false)}
                maxWidth={false}
                fullScreen
                aria-labelledby="fullscreen-image-title"
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)',
                            overflow: 'hidden',
                            position: 'relative',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                        },
                    },
                }}
                onClick={() => setFullscreenImage(false)}
                keepMounted={false}
                disablePortal={false}
                disableEnforceFocus={false}
                disableAutoFocus={false}
            >
                <Box
                    sx={{
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 0,
                        margin: 0,
                        position: 'relative',
                        overflowY: 'hidden',
                        '&::after': !readerMode
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  background:
                                      'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.9) 100%)',
                                  pointerEvents: 'none',
                                  zIndex: 1,
                              }
                            : {},
                    }}
                >
                    <Box
                        component="img"
                        src={currentImageField}
                        alt={
                            editedTarget &&
                            ('name' in editedTarget
                                ? editedTarget.name
                                : 'character' in editedTarget
                                ? editedTarget.character.name
                                : '')
                        }
                        id="fullscreen-image-title"
                        tabIndex={0}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            position: 'absolute',
                            padding: 0,
                            top: 0,
                            left: 0,
                        }}
                    />
                </Box>
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        color: readerMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                        zIndex: 10,
                        textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                        padding: '8px 16px',
                        backdropFilter: 'blur(5px)',
                        backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                        margin: '0 auto',
                        width: 'fit-content',
                        borderRadius: '4px',
                    }}
                >
                    {t('common.clickToClose')}
                </Typography>
            </Dialog>
        </>
    )
}

export default EditDialog
