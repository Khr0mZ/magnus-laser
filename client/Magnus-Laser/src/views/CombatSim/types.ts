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
    owner?: string
}

export type Stats = {
    movement: number
    currentMovement: number
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
        currentGrenadesOrSpecialAmmo?: number
    }
    ignoreSeriouslyWoundedPenalty?: boolean
}

export type Map = {
    id: string
    name: string
    mimeType: string
    width?: number
    height?: number
    size?: number
    hash?: string
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
    size?: number
    hash?: string
    blob: Blob
}

export type WallShape = 'line' | 'rectangle' | 'circle'

export type Wall = {
    id: string
    mapId: string
    x1: number
    y1: number
    x2: number
    y2: number
    shape?: WallShape // defaults to 'line' for backward compatibility
    color?: number
    alpha?: number
}

export type BlastType = 'grenade' | 'circle' | 'square' | 'cone'

export type Blast = {
    id: string
    mapId: string
    type: BlastType
    name?: string // optional name (e.g., "Grenade 1")
    x: number // center or start point
    y: number // center or start point
    // For grenade: fixed 5x5 grid cells (10m x 10m)
    // For circle: radius in grid cells
    // For square: width/height in grid cells
    // For cone: endpoint x2, y2
    size?: number // radius for circle, width for square, length for cone
    sizeY?: number // height for rectangle (square type only)
    x2?: number // cone endpoint
    y2?: number // cone endpoint
    alpha?: number // opacity (default 0.7)
    locked?: boolean // if true, blast only responds to right-click, can't be moved
}

export interface RollHistoryEntry {
    id: string
    timestamp: number
    tokenId: string
    tokenName: string
    rollType: RollType
    result: RollResult
    damageResult?: RollResult // for attacks that include damage
    damageRevealed?: boolean // whether damage has been revealed (starts hidden)
    mapId: string
}

export type Initiative = {
    mapId: string
    activeTokenId: string | null
    currentRound: number
    isCombatActive: boolean
    autoRerollInitiative: boolean
    autoRollDamage: boolean
    initiativeRolls: Record<string, number>
}
