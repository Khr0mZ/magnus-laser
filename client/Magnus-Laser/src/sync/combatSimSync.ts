import { useSession } from '@/state/sessionStore'
import type { GameSnapshot } from '@/types/session'
import { db } from '@/utils/db'
import type {
    Blast,
    BoardMap,
    Initiative,
    Image as MLImage,
    Map as MLMap,
    RollHistoryEntry,
    Token,
    Wall,
} from '@/views/CombatSim/types'

let started = false
let sendTimer: ReturnType<typeof setTimeout> | undefined

export function scheduleSendFullSnapshot() {
    if (sendTimer) clearTimeout(sendTimer)
    sendTimer = setTimeout(async () => {
        try {
            const state = useSession.getState()
            console.log(
                '[CombatSimSync] DM scheduling full snapshot send, role:',
                state.role,
                'connected:',
                state.connected,
                'session:',
                !!state.session
            )
            if (state.role !== 'dm') {
                console.log('[CombatSimSync] Not sending snapshot - not DM')
                return
            }
            if (!state.connected || !state.session) {
                console.log('[CombatSimSync] Not sending snapshot - not in session')
                return
            }
            console.log('[CombatSimSync] Building combat sim snapshot...')
            const full = await buildCombatSimSnapshot()
            console.log(
                '[CombatSimSync] Built snapshot with version:',
                full.version,
                'combatSim data:',
                !!full.custom?.combatSim
            )
            state.sendSnapshot(full)
            console.log('[CombatSimSync] Sent full snapshot to all players')
        } catch (err) {
            console.warn('[CombatSimSync] scheduled sendSnapshot failed', err)
        }
    }, 250)
}

async function buildCombatSimSnapshot(): Promise<GameSnapshot> {
    console.log('[CombatSimSync] Reading DM tables...')
    // Read DM tables
    const [boardMaps, tokens, maps, walls, images, blasts, initiative, rollHistory] = await Promise.all([
        db.boardMaps.toArray(),
        db.tokens.toArray(),
        db.maps.toArray(),
        db.walls.toArray(),
        db.images.toArray(),
        db.blasts.toArray(),
        db.initiative.toArray(),
        db.rollHistory.toArray().catch(() => [] as RollHistoryEntry[]),
    ])

    console.log('[CombatSimSync] DM table counts:', {
        boardMaps: boardMaps.length,
        tokens: tokens.length,
        maps: maps.length,
        walls: walls.length,
        images: images.length,
        blasts: blasts.length,
        initiative: initiative.length,
        rollHistory: rollHistory.length,
    })

    // Include base64 encoded blobs for transport via signaling
    const mapMeta = (await Promise.all(
        maps.map(async (m) => {
            const { id, name, mimeType, width, height, gridSize, snapToGrid, gridColorHex, gridAlpha, size, hash } =
                m as MLMap
            let blobBase64: string | undefined
            const mapWithBlob = m as MLMap & { blob?: Blob }
            if (mapWithBlob.blob) {
                try {
                    const arrayBuf = await mapWithBlob.blob.arrayBuffer()
                    const bytes = new Uint8Array(arrayBuf)
                    let binary = ''
                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
                    blobBase64 = globalThis.btoa(binary)
                    console.log('[CombatSimSync] Encoded map', id, 'blob as base64, size:', blobBase64.length)
                } catch (error) {
                    console.warn('[CombatSimSync] Failed to encode map blob:', error)
                }
            }
            return {
                id,
                name,
                mimeType,
                width,
                height,
                gridSize,
                snapToGrid,
                gridColorHex,
                gridAlpha,
                size,
                hash,
                blobBase64,
            } as Partial<MLMap> & { blobBase64?: string }
        })
    )) as unknown as MLMap[]

    const imageMeta = (await Promise.all(
        images.map(async (im) => {
            const { id, name, mimeType, width, height, size, hash } = im as MLImage
            let blobBase64: string | undefined
            const imageWithBlob = im as MLImage & { blob?: Blob }
            if (imageWithBlob.blob) {
                try {
                    const arrayBuf = await imageWithBlob.blob.arrayBuffer()
                    const bytes = new Uint8Array(arrayBuf)
                    let binary = ''
                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
                    blobBase64 = globalThis.btoa(binary)
                    console.log('[CombatSimSync] Encoded image', id, 'blob as base64, size:', blobBase64.length)
                } catch (error) {
                    console.warn('[CombatSimSync] Failed to encode image blob:', error)
                }
            }
            return {
                id,
                name,
                mimeType,
                width,
                height,
                size,
                hash,
                blobBase64,
            } as Partial<MLImage> & { blobBase64?: string }
        })
    )) as unknown as MLImage[]

    const snapshot: GameSnapshot = {
        version: useSession.getState().snapshot.version ?? 0,
        custom: {
            combatSim: {
                boardMaps: boardMaps as BoardMap[],
                tokens: tokens as Token[],
                maps: mapMeta,
                walls: walls as Wall[],
                images: imageMeta,
                blasts: blasts as Blast[],
                // extended v1.1
                initiative: initiative,
                rollHistory: rollHistory ?? [],
            },
        },
    }
    return snapshot
}

