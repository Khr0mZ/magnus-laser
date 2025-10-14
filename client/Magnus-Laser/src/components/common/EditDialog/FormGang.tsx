import { Box, Grid, MenuItem, Select, Stack, SxProps, TextField } from '@mui/material'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import {
    Attitude,
    CyberwareQuality,
    Flaw,
    Gang,
    GangColor,
    GangNews,
    GangStatus,
    GangType,
    KnownForPart1,
    KnownForPart2,
    Sin,
} from '../../../graphql/types'
import { handleRegenerateImage } from '../../../utils/apiUtils'
import { ModuleTypes } from '../../../utils/constants'
import { getGangColorValue } from '../../../utils/functions'
import CyberpunkFormControl from '../../CyberpunkFormControl'
import ImageField from './ImageField'

export type FormGangProps = {
    editedTarget: Gang
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setGangs?: Dispatch<SetStateAction<Gang[]>>
    setGangToEdit?: Dispatch<SetStateAction<Gang | null>>
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    handleImageUploadClick: () => void
    openDeleteImageDialog: () => void
    toggleFullscreenImage: (image: string) => void
    selectStyle: SxProps
    hiddenFileInput: React.JSX.Element
}

export const FormGang = (props: FormGangProps) => {
    const {
        editedTarget,
        moduleType,
        setIsSaving,
        isGeneratingImage,
        setGangToEdit,
        setGangs,
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
                    label={t('gangs.labels.name')}
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
                    value={editedTarget.description}
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
                            label={t('gangs.labels.type')}
                            labelId="type-label"
                        >
                            <Select
                                labelId="type-label"
                                value={editedTarget.type || ''}
                                onChange={(e) => handleChange('type', e.target.value)}
                                label={t('gangs.labels.type')}
                                sx={selectStyle}
                            >
                                {Object.values(GangType).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.type.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        {/* Cyberware Quality */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('gangs.labels.cyberwareQuality')}>
                            <Select
                                value={editedTarget.cyberwareQuality || ''}
                                onChange={(e) => handleChange('cyberwareQuality', e.target.value)}
                                label={t('gangs.labels.cyberwareQuality')}
                                sx={selectStyle}
                            >
                                {Object.values(CyberwareQuality).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.cyberwareQuality.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        {/* Sin */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('gangs.labels.sin')}>
                            <Select
                                value={editedTarget.sin || ''}
                                onChange={(e) => handleChange('sin', e.target.value)}
                                label={t('gangs.labels.sin')}
                                sx={selectStyle}
                            >
                                {Object.values(Sin).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.sin.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Skill */}
                        <TextField
                            fullWidth
                            label={t('gangs.labels.skill')}
                            type="tel"
                            value={editedTarget.skill || 0}
                            onChange={(e) => handleChange('skill', parseInt(e.target.value, 10) || 0)}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        {/* Weapons D6*/}
                        <TextField
                            fullWidth
                            label={t('gangs.labels.weapons.spb', 'Weapons D6')}
                            type="tel"
                            value={editedTarget.weapons?.d6 || 0}
                            onChange={(e) =>
                                handleChange('weapons', {
                                    ...editedTarget.weapons,
                                    d6: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        {/* Armor SPB */}
                        <TextField
                            fullWidth
                            label={t('gangs.labels.armor.spb', 'Armor SPB')}
                            type="tel"
                            value={editedTarget.armor?.spb || 0}
                            onChange={(e) =>
                                handleChange('armor', {
                                    ...editedTarget.armor,
                                    spb: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        {/* Armor H */}
                        <TextField
                            fullWidth
                            label={t('gangs.labels.armor.h', 'Armor H')}
                            type="tel"
                            value={editedTarget.armor?.h || 0}
                            onChange={(e) =>
                                handleChange('armor', {
                                    ...editedTarget.armor,
                                    h: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                        {/* Secretive */}
                        <TextField
                            fullWidth
                            label={t('gangs.labels.secretive')}
                            type="tel"
                            value={editedTarget.secretive || 0}
                            onChange={(e) => handleChange('secretive', parseInt(e.target.value, 10) || 0)}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                        />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Color */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('gangs.labels.color')}>
                            <Select
                                labelId="color-label"
                                value={editedTarget.color || ''}
                                onChange={(e) => handleChange('color', e.target.value)}
                                label={t('gangs.labels.color')}
                                sx={selectStyle}
                            >
                                {Object.values(GangColor).map((color) => (
                                    <MenuItem key={color} value={color}>
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                width: '16px',
                                                height: '16px',
                                                backgroundColor: getGangColorValue(color as GangColor),
                                                borderRadius: '2px',
                                                marginRight: '8px',
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                        {t(`gangs.color.${color}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        {/* Known For Part 1 */}
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('gangs.labels.knownForPart1', 'Known For Part 1')}
                        >
                            <Select
                                value={editedTarget.knownFor?.knownForPart1 || ''}
                                onChange={(e) =>
                                    handleChange('knownFor', {
                                        ...editedTarget.knownFor,
                                        knownForPart1: e.target.value,
                                    })
                                }
                                label={t('gangs.labels.knownForPart1', 'Known For Part 1')}
                                sx={selectStyle}
                            >
                                {Object.values(KnownForPart1).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.knownForPart1.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        {/* Known For Part 2 */}
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('gangs.labels.knownForPart2', 'Known For Part 2')}
                        >
                            <Select
                                value={editedTarget.knownFor?.knownForPart2 || ''}
                                onChange={(e) =>
                                    handleChange('knownFor', {
                                        ...editedTarget.knownFor,
                                        knownForPart2: e.target.value,
                                    })
                                }
                                label={t('gangs.labels.knownForPart2', 'Known For Part 2')}
                                sx={selectStyle}
                            >
                                {Object.values(KnownForPart2).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.knownForPart2.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Status */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('gangs.labels.status')}>
                            <Select
                                value={editedTarget.status || ''}
                                onChange={(e) => handleChange('status', e.target.value)}
                                label={t('gangs.labels.status')}
                                sx={selectStyle}
                            >
                                {Object.values(GangStatus).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.status.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>

                        {/* Flaw */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('gangs.labels.flaw')}>
                            <Select
                                value={editedTarget.flaw || ''}
                                onChange={(e) => handleChange('flaw', e.target.value)}
                                label={t('gangs.labels.flaw')}
                                sx={selectStyle}
                            >
                                {Object.values(Flaw).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.flaw.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Current Attitude */}
                        <CyberpunkFormControl readerMode={readerMode} label={t('gangs.labels.currentAttitude')}>
                            <Select
                                value={editedTarget.currentAttitude || ''}
                                onChange={(e) => handleChange('currentAttitude', e.target.value)}
                                label={t('gangs.labels.currentAttitude')}
                                sx={selectStyle}
                            >
                                {Object.values(Attitude).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.attitude.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </CyberpunkFormControl>
                        {/* News The Leader Is Receiving */}
                        <CyberpunkFormControl
                            readerMode={readerMode}
                            label={t('gangs.labels.newsTheLeaderIsReceiving')}
                        >
                            <Select
                                value={editedTarget.newsTheLeaderIsReceiving || ''}
                                onChange={(e) => handleChange('newsTheLeaderIsReceiving', e.target.value)}
                                label={t('gangs.labels.newsTheLeaderIsReceiving')}
                                sx={selectStyle}
                            >
                                {Object.values(GangNews).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`gangs.news.${value}`)}
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
                        if (setIsGeneratingImage && setGangs) {
                            handleRegenerateImage(
                                editedTarget,
                                readerMode,
                                setIsGeneratingImage,
                                setIsSaving,
                                moduleType,
                                undefined,
                                undefined,
                                setGangs,
                                setGangToEdit
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

export default FormGang
