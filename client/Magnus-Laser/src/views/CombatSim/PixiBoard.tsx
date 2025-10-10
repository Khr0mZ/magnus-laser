import { Viewport } from 'pixi-viewport'
import type { FederatedPointerEvent } from 'pixi.js'
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import { MapContextMenu } from './MapContextMenu'
import { TokenContextMenu } from './TokenContextMenu'
import { TokenTooltip } from './TokenTooltip'
import { schedulePathAnimation } from './animationUtils'
import { getTargetSize, segmentsIntersect } from './geometryUtils'
import { drawGrid, snapToNinePoints } from './gridUtils'
import { applyBackgroundTexture } from './pixiUtils'
import { preloadTextures, renderTokens, renderTokensWithPending } from './tokenRenderer'
import type { Image as ImageData, Token, Wall } from './types'

// PIXI DisplayObject minimal interface for event targets
interface PixiDisplayObject {
    eventMode?: string
    cursor?: string
    zIndex?: number
    parent?: PixiDisplayObject | undefined
}

const DEFAULT_WALL_COLOR = 0xff3b81
const DEFAULT_WALL_ALPHA = 0.95

type PixiBoardProps = {
    width: number
    height: number
    gridSize: number
    snapToGrid: boolean
    isMeasuring: boolean
    isWallMode: boolean
    mapKey: string
    mapTexture: Texture | null
    onBindFit: (fn: () => void) => void
    tokens: Token[]
    images: ImageData[]
    onTokenMove: (id: string, x: number, y: number) => void
    onPendingCountChange: (count: number) => void
    onBindPendingControls: (acceptAll: () => void, cancelAll: () => void) => void
    gridColor: number
    gridAlpha: number
    wallColor: number
    wallAlpha: number
    walls: Wall[]
    onWallsChange: (walls: Wall[], mapKey: string) => void
    isErasingWalls: boolean
    onTokenClick: (id: string) => void
    onTokenDelete: (id: string) => void
    onTokenDuplicate: (id: string) => void
    onTokenCut: (id: string) => void
    onTokenCopy: (id: string) => void
    onMapDeleteAllTokens: () => void
    onMapDeleteAllWalls: () => void
    onMapPasteToken: (token: Token) => void
    tokenClipboard: Token | null
    activeTokenId: string | null
}

