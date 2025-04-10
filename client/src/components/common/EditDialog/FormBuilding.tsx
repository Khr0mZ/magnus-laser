import { FormControl, Grid, InputLabel, MenuItem, Select, SxProps, TextField } from '@mui/material'
import { Dispatch, SetStateAction, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../../contexts/ReaderModeContext'
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
    editedItem: Building
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
    toggleFullscreenImage: () => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element
}

export const FormBuilding = (props: FormBuildingProps) => {
    const {
        editedItem,
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
    const { readerMode } = useContext(ReaderModeContext)
    return (
        <>
            {hiddenFileInput}
            {/* Name */}
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('buildings.labels.name')}
                    value={editedItem.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Description */}
            <Grid item xs={12} md={8}>
                <TextField
                    fullWidth
                    label={t('common.description')}
                    value={editedItem.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    multiline
                />
            </Grid>
            {/* Image */}
            <Grid item xs={12} md={4}>
                <ImageField
                    image={editedItem.image}
                    name={editedItem.name}
                    handleImageUploadClick={handleImageUploadClick}
                    handleImageRemove={openDeleteImageDialog}
                    toggleFullscreenImage={toggleFullscreenImage}
                    handleRegenerateClick={() => {
                        if (setIsGeneratingImage && setBuildings) {
                            handleRegenerateImage(
                                editedItem,
                                readerMode,
                                setIsGeneratingImage,
                                setIsSaving,
                                moduleType,
                                setBuildings,
                                setBuildingToEdit
                            )
                        }
                    }}
                    canRegenerate={!!editedItem.description}
                    isGeneratingImage={isGeneratingImage}
                    readerMode={readerMode}
                />
            </Grid>
            {/* Type */}
            <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="type-label" sx={inputLabelStyle}>
                        {t('buildings.labels.type')}
                    </InputLabel>
                    <Select
                        labelId="type-label"
                        value={editedItem.type || ''}
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
            </Grid>
            {/* BuildingStyle */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.style')}</InputLabel>
                    <Select
                        value={editedItem.style || ''}
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
            </Grid>
            {/* BuildingOwnership */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.ownership')}</InputLabel>
                    <Select
                        value={editedItem.ownership || ''}
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
            </Grid>
            {/* Is Abandoned */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.isAbandoned')}</InputLabel>
                    <Select
                        value={editedItem.isAbandoned ? 'yes' : 'no'}
                        onChange={(e) => handleChange('isAbandoned', e.target.value === 'yes')}
                        label={t('buildings.labels.isAbandoned')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* Elevators */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.elevators')}</InputLabel>
                    <Select
                        value={editedItem.elevators ? 'yes' : 'no'}
                        onChange={(e) => handleChange('elevators', e.target.value === 'yes')}
                        label={t('buildings.labels.elevators')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* Parking */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.parking')}</InputLabel>
                    <Select
                        value={editedItem.parking ? 'yes' : 'no'}
                        onChange={(e) => handleChange('parking', e.target.value === 'yes')}
                        label={t('buildings.labels.parking')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* Gatehouse / Front Desk */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.gatehouseFrontDesk')}</InputLabel>
                    <Select
                        value={editedItem.gatehouseFrontDesk ? 'yes' : 'no'}
                        onChange={(e) => handleChange('gatehouseFrontDesk', e.target.value === 'yes')}
                        label={t('buildings.labels.gatehouseFrontDesk')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* Emergency Exit */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.emergencyExit')}</InputLabel>
                    <Select
                        value={editedItem.emergencyExit ? 'yes' : 'no'}
                        onChange={(e) => handleChange('emergencyExit', e.target.value === 'yes')}
                        label={t('buildings.labels.emergencyExit')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* Backup Lights */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.backupLights')}</InputLabel>
                    <Select
                        value={editedItem.backupLights ? 'yes' : 'no'}
                        onChange={(e) => handleChange('backupLights', e.target.value === 'yes')}
                        label={t('buildings.labels.backupLights')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* Landing Pad */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.landingPad')}</InputLabel>
                    <Select
                        value={editedItem.landingPad ? 'yes' : 'no'}
                        onChange={(e) => handleChange('landingPad', e.target.value === 'yes')}
                        label={t('buildings.labels.landingPad')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {/* BuildingSecret / Alt Entrance */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.secretOrAltEntrance')}</InputLabel>
                    <Select
                        value={editedItem.secretOrAltEntrance ? 'yes' : 'no'}
                        onChange={(e) => handleChange('secretOrAltEntrance', e.target.value === 'yes')}
                        label={t('buildings.labels.secretOrAltEntrance')}
                        sx={selectStyle}
                    >
                        <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                        <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            {/* Security Personnel */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.securityPersonnel')}</InputLabel>
                    <Select
                        value={editedItem.securityPersonnel || ''}
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
            </Grid>

            {/* BuildingEvent */}
            <Grid item xs={12} md={5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.event')}</InputLabel>
                    <Select
                        value={editedItem.event || ''}
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
            </Grid>
            {/* BuildingSecret */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('buildings.labels.secret')}</InputLabel>
                    <Select
                        value={editedItem.secret || ''}
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
            </Grid>
        </>
    )
}

export default FormBuilding
