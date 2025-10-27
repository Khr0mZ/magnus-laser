import { RelayTransport } from '@/net/relay'
import { createSignalingClient, type SignalingClient } from '@/net/signaling'
import { WebRTCManager, type PeerEvent } from '@/net/webrtc'
import type { GameSnapshot, PeerInfo, Role, SessionInfo, WireMsg } from '@/types/session'
import { KV_KEYS, db, getKV, setKV } from '@/utils/db'
import type {
    Blast,
    BoardMap,
    Map as CombatMap,
    Image,
    Initiative,
    RollHistoryEntry,
    Token,
    Wall,
} from '@/views/CombatSim/types'
import { invoke } from '@tauri-apps/api/core'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Transport = 'webrtc' | 'ws' | 'none'

interface StartHostResponse {
    code: string
    hostId: string
    localWsUrl: string
    publicUrl: string
}

interface SessionRuntime {
    signaling?: SignalingClient
    webrtc?: WebRTCManager
    relay?: RelayTransport
    selfId?: string
    hosting: boolean
    fallbackTimer?: number
    offeredPeers: Set<string>
    disposers: Array<() => void>
    rtcConnectedPeers: Set<string>
    assetBuffers: Map<string, { type: 'map' | 'image'; id: string; hash: string; chunks: string[]; total?: number }>
}

const runtime: SessionRuntime = {
    hosting: false,
    offeredPeers: new Set(),
    disposers: [],
    rtcConnectedPeers: new Set(),
    assetBuffers: new Map(),
}

const FALLBACK_MS = 9_000

// Asset streaming message shapes and type guards
type AssetRef = { type: 'map' | 'image'; id: string; hash: string }
type AssetChunkMsg = { kind: 'ASSET_CHUNK'; asset: AssetRef; seq: number; total: number; payload: string }
type AssetDoneMsg = { kind: 'ASSET_DONE'; asset: AssetRef }
type AssetRequestMsg = { kind: 'ASSET_REQUEST'; assets: AssetRef[] }
type MutationOp = {
    table: 'blasts' | 'tokens' | 'initiative'
    op: 'insert' | 'update' | 'delete'
    record?: Record<string, unknown>
}
type CombatSimMutationMsg = { kind: 'COMBAT_SIM_MUTATION'; ops: MutationOp[]; ts?: number }

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null
}

function isAssetRef(v: unknown): v is AssetRef {
    if (!isObject(v)) return false
    const type = v.type
    const id = v.id
    const hash = v.hash
    return (type === 'map' || type === 'image') && typeof id === 'string' && typeof hash === 'string'
}

function isAssetChunk(v: unknown): v is AssetChunkMsg {
    if (!isObject(v)) return false
    return (
        v.kind === 'ASSET_CHUNK' &&
        isAssetRef(v.asset) &&
        typeof v.seq === 'number' &&
        typeof v.total === 'number' &&
        typeof v.payload === 'string'
    )
}

function isAssetDone(v: unknown): v is AssetDoneMsg {
    return isObject(v) && v.kind === 'ASSET_DONE' && isAssetRef(v.asset)
}

function isAssetRequest(v: unknown): v is AssetRequestMsg {
    return isObject(v) && v.kind === 'ASSET_REQUEST' && Array.isArray(v.assets) && v.assets.every(isAssetRef)
}

function isCombatSimMutation(v: unknown): v is CombatSimMutationMsg {
    return isObject(v) && v.kind === 'COMBAT_SIM_MUTATION' && Array.isArray(v.ops)
}

async function bytesSHA256Base64(bytes: Uint8Array): Promise<string> {
    const ab =
        bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
            ? (bytes.buffer as ArrayBuffer)
            : (bytes.buffer as ArrayBuffer).slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    const hash = await globalThis.crypto.subtle.digest('SHA-256', ab)
    const view = new Uint8Array(hash)
    let binary = ''
    for (let i = 0; i < view.byteLength; i++) binary += String.fromCharCode(view[i])
    return globalThis.btoa(binary)
}

async function buildSimpleCombatSnapshot(): Promise<GameSnapshot> {
    // Read DM tables without blob encoding for faster mutation-triggered snapshots
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

    const snapshot: GameSnapshot = {
        version: useSession.getState().snapshot.version ?? 0,
        custom: {
            combatSim: {
                boardMaps: boardMaps as BoardMap[],
                tokens: tokens as Token[],
                maps: maps as CombatMap[], // No blob encoding for speed
                walls: walls as Wall[],
                images: images as Image[], // No blob encoding for speed
                blasts: blasts as Blast[],
                initiative: initiative as Initiative[],
                rollHistory: rollHistory as RollHistoryEntry[],
            },
        },
    }
    return snapshot
}

type TauriWindow = typeof window & {
    __TAURI__?: {
        core?: {
            invoke?: (...args: unknown[]) => unknown
        }
    }
}

const hasTauriInvoke = () =>
    typeof window !== 'undefined' && typeof (window as TauriWindow).__TAURI__?.core?.invoke === 'function'

// Track if auto-reconnect has been attempted to prevent multiple calls
let autoReconnectAttempted = false

