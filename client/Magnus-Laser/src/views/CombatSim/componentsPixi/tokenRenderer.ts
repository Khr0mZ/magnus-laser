import { Circle, Graphics, Sprite, Text, Texture } from 'pixi.js'
import type { Image as ImageData, Token } from '../utils/types'

// Texture cache for preloaded images
const textureCache = new Map<string, Texture>()

// Callback for when textures are loaded
let onTexturesReady: (() => void) | null = null

export function setTexturesReadyCallback(callback: () => void) {
    onTexturesReady = callback
}

// Persistent caches for sprites and labels (keyed by token id)
export const spriteCache = new Map<string, Sprite>()
const labelCache = new Map<string, Text>()
// Ghost overlays when a token has a pending move (semi-transparent original position)
export const ghostSpriteCache = new Map<string, Sprite>()
const ghostLabelCache = new Map<string, Text>()

function ensureParent(child: Sprite | Text, parent: Graphics['parent']): void {
    if (!parent) return
    if (!child.parent) {
        parent.addChild(child)
    } else if (child.parent !== parent) {
        try {
            child.parent.removeChild(child)
        } catch (e) {
            void e
        }
        parent.addChild(child)
    }
}

function upsertLabel(id: string, parent: Graphics['parent'], text: string, x: number, y: number): Text {
    let label = labelCache.get(id)
    if (!label) {
        label = new Text({
            text,
            style: {
                fill: 0xffffff,
                fontSize: 14,
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 3 },
            },
        })
        label.anchor.set(0.5, 1)
        label.zIndex = 10
        labelCache.set(id, label)
    } else if (label.text !== text) {
        label.text = text
    }
    ensureParent(label, parent)
    label.x = x
    label.y = y
    label.visible = true
    return label
}

function upsertGhostLabel(id: string, parent: Graphics['parent'], text: string, x: number, y: number): Text {
    let label = ghostLabelCache.get(id)
    if (!label) {
        label = new Text({
            text,
            style: {
                fill: 0xffffff,
                fontSize: 14,
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 3 },
            },
        })
        label.anchor.set(0.5, 1)
        label.zIndex = 10
        label.alpha = 0.5
        ghostLabelCache.set(id, label)
    } else if (label.text !== text) {
        label.text = text
    }
    ensureParent(label, parent)
    label.x = x
    label.y = y
    label.visible = true
    return label
}

function destroySprite(map: Map<string, Sprite>, key: string): void {
    const s = map.get(key)
    if (!s) return
    try {
        if (s.parent) s.parent.removeChild(s)
        s.destroy()
    } catch (e) {
        void e
    }
    map.delete(key)
}

function destroyLabel(map: Map<string, Text>, key: string): void {
    const l = map.get(key)
    if (!l) return
    try {
        if (l.parent) l.parent.removeChild(l)
        l.destroy()
    } catch (e) {
        void e
    }
    map.delete(key)
}

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
    let loadingCount = 0
    let loadedCount = 0

    const checkAllLoaded = () => {
        loadedCount++
        if (loadedCount >= loadingCount && onTexturesReady) {
            onTexturesReady()
        }
    }

    for (const image of images) {
        if (!textureCache.has(image.id) && image.blob) {
            loadingCount++
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
                    checkAllLoaded()
                }

                img.onerror = () => {
                    console.error('Failed to load image for texture:', image.id)
                    URL.revokeObjectURL(url)
                    checkAllLoaded()
                }

                img.src = url
            } catch (error) {
                console.error('Error setting up texture loading for image:', image.id, error)
                loadingCount--
            }
        }
    }

    // If no textures are loading, call callback immediately
    if (loadingCount === 0 && onTexturesReady) {
        onTexturesReady()
    }
}

