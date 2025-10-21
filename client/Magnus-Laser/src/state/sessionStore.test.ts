import type { PeerEvent } from '@/net/webrtc'
import type { WireMsg } from '@/types/session'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockKv = new Map<string, unknown>()
const signalingInstances: Array<ReturnType<typeof createSignalingStub>> = []
const webrtcInstances: Array<MockWebRTCManager> = []
const relayInstances: Array<MockRelayTransport> = []

const invokeMock = vi.fn(async () => hostResponse())

vi.mock('@tauri-apps/api/core', () => ({
    invoke: invokeMock,
}))

vi.mock('@/utils/db', () => ({
    getKV: vi.fn(async (key: string) => mockKv.get(key)),
    setKV: vi.fn(async (key: string, value: unknown) => {
        mockKv.set(key, value)
    }),
    KV_KEYS: {
        displayName: 'displayName',
        lastRole: 'lastRole',
        lastSessionCode: 'lastSessionCode',
        lastSnapshot: 'lastSnapshot',
    },
}))

function createSignalingStub(url: string) {
    const messageListeners = new Set<(msg: WireMsg) => void>()
    const closeListeners = new Set<(ev: Event) => void>()
    return {
        url,
        send: vi.fn(),
        onMessage: (cb: (msg: WireMsg) => void) => {
            messageListeners.add(cb)
            return () => messageListeners.delete(cb)
        },
        onClose: (cb: (ev: Event) => void) => {
            closeListeners.add(cb)
            return () => closeListeners.delete(cb)
        },
        close: vi.fn(),
        emit: (msg: WireMsg) => {
            messageListeners.forEach((cb) => cb(msg))
        },
        emitClose: () => {
            const ev = new Event('close')
            closeListeners.forEach((cb) => cb(ev))
        },
    }
}

vi.mock('@/net/signaling', () => ({
    createSignalingClient: vi.fn(async (url: string) => {
        const stub = createSignalingStub(url)
        signalingInstances.push(stub)
        return stub
    }),
}))

class MockWebRTCManager {
    opts: {
        selfId: string
        sendSignal: (msg: WireMsg) => void
        onPeerEvent: (event: PeerEvent) => void
        polite?: boolean
    }

    createOffer = vi.fn(async () => {})
    handleOffer = vi.fn(async () => {})
    handleAnswer = vi.fn(async () => {})
    handleIce = vi.fn(async () => {})
    sendToPeer = vi.fn(() => true)
    broadcast = vi.fn(() => 0)
    shutdown = vi.fn()

    constructor(opts: MockWebRTCManager['opts']) {
        this.opts = opts
        webrtcInstances.push(this)
    }
}

vi.mock('@/net/webrtc', () => ({
    WebRTCManager: MockWebRTCManager,
}))

class MockRelayTransport {
    sendAction = vi.fn()
    sendSnapshot = vi.fn()
    sendPatch = vi.fn()

    constructor(public selfId: string) {
        relayInstances.push(this)
    }
}

vi.mock('@/net/relay', () => ({
    RelayTransport: MockRelayTransport,
}))

function hostResponse() {
    return {
        code: 'ABCDEF',
        hostId: 'host-1',
        localWsUrl: 'ws://localhost:9000',
        publicUrl: 'https://example.trycloudflare.com',
    }
}

let useSession: typeof import('./sessionStore').useSession

beforeEach(async () => {
    Object.defineProperty(window, '__TAURI__', {
        value: {
            core: {
                invoke: () => Promise.resolve(),
            },
        },
        writable: true,
    })
    mockKv.clear()
    signalingInstances.length = 0
    webrtcInstances.length = 0
    relayInstances.length = 0
    invokeMock.mockResolvedValue(hostResponse())
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.resetModules()
    ;({ useSession } = await import('./sessionStore'))
})

afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    Reflect.deleteProperty(window as typeof window & { __TAURI__?: unknown }, '__TAURI__')
})

