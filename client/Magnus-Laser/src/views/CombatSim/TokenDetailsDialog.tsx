import CloseIcon from '@mui/icons-material/Close'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import Save from '@mui/icons-material/Save'
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Popper,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import type { ColorResult } from '@uiw/color-convert'
import { Colorful } from '@uiw/react-color'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { flicker, glitch, pulseGlowBlue, pulseGlowCyan } from '../../components/common/Animations'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { Image, Map, Token } from './types'

// Utility function to resolve image IDs to URLs
const resolveImageUrl = (imageId: string | undefined, images: Image[]): string | undefined => {
    if (!imageId) return undefined
    // If it starts with '/', it's a default image path
    if (imageId.startsWith('/')) return imageId
    // Otherwise, it's an image ID, find the corresponding blob URL
    const image = images.find((img) => img.id === imageId)
    return image ? URL.createObjectURL(image.blob) : undefined
}

// Utility function for safe nested property access and setting
const setNestedProperty = (obj: Record<string, unknown>, path: string[], value: unknown): void => {
    let current = obj
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {}
        }
        current = current[key] as Record<string, unknown>
    }
    current[path[path.length - 1]] = value
}

interface TokenDetailsDialogProps {
    tokenDialogOpen: string | undefined
    setTokenDialogOpen: (tokenDialogOpen: string | undefined) => void
    tokens: Token[]
    images: Image[]
    gridSize: number
    onUpdateToken: (tokenId: string, updates: Partial<Token>) => void
    onDeleteToken: (tokenId: string) => void
    onUploadImage: (file: globalThis.File) => void
    toggleFullscreenImage: (image: string) => void
    maps: Map[] // will be used to get the gridSize for tokens on other maps
}

