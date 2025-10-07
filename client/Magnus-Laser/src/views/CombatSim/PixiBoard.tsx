import { Viewport } from 'pixi-viewport'
import type { FederatedPointerEvent } from 'pixi.js'
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Token, Wall } from './types'

const DEFAULT_WALL_COLOR = 0xff3b81
const DEFAULT_WALL_ALPHA = 0.95

type PixiBoardProps = {
    width: number
    height: number
    gridSize?: number
    snapToGrid?: boolean
    isMeasuring?: boolean
    isWallMode?: boolean
    mapKey?: string
    onResetBind?: (fn: () => void) => void
    mapTexture?: Texture | null
    onBindFit?: (fn: () => void) => void
    tokens?: Token[]
    onTokenMove?: (id: string, x: number, y: number) => void
    onPendingCountChange?: (count: number) => void
    onBindPendingControls?: (acceptAll: () => void, cancelAll: () => void) => void
    gridColor?: number
    gridAlpha?: number
    wallColor?: number
    wallAlpha?: number
    walls?: Wall[]
    onWallsChange?: (walls: Wall[]) => void
    isErasingWalls?: boolean
}

const PixiBoard = ({
    width,
    height,
    gridSize = 50,
    snapToGrid = true,
    isMeasuring = false,
    isWallMode = false,
    onResetBind,
    mapTexture: backgroundTexture,
    onBindFit,
    tokens = [],
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
}: PixiBoardProps) => {
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
    const backgroundRef = useRef<Sprite | null>(null)
    const draggingRef = useRef<{ id: string | null; offsetX: number; offsetY: number } | null>(null)
    const tokensRef = useRef<Token[]>(tokens)
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
    const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const dragPreviewRef = useRef<{ id: string; x: number; y: number } | null>(null)

    const notifyPendingCount = () => {
        onPendingCountChange?.(pendingMovesRef.current.size)
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

    // Helper: snap to nearest of 9 points per cell (vertices, edge centers, cell center)
    const snapToNinePoints = (x: number, y: number) => {
        if (!snapRef.current) return { x, y }
        const step = gridSizeRef.current
        const half = step / 2
        const vx = Math.round(x / step) * step
        const vy = Math.round(y / step) * step
        const cx = Math.round((x - half) / step) * step + half
        const cy = Math.round((y - half) / step) * step + half
        const candidates = [
            { x: vx, y: vy }, // vertex
            { x: cx, y: cy }, // center
            { x: cx, y: vy }, // edge center (horizontal)
            { x: vx, y: cy }, // edge center (vertical)
        ]
        let best = candidates[0]
        let bestD = (best.x - x) * (best.x - x) + (best.y - y) * (best.y - y)
        for (let i = 1; i < candidates.length; i++) {
            const c = candidates[i]
            const d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y)
            if (d < bestD) {
                best = c
                bestD = d
            }
        }
        return best
    }

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
        const { w: gw, h: gh } = getTargetSize()
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
        // Commit all pending moves, then clear overlays
        for (const [id, e] of pendingMovesRef.current) {
            onTokenMove?.(id, e.endX, e.endY)
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
                background: 0x06181f,
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

            if (bgTextureRef.current) applyBackgroundTexture(bgTextureRef.current)
            setReady(true)

            const grid = new Graphics()
            gridRef.current = grid
            viewport.addChild(grid)
            const { w: gw, h: gh } = getTargetSize()
            drawGrid(grid, gw, gh, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)

            const wallLayer = new Graphics()
            wallLayerRef.current = wallLayer
            wallLayer.zIndex = 1
            viewport.addChild(wallLayer)

            const tokenLayer = new Graphics()
            tokenLayerRef.current = tokenLayer
            tokenLayer.zIndex = 2
            viewport.addChild(tokenLayer)

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
                    entry.acceptContainer.on('pointertap', () => finalize(true))
                    entry.cancelContainer.on('pointertap', () => finalize(false))
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

            // Pointer drag with grid-snap across tokens
            viewport.on('pointerdown', (e: FederatedPointerEvent) => {
                const global = viewport.toWorld(e.global)
                const x = global.x
                const y = global.y
                const btn = e.button ?? 0 // 0: left, 1: middle, 2: right
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
                    const snapped = snapToNinePoints(x, y)
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
                // Token drag: only with left button
                if (btn !== 0) return
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
                    draggingRef.current = { id: hit.id, offsetX: x - hit.x, offsetY: y - hit.y }
                    // if token already has pending waypoints, start from last end
                    const existing = pendingMovesRef.current.get(hit.id)
                    if (existing) {
                        dragStartRef.current = { id: hit.id, x: existing.endX, y: existing.endY }
                    } else {
                        dragStartRef.current = { id: hit.id, x: hit.x, y: hit.y }
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
                            if (segmentsIntersect(s1, s2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })) {
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
                            }))
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
                                }))
                            )
                        }
                    }
                    wallStartRef.current = null
                    wallPreviewRef.current = null
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
                    }
                    dragPreviewRef.current = null
                }
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
                    const snapped = snapToNinePoints(global.x, global.y)
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
                    return
                }
                if (!draggingRef.current || !draggingRef.current.id) return
                let nx = global.x - draggingRef.current.offsetX
                let ny = global.y - draggingRef.current.offsetY
                if (snapRef.current) {
                    const step = gridSizeRef.current
                    const half = step / 2
                    // Snap to nearest cell center instead of vertex
                    nx = Math.round((nx - half) / step) * step + half
                    ny = Math.round((ny - half) / step) * step + half
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

            // Expose reset method
            if (onResetBind) {
                onResetBind(() => {
                    const { w, h } = getTargetSize()
                    viewport.setZoom(1, true)
                    viewport.moveCenter(w / 2, h / 2)
                })
            }

            // Expose accept/cancel-all controls
            onBindPendingControls?.(acceptAllPending, cancelAllPending)
        }

        init()
        return () => {
            destroyed = true
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
            const { w: gw, h: gh } = getTargetSize()
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
    }, [isMeasuring])

    // When measure toggles off, clear overlay; no need to pause drag since it's on middle button
    useEffect(() => {
        if (!isMeasuring) {
            if (measureStartRef.current) measureStartRef.current = null
            if (measureLayerRef.current) measureLayerRef.current.clear()
            if (measureLabelRef.current) measureLabelRef.current.visible = false
        }
    }, [isMeasuring])

    // Helper to apply background texture when ready
    const applyBackgroundTexture = (tex: Texture) => {
        if (!viewportRef.current || !backgroundRef.current) return
        // Replace old background sprite to avoid stale state
        const viewport = viewportRef.current
        if (!viewport) return
        if (backgroundRef.current) {
            try {
                viewport.removeChild(backgroundRef.current)
                backgroundRef.current.destroy({ children: false, texture: false })
            } catch {
                console.error('Failed to remove old background sprite')
            }
        }
        const bg = new Sprite(tex)
        bg.tint = 0xffffff
        bg.alpha = 1
        bg.zIndex = 0
        backgroundRef.current = bg
        viewport.addChildAt(bg, 0)
        const base = tex
        const fit = () => {
            const w = base.width || bg.width || 1
            const h = base.height || bg.height || 1
            bg.width = w
            bg.height = h
            const sw = viewport.screenWidth
            const sh = viewport.screenHeight
            const scale = Math.min(sw / w, sh / h)
            viewport.setZoom(scale, true)
            viewport.moveCenter(w / 2, h / 2)
            // Redraw grid to match new background dimensions
            if (gridRef.current) {
                gridRef.current.clear()
                drawGrid(gridRef.current, w, h, gridSizeRef.current, gridColorRef.current, gridAlphaRef.current)
            }
        }
        if (!base.width || !base.height) {
            tex.once('update', fit)
        } else {
            fit()
        }
    }

    // Sync bg texture ref and apply when either texture prop or viewport becomes available
    useEffect(() => {
        bgTextureRef.current = backgroundTexture ?? null
        if (!ready) {
            return
        }
        if (backgroundTexture && viewportRef.current && backgroundRef.current) {
            applyBackgroundTexture(backgroundTexture)
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
            const { w, h } = getTargetSize()
            const sw = viewport.screenWidth
            const sh = viewport.screenHeight
            const scale = Math.min(sw / w, sh / h)
            viewport.setZoom(scale, true)
            viewport.moveCenter(w / 2, h / 2)
        })
    }, [onBindFit])

    const getTargetSize = () => {
        const bg = backgroundRef.current
        if (bg && bg.texture) {
            return { w: bg.width || 1, h: bg.height || 1 }
        }
        // fallback to world dims if no bg
        return { w: worldDims.worldWidth, h: worldDims.worldHeight }
    }

    // Redraw tokens on token prop change and sync ref
    useEffect(() => {
        tokensRef.current = tokens
        // When tokens change from parent, redraw while preserving any pending previews
        renderTokensWithPending(
            tokenLayerRef.current,
            tokens,
            pendingMovesRef.current as unknown as Map<string, { endX: number; endY: number }>
        )
    }, [tokens])

    // Keep refs in sync for grid and snap
    useEffect(() => {
        gridSizeRef.current = gridSize
        if (gridRef.current) {
            const { w: gw, h: gh } = getTargetSize()
            gridRef.current.clear()
            drawGrid(gridRef.current, gw, gh, gridSize, gridColorRef.current, gridAlphaRef.current)
        }
    }, [gridSize, worldDims])
    useEffect(() => {
        snapRef.current = snapToGrid
    }, [snapToGrid])

    return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
}

