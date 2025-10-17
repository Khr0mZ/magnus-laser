import { Graphics, Sprite, Texture } from 'pixi.js'
import { snapToNinePoints } from './gridUtils'
import { Blast } from './types'

// Cache for blast textures
const textureCache: Record<string, Texture> = {}

// Cache for blast sprites
const spriteCache = new Map<string, Sprite>()
const maskCache = new Map<string, Graphics>()

/**
 * Preload all blast textures
 */
export async function preloadBlastTextures(): Promise<void> {
    const texturePaths = {
        circle: '/blasts/circle_blast.webp',
        square: '/blasts/square_blast.webp',
        cone: '/blasts/flame_blast.webp',
    }

    for (const [key, path] of Object.entries(texturePaths)) {
        try {
            const img = new window.Image()
            img.src = path
            await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                    try {
                        const texture = Texture.from(img)
                        textureCache[key] = texture
                        resolve()
                    } catch (error) {
                        reject(error)
                    }
                }
                img.onerror = () => reject(new Error(`Failed to load image: ${path}`))
            })
        } catch (error) {
            console.error(`Failed to load blast texture ${key} from ${path}:`, error)
        }
    }
}

/**
 * Get cached texture by type
 */
function getBlastTexture(type: 'circle' | 'square' | 'cone'): Texture | null {
    return textureCache[type] || null
}

/**
 * Calculate cone triangle points given apex and endpoint
 * @param x1 Apex X
 * @param y1 Apex Y
 * @param x2 Endpoint X
 * @param y2 Endpoint Y
 * @param angle Cone angle in degrees (default 28)
 * @returns Array of three points [apex, left, right]
 */
export function calculateConePoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    angle: number = 28
): { x: number; y: number }[] {
    // Calculate distance and direction
    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.sqrt(dx * dx + dy * dy)
    const baseAngle = Math.atan2(dy, dx)

    // Calculate half angle in radians
    const halfAngleRad = (angle / 2) * (Math.PI / 180)

    // Calculate the two base points
    const leftAngle = baseAngle - halfAngleRad
    const rightAngle = baseAngle + halfAngleRad

    const leftX = x1 + Math.cos(leftAngle) * distance
    const leftY = y1 + Math.sin(leftAngle) * distance

    const rightX = x1 + Math.cos(rightAngle) * distance
    const rightY = y1 + Math.sin(rightAngle) * distance

    return [
        { x: x1, y: y1 }, // Apex
        { x: leftX, y: leftY }, // Left base point
        { x: rightX, y: rightY }, // Right base point
    ]
}

/**
 * Render all blasts on the given graphics layer
 */
export function renderBlasts(layer: Graphics | null, blasts: Blast[], gridSize: number): void {
    if (!layer || !layer.parent) return

    // Clear the graphics layer (for fallback solid shapes)
    layer.clear()

    // Clear sprite cache from previous render
    for (const sprite of spriteCache.values()) {
        try {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite)
            }
            sprite.destroy()
        } catch (error) {
            console.warn('Error destroying blast sprite:', error)
        }
    }
    spriteCache.clear()

    // Clear mask cache from previous render
    for (const mask of maskCache.values()) {
        try {
            if (mask.parent) {
                mask.parent.removeChild(mask)
            }
            mask.destroy()
        } catch (error) {
            console.warn('Error destroying blast mask:', error)
        }
    }
    maskCache.clear()

    for (const blast of blasts) {
        renderBlast(layer, blast, gridSize)
    }
}

/**
 * Render a single blast
 */
function renderBlast(layer: Graphics, blast: Blast, gridSize: number): void {
    const alpha = blast.alpha ?? 0.7

    switch (blast.type) {
        case 'grenade':
            renderGrenadeBlast(layer, blast, gridSize, alpha)
            break
        case 'circle':
            renderCircleBlast(layer, blast, gridSize, alpha)
            break
        case 'square':
            renderSquareBlast(layer, blast, gridSize, alpha)
            break
        case 'cone':
            renderConeBlast(layer, blast, gridSize, alpha)
            break
    }
}

/**
 * Render grenade blast (fixed 5x5 grid cells = 10m x 10m)
 */
