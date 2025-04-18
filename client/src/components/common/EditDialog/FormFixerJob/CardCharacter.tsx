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
import { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PlotCharacterAttitude, PlotCharacterType } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import ImageField from '../ImageField'

export type FieldProps = {
    value: string
    onChange: (e: SelectChangeEvent<string> | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export type ImageFieldProps = {
    image: string
    main: boolean
    canRegenerate: boolean
}

export type CardCharacterProps = {
    isGeneratingImage?: boolean
    textFieldOutlinedStyle: SxProps
    handleImageUploadClick: () => void
    openDeleteImageDialog: () => void
    toggleFullscreenImage: () => void
    handleRegenerateClick: () => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element
    character: {
        name: FieldProps
        type: FieldProps
        attitude: FieldProps
        image: ImageFieldProps
    }
}

const CardCharacter = (props: CardCharacterProps) => {
    const {
        isGeneratingImage,
        textFieldOutlinedStyle,
        handleImageUploadClick,
        openDeleteImageDialog,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        hiddenFileInput,
        handleRegenerateClick,
        character,
    } = props
    const { t } = useTranslation()

    return (
        <>
            {hiddenFileInput}
            <Accordion
                sx={{
                    mt: 2,
                    ml: character.image.main ? '16px !important' : '0px !important',
                    bgcolor: colors.neons.pink.default + '50 !important',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    width: '100%',
                }}
                disableGutters
            >
                <AccordionSummary expandIcon={<ExpandMore fontSize="large" />}>
                    <Typography variant="h6">{t('fixerJobs.labels.character.title')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid item container xs={12} spacing={2}>
                        <Grid item container xs={8}>
                            <Stack spacing={2} sx={{ width: '100%' }}>
                                {/* Subject Name */}
                                <TextField
                                    fullWidth
                                    label={t('fixerJobs.labels.character.name')}
                                    value={character.name.value}
                                    onChange={character.name.onChange}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                                {/* Character Type - Specific to character category */}
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="character-type-label" sx={inputLabelStyle}>
                                        {t('fixerJobs.labels.character.type')}
                                    </InputLabel>
                                    <Select
                                        labelId="character-type-label"
                                        value={character.type.value}
                                        onChange={character.type.onChange}
                                        label={t('fixerJobs.labels.character.type')}
                                        sx={selectStyle}
                                    >
                                        {Object.values(PlotCharacterType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {t(`fixerJobs.character.${type}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {/* Character Attitude */}
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="subject-attitude-label" sx={inputLabelStyle}>
                                        {t('fixerJobs.labels.character.attitude')}
                                    </InputLabel>
                                    <Select
                                        labelId="subject-attitude-label"
                                        value={character.attitude.value}
                                        onChange={character.attitude.onChange}
                                        label={t('fixerJobs.labels.character.attitude')}
                                        sx={selectStyle}
                                    >
                                        {Object.values(PlotCharacterAttitude).map((attitude) => (
                                            <MenuItem key={attitude} value={attitude}>
                                                {t(`fixerJobs.characterAttitude.${attitude}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
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
                                    <Typography variant="caption">{t('fixerJobs.labels.character.image')}</Typography>
                                </InputLabel>
                                <ImageField
                                    image={character.image.image}
                                    downloadName={character.name.value}
                                    handleImageUploadClick={handleImageUploadClick}
                                    handleImageRemove={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                    handleRegenerateClick={handleRegenerateClick}
                                    canRegenerate={character.image.canRegenerate}
                                    isGeneratingImage={isGeneratingImage}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export default CardCharacter
