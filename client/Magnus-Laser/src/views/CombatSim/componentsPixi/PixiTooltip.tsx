import { Layout } from '@pixi/layout'
import { Viewport } from 'pixi-viewport'
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Token } from '../types'

export interface PixiTooltipProps {
    token: Token
    x: number
    y: number
    screenWidth: number
    screenHeight: number
    zoom: number
    viewport: Viewport // Viewport instance for coordinate conversion
}

/**
 * PixiJS-based tooltip component using Layout plugin for positioning
 */
export class PixiTooltip extends Container {
    private background: Graphics
    private content: Container
    private isVisible = false
    private currentToken: Token | null = null
    private viewport: Viewport
    private screenWidth: number
    private screenHeight: number
    private lastZoom: number
    private currentX: number
    private currentY: number

    constructor(props: PixiTooltipProps) {
        super()

        // Store props for zoom updates
        this.viewport = props.viewport
        this.screenWidth = props.screenWidth
        this.screenHeight = props.screenHeight
        this.lastZoom = props.zoom
        this.currentX = props.x
        this.currentY = props.y

        // Add layout system to main container
        this._layout = new Layout({ target: this })

        // Create background with rounded corners (matching original tooltip style)
        this.background = new Graphics()
        this.background.setFillStyle({ color: 0x001428, alpha: 0.8 }) // rgba(0, 20, 40, 0.8)
        this.background.setStrokeStyle({ width: 1, color: 0x00ffff, alpha: 1.0 }) // colors.neons.cyan.default
        this.background.roundRect(0, 0, 300, 200, 4).fill().stroke() // smaller border radius

        // Create content container with layout
        this.content = new Container()
        this.content._layout = new Layout({ target: this.content })

        // Add token information
        this.createTokenContent(props.token)

        this.addChild(this.background)
        this.addChild(this.content)

        // Initially invisible
        this.alpha = 0
        this.visible = false
        this.zIndex = 1000 // High zIndex to appear on top

        // Position and show
        this.updatePosition(props)

        // Add to viewport display list
        props.viewport.addChild(this)

        // Listen to zoom changes to update scaling
        props.viewport.on('zoomed', () => {
            this.updatePositionFromStoredProps()
        })
        props.viewport.on('moved', () => {
            // Also listen to moved events as they might include zoom changes
            this.updatePositionFromStoredProps()
        })

        // Fallback: poll for zoom changes
        const checkZoom = () => {
            const currentZoom = props.viewport.scale.x
            if (Math.abs(currentZoom - this.lastZoom) > 0.01) {
                // Small threshold to avoid excessive updates
                this.lastZoom = currentZoom
                this.updatePositionFromStoredProps()
            }
            if (!this.destroyed) {
                requestAnimationFrame(checkZoom)
            }
        }
        checkZoom()
    }