describe('sessionStore', () => {
    it('creates a host session and acknowledges handshake', async () => {
        const store = useSession.getState()
        await store.setName('Nix')
        await store.setRole('dm')

        await store.createSession()

        expect(invokeMock).toHaveBeenCalledWith('start_host', { provider: null })
        expect(signalingInstances).toHaveLength(1)
        const session = useSession.getState().session
        expect(session?.code).toBe('ABCDEF')
        expect(session?.publicUrl).toContain('trycloudflare')

        signalingInstances[0].emit({ t: 'SESSION_CREATED', code: 'ABCDEF', hostId: 'host-1' })
        expect(useSession.getState().connected).toBe(true)
    })

    it('joins a session, applies patches, and falls back to relay', async () => {
        const store = useSession.getState()
        await store.setName('Player One')
        await store.setRole('player')

        await store.joinSession('GHIJKL', 'wss://public')
        expect(signalingInstances[0].url).toBe('wss://public')

        signalingInstances[0].emit({
            t: 'JOIN_OK',
            peers: [
                { id: 'host-1', name: 'Nix', role: 'dm', connected: true },
                { id: 'player-1', name: 'Player One', role: 'player', connected: false },
            ],
            youAre: { id: 'player-1', name: 'Player One', role: 'player', connected: false },
        })

        vi.runOnlyPendingTimers()
        expect(useSession.getState().transport).toBe('ws')

        signalingInstances[0].emit({ t: 'STATE_PATCH', base: 0, patch: { tokens: ['alpha'] } })
        expect(useSession.getState().snapshot.tokens).toEqual(['alpha'])
        expect(useSession.getState().snapshot.version).toBe(1)

        signalingInstances[0].emit({ t: 'STATE_PATCH', base: 5, patch: { tokens: ['ignore'] } })
        expect(useSession.getState().snapshot.tokens).toEqual(['alpha'])

        expect(relayInstances[0].sendAction).not.toHaveBeenCalled()
        useSession.getState().sendAction({ move: 'ping' })
        expect(relayInstances[0].sendAction).toHaveBeenCalledWith({ move: 'ping' })

        // switch to WebRTC and ensure actions use the data channel path
        const webrtc = webrtcInstances[0]
        webrtc.sendToPeer.mockReturnValue(true)
        webrtc.opts.onPeerEvent({ type: 'connected', peerId: 'host-1' })
        expect(useSession.getState().transport).toBe('webrtc')
        useSession.getState().sendAction({ move: 'webrtc' })
        expect(webrtc.sendToPeer).toHaveBeenCalled()
    })

    it('keeps peer connection status after presence updates', async () => {
        const store = useSession.getState()
        await store.setName('Player One')
        await store.setRole('player')

        await store.joinSession('GHIJKL', 'wss://public')

        signalingInstances[0].emit({
            t: 'JOIN_OK',
            peers: [
                { id: 'host-1', name: 'Nix', role: 'dm', connected: false },
                { id: 'player-1', name: 'Player One', role: 'player', connected: false },
            ],
            youAre: { id: 'player-1', name: 'Player One', role: 'player', connected: false },
        })

        const webrtc = webrtcInstances[0]
        webrtc.opts.onPeerEvent({ type: 'connected', peerId: 'host-1' })

        let hostPeer = useSession.getState().peers.find((peer) => peer.id === 'host-1')
        expect(hostPeer?.connected).toBe(true)

        signalingInstances[0].emit({
            t: 'PRESENCE',
            peers: [
                { id: 'host-1', name: 'Nix', role: 'dm', connected: false },
                { id: 'player-1', name: 'Player One', role: 'player', connected: false },
            ],
        })

        hostPeer = useSession.getState().peers.find((peer) => peer.id === 'host-1')
        expect(hostPeer?.connected).toBe(true)
    })

    it('retains WebRTC connectivity when signaling socket closes', async () => {
        const store = useSession.getState()
        await store.setName('Player One')
        await store.setRole('player')

        await store.joinSession('GHIJKL', 'wss://public')

        signalingInstances[0].emit({
            t: 'JOIN_OK',
            peers: [
                { id: 'host-1', name: 'Nix', role: 'dm', connected: true },
                { id: 'player-1', name: 'Player One', role: 'player', connected: false },
            ],
            youAre: { id: 'player-1', name: 'Player One', role: 'player', connected: false },
        })

        const webrtc = webrtcInstances[0]
        webrtc.opts.onPeerEvent({ type: 'connected', peerId: 'host-1' })

        expect(useSession.getState().transport).toBe('webrtc')
        expect(useSession.getState().connected).toBe(true)

        signalingInstances[0].emitClose()

        expect(useSession.getState().transport).toBe('webrtc')
        expect(useSession.getState().connected).toBe(true)
    })

    it('marks relay connection offline when signaling socket closes before WebRTC', async () => {
        const store = useSession.getState()
        await store.setName('Player One')
        await store.setRole('player')

        await store.joinSession('GHIJKL', 'wss://public')

        signalingInstances[0].emit({
            t: 'JOIN_OK',
            peers: [
                { id: 'host-1', name: 'Nix', role: 'dm', connected: true },
                { id: 'player-1', name: 'Player One', role: 'player', connected: false },
            ],
            youAre: { id: 'player-1', name: 'Player One', role: 'player', connected: false },
        })

        expect(useSession.getState().transport).toBe('ws')
        expect(useSession.getState().connected).toBe(true)

        signalingInstances[0].emitClose()

        expect(useSession.getState().transport).toBe('ws')
        expect(useSession.getState().connected).toBe(false)
    })
})
