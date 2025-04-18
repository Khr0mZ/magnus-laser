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
import { Dispatch, SetStateAction, useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../../contexts/dataHooks'
import { ReaderModeContext } from '../../../../contexts/ReaderModeContext'
import {
    FixerJob,
    JobDifficulty,
    PlotBuilding,
    PlotBuildingVerb,
    PlotCharacter,
    PlotCharacterVerb,
    PlotGang,
    PlotGangVerb,
    PlotItem,
    PlotItemVerb,
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
        handleImageUploadClick,
        openDeleteImageDialog,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        hiddenFileInput,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    const { fixerJobs } = useData()
    // Safe getters for plot property values
    const getPlotVerbValue = () => {
        if (editedItem.plot?.verb && 'value' in editedItem.plot.verb) {
            return editedItem.plot.verb.value
        }
        return ''
    }

    const getSubjectType = (): string => {
        const subject = editedItem.plot?.plotSubject
        if (!subject) return 'BUILDING'
        // Using type checking to determine the kind of subject
        if ('gang' in subject) {
            return 'GANG'
        } else if ('attitude' in subject) {
            return 'CHARACTER' // It's a PlotCharacter
        } else if ('condition' in subject) {
            return 'ITEM' // It's a PlotItem
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

    const getVerbOptions = () => {
        switch (getSubjectType()) {
            case 'CHARACTER':
                return Object.values(PlotCharacterVerb)
            case 'ITEM':
                return Object.values(PlotItemVerb)
            case 'GANG':
                return Object.values(PlotGangVerb)
            case 'BUILDING':
            default:
                return Object.values(PlotBuildingVerb)
        }
    }

    const handleChangeSubjectCategory = (e: SelectChangeEvent<string>) => {
        // Handle different category types
        const newCategory = e.target.value
        const fixerJob = fixerJobs.find((job) => job.ID === editedItem.ID)
        // Reset subject data based on category
        if (!fixerJob) return
        if (newCategory === 'CHARACTER') {
            if (fixerJob.plot.verb.__typename === 'PlotCharacterVerbWrapper') {
                handleChange('plot.plotSubject', fixerJob.plot.plotSubject)
                handleChange('plot.verb', fixerJob.plot.verb)
            } else {
                handleChange('plot.plotSubject', {
                    name: '',
                    type: undefined,
                    attitude: undefined,
                    image: '',
                })
                handleChange('plot.verb', {
                    __typename: 'PlotCharacterVerbWrapper',
                    value: Object.values(PlotCharacterVerb)[0],
                })
            }
        } else if (newCategory === 'ITEM') {
            if (fixerJob.plot.verb.__typename === 'PlotItemVerbWrapper') {
                handleChange('plot.plotSubject', fixerJob.plot.plotSubject)
                handleChange('plot.verb', fixerJob.plot.verb)
            } else {
                handleChange('plot.plotSubject', {
                    name: '',
                    type: undefined,
                    condition: undefined,
                    image: '',
                })
                handleChange('plot.verb', {
                    __typename: 'PlotItemVerbWrapper',
                    value: Object.values(PlotItemVerb)[0],
                })
            }
        } else if (newCategory === 'GANG') {
            if (fixerJob.plot.verb.__typename === 'PlotGangVerbWrapper') {
                handleChange('plot.plotSubject', fixerJob.plot.plotSubject)
                handleChange('plot.verb', fixerJob.plot.verb)
            } else {
                handleChange('plot.plotSubject', null)
                handleChange('plot.verb', {
                    __typename: 'PlotGangVerbWrapper',
                    value: Object.values(PlotGangVerb)[0],
                })
            }
        } else if (newCategory === 'BUILDING') {
            if (fixerJob.plot.verb.__typename === 'PlotBuildingVerbWrapper') {
                handleChange('plot.plotSubject', null)
                handleChange('plot.verb', fixerJob.plot.verb)
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
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('common.name')}
                    value={editedItem.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Description */}
            <Grid item xs={12}>
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
            <Grid item container xs={12} spacing={2}>
                {/* Image (Main) */}
                <Grid item xs={12} md={4}>
                    <ImageField
                        image={editedItem.image}
                        downloadName={editedItem.name}
                        handleImageUploadClick={() => handleImageUploadClick(ImageFields.main)}
                        handleImageRemove={() => openDeleteImageDialog(ImageFields.main)}
                        toggleFullscreenImage={() => toggleFullscreenImage(ImageFields.main)}
                        handleRegenerateClick={() => handleRegenerateClick(ImageFields.main)}
                        canRegenerate={!!editedItem.description}
                        isGeneratingImage={isGeneratingImage}
                    />
                </Grid>
                <Grid item container xs={12} md={8}>
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
                                value={editedItem.difficulty || JobDifficulty.TYPICAL}
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
                                value={getPlotVerbValue()}
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
                                value={getSubjectType()}
                                onChange={handleChangeSubjectCategory}
                                sx={selectStyle}
                            >
                                <MenuItem value="CHARACTER">{t('fixerJobs.labels.plotCategory.character')}</MenuItem>
                                <MenuItem value="ITEM">{t('fixerJobs.labels.plotCategory.item')}</MenuItem>
                                <MenuItem value="GANG">{t('fixerJobs.labels.plotCategory.gang')}</MenuItem>
                                <MenuItem value="BUILDING">{t('fixerJobs.labels.plotCategory.building')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>
            </Grid>
            {/* --- CHARACTER SECTION --- */}
            {getSubjectType() === 'CHARACTER' && (
                <CardCharacter
                    isGeneratingImage={isGeneratingImage}
                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                    handleImageUploadClick={() => handleImageUploadClick(ImageFields.characterOrItem)}
                    openDeleteImageDialog={() => openDeleteImageDialog(ImageFields.characterOrItem)}
                    toggleFullscreenImage={() => toggleFullscreenImage(ImageFields.characterOrItem)}
                    handleRegenerateClick={() => handleRegenerateClick(ImageFields.characterOrItem)}
                    formControlStyle={formControlStyle}
                    inputLabelStyle={inputLabelStyle}
                    selectStyle={selectStyle}
                    hiddenFileInput={hiddenFileInput}
                    character={{
                        name: {
                            value: (editedItem.plot.plotSubject as PlotCharacter)?.name || '',
                            onChange: (e) => handleChange('plot.plotSubject.name', e.target.value),
                        },
                        type: {
                            value: (editedItem.plot.plotSubject as PlotCharacter)?.type || '',
                            onChange: (e) => handleChange('plot.plotSubject.type', e.target.value),
                        },
                        attitude: {
                            value: (editedItem.plot.plotSubject as PlotCharacter)?.attitude || '',
                            onChange: (e) => handleChange('plot.plotSubject.attitude', e.target.value),
                        },
                        image: {
                            image: (editedItem.plot?.plotSubject as PlotCharacter)?.image,
                            main: true,
                            canRegenerate:
                                !!(editedItem.plot?.plotSubject as PlotCharacter)?.name &&
                                !!(editedItem.plot?.plotSubject as PlotCharacter)?.attitude &&
                                !!(editedItem.plot?.plotSubject as PlotCharacter)?.type,
                        },
                    }}
                />
            )}

            {/* --- ITEM SECTION --- */}
            {getSubjectType() === 'ITEM' && (
                <CardItem
                    isGeneratingImage={isGeneratingImage}
                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                    handleImageUploadClick={() => handleImageUploadClick(ImageFields.characterOrItem)}
                    openDeleteImageDialog={() => openDeleteImageDialog(ImageFields.characterOrItem)}
                    toggleFullscreenImage={() => toggleFullscreenImage(ImageFields.characterOrItem)}
                    handleRegenerateClick={() => handleRegenerateClick(ImageFields.characterOrItem)}
                    formControlStyle={formControlStyle}
                    inputLabelStyle={inputLabelStyle}
                    selectStyle={selectStyle}
                    hiddenFileInput={hiddenFileInput}
                    item={{
                        name: {
                            value: (editedItem.plot.plotSubject as PlotItem)?.name || '',
                            onChange: (e) => handleChange('plot.plotSubject.name', e.target.value),
                        },
                        type: {
                            value: (editedItem.plot.plotSubject as PlotItem)?.type || '',
                            onChange: (e) => handleChange('plot.plotSubject.type', e.target.value),
                        },
                        condition: {
                            value: (editedItem.plot.plotSubject as PlotItem)?.condition || '',
                            onChange: (e) => handleChange('plot.plotSubject.condition', e.target.value),
                        },
                        image: {
                            image: (editedItem.plot?.plotSubject as PlotItem)?.image,
                            main: true,
                            canRegenerate:
                                !!(editedItem.plot?.plotSubject as PlotItem)?.name &&
                                !!(editedItem.plot?.plotSubject as PlotItem)?.condition &&
                                !!(editedItem.plot?.plotSubject as PlotItem)?.type,
                        },
                    }}
                />
            )}

            {/* --- GANG SECTION --- */}
            {getSubjectType() === 'GANG' && (
                <CardGang
                    editedItem={editedItem}
                    isGeneratingImage={isGeneratingImage}
                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                    handleChange={handleChange}
                    handleImageUploadClick={handleImageUploadClick}
                    openDeleteImageDialog={openDeleteImageDialog}
                    toggleFullscreenImage={toggleFullscreenImage}
                    handleRegenerateClick={handleRegenerateClick}
                    formControlStyle={formControlStyle}
                    inputLabelStyle={inputLabelStyle}
                    selectStyle={selectStyle}
                    hiddenFileInput={hiddenFileInput}
                    gang={{
                        main: true,
                        handleGangChangeTarget: 'plot.plotSubject.gang',
                        handleChangeGangComplicationCharacterTarget: 'plot.plotSubject.complication.character',
                        handleChangeGangComplicationItemTarget: 'plot.plotSubject.complication.item',
                        handleChangeGangComplicationTypeTarget: 'plot.plotSubject.complication.type',
                        chainStarter: editedItem.plot.plotSubject as PlotGang,
                        originalChainStarter: fixerJobs.find((job) => job.ID === editedItem.ID)?.plot
                            .plotSubject as PlotGang,
                        character: {
                            check:
                                (editedItem.plot.plotSubject as PlotGang)?.complication?.type?.includes('CHARACTER') ||
                                false,
                            imageField: ImageFields.gangComplicationCharacter,
                            name: {
                                value: (editedItem.plot.plotSubject as PlotGang)?.complication?.character?.name || '',
                                onChange: (e) =>
                                    handleChange('plot.plotSubject.complication.character.name', e.target.value),
                            },
                            type: {
                                value: (editedItem.plot.plotSubject as PlotGang)?.complication?.character?.type || '',
                                onChange: (e) =>
                                    handleChange('plot.plotSubject.complication.character.type', e.target.value),
                            },
                            attitude: {
                                value:
                                    (editedItem.plot.plotSubject as PlotGang)?.complication?.character?.attitude || '',
                                onChange: (e) =>
                                    handleChange('plot.plotSubject.complication.character.attitude', e.target.value),
                            },
                            image: {
                                main: false,
                                image: (editedItem.plot.plotSubject as PlotGang)?.complication?.character?.image || '',
                                canRegenerate:
                                    !!(editedItem.plot?.plotSubject as PlotGang)?.complication?.character?.name &&
                                    !!(editedItem.plot?.plotSubject as PlotGang)?.complication?.character?.attitude &&
                                    !!(editedItem.plot?.plotSubject as PlotGang)?.complication?.character?.type,
                            },
                        },
                        item: {
                            check:
                                (editedItem.plot.plotSubject as PlotGang)?.complication?.type?.includes('ITEM') ||
                                false,
                            imageField: ImageFields.gangComplicationItem,
                            name: {
                                value: (editedItem.plot.plotSubject as PlotGang)?.complication?.item?.name || '',
                                onChange: (e) =>
                                    handleChange('plot.plotSubject.complication.item.name', e.target.value),
                            },
                            type: {
                                value: (editedItem.plot.plotSubject as PlotGang)?.complication?.item?.type || '',
                                onChange: (e) =>
                                    handleChange('plot.plotSubject.complication.item.type', e.target.value),
                            },
                            condition: {
                                value: (editedItem.plot.plotSubject as PlotGang)?.complication?.item?.condition || '',
                                onChange: (e) =>
                                    handleChange('plot.plotSubject.complication.item.condition', e.target.value),
                            },
                            image: {
                                main: false,
                                image: (editedItem.plot.plotSubject as PlotGang)?.complication?.item?.image || '',
                                canRegenerate:
                                    !!(editedItem.plot?.plotSubject as PlotGang)?.complication?.item?.name &&
                                    !!(editedItem.plot?.plotSubject as PlotGang)?.complication?.item?.condition &&
                                    !!(editedItem.plot?.plotSubject as PlotGang)?.complication?.item?.type,
                            },
                        },
                    }}
                />
            )}
            {/* --- BUILDING SECTION --- */}
            <CardBuilding
                editedItem={editedItem}
                isGeneratingImage={isGeneratingImage}
                textFieldOutlinedStyle={textFieldOutlinedStyle}
                handleChange={handleChange}
                handleImageUploadClick={handleImageUploadClick}
                openDeleteImageDialog={openDeleteImageDialog}
                toggleFullscreenImage={toggleFullscreenImage}
                formControlStyle={formControlStyle}
                inputLabelStyle={inputLabelStyle}
                selectStyle={selectStyle}
                hiddenFileInput={hiddenFileInput}
                handleRegenerateClick={handleRegenerateClick}
                building={{
                    handleBuildingChangeTarget: 'plot.plotBuilding.building',
                    handleChangeBuildingComplicationCharacterTarget: 'plot.plotBuilding.complication.character',
                    handleChangeBuildingComplicationItemTarget: 'plot.plotBuilding.complication.item',
                    handleChangeBuildingComplicationTypeTarget: 'plot.plotBuilding.complication.type',
                    chainStarter: editedItem.plot.plotBuilding,
                    originalChainStarter: fixerJobs.find((job) => job.ID === editedItem.ID)?.plot
                        .plotBuilding as PlotBuilding,
                    character: {
                        check: editedItem.plot.plotBuilding.complication.type.includes('CHARACTER') || false,
                        imageField: ImageFields.buildingComplicationCharacterOrItem,
                        name: {
                            value: editedItem.plot.plotBuilding.complication.character?.name || '',
                            onChange: (e) =>
                                handleChange('plot.plotBuilding.complication.character.name', e.target.value),
                        },
                        type: {
                            value: editedItem.plot.plotBuilding.complication.character?.type || '',
                            onChange: (e) =>
                                handleChange('plot.plotBuilding.complication.character.type', e.target.value),
                        },
                        attitude: {
                            value: editedItem.plot.plotBuilding.complication.character?.attitude || '',
                            onChange: (e) =>
                                handleChange('plot.plotBuilding.complication.character.attitude', e.target.value),
                        },
                        image: {
                            main: false,
                            image: editedItem.plot.plotBuilding.complication.character?.image || '',
                            canRegenerate:
                                !!editedItem.plot.plotBuilding.complication.character?.name &&
                                !!editedItem.plot.plotBuilding.complication.character?.attitude &&
                                !!editedItem.plot.plotBuilding.complication.character?.type,
                        },
                    },
                    item: {
                        check: editedItem.plot.plotBuilding.complication.type.includes('ITEM') || false,
                        imageField: ImageFields.buildingComplicationItem,
                        name: {
                            value: editedItem.plot.plotBuilding.complication.item?.name || '',
                            onChange: (e) => handleChange('plot.plotBuilding.complication.item.name', e.target.value),
                        },
                        type: {
                            value: editedItem.plot.plotBuilding.complication.item?.type || '',
                            onChange: (e) => handleChange('plot.plotBuilding.complication.item.type', e.target.value),
                        },
                        condition: {
                            value: editedItem.plot.plotBuilding.complication.item?.condition || '',
                            onChange: (e) =>
                                handleChange('plot.plotBuilding.complication.item.condition', e.target.value),
                        },
                        image: {
                            main: false,
                            image: editedItem.plot.plotBuilding.complication.item?.image || '',
                            canRegenerate:
                                !!editedItem.plot.plotBuilding.complication.item?.name &&
                                !!editedItem.plot.plotBuilding.complication.item?.condition &&
                                !!editedItem.plot.plotBuilding.complication.item?.type,
                        },
                    },
                    gang: {
                        main: false,
                        check: editedItem.plot.plotBuilding.complication.type.includes('GANG') || false,
                        handleGangChangeTarget: 'plot.plotBuilding.complication.gang',
                        handleChangeGangComplicationCharacterTarget: 'plot.plotBuilding.complication.character',
                        handleChangeGangComplicationItemTarget: 'plot.plotBuilding.complication.item',
                        handleChangeGangComplicationTypeTarget: 'plot.plotBuilding.complication.type',
                        chainStarter: editedItem.plot.plotBuilding.complication.gang as PlotGang,
                        originalChainStarter: fixerJobs.find((job) => job.ID === editedItem.ID)?.plot.plotBuilding
                            .complication.gang as PlotGang,
                        character: {
                            check:
                                (
                                    editedItem.plot.plotBuilding.complication.gang as PlotGang
                                )?.complication?.type?.includes('CHARACTER') || false,
                            imageField: ImageFields.gangComplicationCharacter,
                            name: {
                                value:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.name || '',
                                onChange: (e) => {
                                    handleChange('plot.plotBuilding.complication.gang.character.name', e.target.value)
                                },
                            },
                            type: {
                                value:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.type || '',
                                onChange: (e) => {
                                    handleChange('plot.plotBuilding.complication.gang.character.type', e.target.value)
                                },
                            },
                            attitude: {
                                value:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.attitude || '',
                                onChange: (e) => {
                                    handleChange(
                                        'plot.plotBuilding.complication.gang.character.attitude',
                                        e.target.value
                                    )
                                },
                            },
                            image: {
                                main: false,
                                image:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.image || '',
                                canRegenerate:
                                    !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.name &&
                                    !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.attitude &&
                                    !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)?.complication
                                        ?.character?.type,
                            },
                        },
                        item: {
                            check:
                                (
                                    editedItem.plot.plotBuilding.complication.gang as PlotGang
                                )?.complication?.type?.includes('ITEM') || false,
                            imageField: ImageFields.gangComplicationItem,
                            name: {
                                value:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.name || '',
                                onChange: (e) =>
                                    handleChange('plot.plotBuilding.complication.gang.item.name', e.target.value),
                            },
                            type: {
                                value:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.type || '',
                                onChange: (e) =>
                                    handleChange('plot.plotBuilding.complication.gang.item.type', e.target.value),
                            },
                            condition: {
                                value:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.condition || '',
                                onChange: (e) =>
                                    handleChange('plot.plotBuilding.complication.gang.item.condition', e.target.value),
                            },
                            image: {
                                image:
                                    (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.image || '',
                                main: false,
                                canRegenerate:
                                    !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.name &&
                                    !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.condition &&
                                    !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)?.complication?.item
                                        ?.type,
                            },
                        },
                    },
                }}
            />

            {/* --- MAIN COMPLICATION SECTION --- */}
            <CardMainComplication
                editedItem={editedItem}
                isGeneratingImage={isGeneratingImage}
                textFieldOutlinedStyle={textFieldOutlinedStyle}
                handleChange={handleChange}
                handleImageUploadClick={handleImageUploadClick}
                openDeleteImageDialog={openDeleteImageDialog}
                toggleFullscreenImage={toggleFullscreenImage}
                formControlStyle={formControlStyle}
                inputLabelStyle={inputLabelStyle}
                selectStyle={selectStyle}
                hiddenFileInput={hiddenFileInput}
                handleRegenerateClick={handleRegenerateClick}
                complication={{
                    character: {
                        check: editedItem.plot.complication.type.includes('CHARACTER') || false,
                        imageField: ImageFields.buildingComplicationCharacterOrItem,
                        name: {
                            value: editedItem.plot.complication.character?.name || '',
                            onChange: (e) => handleChange('plot.complication.character.name', e.target.value),
                        },
                        type: {
                            value: editedItem.plot.complication.character?.type || '',
                            onChange: (e) => handleChange('plot.complication.character.type', e.target.value),
                        },
                        attitude: {
                            value: editedItem.plot.complication.character?.attitude || '',
                            onChange: (e) => handleChange('plot.complication.character.attitude', e.target.value),
                        },
                        image: {
                            main: false,
                            image: editedItem.plot.complication.character?.image || '',
                            canRegenerate:
                                !!editedItem.plot.complication.character?.name &&
                                !!editedItem.plot.complication.character?.attitude &&
                                !!editedItem.plot.complication.character?.type,
                        },
                    },
                    item: {
                        check: editedItem.plot.complication.type.includes('ITEM') || false,
                        imageField: ImageFields.buildingComplicationItem,
                        name: {
                            value: editedItem.plot.complication.item?.name || '',
                            onChange: (e) => handleChange('plot.complication.item.name', e.target.value),
                        },
                        type: {
                            value: editedItem.plot.complication.item?.type || '',
                            onChange: (e) => handleChange('plot.complication.item.type', e.target.value),
                        },
                        condition: {
                            value: editedItem.plot.complication.item?.condition || '',
                            onChange: (e) => handleChange('plot.complication.item.condition', e.target.value),
                        },
                        image: {
                            main: false,
                            image: editedItem.plot.complication.item?.image || '',
                            canRegenerate:
                                !!editedItem.plot.complication.item?.name &&
                                !!editedItem.plot.complication.item?.condition &&
                                !!editedItem.plot.complication.item?.type,
                        },
                    },
                    gang: {
                        main: false,
                        check: editedItem.plot.complication.type.includes('GANG') || false,
                        handleGangChangeTarget: 'plot.complication.gang.complication',
                        handleChangeGangComplicationCharacterTarget: 'plot.complication.gang.complication.character',
                        handleChangeGangComplicationItemTarget: 'plot.complication.gang.complication.item',
                        handleChangeGangComplicationTypeTarget: 'plot.complication.gang.complication.type',
                        chainStarter: editedItem.plot.complication.gang as PlotGang,
                        originalChainStarter: fixerJobs.find((job) => job.ID === editedItem.ID)?.plot.complication
                            .gang as PlotGang,
                        character: {
                            check:
                                (editedItem.plot.complication.gang as PlotGang)?.complication?.type?.includes(
                                    'CHARACTER'
                                ) || false,
                            imageField: ImageFields.gangComplicationCharacter,
                            name: {
                                value:
                                    (editedItem.plot.complication.gang as PlotGang)?.complication?.character?.name ||
                                    '',
                                onChange: (e) => {
                                    handleChange('plot.complication.gang.complication.character.name', e.target.value)
                                },
                            },
                            type: {
                                value:
                                    (editedItem.plot.complication.gang as PlotGang)?.complication?.character?.type ||
                                    '',
                                onChange: (e) => {
                                    handleChange('plot.complication.gang.complication.character.type', e.target.value)
                                },
                            },
                            attitude: {
                                value:
                                    (editedItem.plot.complication.gang as PlotGang)?.complication?.character
                                        ?.attitude || '',
                                onChange: (e) => {
                                    handleChange(
                                        'plot.complication.gang.complication.character.attitude',
                                        e.target.value
                                    )
                                },
                            },
                            image: {
                                main: false,
                                image:
                                    (editedItem.plot.complication.gang as PlotGang)?.complication?.character?.image ||
                                    '',
                                canRegenerate:
                                    !!(editedItem.plot?.complication.gang as PlotGang)?.complication?.character?.name &&
                                    !!(editedItem.plot?.complication.gang as PlotGang)?.complication?.character
                                        ?.attitude &&
                                    !!(editedItem.plot?.complication.gang as PlotGang)?.complication?.character?.type,
                            },
                        },
                        item: {
                            check:
                                (editedItem.plot.complication.gang as PlotGang)?.complication?.type?.includes('ITEM') ||
                                false,
                            imageField: ImageFields.gangComplicationItem,
                            name: {
                                value: (editedItem.plot.complication.gang as PlotGang)?.complication?.item?.name || '',
                                onChange: (e) =>
                                    handleChange('plot.complication.gang.complication.item.name', e.target.value),
                            },
                            type: {
                                value: (editedItem.plot.complication.gang as PlotGang)?.complication?.item?.type || '',
                                onChange: (e) =>
                                    handleChange('plot.complication.gang.complication.item.type', e.target.value),
                            },
                            condition: {
                                value:
                                    (editedItem.plot.complication.gang as PlotGang)?.complication?.item?.condition ||
                                    '',
                                onChange: (e) =>
                                    handleChange('plot.complication.gang.complication.item.condition', e.target.value),
                            },
                            image: {
                                image: (editedItem.plot.complication.gang as PlotGang)?.complication?.item?.image || '',
                                main: false,
                                canRegenerate:
                                    !!(editedItem.plot?.complication.gang as PlotGang)?.complication?.item?.name &&
                                    !!(editedItem.plot?.complication.gang as PlotGang)?.complication?.item?.condition &&
                                    !!(editedItem.plot?.complication.gang as PlotGang)?.complication?.item?.type,
                            },
                        },
                    },
                }}
            />
        </>
    )
}

export default FormFixerJob
