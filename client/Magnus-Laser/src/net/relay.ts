import type { GameSnapshot, WireMsg } from '@/types/session'

type Sender = (msg: WireMsg) => void

const uuid = () => {
    const cryptoApi = globalThis.crypto
    if (cryptoApi?.randomUUID) {
        return cryptoApi.randomUUID()
    }
    return Math.random().toString(36).slice(2)
}

export class RelayTransport {
    private readonly send: Sender
    private readonly selfId: string

    constructor(selfId: string, sender: Sender) {
        this.selfId = selfId
        this.send = sender
    }

    sendAction(action: unknown) {
        this.send({
            t: 'ACTION',
            id: uuid(),
            actor: this.selfId,
            action,
        })
    }

    sendSnapshot(snapshot: GameSnapshot) {
        this.send({
            t: 'STATE_SNAPSHOT',
            snapshot,
        })
    }

    sendPatch(base: number, patch: Partial<GameSnapshot>) {
        this.send({
            t: 'STATE_PATCH',
            base,
            patch,
        })
    }
}
