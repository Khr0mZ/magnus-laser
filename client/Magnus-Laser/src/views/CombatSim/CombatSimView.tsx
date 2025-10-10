import { Carpenter, Construction, FitScreen } from '@mui/icons-material'
import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import Menu from '@mui/icons-material/Menu'
import MenuOpen from '@mui/icons-material/MenuOpen'
import Straighten from '@mui/icons-material/Straighten'
import {
    Box,
    Button,
    Container,
    Dialog,
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
import CyberpunkCheckbox from '../../components/CyberpunkCheckbox'
import CyberpunkFormControlLabel from '../../components/CyberpunkFormControlLabel'
import GenerateButton from '../../components/GenerateButton'
import StorageBanner from '../../components/StorageBanner'
import { WarningDialog } from '../../components/common/WarningDialog'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { randomNPCs } from '../../utils/generators/npc/npcs'
import InitiativePanel from './InitiativePanel'
import PixiBoard from './PixiBoard'
import RollHistoryPanel from './RollHistoryPanel'
import TokenDetailsDialog from './TokenDetailsDialog'
import TokenPanel from './TokenPanel'
import { db } from './db'
import { rollD10WithSpecial, rollDamage, rollToHit, type RollResult, type RollType } from './diceUtils'
import type { BoardMap, Image, Map as MapType, RollHistoryEntry, Token, Wall } from './types'

async function fileToImage(file: globalThis.File): Promise<globalThis.HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error)
        reader.onload = () => {
            const img = new globalThis.Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = String(reader.result)
        }
        reader.readAsDataURL(file)
    })
}

