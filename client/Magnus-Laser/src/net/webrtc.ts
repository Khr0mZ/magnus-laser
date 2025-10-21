/* eslint-env browser */
/* global RTCIceServer, RTCPeerConnection, RTCDataChannel, RTCSessionDescriptionInit, RTCIceCandidateInit */
import type { PeerInfo, WireMsg } from '@/types/session'

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
]

export type PeerEvent =
    | { type: 'connected'; peerId: string }
    | { type: 'disconnected'; peerId: string }
    | { type: 'message'; peerId: string; payload: WireMsg }

export interface WebRTCManagerOptions {
    selfId: string
    sendSignal: (msg: WireMsg) => void
    onPeerEvent: (event: PeerEvent) => void
    polite?: boolean
}

interface PeerContext {
    pc: RTCPeerConnection
    channel: RTCDataChannel | null
    isMakingOffer: boolean
    polite: boolean
}

export class WebRTCManager {
    private readonly peers = new Map<string, PeerContext>()
    private readonly opts: WebRTCManagerOptions

    constructor(opts: WebRTCManagerOptions) {
        this.opts = opts
    }

    ensurePeer(peer: PeerInfo) {
        if (this.peers.has(peer.id)) return this.peers.get(peer.id)!
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

        const context: PeerContext = {
            pc,
            channel: null,
            isMakingOffer: false,
            polite: peer.role === 'dm' ? true : !!this.opts.polite,
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.opts.sendSignal({
                    t: 'RTC_ICE',
                    from: this.opts.selfId,
                    to: peer.id,
                    candidate: event.candidate,
                })
            }
        }

        pc.onconnectionstatechange = () => {
            const { connectionState } = pc
            console.log('[WebRTC] Connection state change for', peer.id, ':', connectionState)
            if (connectionState === 'connected') {
                this.opts.onPeerEvent({ type: 'connected', peerId: peer.id })
            } else if (
                connectionState === 'failed' ||
                connectionState === 'closed' ||
                connectionState === 'disconnected'
            ) {
                this.opts.onPeerEvent({ type: 'disconnected', peerId: peer.id })
            }
        }

        pc.ondatachannel = (event) => {
            this.setupChannel(peer.id, context, event.channel)
        }

