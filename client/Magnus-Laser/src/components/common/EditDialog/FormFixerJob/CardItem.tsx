import { ExpandMore } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Grid,
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
import { useUserPreferences } from '../../../../contexts/userPreferencesHooks'
import { FixerJob, Item, Maybe } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import CyberpunkFormControl from '../../../CyberpunkFormControl'
import ImageField from '../ImageField'
export type CardItemProps = {
    editedTarget: FixerJob
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (image: string) => void
    selectStyle: SxProps
    item: Item & {
        chain: Maybe<Item>
        field: string
        main: boolean
    }
}

const CardItem = (props: CardItemProps) => {
    const { textFieldOutlinedStyle, toggleFullscreenImage, selectStyle, item, handleChange } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { items } = useData()
    const [selectedItem, setSelectedItem] = useState<Item>(() => {
        // Item is always a full object now from normalized database
        return item.chain || items[0] || null
    })

    const handleChangeItem = (e: SelectChangeEvent<string>) => {
        const itemId = e.target.value
        const selectedItem = items.find((i) => i.ID === itemId)
        if (selectedItem) {
            setSelectedItem(selectedItem)
            // Update the form data with the full item object
            // The save functions will handle normalization to the database format
            handleChange(item.field, selectedItem)
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
                <CyberpunkFormControl
                    readerMode={readerMode}
                    label={t('items.itemSelector')}
                    labelId="item-label"
                    sx={{ mb: 2 }}
                >
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
                </CyberpunkFormControl>

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
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('fixerJobs.labels.item.image')}
                            labelId="item-image-label"
                            labelSx={{
                                top: -25,
                                lineHeight: '1 !important',
                                py: '0 !important',
                            }}
                        >
                            <ImageField
                                image={selectedItem.image}
                                downloadName={selectedItem.name}
                                toggleFullscreenImage={toggleFullscreenImage}
                                disabled
                            />
                        </CyberpunkFormControl>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    )
}

export default CardItem
