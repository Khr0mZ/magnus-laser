import { Container, Graphics, Text } from 'pixi.js'

/**
 * PixiJS UI-based Button Component
 * Replaces manual Graphics + Text button creation
 */

export interface PixiButtonProps {
    text: string
    size: number
    borderColor: number
    baseFill: number
    hoverFill: number
    textColor?: number
    onClick: () => void
}

/**
 * Create a PixiJS UI Button with hover effects
 */
export function createPixiButton(props: PixiButtonProps): Container {
    const { text, size, borderColor, baseFill, hoverFill, textColor = 0xffffff, onClick } = props

    const container = new Container()

    // Create button background (square instead of circle)
    const background = new Graphics()
    background.setFillStyle({ color: baseFill, alpha: 0.4 })
    background.setStrokeStyle({ width: 1, color: borderColor, alpha: 0.38 })
    background
        .roundRect(-size / 2, -size / 2, size, size, 4)
        .fill()
        .stroke()

    // Create text label with larger font
    const label = new Text({
        text,
        style: {
            fontSize: Math.max(16, size * 0.5),
            fill: textColor,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
        },
    })
    label.anchor.set(0.5, 0.5)

    // Add hover effects
    container.interactive = true
    container.cursor = 'pointer'

    container.on('pointerover', () => {
        background.clear()
        background.setFillStyle({ color: hoverFill, alpha: 0.6 })
        background.setStrokeStyle({ width: 1, color: borderColor, alpha: 0.38 })
        background
            .roundRect(-size / 2, -size / 2, size, size, 4)
            .fill()
            .stroke()
    })

    container.on('pointerout', () => {
        background.clear()
        background.setFillStyle({ color: baseFill, alpha: 0.4 })
        background.setStrokeStyle({ width: 1, color: borderColor, alpha: 0.38 })
        background
            .roundRect(-size / 2, -size / 2, size, size, 4)
            .fill()
            .stroke()
    })

    container.on('pointertap', () => {
        onClick()
    })

    container.addChild(background)
    container.addChild(label)

    return container
}

/**
 * Create accept button (green checkmark)
 */
export function createAcceptButton(onClick: () => void, size: number = 32): Container {
    return createPixiButton({
        text: '✔️',
        size,
        borderColor: 0x00ff88,
        baseFill: 0x002800,
        hoverFill: 0x003c00,
        textColor: 0x00ff88,
        onClick,
    })
}

/**
 * Create cancel button (red X)
 */
export function createCancelButton(onClick: () => void, size: number = 32): Container {
    return createPixiButton({
        text: '❌',
        size,
        borderColor: 0xff3b81,
        baseFill: 0x280000,
        hoverFill: 0x3c0000,
        textColor: 0xff3b81,
        onClick,
    })
}