async function blobToImage(blob: Blob): Promise<globalThis.HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob)
        const img = new (globalThis.Image as typeof globalThis.Image)()
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
    const [tokens, setTokens] = useState<Token[]>([])
    const [tokensNotInMap, setTokensNotInMap] = useState<Token[]>([])
    const [mapTexture, setMapTexture] = useState<Texture | null>(null)
    const [maps, setMaps] = useState<MapType[]>([])
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
    const [deleteMapDialogOpen, setDeleteMapDialogOpen] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteTokenDialogOpen, setDeleteTokenDialogOpen] = useState<string | null>(null)
    const [deleteAllWallsDialogOpen, setDeleteAllWallsDialogOpen] = useState(false)
    const [fullscreenImage, setFullscreenImage] = useState<string>('')
    const paperRef = useRef<HTMLDivElement | null>(null)
    const [gridColorAnchor, setGridColorAnchor] = useState<HTMLElement | null>(null)
    const [wallColorAnchor, setWallColorAnchor] = useState<HTMLElement | null>(null)
    const [tokenDialogOpen, setTokenDialogOpen] = useState<string>()
    const [tokenClipboard, setTokenClipboard] = useState<Token | null>(null)

    // Initiative and combat state
    const [isTokenPanelOpen, setIsTokenPanelOpen] = useState(false)
    const [isInitiativePanelOpen, setIsInitiativePanelOpen] = useState(false)
    const [activeTokenId, setActiveTokenId] = useState<string | null>(null)
    const [initiativeRolls, setInitiativeRolls] = useState<Map<string, number>>(new Map())
    const [currentRound, setCurrentRound] = useState(1)
    const [autoRerollInitiative, setAutoRerollInitiative] = useState(false)
    const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([])
    const [isRollHistoryOpen, setIsRollHistoryOpen] = useState(false)
    const [isCombatActive, setIsCombatActive] = useState(false)

    const half = gridSize / 2
    // Default tokens (not persisted, reset on reload)
    const [defaultTokens, setDefaultTokens] = useState<Token[]>(() => {
        return [
            {
                id: 'EASY',
                mapId: '',
                x: half,
                y: half,
                radius: half,
                color: 0x00ff00,
                stats: randomNPCs.EASY,
                name: 'Easy',
            },
            {
                id: 'TYPICAL',
                mapId: '',
                x: half,
                y: half,
                radius: half,
                color: 0xffff00,
                stats: randomNPCs.TYPICAL,
                name: 'Typical',
            },
            {
                id: 'DANGEROUS',
                mapId: '',
                x: half,
                y: half,
                radius: half,
                color: 0xff0000,
                stats: randomNPCs.DANGEROUS,
                name: 'Dangerous',
            },
            {
                id: 'DEADLY',
                mapId: '',
                x: half,
                y: half,
                radius: half,
                color: 0xff00ff,
                stats: randomNPCs.DEADLY,
                name: 'Deadly',
            },
        ]
    })
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

    const hexToPixi = (hex: string) => Number(`0x${hex.replace('#', '')}`)
    const pixiToCss = (color: number) => `#${color.toString(16).padStart(6, '0')}`
    const resolveImageUrl = (imageId: string | undefined, images: Image[]): string | undefined => {
        if (!imageId) return undefined
        // If it starts with '/', it's a default image path
        if (imageId.startsWith('/')) return imageId
        // Otherwise, it's an image ID, find the corresponding blob URL
        const image = images.find((img) => img.id === imageId)
        return image ? URL.createObjectURL(image.blob) : undefined
    }
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
                    const candidate: MapType = {
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
            const tksNotInMap = await db.tokens.where('mapId').notEqual(activeKey).toArray()
            setTokensNotInMap(tksNotInMap)
            const ws = await db.walls.where('mapId').equals(activeKey).toArray()
            setWalls(ws)
            // map
            if (map.mapId) {
                const m = await db.maps.get(map.mapId)
                if (m) {
                    const img = await blobToImage(m.blob)
                    const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
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

    // Dice rolling and combat helpers
    const addToRollHistory = (token: Token, rollType: RollType, result: RollResult, damageResult?: RollResult) => {
        const entry: RollHistoryEntry = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            timestamp: Date.now(),
            tokenId: token.id,
            tokenName: token.name,
            rollType,
            result,
            damageResult,
        }
        setRollHistory((prev) => {
            const newHistory = [entry, ...prev]
            // Keep only last 100 entries
            return newHistory.slice(0, 100)
        })
    }

    const rollInitiative = (token: Token): number => {
        const { value } = rollD10WithSpecial()
        return value + (token.stats?.initiative ?? 0)
    }

    const rollAllInitiatives = () => {
        const newRolls = new Map<string, number>()
        tokens.forEach((token) => {
            const initiative = rollInitiative(token)
            newRolls.set(token.id, initiative)

            // Add to roll history
            const initiativeMod = token.stats?.initiative ?? 0
            const { value, fumble, critical, rolls } = rollD10WithSpecial()
            addToRollHistory(token, 'initiative', {
                total: value + initiativeMod,
                rolls,
                fumble,
                critical,
                breakdown: `${value}${fumble ? ' (fumble)' : critical ? ' (critical)' : ''} + ${initiativeMod}`,
            })
        })
        setInitiativeRolls(newRolls)
    }

    const handleMeleeAttack = (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const hitResult = rollToHit(combat)

        const diceCount = token.stats?.weapons?.melee?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        addToRollHistory(token, 'melee-hit', hitResult, damageResult)
    }

    const handleRangedAttack = (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const hitResult = rollToHit(combat)

        const diceCount = token.stats?.weapons?.ranged?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        addToRollHistory(token, 'ranged-hit', hitResult, damageResult)
    }

    const handleSkillCheck = (token: Token) => {
        const skills = token.stats?.skills ?? 0
        const result = rollToHit(skills)

        addToRollHistory(token, 'skill', result)
    }

    const handleUpdateTokenCurrent = async (tokenId: string, field: 'health' | 'sph' | 'spb', value: number) => {
        setTokens((prev) =>
            prev.map((t) => {
                if (t.id !== tokenId || !t.stats) return t
                if (field === 'health') {
                    return { ...t, stats: { ...t.stats, currentHealth: value } }
                } else if (field === 'sph') {
                    return {
                        ...t,
                        stats: { ...t.stats, armor: { ...t.stats.armor, currentSph: value } },
                    }
                } else {
                    return {
                        ...t,
                        stats: { ...t.stats, armor: { ...t.stats.armor, currentSpb: value } },
                    }
                }
            })
        )

        // Update in database
        const token = tokens.find((t) => t.id === tokenId)
        if (token && token.stats) {
            if (field === 'health') {
                await db.tokens.update(tokenId, { stats: { ...token.stats, currentHealth: value } })
            } else if (field === 'sph') {
                await db.tokens.update(tokenId, {
                    stats: { ...token.stats, armor: { ...token.stats.armor, currentSph: value } },
                })
            } else {
                await db.tokens.update(tokenId, {
                    stats: { ...token.stats, armor: { ...token.stats.armor, currentSpb: value } },
                })
            }
        }

        setIsSaving(true)
    }

    const handleNextTurn = () => {
        // Show toast notification (could use a snackbar library)
        console.log(t('combatSim.roundComplete', { round: currentRound }))

        // Increment round
        setCurrentRound((prev) => prev + 1)

        // Reroll if enabled
        if (autoRerollInitiative) {
            rollAllInitiatives()
        }

        // Set to first token
        const sorted = [...tokens].sort((a, b) => (initiativeRolls.get(b.id) ?? 0) - (initiativeRolls.get(a.id) ?? 0))
        if (sorted.length > 0) {
            setActiveTokenId(sorted[0].id)
        }
    }

    const handleResetCombat = () => {
        setCurrentRound(1)
        setActiveTokenId(null)
        rollAllInitiatives()
    }

    const handleToggleCombat = () => {
        if (!isCombatActive) {
            // Starting combat - roll initiatives
            if (tokens.length > 0) {
                rollAllInitiatives()
                // Set first token as active after a brief delay to ensure rolls are set
                setTimeout(() => {
                    setInitiativeRolls((currentRolls) => {
                        const sorted = [...tokens].sort(
                            (a, b) => (currentRolls.get(b.id) ?? 0) - (currentRolls.get(a.id) ?? 0)
                        )
                        if (sorted.length > 0) {
                            setActiveTokenId(sorted[0].id)
                        }
                        return currentRolls
                    })
                }, 50)
            }
        } else {
            // Stopping combat - clear active token and initiatives
            setActiveTokenId(null)
            setInitiativeRolls(new Map())
            setCurrentRound(1)
        }
        setIsCombatActive(!isCombatActive)
    }

    const onResetView = async () => {
        if (!currentMap) {
            fitRef.current?.()
            return
        }
        await db.tokens.where('mapId').equals(getActiveMapKey()).delete()
        setTokens([])
        const tksNotInMap = await db.tokens.toArray()
        setTokensNotInMap(tksNotInMap)
        setIsSaving(true)
    }

    const onUploadMap = async (file: globalThis.File) => {
        const img = await fileToImage(file)
        const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
        setMapTexture(texture)
        if (!currentMap) return
        const map: MapType = {
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

    const onUploadImage = async (file: globalThis.File) => {
        try {
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
        } catch (error) {
            console.error('Error uploading image:', error)
        }
    }

    const onSelectMap = async (id: string) => {
        if (!currentMap) return
        await db.boardMaps.update(currentMap.id, { mapId: id })
        setCurrentMap({ ...currentMap, mapId: id })
        const key = id || currentMap.id
        const tks = await db.tokens.where('mapId').equals(key).toArray()
        setTokens(tks)
        const tksNotInMap = await db.tokens.where('mapId').notEqual(key).toArray()
        setTokensNotInMap(tksNotInMap)
        const ws = await db.walls.where('mapId').equals(key).toArray()
        setWalls(ws)
        const map = await db.maps.get(id)
        if (!map) return
        const img = await blobToImage(map.blob)
        const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
        setMapTexture(texture)
        setGridSize(map.gridSize)
        setSnapToGrid(map.snapToGrid)
        setGridColorHex(map.gridColorHex)
        setGridAlpha(map.gridAlpha)
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
        const tksNotInMap = await db.tokens.toArray()
        setTokensNotInMap(tksNotInMap)
        setIsSaving(true)
    }

    const onDeleteToken = async () => {
        if (!deleteTokenDialogOpen) return

        // Remove from both tokens and tokensNotInMap
        setTokens((prev) => prev.filter((t) => t.id !== deleteTokenDialogOpen))
        setTokensNotInMap((prev) => prev.filter((t) => t.id !== deleteTokenDialogOpen))

        await db.tokens.delete(deleteTokenDialogOpen)
        setDeleteTokenDialogOpen(null)
        setIsSaving(true)
    }

    const onDeleteAllWalls = async () => {
        setWalls([])
        await db.transaction('rw', db.walls, async () => {
            await db.walls.where('mapId').equals(getActiveMapKey()).delete()
        })
        setDeleteAllWallsDialogOpen(false)
        setIsSaving(true)
    }

    const toggleFullscreenImage = (image: string) => {
        setFullscreenImage(image)
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

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('combatSim.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    }}
                >
                    {t('combatSim.title')}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                        textShadow: `0 0 8px ${colors.neons.green.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t(`modules.${ModuleTypes.COMBAT_SIM}_DESCRIPTION`)}
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
                            onClick={() => {
                                setDeleteMapDialogOpen(true)
                            }}
                            disabled={maps.find((m) => m.id === currentMap?.mapId)?.name === 'Empty Map'}
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

            <Paper
                sx={{
                    p: 0,
                    height: 'calc(100vh - 170px)',
                    width: '100%',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    position: 'relative',
                    display: 'flex',
                    overflow: 'hidden',
                }}
                ref={paperRef}
            >
                {/* Left panels - can show both simultaneously */}
                {isTokenPanelOpen && (
                    <TokenPanel
                        isSidePanelOpen={isSidePanelOpen && isTokenPanelOpen}
                        images={images}
                        setTokenDialogOpen={setTokenDialogOpen}
                        getActiveMapKey={getActiveMapKey}
                        setTokens={setTokens}
                        setIsSaving={setIsSaving}
                        pixiToCss={pixiToCss}
                        resolveImageUrl={resolveImageUrl}
                        gridSize={gridSize}
                        tokens={tokens}
                        tokensNotInMap={tokensNotInMap}
                        defaultTokens={defaultTokens}
                        onTokenDelete={(id) => setDeleteTokenDialogOpen(id)}
                        onTokenDuplicate={async (id) => {
                            const token = [...defaultTokens, ...tokens, ...tokensNotInMap].find((t) => t.id === id)
                            if (token) {
                                // Check if it's a default token to apply numbering
                                const isDefaultToken = defaultTokens.some((t) => t.id === id)
                                let newName = token.name

                                if (isDefaultToken) {
                                    // Count existing copies with the same base name
                                    const baseName = token.name
                                    const existingCopies = [...tokens, ...tokensNotInMap].filter((t) => {
                                        return t.name.startsWith(baseName + ' ') || t.name === baseName
                                    })
                                    const copyNumber = existingCopies.length + 1
                                    newName = `${baseName} ${copyNumber}`
                                }

                                const newToken: Token = {
                                    ...token,
                                    name: newName,
                                    radius: gridSize / 2,
                                    id: globalThis.crypto?.randomUUID
                                        ? globalThis.crypto.randomUUID()
                                        : String(Date.now()),
                                    mapId: getActiveMapKey(),
                                    // Keep same position as original token
                                }
                                await db.tokens.add(newToken)
                                setTokens((prev) => [...prev, newToken])
                                setIsSaving(true)
                            }
                        }}
                        onTokenCut={async (id) => {
                            // Check in both tokens and tokensNotInMap
                            const tokenInMap = tokens.find((t) => t.id === id)
                            const tokenNotInMap = tokensNotInMap.find((t) => t.id === id)
                            const token = tokenInMap || tokenNotInMap
                            if (token) {
                                const newToken: Token = {
                                    ...token,
                                    radius: gridSize / 2,
                                }
                                setTokenClipboard(newToken)
                                // Cut removes the token but stores it in clipboard
                                if (tokenInMap) {
                                    setTokens((prev) => prev.filter((t) => t.id !== id))
                                } else {
                                    setTokensNotInMap((prev) => prev.filter((t) => t.id !== id))
                                }
                                await db.tokens.delete(id)
                                setIsSaving(true)
                            }
                        }}
                        onTokenCopy={(id) => {
                            const token = [...defaultTokens, ...tokens, ...tokensNotInMap].find((t) => t.id === id)
                            if (token) {
                                // Check if it's a default token to apply numbering
                                const isDefaultToken = defaultTokens.some((t) => t.id === id)
                                let newName = token.name + ' (Copy)'

                                if (isDefaultToken) {
                                    // Count existing copies with the same base name
                                    const baseName = token.name
                                    const existingCopies = [...tokens, ...tokensNotInMap].filter((t) => {
                                        return t.name.startsWith(baseName + ' ') || t.name === baseName
                                    })
                                    const copyNumber = existingCopies.length + 1
                                    newName = `${baseName} ${copyNumber}`
                                }

                                // Create a copy with new ID for clipboard
                                const clipboardToken = {
                                    ...token,
                                    name: newName,
                                    radius: gridSize / 2,
                                    id: globalThis.crypto?.randomUUID
                                        ? globalThis.crypto.randomUUID()
                                        : String(Date.now()),
                                }
                                setTokenClipboard(clipboardToken)
                            }
                        }}
                    />
                )}

                {isInitiativePanelOpen && (
                    <InitiativePanel
                        isSidePanelOpen={isSidePanelOpen && isInitiativePanelOpen}
                        tokens={tokens}
                        initiativeRolls={initiativeRolls}
                        activeTokenId={activeTokenId}
                        currentRound={currentRound}
                        autoRerollInitiative={autoRerollInitiative}
                        onSetAutoReroll={setAutoRerollInitiative}
                        onTokenClick={setActiveTokenId}
                        onNextTurn={handleNextTurn}
                        onResetCombat={handleResetCombat}
                        onUpdateTokenCurrent={handleUpdateTokenCurrent}
                        onMeleeAttack={handleMeleeAttack}
                        onRangedAttack={handleRangedAttack}
                        onSkillCheck={handleSkillCheck}
                        images={images}
                        resolveImageUrl={resolveImageUrl}
                        pixiToCss={pixiToCss}
                        isCombatActive={isCombatActive}
                        onToggleCombat={handleToggleCombat}
                    />
                )}

                {isRollHistoryOpen && (
                    <RollHistoryPanel
                        isOpen={isSidePanelOpen && isRollHistoryOpen}
                        rollHistory={rollHistory}
                        onClear={() => setRollHistory([])}
                    />
                )}

                {/* Pixi board */}
                <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <PixiBoard
                        tokenClipboard={tokenClipboard}
                        width={dimensions.width}
                        height={dimensions.height}
                        gridSize={gridSize}
                        snapToGrid={snapToGrid}
                        isMeasuring={isMeasuring}
                        isWallMode={isWallMode}
                        isErasingWalls={isErasingWalls}
                        mapKey={getActiveMapKey()}
                        walls={walls}
                        onWallsChange={async (updated: Wall[], mapKey: string) => {
                            setWalls(updated)
                            if (!mapKey) return
                            await db.transaction('rw', db.walls, async () => {
                                await db.walls.where('mapId').equals(mapKey).delete()
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
                        images={images}
                        onTokenMove={async (id, x, y) => {
                            setTokens((prev) => prev.map((tk) => (tk.id === id ? { ...tk, x, y } : tk)))
                            await db.tokens.update(id, { x, y })
                        }}
                        gridColor={hexToPixi(gridColorHex)}
                        gridAlpha={gridAlpha}
                        wallColor={hexToPixi(wallColorHex)}
                        wallAlpha={wallAlpha}
                        onTokenClick={(id) => setTokenDialogOpen(id)}
                        onTokenDelete={(id) => setDeleteTokenDialogOpen(id)}
                        onTokenDuplicate={async (id) => {
                            const token = tokens.find((t) => t.id === id)
                            if (token) {
                                const newToken = {
                                    ...token,
                                    name: token.name + ' (Copy)',
                                    id: globalThis.crypto?.randomUUID
                                        ? globalThis.crypto.randomUUID()
                                        : String(Date.now()),
                                    // Keep same position as original token
                                }
                                await db.tokens.add(newToken)
                                setTokens((prev) => [...prev, newToken])
                                setIsSaving(true)
                            }
                        }}
                        onTokenCut={async (id) => {
                            const token = tokens.find((t) => t.id === id)
                            if (token) {
                                // Cut removes the token but stores it in clipboard
                                setTokens((prev) => prev.filter((t) => t.id !== id))
                                await db.tokens.delete(id)
                                setIsSaving(true)
                            }
                        }}
                        onTokenCopy={(id) => {
                            const token = tokens.find((t) => t.id === id)
                            if (token) {
                                // Create a copy with new ID for clipboard
                                const clipboardToken = {
                                    ...token,
                                    name: token.name + ' (Copy)',
                                    id: globalThis.crypto?.randomUUID
                                        ? globalThis.crypto.randomUUID()
                                        : String(Date.now()),
                                }
                                setTokenClipboard(clipboardToken)
                            }
                        }}
                        onMapDeleteAllTokens={() => setClearAllDialogOpen(true)}
                        onMapDeleteAllWalls={() => setDeleteAllWallsDialogOpen(true)}
                        onMapPasteToken={async (token) => {
                            const newToken: Token = {
                                ...token,
                                radius: gridSize / 2,
                                mapId: getActiveMapKey(),
                            }
                            await db.tokens.add(newToken)
                            setTokens((prev) => [...prev, token])
                            setIsSaving(true)
                        }}
                        activeTokenId={activeTokenId}
                    />
                    {/* Debug info */}
                    {mapTexture && (
                        <Typography
                            sx={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                fontSize: 10,
                                opacity: readerMode ? 0.9 : 0.6,
                                color: readerMode ? colors.grays.gray900 : colors.neons.cyan.default,
                                userSelect: 'none',
                            }}
                        >
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
                        onClick={() => {
                            setIsSidePanelOpen((v) => {
                                const newValue = !v
                                // Close all panels when closing the side panel
                                if (!newValue) {
                                    setIsTokenPanelOpen(false)
                                    setIsInitiativePanelOpen(false)
                                    setIsRollHistoryOpen(false)
                                }
                                return newValue
                            })
                        }}
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

                    {/* Panel mode toggle buttons (when panel is open) */}
                    {isSidePanelOpen && (
                        <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                                position: 'absolute',
                                top: 10,
                                left: 52,
                            }}
                        >
                            <Box
                                onClick={() => {
                                    setIsTokenPanelOpen((v) => !v)
                                    if (!isSidePanelOpen) setIsSidePanelOpen(true)
                                }}
                                sx={{
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isTokenPanelOpen
                                        ? 'rgba(255, 0, 255, 0.3)'
                                        : readerMode
                                        ? 'rgba(0, 0, 40, 0.7)'
                                        : 'rgba(0, 0, 40, 0.6)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${
                                        isTokenPanelOpen ? colors.neons.pink.default : colors.neons.blue.default
                                    }60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.pink.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                                    },
                                }}
                                title={t('combatSim.tokensPanel')}
                            >
                                <Box
                                    sx={{
                                        fontSize: '20px',
                                        color: isTokenPanelOpen ? colors.neons.pink.default : colors.neons.blue.default,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            scale: 1.5,
                                        },
                                    }}
                                >
                                    👨‍🎤
                                </Box>
                            </Box>
                            <Box
                                onClick={() => {
                                    setIsInitiativePanelOpen((v) => !v)
                                    if (!isSidePanelOpen) setIsSidePanelOpen(true)
                                }}
                                sx={{
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isInitiativePanelOpen
                                        ? 'rgba(255, 0, 255, 0.3)'
                                        : readerMode
                                        ? 'rgba(0, 0, 40, 0.7)'
                                        : 'rgba(0, 0, 40, 0.6)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${
                                        isInitiativePanelOpen ? colors.neons.pink.default : colors.neons.blue.default
                                    }60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.pink.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                                    },
                                }}
                                title={t('combatSim.initiativePanel')}
                            >
                                <Box
                                    sx={{
                                        fontSize: '20px',
                                        color: isInitiativePanelOpen
                                            ? colors.neons.pink.default
                                            : colors.neons.blue.default,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            scale: 1.5,
                                        },
                                    }}
                                >
                                    ⚔️
                                </Box>
                            </Box>
                            {/* Roll History toggle button (independent of other panels) */}
                            <Box
                                onClick={() => setIsRollHistoryOpen((v) => !v)}
                                sx={{
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isRollHistoryOpen
                                        ? 'rgba(255, 0, 255, 0.3)'
                                        : readerMode
                                        ? 'rgba(0, 0, 40, 0.7)'
                                        : 'rgba(0, 0, 40, 0.6)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${
                                        isRollHistoryOpen ? colors.neons.pink.default : colors.neons.blue.default
                                    }60`,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                        border: `1px solid ${colors.neons.pink.default}60`,
                                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                                    },
                                }}
                                title={t('combatSim.rollHistory')}
                            >
                                <Box
                                    sx={{
                                        fontSize: '20px',
                                        color: isRollHistoryOpen
                                            ? colors.neons.pink.default
                                            : colors.neons.blue.default,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            scale: 1.5,
                                        },
                                    }}
                                >
                                    🎲
                                </Box>
                            </Box>
                        </Stack>
                    )}

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
                            sx={{
                                position: 'absolute',
                                top: 52,
                                right: 10,
                            }}
                        >
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation()
                                    cancelAllRef.current?.()
                                }}
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
                                onClick={(e) => {
                                    e.stopPropagation()
                                    acceptAllRef.current?.()
                                }}
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
                open={deleteMapDialogOpen}
                onClose={() => setDeleteMapDialogOpen(false)}
                onConfirm={() => {
                    onDeleteMap().then(() => {
                        setDeleteMapDialogOpen(false)
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
            <WarningDialog
                open={deleteTokenDialogOpen !== null}
                onClose={() => setDeleteTokenDialogOpen(null)}
                onConfirm={() => {
                    onDeleteToken().then(() => {
                        setDeleteTokenDialogOpen(null)
                    })
                }}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteConfirmMessage', {
                    type: 'token',
                })}
                moduleType={ModuleTypes.COMBAT_SIM}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={deleteAllWallsDialogOpen}
                onClose={() => setDeleteAllWallsDialogOpen(false)}
                onConfirm={() => {
                    onDeleteAllWalls().then(() => {
                        setDeleteAllWallsDialogOpen(false)
                    })
                }}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: 'walls',
                })}
                moduleType={ModuleTypes.COMBAT_SIM}
                isDelete={true}
                isClearAll={true}
            />

            {/* Token dialog */}
            <TokenDetailsDialog
                maps={sortedMaps}
                tokenDialogOpen={tokenDialogOpen}
                setTokenDialogOpen={setTokenDialogOpen}
                tokens={[...defaultTokens, ...tokens, ...tokensNotInMap]}
                images={images}
                gridSize={gridSize}
                onUpdateToken={async (tokenId, updates) => {
                    // Check if it's a default token
                    const isDefaultToken = defaultTokens.some((t) => t.id === tokenId)

                    if (isDefaultToken) {
                        // Update default token in state only (not persisted)
                        setDefaultTokens((prev) => prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)))
                    } else {
                        // Update regular token in state and database
                        // Try to update in tokens first
                        const isInCurrentMap = tokens.some((t) => t.id === tokenId)
                        if (isInCurrentMap) {
                            setTokens((prev) => prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)))
                            await db.tokens.update(tokenId, updates)
                        } else {
                            // Must be in tokensNotInMap
                            const updatesTyped = updates as Partial<Token>

                            setTokensNotInMap((prev) =>
                                prev.map((t) => {
                                    if (t.id === tokenId) {
                                        // Apply all updates - if mapId is in updates, it will be used
                                        return { ...t, ...updatesTyped }
                                    }
                                    return t
                                })
                            )
                            // Update database with all changes
                            await db.tokens.update(tokenId, updatesTyped)
                        }
                        setIsSaving(true)
                    }
                }}
                onDeleteToken={(id) => setDeleteTokenDialogOpen(id)}
                onUploadImage={onUploadImage}
                toggleFullscreenImage={toggleFullscreenImage}
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

            {/* Fullscreen Image Dialog */}
            <Dialog
                open={fullscreenImage !== ''}
                onClose={() => setFullscreenImage('')}
                maxWidth={false}
                fullScreen
                aria-labelledby="fullscreen-image-title"
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)',
                            overflow: 'hidden',
                            position: 'relative',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                        },
                    },
                }}
                onClick={() => setFullscreenImage('')}
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
                    {fullscreenImage && (
                        <Box
                            component="img"
                            src={fullscreenImage}
                            alt={t('common.itemImageAlt', { name: 'token' })}
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
                    )}
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
                    {t('common.clickToClose')}
                </Typography>
            </Dialog>
        </Container>
    )
}

export default CombatSimView
