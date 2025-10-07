import { Carpenter, Construction, FitScreen } from '@mui/icons-material'
import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import Menu from '@mui/icons-material/Menu'
import MenuOpen from '@mui/icons-material/MenuOpen'
import Straighten from '@mui/icons-material/Straighten'
import {
    Avatar,
    Box,
    Button,
    Container,
    MenuItem,
    Paper,
    Popper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { Colorful } from '@uiw/react-color'
import { Texture } from 'pixi.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton'
import CyberpunkCheckbox from '../../components/CyberpunkCheckbox'
import CyberpunkFormControlLabel from '../../components/CyberpunkFormControlLabel'
import GenerateButton from '../../components/GenerateButton'
import StorageBanner from '../../components/StorageBanner'
import { WarningDialog } from '../../components/common/WarningDialog'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { randomNPCs } from '../../utils/generators/npc/npcs'
import PixiBoard from './PixiBoard'
import { db } from './db'
import { BoardMap, Image, Map, NPC, Token, Wall } from './types'

type DOMFile = globalThis.File
type DOMHTMLImageElement = globalThis.HTMLImageElement
type DOMImage = typeof globalThis.Image

async function fileToImage(file: DOMFile): Promise<DOMHTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error)
        reader.onload = () => {
            const img = new (globalThis.Image as DOMImage)()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = String(reader.result)
        }
        reader.readAsDataURL(file)
    })
}

async function blobToImage(blob: Blob): Promise<DOMHTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob)
        const img = new (globalThis.Image as DOMImage)()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = (e) => {
            URL.revokeObjectURL(url)
            reject(e)
        }
        img.src = url
    })
}

async function createBlankPngBlob(): Promise<Blob> {
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    return await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b ?? new Blob([''], { type: 'image/png' })), 'image/png')
    })
}