interface SessionState {
    displayName: string
    role: Role | null
    session?: SessionInfo
    peers: PeerInfo[]
    snapshot: GameSnapshot
    transport: Transport
    connected: boolean
    selfId?: string
    kicked: boolean
    initFromDexie: () => Promise<void>
    setName: (name: string) => Promise<void>
    setRole: (role: Role | null) => Promise<void>
    createSession: () => Promise<void>
    joinSession: (code: string, url: string) => Promise<void>
    leaveSession: () => Promise<void>
    sendAction: (action: unknown) => void
    sendSnapshot: (snapshot: GameSnapshot) => void
    sendPatch: (base: number, patch: Partial<GameSnapshot>) => void
    applySnapshot: (snap: GameSnapshot) => Promise<void>
    applyPatch: (base: number, patch: Partial<GameSnapshot>) => Promise<void>
    setTransport: (t: Transport) => void
}

function clearRuntime(set: (partial: Partial<SessionState>) => void) {
    runtime.disposers.forEach((dispose) => {
        try {
            dispose()
        } catch (err) {
            console.warn('session dispose error', err)
        }
    })
    runtime.disposers = []

    if (runtime.fallbackTimer) {
        clearTimeout(runtime.fallbackTimer)
        runtime.fallbackTimer = undefined
    }

    runtime.webrtc?.shutdown()
    runtime.signaling?.close()

    runtime.webrtc = undefined
    runtime.signaling = undefined
    runtime.relay = undefined
    runtime.selfId = undefined
    runtime.hosting = false
    runtime.offeredPeers.clear()
    runtime.rtcConnectedPeers.clear()
    runtime.assetBuffers.clear()

    set({ transport: 'none', connected: false })
}

async function ensureStopHost() {
    if (!hasTauriInvoke()) return
    try {
        await invoke('stop_host')
    } catch (err) {
        console.warn('stop_host failed', err)
    }
}

function scheduleFallback(set: (partial: Partial<SessionState>) => void) {
    if (runtime.fallbackTimer) clearTimeout(runtime.fallbackTimer)
    runtime.fallbackTimer = Number(
        setTimeout(() => {
            set({ transport: 'ws', connected: true })
        }, FALLBACK_MS)
    )
}

function handlePresence(peers: PeerInfo[], set: (partial: Partial<SessionState>) => void, get: () => SessionState) {
    const { role } = get()
    const previousPeers = get().peers
    const previousById = new Map(previousPeers.map((peer) => [peer.id, peer]))
    const mergedPeers = peers.map((peer) => {
        const existing = previousById.get(peer.id)
        if (!existing) {
            return { ...peer }
        }
        const connected = existing.connected ? true : peer.connected
        if (connected === peer.connected) {
            return { ...peer }
        }
        return { ...peer, connected }
    })
    set({ peers: mergedPeers })
    const peerIds = new Set(peers.map((p) => p.id))
    Array.from(runtime.offeredPeers).forEach((peerId) => {
        if (!peerIds.has(peerId)) runtime.offeredPeers.delete(peerId)
    })
    if (!runtime.selfId) return
    if (role !== 'dm' || !runtime.webrtc) {
        return
    }
    const pending = peers.filter((peer) => peer.id !== runtime.selfId && !runtime.offeredPeers.has(peer.id))
    pending.forEach((peer) => {
        runtime.offeredPeers.add(peer.id)
        runtime.webrtc?.createOffer(peer).catch((err) => console.warn('Failed to create WebRTC offer', err))
    })
}