async function applyCombatSimSnapshot(snap: GameSnapshot) {
    console.log('[CombatSimSync] Applying combat sim snapshot, version:', snap.version)

    // Only players should apply snapshots
    const state = useSession.getState()
    if (state.role !== 'player') {
        console.log('[CombatSimSync] Ignoring snapshot - not a player')
        return
    }

    type CombatSimPayload = {
        boardMaps: BoardMap[]
        tokens: Token[]
        maps: MLMap[]
        walls: Wall[]
        images: MLImage[]
        blasts: Blast[]
        initiative?: Initiative[]
        rollHistory?: RollHistoryEntry[]
    }
    const cs = snap.custom?.combatSim as CombatSimPayload | undefined
    if (!cs) {
        console.log('[CombatSimSync] No combat sim data in snapshot')
        return
    }

    console.log('[CombatSimSync] Applying combat sim data to session tables:', {
        boardMaps: cs.boardMaps?.length || 0,
        tokens: cs.tokens?.length || 0,
        maps: cs.maps?.length || 0,
        walls: cs.walls?.length || 0,
        images: cs.images?.length || 0,
        blasts: cs.blasts?.length || 0,
        initiative: cs.initiative?.length || 0,
        rollHistory: cs.rollHistory?.length || 0,
    })
    await db.transaction(
        'rw',
        [
            db.sessionBoardMaps,
            db.sessionTokens,
            db.sessionMaps,
            db.sessionWalls,
            db.sessionImages,
            db.sessionBlasts,
            db.sessionInitiative,
            db.sessionRollHistory,
        ],
        async () => {
            await Promise.all([
                db.sessionBoardMaps.clear(),
                db.sessionTokens.clear(),
                db.sessionMaps.clear(),
                db.sessionWalls.clear(),
                db.sessionImages.clear(),
                db.sessionBlasts.clear(),
                db.sessionInitiative.clear(),
                db.sessionRollHistory.clear(),
            ])
            await Promise.all([
                db.sessionBoardMaps.bulkPut(cs?.boardMaps ?? []),
                db.sessionTokens.bulkPut(cs?.tokens ?? []),
                db.sessionMaps.bulkPut(
                    await Promise.all(
                        ((cs?.maps ?? []) as (MLMap & { blobBase64?: string })[]).map(async (m) => {
                            const result = { ...m } as unknown as MLMap
                            if (m.blobBase64) {
                                try {
                                    const binary = globalThis.atob(m.blobBase64)
                                    const bytes = new Uint8Array(binary.length)
                                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                                    result.blob = new Blob([bytes])
                                    console.log(
                                        '[CombatSimSync] Decoded map',
                                        m.id,
                                        'blob from base64, size:',
                                        result.blob.size
                                    )
                                } catch (error) {
                                    console.warn('[CombatSimSync] Failed to decode map blob:', error)
                                }
                            }
                            return result
                        })
                    )
                ),
                db.sessionWalls.bulkPut(cs?.walls ?? []),
                db.sessionImages.bulkPut(
                    await Promise.all(
                        ((cs?.images ?? []) as (MLImage & { blobBase64?: string })[]).map(async (im) => {
                            const result = { ...im } as unknown as MLImage
                            if (im.blobBase64) {
                                try {
                                    const binary = globalThis.atob(im.blobBase64)
                                    const bytes = new Uint8Array(binary.length)
                                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                                    result.blob = new Blob([bytes])
                                    console.log(
                                        '[CombatSimSync] Decoded image',
                                        im.id,
                                        'blob from base64, size:',
                                        result.blob.size
                                    )
                                } catch (error) {
                                    console.warn('[CombatSimSync] Failed to decode image blob:', error)
                                }
                            }
                            return result
                        })
                    )
                ),
                db.sessionBlasts.bulkPut(cs?.blasts ?? []),
                db.sessionInitiative.bulkPut(cs?.initiative ?? []),
                db.sessionRollHistory.bulkPut(cs?.rollHistory ?? []),
            ])
        }
    )

    console.log('[CombatSimSync] Session tables populated successfully')

    // Player: request missing assets (maps/images) over WebRTC datachannel
    try {
        const state = useSession.getState()
        console.log('[CombatSimSync] Checking for asset requests - role:', state.role, 'connected:', state.connected)
        if (state.role !== 'player') {
            console.log('[CombatSimSync] Not a player, skipping asset requests')
            return
        }
        const requested: Array<{ type: 'map' | 'image'; id: string; hash: string }> = []

        // Maps
        const maps: MLMap[] = (cs?.maps ?? []) as MLMap[]
        console.log('[CombatSimSync] Checking', maps.length, 'maps for missing blobs')
        for (const m of maps) {
            if (!m?.id) continue
            const row = (await db.sessionMaps.get(m.id)) as unknown as { blob?: Blob } | undefined
            const blob: Blob | undefined = row?.blob
            const expectedSize = m.size
            const expectedHash = m.hash
            console.log(
                '[CombatSimSync] Map',
                m.id,
                'has blob:',
                !!blob,
                'expected size:',
                expectedSize,
                'actual size:',
                blob?.size
            )
            if (!blob || (typeof expectedSize === 'number' && blob.size !== expectedSize)) {
                requested.push({ type: 'map', id: m.id, hash: expectedHash ?? '' })
                console.log('[CombatSimSync] Requesting map:', m.id)
            }
        }

        // Images
        const images: MLImage[] = (cs?.images ?? []) as MLImage[]
        console.log('[CombatSimSync] Checking', images.length, 'images for missing blobs')
        for (const im of images) {
            if (!im?.id) continue
            const row = (await db.sessionImages.get(im.id)) as unknown as { blob?: Blob } | undefined
            const blob: Blob | undefined = row?.blob
            const expectedSize = im.size
            const expectedHash = im.hash
            console.log(
                '[CombatSimSync] Image',
                im.id,
                'has blob:',
                !!blob,
                'expected size:',
                expectedSize,
                'actual size:',
                blob?.size
            )
            if (!blob || (typeof expectedSize === 'number' && blob.size !== expectedSize)) {
                requested.push({ type: 'image', id: im.id, hash: expectedHash ?? '' })
                console.log('[CombatSimSync] Requesting image:', im.id)
            }
        }

        console.log('[CombatSimSync] Total assets requested:', requested.length)
        if (requested.length > 0) {
            console.log(
                '[CombatSimSync] Player requesting assets:',
                requested.length,
                'items - sending ASSET_REQUEST via signaling'
            )
            // NOTE: Signaling server doesn't broadcast ACTION messages to all session members
            // This needs to be fixed on the server side, or we need to use WebRTC for all actions
            state.sendAction({ kind: 'ASSET_REQUEST', assets: requested })
        }
    } catch (err) {
        console.warn('Failed to request missing assets', err)
    }
}

