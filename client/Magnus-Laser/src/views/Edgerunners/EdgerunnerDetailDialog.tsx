import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomScrollbar from '../../components/CustomScrollbar'
import CyberpunkFormControl from '../../components/CyberpunkFormControl'
import { useGMToolsDataStore } from '../../components/GMTools/GMToolsDataStore'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import type { Character } from '../../types/characterCreator'
import colors from '../../utils/colors'
import { db } from '../../utils/db'
import { getEffectiveStats } from '../../utils/generators/characterCreatorUtils'
import { characterToToken } from '../../utils/generators/edgerunnerToToken'
import { loadTokenModelPaths } from '../CombatSim/utils/modelAssets'
import type { Image as ImageRecord } from '../CombatSim/utils/types'

// model-viewer JSX type is declared globally in TokenDetailsDialog.tsx

const NEON_COLOR_SWATCHES = [
    { label: 'Cyan', value: 0x00ffff },
    { label: 'Pink', value: 0xff00ff },
    { label: 'Green', value: 0x00ff8b },
    { label: 'Blue', value: 0x0099ff },
    { label: 'Purple', value: 0x9900ff },
    { label: 'Yellow', value: 0xffff00 },
    { label: 'Red', value: 0xff0055 },
    { label: 'Orange', value: 0xff5e00 },
]

const ROLE_COLORS: Record<string, string> = {
    ROCKERBOY: colors.neons.pink.default,
    SOLO: colors.neons.red.default,
    NETRUNNER: colors.neons.cyan.default,
    TECH: colors.neons.yellow.default,
    MEDTECH: colors.neons.green.default,
    MEDIA: colors.neons.blue.default,
    LAWMAN: colors.neons.purple.default,
    EXEC: colors.neons.orange.default,
    FIXER: colors.neons.green.light,
    NOMAD: colors.neons.cyan.dark,
}

const STAT_KEYS = ['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP'] as const

/**
 * Standalone edgerunner detail dialog that can be rendered from any view
 * (e.g., opened from CombatSim TokenPanel).
 */
