import { FormControl, Grid, InputLabel, MenuItem, Select, Stack, SxProps, TextField } from '@mui/material'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import { Item, ItemCondition, ItemType } from '../../../graphql/types.ts'
import { handleRegenerateImage } from '../../../utils/apiUtils.tsx'
import { ModuleTypes } from '../../../utils/constants.ts'
import ImageField from './ImageField.tsx'

export type FormItemProps = {
    editedTarget: Item
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setItems?: Dispatch<SetStateAction<Item[]>>
    setItemToEdit?: Dispatch<SetStateAction<Item | null>>
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    handleImageUploadClick: () => void
    openDeleteImageDialog: () => void
    toggleFullscreenImage: (image: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element
}

export const FormItem = (props: FormItemProps) => {
    const {
        editedTarget,
        moduleType,
        setIsSaving,
        isGeneratingImage,
        setItemToEdit,
        setItems,
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
                    label={t('items.labels.name')}
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
                                {t('items.labels.type')}
                            </InputLabel>
                            <Select
                                labelId="type-label"
                                value={editedTarget.type || ''}
                                onChange={(e) => handleChange('type', e.target.value)}
                                label={t('items.labels.type')}
                                sx={selectStyle}
                            >
                                {Object.values(ItemType).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`items.type.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Condition */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('items.labels.condition')}</InputLabel>
                            <Select
                                value={editedTarget.condition || ''}
                                onChange={(e) => handleChange('condition', e.target.value)}
                                label={t('items.labels.condition')}
                                sx={selectStyle}
                            >
                                {Object.values(ItemCondition).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`items.condition.${value}`)}
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
                        if (setIsGeneratingImage && setItems) {
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
                                undefined,
                                undefined,
                                setItems,
                                setItemToEdit
                            )
                        }
                    }}
                    canRegenerate={!!editedTarget.name && !!editedTarget.type && !!editedTarget.condition}
                    isGeneratingImage={isGeneratingImage}
                />
            </Grid>
        </>
    )
}

export default FormItem
