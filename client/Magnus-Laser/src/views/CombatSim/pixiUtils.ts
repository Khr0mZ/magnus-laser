import { Viewport } from 'pixi-viewport'
import { Graphics, Sprite, Texture } from 'pixi.js'
import { drawGrid } from './gridUtils'

// Helper to apply background texture when ready
export function applyBackgroundTexture(
    tex: Texture,
    viewport: Viewport,
    backgroundRef: React.MutableRefObject<Sprite | null>,
    gridRef: React.MutableRefObject<Graphics | null>,
    gridSize: number,
    gridColor: number,
    gridAlpha: number
) {
    if (!viewport || !backgroundRef.current) return
    // Replace old background sprite to avoid stale state
    if (backgroundRef.current) {
        try {
            viewport.removeChild(backgroundRef.current)
            backgroundRef.current.destroy({ children: false, texture: false })
        } catch {
            console.error('Failed to remove old background sprite')
        }
    }
    const bg = new Sprite(tex)
    bg.tint = 0xffffff
    bg.alpha = 1
    bg.zIndex = 0
    backgroundRef.current = bg
    viewport.addChildAt(bg, 0)
    const base = tex
    const fit = () => {
        const w = base.width || bg.width || 1
        const h = base.height || bg.height || 1
        bg.width = w
        bg.height = h
        const sw = viewport.screenWidth
        const sh = viewport.screenHeight
        const scale = Math.min(sw / w, sh / h)
        viewport.setZoom(scale, true)
        viewport.moveCenter(w / 2, h / 2)
        // Redraw grid to match new background dimensions
        if (gridRef.current) {
            gridRef.current.clear()
            drawGrid(gridRef.current, w, h, gridSize, gridColor, gridAlpha)
        }
    }
    if (!base.width || !base.height) {
        tex.once('update', fit)
    } else {
        fit()
    }
}