async function handlePeerEvent(
    event: PeerEvent,
    set: (partial: Partial<SessionState>) => void,
    get: () => SessionState
) {
    if (event.type === 'connected') {
        if (runtime.fallbackTimer) {
            clearTimeout(runtime.fallbackTimer)
            runtime.fallbackTimer = undefined
        }
        runtime.rtcConnectedPeers.add(event.peerId)
        set({ transport: 'webrtc', connected: true })
        // Update peer connected status
        const { peers } = get()
        const updatedPeers = peers.map((peer) => (peer.id === event.peerId ? { ...peer, connected: true } : peer))
        set({ peers: updatedPeers })

        // Proactively send assets to newly connected players
        // This works around the signaling server not broadcasting ACTION messages
        const connectedPeer = peers.find((p) => p.id === event.peerId)
        if (connectedPeer && connectedPeer.role === 'player' && get().role === 'dm') {
            setTimeout(async () => {
                try {
                    if (!runtime.webrtc || !runtime.rtcConnectedPeers.has(event.peerId)) {
                        return
                    }

                    // Get all maps and images from DM's database
                    const [maps, images] = await Promise.all([db.maps.toArray(), db.images.toArray()])

                    // Helper function to send a single asset
                    const sendAsset = async (asset: AssetRef, blob: Blob) => {
                        try {
                            const arrayBuf = await blob.arrayBuffer()
                            const bytes = new Uint8Array(arrayBuf)
                            const chunkSize = 64 * 1024
                            const total = Math.ceil(bytes.byteLength / chunkSize)

                            for (let seq = 0; seq < total; seq++) {
                                const start = seq * chunkSize
                                const end = Math.min(start + chunkSize, bytes.byteLength)
                                const slice = bytes.subarray(start, end)
                                let binary = ''
                                for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i])
                                const b64 = globalThis.btoa(binary)

                                // Backpressure: if bufferedAmount is large, wait to drain
                                if (runtime.webrtc && runtime.webrtc.getBufferedAmount(event.peerId) > 1_000_000) {
                                    await runtime.webrtc.waitForDrain(event.peerId, 512_000)
                                }

                                runtime.webrtc?.sendToPeer(event.peerId, {
                                    t: 'ACTION',
                                    id: `${asset.id}:${seq}`,
                                    actor: runtime.selfId ?? 'dm',
                                    action: {
                                        kind: 'ASSET_CHUNK',
                                        asset,
                                        seq,
                                        total,
                                        payload: b64,
                                    },
                                } as WireMsg)
                            }

                            runtime.webrtc?.sendToPeer(event.peerId, {
                                t: 'ACTION',
                                id: `${asset.id}:done`,
                                actor: runtime.selfId ?? 'dm',
                                action: { kind: 'ASSET_DONE', asset },
                            } as WireMsg)
                        } catch (error) {
                            console.warn('[SessionStore] Failed to send asset', asset, 'to player:', error)
                        }
                    }

                    // Send all maps and images proactively
                    for (const map of maps) {
                        if (map.blob) {
                            await sendAsset({ type: 'map', id: map.id, hash: map.hash || '' }, map.blob)
                        }
                    }

                    for (const image of images) {
                        if (image.blob) {
                            await sendAsset({ type: 'image', id: image.id, hash: image.hash || '' }, image.blob)
                        }
                    }
                } catch (error) {
                    console.warn('[SessionStore] Failed to send assets to player:', error)
                }
            }, 2000) // Wait 2 seconds for connection to stabilize
        }
    } else if (event.type === 'disconnected') {
        runtime.rtcConnectedPeers.delete(event.peerId)
        if ([...runtime.offeredPeers].length === 0) {
            set({ connected: false })
        }
        // Update peer connected status
        const { peers } = get()
        const updatedPeers = peers.map((peer) => (peer.id === event.peerId ? { ...peer, connected: false } : peer))
        set({ peers: updatedPeers })
    } else if (event.type === 'message') {
        await handleInboundMessage('webrtc', event.payload, set, get)
    }
}

