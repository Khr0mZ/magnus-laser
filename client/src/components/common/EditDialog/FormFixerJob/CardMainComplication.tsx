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
    SxProps,
    Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { FixerJob, PlotComplicationType, PlotGang } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import { ImageFields } from '../../../../utils/constants'
import CardCharacter, { FieldProps, ImageFieldProps } from './CardCharacter'
import CardGang from './CardGang'
import CardItem from './CardItem'

export type CardMainComplicationProps = {
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
    complication: {
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

export const CardMainComplication = (props: CardMainComplicationProps) => {
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
        complication,
    } = props
    const { t } = useTranslation()

    return (
        <>
            {hiddenFileInput}
            <Accordion
                sx={{
                    mt: 2,
                    ml: '16px !important',
                    bgcolor: colors.neons.red.default + '50 !important',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    width: '100%',
                }}
                disableGutters
            >
                <AccordionSummary expandIcon={<ExpandMore fontSize="large" />}>
                    <Typography variant="h6">{t('fixerJobs.labels.mainComplication')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {/* Main Complication Type */}
                    <Grid item xs={12}>
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="complication-label" sx={inputLabelStyle}>
                                {t('fixerJobs.labels.complicationType')}
                            </InputLabel>
                            <Select
                                labelId="complication-label"
                                value={editedItem.plot?.complication?.type || ''}
                                onChange={(e) => handleChange('plot.complication.type', e.target.value)}
                                label={t('fixerJobs.labels.complicationType')}
                                sx={selectStyle}
                            >
                                {Object.values(PlotComplicationType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t(`fixerJobs.complication.${type}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Character Complication */}
                    {complication.character.check && (
                        <CardCharacter
                            isGeneratingImage={isGeneratingImage}
                            textFieldOutlinedStyle={textFieldOutlinedStyle}
                            handleImageUploadClick={() => handleImageUploadClick(complication.character.imageField)}
                            openDeleteImageDialog={() => openDeleteImageDialog(complication.character.imageField)}
                            toggleFullscreenImage={() => toggleFullscreenImage(complication.character.imageField)}
                            handleRegenerateClick={() => handleRegenerateClick(complication.character.imageField)}
                            formControlStyle={formControlStyle}
                            inputLabelStyle={inputLabelStyle}
                            selectStyle={selectStyle}
                            hiddenFileInput={hiddenFileInput}
                            character={{
                                ...complication.character,
                            }}
                        />
                    )}

                    {/* Item Complication */}
                    {complication.item.check && (
                        <CardItem
                            isGeneratingImage={isGeneratingImage}
                            textFieldOutlinedStyle={textFieldOutlinedStyle}
                            handleImageUploadClick={() => handleImageUploadClick(complication.item.imageField)}
                            openDeleteImageDialog={() => openDeleteImageDialog(complication.item.imageField)}
                            toggleFullscreenImage={() => toggleFullscreenImage(complication.item.imageField)}
                            handleRegenerateClick={() => handleRegenerateClick(complication.item.imageField)}
                            formControlStyle={formControlStyle}
                            inputLabelStyle={inputLabelStyle}
                            selectStyle={selectStyle}
                            hiddenFileInput={hiddenFileInput}
                            item={{
                                ...complication.item,
                            }}
                        />
                    )}

                    {/* Gang Complication */}
                    {complication.gang.check && (
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
                                ...complication.gang,
                            }}
                        />
                    )}
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export default CardMainComplication
