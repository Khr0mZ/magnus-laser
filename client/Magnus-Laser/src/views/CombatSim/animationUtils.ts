// Animation utilities for token movement

export type AnimationSegment = {
    sx: number
    sy: number
    ex: number
    ey: number
    len: number
}

export type AnimationEntry = {
    segments: AnimationSegment[]
    startTime: number
    totalMs: number
    totalLen: number
}

// Schedule a multi-segment animation along provided waypoints
export function schedulePathAnimation(
    id: string,
    points: { x: number; y: number }[],
    gridSize: number,
    animationsMap: Map<string, AnimationEntry>
) {
    if (!points || points.length < 2) return
    const step = Math.max(1, gridSize || 1)
    const segments: AnimationSegment[] = []
    let totalLen = 0
    for (let i = 1; i < points.length; i++) {
        const sx = points[i - 1].x
        const sy = points[i - 1].y
        const ex = points[i].x
        const ey = points[i].y
        const dist = Math.hypot(ex - sx, ey - sy)
        if (dist > 0) {
            segments.push({ sx, sy, ex, ey, len: dist })
            totalLen += dist
        }
    }
    if (segments.length === 0) return
    const cells = totalLen / step
    const totalMs = cells * 90 // 0.06s per grid cell across whole path
    animationsMap.set(id, { segments, startTime: globalThis.performance.now(), totalMs, totalLen })
}
