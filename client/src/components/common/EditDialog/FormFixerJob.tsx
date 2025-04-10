import { FormControl, Grid, InputLabel, MenuItem, Select, SxProps, TextField, Typography } from '@mui/material'
import { Dispatch, SetStateAction, useCallback, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../../contexts/ReaderModeContext'
import {
    BuildingOwnership,
    BuildingSecurityPersonnel,
    BuildingStyle,
    BuildingType,
    FixerJob,
    GangType,
    JobDifficulty,
    PlotCharacterAttitude,
    PlotCharacterType,
    PlotCharacterVerb,
    PlotComplicationType,
    PlotGangComplicationType,
    PlotGangVerb,
    PlotItemCondition,
    PlotItemType,
    PlotItemVerb,
    PlotPlaceComplicationType,
    PlotPlaceVerb,
} from '../../../graphql/types'
import { handleRegenerateImage } from '../../../utils/apiUtils'
import { ModuleTypes } from '../../../utils/constants'
import { getJobDifficultyModifier } from '../../../utils/functions'
import { translateEnum, translateLabel } from '../../../utils/i18nUtils'
import ImageField from './ImageField'

export type FormFixerJobProps = {
    editedItem: FixerJob
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setFixerJobs?: Dispatch<SetStateAction<FixerJob[]>>
    setFixerJobToEdit?: Dispatch<SetStateAction<FixerJob | null>>
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    // Functions that likely need to know the target field
    handleImageUploadClick: (targetField: string) => void
    openDeleteImageDialog: (targetField: string) => void
    toggleFullscreenImage: (targetField: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element // This might need duplication if upload needs separate inputs
}

// Helper function to get nested value safely
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    if (!obj) return undefined
    const parts = path.split('.')
    let current = obj as Record<string, unknown>

    for (const part of parts) {
        if (!current || typeof current !== 'object') return undefined
        current = current[part] as Record<string, unknown>
    }

    return current
}

export const FormFixerJob = (props: FormFixerJobProps) => {
    const {
        editedItem,
        moduleType,
        setIsSaving,
        isGeneratingImage,
        setFixerJobToEdit,
        setFixerJobs,
        setIsGeneratingImage,
        textFieldOutlinedStyle,
        handleChange,
        handleImageUploadClick: baseHandleImageUploadClick,
        openDeleteImageDialog: baseOpenDeleteImageDialog,
        toggleFullscreenImage: baseToggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        hiddenFileInput,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    // Safe getters for plot property values
    const getPlotVerbValue = () => {
        if (editedItem.plot?.verb && 'value' in editedItem.plot.verb) {
            return editedItem.plot.verb.value
        }
        return ''
    }

    const getSubjectType = () => {
        const subject = editedItem.plot?.subjectIfNotPlace
        if (!subject) return ''

        // Using type checking to determine the kind of subject
        if ('gang' in subject) {
            return 'GANG'
        } else if ('attitude' in subject) {
            return subject.type // It's a PlotCharacter
        } else if ('condition' in subject) {
            return subject.type // It's a PlotItem
        }

        return ''
    }

    // --- Image Handlers ---
    // Create a single reusable regenerate handler that takes the path as an argument
    const handleRegenerateClick = useCallback(
        (imageFieldPath: string) => {
            if (setIsGeneratingImage && setFixerJobs && editedItem.description) {
                handleRegenerateImage(
                    editedItem,
                    readerMode,
                    setIsGeneratingImage,
                    setIsSaving,
                    moduleType,
                    undefined, // setBuildings
                    undefined, // setBuildingToEdit
                    undefined, // setGangs
                    undefined, // setGangToEdit
                    setFixerJobs,
                    setFixerJobToEdit,
                    imageFieldPath // Pass the imageFieldPath to target the specific field
                )
            }
        },
        [editedItem, readerMode, setIsGeneratingImage, setIsSaving, moduleType, setFixerJobs, setFixerJobToEdit]
    )

    // Define image field paths as constants to avoid repetition
    const IMAGE_FIELDS = useMemo(
        () => ({
            main: 'image',
            character: 'plot.subjectIfNotPlace.image',
            item: 'plot.subjectIfNotPlace.image', // Same path as character for item subject
            gang: 'plot.subjectIfNotPlace.gang.image',
            place: 'plot.plotPlace.building.image',
        }),
        []
    )

    return (
        <>
            {hiddenFileInput}
            {/* Name */}
            <Grid item xs={12} md={8}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'name', 'fixerJobs')}
                    value={editedItem.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            {/* Job Difficulty */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="difficulty-label" sx={inputLabelStyle}>
                        {t('common.jobDifficultySelector.title')}
                    </InputLabel>
                    <Select
                        labelId="difficulty-label"
                        value={editedItem.difficulty || JobDifficulty.TYPICAL}
                        onChange={(e) => handleChange('difficulty', e.target.value)}
                        label={translateLabel(t, 'difficulty', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(JobDifficulty).map((difficulty) => (
                            <MenuItem key={difficulty} value={difficulty}>
                                {t(`common.jobDifficultySelector.${difficulty.toLowerCase()}`)} +
                                {getJobDifficultyModifier(difficulty)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12} md={8}>
                <TextField
                    fullWidth
                    label={t('common.description')}
                    value={editedItem.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    multiline
                />
            </Grid>

            {/* Image (Main) */}
            <Grid item xs={12} md={4}>
                <ImageField
                    image={editedItem.image}
                    name={editedItem.name}
                    handleImageUploadClick={() => baseHandleImageUploadClick(IMAGE_FIELDS.main)}
                    handleImageRemove={() => baseOpenDeleteImageDialog(IMAGE_FIELDS.main)}
                    toggleFullscreenImage={() => baseToggleFullscreenImage(IMAGE_FIELDS.main)}
                    handleRegenerateClick={() => handleRegenerateClick(IMAGE_FIELDS.main)}
                    canRegenerate={!!editedItem.description}
                    isGeneratingImage={isGeneratingImage}
                    readerMode={readerMode}
                />
            </Grid>

            {/* --- PLOT SECTION --- */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    {t('fixerJobs.sections.plotDetails', 'Mission Parameters')}
                </Typography>
            </Grid>

            {/* Plot Verb */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="plot-verb-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.verb.value', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="plot-verb-label"
                        value={getPlotVerbValue()}
                        onChange={(e) => handleChange('plot.verb.value', e.target.value)}
                        label={translateLabel(t, 'plot.verb.value', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {/* Combined all verb types */}
                        {[
                            ...Object.values(PlotCharacterVerb),
                            ...Object.values(PlotItemVerb),
                            ...Object.values(PlotGangVerb),
                            ...Object.values(PlotPlaceVerb),
                        ].map((verb) => (
                            <MenuItem key={verb} value={verb}>
                                {translateEnum(t, verb, 'fixerJobs.verb')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Subject Category Selector */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="subject-category-label" sx={inputLabelStyle}>
                        {t('fixerJobs.subjectCategory', 'Subject Type')}
                    </InputLabel>
                    <Select
                        labelId="subject-category-label"
                        value={
                            getSubjectType() === 'GANG'
                                ? 'GANG'
                                : editedItem.plot?.subjectIfNotPlace && 'condition' in editedItem.plot.subjectIfNotPlace
                                ? 'ITEM'
                                : 'CHARACTER'
                        }
                        onChange={(e) => {
                            // Handle different category types
                            const newCategory = e.target.value
                            // Get the current subject if any
                            const currentSubject = editedItem.plot?.subjectIfNotPlace
                            // Preserve images when possible
                            const existingImage =
                                currentSubject && !('gang' in currentSubject) ? currentSubject.image : ''
                            const existingGangImage =
                                currentSubject && 'gang' in currentSubject ? currentSubject.gang?.image : ''

                            // Reset subject data based on category
                            let updateData: Record<string, unknown> = {}

                            if (newCategory === 'GANG') {
                                updateData = {
                                    'plot.subjectIfNotPlace': {
                                        gang: {
                                            name: '',
                                            type: Object.values(GangType)[0],
                                            image: existingGangImage || '',
                                            complication: {
                                                type: '',
                                                character: null,
                                                item: null,
                                            },
                                        },
                                    },
                                }
                            } else if (newCategory === 'CHARACTER') {
                                updateData = {
                                    'plot.subjectIfNotPlace': {
                                        name: '',
                                        type: Object.values(PlotCharacterType)[0],
                                        attitude: PlotCharacterAttitude.NEUTRAL_ATTITUDE_TOWARDS_THE_CREW,
                                        image: existingImage || '',
                                    },
                                }
                            } else if (newCategory === 'ITEM') {
                                updateData = {
                                    'plot.subjectIfNotPlace': {
                                        name: '',
                                        type: Object.values(PlotItemType)[0],
                                        condition: PlotItemCondition.AVERAGE_QUALITY,
                                        image: existingImage || '',
                                    },
                                }
                            }

                            handleChange('plot.subjectIfNotPlace', updateData['plot.subjectIfNotPlace'])
                        }}
                        label={t('fixerJobs.subjectCategory', 'Subject Type')}
                        sx={selectStyle}
                    >
                        <MenuItem value="CHARACTER">{t('fixerJobs.categories.character', 'Character')}</MenuItem>
                        <MenuItem value="ITEM">{t('fixerJobs.categories.item', 'Item')}</MenuItem>
                        <MenuItem value="GANG">{t('fixerJobs.categories.gang', 'Gang')}</MenuItem>
                        {/* TODO: Handle location type */}
                        <MenuItem value="LOCATION">{t('fixerJobs.categories.location', 'Location')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            {/* Subject Name */}
            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.subjectIfNotPlace.name', 'fixerJobs')}
                    value={
                        getSubjectType() === 'GANG'
                            ? getNestedValue(editedItem, 'plot.subjectIfNotPlace.gang.name') || ''
                            : getNestedValue(editedItem, 'plot.subjectIfNotPlace.name') || ''
                    }
                    onChange={(e) => {
                        if (getSubjectType() === 'GANG') {
                            handleChange('plot.subjectIfNotPlace.gang.name', e.target.value)
                        } else {
                            handleChange('plot.subjectIfNotPlace.name', e.target.value)
                        }
                    }}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            {/* --- CHARACTER SECTION --- */}
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, ml: 2, color: 'text.secondary' }}>
                    {t('fixerJobs.sections.characterDetails', 'Character Details')}
                </Typography>
            </Grid>

            {/* Character Type - Specific to character category */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="character-type-label" sx={inputLabelStyle}>
                        {`${translateLabel(t, 'plot.subjectIfNotPlace.type', 'fixerJobs')} (${t(
                            'fixerJobs.categories.character',
                            'Character'
                        )})`}
                    </InputLabel>
                    <Select
                        labelId="character-type-label"
                        value={
                            (editedItem.plot?.subjectIfNotPlace &&
                            !('gang' in editedItem.plot.subjectIfNotPlace) &&
                            'attitude' in editedItem.plot.subjectIfNotPlace
                                ? editedItem.plot.subjectIfNotPlace.type
                                : '') || ''
                        }
                        onChange={(e) => {
                            // If we already have a character subject, just update its type
                            if (
                                editedItem.plot?.subjectIfNotPlace &&
                                !('gang' in editedItem.plot.subjectIfNotPlace) &&
                                'attitude' in editedItem.plot.subjectIfNotPlace
                            ) {
                                handleChange('plot.subjectIfNotPlace.type', e.target.value)
                            } else {
                                // Otherwise we need to create a new character subject
                                const updateData = {
                                    'plot.subjectIfNotPlace': {
                                        name: '',
                                        type: e.target.value,
                                        attitude: PlotCharacterAttitude.NEUTRAL_ATTITUDE_TOWARDS_THE_CREW,
                                        image: '',
                                    },
                                }
                                handleChange('plot.subjectIfNotPlace', updateData['plot.subjectIfNotPlace'])
                            }
                        }}
                        label={`${translateLabel(t, 'plot.subjectIfNotPlace.type', 'fixerJobs')} (${t(
                            'fixerJobs.categories.character',
                            'Character'
                        )})`}
                        sx={selectStyle}
                    >
                        {Object.values(PlotCharacterType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.character')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Character Attitude */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="subject-attitude-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.subjectIfNotPlace.attitude', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="subject-attitude-label"
                        value={
                            editedItem.plot?.subjectIfNotPlace && 'attitude' in editedItem.plot.subjectIfNotPlace
                                ? editedItem.plot.subjectIfNotPlace.attitude || ''
                                : ''
                        }
                        onChange={(e) => handleChange('plot.subjectIfNotPlace.attitude', e.target.value)}
                        label={translateLabel(t, 'plot.subjectIfNotPlace.attitude', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotCharacterAttitude).map((attitude) => (
                            <MenuItem key={attitude} value={attitude}>
                                {translateEnum(t, attitude, 'fixerJobs.characterAttitude')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Character Image */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel
                        id="character-image-label"
                        sx={{
                            ...inputLabelStyle,
                            top: -25,
                            lineHeight: '1 !important',
                            py: '0 !important',
                        }}
                    >
                        <Typography variant="caption" sx={{ mt: -20 }}>
                            {translateLabel(t, 'plot.subjectIfNotPlace.image', 'fixerJobs')} (
                            {t('fixerJobs.categories.character', 'Character')})
                        </Typography>
                    </InputLabel>
                    <ImageField
                        image={getNestedValue(editedItem, IMAGE_FIELDS.character) as string | null | undefined}
                        name={getNestedValue(editedItem, 'plot.subjectIfNotPlace.name') as string | undefined}
                        handleImageUploadClick={() => baseHandleImageUploadClick(IMAGE_FIELDS.character)}
                        handleImageRemove={() => baseOpenDeleteImageDialog(IMAGE_FIELDS.character)}
                        toggleFullscreenImage={() => baseToggleFullscreenImage(IMAGE_FIELDS.character)}
                        handleRegenerateClick={() => handleRegenerateClick(IMAGE_FIELDS.character)}
                        canRegenerate={!!editedItem.description}
                        isGeneratingImage={isGeneratingImage}
                        readerMode={readerMode}
                    />
                </FormControl>
            </Grid>

            {/* --- ITEM SECTION --- */}
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, ml: 2, color: 'text.secondary' }}>
                    {t('fixerJobs.sections.itemDetails', 'Item Details')}
                </Typography>
            </Grid>

            {/* Item Type - Specific to item category */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="item-type-label" sx={inputLabelStyle}>
                        {`${translateLabel(t, 'plot.subjectIfNotPlace.type', 'fixerJobs')} (${t(
                            'fixerJobs.categories.item',
                            'Item'
                        )})`}
                    </InputLabel>
                    <Select
                        labelId="item-type-label"
                        value={
                            (editedItem.plot?.subjectIfNotPlace &&
                            !('gang' in editedItem.plot.subjectIfNotPlace) &&
                            'condition' in editedItem.plot.subjectIfNotPlace
                                ? editedItem.plot.subjectIfNotPlace.type
                                : '') || ''
                        }
                        onChange={(e) => {
                            // If we already have an item subject, just update its type
                            if (
                                editedItem.plot?.subjectIfNotPlace &&
                                !('gang' in editedItem.plot.subjectIfNotPlace) &&
                                'condition' in editedItem.plot.subjectIfNotPlace
                            ) {
                                handleChange('plot.subjectIfNotPlace.type', e.target.value)
                            } else {
                                // Otherwise we need to create a new item subject
                                const updateData = {
                                    'plot.subjectIfNotPlace': {
                                        name: '',
                                        type: e.target.value,
                                        condition: PlotItemCondition.AVERAGE_QUALITY,
                                        image: '',
                                    },
                                }
                                handleChange('plot.subjectIfNotPlace', updateData['plot.subjectIfNotPlace'])
                            }
                        }}
                        label={`${translateLabel(t, 'plot.subjectIfNotPlace.type', 'fixerJobs')} (${t(
                            'fixerJobs.categories.item',
                            'Item'
                        )})`}
                        sx={selectStyle}
                    >
                        {Object.values(PlotItemType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.item')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Item Condition */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="subject-condition-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.subjectIfNotPlace.condition', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="subject-condition-label"
                        value={
                            editedItem.plot?.subjectIfNotPlace && 'condition' in editedItem.plot.subjectIfNotPlace
                                ? editedItem.plot.subjectIfNotPlace.condition || ''
                                : ''
                        }
                        onChange={(e) => handleChange('plot.subjectIfNotPlace.condition', e.target.value)}
                        label={translateLabel(t, 'plot.subjectIfNotPlace.condition', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotItemCondition).map((condition) => (
                            <MenuItem key={condition} value={condition}>
                                {translateEnum(t, condition, 'fixerJobs.itemCondition')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Item Image */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel
                        id="item-image-label"
                        sx={{
                            ...inputLabelStyle,
                            top: -25,
                            lineHeight: '1 !important',
                            py: '0 !important',
                        }}
                    >
                        <Typography variant="caption" sx={{ mt: -20 }}>
                            {translateLabel(t, 'plot.subjectIfNotPlace.image', 'fixerJobs')} (
                            {t('fixerJobs.categories.item', 'Item')})
                        </Typography>
                    </InputLabel>
                    <ImageField
                        image={getNestedValue(editedItem, IMAGE_FIELDS.item) as string | null | undefined}
                        name={getNestedValue(editedItem, 'plot.subjectIfNotPlace.name') as string | undefined}
                        handleImageUploadClick={() => baseHandleImageUploadClick(IMAGE_FIELDS.item)}
                        handleImageRemove={() => baseOpenDeleteImageDialog(IMAGE_FIELDS.item)}
                        toggleFullscreenImage={() => baseToggleFullscreenImage(IMAGE_FIELDS.item)}
                        handleRegenerateClick={() => handleRegenerateClick(IMAGE_FIELDS.item)}
                        canRegenerate={!!editedItem.description}
                        isGeneratingImage={isGeneratingImage}
                        readerMode={readerMode}
                    />
                </FormControl>
            </Grid>

            {/* --- GANG SECTION --- */}
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, ml: 2, color: 'text.secondary' }}>
                    {t('fixerJobs.sections.gangDetails', 'Gang Details')}
                </Typography>
            </Grid>

            {/* Gang Type */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="gang-type-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.subjectIfNotPlace.gang.type', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="gang-type-label"
                        value={getNestedValue(editedItem, 'plot.subjectIfNotPlace.gang.type') || ''}
                        onChange={(e) => handleChange('plot.subjectIfNotPlace.gang.type', e.target.value)}
                        label={translateLabel(t, 'plot.subjectIfNotPlace.gang.type', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(GangType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'gangs.type')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Gang Complication Type */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="gang-complication-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.subjectIfNotPlace.gang.complication.type', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="gang-complication-label"
                        value={
                            (editedItem.plot?.subjectIfNotPlace &&
                                'gang' in editedItem.plot.subjectIfNotPlace &&
                                editedItem.plot.subjectIfNotPlace.complication?.type) ||
                            ''
                        }
                        onChange={(e) => handleChange('plot.subjectIfNotPlace.complication.type', e.target.value)}
                        label={translateLabel(t, 'plot.subjectIfNotPlace.gang.complication.type', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotGangComplicationType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.gangComplication')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Gang Image */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel
                        id="gang-image-label"
                        sx={{
                            ...inputLabelStyle,
                            top: -25,
                            lineHeight: '1 !important',
                            py: '0 !important',
                        }}
                    >
                        <Typography variant="caption" sx={{ mt: -20 }}>
                            {translateLabel(t, 'plot.subjectIfNotPlace.gang.image', 'fixerJobs')}
                        </Typography>
                    </InputLabel>
                    <ImageField
                        image={getNestedValue(editedItem, IMAGE_FIELDS.gang) as string | null | undefined}
                        name={getNestedValue(editedItem, 'plot.subjectIfNotPlace.gang.name') as string | undefined}
                        handleImageUploadClick={() => baseHandleImageUploadClick(IMAGE_FIELDS.gang)}
                        handleImageRemove={() => baseOpenDeleteImageDialog(IMAGE_FIELDS.gang)}
                        toggleFullscreenImage={() => baseToggleFullscreenImage(IMAGE_FIELDS.gang)}
                        handleRegenerateClick={() => handleRegenerateClick(IMAGE_FIELDS.gang)}
                        canRegenerate={!!editedItem.description}
                        isGeneratingImage={isGeneratingImage}
                        readerMode={readerMode}
                    />
                </FormControl>
            </Grid>

            {/* Gang Complication Character/Item Names */}
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.subjectIfNotPlace.gang.complication.character.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.subjectIfNotPlace.gang.complication.character.name') || ''}
                    onChange={(e) =>
                        handleChange('plot.subjectIfNotPlace.gang.complication.character.name', e.target.value)
                    }
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.subjectIfNotPlace.gang.complication.item.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.subjectIfNotPlace.gang.complication.item.name') || ''}
                    onChange={(e) => handleChange('plot.subjectIfNotPlace.gang.complication.item.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            {/* --- BUILDING LOCATION SECTION --- */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    {t('fixerJobs.sections.location', 'Location Intel')}
                </Typography>
            </Grid>

            {/* Plot Place Building Info */}
            <Grid item xs={12} md={8}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.plotPlace.building.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.plotPlace.building.name') || ''}
                    onChange={(e) => handleChange('plot.plotPlace.building.name', e.target.value)}
                    variant="outlined"
                    sx={{ ...textFieldOutlinedStyle, mb: 2 }}
                />

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="plot-place-building-type-label" sx={inputLabelStyle}>
                                {translateLabel(t, 'plot.plotPlace.building.type', 'fixerJobs')}
                            </InputLabel>
                            <Select
                                labelId="plot-place-building-type-label"
                                value={getNestedValue(editedItem, 'plot.plotPlace.building.type') || ''}
                                onChange={(e) => handleChange('plot.plotPlace.building.type', e.target.value)}
                                label={translateLabel(t, 'plot.plotPlace.building.type', 'fixerJobs')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {translateEnum(t, type, 'buildings.type')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="plot-place-building-style-label" sx={inputLabelStyle}>
                                {translateLabel(t, 'plot.plotPlace.building.style', 'fixerJobs')}
                            </InputLabel>
                            <Select
                                labelId="plot-place-building-style-label"
                                value={getNestedValue(editedItem, 'plot.plotPlace.building.style') || ''}
                                onChange={(e) => handleChange('plot.plotPlace.building.style', e.target.value)}
                                label={translateLabel(t, 'plot.plotPlace.building.style', 'fixerJobs')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingStyle).map((style) => (
                                    <MenuItem key={style} value={style}>
                                        {translateEnum(t, style, 'buildings.style')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="plot-place-building-ownership-label" sx={inputLabelStyle}>
                                {translateLabel(t, 'plot.plotPlace.building.ownership', 'fixerJobs')}
                            </InputLabel>
                            <Select
                                labelId="plot-place-building-ownership-label"
                                value={getNestedValue(editedItem, 'plot.plotPlace.building.ownership') || ''}
                                onChange={(e) => handleChange('plot.plotPlace.building.ownership', e.target.value)}
                                label={translateLabel(t, 'plot.plotPlace.building.ownership', 'fixerJobs')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingOwnership).map((ownership) => (
                                    <MenuItem key={ownership} value={ownership}>
                                        {translateEnum(t, ownership, 'buildings.ownership')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="plot-place-building-security-label" sx={inputLabelStyle}>
                                {translateLabel(t, 'plot.plotPlace.building.securityPersonnel', 'fixerJobs')}
                            </InputLabel>
                            <Select
                                labelId="plot-place-building-security-label"
                                value={getNestedValue(editedItem, 'plot.plotPlace.building.securityPersonnel') || ''}
                                onChange={(e) =>
                                    handleChange('plot.plotPlace.building.securityPersonnel', e.target.value)
                                }
                                label={translateLabel(t, 'plot.plotPlace.building.securityPersonnel', 'fixerJobs')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingSecurityPersonnel).map((security) => (
                                    <MenuItem key={security} value={security}>
                                        {translateEnum(t, security, 'buildings.securityPersonnel')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Grid>

            {/* Building Image */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel
                        id="character-image-label"
                        sx={{
                            ...inputLabelStyle,
                            top: -25,
                            lineHeight: '1 !important',
                            py: '0 !important',
                        }}
                    >
                        <Typography variant="caption" sx={{ mt: -20 }}>
                            {translateLabel(t, 'plot.plotPlace.building.image', 'fixerJobs')}
                        </Typography>
                    </InputLabel>
                    <ImageField
                        image={getNestedValue(editedItem, IMAGE_FIELDS.place) as string | null | undefined}
                        name={getNestedValue(editedItem, 'plot.plotPlace.building.name') as string | undefined}
                        handleImageUploadClick={() => baseHandleImageUploadClick(IMAGE_FIELDS.place)}
                        handleImageRemove={() => baseOpenDeleteImageDialog(IMAGE_FIELDS.place)}
                        toggleFullscreenImage={() => baseToggleFullscreenImage(IMAGE_FIELDS.place)}
                        handleRegenerateClick={() => handleRegenerateClick(IMAGE_FIELDS.place)}
                        canRegenerate={!!editedItem.description}
                        isGeneratingImage={isGeneratingImage}
                        readerMode={readerMode}
                    />
                </FormControl>
            </Grid>

            {/* Place Complication */}
            <Grid item xs={12} md={12}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="place-complication-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.plotPlace.complication.type', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="place-complication-label"
                        value={getNestedValue(editedItem, 'plot.plotPlace.complication.type') || ''}
                        onChange={(e) => handleChange('plot.plotPlace.complication.type', e.target.value)}
                        label={translateLabel(t, 'plot.plotPlace.complication.type', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotPlaceComplicationType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.locationComplication')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Plot Place Complication Names */}
            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.plotPlace.complication.character.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.plotPlace.complication.character.name') || ''}
                    onChange={(e) => handleChange('plot.plotPlace.complication.character.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.plotPlace.complication.item.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.plotPlace.complication.item.name') || ''}
                    onChange={(e) => handleChange('plot.plotPlace.complication.item.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.plotPlace.complication.gang.gang.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.plotPlace.complication.gang.gang.name') || ''}
                    onChange={(e) => handleChange('plot.plotPlace.complication.gang.gang.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            {/* --- MAIN COMPLICATION SECTION --- */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    {t('fixerJobs.sections.mainComplication', 'Mission Complications')}
                </Typography>
            </Grid>

            {/* Main Complication Type */}
            <Grid item xs={12} md={12}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="complication-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.complication.type', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="complication-label"
                        value={getNestedValue(editedItem, 'plot.complication.type') || ''}
                        onChange={(e) => handleChange('plot.complication.type', e.target.value)}
                        label={translateLabel(t, 'plot.complication.type', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotComplicationType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.complication')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Complication Character */}
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.complication.character.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.complication.character.name') || ''}
                    onChange={(e) => handleChange('plot.complication.character.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="complication-character-type-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.complication.character.type', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="complication-character-type-label"
                        value={getNestedValue(editedItem, 'plot.complication.character.type') || ''}
                        onChange={(e) => handleChange('plot.complication.character.type', e.target.value)}
                        label={translateLabel(t, 'plot.complication.character.type', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotCharacterType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.character')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Complication Item */}
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.complication.item.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.complication.item.name') || ''}
                    onChange={(e) => handleChange('plot.complication.item.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="complication-item-type-label" sx={inputLabelStyle}>
                        {translateLabel(t, 'plot.complication.item.type', 'fixerJobs')}
                    </InputLabel>
                    <Select
                        labelId="complication-item-type-label"
                        value={getNestedValue(editedItem, 'plot.complication.item.type') || ''}
                        onChange={(e) => handleChange('plot.complication.item.type', e.target.value)}
                        label={translateLabel(t, 'plot.complication.item.type', 'fixerJobs')}
                        sx={selectStyle}
                    >
                        {Object.values(PlotItemType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {translateEnum(t, type, 'fixerJobs.item')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Complication Gang */}
            <Grid item xs={12} md={12}>
                <TextField
                    fullWidth
                    label={translateLabel(t, 'plot.complication.gang.gang.name', 'fixerJobs')}
                    value={getNestedValue(editedItem, 'plot.complication.gang.gang.name') || ''}
                    onChange={(e) => handleChange('plot.complication.gang.gang.name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
        </>
    )
}

export default FormFixerJob
