import { Viewport } from 'pixi-viewport'
import { Graphics, Sprite, Texture } from 'pixi.js'
import { drawGrid } from './gridUtils'

// Helper to apply background texture when ready
export function applyBackgroundTexture(
    tex: Texture,
    viewport: Viewport,
    backgroundRef: React.RefObject<Sprite | null>,
    gridRef: React.RefObject<Graphics | null>,
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

export const toAlphaHex = (a: number) =>
    Math.max(0, Math.min(255, Math.round(a * 255)))
        .toString(16)
        .padStart(2, '0')

export async function fileToImage(file: globalThis.File): Promise<globalThis.HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error)
        reader.onload = () => {
            const img = new globalThis.Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = String(reader.result)
        }
        reader.readAsDataURL(file)
    })
}

export async function blobToImage(blob: Blob | undefined): Promise<globalThis.HTMLImageElement | null> {
    if (!blob) {
        console.warn('blobToImage called with null/undefined blob')
        return null
    }

    // Additional validation to check if blob is actually a Blob instance
    if (!(blob instanceof Blob)) {
        console.error('blobToImage called with invalid blob - not a Blob instance:', {
            type: typeof blob,
            value: blob,
            constructor: (blob as unknown)?.constructor?.name,
        })
        return null
    }

    // Check if blob has valid size
    if (blob.size === 0) {
        console.warn('blobToImage called with empty blob')
        return null
    }

    return new Promise((resolve, reject) => {
        try {
            const url = URL.createObjectURL(blob)
            const img = new (globalThis.Image as typeof globalThis.Image)()
            img.onload = () => {
                URL.revokeObjectURL(url)
                resolve(img)
            }
            img.onerror = (e) => {
                URL.revokeObjectURL(url)
                reject(e)
            }
            img.src = url
        } catch (error) {
            console.error('Error creating object URL from blob:', error, 'Blob details:', {
                type: blob.type,
                size: blob.size,
                constructor: blob.constructor.name,
            })
            reject(error)
        }
    })
}

export async function createBlankPngBlob(): Promise<Blob> {
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    return await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b ?? new Blob([''], { type: 'image/png' })), 'image/png')
    })
}

export const hexToPixi = (hex: string) => Number(`0x${hex.replace('#', '')}`)
export const pixiToCss = (color: number) => `#${color.toString(16).padStart(6, '0')}`
