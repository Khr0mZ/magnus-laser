/* eslint-env browser */
import type { Role, WireMsg } from '@/types/session'

export type MessageListener = (msg: WireMsg) => void
type BrowserCloseEvent = typeof globalThis extends { CloseEvent: infer T } ? T : Event
export type CloseListener = (ev: BrowserCloseEvent | Event) => void

export interface SignalingOptions {
    role: Role
    name: string
}

export interface SendOptions {
    suppressQueue?: boolean
}

const PING_INTERVAL = 10_000 // More frequent pings for browser stability
const RECONNECT_DELAY = 3_000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5

type BrowserWebSocket = typeof globalThis.WebSocket

export class SignalingClient {
    private ws: InstanceType<BrowserWebSocket> | null = null
    private url: string
    private readonly listeners = new Set<MessageListener>()
    private readonly closeListeners = new Set<CloseListener>()
    private readonly queue: WireMsg[] = []
    private heartbeat: number | null = null
    private openPromise: Promise<void> | null = null
    private resolveOpen?: () => void
    private rejectOpen?: (reason?: unknown) => void

    // Reconnection state
    private reconnectAttempts = 0
    private reconnectTimer: number | null = null
    private shouldReconnect = true
    private lastConnectOptions?: SignalingOptions

    constructor(url: string) {
        this.url = url

        // Handle browser tab visibility changes to maintain connection stability
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Tab lost focus - browsers may suspend localhost connections
                } else {
                    // Tab regained focus - check connection
                    if (
                        this.ws &&
                        this.ws.readyState !== globalThis.WebSocket.OPEN &&
                        this.shouldReconnect &&
                        this.lastConnectOptions
                    ) {
                        this.scheduleReconnect()
                    }
                }
            })
        }
    }

    async connect(opts: SignalingOptions) {
        if (this.ws) return

        // Save connection options for reconnection
        this.lastConnectOptions = opts
        this.shouldReconnect = true
        this.reconnectAttempts = 0

        await this.performConnect(opts)
    }

    private async performConnect(opts: SignalingOptions) {
        this.openPromise = new Promise<void>((resolve, reject) => {
            this.resolveOpen = resolve
            this.rejectOpen = reject
        })

        const SocketCtor = globalThis.WebSocket
        if (!SocketCtor) {
            throw new Error('WebSocket API is unavailable')
        }

        // Convert HTTP/HTTPS URL to WS/WSS and ensure /signal path
        let wsUrl = this.url.replace(/^http/, 'ws')
        if (!wsUrl.includes('/signal')) {
            wsUrl = wsUrl.replace(/\/$/, '') + '/signal'
        }

        this.ws = new SocketCtor(wsUrl)

        this.ws.addEventListener('open', () => {
            this.reconnectAttempts = 0 // Reset on successful connection
            this.resolveOpen?.()
            this.resolveOpen = undefined
            this.rejectOpen = undefined
            this.flushQueue()
            this.send({ t: 'HELLO', role: opts.role, name: opts.name })
        })

        this.ws.addEventListener('message', (ev) => {
            try {
                const msg = JSON.parse(ev.data) as WireMsg
                if (msg.t === 'PING') {
                    this.send({ t: 'PONG' })
                    return
                }
                this.listeners.forEach((cb) => cb(msg))
            } catch (err) {
                console.warn('Failed to parse signaling message', err)
            }
        })

        this.ws.addEventListener('close', (ev) => {
            this.stopHeartbeat()
            this.cleanupSocket()

            // Attempt reconnection if enabled and not a normal closure
            if (this.shouldReconnect && ev.code !== 1000 && this.lastConnectOptions) {
                this.scheduleReconnect()
            } else {
                this.closeListeners.forEach((cb) => cb(ev))
            }
        })

        this.ws.addEventListener('error', (err) => {
            console.warn('[SignalingClient] WebSocket error:', err)
            this.rejectOpen?.(err)
            this.rejectOpen = undefined
        })

        await this.openPromise
        this.startHeartbeat()
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            this.closeListeners.forEach((cb) => cb(new Event('close')))
            return
        }

        this.reconnectAttempts++
        const delay = RECONNECT_DELAY * this.reconnectAttempts // Exponential backoff

        this.reconnectTimer = window.setTimeout(async () => {
            if (this.shouldReconnect && this.lastConnectOptions) {
                try {
                    await this.performConnect(this.lastConnectOptions)
                } catch (error) {
                    console.warn('[SignalingClient] Reconnection failed:', error)
                    this.scheduleReconnect() // Try again
                }
            }
        }, delay)
    }

    async ensureOpen() {
        if (this.openPromise) {
            await this.openPromise
        } else if (!this.ws || this.ws.readyState !== globalThis.WebSocket.OPEN) {
            throw new Error('signaling socket not open')
        }
    }

    send(msg: WireMsg, options: SendOptions = {}) {
        if (!this.ws || this.ws.readyState !== globalThis.WebSocket.OPEN) {
            if (options.suppressQueue) return
            this.queue.push(msg)
            return
        }
        this.ws.send(JSON.stringify(msg))
    }

    onMessage(cb: MessageListener) {
        this.listeners.add(cb)
        return () => this.listeners.delete(cb)
    }

    onClose(cb: CloseListener) {
        this.closeListeners.add(cb)
        return () => this.closeListeners.delete(cb)
    }

    close() {
        this.shouldReconnect = false

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        if (this.ws) {
            this.ws.close()
        }
        this.stopHeartbeat()
        this.cleanupSocket()
    }

    private flushQueue() {
        if (!this.ws || this.ws.readyState !== globalThis.WebSocket.OPEN) return
        while (this.queue.length > 0) {
            const msg = this.queue.shift()
            if (msg) this.ws.send(JSON.stringify(msg))
        }
    }

    private startHeartbeat() {
        if (this.heartbeat) return
        this.heartbeat = window.setInterval(() => {
            this.send({ t: 'PING' }, { suppressQueue: true })
        }, PING_INTERVAL)
    }

    private stopHeartbeat() {
        if (this.heartbeat) {
            clearInterval(this.heartbeat)
            this.heartbeat = null
        }
    }

    private cleanupSocket() {
        this.ws = null
        this.openPromise = null
        this.resolveOpen = undefined
        this.rejectOpen = undefined

        // Clean up reconnection timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }
}

export async function createSignalingClient(url: string, opts: SignalingOptions) {
    const client = new SignalingClient(url)
    await client.connect(opts)
    return client
}