function drawGrid(g: Graphics, worldWidth: number, worldHeight: number, step: number, color: number, alpha: number) {
    g.setStrokeStyle({ width: 1, color, alpha })
    for (let x = 0; x <= worldWidth; x += step) {
        g.moveTo(x, 0)
        g.lineTo(x, worldHeight)
    }
    for (let y = 0; y <= worldHeight; y += step) {
        g.moveTo(0, y)
        g.lineTo(worldWidth, y)
    }
    g.stroke()
}

export default PixiBoard

function renderTokens(
    layer: Graphics | null,
    tokens: Token[],
    overrideId?: string,
    overrideX?: number,
    overrideY?: number
) {
    if (!layer) return
    layer.clear()
    for (const t of tokens) {
        const x = overrideId === t.id && overrideX != null ? overrideX : t.x
        const y = overrideId === t.id && overrideY != null ? overrideY : t.y
        layer.circle(x, y, t.radius).fill({ color: t.color })
    }
}

// Render tokens considering any pending move overlays and an optional live override for the token currently being dragged
function renderTokensWithPending(
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
    if (!layer) return
    layer.clear()
    for (const t of tokens) {
        let x = t.x
        let y = t.y
        if (pending.has(t.id)) {
            const p = pending.get(t.id)!
            x = p.endX
            y = p.endY
        }
        if (liveId === t.id && liveX != null && liveY != null) {
            x = liveX
            y = liveY
        }
        layer.circle(x, y, t.radius).fill({ color: t.color })
    }
}

