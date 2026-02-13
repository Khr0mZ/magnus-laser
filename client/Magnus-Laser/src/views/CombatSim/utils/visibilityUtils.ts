import type { WallShape } from './types'
import { segmentsIntersect, segmentIntersectsRectangle, segmentHitsCircleBoundary } from './geometryUtils'

// ── Types ──────────────────────────────────────────────────────────────────
export type Segment = { x1: number; y1: number; x2: number; y2: number }
export type Point = { x: number; y: number }

// Minimal wall geometry — does not require mapId or other fields
type WallGeometry = {
    x1: number; y1: number; x2: number; y2: number
    shape?: WallShape
}

// ── Wall → Segments ────────────────────────────────────────────────────────
const CIRCLE_APPROXIMATION_SEGMENTS = 32

export function wallsToSegments(walls: WallGeometry[]): Segment[] {
    const segs: Segment[] = []
    for (const w of walls) {
        const shape = w.shape ?? 'line'
        if (shape === 'line') {
            segs.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 })
        } else if (shape === 'rectangle') {
            const left = Math.min(w.x1, w.x2)
            const right = Math.max(w.x1, w.x2)
            const top = Math.min(w.y1, w.y2)
            const bottom = Math.max(w.y1, w.y2)
            segs.push(
                { x1: left, y1: top, x2: right, y2: top },       // top
                { x1: left, y1: bottom, x2: right, y2: bottom }, // bottom
                { x1: left, y1: top, x2: left, y2: bottom },     // left
                { x1: right, y1: top, x2: right, y2: bottom },   // right
            )
        } else if (shape === 'circle') {
            const cx = (w.x1 + w.x2) / 2
            const cy = (w.y1 + w.y2) / 2
            const dx = w.x2 - w.x1
            const dy = w.y2 - w.y1
            const r = Math.min(Math.abs(dx), Math.abs(dy)) / 2
            if (r < 1e-6) continue
            const n = CIRCLE_APPROXIMATION_SEGMENTS
            for (let i = 0; i < n; i++) {
                const a1 = (2 * Math.PI * i) / n
                const a2 = (2 * Math.PI * (i + 1)) / n
                segs.push({
                    x1: cx + r * Math.cos(a1),
                    y1: cy + r * Math.sin(a1),
                    x2: cx + r * Math.cos(a2),
                    y2: cy + r * Math.sin(a2),
                })
            }
        }
    }
    return segs
}

// ── Visibility Polygon ─────────────────────────────────────────────────────
// Angular-sweep raycasting: casts rays to every segment endpoint (±ε) and
// finds the closest wall hit for each ray.  Returns a polygon (sorted by
// angle) that describes the visible area from `origin` within `bounds`.

export function computeVisibilityPolygon(
    origin: Point,
    segments: Segment[],
    bounds: { x: number; y: number; w: number; h: number },
): Point[] {
    if (segments.length === 0) return []

    // Boundary segments (so rays that miss all walls stop at the map edge)
    const bx = bounds.x
    const by = bounds.y
    const bx2 = bounds.x + bounds.w
    const by2 = bounds.y + bounds.h
    const allSegments: Segment[] = [
        ...segments,
        { x1: bx, y1: by, x2: bx2, y2: by },
        { x1: bx2, y1: by, x2: bx2, y2: by2 },
        { x1: bx2, y1: by2, x2: bx, y2: by2 },
        { x1: bx, y1: by2, x2: bx, y2: by },
    ]

    const EPS = 0.00001
    const uniqueAngles: number[] = []

    // Regular sweep at 1° intervals fills angular gaps that endpoint-only
    // rays miss (where the closest segment changes mid-segment, not at an
    // endpoint).  Endpoint ±EPS rays give pixel-precise shadow edges.
    for (let deg = 0; deg < 360; deg++) {
        uniqueAngles.push(deg * (Math.PI / 180) - Math.PI)
    }
    for (const seg of allSegments) {
        const a1 = Math.atan2(seg.y1 - origin.y, seg.x1 - origin.x)
        const a2 = Math.atan2(seg.y2 - origin.y, seg.x2 - origin.x)
        uniqueAngles.push(a1 - EPS, a1, a1 + EPS)
        uniqueAngles.push(a2 - EPS, a2, a2 + EPS)
    }

    // Cast a ray for each angle, find closest intersection
    const intersections: { angle: number; x: number; y: number }[] = []

    for (const angle of uniqueAngles) {
        const dx = Math.cos(angle)
        const dy = Math.sin(angle)

        // Ray endpoint — far enough to always exceed the board
        const rayLen = bounds.w + bounds.h + 1000
        const rx = origin.x + dx * rayLen
        const ry = origin.y + dy * rayLen

        let closestT = Infinity
        let closestX = rx
        let closestY = ry

        for (const seg of allSegments) {
            const hit = raySegmentIntersection(
                origin.x, origin.y, rx, ry,
                seg.x1, seg.y1, seg.x2, seg.y2,
            )
            if (hit && hit.t < closestT) {
                closestT = hit.t
                closestX = hit.x
                closestY = hit.y
            }
        }

        if (closestT < Infinity) {
            intersections.push({ angle, x: closestX, y: closestY })
        }
    }

    // Sort by angle
    intersections.sort((a, b) => a.angle - b.angle)

    // Remove near-duplicate consecutive points (prevents degenerate polygon edges)
    const filtered: Point[] = []
    for (const pt of intersections) {
        if (filtered.length === 0) {
            filtered.push({ x: pt.x, y: pt.y })
        } else {
            const prev = filtered[filtered.length - 1]
            const dx = pt.x - prev.x
            const dy = pt.y - prev.y
            if (dx * dx + dy * dy > 0.01) {
                filtered.push({ x: pt.x, y: pt.y })
            }
        }
    }

    return filtered
}

