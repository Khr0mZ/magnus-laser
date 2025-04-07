import AutorenewIcon from '@mui/icons-material/Autorenew'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomScrollbar from '../../components/CustomScrollbar'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import {
    Attitude,
    Building,
    BuildingType,
    CyberwareQuality,
    Event,
    Flaw,
    Gang,
    GangColor,
    GangNews,
    GangStatus,
    GangType,
    KnownForPart1,
    KnownForPart2,
    Ownership,
    Secret,
    SecurityPersonnel,
    Sin,
    Style,
} from '../../graphql/types'
import { handleRegenerateImage } from '../../utils/apiUtils'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { getGangColorValue } from '../../utils/functions'
import { buttonGlitch, flicker, glitch, pulseGlowBlue, pulseGlowCyan } from './Animations'
import TiptapEditor from './TiptapEditor'
import { WarningDialog } from './WarningDialog'

type EditDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (item: Gang | Building) => void
    item: Gang | Building | null
    moduleType: ModuleTypes
    setIsSaving: (isSaving: boolean) => void
    isGeneratingImage?: boolean
    setIsGeneratingImage?: (isGenerating: boolean) => void
    setBuildings?: Dispatch<SetStateAction<Building[]>>
    setBuildingToEdit?: Dispatch<SetStateAction<Building | null>>
    setGangs?: Dispatch<SetStateAction<Gang[]>>
    setGangToEdit?: Dispatch<SetStateAction<Gang | null>>
}

