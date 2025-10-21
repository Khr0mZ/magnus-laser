/* global RTCSessionDescriptionInit, RTCIceCandidateInit */
export type Role = 'dm' | 'player'

export interface PeerInfo {
    id: string
    name: string
    role: Role
    connected: boolean
}

export interface SessionInfo {
    code: string
    hostId: string
    createdAt: number
    publicUrl?: string
}

export interface GameSnapshot {
    version: number
    sceneId?: string
    tokens?: unknown[]
    grid?: unknown
    fog?: unknown
    initiative?: unknown
    custom?: Record<string, unknown>
}

export type WireMsg =
    | { t: 'HELLO'; name: string; role: Role }
    | { t: 'CREATE_SESSION' }
    | { t: 'SESSION_CREATED'; code: string; hostId: string }
    | { t: 'JOIN_SESSION'; code: string; name: string }
    | { t: 'JOIN_OK'; peers: PeerInfo[]; youAre: PeerInfo }
    | { t: 'JOIN_DENY'; reason: string }
    | { t: 'PRESENCE'; peers: PeerInfo[] }
    | { t: 'ACTION'; id: string; actor: string; action: unknown }
    | { t: 'STATE_SNAPSHOT'; snapshot: GameSnapshot }
    | { t: 'STATE_PATCH'; base: number; patch: Partial<GameSnapshot> }
    | { t: 'PING' }
    | { t: 'PONG' }
    | { t: 'ERROR'; code: string; message: string }
    | { t: 'RTC_OFFER'; from: string; to: string; sdp: RTCSessionDescriptionInit }
    | { t: 'RTC_ANSWER'; from: string; to: string; sdp: RTCSessionDescriptionInit }
    | { t: 'RTC_ICE'; from: string; to: string; candidate: RTCIceCandidateInit }

export interface HostInfo {
    code: string
    hostId: string
    localWsUrl: string
    publicUrl: string
}
