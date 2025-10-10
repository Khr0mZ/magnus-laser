import {
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    SxProps,
    TextField,
    Typography,
} from '@mui/material'
import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../../contexts/dataHooks'
import { useUserPreferences } from '../../../../contexts/userPreferencesHooks.ts'
import {
    Character,
    CharacterVerb,
    FixerJob,
    Item,
    ItemVerb,
    JobDifficulty,
    PlotBuilding,
    PlotBuildingVerb,
    PlotGang,
    PlotGangComplicationType,
    PlotGangVerb,
} from '../../../../graphql/types'
import { handleRegenerateImage } from '../../../../utils/apiUtils'
import { ImageFields, ModuleTypes } from '../../../../utils/constants'
import { getJobDifficultyModifier } from '../../../../utils/functions'
import ImageField from '../ImageField'
import CardBuilding from './CardBuilding'
import CardCharacter from './CardCharacter'
import CardGang from './CardGang'
import CardItem from './CardItem'
import CardMainComplication from './CardMainComplication'

export type FormFixerJobProps = {
    editedTarget: FixerJob
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
    hiddenFileInput: React.JSX.Element // This might need duplication if upload needs separate inputs
}

export const FormFixerJob = (props: FormFixerJobProps) => {
    const {
        editedTarget,
        moduleType,
        setIsSaving,
        isGeneratingImage,
        setFixerJobToEdit,
        setFixerJobs,
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
    const { gangs, items, characters } = useData()

    // Store original data when dialog opens to restore when switching categories
    const originalJobRef = useRef<FixerJob | null>(null)

    useEffect(() => {
        // Store the original job data on mount or when editedTarget ID changes
        if (editedTarget && (!originalJobRef.current || originalJobRef.current.ID !== editedTarget.ID)) {
            originalJobRef.current = structuredClone(editedTarget)
        }
    }, [editedTarget?.ID])

    // --- Image Handlers ---
    // Create a single reusable regenerate handler that takes the path as an argument
    const handleRegenerateClick = useCallback(
        (imageFieldPath: string) => {
            if (setIsGeneratingImage && setFixerJobs && editedTarget.description) {
                handleRegenerateImage(
                    editedTarget,
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
                    undefined, // setCharacters
                    undefined, // setCharacterToEdit
                    undefined, // setItems
                    undefined, // setItemToEdit
                    imageFieldPath // Pass the imageFieldPath to target the specific field
                )
            }
        },
        [editedTarget, readerMode, setIsGeneratingImage, setIsSaving, moduleType, setFixerJobs, setFixerJobToEdit]
    )

    const getVerbOptions = () => {
        switch (editedTarget.plot.verb.__typename) {
            case 'CharacterVerbWrapper':
                return Object.values(CharacterVerb)
            case 'ItemVerbWrapper':
                return Object.values(ItemVerb)
            case 'PlotGangVerbWrapper':
                return Object.values(PlotGangVerb)
            case 'PlotBuildingVerbWrapper':
            default:
                return Object.values(PlotBuildingVerb)
        }
    }

    const handleChangeSubjectCategory = (e: SelectChangeEvent<string>) => {
        // Handle different category types
        const newCategory = e.target.value
        const original = originalJobRef.current

        // Reset subject data based on category
        if (newCategory === 'CharacterVerbWrapper') {
            // Try to restore from original if it was the same category
            if (original?.plot.verb.__typename === 'CharacterVerbWrapper') {
                handleChange('plot.plotSubject', original.plot.plotSubject)
                handleChange('plot.verb', original.plot.verb)
            } else {
                // Initialize with defaults
                handleChange('plot.plotSubject', characters[0] || null)
                handleChange('plot.verb', {
                    __typename: 'CharacterVerbWrapper',
                    value: Object.values(CharacterVerb)[0],
                })
            }
        } else if (newCategory === 'ItemVerbWrapper') {
            if (original?.plot.verb.__typename === 'ItemVerbWrapper') {
                handleChange('plot.plotSubject', original.plot.plotSubject)
                handleChange('plot.verb', original.plot.verb)
            } else {
                handleChange('plot.plotSubject', items[0] || null)
                handleChange('plot.verb', {
                    __typename: 'ItemVerbWrapper',
                    value: Object.values(ItemVerb)[0],
                })
            }
        } else if (newCategory === 'PlotGangVerbWrapper') {
            if (original?.plot.verb.__typename === 'PlotGangVerbWrapper') {
                handleChange('plot.plotSubject', original.plot.plotSubject)
                handleChange('plot.verb', original.plot.verb)
            } else {
                handleChange('plot.plotSubject', {
                    gang: gangs[0] || null,
                    complication: {
                        type: PlotGangComplicationType.POLICE_RAIDING,
                    },
                })
                handleChange('plot.verb', {
                    __typename: 'PlotGangVerbWrapper',
                    value: Object.values(PlotGangVerb)[0],
                })
            }
        } else if (newCategory === 'PlotBuildingVerbWrapper') {
            if (original?.plot.verb.__typename === 'PlotBuildingVerbWrapper') {
                handleChange('plot.plotSubject', null)
                handleChange('plot.verb', original.plot.verb)
            } else {
                handleChange('plot.plotSubject', null)
                handleChange('plot.verb', {
                    __typename: 'PlotBuildingVerbWrapper',
                    value: Object.values(PlotBuildingVerb)[0],
                })
            }
        }
    }

    return (
        <>
            {hiddenFileInput}
            {/* BASIC INFO SECTION */}
            {/* Name */}
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label={t('common.name')}
                    value={editedTarget.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Description */}
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label={t('common.description')}
                    value={editedTarget.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    multiline
                />
            </Grid>
            <Grid container size={{ xs: 12 }} spacing={2}>
                <Grid container size={{ xs: 12, md: 8 }}>
                    <Stack spacing={2} sx={{ width: '100%' }}>
                        {/* --- PLOT SECTION --- */}
                        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
                            {t('fixerJobs.labels.plotDetails')}
                        </Typography>
                        {/* Job Difficulty */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="difficulty-label" sx={inputLabelStyle}>
                                {t('common.jobDifficultySelector.title')}
                            </InputLabel>
                            <Select
                                labelId="difficulty-label"
                                value={editedTarget.difficulty || JobDifficulty.TYPICAL}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
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
                        {/* Plot Verb */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="plot-verb-label" sx={inputLabelStyle}>
                                {t('fixerJobs.labels.verb')}
                            </InputLabel>
                            <Select
                                labelId="plot-verb-label"
                                value={editedTarget.plot.verb.value}
                                onChange={(e) => {
                                    handleChange('plot.verb.value', e.target.value)
                                }}
                                sx={selectStyle}
                            >
                                {getVerbOptions().map((verb) => (
                                    <MenuItem key={verb} value={verb}>
                                        {t(`fixerJobs.verb.${verb}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Subject Category Selector */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="subject-category-label" sx={inputLabelStyle}>
                                {t('fixerJobs.labels.subjectCategory')}
                            </InputLabel>
                            <Select
                                labelId="subject-category-label"
                                value={editedTarget.plot.verb.__typename}
                                onChange={handleChangeSubjectCategory}
                                sx={selectStyle}
                            >
                                <MenuItem value="CharacterVerbWrapper">
                                    {t('fixerJobs.labels.plotCategory.character')}
                                </MenuItem>
                                <MenuItem value="ItemVerbWrapper">{t('fixerJobs.labels.plotCategory.item')}</MenuItem>
                                <MenuItem value="PlotGangVerbWrapper">
                                    {t('fixerJobs.labels.plotCategory.gang')}
                                </MenuItem>
                                <MenuItem value="PlotBuildingVerbWrapper">
                                    {t('fixerJobs.labels.plotCategory.building')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>
                {/* Image (Main) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <ImageField
                        image={editedTarget.image}
                        downloadName={editedTarget.name}
                        handleImageUploadClick={() => handleImageUploadClick(ImageFields.main)}
                        handleImageRemove={() => openDeleteImageDialog(ImageFields.main)}
                        toggleFullscreenImage={toggleFullscreenImage}
                        handleRegenerateClick={() => handleRegenerateClick(ImageFields.main)}
                        canRegenerate={!!editedTarget.description}
                        isGeneratingImage={isGeneratingImage}
                    />
                </Grid>
            </Grid>
            {/* --- CHARACTER SECTION --- */}
            {editedTarget.plot.verb.__typename === 'CharacterVerbWrapper' && (
                <CardCharacter
                    editedTarget={editedTarget}
                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                    toggleFullscreenImage={toggleFullscreenImage}
                    formControlStyle={formControlStyle}
                    inputLabelStyle={inputLabelStyle}
                    selectStyle={selectStyle}
                    handleChange={handleChange}
                    character={{
                        ...(editedTarget.plot.plotSubject as Character),
                        field: 'plot.plotSubject',
                        chain: editedTarget.plot.plotSubject as Character,
                        main: true,
                    }}
                />
            )}

            {/* --- ITEM SECTION --- */}
            {editedTarget.plot.verb.__typename === 'ItemVerbWrapper' && (
                <CardItem
                    editedTarget={editedTarget}
                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                    toggleFullscreenImage={toggleFullscreenImage}
                    formControlStyle={formControlStyle}
                    inputLabelStyle={inputLabelStyle}
                    selectStyle={selectStyle}
                    handleChange={handleChange}
                    item={{
                        ...(editedTarget.plot.plotSubject as Item),
                        field: 'plot.plotSubject',
                        chain: editedTarget.plot.plotSubject as Item,
                        main: true,
                    }}
                />
            )}

            {/* --- GANG SECTION --- */}
            {editedTarget.plot.verb.__typename === 'PlotGangVerbWrapper' && (
                <CardGang
                    editedTarget={editedTarget}
                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                    handleChange={handleChange}
                    toggleFullscreenImage={toggleFullscreenImage}
                    formControlStyle={formControlStyle}
                    inputLabelStyle={inputLabelStyle}
                    selectStyle={selectStyle}
                    gang={{
                        main: true,
                        handleGangChangeTarget: 'plot.plotSubject.gang',
                        handleChangeGangComplicationCharacterTarget: 'plot.plotSubject.complication.character',
                        handleChangeGangComplicationItemTarget: 'plot.plotSubject.complication.item',
                        handleChangeGangComplicationTypeTarget: 'plot.plotSubject.complication.type',
                        chainStarter: editedTarget.plot.plotSubject as PlotGang,
                        originalChainStarter: originalJobRef.current?.plot.plotSubject as PlotGang,
                        character: {
                            ...(editedTarget.plot.plotSubject as PlotGang).complication.character!,
                            check:
                                (editedTarget.plot.plotSubject as PlotGang).complication.type.includes('CHARACTER') ||
                                false,
                            field: 'plot.plotSubject.complication.character',
                            chain: (editedTarget.plot.plotSubject as PlotGang).complication.character,
                        },
                        item: {
                            ...(editedTarget.plot.plotSubject as PlotGang).complication.item!,
                            check:
                                (editedTarget.plot.plotSubject as PlotGang).complication.type.includes('ITEM') || false,
                            field: 'plot.plotSubject.complication.item',
                            chain: (editedTarget.plot.plotSubject as PlotGang).complication.item,
                        },
                    }}
                />
            )}
            {/* --- BUILDING SECTION --- */}
            <CardBuilding
                editedTarget={editedTarget}
                textFieldOutlinedStyle={textFieldOutlinedStyle}
                handleChange={handleChange}
                toggleFullscreenImage={toggleFullscreenImage}
                formControlStyle={formControlStyle}
                inputLabelStyle={inputLabelStyle}
                selectStyle={selectStyle}
                building={{
                    handleBuildingChangeTarget: 'plot.plotBuilding.building',
                    handleChangeBuildingComplicationCharacterTarget: 'plot.plotBuilding.complication.character',
                    handleChangeBuildingComplicationItemTarget: 'plot.plotBuilding.complication.item',
                    handleChangeBuildingComplicationTypeTarget: 'plot.plotBuilding.complication.type',
                    chainStarter: editedTarget.plot.plotBuilding,
                    originalChainStarter: originalJobRef.current?.plot.plotBuilding as PlotBuilding,
                    character: {
                        ...(editedTarget.plot.plotBuilding.complication.character as Character),
                        check: editedTarget.plot.plotBuilding.complication.type.includes('CHARACTER') || false,
                        field: 'plot.plotBuilding.complication.character',
                        chain: editedTarget.plot.plotBuilding.complication.character,
                    },
                    item: {
                        ...(editedTarget.plot.plotBuilding.complication.item as Item),
                        check: editedTarget.plot.plotBuilding.complication.type.includes('ITEM') || false,
                        field: 'plot.plotBuilding.complication.item',
                        chain: editedTarget.plot.plotBuilding.complication.item,
                    },
                }}
            />

            {/* --- MAIN COMPLICATION SECTION --- */}
            <CardMainComplication
                editedTarget={editedTarget}
                textFieldOutlinedStyle={textFieldOutlinedStyle}
                handleChange={handleChange}
                toggleFullscreenImage={toggleFullscreenImage}
                formControlStyle={formControlStyle}
                inputLabelStyle={inputLabelStyle}
                selectStyle={selectStyle}
                complication={{
                    character: {
                        ...(editedTarget.plot.plotComplication.character as Character),
                        check: editedTarget.plot.plotComplication.type.includes('CHARACTER') || false,
                        field: 'plot.plotComplication.character',
                        chain: editedTarget.plot.plotComplication.character,
                    },
                    item: {
                        ...(editedTarget.plot.plotComplication.item as Item),
                        check: editedTarget.plot.plotComplication.type.includes('ITEM') || false,
                        field: 'plot.plotComplication.item',
                        chain: editedTarget.plot.plotComplication.item,
                    },
                }}
            />
        </>
    )
}

export default FormFixerJob
