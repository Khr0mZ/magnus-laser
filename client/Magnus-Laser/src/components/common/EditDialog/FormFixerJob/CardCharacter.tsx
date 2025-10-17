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
import { Character, FixerJob, Maybe } from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import CyberpunkFormControl from '../../../CyberpunkFormControl'
import ImageField from '../ImageField'

export type CardCharacterProps = {
    editedTarget: FixerJob
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (image: string) => void
    selectStyle: SxProps
    character: Character & {
        chain: Maybe<Character>
        field: string
        main: boolean
    }
}

const CardCharacter = (props: CardCharacterProps) => {
    const { textFieldOutlinedStyle, handleChange, toggleFullscreenImage, selectStyle, character } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { characters } = useData()
    const [selectedCharacter, setSelectedCharacter] = useState<Character>(() => {
        // Character is always a full object now from normalized database
        return character.chain || characters[0] || null
    })

    const handleChangeCharacter = (e: SelectChangeEvent<string>) => {
        const characterId = e.target.value
        const selectedChar = characters.find((c) => c.ID === characterId)
        if (selectedChar) {
            setSelectedCharacter(selectedChar)
            // Update the form data with the full character object
            // The save functions will handle normalization to the database format
            handleChange(character.field, selectedChar)
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
                <CyberpunkFormControl
                    readerMode={readerMode}
                    label={t('characters.characterSelector')}
                    labelId="character-label"
                    sx={{ mb: 2 }}
                >
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
                </CyberpunkFormControl>
                <Grid container size={{ xs: 12 }} spacing={2}>
                    <Grid container size={{ xs: 8 }}>
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
                    <Grid size={{ xs: 12, md: 4 }}>
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('fixerJobs.labels.character.image')}
                            labelId="character-image-label"
                            labelSx={{
                                top: -25,
                                lineHeight: '1 !important',
                                py: '0 !important',
                            }}
                        >
                            <ImageField
                                image={selectedCharacter.image}
                                downloadName={selectedCharacter.name}
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

export default CardCharacter