export function initCombatSimSync() {
    if (started) return
    started = true
    const runtimeDisposers: Array<() => void> = []

    // When snapshot changes, players mirror combat sim data into session tables
    const unsubSnapshot = useSession.subscribe((state, prev) => {
        console.log(
            '[CombatSimSync] ===== SNAPSHOT SUBSCRIPTION FIRED ===== role:',
            state.role,
            'connected:',
            state.connected,
            'snapshot version:',
            state.snapshot.version
        )
        if (state.role !== 'player') {
            console.log('[CombatSimSync] Ignoring snapshot - not a player')
            return
        }
        if (state.snapshot === prev.snapshot) {
            console.log('[CombatSimSync] Ignoring snapshot - no change')
            return
        }
        console.log('[CombatSimSync] Player applying snapshot, version:', state.snapshot.version)
        applyCombatSimSnapshot(state.snapshot).catch((err) =>
            console.warn('[CombatSimSync] applyCombatSimSnapshot failed', err)
        )
    })

    // On DM: when peers list grows (new player), broadcast a full snapshot
    const seen = new Set<string>(useSession.getState().peers.map((p) => p.id))
    console.log('[CombatSimSync] DM peer tracking initialized, initial peers:', seen.size)
    const unsubPeers = useSession.subscribe((state, prev) => {
        console.log(
            '[CombatSimSync] DM peer subscription fired, role:',
            state.role,
            'peers changed:',
            state.peers !== prev.peers
        )
        if (state.role !== 'dm') {
            console.log('[CombatSimSync] Ignoring peer change - not DM')
            return
        }
        if (state.peers === prev.peers) {
            console.log('[CombatSimSync] Ignoring peer change - no change')
            return
        }
        const peers = state.peers
        const newPeers = peers.filter((p) => !seen.has(p.id) && p.role === 'player')
        console.log('[CombatSimSync] DM found new players:', newPeers.length, 'total peers:', peers.length)
        if (newPeers.length === 0) return
        newPeers.forEach((p) => {
            seen.add(p.id)
            console.log('[CombatSimSync] DM tracking new player:', p.id, p.name)
        })
        console.log('[CombatSimSync] DM sending snapshot to new players...')
        buildCombatSimSnapshot()
            .then((full) => {
                console.log('[CombatSimSync] DM sending snapshot to new players, version:', full.version)
                state.sendSnapshot(full)
            })
            .catch((err) => console.warn('[CombatSimSync] sendSnapshot to new players failed', err))
    })

    // If DM, watch key tables and schedule full snapshot broadcasts on changes (Phase 1)
    if (useSession.getState().role === 'dm') {
        console.log('[CombatSimSync] DM setting up table change hooks')

        const checkIfShouldSync = () => {
            const state = useSession.getState()
            return state.role === 'dm' && state.connected && state.session
        }

        const onCreate = () => {
            if (!checkIfShouldSync()) return
            scheduleSendFullSnapshot()
        }
        const onUpdate = () => {
            if (!checkIfShouldSync()) return
            scheduleSendFullSnapshot()
        }
        const onDelete = () => {
            if (!checkIfShouldSync()) return
            scheduleSendFullSnapshot()
        }

        const createFn = () => onCreate()
        const updateFn = () => onUpdate()
        const deleteFn = () => onDelete()

        db.tokens.hook('creating', createFn)
        db.tokens.hook('updating', updateFn)
        db.tokens.hook('deleting', deleteFn)
        db.walls.hook('creating', createFn)
        db.walls.hook('updating', updateFn)
        db.walls.hook('deleting', deleteFn)
        db.blasts.hook('creating', createFn)
        db.blasts.hook('updating', updateFn)
        db.blasts.hook('deleting', deleteFn)
        db.boardMaps.hook('creating', createFn)
        db.boardMaps.hook('updating', updateFn)
        db.boardMaps.hook('deleting', deleteFn)
        db.maps.hook('creating', createFn)
        db.maps.hook('updating', updateFn)
        db.maps.hook('deleting', deleteFn)
        db.images.hook('creating', createFn)
        db.images.hook('updating', updateFn)
        db.images.hook('deleting', deleteFn)
        db.initiative.hook('creating', createFn)
        db.initiative.hook('updating', updateFn)
        db.initiative.hook('deleting', deleteFn)
        db.rollHistory.hook('creating', createFn)
        db.rollHistory.hook('updating', updateFn)
        db.rollHistory.hook('deleting', deleteFn)

        runtimeDisposers.push(() => {
            db.tokens.hook('creating').unsubscribe(createFn)
            db.tokens.hook('updating').unsubscribe(updateFn)
            db.tokens.hook('deleting').unsubscribe(deleteFn)
            db.walls.hook('creating').unsubscribe(createFn)
            db.walls.hook('updating').unsubscribe(updateFn)
            db.walls.hook('deleting').unsubscribe(deleteFn)
            db.blasts.hook('creating').unsubscribe(createFn)
            db.blasts.hook('updating').unsubscribe(updateFn)
            db.blasts.hook('deleting').unsubscribe(deleteFn)
            db.boardMaps.hook('creating').unsubscribe(createFn)
            db.boardMaps.hook('updating').unsubscribe(updateFn)
            db.boardMaps.hook('deleting').unsubscribe(deleteFn)
            db.maps.hook('creating').unsubscribe(createFn)
            db.maps.hook('updating').unsubscribe(updateFn)
            db.maps.hook('deleting').unsubscribe(deleteFn)
            db.images.hook('creating').unsubscribe(createFn)
            db.images.hook('updating').unsubscribe(updateFn)
            db.images.hook('deleting').unsubscribe(deleteFn)
            db.initiative.hook('creating').unsubscribe(createFn)
            db.initiative.hook('updating').unsubscribe(updateFn)
            db.initiative.hook('deleting').unsubscribe(deleteFn)
            db.rollHistory.hook('creating').unsubscribe(createFn)
            db.rollHistory.hook('updating').unsubscribe(updateFn)
            db.rollHistory.hook('deleting').unsubscribe(deleteFn)
        })
    }

    // Register disposer
    // Consumers can re-import this module safely; we keep singletons above.
    return () => {
        unsubSnapshot()
        unsubPeers()
        runtimeDisposers.forEach((d) => {
            try {
                d()
            } catch {
                /* noop */
            }
        })
        started = false
    }
}
