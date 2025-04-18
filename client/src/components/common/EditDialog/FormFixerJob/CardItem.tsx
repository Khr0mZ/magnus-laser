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
    Stack,
    SxProps,
    TextField,
    Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { PlotItemCondition, PlotItemType } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import ImageField from '../ImageField'
import { FieldProps, ImageFieldProps } from './CardCharacter'

export type CardItemProps = {
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
    item: {
        name: FieldProps
        type: FieldProps
        condition: FieldProps
        image: ImageFieldProps
    }
}

const CardItem = (props: CardItemProps) => {
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
        item,
    } = props
    const { t } = useTranslation()

    return (
        <>
            {hiddenFileInput}
            <Accordion
                sx={{
                    mt: 2,
                    ml: item.image.main ? '16px !important' : '0px !important',
                    bgcolor: colors.neons.green.default + '50 !important',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    width: '100%',
                }}
                disableGutters
            >
                <AccordionSummary expandIcon={<ExpandMore fontSize="large" />}>
                    <Typography variant="h6">{t('fixerJobs.labels.item.title')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid item container xs={12} spacing={2}>
                        <Grid item container xs={8}>
                            <Stack spacing={2} sx={{ width: '100%' }}>
                                {/* Subject Name */}
                                <TextField
                                    fullWidth
                                    label={t('fixerJobs.labels.item.name')}
                                    value={item.name.value}
                                    onChange={item.name.onChange}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                                {/* Item Type - Specific to item category */}
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="item-type-label" sx={inputLabelStyle}>
                                        {t('fixerJobs.labels.item.type')}
                                    </InputLabel>
                                    <Select
                                        labelId="item-type-label"
                                        value={item.type.value}
                                        onChange={item.type.onChange}
                                        label={t('fixerJobs.labels.item.type')}
                                        sx={selectStyle}
                                    >
                                        {Object.values(PlotItemType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {t(`fixerJobs.item.${type}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Item Condition */}
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="subject-condition-label" sx={inputLabelStyle}>
                                        {t('fixerJobs.labels.item.condition')}
                                    </InputLabel>
                                    <Select
                                        labelId="subject-condition-label"
                                        value={item.condition.value}
                                        onChange={item.condition.onChange}
                                        label={t('fixerJobs.labels.item.condition')}
                                        sx={selectStyle}
                                    >
                                        {Object.values(PlotItemCondition).map((condition) => (
                                            <MenuItem key={condition} value={condition}>
                                                {t(`fixerJobs.itemCondition.${condition}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
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
                                    <Typography variant="caption">{t('fixerJobs.labels.item.image')}</Typography>
                                </InputLabel>
                                <ImageField
                                    image={item.image.image}
                                    downloadName={item.name.value}
                                    handleImageUploadClick={handleImageUploadClick}
                                    handleImageRemove={openDeleteImageDialog}
                                    toggleFullscreenImage={toggleFullscreenImage}
                                    handleRegenerateClick={handleRegenerateClick}
                                    canRegenerate={item.image.canRegenerate}
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

export default CardItem
