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
import { FixerJob, Gang, PlotGang, PlotGangComplicationType } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import { ImageFields } from '../../../../utils/constants'
import ImageField from '../ImageField'
import CardCharacter, { FieldProps, ImageFieldProps } from './CardCharacter'
import CardItem from './CardItem'

export type CardGangProps = {
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
    gang: {
        main: boolean
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

const CardGang = (props: CardGangProps) => {
    const {
        editedItem,
        isGeneratingImage,
        textFieldOutlinedStyle,
        handleChange,
        handleImageUploadClick,
        openDeleteImageDialog,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        hiddenFileInput,
        handleRegenerateClick,
        gang,
    } = props
    const { t } = useTranslation()
    const { gangs, fixerJobs } = useData()
    const [selectedGang, setSelectedGang] = useState<Gang>(() => {
        // Get the gang from chainStarter based on ID or direct reference
        const gangRef = gang.chainStarter?.gang
        if (typeof gangRef === 'string') {
            // If gang is stored as ID, find the gang object
            return gangs.find((g) => g.ID === gangRef) || gangs[0] || null
        }
        // Otherwise it's already a gang object
        return gangRef || gangs[0] || null
    })

    const handleChangeGang = (e: SelectChangeEvent<string>) => {
        const gangId = e.target.value
        const sg = gangs.find((g) => g.ID === gangId)
        if (sg) {
            setSelectedGang(sg)

            // Store both the ID for storage compatibility and the gang object for immediate display
            if (gang.chainStarter && 'gang' in gang.chainStarter) {
                // First update the ID reference for storage
                handleChange(gang.handleGangChangeTarget, gangId)

                // Now update the actual display object
                // This is a separate update to ensure the UI shows the full gang object
                // We need to use a timeout to ensure the first change is processed
                setTimeout(() => {
                    // For plotSubject.gang, we need to update the gang property directly
                    // Look at the original object path and update appropriately
                    if (gang.handleGangChangeTarget === 'plot.plotSubject.gang') {
                        const plotSubject = editedItem.plot?.plotSubject
                        if (plotSubject && 'gang' in plotSubject) {
                            // Replace the string ID with the full gang object for display
                            handleChange('plot.plotSubject', {
                                ...plotSubject,
                                gang: sg,
                            })
                        }
                    } else if (gang.handleGangChangeTarget.includes('complication')) {
                        // For complications with gang references, similar approach
                        const parts = gang.handleGangChangeTarget.split('.')
                        const complicationPath = parts.slice(0, -1).join('.')
                        if (
                            complicationPath &&
                            editedItem.plot?.plotSubject &&
                            'complication' in editedItem.plot.plotSubject
                        ) {
                            const plotGang = editedItem.plot.plotSubject as unknown as {
                                complication: { gang?: unknown }
                            }
                            const complication = plotGang.complication
                            if (complication && 'gang' in complication) {
                                handleChange('plot.plotSubject.complication', {
                                    ...complication,
                                    gang: sg,
                                })
                            }
                        }
                    }
                }, 0)
            }
        }
    }

    const handleChangeGangComplication = (e: SelectChangeEvent<string>) => {
        const newComplication = e.target.value
        const fixerJob = fixerJobs.find((job) => job.ID === editedItem.ID)
        // Reset subject data based on complication type
        if (!fixerJob) return
        if (newComplication.includes('CHARACTER')) {
            if (gang.originalChainStarter?.complication?.character) {
                handleChange(
                    gang.handleChangeGangComplicationCharacterTarget,
                    gang.originalChainStarter?.complication?.character
                )
                handleChange(gang.handleChangeGangComplicationItemTarget, null)
            } else {
                handleChange(gang.handleChangeGangComplicationCharacterTarget, null)
                handleChange(gang.handleChangeGangComplicationItemTarget, null)
            }
        } else if (newComplication.includes('ITEM')) {
            if (gang.originalChainStarter?.complication?.item) {
                handleChange(gang.handleChangeGangComplicationCharacterTarget, null)
                handleChange(gang.handleChangeGangComplicationItemTarget, gang.originalChainStarter?.complication?.item)
            } else {
                handleChange(gang.handleChangeGangComplicationCharacterTarget, null)
                handleChange(gang.handleChangeGangComplicationItemTarget, null)
            }
        } else {
            handleChange(gang.handleChangeGangComplicationCharacterTarget, null)
            handleChange(gang.handleChangeGangComplicationItemTarget, null)
        }
        handleChange(gang.handleChangeGangComplicationTypeTarget, newComplication)
    }

    return (
        <>
            {hiddenFileInput}
            <Accordion
                sx={{
                    mt: 2,
                    ml: gang.main ? '16px !important' : '0px !important',
                    bgcolor: colors.neons.yellow.default + '50 !important',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    width: '100%',
                }}
                disableGutters
            >
                <AccordionSummary expandIcon={<ExpandMore fontSize="large" />}>
                    <Typography variant="h6">{t('fixerJobs.labels.gang.details')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {/* Gang selection */}
                    <FormControl fullWidth variant="outlined" sx={{ ...formControlStyle, mb: 2 }}>
                        <InputLabel id="gang-label" sx={inputLabelStyle}>
                            {t('gangs.gangSelector')}
                        </InputLabel>
                        <Select
                            labelId="gang-label"
                            value={selectedGang?.ID}
                            onChange={(e) => handleChangeGang(e)}
                            sx={selectStyle}
                        >
                            {gangs.map((gang) => (
                                <MenuItem key={gang.ID} value={gang.ID}>
                                    {gang.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* Gang Basic Info */}
                    <Grid item container xs={12} spacing={2}>
                        {/* Name */}
                        <Grid item container xs={12}>
                            <TextField
                                fullWidth
                                label={t('gangs.labels.name')}
                                value={selectedGang.name}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
                        </Grid>
                        <Grid item container xs={12} md={8}>
                            <Stack spacing={2} sx={{ width: '100%' }}>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                        {/* Skill */}
                                        <TextField
                                            fullWidth
                                            label={t('gangs.labels.skill')}
                                            value={selectedGang?.skill || ''}
                                            variant="outlined"
                                            sx={textFieldOutlinedStyle}
                                            type="number"
                                            disabled
                                        />
                                        {/* Weapons */}
                                        <TextField
                                            fullWidth
                                            label={t('gangs.labels.weapons')}
                                            value={(selectedGang?.weapons?.d6 ?? 0) + 'D6'}
                                            variant="outlined"
                                            sx={textFieldOutlinedStyle}
                                            disabled
                                        />
                                        {/* Armor */}
                                        <TextField
                                            fullWidth
                                            label={t('gangs.labels.armor')}
                                            value={selectedGang?.armor?.spb + '/' + selectedGang?.armor?.h}
                                            variant="outlined"
                                            sx={textFieldOutlinedStyle}
                                            disabled
                                        />
                                    </Stack>
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Gang Type */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.type')}
                                        value={t(`gangs.type.${selectedGang?.type}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Cyberware Quality */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.cyberwareQuality')}
                                        value={t(`gangs.cyberwareQuality.${selectedGang?.cyberwareQuality}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Secretive */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.secretive')}
                                        value={selectedGang?.secretive}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        type="number"
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Color */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.color')}
                                        value={t(`gangs.color.${selectedGang?.color}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Sin */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.sin')}
                                        value={t(`gangs.sin.${selectedGang?.sin}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Status */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.status')}
                                        value={t(`gangs.status.${selectedGang?.status}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Known For 1 */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.knownFor') + ' 1'}
                                        value={t(`gangs.knownForPart1.${selectedGang?.knownFor?.knownForPart1}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Known For 2*/}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.knownFor') + ' 2'}
                                        value={t(`gangs.knownForPart2.${selectedGang?.knownFor?.knownForPart2}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* Flaw */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.flaw')}
                                        value={t(`gangs.flaw.${selectedGang?.flaw}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                    {/* Attitude */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.currentAttitude')}
                                        value={t(`gangs.attitude.${selectedGang?.currentAttitude}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                    {/* News */}
                                    <TextField
                                        fullWidth
                                        label={t('gangs.labels.newsTheLeaderIsReceiving')}
                                        value={t(`gangs.news.${selectedGang?.newsTheLeaderIsReceiving}`)}
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                        disabled
                                    />
                                </Stack>
                            </Stack>
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
                                        {t('gangs.labels.image')}
                                    </Typography>
                                </InputLabel>
                                <ImageField
                                    image={selectedGang?.image}
                                    downloadName={selectedGang?.name}
                                    handleImageUploadClick={() => {}}
                                    handleImageRemove={() => {}}
                                    toggleFullscreenImage={() => toggleFullscreenImage(ImageFields.gang)}
                                    handleRegenerateClick={() => {}}
                                    canRegenerate={false}
                                    isGeneratingImage={false}
                                    disabled
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    {/* Description */}
                    <Grid item xs={12} mt={2}>
                        <TextField
                            fullWidth
                            label={t('gangs.labels.description')}
                            value={selectedGang?.description || ''}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                            multiline
                            disabled
                        />
                    </Grid>
                    {/* Gang Complication */}
                    <Accordion
                        sx={{
                            mt: 2,
                            bgcolor: colors.neons.red.default + '50 !important',
                            border: `1px solid ${colors.neons.cyan.dark}`,
                            borderRadius: 0.5,
                            width: '100%',
                        }}
                        disableGutters
                    >
                        <AccordionSummary expandIcon={<ExpandMore fontSize="large" />}>
                            <Typography variant="h6">{t('fixerJobs.labels.gang.complication')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="gang-complication-label" sx={inputLabelStyle}>
                                        {t('fixerJobs.labels.complicationType')}
                                    </InputLabel>
                                    <Select
                                        labelId="gang-complication-label"
                                        value={
                                            gang.chainStarter?.complication?.type ||
                                            PlotGangComplicationType.POLICE_RAIDING
                                        }
                                        onChange={handleChangeGangComplication}
                                        sx={selectStyle}
                                    >
                                        {Object.values(PlotGangComplicationType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {t(`fixerJobs.gangComplication.${type}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {gang.character.check && (
                                <CardCharacter
                                    isGeneratingImage={isGeneratingImage}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                    handleImageUploadClick={() => handleImageUploadClick(gang.character.imageField)}
                                    openDeleteImageDialog={() => openDeleteImageDialog(gang.character.imageField)}
                                    toggleFullscreenImage={() => toggleFullscreenImage(gang.character.imageField)}
                                    handleRegenerateClick={() => handleRegenerateClick(gang.character.imageField)}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    character={gang.character}
                                />
                            )}

                            {gang.item.check && (
                                <CardItem
                                    isGeneratingImage={isGeneratingImage}
                                    textFieldOutlinedStyle={textFieldOutlinedStyle}
                                    handleImageUploadClick={() => handleImageUploadClick(gang.item.imageField)}
                                    openDeleteImageDialog={() => openDeleteImageDialog(gang.item.imageField)}
                                    toggleFullscreenImage={() => toggleFullscreenImage(gang.item.imageField)}
                                    handleRegenerateClick={() => handleRegenerateClick(gang.item.imageField)}
                                    formControlStyle={formControlStyle}
                                    inputLabelStyle={inputLabelStyle}
                                    selectStyle={selectStyle}
                                    hiddenFileInput={hiddenFileInput}
                                    item={gang.item}
                                />
                            )}
                        </AccordionDetails>
                    </Accordion>
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export default CardGang