    private createTokenContent(token: Token): void {
        const stats = token.stats
        if (!stats) return

        // Clear existing content
        this.content.removeChildren()

        let yOffset = 10 // padding

        // Token name (uppercase, bold, cyan light)
        const nameStyle = new TextStyle({
            fontSize: 20,
            fill: 0x7affff, // colors.neons.cyan.light
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
            letterSpacing: 0.5,
        })
        const nameText = new Text({ text: token.name.toUpperCase(), style: nameStyle })
        nameText.x = 15
        nameText.y = yOffset
        this.content.addChild(nameText)
        yOffset += 25

        yOffset += 10 // margin bottom

        // Health row
        const healthLabelStyle = new TextStyle({
            fontSize: 16,
            fill: 0xff0055, // colors.neons.red.default
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
        })
        const healthValueStyle = new TextStyle({
            fontSize: 16,
            fill: 0x00ffff, // cyan
            fontFamily: '"Orbitron", monospace',
        })

        const healthLabel = new Text({ text: 'HP:', style: healthLabelStyle })
        healthLabel.x = 15
        healthLabel.y = yOffset
        this.content.addChild(healthLabel)

        const healthValue = new Text({ text: `${stats.currentHealth}/${stats.health}`, style: healthValueStyle })
        healthValue.x = 55
        healthValue.y = yOffset
        this.content.addChild(healthValue)
        yOffset += 24

        // Movement row
        const movementLabelStyle = new TextStyle({
            fontSize: 16,
            fill: 0x9900ff, // colors.neons.purple.default
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
        })

        const movementLabel = new Text({ text: 'Move:', style: movementLabelStyle })
        movementLabel.x = 15
        movementLabel.y = yOffset
        this.content.addChild(movementLabel)

        const movementValue = new Text({ text: `${stats.currentMovement}/${stats.movement}`, style: healthValueStyle })
        movementValue.x = 80
        movementValue.y = yOffset
        this.content.addChild(movementValue)
        yOffset += 24

        // Armor row (SPH and SPB side by side)
        const armorLabelStyle = new TextStyle({
            fontSize: 16,
            fill: 0x00ff8b, // colors.neons.green.default
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
        })

        const sphLabel = new Text({ text: 'SPH:', style: armorLabelStyle })
        sphLabel.x = 15
        sphLabel.y = yOffset
        this.content.addChild(sphLabel)

        const sphValue = new Text({ text: `${stats.armor.currentSph}/${stats.armor.sph}`, style: healthValueStyle })
        sphValue.x = 65
        sphValue.y = yOffset
        this.content.addChild(sphValue)

        const spbLabel = new Text({ text: 'SPB:', style: armorLabelStyle })
        spbLabel.x = 140
        spbLabel.y = yOffset
        this.content.addChild(spbLabel)

        const spbValue = new Text({ text: `${stats.armor.currentSpb}/${stats.armor.spb}`, style: healthValueStyle })
        spbValue.x = 190
        spbValue.y = yOffset
        this.content.addChild(spbValue)
        yOffset += 24

        // Combat and Skills row
        const combatLabelStyle = new TextStyle({
            fontSize: 16,
            fill: 0xffff00, // colors.neons.yellow.default
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
        })

        const combatLabel = new Text({ text: 'Combat:', style: combatLabelStyle })
        combatLabel.x = 15
        combatLabel.y = yOffset
        this.content.addChild(combatLabel)

        const combatValue = new Text({ text: `${stats.combat}`, style: healthValueStyle })
        combatValue.x = 95
        combatValue.y = yOffset
        this.content.addChild(combatValue)

        const skillsLabel = new Text({ text: 'Skills:', style: combatLabelStyle })
        skillsLabel.x = 140
        skillsLabel.y = yOffset
        this.content.addChild(skillsLabel)

        const skillsValue = new Text({ text: `${stats.skills}`, style: healthValueStyle })
        skillsValue.x = 200
        skillsValue.y = yOffset
        this.content.addChild(skillsValue)
        yOffset += 24

        // Weapons row (Melee and Ranged side by side)
        const weaponsLabelStyle = new TextStyle({
            fontSize: 16,
            fill: 0x0099ff, // colors.neons.blue.default
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
        })

        const meleeLabel = new Text({ text: 'Melee:', style: weaponsLabelStyle })
        meleeLabel.x = 15
        meleeLabel.y = yOffset
        this.content.addChild(meleeLabel)

        const meleeValue = new Text({ text: `${stats.weapons.melee.d6}D6`, style: healthValueStyle })
        meleeValue.x = 80
        meleeValue.y = yOffset
        this.content.addChild(meleeValue)

        const rangedLabel = new Text({ text: 'Ranged:', style: weaponsLabelStyle })
        rangedLabel.x = 140
        rangedLabel.y = yOffset
        this.content.addChild(rangedLabel)

        const rangedValue = new Text({ text: `${stats.weapons.ranged.d6}D6`, style: healthValueStyle })
        rangedValue.x = 220
        rangedValue.y = yOffset
        this.content.addChild(rangedValue)
        yOffset += 24

        // Grenades/Special Ammo if available
        if (
            (stats.weapons.grenadesOrSpecialAmmo?.d4 ?? 0) > 0 ||
            (stats.weapons.grenadesOrSpecialAmmo?.d6 ?? 0) > 0 ||
            (stats.weapons.grenadesOrSpecialAmmo?.d8 ?? 0) > 0
        ) {
            const grenadesLabelStyle = new TextStyle({
                fontSize: 16,
                fill: 0x0099ff, // colors.neons.blue.default
                fontWeight: 'bold',
                fontFamily: '"Orbitron", monospace',
            })

            const grenadesLabel = new Text({ text: 'Grenades:', style: grenadesLabelStyle })
            grenadesLabel.x = 15
            grenadesLabel.y = yOffset
            this.content.addChild(grenadesLabel)

            const grenadesValue = new Text({
                text: `${stats.weapons.currentGrenadesOrSpecialAmmo}/${[
                    stats.weapons.grenadesOrSpecialAmmo?.d4 && `${stats.weapons.grenadesOrSpecialAmmo.d4}D4`,
                    stats.weapons.grenadesOrSpecialAmmo?.d6 && `${stats.weapons.grenadesOrSpecialAmmo.d6}D6`,
                    stats.weapons.grenadesOrSpecialAmmo?.d8 && `${stats.weapons.grenadesOrSpecialAmmo.d8}D8`,
                ]
                    .filter(Boolean)
                    .join(' ')}`,
                style: healthValueStyle,
            })
            grenadesValue.x = 115
            grenadesValue.y = yOffset
            this.content.addChild(grenadesValue)
            yOffset += 24
            yOffset += 6 // margin bottom
        }

        // Update layout for content
        if (this.content._layout) {
            this.content._layout.setStyle({
                width: 280,
                height: yOffset,
                position: 'absolute',
            })
        }

        // Resize background to fit content
        this.background.clear()
        this.background.setFillStyle({ color: 0x001428, alpha: 0.8 }) // rgba(0, 20, 40, 0.8)
        this.background.setStrokeStyle({ width: 1, color: 0x00ffff, alpha: 1.0 }) // colors.neons.cyan.default
        this.background
            .roundRect(0, 0, 300, yOffset + 5, 4)
            .fill()
            .stroke()
    }

    private updatePositionFromStoredProps(): void {
        this.updatePosition({
            token: this.currentToken!,
            x: this.currentX,
            y: this.currentY,
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            zoom: this.viewport.scale.x,
            viewport: this.viewport,
        })
    }

