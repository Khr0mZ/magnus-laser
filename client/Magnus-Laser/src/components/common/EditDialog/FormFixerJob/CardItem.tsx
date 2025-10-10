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
import { FixerJob, Item, Maybe } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import ImageField from '../ImageField'
export type CardItemProps = {
    editedTarget: FixerJob
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (image: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    item: Item & {
        chain: Maybe<Item>
        field: string
        main: boolean
    }
}

const CardItem = (props: CardItemProps) => {
    const {
        editedTarget,
        textFieldOutlinedStyle,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        item,
        handleChange,
    } = props
    const { t } = useTranslation()
    const { items } = useData()
    const [selectedItem, setSelectedItem] = useState<Item>(() => {
        // Get the character from chainStarter based on ID or direct reference
        const itemRef = item.chain
        if (typeof itemRef === 'string') {
            // If character is stored as ID, find the character object
            return items.find((i) => i.ID === itemRef) || items[0] || null
        }
        // Otherwise it's already a character object
        return itemRef || items[0] || null
    })

    const handleChangeItem = (e: SelectChangeEvent<string>) => {
        const itemId = e.target.value
        const si = items.find((i) => i.ID === itemId)
        if (si) {
            setSelectedItem(si)

            // Store both the ID for storage compatibility and the character object for immediate display
            if (item.chain && 'ID' in item.chain) {
                // First update the ID reference for storage
                handleChange(item.field, itemId)

                // Now update the actual display object
                // This is a separate update to ensure the UI shows the full gang object
                // We need to use a timeout to ensure the first change is processed
                setTimeout(() => {
                    // For plotSubject.gang, we need to update the gang property directly
                    // Look at the original object path and update appropriately
                    if (item.field === 'plot.plotSubject') {
                        const plotSubject = editedTarget.plot?.plotSubject
                        if (plotSubject && 'gang' in plotSubject) {
                            // Replace the string ID with the full gang object for display
                            handleChange('plot.plotSubject', {
                                ...plotSubject,
                                item: si,
                            })
                        }
                    } else if (item.field === 'plot.plotSubject.complication.item') {
                        const plotSubject = editedTarget.plot?.plotSubject
                        if (
                            plotSubject &&
                            'complication' in plotSubject &&
                            plotSubject.complication.type.includes('ITEM')
                        ) {
                            handleChange('plot.plotSubject.complication.item', si)
                        }
                    } else if (item.field === 'plot.plotBuilding.complication.item') {
                        const plotSubject = editedTarget.plot?.plotBuilding
                        if (
                            plotSubject &&
                            'complication' in plotSubject &&
                            plotSubject.complication.type.includes('ITEM')
                        ) {
                            handleChange('plot.plotBuilding.complication.item', si)
                        }
                    } else if (item.field === 'plot.plotComplication.item') {
                        const plotSubject = editedTarget.plot
                        if (
                            plotSubject &&
                            'complication' in plotSubject &&
                            editedTarget.plot.plotComplication.type.includes('ITEM')
                        ) {
                            handleChange('plot.plotComplication.item', si)
                        }
                    }
                }, 0)
            }
        }
    }

    return (
        <Accordion
            sx={{
                mt: 2,
                ml: item.main ? '16px !important' : '0px !important',
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
                {/* Item selection */}
                <FormControl fullWidth variant="outlined" sx={{ ...formControlStyle, mb: 2 }}>
                    <InputLabel id="item-label" sx={inputLabelStyle}>
                        {t('items.itemSelector')}
                    </InputLabel>
                    <Select
                        labelId="item-label"
                        value={selectedItem?.ID}
                        onChange={(e) => handleChangeItem(e)}
                        sx={selectStyle}
                    >
                        {items.map((item) => (
                            <MenuItem key={item.ID} value={item.ID}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Grid container size={{ xs: 12 }} spacing={2}>
                    <Grid container size={{ xs: 8 }}>
                        <Stack spacing={2} sx={{ width: '100%' }}>
                            {/* Subject Name */}
                            <TextField
                                fullWidth
                                label={t('fixerJobs.labels.item.name')}
                                value={selectedItem?.name}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
                            {/* Item Type - Specific to item category */}
                            <TextField
                                fullWidth
                                label={t('fixerJobs.labels.item.type')}
                                value={t(`fixerJobs.item.${selectedItem?.type}`)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />

                            {/* Item Condition */}
                            <TextField
                                fullWidth
                                label={t('fixerJobs.labels.item.condition')}
                                value={t(`fixerJobs.itemCondition.${selectedItem?.condition}`)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
                        </Stack>
                    </Grid>

                    {/* Item Image */}
                    <Grid size={{ xs: 12, md: 4 }}>
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
                                image={selectedItem.image}
                                downloadName={selectedItem.name}
                                toggleFullscreenImage={toggleFullscreenImage}
                                disabled
                            />
                        </FormControl>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    )
}

export default CardItem