const CombatSimView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [gridSize, setGridSize] = useState(0.1)
    const [snapToGrid, setSnapToGrid] = useState(true)
    const [gridColorHex, setGridColorHex] = useState('#ffffff')
    const [gridAlpha, setGridAlpha] = useState(0.5)
    const [wallColorHex, setWallColorHex] = useState('#ff3b81')
    const [wallAlpha, setWallAlpha] = useState(0.95)
    const fitRef = useRef<(() => void) | null>(null)
    const [currentMap, setCurrentMap] = useState<BoardMap | null>(null)
    const [currentImage, setCurrentImage] = useState<Image | null>(null)
    const [tokens, setTokens] = useState<Token[]>([])
    const [mapTexture, setMapTexture] = useState<Texture | null>(null)
    const [maps, setMaps] = useState<Map[]>([])
    const [images, setImages] = useState<Image[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isMeasuring, setIsMeasuring] = useState(false)
    const [isWallMode, setIsWallMode] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [isErasingWalls, setIsErasingWalls] = useState(false)
    const [walls, setWalls] = useState<Wall[]>([])
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const acceptAllRef = useRef<(() => void) | null>(null)
    const cancelAllRef = useRef<(() => void) | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const paperRef = useRef<HTMLDivElement | null>(null)
    const [gridColorAnchor, setGridColorAnchor] = useState<HTMLElement | null>(null)
    const [wallColorAnchor, setWallColorAnchor] = useState<HTMLElement | null>(null)
    const fieldSx = readerMode
        ? {
              '& .MuiOutlinedInput-root': {
                  height: 36.5,
                  color: colors.neons.cyan.dark,
              },
          }
        : {
              '& .MuiOutlinedInput-root': {
                  height: 36.5,
                  color: colors.neons.cyan.default,
              },
          }

    const half = gridSize / 2
    const defaultTokens: Token[] = [
        {
            id: 'EASY',
            mapId: '',
            x: half,
            y: half,
            radius: Math.max(1, Math.floor(half * 0.8)),
            color: 0x00ff00,
            npc: NPC.EASY,
            imageId: undefined,
        },
        {
            id: 'TYPICAL',
            mapId: '',
            x: half,
            y: half,
            radius: Math.max(1, Math.floor(half * 0.8)),
            color: 0xffff00,
            npc: NPC.TYPICAL,
            imageId: undefined,
        },
        {
            id: 'DANGEROUS',
            mapId: '',
            x: half,
            y: half,
            radius: Math.max(1, Math.floor(half * 0.8)),
            color: 0xff0000,
            npc: NPC.DANGEROUS,
            imageId: undefined,
        },
        {
            id: 'DEADLY',
            mapId: '',
            x: half,
            y: half,
            radius: Math.max(1, Math.floor(half * 0.8)),
            color: 0x000000,
            npc: NPC.DEADLY,
            imageId: undefined,
        },
    ]

    const hexToPixi = (hex: string) => Number(`0x${hex.replace('#', '')}`)
    const toAlphaHex = (a: number) =>
        Math.max(0, Math.min(255, Math.round(a * 255)))
            .toString(16)
            .padStart(2, '0')

    // Observe container size
    useEffect(() => {
        const el = paperRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect
            const w = Math.floor(cr.width)
            const h = Math.floor(cr.height)
            if (w > 0 && h > 0 && (w !== dimensions.width || h !== dimensions.height)) {
                setDimensions({ width: w, height: h })
            }
        })
        ro.observe(el)
        const w = el.clientWidth
        const h = el.clientHeight
        if (w > 0 && h > 0 && (w !== dimensions.width || h !== dimensions.height)) {
            setDimensions({ width: w, height: h })
        }
        return () => ro.disconnect()
    }, [])

    // init/load
    useEffect(() => {
        const run = async () => {
            let map = await db.boardMaps.where('name').equals('Default').first()
            if (!map) {
                // create default map
                let defaultMap = await db.maps.where('name').equals('Empty Map').first()
                if (!defaultMap) {
                    const blankBlob = await createBlankPngBlob()
                    const candidate: Map = {
                        id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                        name: 'Empty Map',
                        mimeType: 'image/png',
                        width: 1920,
                        height: 1920,
                        gridSize: 48,
                        snapToGrid: true,
                        gridColorHex: '#000000',
                        gridAlpha: 0.5,
                        blob: blankBlob,
                    }
                    try {
                        await db.maps.add(candidate)
                        defaultMap = candidate
                    } catch {
                        defaultMap = await db.maps.where('name').equals('Empty Map').first()
                    }
                }
                const newBoardMap: BoardMap = {
                    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + 1),
                    name: 'Default',
                    mapId: defaultMap?.id,
                }
                try {
                    await db.boardMaps.add(newBoardMap)
                    map = newBoardMap
                } catch {
                    map = await db.boardMaps.where('name').equals('Default').first()
                }
            }
            if (!map) return
            setCurrentMap(map)
            // maps dropdown
            const allMaps = await db.maps.toArray()
            setMaps(allMaps)
            // tokens and walls
            const activeKey = map.mapId ?? map.id
            const tks = await db.tokens.where('mapId').equals(activeKey).toArray()
            setTokens(tks)
            const ws = await db.walls.where('mapId').equals(activeKey).toArray()
            setWalls(ws)
            // map
            if (map.mapId) {
                const m = await db.maps.get(map.mapId)
                if (m) {
                    const img = await blobToImage(m.blob)
                    const texture = Texture.from(img as unknown as DOMHTMLImageElement)
                    setMapTexture(texture)
                    setGridSize(m.gridSize)
                    setSnapToGrid(m.snapToGrid)
                    setGridColorHex(m.gridColorHex)
                    setGridAlpha(m.gridAlpha)
                }
            }
            // images
            const allImages = await db.images.toArray()
            setImages(allImages)
        }
        run()
    }, [])

    // Persist grid color/alpha
    useEffect(() => {
        const persistGridStyle = async () => {
            if (!currentMap) return
            if (currentMap.mapId) {
                await db.maps.update(currentMap.mapId, {
                    gridColorHex,
                    gridAlpha,
                })
            }
        }
        persistGridStyle()
    }, [gridColorHex, gridAlpha])

    const getActiveMapKey = () => {
        if (!currentMap) return ''
        return currentMap.mapId ?? currentMap.id
    }

    const onAddToken = async () => {
        if (!currentMap) return
        const t: Token = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            mapId: getActiveMapKey(),
            x: half,
            y: half,
            radius: Math.max(1, Math.floor(half * 0.8)),
            color: 0xff3b81,
        }
        await db.tokens.add(t)
        setTokens((prev) => [...prev, t])
        setIsSaving(true)
    }

    const onResetView = async () => {
        if (!currentMap) {
            fitRef.current?.()
            return
        }
        await db.tokens.where('mapId').equals(getActiveMapKey()).delete()
        setTokens([])
        setIsSaving(true)
    }

    const onUploadMap = async (file: DOMFile) => {
        const img = await fileToImage(file)
        const texture = Texture.from(img as unknown as DOMHTMLImageElement)
        setMapTexture(texture)
        if (!currentMap) return
        const map: Map = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            name: file.name,
            mimeType: file.type,
            width: img.width,
            height: img.height,
            gridSize: 50,
            snapToGrid: true,
            gridColorHex: '#000000',
            gridAlpha: 0.5,
            blob: file,
        }
        await db.maps.put(map)
        await db.boardMaps.update(currentMap.id, { mapId: map.id })
        setMaps((prev) => [...prev, map])
        setCurrentMap({ ...currentMap, mapId: map.id })
        const tks = await db.tokens.where('mapId').equals(map.id).toArray()
        setTokens(tks)
        setGridSize(map.gridSize)
        setSnapToGrid(map.snapToGrid)
        setGridColorHex(map.gridColorHex)
        setGridAlpha(map.gridAlpha)
        setIsSaving(true)
    }

    const onUploadImage = async (file: DOMFile) => {
        const img = await fileToImage(file)
        const image: Image = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            name: file.name,
            mimeType: file.type,
            width: img.width,
            height: img.height,
            blob: file,
        }
        await db.images.put(image)
        setImages((prev) => [...prev, image])
        setIsSaving(true)
    }

    const onSelectMap = async (id: string) => {
        if (!currentMap) return
        await db.boardMaps.update(currentMap.id, { mapId: id })
        setCurrentMap({ ...currentMap, mapId: id })
        const key = id || currentMap.id
        const tks = await db.tokens.where('mapId').equals(key).toArray()
        setTokens(tks)
        const ws = await db.walls.where('mapId').equals(key).toArray()
        setWalls(ws)
        const map = await db.maps.get(id)
        if (!map) return
        const img = await blobToImage(map.blob)
        const texture = Texture.from(img as unknown as DOMHTMLImageElement)
        setMapTexture(texture)
        setGridSize(map.gridSize)
        setSnapToGrid(map.snapToGrid)
        setGridColorHex(map.gridColorHex)
        setGridAlpha(map.gridAlpha)
    }

    const onSelectImage = async (id: string) => {
        const image = await db.images.get(id)
        console.log('onSelectImage', id)
        if (id === 'NO_IMAGE') {
            setCurrentImage(null)
            return
        }
        if (!image) return
        setCurrentImage(image)
    }

    // Persist grid size to selected map
    useEffect(() => {
        const persistGridSize = async () => {
            if (!currentMap?.mapId) return
            await db.maps.update(currentMap.mapId, { gridSize })
            setMaps((prev) => prev.map((a) => (a.id === currentMap.mapId ? { ...a, gridSize } : a)))
        }
        persistGridSize()
    }, [gridSize])

    // Persist snapToGrid to selected map
    useEffect(() => {
        const persistSnapToGrid = async () => {
            if (!currentMap?.mapId) return
            await db.maps.update(currentMap.mapId, { snapToGrid })
            setMaps((prev) => prev.map((a) => (a.id === currentMap.mapId ? { ...a, snapToGrid } : a)))
        }
        persistSnapToGrid()
    }, [snapToGrid])

    const onDeleteMap = async () => {
        if (!currentMap?.mapId) return
        const id = currentMap.mapId
        await db.maps.delete(id)
        await db.boardMaps.update(currentMap.id, { mapId: undefined })
        setCurrentMap({ ...currentMap, mapId: undefined })
        setMapTexture(null)
        setMaps((prev) => prev.filter((a) => a.id !== id))
        const tks = await db.tokens.where('mapId').equals(currentMap.id).toArray()
        setTokens(tks)
        setIsSaving(true)
    }

    const sortedMaps = useMemo(() => {
        const arr = [...maps]
        arr.sort((a, b) => {
            const aEmpty = a.name === 'Empty Map'
            const bEmpty = b.name === 'Empty Map'
            if (aEmpty && !bEmpty) return -1
            if (!aEmpty && bEmpty) return 1
            return a.name.localeCompare(b.name)
        })
        return arr
    }, [maps])

    const sortedImages = useMemo(() => {
        const arr = [...images]
        arr.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        return arr
    }, [images])

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Stack direction="row" alignItems="center" spacing={2} mr={1.5}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('combatSim.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('combatSim.title')}
                </Typography>
                <Stack
                    direction="row"
                    sx={{
                        mb: 1,
                        flexWrap: 'wrap-reverse',
                        gap: 1,
                        justifyContent: 'flex-end',
                    }}
                >
                    <GenerateButton
                        isGenerating={false}
                        handleGenerate={() => document.getElementById('combatsim-upload-map')?.click()}
                        label={t('combatSim.addMap')}
                    />
                    <input
                        id="combatsim-upload-map"
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f)
                                onUploadMap(f)
                                // reset value so selecting the same file again still fires change
                            ;(e.target as HTMLInputElement).value = ''
                        }}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            disabled={maps.length === 0}
                            control={
                                <Select
                                    displayEmpty
                                    value={currentMap?.mapId ?? sortedMaps[0]?.id ?? ''}
                                    onChange={(e) => onSelectMap(String(e.target.value))}
                                    sx={{ ml: 1, width: 200, height: 36.5, ...fieldSx }}
                                    slotProps={{
                                        input: {
                                            sx: {
                                                color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default,
                                            },
                                        },
                                    }}
                                >
                                    {sortedMaps
                                        .map((a) => ({ id: a.id, name: a.name }))
                                        .map((a) => (
                                            <MenuItem key={a.id} value={a.id}>
                                                {a.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            }
                            label={t('combatSim.map')}
                            labelPlacement="start"
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                            <CyberpunkFormControlLabel
                                readerMode={readerMode}
                                labelPlacement="start"
                                control={
                                    <TextField
                                        type="number"
                                        slotProps={{
                                            input: {
                                                sx: {
                                                    width: 100,
                                                    '& input[type=number]': {
                                                        MozAppearance: 'textfield',
                                                    },
                                                    '& input[type=number]::-webkit-outer-spin-button': {
                                                        WebkitAppearance: 'none',
                                                        margin: 0,
                                                    },
                                                    '& input[type=number]::-webkit-inner-spin-button': {
                                                        WebkitAppearance: 'none',
                                                        margin: 0,
                                                    },
                                                },
                                            },
                                        }}
                                        value={gridSize}
                                        onChange={(e) => {
                                            let val = parseFloat(e.target.value)
                                            if (e.target.value === '') {
                                                val = 100
                                            }
                                            if (!Number.isNaN(val) && val > 0) setGridSize(val)
                                        }}
                                        sx={{ width: '100%', ...fieldSx }}
                                    />
                                }
                                label={t('combatSim.gridSize')}
                            />
                            <Box
                                onClick={(e) => {
                                    setGridColorAnchor((prev) => (prev ? null : e.currentTarget))
                                }}
                                sx={{
                                    cursor: 'pointer',
                                    height: '24px',
                                    width: '24px',
                                    bgcolor: `${gridColorHex}${toAlphaHex(gridAlpha)}`,
                                    borderRadius: '3px',
                                    border: `1px solid ${readerMode ? colors.neons.cyan.dark : colors.neons.cyan.dark}`,
                                }}
                                title={t('combatSim.gridColor')}
                            />
                            <CyberpunkFormControlLabel
                                readerMode={readerMode}
                                control={
                                    <CyberpunkCheckbox
                                        readerMode={readerMode}
                                        checked={snapToGrid}
                                        onChange={(e) => setSnapToGrid(e.target.checked)}
                                    />
                                }
                                label={t('combatSim.snapToGrid')}
                            />
                        </Stack>
                        <Button
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={!currentMap?.mapId}
                            sx={{
                                minWidth: '30px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '2px',
                                p: 0,
                                bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                border: readerMode ? '1px solid #d32f2f' : `1px solid ${colors.neons.red.default}60`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                position: 'relative',
                                fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                fontWeight: 'bold',
                                opacity: currentMap?.mapId ? 1 : 0.5,
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
                            }}
                        >
                            <Close sx={{ textShadow: `0 0 5px ${colors.neons.red.default}`, zIndex: 2 }} />
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t(`modules.${ModuleTypes.COMBAT_SIM}_DESCRIPTION`)}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <GenerateButton isGenerating={false} handleGenerate={onAddToken} label={t('combatSim.addToken')} />
                </Box>
                <GenerateButton
                    isGenerating={false}
                    handleGenerate={() => document.getElementById('combatsim-upload-image')?.click()}
                    label={t('combatSim.addImage')}
                />
                <input
                    id="combatsim-upload-image"
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onUploadImage(f)
                        ;(e.target as HTMLInputElement).value = ''
                    }}
                />
                <CyberpunkFormControlLabel
                    readerMode={readerMode}
                    disabled={images.length === 0}
                    control={
                        <Select
                            displayEmpty
                            value={currentImage?.id ?? 'NO_IMAGE'}
                            onChange={(e) => onSelectImage(String(e.target.value))}
                            sx={{ ml: 1, width: 200, height: 36.5, ...fieldSx }}
                            slotProps={{
                                input: {
                                    sx: {
                                        color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default,
                                    },
                                },
                            }}
                        >
                            <MenuItem key={null} value={'NO_IMAGE'}>
                                {t('combatSim.noImage')}
                            </MenuItem>
                            {sortedImages
                                .map((a) => ({ id: a.id, name: a.name }))
                                .map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        {a.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    }
                    label={t('combatSim.image')}
                    labelPlacement="start"
                />
                <ClearAllButton handleClearAllClick={() => setClearAllDialogOpen(true)} disabled={false} />
            </Stack>
            <Paper
                sx={{
                    p: 0,
                    height: 'calc(100vh - 252px)',
                    width: '100%',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    position: 'relative',
                    display: 'flex',
                    overflow: 'hidden',
                    filter: readerMode ? 'invert(1) hue-rotate(180deg)' : 'none',
                }}
                ref={paperRef}
            >
                {/* Side panel */}
                <Box
                    sx={{
                        width: isSidePanelOpen ? 260 : 0,
                        flex: '0 0 auto',
                        height: '100%',
                        overflow: 'hidden',
                        transition: 'width 220ms ease',
                        willChange: 'width',
                        borderRight: isSidePanelOpen ? `1px solid ${colors.neons.cyan.dark}` : 'none',
                    }}
                >
                    <Box
                        sx={{
                            width: 260,
                            height: '100%',
                            background: `linear-gradient(0deg, ${colors.neons.pink.default}30, transparent)`,
                            zIndex: 10,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            opacity: isSidePanelOpen ? 1 : 0,
                            transition: 'opacity 220ms ease',
                        }}
                    >
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.tokensPanel')}
                        </Typography>
                        {defaultTokens.map((token) => {
                            return (
                                <Stack
                                    key={token.id}
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{
                                        width: '100%',
                                        height: '32px',
                                        background: `linear-gradient(0deg, ${colors.neons.pink.default}30, transparent)`,
                                        borderRadius: '6px',
                                        p: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                                            boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                                            '&::after': {
                                                opacity: 0.8,
                                                height: '100%',
                                            },
                                        },
                                    }}
                                    onClick={async () => {
                                        const newToken = { ...token, mapId: getActiveMapKey() }
                                        await db.tokens.add(newToken)
                                        setTokens((prev) => [...prev, newToken])
                                        setIsSaving(true)
                                    }}
                                >
                                    <Avatar
                                        key={token.id}
                                        sx={{ width: 32, height: 32, backgroundColor: token.color }}
                                    />
                                    <Typography variant="body1">{randomNPCs[token.npc!].name}</Typography>
                                </Stack>
                            )
                        })}
                    </Box>
                </Box>
                {/* Pixi board */}
                <Box sx={{ position: 'relative', flex: 1 }}>
                    <PixiBoard
                        width={dimensions.width}
                        height={dimensions.height}
                        gridSize={gridSize}
                        snapToGrid={snapToGrid}
                        isMeasuring={isMeasuring}
                        isWallMode={isWallMode}
                        isErasingWalls={isErasingWalls}
                        mapKey={getActiveMapKey()}
                        walls={walls}
                        onWallsChange={async (updated: Wall[]) => {
                            setWalls(updated)
                            const key = updated[0]?.mapId || getActiveMapKey()
                            if (!key) return
                            await db.transaction('rw', db.walls, async () => {
                                await db.walls.where('mapId').equals(key).delete()
                                if (updated.length > 0) {
                                    await db.walls.bulkAdd(updated)
                                }
                            })
                        }}
                        onBindFit={(fn) => {
                            fitRef.current = fn
                        }}
                        onPendingCountChange={(c) => setPendingCount(c)}
                        onBindPendingControls={(acceptAll, cancelAll) => {
                            acceptAllRef.current = acceptAll
                            cancelAllRef.current = cancelAll
                        }}
                        mapTexture={mapTexture}
                        tokens={tokens}
                        onTokenMove={async (id, x, y) => {
                            setTokens((prev) => prev.map((tk) => (tk.id === id ? { ...tk, x, y } : tk)))
                            await db.tokens.update(id, { x, y })
                        }}
                        gridColor={hexToPixi(gridColorHex)}
                        gridAlpha={gridAlpha}
                        wallColor={hexToPixi(wallColorHex)}
                        wallAlpha={wallAlpha}
                    />
                    {/* Debug info */}
                    {mapTexture && (
                        <Typography sx={{ position: 'absolute', top: 10, left: 54, fontSize: 10, opacity: 0.6 }}>
                            Grid{' '}
                            {Intl.NumberFormat('en-GB', { maximumFractionDigits: 5 }).format(
                                mapTexture.width / gridSize
                            )}
                            ×
                            {Intl.NumberFormat('en-GB', { maximumFractionDigits: 5 }).format(
                                mapTexture.height / gridSize
                            )}
                        </Typography>
                    )}
                    {/* Drawer toggle button */}
                    <Box
                        onClick={() => setIsSidePanelOpen((v) => !v)}
                        sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                isSidePanelOpen ? colors.neons.pink.default : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.pink.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                            },
                            '&:hover .drawer-toggle-icon': {
                                color: colors.neons.pink.default,
                            },
                        }}
                        title={isSidePanelOpen ? t('combatSim.closePanel') : t('combatSim.openPanel')}
                    >
                        {isSidePanelOpen ? (
                            <MenuOpen
                                className="drawer-toggle-icon"
                                sx={{
                                    m: '6px',
                                    fontSize: '24px',
                                    lineHeight: '24px',
                                    color: isSidePanelOpen ? colors.neons.pink.default : colors.neons.blue.default,
                                }}
                            />
                        ) : (
                            <Menu
                                className="drawer-toggle-icon"
                                sx={{
                                    m: '6px',
                                    fontSize: '24px',
                                    lineHeight: '24px',
                                    color: colors.neons.blue.default,
                                }}
                            />
                        )}
                    </Box>
                    {/* Fit button */}
                    <Box
                        onClick={() => fitRef.current?.()}
                        sx={{
                            position: 'absolute',
                            top: 52,
                            left: 10,
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${colors.neons.blue.default}60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.pink.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                            },
                            '&:hover .fit-icon': {
                                color: colors.neons.pink.default,
                            },
                        }}
                        title={t('combatSim.fit')}
                    >
                        <FitScreen
                            className="fit-icon"
                            sx={{
                                m: '6px',
                                fontSize: '24px',
                                lineHeight: '24px',
                                color: colors.neons.blue.default,
                            }}
                        />
                    </Box>
                    {/* Measure button */}
                    <Box
                        onClick={() =>
                            setIsMeasuring((v) => {
                                const nv = !v
                                if (nv) {
                                    setIsWallMode(false)
                                    setIsErasingWalls(false)
                                    setWallColorAnchor(null)
                                }
                                return nv
                            })
                        }
                        sx={{
                            position: 'absolute',
                            top: 136,
                            left: 10,
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                isMeasuring ? colors.neons.pink.default : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.pink.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                            },
                            '&:hover .measure-icon': {
                                color: colors.neons.pink.default,
                            },
                        }}
                        title={t('combatSim.measure')}
                    >
                        <Straighten
                            className="measure-icon"
                            sx={{
                                m: '6px',
                                fontSize: '24px',
                                lineHeight: '24px',
                                color: isMeasuring ? colors.neons.pink.default : colors.neons.blue.default,
                            }}
                        />
                    </Box>
                    {/* Wall mode button */}
                    <Box
                        onClick={() => {
                            setIsWallMode((v) => {
                                const nv = !v
                                if (nv) {
                                    setIsMeasuring(false)
                                }
                                if (!nv) {
                                    setIsErasingWalls(false)
                                    setWallColorAnchor(null)
                                }
                                return nv
                            })
                        }}
                        sx={{
                            position: 'absolute',
                            top: 94,
                            left: 10,
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                isWallMode ? colors.neons.green.default : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.green.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                            },
                            '&:hover .wall-mode-icon': {
                                color: colors.neons.green.default,
                            },
                        }}
                        title={t('combatSim.wallMode')}
                    >
                        <Construction
                            className="wall-mode-icon"
                            sx={{
                                m: '6px',
                                fontSize: '24px',
                                lineHeight: '24px',
                                color: isWallMode ? colors.neons.green.default : colors.neons.blue.default,
                            }}
                        />
                    </Box>
                    {/* Eraser & Wall color (visible in wall mode) */}
                    {isWallMode && (
                        <>
                            <Box
                                onClick={() =>
                                    setIsErasingWalls((v) => {
                                        const nv = !v
                                        if (nv) {
                                            setIsWallMode(true)
                                            setIsMeasuring(false)
                                        }
                                        return nv
                                    })
                                }
                                sx={{
                                    position: 'absolute',
                                    top: 94,
                                    left: 54,
                                    width: '36px',
                                    height: '36px',
                                    display: 'block',
                                    backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${
                                        isErasingWalls ? colors.neons.red.default : colors.neons.blue.default
                                    }60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.red.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                    },
                                    '&:hover .wall-eraser-mode-icon': { color: colors.neons.red.default },
                                }}
                                title={t('combatSim.eraser')}
                            >
                                <Carpenter
                                    className="wall-eraser-mode-icon"
                                    sx={{
                                        m: '6px',
                                        fontSize: '24px',
                                        lineHeight: '24px',
                                        color: isErasingWalls ? colors.neons.red.default : colors.neons.blue.default,
                                    }}
                                />
                            </Box>
                            <Box
                                onClick={(e) => {
                                    const anchor = e.currentTarget as HTMLElement
                                    setWallColorAnchor((prev) => (prev ? null : anchor))
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 94,
                                    left: 98,
                                    width: '36px',
                                    height: '36px',
                                    display: 'block',
                                    backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${colors.neons.blue.default}60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.pink.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                                    },
                                }}
                                title={t('combatSim.wallColor')}
                            >
                                <Box
                                    sx={{
                                        m: '8px',
                                        width: '20px',
                                        height: '20px',
                                        bgcolor: `${wallColorHex}${toAlphaHex(wallAlpha)}`,
                                        borderRadius: '3px',
                                        border: '1px solid #0006',
                                    }}
                                />
                            </Box>
                        </>
                    )}
                    {/* Accept & Cancel All Pending */}
                    {pendingCount > 0 && (
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ position: 'absolute', top: 10, right: isSidePanelOpen ? 270 : 10 }}
                        >
                            <Box
                                onClick={() => cancelAllRef.current?.()}
                                sx={{
                                    width: '36px',
                                    height: '36px',
                                    display: 'block',
                                    backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.9)' : 'rgba(0, 0, 40, 0.9)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${colors.neons.blue.default}60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.red.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                    },
                                    '&:hover .pending-btn-icon-cancel': {
                                        color: colors.neons.red.default,
                                    },
                                }}
                                title={t('common.cancelAll')}
                            >
                                <Close
                                    className="pending-btn-icon-cancel"
                                    sx={{
                                        m: '6px',
                                        fontSize: '24px',
                                        lineHeight: '24px',
                                        color: colors.neons.red.default,
                                    }}
                                />
                            </Box>
                            <Box
                                onClick={() => acceptAllRef.current?.()}
                                sx={{
                                    width: '36px',
                                    height: '36px',
                                    display: 'block',
                                    backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.9)' : 'rgba(0, 0, 40, 0.9)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${colors.neons.blue.default}60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.green.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                                    },
                                    '&:hover .pending-btn-icon-accept': {
                                        color: colors.neons.green.default,
                                    },
                                }}
                                title={t('common.acceptAll')}
                            >
                                <Done
                                    className="pending-btn-icon-accept"
                                    sx={{
                                        m: '6px',
                                        fontSize: '24px',
                                        lineHeight: '24px',
                                        color: colors.neons.green.default,
                                    }}
                                />
                            </Box>
                        </Stack>
                    )}
                </Box>
            </Paper>

            {/* Confirmation dialogs */}

            <WarningDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={() => {
                    onDeleteMap().then(() => {
                        setDeleteDialogOpen(false)
                    })
                }}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteConfirmMessage', {
                    type: t(`modules.${ModuleTypes.COMBAT_SIM}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.COMBAT_SIM}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={() => setClearAllDialogOpen(false)}
                onConfirm={() => {
                    onResetView().then(() => {
                        setClearAllDialogOpen(false)
                    })
                }}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: t(`modules.${ModuleTypes.COMBAT_SIM}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.COMBAT_SIM}
                isDelete={true}
                isClearAll={true}
            />

            {/* Grid color picker */}
            <Popper open={Boolean(gridColorAnchor)} anchorEl={gridColorAnchor} placement="bottom" sx={{ zIndex: 1300 }}>
                <Box
                    sx={{
                        bgcolor: readerMode ? '#101010' : '#080808',
                        p: 1,
                        border: `1px solid ${colors.neons.cyan.dark}`,
                        borderRadius: 1,
                    }}
                >
                    <Colorful
                        color={`${gridColorHex}${toAlphaHex(gridAlpha)}`}
                        onChange={(c) => {
                            if (typeof c.hexa === 'string') {
                                const hexa = c.hexa as string
                                const hex = hexa.slice(0, 7)
                                const a = hexa.length === 9 ? parseInt(hexa.slice(7), 16) / 255 : 1
                                setGridColorHex(hex)
                                setGridAlpha(a)
                            } else if (typeof c.hex === 'string') {
                                setGridColorHex(c.hex)
                            }
                        }}
                    />
                </Box>
            </Popper>
            {/* Wall color picker */}
            <Popper open={Boolean(wallColorAnchor)} anchorEl={wallColorAnchor} placement="bottom" sx={{ zIndex: 1300 }}>
                <Box
                    sx={{
                        bgcolor: readerMode ? '#101010' : '#080808',
                        p: 1,
                        border: `1px solid ${colors.neons.cyan.dark}`,
                        borderRadius: 1,
                    }}
                >
                    <Colorful
                        color={`${wallColorHex}${toAlphaHex(wallAlpha)}`}
                        onChange={(c) => {
                            if (typeof c.hexa === 'string') {
                                const hexa = c.hexa as string
                                const hex = hexa.slice(0, 7)
                                const a = hexa.length === 9 ? parseInt(hexa.slice(7), 16) / 255 : 1
                                setWallColorHex(hex)
                                setWallAlpha(a)
                            } else if (typeof c.hex === 'string') {
                                setWallColorHex(c.hex)
                            }
                        }}
                    />
                </Box>
            </Popper>
        </Container>
    )
}

export default CombatSimView