async function handleInboundMessage(
    _origin: 'ws' | 'webrtc',
    msg: WireMsg,
    set: (partial: Partial<SessionState>) => void,
    get: () => SessionState
) {
    switch (msg.t) {
        case 'SESSION_CREATED': {
            const current = get().session
            if (current) {
                set({
                    session: { ...current, code: msg.code, hostId: msg.hostId },
                    transport: 'ws',
                    connected: true,
                })
            }
            break
        }
        case 'JOIN_OK': {
            // Fallback: if youAre is missing, try to get info from peers
            let youAre = msg.youAre
            if (!youAre && msg.peers) {
                // Find the player peer (assuming we're the player)
                const selfPeer = msg.peers.find((p) => p.role === 'player')
                if (selfPeer) {
                    youAre = {
                        id: selfPeer.id,
                        role: selfPeer.role,
                        name: selfPeer.name,
                        connected: selfPeer.connected,
                    }
                }
            }
            // Final fallback
            youAre = youAre || { id: 'unknown-player', role: 'player' as const, name: 'Player', connected: false }
            if (!youAre) {
                console.warn('JOIN_OK received without youAre data')
                break
            }
            runtime.selfId = youAre.id
            const hostPeer = msg.peers.find((peer) => peer.role === 'dm')
            set({
                selfId: youAre.id,
                role: youAre.role, // Set role from server
                peers: msg.peers,
                transport: 'ws',
                connected: true,
                session: {
                    code: get().session?.code ?? '',
                    hostId: hostPeer?.id ?? '',
                    createdAt: Date.now(),
                    publicUrl: get().session?.publicUrl,
                },
            })
            runtime.webrtc?.shutdown()
            try {
                runtime.webrtc = new WebRTCManager({
                    selfId: youAre.id,
                    sendSignal: (payload) => runtime.signaling?.send(payload),
                    onPeerEvent: async (event) => await handlePeerEvent(event, set, get),
                    polite: youAre.role === 'player',
                })
            } catch (error) {
                console.error('[SessionStore] Failed to create WebRTC manager:', error)
                runtime.webrtc = undefined
            }
            runtime.relay = new RelayTransport(youAre.id, (payload) => runtime.signaling?.send(payload))
            scheduleFallback(set)
            break
        }
        case 'JOIN_DENY': {
            set({ connected: false })
            break
        }
        case 'PRESENCE': {
            handlePresence(msg.peers, set, get)
            break
        }
        case 'STATE_SNAPSHOT': {
            void get().applySnapshot(msg.snapshot)
            break
        }
        case 'STATE_PATCH': {
            void get().applyPatch(msg.base, msg.patch)
            break
        }
        case 'ACTION': {
            const state = get()
            try {
                const actorId = msg.actor
                const actorPeer = state.peers.find((p) => p.id === actorId)
                const actorName = actorPeer?.name ?? ''
                const payload: unknown = msg.action
                // Player-side: handle incoming asset chunks
                if (state.role !== 'dm') {
                    if (isAssetChunk(payload)) {
                        const key = `${payload.asset.type}:${payload.asset.id}:${payload.asset.hash}`
                        const entry = runtime.assetBuffers.get(key) ?? {
                            type: payload.asset.type,
                            id: payload.asset.id,
                            hash: payload.asset.hash,
                            chunks: [],
                            total: payload.total,
                        }
                        entry.chunks[payload.seq] = payload.payload
                        entry.total = payload.total
                        runtime.assetBuffers.set(key, entry)
                        break
                    }
                    if (isAssetDone(payload)) {
                        const key = `${payload.asset.type}:${payload.asset.id}:${payload.asset.hash}`
                        const entry = runtime.assetBuffers.get(key)
                        if (entry) {
                            try {
                                const binaries = entry.chunks.map((b64) => globalThis.atob(b64))
                                const totalLen = binaries.reduce((acc, bin) => acc + bin.length, 0)
                                const bytes = new Uint8Array(totalLen)
                                let offset = 0
                                for (const bin of binaries) {
                                    for (let i = 0; i < bin.length; i++) bytes[offset++] = bin.charCodeAt(i)
                                }
                                // Verify hash before committing
                                const computed = await bytesSHA256Base64(bytes)
                                const expected = entry.hash || payload.asset.hash
                                if (expected && computed !== expected) {
                                    console.warn('ASSET hash mismatch, discarding', payload.asset)
                                    runtime.assetBuffers.delete(key)
                                    break
                                }
                                const blob = new Blob([bytes])
                                if (payload.asset.type === 'map') {
                                    const assetId = payload.asset.id
                                    const meta = await db.sessionMaps.get(assetId)
                                    if (meta)
                                        await db.sessionMaps.update(assetId, { blob } as Partial<
                                            import('@/views/CombatSim/types').Map
                                        >)
                                } else {
                                    const assetId = payload.asset.id
                                    const meta = await db.sessionImages.get(assetId)
                                    if (meta)
                                        await db.sessionImages.update(assetId, { blob } as Partial<
                                            import('@/views/CombatSim/types').Image
                                        >)
                                }
                                runtime.assetBuffers.delete(key)
                            } catch (e) {
                                console.warn('Failed to assemble/verify asset', e)
                                runtime.assetBuffers.delete(key)
                            }
                        }
                        break
                    }
                    break
                }
                if (!isCombatSimMutation(payload) && !isAssetRequest(payload)) break
                if (isAssetRequest(payload)) {
                    // Send assets via the existing WebRTC connection used for session communication
                    // This reuses the already established WebRTC connection
                    if (!runtime.webrtc || !runtime.rtcConnectedPeers.has(actorId)) {
                        return
                    }
                    const peer = get().peers.find((p) => p.id === actorId)
                    if (peer && !runtime.webrtc) {
                        runtime.webrtc = new WebRTCManager({
                            selfId: runtime.selfId ?? '',
                            sendSignal: (msg: WireMsg) => runtime.signaling?.send(msg),
                            onPeerEvent: (event: PeerEvent) => {
                                if (event.type === 'connected') {
                                    runtime.rtcConnectedPeers.add(event.peerId)
                                    set({ connected: true })

                                    // When a player connects via WebRTC, proactively send them any assets they might need
                                    // This works around the signaling server not broadcasting ACTION messages
                                    const connectedPeer = get().peers.find((p) => p.id === event.peerId)
                                    if (connectedPeer && connectedPeer.role === 'player') {
                                        // Send assets proactively since ASSET_REQUEST via signaling doesn't work
                                        setTimeout(async () => {
                                            try {
                                                if (!runtime.webrtc || !runtime.rtcConnectedPeers.has(event.peerId)) {
                                                    return
                                                }

                                                // Get all maps and images from DM's database
                                                const [maps, images] = await Promise.all([
                                                    db.maps.toArray(),
                                                    db.images.toArray(),
                                                ])

                                                // Helper function to send a single asset
                                                const sendAsset = async (asset: AssetRef, blob: Blob) => {
                                                    try {
                                                        const arrayBuf = await blob.arrayBuffer()
                                                        const bytes = new Uint8Array(arrayBuf)
                                                        const chunkSize = 64 * 1024
                                                        const total = Math.ceil(bytes.byteLength / chunkSize)

                                                        for (let seq = 0; seq < total; seq++) {
                                                            const start = seq * chunkSize
                                                            const end = Math.min(start + chunkSize, bytes.byteLength)
                                                            const slice = bytes.subarray(start, end)
                                                            let binary = ''
                                                            for (let i = 0; i < slice.length; i++)
                                                                binary += String.fromCharCode(slice[i])
                                                            const b64 = globalThis.btoa(binary)

                                                            // Backpressure: if bufferedAmount is large, wait to drain
                                                            if (
                                                                runtime.webrtc &&
                                                                runtime.webrtc.getBufferedAmount(event.peerId) >
                                                                    1_000_000
                                                            ) {
                                                                await runtime.webrtc.waitForDrain(event.peerId, 512_000)
                                                            }

                                                            runtime.webrtc?.sendToPeer(event.peerId, {
                                                                t: 'ACTION',
                                                                id: `${asset.id}:${seq}`,
                                                                actor: runtime.selfId ?? 'dm',
                                                                action: {
                                                                    kind: 'ASSET_CHUNK',
                                                                    asset,
                                                                    seq,
                                                                    total,
                                                                    payload: b64,
                                                                },
                                                            } as WireMsg)
                                                        }

                                                        runtime.webrtc?.sendToPeer(event.peerId, {
                                                            t: 'ACTION',
                                                            id: `${asset.id}:done`,
                                                            actor: runtime.selfId ?? 'dm',
                                                            action: { kind: 'ASSET_DONE', asset },
                                                        } as WireMsg)
                                                    } catch (error) {
                                                        console.warn(
                                                            '[SessionStore] Failed to send asset',
                                                            asset,
                                                            'to player:',
                                                            error
                                                        )
                                                    }
                                                }

                                                // Send all maps and images proactively
                                                for (const map of maps) {
                                                    if (map.blob) {
                                                        await sendAsset(
                                                            { type: 'map', id: map.id, hash: map.hash || '' },
                                                            map.blob
                                                        )
                                                    }
                                                }

                                                for (const image of images) {
                                                    if (image.blob) {
                                                        await sendAsset(
                                                            { type: 'image', id: image.id, hash: image.hash || '' },
                                                            image.blob
                                                        )
                                                    }
                                                }
                                            } catch (error) {
                                                console.warn('[SessionStore] Failed to send assets to player:', error)
                                            }
                                        }, 1000)
                                    }
                                } else if (event.type === 'disconnected') {
                                    runtime.rtcConnectedPeers.delete(event.peerId)
                                    if (runtime.rtcConnectedPeers.size === 0) {
                                        set({ connected: false })
                                    }
                                }
                            },
                            polite: true,
                        })
                    }
                    // Since signaling server doesn't broadcast ACTION messages, try to send assets via WebRTC if connected
                    // If not connected, we'll rely on proactive sending when players connect
                    setTimeout(async () => {
                        for (const asset of payload.assets) {
                            try {
                                const row =
                                    asset.type === 'map' ? await db.maps.get(asset.id) : await db.images.get(asset.id)
                                const blob = (row as unknown as { blob?: Blob })?.blob
                                if (!blob) {
                                    console.warn('[SessionStore] Asset not found or has no blob:', asset)
                                    continue
                                }
                                const arrayBuf = await blob.arrayBuffer()
                                const bytes = new Uint8Array(arrayBuf)
                                const chunkSize = 64 * 1024
                                const total = Math.ceil(bytes.byteLength / chunkSize)
                                for (let seq = 0; seq < total; seq++) {
                                    const start = seq * chunkSize
                                    const end = Math.min(start + chunkSize, bytes.byteLength)
                                    const slice = bytes.subarray(start, end)
                                    let binary = ''
                                    for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i])
                                    const b64 = globalThis.btoa(binary)
                                    // Backpressure: if bufferedAmount is large, wait to drain
                                    if (runtime.webrtc && runtime.webrtc.getBufferedAmount(actorId) > 1_000_000) {
                                        await runtime.webrtc.waitForDrain(actorId, 512_000)
                                    }
                                    runtime.webrtc?.sendToPeer(actorId, {
                                        t: 'ACTION',
                                        id: `${asset.id}:${seq}`,
                                        actor: runtime.selfId ?? 'dm',
                                        action: { kind: 'ASSET_CHUNK', asset, seq, total, payload: b64 },
                                    } as WireMsg)
                                }
                                runtime.webrtc?.sendToPeer(actorId, {
                                    t: 'ACTION',
                                    id: `${asset.id}:done`,
                                    actor: runtime.selfId ?? 'dm',
                                    action: { kind: 'ASSET_DONE', asset },
                                } as WireMsg)
                            } catch (err) {
                                console.warn('[SessionStore] ASSET send failed:', err)
                            }
                        }
                    }, 2000) // Wait 2 seconds for WebRTC connection
                    break
                }
                // DM: apply mutation ops
                if (!isCombatSimMutation(payload)) {
                    break
                }
                const currentState = get()
                if (currentState.role !== 'dm') {
                    break
                }
                for (const op of payload.ops) {
                    if (!op || !op.table || !op.op) continue
                    if (op.table === 'blasts') {
                        const recAny = op.record as unknown
                        if (!recAny) continue
                        if (op.op === 'insert') {
                            await db.blasts.put(recAny as import('@/views/CombatSim/types').Blast)
                        } else if (op.op === 'update') {
                            const recTyped = recAny as { id?: string } & Partial<
                                import('@/views/CombatSim/types').Blast
                            >
                            const id = recTyped.id
                            if (id) {
                                // Build changes without id to satisfy types and linter
                                const rest: Partial<import('@/views/CombatSim/types').Blast> = { ...recTyped }
                                delete (rest as { id?: string }).id
                                await db.blasts.update(id, rest)
                            }
                        } else if (op.op === 'delete') {
                            const id = (recAny as { id?: string }).id
                            if (id) await db.blasts.delete(id)
                        }
                    } else if (op.table === 'tokens') {
                        const rec = op.record as Record<string, unknown>
                        if (!rec?.id) continue
                        const existing = await db.tokens.get(rec.id as string)
                        const owner =
                            (existing as { owner?: string } | undefined)?.owner ?? (rec as { owner?: string }).owner
                        if (owner && actorName && owner !== actorName) continue
                        if (op.op === 'update') {
                            const { id, ...changes } = rec
                            await db.tokens.update(id as string, changes)
                        } else if (op.op === 'delete') {
                            await db.tokens.delete(rec.id as string)
                        }
                    } else if (op.table === 'initiative') {
                        const rec = op.record as Record<string, unknown>
                        const boardMapId = typeof rec?.boardMapId === 'string' ? (rec.boardMapId as string) : undefined
                        if (!boardMapId) continue
                        // Get the mapId from the board map
                        const bm = await db.boardMaps.get(boardMapId)
                        const mapId = (bm as unknown as { mapId?: string })?.mapId ?? boardMapId
                        // Get current initiative by mapId
                        const current = await db.initiative.get(mapId)
                        const next: import('@/views/CombatSim/types').Initiative = {
                            ...(current ?? {
                                mapId,
                                activeTokenId: null,
                                currentRound: 1,
                                isCombatActive: true,
                                autoRerollInitiative: false,
                                autoRollDamage: false,
                                initiativeRolls: {},
                            }),
                        }
                        const value = typeof rec?.value === 'number' ? (rec.value as number) : undefined
                        const tokenId = typeof rec?.tokenId === 'string' ? (rec.tokenId as string) : undefined
                        if (value !== undefined && tokenId) {
                            const tok = await db.tokens.get(tokenId)
                            const owner = (tok as { owner?: string } | undefined)?.owner
                            if (owner && actorName && owner !== actorName) continue
                            next.initiativeRolls = { ...(next.initiativeRolls ?? {}), [tokenId]: value }
                        }
                        if (rec?.advance === true) {
                            // Only allow owner of current active token to advance
                            if (current?.activeTokenId) {
                                const activeTok = await db.tokens.get(current.activeTokenId)
                                const owner = (activeTok as { owner?: string } | undefined)?.owner
                                if (owner && actorName && owner !== actorName) continue
                            }
                            const rolls = next.initiativeRolls || {}
                            // Build candidate list from map tokens
                            const bm = await db.boardMaps.get(boardMapId)
                            const activeKey = (bm as unknown as { mapId?: string })?.mapId ?? boardMapId
                            const mapTokens = await db.tokens.where('mapId').equals(activeKey).toArray()
                            const sorted = [...mapTokens].sort((a, b) => (rolls[b.id] ?? 0) - (rolls[a.id] ?? 0))
                            if (sorted.length > 0) {
                                const curIdx = sorted.findIndex((t) => t.id === next.activeTokenId)
                                const nextIdx = curIdx < 0 ? 0 : (curIdx + 1) % sorted.length
                                next.activeTokenId = sorted[nextIdx].id
                                next.currentRound = (next.currentRound ?? 1) + 1
                            }
                        }
                        const nextActiveId =
                            typeof rec?.activeTokenId === 'string' ? (rec.activeTokenId as string) : undefined
                        if (nextActiveId) {
                            next.activeTokenId = nextActiveId
                        }
                        if (typeof rec?.currentRound === 'number') next.currentRound = rec.currentRound
                        await db.initiative.put(next)
                    }
                }
                // Send snapshot after mutations are applied
                const stateAfterMutations = get()
                if (stateAfterMutations.role === 'dm') {
                    try {
                        const snapshot = await buildSimpleCombatSnapshot()
                        stateAfterMutations.sendSnapshot(snapshot)
                        // Update local snapshot version
                        set({ snapshot })
                    } catch (err) {
                        console.warn('[SessionStore] Failed to send snapshot after mutations:', err)
                    }
                }
            } catch (err) {
                console.warn('Failed to apply ACTION', err)
            }
            break
        }
        case 'RTC_OFFER': {
            runtime.webrtc?.handleOffer(msg.from, msg.sdp).catch((err) => console.warn('handle offer failed', err))
            break
        }
        case 'RTC_ANSWER': {
            runtime.webrtc?.handleAnswer(msg.from, msg.sdp).catch((err) => console.warn('handle answer failed', err))
            break
        }
        case 'RTC_ICE': {
            runtime.webrtc?.handleIce(msg.from, msg.candidate).catch((err) => console.warn('handle ice failed', err))
            break
        }
        case 'ERROR': {
            console.warn('Signaling error', msg.code, msg.message)
            if (msg.code === 'HOST_LEFT') {
                // Host left the session, automatically leave
                clearRuntime(set)
                set({
                    session: undefined,
                    peers: [],
                    snapshot: { version: 0 },
                    selfId: undefined,
                })
                // Clear the last session code and public URL
                await setKV(KV_KEYS.lastSessionCode, '')
                await setKV(KV_KEYS.publicUrl, '')
            } else if (msg.code === 'KICKED') {
                set({ kicked: true })
            }
            break
        }
        case 'PING':
        case 'PONG':
        case 'HELLO':
        case 'CREATE_SESSION':
        case 'JOIN_SESSION':
            break
        default: {
            const exhaustive: never = msg
            return exhaustive
        }
    }
}

