import type { Graphics } from 'pixi.js'

const DEFAULT_WALL_COLOR = 0xff3b81
const DEFAULT_WALL_ALPHA = 0.95

/**
 * Draw all walls on a Graphics object. Each wall uses its own stored color/alpha,
 * falling back to the provided defaults or global defaults.
 */
export function drawWallsOnGraphics(
    g: Graphics,
    walls: readonly { x1: number; y1: number; x2: number; y2: number; shape?: string; color?: number; alpha?: number }[]
) {
    for (const w of walls) {
        const c = w.color ?? DEFAULT_WALL_COLOR
        const a = w.alpha ?? DEFAULT_WALL_ALPHA
        g.setStrokeStyle({ width: 3, color: c, alpha: a })

        const shape = w.shape || 'line'
        if (shape === 'line') {
            g.moveTo(w.x1, w.y1)
            g.lineTo(w.x2, w.y2)
            g.stroke()
        } else if (shape === 'rectangle') {
            const dx = w.x2 - w.x1
            const dy = w.y2 - w.y1
            const width = Math.abs(dx)
            const height = Math.abs(dy)
            const x = Math.min(w.x1, w.x2)
            const y = Math.min(w.y1, w.y2)
            g.rect(x, y, width, height)
            g.stroke()
        } else if (shape === 'circle') {
            const dx = w.x2 - w.x1
            const dy = w.y2 - w.y1
            const centerX = w.x1 + dx / 2
            const centerY = w.y1 + dy / 2
            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
            g.circle(centerX, centerY, radius)
            g.stroke()
        }
    }
}
