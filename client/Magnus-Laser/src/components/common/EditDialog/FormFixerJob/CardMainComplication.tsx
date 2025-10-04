import { ExpandMore } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    FormControl,
    GridLegacy as Grid,
    InputLabel,
    MenuItem,
    Select,
    SxProps,
    Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Character, FixerJob, Item, Maybe, PlotComplicationType } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import CardCharacter from './CardCharacter'
import CardItem from './CardItem'

export type CardMainComplicationProps = {
    editedTarget: FixerJob
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (targetField: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    complication: {
        character: Character & {
            check: boolean
            field: string
            chain: Maybe<Character>
        }
        item: Item & {
            check: boolean
            field: string
            chain: Maybe<Item>
        }
    }
}

export const CardMainComplication = (props: CardMainComplicationProps) => {
    const {
        editedTarget,
        textFieldOutlinedStyle,
        handleChange,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        toggleFullscreenImage,
        complication,
    } = props
    const { t } = useTranslation()

    return (
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
                            value={editedTarget.plot?.plotComplication?.type || ''}
                            onChange={(e) => handleChange('plot.plotComplication.type', e.target.value)}
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
                        textFieldOutlinedStyle={textFieldOutlinedStyle}
                        toggleFullscreenImage={toggleFullscreenImage}
                        formControlStyle={formControlStyle}
                        inputLabelStyle={inputLabelStyle}
                        selectStyle={selectStyle}
                        character={{
                            ...complication.character,
                            main: false,
                        }}
                        handleChange={handleChange}
                        editedTarget={editedTarget}
                    />
                )}

                {/* Item Complication */}
                {complication.item.check && (
                    <CardItem
                        textFieldOutlinedStyle={textFieldOutlinedStyle}
                        toggleFullscreenImage={toggleFullscreenImage}
                        formControlStyle={formControlStyle}
                        inputLabelStyle={inputLabelStyle}
                        selectStyle={selectStyle}
                        item={{
                            ...complication.item,
                            main: false,
                        }}
                        handleChange={handleChange}
                        editedTarget={editedTarget}
                    />
                )}
            </AccordionDetails>
        </Accordion>
    )
}

export default CardMainComplication
