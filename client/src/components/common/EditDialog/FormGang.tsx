import { Box, FormControl, Grid, InputLabel, MenuItem, Select, SxProps, TextField } from '@mui/material'
import { Dispatch, SetStateAction, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../../contexts/ReaderModeContext'
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
import ImageField from './ImageField'

export type FormGangProps = {
    editedItem: Gang
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
    toggleFullscreenImage: () => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
    hiddenFileInput: JSX.Element
}

export const FormGang = (props: FormGangProps) => {
    const {
        editedItem,
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
                    label={t('gangs.labels.name')}
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
                    value={editedItem.description}
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
                        if (setIsGeneratingImage && setGangs) {
                            handleRegenerateImage(
                                editedItem,
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
                    canRegenerate={!!editedItem.description}
                    isGeneratingImage={isGeneratingImage}
                    readerMode={readerMode}
                />
            </Grid>
            {/* Type */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel id="type-label" sx={inputLabelStyle}>
                        {t('gangs.labels.type')}
                    </InputLabel>
                    <Select
                        labelId="type-label"
                        value={editedItem.type || ''}
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
                </FormControl>
            </Grid>
            {/* Cyberware Quality */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.cyberwareQuality')}</InputLabel>
                    <Select
                        value={editedItem.cyberwareQuality || ''}
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
                </FormControl>
            </Grid>
            {/* Skill */}
            <Grid item xs={12} md={1.5}>
                <TextField
                    fullWidth
                    label={t('gangs.labels.skill')}
                    type="tel"
                    value={editedItem.skill || 0}
                    onChange={(e) => handleChange('skill', parseInt(e.target.value, 10) || 0)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Weapons D6*/}
            <Grid item xs={12} md={1.5}>
                <TextField
                    fullWidth
                    label={t('gangs.labels.weapons.spb', 'Weapons D6')}
                    type="tel"
                    value={editedItem.weapons?.d6 || 0}
                    onChange={(e) =>
                        handleChange('weapons', {
                            ...editedItem.weapons,
                            d6: parseInt(e.target.value, 10) || 0,
                        })
                    }
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Armor SPB */}
            <Grid item xs={12} md={1.5}>
                <TextField
                    fullWidth
                    label={t('gangs.labels.armor.spb', 'Armor SPB')}
                    type="tel"
                    value={editedItem.armor?.spb || 0}
                    onChange={(e) =>
                        handleChange('armor', {
                            ...editedItem.armor,
                            spb: parseInt(e.target.value, 10) || 0,
                        })
                    }
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Armor H */}
            <Grid item xs={12} md={1.5}>
                <TextField
                    fullWidth
                    label={t('gangs.labels.armor.h', 'Armor H')}
                    type="tel"
                    value={editedItem.armor?.h || 0}
                    onChange={(e) =>
                        handleChange('armor', {
                            ...editedItem.armor,
                            h: parseInt(e.target.value, 10) || 0,
                        })
                    }
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Secretive */}
            <Grid item xs={12} md={1.5}>
                <TextField
                    fullWidth
                    label={t('gangs.labels.secretive')}
                    type="tel"
                    value={editedItem.secretive || 0}
                    onChange={(e) => handleChange('secretive', parseInt(e.target.value, 10) || 0)}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                />
            </Grid>
            {/* Status */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.status')}</InputLabel>
                    <Select
                        value={editedItem.status || ''}
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
                </FormControl>
            </Grid>
            {/* Color */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.color')}</InputLabel>
                    <Select
                        labelId="color-label"
                        value={editedItem.color || ''}
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
                </FormControl>
            </Grid>
            {/* Sin */}
            <Grid item xs={12} md={1.5}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.sin')}</InputLabel>
                    <Select
                        value={editedItem.sin || ''}
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
                </FormControl>
            </Grid>
            {/* Known For Part 1 */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.knownForPart1', 'Known For Part 1')}</InputLabel>
                    <Select
                        value={editedItem.knownFor?.knownForPart1 || ''}
                        onChange={(e) =>
                            handleChange('knownFor', {
                                ...editedItem.knownFor,
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
                </FormControl>
            </Grid>
            {/* Known For Part 2 */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.knownForPart2', 'Known For Part 2')}</InputLabel>
                    <Select
                        value={editedItem.knownFor?.knownForPart2 || ''}
                        onChange={(e) =>
                            handleChange('knownFor', {
                                ...editedItem.knownFor,
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
                </FormControl>
            </Grid>
            {/* Flaw */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.flaw')}</InputLabel>
                    <Select
                        value={editedItem.flaw || ''}
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
                </FormControl>
            </Grid>
            {/* Current Attitude */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.currentAttitude')}</InputLabel>
                    <Select
                        value={editedItem.currentAttitude || ''}
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
                </FormControl>
            </Grid>
            {/* News The Leader Is Receiving */}
            <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('gangs.labels.newsTheLeaderIsReceiving')}</InputLabel>
                    <Select
                        value={editedItem.newsTheLeaderIsReceiving || ''}
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
                </FormControl>
            </Grid>
        </>
    )
}

export default FormGang
