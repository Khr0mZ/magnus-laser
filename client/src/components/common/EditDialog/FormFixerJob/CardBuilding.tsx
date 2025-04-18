import { ExpandMore } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../../contexts/dataHooks'
import { Building, FixerJob, PlotBuilding, PlotBuildingComplicationType, PlotGang } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import { ImageFields } from '../../../../utils/constants'
import ImageField from '../ImageField'
import CardCharacter, { FieldProps, ImageFieldProps } from './CardCharacter'
import CardGang from './CardGang'
import CardItem from './CardItem'

export type CardBuildingProps = {
    editedItem: FixerJob
    isGeneratingImage?: boolean
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    handleImageUploadClick: (targetField: string) => void
    openDeleteImageDialog: (targetField: string) => void
    toggleFullscreenImage: (targetField: string) => void
    handleRegenerateClick: (imageFieldPath: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element
    building: {
        handleBuildingChangeTarget: string
        handleChangeBuildingComplicationCharacterTarget: string
        handleChangeBuildingComplicationItemTarget: string
        handleChangeBuildingComplicationTypeTarget: string
        chainStarter: PlotBuilding
        originalChainStarter: PlotBuilding
        character: {
            check: boolean
            imageField: ImageFields
            name: FieldProps
            type: FieldProps
            attitude: FieldProps
            image: ImageFieldProps
        }
        item: {
            check: boolean
            imageField: ImageFields
            name: FieldProps
            type: FieldProps
            condition: FieldProps
            image: ImageFieldProps
        }
        gang: {
            main: boolean
            check: boolean
            handleGangChangeTarget: string
            handleChangeGangComplicationCharacterTarget: string
            handleChangeGangComplicationItemTarget: string
            handleChangeGangComplicationTypeTarget: string
            chainStarter: PlotGang
            originalChainStarter: PlotGang
            character: {
                check: boolean
                imageField: ImageFields
                name: FieldProps
                type: FieldProps
                attitude: FieldProps
                image: ImageFieldProps
            }
            item: {
                check: boolean
                imageField: ImageFields
                name: FieldProps
                type: FieldProps
                condition: FieldProps
                image: ImageFieldProps
            }
        }
    }
}

export const CardBuilding = (props: CardBuildingProps) => {
    const {
        editedItem,
        isGeneratingImage,
        textFieldOutlinedStyle,
        handleChange,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        handleRegenerateClick,
        handleImageUploadClick,
        openDeleteImageDialog,
        toggleFullscreenImage,
        hiddenFileInput,
        building,
    } = props
    const { t } = useTranslation()
    const { buildings, fixerJobs } = useData()
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
        building.originalChainStarter?.building || null
    )

    const handleChangeBuilding = (e: SelectChangeEvent<string>) => {
        const selectedBuilding = buildings.find((b) => b.ID === e.target.value)
        if (selectedBuilding) {
            setSelectedBuilding(selectedBuilding)
            handleChange(building.handleBuildingChangeTarget, selectedBuilding)
        }
    }

    const handleChangeBuildingComplication = (e: SelectChangeEvent<string>) => {
        const newComplication = e.target.value
        const fixerJob = fixerJobs.find((job) => job.ID === editedItem.ID)
        // Reset subject data based on complication type
        if (!fixerJob) return
        if (newComplication.includes('CHARACTER')) {
            if (building.originalChainStarter?.complication?.character) {
                handleChange(
                    building.handleChangeBuildingComplicationCharacterTarget,
                    building.originalChainStarter?.complication?.character
                )
                handleChange(building.handleChangeBuildingComplicationItemTarget, null)
            } else {
                handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
                handleChange(building.handleChangeBuildingComplicationItemTarget, null)
            }
        } else if (newComplication.includes('ITEM')) {
            if (building.originalChainStarter?.complication?.item) {
                handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
                handleChange(
                    building.handleChangeBuildingComplicationItemTarget,
                    building.originalChainStarter?.complication?.item
                )
            } else {
                handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
                handleChange(building.handleChangeBuildingComplicationItemTarget, null)
            }
        } else if (newComplication.includes('GANG')) {
            handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
            handleChange(building.handleChangeBuildingComplicationItemTarget, null)
        }
        handleChange(building.handleChangeBuildingComplicationTypeTarget, newComplication)
    }

    return (
        <>
            {hiddenFileInput}
            <Accordion
                sx={{
                    mt: 2,
                    ml: '16px !important',
                    bgcolor: colors.neons.blue.default + '50 !important',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    width: '100%',
                }}
                disableGutters
            >
                <AccordionSummary expandIcon={<ExpandMore fontSize="large" />}>
                    <Typography variant="h6">{t('fixerJobs.labels.building.details')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {/* Building selection */}
                    <FormControl fullWidth variant="outlined" sx={{ ...formControlStyle, mb: 2 }}>
                        <InputLabel id="building-label" sx={inputLabelStyle}>
                            {t('buildings.buildingSelector')}
                        </InputLabel>
                        <Select
                            labelId="building-label"
                            value={selectedBuilding?.ID || ''}
                            onChange={(e) => handleChangeBuilding(e)}
                            sx={selectStyle}
                        >
                            {buildings.map((b) => (
                                <MenuItem key={b.ID} value={b.ID}>
                                    {b.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* Building Basic Info */}
                    <Grid item container xs={12} spacing={2}>
                        {/* Name */}
                        <Grid item container xs={12}>
                            <TextField
                                fullWidth
                                label={t('buildings.labels.name')}
                                value={selectedBuilding?.name || ''}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
                        </Grid>
                        <Grid item container xs={12} md={8}>
                            <Stack spacing={2} sx={{ width: '100%' }}>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Type */}
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.type')}
                                        value={t(
                                            `buildings.type.${
                                                (editedItem.plot?.plotBuilding as PlotBuilding).building?.type
                                            }`
                                        )}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Style */}
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.style')}
                                        value={t(
                                            `buildings.style.${
                                                (editedItem.plot?.plotBuilding as PlotBuilding).building?.style
                                            }`
                                        )}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Abandoned */}
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.isAbandoned')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.isAbandoned
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.elevators')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.elevators
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.parking')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.parking
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.gatehouseFrontDesk')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.gatehouseFrontDesk
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.emergencyExit')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.emergencyExit
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.backupLights')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.backupLights
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.landingPad')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building?.landingPad
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.secretOrAltEntrance')}
                                        value={
                                            (editedItem.plot?.plotBuilding as PlotBuilding).building
                                                ?.secretOrAltEntrance
                                                ? 'Yes'
                                                : 'No'
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Security Personnel */}
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.securityPersonnel')}
                                        value={t(
                                            `buildings.securityPersonnel.${
                                                (editedItem.plot?.plotBuilding as PlotBuilding).building
                                                    ?.securityPersonnel
                                            }`
                                        )}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Ownership */}
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.ownership')}
                                        value={t(
                                            `buildings.ownership.${
                                                (editedItem.plot?.plotBuilding as PlotBuilding).building?.ownership
                                            }`
                                        )}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.secret')}
                                        value={t(
                                            `buildings.secret.${
                                                (editedItem.plot?.plotBuilding as PlotBuilding).building?.secret
                                            }`
                                        )}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Event */}
                                    <TextField
                                        fullWidth
                                        label={t('buildings.labels.event')}
                                        value={t(
                                            `buildings.event.${
                                                (editedItem.plot?.plotBuilding as PlotBuilding).building?.event
                                            }`
                                        )}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Secret */}
                                </Stack>
                            </Stack>
                        </Grid>
                        {/* Building Image */}
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                <InputLabel
                                    id="building-image-label"
                                    sx={{
                                        ...inputLabelStyle,
                                        top: -25,
                                        lineHeight: '1 !important',
                                        py: '0 !important',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ mt: -20 }}>
                                        {t('fixerJobs.labels.building.image')}
                                    </Typography>
                                </InputLabel>
                                <ImageField
                                    image={(editedItem.plot?.plotBuilding as PlotBuilding).building?.image || ''}
                                    downloadName={(editedItem.plot?.plotBuilding as PlotBuilding).building?.name || ''}
                                    handleImageUploadClick={() => handleImageUploadClick(ImageFields.building)}
                                    handleImageRemove={() => openDeleteImageDialog(ImageFields.building)}
                                    toggleFullscreenImage={() => toggleFullscreenImage(ImageFields.building)}
                                    handleRegenerateClick={() => handleRegenerateClick(ImageFields.building)}
                                    canRegenerate={!!editedItem.description}
                                    isGeneratingImage={isGeneratingImage}
                                    disabled
                                />
                            </FormControl>
                        </Grid>
                        {/* Description */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={t('buildings.labels.description')}
                                value={(editedItem.plot?.plotBuilding as PlotBuilding).building?.description || ''}
                                onChange={(e) => handleChange('plot.plotBuilding.building.description', e.target.value)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                multiline
                                disabled
                            />
                        </Grid>
                    </Grid>
                    {/* Building Complication */}
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ my: 2 }}>
                            {t('fixerJobs.labels.building.complication')}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="gang-complication-label" sx={inputLabelStyle}>
                                {t('fixerJobs.labels.complicationType')}
                            </InputLabel>
                            <Select
                                labelId="gang-complication-label"
                                value={building.chainStarter?.complication?.type || ''}
                                onChange={handleChangeBuildingComplication}
                                label={t('fixerJobs.labels.complicationType')}
                                sx={selectStyle}
                            >
                                {Object.values(PlotBuildingComplicationType || {}).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t(`fixerJobs.buildingComplication.${type}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* --- CHARACTER SECTION --- */}
                    {building.character.check && (
                        <CardCharacter
                            isGeneratingImage={isGeneratingImage}
                            textFieldOutlinedStyle={textFieldOutlinedStyle}
                            handleImageUploadClick={() => handleImageUploadClick(building.character.imageField)}
                            openDeleteImageDialog={() => openDeleteImageDialog(building.character.imageField)}
                            toggleFullscreenImage={() => toggleFullscreenImage(building.character.imageField)}
                            handleRegenerateClick={() => handleRegenerateClick(building.character.imageField)}
                            formControlStyle={formControlStyle}
                            inputLabelStyle={inputLabelStyle}
                            selectStyle={selectStyle}
                            hiddenFileInput={hiddenFileInput}
                            character={building.character}
                        />
                    )}

                    {/* --- ITEM SECTION --- */}
                    {building.item.check && (
                        <CardItem
                            isGeneratingImage={isGeneratingImage}
                            textFieldOutlinedStyle={textFieldOutlinedStyle}
                            handleImageUploadClick={() => handleImageUploadClick(building.item.imageField)}
                            openDeleteImageDialog={() => openDeleteImageDialog(building.item.imageField)}
                            toggleFullscreenImage={() => toggleFullscreenImage(building.item.imageField)}
                            handleRegenerateClick={() => handleRegenerateClick(building.item.imageField)}
                            formControlStyle={formControlStyle}
                            inputLabelStyle={inputLabelStyle}
                            selectStyle={selectStyle}
                            hiddenFileInput={hiddenFileInput}
                            item={building.item}
                        />
                    )}

                    {/* --- GANG SECTION --- */}
                    {building.gang.check && (
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
                                main: false,
                                handleGangChangeTarget: 'plot.plotBuilding.complication.gang',
                                handleChangeGangComplicationCharacterTarget: 'plot.plotBuilding.complication.character',
                                handleChangeGangComplicationItemTarget: 'plot.plotBuilding.complication.item',
                                handleChangeGangComplicationTypeTarget: 'plot.plotBuilding.complication.type',
                                chainStarter: editedItem.plot.plotBuilding.complication.gang as PlotGang,
                                originalChainStarter: fixerJobs.find((job) => job.ID === editedItem.ID)?.plot
                                    .plotBuilding?.complication.gang as PlotGang,
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
                                            handleChange(
                                                'plot.plotBuilding.complication.gang.character.name',
                                                e.target.value
                                            )
                                        },
                                    },
                                    type: {
                                        value:
                                            (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                                ?.character?.type || '',
                                        onChange: (e) => {
                                            handleChange(
                                                'plot.plotBuilding.complication.gang.character.type',
                                                e.target.value
                                            )
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
                                            !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)
                                                ?.complication?.character?.name &&
                                            !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)
                                                ?.complication?.character?.attitude &&
                                            !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)
                                                ?.complication?.character?.type,
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
                                            (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                                ?.item?.name || '',
                                        onChange: (e) =>
                                            handleChange(
                                                'plot.plotBuilding.complication.gang.item.name',
                                                e.target.value
                                            ),
                                    },
                                    type: {
                                        value:
                                            (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                                ?.item?.type || '',
                                        onChange: (e) =>
                                            handleChange(
                                                'plot.plotBuilding.complication.gang.item.type',
                                                e.target.value
                                            ),
                                    },
                                    condition: {
                                        value:
                                            (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                                ?.item?.condition || '',
                                        onChange: (e) =>
                                            handleChange(
                                                'plot.plotBuilding.complication.gang.item.condition',
                                                e.target.value
                                            ),
                                    },
                                    image: {
                                        image:
                                            (editedItem.plot.plotBuilding.complication.gang as PlotGang)?.complication
                                                ?.item?.image || '',
                                        main: false,
                                        canRegenerate:
                                            !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)
                                                ?.complication?.item?.name &&
                                            !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)
                                                ?.complication?.item?.condition &&
                                            !!(editedItem.plot?.plotBuilding.complication.gang as PlotGang)
                                                ?.complication?.item?.type,
                                    },
                                },
                            }}
                        />
                    )}
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export default CardBuilding
