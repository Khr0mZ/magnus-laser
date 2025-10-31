import { Viewport } from 'pixi-viewport'
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Token } from '../types'
import { createAcceptButton, createCancelButton } from './PixiButton'

export interface PixiPendingIndicatorProps {
    id: string
    startX: number
    startY: number
    endX: number
    endY: number
    points: { x: number; y: number }[]
    gridSize: number
    isCombatActive: boolean
    token: Token | undefined
    viewport: Viewport
    onAccept: () => void
    onCancel: () => void
    isPlayerConnected?: boolean
    isPreview?: boolean
}

/**
 * PixiJS-based pending movement indicator component
 * Shows movement path, distance label, and accept/cancel buttons
 */
export class PixiPendingIndicator extends Container {
    private line: Graphics
    private background: Graphics
    public distanceLabel: Text
    public acceptContainer: Container
    public cancelContainer: Container
    public props: PixiPendingIndicatorProps
    private lastZoom: number = 1

    constructor(props: PixiPendingIndicatorProps) {
        super()

        this.props = props
        this.lastZoom = props.viewport.scale.x

        // Create line graphics for movement path
        this.line = new Graphics()
        this.line.zIndex = 3
        props.viewport.addChild(this.line)

        // Create background container
        this.background = new Graphics()
        this.background.zIndex = 4 // Above line but below label
        props.viewport.addChild(this.background)

        // Create label for distance/movement info
        this.distanceLabel = new Text({
            text: '',
            style: {
                fill: 0xffffff,
                fontFamily: '"Orbitron", monospace',
            } as TextStyle,
        })
        this.distanceLabel.visible = false
        this.distanceLabel.zIndex = 5 // Above background
        this.distanceLabel.eventMode = 'none'
        // anchor label at left-middle so y is the vertical center
        this.distanceLabel.anchor?.set?.(0, 0.5)
        // Add label directly to viewport like original code
        props.viewport.addChild(this.distanceLabel)

        // Create accept and cancel buttons
        this.acceptContainer = createAcceptButton(() => {
            this.props.onAccept()
        })
        this.cancelContainer = createCancelButton(() => {
            this.props.onCancel()
        })

        this.acceptContainer.zIndex = 6
        this.cancelContainer.zIndex = 6
        this.acceptContainer.visible = false
        this.cancelContainer.visible = false

        props.viewport.addChild(this.acceptContainer)
        props.viewport.addChild(this.cancelContainer)

        // Add to viewport
        props.viewport.addChild(this)

        // Listen to zoom/scale changes to update scaling
        props.viewport.on('zoomed', () => {
            this.update()
        })
        props.viewport.on('moved', () => {
            // Also listen to moved events as they might include zoom changes
            this.update()
        })

        // Fallback: poll for zoom changes
        const checkZoom = () => {
            const currentZoom = props.viewport.scale.x
            if (Math.abs(currentZoom - this.lastZoom) > 0.01) {
                // Small threshold to avoid excessive updates
                this.lastZoom = currentZoom
                this.update()
            }
            if (!this.destroyed) {
                requestAnimationFrame(checkZoom)
            }
        }
        checkZoom()

        // Initial update
        this.update()
    }

    // Getters for commonly accessed properties
    get endX(): number {
        return this.props.endX
    }

    get endY(): number {
        return this.props.endY
    }

    get points(): { x: number; y: number }[] {
        return this.props.points
    }

    // Method to update position (used for drag preview updates)
    updatePosition(endX: number, endY: number) {
        this.props.endX = endX
        this.props.endY = endY
        this.update()
    }

    // Method to update points (used for waypoint management)
    updatePoints(points: { x: number; y: number }[]) {
        this.props.points = points
        this.update()
    }

