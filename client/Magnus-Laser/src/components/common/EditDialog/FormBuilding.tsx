import { Grid, MenuItem, Select, Stack, SxProps, TextField } from '@mui/material'
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
import CyberpunkFormControl from '../../CyberpunkFormControl'
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
    selectStyle: SxProps
    hiddenFileInput: React.JSX.Element
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
        selectStyle,
        hiddenFileInput,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    return (
        <>
            {hiddenFileInput}
            {/* Name */}
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid container size={{ xs: 12, md: 8 }}>
                <Stack spacing={2} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Type */}
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('buildings.labels.type')}
                            labelId="type-label"
                        >
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
                        </CyberpunkFormControl>
                        {/* BuildingStyle */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.style')}>
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
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Is Abandoned */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.isAbandoned')}>
                            <Select
                                value={editedTarget.isAbandoned ? 'yes' : 'no'}
                                onChange={(e) => handleChange('isAbandoned', e.target.value === 'yes')}
                                label={t('buildings.labels.isAbandoned')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                        {/* Elevators */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.elevators')}>
                            <Select
                                value={editedTarget.elevators ? 'yes' : 'no'}
                                onChange={(e) => handleChange('elevators', e.target.value === 'yes')}
                                label={t('buildings.labels.elevators')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                        {/* Parking */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.parking')}>
                            <Select
                                value={editedTarget.parking ? 'yes' : 'no'}
                                onChange={(e) => handleChange('parking', e.target.value === 'yes')}
                                label={t('buildings.labels.parking')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                        {/* Gatehouse / Front Desk */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.gatehouseFrontDesk')}>
                            <Select
                                value={editedTarget.gatehouseFrontDesk ? 'yes' : 'no'}
                                onChange={(e) => handleChange('gatehouseFrontDesk', e.target.value === 'yes')}
                                label={t('buildings.labels.gatehouseFrontDesk')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Emergency Exit */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.emergencyExit')}>
                            <Select
                                value={editedTarget.emergencyExit ? 'yes' : 'no'}
                                onChange={(e) => handleChange('emergencyExit', e.target.value === 'yes')}
                                label={t('buildings.labels.emergencyExit')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                        {/* Backup Lights */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.backupLights')}>
                            <Select
                                value={editedTarget.backupLights ? 'yes' : 'no'}
                                onChange={(e) => handleChange('backupLights', e.target.value === 'yes')}
                                label={t('buildings.labels.backupLights')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                        {/* Landing Pad */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.landingPad')}>
                            <Select
                                value={editedTarget.landingPad ? 'yes' : 'no'}
                                onChange={(e) => handleChange('landingPad', e.target.value === 'yes')}
                                label={t('buildings.labels.landingPad')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                        {/* BuildingSecret / Alt Entrance */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.secretOrAltEntrance')}>
                            <Select
                                value={editedTarget.secretOrAltEntrance ? 'yes' : 'no'}
                                onChange={(e) => handleChange('secretOrAltEntrance', e.target.value === 'yes')}
                                label={t('buildings.labels.secretOrAltEntrance')}
                                sx={selectStyle}
                            >
                                <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                                <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                            </Select>
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Security Personnel */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.securityPersonnel')}>
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
                        </CyberpunkFormControl>
                        {/* BuildingOwnership */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.ownership')}>
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
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* BuildingEvent */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.event')}>
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
                        </CyberpunkFormControl>
                        {/* BuildingSecret */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('buildings.labels.secret')}>
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
                        </CyberpunkFormControl>
                    </Stack>
                </Stack>
            </Grid>
            {/* Image */}
            <Grid size={{ xs: 12, md: 4 }}>
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