const TokenDetailsDialog: React.FC<TokenDetailsDialogProps> = ({
    tokenDialogOpen,
    setTokenDialogOpen,
    tokens,
    images,
    gridSize,
    onUpdateToken,
    onDeleteToken,
    onUploadImage,
    toggleFullscreenImage,
    maps,
}) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [editedToken, setEditedToken] = useState<Partial<Token>>({})
    const [selectedImage, setSelectedImage] = useState<Image>()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [tokenColorAnchor, setTokenColorAnchor] = useState<HTMLElement | null>(null)
    const prevImagesLengthRef = useRef<number>(images.length)

    const currentToken = tokens.find((t) => t.id === tokenDialogOpen)
    const isDefaultToken =
        (currentToken?.id === 'EASY' ||
            currentToken?.id === 'TYPICAL' ||
            currentToken?.id === 'DANGEROUS' ||
            currentToken?.id === 'DEADLY') &&
        currentToken?.mapId === ''

    const [selectedSpecialDice, setSelectedSpecialDice] = useState<number>(4)

    const sortedImages = useMemo(() => {
        const arr = [...images]
        arr.sort((a, b) => a.name.localeCompare(b.name))
        return arr
    }, [images])

    useEffect(() => {
        if (currentToken) {
            if (currentToken.stats?.weapons?.grenadesOrSpecialAmmo?.d4) {
                setSelectedSpecialDice(4)
            } else if (currentToken.stats?.weapons?.grenadesOrSpecialAmmo?.d6) {
                setSelectedSpecialDice(6)
            } else if (currentToken.stats?.weapons?.grenadesOrSpecialAmmo?.d8) {
                setSelectedSpecialDice(8)
            }
        }
    }, [currentToken])

    useEffect(() => {
        if (currentToken) {
            setEditedToken({ ...currentToken })
            // Find the selected image based on the token's imageId
            if (currentToken.imageId && !currentToken.imageId.startsWith('/')) {
                // It's an image ID, find the matching image
                const matchingImage = images.find((img) => img.id === currentToken.imageId)
                setSelectedImage(matchingImage)
            } else {
                // Static path or no image
                setSelectedImage(undefined)
            }
        }
    }, [currentToken, images])

    // Sync selectedImage when editedToken.imageId changes
    useEffect(() => {
        if (editedToken.imageId && !editedToken.imageId.startsWith('/')) {
            // It's an image ID, find the matching image
            const matchingImage = images.find((img) => img.id === editedToken.imageId)
            setSelectedImage(matchingImage)
        } else if (!editedToken.imageId) {
            // imageId was cleared
            setSelectedImage(undefined)
        }
    }, [editedToken.imageId, images])

    // Detect when a new image is uploaded and automatically set it as selected
    useEffect(() => {
        if (images.length > prevImagesLengthRef.current) {
            // A new image was added - get the most recent one
            const newImage = images[images.length - 1]
            if (newImage) {
                setSelectedImage(newImage)
                handleFieldChange('imageId', newImage.id)
            }
        }
        prevImagesLengthRef.current = images.length
    }, [images.length])

    const handleSave = () => {
        if (tokenDialogOpen && editedToken) {
            onUpdateToken(tokenDialogOpen, editedToken)
        }
        setTokenDialogOpen(undefined)
    }

    const handleDelete = () => {
        if (tokenDialogOpen) {
            onDeleteToken(tokenDialogOpen)
        }
        setTokenDialogOpen(undefined)
    }

    const handleFieldChange = (field: string, value: unknown) => {
        let processedValue = value
        if (field === 'radius') {
            // Convert multiplier to actual pixel radius
            const half = gridSize / 2
            processedValue = Math.max(1, Math.floor(half * (value as number)))
        }

        // Handle nested fields like 'stats.combat', 'stats.armor.sph', etc.
        const fieldPath = field.split('.')
        setEditedToken((prev) => {
            const newToken = { ...prev }
            setNestedProperty(newToken, fieldPath, processedValue)
            return newToken
        })
    }

    const handleImageUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            onUploadImage(file)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleImageClick = () => {
        if (editedToken.imageId) {
            const imageUrl = resolveImageUrl(editedToken.imageId, images)
            if (imageUrl) {
                toggleFullscreenImage(imageUrl)
            }
        }
    }

    const handleDownloadClick = () => {
        if (editedToken.imageId) {
            const imageUrl = resolveImageUrl(editedToken.imageId, images)
            if (imageUrl) {
                const link = document.createElement('a')
                link.href = imageUrl
                link.download = `${editedToken.name || 'token'}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        }
    }

    const handleColorSelected = (color: ColorResult) => {
        if (typeof color.hex === 'string') {
            // Convert hex string to number
            const colorNum = parseInt(color.hex.slice(1), 16)
            handleFieldChange('color', colorNum)
        }
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

    if (!currentToken) return null

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelected}
                style={{ display: 'none' }}
            />
            <Dialog
                open={tokenDialogOpen !== undefined}
                onClose={() => setTokenDialogOpen(undefined)}
                maxWidth="lg"
                fullWidth
                slotProps={{
                    paper: {
                        sx: readerMode
                            ? {
                                  bgcolor: colors.grays.gray800 + ' !important',
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
                    },
                }}
            >
                <DialogTitle
                    sx={
                        readerMode
                            ? {
                                  color: '#0288d1',
                                  borderBottom: '1px solid #eee',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                              }
                            : {
                                  color: colors.neons.cyan.default,
                                  textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                  fontFamily: '"Orbitron", monospace',
                                  borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
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
                        data-text={t('combatSim.tokenDialogTitle')}
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        }}
                    >
                        {t('combatSim.tokenDialogTitle')}
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
                    <Grid container spacing={2} sx={{ pr: 3, mt: 3 }}>
                        {/* Name - full width */}
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label={t('common.name')}
                                value={editedToken.name || ''}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                variant="outlined"
                                sx={textFieldOutlinedStyle}
                            />
                        </Grid>

                        {/* Left Column - Fields */}
                        <Grid container size={{ xs: 12, md: 9 }}>
                            {/* NPC Stats */}
                            {/* Combat */}
                            <Grid size={editedToken.mapId !== '' ? 1.75 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.combat')}
                                    type="tel"
                                    value={editedToken.stats?.combat}
                                    onChange={(e) => handleFieldChange('stats.combat', Number(e.target.value) || 0)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                            </Grid>
                            {/* Skills */}
                            <Grid size={editedToken.mapId !== '' ? 1.5 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.skills')}
                                    type="tel"
                                    value={editedToken.stats?.skills}
                                    onChange={(e) => handleFieldChange('stats.skills', Number(e.target.value) || 0)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                            </Grid>
                            {/* Initiative */}
                            <Grid size={editedToken.mapId !== '' ? 1.75 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.initiative')}
                                    type="tel"
                                    value={editedToken.stats?.initiative}
                                    onChange={(e) => handleFieldChange('stats.initiative', Number(e.target.value) || 0)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                            </Grid>
                            {/* Health */}
                            {editedToken.mapId !== '' && (
                                <Grid size={2}>
                                    <TextField
                                        fullWidth
                                        label={t('combatSim.currentHealth')}
                                        type="tel"
                                        value={editedToken.stats?.currentHealth}
                                        onChange={(e) =>
                                            handleFieldChange('stats.currentHealth', Number(e.target.value) || 0)
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                    />
                                </Grid>
                            )}
                            <Grid size={editedToken.mapId !== '' ? 1.75 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.health')}
                                    type="tel"
                                    value={editedToken.stats?.health}
                                    onChange={(e) => handleFieldChange('stats.health', Number(e.target.value) || 0)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                            </Grid>

                            {/* Armor SPH */}
                            {editedToken.mapId !== '' && (
                                <Grid size={1.75}>
                                    <TextField
                                        fullWidth
                                        label={t('combatSim.currentSph')}
                                        type="tel"
                                        value={editedToken.stats?.armor?.currentSph}
                                        onChange={(e) =>
                                            handleFieldChange('stats.armor.currentSph', Number(e.target.value) || 0)
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                    />
                                </Grid>
                            )}
                            <Grid size={editedToken.mapId !== '' ? 1.5 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.sph')}
                                    type="tel"
                                    value={editedToken.stats?.armor?.sph}
                                    onChange={(e) => handleFieldChange('stats.armor.sph', Number(e.target.value) || 0)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                            </Grid>
                            {/* Armor SPB */}
                            {editedToken.mapId !== '' && (
                                <Grid size={1.75}>
                                    <TextField
                                        fullWidth
                                        label={t('combatSim.currentSpb')}
                                        type="tel"
                                        value={editedToken.stats?.armor?.currentSpb}
                                        onChange={(e) =>
                                            handleFieldChange('stats.armor.currentSpb', Number(e.target.value) || 0)
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                    />
                                </Grid>
                            )}
                            <Grid size={editedToken.mapId !== '' ? 1.5 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.spb')}
                                    type="tel"
                                    value={editedToken.stats?.armor?.spb}
                                    onChange={(e) => handleFieldChange('stats.armor.spb', Number(e.target.value) || 0)}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                />
                            </Grid>
                            {/* Weapons D6 */}
                            <Grid size={editedToken.mapId !== '' ? 1.75 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.melee')}
                                    type="tel"
                                    value={editedToken.stats?.weapons?.melee?.d6 || 0}
                                    onChange={(e) =>
                                        handleFieldChange('stats.weapons.melee.d6', Number(e.target.value) || 0)
                                    }
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    slotProps={{
                                        input: {
                                            renderSuffix: () => (
                                                <Typography variant="button" sx={{ mr: 0.5, fontSize: '10px' }}>
                                                    D6
                                                </Typography>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={editedToken.mapId !== '' ? 1.75 : 2}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.ranged')}
                                    type="tel"
                                    value={editedToken.stats?.weapons?.ranged?.d6 || 0}
                                    onChange={(e) =>
                                        handleFieldChange('stats.weapons.ranged.d6', Number(e.target.value) || 0)
                                    }
                                    variant="outlined"
                                    sx={{ ...textFieldOutlinedStyle }}
                                    slotProps={{
                                        input: {
                                            renderSuffix: () => (
                                                <Typography variant="button" sx={{ mr: 0.5, fontSize: '10px' }}>
                                                    D6
                                                </Typography>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={editedToken.mapId !== '' ? 2 : 2}>
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel sx={inputLabelStyle}>{t('combatSim.amount')}</InputLabel>
                                    <Select
                                        fullWidth
                                        label={t('combatSim.amount')}
                                        value={selectedSpecialDice}
                                        onChange={(e) => {
                                            setSelectedSpecialDice(Number(e.target.value) || 0)
                                            handleFieldChange('stats.weapons.grenadesOrSpecialAmmo.d4', 0)
                                            handleFieldChange('stats.weapons.grenadesOrSpecialAmmo.d6', 0)
                                            handleFieldChange('stats.weapons.grenadesOrSpecialAmmo.d8', 0)
                                        }}
                                        variant="outlined"
                                        sx={selectStyle}
                                    >
                                        <MenuItem value={4} key="d4">
                                            D4
                                        </MenuItem>
                                        <MenuItem value={6} key="d6">
                                            D6
                                        </MenuItem>
                                        <MenuItem value={8} key="d8">
                                            D8
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={editedToken.mapId !== '' ? 3.25 : 4}>
                                <TextField
                                    fullWidth
                                    label={t('combatSim.grenadesOrSpecialAmmo')}
                                    type="tel"
                                    value={
                                        selectedSpecialDice === 4
                                            ? editedToken.stats?.weapons?.grenadesOrSpecialAmmo?.d4 ?? 0
                                            : selectedSpecialDice === 6
                                            ? editedToken.stats?.weapons?.grenadesOrSpecialAmmo?.d6 ?? 0
                                            : selectedSpecialDice === 8
                                            ? editedToken.stats?.weapons?.grenadesOrSpecialAmmo?.d8 ?? 0
                                            : 0
                                    }
                                    onChange={(e) => {
                                        handleFieldChange(
                                            `stats.weapons.grenadesOrSpecialAmmo.d${selectedSpecialDice}`,
                                            Number(e.target.value) || 0
                                        )
                                    }}
                                    variant="outlined"
                                    sx={textFieldOutlinedStyle}
                                    slotProps={{
                                        input: {
                                            renderSuffix: () => (
                                                <Typography variant="button" sx={{ mr: 0.5, fontSize: '10px' }}>
                                                    D{selectedSpecialDice}
                                                </Typography>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            {/* Current Grenades/Special Ammo */}
                            {editedToken.mapId !== '' && (
                                <Grid size={2}>
                                    <TextField
                                        fullWidth
                                        label={t('combatSim.currentGrenadesOrSpecialAmmo')}
                                        type="tel"
                                        value={editedToken.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'stats.weapons.currentGrenadesOrSpecialAmmo',
                                                Number(e.target.value) || 0
                                            )
                                        }
                                        variant="outlined"
                                        sx={textFieldOutlinedStyle}
                                    />
                                </Grid>
                            )}
                            {/* Color Picker */}
                            <Grid size={editedToken.mapId !== '' ? 1.75 : 2}>
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel
                                        id="item-image-label"
                                        sx={{
                                            ...inputLabelStyle,
                                            top: -25,
                                            lineHeight: '1 !important',
                                            py: '0 !important',
                                        }}
                                    >
                                        <Typography variant="caption">{t('combatSim.color')}</Typography>
                                    </InputLabel>
                                    <Box
                                        sx={{
                                            height: '56px',
                                            position: 'relative',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0, 0, 0, 0.5)',
                                            border: `2px solid ${
                                                readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'
                                            }`,
                                            cursor: editedToken.imageId ? 'pointer' : 'default',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: readerMode
                                                    ? `0 0 15px ${colors.neons.blue.default}80`
                                                    : `0 0 15px ${colors.neons.cyan.default}80`,
                                                border: readerMode
                                                    ? `2px solid ${colors.neons.blue.default}`
                                                    : `2px solid ${colors.neons.cyan.default}`,
                                                '& .MuiBox-root': {
                                                    opacity: 1,
                                                },
                                            },
                                            borderRadius: '4px',
                                        }}
                                    >
                                        <Box
                                            onClick={(e) => {
                                                setTokenColorAnchor((prev) => (prev ? null : e.currentTarget))
                                            }}
                                            sx={{
                                                cursor: 'pointer',
                                                height: '100%',
                                                width: '100%',
                                                bgcolor: `${
                                                    editedToken.color
                                                        ? `#${editedToken.color.toString(16).padStart(6, '0')}`
                                                        : '#ffffff'
                                                }`,
                                                borderRadius: '3px',
                                            }}
                                            title={t('combatSim.gridColor')}
                                        />
                                    </Box>
                                </FormControl>
                            </Grid>

                            {/* Image Dropdown */}
                            <Grid size={editedToken.mapId !== '' ? 5.125 : 6}>
                                {/* Image Selection */}
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel sx={inputLabelStyle}>{t('combatSim.selectImage')}</InputLabel>
                                    <Select
                                        value={selectedImage?.id ?? ''}
                                        onChange={(e) => {
                                            const selectedValue = e.target.value
                                            if (selectedValue === '') {
                                                setSelectedImage(undefined)
                                                handleFieldChange('imageId', undefined)
                                            } else {
                                                // Find the selected image
                                                const image = images.find((img) => img.id === selectedValue)
                                                if (image) {
                                                    setSelectedImage(image)
                                                    // Store the image ID in the token
                                                    handleFieldChange('imageId', image.id)
                                                }
                                            }
                                        }}
                                        label={t('combatSim.selectImage')}
                                        sx={selectStyle}
                                        renderValue={(selected) => {
                                            if (!selected) return
                                            const selectedImage = images.find((img) => img.id === selected)
                                            return selectedImage ? selectedImage.name : t('combatSim.noImage')
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>{t('combatSim.noImage')}</em>
                                        </MenuItem>
                                        {sortedImages.map((image) => (
                                            <MenuItem key={image.id} value={image.id}>
                                                {image.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* Size */}
                            <Grid size={editedToken.mapId !== '' ? 5.125 : 6}>
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel sx={inputLabelStyle}>{t('combatSim.size')}</InputLabel>
                                    <Select
                                        value={(() => {
                                            const map = maps.find((m) => m.id === editedToken.mapId)
                                            const mapGridSize = map?.gridSize ?? gridSize
                                            // Convert pixel radius back to multiplier for display
                                            const half = mapGridSize / 2
                                            const radius = editedToken.radius ?? Math.max(1, Math.floor(half))
                                            // Find closest multiplier
                                            const multiplier = radius / half
                                            // Round to nearest 0.1 and clamp to valid values
                                            const rounded = Math.round(multiplier * 10) / 10
                                            return Math.max(1, Math.min(4, rounded))
                                        })()}
                                        onChange={(e) => handleFieldChange('radius', Number(e.target.value))}
                                        label={t('combatSim.size')}
                                        sx={selectStyle}
                                    >
                                        <MenuItem value={1}>{t('combatSim.medium')}</MenuItem>
                                        <MenuItem value={2}>{t('combatSim.large')}</MenuItem>
                                        <MenuItem value={3}>{t('combatSim.huge')}</MenuItem>
                                        <MenuItem value={4}>{t('combatSim.gargantuan')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* Ignore Seriously Wounded Penalty */}
                            <Grid size={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editedToken.stats?.ignoreSeriouslyWoundedPenalty ?? false}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    'stats.ignoreSeriouslyWoundedPenalty',
                                                    e.target.checked
                                                )
                                            }
                                            sx={{
                                                color: readerMode ? colors.grays.gray700 : colors.neons.cyan.default,
                                                '&.Mui-checked': {
                                                    color: readerMode ? colors.grays.gray900 : colors.neons.cyan.light,
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: readerMode ? colors.grays.gray900 : colors.neons.cyan.light,
                                            }}
                                        >
                                            {t('combatSim.ignoreSeriouslyWoundedPenalty')}
                                        </Typography>
                                    }
                                />
                            </Grid>
                        </Grid>

                        {/* Right Column - Image */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                <InputLabel
                                    id="item-image-label"
                                    sx={{
                                        ...inputLabelStyle,
                                        top: -25,
                                        lineHeight: '1 !important',
                                        py: '0 !important',
                                    }}
                                >
                                    <Typography variant="caption">{t('combatSim.tokenImage')}</Typography>
                                </InputLabel>

                                <Box
                                    sx={{
                                        maxHeight: '40vh',
                                        position: 'relative',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        aspectRatio: '1 / 1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0, 0, 0, 0.5)',
                                        border: `2px solid ${
                                            readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'
                                        }`,
                                        cursor: editedToken.imageId ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            boxShadow: readerMode
                                                ? `0 0 15px ${colors.neons.blue.default}80`
                                                : `0 0 15px ${colors.neons.cyan.default}80`,
                                            border: readerMode
                                                ? `2px solid ${colors.neons.blue.default}`
                                                : `2px solid ${colors.neons.cyan.default}`,
                                            '& .MuiBox-root': {
                                                opacity: 1,
                                            },
                                        },
                                        borderRadius: '4px',
                                    }}
                                    onClick={handleImageClick}
                                >
                                    <Avatar
                                        src={resolveImageUrl(editedToken.imageId, images)}
                                        alt={t('common.itemImageAlt', { name: editedToken.name || 'token' })}
                                        variant="rounded"
                                        slotProps={{
                                            img: {
                                                style: {
                                                    objectFit: 'contain',
                                                    width: '100%',
                                                    height: '100%',
                                                },
                                            },
                                        }}
                                        sx={{
                                            bgcolor: 'transparent',
                                            color: 'transparent',
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    />
                                    {!editedToken.imageId && (
                                        <Typography
                                            variant={'caption'}
                                            sx={{
                                                zIndex: 0,
                                                fontSize: { xs: '32px', sm: '80px', md: '32px', lg: '48px' },
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

                                    {/* Action buttons */}
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
                                            opacity: 0,
                                            transition: 'opacity 0.3s ease',
                                        }}
                                        className="MuiBox-root"
                                        onClick={(e) => e.stopPropagation()} // Prevent clicks from propagating to parent
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleImageUploadClick()
                                            }}
                                            title={t('common.uploadImage')}
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
                                                '&.Mui-disabled': {
                                                    color: 'grey',
                                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                                    border: readerMode
                                                        ? '1px solid #ccc'
                                                        : '1px solid rgba(100, 100, 100, 0.2)',
                                                },
                                            }}
                                        >
                                            <FolderOpenIcon
                                                className="icon-content"
                                                sx={{
                                                    color: readerMode ? '#1976d2' : colors.neons.blue.default,
                                                    textShadow: readerMode
                                                        ? 'none'
                                                        : `0 0 5px ${colors.neons.blue.default}`,
                                                    zIndex: 2,
                                                    fontSize: '16px',
                                                }}
                                                fontSize="small"
                                            />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedImage(undefined)
                                                handleFieldChange('imageId', undefined)
                                            }}
                                            title={t('common.removeImage')}
                                            disabled={!editedToken.imageId}
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
                                                          '& .icon-content': {
                                                              animation: `${flicker} 2s infinite`,
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
                                                    border: readerMode
                                                        ? '1px solid #ccc'
                                                        : '1px solid rgba(100, 100, 100, 0.2)',
                                                },
                                            }}
                                        >
                                            <CloseIcon
                                                className="icon-content"
                                                sx={{
                                                    color: !editedToken.imageId
                                                        ? 'grey'
                                                        : readerMode
                                                        ? '#d32f2f'
                                                        : colors.neons.red.default,
                                                    textShadow: !editedToken.imageId
                                                        ? 'none'
                                                        : readerMode
                                                        ? 'none'
                                                        : `0 0 5px ${colors.neons.red.default}`,
                                                    zIndex: 2,
                                                    fontSize: '16px',
                                                }}
                                                fontSize="small"
                                            />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownloadClick()
                                            }}
                                            title={t('common.downloadImage')}
                                            disabled={!editedToken.imageId}
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
                                                '&.Mui-disabled': {
                                                    color: 'grey',
                                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                                    border: readerMode
                                                        ? '1px solid #ccc'
                                                        : '1px solid rgba(100, 100, 100, 0.2)',
                                                },
                                            }}
                                        >
                                            <Save
                                                className="icon-content"
                                                sx={{
                                                    color: !editedToken.imageId
                                                        ? 'grey'
                                                        : readerMode
                                                        ? '#1976d2'
                                                        : colors.neons.blue.default,
                                                    textShadow: !editedToken.imageId
                                                        ? 'none'
                                                        : readerMode
                                                        ? 'none'
                                                        : `0 0 5px ${colors.neons.blue.default}`,
                                                    zIndex: 2,
                                                    fontSize: '16px',
                                                }}
                                                fontSize="small"
                                            />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    {!isDefaultToken && (
                        <Button onClick={handleDelete} color="error" variant="outlined">
                            {t('common.delete')}
                        </Button>
                    )}
                    <Button
                        onClick={() => setTokenDialogOpen(undefined)}
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
                                          bgcolor: 'rgba(10, 30, 40, 0.8)',
                                          color: colors.neons.cyan.light,
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}60`,
                                          textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                          border: `1px solid ${colors.neons.cyan.default}70`,
                                      },
                                  }
                        }
                    >
                        {t('common.cancel')}
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
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
            <Popper
                open={Boolean(tokenColorAnchor)}
                anchorEl={tokenColorAnchor}
                placement="bottom"
                sx={{ zIndex: 1300 }}
            >
                <Box
                    sx={{
                        bgcolor: readerMode ? '#101010' : '#080808',
                        p: 1,
                        border: `1px solid ${colors.neons.cyan.dark}`,
                        borderRadius: 1,
                    }}
                >
                    <Colorful
                        color={editedToken.color ? `#${editedToken.color.toString(16).padStart(6, '0')}` : '#ffffff'}
                        onChange={handleColorSelected}
                    />
                </Box>
            </Popper>
        </>
    )
}

export default TokenDetailsDialog
