import type { Blast, Token } from '../../utils/types'
import { calculateConePoints } from '../blastRenderer'

/**
 * Hit test a point against a token
 */
export const hitTestToken = (x: number, y: number, token: Token, gridSize: number): boolean => {
    const tx = token.x
    const ty = token.y
    const d = Math.hypot(tx - x, ty - y)
    const radius = token.customRadius ?? gridSize / 2
    return d <= radius
}

/**
 * Hit test a point against a blast
 */
export const hitTestBlast = (x: number, y: number, blast: Blast, gridSize: number): boolean => {
    const dx = x - blast.x
    const dy = y - blast.y

    if (blast.type === 'grenade') {
        const radius = (gridSize * 5) / 2
        return Math.sqrt(dx * dx + dy * dy) <= radius
    } else if (blast.type === 'circle') {
        const radius = gridSize * (blast.size || 0)
        return Math.sqrt(dx * dx + dy * dy) <= radius
    } else if (blast.type === 'square') {
        const width = gridSize * (blast.size || 0)
        const height = gridSize * (blast.sizeY || blast.size || 0)
        return Math.abs(dx) <= width / 2 && Math.abs(dy) <= height / 2
    } else if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
        // Point-in-triangle for cone using barycentric technique
        const points = calculateConePoints(blast.x, blast.y, blast.x2, blast.y2, 28)
        const ax = points[0].x
        const ay = points[0].y
        const bx = points[1].x // left base point
        const by = points[1].y
        const cx = points[2].x // right base point
        const cy = points[2].y

        // Barycentric coordinate check
        const v0x = cx - ax
        const v0y = cy - ay
        const v1x = bx - ax
        const v1y = by - ay
        const v2x = x - ax
        const v2y = y - ay

        const dot00 = v0x * v0x + v0y * v0y
        const dot01 = v0x * v1x + v0y * v1y
        const dot02 = v0x * v2x + v0y * v2y
        const dot11 = v1x * v1x + v1y * v1y
        const dot12 = v1x * v2x + v1y * v2y

        const invDen = 1 / (dot00 * dot11 - dot01 * dot01)
        const u = (dot11 * dot02 - dot01 * dot12) * invDen
        const v = (dot00 * dot12 - dot01 * dot02) * invDen

        return u >= 0 && v >= 0 && u + v <= 1
    }
    return false
}

/**
 * Find the closest token hit at a point
 */
export const findTokenHit = (
    x: number,
    y: number,
    tokens: Token[],
    gridSize: number,
    pendingIndicators?: Map<string, { endX: number; endY: number }>
): Token | null => {
    let hit: Token | null = null
    let minDist = Number.POSITIVE_INFINITY

    for (const token of tokens) {
        const pending = pendingIndicators?.get(token.id)
        const tx = pending ? pending.endX : token.x
        const ty = pending ? pending.endY : token.y
        const d = Math.hypot(tx - x, ty - y)
        const radius = token.customRadius ?? gridSize / 2
        if (d <= radius && d < minDist) {
            hit = { ...token, x: tx, y: ty }
            minDist = d
        }
    }

    return hit
}

/**
 * Find a blast hit at a point
 */
export const findBlastHit = (x: number, y: number, blasts: Blast[], gridSize: number): Blast | null => {
    return blasts.find((blast) => hitTestBlast(x, y, blast, gridSize)) || null
}