        this.peers.set(peer.id, context)
        return context
    }

    async createOffer(peer: PeerInfo) {
        const ctx = this.ensurePeer(peer)
        if (!ctx.channel) {
            const channel = ctx.pc.createDataChannel('magnus-game', {
                negotiated: false,
                ordered: true,
            })
            this.setupChannel(peer.id, ctx, channel)
        }

        ctx.isMakingOffer = true
        const offer = await ctx.pc.createOffer()
        await ctx.pc.setLocalDescription(offer)
        ctx.isMakingOffer = false
        this.opts.sendSignal({
            t: 'RTC_OFFER',
            from: this.opts.selfId,
            to: peer.id,
            sdp: ctx.pc.localDescription ?? offer,
        })
    }

    async handleOffer(from: string, description: RTCSessionDescriptionInit) {
        console.log('[WebRTC] Handling offer from', from)
        const ctx = this.ensurePeer({ id: from, name: '', role: 'dm', connected: true })
        const readyForOffer = !ctx.isMakingOffer && (ctx.pc.signalingState === 'stable' || ctx.polite)
        console.log(
            '[WebRTC] Ready for offer:',
            readyForOffer,
            'signalingState:',
            ctx.pc.signalingState,
            'polite:',
            ctx.polite
        )
        if (!readyForOffer) {
            return
        }
        await ctx.pc.setRemoteDescription(description)
        console.log('[WebRTC] Set remote description, creating answer')
        const answer = await ctx.pc.createAnswer()
        await ctx.pc.setLocalDescription(answer)
        const resolvedDescription = ctx.pc.localDescription ?? answer
        console.log('[WebRTC] Sending answer to', from)
        this.opts.sendSignal({ t: 'RTC_ANSWER', from: this.opts.selfId, to: from, sdp: resolvedDescription })
    }

    async handleAnswer(from: string, description: RTCSessionDescriptionInit) {
        const ctx = this.ensurePeer({ id: from, name: '', role: 'player', connected: true })
        if (!ctx.pc.currentRemoteDescription) {
            await ctx.pc.setRemoteDescription(description)
        }
    }

    async handleIce(from: string, candidate: RTCIceCandidateInit) {
        const ctx = this.ensurePeer({ id: from, name: '', role: 'player', connected: true })
        try {
            await ctx.pc.addIceCandidate(candidate)
        } catch (err) {
            console.warn('Failed to add ICE candidate', err)
        }
    }

    sendToPeer(peerId: string, msg: WireMsg) {
        const ctx = this.peers.get(peerId)
        if (!ctx?.channel || ctx.channel.readyState !== 'open') return false
        ctx.channel.send(JSON.stringify(msg))
        return true
    }

    broadcast(msg: WireMsg) {
        let delivered = 0
        for (const ctx of this.peers.values()) {
            if (ctx.channel && ctx.channel.readyState === 'open') {
                ctx.channel.send(JSON.stringify(msg))
                delivered += 1
            }
        }
        return delivered
    }

    closePeer(peerId: string) {
        const ctx = this.peers.get(peerId)
        if (!ctx) return
        ctx.channel?.close()
        ctx.pc.close()
        this.peers.delete(peerId)
        this.opts.onPeerEvent({ type: 'disconnected', peerId })
    }

    shutdown() {
        for (const [peerId] of this.peers) {
            this.closePeer(peerId)
        }
        this.peers.clear()
    }

    // Below: helpers for backpressure-aware sending
    getBufferedAmount(peerId: string): number {
        const ctx = this.peers.get(peerId)
        return ctx?.channel?.bufferedAmount ?? 0
    }

    async waitForDrain(peerId: string, threshold = 512 * 1024): Promise<void> {
        const ctx = this.peers.get(peerId)
        const ch = ctx?.channel
        if (!ch) return
        try {
            const chWithThreshold = ch as unknown as { bufferedAmountLowThreshold?: number }
            if (typeof chWithThreshold.bufferedAmountLowThreshold === 'number') {
                chWithThreshold.bufferedAmountLowThreshold = threshold
            }
        } catch {
            /* noop */
        }
        if (ch.bufferedAmount <= threshold) return
        await new Promise<void>((resolve) => {
            const timer = setTimeout(() => resolve(), 100)
            const onLow = () => {
                try {
                    const evtTarget = ch as unknown as {
                        removeEventListener?: (type: string, listener: (ev: unknown) => void) => void
                    }
                    evtTarget.removeEventListener?.('bufferedamountlow', onLow)
                } catch {
                    /* noop */
                }
                clearTimeout(timer)
                resolve()
            }
            try {
                const evtTarget = ch as unknown as {
                    addEventListener?: (
                        type: string,
                        listener: (ev: unknown) => void,
                        options?: { once?: boolean }
                    ) => void
                }
                evtTarget.addEventListener?.('bufferedamountlow', onLow, { once: true })
            } catch {
                // Fallback: if event is unsupported, time-based resolve will trigger
            }
        })
    }

    private setupChannel(peerId: string, ctx: PeerContext, channel: RTCDataChannel) {
        ctx.channel = channel
        channel.binaryType = 'arraybuffer'
        // Set a reasonable default to get bufferedamountlow events
        try {
            const chWithThreshold = channel as unknown as { bufferedAmountLowThreshold?: number }
            chWithThreshold.bufferedAmountLowThreshold = 256 * 1024
        } catch {
            /* noop */
        }

        channel.onopen = () => {
            console.log('[WebRTC] Data channel opened for', peerId)
            this.opts.onPeerEvent({ type: 'connected', peerId })
        }

        channel.onclose = () => {
            console.log('[WebRTC] Data channel closed for', peerId)
            this.opts.onPeerEvent({ type: 'disconnected', peerId })
        }

        channel.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as WireMsg
                this.opts.onPeerEvent({ type: 'message', peerId, payload })
            } catch (err) {
                console.warn('Failed to parse data channel message', err)
            }
        }
    }
}
