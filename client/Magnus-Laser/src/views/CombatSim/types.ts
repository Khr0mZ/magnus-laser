export type BoardMap = {
    id: string
    name: string
    mapId?: string
}

export type Token = {
    id: string
    mapId: string
    x: number
    y: number
    radius: number
    color: number
    npc?: NPC
    imageId?: string
}

export enum NPC {
    EASY = 'EASY',
    TYPICAL = 'TYPICAL',
    DANGEROUS = 'DANGEROUS',
    DEADLY = 'DEADLY',
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
