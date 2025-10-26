import { Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../../state/sessionStore'
import colors from '../../utils/colors'
import { db } from '../../utils/db'
import { randomNPCs } from '../../utils/generators/npc/npcs'
import { rollD10WithSpecial, rollDamage, rollToHit, type RollResult, type RollType } from './diceUtils'
import { snapToNinePoints } from './gridUtils'
type ImageUrlCacheEntry = {
    url: string
    size: number
    type: string
}

import { useUserPreferences } from '@/contexts/userPreferencesHooks'
import { blobToImage, createBlankPngBlob, fileToImage } from '@/views/CombatSim/pixiUtils'
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

const useCombatSim = () => {
    const { readerMode } = useUserPreferences()
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [gridSize, setGridSize] = useState(0.1)
    const prevGridSizeRef = useRef(gridSize)
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
    const [isMeasuring, setIsMeasuring] = useState(false)
    const [isWallMode, setIsWallMode] = useState(false)
    const [wallDrawingShape, setWallDrawingShape] = useState<WallShape>()
    const [pendingCount, setPendingCount] = useState(0)
    const [isErasingWalls, setIsErasingWalls] = useState(false)
    const [walls, setWalls] = useState<Wall[]>([])
    const acceptAllRef = useRef<(() => void) | null>(null)
    const cancelAllRef = useRef<(() => void) | null>(null)
    const [deleteMapDialogOpen, setDeleteMapDialogOpen] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteTokenDialogOpen, setDeleteTokenDialogOpen] = useState<string | null>(null)
    const [deleteAllWallsDialogOpen, setDeleteAllWallsDialogOpen] = useState(false)
    const [deleteAllBlastsDialogOpen, setDeleteAllBlastsDialogOpen] = useState(false)
    const [fullscreenImage, setFullscreenImage] = useState<string>('')

    const paperRef = useRef<HTMLDivElement | null>(null)
    const [gridColorAnchor, setGridColorAnchor] = useState<HTMLElement | null>(null)
    const [wallColorAnchor, setWallColorAnchor] = useState<HTMLElement | null>(null)
    const [tokenDialogsOpen, setTokenDialogsOpen] = useState<string[]>([])
    const [tokenClipboard, setTokenClipboard] = useState<Token[] | null>(null)
    const [ready, setReady] = useState(false)

    // Initiative and combat state
    const [isTokenPanelOpen, setIsTokenPanelOpen] = useState(false)
    const [isInitiativePanelOpen, setIsInitiativePanelOpen] = useState(false)
    const [activeTokenId, setActiveTokenId] = useState<string | null>(null)
    const [initiativeRolls, setInitiativeRolls] = useState<Map<string, number>>(new Map())
    const [currentRound, setCurrentRound] = useState(1)
    const [autoRerollInitiative, setAutoRerollInitiative] = useState(false)
    const [autoRollDamage, setAutoRollDamage] = useState(false)
    const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([])
    const [isRollHistoryOpen, setIsRollHistoryOpen] = useState(false)
    const [isCombatActive, setIsCombatActive] = useState(false)

    // Blast state
    const [blasts, setBlasts] = useState<Blast[]>([])
    const [blastsNotInMap, setBlastsNotInMap] = useState<Blast[]>([])
    const [isBlastPanelOpen, setIsBlastPanelOpen] = useState(false)
    const [blastDrawMode, setBlastDrawMode] = useState<BlastType | null>(null)
    const [blastClipboard, setBlastClipboard] = useState<Blast[] | null>(null)

    const half = gridSize / 2

    // Session state
    const session = useSession()

    // Helper function to determine if we should use session tables
    const useSessionTables = () => {
        const result = session.role === 'player' && session.session
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

    // Helper function to send mutations for real-time sync
    const sendMutation = (table: string, op: 'insert' | 'update' | 'delete', record: Record<string, unknown>) => {
        if (!useSessionTables() || !session.connected) {
            return // Only players in sessions with WebRTC connection can send mutations
        }

        session.sendAction({
            kind: 'COMBAT_SIM_MUTATION',
            ops: [{ table, op, record }],
            ts: Date.now(),
        })
    }

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

    const replaceMapTexture = useCallback((next: Texture | null) => {
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
    }, [])

    const getActiveMapKey = () => {
        if (!currentMap) return ''
        return currentMap.mapId ?? currentMap.id
    }

    // Dice rolling and combat helpers
    const addToRollHistory = async (
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

    const handleRevealDamage = async (entryId: string) => {
        setRollHistory((prev) =>
            prev.map((entry) => (entry.id === entryId ? { ...entry, damageRevealed: true } : entry))
        )
        // Save to database
        const rollHistoryTable = getRollHistoryTable()
        await rollHistoryTable.update(entryId, { damageRevealed: true })
    }

    const ensureInitiativeEntriesForAllMaps = async () => {
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

    const saveInitiativeData = async (
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
            sendMutation('initiative', 'update', initiativeData)
        } catch (error) {
            console.error('Failed to save initiative data:', error)
        }
    }

    const handleUpdateInitiative = async (tokenId: string, value: number) => {
        const newRolls = new Map(initiativeRolls)
        newRolls.set(tokenId, value)
        setInitiativeRolls(newRolls)
        // Save to database
        await saveInitiativeData(
            activeTokenId,
            currentRound,
            isCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            newRolls
        )
    }

    // Check if token is seriously wounded (current HP < half of max HP)
    const isSeriouslyWounded = (token: Token): boolean => {
        if (!token.stats) return false
        const maxHP = token.stats.health
        const currentHP = token.stats.currentHealth ?? maxHP
        const threshold = Math.ceil(maxHP / 2)
        return currentHP < threshold
    }

    const rollInitiative = (token: Token): number => {
        const { value } = rollD10WithSpecial()
        return value + (token.stats?.initiative ?? 0)
    }

    const rollAllInitiatives = async () => {
        const newRolls = new Map<string, number>()
        await Promise.all(
            tokens.map(async (token) => {
                const initiative = rollInitiative(token)
                newRolls.set(token.id, initiative)

                // Add to roll history
                const initiativeMod = token.stats?.initiative ?? 0
                const { value, fumble, critical, rolls } = rollD10WithSpecial()
                await addToRollHistory(token, 'initiative', {
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

    const handleMeleeAttack = async (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const woundedPenalty = isSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const diceCount = token.stats?.weapons?.melee?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        await addToRollHistory(token, 'melee-hit', hitResult, damageResult)
    }

    const handleRangedAttack = async (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const woundedPenalty = isSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)

        const diceCount = token.stats?.weapons?.ranged?.d6 ?? 1
        const damageResult = rollDamage(diceCount)

        await addToRollHistory(token, 'ranged-hit', hitResult, damageResult)
    }

    const handleSkillCheck = async (token: Token) => {
        const skills = token.stats?.skills ?? 0
        const woundedPenalty = isSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const result = rollToHit(skills, woundedPenalty)

        await addToRollHistory(token, 'skill', result)
    }

    const handleGrenadeAttack = async (token: Token) => {
        const combat = token.stats?.combat ?? 0
        const woundedPenalty = isSeriouslyWounded(token) && !token.stats?.ignoreSeriouslyWoundedPenalty ? -2 : 0
        const hitResult = rollToHit(combat, woundedPenalty)
        const damageResult = rollDamage(6) // 6d6

        await addToRollHistory(token, 'grenade-hit', hitResult, damageResult)

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

    const handleUpdateTokenCurrent = async (
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
                sendMutation('tokens', 'update', { id: tokenId, ...updateData })
            } else if (field === 'sph') {
                const updateData = {
                    stats: { ...token.stats, armor: { ...token.stats.armor, currentSph: value } },
                }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData })
            } else if (field === 'spb') {
                const updateData = {
                    stats: { ...token.stats, armor: { ...token.stats.armor, currentSpb: value } },
                }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData })
            } else {
                const updateData = { stats: { ...token.stats, currentMovement: value } }
                await tokensTable.update(tokenId, updateData)
                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData })
            }
        }
    }

    const handleNextTurn = async () => {
        // Increment round
        const newRound = currentRound + 1
        setCurrentRound(newRound)

        // Reroll if enabled and use the new rolls for sorting
        const rollsToUse = autoRerollInitiative ? await rollAllInitiatives() : initiativeRolls

        // Set to first token and reset its movement
        const sorted = [...tokens].sort((a, b) => (rollsToUse.get(b.id) ?? 0) - (rollsToUse.get(a.id) ?? 0))
        let newActiveTokenId = activeTokenId
        if (sorted.length > 0) {
            const firstToken = sorted[0]
            newActiveTokenId = firstToken.id
            setActiveTokenId(newActiveTokenId)
            // Reset movement for the new active token
            if (firstToken.stats) {
                handleUpdateTokenCurrent(firstToken.id, 'movement', firstToken.stats.movement)
            }
        }
        // Save initiative state with the new values
        await saveInitiativeData(
            newActiveTokenId,
            newRound,
            isCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            rollsToUse
        )
    }

    const handleToggleCombat = async () => {
        const newIsCombatActive = !isCombatActive
        let newActiveTokenId = activeTokenId
        let newInitiativeRolls = initiativeRolls
        let newCurrentRound = currentRound

        if (!isCombatActive) {
            // Starting combat - roll initiatives
            if (tokens.length > 0) {
                newInitiativeRolls = await rollAllInitiatives()

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
        await saveInitiativeData(
            newActiveTokenId,
            newCurrentRound,
            newIsCombatActive,
            autoRerollInitiative,
            autoRollDamage,
            newInitiativeRolls
        )
    }

    const onResetView = async () => {
        if (!currentMap) {
            fitRef.current?.()
            return
        }
        const tokensTable = getTokensTable()
        await tokensTable.where('mapId').equals(getActiveMapKey()).delete()
        setTokens([])
        const tksNotInMap = await tokensTable.toArray()
        setTokensNotInMap(tksNotInMap)
    }

    const onUploadMap = async (file: globalThis.File) => {
        const img = await fileToImage(file)
        const texture = Texture.from(img as unknown as globalThis.HTMLImageElement)
        replaceMapTexture(texture)
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
        replaceMapTexture(texture)

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
            replaceMapTexture(texture)
        } else {
            console.warn('Failed to load selected map image')
        }
        setGridSize(map.gridSize)
        prevGridSizeRef.current = map.gridSize
        setSnapToGrid(map.snapToGrid)
        setGridColorHex(map.gridColorHex)
        setGridAlpha(map.gridAlpha)
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
                replaceMapTexture(texture)
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
            replaceMapTexture(null)
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
        sendMutation('tokens', 'delete', { id: deleteTokenDialogOpen })
    }

    const onDeleteAllWalls = async () => {
        setWalls([])
        await db.transaction('rw', db.walls, async () => {
            await db.walls.where('mapId').equals(getActiveMapKey()).delete()
        })
        setDeleteAllWallsDialogOpen(false)
    }

    const toggleFullscreenImage = (image: string) => {
        setFullscreenImage(image)
    }

    const handleTokenDrop = async (tokenId: string, worldX: number, worldY: number) => {
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
                sendMutation('tokens', 'update', { id: tokenId, ...updateData })
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

    // Blast handlers
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

    const handleBlastDrop = async (blastData: { type: BlastType; id?: string }, worldX: number, worldY: number) => {
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
            sendMutation('blasts', 'insert', newBlast)
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
            sendMutation('blasts', 'insert', newBlast)

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
            sendMutation('blasts', 'update', { id: blastData.id, ...updatePayload })

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

    const onBlastMove = async (blastId: string, worldX: number, worldY: number) => {
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
        sendMutation('blasts', 'update', { id: blastId, ...updatePayload })
    }

    const onBlastComplete = async (blast: Blast) => {
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
            sendMutation('blasts', 'update', blastToAdd)
        } else {
            // Blast doesn't exist, add it
            await blastsTable.add(blastToAdd)
            setBlasts((prev) => [...prev, blastToAdd])

            // Send mutation for sync
            sendMutation('blasts', 'insert', blastToAdd)
        }

        // Reset draw mode after completing a blast
        setBlastDrawMode(null)
    }

    const onBlastDelete = async (blastId: string) => {
        const blastsTable = getBlastsTable()
        await blastsTable.delete(blastId)
        setBlasts((prev) => prev.filter((b) => b.id !== blastId))

        // Send mutation for sync
        sendMutation('blasts', 'delete', { id: blastId })
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

    const onWallChange = async (updated: Wall[], mapKey: string) => {
        setWalls(updated)
        if (!mapKey) return
        const wallsTable = getWallsTable()
        await db.transaction('rw', wallsTable, async () => {
            await wallsTable.where('mapId').equals(mapKey).delete()
            if (updated.length > 0) {
                await wallsTable.bulkAdd(updated)
                // Send mutations for new walls
                for (const wall of updated) {
                    sendMutation('walls', 'insert', wall)
                }
            }
        })
    }

    const onBindPendingControls = (acceptAll: () => void, cancelAll: () => void) => {
        acceptAllRef.current = acceptAll
        cancelAllRef.current = cancelAll
    }

    const onBindFit = (fn: () => void) => {
        fitRef.current = fn
    }

    const onTokenMove = async (id: string, x: number, y: number, distanceTraveled?: number) => {
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
            sendMutation('tokens', 'update', { id, ...updateData })
        } else {
            const updateData = { x, y }
            await tokensTable.update(id, updateData)

            // Send mutation for sync
            sendMutation('tokens', 'update', { id, ...updateData })
        }
    }

    const onTokenClick = (id: string) => {
        setTokenDialogsOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
    }

    const onTokenDuplicate = async (id: string) => {
        const token = tokens.find((t) => t.id === id)
        if (token) {
            const newToken = {
                ...token,
                name: token.name + ' (Copy)',
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                // Keep same position as original token
            }
            await db.tokens.add(newToken)
            setTokens((prev) => [...prev, newToken])
        }
    }

    const onTokenCut = async (id: string) => {
        const token = tokens.find((t) => t.id === id)
        if (token) {
            // Cut removes the token but stores it in clipboard
            setTokens((prev) => prev.filter((t) => t.id !== id))
            setTokenClipboard([token])
            await db.tokens.delete(id)
        }
    }

    const onTokenCopy = (id: string) => {
        const token = tokens.find((t) => t.id === id)
        if (token) {
            // Create a copy with new ID for clipboard
            const clipboardToken = {
                ...token,
                name: token.name + ' (Copy)',
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            }
            setTokenClipboard([clipboardToken])
        }
    }

    const onMapDeleteAllTokens = () => {
        setClearAllDialogOpen(true)
    }

    const onMapDeleteAllWalls = () => {
        setDeleteAllWallsDialogOpen(true)
    }

    const onMapDeleteAllBlasts = () => {
        setDeleteAllBlastsDialogOpen(true)
    }

    const onDeleteAllBlasts = async () => {
        // Delete all blasts from the current map
        const mapId = getActiveMapKey()
        await db.blasts.where('mapId').equals(mapId).delete()
        setBlasts([])
    }

    const onMapCutAllTokens = async () => {
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

    const onMapPasteToken = async (tokens: Token[]) => {
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

    const onMapPasteBlast = async (newBlasts: Blast[]) => {
        for (const blast of newBlasts) {
            const blastToAdd: Blast = {
                ...blast,
                mapId: getActiveMapKey(),
            }
            await db.blasts.add(blastToAdd)
            setBlasts((prev) => [...prev, blastToAdd])
        }
    }

    const onBlastUpdateCone = async (blastId: string, x2: number, y2: number, x: number, y: number) => {
        await db.blasts.update(blastId, { x, y, x2, y2 })
        setBlasts((prev) => prev.map((b) => (b.id === blastId ? { ...b, x, y, x2, y2 } : b)))
        setBlastsNotInMap((prev) => prev.map((b) => (b.id === blastId ? { ...b, x, y, x2, y2 } : b)))
    }

    const sidePanelWidth = useMemo(() => {
        return (
            (isTokenPanelOpen ? 260 : 0) +
            (isInitiativePanelOpen ? 260 : 0) +
            (isRollHistoryOpen ? 260 : 0) +
            (isBlastPanelOpen ? 260 : 0)
        )
    }, [isTokenPanelOpen, isInitiativePanelOpen, isRollHistoryOpen, isBlastPanelOpen])

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
            await ensureInitiativeEntriesForAllMaps()

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
                        replaceMapTexture(texture)
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
                addToRollHistory(token, 'turn-start', {
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
        if (ready) {
            setIsTokenPanelOpen(true)
        }
    }, [ready])

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
        fieldSx,
        onReplaceMap,
        onUploadMap,
        onSelectMap,
        onTokenDuplicate,
        onTokenCut,
        onTokenCopy,
        getActiveMapKey,
        saveInitiativeData,
        handleRevealDamage,
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
        hexToPixi,
        wallAlpha,
        setClearAllDialogOpen,
        handleTokenDrop,
        onBlastMove,
        onBlastComplete,
        wallColorHex,
        handleBlastDrop,
        setIsMeasuring,
        setIsWallMode,
        setIsErasingWalls,
        setIsTokenPanelOpen,
        setIsInitiativePanelOpen,
        setWallDrawingShape,
        onDeleteMap,
        onResetView,
        onDeleteToken,
        setDefaultTokens,
        setTokensNotInMap,
        onWallChange,
        onBindPendingControls,
        onBindFit,
        onTokenMove,
        onTokenClick,
        onMapDeleteAllTokens,
        onMapDeleteAllWalls,
        onMapDeleteAllBlasts,
        onMapCutAllTokens,
        onMapPasteToken,
        onMapPasteBlast,
        onBlastUpdateCone,
        sidePanelWidth,
        tokens,
        tokensNotInMap,
        mapTexture,
        images,
        pendingCount,
        deleteMapDialogOpen,
        clearAllDialogOpen,
        setDeleteMapDialogOpen,
        deleteTokenDialogOpen,
        deleteAllWallsDialogOpen,
        tokenDialogsOpen,
        gridColorAnchor,
        wallColorAnchor,
        fullscreenImage,
        pixiToCss,
        resolveImageUrl,
        onUploadImage,
        handleUpdateInitiative,
        handleMeleeAttack,
        handleRangedAttack,
        handleSkillCheck,
        handleGrenadeAttack,
        handleNextTurn,
        handleToggleCombat,
        onDeleteAllWalls,
        toggleFullscreenImage,
        onDeleteAllBlasts,
        setWallColorHex,
        setWallAlpha,
        paperRef,
        ready,
        deleteAllBlastsDialogOpen,
        setGridColorAnchor,
        setWallColorAnchor,
        setReady,
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
        setTokenDialogsOpen,
        setTokens,
        setTokenClipboard,
        setDeleteTokenDialogOpen,
        setFullscreenImage,
        setDeleteAllBlastsDialogOpen,
        initiativeRolls,
        activeTokenId,
        currentRound,
        autoRerollInitiative,
        setAutoRerollInitiative,
        isCombatActive,
        isSeriouslyWounded,
        handleUpdateTokenCurrent,
        setDeleteAllWallsDialogOpen,
        isInitiativePanelOpen,
        autoRollDamage,
        setActiveTokenId,
        isRollHistoryOpen,
        setAutoRollDamage,
        setRollHistory,
        isBlastPanelOpen,
        blastDrawMode,
        fitRef,
        setBlastDrawMode,
        setGridColorHex,
        setGridAlpha,
    }
}

export default useCombatSim