// Segment intersection test for eraser
function segmentsIntersect(
    a1: { x: number; y: number },
    a2: { x: number; y: number },
    b1: { x: number; y: number },
    b2: { x: number; y: number }
) {
    const cross = (x1: number, y1: number, x2: number, y2: number) => x1 * y2 - y1 * x2
    const dxa = a2.x - a1.x
    const dya = a2.y - a1.y
    const dxb = b2.x - b1.x
    const dyb = b2.y - b1.y
    const denom = cross(dxa, dya, dxb, dyb)
    if (denom === 0) {
        // Parallel; check collinearity and overlap
        const cross2 = cross(b1.x - a1.x, b1.y - a1.y, dxa, dya)
        if (Math.abs(cross2) > 1e-6) return false
        const proj = (p: { x: number; y: number }) => (p.x - a1.x) * dxa + (p.y - a1.y) * dya
        const t0 = proj(b1)
        const t1 = proj(b2)
        const tmin = Math.min(t0, t1)
        const tmax = Math.max(t0, t1)
        const zero = 0
        const one = dxa * dxa + dya * dya
        return !(tmax < zero || tmin > one)
    }
    const ua = cross(b1.x - a1.x, b1.y - a1.y, dxb, dyb) / denom
    const ub = cross(b1.x - a1.x, b1.y - a1.y, dxa, dya) / denom
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
}
