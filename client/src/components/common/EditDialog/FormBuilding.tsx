import { FormControl, Grid, InputLabel, MenuItem, Select, Stack, SxProps, TextField } from '@mui/material'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import {
    Building,
    BuildingEvent,
    BuildingOwnership,
    BuildingSecret,
    BuildingSecurityPersonnel,
    BuildingStyle,
    BuildingType,
} from '../../../graphql/types'
import { handleRegenerateImage } from '../../../utils/apiUtils'
import { ModuleTypes } from '../../../utils/constants'
import ImageField from './ImageField'

export type FormBuildingProps = {
    editedTarget: Building
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setBuildings?: Dispatch<SetStateAction<Building[]>>
    setBuildingToEdit?: Dispatch<SetStateAction<Building | null>>
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    handleImageUploadClick: () => void
    openDeleteImageDialog: () => void
    toggleFullscreenImage: (image: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element
}

export const FormBuilding = (props: FormBuildingProps) => {
    const {
        editedTarget,
        moduleType,
        setIsSaving,
        isGeneratingImage,
        setBuildingToEdit,
        setBuildings,
        setIsGeneratingImage,
        textFieldOutlinedStyle,
        handleChange,
        handleImageUploadClick,
        openDeleteImageDialog,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        hiddenFileInput,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    return (
        <>
            {hiddenFileInput}
            {/* Name */}
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('buildings.labels.name')}
                    value={editedTarget.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Description */}
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('common.description')}
                    value={editedTarget.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    multiline
                />
            </Grid>
            <Grid item container xs={12} md={8}>
                <Stack spacing={2} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Type */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel id="type-label" sx={inputLabelStyle}>
                                {t('buildings.labels.type')}
                            </InputLabel>
                            <Select
                                labelId="type-label"
                                value={editedTarget.type || ''}
                                onChange={(e) => handleChange('type', e.target.value)}
                                label={t('buildings.labels.type')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t(`buildings.type.${type}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* BuildingStyle */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.style')}</InputLabel>
                            <Select
                                value={editedTarget.style || ''}
                                onChange={(e) => handleChange('style', e.target.value)}
                                label={t('buildings.labels.style')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingStyle).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`buildings.style.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Is Abandoned */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.isAbandoned')}</InputLabel>
                            <Select
                                value={editedTarget.isAbandoned ? 'yes' : 'no'}
                                onChange={(e) => handleChange('isAbandoned', e.target.value === 'yes')}
                                label={t('buildings.labels.isAbandoned')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Elevators */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.elevators')}</InputLabel>
                            <Select
                                value={editedTarget.elevators ? 'yes' : 'no'}
                                onChange={(e) => handleChange('elevators', e.target.value === 'yes')}
                                label={t('buildings.labels.elevators')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Parking */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.parking')}</InputLabel>
                            <Select
                                value={editedTarget.parking ? 'yes' : 'no'}
                                onChange={(e) => handleChange('parking', e.target.value === 'yes')}
                                label={t('buildings.labels.parking')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Gatehouse / Front Desk */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.gatehouseFrontDesk')}</InputLabel>
                            <Select
                                value={editedTarget.gatehouseFrontDesk ? 'yes' : 'no'}
                                onChange={(e) => handleChange('gatehouseFrontDesk', e.target.value === 'yes')}
                                label={t('buildings.labels.gatehouseFrontDesk')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Emergency Exit */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.emergencyExit')}</InputLabel>
                            <Select
                                value={editedTarget.emergencyExit ? 'yes' : 'no'}
                                onChange={(e) => handleChange('emergencyExit', e.target.value === 'yes')}
                                label={t('buildings.labels.emergencyExit')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Backup Lights */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.backupLights')}</InputLabel>
                            <Select
                                value={editedTarget.backupLights ? 'yes' : 'no'}
                                onChange={(e) => handleChange('backupLights', e.target.value === 'yes')}
                                label={t('buildings.labels.backupLights')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Landing Pad */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.landingPad')}</InputLabel>
                            <Select
                                value={editedTarget.landingPad ? 'yes' : 'no'}
                                onChange={(e) => handleChange('landingPad', e.target.value === 'yes')}
                                label={t('buildings.labels.landingPad')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* BuildingSecret / Alt Entrance */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.secretOrAltEntrance')}</InputLabel>
                            <Select
                                value={editedTarget.secretOrAltEntrance ? 'yes' : 'no'}
                                onChange={(e) => handleChange('secretOrAltEntrance', e.target.value === 'yes')}
                                label={t('buildings.labels.secretOrAltEntrance')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Security Personnel */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.securityPersonnel')}</InputLabel>
                            <Select
                                value={editedTarget.securityPersonnel || ''}
                                onChange={(e) => handleChange('securityPersonnel', e.target.value)}
                                label={t('buildings.labels.securityPersonnel')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingSecurityPersonnel).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`buildings.securityPersonnel.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* BuildingOwnership */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.ownership')}</InputLabel>
                            <Select
                                value={editedTarget.ownership || ''}
                                onChange={(e) => handleChange('ownership', e.target.value)}
                                label={t('buildings.labels.ownership')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingOwnership).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`buildings.ownership.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* BuildingEvent */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.event')}</InputLabel>
                            <Select
                                value={editedTarget.event || ''}
                                onChange={(e) => handleChange('event', e.target.value)}
                                label={t('buildings.labels.event')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingEvent).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`buildings.event.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* BuildingSecret */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('buildings.labels.secret')}</InputLabel>
                            <Select
                                value={editedTarget.secret || ''}
                                onChange={(e) => handleChange('secret', e.target.value)}
                                label={t('buildings.labels.secret')}
                                sx={selectStyle}
                            >
                                {Object.values(BuildingSecret).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`buildings.secret.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Grid>
            {/* Image */}
            <Grid item xs={12} md={4}>
                <ImageField
                    image={editedTarget.image}
                    downloadName={editedTarget.name}
                    handleImageUploadClick={handleImageUploadClick}
                    handleImageRemove={openDeleteImageDialog}
                    toggleFullscreenImage={toggleFullscreenImage}
                    handleRegenerateClick={() => {
                        if (setIsGeneratingImage && setBuildings) {
                            handleRegenerateImage(
                                editedTarget,
                                readerMode,
                                setIsGeneratingImage,
                                setIsSaving,
                                moduleType,
                                setBuildings,
                                setBuildingToEdit
                            )
                        }
                    }}
                    canRegenerate={!!editedTarget.description}
                    isGeneratingImage={isGeneratingImage}
                />
            </Grid>
        </>
    )
}

export default FormBuilding