const EdgerunnerDetailDialog = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { edgerunners, openEdgerunnerId, setOpenEdgerunnerId, updateEdgerunner } = useGMToolsDataStore()

    const [edited, setEdited] = useState<Character | null>(null)
    const [tab, setTab] = useState(0) // 0=Overview, 1=Combat
    const [images, setImages] = useState<ImageRecord[]>([])
    const [modelOptions, setModelOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Aleatorio (por ID)' },
    ])
    const [modelViewerReady, setModelViewerReady] = useState(false)

    const open = openEdgerunnerId !== null

    // Load edgerunner when ID changes
    useEffect(() => {
        if (!openEdgerunnerId) {
            setEdited(null)
            return
        }
        const er = edgerunners.find((e) => e.id === openEdgerunnerId)
        if (er) {
            setEdited({ ...er, ip: er.ip ?? 0 })
            setTab(0)
        }
    }, [openEdgerunnerId, edgerunners])

    // Load all images from IndexedDB
    useEffect(() => {
        if (!open) return
        db.images.toArray().then((imgs) => setImages(imgs as ImageRecord[]))
    }, [open])

    // Load model options
    useEffect(() => {
        if (!open) return
        loadTokenModelPaths()
            .then((paths) => {
                const mapped = paths.map((f) => {
                    const name = f.split('/').pop() || f
                    const base = name.replace(/\.(glb|gltf)$/i, '')
                    return { value: f, label: base }
                })
                setModelOptions([{ value: '', label: 'Aleatorio (por ID)' }, ...mapped])
            })
            .catch(() => setModelOptions([{ value: '', label: 'Aleatorio (por ID)' }]))
    }, [open])

    // Load model-viewer script
    useEffect(() => {
        if (!open) return
        const hasWindow = typeof window !== 'undefined'
        const already = hasWindow && document.querySelector('script[src*="model-viewer"]')
        if (!already && hasWindow) {
            const script = document.createElement('script')
            script.type = 'module'
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js'
            script.onload = () => setModelViewerReady(true)
            document.head.appendChild(script)
        } else if (hasWindow) {
            setModelViewerReady(true)
        }
    }, [open])

    const sortedImages = useMemo(() => {
        const arr = [...images]
        arr.sort((a, b) => a.name.localeCompare(b.name))
        return arr
    }, [images])

    const resolveImageUrl = (imageId: string | undefined): string | undefined => {
        if (!imageId) return undefined
        const img = images.find((i) => i.id === imageId)
        if (img?.blob) return URL.createObjectURL(img.blob)
        return undefined
    }

    const handleClose = () => setOpenEdgerunnerId(null)

    const handleSave = async () => {
        if (edited) {
            updateEdgerunner(edited.id, edited)
            // Sync associated combat token if it exists
            const tokenId = `er-${edited.id}`
            const existingToken = await db.tokens.get(tokenId)
            if (existingToken) {
                const fresh = characterToToken(edited, existingToken.mapId, existingToken.x, existingToken.y)
                fresh.id = tokenId
                fresh.stats.currentHealth = existingToken.stats.currentHealth
                fresh.stats.currentMovement = existingToken.stats.currentMovement
                fresh.stats.armor.currentSpb = existingToken.stats.armor.currentSpb
                fresh.stats.armor.currentSph = existingToken.stats.armor.currentSph
                fresh.stats.currentLuck = existingToken.stats.currentLuck
                await db.tokens.put(fresh)
            }
            setOpenEdgerunnerId(null)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!edited) return
        const file = e.target.files?.[0]
        if (!file) return
        const img = await new Promise<globalThis.HTMLImageElement>((resolve) => {
            const i = new globalThis.Image()
            i.onload = () => resolve(i)
            i.src = URL.createObjectURL(file)
        })
        const imageId = globalThis.crypto?.randomUUID?.() ?? String(Date.now())
        await db.images.put({
            id: imageId,
            name: file.name,
            mimeType: file.type,
            width: img.width,
            height: img.height,
            blob: file,
        })
        setImages((prev) => [
            ...prev,
            { id: imageId, name: file.name, mimeType: file.type, width: img.width, height: img.height, blob: file },
        ])
        setEdited({ ...edited, tokenImageId: imageId })
        e.target.value = ''
    }

    if (!edited) return null

    const effectiveStats = getEffectiveStats(edited.stats, edited.cyberware)
    const tokenColor = edited.tokenColor ?? 0x00ff8b
    const hexColor = `#${tokenColor.toString(16).padStart(6, '0')}`

    const selectStyle = {
        color: readerMode ? colors.grays.gray900 : colors.neons.cyan.default,
        borderColor: readerMode ? undefined : colors.neons.cyan.default,
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: readerMode
                        ? {
                              bgcolor: '#fafafa',
                              border: '1px solid #e0e0e0',
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
            {/* Header */}
            <DialogTitle
                sx={
                    readerMode
                        ? {
                              color: '#0097a7',
                              borderBottom: '1px solid #eee',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                          }
                        : {
                              color: colors.neons.cyan.default,
                              textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                              fontFamily: '"Orbitron", monospace',
                              borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                          }
                }
            >
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: hexColor,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                    }}
                    src={resolveImageUrl(edited.tokenImageId)}
                >
                    {(edited.handle || edited.name).charAt(0).toUpperCase()}
                </Avatar>
                <Stack sx={{ flexGrow: 1 }} spacing={0}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: readerMode ? '#0097a7' : colors.neons.cyan.default,
                            fontWeight: 'bold',
                        }}
                    >
                        {edited.handle || edited.name}
                    </Typography>
                    {edited.handle && edited.name !== edited.handle && (
                        <Typography variant="caption" sx={{ color: colors.grays.gray600, lineHeight: 1 }}>
                            {edited.name}
                        </Typography>
                    )}
                </Stack>
                <Chip
                    label={t(`characterCreator.roles.${edited.role}`)}
                    size="small"
                    sx={{
                        backgroundColor: `${ROLE_COLORS[edited.role]}30`,
                        color: ROLE_COLORS[edited.role],
                        border: `1px solid ${ROLE_COLORS[edited.role]}`,
                    }}
                />
            </DialogTitle>

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                    borderBottom: `1px solid ${colors.neons.cyan.default}30`,
                    '& .MuiTab-root': {
                        color: colors.grays.gray600,
                        minHeight: 42,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            color: colors.neons.cyan.light,
                        },
                    },
                    '& .Mui-selected': {
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 8px ${colors.neons.cyan.default}`,
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: colors.neons.cyan.default,
                        boxShadow: `0 0 8px ${colors.neons.cyan.default}`,
                    },
                }}
            >
                <Tab label={t('edgerunners.tabs.overview')} />
                <Tab label={t('edgerunners.tabs.combat')} />
            </Tabs>

            <DialogContent sx={{ p: 0 }}>
                <CustomScrollbar height="60vh">
                    <Box sx={{ px: 3, py: 2 }}>
                        {/* === TAB 0: OVERVIEW === */}
                        {tab === 0 && (
                            <Grid container spacing={2}>
                                {/* Stats */}
                                <Grid size={12}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ color: colors.neons.green.default, mb: 1, fontWeight: 'bold' }}
                                    >
                                        {t('characterCreator.steps.STATS')}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(5, 1fr)',
                                            gap: 1,
                                            mb: 2,
                                        }}
                                    >
                                        {STAT_KEYS.map((key) => {
                                            const base = edited.stats[key]
                                            const effective = effectiveStats[key]
                                            const boosted = effective > base
                                            return (
                                                <Box
                                                    key={key}
                                                    sx={{
                                                        textAlign: 'center',
                                                        p: 0.75,
                                                        borderRadius: '4px',
                                                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(0,0,0,0.3)',
                                                        border: `1px solid ${readerMode ? '#ddd' : colors.neons.cyan.default + '30'}`,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: colors.grays.gray500,
                                                            fontWeight: 600,
                                                            display: 'block',
                                                        }}
                                                    >
                                                        {key}
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: boosted
                                                                ? colors.neons.green.default
                                                                : readerMode
                                                                  ? '#333'
                                                                  : colors.neons.cyan.light,
                                                        }}
                                                    >
                                                        {effective}
                                                    </Typography>
                                                </Box>
                                            )
                                        })}
                                    </Box>
                                </Grid>

                                {/* Derived Stats */}
                                <Grid size={12}>
                                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                        {[
                                            {
                                                label: 'HP',
                                                value: edited.derivedStats.HP,
                                                color: colors.neons.red.default,
                                            },
                                            {
                                                label: 'MOVE',
                                                value: edited.stats.MOVE,
                                                color: colors.neons.blue.default,
                                            },
                                            {
                                                label: 'Init (REF)',
                                                value: edited.stats.REF,
                                                color: colors.neons.yellow.default,
                                            },
                                            {
                                                label: 'Death Save',
                                                value: edited.derivedStats.DeathSave,
                                                color: colors.neons.purple.default,
                                            },
                                        ].map(({ label, value, color }) => (
                                            <Chip
                                                key={label}
                                                label={`${label}: ${value}`}
                                                sx={{
                                                    bgcolor: `${color}20`,
                                                    color,
                                                    border: `1px solid ${color}60`,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Grid>

                                {/* Armor */}
                                {edited.armor.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: colors.neons.pink.default,
                                                fontWeight: 'bold',
                                                mb: 0.5,
                                                mt: 1,
                                            }}
                                        >
                                            ARMOR
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {edited.armor.map((a, i) => (
                                                <Typography
                                                    key={i}
                                                    variant="body2"
                                                    sx={{ color: readerMode ? '#555' : colors.grays.gray700 }}
                                                >
                                                    {a.name} — SP {a.sp} ({a.location ?? 'Body'})
                                                </Typography>
                                            ))}
                                        </Stack>
                                    </Grid>
                                )}

                                {/* Weapons */}
                                {edited.weapons.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: colors.neons.pink.default,
                                                fontWeight: 'bold',
                                                mb: 0.5,
                                                mt: 1,
                                            }}
                                        >
                                            WEAPONS
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {edited.weapons.map((w, i) => (
                                                <Typography
                                                    key={i}
                                                    variant="body2"
                                                    sx={{ color: readerMode ? '#555' : colors.grays.gray700 }}
                                                >
                                                    {w.name} — {w.damage} ({w.type})
                                                    {w.isTokenAction && (
                                                        <Chip
                                                            label={t('edgerunners.action')}
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                height: 18,
                                                                fontSize: '0.6rem',
                                                                bgcolor: `${colors.neons.red.default}20`,
                                                                color: colors.neons.red.default,
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                            ))}
                                        </Stack>
                                    </Grid>
                                )}

                                {/* Cyberware */}
                                {edited.cyberware.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: colors.neons.pink.default,
                                                fontWeight: 'bold',
                                                mb: 0.5,
                                                mt: 1,
                                            }}
                                        >
                                            CYBERWARE
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                            {edited.cyberware.map((c, i) => (
                                                <Chip
                                                    key={i}
                                                    label={c.name}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(0,255,255,0.1)',
                                                        color: colors.neons.cyan.default,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    </Grid>
                                )}
                            </Grid>
                        )}

                        {/* === TAB 1: COMBAT === */}
                        {tab === 1 && (
                            <Box>
                                {/* Token Color */}
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                >
                                    TOKEN COLOR
                                </Typography>
                                <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                                    {NEON_COLOR_SWATCHES.map((swatch) => (
                                        <Box
                                            key={swatch.value}
                                            onClick={() => setEdited({ ...edited, tokenColor: swatch.value })}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                bgcolor: `#${swatch.value.toString(16).padStart(6, '0')}`,
                                                cursor: 'pointer',
                                                border:
                                                    tokenColor === swatch.value
                                                        ? `3px solid ${colors.grays.gray000}`
                                                        : '3px solid transparent',
                                                boxShadow:
                                                    tokenColor === swatch.value
                                                        ? `0 0 12px #${swatch.value.toString(16).padStart(6, '0')}`
                                                        : 'none',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.15)',
                                                    boxShadow: `0 0 10px #${swatch.value.toString(16).padStart(6, '0')}80`,
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                                <TextField
                                    label={t('edgerunners.customHex')}
                                    size="small"
                                    value={hexColor}
                                    onChange={(e) => {
                                        const hex = e.target.value.replace('#', '')
                                        if (/^[0-9a-fA-F]{6}$/.test(hex)) {
                                            setEdited({ ...edited, tokenColor: parseInt(hex, 16) })
                                        }
                                    }}
                                    sx={{
                                        mb: 3,
                                        width: 140,
                                        '& .MuiOutlinedInput-root': {
                                            color: colors.grays.gray800,
                                            '& fieldset': { borderColor: `${colors.neons.cyan.default}30` },
                                            '&:hover fieldset': { borderColor: `${colors.neons.cyan.default}60` },
                                            '&.Mui-focused fieldset': { borderColor: colors.neons.cyan.default },
                                        },
                                        '& .MuiInputLabel-root': { color: colors.grays.gray500 },
                                    }}
                                />

                                {/* 2D Image Select */}
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                >
                                    2D IMAGE
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={8}>
                                        <CyberpunkFormControl
                                            readerMode={readerMode}
                                            label={t('combatSim.selectImage')}
                                        >
                                            <Select
                                                value={edited.tokenImageId ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value as string
                                                    setEdited({
                                                        ...edited,
                                                        tokenImageId: val === '' ? undefined : val,
                                                    })
                                                }}
                                                label={t('combatSim.selectImage')}
                                                sx={selectStyle}
                                                renderValue={(selected) => {
                                                    if (!selected) return t('combatSim.noImage')
                                                    const img = images.find((i) => i.id === selected)
                                                    return img ? img.name : t('combatSim.noImage')
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>{t('combatSim.noImage')}</em>
                                                </MenuItem>
                                                {sortedImages.map((img) => (
                                                    <MenuItem key={img.id} value={img.id}>
                                                        {img.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </CyberpunkFormControl>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            component="label"
                                            sx={{
                                                mt: 1,
                                                borderColor: colors.neons.cyan.default,
                                                color: colors.neons.cyan.default,
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 30, 60, 0.6)',
                                                    boxShadow: `0 0 8px ${colors.neons.cyan.default}40`,
                                                },
                                            }}
                                        >
                                            {t('common.uploadImage')}
                                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                        </Button>
                                    </Grid>
                                    <Grid size={4}>
                                        <CyberpunkFormControl
                                            readerMode={readerMode}
                                            label={t('combatSim.tokenImage')}
                                            labelSx={{ top: -25, lineHeight: '1 !important', py: '0 !important' }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    aspectRatio: '1 / 1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0, 0, 0, 0.5)',
                                                    border: `2px solid ${readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'}`,
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {edited.tokenImageId ? (
                                                    <Avatar
                                                        src={resolveImageUrl(edited.tokenImageId)}
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
                                                        sx={{ bgcolor: 'transparent', width: '100%', height: '100%' }}
                                                    />
                                                ) : (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray200
                                                                : colors.neons.cyan.default,
                                                            textTransform: 'uppercase',
                                                            fontWeight: 600,
                                                            textAlign: 'center',
                                                            px: 1,
                                                        }}
                                                    >
                                                        {t('common.noImageFound')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CyberpunkFormControl>
                                    </Grid>
                                </Grid>

                                {/* 3D Model Select */}
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                >
                                    3D MODEL
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={8}>
                                        <CyberpunkFormControl
                                            readerMode={readerMode}
                                            label={t('combatSim.tokenModel') ?? '3D Model'}
                                        >
                                            <Select
                                                value={edited.tokenModelId ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value as string
                                                    setEdited({
                                                        ...edited,
                                                        tokenModelId: val === '' ? undefined : val,
                                                    })
                                                }}
                                                displayEmpty
                                                sx={selectStyle}
                                            >
                                                {modelOptions.map((opt) => (
                                                    <MenuItem key={opt.value || 'random'} value={opt.value}>
                                                        {opt.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </CyberpunkFormControl>
                                    </Grid>
                                    <Grid size={4}>
                                        <CyberpunkFormControl
                                            readerMode={readerMode}
                                            label={t('combatSim.tokenModel') ?? '3D Model'}
                                            labelSx={{ top: -25, lineHeight: '1 !important', py: '0 !important' }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    aspectRatio: '1 / 1',
                                                    borderRadius: '4px',
                                                    border: `2px solid ${readerMode ? colors.grays.gray800 : colors.neons.cyan.default + '80'}`,
                                                    bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0,0,0,0.6)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {edited.tokenModelId && modelViewerReady ? (
                                                    <model-viewer
                                                        src={edited.tokenModelId}
                                                        style={{ width: '100%', height: '100%' }}
                                                        camera-controls
                                                        disable-zoom
                                                        interaction-prompt="none"
                                                        autoplay
                                                        exposure="1"
                                                        shadow-intensity="0.5"
                                                        camera-orbit="0deg 65deg auto"
                                                        auto-rotate
                                                    />
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray200
                                                                : colors.neons.cyan.default,
                                                            textTransform: 'uppercase',
                                                            fontWeight: 600,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            px: 1,
                                                        }}
                                                    >
                                                        {modelOptions[0]?.label ?? 'Aleatorio'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CyberpunkFormControl>
                                    </Grid>
                                </Grid>

                                {/* Weapon Action Checkboxes */}
                                {edited.weapons.length > 0 && (
                                    <>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                        >
                                            WEAPON ACTIONS
                                        </Typography>
                                        <Stack spacing={0.5} mb={2}>
                                            {edited.weapons.map((w, i) => (
                                                <Stack key={i} direction="row" alignItems="center" spacing={1}>
                                                    <Tooltip disableInteractive title={t('edgerunners.combatAction')} arrow>
                                                        <Checkbox
                                                            size="small"
                                                            checked={w.isTokenAction ?? false}
                                                            onChange={() =>
                                                                setEdited({
                                                                    ...edited,
                                                                    weapons: edited.weapons.map((ww, j) =>
                                                                        j === i
                                                                            ? {
                                                                                  ...ww,
                                                                                  isTokenAction: !ww.isTokenAction,
                                                                              }
                                                                            : ww
                                                                    ),
                                                                })
                                                            }
                                                            sx={{
                                                                color: colors.neons.red.default,
                                                                '&.Mui-checked': { color: colors.neons.red.default },
                                                                p: 0.25,
                                                            }}
                                                        />
                                                    </Tooltip>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: readerMode ? '#555' : colors.grays.gray700 }}
                                                    >
                                                        {w.name} — {w.damage} ({w.type})
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </>
                                )}

                                {/* Skill Action Checkboxes */}
                                {edited.skills.filter((s) => s.level > 0).length > 0 && (
                                    <>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                        >
                                            SKILL ACTIONS
                                        </Typography>
                                        <Stack spacing={0.5} mb={2}>
                                            {edited.skills
                                                .filter((s) => s.level > 0)
                                                .map((s) => (
                                                    <Stack
                                                        key={s.skill.name}
                                                        direction="row"
                                                        alignItems="center"
                                                        spacing={1}
                                                    >
                                                        <Tooltip disableInteractive title={t('edgerunners.combatAction')} arrow>
                                                            <Checkbox
                                                                size="small"
                                                                checked={s.isTokenAction ?? false}
                                                                onChange={() =>
                                                                    setEdited({
                                                                        ...edited,
                                                                        skills: edited.skills.map((ss) =>
                                                                            ss.skill.name === s.skill.name
                                                                                ? {
                                                                                      ...ss,
                                                                                      isTokenAction: !ss.isTokenAction,
                                                                                  }
                                                                                : ss
                                                                        ),
                                                                    })
                                                                }
                                                                sx={{
                                                                    color: colors.neons.red.default,
                                                                    '&.Mui-checked': {
                                                                        color: colors.neons.red.default,
                                                                    },
                                                                    p: 0.25,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ color: readerMode ? '#555' : colors.grays.gray700 }}
                                                        >
                                                            {s.skill.name} (Lv {s.level} + {edited.stats[s.skill.stat]}{' '}
                                                            {s.skill.stat})
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                        </Stack>
                                    </>
                                )}

                                {/* Token Preview */}
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                >
                                    TOKEN PREVIEW
                                </Typography>
                                <Stack direction="row" spacing={3} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            bgcolor: hexColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            boxShadow: `0 0 16px ${hexColor}80`,
                                            border: `2px solid ${hexColor}`,
                                        }}
                                    >
                                        {edited.tokenImageId ? (
                                            <img
                                                src={resolveImageUrl(edited.tokenImageId) || ''}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Typography sx={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                                                {(edited.handle || edited.name).charAt(0).toUpperCase()}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box>
                                        <Typography
                                            sx={{
                                                color: readerMode ? '#333' : colors.grays.gray800,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {edited.handle || edited.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: colors.grays.gray500 }}>
                                            HP: {edited.derivedStats.HP} | MOV: {edited.stats.MOVE} | Init:{' '}
                                            {edited.stats.REF}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                </CustomScrollbar>
            </DialogContent>

            <DialogActions sx={{ borderTop: `1px solid ${colors.neons.cyan.default}40`, p: 2 }}>
                <Button onClick={handleClose} sx={{ color: colors.grays.gray600 }}>
                    {t('common.close')}
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{
                        bgcolor: colors.neons.cyan.default,
                        color: '#000',
                        fontWeight: 'bold',
                        '&:hover': {
                            bgcolor: colors.neons.cyan.light,
                            boxShadow: `0 0 12px ${colors.neons.cyan.default}`,
                        },
                    }}
                >
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default EdgerunnerDetailDialog