// Ray–segment intersection (ray from (ox,oy)→(rx,ry), segment (sx1,sy1)→(sx2,sy2))
// Returns { t, x, y } where t ∈ [0,1] on the ray, or null.
function raySegmentIntersection(
    ox: number, oy: number, rx: number, ry: number,
    sx1: number, sy1: number, sx2: number, sy2: number,
): { t: number; x: number; y: number } | null {
    const rdx = rx - ox
    const rdy = ry - oy
    const sdx = sx2 - sx1
    const sdy = sy2 - sy1

    const denom = rdx * sdy - rdy * sdx
    if (Math.abs(denom) < 1e-6) return null // match geometryUtils threshold

    const t = ((sx1 - ox) * sdy - (sy1 - oy) * sdx) / denom
    const u = ((sx1 - ox) * rdy - (sy1 - oy) * rdx) / denom

    if (t < 1e-6 || u < 0 || u > 1) return null

    return {
        t,
        x: ox + t * rdx,
        y: oy + t * rdy,
    }
}

// ── Point-in-Polygon ────────────────────────────────────────────────────────
// Ray-casting algorithm: cast a horizontal ray from the point to +∞ and count
// how many polygon edges it crosses.  Odd count → inside, even → outside.
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    const n = polygon.length
    if (n < 3) return false

    let inside = false
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const yi = polygon[i].y
        const yj = polygon[j].y
        if ((yi > point.y) !== (yj > point.y)) {
            const xIntersect =
                polygon[i].x + ((point.y - yi) / (yj - yi)) * (polygon[j].x - polygon[i].x)
            if (point.x < xIntersect) {
                inside = !inside
            }
        }
    }
    return inside
}

// ── Path Collision ──────────────────────────────────────────────────────────
export function doesPathCrossWall(
    start: Point,
    end: Point,
    walls: WallGeometry[],
): boolean {
    for (const w of walls) {
        const shape = w.shape ?? 'line'
        if (shape === 'line') {
            if (segmentsIntersect(start, end, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })) return true
        } else if (shape === 'rectangle') {
            if (segmentIntersectsRectangle(start, end, w.x1, w.y1, w.x2, w.y2)) return true
        } else if (shape === 'circle') {
            const cx = (w.x1 + w.x2) / 2
            const cy = (w.y1 + w.y2) / 2
            const dx = w.x2 - w.x1
            const dy = w.y2 - w.y1
            const r = Math.min(Math.abs(dx), Math.abs(dy)) / 2
            if (segmentHitsCircleBoundary(start, end, cx, cy, r)) return true
        }
    }
    return false
}

export function doesMultiSegmentPathCrossWall(
    points: Point[],
    walls: WallGeometry[],
): boolean {
    for (let i = 1; i < points.length; i++) {
        if (doesPathCrossWall(points[i - 1], points[i], walls)) return true
    }
    return false
}