function renderGrenadeBlast(layer: Graphics, blast: Blast, gridSize: number, alpha: number): void {
    const texture = getBlastTexture('circle')
    if (!texture) {
        // Fallback to solid circle if texture not loaded
        const radius = (gridSize * 5) / 2 // 2.5 grid cells radius
        layer.circle(blast.x, blast.y, radius)
        layer.fill({ color: 0xff4400, alpha })
        return
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5) // Center the sprite (same as tokens)
    sprite.zIndex = 0.5 // Below tokens
    spriteCache.set(blast.id, sprite)

    // Add to viewport (same as tokens)
    if (layer.parent) {
        layer.parent.addChild(sprite)
    }

    // Position the sprite (same as tokens)
    sprite.x = blast.x
    sprite.y = blast.y
    // Scale to fit 5x5 grid cells (same as tokens)
    const targetSize = gridSize * 5
    const scale = targetSize / Math.max(texture.width, texture.height)
    sprite.scale.set(scale)
    sprite.alpha = alpha
}

/**
 * Render adaptable circle blast
 */
function renderCircleBlast(layer: Graphics, blast: Blast, gridSize: number, alpha: number): void {
    if (!blast.size) return

    const texture = getBlastTexture('circle')
    if (!texture) {
        // Fallback to solid circle
        const radius = gridSize * blast.size
        layer.circle(blast.x, blast.y, radius)
        layer.fill({ color: 0xff4400, alpha })
        return
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5) // Center the sprite (same as tokens)
    sprite.zIndex = 0.5 // Below tokens
    spriteCache.set(blast.id, sprite)

    // Add to viewport (same as tokens)
    if (layer.parent) {
        layer.parent.addChild(sprite)
    }

    // Position the sprite (same as tokens)
    sprite.x = blast.x
    sprite.y = blast.y
    // Scale based on size (size is in grid cells, represents radius) - same as tokens
    const targetSize = gridSize * blast.size * 2 // diameter in pixels
    const scale = targetSize / Math.max(texture.width, texture.height)
    sprite.scale.set(scale)
    sprite.alpha = alpha
}

/**
 * Render adaptable square blast
 */
function renderSquareBlast(layer: Graphics, blast: Blast, gridSize: number, alpha: number): void {
    if (!blast.size) return

    const texture = getBlastTexture('square')
    const width = gridSize * blast.size
    const height = gridSize * (blast.sizeY || blast.size) // Use sizeY for rectangles, or size if square

    if (!texture) {
        // Fallback to solid rectangle
        layer.rect(blast.x - width / 2, blast.y - height / 2, width, height)
        layer.fill({ color: 0xff4400, alpha })
        return
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5) // Center the sprite (same as tokens)
    sprite.zIndex = 0.5 // Below tokens
    spriteCache.set(blast.id, sprite)

    // Add to viewport (same as tokens)
    if (layer.parent) {
        layer.parent.addChild(sprite)
    }

    // Position the sprite (same as tokens)
    sprite.x = blast.x
    sprite.y = blast.y
    // Scale sprite independently for width and height to support rectangles
    const scaleX = width / texture.width
    const scaleY = height / texture.height
    sprite.scale.set(scaleX, scaleY)
    sprite.alpha = alpha
}

/**
 * Render adaptable cone blast
 */
function renderConeBlast(layer: Graphics, blast: Blast, _gridSize: number, alpha: number): void {
    if (blast.x2 === undefined || blast.y2 === undefined) return

    const points = calculateConePoints(blast.x, blast.y, blast.x2, blast.y2)
    const texture = getBlastTexture('cone')

    if (!texture) {
        // Fallback to solid triangle
        layer.moveTo(points[0].x, points[0].y)
        layer.lineTo(points[1].x, points[1].y)
        layer.lineTo(points[2].x, points[2].y)
        layer.lineTo(points[0].x, points[0].y)
        layer.fill({ color: 0xff4400, alpha })
        return
    }

    // For cone, we'll use a textured triangle
    // Calculate base angle for rotation of the texture so it aligns with cone direction
    const baseDx = blast.x2 - blast.x
    const baseDy = blast.y2 - blast.y
    const baseAngle = Math.atan2(baseDy, baseDx)
    // Texture is authored with apex at left, pointing to +X; no offset needed
    const TEXTURE_FORWARD_OFFSET = 0

    const sprite = new Sprite(texture)
    sprite.alpha = alpha
    sprite.zIndex = 0.5 // Below tokens

    // Compute length from apex to endpoint; for a 28° cone, base width is approximately 0.499 * length
    const len = Math.max(1, Math.hypot(baseDx, baseDy))
    const baseWidth = len * 0.499 // 2 * tan(14°) ≈ 0.499
    // Position sprite so that its apex (left-middle) sits at blast apex
    sprite.anchor.set(0, 0.5)
    sprite.position.set(blast.x, blast.y)
    // Orient sprite along cone direction
    sprite.rotation = baseAngle + TEXTURE_FORWARD_OFFSET
    // Scale sprite to cover the cone: width along length, height equals base width
    sprite.width = len
    sprite.height = baseWidth

    // Create triangle mask
    const mask = new Graphics()
    mask.moveTo(points[0].x, points[0].y)
    mask.lineTo(points[1].x, points[1].y)
    mask.lineTo(points[2].x, points[2].y)
    mask.lineTo(points[0].x, points[0].y)
    mask.fill({ color: 0xffffff })

    sprite.mask = mask

    spriteCache.set(blast.id, sprite)
    maskCache.set(`${blast.id}-mask`, mask)

    // Add to viewport (layer.parent)
    if (layer.parent) {
        layer.parent.addChild(mask)
        layer.parent.addChild(sprite)
    }
}

