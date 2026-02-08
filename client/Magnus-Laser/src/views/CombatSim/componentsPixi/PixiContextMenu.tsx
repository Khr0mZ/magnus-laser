import { Viewport } from 'pixi-viewport'
import { Application, Container, FederatedPointerEvent, Graphics, Rectangle, Text, TextStyle } from 'pixi.js'

export interface MenuItem {
    label: string
    icon?: string
    onClick: () => void
    disabled?: boolean
    color?: number // Text color (default: 0xffffff white)
    isDivider?: boolean
}

export interface PixiContextMenuProps {
    x: number // World X coordinate
    y: number // World Y coordinate
    zoom: number
    viewport: Viewport
    items: MenuItem[]
    onClose: () => void
}

/**
 * Base PixiJS context menu component
 */
export class PixiContextMenu extends Container {
    private background: Graphics
    private items: MenuItem[]
    private itemContainers: Container[] = []
    private hoverBgs: Graphics[] = [] // Track hover backgrounds separately
    private viewport: Viewport
    private onClose: () => void
    private isVisible = false
    private lastZoom: number
    private currentX: number
    private currentY: number
    private menuDestroyed = false
    private _rafId: number | null = null
    private onCloseCalled = false
    private _zoomHandler?: () => void
    private _moveHandler?: () => void
    private _clickHandler?: (e: globalThis.MouseEvent | globalThis.PointerEvent) => void
    private _viewportHandler?: (e: FederatedPointerEvent) => void

    // Styling constants matching HTML menu
    private readonly paddingTop = 8
    private readonly paddingBottom = 8
    private readonly paddingLeft = 0
    private readonly paddingRight = 0
    private readonly itemHeight = 36
    private readonly itemPadding = 16
    private readonly iconWidth = 16
    private readonly iconTextSpacing = 20
    private readonly itemGap = 0
    private readonly dividerSpacing = 16 // Total spacing for divider (2px top + 2px bottom)
    private readonly minWidth = 152
    private readonly bgColor = 0x1a1a1a // #1a1a1a
    private readonly borderColor = 0x333333 // #333
    private readonly textColor = 0xffffff // #fff
    private readonly disabledColor = 0x666666 // #666
    private readonly hoverBgColor = 0xffffff // rgba(255, 255, 255, 0.1) - will use alpha
    private readonly dividerColor = 0x333333 // #333

    constructor(props: PixiContextMenuProps) {
        super()

        this.viewport = props.viewport
        this.items = props.items
        this.onClose = props.onClose
        this.lastZoom = props.zoom
        this.currentX = props.x
        this.currentY = props.y

        // Create background
        this.background = new Graphics()
        this.addChild(this.background)

        // Create menu items
        this.createMenuItems()

        // Position menu
        this.updatePosition(props.x, props.y, props.zoom)

        // Add to viewport
        this.viewport.addChild(this)

        // Make interactive
        this.interactive = true
        this.eventMode = 'static'

        // Close on click outside
        this.setupClickOutsideHandler()

        // Listen to zoom changes to update scaling
        const zoomHandler = () => {
            this.updatePositionFromStoredProps()
        }
        const moveHandler = () => {
            // Also listen to moved events as they might include zoom changes
            this.updatePositionFromStoredProps()
        }
        this.viewport.on('zoomed', zoomHandler)
        this.viewport.on('moved', moveHandler)

        // Store handlers for cleanup
        this._zoomHandler = zoomHandler
        this._moveHandler = moveHandler

        // Fallback: poll for zoom changes
        const checkZoom = () => {
            const currentZoom = this.viewport.scale.x
            if (Math.abs(currentZoom - this.lastZoom) > 0.01) {
                // Small threshold to avoid excessive updates
                this.lastZoom = currentZoom
                this.updatePositionFromStoredProps()
            }
            if (!this.menuDestroyed) {
                this._rafId = requestAnimationFrame(checkZoom)
            }
        }
        checkZoom()

        this.isVisible = true
        this.visible = true
        this.zIndex = 2000 // Higher than tooltips
    }