async function startHost(
    name: string,
    hostInfo: StartHostResponse,
    set: (partial: Partial<SessionState>) => void,
    get: () => SessionState
) {
    runtime.selfId = hostInfo.hostId
    runtime.hosting = true
    runtime.offeredPeers.clear()

    const sessionInfo: SessionInfo = {
        code: hostInfo.code,
        hostId: hostInfo.hostId,
        createdAt: Date.now(),
        publicUrl: hostInfo.publicUrl,
    }

    set({
        session: sessionInfo,
        transport: 'none',
        connected: false,
        peers: [],
        selfId: hostInfo.hostId,
    })

    await setKV(KV_KEYS.lastSessionCode, hostInfo.code)
    await setKV(KV_KEYS.publicUrl, hostInfo.publicUrl)

    const signaling = await createSignalingClient(hostInfo.localWsUrl, { role: 'dm', name })
    runtime.signaling = signaling
    runtime.relay = new RelayTransport(hostInfo.hostId, (payload) => signaling.send(payload))
    runtime.webrtc = new WebRTCManager({
        selfId: hostInfo.hostId,
        sendSignal: (payload) => signaling.send(payload),
        onPeerEvent: async (event) => await handlePeerEvent(event, set, get),
    })

    runtime.disposers.push(
        signaling.onMessage(async (msg) => await handleInboundMessage('ws', msg, set, get)),
        signaling.onClose(() => {
            const state = get()
            if (runtime.rtcConnectedPeers.size > 0) {
                set({ connected: true, transport: 'webrtc' })
                return
            }
            if (state.transport === 'ws') {
                set({ connected: false, transport: 'ws' })
                return
            }
            set({ connected: false, transport: 'none' })
        })
    )

    signaling.send({ t: 'CREATE_SESSION' })
}

