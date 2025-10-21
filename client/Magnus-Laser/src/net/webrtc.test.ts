/* global RTCSessionDescriptionInit, RTCIceCandidateInit, RTCPeerConnectionIceEvent, RTCDataChannelEvent, RTCPeerConnectionState, RTCSignalingState */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalRTC = globalThis.RTCPeerConnection

class FakeRTCPeerConnection {
    public iceCandidates: RTCIceCandidateInit[] = []
    public localDescription: RTCSessionDescriptionInit | null = null
    public remoteDescription: RTCSessionDescriptionInit | null = null
    public onicecandidate: ((ev: RTCPeerConnectionIceEvent) => void) | null = null
    public onconnectionstatechange: (() => void) | null = null
    public ondatachannel: ((event: RTCDataChannelEvent) => void) | null = null
    public connectionState: RTCPeerConnectionState = 'new'
    public signalingState: RTCSignalingState = 'stable'

    createDataChannel() {
        return {
            readyState: 'closed',
            close: vi.fn(),
            send: vi.fn(),
            onopen: null,
            onclose: null,
            onmessage: null,
        }
    }

    async createOffer() {
        return { type: 'offer', sdp: 'fake-offer' }
    }

    async setLocalDescription(desc: RTCSessionDescriptionInit) {
        this.localDescription = desc
    }

    async setRemoteDescription(desc: RTCSessionDescriptionInit) {
        this.remoteDescription = desc
    }

    async createAnswer() {
        return { type: 'answer', sdp: 'fake-answer' }
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        this.iceCandidates.push(candidate)
        throw new Error('forced ice failure')
    }

    close() {
        this.connectionState = 'closed'
    }
}

beforeEach(() => {
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
        configurable: true,
        writable: true,
        value: FakeRTCPeerConnection,
    })
})

afterEach(() => {
    if (originalRTC) {
        Object.defineProperty(globalThis, 'RTCPeerConnection', {
            configurable: true,
            writable: true,
            value: originalRTC,
        })
    } else {
        Reflect.deleteProperty(globalThis as Record<string, unknown>, 'RTCPeerConnection')
    }
})

describe('WebRTCManager', () => {
    it('swallows ICE candidate failures so the store can fall back to relay', async () => {
        const { WebRTCManager } = await import('./webrtc')
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const manager = new WebRTCManager({
            selfId: 'host',
            sendSignal: vi.fn(),
            onPeerEvent: vi.fn(),
        })

        const candidate: RTCIceCandidateInit = { candidate: 'bad-candidate' }
        await manager.handleIce('peer-1', candidate)

        expect(warnSpy).toHaveBeenCalled()
        warnSpy.mockRestore()
    })
})
