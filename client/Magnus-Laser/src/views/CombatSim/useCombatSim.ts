import { sendMutation } from '@/sync/combatSimSync'
import { blobToImage, createBlankPngBlob, fileToImage } from '@/views/CombatSim/utils/pixiUtils'
import { Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../../state/sessionStore'
import { db } from '../../utils/db'
import { randomNPCs } from '../../utils/generators/npc/npcs'
import { rollD10WithSpecial, rollDamage, rollToHit } from './utils/diceUtils'
import type {
    Blast,
    BlastType,
    BoardMap,
    Image,
    Map as MapType,
    RollHistoryEntry,
    RollResult,
    RollType,
    Token,
    Wall,
    WallShape,
} from './utils/types'

type ImageUrlCacheEntry = {
    url: string
    size: number
    type: string
}

// Helper functions to extract values from new actions structure

const useCombatSim = () => {
    // Dialogs
    const [deleteAllTokensDialogOpen, setDeleteAllTokensDialogOpen] = useState(false)
    const [deleteAllWallsDialogOpen, setDeleteAllWallsDialogOpen] = useState(false)
    const [deleteAllBlastsDialogOpen, setDeleteAllBlastsDialogOpen] = useState(false)

    // Measure
    const [isMeasuring, setIsMeasuring] = useState(false)

    // Map
    const paperRef = useRef<HTMLDivElement | null>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const fitRef = useRef<(() => void) | null>(null)
    const [currentMap, setCurrentMap] = useState<BoardMap | null>(null)
    const [mapTexture, setMapTexture] = useState<Texture | null>(null)
    const [maps, setMaps] = useState<MapType[]>([])
    const [deleteMapDialogOpen, setDeleteMapDialogOpen] = useState(false)

    // Grid
    const [gridSize, setGridSize] = useState(0.1)
    const prevGridSizeRef = useRef(gridSize)
    const [snapToGrid, setSnapToGrid] = useState(true)
    const [gridColorHex, setGridColorHex] = useState('#ffffff')
    const [gridAlpha, setGridAlpha] = useState(0.5)
    const [gridColorAnchor, setGridColorAnchor] = useState<HTMLElement | null>(null)
    const half = gridSize / 2

    // Tokens
    const [isTokenPanelOpen, setIsTokenPanelOpen] = useState(false)
    const [tokens, setTokens] = useState<Token[]>([])
    const [tokensNotInMap, setTokensNotInMap] = useState<Token[]>([])
    const [tokenDialogsOpen, setTokenDialogsOpen] = useState<string[]>([])
    const [tokenClipboard, setTokenClipboard] = useState<Token[] | null>(null)
    const [deleteTokenDialogOpen, setDeleteTokenDialogOpen] = useState<string | null>(null)
    const [images, setImages] = useState<Image[]>([])
    const [pendingCount, setPendingCount] = useState(0)
    const acceptAllRef = useRef<(() => void) | null>(null)
    const cancelAllRef = useRef<(() => void) | null>(null)
    const [fullscreenImage, setFullscreenImage] = useState<string>('')
    const [defaultTokens, setDefaultTokens] = useState<Token[]>(() => {
        return [
            {
                id: 'EASY',
                mapId: '',
                x: half,
                y: half,
                color: 0x00ff00,
                stats: randomNPCs.EASY,
                name: 'Easy',
            },
            {
                id: 'TYPICAL',
                mapId: '',
                x: half,
                y: half,
                color: 0xffff00,
                stats: randomNPCs.TYPICAL,
                name: 'Typical',
            },
            {
                id: 'DANGEROUS',
                mapId: '',
                x: half,
                y: half,
                color: 0xff0000,
                stats: randomNPCs.DANGEROUS,
                name: 'Dangerous',
            },
            {
                id: 'DEADLY',
                mapId: '',
                x: half,
                y: half,
                color: 0xff00ff,
                stats: randomNPCs.DEADLY,
                name: 'Deadly',
            },
        ]
    })

    // Walls
    const [isWallMode, setIsWallMode] = useState(false)
    const [wallDrawingShape, setWallDrawingShape] = useState<WallShape>()
    const [isErasingWalls, setIsErasingWalls] = useState(false)
    const [wallColorHex, setWallColorHex] = useState('#ff3b81')
    const [wallAlpha, setWallAlpha] = useState(0.95)
    const [wallColorAnchor, setWallColorAnchor] = useState<HTMLElement | null>(null)
    const [walls, setWalls] = useState<Wall[]>([])

    // Blasts
    const [isBlastPanelOpen, setIsBlastPanelOpen] = useState(false)
    const [blasts, setBlasts] = useState<Blast[]>([])
    const [blastsNotInMap, setBlastsNotInMap] = useState<Blast[]>([])
    const [blastDrawMode, setBlastDrawMode] = useState<BlastType | null>(null)
    const [blastClipboard, setBlastClipboard] = useState<Blast[] | null>(null)

    // Initiative
    const [isInitiativePanelOpen, setIsInitiativePanelOpen] = useState(false)
    const [activeTokenId, setActiveTokenId] = useState<string | null>(null)
    const [initiativeRolls, setInitiativeRolls] = useState<Map<string, number>>(new Map())
    const [currentRound, setCurrentRound] = useState(1)
    const [autoRerollInitiative, setAutoRerollInitiative] = useState(false)
    const [autoRollDamage, setAutoRollDamage] = useState(false)
    const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([])
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)
    const [isCombatActive, setIsCombatActive] = useState(false)

    // Session state

    // For players, show as connected if they have a session (they're in the session)
    // For DMs, show as connected only when WebRTC is connected
    const session = useSession()
    const isPlayerConnected = Boolean(session.session && session.role === 'player' && session.connected)
    // Helper function to determine if we should use session tables
    const useSessionTables = () => {
        const result = session.role === 'player' && !!session.session
        return result
    }

    // Helper functions to get the appropriate table based on session state
    const getBoardMapsTable = () => (useSessionTables() ? db.sessionBoardMaps : db.boardMaps)
    const getTokensTable = () => (useSessionTables() ? db.sessionTokens : db.tokens)
    const getMapsTable = () => (useSessionTables() ? db.sessionMaps : db.maps)
    const getWallsTable = () => (useSessionTables() ? db.sessionWalls : db.walls)
    const getImagesTable = () => (useSessionTables() ? db.sessionImages : db.images)
    const getBlastsTable = () => (useSessionTables() ? db.sessionBlasts : db.blasts)
    const getInitiativeTable = () => (useSessionTables() ? db.sessionInitiative : db.initiative)
    const getRollHistoryTable = () => (useSessionTables() ? db.sessionRollHistory : db.rollHistory)

    const getActiveMapKey = () => {
        if (!currentMap) return ''
        return currentMap.mapId ?? currentMap.id
    }

    // TOKEN DIALOG
    const imageUrlCacheRef = useRef<Map<string, ImageUrlCacheEntry>>(new Map())
    const upsertImageUrl = useCallback((image: Image): string => {
        const cache = imageUrlCacheRef.current
        const existing = cache.get(image.id)
        if (!image.blob) {
            // If blob is not available, return a placeholder or handle gracefully
            return existing?.url || ''
        }
        const size = image.blob.size
        const type = image.blob.type
        if (existing && existing.size === size && existing.type === type) {
            return existing.url
        }
        if (existing) {
            try {
                URL.revokeObjectURL(existing.url)
            } catch (e) {
                void e
            }
        }
        const url = URL.createObjectURL(image.blob)
        cache.set(image.id, { url, size, type })
        return url
    }, [])
    const resolveImageUrl = useCallback(
        (imageId: string | undefined): string | undefined => {
            if (!imageId) return undefined
            if (imageId.startsWith('/')) return imageId
            const cacheEntry = imageUrlCacheRef.current.get(imageId)
            if (cacheEntry) return cacheEntry.url
            const image = images.find((img) => img.id === imageId)
            if (!image) return undefined
            const url = upsertImageUrl(image)
            return url || undefined
        },
        [images, upsertImageUrl]
    )
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
        } catch (error) {
            console.error('Error uploading image:', error)
        }
    }
    // HEADER
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
    const replaceMapTexture = async (next: Texture | null) => {
        setMapTexture((prev) => {
            if (prev && prev !== next) {
                // Defer texture destruction to avoid destroying it while PixiJS is still using it
                requestAnimationFrame(() => {
                    try {
                        if (prev && !prev.destroyed) {
                            prev.destroy(true)
                        }
                    } catch (e) {
                        void e
                    }
                })
            }
            return next
        })
    }
    const onUploadMap = async (file: globalThis.File) => {
        const img = await fileToImage(file)
        const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
        await replaceMapTexture(texture)
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
        prevGridSizeRef.current = map.gridSize
        setSnapToGrid(map.snapToGrid)
        setGridColorHex(map.gridColorHex)
        setGridAlpha(map.gridAlpha)
    }
    const onReplaceMap = async (file: globalThis.File) => {
        if (!currentMap?.mapId) return

        const existingMap = await db.maps.get(currentMap.mapId)
        if (!existingMap) return

        const img = await fileToImage(file)
        const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
        await replaceMapTexture(texture)

        // Update only the image-related fields, preserve everything else
        await db.maps.update(currentMap.mapId, {
            blob: file,
            width: img.width,
            height: img.height,
            mimeType: file.type,
        })

        // Update the maps state with the new image data
        setMaps((prev) =>
            prev.map((m) =>
                m.id === currentMap.mapId
                    ? { ...m, blob: file, width: img.width, height: img.height, mimeType: file.type }
                    : m
            )
        )
    }
    const onSelectMap = async (id: string) => {
        if (!currentMap) return
        const boardMapsTable = getBoardMapsTable()
        const tokensTable = getTokensTable()
        const wallsTable = getWallsTable()
        const blastsTable = getBlastsTable()
        const mapsTable = getMapsTable()

        await boardMapsTable.update(currentMap.id, { mapId: id })
        setCurrentMap({ ...currentMap, mapId: id })
        const key = id || currentMap.id
        const tks = await tokensTable.where('mapId').equals(key).toArray()
        setTokens(tks)
        const tksNotInMap = await tokensTable.where('mapId').notEqual(key).toArray()
        setTokensNotInMap(tksNotInMap)
        const ws = await wallsTable.where('mapId').equals(key).toArray()
        setWalls(ws)
        const bls = await blastsTable.where('mapId').equals(key).toArray()
        setBlasts(bls)
        const blsNotInMap = await blastsTable.where('mapId').notEqual(key).toArray()
        setBlastsNotInMap(blsNotInMap)
        const map = await mapsTable.get(id)
        if (!map) return
        const img = await blobToImage(map.blob)
        if (img) {
            const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
            await replaceMapTexture(texture)
        } else {
            console.warn('Failed to load selected map image')
        }
        setGridSize(map.gridSize)
        prevGridSizeRef.current = map.gridSize
        setSnapToGrid(map.snapToGrid)
        setGridColorHex(map.gridColorHex)
        setGridAlpha(map.gridAlpha)
    }
    const onGridSizeChange = async (size: number) => {
        setGridSize(size)
        if (!currentMap?.mapId) return
        const oldGridSize = prevGridSizeRef.current

        // Skip token update if gridSize hasn't actually changed
        // This prevents recalculation when loading a map
        const hasGridSizeChanged = oldGridSize !== size

        // Update the ref immediately to prevent race conditions with multiple quick changes
        prevGridSizeRef.current = size

        await db.maps.update(currentMap.mapId, { gridSize: size })
        setMaps((prev) => prev.map((a) => (a.id === currentMap.mapId ? { ...a, gridSize: size } : a)))

        if (!hasGridSizeChanged) return

        // Recalculate token positions based on new grid size (radius is now always gridSize/2)
        const allTokens = [...tokens, ...tokensNotInMap]
        const updates: { token: Token; newX: number; newY: number }[] = []

        for (const token of allTokens) {
            const gridX = Math.round(token.x / oldGridSize)
            const gridY = Math.round(token.y / oldGridSize)
            const newX = gridX * size
            const newY = gridY * size

            updates.push({
                token,
                newX,
                newY,
            })
        }

        if (updates.length > 0) {
            // Update tokens in map
            setTokens((prev) =>
                prev.map((t) => {
                    const update = updates.find((u) => u.token.id === t.id)
                    if (update) {
                        return { ...t, x: update.newX, y: update.newY }
                    }
                    return t
                })
            )

            // Update tokens not in map
            setTokensNotInMap((prev) =>
                prev.map((t) => {
                    const update = updates.find((u) => u.token.id === t.id)
                    if (update) {
                        return { ...t, x: update.newX, y: update.newY }
                    }
                    return t
                })
            )
        }
    }

    const onSnapToGridChange = async (value: boolean) => {
        setSnapToGrid(value)
        if (!currentMap?.mapId) return
        await db.maps.update(currentMap.mapId, { snapToGrid: value })
        setMaps((prev) => prev.map((a) => (a.id === currentMap.mapId ? { ...a, snapToGrid: value } : a)))
    }
    // PANEL DATA
    // TOKEN
    const panelTokenOnDuplicate = async (id: string) => {
        const allTokens = [...tokens, ...tokensNotInMap]
        const existingTokens = [...tokens, ...tokensNotInMap]
        const token = allTokens.find((t) => t.id === id)
        if (token) {
            // Check if it's a default token to apply numbering
            let newName = token.name
            // Count existing copies with the same base name
            const baseName = token.name
            const existingCopies = existingTokens.filter((t) => {
                return t.name.startsWith(baseName + ' ') || t.name === baseName
            })
            const copyNumber = existingCopies.length + 1
            newName = `${baseName} ${copyNumber}`

            const newToken = {
                ...token,
                name: newName,
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                mapId: getActiveMapKey(),
                // Keep same position as original token
            }
            await db.tokens.add(newToken)
            // Always add the duplicate to the current map
            setTokens((prev) => [...prev, newToken])
        }
    }
    const pixiOnTokenUpdate = (id: string, updates: Partial<Token>) => {
        // Find the token in current map or other maps
        const tokenInMap = tokens.find((t) => t.id === id)
        const tokenInNotInMap = tokensNotInMap.find((t) => t.id === id)

        // If not found, force update in tokens (assuming it's a displayed token)
        const setTargetTokens = tokenInMap ? setTokens : (tokenInNotInMap ? setTokensNotInMap : setTokens)

        // Update in state synchronously
        setTargetTokens((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        )

        // Update in database asynchronously
        const tokensTable = getTokensTable()
        tokensTable.update(id, updates).catch((error) => {
            console.error('Failed to update token in database:', error)
        })

        // Send mutation for sync
        sendMutation('tokens', 'update', { id, ...updates }, useSessionTables, session)
    }
    const panelTokenOnCut = async (id: string) => {
        const tokenInMap = tokens.find((t) => t.id === id)
        const setTargetTokens = tokenInMap ? setTokens : setTokensNotInMap
        const allTokens = [...tokens, ...tokensNotInMap]
        const token = allTokens.find((t) => t.id === id)
        if (token) {
            const newToken = {
                ...token,
            }
            setTokenClipboard([newToken])
            // Cut removes the token but stores it in clipboard
            setTargetTokens((prev) => prev.filter((t) => t.id !== id))
            await db.tokens.delete(id)
        }
    }
    const panelTokenOnCopy = async (id: string) => {
        const allTokens = [...tokens, ...tokensNotInMap]
        const existingTokens = [...tokens, ...tokensNotInMap]
        const token = allTokens.find((t) => t.id === id)
        if (token) {
            // Count existing copies with the same base name
            const baseName = token.name
            const existingCopies = existingTokens.filter((t) => {
                return t.name.startsWith(baseName + ' ') || t.name === baseName
            })
            const copyNumber = existingCopies.length + 1
            const newName = `${baseName} ${copyNumber}`

            // Create a copy with new ID for clipboard
            const clipboardToken = {
                ...token,
                name: newName,
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            }
            setTokenClipboard([clipboardToken])
        }
    }
    // INITIATIVE
    const panelInitOnSetAutoReroll = async (value: boolean) => {
        setAutoRerollInitiative(value)
        await panelInitOnSaveInitiative(
            activeTokenId,
            currentRound,
            isCombatActive,
            value,
            autoRollDamage,
            initiativeRolls
        )
    }
    const panelInitOnSetActiveToken = async (tokenId: string) => {
        setActiveTokenId(tokenId)
        // Reset movement when token becomes active
        const token = tokens.find((t) => t.id === tokenId)
        if (token?.stats) {
            panelInitOnUpdateTokenCurrent(tokenId, 'movement', token.stats.movement)
        }
        // Save with the new activeTokenId
        await panelInitOnSaveInitiative(
            tokenId,
            currentRound,
            isCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            initiativeRolls
        )
    }
    const panelInitOnRollInitiative = (token: Token): number => {
        const { value } = rollD10WithSpecial()
        return value + (token.stats?.initiative ?? 0)
    }
    const panelInitOnRollAllInitiatives = async () => {
        const newRolls = new Map<string, number>()
        await Promise.all(
            tokens.map(async (token) => {
                const initiative = panelInitOnRollInitiative(token)
                newRolls.set(token.id, initiative)

                // Add to roll history
                const initiativeMod = token.stats?.initiative ?? 0
                const { value, fumble, critical, rolls } = rollD10WithSpecial()
                await panelHistoryOnAddToRollHistory(
                    token,
                    'initiative',
                    {
                        total: value + initiativeMod,
                        rolls,
                        fumble,
                        critical,
                        breakdown: `${value}${fumble ? ' (fumble)' : critical ? ' (critical)' : ''} + ${initiativeMod}`,
                    },
                    'Initiative'
                )
            })
        )
        setInitiativeRolls(newRolls)
        return newRolls
    }
    const panelInitOnMeleeAttack = async (token: Token, actionId: string) => {
        const actions = token.stats?.actions ?? []
        const action = actions.find((a) => a.id === actionId)
        if (!action || action.type !== 'melee') return

        const combat = action.value
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const damageDice = action.damage
        const diceCount = damageDice?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        await panelHistoryOnAddToRollHistory(
            token,
            'melee-hit',
            hitResult,
            action.name || 'Melee Attack',
            damageResult,
            'melee'
        )
    }
    const panelInitOnRangedAttack = async (token: Token, actionId: string) => {
        const actions = token.stats?.actions ?? []
        const action = actions.find((a) => a.id === actionId)
        if (!action || action.type !== 'ranged') return

        const combat = action.value
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const damageDice = action.damage
        const diceCount = damageDice?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        await panelHistoryOnAddToRollHistory(
            token,
            'ranged-hit',
            hitResult,
            action.name || 'Ranged Attack',
            damageResult,
            'ranged'
        )
    }
    const panelInitOnSkillCheck = async (token: Token, actionId: string) => {
        const actions = token.stats?.actions ?? []
        const action = actions.find((a) => a.id === actionId)
        if (!action || action.type !== 'skill') return

        const skills = action.value
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const result = rollToHit(skills, woundedPenalty)

        await panelHistoryOnAddToRollHistory(token, 'skill', result, action.name || 'Skill Check', undefined, 'skill')
    }
    const panelInitOnGrenadeAttack = async (token: Token, actionId: string) => {
        const actions = token.stats?.actions ?? []
        const action = actions.find((a) => a.id === actionId)
        if (!action || action.type !== 'grenade') return

        const combat = action.value
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const damageDice = action.damage
        const diceCount = damageDice?.d6 ?? 6 // Default to 6d6 for grenades
        const damageResult = rollDamage(diceCount)

        await panelHistoryOnAddToRollHistory(
            token,
            'grenade-hit',
            hitResult,
            action.name || 'Grenade Attack',
            damageResult,
            'grenade'
        )
    }
    const panelInitOnUpdateTokenCurrent = async (
        tokenId: string,
        field: 'health' | 'sph' | 'spb' | 'movement',
        value: number
    ) => {
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
                } else if (field === 'spb') {
                    return {
                        ...t,
                        stats: { ...t.stats, armor: { ...t.stats.armor, currentSpb: value } },
                    }
                } else {
                    return { ...t, stats: { ...t.stats, currentMovement: value } }
                }
            })
        )

        // Update in database
        const tokensTable = getTokensTable()
        const token = tokens.find((t) => t.id === tokenId)
        if (token && token.stats) {
            if (field === 'health') {
                const updateData = { stats: { ...token.stats, currentHealth: value } }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData }, useSessionTables, session)
            } else if (field === 'sph') {
                const updateData = {
                    stats: { ...token.stats, armor: { ...token.stats.armor, currentSph: value } },
                }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData }, useSessionTables, session)
            } else if (field === 'spb') {
                const updateData = {
                    stats: { ...token.stats, armor: { ...token.stats.armor, currentSpb: value } },
                }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData }, useSessionTables, session)
            } else {
                const updateData = { stats: { ...token.stats, currentMovement: value } }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData }, useSessionTables, session)
            }
        }
    }
    const panelInitOnNextTurn = async () => {
        // Increment round
        const newRound = currentRound + 1
        setCurrentRound(newRound)

        // Reroll if enabled and use the new rolls for sorting
        const rollsToUse = autoRerollInitiative ? await panelInitOnRollAllInitiatives() : initiativeRolls

        // Set to first token and reset its movement
        const sorted = [...tokens].sort((a, b) => (rollsToUse.get(b.id) ?? 0) - (rollsToUse.get(a.id) ?? 0))
        let newActiveTokenId = activeTokenId
        if (sorted.length > 0) {
            const firstToken = sorted[0]
            newActiveTokenId = firstToken.id
            setActiveTokenId(newActiveTokenId)
            // Reset movement for the new active token
            if (firstToken.stats) {
                panelInitOnUpdateTokenCurrent(firstToken.id, 'movement', firstToken.stats.movement)
            }
        }
        // Save initiative state with the new values
        await panelInitOnSaveInitiative(
            newActiveTokenId,
            newRound,
            isCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            rollsToUse
        )
    }
    const panelInitOnToggleCombat = async () => {
        const newIsCombatActive = !isCombatActive
        let newActiveTokenId = activeTokenId
        let newInitiativeRolls = initiativeRolls
        let newCurrentRound = currentRound

        if (!isCombatActive) {
            // Starting combat - roll initiatives
            if (tokens.length > 0) {
                newInitiativeRolls = await panelInitOnRollAllInitiatives()

                // Initialize grenades/special ammo and movement if not already set
                setTokens((prev) =>
                    prev.map((t) => {
                        if (!t.stats) return t

                        let updatedStats = { ...t.stats }
                        let needsUpdate = false

                        // Initialize currentMovement to movement
                        updatedStats = {
                            ...updatedStats,
                            currentMovement: updatedStats.movement,
                        }
                        needsUpdate = true

                        // Update database for non-default tokens
                        if (needsUpdate && t.mapId !== '') {
                            db.tokens.update(t.id, { stats: updatedStats }).catch(console.error)
                        }

                        return needsUpdate ? { ...t, stats: updatedStats } : t
                    })
                )

                // Set first token as active
                const sorted = [...tokens].sort(
                    (a, b) => (newInitiativeRolls.get(b.id) ?? 0) - (newInitiativeRolls.get(a.id) ?? 0)
                )
                if (sorted.length > 0) {
                    newActiveTokenId = sorted[0].id
                    setActiveTokenId(newActiveTokenId)
                }
                setInitiativeRolls(newInitiativeRolls)
            }
        } else {
            // Stopping combat - clear active token and initiatives
            newActiveTokenId = null
            newInitiativeRolls = new Map()
            newCurrentRound = 1
            setActiveTokenId(null)
            setInitiativeRolls(new Map())
            setCurrentRound(1)
        }
        setIsCombatActive(newIsCombatActive)
        // Save initiative state with the new values
        await panelInitOnSaveInitiative(
            newActiveTokenId,
            newCurrentRound,
            newIsCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            newInitiativeRolls
        )
    }
    const panelInitCheckSeriouslyWounded = (token: Token): boolean => {
        // Check if token is seriously wounded (current HP < half of max HP)
        if (!token.stats) return false
        const maxHP = token.stats.health
        const currentHP = token.stats.currentHealth ?? maxHP
        const threshold = Math.ceil(maxHP / 2)
        return currentHP < threshold
    }
    const panelInitOnChangeInitiative = async (tokenId: string, value: number) => {
        const newRolls = new Map(initiativeRolls)
        newRolls.set(tokenId, value)
        setInitiativeRolls(newRolls)
        // Save to database
        await panelInitOnSaveInitiative(
            activeTokenId,
            currentRound,
            isCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            newRolls
        )
    }
    const panelInitOnSaveInitiative = async (
        activeTokenIdParam = activeTokenId,
        currentRoundParam = currentRound,
        isCombatActiveParam = isCombatActive,
        autoRerollInitiativeParam = autoRerollInitiative,
        autoRollDamageParam = autoRollDamage,
        initiativeRollsParam = initiativeRolls
    ) => {
        if (!currentMap?.mapId) return
        const initiativeData = {
            mapId: currentMap.mapId,
            activeTokenId: activeTokenIdParam,
            currentRound: currentRoundParam,
            isCombatActive: isCombatActiveParam,
            autoRerollInitiative: autoRerollInitiativeParam,
            autoRollDamage: autoRollDamageParam,
            initiativeRolls: Object.fromEntries(initiativeRollsParam),
        }
        try {
            const initiativeTable = getInitiativeTable()
            await initiativeTable.put(initiativeData)

            // Send mutation for sync
            sendMutation('initiative', 'update', initiativeData, useSessionTables, session)
        } catch (error) {
            console.error('Failed to save initiative data:', error)
        }
    }
    const panelInitEnsureInitiativeEntriesForAllMaps = async () => {
        const mapsTable = getMapsTable()
        const initiativeTable = getInitiativeTable()
        const allMaps = await mapsTable.toArray()
        for (const map of allMaps) {
            const existingInitiative = await initiativeTable.get(map.id)
            if (!existingInitiative) {
                const defaultInitiative = {
                    mapId: map.id,
                    activeTokenId: null,
                    currentRound: 1,
                    isCombatActive: false,
                    autoRerollInitiative: false,
                    autoRollDamage: false,
                    initiativeRolls: {},
                }
                await initiativeTable.put(defaultInitiative)
            }
        }
    }
    // ROLL HISTORY
    const panelHistoryOnSetAutoRollDamage = async (value: boolean) => {
        setAutoRollDamage(value)
        await panelInitOnSaveInitiative(
            activeTokenId,
            currentRound,
            isCombatActive,
            autoRerollInitiative,
            value,
            initiativeRolls
        )
    }
    const panelHistoryOnClear = async () => {
        setRollHistory([])
        if (currentMap?.mapId) {
            await db.rollHistory.where('mapId').equals(currentMap.mapId).delete()
        }
    }
    const panelHistoryOnDelete = async (id: string) => {
        setRollHistory((prev) => prev.filter((entry) => entry.id !== id))
        await db.rollHistory.delete(id)
    }
    const panelHistoryOnRevealDamage = async (entryId: string) => {
        setRollHistory((prev) =>
            prev.map((entry) => (entry.id === entryId ? { ...entry, damageRevealed: true } : entry))
        )
        // Save to database
        const rollHistoryTable = getRollHistoryTable()
        await rollHistoryTable.update(entryId, { damageRevealed: true })
    }
    const panelHistoryOnAddToRollHistory = async (
        token: Token,
        rollType: RollType,
        result: RollResult,
        actionName: string,
        damageResult?: RollResult,
        actionType?: 'melee' | 'ranged' | 'grenade' | 'skill'
    ) => {
        const entry: RollHistoryEntry = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            timestamp: Date.now(),
            tokenId: token.id,
            tokenName: token.name,
            rollType,
            actionName: actionName,
            actionType: actionType,
            result,
            damageResult,
            damageRevealed: damageResult ? autoRollDamage : undefined, // Auto-reveal if setting is enabled
            mapId: currentMap?.mapId || '',
        }
        setRollHistory((prev) => {
            const newHistory = [entry, ...prev]
            // Keep only last 100 entries
            return newHistory.slice(0, 100)
        })
        // Save to database
        const rollHistoryTable = getRollHistoryTable()
        await rollHistoryTable.put(entry)
    }
    // BLASTS
    const onActivateBlastDrawMode = (type: BlastType) => {
        // Toggle off if clicking the same mode
        if (blastDrawMode === type) {
            setBlastDrawMode(null)
            return
        }

        // Deactivate other modes
        setIsMeasuring(false)
        setIsWallMode(false)
        setBlastDrawMode(type)
    }

    // PANEL & PIXI DATA
    const onBlastDelete = async (blastId: string) => {
        const blastsTable = getBlastsTable()
        await blastsTable.delete(blastId)
        setBlasts((prev) => prev.filter((b) => b.id !== blastId))

        // Send mutation for sync
        sendMutation('blasts', 'delete', { id: blastId }, useSessionTables, session)
        setBlastsNotInMap((prev) => prev.filter((b) => b.id !== blastId))
    }
    const onBlastCopy = (blastId: string) => {
        const blast = [...blasts, ...blastsNotInMap].find((b) => b.id === blastId)
        if (!blast) return
        setBlastClipboard([blast])
    }
    const onBlastCut = async (blastId: string) => {
        const blast = [...blasts, ...blastsNotInMap].find((b) => b.id === blastId)
        if (!blast) return
        setBlastClipboard([blast])
        await onBlastDelete(blastId)
    }
    const onBlastLock = async (blastId: string, locked: boolean) => {
        await db.blasts.update(blastId, { locked })
        setBlasts((prev) => prev.map((b) => (b.id === blastId ? { ...b, locked } : b)))
        setBlastsNotInMap((prev) => prev.map((b) => (b.id === blastId ? { ...b, locked } : b)))
    }
    const onOpenTokenDialog = (id: string | undefined) => {
        if (id) {
            setTokenDialogsOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
        }
    }
    const onCloseTokenDialog = (tokenId: string) => {
        setTokenDialogsOpen((prev) => prev.filter((id) => id !== tokenId))
    }
    const onDeleteToken = async () => {
        if (!deleteTokenDialogOpen) return

        // Remove from both tokens and tokensNotInMap
        setTokens((prev) => prev.filter((t) => t.id !== deleteTokenDialogOpen))
        setTokensNotInMap((prev) => prev.filter((t) => t.id !== deleteTokenDialogOpen))

        const tokensTable = getTokensTable()
        await tokensTable.delete(deleteTokenDialogOpen)
        setDeleteTokenDialogOpen(null)

        // Send mutation for sync
        sendMutation('tokens', 'delete', { id: deleteTokenDialogOpen }, useSessionTables, session)
    }
    const onDeleteAllTokens = async () => {
        if (!currentMap) {
            fitRef.current?.()
            return
        }
        const tokensTable = getTokensTable()
        await tokensTable.where('mapId').equals(getActiveMapKey()).delete()
        setTokens([])
        const tksNotInMap = await tokensTable.toArray()
        setTokensNotInMap(tksNotInMap)
        setDeleteAllTokensDialogOpen(false)
    }
    const onDeleteMap = async () => {
        if (!currentMap?.mapId) return
        const id = currentMap.mapId
        await db.maps.delete(id)

        // Find and select the Empty Map
        const emptyMap = await db.maps.where('name').equals('Empty Map').first()
        if (emptyMap) {
            await db.boardMaps.update(currentMap.id, { mapId: emptyMap.id })
            setCurrentMap({ ...currentMap, mapId: emptyMap.id })

            // Load the Empty Map texture and settings
            const img = await blobToImage(emptyMap.blob)
            if (img) {
                const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
                await replaceMapTexture(texture)
            } else {
                console.warn('Failed to load empty map image')
            }
            setGridSize(emptyMap.gridSize)
            prevGridSizeRef.current = emptyMap.gridSize
            setSnapToGrid(emptyMap.snapToGrid)
            setGridColorHex(emptyMap.gridColorHex)
            setGridAlpha(emptyMap.gridAlpha)

            const key = emptyMap.id
            const tks = await db.tokens.where('mapId').equals(key).toArray()
            setTokens(tks)
            const tksNotInMap = await db.tokens.where('mapId').notEqual(key).toArray()
            setTokensNotInMap(tksNotInMap)
            const ws = await db.walls.where('mapId').equals(key).toArray()
            setWalls(ws)
            const bls = await db.blasts.where('mapId').equals(key).toArray()
            setBlasts(bls)
            const blsNotInMap = await db.blasts.where('mapId').notEqual(key).toArray()
            setBlastsNotInMap(blsNotInMap)
        } else {
            // Fallback to undefined if Empty Map doesn't exist
            await db.boardMaps.update(currentMap.id, { mapId: undefined })
            setCurrentMap({ ...currentMap, mapId: undefined })
            await replaceMapTexture(null)
            const tks = await db.tokens.where('mapId').equals(currentMap.id).toArray()
            setTokens(tks)
            const tksNotInMap = await db.tokens.toArray()
            setTokensNotInMap(tksNotInMap)
            const bls = await db.blasts.where('mapId').equals(currentMap.id).toArray()
            setBlasts(bls)
            const blsNotInMap = await db.blasts.toArray()
            setBlastsNotInMap(blsNotInMap)
        }

        setMaps((prev) => prev.filter((a) => a.id !== id))
        setDeleteMapDialogOpen(false)
    }
    const onDeleteAllBlasts = async () => {
        // Delete all blasts from the current map
        const mapId = getActiveMapKey()
        await db.blasts.where('mapId').equals(mapId).delete()
        setBlasts([])
        setDeleteAllBlastsDialogOpen(false)
    }
    const onDeleteAllWalls = async () => {
        setWalls([])
        await db.transaction('rw', db.walls, async () => {
            await db.walls.where('mapId').equals(getActiveMapKey()).delete()
        })
        setDeleteAllWallsDialogOpen(false)
    }

    useEffect(() => {
        const cache = imageUrlCacheRef.current
        const nextIds = new Set(images.map((img) => img.id))
        for (const [id, entry] of Array.from(cache.entries())) {
            if (!nextIds.has(id)) {
                try {
                    URL.revokeObjectURL(entry.url)
                } catch (e) {
                    void e
                }
                cache.delete(id)
            }
        }
    }, [images])
    useEffect(() => {
        return () => {
            const cache = imageUrlCacheRef.current
            for (const { url } of cache.values()) {
                try {
                    URL.revokeObjectURL(url)
                } catch (e) {
                    void e
                }
            }
            cache.clear()
        }
    }, [])
    useEffect(() => {
        return () => {
            // Cleanup texture on unmount
            requestAnimationFrame(() => {
                try {
                    if (mapTexture && !mapTexture.destroyed) {
                        mapTexture.destroy(true)
                    }
                } catch (e) {
                    void e
                }
            })
        }
    }, [mapTexture])
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
            const boardMapsTable = getBoardMapsTable()
            const mapsTable = getMapsTable()
            const tokensTable = getTokensTable()
            const wallsTable = getWallsTable()
            const blastsTable = getBlastsTable()
            const imagesTable = getImagesTable()

            let map = await boardMapsTable.where('name').equals('Default').first()
            if (!map) {
                // create default map
                let defaultMap = await mapsTable.where('name').equals('Empty Map').first()
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
                        await mapsTable.add(candidate)
                        defaultMap = candidate
                    } catch {
                        defaultMap = await mapsTable.where('name').equals('Empty Map').first()
                    }
                }
                const newBoardMap: BoardMap = {
                    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + 1),
                    name: 'Default',
                    mapId: defaultMap?.id,
                }
                try {
                    await boardMapsTable.add(newBoardMap)
                    map = newBoardMap
                } catch {
                    map = await boardMapsTable.where('name').equals('Default').first()
                }
            }
            if (!map) return
            setCurrentMap(map)
            // maps dropdown
            const allMaps = await mapsTable.toArray()
            setMaps(allMaps)

            // Ensure all maps have initiative entries
            await panelInitEnsureInitiativeEntriesForAllMaps()

            // tokens, walls, and blasts
            const activeKey = map.mapId ?? map.id
            const tks = await tokensTable.where('mapId').equals(activeKey).toArray()
            setTokens(tks)
            const tksNotInMap = await tokensTable.where('mapId').notEqual(activeKey).toArray()
            setTokensNotInMap(tksNotInMap)
            const ws = await wallsTable.where('mapId').equals(activeKey).toArray()
            setWalls(ws)
            const bls = await blastsTable.where('mapId').equals(activeKey).toArray()
            setBlasts(bls)
            const blsNotInMap = await blastsTable.where('mapId').notEqual(activeKey).toArray()
            setBlastsNotInMap(blsNotInMap)
            // map
            if (map.mapId) {
                const m = await mapsTable.get(map.mapId)
                if (m) {
                    try {
                        const img = await blobToImage(m.blob)
                        if (img) {
                            const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
                            await replaceMapTexture(texture)
                            setGridSize(m.gridSize)
                            prevGridSizeRef.current = m.gridSize
                            setSnapToGrid(m.snapToGrid)
                            setGridColorHex(m.gridColorHex)
                            setGridAlpha(m.gridAlpha)
                        } else {
                            console.warn('Failed to load map image, map may not display correctly. Map blob details:', {
                                hasBlob: !!m.blob,
                                blobType: m.blob?.type,
                                blobSize: m.blob?.size,
                                blobConstructor: m.blob?.constructor?.name,
                            })
                        }
                    } catch (error) {
                        console.error('Error loading map image:', error)
                    }
                }
            }
            // images
            const allImages = await imagesTable.toArray()
            setImages(allImages)
        }
        run()
    }, [session.role, session.session, session.snapshot, session.connected])
    // Load initiative data when current map changes
    useEffect(() => {
        const loadInitiativeForMap = async () => {
            if (!currentMap?.mapId) {
                // Clear initiative data if no map is selected
                setActiveTokenId(null)
                setCurrentRound(1)
                setIsCombatActive(false)
                setAutoRerollInitiative(false)
                setInitiativeRolls(new Map())
                setRollHistory([])
                return
            }

            // Load initiative data for this map
            const initiativeTable = getInitiativeTable()
            const initData = await initiativeTable.get(currentMap.mapId)
            if (initData) {
                setActiveTokenId(initData.activeTokenId)
                setCurrentRound(initData.currentRound)
                setIsCombatActive(initData.isCombatActive)
                setAutoRerollInitiative(initData.autoRerollInitiative)
                setAutoRollDamage(initData.autoRollDamage ?? false)
                setInitiativeRolls(new Map(Object.entries(initData.initiativeRolls)))
            } else {
                // No initiative data for this map, create default entry
                const defaultInitiative = {
                    mapId: currentMap.mapId,
                    activeTokenId: null,
                    currentRound: 1,
                    isCombatActive: false,
                    autoRerollInitiative: false,
                    autoRollDamage: false,
                    initiativeRolls: {},
                }
                await initiativeTable.put(defaultInitiative)
                setActiveTokenId(null)
                setCurrentRound(1)
                setIsCombatActive(false)
                setAutoRerollInitiative(false)
                setAutoRollDamage(false)
                setInitiativeRolls(new Map())
            }

            // Load roll history for this map
            const rollHistoryTable = getRollHistoryTable()
            const historyData = await rollHistoryTable.where('mapId').equals(currentMap.mapId).toArray()
            // Sort by timestamp (most recent first)
            const sortedHistory = historyData.sort((a, b) => b.timestamp - a.timestamp)
            setRollHistory(sortedHistory)
        }

        // Close all token details dialogs when map changes
        setTokenDialogsOpen([])

        loadInitiativeForMap()
    }, [currentMap?.mapId, session.role, session.session, session.snapshot, session.connected])
    // Persist grid color/alpha
    useEffect(() => {
        const persistGridStyle = async () => {
            if (!currentMap) return
            if (currentMap.mapId) {
                const mapsTable = getMapsTable()
                await mapsTable.update(currentMap.mapId, {
                    gridColorHex,
                    gridAlpha,
                })
            }
        }
        persistGridStyle()
    }, [gridColorHex, gridAlpha])
    // Track active token changes and add turn-start entries
    useEffect(() => {
        if (activeTokenId && isCombatActive) {
            const token = tokens.find((t) => t.id === activeTokenId)
            if (token) {
                panelHistoryOnAddToRollHistory(
                    token,
                    'turn-start',
                    {
                        total: 0,
                        rolls: [],
                        fumble: false,
                        critical: false,
                        breakdown: '',
                    },
                    'Turn Start'
                ).catch(console.error)
            }
        }
    }, [activeTokenId, isCombatActive])
    // Revoke blob URLs when fullscreen image changes or on unmount
    useEffect(() => {
        const url = fullscreenImage
        return () => {
            if (url && url.startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(url)
                } catch (e) {
                    void e
                }
            }
        }
    }, [fullscreenImage])

    return {
        maps,
        currentMap,
        sortedMaps,
        onReplaceMap,
        onUploadMap,
        onSelectMap,
        onGridSizeChange,
        onSnapToGridChange,
        getActiveMapKey,
        panelHistoryOnRevealDamage,
        blasts,
        blastsNotInMap,
        onActivateBlastDrawMode,
        onBlastDelete,
        onBlastCopy,
        onBlastCut,
        onBlastLock,
        tokenClipboard,
        dimensions,
        isMeasuring,
        isWallMode,
        wallDrawingShape,
        isErasingWalls,
        walls,
        setPendingCount,
        acceptAllRef,
        cancelAllRef,
        wallAlpha,
        wallColorHex,
        setIsMeasuring,
        setIsWallMode,
        setIsErasingWalls,
        setIsTokenPanelOpen,
        setIsInitiativePanelOpen,
        setWallDrawingShape,
        onDeleteMap,
        onDeleteAllTokens,
        onDeleteToken,
        setDefaultTokens,
        setTokensNotInMap,
        onOpenTokenDialog,
        onCloseTokenDialog,
        tokens,
        tokensNotInMap,
        mapTexture,
        images,
        pendingCount,
        deleteMapDialogOpen,
        setDeleteMapDialogOpen,
        deleteTokenDialogOpen,
        tokenDialogsOpen,
        gridColorAnchor,
        wallColorAnchor,
        fullscreenImage,
        resolveImageUrl,
        onUploadImage,
        panelInitOnChangeInitiative,
        panelInitOnMeleeAttack,
        panelInitOnRangedAttack,
        panelInitOnSkillCheck,
        panelInitOnGrenadeAttack,
        panelInitOnNextTurn,
        panelInitOnToggleCombat,
        onDeleteAllWalls,
        onDeleteAllBlasts,
        setWallColorHex,
        setWallAlpha,
        paperRef,
        setGridColorAnchor,
        setWallColorAnchor,
        rollHistory,
        setIsHistoryPanelOpen,
        setIsBlastPanelOpen,
        blastClipboard,
        defaultTokens,
        gridSize,
        gridColorHex,
        gridAlpha,
        snapToGrid,
        isTokenPanelOpen,
        setTokens,
        setDeleteTokenDialogOpen,
        setFullscreenImage,
        initiativeRolls,
        activeTokenId,
        currentRound,
        autoRerollInitiative,
        isCombatActive,
        panelInitCheckSeriouslyWounded,
        panelInitOnUpdateTokenCurrent,
        isInitiativePanelOpen,
        autoRollDamage,
        isHistoryPanelOpen,
        isBlastPanelOpen,
        blastDrawMode,
        fitRef,
        setBlastDrawMode,
        setGridColorHex,
        setGridAlpha,
        panelTokenOnDuplicate,
        panelTokenOnCut,
        panelTokenOnCopy,
        pixiOnTokenUpdate,
        panelInitOnSetAutoReroll,
        panelInitOnSetActiveToken,
        panelHistoryOnSetAutoRollDamage,
        panelHistoryOnClear,
        panelHistoryOnDelete,
        deleteAllTokensDialogOpen,
        deleteAllWallsDialogOpen,
        deleteAllBlastsDialogOpen,
        setBlasts,
        setBlastsNotInMap,
        getBlastsTable,
        getTokensTable,
        getWallsTable,
        useSessionTables,
        session,
        isPlayerConnected,
        setTokenClipboard,
        setWalls,
        setDeleteAllTokensDialogOpen,
        setDeleteAllWallsDialogOpen,
        setDeleteAllBlastsDialogOpen,
    }
}

export default useCombatSim
