import { FormControl, GridLegacy as Grid, InputLabel, MenuItem, Select, Stack, SxProps, TextField } from '@mui/material'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import { Character, CharacterAttitude, CharacterType } from '../../../graphql/types.ts'
import { handleRegenerateImage } from '../../../utils/apiUtils.tsx'
import { ModuleTypes } from '../../../utils/constants.ts'
import ImageField from './ImageField.tsx'

export type FormCharacterProps = {
    editedTarget: Character
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setCharacters?: Dispatch<SetStateAction<Character[]>>
    setCharacterToEdit?: Dispatch<SetStateAction<Character | null>>
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    handleImageUploadClick: () => void
    openDeleteImageDialog: () => void
    toggleFullscreenImage: (image: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: React.JSX.Element
}

export const FormCharacter = (props: FormCharacterProps) => {
    const {
        editedTarget,
        moduleType,
        setIsSaving,
        isGeneratingImage,
        setCharacterToEdit,
        setCharacters,
        setIsGeneratingImage,
        textFieldOutlinedStyle,
        handleChange,
        handleImageUploadClick,
        openDeleteImageDialog,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        hiddenFileInput,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    return (
        <>
            {hiddenFileInput}
            {/* Name */}
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('characters.labels.name')}
                    value={editedTarget.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Description
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('common.description')}
                    value={editedTarget.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    multiline
                />
            </Grid> */}

            <Grid item container xs={12} md={8}>
                <Stack spacing={2} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Type */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="type-label" sx={inputLabelStyle}>
                                {t('characters.labels.type')}
                            </InputLabel>
                            <Select
                                labelId="type-label"
                                value={editedTarget.type || ''}
                                onChange={(e) => handleChange('type', e.target.value)}
                                label={t('characters.labels.type')}
                                sx={selectStyle}
                            >
                                {Object.values(CharacterType).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`characters.type.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Attitude */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('characters.labels.attitude')}</InputLabel>
                            <Select
                                value={editedTarget.attitude || ''}
                                onChange={(e) => handleChange('attitude', e.target.value)}
                                label={t('characters.labels.attitude')}
                                sx={selectStyle}
                            >
                                {Object.values(CharacterAttitude).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`characters.attitude.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Grid>
            {/* Image */}
            <Grid item xs={12} md={4}>
                <ImageField
                    image={editedTarget.image}
                    downloadName={editedTarget.name}
                    handleImageUploadClick={handleImageUploadClick}
                    handleImageRemove={openDeleteImageDialog}
                    toggleFullscreenImage={toggleFullscreenImage}
                    handleRegenerateClick={() => {
                        if (setIsGeneratingImage && setCharacters) {
                            handleRegenerateImage(
                                editedTarget,
                                readerMode,
                                setIsGeneratingImage,
                                setIsSaving,
                                moduleType,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                setCharacters,
                                setCharacterToEdit
                            )
                        }
                    }}
                    canRegenerate={!!editedTarget.name && !!editedTarget.type && !!editedTarget.attitude}
                    isGeneratingImage={isGeneratingImage}
                />
            </Grid>
        </>
    )
}

export default FormCharacter