/**
 * Draw blast preview while in drawing mode with size label (zoom-compensated)
 */
export function drawBlastPreview(
    layer: Graphics,
    type: 'circle' | 'square' | 'cone',
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    gridSize: number
): { sizeText: string; labelX: number; labelY: number } {
    if (!layer) return { sizeText: '', labelX: 0, labelY: 0 }

    layer.clear()

    const alpha = 0.5
    const color = 0xff8800
    let sizeText = ''
    let labelX = 0
    let labelY = 0

    switch (type) {
        case 'circle': {
            // Draw from corner to corner - center at midpoint, radius is half of smaller dimension
            const dx = x2 - x1
            const dy = y2 - y1
            const centerX = x1 + dx / 2
            const centerY = y1 + dy / 2
            const width = Math.abs(dx)
            const height = Math.abs(dy)
            const radius = Math.min(width, height) / 2
            layer.circle(centerX, centerY, radius)
            layer.fill({ color, alpha })
            layer.stroke({ color, width: 2, alpha })

            const radiusInGrids = (radius / gridSize).toFixed(1)
            sizeText = `r=${radiusInGrids}`
            labelX = centerX
            labelY = centerY - radius - 20
            break
        }
        case 'square': {
            // Draw from corner to corner - center at midpoint, width and height independently
            const dx = x2 - x1
            const dy = y2 - y1
            const centerX = x1 + dx / 2
            const centerY = y1 + dy / 2
            const width = Math.abs(dx)
            const height = Math.abs(dy)
            layer.rect(centerX - width / 2, centerY - height / 2, width, height)
            layer.fill({ color, alpha })
            layer.stroke({ color, width: 2, alpha })

            const widthInGrids = (width / gridSize).toFixed(1)
            const heightInGrids = (height / gridSize).toFixed(1)
            sizeText = `${widthInGrids}x${heightInGrids}`
            labelX = centerX
            labelY = centerY - Math.max(width, height) / 2 - 20
            break
        }
        case 'cone': {
            // For preview, calculate the fixed endpoint 6 grid sizes away
            const dx = x2 - x1
            const dy = y2 - y1
            const distance = Math.sqrt(dx * dx + dy * dy)
            const directionX = dx / distance
            const directionY = dy / distance
            const fixedLength = 6 * gridSize
            let previewX2 = x1 + directionX * fixedLength
            let previewY2 = y1 + directionY * fixedLength

            // Snap endpoint to 9 points for preview
            const snappedEndpoint = snapToNinePoints(previewX2, previewY2, gridSize, true)
            previewX2 = snappedEndpoint.x
            previewY2 = snappedEndpoint.y

            const points = calculateConePoints(x1, y1, previewX2, previewY2, 28)
            layer.moveTo(points[0].x, points[0].y)
            layer.lineTo(points[1].x, points[1].y)
            layer.lineTo(points[2].x, points[2].y)
            layer.lineTo(points[0].x, points[0].y)
            layer.fill({ color, alpha })
            layer.stroke({ color, width: 2, alpha })

            // Calculate actual preview length after snapping
            const actualLength = Math.sqrt((previewX2 - x1) ** 2 + (previewY2 - y1) ** 2)
            const lengthInGrids = (actualLength / gridSize).toFixed(1)
            sizeText = `L=${lengthInGrids} (28°)`
            labelX = (x1 + previewX2) / 2
            labelY = (y1 + previewY2) / 2 - 20
            break
        }
    }

    return { sizeText, labelX, labelY }
}
