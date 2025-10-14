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
import {
    Building,
    Character,
    FixerJob,
    Item,
    Maybe,
    PlotBuilding,
    PlotBuildingComplicationType,
} from '../../../../graphql/types'
import colors from '../../../../utils/colors'
import CyberpunkFormControl from '../../../CyberpunkFormControl'
import ImageField from '../ImageField'
import CardCharacter from './CardCharacter'
import CardItem from './CardItem'

export type CardBuildingProps = {
    editedTarget: FixerJob
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (targetField: string) => void
    selectStyle: SxProps
    building: {
        handleBuildingChangeTarget: string
        handleChangeBuildingComplicationCharacterTarget: string
        handleChangeBuildingComplicationItemTarget: string
        handleChangeBuildingComplicationTypeTarget: string
        chainStarter: PlotBuilding
        originalChainStarter: PlotBuilding
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

export const CardBuilding = (props: CardBuildingProps) => {
    const { editedTarget, textFieldOutlinedStyle, handleChange, selectStyle, toggleFullscreenImage, building } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { buildings } = useData()
    const [selectedBuilding, setSelectedBuilding] = useState<Building>(() => {
        // Get the building from chainStarter based on ID or direct reference
        const buildingRef = building.chainStarter?.building
        if (typeof buildingRef === 'string') {
            // If building is stored as ID, find the building object
            return buildings.find((b) => b.ID === buildingRef) || buildings[0] || null
        }
        // Otherwise it's already a building object
        return buildingRef || buildings[0] || null
    })

    const handleChangeBuilding = (e: SelectChangeEvent<string>) => {
        const buildingId = e.target.value
        const sb = buildings.find((b) => b.ID === buildingId)
        if (sb) {
            setSelectedBuilding(sb)

            // Store both the ID for storage compatibility and the building object for immediate display
            if (building.chainStarter && 'building' in building.chainStarter) {
                // First update the ID reference for storage
                handleChange(building.handleBuildingChangeTarget, buildingId)

                // Now update the actual display object
                // This is a separate update to ensure the UI shows the full building object
                // We need to use a timeout to ensure the first change is processed
                setTimeout(() => {
                    // For plotBuilding.building, we need to update the building property directly
                    if (building.handleBuildingChangeTarget === 'plot.plotBuilding.building') {
                        const plotBuilding = editedTarget.plot?.plotBuilding
                        if (plotBuilding) {
                            // Replace the ID with the full building object for display
                            handleChange('plot.plotBuilding', {
                                ...plotBuilding,
                                building: sb,
                            })
                        }
                    }
                }, 0)
            }
        }
    }

    const handleChangeBuildingComplication = (e: SelectChangeEvent<string>) => {
        const newComplication = e.target.value

        // Reset subject data based on complication type
        if (newComplication.includes('CHARACTER')) {
            // Try to restore from current state or original if available
            if (building.chainStarter?.complication?.character) {
                handleChange(
                    building.handleChangeBuildingComplicationCharacterTarget,
                    building.chainStarter.complication.character
                )
            } else if (building.originalChainStarter?.complication?.character) {
                handleChange(
                    building.handleChangeBuildingComplicationCharacterTarget,
                    building.originalChainStarter.complication.character
                )
            } else {
                handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
            }
            handleChange(building.handleChangeBuildingComplicationItemTarget, null)
        } else if (newComplication.includes('ITEM')) {
            handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
            // Try to restore from current state or original if available
            if (building.chainStarter?.complication?.item) {
                handleChange(
                    building.handleChangeBuildingComplicationItemTarget,
                    building.chainStarter.complication.item
                )
            } else if (building.originalChainStarter?.complication?.item) {
                handleChange(
                    building.handleChangeBuildingComplicationItemTarget,
                    building.originalChainStarter.complication.item
                )
            } else {
                handleChange(building.handleChangeBuildingComplicationItemTarget, null)
            }
        } else {
            handleChange(building.handleChangeBuildingComplicationCharacterTarget, null)
            handleChange(building.handleChangeBuildingComplicationItemTarget, null)
        }
        handleChange(building.handleChangeBuildingComplicationTypeTarget, newComplication)
    }

    return (
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
                <CyberpunkFormControl
                    readerMode={readerMode}
                    label={t('buildings.buildingSelector')}
                    labelId="building-label"
                    sx={{ mb: 2 }}
                >
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
                </CyberpunkFormControl>
                {/* Building Basic Info */}
                <Grid container spacing={2} size={{ xs: 12 }}>
                    {/* Name */}
                    <Grid container size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label={t('buildings.labels.name')}
                            value={selectedBuilding?.name || ''}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                            disabled
                        />
                    </Grid>
                    <Grid container size={{ xs: 12, md: 8 }}>
                        <Stack spacing={2} sx={{ width: '100%' }}>
                            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                {/* Type */}
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.type')}
                                    value={t(`buildings.type.${selectedBuilding?.type}`)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                {/* Style */}
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.style')}
                                    value={t(`buildings.style.${selectedBuilding?.style}`)}
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
                                    value={selectedBuilding.isAbandoned ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.elevators')}
                                    value={selectedBuilding.elevators ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.parking')}
                                    value={selectedBuilding.parking ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.gatehouseFrontDesk')}
                                    value={selectedBuilding.gatehouseFrontDesk ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                            </Stack>
                            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.emergencyExit')}
                                    value={selectedBuilding.emergencyExit ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.backupLights')}
                                    value={selectedBuilding.backupLights ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.landingPad')}
                                    value={selectedBuilding.landingPad ? 'Yes' : 'No'}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.secretOrAltEntrance')}
                                    value={selectedBuilding.secretOrAltEntrance ? 'Yes' : 'No'}
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
                                    value={t(`buildings.securityPersonnel.${selectedBuilding?.securityPersonnel}`)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                {/* Ownership */}
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.ownership')}
                                    value={t(`buildings.ownership.${selectedBuilding?.ownership}`)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                            </Stack>
                            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.secret')}
                                    value={t(`buildings.secret.${selectedBuilding?.secret}`)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                {/* Event */}
                                <TextField
                                    fullWidth
                                    label={t('buildings.labels.event')}
                                    value={t(`buildings.event.${selectedBuilding?.event}`)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    disabled
                                />
                                {/* Secret */}
                            </Stack>
                        </Stack>
                    </Grid>
                    {/* Building Image */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('buildings.labels.image')}
                            labelId="building-image-label"
                            labelSx={{
                                top: -25,
                                lineHeight: '1 !important',
                                py: '0 !important',
                            }}
                        >
                            <ImageField
                                image={selectedBuilding?.image}
                                downloadName={selectedBuilding?.name}
                                handleImageUploadClick={() => {}}
                                handleImageRemove={() => {}}
                                toggleFullscreenImage={toggleFullscreenImage}
                                handleRegenerateClick={() => {}}
                                canRegenerate={false}
                                isGeneratingImage={false}
                                disabled
                            />
                        </CyberpunkFormControl>
                    </Grid>
                    {/* Description */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label={t('buildings.labels.description')}
                            value={selectedBuilding?.description || ''}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                            multiline
                            disabled
                        />
                    </Grid>
                </Grid>
                {/* Building Complication */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ my: 2 }}>
                        {t('fixerJobs.labels.building.complication')}
                    </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <CyberpunkFormControl
                        readerMode={readerMode}
                        label={t('fixerJobs.labels.complicationType')}
                        labelId="gang-complication-label"
                    >
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
                    </CyberpunkFormControl>
                </Grid>

                {/* --- CHARACTER SECTION --- */}
                {building.character.check && (
                    <CardCharacter
                        textFieldOutlinedStyle={textFieldOutlinedStyle}
                        handleChange={handleChange}
                        toggleFullscreenImage={toggleFullscreenImage}
                        selectStyle={selectStyle}
                        character={{
                            ...building.character,
                            main: false,
                        }}
                        editedTarget={editedTarget}
                    />
                )}

                {/* --- ITEM SECTION --- */}
                {building.item.check && (
                    <CardItem
                        textFieldOutlinedStyle={textFieldOutlinedStyle}
                        handleChange={handleChange}
                        toggleFullscreenImage={toggleFullscreenImage}
                        selectStyle={selectStyle}
                        item={{
                            ...building.item,
                            main: false,
                        }}
                        editedTarget={editedTarget}
                    />
                )}
            </AccordionDetails>
        </Accordion>
    )
}

export default CardBuilding