export function renderTokens(
    layer: Graphics | null,
    tokens: Token[],
    gridSize: number,
    overrideId?: string,
    overrideX?: number,
    overrideY?: number
) {
    if (!layer || !layer.parent) return

    // Clear the graphics layer used for simple shapes
    layer.clear()

    // Build a set of desired ids to keep (no ghosts in this path)
    const desiredIds = new Set<string>(tokens.map((t) => t.id))

    for (const t of tokens) {
        const x = overrideId === t.id && overrideX != null ? overrideX : t.x
        const y = overrideId === t.id && overrideY != null ? overrideY : t.y

        if (t.imageId) {
            const texture = textureCache.get(t.imageId)
            if (texture) {
                let sprite = spriteCache.get(t.id)
                if (!sprite) {
                    sprite = new Sprite(texture)
                    sprite.anchor.set(0.5)
                    sprite.zIndex = 2
                    spriteCache.set(t.id, sprite)
                } else if (sprite.texture !== texture) {
                    // Image changed for this token id
                    sprite.texture = texture
                }
                ensureParent(sprite, layer.parent)
                sprite.x = x
                sprite.y = y
                const radius = t.customRadius ?? gridSize / 2
                const scale = (radius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                sprite.scale.set(scale)
                // Set hit area to match the visual size
                sprite.hitArea = new Circle(0, 0, radius)
                sprite.visible = true
            } else {
                // Texture not loaded yet, render as circle for now
                const radius = t.customRadius ?? gridSize / 2
                layer.circle(x, y, radius).fill({ color: t.color })
                // If a sprite existed previously (switched from image to not), remove it
                if (spriteCache.has(t.id)) destroySprite(spriteCache, t.id)
            }
        } else {
            // Render as colored circle
            const radius = t.customRadius ?? gridSize / 2
            layer.circle(x, y, radius).fill({ color: t.color })
            if (spriteCache.has(t.id)) destroySprite(spriteCache, t.id)
        }

        // Upsert name label above the token
        const radius = t.customRadius ?? gridSize / 2
        upsertLabel(t.id, layer.parent, t.name, x, y - radius - 4)
    }

    // Remove any sprites/labels for tokens that no longer exist
    for (const id of Array.from(spriteCache.keys())) {
        if (!desiredIds.has(id)) destroySprite(spriteCache, id)
    }
    for (const id of Array.from(labelCache.keys())) {
        if (!desiredIds.has(id)) destroyLabel(labelCache, id)
    }
}

// Render tokens considering any pending move overlays and an optional live override for the token currently being dragged
export function renderTokensWithPending(
    layer: Graphics | null,
    tokens: Token[],
    gridSize: number,
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

    // Desired ids for live tokens and ghosts
    const desiredIds = new Set<string>()
    const desiredGhostIds = new Set<string>()

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

        desiredIds.add(t.id)

        if (t.imageId) {
            const texture = textureCache.get(t.imageId)
            if (texture) {
                let sprite = spriteCache.get(t.id)
                if (!sprite) {
                    sprite = new Sprite(texture)
                    sprite.anchor.set(0.5)
                    sprite.zIndex = 2
                    spriteCache.set(t.id, sprite)
                } else if (sprite.texture !== texture) {
                    sprite.texture = texture
                }
                ensureParent(sprite, layer.parent)
                sprite.x = x
                sprite.y = y
                const radius = t.customRadius ?? gridSize / 2
                const scale = (radius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                sprite.scale.set(scale)
                // Set hit area to match the visual size
                sprite.hitArea = new Circle(0, 0, radius)
                sprite.visible = true
            } else {
                // Texture not loaded yet, render as circle for now
                const radius = t.customRadius ?? gridSize / 2
                layer.circle(x, y, radius).fill({ color: t.color })
                if (spriteCache.has(t.id)) destroySprite(spriteCache, t.id)
            }
        } else {
            const radius = t.customRadius ?? gridSize / 2
            layer.circle(x, y, radius).fill({ color: t.color })
            if (spriteCache.has(t.id)) destroySprite(spriteCache, t.id)
        }

        const radius = t.customRadius ?? gridSize / 2
        upsertLabel(t.id, layer.parent, t.name, x, y - radius - 4)
    }

    // Draw pending overlays (ghosts at original positions)
    for (const [id] of pending) {
        const t = tokens.find((tok) => tok.id === id)
        if (!t) continue

        const ghostKey = `${id}_ghost`
        desiredGhostIds.add(ghostKey)

        if (t.imageId) {
            const texture = textureCache.get(t.imageId)
            if (texture) {
                let sprite = ghostSpriteCache.get(ghostKey)
                if (!sprite) {
                    sprite = new Sprite(texture)
                    sprite.anchor.set(0.5)
                    sprite.alpha = 0.5
                    sprite.zIndex = 2
                    ghostSpriteCache.set(ghostKey, sprite)
                } else if (sprite.texture !== texture) {
                    sprite.texture = texture
                }
                ensureParent(sprite, layer.parent)
                sprite.x = t.x
                sprite.y = t.y
                const radius = t.customRadius ?? gridSize / 2
                const scale = (radius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                sprite.scale.set(scale)
                // Set hit area to match the visual size
                sprite.hitArea = new Circle(0, 0, radius)
                sprite.visible = true
            }
        } else {
            const radius = t.customRadius ?? gridSize / 2
            layer.circle(t.x, t.y, radius).fill({ color: t.color, alpha: 0.5 })
            if (ghostSpriteCache.has(ghostKey)) destroySprite(ghostSpriteCache, ghostKey)
        }

        const radius = t.customRadius ?? gridSize / 2
        upsertGhostLabel(`${id}_ghost_label`, layer.parent, t.name, t.x, t.y - radius - 4)
    }

    // Cleanup caches for objects that are no longer needed
    for (const id of Array.from(spriteCache.keys())) {
        if (!desiredIds.has(id)) destroySprite(spriteCache, id)
    }
    for (const id of Array.from(labelCache.keys())) {
        if (!desiredIds.has(id)) destroyLabel(labelCache, id)
    }
    for (const id of Array.from(ghostSpriteCache.keys())) {
        if (!desiredGhostIds.has(id)) destroySprite(ghostSpriteCache, id)
    }
    for (const id of Array.from(ghostLabelCache.keys())) {
        if (!desiredGhostIds.has(id)) destroyLabel(ghostLabelCache, id)
    }
}

// Allow external callers to fully clear caches (e.g., on unmount)
export function clearTokenRendererCaches(): void {
    // Clear all textures
    for (const texture of textureCache.values()) {
        try {
            texture.destroy()
        } catch (error) {
            console.warn('Error destroying token texture during cache clear:', error)
        }
    }
    textureCache.clear()

    for (const id of Array.from(spriteCache.keys())) destroySprite(spriteCache, id)
    for (const id of Array.from(labelCache.keys())) destroyLabel(labelCache, id)
    for (const id of Array.from(ghostSpriteCache.keys())) destroySprite(ghostSpriteCache, id)
    for (const id of Array.from(ghostLabelCache.keys())) destroyLabel(ghostLabelCache, id)
}