const PixiBoard = ({
    width,
    height,
    gridSize = 50,
    snapToGrid = true,
    isMeasuring = false,
    isWallMode = false,
    mapTexture: backgroundTexture,
    onBindFit,
    tokens = [],
    images = [],
    onTokenMove,
    onPendingCountChange,
    onBindPendingControls,
    gridColor = 0xffffff,
    gridAlpha = 0.5,
    wallColor = DEFAULT_WALL_COLOR,
    wallAlpha = DEFAULT_WALL_ALPHA,
    mapKey,
    walls: wallsProp = [],
    onWallsChange,
    isErasingWalls = false,
    onTokenClick,
    onTokenDelete,
    onTokenDuplicate,
    onTokenCut,
    onTokenCopy,
    onMapDeleteAllTokens,
    onMapDeleteAllWalls,
    onMapPasteToken,
    tokenClipboard,
    activeTokenId,
}: PixiBoardProps) => {
    const { readerMode } = useUserPreferences()
    const hostRef = useRef<HTMLDivElement | null>(null)
    const appRef = useRef<Application | null>(null)
    const viewportRef = useRef<Viewport | null>(null)
    const gridRef = useRef<Graphics | null>(null)
    const wallLayerRef = useRef<Graphics | null>(null)
    const wallsRef = useRef<
        { id: string; x1: number; y1: number; x2: number; y2: number; color?: number; alpha?: number }[]
    >([])
    const wallStartRef = useRef<{ x: number; y: number } | null>(null)
    const wallPreviewRef = useRef<{ x: number; y: number } | null>(null)
    const eraseStartRef = useRef<{ x: number; y: number } | null>(null)
    const erasePreviewRef = useRef<{ x: number; y: number } | null>(null)
    const tokenLayerRef = useRef<Graphics | null>(null)
    const pendingMovesRef = useRef(
        new Map<
            string,
            {
                line: Graphics
                label: Text
                acceptIcon: Text
                cancelIcon: Text
                acceptBg: Graphics
                cancelBg: Graphics
                acceptContainer: Container
                cancelContainer: Container
                startX: number
                startY: number
                endX: number
                endY: number
                cancelSize: number
                acceptSize: number
                points: { x: number; y: number }[]
            }
        >()
    )
    const measureLayerRef = useRef<Graphics | null>(null)
    const measureLabelRef = useRef<Text | null>(null)
    const measureStartRef = useRef<{ x: number; y: number } | null>(null)
    const wallLabelRef = useRef<Text | null>(null)
    const backgroundRef = useRef<Sprite | null>(null)
    const draggingRef = useRef<{ id: string | null; offsetX: number; offsetY: number } | null>(null)
    const tokensRef = useRef<Token[]>(tokens)
    const prevTokensRef = useRef<Token[]>(tokens)
    const gridSizeRef = useRef<number>(gridSize)
    const snapRef = useRef<boolean>(snapToGrid)
    const gridColorRef = useRef<number>(gridColor)
    const gridAlphaRef = useRef<number>(gridAlpha)
    const wallColorRef = useRef<number>(wallColor)
    const wallAlphaRef = useRef<number>(wallAlpha)
    const bgTextureRef = useRef<Texture | null>(backgroundTexture ?? null)
    const mapKeyRef = useRef<string | undefined>(mapKey)
    const [ready, setReady] = useState(false)
    const measuringRef = useRef<boolean>(isMeasuring)
    const wallModeRef = useRef<boolean>(isWallMode)
    const erasingRef = useRef<boolean>(isErasingWalls)
    const imagesRef = useRef<ImageData[]>(images)

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
                const pending = pendingMovesRef.current.get(token.id)
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
    const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const dragPreviewRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const clickCandidateRef = useRef<{ id: string; x: number; y: number } | null>(null)
    // Context menu state
    const [tokenContextMenuAnchor, setTokenContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [mapContextMenuAnchor, setMapContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
    // Token clipboard for cut/copy/paste

    // Tooltip state for hovering tokens
    const [hoveredToken, setHoveredToken] = useState<Token | null>(null)
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

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

    const notifyPendingCount = () => {
        onPendingCountChange(pendingMovesRef.current.size)
    }

    const handleTokenDelete = (tokenId: string) => {
        onTokenDelete(tokenId)
    }

    const handleTokenDuplicate = (tokenId: string) => {
        onTokenDuplicate(tokenId)
    }

    const handleTokenCopy = (tokenId: string) => {
        onTokenCopy(tokenId)
    }

    const handleTokenCut = (tokenId: string) => {
        onTokenCut(tokenId)
    }

    const handleMapDeleteAllTokens = () => {
        onMapDeleteAllTokens()
    }

    const handleMapDeleteAllWalls = () => {
        onMapDeleteAllWalls()
    }

    const handleMapPasteToken = (pasteX?: number, pasteY?: number) => {
        if (!tokenClipboard || !pasteX || !pasteY) return

        // Create new token with new ID and position
        const newToken = {
            ...tokenClipboard,
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + Math.random()),
            x: pasteX,
            y: pasteY,
        }

        onMapPasteToken(newToken)
        // Keep clipboard intact for multiple pastes
    }

    const closeContextMenus = () => {
        // Clean up anchor elements
        if (tokenContextMenuAnchor && tokenContextMenuAnchor.parentNode) {
            tokenContextMenuAnchor.parentNode.removeChild(tokenContextMenuAnchor)
        }
        if (mapContextMenuAnchor && mapContextMenuAnchor.parentNode) {
            mapContextMenuAnchor.parentNode.removeChild(mapContextMenuAnchor)
        }

        setTokenContextMenuAnchor(null)
        setMapContextMenuAnchor(null)
        setSelectedTokenId(null)
    }

    // Sync walls from prop
    useEffect(() => {
        wallsRef.current = (wallsProp || []).map((w) => ({
            id: w.id,
            x1: w.x1,
            y1: w.y1,
            x2: w.x2,
            y2: w.y2,
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
                g.moveTo(w.x1, w.y1)
                g.lineTo(w.x2, w.y2)
                g.stroke()
            }
        }
    }, [wallsProp])

    // Keep latest mapKey
    useEffect(() => {
        mapKeyRef.current = mapKey
    }, [mapKey])

    // Keep refs in sync
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
        measuringRef.current = isMeasuring
    }, [isMeasuring])
    useEffect(() => {
        wallModeRef.current = isWallMode
    }, [isWallMode])
    useEffect(() => {
        erasingRef.current = isErasingWalls
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
                g.moveTo(w.x1, w.y1)
                g.lineTo(w.x2, w.y2)
                g.stroke()
            }
        }
    }, [isErasingWalls])

    // Redraw grid when color/alpha change
    useEffect(() => {
        if (!gridRef.current) return
        const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
        gridRef.current.clear()
        drawGrid(gridRef.current, gw, gh, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)
    }, [gridColor, gridAlpha])

    const cancelAllPending = () => {
        // Clear overlays and redraw tokens at original positions
        for (const [, e] of pendingMovesRef.current) {
            try {
                e.line.destroy()
                e.label.destroy()
                e.acceptContainer.destroy({ children: true })
                e.cancelContainer.destroy({ children: true })
            } catch {
                console.error('Failed to cancel all pending moves')
            }
        }
        pendingMovesRef.current.clear()
        renderTokens(tokenLayerRef.current, tokensRef.current)
        notifyPendingCount()
    }

    const acceptAllPending = () => {
        // Commit all pending moves, schedule animations, then clear overlays
        for (const [id, e] of pendingMovesRef.current) {
            const pts = [...e.points]
            const last = pts[pts.length - 1]
            if (!last || last.x !== e.endX || last.y !== e.endY) {
                pts.push({ x: e.endX, y: e.endY })
            }
            schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)
            onTokenMove(id, e.endX, e.endY)
            try {
                e.line.destroy()
                e.label.destroy()
                e.acceptContainer.destroy({ children: true })
                e.cancelContainer.destroy({ children: true })
            } catch {
                console.error('Failed to accept all pending moves')
            }
        }
        pendingMovesRef.current.clear()
        // After committing, redraw tokens (parent will also update tokens prop shortly)
        renderTokens(tokenLayerRef.current, tokensRef.current)
        notifyPendingCount()
    }

    const worldDims = useMemo(
        () => ({
            worldWidth: Math.max(width * 4, 4000),
            worldHeight: Math.max(height * 4, 4000),
        }),
        [width, height]
    )

    // Initialize PIXI Application + Viewport once
    useEffect(() => {
        let destroyed = false
        const init = async () => {
            if (!hostRef.current) return
            const app = new Application()
            await app.init({
                antialias: true,
                resolution: Math.min(window.devicePixelRatio || 1, 2),
                backgroundAlpha: 1,
                background: readerMode ? 0x00b3ff : 0x06181f,
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
                const preventContextMenu = (e: Event) => {
                    e.preventDefault()
                    e.stopPropagation()
                }
                canvas.addEventListener('contextmenu', preventContextMenu, { capture: true })
                preventContextMenuRef.current = preventContextMenu

                const preventRightMouseDown = (e: globalThis.MouseEvent) => {
                    if (e.button === 2) e.preventDefault()
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

            const bg = new Sprite(Texture.WHITE)
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
            setReady(true)

            const grid = new Graphics()
            gridRef.current = grid
            viewport.addChild(grid)
            const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
            drawGrid(grid, gw, gh, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)

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
                    Array.from(pendingMovesRef.current.entries()).map(([id, e]) => [id, { endX: e.endX, endY: e.endY }])
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
                        const pending = pendingMovesRef.current.get(token.id)
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

            // Helper to create/update a pending move overlay for a token
            const upsertPendingOverlay = (id: string, sx: number, sy: number, ex: number, ey: number) => {
                const viewport = viewportRef.current
                if (!viewport) return
                let entry = pendingMovesRef.current.get(id)
                if (!entry) {
                    const line = new Graphics()
                    line.zIndex = 3
                    viewport.addChild(line)
                    const label = new Text({ text: '', style: { fill: 0xffffff, fontSize: 12 } })
                    label.visible = false
                    label.zIndex = 4
                    label.eventMode = 'none'
                    // anchor label at left-middle so y is the vertical center
                    label.anchor?.set?.(0, 0.5)
                    viewport.addChild(label)
                    // Button backgrounds and containers
                    const acceptBg = new Graphics()
                    const cancelBg = new Graphics()
                    const acceptIcon = new Text({ text: '✓', style: { fill: 0x00ff88, fontSize: 16 } })
                    const cancelIcon = new Text({ text: '✕', style: { fill: 0xff3b81, fontSize: 16 } })
                    acceptIcon.anchor?.set?.(0.5)
                    cancelIcon.anchor?.set?.(0.5)
                    const acceptContainer = new Container()
                    const cancelContainer = new Container()
                    acceptContainer.eventMode = 'static'
                    cancelContainer.eventMode = 'static'
                    acceptContainer.cursor = 'pointer'
                    cancelContainer.cursor = 'pointer'
                    acceptContainer.zIndex = 6
                    cancelContainer.zIndex = 6
                    acceptContainer.addChild(acceptBg)
                    acceptContainer.addChild(acceptIcon)
                    cancelContainer.addChild(cancelBg)
                    cancelContainer.addChild(cancelIcon)
                    acceptContainer.visible = false
                    cancelContainer.visible = false
                    viewport.addChild(acceptContainer)
                    viewport.addChild(cancelContainer)
                    entry = {
                        line,
                        label,
                        acceptIcon,
                        cancelIcon,
                        acceptBg,
                        cancelBg,
                        acceptContainer,
                        cancelContainer,
                        startX: sx,
                        startY: sy,
                        endX: ex,
                        endY: ey,
                        cancelSize: 0,
                        acceptSize: 0,
                        points: [
                            { x: sx, y: sy },
                            { x: ex, y: ey },
                        ],
                    }
                    pendingMovesRef.current.set(id, entry)
                    notifyPendingCount()
                    // Wire actions
                    const finalize = (ok: boolean) => {
                        const e = pendingMovesRef.current.get(id)
                        if (!e) return
                        if (ok) {
                            // Schedule path animation across all waypoints including final
                            const pts = [...e.points]
                            const last = pts[pts.length - 1]
                            if (!last || last.x !== e.endX || last.y !== e.endY) {
                                pts.push({ x: e.endX, y: e.endY })
                            }
                            schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)
                            onTokenMove?.(id, e.endX, e.endY)
                        } else {
                            // Redraw tokens with remaining pendings so others stay put
                            const pendingMap = new Map(
                                Array.from(pendingMovesRef.current.entries())
                                    .filter(([pid]) => pid !== id)
                                    .map(([pid, v]) => [pid, { endX: v.endX, endY: v.endY }])
                            )
                            renderTokensWithPending(tokenLayerRef.current, tokensRef.current, pendingMap)
                        }
                        // remove visuals
                        try {
                            e.line.destroy()
                            e.label.destroy()
                            e.acceptContainer.destroy({ children: true })
                            e.cancelContainer.destroy({ children: true })
                        } catch {
                            console.error('Failed to cancel all pending moves')
                        }
                        pendingMovesRef.current.delete(id)
                        notifyPendingCount()
                        // Redraw with remaining pending overlays also after accept
                        const pendingMapAfter = new Map(
                            Array.from(pendingMovesRef.current.entries()).map(([pid, v]) => [
                                pid,
                                { endX: v.endX, endY: v.endY },
                            ])
                        )
                        renderTokensWithPending(tokenLayerRef.current, tokensRef.current, pendingMapAfter)
                    }
                    entry.acceptContainer.on('pointertap', (event) => {
                        event.stopPropagation()
                        finalize(true)
                    })
                    entry.cancelContainer.on('pointertap', (event) => {
                        event.stopPropagation()
                        // Cancel last waypoint instead of entire movement
                        const e = pendingMovesRef.current.get(id)
                        if (!e) return

                        if (e.points.length < 4) {
                            // Only start point exists, cancel entire movement
                            finalize(false)
                        } else {
                            // Remove last waypoint and update end position
                            e.points.pop()
                            const newLastPoint = e.points[e.points.length - 1]
                            if (newLastPoint) {
                                e.endX = newLastPoint.x
                                e.endY = newLastPoint.y
                                // Update the overlay with new end position
                                upsertPendingOverlay(id, e.startX, e.startY, e.endX, e.endY)
                                // Update token rendering to show token at new position
                                const pendingMap = new Map(
                                    Array.from(pendingMovesRef.current.entries()).map(([pid, v]) => [
                                        pid,
                                        { endX: v.endX, endY: v.endY },
                                    ])
                                )
                                renderTokensWithPending(tokenLayerRef.current, tokensRef.current, pendingMap)
                            }
                        }
                    })
                    // Hover styles
                    const drawBtn = (
                        bg: Graphics,
                        size: number,
                        borderColor: number,
                        baseFill: number,
                        hoverFill: number,
                        hovered: boolean
                    ) => {
                        bg.clear()
                        const fill = hovered ? hoverFill : baseFill
                        const alpha = hovered ? 0.6 : 0.4
                        bg.setStrokeStyle({ width: 1, color: borderColor, alpha: 0.38 })
                        // draw centered at 0,0 in local coords
                        bg.rect(-size / 2, -size / 2, size, size)
                            .fill({ color: fill, alpha })
                            .stroke()
                    }
                    entry.cancelContainer.on('pointerover', () => {
                        const e = pendingMovesRef.current.get(id)
                        if (!e) return
                        drawBtn(e.cancelBg, e.cancelSize || 24, 0xff3b81, 0x280000, 0x3c0000, true)
                    })
                    entry.cancelContainer.on('pointerout', () => {
                        const e = pendingMovesRef.current.get(id)
                        if (!e) return
                        drawBtn(e.cancelBg, e.cancelSize || 24, 0xff3b81, 0x280000, 0x3c0000, false)
                    })
                    entry.acceptContainer.on('pointerover', () => {
                        const e = pendingMovesRef.current.get(id)
                        if (!e) return
                        drawBtn(e.acceptBg, e.acceptSize || 24, 0x00ff88, 0x002800, 0x003c00, true)
                    })
                    entry.acceptContainer.on('pointerout', () => {
                        const e = pendingMovesRef.current.get(id)
                        if (!e) return
                        drawBtn(e.acceptBg, e.acceptSize || 24, 0x00ff88, 0x002800, 0x003c00, false)
                    })
                }
                // After potential creation, ensure entry is defined
                entry = pendingMovesRef.current.get(id)
                if (!entry) return
                // Update visuals
                // For live preview, if we're currently dragging this id, treat (ex, ey) as preview only
                const isPreview = dragPreviewRef.current?.id === id
                if (!isPreview) {
                    entry.startX = sx
                    entry.startY = sy
                    entry.endX = ex
                    entry.endY = ey
                    if (entry.points.length === 0) entry.points.push({ x: sx, y: sy })
                    if (entry.points.length === 1) entry.points.push({ x: ex, y: ey })
                }
                const step = gridSizeRef.current
                // cumulative cells across committed points + optional preview segment
                let cells = 0
                const pts = entry.points
                for (let i = 1; i < pts.length; i++) {
                    const dxs = Math.abs(pts[i].x - pts[i - 1].x)
                    const dys = Math.abs(pts[i].y - pts[i - 1].y)
                    cells += Math.hypot(dxs, dys) / step
                }
                let labelX = entry.endX
                let labelY = entry.endY
                if (isPreview) {
                    const last = pts[pts.length - 1]
                    const dxp = Math.abs(ex - last.x)
                    const dyp = Math.abs(ey - last.y)
                    cells += Math.hypot(dxp, dyp) / step
                    labelX = ex
                    labelY = ey
                }
                const txt = snapRef.current ? `${Math.round(cells)}` : `${cells.toFixed(2)}`
                entry.label.text = txt
                const zoom = viewport.scale.x
                entry.label.style.fontSize = Math.max(24, 24 / Math.max(0.1, zoom))
                entry.label.visible = true
                entry.label.x = labelX + 8
                // y is vertical center because label anchor is (0, 0.5)
                entry.label.y = labelY
                // Buttons next to label (center boxes on glyphs, aligned with label vertically)
                const invZoom = 1 / Math.max(0.1, zoom)
                const baseSize = 24 * invZoom
                const gap = 8 * invZoom
                const padding = 4 * invZoom
                const centerY = entry.label.y
                const startRight = entry.label.x + entry.label.width + 8
                // compute sizes based on current glyph dimensions
                const cancelGlyphMax = Math.max(entry.cancelIcon.width, entry.cancelIcon.height)
                const acceptGlyphMax = Math.max(entry.acceptIcon.width, entry.acceptIcon.height)
                const cancelSize = Math.max(baseSize, cancelGlyphMax + padding * 2)
                const acceptSize = Math.max(baseSize, acceptGlyphMax + padding * 2)
                entry.cancelSize = cancelSize
                entry.acceptSize = acceptSize
                const cancelCenterX = startRight + cancelSize / 2
                const cancelCenterY = centerY
                const acceptCenterX = cancelCenterX + cancelSize + gap
                const acceptCenterY = centerY
                // Position and draw cancel (red)
                entry.cancelContainer.visible = true
                entry.cancelContainer.position.set(cancelCenterX, cancelCenterY)
                entry.cancelBg.clear()
                entry.cancelBg.setStrokeStyle({ width: 1, color: 0xff3b81, alpha: 0.38 })
                entry.cancelBg
                    .rect(-cancelSize / 2, -cancelSize / 2, cancelSize, cancelSize)
                    .fill({ color: 0x280000, alpha: 0.4 })
                    .stroke()
                entry.cancelIcon.visible = true
                entry.cancelIcon.style.fontSize = Math.max(16, 16 / Math.max(0.1, zoom))
                entry.cancelIcon.position.set(0, 0)
                // Position and draw accept (green)
                entry.acceptContainer.visible = true
                entry.acceptContainer.position.set(acceptCenterX, acceptCenterY)
                entry.acceptBg.clear()
                entry.acceptBg.setStrokeStyle({ width: 1, color: 0x00ff88, alpha: 0.38 })
                entry.acceptBg
                    .rect(-acceptSize / 2, -acceptSize / 2, acceptSize, acceptSize)
                    .fill({ color: 0x002800, alpha: 0.4 })
                    .stroke()
                entry.acceptIcon.visible = true
                entry.acceptIcon.style.fontSize = Math.max(16, 16 / Math.max(0.1, zoom))
                entry.acceptIcon.position.set(0, 0)
                // Draw polyline across points + optional preview
                entry.line.clear()
                entry.line.setStrokeStyle({ width: 2, color: 0xffd166, alpha: 0.9 })
                if (pts.length > 0) {
                    entry.line.moveTo(pts[0].x, pts[0].y)
                    for (let i = 1; i < pts.length; i++) {
                        entry.line.lineTo(pts[i].x, pts[i].y)
                    }
                    if (isPreview) {
                        entry.line.lineTo(labelX, labelY)
                    }
                }
                entry.line.stroke()
                // Endpoints markers
                if (pts.length > 0) entry.line.circle(pts[0].x, pts[0].y, 3).fill({ color: 0xffd166 })
                const lastPt = isPreview ? { x: labelX, y: labelY } : pts[pts.length - 1]
                if (lastPt) entry.line.circle(lastPt.x, lastPt.y, 3).fill({ color: 0xffd166 })
            }

            // Recalculate all pending overlays on zoom change
            const refreshPendingForZoom = () => {
                const viewport = viewportRef.current
                if (!viewport) return
                // Clean up any stray overlay keyed by an empty id from earlier logic
                if (pendingMovesRef.current.has('')) {
                    const stray = pendingMovesRef.current.get('')
                    if (stray) {
                        try {
                            stray.line.destroy()
                            stray.label.destroy()
                            stray.acceptContainer.destroy({ children: true })
                            stray.cancelContainer.destroy({ children: true })
                        } catch {
                            console.error('Failed to cancel all pending moves')
                        }
                    }
                    pendingMovesRef.current.delete('')
                }
                // Update existing overlays in place based on current zoom/scale
                for (const [, e] of pendingMovesRef.current) {
                    const zoom = viewport.scale.x
                    e.label.style.fontSize = Math.max(24, 24 / Math.max(0.1, zoom))
                    e.label.x = e.endX + 8
                    e.label.y = e.endY
                    const invZoom = 1 / Math.max(0.1, zoom)
                    const baseSize = 24 * invZoom
                    const gap = 8 * invZoom
                    const padding = 4 * invZoom
                    const centerY = e.label.y
                    const startRight = e.label.x + e.label.width + 8
                    // compute sizes from glyph dimensions
                    const cancelGlyphMax = Math.max(e.cancelIcon.width, e.cancelIcon.height)
                    const acceptGlyphMax = Math.max(e.acceptIcon.width, e.acceptIcon.height)
                    const cancelSize = Math.max(baseSize, cancelGlyphMax + padding * 2)
                    const acceptSize = Math.max(baseSize, acceptGlyphMax + padding * 2)
                    e.cancelSize = cancelSize
                    e.acceptSize = acceptSize
                    const cancelCx = startRight + cancelSize / 2
                    const acceptCx = cancelCx + cancelSize + gap
                    e.cancelContainer.position.set(cancelCx, centerY)
                    e.acceptContainer.position.set(acceptCx, centerY)
                    e.cancelBg.clear()
                    e.cancelBg.setStrokeStyle({ width: 1, color: 0xff3b81, alpha: 0.38 })
                    e.cancelBg
                        .rect(-cancelSize / 2, -cancelSize / 2, cancelSize, cancelSize)
                        .fill({ color: 0x280000, alpha: 0.4 })
                        .stroke()
                    e.acceptBg.clear()
                    e.acceptBg.setStrokeStyle({ width: 1, color: 0x00ff88, alpha: 0.38 })
                    e.acceptBg
                        .rect(-acceptSize / 2, -acceptSize / 2, acceptSize, acceptSize)
                        .fill({ color: 0x002800, alpha: 0.4 })
                        .stroke()
                    // rescale glyphs with zoom
                    e.cancelIcon.style.fontSize = Math.max(16, 16 / Math.max(0.1, zoom))
                    e.acceptIcon.style.fontSize = Math.max(16, 16 / Math.max(0.1, zoom))
                }
                // Update measurement label if visible
                const ml = measureLabelRef.current
                if (ml && ml.visible) {
                    const zoom = viewport.scale.x
                    ml.style.fontSize = Math.max(24, 24 / Math.max(0.1, zoom))
                }
            }

            viewport.on('zoomed', refreshPendingForZoom)

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

                // Hide tooltip on pointer down
                setHoveredToken(null)
                setTooltipPosition(null)

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

                // Context menu closing is handled by MUI Menu
                // Eraser mode: only start with left button
                if (wallModeRef.current && erasingRef.current) {
                    if (btn !== 0) return
                    eraseStartRef.current = { x, y }
                    erasePreviewRef.current = null
                    return
                }
                // Wall draw mode: only start with left button
                if (wallModeRef.current) {
                    if (btn !== 0) return
                    const snapped = snapToNinePoints(x, y, gridSizeRef.current, snapRef.current)
                    wallStartRef.current = { x: snapped.x, y: snapped.y }
                    wallPreviewRef.current = null
                    // prevent panning start
                    return
                }
                // Measurement: only start with left button
                if (measuringRef.current) {
                    if (btn !== 0) return
                    try {
                        e.stopPropagation?.()
                        e.preventDefault?.()
                    } catch {
                        console.error('Failed to stop propagation or prevent default')
                    }
                    const step = gridSizeRef.current
                    const half = step / 2
                    const sx = snapRef.current ? Math.round((x - half) / step) * step + half : x
                    const sy = snapRef.current ? Math.round((y - half) / step) * step + half : y
                    measureStartRef.current = { x: sx, y: sy }
                    return
                }
                // Token interaction: handle left click (drag) and right click (context menu)
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
                    let hit: Token | null = null
                    let minDist = Number.POSITIVE_INFINITY
                    for (const t of tokensRef.current) {
                        const pending = pendingMovesRef.current.get(t.id)
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
                            // Right click - show token context menu
                            // Create a temporary anchor element at the click position
                            const anchorEl = document.createElement('div')
                            anchorEl.style.position = 'fixed'

                            // Get the screen position accounting for viewport transforms
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

                            setTokenContextMenuAnchor(anchorEl)
                            setSelectedTokenId(hit.id)

                            return
                        } else {
                            // Left click - start drag
                            draggingRef.current = { id: hit.id, offsetX: x - hit.x, offsetY: y - hit.y }
                            // if token already has pending waypoints, start from last end
                            const existing = pendingMovesRef.current.get(hit.id)
                            if (existing) {
                                dragStartRef.current = { id: hit.id, x: existing.endX, y: existing.endY }
                            } else {
                                dragStartRef.current = { id: hit.id, x: hit.x, y: hit.y }
                            }
                            clickCandidateRef.current = { id: hit.id, x, y }
                        }
                    } else if (btn === 2) {
                        // Right click on empty space - show map context menu
                        const anchorEl = document.createElement('div')
                        anchorEl.style.position = 'fixed'

                        // Get the screen position accounting for viewport transforms
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

                        // Store the paste coordinates
                        anchorEl.dataset.pasteX = x.toString()
                        anchorEl.dataset.pasteY = y.toString()

                        setMapContextMenuAnchor(anchorEl)

                        return
                    }
                }
            })

            const endDrag = () => {
                if (wallModeRef.current && erasingRef.current && eraseStartRef.current && wallLayerRef.current) {
                    const start = eraseStartRef.current
                    const end = erasePreviewRef.current
                    if (end) {
                        const s1 = { x: start.x, y: start.y }
                        const s2 = { x: end.x, y: end.y }
                        const keep: typeof wallsRef.current = []
                        for (const w of wallsRef.current) {
                            const intersects = segmentsIntersect(s1, s2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })
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
                                color: w.color ?? DEFAULT_WALL_COLOR,
                                alpha: w.alpha ?? DEFAULT_WALL_ALPHA,
                            })),
                            mapKeyRef.current || ''
                        )
                    }
                    eraseStartRef.current = null
                    erasePreviewRef.current = null
                    const g = wallLayerRef.current
                    g.clear()
                    for (const w of wallsRef.current) {
                        const c = w.color ?? DEFAULT_WALL_COLOR
                        const a = w.alpha ?? DEFAULT_WALL_ALPHA
                        g.setStrokeStyle({ width: 3, color: c, alpha: a })
                        g.moveTo(w.x1, w.y1)
                        g.lineTo(w.x2, w.y2)
                        g.stroke()
                    }
                }
                if (wallModeRef.current && wallStartRef.current && wallLayerRef.current) {
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
                        g.moveTo(w.x1, w.y1)
                        g.lineTo(w.x2, w.y2)
                        g.stroke()
                    }
                }
                if (draggingRef.current && draggingRef.current.id) {
                    const endedId = draggingRef.current.id
                    draggingRef.current = { id: null, offsetX: 0, offsetY: 0 }
                    if (dragPreviewRef.current && dragPreviewRef.current.id === endedId) {
                        const e = pendingMovesRef.current.get(endedId)
                        if (e) {
                            e.points.push({ x: dragPreviewRef.current.x, y: dragPreviewRef.current.y })
                            e.endX = dragPreviewRef.current.x
                            e.endY = dragPreviewRef.current.y
                            upsertPendingOverlay(endedId, e.points[0].x, e.points[0].y, e.endX, e.endY)
                        }
                        // dragged -> not a click
                        clickCandidateRef.current = null
                    } else {
                        // treat as click (no drag preview)
                        const cand = clickCandidateRef.current
                        if (
                            cand &&
                            cand.id === endedId &&
                            !wallModeRef.current &&
                            !measuringRef.current &&
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
                // hover cursor over tokens and show tooltip
                if (!wallModeRef.current && !measuringRef.current) {
                    let over = false
                    let hoveredTokenData: Token | null = null

                    for (const t of tokensRef.current) {
                        const pending = pendingMovesRef.current.get(t.id)
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

                    // Update tooltip
                    if (hoveredTokenData && hoveredTokenData.stats) {
                        // Check if it's not a default token
                        const isDefaultToken =
                            (hoveredTokenData.id === 'EASY' ||
                                hoveredTokenData.id === 'TYPICAL' ||
                                hoveredTokenData.id === 'DANGEROUS' ||
                                hoveredTokenData.id === 'DEADLY') &&
                            hoveredTokenData.mapId === ''

                        if (!isDefaultToken) {
                            const screenPos = viewport.toScreen(global.x, global.y)
                            const rect = hostRef.current?.getBoundingClientRect()
                            if (rect) {
                                setHoveredToken(hoveredTokenData)
                                setTooltipPosition({
                                    x: rect.left + screenPos.x,
                                    y: rect.top + screenPos.y,
                                })
                            }
                        } else {
                            setHoveredToken(null)
                            setTooltipPosition(null)
                        }
                    } else {
                        setHoveredToken(null)
                        setTooltipPosition(null)
                    }
                }
                if (wallModeRef.current && erasingRef.current && eraseStartRef.current && wallLayerRef.current) {
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
                        const hit = segmentsIntersect(
                            { x: sx, y: sy },
                            { x: ex, y: ey },
                            { x: w.x1, y: w.y1 },
                            { x: w.x2, y: w.y2 }
                        )
                        const c = w.color ?? DEFAULT_WALL_COLOR
                        const a = w.alpha ?? DEFAULT_WALL_ALPHA
                        g.setStrokeStyle({ width: 3, color: hit ? 0xff0000 : c, alpha: hit ? 0.95 : a })
                        g.moveTo(w.x1, w.y1)
                        g.lineTo(w.x2, w.y2)
                        g.stroke()
                    }
                    // draw eraser preview line in bright red
                    g.setStrokeStyle({ width: 2, color: 0xff0000, alpha: 0.9 })
                    g.moveTo(sx, sy)
                    g.lineTo(ex, ey)
                    g.stroke()
                    return
                }
                if (wallModeRef.current && wallStartRef.current && wallLayerRef.current) {
                    const snapped = snapToNinePoints(global.x, global.y, gridSizeRef.current, snapRef.current)
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
                        g.moveTo(w.x1, w.y1)
                        g.lineTo(w.x2, w.y2)
                        g.stroke()
                    }
                    // preview new wall in current picker color
                    g.setStrokeStyle({ width: 3, color: wallColorRef.current, alpha: wallAlphaRef.current })
                    g.moveTo(wallStartRef.current.x, wallStartRef.current.y)
                    g.lineTo(ex, ey)
                    g.stroke()

                    // Show wall length label
                    const wallLabel = wallLabelRef.current
                    if (wallLabel) {
                        const dx = ex - wallStartRef.current.x
                        const dy = ey - wallStartRef.current.y
                        const length = Math.sqrt(dx * dx + dy * dy)
                        const gridLength = snapRef.current
                            ? Math.round(length / gridSizeRef.current)
                            : (length / gridSizeRef.current).toFixed(2)

                        wallLabel.text = snapRef.current ? `${gridLength}` : `${gridLength}`
                        wallLabel.style.fontSize = Math.max(24, 24 / Math.max(0.1, viewport.scale.x))
                        wallLabel.visible = true
                        wallLabel.x = ex + 8
                        wallLabel.y = ey - 8
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
                if (snapRef.current) {
                    const snapped = snapToNinePoints(nx, ny, gridSizeRef.current, snapRef.current)
                    nx = snapped.x
                    ny = snapped.y
                }
                // preview draw only (do not commit move yet), include any other pending previews
                renderTokensWithPending(
                    tokenLayerRef.current,
                    tokensRef.current,
                    new Map(
                        Array.from(pendingMovesRef.current.entries()).map(([id, e]) => [
                            id,
                            { endX: e.endX, endY: e.endY },
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
                const half = step / 2
                const sx = measureStartRef.current.x
                const sy = measureStartRef.current.y
                const ex = snapRef.current ? Math.round((global.x - half) / step) * step + half : global.x
                const ey = snapRef.current ? Math.round((global.y - half) / step) * step + half : global.y
                const dx = Math.abs(ex - sx)
                const dy = Math.abs(ey - sy)
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
                    const txt = snapRef.current ? `${Math.round(cells)}` : `${cells.toFixed(2)}`
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
        // adjust pending overlays for new scale/layout
        const viewport = viewportRef.current
        if (viewport) {
            for (const [, e] of pendingMovesRef.current) {
                // reuse update path
                const id = Array.from(pendingMovesRef.current.entries()).find(([, v]) => v === e)?.[0]
                if (id) {
                    // call updater with stored coords
                    const endX = e.endX
                    const endY = e.endY
                    // directly adjust visuals similar to upsert
                    const zoom = viewport.scale.x
                    e.label.style.fontSize = Math.max(24, 24 / Math.max(0.1, zoom))
                    e.label.x = endX + 8
                    e.label.y = endY
                    const invZoom = 1 / Math.max(0.1, zoom)
                    const baseSize = 24 * invZoom
                    const gap = 8 * invZoom
                    const padding = 4 * invZoom
                    const centerY = e.label.y
                    const startRight = e.label.x + e.label.width + 8
                    const cancelGlyphMax = Math.max(e.cancelIcon.width, e.cancelIcon.height)
                    const acceptGlyphMax = Math.max(e.acceptIcon.width, e.acceptIcon.height)
                    const cancelSize = Math.max(baseSize, cancelGlyphMax + padding * 2)
                    const acceptSize = Math.max(baseSize, acceptGlyphMax + padding * 2)
                    const cancelCenterX = startRight + cancelSize / 2
                    const acceptCenterX = cancelCenterX + cancelSize + gap
                    e.cancelContainer.position.set(cancelCenterX, centerY)
                    e.acceptContainer.position.set(acceptCenterX, centerY)
                    e.cancelBg.clear()
                    e.cancelBg.setStrokeStyle({ width: 1, color: 0xff3b81, alpha: 0.38 })
                    e.cancelBg
                        .rect(-cancelSize / 2, -cancelSize / 2, cancelSize, cancelSize)
                        .fill({ color: 0x280000, alpha: 0.4 })
                        .stroke()
                    e.acceptBg.clear()
                    e.acceptBg.setStrokeStyle({ width: 1, color: 0x00ff88, alpha: 0.38 })
                    e.acceptBg
                        .rect(-acceptSize / 2, -acceptSize / 2, acceptSize, acceptSize)
                        .fill({ color: 0x002800, alpha: 0.4 })
                        .stroke()
                    e.cancelIcon.style.fontSize = Math.max(16, 16 / Math.max(0.1, zoom))
                    e.acceptIcon.style.fontSize = Math.max(16, 16 / Math.max(0.1, zoom))
                }
            }
        }
    }, [width, height, worldDims, gridSize])

    // Keep measuring ref in sync so event handlers see latest value
    useEffect(() => {
        measuringRef.current = isMeasuring
        // Hide tooltip when entering measuring mode
        if (isMeasuring) {
            setHoveredToken(null)
            setTooltipPosition(null)
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
            // Hide tooltip when entering wall mode
            setHoveredToken(null)
            setTooltipPosition(null)
        }
    }, [isWallMode])

    // Sync bg texture ref and apply when either texture prop or viewport becomes available
    useEffect(() => {
        bgTextureRef.current = backgroundTexture ?? null
        if (!ready) {
            return
        }
        if (backgroundTexture && viewportRef.current && backgroundRef.current) {
            applyBackgroundTexture(
                backgroundTexture,
                viewportRef.current,
                backgroundRef,
                gridRef,
                gridSizeRef.current,
                gridColorRef.current,
                gridAlphaRef.current
            )
        } else if (!backgroundTexture && backgroundRef.current) {
            backgroundRef.current.texture = Texture.WHITE
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
    }, [backgroundTexture, ready])

    // Bind fit function
    useEffect(() => {
        if (!viewportRef.current) return
        if (!onBindFit) return
        const viewport = viewportRef.current
        onBindFit(() => {
            const { w, h } = getTargetSize(backgroundRef.current, worldDims)
            const sw = viewport.screenWidth
            const sh = viewport.screenHeight
            const scale = Math.min(sw / w, sh / h)
            viewport.setZoom(scale, true)
            viewport.moveCenter(w / 2, h / 2)
        })
    }, [onBindFit])

    // Redraw tokens on token prop change, start movement animations (single segment) for non-pending external moves
    useEffect(() => {
        tokensRef.current = tokens
        const prev = prevTokensRef.current
        const prevById = new Map<string, Token>(prev.map((t) => [t.id, t]))
        let anyAnimated = false
        // Build animation entries for moved tokens that are not currently pending and not already animating
        for (const t of tokens) {
            const p = prevById.get(t.id)
            if (!p) continue
            if (pendingMovesRef.current.has(t.id)) continue
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
            for (const [id, e] of pendingMovesRef.current) {
                override.set(id, { endX: e.endX, endY: e.endY })
            }
            const live = dragPreviewRef.current
            renderTokensWithPending(tokenLayerRef.current, tokensRef.current, override, live?.id, live?.x, live?.y)
        } else {
            // No animations; check if there are pending moves
            if (pendingMovesRef.current.size > 0) {
                renderTokensWithPending(
                    tokenLayerRef.current,
                    tokens,
                    pendingMovesRef.current as unknown as Map<string, { endX: number; endY: number }>
                )
            } else {
                // No pending moves, just render tokens normally
                renderTokens(tokenLayerRef.current, tokens)
            }
        }
    }, [tokens, images])

    // Keep refs in sync for grid and snap
    useEffect(() => {
        gridSizeRef.current = gridSize
        if (gridRef.current) {
            const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
            gridRef.current.clear()
            drawGrid(gridRef.current, gw, gh, gridSize, gridColorRef.current, gridAlphaRef.current)
        }
    }, [gridSize, worldDims])
    useEffect(() => {
        snapRef.current = snapToGrid
    }, [snapToGrid])

    return (
        <>
            <div ref={hostRef} style={{ width: '100%', height: '100%', position: 'relative' }} />

            {/* Token tooltip overlay */}
            {hoveredToken && tooltipPosition && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${tooltipPosition.x + gridSize / 2}px`,
                        top: `${tooltipPosition.y + gridSize / 2}px`,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        transform: 'translateY(-100%)',
                    }}
                >
                    <TokenTooltip token={hoveredToken} />
                </div>
            )}

            <TokenContextMenu
                anchorEl={tokenContextMenuAnchor}
                tokenId={selectedTokenId}
                onDelete={handleTokenDelete}
                onDuplicate={handleTokenDuplicate}
                onCopy={handleTokenCopy}
                onCut={handleTokenCut}
                onClose={closeContextMenus}
            />
            <MapContextMenu
                anchorEl={mapContextMenuAnchor}
                onDeleteAllTokens={handleMapDeleteAllTokens}
                onDeleteAllWalls={handleMapDeleteAllWalls}
                onPasteToken={() => {
                    if (mapContextMenuAnchor) {
                        const pasteX = parseFloat(mapContextMenuAnchor.dataset.pasteX || '0')
                        const pasteY = parseFloat(mapContextMenuAnchor.dataset.pasteY || '0')
                        handleMapPasteToken(pasteX, pasteY)
                    }
                }}
                canPaste={tokenClipboard !== null}
                onClose={closeContextMenus}
            />
        </>
    )
}

export default PixiBoard