async function startJoiner(
    name: string,
    code: string,
    url: string,
    set: (partial: Partial<SessionState>) => void,
    get: () => SessionState
) {
    set({
        session: {
            code,
            hostId: '',
            createdAt: Date.now(),
            publicUrl: url,
        },
        transport: 'none',
    })

    const signaling = await createSignalingClient(url, { role: 'player', name })
    runtime.signaling = signaling

    runtime.disposers.push(
        signaling.onMessage(async (msg) => await handleInboundMessage('ws', msg, set, get)),
        signaling.onClose(() => {
            const state = get()
            if (runtime.rtcConnectedPeers.size > 0) {
                set({ connected: true, transport: 'webrtc' })
                return
            }
            if (state.transport === 'ws') {
                set({ connected: false, transport: 'ws' })
                return
            }
            set({ connected: false, transport: 'none' })
        })
    )

    signaling.send({ t: 'JOIN_SESSION', code, name })
    await setKV(KV_KEYS.lastSessionCode, code)
}

type SessionActions = {
    initAutoReconnect: () => Promise<void>
    initFromDexie: () => Promise<void>
    setName: (name: string) => Promise<void>
    setRole: (role: Role | null) => Promise<void>
    createSession: () => Promise<void>
    joinSession: (code: string, url: string) => Promise<void>
    leaveSession: () => Promise<void>
    clearSession: () => Promise<void>
    sendAction: (action: unknown) => void
    applySnapshot: (snap: GameSnapshot) => Promise<void>
    applyPatch: (base: number, patch: Partial<GameSnapshot>) => Promise<void>
    kickPlayer: (peerId: string) => Promise<void>
}

