import type { Texture } from 'pixi.js'

// Segment intersection test for eraser
export function segmentsIntersect(
    a1: { x: number; y: number },
    a2: { x: number; y: number },
    b1: { x: number; y: number },
    b2: { x: number; y: number }
): boolean {
    const denom = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)
    if (Math.abs(denom) < 1e-6) return false

    const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / denom
    const u = -((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / denom

    return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

// Get target size for grid/world dimensions based on background texture or fallback
export function getTargetSize(
    backgroundSprite: { width?: number; height?: number; texture?: Texture } | null,
    worldDims: { worldWidth: number; worldHeight: number }
) {
    if (backgroundSprite && backgroundSprite.texture) {
        return { w: backgroundSprite.width || 1, h: backgroundSprite.height || 1 }
    }
    // fallback to world dims if no bg
    return { w: worldDims.worldWidth, h: worldDims.worldHeight }
}
