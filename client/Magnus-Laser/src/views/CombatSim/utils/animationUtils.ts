// Animation utilities for token movement

import { AnimationEntry, AnimationSegment } from '@/views/CombatSim/utils/types'

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
    let msPerCell = 0
    if (cells > 20) {
        msPerCell = 15
    } else if (cells > 10) {
        msPerCell = 30
    } else {
        msPerCell = 60
    }

    const totalMs = cells * msPerCell
    animationsMap.set(id, { segments, startTime: globalThis.performance.now(), totalMs, totalLen })
}