    private createMenuItems(): void {
        let yOffset = this.paddingTop
        let maxWidth = this.minWidth
        const dividers: Graphics[] = [] // Track dividers to update width later

        this.items.forEach((item, index) => {
            if (item.isDivider) {
                // Create divider - width will be updated later after maxWidth is calculated
                const divider = new Graphics()
                divider.rect(0, 0, this.minWidth - this.paddingLeft - this.paddingRight, 1)
                divider.fill(this.dividerColor)
                divider.x = this.paddingLeft
                divider.y = yOffset + this.dividerSpacing / 2 - 0.5
                this.addChild(divider)
                dividers.push(divider)
                yOffset += this.dividerSpacing
                return
            }

            // Create item container
            const itemContainer = new Container()
            itemContainer.interactive = true
            itemContainer.eventMode = 'static'
            itemContainer.cursor = item.disabled ? 'default' : 'pointer'
            // Set hit area to ensure cursor works properly
            itemContainer.hitArea = new Rectangle(
                0,
                0,
                this.minWidth - this.paddingLeft - this.paddingRight,
                this.itemHeight
            )

            // Create background for hover effect
            const bg = new Graphics()
            bg.rect(0, 0, this.minWidth - this.paddingLeft - this.paddingRight, this.itemHeight)
            bg.fill({ color: 0x000000, alpha: 0 })
            bg.eventMode = 'none' // Don't block pointer events
            itemContainer.addChild(bg)

            // Create icon if provided (using Unicode symbols or text)
            // Material-UI ListItemIcon uses fontSize: 20px
            let xOffset = this.itemPadding
            if (item.icon) {
                const iconText = new Text({
                    text: item.icon,
                    style: new TextStyle({
                        fontSize: 16,
                        fill: item.disabled
                            ? this.disabledColor
                            : item.color !== undefined
                            ? item.color
                            : this.textColor,
                        fontFamily: '"Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif',
                    }),
                })
                iconText.x = xOffset
                iconText.y = (this.itemHeight - iconText.height) / 2
                iconText.eventMode = 'none' // Don't block pointer events
                itemContainer.addChild(iconText)
                xOffset += this.iconWidth + this.iconTextSpacing
            } else {
                // No icon, add spacing
                xOffset += this.iconWidth + this.iconTextSpacing
            }

            // Create label text
            // Material-UI MenuItem uses fontSize: 14px (0.875rem), fontWeight: 400, fontFamily: Roboto
            const labelText = new Text({
                text: item.label,
                style: new TextStyle({
                    fontSize: 16,
                    fontWeight: '400',
                    fill: item.disabled ? this.disabledColor : item.color !== undefined ? item.color : this.textColor,
                    fontFamily: '"Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif',
                }),
            })
            labelText.x = xOffset
            labelText.y = (this.itemHeight - labelText.height) / 2
            labelText.eventMode = 'none' // Don't block pointer events
            itemContainer.addChild(labelText)

            // Track max width
            const itemWidth = xOffset + labelText.width + this.itemPadding
            maxWidth = Math.max(maxWidth, itemWidth)

            // Position item container
            itemContainer.x = this.paddingLeft
            itemContainer.y = yOffset

            // Add hover effect
            let hoverBg: Graphics | null = null
            if (!item.disabled) {
                hoverBg = new Graphics()
                hoverBg.rect(0, 0, this.minWidth - this.paddingLeft - this.paddingRight, this.itemHeight)
                hoverBg.fill({ color: this.hoverBgColor, alpha: 0 })
                hoverBg.visible = false
                hoverBg.eventMode = 'none' // Don't block pointer events
                itemContainer.addChildAt(hoverBg, 1) // Insert after bg
                this.hoverBgs.push(hoverBg) // Track hoverBg

                itemContainer.on('pointerenter', () => {
                    hoverBg!.visible = true
                })
                itemContainer.on('pointerleave', () => {
                    hoverBg!.visible = false
                })
            }

            // Add click handler
            if (!item.disabled) {
                itemContainer.on('pointerdown', (e) => {
                    e.stopPropagation()
                    // Mark that onClose will be called by the handler
                    this.onCloseCalled = true
                    item.onClick()
                    // Close the menu (onClose already called by handler)
                    this.close()
                })
            }

            this.addChild(itemContainer)
            this.itemContainers.push(itemContainer)
            yOffset += this.itemHeight

            // Add vertical gap between items (0.5 spacing = 4px)
            // Skip gap if this is the last item or next item is a divider
            const nextItem = this.items[index + 1]
            if (nextItem && !nextItem.isDivider) {
                yOffset += this.itemGap
            }
        })

        // Update background with calculated dimensions
        const totalWidth = maxWidth + this.paddingLeft + this.paddingRight
        const totalHeight = yOffset + this.paddingBottom
        this.background.clear()
        this.background.roundRect(0, 0, totalWidth, totalHeight, 0)
        this.background.fill(this.bgColor)
        this.background.stroke({ width: 1, color: this.borderColor })

        // Update divider widths
        dividers.forEach((divider) => {
            divider.clear()
            divider.rect(0, 0, totalWidth - this.paddingLeft - this.paddingRight, 1)
            divider.fill(this.dividerColor)
        })

        // Update item container widths (account for padding)
        this.itemContainers.forEach((container) => {
            const bg = container.children[0] as Graphics
            if (bg && bg instanceof Graphics) {
                bg.clear()
                bg.rect(0, 0, totalWidth - this.paddingLeft - this.paddingRight, this.itemHeight)
                bg.fill({ color: 0x000000, alpha: 0 })
            }
        })

        // Update hover backgrounds separately
        this.hoverBgs.forEach((hoverBg) => {
            if (hoverBg && hoverBg instanceof Graphics) {
                hoverBg.clear()
                hoverBg.rect(0, 0, totalWidth - this.paddingLeft - this.paddingRight, this.itemHeight)
                hoverBg.fill({ color: this.hoverBgColor, alpha: 0.1 })
            }
        })
    }

