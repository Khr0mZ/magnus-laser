import { Layout } from '@pixi/layout'
import { t } from 'i18next'
import { Viewport } from 'pixi-viewport'
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { StatsActions, Token } from '../utils/types'

// Helper function to format damage dice
const formatDamageDice = (damage?: { d4?: number | null; d6?: number | null; d8?: number | null }): string => {
    if (!damage) return ''
    const diceParts = []
    if (damage.d4) diceParts.push(`${damage.d4}D4`)
    if (damage.d6) diceParts.push(`${damage.d6}D6`)
    if (damage.d8) diceParts.push(`${damage.d8}D8`)
    return diceParts.join(' ')
}

// Helper function to get color for action type
const getActionTypeColor = (type: StatsActions['type']): number => {
    switch (type) {
        case 'melee':
            return 0xff0055 // colors.neons.red.default
        case 'ranged':
            return 0xffff00 // colors.neons.yellow.default
        case 'grenade':
            return 0xff5e00 // colors.neons.orange.default
        case 'skill':
            return 0x00ffff // colors.neons.cyan.default
        default:
            return 0x00ffff // colors.neons.cyan.default
    }
}

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
    private lastZoom: number
    private currentX: number
    private currentY: number
    private _rafId: number | null = null

    constructor(props: PixiTooltipProps) {
        super()

        // Store props for zoom updates
        this.viewport = props.viewport
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
                this._rafId = requestAnimationFrame(checkZoom)
            }
        }
        checkZoom()
    }

    private createTokenContent(token: Token): void {
        const stats = token.stats
        if (!stats) return
        const actions = stats.actions || []

        // Clear existing content
        this.content.removeChildren()

        // Grid layout constants - matching TokenTooltip structure
        const padding = 12 // matches p: 1.5 (12px)
        const rowHeight = 24
        const columnWidth = 140 // half width for 2-column layout
        const labelValueSpacing = 4 // spacing between label and value
        const nameBottomMargin = 12 // margin after name

        let yOffset = padding

        // Token name (uppercase, bold, cyan light)
        const nameStyle = new TextStyle({
            fontSize: 20,
            fill: 0x7affff, // colors.neons.cyan.light
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
            letterSpacing: 0.5,
        })
        const nameText = new Text({ text: token.name.toUpperCase(), style: nameStyle })
        nameText.x = padding
        nameText.y = yOffset
        this.content.addChild(nameText)
        yOffset += 25 + nameBottomMargin

        // Common text styles
        const valueStyle = new TextStyle({
            fontSize: 16,
            fill: 0x00ffff, // colors.neons.cyan.default
            fontFamily: '"Orbitron", monospace',
        })

        // Helper function to create a grid item (label + value)
        const createGridItem = (
            labelText: string,
            valueText: string,
            labelColor: number,
            x: number,
            y: number,
            maxWidth?: number
        ): { width: number; height: number } => {
            // Create label style with the specific color
            const labelStyle = new TextStyle({
                fontSize: 16,
                fill: labelColor,
                fontWeight: 'bold',
                fontFamily: '"Orbitron", monospace',
            })
            const label = new Text({ text: labelText, style: labelStyle })
            label.x = x
            label.y = y
            this.content.addChild(label)

            const labelWidth = label.width

            const value = new Text({ text: valueText, style: valueStyle })
            value.x = x + labelWidth + labelValueSpacing
            value.y = y
            if (maxWidth) {
                value.style.wordWrap = true
                value.style.wordWrapWidth = maxWidth - labelWidth - labelValueSpacing
            }
            this.content.addChild(value)

            return {
                width: Math.max(labelWidth + labelValueSpacing + value.width, maxWidth || 0),
                height: rowHeight,
            }
        }

        // Row 1: Health (left) and Movement (right) - xs: 6 each
        const healthValue = `${stats.currentHealth} / ${stats.health}`

        // Check if token is seriously wounded (current HP < half of max HP)
        const isSeriouslyWounded = (stats.currentHealth ?? stats.health) < Math.ceil(stats.health / 2)
        const showSeriouslyWoundedIndicator = isSeriouslyWounded && !stats.ignoreSeriouslyWoundedPenalty

        // Create health label
        const healthLabelStyle = new TextStyle({
            fontSize: 16,
            fill: 0xffffff, // White
            fontWeight: 'bold',
            fontFamily: '"Orbitron", monospace',
        })
        const healthLabel = new Text({ text: `${t('combatSim.health')}:`, style: healthLabelStyle })
        healthLabel.x = padding
        healthLabel.y = yOffset
        this.content.addChild(healthLabel)

        const healthValueStyle = new TextStyle({
            fontSize: 16,
            fill: 0x00ffff, // colors.neons.cyan.default
            fontFamily: '"Orbitron", monospace',
        })
        const healthValueText = new Text({ text: healthValue, style: healthValueStyle })
        healthValueText.x = padding + healthLabel.width + labelValueSpacing
        healthValueText.y = yOffset
        this.content.addChild(healthValueText)

        // Add seriously wounded indicator if needed
        if (showSeriouslyWoundedIndicator) {
            const woundedIndicator = new Text({ text: '🩸', style: healthValueStyle })
            woundedIndicator.x = padding + healthLabel.width + labelValueSpacing + healthValueText.width + 4
            woundedIndicator.y = yOffset
            this.content.addChild(woundedIndicator)
        }

        // Movement (right column)
        createGridItem(
            `${t('combatSim.movement')}:`,
            `${stats.currentMovement} / ${stats.movement}`,
            0x9900ff, // colors.neons.purple.default
            padding + columnWidth,
            yOffset
        )
        yOffset += rowHeight

        // Row 2: SPH (left) and SPB (right) - xs: 12, md: 6 each
        createGridItem(
            `${t('combatSim.sph')}:`,
            `${stats.armor.currentSph} / ${stats.armor.sph}`,
            0x00ff8b, // colors.neons.green.default
            padding,
            yOffset
        )
        createGridItem(
            `${t('combatSim.spb')}:`,
            `${stats.armor.currentSpb} / ${stats.armor.spb}`,
            0x00ff8b, // colors.neons.green.default
            padding + columnWidth,
            yOffset
        )
        yOffset += rowHeight

        // Row 2.5: Luck (PC only) - xs: 12, md: 6, if PC
        if (stats.isPC && stats.luck !== undefined) {
            createGridItem(
                `${t('combatSim.luck')}:`,
                `${stats.currentLuck ?? 0} / ${stats.luck}`,
                0xff00ff, // colors.neons.pink.default (neon pink/magenta)
                padding,
                yOffset
            )
            yOffset += rowHeight
        }

        // Actions List - display all actions
        actions.forEach((action) => {
            const actionName = action.name || t(`combatSim.${action.type}`)
            const hasDamage = action.damage && (action.damage.d4 || action.damage.d6 || action.damage.d8)

            if (hasDamage) {
                // 6-6 grid layout for actions with damage
                // Left column: Action name and value
                createGridItem(`${actionName}:`, `${action.value}`, getActionTypeColor(action.type), padding, yOffset)
                // Right column: Damage label and dice
                createGridItem(
                    'Dmg:',
                    formatDamageDice(action.damage),
                    getActionTypeColor(action.type),
                    padding + columnWidth,
                    yOffset
                )
            } else {
                // Full width for actions without damage
                createGridItem(
                    `${actionName}:`,
                    `${action.value}`,
                    getActionTypeColor(action.type),
                    padding,
                    yOffset,
                    280 // max width for full-width item
                )
            }
            yOffset += rowHeight
        })

        yOffset += padding // bottom padding (same as top padding)

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
        this.background.roundRect(0, 0, 300, yOffset, 4).fill().stroke()
    }

    private updatePositionFromStoredProps(): void {
        this.updatePosition({
            token: this.currentToken!,
            x: this.currentX,
            y: this.currentY,
            screenWidth: this.viewport.screenWidth,
            screenHeight: this.viewport.screenHeight,
            zoom: this.viewport.scale.x,
            viewport: this.viewport,
        })
    }

    public updatePosition(props: PixiTooltipProps): void {
        const { x, y, zoom, viewport } = props

        // Update stored properties
        this.viewport = viewport
        this.lastZoom = zoom
        this.currentX = x
        this.currentY = y

        // Scale factor for UI elements (inverse zoom) - keeps tooltip at consistent screen size
        const scaleFactor = Math.max(0.5, 1 / zoom)

        // Get base tooltip dimensions (in pixels, unscaled)
        const baseDimensions = this.getTooltipDimensions()
        const baseWidth = baseDimensions.width
        const baseHeight = baseDimensions.height

        // Calculate tooltip dimensions in world space (accounting for scale)
        // When we scale the tooltip by scaleFactor, its visual size in world space is baseSize * scaleFactor
        const tooltipWorldWidth = baseWidth * scaleFactor
        const tooltipWorldHeight = baseHeight * scaleFactor

        // Offsets in world space (convert screen-space offsets to world space)
        // Screen-space offsets need to be divided by zoom to get world-space offsets
        const tokenOffsetWorld = 30 * scaleFactor // Offset from token center in world space
        const paddingWorld = 10 * scaleFactor // Padding from viewport edges in world space

        // Position tooltip centered over the token in world coordinates
        // Start with tooltip above the token, centered horizontally
        let tooltipX = x - tooltipWorldWidth / 2
        let tooltipY = y - tooltipWorldHeight - tokenOffsetWorld

        // Get viewport bounds in world coordinates for overflow checking
        const viewportTopLeft = viewport.toWorld({ x: 0, y: 0 })
        const viewportBottomRight = viewport.toWorld({
            x: viewport.screenWidth,
            y: viewport.screenHeight,
        })

        const viewportLeft = viewportTopLeft.x
        const viewportRight = viewportBottomRight.x
        const viewportTop = viewportTopLeft.y
        const viewportBottom = viewportBottomRight.y

        // Check if tooltip would overflow top of viewport, if so position below token
        if (tooltipY < viewportTop + paddingWorld) {
            tooltipY = y + tokenOffsetWorld
        }

        // Ensure tooltip doesn't overflow left edge
        if (tooltipX < viewportLeft + paddingWorld) {
            tooltipX = viewportLeft + paddingWorld
        }

        // Ensure tooltip doesn't overflow right edge
        if (tooltipX + tooltipWorldWidth > viewportRight - paddingWorld) {
            tooltipX = viewportRight - tooltipWorldWidth - paddingWorld
        }

        // Ensure tooltip doesn't overflow bottom edge
        if (tooltipY + tooltipWorldHeight > viewportBottom - paddingWorld) {
            tooltipY = viewportBottom - tooltipWorldHeight - paddingWorld
        }

        // Ensure tooltip doesn't overflow top edge (final check)
        if (tooltipY < viewportTop + paddingWorld) {
            tooltipY = viewportTop + paddingWorld
        }

        // Update layout
        if (this._layout) {
            this._layout.setStyle({
                width: baseWidth,
                height: baseHeight,
                position: 'absolute',
            })
        }

        // Set position in world coordinates and scale
        // Position is in world space, scale keeps it at consistent screen size
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
        const actions = stats.actions || []

        const padding = 12
        const rowHeight = 24
        const nameBottomMargin = 12

        let yOffset = padding

        // Token name
        yOffset += 25 // name height
        yOffset += nameBottomMargin

        // Row 1: Health and Movement
        yOffset += rowHeight

        // Row 2: SPH and SPB
        yOffset += rowHeight

        // Row 2.5: Luck (if PC)
        if (stats.isPC && stats.luck !== undefined) {
            yOffset += rowHeight
        }

        // Actions rows (variable number)
        yOffset += rowHeight * actions.length

        // Row 4: Melee and Ranged (removed - now using actions list)

        yOffset += padding // bottom padding (same as top padding)

        return {
            width: 300,
            height: yOffset,
        }
    }

    public destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
        // Remove from viewport display list
        if (this.parent) {
            this.parent.removeChild(this)
        }
        // Cancel RAF polling
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId)
            this._rafId = null
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
