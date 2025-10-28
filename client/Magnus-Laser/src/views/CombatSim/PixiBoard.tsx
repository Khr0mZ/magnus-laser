import { Viewport } from 'pixi-viewport'
import type { FederatedPointerEvent } from 'pixi.js'
import { Application, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { BlastContextMenu } from './components/contextMenus/BlastContextMenu'
import { MapContextMenu } from './components/contextMenus/MapContextMenu'
import { TokenContextMenu } from './components/contextMenus/TokenContextMenu'
import {
    calculateConePoints,
    clearBlastRendererCaches,
    drawBlastPreview,
    preloadBlastTextures,
    renderBlasts,
} from './componentsPixi/blastRenderer'
import { PixiPendingIndicator } from './componentsPixi/PixiPendingIndicator'
import { PixiTooltip, createPixiTooltip } from './componentsPixi/PixiTooltip'
import {
    clearTokenRendererCaches,
    preloadTextures,
    renderTokens,
    renderTokensWithPending,
} from './componentsPixi/tokenRenderer'
import type { Blast, BlastType, Image as ImageData, PixiDisplayObject, Token, Wall, WallShape } from './types'
import { schedulePathAnimation } from './utils/animationUtils'
import {
    getTargetSize,
    segmentHitsCircleBoundary,
    segmentIntersectsRectangle,
    segmentsIntersect,
} from './utils/geometryUtils'
import { drawGrid, endpointFromAngleLength, snapToNinePoints } from './utils/gridUtils'
import { applyBackgroundTexture } from './utils/pixiUtils'

const DEFAULT_WALL_COLOR = 0xff3b81
const DEFAULT_WALL_ALPHA = 0.95

type PixiBoardProps = {
    width: number
    height: number
    gridSize: number
    snapToGrid: boolean
    isMeasuring: boolean
    isWallMode: boolean
    wallDrawingShape: WallShape | undefined
    mapKey: string
    mapTexture: Texture | null
    onBindFit: (fn: () => void) => void
    tokens: Token[]
    images: ImageData[]
    onTokenMove: (id: string, x: number, y: number, distanceTraveled?: number) => void
    onPendingCountChange: (count: number) => void
    onBindPendingControls: (acceptAll: () => void, cancelAll: () => void) => void
    gridColor: number
    gridAlpha: number
    wallColor: number
    wallAlpha: number
    walls: Wall[]
    onWallsChange: (walls: Wall[], mapKey: string) => void
    isErasingWalls: boolean
    isCombatActive: boolean
    onTokenClick: (id: string) => void
    openDeleteTokenDialog: (id: string) => void
    pixiOnTokenDuplicate: (id: string) => void
    pixiOnTokenCut: (id: string) => void
    pixiOnTokenCopy: (id: string) => void
    onMapDeleteAllTokens: () => void
    onMapDeleteAllWalls: () => void
    onMapDeleteAllBlasts: () => void
    onMapCutAllTokens: () => void
    onMapPasteToken: (tokens: Token[]) => void
    onMapPasteBlast: (blasts: Blast[]) => void
    tokenClipboard: Token[] | null
    blastClipboard: Blast[] | null
    activeTokenId: string | null
    onTokenDrop?: (tokenId: string, worldX: number, worldY: number) => void
    pixiSidePanelWidth: number
    blasts: Blast[]
    blastsNotInMap: Blast[]
    blastDrawMode: BlastType | null
    onBlastDrop?: (blastData: { type: BlastType; id?: string }, worldX: number, worldY: number) => void
    onBlastMove?: (blastId: string, worldX: number, worldY: number) => void
    onBlastComplete?: (blast: Blast) => void
    onBlastUpdateCone?: (blastId: string, x2: number, y2: number, x: number, y: number) => void
    onBlastDelete?: (id: string) => void
    onBlastCopy?: (id: string) => void
    onBlastCut?: (id: string) => void
    onBlastLock?: (id: string, locked: boolean) => void
    pixiReady: boolean
    pixiSetReady: (ready: boolean) => void
    pixiHostReady: boolean
    pixiSetHostReady: (ready: boolean) => void
    pixiTokenContextMenuAnchor: HTMLElement | null
    pixiSetTokenContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiMapContextMenuAnchor: HTMLElement | null
    pixiSetMapContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSelectedTokenId: string | null
    pixiSetSelectedTokenId: (id: string | null) => void
    pixiBlastContextMenuAnchor: HTMLElement | null
    pixiSetBlastContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSelectedBlastId: string | null
    pixiSetSelectedBlastId: (id: string | null) => void
}

const PixiBoard = (props: PixiBoardProps) => {
    const {
        width,
        height,
        gridSize = 50,
        snapToGrid = true,
        isMeasuring = false,
        isWallMode = false,
        wallDrawingShape = undefined,
        mapTexture,
        onBindFit,
        tokens = [],
        images = [],
        onTokenMove,
        onPendingCountChange,
        onBindPendingControls,
        gridColor = 0xffffff,
        gridAlpha = 0.5,
        wallColor = DEFAULT_WALL_COLOR,
        pixiSidePanelWidth = 0,
        wallAlpha = DEFAULT_WALL_ALPHA,
        mapKey,
        walls = [],
        onWallsChange,
        isErasingWalls = false,
        isCombatActive = false,
        onTokenClick,
        openDeleteTokenDialog,
        pixiOnTokenDuplicate,
        pixiOnTokenCut,
        pixiOnTokenCopy,
        onMapDeleteAllTokens,
        onMapDeleteAllWalls,
        onMapDeleteAllBlasts,
        onMapCutAllTokens,
        onMapPasteToken,
        onMapPasteBlast,
        tokenClipboard,
        blastClipboard,
        activeTokenId,
        onTokenDrop,
        blasts = [],
        blastsNotInMap = [],
        blastDrawMode,
        onBlastDrop,
        onBlastMove,
        onBlastComplete,
        onBlastUpdateCone,
        onBlastDelete,
        onBlastCopy,
        onBlastCut,
        onBlastLock,
        pixiReady,
        pixiSetReady,
        pixiHostReady,
        pixiSetHostReady,
        pixiTokenContextMenuAnchor,
        pixiSetTokenContextMenuAnchor,
        pixiMapContextMenuAnchor,
        pixiSetMapContextMenuAnchor,
        pixiSelectedTokenId,
        pixiSetSelectedTokenId,
        pixiBlastContextMenuAnchor,
        pixiSetBlastContextMenuAnchor,
        pixiSelectedBlastId,
        pixiSetSelectedBlastId,
    } = props
    const { readerMode } = useUserPreferences()

    const hostRef = useRef<HTMLDivElement | null>(null)
    const appRef = useRef<Application | null>(null)
    const viewportRef = useRef<Viewport | null>(null)
    const gridRef = useRef<Graphics | null>(null)
    const wallLayerRef = useRef<Graphics | null>(null)
    const wallsRef = useRef<
        {
            id: string
            x1: number
            y1: number
            x2: number
            y2: number
            shape?: WallShape
            color?: number
            alpha?: number
        }[]
    >([])
    const wallStartRef = useRef<{ x: number; y: number } | null>(null)
    const wallPreviewRef = useRef<{ x: number; y: number } | null>(null)
    const wallDrawingShapeRef = useRef<WallShape>(undefined)
    const eraseStartRef = useRef<{ x: number; y: number } | null>(null)
    const erasePreviewRef = useRef<{ x: number; y: number } | null>(null)
    const blastLayerRef = useRef<Graphics | null>(null)
    const blastPreviewLayerRef = useRef<Graphics | null>(null)
    const blastDrawStartRef = useRef<{ x: number; y: number } | null>(null)
    const draggedBlastRef = useRef<Blast | null>(null)
    const draggedBlastStartRef = useRef<Blast | null>(null)
    const blastDrawModeRef = useRef<BlastType | null>(null)
    const blastLabelRef = useRef<Text | null>(null)
    // Guard to prevent immediate tap-confirm right after drag release
    const rotationReadyAtRef = useRef<number>(0)
    // Keep latest onBlastMove in a ref to avoid stale closures in pointer handlers
    const onBlastMoveRef = useRef<typeof onBlastMove | null>(null)
    onBlastMoveRef.current = onBlastMove
    // Keep latest onBlastUpdateCone in a ref to avoid stale closures
    const onBlastUpdateConeRef = useRef<typeof onBlastUpdateCone | null>(null)
    onBlastUpdateConeRef.current = onBlastUpdateCone
    // Pending cone rotation state (apex-rotate-confirm)
    const rotatingConeRef = useRef<{
        id: string
        apexX: number
        apexY: number
        lengthInGrids: number
        angleRad: number
    } | null>(null)
    const blastsRef = useRef<Blast[]>([])
    const blastsNotInMapRef = useRef<Blast[]>([])
    const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const tokenLayerRef = useRef<Graphics | null>(null)
    const measureLayerRef = useRef<Graphics | null>(null)
    const measureLabelRef = useRef<Text | null>(null)
    const measureStartRef = useRef<{ x: number; y: number } | null>(null)
    const wallLabelRef = useRef<Text | null>(null)
    const backgroundRef = useRef<Sprite | null>(null)
    const draggingRef = useRef<{ id: string | null; offsetX: number; offsetY: number } | null>(null)
    const keyDownHandlerRef = useRef<((e: Event) => void) | null>(null)
    const keyUpHandlerRef = useRef<((e: Event) => void) | null>(null)
    const tokensRef = useRef<Token[]>(tokens)
    const prevTokensRef = useRef<Token[]>(tokens)
    const gridSizeRef = useRef<number>(gridSize)
    const snapToGridRef = useRef<boolean>(snapToGrid)
    const isCombatActiveRef = useRef<boolean>(isCombatActive)
    const gridColorRef = useRef<number>(gridColor)
    const gridAlphaRef = useRef<number>(gridAlpha)
    const wallColorRef = useRef<number>(wallColor)
    const wallAlphaRef = useRef<number>(wallAlpha)
    const bgTextureRef = useRef<Texture | null>(mapTexture ?? null)
    const mapKeyRef = useRef<string | undefined>(mapKey)

    // PixiJS tooltip and pending indicator refs
    const pixiTooltipRef = useRef<PixiTooltip | null>(null)
    const pixiPendingIndicatorsRef = useRef<Map<string, PixiPendingIndicator>>(new Map())

    const isMeasuringRef = useRef<boolean>(isMeasuring)
    const isWallModeRef = useRef<boolean>(isWallMode)
    const isErasingWallsRef = useRef<boolean>(isErasingWalls)
    const imagesRef = useRef<ImageData[]>(images)

    const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const dragPreviewRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const clickCandidateRef = useRef<{ id: string; x: number; y: number } | null>(null)

    // Token clipboard for cut/copy/paste

    // PixiTooltip state for hovering tokens
    const hoveredTokenRef = useRef<Token | null>(null)

    // Active token ref for crosshair
    const activeTokenIdRef = useRef<string | null>(activeTokenId)
    const crosshairLayerRef = useRef<Graphics | null>(null)

    // Refs to store canvas event handlers for proper cleanup
    const globalCtxBlockerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null)
    const preventContextMenuRef = useRef<((e: Event) => void) | null>(null)
    const preventRightMouseDownRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null)

    // Animation state for smooth token movement
    const animationsRef = useRef<
        Map<
            string,
            {
                segments: { sx: number; sy: number; ex: number; ey: number; len: number }[]
                startTime: number
                totalMs: number
                totalLen: number
            }
        >
    >(new Map())

    const handleMapPasteToken = (pasteX?: number, pasteY?: number) => {
        if (!tokenClipboard || tokenClipboard.length === 0 || !pasteX || !pasteY) return

        // Create new tokens with new IDs and positions
        const newTokens = tokenClipboard.map((token) => ({
            ...token,
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + Math.random()),
            x: pasteX,
            y: pasteY,
        }))

        onMapPasteToken(newTokens)
        // Keep clipboard intact for multiple pastes
    }

    const handleMapPasteBlast = (pasteX?: number, pasteY?: number) => {
        if (!blastClipboard || blastClipboard.length === 0 || !pasteX || !pasteY) return

        // Calculate center of blasts
        const xs = blastClipboard.map((b) => b.x)
        const ys = blastClipboard.map((b) => b.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        // Create new blasts with new IDs and adjusted positions
        const newBlasts = blastClipboard.map((b) => ({
            ...b,
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + Math.random()),
            x: pasteX + (b.x - centerX),
            y: pasteY + (b.y - centerY),
            x2: b.x2 !== undefined ? pasteX + (b.x2 - centerX) : undefined,
            y2: b.y2 !== undefined ? pasteY + (b.y2 - centerY) : undefined,
        }))

        onMapPasteBlast(newBlasts)
        // Keep clipboard intact for multiple pastes
    }

    const closeContextMenus = () => {
        // Clean up anchor elements
        if (pixiTokenContextMenuAnchor && pixiTokenContextMenuAnchor.parentNode) {
            pixiTokenContextMenuAnchor.parentNode.removeChild(pixiTokenContextMenuAnchor)
        }
        if (pixiMapContextMenuAnchor && pixiMapContextMenuAnchor.parentNode) {
            pixiMapContextMenuAnchor.parentNode.removeChild(pixiMapContextMenuAnchor)
        }
        if (pixiBlastContextMenuAnchor && pixiBlastContextMenuAnchor.parentNode) {
            pixiBlastContextMenuAnchor.parentNode.removeChild(pixiBlastContextMenuAnchor)
        }

        pixiSetTokenContextMenuAnchor(null)
        pixiSetMapContextMenuAnchor(null)
        pixiSetBlastContextMenuAnchor(null)
        pixiSetSelectedTokenId(null)
        pixiSetSelectedBlastId(null)
    }

    const cancelAllPending = () => {
        // Clear overlays and redraw tokens at original positions
        pixiPendingIndicatorsRef.current.forEach((indicator) => {
            indicator.destroy()
        })
        pixiPendingIndicatorsRef.current.clear()
        renderTokens(tokenLayerRef.current, tokensRef.current)
        onPendingCountChange(pixiPendingIndicatorsRef.current.size)
    }

    const acceptAllPending = () => {
        // Commit all pending moves, schedule animations, then clear overlays
        pixiPendingIndicatorsRef.current.forEach((indicator, id) => {
            const pts = [...indicator.points]
            const last = pts[pts.length - 1]
            if (!last || last.x !== indicator.endX || last.y !== indicator.endY) {
                pts.push({ x: indicator.endX, y: indicator.endY })
            }

            // Calculate total distance traveled
            const step = gridSizeRef.current
            let totalDistance = 0
            for (let i = 1; i < pts.length; i++) {
                const dxs = Math.abs(pts[i].x - pts[i - 1].x)
                const dys = Math.abs(pts[i].y - pts[i - 1].y)
                totalDistance += Math.hypot(dxs, dys) / step
            }

            // Round distance to integer
            totalDistance = Math.round(totalDistance)

            // Decrement currentMovement by distance traveled (only if combat active)
            if (isCombatActiveRef.current) {
                const token = tokensRef.current.find((t) => t.id === id)
                if (token?.stats) {
                    const newCurrentMovement = Math.max(0, token.stats.currentMovement - totalDistance)
                    const updatedToken = {
                        ...token,
                        stats: {
                            ...token.stats,
                            currentMovement: newCurrentMovement,
                        },
                    }
                    tokensRef.current = tokensRef.current.map((t) => (t.id === id ? updatedToken : t))
                }
            }

            schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)
            onTokenMove(id, indicator.endX, indicator.endY, isCombatActiveRef.current ? totalDistance : undefined)
            indicator.destroy()
        })
        pixiPendingIndicatorsRef.current.clear()
        // After committing, redraw tokens (parent will also update tokens prop shortly)
        renderTokens(tokenLayerRef.current, tokensRef.current)
        onPendingCountChange(pixiPendingIndicatorsRef.current.size)
    }

    const worldDims = useMemo(
        () => ({
            worldWidth: Math.max(width * 4, 4000),
            worldHeight: Math.max(height * 4, 4000),
        }),
        [width, height]
    )

    // Track when host ref becomes available (runs after DOM updates)
    useLayoutEffect(() => {
        if (hostRef.current && !pixiHostReady) {
            pixiSetHostReady(true)
        }
    })
    // Update images ref when images prop changes
    useEffect(() => {
        imagesRef.current = images
        // Preload textures for the images
        preloadTextures(images)
    }, [images])
    // Update activeTokenId ref when prop changes and force crosshair redraw
    useEffect(() => {
        activeTokenIdRef.current = activeTokenId

        // Force crosshair update immediately when active token changes
        const crosshair = crosshairLayerRef.current
        if (crosshair && activeTokenId) {
            const token = tokensRef.current.find((t) => t.id === activeTokenId)
            if (token) {
                const pending = pixiPendingIndicatorsRef.current.get(token.id)
                const x = pending ? pending.endX : token.x
                const y = pending ? pending.endY : token.y

                // Create a pulsing effect based on time
                const time = Date.now() / 1000
                const pulse = Math.sin(time * 3) * 0.2 + 0.8
                const ringRadius = token.radius * 1.5

                crosshair.clear()

                // Draw outer ring with pulsing alpha
                crosshair.setStrokeStyle({ width: 4, color: 0xffff00, alpha: pulse })
                crosshair.circle(x, y, ringRadius)
                crosshair.stroke()

                // Draw inner ring
                crosshair.setStrokeStyle({ width: 2, color: 0xff00ff, alpha: 0.9 })
                crosshair.circle(x, y, ringRadius * 0.8)
                crosshair.stroke()

                // Draw crosshair lines
                crosshair.setStrokeStyle({ width: 3, color: 0x00ffff, alpha: 0.7 })
                const lineLength = token.radius * 2.5
                crosshair.moveTo(x - lineLength, y)
                crosshair.lineTo(x + lineLength, y)
                crosshair.moveTo(x, y - lineLength)
                crosshair.lineTo(x, y + lineLength)
                crosshair.stroke()
            } else {
                crosshair.clear()
            }
        } else if (crosshair) {
            crosshair.clear()
        }
    }, [activeTokenId])
    // Sync walls from prop
    useEffect(() => {
        wallsRef.current = (walls || []).map((w) => ({
            id: w.id,
            x1: w.x1,
            y1: w.y1,
            x2: w.x2,
            y2: w.y2,
            ...(w.shape != null ? { shape: w.shape } : {}),
            ...(w.color != null ? { color: w.color } : {}),
            ...(w.alpha != null ? { alpha: w.alpha } : {}),
        }))
        // redraw walls layer
        if (wallLayerRef.current) {
            const g = wallLayerRef.current
            g.clear()
            for (const w of wallsRef.current) {
                const c = w.color ?? DEFAULT_WALL_COLOR
                const a = w.alpha ?? DEFAULT_WALL_ALPHA
                g.setStrokeStyle({ width: 3, color: c, alpha: a })

                const shape = w.shape
                if (shape === 'line') {
                    g.moveTo(w.x1, w.y1)
                    g.lineTo(w.x2, w.y2)
                    g.stroke()
                } else if (shape === 'rectangle') {
                    const dx = w.x2 - w.x1
                    const dy = w.y2 - w.y1
                    const width = Math.abs(dx)
                    const height = Math.abs(dy)
                    const x = Math.min(w.x1, w.x2)
                    const y = Math.min(w.y1, w.y2)
                    g.rect(x, y, width, height)
                    g.stroke()
                } else if (shape === 'circle') {
                    const dx = w.x2 - w.x1
                    const dy = w.y2 - w.y1
                    const centerX = w.x1 + dx / 2
                    const centerY = w.y1 + dy / 2
                    const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                    g.circle(centerX, centerY, radius)
                    g.stroke()
                }
            }
        }
    }, [walls])
    // Keep latest mapKey
    useEffect(() => {
        mapKeyRef.current = mapKey
    }, [mapKey])
    // Redraw grid when color/alpha change
    useEffect(() => {
        if (!gridRef.current) return
        const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
        gridRef.current.clear()
        drawGrid(gridRef.current, gw, gh, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)
    }, [gridColor, gridAlpha])
    // Initialize PIXI Application + Viewport once
    useEffect(() => {
        if (!pixiHostReady) return
        let destroyed = false

        // Pause rendering when tab is hidden, resume when visible
        const onVisibility = () => {
            if (appRef.current && document.hidden) appRef.current.ticker.stop()
            else if (appRef.current) appRef.current.ticker.start()
        }

        const init = async () => {
            if (!hostRef.current) return
            const app = new Application()
            const targetDPR = Math.min(window.devicePixelRatio || 1, 1.5)
            await app.init({
                resolution: targetDPR,
                autoDensity: true,
                antialias: true,
                powerPreference: 'high-performance',
                backgroundAlpha: 1,
                background: readerMode ? colors.grays.gray900 : colors.cyberpunk.darkBg,
                width,
                height,
            })
            if (destroyed) {
                app.destroy(true)
                return
            }
            try {
                hostRef.current.appendChild(app.canvas)
                appRef.current = app

                const canvas = app.canvas

                // Cancel default context menu ONLY when inside the PIXI canvas
                const onCtxMenu = (ev: globalThis.MouseEvent) => {
                    // Prefer composedPath; fall back to coordinate check
                    const path = (ev.composedPath?.() ?? []) as globalThis.EventTarget[]
                    const inCanvasPath = path.includes(canvas)

                    // Block default browser context menu when inside the PIXI canvas
                    if (inCanvasPath) {
                        ev.preventDefault()
                        ev.stopPropagation()
                        return
                    }

                    const r = canvas.getBoundingClientRect()
                    const { clientX: x, clientY: y } = ev
                    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                        ev.preventDefault()
                        ev.stopPropagation()
                    }
                }
                document.addEventListener('contextmenu', onCtxMenu, true)
                globalCtxBlockerRef.current = onCtxMenu

                // (optional) keep these canvas-level guards too
                // Block default browser context menu on the canvas; custom menus are opened manually
                const preventContextMenu = (e: Event) => {
                    e.preventDefault()
                    e.stopPropagation()
                }
                canvas.addEventListener('contextmenu', preventContextMenu, { capture: true })
                preventContextMenuRef.current = preventContextMenu

                // Also prevent native context menu via right-button mousedown to be safe
                const preventRightMouseDown = (e: globalThis.MouseEvent) => {
                    if (e.button === 2) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }
                canvas.addEventListener('mousedown', preventRightMouseDown, { capture: true })
                preventRightMouseDownRef.current = preventRightMouseDown
            } catch {
                console.error('Failed to initialize PIXI Application + Viewport')
            }

            const viewport = new Viewport({
                events: app.renderer.events,
                screenWidth: width,
                screenHeight: height,
                worldWidth: worldDims.worldWidth,
                worldHeight: worldDims.worldHeight,
            })
            viewport.drag({ mouseButtons: 'middle' }).pinch().wheel({ trackpadPinch: true }).decelerate()
            viewport.sortableChildren = true
            app.stage.addChild(viewport)
            viewportRef.current = viewport

            // Create a white texture for the background
            const canvas = document.createElement('canvas')
            canvas.width = 1
            canvas.height = 1
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, 1, 1)
            }
            const bgTexture = Texture.from(canvas)
            const bg = new Sprite(bgTexture)
            bg.tint = 0x000000
            bg.width = worldDims.worldWidth
            bg.height = worldDims.worldHeight
            bg.zIndex = 0
            backgroundRef.current = bg
            viewport.addChild(bg)

            if (bgTextureRef.current)
                applyBackgroundTexture(
                    bgTextureRef.current,
                    viewport,
                    backgroundRef,
                    gridRef,
                    gridSizeRef.current,
                    gridColorRef.current,
                    gridAlphaRef.current
                )

            const grid = new Graphics()
            gridRef.current = grid
            viewport.addChild(grid)
            const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
            drawGrid(grid, gw, gh, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)

            // Blast layers (below walls and tokens)
            const blastLayer = new Graphics()
            blastLayerRef.current = blastLayer
            blastLayer.zIndex = 0.5
            viewport.addChild(blastLayer)

            const blastPreviewLayer = new Graphics()
            blastPreviewLayerRef.current = blastPreviewLayer
            blastPreviewLayer.zIndex = 0.6
            // Allow the preview layer to receive pointer events so rotation confirm click is captured
            blastPreviewLayer.eventMode = 'static'
            blastPreviewLayer.cursor = 'crosshair'
            // Preview layer is visual only; no pointer handling needed
            viewport.addChild(blastPreviewLayer)

            // Create blast size label
            const blastLabel = new Text({
                text: '',
                style: {
                    fill: 0xffa500,
                    fontSize: 16,
                    fontWeight: 'bold',
                    stroke: { color: 0x000000, width: 3 },
                },
            })
            blastLabel.anchor.set(0.5, 1)
            blastLabel.zIndex = 100
            blastLabel.visible = false
            blastLabelRef.current = blastLabel
            viewport.addChild(blastLabel)

            // Preload blast textures
            preloadBlastTextures().catch((err) => console.error('Failed to preload blast textures:', err))

            const wallLayer = new Graphics()
            wallLayerRef.current = wallLayer
            wallLayer.zIndex = 1
            viewport.addChild(wallLayer)

            const tokenLayer = new Graphics()
            tokenLayerRef.current = tokenLayer
            tokenLayer.zIndex = 2
            viewport.addChild(tokenLayer)

            // Crosshair layer for active token (below tokens)
            const crosshairLayer = new Graphics()
            crosshairLayerRef.current = crosshairLayer
            crosshairLayer.zIndex = 1.5 // Between walls (1) and tokens (2)
            crosshairLayer.eventMode = 'none' // Don't intercept pointer events
            crosshairLayer.visible = true
            viewport.addChild(crosshairLayer)

            // Ticker to drive token movement animations
            const ease = (t: number) => {
                // Blend mostly-linear with a softer ease to avoid very slow starts/ends
                const cubic = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
                const linearWeight = 0.85 // higher -> closer to linear at ends
                return linearWeight * t + (1 - linearWeight) * cubic
            }
            // Cap FPS to reduce CPU/GPU load
            app.ticker.maxFPS = 60
            app.ticker.add(() => {
                const layer = tokenLayerRef.current
                if (!layer) return
                const anims = animationsRef.current
                // If dragging live, rendering is handled in pointermove; still animate others
                if (anims.size === 0) return
                const now = globalThis.performance.now()
                // Build override positions from animations using a single eased progress along total path length
                const override = new Map<string, { endX: number; endY: number }>()
                for (const [id, a] of anims) {
                    const elapsed = now - a.startTime
                    if (elapsed >= a.totalMs) {
                        const last = a.segments[a.segments.length - 1]
                        if (last) override.set(id, { endX: last.ex, endY: last.ey })
                        anims.delete(id)
                        continue
                    }
                    const t = Math.max(0, Math.min(1, elapsed / Math.max(1, a.totalMs)))
                    const k = ease(t)
                    const targetDist = k * a.totalLen
                    // Find segment containing targetDist
                    let accLen = 0
                    let segIndex = 0
                    while (segIndex < a.segments.length && accLen + a.segments[segIndex].len < targetDist) {
                        accLen += a.segments[segIndex].len
                        segIndex++
                    }
                    const seg = a.segments[Math.min(segIndex, a.segments.length - 1)]
                    const segProgress = a.totalLen > 0 ? (targetDist - accLen) / Math.max(1, seg.len) : 1
                    const cx = seg.sx + (seg.ex - seg.sx) * segProgress
                    const cy = seg.sy + (seg.ey - seg.sy) * segProgress
                    override.set(id, { endX: cx, endY: cy })
                }
                // Begin with current pending endpoints so those keep priority
                const merged = new Map(
                    Array.from(pixiPendingIndicatorsRef.current.entries()).map(([id, ind]) => [
                        id,
                        { endX: ind.endX, endY: ind.endY },
                    ])
                )
                // Apply animation overrides for any ids without active pendings
                for (const [id, pos] of override) {
                    if (!merged.has(id)) merged.set(id, pos)
                }
                // Include live drag override if present
                const live = dragPreviewRef.current
                renderTokensWithPending(tokenLayerRef.current, tokensRef.current, merged, live?.id, live?.x, live?.y)

                // Draw crosshair for active token - using a pulsing ring for visibility
                const crosshair = crosshairLayerRef.current
                if (crosshair && activeTokenIdRef.current) {
                    const token = tokensRef.current.find((t) => t.id === activeTokenIdRef.current)
                    if (token) {
                        const pending = pixiPendingIndicatorsRef.current.get(token.id)
                        const x = pending ? pending.endX : token.x
                        const y = pending ? pending.endY : token.y

                        // Create a pulsing effect based on time
                        const time = Date.now() / 1000
                        const pulse = Math.sin(time * 3) * 0.2 + 0.8 // Oscillates between 0.6 and 1.0
                        const ringRadius = token.radius * 1.5

                        crosshair.clear()

                        // Draw outer ring with pulsing alpha
                        crosshair.setStrokeStyle({ width: 4, color: 0xffff00, alpha: pulse })
                        crosshair.circle(x, y, ringRadius)
                        crosshair.stroke()

                        // Draw inner ring
                        crosshair.setStrokeStyle({ width: 2, color: 0xff00ff, alpha: 0.9 })
                        crosshair.circle(x, y, ringRadius * 0.8)
                        crosshair.stroke()

                        // Draw crosshair lines
                        crosshair.setStrokeStyle({ width: 3, color: 0x00ffff, alpha: 0.7 })
                        const lineLength = token.radius * 2.5
                        crosshair.moveTo(x - lineLength, y)
                        crosshair.lineTo(x + lineLength, y)
                        crosshair.moveTo(x, y - lineLength)
                        crosshair.lineTo(x, y + lineLength)
                        crosshair.stroke()
                    } else {
                        crosshair.clear()
                    }
                } else if (crosshair) {
                    crosshair.clear()
                }
            })

            document.addEventListener('visibilitychange', onVisibility)

            // WASD keyboard navigation
            const pressedKeys = new Set<string>()
            const panSpeed = 10 // pixels per frame at normal zoom

            const handleKeyDown = (e: Event) => {
                // Don't process WASD if user is typing in an input field
                const target = e.target as HTMLElement
                const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

                if (isTyping) return

                const key = (e as unknown as { key: string }).key.toLowerCase()
                // Rotation confirm/cancel via keyboard
                if (rotatingConeRef.current) {
                    if (key === 'enter') {
                        const apex = rotatingConeRef.current
                        const end = lastPointerPosRef.current
                        if (onBlastUpdateCone) onBlastUpdateCone(apex.id, end.x, end.y, apex.apexX, apex.apexY)
                        const updated = blastsRef.current.map((b) =>
                            b.id === apex.id ? { ...b, x: apex.apexX, y: apex.apexY, x2: end.x, y2: end.y } : b
                        )
                        blastsRef.current = updated
                        renderBlasts(blastLayerRef.current, blastsRef.current, gridSizeRef.current)
                        rotatingConeRef.current = null
                        rotationReadyAtRef.current = 0
                        if (blastPreviewLayerRef.current) blastPreviewLayerRef.current.clear()
                        if (blastLabelRef.current) blastLabelRef.current.visible = false
                        e.preventDefault()
                        return
                    }
                    if (key === 'escape') {
                        rotatingConeRef.current = null
                        rotationReadyAtRef.current = 0
                        if (blastPreviewLayerRef.current) blastPreviewLayerRef.current.clear()
                        if (blastLabelRef.current) blastLabelRef.current.visible = false
                        e.preventDefault()
                        return
                    }
                }
                if (['w', 'a', 's', 'd'].includes(key)) {
                    pressedKeys.add(key)
                    e.preventDefault()
                }
            }

            const handleKeyUp = (e: Event) => {
                // Don't process WASD if user is typing in an input field
                const target = e.target as HTMLElement
                const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

                if (isTyping) return

                const key = (e as unknown as { key: string }).key.toLowerCase()
                pressedKeys.delete(key)
            }

            keyDownHandlerRef.current = handleKeyDown
            keyUpHandlerRef.current = handleKeyUp
            window.addEventListener('keydown', handleKeyDown)
            window.addEventListener('keyup', handleKeyUp)

            // Add WASD panning to ticker
            app.ticker.add(() => {
                if (pressedKeys.size === 0) return
                const vp = viewportRef.current
                if (!vp) return

                let dx = 0
                let dy = 0

                if (pressedKeys.has('w')) dy += panSpeed
                if (pressedKeys.has('s')) dy -= panSpeed
                if (pressedKeys.has('a')) dx += panSpeed
                if (pressedKeys.has('d')) dx -= panSpeed

                // Apply movement independent of zoom level
                vp.x += dx
                vp.y += dy
            })

            // Helper to create/update a pending move overlay for a token using PixiPendingIndicator
            const upsertPendingOverlay = (id: string, sx: number, sy: number, ex: number, ey: number) => {
                const viewport = viewportRef.current
                if (!viewport) return

                let indicator = pixiPendingIndicatorsRef.current.get(id)
                if (!indicator) {
                    const token = tokensRef.current.find((t) => t.id === id)
                    indicator = new PixiPendingIndicator({
                        id,
                        startX: sx,
                        startY: sy,
                        endX: ex,
                        endY: ey,
                        points: [
                            { x: sx, y: sy },
                            { x: ex, y: ey },
                        ],
                        gridSize: gridSizeRef.current,
                        isCombatActive: isCombatActiveRef.current,
                        token,
                        viewport,
                        onAccept: () => {
                            const ind = pixiPendingIndicatorsRef.current.get(id)
                            if (!ind) return

                            // Calculate total distance traveled
                            const step = gridSizeRef.current
                            let totalDistance = 0
                            const pts = [...ind.points]
                            const last = pts[pts.length - 1]
                            if (!last || last.x !== ind.endX || last.y !== ind.endY) {
                                pts.push({ x: ind.endX, y: ind.endY })
                            }
                            for (let i = 1; i < pts.length; i++) {
                                const dxs = Math.abs(pts[i].x - pts[i - 1].x)
                                const dys = Math.abs(pts[i].y - pts[i - 1].y)
                                totalDistance += Math.hypot(dxs, dys) / step
                            }

                            // Round distance to integer
                            totalDistance = Math.round(totalDistance)

                            // Decrement currentMovement by distance traveled (only if combat active)
                            if (isCombatActiveRef.current) {
                                const token = tokensRef.current.find((t) => t.id === id)
                                if (token?.stats) {
                                    const newCurrentMovement = Math.max(0, token.stats.currentMovement - totalDistance)
                                    // Update token's currentMovement
                                    const updatedToken = {
                                        ...token,
                                        stats: {
                                            ...token.stats,
                                            currentMovement: newCurrentMovement,
                                        },
                                    }
                                    // Update tokensRef immediately so subsequent moves see the updated value
                                    tokensRef.current = tokensRef.current.map((t) => (t.id === id ? updatedToken : t))
                                }
                            }

                            schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)
                            onTokenMove?.(id, ind.endX, ind.endY, isCombatActiveRef.current ? totalDistance : undefined)

                            // Remove indicator
                            ind.destroy()
                            pixiPendingIndicatorsRef.current.delete(id)
                            onPendingCountChange(pixiPendingIndicatorsRef.current.size)

                            // Redraw with remaining pending overlays
                            const pendingMapAfter = new Map(
                                Array.from(pixiPendingIndicatorsRef.current.entries()).map(([pid, ind]) => [
                                    pid,
                                    { endX: ind.endX, endY: ind.endY },
                                ])
                            )
                            renderTokensWithPending(tokenLayerRef.current, tokensRef.current, pendingMapAfter)
                        },
                        onCancel: () => {
                            const ind = pixiPendingIndicatorsRef.current.get(id)
                            if (!ind) return

                            if (ind.points.length < 4) {
                                // Only start point exists, cancel entire movement
                                // Redraw tokens with remaining pendings so others stay put
                                const pendingMap = new Map(
                                    Array.from(pixiPendingIndicatorsRef.current.entries())
                                        .filter(([pid]) => pid !== id)
                                        .map(([pid, ind]) => [pid, { endX: ind.endX, endY: ind.endY }])
                                )
                                renderTokensWithPending(tokenLayerRef.current, tokensRef.current, pendingMap)

                                // Remove indicator
                                ind.destroy()
                                pixiPendingIndicatorsRef.current.delete(id)
                                onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                            } else {
                                // Remove last waypoint and update end position
                                ind.points.pop()
                                const newLastPoint = ind.points[ind.points.length - 1]
                                if (newLastPoint) {
                                    ind.updatePosition(newLastPoint.x, newLastPoint.y)
                                    // Update token rendering to show token at new position
                                    const pendingMap = new Map(
                                        Array.from(pixiPendingIndicatorsRef.current.entries()).map(([pid, ind]) => [
                                            pid,
                                            { endX: ind.endX, endY: ind.endY },
                                        ])
                                    )
                                    renderTokensWithPending(tokenLayerRef.current, tokensRef.current, pendingMap)
                                }
                            }
                        },
                        isPreview: false,
                    })
                    pixiPendingIndicatorsRef.current.set(id, indicator)
                    onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                } else {
                    // Update existing indicator
                    const isPreview = dragPreviewRef.current?.id === id
                    if (!isPreview) {
                        indicator.updatePoints([
                            { x: sx, y: sy },
                            { x: ex, y: ey },
                        ])
                        indicator.updatePosition(ex, ey)
                    } else {
                        // During preview/drag, update the position so the line follows the mouse
                        indicator.updatePosition(ex, ey)
                        // Ensure the indicator knows it's in preview mode
                        indicator.props.isPreview = true
                    }
                }
            }

            // PixiPendingIndicator handles zoom changes automatically

            // Measure layer (on top of tokens)
            const measureLayer = new Graphics()
            measureLayerRef.current = measureLayer
            measureLayer.zIndex = 3
            viewport.addChild(measureLayer)
            const measureLabel = new Text({ text: '', style: { fill: 0xffffff, fontSize: 12 } })
            measureLabel.visible = false
            measureLabel.zIndex = 4
            measureLabelRef.current = measureLabel
            viewport.addChild(measureLabel)
            const wallLabel = new Text({ text: '', style: { fill: 0xffffff, fontSize: 12 } })
            wallLabel.visible = false
            wallLabel.zIndex = 4
            wallLabelRef.current = wallLabel
            viewport.addChild(wallLabel)

            // Pointer drag with grid-snap across tokens
            viewport.on('pointerdown', (e: FederatedPointerEvent) => {
                const global = viewport.toWorld(e.global)
                const x = global.x
                const y = global.y
                const btn = e.button ?? 0 // 0: left, 1: middle, 2: right

                // Hide PixiTooltip on pointer down
                pixiTooltipRef.current?.hide()
                hoveredTokenRef.current = null

                // If we are in cone rotation confirmation state, treat this click as confirm
                if (rotatingConeRef.current && btn === 0) {
                    const apex = rotatingConeRef.current
                    // Keep constant length when confirming; compute endpoint from apex + angle
                    const angle = Math.atan2(y - apex.apexY, x - apex.apexX)
                    const lenPx = apex.lengthInGrids * gridSizeRef.current
                    const end = endpointFromAngleLength(
                        apex.apexX,
                        apex.apexY,
                        angle,
                        lenPx,
                        gridSizeRef.current,
                        false
                    )

                    // Check if this is a new cone (template) or existing cone
                    const existingBlast = blastsRef.current.find((b) => b.id === apex.id)
                    if (!existingBlast) {
                        // This is a new cone from template - create it
                        const newBlast: Blast = {
                            id: apex.id,
                            mapId: mapKeyRef.current || '',
                            type: 'cone',
                            x: apex.apexX,
                            y: apex.apexY,
                            x2: end.x,
                            y2: end.y,
                            size: apex.lengthInGrids,
                            alpha: 0.7,
                            locked: false,
                        }
                        // Add numbered name
                        const existingFlamers = blastsRef.current.filter((b) => b.type === 'cone')
                        const flamerNumber = existingFlamers.length + 1
                        newBlast.name = `Flamer ${flamerNumber}`

                        if (onBlastComplete) {
                            onBlastComplete(newBlast)
                        }
                    } else {
                        // This is an existing cone - update it
                        void (async () => {
                            if (onBlastUpdateConeRef.current)
                                onBlastUpdateConeRef.current(apex.id, end.x, end.y, apex.apexX, apex.apexY)
                        })()
                        // Update local state mirror
                        const updated = blastsRef.current.map((b) =>
                            b.id === apex.id ? { ...b, x: apex.apexX, y: apex.apexY, x2: end.x, y2: end.y } : b
                        )
                        blastsRef.current = updated
                    }

                    renderBlasts(blastLayerRef.current, blastsRef.current, gridSizeRef.current)
                    // Clear rotation preview visuals
                    rotatingConeRef.current = null
                    if (blastPreviewLayerRef.current) blastPreviewLayerRef.current.clear()
                    if (blastLabelRef.current) blastLabelRef.current.visible = false
                    // Stop propagation so underlying board handlers don't swallow this confirmation
                    e.stopPropagation?.()
                    e.preventDefault?.()
                    return
                }

                // Prevent default browser context menu on right clicks
                // Must prevent on native event, not FederatedPointerEvent
                if (btn === 2) {
                    e.preventDefault?.()
                    // Access native event to prevent browser context menu
                    const eventWithNative = e as unknown as { nativeEvent?: Event; originalEvent?: Event }
                    const nativeEvent = eventWithNative.nativeEvent || eventWithNative.originalEvent
                    if (nativeEvent) {
                        nativeEvent.preventDefault?.()
                        nativeEvent.stopPropagation?.()
                    }
                }

                // Token interaction: handle left click (drag) and right click (context menu)
                // Check tokens FIRST before blasts to give tokens precedence
                let hit: Token | null = null
                let clickedBlast: Blast | null = null
                if (btn === 0 || btn === 2) {
                    // Check if the event target is a waypoint button or other interactive element
                    let target: PixiDisplayObject | undefined = e.target as PixiDisplayObject
                    while (target && target !== viewport) {
                        // Check if this is a waypoint button container (zIndex 6, eventMode static, cursor pointer)
                        if (target.eventMode === 'static' && target.cursor === 'pointer' && target.zIndex === 6) {
                            return // Skip token processing for waypoint button clicks
                        }
                        target = target.parent
                    }

                    // Hit test using displayed positions (respect pending endpoints)
                    hit = null
                    let minDist = Number.POSITIVE_INFINITY
                    for (const t of tokensRef.current) {
                        const pending = pixiPendingIndicatorsRef.current.get(t.id)
                        const tx = pending ? pending.endX : t.x
                        const ty = pending ? pending.endY : t.y
                        const d = Math.hypot(tx - x, ty - y)
                        if (d <= t.radius && d < minDist) {
                            hit = { ...t, x: tx, y: ty }
                            minDist = d
                        }
                    }

                    if (hit) {
                        if (btn === 2) {
                            // Right click on token: open token context menu
                            const anchorEl = document.createElement('div')
                            anchorEl.style.position = 'fixed'
                            const screenPos = viewport.toScreen(x, y)
                            const rect = hostRef.current?.getBoundingClientRect()
                            if (rect) {
                                anchorEl.style.left = `${rect.left + screenPos.x}px`
                                anchorEl.style.top = `${rect.top + screenPos.y}px`
                            } else {
                                anchorEl.style.left = `${screenPos.x}px`
                                anchorEl.style.top = `${screenPos.y}px`
                            }
                            anchorEl.style.width = '1px'
                            anchorEl.style.height = '1px'
                            anchorEl.style.pointerEvents = 'auto'
                            document.body.appendChild(anchorEl)
                            pixiSetTokenContextMenuAnchor(anchorEl)
                            pixiSetSelectedTokenId(hit.id)
                            return
                        } else {
                            // Left click on token: start drag
                            draggingRef.current = { id: hit.id, offsetX: x - hit.x, offsetY: y - hit.y }
                            // if token already has pending waypoints, start from last end
                            const existing = pixiPendingIndicatorsRef.current.get(hit.id)
                            if (existing) {
                                dragStartRef.current = { id: hit.id, x: existing.endX, y: existing.endY }
                            } else {
                                dragStartRef.current = { id: hit.id, x: hit.x, y: hit.y }
                            }
                            clickCandidateRef.current = { id: hit.id, x, y }
                            return
                        }
                    }

                    // Only check for blast hits if no token was hit
                    if (!blastDrawModeRef.current && !isWallModeRef.current && !isMeasuringRef.current) {
                        // Check if clicking on a blast
                        clickedBlast =
                            blastsRef.current.find((blast) => {
                                const dx = x - blast.x
                                const dy = y - blast.y

                                if (blast.type === 'grenade') {
                                    const radius = (gridSizeRef.current * 5) / 2
                                    return Math.sqrt(dx * dx + dy * dy) <= radius
                                } else if (blast.type === 'circle') {
                                    const radius = gridSizeRef.current * (blast.size || 0)
                                    return Math.sqrt(dx * dx + dy * dy) <= radius
                                } else if (blast.type === 'square') {
                                    const width = gridSizeRef.current * (blast.size || 0)
                                    const height = gridSizeRef.current * (blast.sizeY || blast.size || 0)
                                    return Math.abs(dx) <= width / 2 && Math.abs(dy) <= height / 2
                                } else if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
                                    // Point-in-triangle for cone using barycentric technique
                                    const points = calculateConePoints(blast.x, blast.y, blast.x2, blast.y2, 28)
                                    const ax = points[0].x
                                    const ay = points[0].y
                                    const bx = points[1].x // left base point
                                    const by = points[1].y
                                    const cx = points[2].x // right base point
                                    const cy = points[2].y

                                    // Barycentric coordinate check
                                    const v0x = cx - ax
                                    const v0y = cy - ay
                                    const v1x = bx - ax
                                    const v1y = by - ay
                                    const v2x = x - ax
                                    const v2y = y - ay

                                    const dot00 = v0x * v0x + v0y * v0y
                                    const dot01 = v0x * v1x + v0y * v1y
                                    const dot02 = v0x * v2x + v0y * v2y
                                    const dot11 = v1x * v1x + v1y * v1y
                                    const dot12 = v1x * v2x + v1y * v2y

                                    const invDen = 1 / (dot00 * dot11 - dot01 * dot01)
                                    const u = (dot11 * dot02 - dot01 * dot12) * invDen
                                    const v = (dot00 * dot12 - dot01 * dot02) * invDen

                                    return u >= 0 && v >= 0 && u + v <= 1
                                }
                                return false
                            }) || null

                        if (clickedBlast) {
                            if (btn === 2) {
                                // Right click on blast: open blast context menu
                                const anchorEl = document.createElement('div')
                                anchorEl.style.position = 'fixed'
                                const screenPos = viewport.toScreen(x, y)
                                const rect = hostRef.current?.getBoundingClientRect()
                                if (rect) {
                                    anchorEl.style.left = `${rect.left + screenPos.x}px`
                                    anchorEl.style.top = `${rect.top + screenPos.y}px`
                                } else {
                                    anchorEl.style.left = `${screenPos.x}px`
                                    anchorEl.style.top = `${screenPos.y}px`
                                }
                                anchorEl.style.width = '1px'
                                anchorEl.style.height = '1px'
                                anchorEl.style.pointerEvents = 'auto'
                                document.body.appendChild(anchorEl)
                                pixiSetBlastContextMenuAnchor(anchorEl)
                                pixiSetSelectedBlastId(clickedBlast.id)
                                return
                            } else {
                                // Left click: allow drag only if not locked
                                if (!clickedBlast.locked) {
                                    draggedBlastRef.current = clickedBlast
                                    // Snapshot original for correct translation of x2,y2 during drag
                                    draggedBlastStartRef.current = { ...clickedBlast }
                                }
                                return
                            }
                        }
                    }
                }

                // Handle right-click on empty space to open map context menu
                if (btn === 2 && !hit && !clickedBlast) {
                    // Right click on empty map: open map context menu
                    const anchorEl = document.createElement('div')
                    anchorEl.style.position = 'fixed'
                    const screenPos = viewport.toScreen(x, y)
                    const rect = hostRef.current?.getBoundingClientRect()
                    if (rect) {
                        anchorEl.style.left = `${rect.left + screenPos.x}px`
                        anchorEl.style.top = `${rect.top + screenPos.y}px`
                        anchorEl.dataset.pasteX = x.toString()
                        anchorEl.dataset.pasteY = y.toString()
                        anchorEl.style.width = '1px'
                        anchorEl.style.height = '1px'
                        anchorEl.style.pointerEvents = 'auto'
                        document.body.appendChild(anchorEl)
                        pixiSetMapContextMenuAnchor(anchorEl)
                        return
                    }
                }

                // Blast drawing mode: only start with left button
                if (blastDrawModeRef.current && btn === 0) {
                    try {
                        e.stopPropagation?.()
                        e.preventDefault?.()
                    } catch {
                        console.error('Failed to stop propagation or prevent default')
                    }
                    const snapped = snapToNinePoints(x, y, gridSizeRef.current, snapToGridRef.current)
                    blastDrawStartRef.current = { x: snapped.x, y: snapped.y }
                    return
                }

                // Context menu closing is handled by MUI Menu
                // Eraser mode: only start with left button
                if (isWallModeRef.current && isErasingWallsRef.current) {
                    if (btn !== 0) return
                    eraseStartRef.current = { x, y }
                    erasePreviewRef.current = null
                    return
                }
                // Wall draw mode: only start with left button
                if (isWallModeRef.current && wallDrawingShapeRef.current) {
                    if (btn !== 0) return
                    const snapped = snapToNinePoints(x, y, gridSizeRef.current, snapToGridRef.current)
                    wallStartRef.current = { x: snapped.x, y: snapped.y }
                    wallPreviewRef.current = null
                    // prevent panning start
                    return
                }
                // Measurement: only start with left button
                if (isMeasuringRef.current) {
                    if (btn !== 0) return
                    try {
                        e.stopPropagation?.()
                        e.preventDefault?.()
                    } catch {
                        console.error('Failed to stop propagation or prevent default')
                    }
                    const step = gridSizeRef.current
                    const startSnapped = snapToNinePoints(x, y, step, snapToGridRef.current)
                    measureStartRef.current = { x: startSnapped.x, y: startSnapped.y }
                    return
                }
            })

            const endDrag = () => {
                // Complete blast dragging
                if (draggedBlastRef.current && onBlastMoveRef.current) {
                    const snapped = snapToNinePoints(
                        lastPointerPosRef.current.x,
                        lastPointerPosRef.current.y,
                        gridSizeRef.current,
                        snapToGridRef.current
                    )
                    const dragged = draggedBlastRef.current
                    const original = draggedBlastStartRef.current ?? dragged
                    const dx = snapped.x - original.x
                    const dy = snapped.y - original.y
                    // Optimistic local update for immediate UI sync; translate cone endpoint from original
                    blastsRef.current = blastsRef.current.map((b) => {
                        if (b.id !== dragged!.id) return b
                        if (b.type === 'cone' && typeof original.x2 === 'number' && typeof original.y2 === 'number') {
                            return {
                                ...b,
                                x: snapped.x,
                                y: snapped.y,
                                x2: (original.x2 as number) + dx,
                                y2: (original.y2 as number) + dy,
                            }
                        }
                        return { ...b, x: snapped.x, y: snapped.y }
                    })
                    renderBlasts(blastLayerRef.current, blastsRef.current, gridSizeRef.current)
                    onBlastMoveRef.current(dragged!.id, snapped.x, snapped.y)
                    // If it's a cone, enter rotation/stretch preview while moving
                    if (dragged.type === 'cone') {
                        const baseX2 = (original.x2 ?? original.x) as number
                        const baseY2 = (original.y2 ?? original.y) as number
                        const lengthInGrids = Math.max(
                            0.1,
                            Math.hypot(baseX2 - original.x, baseY2 - original.y) / gridSizeRef.current
                        )
                        rotatingConeRef.current = {
                            id: dragged.id,
                            apexX: snapped.x,
                            apexY: snapped.y,
                            lengthInGrids,
                            angleRad: Math.atan2(baseY2 - original.y, baseX2 - original.x),
                        }
                        // Set guard to avoid immediate tap confirm from the same click sequence
                        rotationReadyAtRef.current = Date.now() + 180
                    } else {
                        rotatingConeRef.current = null
                    }
                    draggedBlastRef.current = null
                    return
                }

                // Confirm cone rotation on pointerup (if still using pointerup confirm path)
                if (rotatingConeRef.current) {
                    const apex = rotatingConeRef.current
                    const end = lastPointerPosRef.current
                    if (onBlastUpdateConeRef.current) {
                        onBlastUpdateConeRef.current(apex.id, end.x, end.y, apex.apexX, apex.apexY)
                    }
                    // Update local state mirror so preview is removed and texture is correct
                    const updated = blastsRef.current.map((b) =>
                        b.id === apex.id ? { ...b, x: apex.apexX, y: apex.apexY, x2: end.x, y2: end.y } : b
                    )
                    blastsRef.current = updated
                    renderBlasts(blastLayerRef.current, blastsRef.current, gridSizeRef.current)
                    // Clear rotation preview triangle
                    rotatingConeRef.current = null
                    rotationReadyAtRef.current = 0
                    if (blastPreviewLayerRef.current) blastPreviewLayerRef.current.clear()
                    if (blastLabelRef.current) blastLabelRef.current.visible = false
                    return
                }

                // Blast drawing completion
                if (blastDrawModeRef.current && blastDrawStartRef.current && blastPreviewLayerRef.current) {
                    const start = blastDrawStartRef.current
                    // Get the current mouse position from the last move event
                    const snapped = snapToNinePoints(
                        lastPointerPosRef.current.x,
                        lastPointerPosRef.current.y,
                        gridSizeRef.current,
                        snapToGridRef.current
                    )

                    const dx = snapped.x - start.x
                    const dy = snapped.y - start.y

                    if (dx !== 0 || dy !== 0) {
                        const newBlast: Blast = {
                            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                            mapId: mapKeyRef.current || '',
                            type: blastDrawModeRef.current,
                            x: 0,
                            y: 0,
                            alpha: 0.7,
                            locked: false,
                        }

                        if (blastDrawModeRef.current === 'circle') {
                            const widthInGrids = Math.abs(dx) / gridSizeRef.current
                            const heightInGrids = Math.abs(dy) / gridSizeRef.current

                            // Center is midpoint between start and end
                            newBlast.x = start.x + dx / 2
                            newBlast.y = start.y + dy / 2

                            // Radius in grid cells (inscribed circle - half the smaller dimension)
                            newBlast.size = Math.min(widthInGrids, heightInGrids) / 2
                        } else if (blastDrawModeRef.current === 'square') {
                            const widthInGrids = Math.abs(dx) / gridSizeRef.current
                            const heightInGrids = Math.abs(dy) / gridSizeRef.current

                            // Center is midpoint between start and end
                            newBlast.x = start.x + dx / 2
                            newBlast.y = start.y + dy / 2

                            // Store size in grid cells
                            newBlast.size = widthInGrids
                            newBlast.sizeY = heightInGrids
                        } else if (blastDrawModeRef.current === 'cone') {
                            // Create cone with fixed length of 6 grid sizes
                            const distance = Math.sqrt(dx * dx + dy * dy)
                            const directionX = dx / distance
                            const directionY = dy / distance

                            // Constrain length to exactly 6 grid sizes (minimum and maximum)
                            const fixedLength = 6 * gridSizeRef.current

                            newBlast.x = start.x
                            newBlast.y = start.y

                            // Calculate endpoint and snap it to 9 points if snapping is enabled
                            let endX = start.x + directionX * fixedLength
                            let endY = start.y + directionY * fixedLength

                            if (snapToGridRef.current) {
                                const snappedEndpoint = snapToNinePoints(endX, endY, gridSizeRef.current, true)
                                endX = snappedEndpoint.x
                                endY = snappedEndpoint.y
                            }

                            newBlast.x2 = endX
                            newBlast.y2 = endY
                            // Calculate actual length after snapping and convert to grid sizes
                            const actualLength = Math.sqrt((endX - start.x) ** 2 + (endY - start.y) ** 2)
                            newBlast.size = actualLength / gridSizeRef.current
                        }

                        if (onBlastComplete) {
                            onBlastComplete(newBlast)
                        }
                    }

                    blastDrawStartRef.current = null
                    if (blastPreviewLayerRef.current) {
                        blastPreviewLayerRef.current.clear()
                    }
                    if (blastLabelRef.current) {
                        blastLabelRef.current.visible = false
                    }
                }
                if (
                    isWallModeRef.current &&
                    isErasingWallsRef.current &&
                    eraseStartRef.current &&
                    wallLayerRef.current
                ) {
                    const start = eraseStartRef.current
                    const end = erasePreviewRef.current
                    if (end) {
                        const s1 = { x: start.x, y: start.y }
                        const s2 = { x: end.x, y: end.y }
                        const keep: typeof wallsRef.current = []
                        for (const w of wallsRef.current) {
                            const wallShape = w.shape || 'line' // Default to 'line' if undefined
                            let intersects = false
                            if (wallShape === 'line') {
                                intersects = segmentsIntersect(s1, s2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })
                            } else if (wallShape === 'rectangle') {
                                intersects = segmentIntersectsRectangle(s1, s2, w.x1, w.y1, w.x2, w.y2)
                            } else if (wallShape === 'circle') {
                                // Calculate circle center and radius from the bounding box
                                const dx = w.x2 - w.x1
                                const dy = w.y2 - w.y1
                                const centerX = w.x1 + dx / 2
                                const centerY = w.y1 + dy / 2
                                const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                                intersects = segmentHitsCircleBoundary(s1, s2, centerX, centerY, radius)
                            }
                            if (intersects) {
                                continue
                            }
                            keep.push(w)
                        }
                        wallsRef.current = keep
                        onWallsChange?.(
                            keep.map((w) => ({
                                id: w.id,
                                mapId: mapKeyRef.current || '',
                                x1: w.x1,
                                y1: w.y1,
                                x2: w.x2,
                                y2: w.y2,
                                ...(w.shape != null ? { shape: w.shape } : {}),
                                color: w.color ?? DEFAULT_WALL_COLOR,
                                alpha: w.alpha ?? DEFAULT_WALL_ALPHA,
                            })),
                            mapKeyRef.current || ''
                        )
                    }
                    eraseStartRef.current = null
                    erasePreviewRef.current = null
                    // redraw solid walls without preview
                    const g = wallLayerRef.current
                    g.clear()
                    for (const w of wallsRef.current) {
                        const c = w.color ?? DEFAULT_WALL_COLOR
                        const a = w.alpha ?? DEFAULT_WALL_ALPHA
                        g.setStrokeStyle({ width: 3, color: c, alpha: a })

                        const wallShape = w.shape || 'line' // Default to 'line' if undefined
                        if (wallShape === 'line') {
                            g.moveTo(w.x1, w.y1)
                            g.lineTo(w.x2, w.y2)
                            g.stroke()
                        } else if (wallShape === 'rectangle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const width = Math.abs(dx)
                            const height = Math.abs(dy)
                            const x = Math.min(w.x1, w.x2)
                            const y = Math.min(w.y1, w.y2)
                            g.rect(x, y, width, height)
                            g.stroke()
                        } else if (wallShape === 'circle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            g.circle(centerX, centerY, radius)
                            g.stroke()
                        }
                    }
                }
                if (
                    isWallModeRef.current &&
                    wallStartRef.current &&
                    wallLayerRef.current &&
                    wallDrawingShapeRef.current
                ) {
                    // commit current preview as wall segment (if exists and non-zero length)
                    const preview = wallPreviewRef.current
                    if (preview) {
                        const sx = wallStartRef.current.x
                        const sy = wallStartRef.current.y
                        const ex = preview.x
                        const ey = preview.y
                        if (sx !== ex || sy !== ey) {
                            const newWall = {
                                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                                x1: sx,
                                y1: sy,
                                x2: ex,
                                y2: ey,
                                shape: wallDrawingShapeRef.current,
                                color: wallColorRef.current,
                                alpha: wallAlphaRef.current,
                            }
                            const next = [...wallsRef.current, newWall]
                            wallsRef.current = next
                            onWallsChange?.(
                                next.map((w) => ({
                                    id: w.id,
                                    mapId: mapKeyRef.current || '',
                                    x1: w.x1,
                                    y1: w.y1,
                                    x2: w.x2,
                                    y2: w.y2,
                                    shape: w.shape,
                                    color: w.color ?? DEFAULT_WALL_COLOR,
                                    alpha: w.alpha ?? DEFAULT_WALL_ALPHA,
                                })),
                                mapKeyRef.current || ''
                            )
                        }
                    }
                    wallStartRef.current = null
                    wallPreviewRef.current = null
                    // Hide wall label after wall is committed
                    if (wallLabelRef.current) wallLabelRef.current.visible = false
                    // redraw solid walls without preview
                    const g = wallLayerRef.current
                    g.clear()
                    for (const w of wallsRef.current) {
                        const c = w.color ?? DEFAULT_WALL_COLOR
                        const a = w.alpha ?? DEFAULT_WALL_ALPHA
                        g.setStrokeStyle({ width: 3, color: c, alpha: a })

                        const wallShape = w.shape || 'line' // Default to 'line' if undefined
                        if (wallShape === 'line') {
                            g.moveTo(w.x1, w.y1)
                            g.lineTo(w.x2, w.y2)
                            g.stroke()
                        } else if (wallShape === 'rectangle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const width = Math.abs(dx)
                            const height = Math.abs(dy)
                            const x = Math.min(w.x1, w.x2)
                            const y = Math.min(w.y1, w.y2)
                            g.rect(x, y, width, height)
                            g.stroke()
                        } else if (wallShape === 'circle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            g.circle(centerX, centerY, radius)
                            g.stroke()
                        }
                    }
                }
                if (draggingRef.current && draggingRef.current.id) {
                    const endedId = draggingRef.current.id
                    draggingRef.current = { id: null, offsetX: 0, offsetY: 0 }
                    if (dragPreviewRef.current && dragPreviewRef.current.id === endedId) {
                        const indicator = pixiPendingIndicatorsRef.current.get(endedId)
                        if (indicator) {
                            // Check if adding this waypoint would exceed movement (only if combat active)
                            let canAddWaypoint = true

                            if (isCombatActiveRef.current) {
                                const token = tokensRef.current.find((t) => t.id === endedId)
                                const currentMovement = token?.stats?.currentMovement ?? 0
                                const step = gridSizeRef.current
                                let totalDistance = 0
                                const pts = indicator.points
                                for (let i = 1; i < pts.length; i++) {
                                    const dxs = Math.abs(pts[i].x - pts[i - 1].x)
                                    const dys = Math.abs(pts[i].y - pts[i - 1].y)
                                    totalDistance += Math.hypot(dxs, dys) / step
                                }
                                const last = pts[pts.length - 1]
                                const dxp = Math.abs(dragPreviewRef.current.x - last.x)
                                const dyp = Math.abs(dragPreviewRef.current.y - last.y)
                                totalDistance += Math.hypot(dxp, dyp) / step

                                // Only add waypoint if within movement limit when combat is active
                                canAddWaypoint = Math.round(totalDistance) <= currentMovement
                            }

                            if (canAddWaypoint) {
                                indicator.points.push({ x: dragPreviewRef.current.x, y: dragPreviewRef.current.y })
                                indicator.updatePosition(dragPreviewRef.current.x, dragPreviewRef.current.y)
                            }
                        }
                        // dragged -> not a click
                        clickCandidateRef.current = null
                    } else {
                        // treat as click (no drag preview)
                        const cand = clickCandidateRef.current
                        if (
                            cand &&
                            cand.id === endedId &&
                            !isWallModeRef.current &&
                            !isMeasuringRef.current &&
                            typeof onTokenClick === 'function'
                        ) {
                            onTokenClick(cand.id)
                        }
                    }
                    dragPreviewRef.current = null
                }
                clickCandidateRef.current = null
                if (measureStartRef.current) {
                    measureStartRef.current = null
                    if (measureLayerRef.current) measureLayerRef.current.clear()
                    if (measureLabelRef.current) measureLabelRef.current.visible = false
                }
            }
            viewport.on('pointerup', endDrag)
            viewport.on('pointerupoutside', endDrag)
            viewport.on('pointercancel', endDrag)

            // Accept/Cancel handlers for token drag are bound per overlay
            viewport.on('pointermove', (e: FederatedPointerEvent) => {
                const global = viewport.toWorld(e.global)

                // Cone rotation preview (apex → rotate → confirm)
                if (rotatingConeRef.current && blastPreviewLayerRef.current) {
                    const { apexX, apexY, lengthInGrids } = rotatingConeRef.current
                    const dx = global.x - apexX
                    const dy = global.y - apexY
                    // Keep constant length during rotation preview (no size change)
                    const lenToUse = lengthInGrids * gridSizeRef.current
                    const angle = Math.atan2(dy, dx)
                    const end = endpointFromAngleLength(
                        apexX,
                        apexY,
                        angle,
                        lenToUse,
                        gridSizeRef.current,
                        snapToGridRef.current
                    )
                    drawBlastPreview(
                        blastPreviewLayerRef.current,
                        'cone',
                        apexX,
                        apexY,
                        end.x,
                        end.y,
                        gridSizeRef.current
                    )
                    lastPointerPosRef.current = { x: end.x, y: end.y }
                    return
                }

                // Store last pointer position for endDrag
                lastPointerPosRef.current = { x: global.x, y: global.y }

                // Handle blast dragging
                if (draggedBlastRef.current && onBlastMove) {
                    const snapped = snapToNinePoints(global.x, global.y, gridSizeRef.current, snapToGridRef.current)
                    const dragged = draggedBlastRef.current
                    const original = draggedBlastStartRef.current
                    // Compute delta from original apex so endpoint translates consistently
                    const dx = snapped.x - (original?.x ?? dragged.x)
                    const dy = snapped.y - (original?.y ?? dragged.y)
                    // Build preview: apex moves to snapped; if cone, translate endpoint by same delta
                    const tempBlasts = blastsRef.current.map((b) => {
                        if (b.id !== dragged.id) return b
                        if (
                            b.type === 'cone' &&
                            typeof (original?.x2 ?? b.x2) === 'number' &&
                            typeof (original?.y2 ?? b.y2) === 'number'
                        ) {
                            const baseX2 = (original?.x2 ?? b.x2) as number
                            const baseY2 = (original?.y2 ?? b.y2) as number
                            return { ...b, x: snapped.x, y: snapped.y, x2: baseX2 + dx, y2: baseY2 + dy }
                        }
                        return { ...b, x: snapped.x, y: snapped.y }
                    })
                    renderBlasts(blastLayerRef.current, tempBlasts, gridSizeRef.current)
                    // For cones, also show live stretch/rotation preview overlay
                    if (dragged.type === 'cone' && blastPreviewLayerRef.current) {
                        const apexX = snapped.x
                        const apexY = snapped.y
                        const baseX2 = original?.x2 ?? dragged.x2 ?? apexX
                        const baseY2 = original?.y2 ?? dragged.y2 ?? apexY
                        const endX = baseX2 + dx
                        const endY = baseY2 + dy
                        drawBlastPreview(
                            blastPreviewLayerRef.current,
                            'cone',
                            apexX,
                            apexY,
                            endX,
                            endY,
                            gridSizeRef.current
                        )
                    }
                    return
                }

                // hover cursor over tokens and show tooltip
                if (!isWallModeRef.current && !isMeasuringRef.current) {
                    let over = false
                    let hoveredTokenData: Token | null = null

                    for (const t of tokensRef.current) {
                        const pending = pixiPendingIndicatorsRef.current.get(t.id)
                        const tx = pending ? pending.endX : t.x
                        const ty = pending ? pending.endY : t.y
                        const d = Math.hypot(tx - global.x, ty - global.y)
                        if (d <= t.radius) {
                            over = true
                            hoveredTokenData = t
                            break
                        }
                    }

                    viewport.cursor = over ? 'pointer' : 'default'

                    // Update PixiTooltip
                    if (hoveredTokenData && hoveredTokenData.stats) {
                        // Check if it's not a default token
                        const isDefaultToken =
                            (hoveredTokenData.id === 'EASY' ||
                                hoveredTokenData.id === 'TYPICAL' ||
                                hoveredTokenData.id === 'DANGEROUS' ||
                                hoveredTokenData.id === 'DEADLY') &&
                            hoveredTokenData.mapId === ''

                        if (!isDefaultToken) {
                            // Create or update PixiTooltip
                            if (!pixiTooltipRef.current) {
                                pixiTooltipRef.current = createPixiTooltip({
                                    token: hoveredTokenData,
                                    x: global.x,
                                    y: global.y,
                                    screenWidth: window.innerWidth,
                                    screenHeight: window.innerHeight,
                                    zoom: viewport.scale.x,
                                    viewport: viewport,
                                })
                            } else {
                                pixiTooltipRef.current.updateToken(hoveredTokenData)
                                pixiTooltipRef.current.updatePosition({
                                    token: hoveredTokenData,
                                    x: global.x,
                                    y: global.y,
                                    screenWidth: window.innerWidth,
                                    screenHeight: window.innerHeight,
                                    zoom: viewport.scale.x,
                                    viewport: viewport,
                                })
                            }
                            pixiTooltipRef.current.show()
                            hoveredTokenRef.current = hoveredTokenData
                        } else {
                            pixiTooltipRef.current?.hide()
                            hoveredTokenRef.current = null
                        }
                    } else {
                        pixiTooltipRef.current?.hide()
                        hoveredTokenRef.current = null
                    }
                }
                if (
                    isWallModeRef.current &&
                    isErasingWallsRef.current &&
                    eraseStartRef.current &&
                    wallLayerRef.current
                ) {
                    // live eraser preview line
                    const g = wallLayerRef.current
                    const sx = eraseStartRef.current.x
                    const sy = eraseStartRef.current.y
                    const ex = global.x
                    const ey = global.y
                    erasePreviewRef.current = { x: ex, y: ey }
                    g.clear()
                    // draw existing walls, highlighting only the ones intersected by the eraser segment
                    for (const w of wallsRef.current) {
                        const wallShape = w.shape || 'line' // Default to 'line' if undefined
                        let hit = false
                        if (wallShape === 'line') {
                            hit = segmentsIntersect(
                                { x: sx, y: sy },
                                { x: ex, y: ey },
                                { x: w.x1, y: w.y1 },
                                { x: w.x2, y: w.y2 }
                            )
                        } else if (wallShape === 'rectangle') {
                            hit = segmentIntersectsRectangle({ x: sx, y: sy }, { x: ex, y: ey }, w.x1, w.y1, w.x2, w.y2)
                        } else if (wallShape === 'circle') {
                            // Calculate circle center and radius from the bounding box
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            hit = segmentHitsCircleBoundary(
                                { x: sx, y: sy },
                                { x: ex, y: ey },
                                centerX,
                                centerY,
                                radius
                            )
                        }
                        const c = w.color ?? DEFAULT_WALL_COLOR
                        const a = w.alpha ?? DEFAULT_WALL_ALPHA
                        g.setStrokeStyle({ width: 3, color: hit ? 0xff0000 : c, alpha: hit ? 0.95 : a })

                        if (wallShape === 'line') {
                            g.moveTo(w.x1, w.y1)
                            g.lineTo(w.x2, w.y2)
                            g.stroke()
                        } else if (wallShape === 'rectangle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const width = Math.abs(dx)
                            const height = Math.abs(dy)
                            const x = Math.min(w.x1, w.x2)
                            const y = Math.min(w.y1, w.y2)
                            g.rect(x, y, width, height)
                            g.stroke()
                        } else if (wallShape === 'circle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            g.circle(centerX, centerY, radius)
                            g.stroke()
                        }
                    }
                    // draw eraser preview line in bright red
                    g.setStrokeStyle({ width: 2, color: 0xff0000, alpha: 0.9 })
                    g.moveTo(sx, sy)
                    g.lineTo(ex, ey)
                    g.stroke()
                    return
                }
                // Blast drawing preview
                if (blastDrawModeRef.current && blastDrawStartRef.current && blastPreviewLayerRef.current) {
                    // Snap during preview if snapToGrid is enabled
                    const snapped = snapToNinePoints(global.x, global.y, gridSizeRef.current, snapToGridRef.current)
                    // Only draw preview for adaptable blasts (not grenade)
                    if (blastDrawModeRef.current !== 'grenade') {
                        const { sizeText, labelX, labelY } = drawBlastPreview(
                            blastPreviewLayerRef.current,
                            blastDrawModeRef.current,
                            blastDrawStartRef.current.x,
                            blastDrawStartRef.current.y,
                            snapped.x,
                            snapped.y,
                            gridSizeRef.current
                        )

                        // Update label
                        if (blastLabelRef.current && sizeText) {
                            blastLabelRef.current.text = sizeText
                            blastLabelRef.current.position.set(labelX, labelY)
                            blastLabelRef.current.visible = true
                        }
                    }
                    return
                }

                // Only check blast hover if no token is hovered (tokens take precedence)
                if (!isWallModeRef.current && !isMeasuringRef.current && viewport.cursor === 'default') {
                    const hoveredBlast = blastsRef.current.find((blast) => {
                        const dx = global.x - blast.x
                        const dy = global.y - blast.y
                        if (blast.type === 'grenade') {
                            const radius = (gridSizeRef.current * 5) / 2
                            return Math.hypot(dx, dy) <= radius
                        } else if (blast.type === 'circle') {
                            const radius = gridSizeRef.current * (blast.size || 0)
                            return Math.hypot(dx, dy) <= radius
                        } else if (blast.type === 'square') {
                            const width = gridSizeRef.current * (blast.size || 0)
                            const height = gridSizeRef.current * (blast.sizeY || blast.size || 0)
                            return Math.abs(dx) <= width / 2 && Math.abs(dy) <= height / 2
                        } else if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
                            // Precise point-in-cone using triangle from calculateConePoints (28°)
                            const points = calculateConePoints(blast.x, blast.y, blast.x2, blast.y2, 28)
                            const ax = points[0].x
                            const ay = points[0].y
                            const bx = points[1].x // left base point
                            const by = points[1].y
                            const cx = points[2].x // right base point
                            const cy = points[2].y

                            // Barycentric coordinate check
                            const v0x = cx - ax
                            const v0y = cy - ay
                            const v1x = bx - ax
                            const v1y = by - ay
                            const v2x = global.x - ax
                            const v2y = global.y - ay

                            const dot00 = v0x * v0x + v0y * v0y
                            const dot01 = v0x * v1x + v0y * v1y
                            const dot02 = v0x * v2x + v0y * v2y
                            const dot11 = v1x * v1x + v1y * v1y
                            const dot12 = v1x * v2x + v1y * v2y

                            const invDen = 1 / (dot00 * dot11 - dot01 * dot01)
                            const u = (dot11 * dot02 - dot01 * dot12) * invDen
                            const v = (dot00 * dot12 - dot01 * dot02) * invDen

                            return u >= 0 && v >= 0 && u + v <= 1
                        }
                        return false
                    })
                    if (hoveredBlast) {
                        viewport.cursor = hoveredBlast.locked ? 'default' : 'grab'
                    }
                }

                if (
                    isWallModeRef.current &&
                    wallStartRef.current &&
                    wallLayerRef.current &&
                    wallDrawingShapeRef.current
                ) {
                    const snapped = snapToNinePoints(global.x, global.y, gridSizeRef.current, snapToGridRef.current)
                    const ex = snapped.x
                    const ey = snapped.y
                    wallPreviewRef.current = { x: ex, y: ey }
                    const g = wallLayerRef.current
                    g.clear()
                    // redraw existing walls using their own stored colors/alphas
                    for (const w of wallsRef.current) {
                        const c = w.color ?? DEFAULT_WALL_COLOR
                        const a = w.alpha ?? DEFAULT_WALL_ALPHA
                        g.setStrokeStyle({ width: 3, color: c, alpha: a })

                        const wallShape = w.shape || 'line' // Default to 'line' if undefined
                        if (wallShape === 'line') {
                            g.moveTo(w.x1, w.y1)
                            g.lineTo(w.x2, w.y2)
                            g.stroke()
                        } else if (wallShape === 'rectangle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const width = Math.abs(dx)
                            const height = Math.abs(dy)
                            const x = Math.min(w.x1, w.x2)
                            const y = Math.min(w.y1, w.y2)
                            g.rect(x, y, width, height)
                            g.stroke()
                        } else if (wallShape === 'circle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            g.circle(centerX, centerY, radius)
                            g.stroke()
                        }
                    }
                    // preview new wall in current picker color
                    g.setStrokeStyle({ width: 3, color: wallColorRef.current, alpha: wallAlphaRef.current })

                    const shape = wallDrawingShapeRef.current
                    if (shape === 'line') {
                        g.moveTo(wallStartRef.current.x, wallStartRef.current.y)
                        g.lineTo(ex, ey)
                        g.stroke()
                    } else if (shape === 'rectangle') {
                        const dx = ex - wallStartRef.current.x
                        const dy = ey - wallStartRef.current.y
                        const width = Math.abs(dx)
                        const height = Math.abs(dy)
                        const x = Math.min(wallStartRef.current.x, ex)
                        const y = Math.min(wallStartRef.current.y, ey)
                        g.rect(x, y, width, height)
                        g.stroke()
                    } else if (shape === 'circle') {
                        const dx = ex - wallStartRef.current.x
                        const dy = ey - wallStartRef.current.y
                        const centerX = wallStartRef.current.x + dx / 2
                        const centerY = wallStartRef.current.y + dy / 2
                        const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                        g.circle(centerX, centerY, radius)
                        g.stroke()
                    }

                    // Show wall dimensions label
                    const wallLabel = wallLabelRef.current
                    if (wallLabel) {
                        const dx = ex - wallStartRef.current.x
                        const dy = ey - wallStartRef.current.y

                        let labelText = ''
                        let labelX = ex + 8
                        let labelY = ey - 8

                        if (shape === 'line') {
                            const length = Math.sqrt(dx * dx + dy * dy)
                            const gridLength = snapToGridRef.current
                                ? Math.round(length / gridSizeRef.current)
                                : (length / gridSizeRef.current).toFixed(2)
                            labelText = snapToGridRef.current ? `${gridLength}` : `${gridLength}`
                        } else if (shape === 'rectangle') {
                            const width = Math.abs(dx) / gridSizeRef.current
                            const height = Math.abs(dy) / gridSizeRef.current
                            const widthText = snapToGridRef.current ? Math.round(width) : width.toFixed(1)
                            const heightText = snapToGridRef.current ? Math.round(height) : height.toFixed(1)
                            labelText = `${widthText}x${heightText}`
                            labelX = wallStartRef.current.x + dx / 2
                            labelY = wallStartRef.current.y + dy / 2 - 20
                        } else if (shape === 'circle') {
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2 / gridSizeRef.current
                            const radiusText = snapToGridRef.current ? Math.round(radius) : radius.toFixed(1)
                            labelText = `r=${radiusText}`
                            labelX = wallStartRef.current.x + dx / 2
                            labelY = wallStartRef.current.y + dy / 2 - radius - 20
                        }

                        wallLabel.text = labelText
                        wallLabel.style.fontSize = Math.max(24, 24 / Math.max(0.1, viewport.scale.x))
                        wallLabel.visible = true
                        wallLabel.x = labelX
                        wallLabel.y = labelY
                    }
                    return
                }
                if (!draggingRef.current || !draggingRef.current.id) return
                let nx = global.x - draggingRef.current.offsetX
                let ny = global.y - draggingRef.current.offsetY
                // movement threshold cancels click candidate
                const cand = clickCandidateRef.current
                if (cand) {
                    const moved = Math.hypot(global.x - cand.x, global.y - cand.y)
                    if (moved > 4) clickCandidateRef.current = null
                }
                if (snapToGridRef.current) {
                    const snapped = snapToNinePoints(nx, ny, gridSizeRef.current, snapToGridRef.current)
                    nx = snapped.x
                    ny = snapped.y
                }
                // preview draw only (do not commit move yet), include any other pending previews
                renderTokensWithPending(
                    tokenLayerRef.current,
                    tokensRef.current,
                    new Map(
                        Array.from(pixiPendingIndicatorsRef.current.entries()).map(([id, ind]) => [
                            id,
                            { endX: ind.endX, endY: ind.endY },
                        ])
                    ),
                    draggingRef.current.id,
                    nx,
                    ny
                )
                dragPreviewRef.current = { id: draggingRef.current.id, x: nx, y: ny }
                // draw/update pending overlay for this token
                const start = dragStartRef.current
                if (start) {
                    upsertPendingOverlay(draggingRef.current.id, start.x, start.y, nx, ny)
                }
            })

            // Measurement move
            viewport.on('pointermove', (e) => {
                if (!measureStartRef.current) return
                const global = viewport.toWorld(e.global)
                const step = gridSizeRef.current
                const sx = measureStartRef.current.x
                const sy = measureStartRef.current.y
                const endSnapped = snapToNinePoints(global.x, global.y, step, snapToGridRef.current)
                const ex = endSnapped.x
                const ey = endSnapped.y
                const dx = Math.abs(ex - sx)
                const dy = Math.abs(ey - sy)
                // Measure distance in grid cells (9-point snapping gives precision, but display in cells)
                const cells = Math.hypot(dx, dy) / step
                const g = measureLayerRef.current
                if (!g) return
                g.clear()
                g.setStrokeStyle({ width: 2, color: 0xff3b81, alpha: 0.9 })
                g.moveTo(sx, sy)
                g.lineTo(ex, ey)
                g.stroke()
                // draw endpoints
                g.circle(sx, sy, 3).fill({ color: 0xff3b81 })
                g.circle(ex, ey, 3).fill({ color: 0xff3b81 })
                // label
                const label = measureLabelRef.current
                if (label) {
                    const txt = snapToGridRef.current ? `${Math.round(cells * 2)}m` : `${(cells * 2).toFixed(2)}m`
                    label.text = txt
                    const zoom = viewportRef.current ? Math.max(0.1, viewportRef.current.scale.x) : 1
                    label.style.fontSize = Math.max(24, 24 / zoom)
                    label.visible = true
                    // position label near the measurement end point
                    label.x = ex + 8
                    label.y = ey - 8
                    // ensure label renders on top
                    if (label.parent) {
                        label.parent.addChild(label)
                    }
                }
            })

            // Expose accept/cancel-all controls
            onBindPendingControls?.(acceptAllPending, cancelAllPending)
        }

        init()
        return () => {
            destroyed = true

            // Remove keyboard event listeners
            if (keyDownHandlerRef.current) {
                window.removeEventListener('keydown', keyDownHandlerRef.current)
                keyDownHandlerRef.current = null
            }
            if (keyUpHandlerRef.current) {
                window.removeEventListener('keyup', keyUpHandlerRef.current)
                keyUpHandlerRef.current = null
            }

            if (globalCtxBlockerRef.current) {
                document.removeEventListener('contextmenu', globalCtxBlockerRef.current, true)
                globalCtxBlockerRef.current = null
            }

            const canvasEl = appRef.current?.canvas
            if (canvasEl && preventContextMenuRef.current) {
                canvasEl.removeEventListener('contextmenu', preventContextMenuRef.current, true)
                preventContextMenuRef.current = null
            }
            if (canvasEl && preventRightMouseDownRef.current) {
                canvasEl.removeEventListener('mousedown', preventRightMouseDownRef.current, true)
                preventRightMouseDownRef.current = null
            }

            if (appRef.current) {
                appRef.current.destroy(true)
                appRef.current = null
            }
            // Remove visibility handler
            document.removeEventListener('visibilitychange', onVisibility)
            // Clear token renderer caches to release Sprite/Text references
            clearTokenRendererCaches()
            // Clear blast renderer caches to release Sprite/Mask references
            clearBlastRendererCaches()
            // Clear PixiTooltip
            if (pixiTooltipRef.current) {
                pixiTooltipRef.current.destroy()
                pixiTooltipRef.current = null
            }
            // Clear PixiPendingIndicators
            pixiPendingIndicatorsRef.current.forEach((indicator) => indicator.destroy())
            pixiPendingIndicatorsRef.current.clear()
            viewportRef.current = null
            gridRef.current = null
            // No document-level handlers to remove
        }
    }, [pixiHostReady])
    // Cleanup on unmount to ensure Pixi resources are properly disposed
    useEffect(() => {
        return () => {
            if (appRef.current) {
                appRef.current.destroy(true)
                appRef.current = null
            }
            clearTokenRendererCaches()
            clearBlastRendererCaches()
            viewportRef.current = null
            gridRef.current = null
        }
    }, [])
    // Resize handler
    useEffect(() => {
        if (!appRef.current || !viewportRef.current) return
        appRef.current.renderer.resize(width, height)
        viewportRef.current.resize(width, height, worldDims.worldWidth, worldDims.worldHeight)
        // Redraw grid aligned to current target size after resize
        if (gridRef.current) {
            const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
            gridRef.current.clear()
            drawGrid(gridRef.current, gw, gh, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)
        }
        // redraw tokens after resize
        renderTokens(tokenLayerRef.current, tokens)
    }, [width, height, worldDims, gridSize])
    // Keep measuring ref in sync so event handlers see latest value
    useEffect(() => {
        isMeasuringRef.current = isMeasuring
        // Hide PixiTooltip when entering measuring mode
        if (isMeasuring) {
            pixiTooltipRef.current?.hide()
            hoveredTokenRef.current = null
        }
    }, [isMeasuring])
    // When measure toggles off, clear overlay; no need to pause drag since it's on middle button
    useEffect(() => {
        if (!isMeasuring) {
            if (measureStartRef.current) measureStartRef.current = null
            if (measureLayerRef.current) measureLayerRef.current.clear()
            if (measureLabelRef.current) measureLabelRef.current.visible = false
        }
    }, [isMeasuring])
    // When wall mode toggles off, hide wall label
    useEffect(() => {
        if (!isWallMode) {
            if (wallLabelRef.current) wallLabelRef.current.visible = false
        } else {
            // Hide PixiTooltip when entering wall mode
            pixiTooltipRef.current?.hide()
            hoveredTokenRef.current = null
        }
    }, [isWallMode])
    // Sync bg texture ref and apply when either texture prop or viewport becomes available
    useEffect(() => {
        bgTextureRef.current = mapTexture ?? null
        if (!viewportRef.current || !backgroundRef.current) {
            return
        }
        if (mapTexture) {
            applyBackgroundTexture(
                mapTexture,
                viewportRef.current,
                backgroundRef,
                gridRef,
                gridSizeRef.current,
                gridColorRef.current,
                gridAlphaRef.current
            )
        } else {
            // Create a white texture for the background
            const canvas = document.createElement('canvas')
            canvas.width = 1
            canvas.height = 1
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, 1, 1)
            }
            const whiteTexture = Texture.from(canvas)
            backgroundRef.current.texture = whiteTexture
            backgroundRef.current.tint = 0x000000
            // Redraw grid to world size when no background
            if (gridRef.current) {
                gridRef.current.clear()
                drawGrid(
                    gridRef.current,
                    worldDims.worldWidth,
                    worldDims.worldHeight,
                    gridSizeRef.current,
                    gridColorRef.current,
                    gridAlphaRef.current
                )
            }
        }
        // Set ready after background is applied
        if (!pixiReady) {
            pixiSetReady(true)
        }
    }, [mapTexture, pixiReady, worldDims])
    // Create and bind fit function with current dimensions
    useEffect(() => {
        if (!viewportRef.current) return
        if (!onBindFit) return
        const viewport = viewportRef.current
        const fitFn = () => {
            const { w, h } = getTargetSize(backgroundRef.current, worldDims)
            const sw = viewport.screenWidth - pixiSidePanelWidth
            const sh = viewport.screenHeight
            const scale = Math.min(sw / w, sh / h)
            viewport.setZoom(scale, true)

            // Center in the available space (left side, not including panels on right)
            // The center of available space in screen coords is at: sw/2
            // We want world center (w/2, h/2) to appear at that screen position
            viewport.moveCorner(w / 2 - sw / scale / 2, h / 2 - sh / scale / 2)
        }
        onBindFit(fitFn)
    }, [onBindFit, worldDims, pixiSidePanelWidth])
    // Redraw tokens on token prop change, start movement animations (single segment) for non-pending external moves
    useEffect(() => {
        // Guard: Don't render if board isn't ready yet
        if (!pixiReady) return

        tokensRef.current = tokens
        const prev = prevTokensRef.current
        const prevById = new Map<string, Token>(prev.map((t) => [t.id, t]))
        let anyAnimated = false
        // Build animation entries for moved tokens that are not currently pending and not already animating
        for (const t of tokens) {
            const p = prevById.get(t.id)
            if (!p) continue
            if (pixiPendingIndicatorsRef.current.has(t.id)) continue
            if (animationsRef.current.has(t.id)) continue
            if (p.x !== t.x || p.y !== t.y) {
                schedulePathAnimation(
                    t.id,
                    [
                        { x: p.x, y: p.y },
                        { x: t.x, y: t.y },
                    ],
                    gridSizeRef.current,
                    animationsRef.current
                )
                anyAnimated = true
            }
        }
        prevTokensRef.current = tokens
        if (anyAnimated) {
            // Render once at animation start to avoid flicker
            const override = new Map<string, { endX: number; endY: number }>()
            for (const [id, a] of animationsRef.current) {
                const first = a.segments[0]
                if (first) override.set(id, { endX: first.sx, endY: first.sy })
            }
            // Merge pending endpoints (take precedence)
            for (const [id, indicator] of pixiPendingIndicatorsRef.current) {
                override.set(id, { endX: indicator.endX, endY: indicator.endY })
            }
            const live = dragPreviewRef.current
            renderTokensWithPending(tokenLayerRef.current, tokensRef.current, override, live?.id, live?.x, live?.y)
        } else {
            // No animations; check if there are pending moves
            if (pixiPendingIndicatorsRef.current.size > 0) {
                const pendingMap = new Map(
                    Array.from(pixiPendingIndicatorsRef.current.entries()).map(([id, ind]) => [
                        id,
                        { endX: ind.endX, endY: ind.endY },
                    ])
                )
                renderTokensWithPending(tokenLayerRef.current, tokens, pendingMap)
            } else {
                // No pending moves, just render tokens normally
                renderTokens(tokenLayerRef.current, tokens)
            }
        }
    }, [tokens, images, pixiReady])
    // Render blasts when they change
    useEffect(() => {
        if (!pixiReady) return
        blastsRef.current = blasts
        blastsNotInMapRef.current = blastsNotInMap
        renderBlasts(blastLayerRef.current, blasts, gridSize)
    }, [blasts, blastsNotInMap, gridSize, pixiReady])
    // Keep refs in sync
    useEffect(() => {
        gridSizeRef.current = gridSize
        if (gridRef.current) {
            const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
            gridRef.current.clear()
            drawGrid(gridRef.current, gw, gh, gridSize, gridColorRef.current, gridAlphaRef.current)
        }
    }, [gridSize, worldDims])
    useEffect(() => {
        snapToGridRef.current = snapToGrid
    }, [snapToGrid])
    useEffect(() => {
        blastDrawModeRef.current = blastDrawMode
    }, [blastDrawMode])
    useEffect(() => {
        gridColorRef.current = gridColor
    }, [gridColor])
    useEffect(() => {
        gridAlphaRef.current = gridAlpha
    }, [gridAlpha])
    useEffect(() => {
        wallColorRef.current = wallColor
    }, [wallColor])
    useEffect(() => {
        wallAlphaRef.current = wallAlpha
    }, [wallAlpha])
    useEffect(() => {
        isCombatActiveRef.current = isCombatActive
    }, [isCombatActive])
    useEffect(() => {
        isMeasuringRef.current = isMeasuring
    }, [isMeasuring])
    useEffect(() => {
        isWallModeRef.current = isWallMode
    }, [isWallMode])
    useEffect(() => {
        wallDrawingShapeRef.current = wallDrawingShape
    }, [wallDrawingShape])
    useEffect(() => {
        isErasingWallsRef.current = isErasingWalls
        // clear any in-progress draw when toggling eraser
        wallStartRef.current = null
        wallPreviewRef.current = null
        eraseStartRef.current = null
        erasePreviewRef.current = null
        // Hide wall label when switching to erase mode
        if (wallLabelRef.current) wallLabelRef.current.visible = false
        if (wallLayerRef.current) {
            const g = wallLayerRef.current
            g.clear()
            for (const w of wallsRef.current) {
                const c = w.color ?? DEFAULT_WALL_COLOR
                const a = w.alpha ?? DEFAULT_WALL_ALPHA
                g.setStrokeStyle({ width: 3, color: c, alpha: a })

                const wallShape = w.shape || 'line' // Default to 'line' if undefined
                if (wallShape === 'line') {
                    g.moveTo(w.x1, w.y1)
                    g.lineTo(w.x2, w.y2)
                    g.stroke()
                } else if (wallShape === 'rectangle') {
                    const dx = w.x2 - w.x1
                    const dy = w.y2 - w.y1
                    const width = Math.abs(dx)
                    const height = Math.abs(dy)
                    const x = Math.min(w.x1, w.x2)
                    const y = Math.min(w.y1, w.y2)
                    g.rect(x, y, width, height)
                    g.stroke()
                } else if (wallShape === 'circle') {
                    const dx = w.x2 - w.x1
                    const dy = w.y2 - w.y1
                    const centerX = w.x1 + dx / 2
                    const centerY = w.y1 + dy / 2
                    const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                    g.circle(centerX, centerY, radius)
                    g.stroke()
                }
            }
        }
    }, [isErasingWalls])

    return (
        <>
            <div
                ref={hostRef}
                style={{ width: '100%', height: '100%', position: 'relative' }}
                onDragEnter={(e) => {
                    e.preventDefault()
                    const allowed = e.dataTransfer.effectAllowed
                    if (allowed === 'copy' || allowed === 'copyMove') {
                        e.dataTransfer.dropEffect = 'copy'
                    } else {
                        e.dataTransfer.dropEffect = 'move'
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault()
                    // Match the dropEffect with effectAllowed from the drag source
                    // Grenade sets effectAllowed='copy', others set 'move'
                    const allowed = e.dataTransfer.effectAllowed
                    if (allowed === 'copy' || allowed === 'copyMove') {
                        e.dataTransfer.dropEffect = 'copy'
                    } else {
                        e.dataTransfer.dropEffect = 'move'
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault()

                    try {
                        const droppedData = JSON.parse(e.dataTransfer.getData('application/json'))

                        // Get viewport reference from appRef
                        const app = appRef.current
                        if (!app) return

                        const vp = app.stage.children[0] as unknown as Viewport
                        if (!vp) return

                        // Convert drop coordinates to world coordinates
                        const rect = hostRef.current?.getBoundingClientRect()
                        if (!rect) return

                        const clientX = e.clientX - rect.left
                        const clientY = e.clientY - rect.top
                        const worldPos = vp.toWorld({ x: clientX, y: clientY })

                        let finalX = worldPos.x
                        let finalY = worldPos.y

                        // Apply snapping if enabled
                        if (snapToGridRef.current) {
                            const snapped = snapToNinePoints(worldPos.x, worldPos.y, gridSizeRef.current, true)
                            finalX = snapped.x
                            finalY = snapped.y
                        }

                        // Check if it's a blast or token (check type first since blasts can have both id and type)
                        if (droppedData?.type && ['grenade', 'circle', 'square', 'cone'].includes(droppedData.type)) {
                            // It's a blast
                            if (droppedData.type === 'cone') {
                                // For cone templates, initiate 2-step placement process
                                const coneLength = 6 // Always 6 grid cells
                                rotatingConeRef.current = {
                                    id: droppedData.id || globalThis.crypto?.randomUUID?.() || String(Date.now()),
                                    apexX: finalX,
                                    apexY: finalY,
                                    lengthInGrids: coneLength,
                                    angleRad: 0, // Default angle
                                }
                                rotationReadyAtRef.current = Date.now() + 180
                                // Trigger preview update
                                if (blastPreviewLayerRef.current) {
                                    drawBlastPreview(
                                        blastPreviewLayerRef.current,
                                        'cone',
                                        finalX,
                                        finalY,
                                        finalX + coneLength * gridSizeRef.current,
                                        finalY,
                                        gridSizeRef.current
                                    )
                                }
                            } else if (onBlastDrop) {
                                onBlastDrop(droppedData, finalX, finalY)
                            }
                        } else if (droppedData?.id) {
                            // Check if it's an existing cone blast being moved
                            const existingBlast = [...blastsRef.current, ...blastsNotInMapRef.current].find(
                                (b) => b.id === droppedData.id
                            )
                            if (existingBlast?.type === 'cone') {
                                // For existing cones, update local state immediately, set up rotation mode, then update database
                                const dx = finalX - existingBlast.x
                                const dy = finalY - existingBlast.y
                                const movedBlast = {
                                    ...existingBlast,
                                    x: finalX,
                                    y: finalY,
                                    x2: existingBlast.x2 ? existingBlast.x2 + dx : finalX,
                                    y2: existingBlast.y2 ? existingBlast.y2 + dy : finalY,
                                }

                                // Update local state immediately
                                const wasInBlastsNotInMap = blastsNotInMapRef.current.some(
                                    (b) => b.id === droppedData.id
                                )
                                if (wasInBlastsNotInMap) {
                                    blastsNotInMapRef.current = blastsNotInMapRef.current.filter(
                                        (b) => b.id !== droppedData.id
                                    )
                                    blastsRef.current = [...blastsRef.current, movedBlast]
                                } else {
                                    blastsRef.current = blastsRef.current.map((b) =>
                                        b.id === droppedData.id ? movedBlast : b
                                    )
                                }

                                // Set up rotation mode
                                const coneLength = Math.max(
                                    0.1,
                                    Math.hypot(
                                        (movedBlast.x2 ?? movedBlast.x) - movedBlast.x,
                                        (movedBlast.y2 ?? movedBlast.y) - movedBlast.y
                                    ) / gridSizeRef.current
                                )
                                rotatingConeRef.current = {
                                    id: droppedData.id,
                                    apexX: finalX,
                                    apexY: finalY,
                                    lengthInGrids: coneLength,
                                    angleRad: Math.atan2(
                                        (movedBlast.y2 ?? movedBlast.y) - movedBlast.y,
                                        (movedBlast.x2 ?? movedBlast.x) - movedBlast.x
                                    ),
                                }
                                rotationReadyAtRef.current = Date.now() + 180
                                // Database update happens on confirmation
                            } else {
                                // It's a token
                                if (onTokenDrop) {
                                    onTokenDrop(droppedData.id, finalX, finalY)
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error handling drop:', error)
                    }
                }}
            >
                {/* Show loading spinner overlay while PIXI initializes */}
                {!pixiReady && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: readerMode ? colors.grays.gray900 : colors.cyberpunk.darkBg,
                            color: readerMode ? colors.neons.blue.default : colors.neons.cyan.default,
                            fontFamily: '"Orbitron", monospace',
                            fontSize: '18px',
                            flexDirection: 'column',
                            gap: '20px',
                            zIndex: 9999,
                        }}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                border: `3px solid ${
                                    readerMode ? colors.neons.blue.default : colors.neons.cyan.default
                                }`,
                                borderTop: `3px solid ${colors.neons.pink.default}`,
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <div>INITIALIZING COMBAT SIMULATOR...</div>
                        <style>
                            {`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}
                        </style>
                    </div>
                )}
            </div>
            <BlastContextMenu
                anchorEl={pixiBlastContextMenuAnchor}
                blastId={pixiSelectedBlastId}
                isLocked={Boolean(blastsRef.current.find?.((b) => b.id === pixiSelectedBlastId)?.locked)}
                onDelete={(id) => onBlastDelete?.(id)}
                onCopy={(id) => onBlastCopy?.(id)}
                onCut={(id) => onBlastCut?.(id)}
                onLock={(id, locked) => onBlastLock?.(id, locked)}
                onClose={closeContextMenus}
            />
            <TokenContextMenu
                anchorEl={pixiTokenContextMenuAnchor}
                tokenId={pixiSelectedTokenId}
                onDelete={openDeleteTokenDialog}
                onDuplicate={pixiOnTokenDuplicate}
                onCopy={pixiOnTokenCopy}
                onCut={pixiOnTokenCut}
                onClose={closeContextMenus}
            />
            <MapContextMenu
                anchorEl={pixiMapContextMenuAnchor}
                onDeleteAllTokens={onMapDeleteAllTokens}
                onDeleteAllWalls={onMapDeleteAllWalls}
                onDeleteAllBlasts={onMapDeleteAllBlasts}
                onPasteToken={() => {
                    if (pixiMapContextMenuAnchor) {
                        const pasteX = parseFloat(pixiMapContextMenuAnchor.dataset.pasteX || '0')
                        const pasteY = parseFloat(pixiMapContextMenuAnchor.dataset.pasteY || '0')
                        handleMapPasteToken(pasteX, pasteY)
                    }
                }}
                onPasteBlast={() => {
                    if (pixiMapContextMenuAnchor) {
                        const pasteX = parseFloat(pixiMapContextMenuAnchor.dataset.pasteX || '0')
                        const pasteY = parseFloat(pixiMapContextMenuAnchor.dataset.pasteY || '0')
                        handleMapPasteBlast(pasteX, pasteY)
                    }
                }}
                canPasteToken={tokenClipboard !== null && tokenClipboard.length > 0}
                canPasteBlast={blastClipboard !== null && blastClipboard.length > 0}
                onCutAllTokens={onMapCutAllTokens}
                onClose={closeContextMenus}
            />
        </>
    )
}

export default PixiBoard