    private updatePosition(worldX: number, worldY: number, zoom: number): void {
        // Store world coordinates and zoom
        this.currentX = worldX
        this.currentY = worldY
        this.lastZoom = zoom

        // Scale factor for UI elements (inverse zoom) - keeps menu at consistent screen size
        const scaleFactor = Math.max(0.5, 1 / zoom)

        // Get base menu dimensions (in pixels, unscaled)
        const baseWidth = this.background.width
        const baseHeight = this.background.height

        // Calculate menu dimensions in world space (accounting for scale)
        // When we scale the menu by scaleFactor, its visual size in world space is baseSize * scaleFactor
        const menuWorldWidth = baseWidth * scaleFactor
        const menuWorldHeight = baseHeight * scaleFactor

        // Offsets in world space (convert screen-space offsets to world space)
        const paddingWorld = 10 * scaleFactor // Padding from viewport edges in world space

        // Position menu at click location in world coordinates
        let menuX = worldX
        let menuY = worldY

        // Get viewport bounds in world coordinates for overflow checking
        const viewportTopLeft = this.viewport.toWorld({ x: 0, y: 0 })
        const viewportBottomRight = this.viewport.toWorld({
            x: this.viewport.screenWidth,
            y: this.viewport.screenHeight,
        })

        const viewportLeft = viewportTopLeft.x
        const viewportRight = viewportBottomRight.x
        const viewportTop = viewportTopLeft.y
        const viewportBottom = viewportBottomRight.y

        // Ensure menu doesn't overflow right edge
        if (menuX + menuWorldWidth > viewportRight - paddingWorld) {
            menuX = viewportRight - menuWorldWidth - paddingWorld
        }

        // Ensure menu doesn't overflow bottom edge
        if (menuY + menuWorldHeight > viewportBottom - paddingWorld) {
            menuY = viewportBottom - menuWorldHeight - paddingWorld
        }

        // Ensure menu doesn't overflow left edge
        if (menuX < viewportLeft + paddingWorld) {
            menuX = viewportLeft + paddingWorld
        }

        // Ensure menu doesn't overflow top edge
        if (menuY < viewportTop + paddingWorld) {
            menuY = viewportTop + paddingWorld
        }

        // Set position in world coordinates and scale
        // Position is in world space, scale keeps it at consistent screen size
        this.x = menuX
        this.y = menuY
        this.scale.set(scaleFactor)
    }

    private updatePositionFromStoredProps(): void {
        const currentZoom = this.viewport.scale.x
        this.updatePosition(this.currentX, this.currentY, currentZoom)
    }

