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
    SelectChangeEvent,
    Stack,
    SxProps,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../../contexts/dataHooks'
import { Character, FixerJob, Maybe } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import ImageField from '../ImageField'

export type CardCharacterProps = {
    editedTarget: FixerJob
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (image: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    character: Character & {
        chain: Maybe<Character>
        field: string
        main: boolean
    }
}

const CardCharacter = (props: CardCharacterProps) => {
    const {
        editedTarget,
        textFieldOutlinedStyle,
        handleChange,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        character,
    } = props
    const { t } = useTranslation()
    const { characters } = useData()
    const [selectedCharacter, setSelectedCharacter] = useState<Character>(() => {
        // Get the character from chainStarter based on ID or direct reference
        const characterRef = character.chain
        if (typeof characterRef === 'string') {
            // If character is stored as ID, find the character object
            return characters.find((c) => c.ID === characterRef) || characters[0] || null
        }
        // Otherwise it's already a character object
        return characterRef || characters[0] || null
    })

    const handleChangeCharacter = (e: SelectChangeEvent<string>) => {
        const characterId = e.target.value
        const sc = characters.find((c) => c.ID === characterId)
        if (sc) {
            setSelectedCharacter(sc)

            // Store both the ID for storage compatibility and the character object for immediate display
            if (character.chain && 'ID' in character.chain) {
                // First update the ID reference for storage
                handleChange(character.field, characterId)

                // Now update the actual display object
                // This is a separate update to ensure the UI shows the full gang object
                // We need to use a timeout to ensure the first change is processed
                setTimeout(() => {
                    // For plotSubject.gang, we need to update the gang property directly
                    // Look at the original object path and update appropriately
                    if (character.field === 'plot.plotSubject') {
                        const plotSubject = editedTarget.plot?.plotSubject
                        if (plotSubject && 'gang' in plotSubject) {
                            // Replace the string ID with the full gang object for display
                            handleChange('plot.plotSubject', {
                                ...plotSubject,
                                character: sc,
                            })
                        }
                    } else if (character.field === 'plot.plotSubject.complication.character') {
                        const plotSubject = editedTarget.plot?.plotSubject
                        if (
                            plotSubject &&
                            'complication' in plotSubject &&
                            plotSubject.complication.type.includes('CHARACTER')
                        ) {
                            handleChange('plot.plotSubject.complication.character', sc)
                        }
                    } else if (character.field === 'plot.plotBuilding.complication.character') {
                        const plotSubject = editedTarget.plot?.plotBuilding
                        if (
                            plotSubject &&
                            'complication' in plotSubject &&
                            plotSubject.complication.type.includes('CHARACTER')
                        ) {
                            handleChange('plot.plotBuilding.complication.character', sc)
                        }
                    } else if (character.field === 'plot.plotComplication.character') {
                        const plotSubject = editedTarget.plot
                        if (
                            plotSubject &&
                            'complication' in plotSubject &&
                            editedTarget.plot.plotComplication.type.includes('CHARACTER')
                        ) {
                            handleChange('plot.plotComplication.character', sc)
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
                ml: character.main ? '16px !important' : '0px !important',
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
                {/* Character selection */}
                <FormControl fullWidth variant="outlined" sx={{ ...formControlStyle, mb: 2 }}>
                    <InputLabel id="character-label" sx={inputLabelStyle}>
                        {t('characters.characterSelector')}
                    </InputLabel>
                    <Select
                        labelId="character-label"
                        value={selectedCharacter?.ID}
                        onChange={(e) => handleChangeCharacter(e)}
                        sx={selectStyle}
                    >
                        {characters.map((character) => (
                            <MenuItem key={character.ID} value={character.ID}>
                                {character.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Grid item container xs={12} spacing={2}>
                    <Grid item container xs={8}>
                        <Stack spacing={2} sx={{ width: '100%' }}>
                            {/* Subject Name */}
                            <TextField
                                fullWidth
                                label={t('fixerJobs.labels.character.name')}
                                value={selectedCharacter?.name || ''}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
                            {/* Character Type - Specific to character category */}
                            <TextField
                                fullWidth
                                label={t('fixerJobs.labels.character.type')}
                                value={t(`fixerJobs.character.${selectedCharacter?.type}`)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
                            {/* Character Attitude */}
                            <TextField
                                fullWidth
                                label={t('fixerJobs.labels.character.attitude')}
                                value={t(`fixerJobs.characterAttitude.${selectedCharacter?.attitude}`)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                                disabled
                            />
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
                                image={selectedCharacter.image}
                                downloadName={selectedCharacter.name}
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

export default CardCharacter
