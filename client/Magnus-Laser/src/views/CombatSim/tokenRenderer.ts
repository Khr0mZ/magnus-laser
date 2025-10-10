import { Graphics, Sprite, Texture } from 'pixi.js'
import type { Image as ImageData, Token } from './types'

// Texture cache for preloaded images
const textureCache = new Map<string, Texture>()

// Simple sprite cache for each render call
const spriteCache = new Map<string, Sprite>()

// Preload textures for images
export function preloadTextures(images: ImageData[]) {
    // Clear old textures that are no longer needed
    const currentImageIds = new Set(images.map((img) => img.id))
    for (const [id, texture] of textureCache) {
        if (!currentImageIds.has(id)) {
            texture.destroy()
            textureCache.delete(id)
        }
    }

    // Load new textures
    for (const image of images) {
        if (!textureCache.has(image.id)) {
            try {
                const url = URL.createObjectURL(image.blob)
                const img = new globalThis.Image()

                // Create texture synchronously after image loads
                img.onload = () => {
                    try {
                        const texture = Texture.from(img)
                        textureCache.set(image.id, texture)
                    } catch (error) {
                        console.error('Error creating texture for image:', image.id, error)
                    }
                    URL.revokeObjectURL(url)
                }

                img.onerror = () => {
                    console.error('Failed to load image for texture:', image.id)
                    URL.revokeObjectURL(url)
                }

                img.src = url
            } catch (error) {
                console.error('Error setting up texture loading for image:', image.id, error)
            }
        }
    }
}

export function renderTokens(
    layer: Graphics | null,
    tokens: Token[],
    overrideId?: string,
    overrideX?: number,
    overrideY?: number
) {
    if (!layer) return

    // Clear the graphics layer (for colored circles)
    layer.clear()

    // Clear sprite cache from previous render
    for (const sprite of spriteCache.values()) {
        if (sprite.parent) {
            sprite.parent.removeChild(sprite)
        }
        sprite.destroy()
    }
    spriteCache.clear()

    for (const t of tokens) {
        const x = overrideId === t.id && overrideX != null ? overrideX : t.x
        const y = overrideId === t.id && overrideY != null ? overrideY : t.y

        if (t.imageId) {
            // Render as image - use preloaded texture
            const texture = textureCache.get(t.imageId)
            if (texture) {
                const sprite = new Sprite(texture)
                sprite.anchor.set(0.5) // Center the sprite
                sprite.zIndex = 2
                spriteCache.set(t.id, sprite)

                // Add to viewport
                if (layer.parent) {
                    layer.parent.addChild(sprite)
                }

                // Position the sprite
                sprite.x = x
                sprite.y = y
                // Scale sprite to fit within radius
                const scale = (t.radius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                sprite.scale.set(scale)
                sprite.visible = true
            } else {
                // Texture not loaded yet, render as circle for now
                layer.circle(x, y, t.radius).fill({ color: t.color })
            }
        } else {
            // Render as colored circle
            layer.circle(x, y, t.radius).fill({ color: t.color })
        }
    }
}

// Render tokens considering any pending move overlays and an optional live override for the token currently being dragged
export function renderTokensWithPending(
    layer: Graphics | null,
    tokens: Token[],
    pending: Map<
        string,
        {
            endX: number
            endY: number
        }
    >,
    liveId?: string,
    liveX?: number,
    liveY?: number
) {
    if (!layer) return

    // Clear the graphics layer (for colored circles)
    layer.clear()

    // Clear sprite cache from previous render
    for (const sprite of spriteCache.values()) {
        if (sprite.parent) {
            sprite.parent.removeChild(sprite)
        }
        sprite.destroy()
    }
    spriteCache.clear()

    for (const t of tokens) {
        let x = t.x
        let y = t.y
        // Tokens render at their pending positions if they have them
        if (pending.has(t.id)) {
            const p = pending.get(t.id)!
            x = p.endX
            y = p.endY
        }
        if (liveId === t.id && liveX != null && liveY != null) {
            x = liveX
            y = liveY
        }

        if (t.imageId) {
            // Render as image - use preloaded texture
            const texture = textureCache.get(t.imageId)
            if (texture) {
                const sprite = new Sprite(texture)
                sprite.anchor.set(0.5) // Center the sprite
                sprite.zIndex = 2
                spriteCache.set(t.id, sprite)

                // Add to viewport
                if (layer.parent) {
                    layer.parent.addChild(sprite)
                }

                // Position the sprite
                sprite.x = x
                sprite.y = y
                // Scale sprite to fit within radius
                const scale = (t.radius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                sprite.scale.set(scale)
                sprite.visible = true
            } else {
                // Texture not loaded yet, render as circle for now
                layer.circle(x, y, t.radius).fill({ color: t.color })
            }
        } else {
            // Render as colored circle
            layer.circle(x, y, t.radius).fill({ color: t.color })
        }
    }

    // Draw pending overlays (ghosts at original positions)
    for (const [id] of pending) {
        const t = tokens.find((tok) => tok.id === id)
        if (!t) continue

        if (t.imageId) {
            // For image tokens, show a semi-transparent overlay at original position
            const texture = textureCache.get(t.imageId)
            if (texture) {
                const sprite = new Sprite(texture)
                sprite.anchor.set(0.5)
                sprite.alpha = 0.5 // Semi-transparent for ghost
                sprite.zIndex = 2
                spriteCache.set(`${id}_ghost`, sprite)
                if (layer.parent) {
                    layer.parent.addChild(sprite)
                }
                // Position the sprite at original position (t.x, t.y)
                sprite.x = t.x
                sprite.y = t.y
                const scale = (t.radius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                sprite.scale.set(scale)
                sprite.visible = true
            }
        } else {
            // Draw a semi-transparent version at the original position
            layer.circle(t.x, t.y, t.radius).fill({ color: t.color, alpha: 0.5 })
        }
    }
}