    private setupClickOutsideHandler(): void {
        // Close menu when clicking outside
        const handleClick = (e: globalThis.MouseEvent | globalThis.PointerEvent) => {
            // Get click position relative to canvas
            const canvas = this.viewport.parent as Application | null
            if (!canvas?.canvas) return

            const rect = canvas.canvas.getBoundingClientRect()
            const clickScreenX = e.clientX - rect.left
            const clickScreenY = e.clientY - rect.top

            // Convert menu world position to screen position for comparison
            const menuScreenPos = this.viewport.toScreen(this.x, this.y)

            // Menu dimensions in screen pixels (accounting for scale)
            const scaleFactor = Math.max(0.5, 1 / this.lastZoom)
            const menuScreenWidth = this.background.width * scaleFactor
            const menuScreenHeight = this.background.height * scaleFactor

            const menuBounds = {
                x: menuScreenPos.x,
                y: menuScreenPos.y,
                width: menuScreenWidth,
                height: menuScreenHeight,
            }

            // Check if click is outside menu bounds
            if (
                clickScreenX < menuBounds.x ||
                clickScreenX > menuBounds.x + menuBounds.width ||
                clickScreenY < menuBounds.y ||
                clickScreenY > menuBounds.y + menuBounds.height
            ) {
                this.close()
            }
        }

        // Also listen for pointerdown events on the viewport (PixiJS events)
        const handleViewportPointerDown = (e: FederatedPointerEvent) => {
            // Check if the event target is this menu or one of its children
            let target: Container | null = e.target as Container | null
            let isMenuClick = false
            while (target) {
                if (target === this) {
                    isMenuClick = true
                    break
                }
                target = target.parent
            }

            // If click is on the menu itself, don't close
            if (isMenuClick) {
                return
            }

            // Get screen position from PixiJS event
            // e.global is already in screen/pixel coordinates
            if (e.global) {
                const clickScreenX = e.global.x
                const clickScreenY = e.global.y

                // Convert menu world position to screen position for comparison
                const menuScreenPos = this.viewport.toScreen(this.x, this.y)

                // Menu dimensions in screen pixels (accounting for scale)
                const scaleFactor = Math.max(0.5, 1 / this.lastZoom)
                const menuScreenWidth = this.background.width * scaleFactor
                const menuScreenHeight = this.background.height * scaleFactor

                const menuBounds = {
                    x: menuScreenPos.x,
                    y: menuScreenPos.y,
                    width: menuScreenWidth,
                    height: menuScreenHeight,
                }

                // Check if click is outside menu bounds
                if (
                    clickScreenX < menuBounds.x ||
                    clickScreenX > menuBounds.x + menuBounds.width ||
                    clickScreenY < menuBounds.y ||
                    clickScreenY > menuBounds.y + menuBounds.height
                ) {
                    this.close()
                }
            }
        }

        // Use capture phase to catch clicks before they bubble
        document.addEventListener('mousedown', handleClick, true)
        document.addEventListener('pointerdown', handleClick, true)
        document.addEventListener('contextmenu', handleClick, true)

        // Listen to viewport pointer events (PixiJS events)
        this.viewport.on('pointerdown', handleViewportPointerDown)

        // Store handlers for cleanup
        this._clickHandler = handleClick
        this._viewportHandler = handleViewportPointerDown
    }

    public close(): void {
        if (!this.isVisible) return

        this.isVisible = false
        this.visible = false
        this.menuDestroyed = true
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId)
            this._rafId = null
        }

        // Remove click handlers
        const clickHandler = this._clickHandler
        if (clickHandler) {
            document.removeEventListener('mousedown', clickHandler, true)
            document.removeEventListener('pointerdown', clickHandler, true)
            document.removeEventListener('contextmenu', clickHandler, true)
        }

        // Remove viewport handler
        const viewportHandler = this._viewportHandler
        if (viewportHandler) {
            this.viewport.off('pointerdown', viewportHandler)
        }

        // Remove zoom listeners
        const zoomHandler = this._zoomHandler
        const moveHandler = this._moveHandler
        if (zoomHandler) {
            this.viewport.off('zoomed', zoomHandler)
        }
        if (moveHandler) {
            this.viewport.off('moved', moveHandler)
        }

        // Remove from viewport
        if (this.parent) {
            this.parent.removeChild(this)
        }

        // Call onClose callback only if it wasn't already called by a menu item handler
        // (Menu items call onClose() explicitly to match HTML menu behavior)
        if (!this.onCloseCalled) {
            this.onClose()
        }

        // Destroy
        this.destroy({ children: true })
    }
}
