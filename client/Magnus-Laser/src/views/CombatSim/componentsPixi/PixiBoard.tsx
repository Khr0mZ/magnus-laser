import { Viewport } from 'pixi-viewport'
import type { FederatedPointerEvent } from 'pixi.js'
import { Application, Circle, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import { useSession } from '../../../state/sessionStore'
import colors from '../../../utils/colors'
import { schedulePathAnimation } from '../utils/animationUtils'
import {
    getTargetSize,
    segmentHitsCircleBoundary,
    segmentIntersectsRectangle,
    segmentsIntersect,
} from '../utils/geometryUtils'
import { drawGrid, endpointFromAngleLength, snapToNinePoints } from '../utils/gridUtils'
import { applyBackgroundTexture } from '../utils/pixiUtils'
import type { Blast, BlastType, Image as ImageData, PixiDisplayObject, Token, Wall, WallShape } from '../utils/types'
import {
    calculateConePoints,
    clearBlastRendererCaches,
    drawBlastPreview,
    preloadBlastTextures,
    renderBlasts,
} from './blastRenderer'
import { usePixiCallbackRefs } from './hooks/usePixiCallbackRefs'
import { usePixiClipboard } from './hooks/usePixiClipboard'
import { usePixiContextMenus } from './hooks/usePixiContextMenus'
import { PixiPendingIndicator } from './PixiPendingIndicator'
import { PixiTooltip, createPixiTooltip } from './PixiTooltip'
import {
    clearTokenRendererCaches,
    ghostSpriteCache,
    preloadTextures,
    renderTokens,
    renderTokensWithPending,
    setTexturesReadyCallback,
    spriteCache,
} from './tokenRenderer'
import { findBlastHit, findTokenHit } from './utils/hitTesting'
import { drawWallsOnGraphics } from './utils/wallDrawing'

const DEFAULT_WALL_COLOR = 0xff3b81
const DEFAULT_WALL_ALPHA = 0.95

/** Build a pending-position map from the indicators ref for renderTokensWithPending */
function buildPendingMap(indicators: Map<string, PixiPendingIndicator>) {
    return new Map(
        Array.from(indicators.entries()).map(([id, ind]) => [id, { endX: ind.endX, endY: ind.endY }])
    )
}

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
    pixiOnBindFit: (fn: () => void) => void
    tokens: Token[]
    images: ImageData[]
    pixiOnTokenMove: (id: string, x: number, y: number, distanceTraveled?: number) => void
    onPendingCountChange: (count: number) => void
    pixiOnBindPendingControls: (acceptAll: () => void, cancelAll: () => void) => void
    gridColor: number
    gridAlpha: number
    wallColor: number
    wallAlpha: number
    walls: Wall[]
    pixiOnWallDraw: (walls: Wall[], mapKey: string) => void
    isErasingWalls: boolean
    isCombatActive: boolean
    onOpenTokenDialog: (id: string) => void
    setDeleteTokenDialogOpen: (id: string) => void
    panelTokenOnDuplicate: (id: string) => void
    panelTokenOnCut: (id: string) => void
    panelTokenOnCopy: (id: string) => void
    pixiOnTokenUpdate?: (id: string, updates: Partial<Token>) => void
    onMapDeleteAllTokens: () => void
    onMapDeleteAllWalls: () => void
    onMapDeleteAllBlasts: () => void
    pixiOnCutAllTokens: () => void
    pixiOnPasteToken: (tokens: Token[]) => void
    pixiOnPasteBlast: (blasts: Blast[]) => void
    tokenClipboard: Token[] | null
    blastClipboard: Blast[] | null
    activeTokenId: string | null
    pixiOnTokenDrop?: (tokenId: string, worldX: number, worldY: number) => void
    pixiSidePanelWidth: number
    blasts: Blast[]
    blastsNotInMap: Blast[]
    blastDrawMode: BlastType | null
    pixiOnBlastDrop?: (blastData: { type: BlastType; id?: string }, worldX: number, worldY: number) => void
    pixiOnBlastMove?: (blastId: string, worldX: number, worldY: number) => void
    pixiOnBlastComplete?: (blast: Blast) => void
    onBlastUpdateCone?: (blastId: string, x2: number, y2: number, x: number, y: number) => void
    onBlastDelete?: (id: string) => void
    onBlastCopy?: (id: string) => void
    onBlastCut?: (id: string) => void
    onBlastLock?: (id: string, locked: boolean) => void
    pixiReady: boolean
    pixiSetReady: (ready: boolean) => void
    pixiHostReady: boolean
    pixiSetHostReady: (ready: boolean) => void
    pixiSetTokenContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSetMapContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSetSelectedTokenId: (id: string | null) => void
    pixiSetBlastContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSetSelectedBlastId: (id: string | null) => void
    isPlayerConnected: boolean
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
        pixiOnBindFit: onBindFit,
        tokens = [],
        images = [],
        pixiOnTokenMove: onTokenMove,
        onPendingCountChange,
        pixiOnBindPendingControls: onBindPendingControls,
        gridColor = 0xffffff,
        gridAlpha = 0.5,
        wallColor = DEFAULT_WALL_COLOR,
        pixiSidePanelWidth = 0,
        wallAlpha = DEFAULT_WALL_ALPHA,
        mapKey,
        walls = [],
        pixiOnWallDraw: onWallsChange,
        isErasingWalls = false,
        isCombatActive = false,
        onOpenTokenDialog,
        setDeleteTokenDialogOpen,
        panelTokenOnDuplicate,
        panelTokenOnCut,
        panelTokenOnCopy,
        pixiOnTokenUpdate,
        onMapDeleteAllTokens,
        onMapDeleteAllWalls,
        onMapDeleteAllBlasts,
        pixiOnCutAllTokens: onMapCutAllTokens,
        pixiOnPasteToken: onMapPasteToken,
        pixiOnPasteBlast: onMapPasteBlast,
        tokenClipboard,
        blastClipboard,
        activeTokenId,
        pixiOnTokenDrop: onTokenDrop,
        blasts = [],
        blastsNotInMap = [],
        blastDrawMode,
        pixiOnBlastDrop: onBlastDrop,
        pixiOnBlastMove: onBlastMove,
        pixiOnBlastComplete: onBlastComplete,
        onBlastUpdateCone: onBlastUpdateCone,
        onBlastDelete,
        onBlastCopy,
        onBlastCut,
        onBlastLock,
        pixiReady,
        pixiSetReady,
        pixiHostReady,
        pixiSetHostReady,
        pixiSetTokenContextMenuAnchor,
        pixiSetMapContextMenuAnchor,
        pixiSetSelectedTokenId,
        pixiSetBlastContextMenuAnchor,
        pixiSetSelectedBlastId,
        isPlayerConnected,
    } = props
    const { readerMode } = useUserPreferences()
    const { sendAction, role, session, displayName, connected } = useSession()

    // Force re-render when textures are ready

    const [tokenRenderTrigger, forceTokenRender] = useState(0)
    const [blastRenderTrigger, forceBlastRender] = useState(0)
    const hasImmediateUpdatesRef = useRef<boolean>(false)
    const hostRef = useRef<HTMLDivElement | null>(null)
    const appRef = useRef<Application | null>(null)
    const viewportRef = useRef<Viewport | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)
    const gridRef = useRef<Graphics | null>(null)
    const wallLayerRef = useRef<Graphics | null>(null)

    // Function to create pending overlay with customizable accept button
    const createPendingOverlayWithOptions = (
        id: string,
        sx: number,
        sy: number,
        ex: number,
        ey: number,
        points?: { x: number; y: number }[],
        fromRemotePlayer?: boolean
    ) => {
        const viewport = viewportRef.current
        if (!viewport) return

        // Destroy existing overlay for this token if it exists
        const existingIndicator = pixiPendingIndicatorsRef.current.get(id)
        if (existingIndicator) {
            existingIndicator.destroy()
            pixiPendingIndicatorsRef.current.delete(id)
        }

        const token = tokensRef.current.find((t) => t.id === id)

        // Use provided points array or create default two-point array
        const indicatorPoints = points || [
            { x: sx, y: sy },
            { x: ex, y: ey },
        ]

        const indicator = new PixiPendingIndicator({
            id,
            startX: sx,
            startY: sy,
            endX: ex,
            endY: ey,
            points: indicatorPoints,
            gridSize: gridSizeRef.current,
            isCombatActive: isCombatActiveRef.current,
            token,
            viewport,
            isPlayerConnected: !isPlayerConnected,
            fromRemotePlayer: fromRemotePlayer ?? false,
            onAccept: () => {
                const ind = pixiPendingIndicatorsRef.current.get(id)
                if (!ind) {
                    return
                }

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

                // Send movement acceptance to synchronize with other players
                // DM always sends when in session, players only send for their own actions
                const inSession = !!session
                if (inSession) {
                    sendAction({
                        kind: 'PENDING_MOVEMENT',
                        tokenId: id,
                        points: pts,
                        mapId: mapKeyRef.current || '',
                    })
                }

                // Destroy indicator first so animation can take effect
                indicator.destroy()

                // Schedule animation after indicator is removed
                schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)

                // Update token position after animation is scheduled
                // First update tokensRef immediately to preserve customRadius
                tokensRef.current = tokensRef.current.map((t) => (t.id === id ? { ...t, x: ind.endX, y: ind.endY } : t))
                hasImmediateUpdatesRef.current = true
                onTokenMove(id, ind.endX, ind.endY, isCombatActiveRef.current ? totalDistance : undefined)

                pixiPendingIndicatorsRef.current.delete(id)
                onPendingCountChange(pixiPendingIndicatorsRef.current.size)
            },
            onCancel: () => {
                const ind = pixiPendingIndicatorsRef.current.get(id)
                if (!ind) {
                    return
                }

                if (ind.points.length < 2) {
                    // Cancel entire movement for 1 point
                    // Move token back to start position
                    // First update tokensRef immediately to preserve customRadius
                    tokensRef.current = tokensRef.current.map((t) =>
                        t.id === id ? { ...t, x: ind.props.startX, y: ind.props.startY } : t
                    )
                    hasImmediateUpdatesRef.current = true
                    onTokenMove(id, ind.props.startX, ind.props.startY)

                    // Remove indicator
                    ind.destroy()
                    pixiPendingIndicatorsRef.current.delete(id)
                    onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                } else {
                    // Remove last waypoint
                    ind.points.pop()
                    const newPoints = ind.points

                    // If after removing the waypoint we have 2 or fewer points, cancel entirely
                    if (newPoints.length <= 2) {
                        // Cancel entire movement
                        onTokenMove(id, ind.props.startX, ind.props.startY)

                        // Send rejection to synchronize with other players
                        // DM always sends when in session, players only send for their own actions
                        const inSession = !!session
                        if (inSession && (role === 'dm' || !fromRemotePlayer)) {
                            sendAction({
                                kind: 'REJECT_MOVEMENT',
                                tokenId: id,
                            })
                        }

                        // Remove indicator
                        ind.destroy()
                        pixiPendingIndicatorsRef.current.delete(id)
                        onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                    } else {
                        // Update to the new points
                        const newLastPoint = newPoints[newPoints.length - 1]
                        if (newLastPoint) {
                            // Only update the indicator's end position (ghost position), not the actual token position
                            ind.updatePosition(newLastPoint.x, newLastPoint.y)

                            // Send update to synchronize with other players
                            // DM always sends when in session, players only send for their own actions
                            const inSession = !!session
                            if (inSession && (role === 'dm' || !fromRemotePlayer)) {
                                sendAction({
                                    kind: 'PENDING_MOVEMENT',
                                    tokenId: id,
                                    points: newPoints,
                                    mapId: mapKeyRef.current || '',
                                })
                            }

                            // Update stored movement points
                            pendingMovementPointsRef.current.set(id, newPoints)

                            // Redraw to show updated ghost position (token stays at original position, ghost moves to new end)
                            const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                            renderTokensWithPending(
                                tokenLayerRef.current,
                                tokensRef.current,
                                gridSizeRef.current,
                                pendingMap
                            )
                        }
                    }
                }
            },
        })
        pixiPendingIndicatorsRef.current.set(id, indicator)
        onPendingCountChange(pixiPendingIndicatorsRef.current.size)
    }
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
    // Use hooks for context menus, clipboard, and callback refs
    const clipboard = usePixiClipboard({
        tokenClipboard,
        blastClipboard,
        mapKey,
        onMapPasteToken,
        onMapPasteBlast,
    })

    const callbackRefs = usePixiCallbackRefs({
        panelTokenOnDuplicate,
        panelTokenOnCopy,
        panelTokenOnCut,
        pixiOnCutAllTokens: onMapCutAllTokens,
        onBlastCopy,
        onBlastCut,
    })

    const contextMenus = usePixiContextMenus({
        viewportRef,
        setDeleteTokenDialogOpen,
        panelTokenOnDuplicateRef: callbackRefs.panelTokenOnDuplicateRef,
        panelTokenOnCutRef: callbackRefs.panelTokenOnCutRef,
        panelTokenOnCopyRef: callbackRefs.panelTokenOnCopyRef,
        pixiSetTokenContextMenuAnchor,
        pixiSetSelectedTokenId,
        onMapDeleteAllTokens,
        onMapDeleteAllWalls,
        onMapDeleteAllBlasts,
        pixiOnCutAllTokensRef: callbackRefs.pixiOnCutAllTokensRef,
        handleMapPasteToken: clipboard.handleMapPasteToken,
        handleMapPasteBlast: clipboard.handleMapPasteBlast,
        canPasteTokenRef: clipboard.canPasteTokenRef,
        canPasteBlastRef: clipboard.canPasteBlastRef,
        pixiSetMapContextMenuAnchor,
        onBlastDelete,
        onBlastCopyRef: callbackRefs.onBlastCopyRef,
        onBlastCutRef: callbackRefs.onBlastCutRef,
        onBlastLock,
        pixiSetBlastContextMenuAnchor,
        pixiSetSelectedBlastId,
    })
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
    // Store pending movement points for animation when accepted
    const pendingMovementPointsRef = useRef<Map<string, { x: number; y: number }[]>>(new Map())
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
    const pixiTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pixiPendingIndicatorsRef = useRef<Map<string, PixiPendingIndicator>>(new Map())

    const isMeasuringRef = useRef<boolean>(isMeasuring)
    const isWallModeRef = useRef<boolean>(isWallMode)
    const isErasingWallsRef = useRef<boolean>(isErasingWalls)
    const imagesRef = useRef<ImageData[]>(images)

    const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const dragPreviewRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const clickCandidateRef = useRef<{ id: string; x: number; y: number } | null>(null)

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

    const hideTooltip = () => {
        if (pixiTooltipTimeoutRef.current) {
            clearTimeout(pixiTooltipTimeoutRef.current)
            pixiTooltipTimeoutRef.current = null
        }
        pixiTooltipRef.current?.hide()
    }

    const cancelAllPending = () => {
        // Cancel all pending moves by sending REJECT_MOVEMENT messages
        const inSession = !!session
        pixiPendingIndicatorsRef.current.forEach((indicator, id) => {
            // Send rejection message to synchronize with other players
            if (inSession) {
                sendAction({
                    kind: 'REJECT_MOVEMENT',
                    tokenId: id,
                })
            }

            // Move token back to start position locally
            onTokenMove(id, indicator.startX, indicator.startY)

            // Destroy indicator
            indicator.destroy()
        })
        pixiPendingIndicatorsRef.current.clear()

        // Redraw tokens at their updated positions
        renderTokens(tokenLayerRef.current, tokensRef.current, gridSizeRef.current)
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

            // Send movement acceptance to synchronize with other players
            // DM always sends when in session
            const inSession = !!session
            if (inSession) {
                sendAction({
                    kind: 'PENDING_MOVEMENT',
                    tokenId: id,
                    points: pts,
                    mapId: mapKeyRef.current || '',
                })
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

            // Destroy indicator first so animation can take effect
            indicator.destroy()

            // Schedule animation after indicator is removed
            schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)

            // Update token position after animation is scheduled
            onTokenMove(id, indicator.endX, indicator.endY, isCombatActiveRef.current ? totalDistance : undefined)
        })
        pixiPendingIndicatorsRef.current.clear()
        // After committing, redraw tokens (parent will also update tokens prop shortly)
        renderTokens(tokenLayerRef.current, tokensRef.current, gridSizeRef.current)
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
    // Also detect stale pixiReady from ThreeBoard: if pixiReady is true but we have no PIXI app,
    // it means ThreeBoard set it and we need to reset before our effects fire.
    useLayoutEffect(() => {
        if (pixiReady && !appRef.current) {
            pixiSetReady(false)
        }
        if (hostRef.current && !pixiHostReady) {
            pixiSetHostReady(true)
        }
    })
    // Set up texture ready callback
    useEffect(() => {
        setTexturesReadyCallback(() => {
            forceTokenRender((prev) => prev + 1)
        })
    }, [])

    // Listen for pending movements from players (both DM and players can receive these)
    useEffect(() => {
        const handlePendingMovement = (event: CustomEvent) => {
            const { tokenId, points, mapId } = event.detail

            // Only show movements for the current map
            if (mapId !== mapKey) return

            // Store the movement points for animation when accepted
            pendingMovementPointsRef.current.set(tokenId, points)

            // Create or update the overlay with appropriate accept button visibility
            if (points.length >= 2) {
                // Check if there's an existing indicator - if so, check if this is an acceptance or update
                const existingIndicator = pixiPendingIndicatorsRef.current.get(tokenId)
                const startPoint = points[0]
                const endPoint = points[points.length - 1]

                // Calculate total distance traveled along all segments
                const step = gridSizeRef.current
                let totalDistance = 0
                for (let i = 1; i < points.length; i++) {
                    const dxs = Math.abs(points[i].x - points[i - 1].x)
                    const dys = Math.abs(points[i].y - points[i - 1].y)
                    totalDistance += Math.hypot(dxs, dys) / step
                }
                totalDistance = Math.round(totalDistance)

                if (existingIndicator) {
                    // Check if this is DM acceptance:
                    // 1. Points match the indicator's end point (DM sent final accepted points)
                    // 2. Token is already at the end point (start=end case, or token already moved)
                    const pointsMatchIndicatorEnd =
                        existingIndicator.endX === endPoint.x && existingIndicator.endY === endPoint.y

                    // Check token position from both tokensRef and tokens prop (in case one is more up-to-date)
                    const tokenFromRef = tokensRef.current.find((t) => t.id === tokenId)
                    const tokenFromProp = tokens.find((t) => t.id === tokenId)
                    const token = tokenFromProp || tokenFromRef
                    const tokenAtEnd = token && token.x === endPoint.x && token.y === endPoint.y

                    // For start=end movements, check if start equals end
                    const startEqualsEnd = startPoint.x === endPoint.x && startPoint.y === endPoint.y

                    // Also check if the received points array matches the indicator's points array
                    // This handles the case where DM self-accepts and sends the exact same points
                    const indicatorPoints = existingIndicator.points
                    const pointsMatchIndicatorPoints =
                        indicatorPoints.length === points.length &&
                        indicatorPoints.every((p, i) => p.x === points[i].x && p.y === points[i].y)

                    // Also check if the last point matches the indicator's end point
                    const lastPointMatchesIndicatorEnd =
                        points.length > 0 &&
                        points[points.length - 1].x === existingIndicator.endX &&
                        points[points.length - 1].y === existingIndicator.endY

                    // If points match indicator end AND (token is at end OR it's a start=end movement), this is DM acceptance
                    // For start=end movements, we accept if points match even if token position isn't synced yet
                    // Also accept if the points array exactly matches (DM self-acceptance case)
                    // OR if it's start=end and the last point matches the indicator's end point
                    if (
                        (pointsMatchIndicatorEnd && (tokenAtEnd || startEqualsEnd)) ||
                        (startEqualsEnd && pointsMatchIndicatorPoints) ||
                        (startEqualsEnd && lastPointMatchesIndicatorEnd)
                    ) {
                        // DM accepted the movement - store points and trigger animation
                        // Keep indicator visible during animation, it will be removed when animation completes
                        pendingMovementPointsRef.current.set(tokenId, points)

                        // Trigger animation (even if start=end with distance > 0, we should play animation)
                        schedulePathAnimation(tokenId, points, gridSizeRef.current, animationsRef.current)

                        // Redraw with indicator still visible (will be removed when animation completes)
                        const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                        renderTokensWithPending(
                            tokenLayerRef.current,
                            tokensRef.current,
                            gridSizeRef.current,
                            pendingMap
                        )
                        return
                    }

                    // This is an update, not an acceptance - update the existing indicator
                    existingIndicator.updatePoints(points)
                    // Update stored movement points
                    pendingMovementPointsRef.current.set(tokenId, points)
                    // Redraw to show updated indicator and ghost position
                    const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                    renderTokensWithPending(tokenLayerRef.current, tokensRef.current, gridSizeRef.current, pendingMap)
                    return
                }

                // No existing indicator, create a new one
                // For circular movements (start=end with distance > 0), create indicator and trigger animation immediately
                // The indicator will be removed when the animation completes
                const startEqualsEnd = startPoint.x === endPoint.x && startPoint.y === endPoint.y

                // Store the movement points for animation
                pendingMovementPointsRef.current.set(tokenId, points)
                createPendingOverlayWithOptions(
                    tokenId,
                    startPoint.x,
                    startPoint.y,
                    endPoint.x,
                    endPoint.y,
                    points,
                    true
                )

                // Redraw to show the indicator and ghost position
                const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                renderTokensWithPending(tokenLayerRef.current, tokensRef.current, gridSizeRef.current, pendingMap)

                // If player receives PENDING_MOVEMENT from DM, start the animation
                // For circular movements (start=end with distance > 0), trigger animation immediately
                // since token position won't change
                if (role === 'player' || (startEqualsEnd && totalDistance > 0)) {
                    schedulePathAnimation(tokenId, points, gridSizeRef.current, animationsRef.current)
                }
            }
        }

        window.addEventListener('pendingMovementReceived', handlePendingMovement as EventListener)
        return () => {
            window.removeEventListener('pendingMovementReceived', handlePendingMovement as EventListener)
        }
    }, [mapKey, tokens])

    // Listen for pending movement cleanup events
    useEffect(() => {
        const handleCleanupPendingMovement = (event: CustomEvent) => {
            const { tokenId } = event.detail

            // Remove the pending overlay for this token
            const indicator = pixiPendingIndicatorsRef.current.get(tokenId)
            if (indicator) {
                indicator.destroy()
                pixiPendingIndicatorsRef.current.delete(tokenId)
                onPendingCountChange(pixiPendingIndicatorsRef.current.size)
            }

            // Note: stored movement points are cleared after animation scheduling, not here
        }

        window.addEventListener('cleanupPendingMovement', handleCleanupPendingMovement as EventListener)
        return () => {
            window.removeEventListener('cleanupPendingMovement', handleCleanupPendingMovement as EventListener)
        }
    }, [])

    // Listen for pending movement rejection events
    useEffect(() => {
        const handlePendingMovementRejected = (event: CustomEvent) => {
            const { tokenId } = event.detail

            // Remove the pending overlay for this token (applies to all maps)
            const indicator = pixiPendingIndicatorsRef.current.get(tokenId)
            if (indicator) {
                // Move token back to the start position of the pending movement
                onTokenMove(tokenId, indicator.startX, indicator.startY)

                // Destroy the indicator
                indicator.destroy()
                pixiPendingIndicatorsRef.current.delete(tokenId)
                onPendingCountChange(pixiPendingIndicatorsRef.current.size)

                // Clear stored movement points
                pendingMovementPointsRef.current.delete(tokenId)
            }
        }

        window.addEventListener('pendingMovementRejected', handlePendingMovementRejected as EventListener)
        return () => {
            window.removeEventListener('pendingMovementRejected', handlePendingMovementRejected as EventListener)
        }
    }, [])

    // Listen for pending movement update events (segment changes)
    useEffect(() => {
        const handlePendingMovementUpdated = (event: CustomEvent) => {
            const { tokenId, points, mapId } = event.detail

            // Only handle updates for the current map
            if (mapId !== mapKey) {
                return
            }

            // Update the pending overlay for this token
            const indicator = pixiPendingIndicatorsRef.current.get(tokenId)
            if (indicator) {
                // Update the points and reposition the indicator
                indicator.updatePoints(points)

                // Update stored movement points for animation
                pendingMovementPointsRef.current.set(tokenId, points)

                // Redraw to show updated ghost position (token stays at original position, ghost moves to new end)
                const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                renderTokensWithPending(tokenLayerRef.current, tokensRef.current, gridSizeRef.current, pendingMap)
            }
        }

        window.addEventListener('pendingMovementUpdated', handlePendingMovementUpdated as EventListener)
        return () => {
            window.removeEventListener('pendingMovementUpdated', handlePendingMovementUpdated as EventListener)
        }
    }, [mapKey])

    // Listen for indicator cancel events
    useEffect(() => {
        const handleIndicatorCancel = (event: CustomEvent) => {
            const { tokenId } = event.detail

            const ind = pixiPendingIndicatorsRef.current.get(tokenId)
            if (!ind) {
                return
            }

            if (ind.points.length < 2) {
                // Cancel entire movement for 1 point
                onTokenMove(tokenId, ind.props.startX, ind.props.startY)

                // Remove indicator
                ind.destroy()
                pixiPendingIndicatorsRef.current.delete(tokenId)
                onPendingCountChange(pixiPendingIndicatorsRef.current.size)
            } else {
                // Remove last waypoint
                ind.points.pop()
                const newPoints = ind.points

                // If after removing the waypoint we have 2 or fewer points, cancel entirely
                if (newPoints.length <= 2) {
                    // Cancel entire movement
                    onTokenMove(tokenId, ind.props.startX, ind.props.startY)

                    // Send rejection to synchronize with other players
                    const inSession = !!session
                    if (inSession) {
                        sendAction({
                            kind: 'REJECT_MOVEMENT',
                            tokenId,
                        })
                    }

                    // Remove indicator
                    ind.destroy()
                    pixiPendingIndicatorsRef.current.delete(tokenId)
                    onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                } else {
                    // Update to the new points
                    const newLastPoint = newPoints[newPoints.length - 1]
                    if (newLastPoint) {
                        // Only update the indicator's end position (ghost position), not the actual token position
                        ind.updatePosition(newLastPoint.x, newLastPoint.y)

                        // Send update to synchronize with other players
                        const inSession = !!session
                        if (inSession) {
                            sendAction({
                                kind: 'PENDING_MOVEMENT',
                                tokenId,
                                points: newPoints,
                                mapId: mapKeyRef.current || '',
                            })
                        }

                        // Update stored movement points
                        pendingMovementPointsRef.current.set(tokenId, newPoints)

                        // Redraw to show updated ghost position (token stays at original position, ghost moves to new end)
                        const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                        renderTokensWithPending(
                            tokenLayerRef.current,
                            tokensRef.current,
                            gridSizeRef.current,
                            pendingMap
                        )
                    }
                }
            }
        }

        window.addEventListener('indicatorCancel', handleIndicatorCancel as EventListener)
        return () => {
            window.removeEventListener('indicatorCancel', handleIndicatorCancel as EventListener)
        }
    }, [session, sendAction])

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
                const ringRadius = (gridSizeRef.current / 2) * 1.5

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
                const lineLength = (gridSizeRef.current / 2) * 2.5
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
            wallLayerRef.current.clear()
            drawWallsOnGraphics(wallLayerRef.current, wallsRef.current)
        }
    }, [walls])
    // Keep latest mapKey
    useEffect(() => {
        mapKeyRef.current = mapKey
    }, [mapKey])
    // Redraw grid when size, color, alpha, or world dims change
    useEffect(() => {
        gridSizeRef.current = gridSize
        gridColorRef.current = gridColor
        gridAlphaRef.current = gridAlpha
        if (!gridRef.current) return
        const { w: gw, h: gh } = getTargetSize(backgroundRef.current, worldDims)
        gridRef.current.clear()
        drawGrid(gridRef.current, gw, gh, gridSize, gridColor, gridAlpha)
    }, [gridSize, gridColor, gridAlpha, worldDims])
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
            // Ensure viewport is interactive to receive pointer events
            viewport.interactive = true
            viewport.eventMode = 'static'
            app.stage.addChild(viewport)
            viewportRef.current = viewport

            // Prevent browser zoom and handle token resizing when Shift+wheel
            const handleShiftWheel = (e: globalThis.WheelEvent) => {
                if (e.shiftKey) {
                    e.preventDefault()
                    e.stopImmediatePropagation()

                    // Handle token resizing directly
                    const rect = hostRef.current?.getBoundingClientRect()
                    if (!rect) return

                    // Convert screen coordinates to viewport coordinates
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top

                    // Convert to world coordinates
                    const worldPoint = viewport.toWorld({ x, y })

                    // Find token under mouse
                    let hitToken: Token | null = null
                    let minDist = Number.POSITIVE_INFINITY
                    for (const t of tokensRef.current) {
                        const pending = pixiPendingIndicatorsRef.current.get(t.id)
                        const tx = pending ? pending.endX : t.x
                        const ty = pending ? pending.endY : t.y
                        const currentRadius = t.customRadius ?? gridSizeRef.current / 2
                        const d = Math.hypot(tx - worldPoint.x, ty - worldPoint.y)
                        if (d <= currentRadius && d < minDist) {
                            hitToken = { ...t, x: tx, y: ty }
                            minDist = d
                        }
                    }

                    if (hitToken) {
                        const delta = e.deltaY < 0 ? 1 : -1 // Negative deltaY means wheel up (increase size)
                        const gridSize = gridSizeRef.current
                        const sizeIncrement = gridSize / 2
                        const currentRadius = hitToken.customRadius ?? gridSize / 2
                        const newRadius = Math.max(0, currentRadius + delta * sizeIncrement)

                        // Update token immediately for instant visual feedback
                        const updatedToken = { ...hitToken, customRadius: newRadius > 0 ? newRadius : undefined }
                        tokensRef.current = tokensRef.current.map((t) => (t.id === hitToken!.id ? updatedToken : t))
                        hasImmediateUpdatesRef.current = true

                        // Update sprites directly to avoid ghost effect and ensure hit area is correct
                        const sprite = spriteCache.get(hitToken.id)
                        if (sprite) {
                            const scale = (newRadius * 2) / Math.max(sprite.texture.width, sprite.texture.height)
                            sprite.scale.set(scale)
                            sprite.hitArea = new Circle(0, 0, newRadius)
                        }

                        // Also update ghost sprite if it exists
                        const ghostKey = `${hitToken.id}_ghost`
                        const ghostSprite = ghostSpriteCache.get(ghostKey)
                        if (ghostSprite) {
                            const scale =
                                (newRadius * 2) / Math.max(ghostSprite.texture.width, ghostSprite.texture.height)
                            ghostSprite.scale.set(scale)
                            ghostSprite.hitArea = new Circle(0, 0, newRadius)
                        }

                        // Update the main state and database
                        pixiOnTokenUpdate?.(hitToken.id, {
                            customRadius: newRadius > 0 ? newRadius : undefined,
                        })

                    }
                }
            }
            // Add to host element for wheel event handling
            if (hostRef.current) {
                hostRef.current.addEventListener('wheel', handleShiftWheel, { passive: false, capture: true })

                // Store cleanup function
                const cleanup = () => {
                    hostRef.current?.removeEventListener('wheel', handleShiftWheel)
                }
                cleanupRef.current = cleanup
            } else {
                // Fallback cleanup function
                cleanupRef.current = () => {}
            }

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
            preloadBlastTextures()
                .then(() => { if (!destroyed) forceBlastRender((prev) => prev + 1) })
                .catch((err) => console.error('Failed to preload blast textures:', err))

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

                        // Remove pending indicator when animation completes
                        const indicator = pixiPendingIndicatorsRef.current.get(id)
                        if (indicator) {
                            indicator.destroy()
                            pixiPendingIndicatorsRef.current.delete(id)
                            onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                            // Clear stored points when animation completes
                            pendingMovementPointsRef.current.delete(id)
                        }

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
                // Begin with current pending endpoints, but animations take priority
                const merged = new Map(
                    Array.from(pixiPendingIndicatorsRef.current.entries())
                        .filter(([id]) => !override.has(id)) // Only include pendings without active animations
                        .map(([id, ind]) => [id, { endX: ind.endX, endY: ind.endY }])
                )
                // Apply animation overrides (these take priority over pending indicators)
                for (const [id, pos] of override) {
                    merged.set(id, pos)
                }
                // Include live drag override if present
                const live = dragPreviewRef.current
                renderTokensWithPending(
                    tokenLayerRef.current,
                    tokensRef.current,
                    gridSizeRef.current,
                    merged,
                    live?.id,
                    live?.x,
                    live?.y
                )

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
                        const ringRadius = (gridSizeRef.current / 2) * 1.5

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
                        const lineLength = (gridSizeRef.current / 2) * 2.5
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
                        isPlayerConnected: !isPlayerConnected,
                        onAccept: () => {
                            const ind = pixiPendingIndicatorsRef.current.get(id)
                            if (!ind) {
                                return
                            }

                            // Calculate total distance traveled
                            const step = gridSizeRef.current
                            let totalDistance = 0
                            const pts = [...ind.points]
                            const last = pts[pts.length - 1]
                            if (!last || last.x !== ind.endX || last.y !== ind.endY) {
                                pts.push({ x: ind.endX, y: ind.endY })
                            }

                            // Send movement acceptance to synchronize with other players
                            // DM always sends when in session, players only send for their own actions
                            // Send pts (with end point included) so player can detect acceptance
                            const inSession = !!session
                            if (inSession) {
                                sendAction({
                                    kind: 'PENDING_MOVEMENT',
                                    tokenId: id,
                                    points: pts,
                                    mapId: mapKeyRef.current || '',
                                })
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

                            // Remove indicator first so animation can take effect
                            ind.destroy()
                            pixiPendingIndicatorsRef.current.delete(id)
                            onPendingCountChange(pixiPendingIndicatorsRef.current.size)

                            // Schedule animation after indicator is removed
                            schedulePathAnimation(id, pts, gridSizeRef.current, animationsRef.current)

                            // Update token position after animation is scheduled
                            onTokenMove?.(id, ind.endX, ind.endY, isCombatActiveRef.current ? totalDistance : undefined)

                            // Redraw with remaining pending overlays
                            const pendingMapAfter = buildPendingMap(pixiPendingIndicatorsRef.current)
                            renderTokensWithPending(
                                tokenLayerRef.current,
                                tokensRef.current,
                                gridSizeRef.current,
                                pendingMapAfter
                            )
                        },
                        onCancel: () => {
                            const ind = pixiPendingIndicatorsRef.current.get(id)
                            if (!ind) return

                            if (ind.points.length < 4) {
                                // Only start point exists, cancel entire movement
                                // Move token back to start position
                                onTokenMove(id, ind.props.startX, ind.props.startY)

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
                                    const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                                    renderTokensWithPending(
                                        tokenLayerRef.current,
                                        tokensRef.current,
                                        gridSizeRef.current,
                                        pendingMap
                                    )
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
                hideTooltip()
    

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
                    hit = findTokenHit(x, y, tokensRef.current, gridSizeRef.current, pixiPendingIndicatorsRef.current)

                    if (hit) {
                        // In measure mode, start measurement from token position instead of selecting the token
                        if (isMeasuringRef.current) {
                            if (btn === 0) {
                                // Only for left clicks
                                const step = gridSizeRef.current
                                const startSnapped = snapToNinePoints(hit.x, hit.y, step, snapToGridRef.current)
                                measureStartRef.current = { x: startSnapped.x, y: startSnapped.y }
                            }
                            return
                        }

                        // In a session, players can only interact with tokens they own
                        const inSession = !!session && connected
                        if (inSession && role === 'player' && hit.owner !== displayName) {
                            return // Don't allow interaction with tokens owned by other players
                        }

                        if (btn === 2) {
                            // Right click on token: open token context menu
                            contextMenus.openTokenContextMenu(x, y, hit.id)
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
                        clickedBlast = findBlastHit(x, y, blastsRef.current, gridSizeRef.current)

                        if (clickedBlast) {
                            if (btn === 2) {
                                // Right click on blast: open blast context menu
                                contextMenus.openBlastContextMenu(x, y, clickedBlast)
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
                // This needs to be OUTSIDE the btn === 0 || btn === 2 block to catch all right-clicks
                if (btn === 2 && !hit && !clickedBlast) {
                    // Check if we're in a special mode that should prevent map menu
                    if (!blastDrawModeRef.current && !isWallModeRef.current && !isMeasuringRef.current) {
                        // Right click on empty map: open map context menu
                        contextMenus.openMapContextMenu(x, y)
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
                    wallLayerRef.current.clear()
                    drawWallsOnGraphics(wallLayerRef.current, wallsRef.current)
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
                    wallLayerRef.current.clear()
                    drawWallsOnGraphics(wallLayerRef.current, wallsRef.current)
                }
                if (draggingRef.current && draggingRef.current.id) {
                    const endedId = draggingRef.current.id
                    draggingRef.current = { id: null, offsetX: 0, offsetY: 0 }
                    if (dragPreviewRef.current && dragPreviewRef.current.id === endedId) {
                        const indicator = pixiPendingIndicatorsRef.current.get(endedId)
                        if (indicator) {
                            // If the user dragged back to the start position AND total path distance is 0, remove the indicator
                            const distance = Math.sqrt(
                                (indicator.endX - indicator.startX) ** 2 + (indicator.endY - indicator.startY) ** 2
                            )
                            // Calculate total path distance (sum of all segments)
                            let totalPathDistance = 0
                            for (let i = 1; i < indicator.points.length; i++) {
                                const dx = indicator.points[i].x - indicator.points[i - 1].x
                                const dy = indicator.points[i].y - indicator.points[i - 1].y
                                totalPathDistance += Math.sqrt(dx * dx + dy * dy)
                            }
                            if (distance === 0 && totalPathDistance === 0) {
                                indicator.destroy()
                                pixiPendingIndicatorsRef.current.delete(endedId)
                                onPendingCountChange(pixiPendingIndicatorsRef.current.size)
                                clickCandidateRef.current = null
                                return
                            }
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

                                // If player in session, send updated pending movement with all points
                                if (isPlayerConnected) {
                                    sendAction({
                                        kind: 'PENDING_MOVEMENT',
                                        tokenId: endedId,
                                        points: indicator.points,
                                        mapId: mapKeyRef.current || '',
                                    })
                                    // Also store locally for animation when accepted
                                    pendingMovementPointsRef.current.set(endedId, indicator.points)
                                }
                            }
                        }

                        // Note: PENDING_MOVEMENT sending is handled in the waypoint logic above
                        // No need to send final movement here as it's redundant

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
                            typeof onOpenTokenDialog === 'function'
                        ) {
                            onOpenTokenDialog(cand.id)
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
                        const radius = t.customRadius ?? gridSizeRef.current / 2
                        if (d <= radius) {
                            over = true
                            hoveredTokenData = t
                            break
                        }
                    }

                    // Set cursor based on whether player can interact with the hovered token
                    if (over && hoveredTokenData) {
                        const inSession = !!session && connected
                        const canInteract = !inSession || role !== 'player' || hoveredTokenData.owner === displayName
                        viewport.cursor = canInteract ? 'pointer' : 'not-allowed'
                    } else {
                        viewport.cursor = 'default'
                    }

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
                            hideTooltip()

                            // Set timeout to show tooltip after 500ms delay
                            pixiTooltipTimeoutRef.current = setTimeout(() => {
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
                
                                pixiTooltipTimeoutRef.current = null
                            }, 500)
                        } else {
                            hideTooltip()
                
                        }
                    } else {
                        // Clear timeout and hide tooltip
                        hideTooltip()
            
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
                    const s1 = { x: sx, y: sy }
                    const s2 = { x: ex, y: ey }
                    const highlightedWalls = wallsRef.current.map((w) => {
                        const wallShape = w.shape || 'line'
                        let hit = false
                        if (wallShape === 'line') {
                            hit = segmentsIntersect(s1, s2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })
                        } else if (wallShape === 'rectangle') {
                            hit = segmentIntersectsRectangle(s1, s2, w.x1, w.y1, w.x2, w.y2)
                        } else if (wallShape === 'circle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            hit = segmentHitsCircleBoundary(s1, s2, centerX, centerY, radius)
                        }
                        return hit ? { ...w, color: 0xff0000, alpha: 0.95 } : w
                    })
                    drawWallsOnGraphics(g, highlightedWalls)
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
                    drawWallsOnGraphics(g, wallsRef.current)
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

                // In a session, players can only drag tokens they own
                const inSession = !!session && connected
                if (inSession && role === 'player') {
                    const token = tokensRef.current.find((t) => t.id === draggingRef.current!.id)
                    if (token && token.owner !== displayName) {
                        return // Don't allow dragging tokens owned by other players
                    }
                }

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
                    gridSizeRef.current,
                    buildPendingMap(pixiPendingIndicatorsRef.current),
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

                // Measurement move
                if (measureStartRef.current) {
                    const step = gridSizeRef.current
                    const sx = measureStartRef.current.x
                    const sy = measureStartRef.current.y
                    const endSnapped = snapToNinePoints(global.x, global.y, step, snapToGridRef.current)
                    const ex = endSnapped.x
                    const ey = endSnapped.y
                    const dx = Math.abs(ex - sx)
                    const dy = Math.abs(ey - sy)
                    const cells = Math.hypot(dx, dy) / step
                    const g = measureLayerRef.current
                    if (g) {
                        g.clear()
                        g.setStrokeStyle({ width: 2, color: 0xff3b81, alpha: 0.9 })
                        g.moveTo(sx, sy)
                        g.lineTo(ex, ey)
                        g.stroke()
                        g.circle(sx, sy, 3).fill({ color: 0xff3b81 })
                        g.circle(ex, ey, 3).fill({ color: 0xff3b81 })
                    }
                    const label = measureLabelRef.current
                    if (label) {
                        const txt = snapToGridRef.current ? `${Math.round(cells * 2)}m` : `${(cells * 2).toFixed(2)}m`
                        label.text = txt
                        const zoom = viewportRef.current ? Math.max(0.1, viewportRef.current.scale.x) : 1
                        label.style.fontSize = Math.max(24, 24 / zoom)
                        label.visible = true
                        label.x = ex + 8
                        label.y = ey - 8
                        if (label.parent) {
                            label.parent.addChild(label)
                        }
                    }
                }
            })

            // Expose accept/cancel-all controls
            onBindPendingControls?.(acceptAllPending, cancelAllPending)

            // Mark board as ready now that viewport, background and all layers are set up.
            // This ensures rendering effects fire even when pixiReady was stale from ThreeBoard.
            if (!destroyed) {
                pixiSetReady(true)
            }
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
            // Close context menus
            contextMenus.closeAllContextMenus()

            // Clear PixiTooltip
            if (pixiTooltipTimeoutRef.current) {
                clearTimeout(pixiTooltipTimeoutRef.current)
                pixiTooltipTimeoutRef.current = null
            }
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
    // Resize handler
    useEffect(() => {
        if (!appRef.current || !viewportRef.current) return
        appRef.current.renderer.resize(width, height)
        viewportRef.current.resize(width, height, worldDims.worldWidth, worldDims.worldHeight)
        // redraw tokens after resize
        renderTokens(tokenLayerRef.current, tokens, gridSize)
    }, [width, height, worldDims, gridSize])
    // Keep measuring ref in sync so event handlers see latest value
    useEffect(() => {
        isMeasuringRef.current = isMeasuring
        // Hide PixiTooltip when entering measuring mode
        if (isMeasuring) {
            hideTooltip()

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
            hideTooltip()

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
    }, [mapTexture, pixiReady, worldDims])
    // Create and bind fit function with current dimensions
    useEffect(() => {
        if (!viewportRef.current) return
        if (!onBindFit) return
        const viewport = viewportRef.current
        const fitFn = () => {
            // Prevent fit-to-bounds during token animations or pending movements to avoid disrupting player view
            if (animationsRef.current.size > 0 || pixiPendingIndicatorsRef.current.size > 0) {
                return
            }

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

        // Don't overwrite tokensRef if we just did an immediate update
        if (!hasImmediateUpdatesRef.current) {
            tokensRef.current = tokens
        } else {
            // We had immediate updates, reset the flag for next time
            hasImmediateUpdatesRef.current = false
        }
        const prev = prevTokensRef.current
        const prevById = new Map<string, Token>(prev.map((t) => [t.id, t]))
        let anyAnimated = false
        // Build animation entries for moved tokens that are not currently pending and not already animating
        for (const t of tokens) {
            const p = prevById.get(t.id)
            if (!p) continue
            const hasStoredPoints = pendingMovementPointsRef.current.has(t.id)
            const existingAnimation = animationsRef.current.get(t.id)

            // If there's an existing animation and we have stored points for waypoint animation,
            // remove the existing animation and allow waypoint animation
            const storedPoints = pendingMovementPointsRef.current.get(t.id)
            if (existingAnimation && hasStoredPoints && storedPoints && storedPoints.length > 2) {
                // Remove existing animation to allow waypoint animation
                animationsRef.current.delete(t.id)
            }

            // Skip if there's still an animation and no stored points for replacement
            if (animationsRef.current.has(t.id) && !(hasStoredPoints && storedPoints && storedPoints.length > 2)) {
                continue
            }

            // Skip if there's a pending indicator but no stored points (waiting for points to be stored)
            if (pixiPendingIndicatorsRef.current.has(t.id) && !hasStoredPoints) continue
            if (p.x !== t.x || p.y !== t.y) {
                // Use stored movement points if available (for waypoint animations), otherwise use simple start/end
                const storedPoints = pendingMovementPointsRef.current.get(t.id)
                if (storedPoints && storedPoints.length > 2) {
                    // Use the stored waypoint path, but update the final point to the actual new position
                    const animationPoints = [...storedPoints]
                    const lastPoint = animationPoints[animationPoints.length - 1]
                    if (lastPoint.x !== t.x || lastPoint.y !== t.y) {
                        animationPoints[animationPoints.length - 1] = { x: t.x, y: t.y }
                    }
                    schedulePathAnimation(t.id, animationPoints, gridSizeRef.current, animationsRef.current)
                    // Clear the stored points after use
                    pendingMovementPointsRef.current.delete(t.id)
                } else {
                    // Simple direct animation
                    schedulePathAnimation(
                        t.id,
                        [
                            { x: p.x, y: p.y },
                            { x: t.x, y: t.y },
                        ],
                        gridSizeRef.current,
                        animationsRef.current
                    )
                }
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
            renderTokensWithPending(
                tokenLayerRef.current,
                tokensRef.current,
                gridSizeRef.current,
                override,
                live?.id,
                live?.x,
                live?.y
            )
        } else {
            // No animations; check if there are pending moves
            if (pixiPendingIndicatorsRef.current.size > 0) {
                const pendingMap = buildPendingMap(pixiPendingIndicatorsRef.current)
                // Always use tokensRef.current for immediate updates
                renderTokensWithPending(tokenLayerRef.current, tokensRef.current, gridSizeRef.current, pendingMap)
            } else {
                // No pending moves, just render tokens normally
                // Always use tokensRef.current for immediate updates
                renderTokens(tokenLayerRef.current, tokensRef.current, gridSizeRef.current)
            }
        }
    }, [tokens, images, pixiReady, tokenRenderTrigger])
    // Render blasts when they change
    useEffect(() => {
        if (!pixiReady) return
        blastsRef.current = blasts
        blastsNotInMapRef.current = blastsNotInMap
        renderBlasts(blastLayerRef.current, blasts, gridSize)
    }, [blasts, blastsNotInMap, gridSize, pixiReady, blastRenderTrigger])
    // Keep refs in sync — mode refs
    useEffect(() => {
        snapToGridRef.current = snapToGrid
        blastDrawModeRef.current = blastDrawMode
        wallDrawingShapeRef.current = wallDrawingShape
        isWallModeRef.current = isWallMode
        isCombatActiveRef.current = isCombatActive
    }, [snapToGrid, blastDrawMode, wallDrawingShape, isWallMode, isCombatActive])
    // Keep refs in sync — wall style refs
    useEffect(() => {
        wallColorRef.current = wallColor
        wallAlphaRef.current = wallAlpha
    }, [wallColor, wallAlpha])
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
            wallLayerRef.current.clear()
            drawWallsOnGraphics(wallLayerRef.current, wallsRef.current)
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
        </>
    )
}

export default PixiBoard