    update(newProps?: Partial<PixiPendingIndicatorProps>) {
        if (newProps) {
            this.props = { ...this.props, ...newProps }
        }

        const { endX, endY, points, gridSize, isCombatActive, token, isPreview } = this.props

        // Calculate distance
        const step = gridSize
        let cells = 0
        const pts = points

        for (let i = 1; i < pts.length; i++) {
            const dxs = Math.abs(pts[i].x - pts[i - 1].x)
            const dys = Math.abs(pts[i].y - pts[i - 1].y)
            cells += Math.hypot(dxs, dys) / step
        }

        let labelX = endX
        let labelY = endY

        if (isPreview && pts.length > 0) {
            const last = pts[pts.length - 1]
            const dxp = Math.abs(endX - last.x)
            const dyp = Math.abs(endY - last.y)
            cells += Math.hypot(dxp, dyp) / step
            labelX = endX
            labelY = endY
        }

        // Get token's current movement
        const currentMovement = token?.stats?.currentMovement ?? 0

        // Always round distance to integer
        const distanceText = `${Math.round(cells)}`

        // Show remaining movement or just distance if combat not active
        let txt: string
        if (isCombatActive) {
            const remaining = Math.max(0, currentMovement - Math.round(cells))
            txt = `${distanceText} / ${remaining}`

            // Change label color if exceeding movement
            if (Math.round(cells) > currentMovement) {
                this.distanceLabel.style.fill = 0xff3b81 // Red when exceeding
            } else {
                this.distanceLabel.style.fill = 0xffffff // White normally
            }
        } else {
            // When combat not active, just show distance
            txt = distanceText
            this.distanceLabel.style.fill = 0xffffff // White
        }

        this.distanceLabel.text = txt
        const zoom = this.props.viewport.scale.x
        this.distanceLabel.style.fontSize = Math.max(12, 12 / Math.max(0.1, zoom)) // Half the original (24/2)
        this.distanceLabel.visible = true

        // Position elements centered around the end point
        const buttonSize = Math.max(8, 8 / Math.max(0.1, zoom)) // Half the original size (32/2)
        const gap = Math.max(6, 6 / Math.max(0.1, zoom)) // Half the original gap (12/2)
        const centerY = labelY
        const showAcceptButton = this.props.isPlayerConnected !== false // Default to true

        let cancelCenterX: number
        let labelCenterX: number
        let acceptCenterX: number

        if (showAcceptButton) {
            // Calculate positions: cancel button - distance label - accept button
            cancelCenterX = labelX - buttonSize - gap - this.distanceLabel.width / 2
            labelCenterX = labelX
            acceptCenterX = labelX + this.distanceLabel.width / 2 + gap + buttonSize
        } else {
            // Only cancel button: distance label - cancel button
            labelCenterX = labelX - buttonSize / 2 - gap / 2
            cancelCenterX = labelX + this.distanceLabel.width / 2 + gap / 2
            acceptCenterX = 0 // Not used
        }

        // Position distance label
        this.distanceLabel.x = labelCenterX - this.distanceLabel.width / 2
        this.distanceLabel.y = centerY

        // Scale buttons to match the calculated buttonSize (original was 32, now half)
        const scaleFactor = buttonSize / 16 // Original button size in code was 16 now
        this.cancelContainer.scale.set(scaleFactor)

        this.cancelContainer.visible = true
        this.cancelContainer.position.set(cancelCenterX, centerY)

        if (showAcceptButton) {
            this.acceptContainer.scale.set(scaleFactor)
            this.acceptContainer.visible = true
            this.acceptContainer.position.set(acceptCenterX, centerY)
        } else {
            this.acceptContainer.visible = false
        }

        // Draw background container around label and buttons
        this.background.clear()
        const paddingX = Math.max(8, 8 / Math.max(0.1, zoom)) // Half the original padding (8/2)
        const paddingY = Math.max(4, 4 / Math.max(0.1, zoom)) // Half the original padding (8/2)
        //const bgLeft = cancelCenterX - buttonSize / 2 - paddingX
        const bgLeft = showAcceptButton
            ? cancelCenterX - buttonSize / 2 - paddingX
            : labelCenterX - buttonSize / 2 - paddingX
        const bgRight = showAcceptButton
            ? acceptCenterX + buttonSize / 2 + paddingX
            : cancelCenterX + buttonSize / 2 + paddingX
        // Calculate height based on the scaled font size and button size
        const labelHeight = this.distanceLabel.height || this.distanceLabel.style.fontSize
        const contentHeight = Math.max(buttonSize, labelHeight)
        const bgY = centerY - contentHeight / 2 - paddingY
        const bgWidth = bgRight - bgLeft
        const bgHeight = contentHeight + paddingY * 2

        this.background.setFillStyle({ color: 0x001428, alpha: 0.8 }) // Same as PixiTooltip
        this.background.setStrokeStyle({ width: 1, color: 0x00ffff, alpha: 1.0 }) // Cyan border
        this.background.roundRect(bgLeft, bgY, bgWidth, bgHeight, 4).fill().stroke()

        // Draw polyline across points + optional preview
        this.line.clear()
        this.line.setStrokeStyle({ width: 2, color: 0xffd166, alpha: 0.9 })
        if (pts.length > 0) {
            this.line.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) {
                this.line.lineTo(pts[i].x, pts[i].y)
            }
            if (isPreview) {
                this.line.lineTo(labelX, labelY)
            }
        }
        this.line.stroke()

        // Endpoints markers
        if (pts.length > 0) this.line.circle(pts[0].x, pts[0].y, 3).fill({ color: 0xffd166 })
        const lastPt = isPreview ? { x: labelX, y: labelY } : pts[pts.length - 1]
        if (lastPt) this.line.circle(lastPt.x, lastPt.y, 3).fill({ color: 0xffd166 })
    }

    destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }) {
        // Remove zoom/scale event listeners
        this.props.viewport.off('zoomed')
        this.props.viewport.off('moved')

        // Remove elements from viewport if still attached
        if (this.distanceLabel.parent) {
            this.distanceLabel.parent.removeChild(this.distanceLabel)
        }
        if (this.acceptContainer.parent) {
            this.acceptContainer.parent.removeChild(this.acceptContainer)
        }
        if (this.cancelContainer.parent) {
            this.cancelContainer.parent.removeChild(this.cancelContainer)
        }
        if (this.background.parent) {
            this.background.parent.removeChild(this.background)
        }
        if (this.line.parent) {
            this.line.parent.removeChild(this.line)
        }
        if (this.parent) {
            this.parent.removeChild(this)
        }
        super.destroy(options)
    }
}
