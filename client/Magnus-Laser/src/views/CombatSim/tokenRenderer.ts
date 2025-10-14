import { Graphics, Sprite, Text, Texture } from 'pixi.js'
import type { Image as ImageData, Token } from './types'

// Texture cache for preloaded images
const textureCache = new Map<string, Texture>()

// Simple sprite cache for each render call
const spriteCache = new Map<string, Sprite>()

// Name label cache for each render call
const labelCache = new Map<string, Text>()

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
    if (!layer || !layer.parent) return

    // Clear the graphics layer (for colored circles)
    layer.clear()

    // Clear sprite cache from previous render
    for (const sprite of spriteCache.values()) {
        try {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite)
            }
            sprite.destroy()
        } catch (error) {
            console.warn('Error destroying sprite:', error)
        }
    }
    spriteCache.clear()

    // Clear label cache from previous render
    for (const label of labelCache.values()) {
        try {
            if (label.parent) {
                label.parent.removeChild(label)
            }
            label.destroy()
        } catch (error) {
            console.warn('Error destroying label:', error)
        }
    }
    labelCache.clear()

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

        // Add name label above the token
        const label = new Text({
            text: t.name,
            style: {
                fill: 0xffffff,
                fontSize: 14,
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 3 },
            },
        })
        label.anchor.set(0.5, 1) // Center horizontally, anchor at bottom
        label.x = x
        label.y = y - t.radius - 4 // Position above the token with 4px gap
        label.zIndex = 10 // Higher than tokens
        labelCache.set(t.id, label)

        if (layer.parent) {
            layer.parent.addChild(label)
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
    if (!layer || !layer.parent) return

    // Clear the graphics layer (for colored circles)
    layer.clear()

    // Clear sprite cache from previous render
    for (const sprite of spriteCache.values()) {
        try {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite)
            }
            sprite.destroy()
        } catch (error) {
            console.warn('Error destroying sprite:', error)
        }
    }
    spriteCache.clear()

    // Clear label cache from previous render
    for (const label of labelCache.values()) {
        try {
            if (label.parent) {
                label.parent.removeChild(label)
            }
            label.destroy()
        } catch (error) {
            console.warn('Error destroying label:', error)
        }
    }
    labelCache.clear()

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

        // Add name label above the token
        const label = new Text({
            text: t.name,
            style: {
                fill: 0xffffff,
                fontSize: 14,
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 3 },
            },
        })
        label.anchor.set(0.5, 1) // Center horizontally, anchor at bottom
        label.x = x
        label.y = y - t.radius - 4 // Position above the token with 4px gap
        label.zIndex = 10 // Higher than tokens
        labelCache.set(t.id, label)

        if (layer.parent) {
            layer.parent.addChild(label)
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

        // Add ghost name label at original position
        const ghostLabel = new Text({
            text: t.name,
            style: {
                fill: 0xffffff,
                fontSize: 14,
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 3 },
            },
        })
        ghostLabel.anchor.set(0.5, 1)
        ghostLabel.x = t.x
        ghostLabel.y = t.y - t.radius - 4
        ghostLabel.zIndex = 10
        ghostLabel.alpha = 0.5
        labelCache.set(`${id}_ghost_label`, ghostLabel)

        if (layer.parent) {
            layer.parent.addChild(ghostLabel)
        }
    }
}
