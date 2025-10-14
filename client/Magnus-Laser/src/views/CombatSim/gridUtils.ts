import { Graphics } from 'pixi.js'

export function drawGrid(
    g: Graphics,
    worldWidth: number,
    worldHeight: number,
    step: number,
    color: number,
    alpha: number
) {
    g.clear()
    g.stroke({ color, alpha, width: 1 })

    // Vertical lines
    for (let x = 0; x <= worldWidth; x += step) {
        g.moveTo(x, 0).lineTo(x, worldHeight)
    }

    // Horizontal lines
    for (let y = 0; y <= worldHeight; y += step) {
        g.moveTo(0, y).lineTo(worldWidth, y)
    }

    g.stroke()
}

// Helper: snap to nearest of 9 points per cell (vertices, edge centers, cell center)
export function snapToNinePoints(x: number, y: number, gridSize: number, snapToGrid: boolean) {
    if (!snapToGrid) return { x, y }
    const step = gridSize
    const half = step / 2
    const vx = Math.round(x / step) * step
    const vy = Math.round(y / step) * step
    const cx = Math.round((x - half) / step) * step + half
    const cy = Math.round((y - half) / step) * step + half
    const candidates = [
        { x: vx, y: vy }, // vertex
        { x: cx, y: cy }, // center
        { x: cx, y: vy }, // edge center (horizontal)
        { x: vx, y: cy }, // edge center (vertical)
    ]
    let best = candidates[0]
    let bestD = (best.x - x) * (best.x - x) + (best.y - y) * (best.y - y)
    for (let i = 1; i < candidates.length; i++) {
        const c = candidates[i]
        const d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y)
        if (d < bestD) {
            best = c
            bestD = d
        }
    }
    return best
}

// Compute endpoint from apex, angle (radians) and length; optionally snap to nine points
export function endpointFromAngleLength(
    apexX: number,
    apexY: number,
    angleRad: number,
    lengthPx: number,
    gridSize: number,
    snapToGrid: boolean
) {
    const x = apexX + Math.cos(angleRad) * lengthPx
    const y = apexY + Math.sin(angleRad) * lengthPx
    const snapped = snapToNinePoints(x, y, gridSize, snapToGrid)
    return { x: snapped.x, y: snapped.y }
}
