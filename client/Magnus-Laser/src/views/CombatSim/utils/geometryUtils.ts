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

// Check if a line segment intersects with a rectangle
export function segmentIntersectsRectangle(
    segmentStart: { x: number; y: number },
    segmentEnd: { x: number; y: number },
    rectX1: number,
    rectY1: number,
    rectX2: number,
    rectY2: number
): boolean {
    // Check intersection with all 4 sides of the rectangle
    const left = Math.min(rectX1, rectX2)
    const right = Math.max(rectX1, rectX2)
    const top = Math.min(rectY1, rectY2)
    const bottom = Math.max(rectY1, rectY2)

    // Top side
    if (segmentsIntersect(segmentStart, segmentEnd, { x: left, y: top }, { x: right, y: top })) return true
    // Bottom side
    if (segmentsIntersect(segmentStart, segmentEnd, { x: left, y: bottom }, { x: right, y: bottom })) return true
    // Left side
    if (segmentsIntersect(segmentStart, segmentEnd, { x: left, y: top }, { x: left, y: bottom })) return true
    // Right side
    if (segmentsIntersect(segmentStart, segmentEnd, { x: right, y: top }, { x: right, y: bottom })) return true

    return false
}

// True iff the segment hits the circle's boundary (crossing or tangent).
// If the entire segment stays inside the circle, returns false.
export function segmentHitsCircleBoundary(
    segmentStart: { x: number; y: number },
    segmentEnd: { x: number; y: number },
    centerX: number,
    centerY: number,
    radius: number
): boolean {
    const dx = segmentEnd.x - segmentStart.x
    const dy = segmentEnd.y - segmentStart.y
    const len2 = dx * dx + dy * dy

    const r2 = radius * radius
    const EPS = 1e-10

    // Helper: squared distance to center
    const dist2 = (x: number, y: number) => (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY)

    const d1 = dist2(segmentStart.x, segmentStart.y)
    const d2 = dist2(segmentEnd.x, segmentEnd.y)

    const inside1 = d1 < r2 - EPS
    const inside2 = d2 < r2 - EPS

    // If both endpoints are strictly inside, we don't count it as intersecting.
    if (inside1 && inside2) return false

    // Degenerate segment (point)
    if (len2 <= EPS) {
        // Count as hit only if the point lies on the boundary (tangent)
        return Math.abs(d1 - r2) <= EPS
    }

    // Otherwise, check the closest point on the segment to the center
    const fx = centerX - segmentStart.x
    const fy = centerY - segmentStart.y
    const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / len2))
    const px = segmentStart.x + t * dx
    const py = segmentStart.y + t * dy

    // Hit if the closest point is on or inside the circle (touching allowed)
    const closestDist2 = dist2(px, py)
    return closestDist2 <= r2 + EPS
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
