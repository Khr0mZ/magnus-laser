import { sendMutation } from '@/sync/combatSimSync'
import { blobToImage, createBlankPngBlob, fileToImage } from '@/views/CombatSim/pixiUtils'
import { Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../../state/sessionStore'
import { db } from '../../utils/db'
import { randomNPCs } from '../../utils/generators/npc/npcs'
import { rollD10WithSpecial, rollDamage, rollToHit, type RollResult, type RollType } from './diceUtils'
import { snapToNinePoints } from './gridUtils'
import type {
    Blast,
    BlastType,
    BoardMap,
    Image,
    Map as MapType,
    RollHistoryEntry,
    Token,
    Wall,
    WallShape,
} from './types'

type ImageUrlCacheEntry = {
    url: string
    size: number
    type: string
}

const useCombatSim = () => {
    // PIXI
    const [pixiReady, setPixiReady] = useState(false)
    const [pixiDeleteAllTokensDialogOpen, setPixiDeleteAllTokensDialogOpen] = useState(false)
    const [pixiDeleteAllWallsDialogOpen, setPixiDeleteAllWallsDialogOpen] = useState(false)
    const [pixiDeleteAllBlastsDialogOpen, setPixiDeleteAllBlastsDialogOpen] = useState(false)

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
    const [isRollHistoryOpen, setIsRollHistoryOpen] = useState(false)
    const [isCombatActive, setIsCombatActive] = useState(false)

    // Session state
    const session = useSession()
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
            return upsertImageUrl(image)
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
    // PANEL DATA
    // TOKEN
    const panelOnTokenDuplicate = async (id: string) => {
        const tokenInMap = tokens.find((t) => t.id === id)
        const setTargetTokens = tokenInMap ? setTokens : setTokensNotInMap

        await pixiOnTokenDuplicate(id, {
            allTokens: [...tokens, ...tokensNotInMap],
            existingTokens: [...tokens, ...tokensNotInMap],
            setTargetTokens,
            gridSize,
            getActiveMapKey,
        })
    }
    const panelOnTokenCut = async (id: string) => {
        const tokenInMap = tokens.find((t) => t.id === id)
        const setTargetTokens = tokenInMap ? setTokens : setTokensNotInMap

        await pixiOnTokenCut(id, {
            allTokens: [...tokens, ...tokensNotInMap],
            setTargetTokens,
            gridSize,
        })
    }
    const panelOnTokenCopy = async (id: string) => {
        await pixiOnTokenCopy(id, {
            allTokens: [...tokens, ...tokensNotInMap],
            existingTokens: [...tokens, ...tokensNotInMap],
            gridSize,
        })
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
                await panelHistoryOnAddToRollHistory(token, 'initiative', {
                    total: value + initiativeMod,
                    rolls,
                    fumble,
                    critical,
                    breakdown: `${value}${fumble ? ' (fumble)' : critical ? ' (critical)' : ''} + ${initiativeMod}`,
                })
            })
        )
        setInitiativeRolls(newRolls)
        return newRolls
    }
    const panelInitOnMeleeAttack = async (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const diceCount = token.stats?.weapons?.melee?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        await panelHistoryOnAddToRollHistory(token, 'melee-hit', hitResult, damageResult)
    }
    const panelInitOnRangedAttack = async (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const diceCount = token.stats?.weapons?.ranged?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        await panelHistoryOnAddToRollHistory(token, 'ranged-hit', hitResult, damageResult)
    }
    const panelInitOnSkillCheck = async (token: Token) => {
        const skills = token.stats?.skills ?? 0
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const result = rollToHit(skills, woundedPenalty)

        await panelHistoryOnAddToRollHistory(token, 'skill', result)
    }
    const panelInitOnGrenadeAttack = async (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const woundedPenalty =
            panelInitCheckSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)
        const damageResult = rollDamage(6) // 6d6

        await panelHistoryOnAddToRollHistory(token, 'grenade-hit', hitResult, damageResult)

        // Decrease currentGrenadesOrSpecialAmmo by 1
        const newCount = Math.max(0, (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0) - 1)

        setTokens((prev) =>
            prev.map((t) => {
                if (t.id !== token.id || !t.stats) return t
                return {
                    ...t,
                    stats: {
                        ...t.stats,
                        weapons: {
                            ...t.stats.weapons,
                            currentGrenadesOrSpecialAmmo: newCount,
                        },
                    },
                }
            })
        )

        // Also update database if not default token
        if (token.mapId !== '') {
            try {
                await db.tokens.update(token.id, {
                    'stats.weapons.currentGrenadesOrSpecialAmmo': newCount,
                })
            } catch (error) {
                console.error('Error updating grenades:', error)
            }
        }
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

                        // Initialize grenades
                        if (t.stats.weapons.currentGrenadesOrSpecialAmmo === undefined) {
                            const grenades = t.stats.weapons.grenadesOrSpecialAmmo
                            if (grenades) {
                                // Roll the grenades dice
                                let count = 0
                                if (grenades.d4) {
                                    for (let i = 0; i < grenades.d4; i++) {
                                        count += Math.floor(Math.random() * 4) + 1
                                    }
                                }
                                if (grenades.d6) {
                                    for (let i = 0; i < grenades.d6; i++) {
                                        count += Math.floor(Math.random() * 6) + 1
                                    }
                                }
                                if (grenades.d8) {
                                    for (let i = 0; i < grenades.d8; i++) {
                                        count += Math.floor(Math.random() * 8) + 1
                                    }
                                }

                                updatedStats = {
                                    ...updatedStats,
                                    weapons: {
                                        ...updatedStats.weapons,
                                        currentGrenadesOrSpecialAmmo: count,
                                    },
                                }
                                needsUpdate = true
                            }
                        }

                        // Initialize currentMovement to movement
                        updatedStats = {
                            ...updatedStats,
                            currentMovement: updatedStats.movement,
                        }
                        needsUpdate = true

                        // Update database for non-default tokens
                        if (needsUpdate && t.mapId !== '') {
                            const updates: Record<string, unknown> = {
                                'stats.currentMovement': updatedStats.movement,
                            }
                            if (updatedStats.weapons.currentGrenadesOrSpecialAmmo !== undefined) {
                                updates['stats.weapons.currentGrenadesOrSpecialAmmo'] =
                                    updatedStats.weapons.currentGrenadesOrSpecialAmmo
                            }
                            db.tokens.update(t.id, updates).catch(console.error)
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
        damageResult?: RollResult
    ) => {
        const entry: RollHistoryEntry = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            timestamp: Date.now(),
            tokenId: token.id,
            tokenName: token.name,
            rollType,
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
    const onActivateDrawMode = (type: BlastType) => {
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
    const openDeleteAllTokensDialog = () => {
        setPixiDeleteAllTokensDialogOpen(true)
    }
    const openDeleteTokenDialog = (id: string | null) => {
        setDeleteTokenDialogOpen(id)
    }
    const openDeleteAllWallsDialog = () => {
        setPixiDeleteAllWallsDialogOpen(true)
    }
    const openDeleteAllBlastsDialog = () => {
        setPixiDeleteAllBlastsDialogOpen(true)
    }
    const closeDeleteAllTokensDialog = () => {
        setPixiDeleteAllTokensDialogOpen(false)
    }
    const closeDeleteTokenDialog = () => {
        setDeleteTokenDialogOpen(null)
    }
    const closeDeleteAllWallsDialog = () => {
        setPixiDeleteAllWallsDialogOpen(false)
    }
    const closeDeleteAllBlastsDialog = () => {
        setPixiDeleteAllBlastsDialogOpen(false)
    }
    const onTokenClick = (id: string | undefined) => {
        if (id) {
            setTokenDialogsOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
        }
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
        setPixiDeleteAllTokensDialogOpen(false)
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
        setPixiDeleteAllBlastsDialogOpen(false)
    }
    const onDeleteAllWalls = async () => {
        setWalls([])
        await db.transaction('rw', db.walls, async () => {
            await db.walls.where('mapId').equals(getActiveMapKey()).delete()
        })
        setPixiDeleteAllWallsDialogOpen(false)
    }

    // PIXI DATA
    const pixiOnBlastDrop = async (blastData: { type: BlastType; id?: string }, worldX: number, worldY: number) => {
        const currentMapId = getActiveMapKey()

        // Check if it's a grenade template or an existing blast
        if (blastData.type === 'grenade' && !blastData.id) {
            // Create new grenade blast with auto-numbered name
            const existingGrenades = blasts.filter((b) => b.type === 'grenade')
            const grenadeNumber = existingGrenades.length + 1

            const newBlast: Blast = {
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                mapId: currentMapId,
                type: 'grenade',
                name: `Grenade ${grenadeNumber}`,
                x: worldX,
                y: worldY,
                alpha: 0.7,
                locked: false,
            }
            const blastsTable = getBlastsTable()
            await blastsTable.add(newBlast)
            setBlasts((prev) => [...prev, newBlast])

            // Send mutation for sync
            sendMutation('blasts', 'insert', newBlast, useSessionTables, session)
        } else if (blastData.type === 'cone' && !blastData.id) {
            // Create placeholder cone blast at drop position for 2-step placement process
            // PixiBoard will update it with the final orientation on confirmation
            const placeholderId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now())
            const newBlast: Blast = {
                id: placeholderId,
                mapId: currentMapId,
                type: 'cone',
                x: worldX,
                y: worldY,
                x2: worldX + 6 * gridSize, // Temporary default orientation
                y2: worldY,
                size: 6,
                alpha: 0.7,
                locked: false,
            }
            // Add numbered name
            const existingFlamers = blasts.filter((b) => b.type === 'cone')
            const flamerNumber = existingFlamers.length + 1
            newBlast.name = `Flamer ${flamerNumber}`

            const blastsTable = getBlastsTable()
            await blastsTable.add(newBlast)
            setBlasts((prev) => [...prev, newBlast])

            // Send mutation for sync
            sendMutation('blasts', 'insert', newBlast, useSessionTables, session)

            // Modify blastData to include the ID so PixiBoard knows it's an existing blast now
            blastData.id = placeholderId
            // Fall through to existing blast handling
        }
        if (blastData.id) {
            // Handle existing blasts - all go through normal move operation
            // Rotation mode for cones will be initiated by PixiBoard after movement
            const existing = [...blasts, ...blastsNotInMap].find((b) => b.id === blastData.id)
            // Move existing blast; translate cone endpoint if present
            const oldX = existing?.x ?? (blastData as unknown as Blast).x ?? worldX
            const oldY = existing?.y ?? (blastData as unknown as Blast).y ?? worldY
            const dx = worldX - oldX
            const dy = worldY - oldY

            const updatePayload: Partial<Blast> = {
                mapId: currentMapId,
                x: worldX,
                y: worldY,
            }

            const prevX2 = existing?.x2 ?? (blastData as unknown as Blast).x2
            const prevY2 = existing?.y2 ?? (blastData as unknown as Blast).y2
            let adjustedX2 = prevX2
            let adjustedY2 = prevY2

            // First apply normal translation
            if (typeof prevX2 === 'number' && typeof prevY2 === 'number') {
                adjustedX2 = prevX2 + dx
                adjustedY2 = prevY2 + dy
            }

            // Note: Cone blasts are handled by PixiBoard drop handler, so this code only runs for non-cone blasts

            if (typeof adjustedX2 === 'number' && typeof adjustedY2 === 'number') {
                updatePayload.x2 = adjustedX2
                updatePayload.y2 = adjustedY2
            }
            updatePayload.size = existing?.size || 6

            const blastsTable = getBlastsTable()
            await blastsTable.update(blastData.id, updatePayload)

            // Send mutation for sync
            sendMutation('blasts', 'update', { id: blastData.id, ...updatePayload }, useSessionTables, session)

            // Update state
            const updatedBlast: Blast = {
                ...(existing ?? (blastData as unknown as Blast)),
                ...updatePayload,
                id: blastData.id!,
                alpha: existing?.alpha ?? (blastData as unknown as Blast).alpha ?? 0.7,
                locked: existing?.locked ?? false,
            }
            setBlasts((prev) => {
                const filtered = prev.filter((b) => b.id !== blastData.id)
                return [...filtered, updatedBlast]
            })
            setBlastsNotInMap((prev) => prev.filter((b) => b.id !== blastData.id))
        }
    }
    const pixiOnBlastMove = async (blastId: string, worldX: number, worldY: number) => {
        const blast = blasts.find((b) => b.id === blastId)
        if (!blast || blast.locked) return

        const dx = worldX - blast.x
        const dy = worldY - blast.y
        const updatePayload: Partial<Blast> = { x: worldX, y: worldY }
        if (blast.type === 'cone' && typeof blast.x2 === 'number' && typeof blast.y2 === 'number') {
            updatePayload.x2 = blast.x2 + dx
            updatePayload.y2 = blast.y2 + dy
        }

        const blastsTable = getBlastsTable()
        await blastsTable.update(blastId, updatePayload)
        setBlasts((prev) => prev.map((b) => (b.id === blastId ? { ...b, ...updatePayload } : b)))

        // Send mutation for sync
        sendMutation('blasts', 'update', { id: blastId, ...updatePayload }, useSessionTables, session)
    }
    const pixiOnBlastComplete = async (blast: Blast) => {
        let blastToAdd = blast

        const blastsTable = getBlastsTable()

        // Check if this blast already exists (e.g., dragged from blastsNotInMap)
        const existingBlast = await blastsTable.get(blast.id)

        // Auto-assign names for cone blasts like grenades (only if not already named)
        if (blast.type === 'cone' && !blast.name) {
            // Find all cone blasts for this map and get the highest number used
            const allFlamers = await blastsTable
                .where('mapId')
                .equals(blast.mapId)
                .and((b) => b.type === 'cone')
                .toArray()
            const numbers = allFlamers
                .map((b) => b.name?.match(/Flamer (\d+)/)?.[1])
                .filter((n): n is string => n !== undefined)
                .map((n) => parseInt(n, 10))
            const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
            const flamerNumber = maxNumber + 1
            blastToAdd = { ...blast, name: `Flamer ${flamerNumber}` }
        }

        if (existingBlast) {
            // Blast already exists, update it
            await blastsTable.update(blast.id, blastToAdd)
            setBlasts((prev) => {
                const blastExistsInBlasts = prev.some((b) => b.id === blast.id)
                if (blastExistsInBlasts) {
                    // Update existing blast in blasts array
                    return prev.map((b) => (b.id === blast.id ? blastToAdd : b))
                } else {
                    // Blast was in blastsNotInMap, add it to blasts array
                    return [...prev, blastToAdd]
                }
            })
            // Remove from blastsNotInMap if it was there
            setBlastsNotInMap((prev) => prev.filter((b) => b.id !== blast.id))

            // Send mutation for sync
            sendMutation('blasts', 'update', blastToAdd, useSessionTables, session)
        } else {
            // Blast doesn't exist, add it
            await blastsTable.add(blastToAdd)
            setBlasts((prev) => [...prev, blastToAdd])

            // Send mutation for sync
            sendMutation('blasts', 'insert', blastToAdd, useSessionTables, session)
        }

        // Reset draw mode after completing a blast
        setBlastDrawMode(null)
    }
    const pixiOnBlastUpdateCone = async (blastId: string, x2: number, y2: number, x: number, y: number) => {
        await db.blasts.update(blastId, { x, y, x2, y2 })
        setBlasts((prev) => prev.map((b) => (b.id === blastId ? { ...b, x, y, x2, y2 } : b)))
        setBlastsNotInMap((prev) => prev.map((b) => (b.id === blastId ? { ...b, x, y, x2, y2 } : b)))
    }
    const pixiSidePanelWidth = useMemo(() => {
        return (
            (isTokenPanelOpen ? 260 : 0) +
            (isInitiativePanelOpen ? 260 : 0) +
            (isRollHistoryOpen ? 260 : 0) +
            (isBlastPanelOpen ? 260 : 0)
        )
    }, [isTokenPanelOpen, isInitiativePanelOpen, isRollHistoryOpen, isBlastPanelOpen])

    const pixiOnCutAllTokens = async () => {
        // Copy all current map tokens to clipboard
        const tokensWithUpdatedRadius = tokens.map((t) => ({
            ...t,
            radius: Math.max(1, Math.floor(gridSize / 2)),
        }))
        setTokenClipboard(tokensWithUpdatedRadius)
        // Delete all tokens from map
        for (const token of tokens) {
            await db.tokens.delete(token.id)
        }
        setTokens([])
    }
    const pixiOnPasteToken = async (tokens: Token[]) => {
        for (const token of tokens) {
            const newToken: Token = {
                ...token,
                radius: Math.max(1, Math.floor(gridSize / 2)),
                mapId: getActiveMapKey(),
            }
            await db.tokens.add(newToken)
            setTokens((prev) => [...prev, newToken])
        }
    }
    const pixiOnPasteBlast = async (newBlasts: Blast[]) => {
        for (const blast of newBlasts) {
            const blastToAdd: Blast = {
                ...blast,
                mapId: getActiveMapKey(),
            }
            await db.blasts.add(blastToAdd)
            setBlasts((prev) => [...prev, blastToAdd])
        }
    }
    const pixiOnTokenDuplicate = async (
        id: string,
        options: {
            allTokens?: Token[]
            existingTokens?: Token[]
            setTargetTokens?: React.Dispatch<React.SetStateAction<Token[]>>
            gridSize?: number
            getActiveMapKey?: () => string
        } = {}
    ) => {
        const {
            allTokens = tokens,
            existingTokens = tokens,
            setTargetTokens = setTokens,
            gridSize = 50,
            getActiveMapKey = () => '',
        } = options

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
                radius: Math.max(1, Math.floor(gridSize / 2)),
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                mapId: getActiveMapKey(),
                // Keep same position as original token
            }
            await db.tokens.add(newToken)
            setTargetTokens((prev) => [...prev, newToken])
        }
    }
    const pixiOnTokenCut = async (
        id: string,
        options: {
            allTokens?: Token[]
            setTargetTokens?: React.Dispatch<React.SetStateAction<Token[]>>
            gridSize?: number
        } = {}
    ) => {
        const { allTokens = tokens, setTargetTokens = setTokens, gridSize = 50 } = options

        const token = allTokens.find((t) => t.id === id)
        if (token) {
            const newToken = {
                ...token,
                radius: Math.max(1, Math.floor(gridSize / 2)),
            }
            setTokenClipboard([newToken])
            // Cut removes the token but stores it in clipboard
            setTargetTokens((prev) => prev.filter((t) => t.id !== id))
            await db.tokens.delete(id)
        }
    }
    const pixiOnTokenCopy = (
        id: string,
        options: {
            allTokens?: Token[]
            existingTokens?: Token[]
            gridSize?: number
        } = {}
    ) => {
        const { allTokens = tokens, existingTokens = tokens, gridSize = 50 } = options

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
                radius: Math.max(1, Math.floor(gridSize / 2)),
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            }
            setTokenClipboard([clipboardToken])
        }
    }
    const pixiOnWallDraw = async (updated: Wall[], mapKey: string) => {
        setWalls(updated)
        if (!mapKey) return
        const wallsTable = getWallsTable()
        await db.transaction('rw', wallsTable, async () => {
            await wallsTable.where('mapId').equals(mapKey).delete()
            if (updated.length > 0) {
                await wallsTable.bulkAdd(updated)
                // Send mutations for new walls
                for (const wall of updated) {
                    sendMutation('walls', 'insert', wall, useSessionTables, session)
                }
            }
        })
    }
    const pixiOnBindFit = (fn: () => void) => {
        fitRef.current = fn
    }
    const pixiOnTokenMove = async (id: string, x: number, y: number, distanceTraveled?: number) => {
        setTokens((prev) =>
            prev.map((tk) => {
                if (tk.id !== id) return tk
                // If distance traveled is provided, update currentMovement
                if (distanceTraveled !== undefined && tk.stats) {
                    const newCurrentMovement = Math.max(0, tk.stats.currentMovement - distanceTraveled)
                    return {
                        ...tk,
                        x,
                        y,
                        stats: {
                            ...tk.stats,
                            currentMovement: newCurrentMovement,
                        },
                    }
                }
                return { ...tk, x, y }
            })
        )
        // Update database
        const tokensTable = getTokensTable()
        const token = tokens.find((t) => t.id === id)
        if (distanceTraveled !== undefined && token?.stats) {
            const newCurrentMovement = Math.max(0, token.stats.currentMovement - distanceTraveled)
            const updateData = {
                x,
                y,
                stats: {
                    ...token.stats,
                    currentMovement: newCurrentMovement,
                },
            }
            await tokensTable.update(id, updateData)

            // Send mutation for sync
            sendMutation('tokens', 'update', { id, ...updateData }, useSessionTables, session)
        } else {
            const updateData = { x, y }
            await tokensTable.update(id, updateData)

            // Send mutation for sync
            sendMutation('tokens', 'update', { id, ...updateData }, useSessionTables, session)
        }
    }
    const pixiOnBindPendingControls = (acceptAll: () => void, cancelAll: () => void) => {
        acceptAllRef.current = acceptAll
        cancelAllRef.current = cancelAll
    }
    const pixiOnTokenDrop = async (tokenId: string, worldX: number, worldY: number) => {
        const token = [...tokens, ...tokensNotInMap].find((t) => t.id === tokenId)
        if (!token) return

        const currentMapId = getActiveMapKey()

        // Update token position, map, and radius based on current grid size
        const updatedToken: Token = {
            ...token,
            mapId: currentMapId,
            x: worldX,
            y: worldY,
            radius: Math.max(1, Math.floor(gridSize / 2)),
        }

        // Update in database (only for non-default tokens)
        if (token.mapId !== '') {
            try {
                const tokensTable = getTokensTable()
                const updateData = {
                    mapId: currentMapId,
                    x: worldX,
                    y: worldY,
                    radius: Math.max(1, Math.floor(gridSize / 2)),
                }
                await tokensTable.update(tokenId, updateData)

                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData }, useSessionTables, session)
            } catch (error) {
                console.error('Error updating token:', error)
            }
        }

        // Update state
        setTokens((prev) => {
            const filtered = prev.filter((t) => t.id !== tokenId)
            return [...filtered, updatedToken]
        })

        setTokensNotInMap((prev) => prev.filter((t) => t.id !== tokenId))
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
                        console.warn('Failed to load map image, map may not display correctly')
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
                panelHistoryOnAddToRollHistory(token, 'turn-start', {
                    total: 0,
                    rolls: [],
                    fumble: false,
                    critical: false,
                    breakdown: '',
                }).catch(console.error)
            }
        }
    }, [activeTokenId, isCombatActive])
    // Persist grid size to selected map and update token radii
    useEffect(() => {
        const persistGridSize = async () => {
            if (!currentMap?.mapId) return

            const oldGridSize = prevGridSizeRef.current

            // Skip token update if gridSize hasn't actually changed
            // This prevents recalculation when loading a map
            const hasGridSizeChanged = oldGridSize !== gridSize

            // Update the ref immediately to prevent race conditions with multiple quick changes
            prevGridSizeRef.current = gridSize

            await db.maps.update(currentMap.mapId, { gridSize })
            setMaps((prev) => prev.map((a) => (a.id === currentMap.mapId ? { ...a, gridSize } : a)))

            // Only update tokens if the grid size actually changed
            if (hasGridSizeChanged && oldGridSize > 0) {
                // Update all tokens in the current map with new radius and position
                const activeMapKey = getActiveMapKey()

                // Get fresh tokens from database to avoid stale closure
                const tokensInCurrentMap = await db.tokens.where('mapId').equals(activeMapKey).toArray()

                // Update tokens in database and calculate new positions/radii
                const updates = tokensInCurrentMap.map((token) => {
                    // Get size multiplier (1=medium, 2=large, 3=huge, 4=gargantuan)
                    const multiplier = Math.round(token.radius / (oldGridSize / 2))
                    // Calculate new radius based on new grid size
                    // Keep it simple - just apply the multiplier to the new grid
                    const newRadius = (gridSize / 2) * multiplier

                    // Calculate new position (snap if enabled)
                    let newX = token.x
                    let newY = token.y
                    if (snapToGrid) {
                        const snapped = snapToNinePoints(token.x, token.y, gridSize, true)
                        newX = snapped.x
                        newY = snapped.y
                    }

                    return {
                        token,
                        newRadius,
                        newX,
                        newY,
                    }
                })

                // Update tokens in database
                await Promise.all(
                    updates.map(({ token, newRadius, newX, newY }) =>
                        db.tokens.update(token.id, { radius: newRadius, x: newX, y: newY })
                    )
                )

                // Update tokens state
                setTokens((prev) =>
                    prev.map((t) => {
                        const update = updates.find((u) => u.token.id === t.id)
                        if (update) {
                            return { ...t, radius: update.newRadius, x: update.newX, y: update.newY }
                        }
                        return t
                    })
                )
            }
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
    useEffect(() => {
        if (pixiReady) {
            setIsTokenPanelOpen(true)
        }
    }, [pixiReady])
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
        pixiOnTokenDuplicate,
        pixiOnTokenCut,
        pixiOnTokenCopy,
        getActiveMapKey,
        handleRevealDamage: panelHistoryOnRevealDamage,
        blasts,
        blastsNotInMap,
        onActivateDrawMode,
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
        pixiOnTokenDrop,
        wallColorHex,
        setIsMeasuring,
        setIsWallMode,
        setIsErasingWalls,
        setIsTokenPanelOpen,
        setIsInitiativePanelOpen,
        setWallDrawingShape,
        onDeleteMap,
        onDeleteAllTokens: onDeleteAllTokens,
        onDeleteToken,
        setDefaultTokens,
        setTokensNotInMap,
        pixiOnWallDraw,
        pixiOnBindPendingControls,
        pixiOnBindFit,
        pixiOnTokenMove,
        onTokenClick,
        openDeleteAllTokensDialog,
        openDeleteAllWallsDialog,
        openDeleteAllBlastsDialog,
        pixiOnCutAllTokens,
        pixiOnPasteToken,
        pixiOnPasteBlast,
        tokens,
        tokensNotInMap,
        mapTexture,
        images,
        pendingCount,
        deleteMapDialogOpen,
        deleteAllTokensDialogOpen: pixiDeleteAllTokensDialogOpen,
        setDeleteMapDialogOpen,
        deleteTokenDialogOpen,
        deleteAllWallsDialogOpen: pixiDeleteAllWallsDialogOpen,
        tokenDialogsOpen,
        gridColorAnchor,
        wallColorAnchor,
        fullscreenImage,
        resolveImageUrl,
        onUploadImage,
        handleUpdateInitiative: panelInitOnChangeInitiative,
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
        deleteAllBlastsDialogOpen: pixiDeleteAllBlastsDialogOpen,
        setGridColorAnchor,
        setWallColorAnchor,
        rollHistory,
        setIsRollHistoryOpen,
        setIsBlastPanelOpen,
        blastClipboard,
        defaultTokens,
        gridSize,
        setGridSize,
        gridColorHex,
        gridAlpha,
        snapToGrid,
        setSnapToGrid,
        isTokenPanelOpen,
        setTokens,
        openDeleteTokenDialog,
        closeDeleteTokenDialog,
        setFullscreenImage,
        initiativeRolls,
        activeTokenId,
        currentRound,
        autoRerollInitiative,
        isCombatActive,
        isSeriouslyWounded: panelInitCheckSeriouslyWounded,
        panelInitOnUpdateTokenCurrent,
        isInitiativePanelOpen,
        autoRollDamage,
        isRollHistoryOpen,
        isBlastPanelOpen,
        blastDrawMode,
        fitRef,
        setBlastDrawMode,
        setGridColorHex,
        setGridAlpha,
        panelOnTokenDuplicate,
        panelOnTokenCut,
        panelOnTokenCopy,
        panelInitOnSetAutoReroll,
        panelInitOnSetActiveToken,
        panelHistoryOnSetAutoRollDamage,
        panelHistoryOnClear,
        panelHistoryOnDelete,
        pixiOnBlastMove,
        pixiOnBlastComplete,
        pixiOnBlastDrop,
        pixiOnBlastUpdateCone,
        pixiSidePanelWidth,
        pixiReady,
        setPixiReady,
        closeDeleteAllTokensDialog,
        closeDeleteAllWallsDialog,
        closeDeleteAllBlastsDialog,
    }
}

export default useCombatSim