export type SessionStore = SessionState & SessionActions

export const useSession = create<SessionStore>()(
    persist(
        (set, get) => ({
            displayName: '',
            role: null,
            session: undefined,
            peers: [],
            snapshot: { version: 0 },
            transport: 'none',
            connected: false,
            selfId: undefined,
            kicked: false,

            // Auto-reconnect on app startup
            initAutoReconnect: async () => {
                // Don't auto-reconnect if already attempted
                if (autoReconnectAttempted) {
                    return
                }

                autoReconnectAttempted = true

                try {
                    const [code, role, name] = await Promise.all([
                        getKV<string>(KV_KEYS.lastSessionCode),
                        getKV<Role | null>(KV_KEYS.lastRole),
                        getKV<string>(KV_KEYS.displayName),
                    ])

                    // Auto-reconnect player if there's a stored session
                    if (code && role === 'player') {
                        const displayName = name || 'Player'
                        const url = `https://${code}.trycloudflare.com`
                        await startJoiner(displayName, code, url, set, get)
                    }
                } catch (err) {
                    console.warn('Failed to auto-reconnect:', err)
                }
            },

            initFromDexie: async () => {
                const [name, role, code, lastSnap, publicUrl] = await Promise.all([
                    getKV<string>(KV_KEYS.displayName),
                    getKV<Role | null>(KV_KEYS.lastRole),
                    getKV<string>(KV_KEYS.lastSessionCode),
                    getKV<{ version: number; snapshot: GameSnapshot }>(KV_KEYS.lastSnapshot),
                    getKV<string>(KV_KEYS.publicUrl),
                ])
                if (name) set({ displayName: name })
                if (role) set({ role })
                if (lastSnap) set({ snapshot: lastSnap.snapshot })

                // Auto-reconnect player if there's a stored session
                if (code && role === 'player') {
                    try {
                        const url = `https://${code}.trycloudflare.com`
                        await startJoiner(name || 'Player', code, url, set, get)
                    } catch (err) {
                        console.warn('Failed to auto-reconnect player:', err)
                        // Clear the stored session data if auto-reconnect fails
                        await setKV(KV_KEYS.lastSessionCode, '')
                        await setKV(KV_KEYS.publicUrl, '')
                    }
                } else if (code) {
                    // For DMs or unknown roles, just restore the session object
                    set({
                        session: {
                            code,
                            hostId: '',
                            createdAt: Date.now(),
                            publicUrl: publicUrl || '',
                        },
                    })
                }
            },

            setName: async (name) => {
                set({ displayName: name })
                await setKV(KV_KEYS.displayName, name)
            },

            setRole: async (role) => {
                set({ role })
                await setKV(KV_KEYS.lastRole, role)
            },

            createSession: async () => {
                const { role, displayName } = get()
                if (role !== 'dm') throw new Error('Only the DM can create a session')
                if (!hasTauriInvoke()) {
                    throw new Error('Session hosting is only available in the Magnus Laser desktop app.')
                }
                const name = displayName || 'Game Master'
                clearRuntime(set)
                const hostInfo = await invoke<StartHostResponse>('start_host', { provider: null })
                await startHost(name, hostInfo, set, get)
            },

            joinSession: async (code, url) => {
                const name = get().displayName || 'Player'
                if (!code) throw new Error('Session code is required')
                clearRuntime(set)
                await startJoiner(name, code, url, set, get)
            },

            leaveSession: async () => {
                const wasHosting = runtime.hosting
                clearRuntime(set)
                set({
                    session: undefined,
                    peers: [],
                    snapshot: { version: 0 },
                    selfId: undefined,
                })
                // Clear the last session code and public URL when leaving
                await setKV(KV_KEYS.lastSessionCode, '')
                await setKV(KV_KEYS.publicUrl, '')
                if (wasHosting) {
                    await ensureStopHost()
                }
            },

            clearSession: async () => {
                clearRuntime(set)
                set({
                    session: undefined,
                    peers: [],
                    snapshot: { version: 0 },
                    selfId: undefined,
                    transport: 'none',
                    connected: false,
                })
                // Clear stored session data
                await setKV(KV_KEYS.lastSessionCode, '')
                await setKV(KV_KEYS.publicUrl, '')

                // Clear session combat simulator tables
                await db.sessionBoardMaps.clear()
                await db.sessionTokens.clear()
                await db.sessionMaps.clear()
                await db.sessionWalls.clear()
                await db.sessionImages.clear()
                await db.sessionBlasts.clear()
                await db.sessionInitiative.clear()
                await db.sessionRollHistory.clear()
            },

            sendAction: (action) => {
                if (!runtime.selfId) return
                const { transport, session } = get()
                const cryptoApi = globalThis.crypto
                const messageId = cryptoApi?.randomUUID?.() ?? Math.random().toString(36).slice(2)

                if (transport === 'webrtc' && session?.hostId) {
                    const delivered = runtime.webrtc?.sendToPeer(session.hostId, {
                        t: 'ACTION',
                        id: messageId,
                        actor: runtime.selfId,
                        action,
                    })
                    if (delivered) return
                }

                runtime.relay?.sendAction(action)
            },

            sendSnapshot: (snapshot) => {
                runtime.relay?.sendSnapshot(snapshot)
            },

            sendPatch: (base, patch) => {
                runtime.relay?.sendPatch(base, patch)
            },

            applySnapshot: async (snap) => {
                set({ snapshot: snap })
                await setKV(KV_KEYS.lastSnapshot, { version: snap.version, snapshot: snap })
            },

            applyPatch: async (base, patch) => {
                const current = get().snapshot
                if (current.version !== base) return
                const next = { ...current, ...patch, version: base + 1 }
                set({ snapshot: next })
                await setKV(KV_KEYS.lastSnapshot, { version: next.version, snapshot: next })
            },

            kickPlayer: async (peerId: string) => {
                const { role } = get()
                if (role !== 'dm') {
                    throw new Error('Only DMs can kick players')
                }
                await invoke('kick_player', { peerId })
            },

            setTransport: (t) => set({ transport: t }),
        }),
        {
            name: 'ml-session-volatile',
            partialize: (state) => ({
                displayName: state.displayName,
                role: state.role,
                session: state.session,
                peers: state.peers,
                snapshot: state.snapshot,
                transport: state.transport,
                connected: state.connected,
                selfId: state.selfId,
            }),
        }
    )
)