    public updatePosition(props: PixiTooltipProps): void {
        const { x, y, screenWidth, screenHeight, zoom, viewport } = props

        // Update stored properties
        this.viewport = viewport
        this.screenWidth = screenWidth
        this.screenHeight = screenHeight
        this.lastZoom = zoom
        this.currentX = x
        this.currentY = y

        // Use viewport.toGlobal() to properly convert viewport coordinates to screen coordinates
        const cursorScreenPos = viewport.toGlobal({ x, y })

        // Scale factor for UI elements (inverse zoom)
        const scaleFactor = Math.max(0.5, 1 / zoom)

        // Get exact tooltip dimensions (unscaled, then apply scale factor)
        const baseDimensions = this.getTooltipDimensions()
        const tooltipWidth = baseDimensions.width * scaleFactor
        const tooltipHeight = baseDimensions.height * scaleFactor

        // Intelligent positioning based on cursor location relative to screen center
        const padding = 20 * scaleFactor

        // Use the actual screen coordinates from viewport.toGlobal()
        const screenX = cursorScreenPos.x
        const screenY = cursorScreenPos.y

        // Determine cursor position relative to screen center
        const isCursorInTopHalf = screenY < screenHeight / 2
        const isCursorInLeftHalf = screenX < screenWidth / 2

        // Position tooltip in screen coordinates first
        let tooltipScreenX: number
        let tooltipScreenY: number

        if (isCursorInTopHalf && isCursorInLeftHalf) {
            // Top-left quadrant: position tooltip below and right of cursor
            tooltipScreenX = screenX + padding
            tooltipScreenY = screenY + padding
        } else if (isCursorInTopHalf && !isCursorInLeftHalf) {
            // Top-right quadrant: position tooltip below and left of cursor
            tooltipScreenX = screenX - tooltipWidth - padding
            tooltipScreenY = screenY + padding
        } else if (!isCursorInTopHalf && isCursorInLeftHalf) {
            // Bottom-left quadrant: position tooltip above and right of cursor
            tooltipScreenX = screenX + padding
            tooltipScreenY = screenY - tooltipHeight - padding
        } else {
            // Bottom-right quadrant: position tooltip above and left of cursor
            tooltipScreenX = screenX - tooltipWidth - padding
            tooltipScreenY = screenY - tooltipHeight - padding
        }

        // Boundary checks in screen coordinates
        tooltipScreenX = Math.max(padding, Math.min(tooltipScreenX, screenWidth - tooltipWidth - padding))
        tooltipScreenY = Math.max(padding, Math.min(tooltipScreenY, screenHeight - tooltipHeight - padding))

        // Convert screen coordinates back to viewport coordinates using toLocal
        const tooltipViewportPos = viewport.toLocal({ x: tooltipScreenX, y: tooltipScreenY })
        let tooltipX = tooltipViewportPos.x
        let tooltipY = tooltipViewportPos.y

        // Update layout
        if (this._layout) {
            this._layout.setStyle({
                width: tooltipWidth,
                height: tooltipHeight,
                position: 'absolute',
            })
        }

        // Set position and scale
        this.x = tooltipX
        this.y = tooltipY
        this.scale.set(scaleFactor)
    }

    public show(): void {
        if (this.isVisible) return

        this.isVisible = true
        this.visible = true
        this.alpha = 1
    }

    public hide(): void {
        if (!this.isVisible) return

        this.isVisible = false
        this.visible = false
    }

    public updateToken(token: Token): void {
        this.currentToken = token
        this.createTokenContent(token)
    }

    private getTooltipDimensions(): { width: number; height: number } {
        if (!this.currentToken) return { width: 300, height: 200 }

        const stats = this.currentToken.stats
        if (!stats) return { width: 300, height: 200 }

        let yOffset = 10 // initial padding

        // Token name
        yOffset += 25 // name height
        yOffset += 10 // margin bottom

        // Health row
        yOffset += 24

        // Movement row
        yOffset += 24

        // Armor rows
        yOffset += 24

        // Combat and Skills row
        yOffset += 24

        // Weapons rows
        yOffset += 24

        // Grenades row (if present)
        if (
            (stats.weapons.grenadesOrSpecialAmmo?.d4 ?? 0) > 0 ||
            (stats.weapons.grenadesOrSpecialAmmo?.d6 ?? 0) > 0 ||
            (stats.weapons.grenadesOrSpecialAmmo?.d8 ?? 0) > 0
        ) {
            yOffset += 24
        }

        yOffset += 6 // final margin

        return {
            width: 300,
            height: yOffset + 5, // background padding
        }
    }

    public destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
        // Remove from viewport display list
        if (this.parent) {
            this.parent.removeChild(this)
        }
        // Remove zoom event listeners
        this.viewport.off('zoomed')
        this.viewport.off('moved')
        super.destroy(options)
    }
}

/**
 * Factory function to create PixiJS tooltips
 */
export function createPixiTooltip(props: PixiTooltipProps): PixiTooltip {
    return new PixiTooltip(props)
}