export const EditDialog = (props: EditDialogProps) => {
    const {
        open,
        onClose,
        onSave,
        item,
        moduleType,
        setIsGeneratingImage,
        setIsSaving,
        isGeneratingImage,
        setBuildings,
        setBuildingToEdit,
        setGangs,
        setGangToEdit,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    const [editedItem, setEditedItem] = useState<Gang | Building | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false)
    const [fullscreenImage, setFullscreenImage] = useState(false)

    // Moved function definition before usage to fix linter error
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                handleChange('image', reader.result as string)
            }
            reader.readAsDataURL(file)
        }
        // Reset file input value so the same file can be selected again
        if (event.target) {
            event.target.value = ''
        }
    }

    // Reusable Select style
    const selectStyle = {
        color: readerMode ? '#333' : '#fff',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
        },
        '& .MuiSvgIcon-root': {
            color: readerMode ? 'rgba(0, 0, 0, 0.54)' : '#fff',
        },
    }

    // Reusable FormControl style with hover animations for InputLabels
    const formControlStyle = {
        '&:hover .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
        '& .MuiInputBase-root.Mui-focused + .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
    }

    // InputLabel style
    const inputLabelStyle = {
        color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
        borderRadius: '4px',
        bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
        p: 0.5,
        py: 0.25,
        border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
    }

    // Reusable TextField styles
    const textFieldOutlinedStyle = {
        '& .MuiOutlinedInput-root': {
            color: readerMode ? '#333' : '#fff',
            '& fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
            },
        },
        '& .MuiInputLabel-root': {
            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
            borderRadius: '4px',
            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
            p: 0.5,
            py: 0.25,
            border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
        },
        '&:hover .MuiInputLabel-root': {
            animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
        },
    }

    // Hidden file input element (moved down)
    const hiddenFileInput = (
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            accept="image/*"
        />
    )

    useEffect(() => {
        if (item) {
            setEditedItem({ ...item })
        }
    }, [item])

    const handleChange = (field: string, value: unknown) => {
        setEditedItem((prev) => {
            if (!prev) return prev

            // Handle value conversion based on field type
            const processedValue = value

            return {
                ...prev,
                [field]: processedValue,
            }
        })
    }

    const handleSave = () => {
        if (editedItem) {
            onSave(editedItem)
        }
        onClose()
    }

    // --- Image Handlers ---

    const handleImageUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleImageRemove = () => {
        handleChange('image', null) // Or set to a default placeholder URL if needed
    }

    const openDeleteImageDialog = () => {
        setDeleteImageDialogOpen(true)
    }

    // Add a handler to toggle fullscreen image
    const toggleFullscreenImage = () => {
        setFullscreenImage(!fullscreenImage)
    }

    if (!editedItem) return null

    const renderGangFields = () => {
        const gangItem = editedItem as Gang
        return (
            <>
                {/* Name */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label={t('gangs.labels.name')}
                        value={gangItem.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        variant="outlined"
                        sx={textFieldOutlinedStyle}
                    />
                </Grid>
                {/* Description */}
                <Grid item xs={12} md={8}>
                    <TiptapEditor
                        label={t('common.description')}
                        value={gangItem.description || ''}
                        onChange={(content) => handleChange('description', content)}
                    />
                </Grid>
                {/* Image */}
                <Grid item xs={12} md={4}>
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            boxSizing: 'border-box',
                            aspectRatio: '1 / 1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0, 0, 0, 0.5)',
                            border: `2px solid ${readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'}`,
                            cursor: editedItem.image ? 'pointer' : 'default',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.01)',
                                boxShadow: readerMode
                                    ? `0 0 15px ${colors.neons.blue.default}80`
                                    : `0 0 15px ${colors.neons.cyan.default}80`,
                                border: readerMode
                                    ? `2px solid ${colors.neons.blue.default}`
                                    : `2px solid ${colors.neons.cyan.default}`,
                            },
                            p: 0.5,
                            borderRadius: '4px',
                        }}
                    >
                        {hiddenFileInput}
                        <Avatar
                            src={editedItem.image}
                            alt={t('common.itemImageAlt', { name: (editedItem as Gang).name })}
                            variant="rounded"
                            sx={{
                                bgcolor: 'transparent',
                                color: 'transparent',
                                objectFit: 'contain',
                                width: '100%',
                                height: 'auto',
                            }}
                            onClick={editedItem.image ? toggleFullscreenImage : undefined}
                        />
                        {!editedItem.image && (
                            <Typography
                                variant={'caption'}
                                sx={{
                                    fontSize: { xs: '64px', sm: '80px', md: '48px', lg: '64px' },
                                    textAlign: 'center',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    transition: 'all 0.3s',
                                    textTransform: 'uppercase',
                                    ...(readerMode
                                        ? {}
                                        : {
                                              fontFamily: '"Courier New", monospace',
                                              letterSpacing: '1px',

                                              color: colors.neons.cyan.default,
                                              textShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                              '&::before': {
                                                  content: 'attr(data-text)',
                                                  position: 'absolute',
                                                  left: -2,
                                                  top: 0,
                                                  color: colors.neons.pink.default,
                                                  opacity: 0.8,
                                                  animation: `${glitch} 2s ease-out infinite alternate-reverse`,
                                              },
                                              '&::after': {
                                                  content: 'attr(data-text)',
                                                  position: 'absolute',
                                                  left: 2,
                                                  top: 0,
                                                  color: colors.neons.green.default,
                                                  opacity: 0.8,
                                                  animation: `${glitch} 3s ease-in infinite alternate`,
                                              },
                                          }),
                                }}
                                data-text={t('common.noImageFound')}
                            >
                                {t('common.noImageFound')}
                            </Typography>
                        )}
                        {isGeneratingImage && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                }}
                            >
                                <CircularProgress
                                    sx={{
                                        color: readerMode ? '#0288d1' : colors.neons.cyan.default,
                                    }}
                                />
                            </Box>
                        )}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                p: 0.5,
                                backgroundColor: readerMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(3px)',
                                borderRadius: '0 0 0 8px',
                                border: readerMode
                                    ? '1px solid rgba(0, 0, 0, 0.1)'
                                    : `1px solid ${colors.neons.cyan.default}30`,
                                boxShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.cyan.default}30`,
                            }}
                        >
                            <IconButton
                                size="small"
                                onClick={handleImageUploadClick}
                                title={t('common.uploadImage', 'Upload Image')}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 0, 40, 0.4)',
                                    color: readerMode ? '#1976d2' : colors.neons.blue.default,
                                    border: readerMode
                                        ? '1px solid #1976d2'
                                        : `1px solid ${colors.neons.blue.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#0d47a1',
                                          }
                                        : {
                                              bgcolor: 'rgba(0, 0, 60, 0.6)',
                                              color: colors.neons.blue.light,
                                              boxShadow: `0 0 8px ${colors.neons.blue.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                              '& .icon-content': {
                                                  animation: `${glitch} 2s infinite`,
                                                  filter: `drop-shadow(0 0 3px ${colors.neons.blue.default})`,
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.blue.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                }}
                            >
                                <FolderOpenIcon
                                    className="icon-content"
                                    sx={{
                                        color: readerMode ? '#1976d2' : colors.neons.blue.default,
                                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.blue.default}`,
                                        zIndex: 2,
                                        fontSize: '16px',
                                    }}
                                    fontSize="small"
                                />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={openDeleteImageDialog}
                                title={t('common.removeImage', 'Remove Image')}
                                disabled={!editedItem.image}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                    color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                    border: readerMode
                                        ? '1px solid #d32f2f'
                                        : `1px solid ${colors.neons.red.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#b71c1c',
                                          }
                                        : {
                                              bgcolor: 'rgba(60, 0, 0, 0.6)',
                                              color: colors.neons.red.light,
                                              boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                              '& .delete-icon': {
                                                  animation: `${buttonGlitch} 2s infinite`,
                                                  filter: `drop-shadow(0 0 3px ${colors.neons.red.default})`,
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                    '&.Mui-disabled': {
                                        color: 'grey',
                                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                        border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                                    },
                                }}
                            >
                                <Typography
                                    className="delete-icon"
                                    variant="body2"
                                    sx={{
                                        color: !editedItem.image
                                            ? 'grey'
                                            : readerMode
                                            ? '#d32f2f'
                                            : colors.neons.red.default,
                                        textShadow: !editedItem.image
                                            ? 'none'
                                            : readerMode
                                            ? 'none'
                                            : `0 0 5px ${colors.neons.red.default}`,
                                        zIndex: 2,
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        lineHeight: 1,
                                    }}
                                >
                                    ✕
                                </Typography>
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => {
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
                                title={t('common.regenerateImage', 'Regenerate Image')}
                                disabled={!editedItem.description}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 40, 0, 0.4)',
                                    color: readerMode ? '#2e7d32' : colors.neons.green.default,
                                    border: readerMode
                                        ? '1px solid #2e7d32'
                                        : `1px solid ${colors.neons.green.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.green.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#1b5e20',
                                          }
                                        : {
                                              bgcolor: 'rgba(0, 60, 0, 0.6)',
                                              color: colors.neons.green.light,
                                              boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                              '& .icon-content': {
                                                  animation: `${flicker} 2s infinite`,
                                                  filter: `drop-shadow(0 0 3px ${colors.neons.green.default})`,
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.green.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                    '&.Mui-disabled': {
                                        color: 'grey',
                                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                        border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                                    },
                                }}
                            >
                                <AutorenewIcon
                                    className="icon-content"
                                    sx={{
                                        color: !editedItem.description
                                            ? 'grey'
                                            : readerMode
                                            ? '#2e7d32'
                                            : colors.neons.green.default,
                                        textShadow: !editedItem.description
                                            ? 'none'
                                            : readerMode
                                            ? 'none'
                                            : `0 0 5px ${colors.neons.green.default}`,
                                        zIndex: 2,
                                        fontSize: '16px',
                                    }}
                                    fontSize="small"
                                />
                            </IconButton>
                        </Box>
                    </Box>
                </Grid>
                {/* Type */}
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel id="type-label" sx={inputLabelStyle}>
                            {t('gangs.labels.type')}
                        </InputLabel>
                        <Select
                            labelId="type-label"
                            value={gangItem.type || ''}
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
                            value={gangItem.cyberwareQuality || ''}
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
                        value={gangItem.skill || 0}
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
                        value={gangItem.weapons?.d6 || 0}
                        onChange={(e) =>
                            handleChange('weapons', {
                                ...gangItem.weapons,
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
                        value={gangItem.armor?.spb || 0}
                        onChange={(e) =>
                            handleChange('armor', {
                                ...gangItem.armor,
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
                        value={gangItem.armor?.h || 0}
                        onChange={(e) =>
                            handleChange('armor', {
                                ...gangItem.armor,
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
                        value={gangItem.secretive || 0}
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
                            value={gangItem.status || ''}
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
                            value={gangItem.color || ''}
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
                            value={gangItem.sin || ''}
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
                        <InputLabel sx={inputLabelStyle}>
                            {t('gangs.labels.knownForPart1', 'Known For Part 1')}
                        </InputLabel>
                        <Select
                            value={gangItem.knownFor?.knownForPart1 || ''}
                            onChange={(e) =>
                                handleChange('knownFor', {
                                    ...gangItem.knownFor,
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
                        <InputLabel sx={inputLabelStyle}>
                            {t('gangs.labels.knownForPart2', 'Known For Part 2')}
                        </InputLabel>
                        <Select
                            value={gangItem.knownFor?.knownForPart2 || ''}
                            onChange={(e) =>
                                handleChange('knownFor', {
                                    ...gangItem.knownFor,
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
                            value={gangItem.flaw || ''}
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
                            value={gangItem.currentAttitude || ''}
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
                            value={gangItem.newsTheLeaderIsReceiving || ''}
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

    const renderBuildingFields = () => {
        const buildingItem = editedItem as Building
        return (
            <>
                {/* Name */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label={t('buildings.labels.name')}
                        value={buildingItem.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        variant="outlined"
                        sx={textFieldOutlinedStyle}
                    />
                </Grid>
                {/* Description */}
                <Grid item xs={12} md={8}>
                    <TiptapEditor
                        label={t('common.description')}
                        value={buildingItem.description || ''}
                        onChange={(content) => handleChange('description', content)}
                    />
                </Grid>
                {/* Image */}
                <Grid item xs={12} md={4}>
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            boxSizing: 'border-box',
                            aspectRatio: '1 / 1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0, 0, 0, 0.5)',
                            border: `2px solid ${readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'}`,
                            cursor: editedItem.image ? 'pointer' : 'default',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.01)',
                                boxShadow: readerMode
                                    ? `0 0 15px ${colors.neons.blue.default}80`
                                    : `0 0 15px ${colors.neons.cyan.default}80`,
                                border: readerMode
                                    ? `2px solid ${colors.neons.blue.default}`
                                    : `2px solid ${colors.neons.cyan.default}`,
                            },
                            p: 0.5,
                            borderRadius: '4px',
                        }}
                    >
                        {hiddenFileInput}
                        <Avatar
                            src={editedItem.image}
                            alt={t('common.itemImageAlt', { name: (editedItem as Building).name })}
                            variant="rounded"
                            sx={{
                                bgcolor: 'transparent',
                                color: 'transparent',
                                objectFit: 'contain',
                                width: '100%',
                                height: 'auto',
                            }}
                            onClick={editedItem.image ? toggleFullscreenImage : undefined}
                        />
                        {!editedItem.image && (
                            <Typography
                                variant={'caption'}
                                sx={{
                                    fontSize: { xs: '64px', sm: '80px', md: '48px', lg: '64px' },
                                    textAlign: 'center',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    transition: 'all 0.3s',
                                    textTransform: 'uppercase',
                                    ...(readerMode
                                        ? {}
                                        : {
                                              fontFamily: '"Courier New", monospace',
                                              letterSpacing: '1px',

                                              color: colors.neons.cyan.default,
                                              textShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                              '&::before': {
                                                  content: 'attr(data-text)',
                                                  position: 'absolute',
                                                  left: -2,
                                                  top: 0,
                                                  color: colors.neons.pink.default,
                                                  opacity: 0.8,
                                                  animation: `${glitch} 2s ease-out infinite alternate-reverse`,
                                              },
                                              '&::after': {
                                                  content: 'attr(data-text)',
                                                  position: 'absolute',
                                                  left: 2,
                                                  top: 0,
                                                  color: colors.neons.green.default,
                                                  opacity: 0.8,
                                                  animation: `${glitch} 3s ease-in infinite alternate`,
                                              },
                                          }),
                                }}
                                data-text={'NO IMAGE FOUND'}
                            >
                                {'NO IMAGE FOUND'}
                            </Typography>
                        )}
                        {isGeneratingImage && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                }}
                            >
                                <CircularProgress
                                    sx={{
                                        color: readerMode ? '#0288d1' : colors.neons.cyan.default,
                                    }}
                                />
                            </Box>
                        )}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                p: 0.5,
                                backgroundColor: readerMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(3px)',
                                borderRadius: '0 0 0 8px',
                                border: readerMode
                                    ? '1px solid rgba(0, 0, 0, 0.1)'
                                    : `1px solid ${colors.neons.cyan.default}30`,
                                boxShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.cyan.default}30`,
                            }}
                        >
                            <IconButton
                                size="small"
                                onClick={handleImageUploadClick}
                                title={t('common.uploadImage', 'Upload Image')}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 0, 40, 0.4)',
                                    color: readerMode ? '#1976d2' : colors.neons.blue.default,
                                    border: readerMode
                                        ? '1px solid #1976d2'
                                        : `1px solid ${colors.neons.blue.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#0d47a1',
                                          }
                                        : {
                                              bgcolor: 'rgba(0, 0, 60, 0.6)',
                                              color: colors.neons.blue.light,
                                              boxShadow: `0 0 8px ${colors.neons.blue.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                              '& .icon-content': {
                                                  animation: `${glitch} 2s infinite`,
                                                  filter: `drop-shadow(0 0 3px ${colors.neons.blue.default})`,
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.blue.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                }}
                            >
                                <FolderOpenIcon
                                    className="icon-content"
                                    sx={{
                                        color: readerMode ? '#1976d2' : colors.neons.blue.default,
                                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.blue.default}`,
                                        zIndex: 2,
                                        fontSize: '16px',
                                    }}
                                    fontSize="small"
                                />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={openDeleteImageDialog}
                                title={t('common.removeImage', 'Remove Image')}
                                disabled={!editedItem.image}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                    color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                    border: readerMode
                                        ? '1px solid #d32f2f'
                                        : `1px solid ${colors.neons.red.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#b71c1c',
                                          }
                                        : {
                                              bgcolor: 'rgba(60, 0, 0, 0.6)',
                                              color: colors.neons.red.light,
                                              boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                              '& .delete-icon': {
                                                  animation: `${buttonGlitch} 2s infinite`,
                                                  filter: `drop-shadow(0 0 3px ${colors.neons.red.default})`,
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                    '&.Mui-disabled': {
                                        color: 'grey',
                                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                        border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                                    },
                                }}
                            >
                                <Typography
                                    className="delete-icon"
                                    variant="body2"
                                    sx={{
                                        color: !editedItem.image
                                            ? 'grey'
                                            : readerMode
                                            ? '#d32f2f'
                                            : colors.neons.red.default,
                                        textShadow: !editedItem.image
                                            ? 'none'
                                            : readerMode
                                            ? 'none'
                                            : `0 0 5px ${colors.neons.red.default}`,
                                        zIndex: 2,
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        lineHeight: 1,
                                    }}
                                >
                                    ✕
                                </Typography>
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => {
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
                                title={t('common.regenerateImage', 'Regenerate Image')}
                                disabled={!editedItem.description}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 40, 0, 0.4)',
                                    color: readerMode ? '#2e7d32' : colors.neons.green.default,
                                    border: readerMode
                                        ? '1px solid #2e7d32'
                                        : `1px solid ${colors.neons.green.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.green.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#1b5e20',
                                          }
                                        : {
                                              bgcolor: 'rgba(0, 60, 0, 0.6)',
                                              color: colors.neons.green.light,
                                              boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                              '& .icon-content': {
                                                  animation: `${flicker} 2s infinite`,
                                                  filter: `drop-shadow(0 0 3px ${colors.neons.green.default})`,
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.green.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                    '&.Mui-disabled': {
                                        color: 'grey',
                                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                        border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                                    },
                                }}
                            >
                                <AutorenewIcon
                                    className="icon-content"
                                    sx={{
                                        color: !editedItem.description
                                            ? 'grey'
                                            : readerMode
                                            ? '#2e7d32'
                                            : colors.neons.green.default,
                                        textShadow: !editedItem.description
                                            ? 'none'
                                            : readerMode
                                            ? 'none'
                                            : `0 0 5px ${colors.neons.green.default}`,
                                        zIndex: 2,
                                        fontSize: '16px',
                                    }}
                                    fontSize="small"
                                />
                            </IconButton>
                        </Box>
                    </Box>
                </Grid>
                {/* Type */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel id="type-label" sx={inputLabelStyle}>
                            {t('buildings.labels.type')}
                        </InputLabel>
                        <Select
                            labelId="type-label"
                            value={buildingItem.type || ''}
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
                {/* Style */}
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel sx={inputLabelStyle}>{t('buildings.labels.style')}</InputLabel>
                        <Select
                            value={buildingItem.style || ''}
                            onChange={(e) => handleChange('style', e.target.value)}
                            label={t('buildings.labels.style')}
                            sx={selectStyle}
                        >
                            {Object.values(Style).map((value) => (
                                <MenuItem key={value} value={value}>
                                    {t(`buildings.style.${value}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {/* Ownership */}
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel sx={inputLabelStyle}>{t('buildings.labels.ownership')}</InputLabel>
                        <Select
                            value={buildingItem.ownership || ''}
                            onChange={(e) => handleChange('ownership', e.target.value)}
                            label={t('buildings.labels.ownership')}
                            sx={selectStyle}
                        >
                            {Object.values(Ownership).map((value) => (
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
                            value={buildingItem.isAbandoned ? 'yes' : 'no'}
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
                            value={buildingItem.elevators ? 'yes' : 'no'}
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
                            value={buildingItem.parking ? 'yes' : 'no'}
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
                            value={buildingItem.gatehouseFrontDesk ? 'yes' : 'no'}
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
                            value={buildingItem.emergencyExit ? 'yes' : 'no'}
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
                            value={buildingItem.backupLights ? 'yes' : 'no'}
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
                            value={buildingItem.landingPad ? 'yes' : 'no'}
                            onChange={(e) => handleChange('landingPad', e.target.value === 'yes')}
                            label={t('buildings.labels.landingPad')}
                            sx={selectStyle}
                        >
                            <MenuItem value="yes">{t('common.yes', 'Yes')}</MenuItem>
                            <MenuItem value="no">{t('common.no', 'No')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {/* Secret / Alt Entrance */}
                <Grid item xs={12} md={1.5}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel sx={inputLabelStyle}>{t('buildings.labels.secretOrAltEntrance')}</InputLabel>
                        <Select
                            value={buildingItem.secretOrAltEntrance ? 'yes' : 'no'}
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
                            value={buildingItem.securityPersonnel || ''}
                            onChange={(e) => handleChange('securityPersonnel', e.target.value)}
                            label={t('buildings.labels.securityPersonnel')}
                            sx={selectStyle}
                        >
                            {Object.values(SecurityPersonnel).map((value) => (
                                <MenuItem key={value} value={value}>
                                    {t(`buildings.securityPersonnel.${value}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Event */}
                <Grid item xs={12} md={5}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel sx={inputLabelStyle}>{t('buildings.labels.event')}</InputLabel>
                        <Select
                            value={buildingItem.event || ''}
                            onChange={(e) => handleChange('event', e.target.value)}
                            label={t('buildings.labels.event')}
                            sx={selectStyle}
                        >
                            {Object.values(Event).map((value) => (
                                <MenuItem key={value} value={value}>
                                    {t(`buildings.event.${value}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {/* Secret */}
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                        <InputLabel sx={inputLabelStyle}>{t('buildings.labels.secret')}</InputLabel>
                        <Select
                            value={buildingItem.secret || ''}
                            onChange={(e) => handleChange('secret', e.target.value)}
                            label={t('buildings.labels.secret')}
                            sx={selectStyle}
                        >
                            {Object.values(Secret).map((value) => (
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

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: readerMode
                        ? {
                              bgcolor: '#ffffff',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                              color: '#333',
                          }
                        : {
                              bgcolor: 'rgba(10, 15, 30, 0.95)',
                              backdropFilter: 'blur(4px)',
                              border: `1px solid ${colors.neons.cyan.default}40`,
                              boxShadow: `0 0 20px ${colors.neons.cyan.default}40`,
                              color: '#fff',
                              position: 'relative',
                              '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  backgroundImage:
                                      'linear-gradient(to right, rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
                                  backgroundSize: '20px 20px',
                                  pointerEvents: 'none',
                                  opacity: 0.5,
                              },
                          },
                }}
            >
                <DialogTitle
                    sx={
                        readerMode
                            ? {
                                  color: '#0288d1',
                                  borderBottom: '1px solid #eee',
                              }
                            : {
                                  color: colors.neons.cyan.default,
                                  textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                  fontFamily: '"Orbitron", monospace',
                                  borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                                  position: 'relative',
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '80%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                  },
                              }
                    }
                >
                    <Typography
                        variant="h3"
                        className="glitch-text"
                        component="div"
                        data-text={
                            moduleType === ModuleTypes.GANG
                                ? t('gangs.editTitle', 'Edit Gang')
                                : t('buildings.editTitle', 'Edit Building')
                        }
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        }}
                    >
                        {moduleType === ModuleTypes.GANG
                            ? t('gangs.editTitle', 'Edit Gang')
                            : t('buildings.editTitle', 'Edit Building')}
                    </Typography>
                </DialogTitle>
                <DialogContent
                    sx={{
                        py: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '80vh',
                        pr: 0,
                    }}
                >
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                        <Grid container spacing={2} sx={{ pr: 3, mt: 0 }}>
                            {moduleType === ModuleTypes.GANG ? renderGangFields() : renderBuildingFields()}
                        </Grid>
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={onClose}
                        sx={
                            readerMode
                                ? {
                                      color: '#0288d1',
                                  }
                                : {
                                      bgcolor: 'rgba(10, 20, 30, 0.6)',
                                      color: colors.neons.cyan.default,
                                      border: `1px solid ${colors.neons.cyan.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 30, 60, 0.8)',
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                      },
                                  }
                        }
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        sx={
                            readerMode
                                ? {
                                      color: colors.neons.green.dark,
                                  }
                                : {
                                      bgcolor: 'rgba(0, 20, 40, 0.6)',
                                      color: colors.neons.green.default,
                                      border: `1px solid ${colors.neons.green.default}40`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 40, 20, 0.8)',
                                          color: colors.neons.green.light,
                                          boxShadow: `0 0 10px ${colors.neons.green.default}60`,
                                          textShadow: `0 0 5px ${colors.neons.green.default}`,
                                          border: `1px solid ${colors.neons.green.default}70`,
                                      },
                                  }
                        }
                    >
                        {t('common.save', 'Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Image Delete Confirmation Dialog */}
            <WarningDialog
                open={deleteImageDialogOpen}
                onClose={() => setDeleteImageDialogOpen(false)}
                onConfirm={() => {
                    handleImageRemove()
                    setDeleteImageDialogOpen(false)
                }}
                title={t('common.confirmDeletion', 'Confirm Deletion')}
                message={t('common.confirmImageDeletion', 'Are you sure you want to delete this image?')}
                confirmColor="red"
                confirmText={t('common.delete', 'Delete')}
            />

            {/* Fullscreen Image Dialog */}
            <Dialog
                open={fullscreenImage}
                onClose={toggleFullscreenImage}
                maxWidth={false}
                fullScreen
                aria-labelledby="fullscreen-image-title"
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                    },
                }}
                onClick={toggleFullscreenImage}
                keepMounted={false}
                disablePortal={false}
                disableEnforceFocus={false}
                disableAutoFocus={false}
            >
                <Box
                    sx={{
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 0,
                        margin: 0,
                        position: 'relative',
                        overflowY: 'hidden',
                        '&::after': !readerMode
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  background:
                                      'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.9) 100%)',
                                  pointerEvents: 'none',
                                  zIndex: 1,
                              }
                            : {},
                    }}
                >
                    <Box
                        component="img"
                        src={editedItem?.image}
                        alt={editedItem?.name}
                        id="fullscreen-image-title"
                        tabIndex={0}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            position: 'absolute',
                            padding: 0,
                            top: 0,
                            left: 0,
                        }}
                    />
                </Box>
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        color: readerMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                        zIndex: 10,
                        textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                        padding: '8px 16px',
                        backdropFilter: 'blur(5px)',
                        backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                        margin: '0 auto',
                        width: 'fit-content',
                        borderRadius: '4px',
                    }}
                >
                    {t('common.clickToClose', 'Click anywhere to close')}
                </Typography>
            </Dialog>
        </>
    )
}

export default EditDialog
