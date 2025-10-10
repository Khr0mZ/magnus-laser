import { Dices } from '../../graphql/types'
import type { RollResult, RollType } from './diceUtils'

export type BoardMap = {
    id: string
    name: string
    mapId?: string
}

export type Token = {
    id: string
    name: string
    mapId: string
    x: number
    y: number
    radius: number
    color: number
    stats?: Stats
    imageId?: string
}

export type Stats = {
    combat: number
    skills: number
    initiative: number
    armor: {
        sph: number
        currentSph: number
        spb: number
        currentSpb: number
    }
    health: number
    currentHealth: number
    weapons: {
        melee: Dices
        ranged: Dices
        grenadesOrSpecialAmmo?: Dices
    }
}

export type Map = {
    id: string
    name: string
    mimeType: string
    width?: number
    height?: number
    gridSize: number
    snapToGrid: boolean
    gridColorHex: string
    gridAlpha: number
    blob: Blob
}

export type Image = {
    id: string
    name: string
    mimeType: string
    width?: number
    height?: number
    blob: Blob
}

export type Wall = {
    id: string
    mapId: string
    x1: number
    y1: number
    x2: number
    y2: number
    color?: number
    alpha?: number
}

export interface RollHistoryEntry {
    id: string
    timestamp: number
    tokenId: string
    tokenName: string
    rollType: RollType
    result: RollResult
    damageResult?: RollResult // for attacks that include damage
}
