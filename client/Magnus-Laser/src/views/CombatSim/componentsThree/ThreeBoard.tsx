import { Texture } from 'pixi.js'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useSession } from '../../../state/sessionStore'
import {
    segmentHitsCircleBoundary,
    segmentIntersectsRectangle,
    segmentsIntersect,
} from '../utils/geometryUtils'
import { snapToNinePoints } from '../utils/gridUtils'
import type { Blast, BlastType, Image as ImageData, Token, Wall, WallShape } from '../utils/types'
import { useThreeCallbackRefs } from './hooks/useThreeCallbackRefs'
import { useThreeClipboard } from './hooks/useThreeClipboard'
import { useThreeContextMenus } from './hooks/useThreeContextMenus'
import { createFallbackBlastModel, createFallbackTokenModel, loadModel, loadTexture } from './loaders/ModelLoader'
import {
    createActiveTokenMaterial,
    createCyberpunkBlastMaterial,
    createCyberpunkTokenMaterial,
    createCyberpunkWallMaterial,
} from './materials/cyberpunkMaterials'
import { useBlastPreview } from './ThreeBoardBlastPreview'
import { createTokenLabel, useCSS2DRenderer } from './ThreeBoardLabel'
import { useMeasureTool } from './ThreeBoardMeasure'
import { useWallPreview } from './ThreeBoardWallPreview'
import { createThreePendingIndicator } from './ThreePendingIndicator'
import { useThreeTooltip } from './ThreeTooltip'

type ThreeBoardProps = {
    width: number
    height: number
    gridSize: number
    snapToGrid: boolean
    isMeasuring: boolean
    isWallMode: boolean
    wallDrawingShape: WallShape | undefined
    mapKey: string
    mapTexture: Texture | null
    tokens: Token[]
    images: ImageData[]
    pixiOnTokenMove: (id: string, x: number, y: number, distanceTraveled?: number) => void
    gridColor: number
    gridAlpha: number
    wallColor: number
    wallAlpha: number
    walls: Wall[]
    pixiOnWallDraw: (walls: Wall[], mapKey: string) => void
    isErasingWalls: boolean
    isCombatActive: boolean
    activeTokenId: string | null
    blasts: Blast[]
    blastsNotInMap: Blast[]
    blastDrawMode: BlastType | null
    pixiOnBlastDrop?: (blastData: { type: BlastType; id?: string }, worldX: number, worldY: number) => void
    pixiOnBlastMove?: (blastId: string, worldX: number, worldY: number) => void
    pixiOnBlastComplete?: (blast: Blast) => void
    onBlastDelete?: (id: string) => void
    pixiReady: boolean
    pixiSetReady: (ready: boolean) => void
    pixiHostReady: boolean
    pixiSetHostReady: (ready: boolean) => void
    // Token operations
    onOpenTokenDialog?: (id: string) => void
    setDeleteTokenDialogOpen?: (id: string) => void
    panelTokenOnDuplicate?: (id: string) => void
    panelTokenOnCut?: (id: string) => void
    panelTokenOnCopy?: (id: string) => void
    pixiOnTokenUpdate?: (id: string, updates: Partial<Token>) => void
    pixiOnTokenDrop?: (tokenId: string, worldX: number, worldY: number) => void
    // Map operations
    onMapDeleteAllTokens?: () => void
    onMapDeleteAllWalls?: () => void
    onMapDeleteAllBlasts?: () => void
    pixiOnCutAllTokens?: () => void
    pixiOnPasteToken?: (tokens: Token[]) => void
    pixiOnPasteBlast?: (blasts: Blast[]) => void
    // Clipboard
    tokenClipboard?: Token[] | null
    blastClipboard?: Blast[] | null
    // Context menus
    pixiTokenContextMenuAnchor?: HTMLElement | null
    pixiSetTokenContextMenuAnchor?: (anchor: HTMLElement | null) => void
    pixiMapContextMenuAnchor?: HTMLElement | null
    pixiSetMapContextMenuAnchor?: (anchor: HTMLElement | null) => void
    pixiBlastContextMenuAnchor?: HTMLElement | null
    pixiSetBlastContextMenuAnchor?: (anchor: HTMLElement | null) => void
    // Selection
    pixiSelectedTokenId?: string | null
    pixiSetSelectedTokenId?: (id: string | null) => void
    pixiSelectedBlastId?: string | null
    pixiSetSelectedBlastId?: (id: string | null) => void
    // Blast operations
    onBlastCopy?: (id: string) => void
    onBlastCut?: (id: string) => void
    onBlastLock?: (id: string, locked: boolean) => void
    onBlastpixiOnBlastUpdateConepdateCone?: (blastId: string, x2: number, y2: number, x: number, y: number) => void
    // Pending movements
    onPendingCountChange?: (count: number) => void
    pixiOnBindPendingControls?: (acceptAll: () => void, cancelAll: () => void) => void
    // Camera
    pixiOnBindFit?: (fn: () => void) => void
    // Session
    isPlayerConnected?: boolean
}

import { loadTokenModelPaths } from '../utils/modelAssets'

const BLAST_ASSETS: Record<BlastType, string> = {
    grenade: '/models3d/blasts/blast_grenade.glb',
    circle: '/models3d/blasts/blast_circle.glb',
    square: '/models3d/blasts/blast_rectangle.glb',
    cone: '/models3d/blasts/blast_cone30.glb',
}

const BLAST_TEXTURES: Record<BlastType, string> = {
    grenade: '/models3d/blasts/fire_texture.jpg',
    circle: '/models3d/blasts/fire_texture.jpg',
    square: '/models3d/blasts/fire_texture.jpg',
    cone: '/models3d/blasts/fire_texture.jpg',
}

const WALL_TEXTURES = [
    '/models3d/walls/wall_metal_grid.png',
    '/models3d/walls/wall_concrete_noise.png',
    '/models3d/walls/wall_neon_stripes.png',
]

const hashStringToIndex = (value: string, length: number): number => {
    if (length === 0) return 0
    let hash = 0
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0
    }
    return hash % length
}

/**
 * Create a hollow rectangle wall geometry (only perimeter)
 * Walls start at Y=0 and extend upward
 */
const createRectangleWallGeometry = (
    width: number,
    depth: number,
    height: number,
    wallThickness: number
): THREE.Group => {
    const group = new THREE.Group()
    const halfWidth = width / 2
    const halfDepth = depth / 2
    const halfThickness = wallThickness / 2

    // Top wall (along +Z direction)
    const topGeometry = new THREE.BoxGeometry(width, height, wallThickness)
    const topMesh = new THREE.Mesh(topGeometry)
    // BoxGeometry centers by default, so position at half height to put bottom at Y=0
    topMesh.position.set(0, height / 2, halfDepth - halfThickness)
    group.add(topMesh)

    // Bottom wall (along -Z direction)
    const bottomGeometry = new THREE.BoxGeometry(width, height, wallThickness)
    const bottomMesh = new THREE.Mesh(bottomGeometry)
    bottomMesh.position.set(0, height / 2, -halfDepth + halfThickness)
    group.add(bottomMesh)

    // Left wall (along -X direction)
    const leftGeometry = new THREE.BoxGeometry(wallThickness, height, depth - wallThickness * 2)
    const leftMesh = new THREE.Mesh(leftGeometry)
    leftMesh.position.set(-halfWidth + halfThickness, height / 2, 0)
    group.add(leftMesh)

    // Right wall (along +X direction)
    const rightGeometry = new THREE.BoxGeometry(wallThickness, height, depth - wallThickness * 2)
    const rightMesh = new THREE.Mesh(rightGeometry)
    rightMesh.position.set(halfWidth - halfThickness, height / 2, 0)
    group.add(rightMesh)

    return group
}

/**
 * Create a hollow circle wall geometry (only circumference)
 */
/**
 * Create a hollow circle wall geometry (only circumference)
 * Walls start at Y=0 and extend upward
 */
const createCircleWallGeometry = (
    radius: number,
    height: number,
    wallThickness: number,
    segments: number = 64
): THREE.Group => {
    const group = new THREE.Group()
    // Create the circumference wall as segments around the circle
    // Use more segments for smoother appearance
    const angleStep = (Math.PI * 2) / segments
    const segmentLength = radius * angleStep * 2 // Approximate arc length

    for (let i = 0; i < segments; i++) {
        const angle = i * angleStep
        const nextAngle = (i + 1) * angleStep
        const x1 = Math.cos(angle) * radius
        const z1 = Math.sin(angle) * radius
        const x2 = Math.cos(nextAngle) * radius
        const z2 = Math.sin(nextAngle) * radius

        // Create segment as a box oriented along the circle
        const segmentGeometry = new THREE.BoxGeometry(wallThickness, height, segmentLength)
        const segmentMesh = new THREE.Mesh(segmentGeometry)
        // Position at midpoint between two points
        // BoxGeometry centers by default, so position at half height to put bottom at Y=0
        const midX = (x1 + x2) / 2
        const midZ = (z1 + z2) / 2
        const segmentAngle = angle + angleStep / 2
        segmentMesh.position.set(midX, height / 2, midZ)
        segmentMesh.rotation.y = segmentAngle + Math.PI / 2
        group.add(segmentMesh)
    }

    return group
}

type PointerEventLike = {
    clientX: number
    clientY: number
}

const cloneGroupWithBakedSkinned = (source: THREE.Group): THREE.Group => {
    const clone = skeletonClone(source) as THREE.Group
    const toReplace: Array<{ parent: THREE.Object3D; skinned: THREE.SkinnedMesh; baked: THREE.Mesh }> = []

    clone.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh) {
            const geom = child.geometry as THREE.BufferGeometry
            const bakedGeom = geom.clone()
            bakedGeom.deleteAttribute('skinWeight')
            bakedGeom.deleteAttribute('skinIndex')
            bakedGeom.computeVertexNormals()
            bakedGeom.computeBoundingBox()
            bakedGeom.computeBoundingSphere()

            const mat: THREE.Mesh['material'] =
                child.material instanceof THREE.Material
                    ? child.material.clone()
                    : Array.isArray(child.material)
                    ? child.material.map((m) => (m instanceof THREE.Material ? m.clone() : m))
                    : child.material

            const bakedMesh = new THREE.Mesh(bakedGeom, mat)
            bakedMesh.castShadow = child.castShadow
            bakedMesh.receiveShadow = child.receiveShadow
            bakedMesh.name = child.name || 'bakedMesh'
            bakedMesh.position.copy(child.position)
            bakedMesh.rotation.copy(child.rotation)
            bakedMesh.scale.copy(child.scale)
            bakedMesh.matrixAutoUpdate = true

            if (child.parent) {
                toReplace.push({ parent: child.parent, skinned: child, baked: bakedMesh })
            }
        } else if (child instanceof THREE.Mesh) {
            child.geometry = child.geometry.clone()
            if (Array.isArray(child.material)) {
                child.material = child.material.map((mat) => (mat instanceof THREE.Material ? mat.clone() : mat))
            } else if (child.material instanceof THREE.Material) {
                child.material = child.material.clone()
            }
        }
    })

    toReplace.forEach(({ parent, skinned, baked }) => {
        parent.add(baked)
        parent.remove(skinned)
    })

    return clone
}

const computeMeshBoundingBox = (object: THREE.Object3D): THREE.Box3 | null => {
    let hasMesh = false
    const box = new THREE.Box3()
    object.updateMatrixWorld(true)
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const geom = child.geometry as THREE.BufferGeometry
            if (geom && geom.attributes?.position) {
                if (!geom.boundingBox) {
                    geom.computeBoundingBox()
                }
                if (geom.boundingBox) {
                    const childBox = geom.boundingBox.clone().applyMatrix4(child.matrixWorld)
                    if (!hasMesh) {
                        box.copy(childBox)
                        hasMesh = true
                    } else {
                        box.union(childBox)
                    }
                }
            }
        }
    })
    return hasMesh ? box : null
}

const safeBox = (object: THREE.Object3D, fallbackSize: number): THREE.Box3 => {
    const box = computeMeshBoundingBox(object)
    if (box) return box
    const v = new THREE.Vector3(fallbackSize, fallbackSize, fallbackSize)
    return new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), v)
}

const ThreeBoard = (props: ThreeBoardProps) => {
    const {
        width,
        height,
        gridSize = 50,
        mapKey,
        mapTexture,
        tokens = [],
        images = [],
        gridColor = 0xffffff,
        gridAlpha = 0.5,
        wallColor = 0xff3b81,
        wallAlpha = 0.95,
        walls = [],
        activeTokenId,
        blasts = [],
        blastsNotInMap = [],
        blastDrawMode,
        pixiOnBlastDrop,
        pixiOnBlastMove: pixiOnBlastMoveProp,
        pixiOnBlastComplete,
        pixiSetReady,
        pixiSetHostReady,
        isMeasuring,
        isWallMode,
        wallDrawingShape,
        pixiOnWallDraw,
        isErasingWalls,
        snapToGrid,
        pixiOnTokenMove,
        // Token operations
        onOpenTokenDialog,
        setDeleteTokenDialogOpen = () => {},
        panelTokenOnDuplicate = () => {},
        panelTokenOnCut = () => {},
        panelTokenOnCopy = () => {},
        pixiOnTokenUpdate,
        pixiOnTokenDrop,
        // Map operations
        onMapDeleteAllTokens = () => {},
        onMapDeleteAllWalls = () => {},
        onMapDeleteAllBlasts = () => {},
        pixiOnCutAllTokens = () => {},
        pixiOnPasteToken = () => {},
        pixiOnPasteBlast = () => {},
        // Clipboard
        tokenClipboard = null,
        blastClipboard = null,
        // Context menus
        pixiSetTokenContextMenuAnchor = () => {},
        pixiSetMapContextMenuAnchor = () => {},
        pixiSetBlastContextMenuAnchor = () => {},
        // Selection
        pixiSelectedTokenId = null,
        pixiSetSelectedTokenId = () => {},
        pixiSelectedBlastId = null,
        pixiSetSelectedBlastId = () => {},
        // Blast operations
        onBlastCopy,
        onBlastCut,
        onBlastLock,
        onBlastpixiOnBlastUpdateConepdateCone,
        onBlastDelete: onBlastDeleteProp = () => {},
        // Pending movements
        onPendingCountChange,
        pixiOnBindPendingControls,
        // Camera
        pixiOnBindFit,
        // Session
        isPlayerConnected = false,
    } = props

    const { sendAction, role, session, displayName, connected } = useSession()

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<OrbitControls | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // Object maps for tracking
    const tokenMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
    const tokenLabelsRef = useRef<Map<string, THREE.Object3D>>(new Map())
    const wallMeshesRef = useRef<Map<string, THREE.Mesh | THREE.Group>>(new Map())
    const blastMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
    const blastLightsRef = useRef<Map<string, THREE.PointLight>>(new Map())
    const tokenModelTemplatesRef = useRef<THREE.Group[]>([])
    const tokenModelMapRef = useRef<Map<string, THREE.Group>>(new Map())
    const tokenModelPathsRef = useRef<string[]>([])
    const tokenOrientationRef = useRef<Map<string, number>>(new Map())
    const blastModelTemplatesRef = useRef<Partial<Record<BlastType, THREE.Group>>>({})
    const blastTextureTemplatesRef = useRef<Partial<Record<BlastType, THREE.Texture>>>({})
    const wallTextureTemplatesRef = useRef<THREE.Texture[]>([])
    const tokenTextureCacheRef = useRef<Map<string, THREE.Texture>>(new Map())
    const mapPlaneRef = useRef<THREE.Mesh | null>(null)
    const gridHelperRef = useRef<THREE.GridHelper | THREE.LineSegments | null>(null)
    const tempPixiAppRef = useRef<{ destroy: (removeView?: boolean) => void } | null>(null)

    // Cone rotation state
    const rotatingConeRef = useRef<{
        id: string
        apexX: number
        apexZ: number
        lengthInGrids: number
        angleRad: number
    } | null>(null)
    const rotationReadyAtRef = useRef<number>(0)

    // Track right-click drag to prevent context menu when rotating camera
    const rightMouseDownRef = useRef<{ x: number; y: number } | null>(null)
    const isRightClickDraggingRef = useRef<boolean>(false)

    // Track left-click on token to prevent opening dialog when dragging
    const leftClickTokenRef = useRef<{ id: string; x: number; y: number } | null>(null)
    const isLeftClickDraggingRef = useRef<boolean>(false)
    const isStartingNewSegmentRef = useRef<boolean>(false)
    const newSegmentPreviewAddedRef = useRef<boolean>(false)
    const clockRef = useRef<THREE.Clock | null>(null)

    // Wall eraser refs
    const eraseStartRef = useRef<{ x: number; z: number } | null>(null)
    const erasePreviewRef = useRef<{ x: number; z: number } | null>(null)
    const eraseLineRef = useRef<THREE.Line | null>(null)
    const highlightedWallIdsRef = useRef<Set<string>>(new Set())

    // Pending movements state - use state to trigger re-renders
    const [pendingMovements, setPendingMovements] = useState<
        Map<
            string,
            {
                startX: number
                startZ: number
                endX: number
                endZ: number
                points: { x: number; z: number }[]
                fromRemotePlayer?: boolean
            }
        >
    >(new Map())
    const pendingIndicatorsRef = useRef<
        Map<
            string,
            {
                cleanup: () => void
                update?: (pending: {
                    startX: number
                    startZ: number
                    endX: number
                    endZ: number
                    points: { x: number; z: number }[]
                }) => void
            }
        >
    >(new Map())
    const pendingSignaturesRef = useRef<Map<string, string>>(new Map())
    const pendingMovementsRef = useRef<
        Map<
            string,
            {
                startX: number
                startZ: number
                endX: number
                endZ: number
                points: { x: number; z: number }[]
                fromRemotePlayer?: boolean
            }
        >
    >(new Map())
    const pendingAnimationsRef = useRef<
        Map<
            string,
            {
                points: { x: number; z: number }[]
                currentIndex: number
                segStart: { x: number; z: number }
                segEnd: { x: number; z: number }
                segLen: number
                speed: number
                totalDistance?: number
                originalRot?: number
                mode?: 'move' | 'restore'
                restoreFrom?: number
                restoreTo?: number
                restoreDuration?: number
                restoreElapsed?: number
            }
        >
    >(new Map())

    const mapPendingPoints = (points: { x: number; z: number }[]) => points.map((p) => ({ x: p.x, y: p.z }))
    const sendPendingMovementAction = (
        tokenId: string,
        pending: { points: { x: number; z: number }[]; startX: number; startZ: number; endX: number; endZ: number }
    ) => {
        if (!session) return
        const pts = pending.points.length
            ? pending.points
            : [
                  { x: pending.startX, z: pending.startZ },
                  { x: pending.endX, z: pending.endZ },
              ]
        sendAction({
            kind: 'PENDING_MOVEMENT',
            tokenId,
            points: mapPendingPoints(pts),
            mapId: mapKey,
        })
    }
    const sendRejectMovementAction = (tokenId: string) => {
        if (!session) return
        sendAction({
            kind: 'REJECT_MOVEMENT',
            tokenId,
        })
    }

    // Initialize hooks
    const callbackRefs = useThreeCallbackRefs({
        panelTokenOnDuplicate,
        panelTokenOnCopy,
        panelTokenOnCut,
        pixiOnCutAllTokens,
        onBlastCopy,
        onBlastCut,
    })

    const clipboard = useThreeClipboard({
        tokenClipboard: tokenClipboard ?? null,
        blastClipboard: blastClipboard ?? null,
        mapKey,
        onMapPasteToken: pixiOnPasteToken,
        onMapPasteBlast: pixiOnPasteBlast,
    })

    const contextMenus = useThreeContextMenus({
        containerRef: containerRef as React.RefObject<HTMLDivElement>,
        cameraRef,
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
        onBlastDelete: onBlastDeleteProp,
        onBlastCopyRef: callbackRefs.onBlastCopyRef,
        onBlastCutRef: callbackRefs.onBlastCutRef,
        onBlastLock,
        pixiSetBlastContextMenuAnchor,
        pixiSetSelectedBlastId,
    }) // Track temporary PixiJS app to prevent multiple contexts

    // Measure tool state
    const [measureStart, setMeasureStart] = useState<THREE.Vector3 | null>(null)
    const [measureEnd, setMeasureEnd] = useState<THREE.Vector3 | null>(null)

    // Drag and drop state
    const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null)
    const dragStartRef = useRef<{ x: number; z: number } | null>(null)
    const [draggedBlastId, setDraggedBlastId] = useState<string | null>(null)
    const dragBlastStartRef = useRef<{ x: number; z: number } | null>(null)

    // Blast preview state
    const [blastPreviewStart, setBlastPreviewStart] = useState<THREE.Vector3 | null>(null)
    const [blastPreviewEnd, setBlastPreviewEnd] = useState<THREE.Vector3 | null>(null)
    // Wall drawing state
    const [wallDrawingStart, setWallDrawingStart] = useState<THREE.Vector3 | null>(null)
    const [wallDrawingEnd, setWallDrawingEnd] = useState<THREE.Vector3 | null>(null)
    const [assetVersion, setAssetVersion] = useState(0)
    const [threeReady, setThreeReady] = useState(false)
    const [tokenModelsLoaded, setTokenModelsLoaded] = useState(false)
    const [blastModelsLoaded, setBlastModelsLoaded] = useState(false)
    const [blastTexturesLoaded, setBlastTexturesLoaded] = useState(false)
    const [wallTexturesLoaded, setWallTexturesLoaded] = useState(false)

    // Combined flag: all assets are loaded
    const allAssetsLoaded = tokenModelsLoaded && blastModelsLoaded && blastTexturesLoaded && wallTexturesLoaded

    // Load token textures from image blobs
    useEffect(() => {
        const textureCache = tokenTextureCacheRef.current
        const currentImageIds = new Set(images.map((img) => img.id))

        // Clear old textures that are no longer needed
        for (const [id, texture] of textureCache.entries()) {
            if (!currentImageIds.has(id)) {
                texture.dispose()
                textureCache.delete(id)
            }
        }

        // Load new textures
        for (const image of images) {
            if (!textureCache.has(image.id) && image.blob) {
                try {
                    const url = URL.createObjectURL(image.blob)
                    const loader = new THREE.TextureLoader()
                    loader.load(
                        url,
                        (texture) => {
                            textureCache.set(image.id, texture)
                            URL.revokeObjectURL(url)
                            // Trigger re-render by updating asset version
                            setAssetVersion((v) => v + 1)
                        },
                        undefined,
                        (error) => {
                            console.error('Failed to load token texture for image:', image.id, error)
                            URL.revokeObjectURL(url)
                        }
                    )
                } catch (error) {
                    console.error('Error setting up texture loading for image:', image.id, error)
                }
            }
        }
    }, [images])

    // Preload 3D assets (models and wall textures)
    useEffect(() => {
        let mounted = true
        const loadAssets = async () => {
            try {
                const modelPaths = await loadTokenModelPaths()
                const tokenModels = await Promise.all(
                    modelPaths.map((path) =>
                        loadModel(path)
                            .then((m) => {
                                if (m) {
                                    m.userData = { ...(m.userData ?? {}), __modelPath: path }
                                }
                                return m
                            })
                            .catch(() => null)
                    )
                )
                if (mounted) {
                    tokenModelTemplatesRef.current = tokenModels.filter((m): m is THREE.Group => Boolean(m))
                    tokenModelPathsRef.current = modelPaths
                    const map = new Map<string, THREE.Group>()
                    tokenModelTemplatesRef.current.forEach((tpl) => {
                        const p = tpl.userData?.__modelPath
                        if (p) {
                            map.set(p, tpl)
                            const base = p.split('/').pop()
                            if (base) map.set(base, tpl)
                        }
                    })
                    tokenModelMapRef.current = map
                    console.log(`ThreeBoard: Loaded ${tokenModelTemplatesRef.current.length} token models:`, modelPaths)
                    setTokenModelsLoaded(true)
                }

                const blastEntries = await Promise.all(
                    (Object.entries(BLAST_ASSETS) as [BlastType, string][]).map(async ([type, path]) => {
                        try {
                            const model = await loadModel(path)
                            return [type, model] as const
                        } catch {
                            return null
                        }
                    })
                )
                if (mounted) {
                    const blastMap: Partial<Record<BlastType, THREE.Group>> = {}
                    blastEntries.forEach((entry) => {
                        if (entry) {
                            blastMap[entry[0]] = entry[1]
                        }
                    })
                    blastModelTemplatesRef.current = blastMap
                    console.log(`ThreeBoard: Loaded ${Object.keys(blastMap).length} blast models`)
                    setBlastModelsLoaded(true)
                }

                const blastTextureEntries = await Promise.all(
                    (Object.entries(BLAST_TEXTURES) as [BlastType, string][]).map(async ([type, path]) => {
                        try {
                            const texture = await loadTexture(path)
                            return [type, texture] as const
                        } catch {
                            return null
                        }
                    })
                )
                if (mounted) {
                    const blastTextureMap: Partial<Record<BlastType, THREE.Texture>> = {}
                    blastTextureEntries.forEach((entry) => {
                        if (entry) {
                            blastTextureMap[entry[0]] = entry[1]
                        }
                    })
                    blastTextureTemplatesRef.current = blastTextureMap
                    console.log(`ThreeBoard: Loaded ${Object.keys(blastTextureMap).length} blast textures`)
                    setBlastTexturesLoaded(true)
                    setAssetVersion((v) => v + 1)
                }

                const wallTextures = await Promise.all(WALL_TEXTURES.map((path) => loadTexture(path).catch(() => null)))
                if (mounted) {
                    wallTextureTemplatesRef.current = wallTextures
                        .filter((tex): tex is THREE.Texture => Boolean(tex))
                        .map((tex) => {
                            // Set default wrapping, but repeat will be set per-material based on wall dimensions
                            tex.wrapS = THREE.RepeatWrapping
                            tex.wrapT = THREE.RepeatWrapping
                            // Don't set repeat here - it will be set per-material based on wall size
                            return tex
                        })
                    console.log(`ThreeBoard: Loaded ${wallTextureTemplatesRef.current.length} wall textures`)
                    setWallTexturesLoaded(true)
                    setAssetVersion((v) => v + 1)
                }
            } catch (assetError) {
                console.warn('ThreeBoard: asset preload failed', assetError)
            }
        }

        loadAssets()
        return () => {
            mounted = false
        }
    }, [])

    const findTokenFromObject = (object: THREE.Object3D | null): { id: string; group: THREE.Group } | null => {
        let current: THREE.Object3D | null = object
        while (current) {
            const tokenId = current.userData?.tokenId
            if (tokenId) {
                const known = tokenMeshesRef.current.get(tokenId)
                if (known) return { id: tokenId, group: known }
                if (current instanceof THREE.Group) return { id: tokenId, group: current }
            }
            current = current.parent
        }
        return null
    }

    // Disable zoom while Shift is held (global key handlers)
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if ((e.key === 'Shift' || e.key === 'Control') && controlsRef.current) {
                controlsRef.current.enableZoom = false
            }
        }
        const handleKeyUp = (e: globalThis.KeyboardEvent) => {
            if ((e.key === 'Shift' || e.key === 'Control') && controlsRef.current) {
                controlsRef.current.enableZoom = true
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    // Convert hex color to Three.js color
    const hexToThreeColor = (hex: number): THREE.Color => {
        return new THREE.Color(hex)
    }

    const pickWallTexture = (wallId: string): THREE.Texture | undefined => {
        const textures = wallTextureTemplatesRef.current
        if (!textures.length) return undefined
        return textures[hashStringToIndex(wallId, textures.length)]
    }

    const buildTokenGroup = (token: Token, radius: number, height: number, isActive: boolean): THREE.Group => {
        let tokenGroup: THREE.Group

        if (tokenModelTemplatesRef.current.length > 0) {
            const templateFromMap =
                (token.modelId &&
                    (tokenModelMapRef.current.get(token.modelId) ||
                        tokenModelMapRef.current.get(token.modelId.split('/').pop() ?? ''))) ||
                null

            let template: THREE.Group | undefined
            if (templateFromMap) {
                template = templateFromMap
            } else if (token.modelId && tokenModelPathsRef.current.length === tokenModelTemplatesRef.current.length) {
                const targetBase = token.modelId.split('/').pop()
                const idx = tokenModelPathsRef.current.findIndex(
                    (p) => p === token.modelId || (targetBase && p.split('/').pop() === targetBase)
                )
                if (idx >= 0 && idx < tokenModelTemplatesRef.current.length) {
                    template = tokenModelTemplatesRef.current[idx]
                }
            }
            if (!template) {
                const modelIndex = Math.abs(hashStringToIndex(token.id, tokenModelTemplatesRef.current.length))
                template =
                    modelIndex >= 0 && modelIndex < tokenModelTemplatesRef.current.length
                        ? tokenModelTemplatesRef.current[modelIndex]
                        : tokenModelTemplatesRef.current[tokenModelTemplatesRef.current.length - 1]
            }
            const model = cloneGroupWithBakedSkinned(template)
            tokenGroup = new THREE.Group()
            tokenGroup.add(model)
            tokenGroup.userData.useOriginalMaterials = true
            // Preserve model path metadata for downstream matching
            const modelPath = template.userData?.__modelPath
            if (modelPath) {
                model.userData = { ...(model.userData ?? {}), __modelPath: modelPath }
                tokenGroup.userData.modelPath = modelPath
            }

            // Initial bbox
            let bbox = safeBox(model, radius * 2)

            // Scale to fit diameter = gridSize (radius*2)
            const size = bbox.getSize(new THREE.Vector3(1, 1, 1))
            const horizontalSize = Math.max(size.x, size.z) || 1
            const uniformScale = (radius * 2) / horizontalSize
            model.scale.setScalar(uniformScale)

            // Recompute bbox after scaling
            model.updateMatrixWorld(true)
            bbox = safeBox(model, radius * 2)

            // Lift to ground
            const min = bbox.min.clone()
            model.position.y += -min.y
            model.updateMatrixWorld(true)

            // Compress height so the top stays just under the label height
            let bboxAfterLift = safeBox(model, radius * 2)
            const currentHeight = bboxAfterLift.max.y - bboxAfterLift.min.y
            if (currentHeight > 0) {
                const targetHeight = height
                const scaleY = targetHeight / currentHeight
                model.scale.multiplyScalar(scaleY)
                model.updateMatrixWorld(true)
                // Re-lift after scaling Y
                bboxAfterLift = safeBox(model, radius * 2)
                const minY = bboxAfterLift.min.y
                model.position.y += -minY
                model.updateMatrixWorld(true)
            }

            // Apply orientation
            const orientationDeg = token.orientationDeg ?? 0
            const orientationRad = (orientationDeg * Math.PI) / 180
            tokenGroup.rotation.y = orientationRad
            model.rotation.y = 0

            // Keep frustum culling off for safety
            tokenGroup.traverse((child) => {
                child.frustumCulled = false
            })

            tokenGroup.userData.baseYOffset = 0
        } else {
            // Fallback geometry
            tokenGroup = createFallbackTokenModel(token.color, radius, height)
            tokenGroup.scale.set(0.8, 0.8, 0.8)
            tokenGroup.userData.baseYOffset = 0
        }

        // Apply cyberpunk material styling (color/emissive) for fallback only
        if (!tokenGroup.userData.useOriginalMaterials) {
            tokenGroup.traverse((child) => {
                if (child instanceof THREE.Mesh && !child.userData.isTokenTexture) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material]
                    materials.forEach((mat, index) => {
                        const baseMaterial =
                            mat instanceof THREE.MeshStandardMaterial ? mat.clone() : new THREE.MeshStandardMaterial()
                        baseMaterial.color = new THREE.Color(token.color)
                        baseMaterial.emissive = new THREE.Color(token.color).multiplyScalar(isActive ? 0.6 : 0.25)
                        baseMaterial.metalness = mat instanceof THREE.MeshStandardMaterial ? mat.metalness : 0.6
                        baseMaterial.roughness = mat instanceof THREE.MeshStandardMaterial ? mat.roughness : 0.4

                        if (Array.isArray(child.material)) {
                            child.material[index] = baseMaterial
                        } else {
                            child.material = baseMaterial
                        }
                    })
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
        }

        return tokenGroup
    }

    const buildBlastGroup = (blast: Blast): { group: THREE.Group; height: number } => {
        const alpha = blast.alpha ?? 0.7
        // Always use fallback models for now
        let blastGroup: THREE.Group

        // All blasts use the same color
        const blastColor = 0xff4400

        switch (blast.type) {
            case 'grenade':
            case 'circle': {
                const radius = blast.size ? blast.size * gridSize : gridSize * 2.5
                blastGroup = createFallbackBlastModel('circle', radius, blastColor)
                break
            }
            case 'square': {
                // In PixiBoard: width = gridSize * blast.size, height = gridSize * (blast.sizeY || blast.size)
                const width = blast.size ? blast.size * gridSize : gridSize * 5
                const depth = blast.sizeY ? blast.sizeY * gridSize : width
                // For fallback, we'll create a square with the width, then scale depth separately
                // But createFallbackBlastModel only accepts one size, so we'll use width and scale manually
                blastGroup = createFallbackBlastModel('square', width, blastColor)
                // Scale depth separately if sizeY is different
                if (blast.sizeY && blast.sizeY !== blast.size) {
                    blastGroup.scale.z = depth / width
                }
                // The fallback model is already centered horizontally and bottom at Y=0
                // No additional positioning needed
                break
            }
            case 'cone': {
                // For cone, use actual distance from apex to endpoint if available
                let coneLength = blast.size ? blast.size * gridSize : gridSize * 6
                if (blast.x2 !== undefined && blast.y2 !== undefined) {
                    const dx = blast.x2 - blast.x
                    const dy = blast.y2 - blast.y
                    const actualLength = Math.sqrt(dx * dx + dy * dy)
                    if (actualLength > 0) {
                        coneLength = actualLength
                    }
                }
                blastGroup = createFallbackBlastModel('cone', coneLength, blastColor)
                // Center cone so half is below ground and half above
                blastGroup.updateMatrixWorld(true)
                const bboxCone = new THREE.Box3().setFromObject(blastGroup)
                const centerY = (bboxCone.max.y + bboxCone.min.y) / 2
                blastGroup.position.y -= centerY
                break
            }
            default: {
                blastGroup = createFallbackBlastModel('circle', gridSize * 2.5, blastColor)
            }
        }

        // Create clipping plane once for all meshes
        const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

        // Get texture for this blast type
        let blastTexture = blastTextureTemplatesRef.current[blast.type]

        // Adjust cone texture to cover the entire cone surface
        if (blast.type === 'cone' && blastTexture) {
            blastTexture = blastTexture.clone()
            blastTexture.rotation = -Math.PI / 2 // -90 degrees in radians

            // Calculate cone length and base radius for texture repeat
            let coneLength = blast.size ? blast.size * gridSize : gridSize * 6
            if (blast.x2 !== undefined && blast.y2 !== undefined) {
                const dx = blast.x2 - blast.x
                const dy = blast.y2 - blast.y
                const actualLength = Math.sqrt(dx * dx + dy * dy)
                if (actualLength > 0) {
                    coneLength = actualLength
                }
            }

            // Calculate base radius (cone has 28° angle, so half-angle is 14°)
            const halfAngleRad = (14 * Math.PI) / 180
            const baseRadius = coneLength * Math.tan(halfAngleRad)
            const baseCircumference = 2 * Math.PI * baseRadius

            // Adjust repeat to fit the cone surface properly
            // Horizontal (U): wrap around circumference - use base circumference as reference
            // Vertical (V): stretch along cone length
            const baseTextureScale = 100 // Base scale: 1 unit = 100 pixels
            const repeatU = baseCircumference / baseTextureScale // Horizontal repeat (around circumference)
            const repeatV = coneLength / baseTextureScale // Vertical repeat (along cone length)

            blastTexture.wrapS = THREE.RepeatWrapping
            blastTexture.wrapT = THREE.RepeatWrapping
            blastTexture.repeat.set(repeatU, repeatV)
        }

        blastGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = createCyberpunkBlastMaterial(alpha, blastTexture)
                // Ensure clipping planes are set correctly
                if (material.clippingPlanes) {
                    material.clippingPlanes = [clippingPlane]
                }
                child.material = material
                child.receiveShadow = true
            }
        })

        const fallbackHeight = gridSize / 2
        return { group: blastGroup, height: fallbackHeight }
    }

    // Initialize Three.js scene
    useLayoutEffect(() => {
        if (!containerRef.current) return

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x1a1a1a)
        sceneRef.current = scene

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000)
        camera.position.set(0, 500, 500)
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        // Enable local clipping planes to clip blasts below the map
        renderer.localClippingEnabled = true
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Controls with enhanced settings
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.minDistance = 100
        controls.maxDistance = 2000
        controls.maxPolarAngle = Math.PI / 2.1 // Prevent going below ground
        controls.enablePan = true
        controls.enableZoom = true
        controls.enableRotate = true
        controls.screenSpacePanning = false
        controls.panSpeed = 1.0
        controls.zoomSpeed = 1.2
        controls.rotateSpeed = 0.5

        // Configure mouse buttons: left button disabled (used for moving objects), middle button pans, right button rotates
        controls.mouseButtons = {
            LEFT: null, // Left button disabled - used for moving tokens/objects
            MIDDLE: THREE.MOUSE.PAN, // Middle button pans
            RIGHT: THREE.MOUSE.ROTATE, // Right button rotates
        }

        controlsRef.current = controls

        // Cyberpunk-style lighting
        // Ambient light (white)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambientLight)

        // Main directional light (white)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(500, 500, 500)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048
        directionalLight.shadow.camera.near = 0.5
        directionalLight.shadow.camera.far = 2000
        directionalLight.shadow.camera.left = -1000
        directionalLight.shadow.camera.right = 1000
        directionalLight.shadow.camera.top = 1000
        directionalLight.shadow.camera.bottom = -1000
        scene.add(directionalLight)

        // Accent lights for cyberpunk feel
        const accentLight1 = new THREE.PointLight(0x00ffff, 0.5, 1000)
        accentLight1.position.set(-200, 200, -200)
        scene.add(accentLight1)

        const accentLight2 = new THREE.PointLight(0xff00ff, 0.3, 1000)
        accentLight2.position.set(200, 200, 200)
        scene.add(accentLight2)

        // Grid will be updated when map texture loads
        // Initial grid placeholder
        const gridHelper = new THREE.GridHelper(1000, 100, hexToThreeColor(gridColor), hexToThreeColor(gridColor))
        if (gridHelper.material instanceof THREE.Material) {
            gridHelper.material.opacity = gridAlpha
            gridHelper.material.transparent = true
        }
        scene.add(gridHelper)
        gridHelperRef.current = gridHelper

        pixiSetReady(true)
        pixiSetHostReady(true)
        setThreeReady(true)

        // Animation loop
        const clock = new THREE.Clock()
        clockRef.current = clock
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate)
            const delta = clock.getDelta()
            // Update pending animations
            if (pendingAnimationsRef.current.size > 0) {
                const distanceToTravelBase = delta > 0 ? delta : 0
                const rotLerpSpeed = 12 // rad/s for facing movement smoothly
                for (const [tokenId, anim] of Array.from(pendingAnimationsRef.current.entries())) {
                    const mesh = tokenMeshesRef.current.get(tokenId)
                    if (!mesh) {
                        pendingAnimationsRef.current.delete(tokenId)
                        continue
                    }

                    // Handle restore-only phase
                    if (anim.mode === 'restore') {
                        const duration = anim.restoreDuration ?? 0.35
                        const elapsed = (anim.restoreElapsed ?? 0) + delta
                        const t = duration <= 0 ? 1 : Math.min(1, elapsed / duration)
                        const from = anim.restoreFrom ?? mesh.rotation.y
                        const to = anim.restoreTo ?? from
                        const diff = ((to - from + Math.PI) % (2 * Math.PI)) - Math.PI
                        mesh.rotation.y = from + diff * t
                        if (t >= 1) {
                            pendingAnimationsRef.current.delete(tokenId)
                        } else {
                            pendingAnimationsRef.current.set(tokenId, {
                                ...anim,
                                restoreElapsed: elapsed,
                            })
                        }
                        continue
                    }

                    let { segStart, segEnd, segLen, speed, currentIndex, points, totalDistance, originalRot } = anim
                    let remaining = speed * distanceToTravelBase

                    while (remaining >= 0 && pendingAnimationsRef.current.has(tokenId)) {
                        if (segLen <= 0) {
                            // If zero-length segment, jump to end and advance
                            mesh.position.set(segEnd.x, mesh.position.y, segEnd.z)
                            const nextIndex = currentIndex + 1
                            if (nextIndex >= points.length) {
                                pendingAnimationsRef.current.delete(tokenId)
                                pixiOnTokenMove(
                                    tokenId,
                                    points[points.length - 1].x,
                                    points[points.length - 1].z,
                                    props.isCombatActive ? totalDistance : undefined
                                )
                                // Start restore rotation if needed
                                const currentRot = mesh.rotation.y
                                const targetRot = originalRot ?? currentRot
                                const diffRot = Math.abs(((targetRot - currentRot + Math.PI) % (2 * Math.PI)) - Math.PI)
                                if (diffRot > 1e-3) {
                                    pendingAnimationsRef.current.set(tokenId, {
                                        points: [],
                                        currentIndex: 0,
                                        segStart,
                                        segEnd,
                                        segLen: 0,
                                        speed,
                                        totalDistance,
                                        originalRot: targetRot,
                                        mode: 'restore',
                                        restoreFrom: currentRot,
                                        restoreTo: targetRot,
                                        restoreDuration: 0.35,
                                        restoreElapsed: 0,
                                    })
                                }
                                break
                            } else {
                                const nextStart = points[currentIndex]
                                const nextEnd = points[nextIndex]
                                segStart = nextStart
                                segEnd = nextEnd
                                segLen = Math.hypot(nextEnd.x - nextStart.x, nextEnd.z - nextStart.z)
                                currentIndex = nextIndex
                                pendingAnimationsRef.current.set(tokenId, {
                                    points,
                                    currentIndex,
                                    segStart,
                                    segEnd,
                                    segLen,
                                    speed,
                                    totalDistance,
                                })
                                continue
                            }
                        }

                        if (remaining >= segLen) {
                            // Move to end of this segment and continue with leftover
                            mesh.position.set(segEnd.x, mesh.position.y, segEnd.z)
                            remaining -= segLen
                            const nextIndex = currentIndex + 1
                            if (nextIndex >= points.length) {
                                pendingAnimationsRef.current.delete(tokenId)
                                pixiOnTokenMove(
                                    tokenId,
                                    points[points.length - 1].x,
                                    points[points.length - 1].z,
                                    props.isCombatActive ? totalDistance : undefined
                                )
                                // Start restore rotation if needed
                                const currentRot = mesh.rotation.y
                                const targetRot = originalRot ?? currentRot
                                const diffRot = Math.abs(((targetRot - currentRot + Math.PI) % (2 * Math.PI)) - Math.PI)
                                if (diffRot > 1e-3) {
                                    pendingAnimationsRef.current.set(tokenId, {
                                        points: [],
                                        currentIndex: 0,
                                        segStart,
                                        segEnd,
                                        segLen: 0,
                                        speed,
                                        totalDistance,
                                        originalRot: targetRot,
                                        mode: 'restore',
                                        restoreFrom: currentRot,
                                        restoreTo: targetRot,
                                        restoreDuration: 0.35,
                                        restoreElapsed: 0,
                                    })
                                }
                                break
                            } else {
                                const nextStart = points[currentIndex]
                                const nextEnd = points[nextIndex]
                                segStart = nextStart
                                segEnd = nextEnd
                                segLen = Math.hypot(nextEnd.x - nextStart.x, nextEnd.z - nextStart.z)
                                currentIndex = nextIndex
                                pendingAnimationsRef.current.set(tokenId, {
                                    points,
                                    currentIndex,
                                    segStart,
                                    segEnd,
                                    segLen,
                                    speed,
                                    totalDistance,
                                })
                                continue
                            }
                        } else {
                            // Partial progress along current segment
                            const t = remaining / segLen
                            const newX = THREE.MathUtils.lerp(segStart.x, segEnd.x, t)
                            const newZ = THREE.MathUtils.lerp(segStart.z, segEnd.z, t)
                            mesh.position.set(newX, mesh.position.y, newZ)
                            // Smoothly rotate toward movement direction
                            const dx = segEnd.x - segStart.x
                            const dz = segEnd.z - segStart.z
                            const targetYaw = Math.atan2(dx, dz)
                            const currentYaw = mesh.rotation.y
                            const diff = ((targetYaw - currentYaw + Math.PI) % (2 * Math.PI)) - Math.PI
                            const maxStep = rotLerpSpeed * delta
                            const step = Math.max(-maxStep, Math.min(maxStep, diff))
                            mesh.rotation.y = currentYaw + step
                            // Update segment to residual
                            const newStart = { x: newX, z: newZ }
                            const newLen = segLen - remaining
                            pendingAnimationsRef.current.set(tokenId, {
                                points,
                                currentIndex,
                                segStart: newStart,
                                segEnd,
                                segLen: newLen,
                                speed,
                                totalDistance,
                                originalRot,
                            })
                            break
                        }
                    }
                }
            }

            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (containerRef.current && renderer.domElement.parentNode) {
                containerRef.current.removeChild(renderer.domElement)
            }
            renderer.dispose()
            controls.dispose()
            setThreeReady(false)
        }
    }, [])

    // Update renderer size
    useEffect(() => {
        if (rendererRef.current && cameraRef.current) {
            rendererRef.current.setSize(width, height)
            cameraRef.current.aspect = width / height
            cameraRef.current.updateProjectionMatrix()
        }
    }, [width, height])

    // Load and render map texture
    useEffect(() => {
        // Track if component is still mounted
        let isMounted = true

        if (!sceneRef.current || !mapTexture) {
            // Remove map plane if texture is removed
            if (mapPlaneRef.current && sceneRef.current) {
                sceneRef.current.remove(mapPlaneRef.current)
                mapPlaneRef.current.geometry.dispose()
                if (mapPlaneRef.current.material instanceof THREE.MeshStandardMaterial) {
                    mapPlaneRef.current.material.map?.dispose()
                    mapPlaneRef.current.material.dispose()
                }
                mapPlaneRef.current = null
            }
            return () => {
                isMounted = false
            }
        }

        const loadMapTexture = async () => {
            try {
                let threeTexture: THREE.Texture | null = null

                // Destroy previous temporary app if it exists
                if (tempPixiAppRef.current) {
                    try {
                        tempPixiAppRef.current.destroy(true)
                    } catch {
                        // Ignore errors when destroying
                    }
                    tempPixiAppRef.current = null
                }

                // Render PixiJS texture to canvas using a temporary Application.
                try {
                    const { Application, Sprite } = await import('pixi.js')
                    const tempApp = new Application()
                    tempPixiAppRef.current = tempApp // Track it

                    await tempApp.init({
                        width: mapTexture.width || 1920,
                        height: mapTexture.height || 1920,
                        autoStart: false,
                        antialias: false,
                    })

                    const sprite = new Sprite(mapTexture)
                    sprite.width = mapTexture.width || 1920
                    sprite.height = mapTexture.height || 1920
                    tempApp.stage.addChild(sprite)
                    tempApp.render()

                    const sourceCanvas = tempApp.canvas
                    const clonedCanvas = document.createElement('canvas')
                    clonedCanvas.width = sourceCanvas.width
                    clonedCanvas.height = sourceCanvas.height
                    const ctx = clonedCanvas.getContext('2d')
                    if (ctx) {
                        ctx.drawImage(sourceCanvas, 0, 0)
                    }

                    threeTexture = new THREE.CanvasTexture(clonedCanvas)

                    // Destroy the temporary app immediately after use
                    tempApp.destroy(true)
                    tempPixiAppRef.current = null
                } catch (renderError) {
                    // Clean up on error
                    if (tempPixiAppRef.current) {
                        try {
                            tempPixiAppRef.current.destroy(true)
                        } catch {
                            // Ignore errors when destroying
                        }
                        tempPixiAppRef.current = null
                    }
                    console.warn('Could not render PixiJS texture to canvas:', renderError)
                    // Final fallback: create placeholder
                    const canvas = document.createElement('canvas')
                    canvas.width = mapTexture.width || 1920
                    canvas.height = mapTexture.height || 1920
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.fillStyle = '#2a2a2a'
                        ctx.fillRect(0, 0, canvas.width, canvas.height)
                    }
                    threeTexture = new THREE.CanvasTexture(canvas)
                }

                // Check if component is still mounted before modifying refs
                if (!isMounted) {
                    // Cleanup texture if component unmounted
                    if (threeTexture) {
                        threeTexture.dispose()
                    }
                    return
                }

                threeTexture.wrapS = THREE.RepeatWrapping
                threeTexture.wrapT = THREE.RepeatWrapping

                // Remove old map plane
                // IMPORTANT: Only remove if it's actually in the scene
                if (mapPlaneRef.current && sceneRef.current && mapPlaneRef.current.parent === sceneRef.current) {
                    sceneRef.current.remove(mapPlaneRef.current)
                    mapPlaneRef.current.geometry.dispose()
                    if (mapPlaneRef.current.material instanceof THREE.MeshStandardMaterial) {
                        mapPlaneRef.current.material.map?.dispose()
                        mapPlaneRef.current.material.dispose()
                    }
                }

                // Check again before creating new plane
                if (!isMounted || !sceneRef.current) {
                    if (threeTexture) {
                        threeTexture.dispose()
                    }
                    return
                }

                // Create map plane
                // Coordinate system: Same as PixiJS (X right, Y down), but with height (Y in Three.js)
                // PixiJS: (0,0) top-left, X right, Y down
                // Three.js: X = PixiJS X, Z = PixiJS Y, Y = height (variable)
                const mapWidth = mapTexture.width || 1920
                const mapHeight = mapTexture.height || 1920
                const geometry = new THREE.PlaneGeometry(mapWidth, mapHeight)
                // Use white color to preserve original texture colors
                const material = new THREE.MeshStandardMaterial({
                    map: threeTexture,
                    color: 0xffffff,
                })
                const plane = new THREE.Mesh(geometry, material)
                plane.rotation.x = -Math.PI / 2 // Rotate to horizontal plane (XZ plane)
                // Position map so (0,0) is at origin (matching PixiBoard coordinate system)
                // Plane extends from (0, 0, 0) to (mapWidth, 0, mapHeight)
                plane.position.set(mapWidth / 2, 0, mapHeight / 2)
                plane.receiveShadow = true
                if (sceneRef.current) {
                    sceneRef.current.add(plane)
                }
                mapPlaneRef.current = plane

                // Adjust camera to fit map
                // Camera should look at map center
                if (isMounted && cameraRef.current && controlsRef.current) {
                    const mapCenterX = mapWidth / 2
                    const mapCenterZ = mapHeight / 2
                    const maxDim = Math.max(mapWidth, mapHeight)
                    cameraRef.current.position.set(mapCenterX + maxDim * 0.5, maxDim * 0.7, mapCenterZ + maxDim * 0.5)
                    cameraRef.current.lookAt(mapCenterX, 0, mapCenterZ)
                    controlsRef.current.target.set(mapCenterX, 0, mapCenterZ)
                    controlsRef.current.update()
                }
            } catch (error) {
                console.error('Error loading map texture:', error)
            }
        }

        loadMapTexture()

        // Cleanup function: mark as unmounted and destroy temporary PixiJS app
        return () => {
            isMounted = false
            // Destroy temporary PixiJS app if it exists
            if (tempPixiAppRef.current) {
                try {
                    tempPixiAppRef.current.destroy(true)
                } catch {
                    // Ignore errors when destroying
                }
                tempPixiAppRef.current = null
            }
        }
    }, [mapTexture])

    // Render tokens with enhanced cyberpunk models
    useEffect(() => {
        if (!sceneRef.current) {
            console.warn('ThreeBoard: sceneRef.current is null, cannot render tokens')
            return
        }

        // Wait for token models to be loaded before rendering tokens
        if (!tokenModelsLoaded) {
            console.log('ThreeBoard: Waiting for token models to load before rendering tokens...')
            return
        }

        const scene = sceneRef.current
        const tokenMeshes = tokenMeshesRef.current
        const tokenLabels = tokenLabelsRef.current

        // First, sync refs with what's actually in the scene
        // This handles the case where component was remounted but scene still has objects
        const tokensInScene = new Set<string>()
        scene.children.forEach((child) => {
            if (child.userData?.tokenId) {
                tokensInScene.add(child.userData.tokenId)
                // Re-add to refs if not already there
                if (!tokenMeshes.has(child.userData.tokenId)) {
                    tokenMeshes.set(child.userData.tokenId, child as THREE.Group)
                }
            }
            if (child.userData?.tokenLabelId) {
                tokensInScene.add(child.userData.tokenLabelId)
                // Re-add label to refs if not already there
                if (!tokenLabels.has(child.userData.tokenLabelId)) {
                    tokenLabels.set(child.userData.tokenLabelId, child)
                }
            }
        })

        // Remove tokens that no longer exist
        // Only remove if they're actually in the scene (not already removed)
        // AND are not in the current tokens list
        const tokensToRemove: string[] = []
        for (const [id] of tokenMeshes.entries()) {
            if (!tokens.find((t) => t.id === id)) {
                tokensToRemove.push(id)
            }
        }

        // Only remove if they're actually in the scene
        for (const id of tokensToRemove) {
            const group = tokenMeshes.get(id)
            if (group && group.parent === scene) {
                scene.remove(group)
                // Dispose all meshes in group
                group.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose()
                        if (Array.isArray(child.material)) {
                            child.material.forEach((mat) => mat.dispose())
                        } else {
                            child.material.dispose()
                        }
                    }
                })
            }

            // Remove label
            const label = tokenLabels.get(id)
            if (label && label.parent === scene) {
                scene.remove(label)
            }

            tokenMeshes.delete(id)
            tokenLabels.delete(id)
            tokenOrientationRef.current.delete(id)
        }

        // Add/update tokens
        tokens.forEach((token) => {
            const radius = token.customRadius ?? gridSize / 2
            const height = radius * 2
            // Convert PixiBoard coordinates to Three.js coordinates
            // PixiJS: (0,0) top-left, X right, Y down
            // Three.js: X = token.x (same), Z = token.y (same), Y slightly lifted to avoid base clipping
            const tokenBaseLift = Math.max(0.1, gridSize * 0.01) // small lift above ground
            const tokenPosition = new THREE.Vector3(token.x, tokenBaseLift, token.y)
            const isActive = token.id === activeTokenId
            const orientationDeg = tokenOrientationRef.current.get(token.id) ?? token.orientationDeg ?? 0

            if (tokenMeshes.has(token.id)) {
                // Update existing token
                const existingGroup = tokenMeshes.get(token.id)!
                const lastRadius = existingGroup.userData.lastRadius as number | undefined
                const needsRebuild = lastRadius === undefined || Math.abs(lastRadius - radius) > 0.01

                if (needsRebuild) {
                    // Remove old group
                    if (existingGroup.parent === scene) {
                        scene.remove(existingGroup)
                    }
                    existingGroup.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.geometry.dispose()
                            if (Array.isArray(child.material)) {
                                child.material.forEach((m) => m.dispose())
                            } else {
                                child.material.dispose()
                            }
                        }
                    })
                    tokenMeshes.delete(token.id)

                    // Build fresh group with correct scale
                    const newGroup = buildTokenGroup(token, radius, height, isActive)
                    newGroup.position.copy(tokenPosition)
                    newGroup.userData.tokenId = token.id
                    newGroup.userData.lastRadius = radius
                    scene.add(newGroup)
                    tokenMeshes.set(token.id, newGroup)

                    // Update label reference if exists
                    const label = tokenLabels.get(token.id)
                    if (label && label.parent !== scene) {
                        scene.add(label)
                    }

                    // Add or update texture
                    if (token.imageId) {
                        const texture = tokenTextureCacheRef.current.get(token.imageId)
                        if (texture) {
                            // Calculate bottom position
                            newGroup.updateMatrixWorld(true)
                            const bbox = new THREE.Box3().setFromObject(newGroup)
                            const bottomY = bbox.min.y
                            const textureRadius = radius * 0.8
                            const textureGeometry = new THREE.CircleGeometry(textureRadius, 32)
                            const textureMaterial = new THREE.MeshStandardMaterial({
                                map: texture.clone(),
                                color: 0xffffff,
                                transparent: true,
                                opacity: 0.9,
                                side: THREE.DoubleSide,
                            })
                            const textureMesh = new THREE.Mesh(textureGeometry, textureMaterial)
                            const localBottomY = bottomY / newGroup.scale.y
                            textureMesh.position.y = localBottomY - 0.01
                            textureMesh.rotation.x = Math.PI / 2
                            textureMesh.castShadow = false
                            textureMesh.receiveShadow = false
                            textureMesh.userData.isTokenTexture = true
                            newGroup.add(textureMesh)
                        }
                    }
                }
                const group = tokenMeshes.get(token.id)!

                // IMPORTANT: If group is not in scene, re-add it
                if (group.parent !== scene) {
                    console.warn('ThreeBoard: Token group not in scene, re-adding', token.id)
                    scene.add(group)
                    // Also re-add label if it exists
                    const label = tokenLabels.get(token.id)
                    if (label && label.parent !== scene) {
                        scene.add(label)
                    }
                }

                group.position.copy(tokenPosition)
                group.rotation.y = (orientationDeg * Math.PI) / 180
                group.userData.tokenId = token.id
                group.traverse((child) => {
                    child.userData = { ...(child.userData ?? {}), tokenId: token.id }
                })
                tokenOrientationRef.current.set(token.id, orientationDeg)

                // Update materials for active state and selection
                const isSelected = token.id === pixiSelectedTokenId
                const shouldUseActiveMaterial = isActive || isSelected
                if (!group.userData.useOriginalMaterials) {
                    group.traverse((child) => {
                        if (child instanceof THREE.Mesh && !child.userData.isTokenTexture) {
                            const materials = Array.isArray(child.material) ? child.material : [child.material]
                            materials.forEach((mat, index) => {
                                if (mat instanceof THREE.MeshStandardMaterial) {
                                    mat.color = new THREE.Color(token.color)
                                    mat.emissive = new THREE.Color(token.color).multiplyScalar(
                                        shouldUseActiveMaterial ? 0.6 : 0.2
                                    )
                                    mat.needsUpdate = true
                                } else {
                                    const fallbackMat = shouldUseActiveMaterial
                                        ? createActiveTokenMaterial(token.color)
                                        : createCyberpunkTokenMaterial(token.color)
                                    if (Array.isArray(child.material)) {
                                        child.material[index] = fallbackMat
                                    } else {
                                        child.material = fallbackMat
                                    }
                                }
                            })
                        }
                    })
                }

                // Update label
                const label = tokenLabels.get(token.id)
                if (label) {
                    label.position.copy(tokenPosition)
                    label.position.y += height + 0.5
                    // Update label text color for active
                    const css2dLabel = label as CSS2DObject
                    css2dLabel.element.style.color = isActive ? '#ffff00' : '#ffffff'
                }
            } else {
                // Create new token with fallback model
                // Safety check: verify tokenGroup is not already in scene
                const existingInScene = Array.from(scene.children).find((child) => child.userData?.tokenId === token.id)
                if (existingInScene) {
                    console.warn('ThreeBoard: Token already exists in scene, reusing', token.id)
                    tokenMeshes.set(token.id, existingInScene as THREE.Group)
                    // Update label if it exists
                    const existingLabel = Array.from(scene.children).find(
                        (child) => child.userData?.tokenLabelId === token.id
                    )
                    if (existingLabel) {
                        tokenLabels.set(token.id, existingLabel)
                    }
                    return
                }

                const tokenGroup = buildTokenGroup(token, radius, height, isActive)
                tokenGroup.position.copy(tokenPosition)
                tokenGroup.rotation.y = (orientationDeg * Math.PI) / 180
                tokenGroup.userData.tokenId = token.id // Mark with token ID
                tokenGroup.traverse((child) => {
                    child.userData = { ...(child.userData ?? {}), tokenId: token.id }
                })
                tokenOrientationRef.current.set(token.id, orientationDeg)

                scene.add(tokenGroup)
                tokenMeshes.set(token.id, tokenGroup)

                // Create label
                const label = createTokenLabel(
                    token,
                    tokenPosition.clone().add(new THREE.Vector3(0, height + 0.5, 0)),
                    isActive
                )
                label.userData.tokenLabelId = token.id // Mark label
                scene.add(label)
                tokenLabels.set(token.id, label)
            }
        })
    }, [tokens, activeTokenId, gridSize, assetVersion])

    // Crosshair ring on active token
    useEffect(() => {
        const scene = sceneRef.current
        if (!scene || !activeTokenId) return

        const token = tokens.find((t) => t.id === activeTokenId)
        if (!token) return

        const radius = token.customRadius ?? gridSize / 2
        const innerRadius = radius * 1.15
        const outerRadius = radius * 1.3

        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64)
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = -Math.PI / 2 // Lay flat on ground
        ring.position.set(token.x, 0.15, token.y)
        scene.add(ring)

        let animId: number
        const animateRing = () => {
            ring.rotation.z += 0.02
            animId = requestAnimationFrame(animateRing)
        }
        animateRing()

        return () => {
            cancelAnimationFrame(animId)
            scene.remove(ring)
            ringGeo.dispose()
            ringMat.dispose()
        }
    }, [activeTokenId, tokens, gridSize])

    // Debug: Log scene children count periodically
    useEffect(() => {
        if (sceneRef.current) {
            const interval = setInterval(() => {}, 1000)
            return () => clearInterval(interval)
        }
    }, [])

    // Render walls
    useEffect(() => {
        if (!sceneRef.current) {
            console.warn('ThreeBoard: sceneRef.current is null, cannot render walls')
            return
        }

        // Wait for all assets to be loaded before rendering walls
        if (!allAssetsLoaded) {
            console.log('ThreeBoard: Waiting for all assets to load before rendering walls...')
            return
        }

        const scene = sceneRef.current
        const wallMeshes = wallMeshesRef.current

        // First, sync refs with what's actually in the scene
        scene.children.forEach((child) => {
            if (child.userData?.wallId && (child instanceof THREE.Mesh || child instanceof THREE.Group)) {
                // Re-add to refs if not already there
                if (!wallMeshes.has(child.userData.wallId)) {
                    wallMeshes.set(child.userData.wallId, child as THREE.Mesh)
                }
            }
        })

        // Remove walls that no longer exist
        // Only remove if they're actually in the scene (not already removed)
        for (const [id, wallObject] of wallMeshes.entries()) {
            if (!walls.find((w) => w.id === id)) {
                // Check if wall object is still in scene before removing
                if (wallObject.parent === scene) {
                    scene.remove(wallObject)
                    // Dispose geometry and materials
                    if (wallObject instanceof THREE.Mesh) {
                        wallObject.geometry.dispose()
                        if (wallObject.material instanceof THREE.MeshStandardMaterial) {
                            wallObject.material.dispose()
                        }
                    } else if (wallObject instanceof THREE.Group) {
                        // Dispose all meshes in the group
                        wallObject.traverse((child) => {
                            if (child instanceof THREE.Mesh) {
                                child.geometry.dispose()
                                if (child.material instanceof THREE.MeshStandardMaterial) {
                                    child.material.dispose()
                                }
                            }
                        })
                    }
                }
                wallMeshes.delete(id)
            }
        }

        // Add/update walls with cyberpunk materials
        walls.forEach((wall) => {
            const color = hexToThreeColor(wall.color ?? wallColor)
            const alpha = wall.alpha ?? wallAlpha
            const wallHeight = gridSize * 2
            const wallTexture = pickWallTexture(wall.id)

            if (wallMeshes.has(wall.id)) {
                // Update existing wall - remove old and recreate
                const oldWall = wallMeshes.get(wall.id)!

                // Remove old wall from scene
                if (oldWall.parent === scene) {
                    scene.remove(oldWall)
                }

                // Dispose old wall
                if (oldWall instanceof THREE.Mesh) {
                    oldWall.geometry.dispose()
                    if (oldWall.material instanceof THREE.MeshStandardMaterial) {
                        oldWall.material.dispose()
                    }
                } else if (oldWall instanceof THREE.Group) {
                    oldWall.traverse((child: THREE.Object3D) => {
                        if (child instanceof THREE.Mesh) {
                            child.geometry.dispose()
                            if (child.material instanceof THREE.MeshStandardMaterial) {
                                child.material.dispose()
                            }
                        }
                    })
                }

                wallMeshes.delete(wall.id)
                // Fall through to create new wall below
            }

            // Create new wall
            if (wall.shape === 'rectangle') {
                const centerX = (wall.x1 + wall.x2) / 2
                const centerZ = (wall.y1 + wall.y2) / 2
                const width = Math.abs(wall.x2 - wall.x1)
                const depth = Math.abs(wall.y2 - wall.y1)
                const wallThickness = gridSize / 4

                // Create hollow rectangle wall group
                const wallGroup = createRectangleWallGeometry(width, depth, wallHeight, wallThickness)
                const newGroup = new THREE.Group()
                wallGroup.children.forEach((child) => {
                    if (child instanceof THREE.Mesh) {
                        const meshClone = child.clone()
                        // Calculate dimensions for this specific wall segment
                        const geometry = meshClone.geometry as THREE.BoxGeometry
                        const dimensions = geometry.parameters
                        // For horizontal walls (top/bottom): width x height
                        // For vertical walls (left/right): depth x height
                        const wallWidth =
                            Math.abs(Math.abs(dimensions.width) - Math.abs(dimensions.depth)) < 0.01
                                ? dimensions.width
                                : dimensions.width > dimensions.depth
                                ? dimensions.width
                                : dimensions.depth
                        const wallHeightForTexture = dimensions.height
                        const material = createCyberpunkWallMaterial(
                            color.getHex(),
                            alpha,
                            wallTexture,
                            wallWidth,
                            wallHeightForTexture,
                            gridSize
                        )
                        meshClone.material = material
                        meshClone.castShadow = true
                        meshClone.receiveShadow = true
                        newGroup.add(meshClone)
                    }
                })
                // Position at ground level (Y=0), walls extend upward
                newGroup.position.set(centerX, 0, centerZ)
                newGroup.userData.wallId = wall.id
                scene.add(newGroup)
                wallMeshes.set(wall.id, newGroup)
            } else if (wall.shape === 'circle') {
                const radius = Math.min(Math.abs(wall.x2 - wall.x1), Math.abs(wall.y2 - wall.y1)) / 2
                const wallThickness = gridSize / 4

                // Create hollow circle wall group (64 segments for smooth appearance)
                const wallGroup = createCircleWallGeometry(radius, wallHeight, wallThickness, 64)
                const newGroup = new THREE.Group()
                wallGroup.children.forEach((child) => {
                    if (child instanceof THREE.Mesh) {
                        const meshClone = child.clone()
                        // Calculate dimensions for this segment
                        const geometry = meshClone.geometry as THREE.BoxGeometry
                        const dimensions = geometry.parameters
                        const segmentLength = dimensions.depth // depth is the arc length
                        const segmentHeight = dimensions.height
                        const material = createCyberpunkWallMaterial(
                            color.getHex(),
                            alpha,
                            wallTexture,
                            segmentLength,
                            segmentHeight,
                            gridSize
                        )
                        meshClone.material = material
                        meshClone.castShadow = true
                        meshClone.receiveShadow = true
                        newGroup.add(meshClone)
                    }
                })
                // Position at ground level (Y=0), walls extend upward
                newGroup.position.set((wall.x1 + wall.x2) / 2, 0, (wall.y1 + wall.y2) / 2)
                newGroup.userData.wallId = wall.id
                scene.add(newGroup)
                wallMeshes.set(wall.id, newGroup)
            } else {
                // Line wall - use single mesh
                const dx = wall.x2 - wall.x1
                const dz = wall.y2 - wall.y1 // PixiBoard Y maps to Three.js Z
                const length = Math.sqrt(dx * dx + dz * dz)
                const centerX = (wall.x1 + wall.x2) / 2
                const centerZ = (wall.y1 + wall.y2) / 2
                const angle = Math.atan2(dz, dx)

                const geometry = new THREE.BoxGeometry(length, wallHeight, gridSize / 4)
                // For line walls: length (horizontal) x wallHeight (vertical)
                const material = createCyberpunkWallMaterial(
                    color.getHex(),
                    alpha,
                    wallTexture,
                    length,
                    wallHeight,
                    gridSize
                )
                const mesh = new THREE.Mesh(geometry, material)
                // BoxGeometry centers by default, so position at half height to put bottom at Y=0
                mesh.position.set(centerX, wallHeight / 2, centerZ)
                mesh.rotation.y = -angle
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.userData.wallId = wall.id
                scene.add(mesh)
                wallMeshes.set(wall.id, mesh)
            }
        })
    }, [walls, wallColor, wallAlpha, gridSize, assetVersion, allAssetsLoaded])

    // Render blasts with enhanced cyberpunk models
    useEffect(() => {
        if (!sceneRef.current) {
            return
        }

        // Wait for all assets to be loaded before rendering blasts
        if (!allAssetsLoaded) {
            console.log('ThreeBoard: Waiting for all assets to load before rendering blasts...')
            return
        }

        const scene = sceneRef.current
        const blastMeshes = blastMeshesRef.current
        const allBlasts = [...blasts, ...blastsNotInMap]

        // First, sync refs with what's actually in the scene
        scene.children.forEach((child) => {
            if (child.userData?.blastId && child instanceof THREE.Group) {
                // Re-add to refs if not already there
                if (!blastMeshes.has(child.userData.blastId)) {
                    blastMeshes.set(child.userData.blastId, child)
                }
            }
        })

        // Remove blasts that no longer exist
        // Only remove if they're actually in the scene (not already removed)
        const blastLights = blastLightsRef.current
        for (const [id, group] of blastMeshes.entries()) {
            if (!allBlasts.find((b) => b.id === id)) {
                // Check if group is still in scene before removing
                if (group.parent === scene) {
                    scene.remove(group)
                    // Dispose all meshes in group
                    group.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.geometry.dispose()
                            if (Array.isArray(child.material)) {
                                child.material.forEach((mat) => mat.dispose())
                            } else {
                                child.material.dispose()
                            }
                        }
                    })
                } else {
                    console.warn('ThreeBoard: Blast', id, 'not in scene, skipping removal')
                }

                // Remove associated light
                const light = blastLights.get(id)
                if (light && light.parent === scene) {
                    scene.remove(light)
                    light.dispose()
                }
                blastLights.delete(id)
                blastMeshes.delete(id)
            }
        }

        // Add/update blasts
        allBlasts.forEach((blast) => {
            const alpha = blast.alpha ?? 0.7

            if (blastMeshes.has(blast.id)) {
                // Update existing blast
                const group = blastMeshes.get(blast.id)!
                const isBlastSelected = blast.id === pixiSelectedBlastId

                // IMPORTANT: If group is not in scene, re-add it
                if (group.parent !== scene) {
                    console.warn('ThreeBoard: Blast group not in scene, re-adding', blast.id)
                    scene.add(group)
                }

                // For cone blasts, positioning is special: apex at (blast.x, blast.y)
                if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
                    // Calculate distance and direction from apex to endpoint
                    // In PixiBoard: baseDx = blast.x2 - blast.x, baseDy = blast.y2 - blast.y
                    // baseAngle = Math.atan2(baseDy, baseDx)
                    const baseDx = blast.x2 - blast.x
                    const baseDy = blast.y2 - blast.y
                    const length = Math.sqrt(baseDx * baseDx + baseDy * baseDy)

                    // Rotate cone to point in the direction of the endpoint
                    // In PixiBoard: sprite points +X initially, rotates by Math.atan2(baseDy, baseDx)
                    // In Three.js: after rotating -90° in X, cone points +Z initially
                    // Coordinate mapping: PixiBoard (X right, Y down) → Three.js (X right, Z forward)
                    // So baseDy in PixiBoard maps to baseDz in Three.js
                    // In Three.js, rotation around Y rotates in XZ plane
                    // To point from +Z toward (baseDx, baseDy), we rotate by Math.atan2(baseDx, baseDy)
                    group.rotation.y = Math.atan2(baseDx, baseDy)

                    // Position cone so apex is at (blast.x, blast.y)
                    // Currently the base is at the origin (0,0,0) in local coordinates
                    // We need to move the group forward by the cone length in the direction of the cone
                    // The cone points in direction (baseDx, baseDy) normalized, so move by +length in that direction
                    const directionX = baseDx / length
                    const directionZ = baseDy / length
                    group.position.set(blast.x + directionX * length, 0, blast.y + directionZ * length)

                    // Center vertically so half the cone is below ground and half above
                    group.updateMatrixWorld(true)
                    const bbox = new THREE.Box3().setFromObject(group)
                    const centerY = (bbox.max.y + bbox.min.y) / 2
                    group.position.y -= centerY
                } else {
                    // Non-cone blasts: center at blast position (centered horizontally, on ground)
                    // In PixiBoard: sprites are centered with anchor.set(0.5), positioned at (blast.x, blast.y)
                    // In Three.js: after fitting, group origin is at center horizontally and min Y at 0
                    group.position.set(blast.x, 0, blast.y)
                }

                // Update opacity and ensure clipping planes are set
                const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
                let blastTexture = blastTextureTemplatesRef.current[blast.type]

                // Adjust cone texture to cover the entire cone surface
                if (blast.type === 'cone' && blastTexture) {
                    blastTexture = blastTexture.clone()
                    blastTexture.rotation = -Math.PI / 2 // -90 degrees in radians

                    // Calculate cone length and base radius for texture repeat
                    let coneLength = blast.size ? blast.size * gridSize : gridSize * 6
                    if (blast.x2 !== undefined && blast.y2 !== undefined) {
                        const dx = blast.x2 - blast.x
                        const dy = blast.y2 - blast.y
                        const actualLength = Math.sqrt(dx * dx + dy * dy)
                        if (actualLength > 0) {
                            coneLength = actualLength
                        }
                    }

                    // Calculate base radius (cone has 28° angle, so half-angle is 14°)
                    const halfAngleRad = (14 * Math.PI) / 180
                    const baseRadius = coneLength * Math.tan(halfAngleRad)
                    const baseCircumference = 2 * Math.PI * baseRadius

                    // Adjust repeat to fit the cone surface properly
                    const baseTextureScale = 100 // Base scale: 1 unit = 100 pixels
                    const repeatU = baseCircumference / baseTextureScale // Horizontal repeat (around circumference)
                    const repeatV = coneLength / baseTextureScale // Vertical repeat (along cone length)

                    blastTexture.wrapS = THREE.RepeatWrapping
                    blastTexture.wrapT = THREE.RepeatWrapping
                    blastTexture.repeat.set(repeatU, repeatV)
                }

                group.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                        // Update material with texture if available
                        const material = createCyberpunkBlastMaterial(alpha, blastTexture)
                        material.clippingPlanes = [clippingPlane]
                        // Add selection highlight
                        if (isBlastSelected) {
                            material.emissive = new THREE.Color(0x00ffff).multiplyScalar(0.5) // Cyan highlight for selection
                        }
                        child.material = material
                    }
                })

                // Update or create light for this blast
                let light = blastLights.get(blast.id)
                if (!light) {
                    // Create soft orange point light
                    light = new THREE.PointLight(0xff6600, 0.5, 200) // Orange color, soft intensity, 200 unit range
                    light.castShadow = false // Don't cast shadows for performance
                    scene.add(light)
                    blastLights.set(blast.id, light)
                }

                // Update light position to match blast position
                if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
                    // For cones, position light at the center of the cone base
                    const baseDx = blast.x2 - blast.x
                    const baseDy = blast.y2 - blast.y
                    const length = Math.sqrt(baseDx * baseDx + baseDy * baseDy)
                    const directionX = baseDx / length
                    const directionZ = baseDy / length
                    const centerX = blast.x + directionX * length * 0.5
                    const centerZ = blast.y + directionZ * length * 0.5
                    light.position.set(centerX, 20, centerZ) // Slightly above ground
                } else {
                    // For other blasts, position light at blast center
                    light.position.set(blast.x, 20, blast.y) // Slightly above ground
                }
            } else {
                const { group: blastGroup } = buildBlastGroup(blast)

                // For cone blasts, positioning is special: apex at (blast.x, blast.y)
                if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
                    // Calculate distance and direction from apex to endpoint
                    // In PixiBoard: baseDx = blast.x2 - blast.x, baseDy = blast.y2 - blast.y
                    // baseAngle = Math.atan2(baseDy, baseDx)
                    const baseDx = blast.x2 - blast.x
                    const baseDy = blast.y2 - blast.y
                    const length = Math.sqrt(baseDx * baseDx + baseDy * baseDy)

                    // Rotate cone to point in the direction of the endpoint
                    // In PixiBoard: sprite points +X initially, rotates by Math.atan2(baseDy, baseDx)
                    // In Three.js: after rotating -90° in X, cone points +Z initially
                    // Coordinate mapping: PixiBoard (X right, Y down) → Three.js (X right, Z forward)
                    // So baseDy in PixiBoard maps to baseDz in Three.js
                    // In Three.js, rotation around Y rotates in XZ plane
                    // To point from +Z toward (baseDx, baseDy), we rotate by Math.atan2(baseDx, baseDy)
                    blastGroup.rotation.y = Math.atan2(baseDx, baseDy)

                    // Position cone so apex is at (blast.x, blast.y)
                    // Currently the base is at the origin (0,0,0) in local coordinates
                    // We need to move the group forward by the cone length in the direction of the cone
                    // The cone points in direction (baseDx, baseDy) normalized, so move by +length in that direction
                    const directionX = baseDx / length
                    const directionZ = baseDy / length
                    blastGroup.position.set(blast.x + directionX * length, 0, blast.y + directionZ * length)

                    // Center vertically so half the cone is below ground and half above
                    blastGroup.updateMatrixWorld(true)
                    const bbox = new THREE.Box3().setFromObject(blastGroup)
                    const centerY = (bbox.max.y + bbox.min.y) / 2
                    blastGroup.position.y -= centerY
                } else {
                    // Non-cone blasts: center at blast position (centered horizontally, on ground)
                    // In PixiBoard: sprites are centered with anchor.set(0.5), positioned at (blast.x, blast.y)
                    // In Three.js: after fitting, group origin is at center horizontally and min Y at 0
                    blastGroup.position.set(blast.x, 0, blast.y)
                }
                blastGroup.userData.blastId = blast.id // Mark with blast ID
                scene.add(blastGroup)
                blastMeshes.set(blast.id, blastGroup)

                // Create soft orange point light for this blast
                const light = new THREE.PointLight(0xff6600, 0.5, 200) // Orange color, soft intensity, 200 unit range
                light.castShadow = false // Don't cast shadows for performance

                // Position light based on blast type
                if (blast.type === 'cone' && blast.x2 !== undefined && blast.y2 !== undefined) {
                    // For cones, position light at the center of the cone base
                    const baseDx = blast.x2 - blast.x
                    const baseDy = blast.y2 - blast.y
                    const length = Math.sqrt(baseDx * baseDx + baseDy * baseDy)
                    const directionX = baseDx / length
                    const directionZ = baseDy / length
                    const centerX = blast.x + directionX * length * 0.5
                    const centerZ = blast.y + directionZ * length * 0.5
                    light.position.set(centerX, 20, centerZ) // Slightly above ground
                } else {
                    // For other blasts, position light at blast center
                    light.position.set(blast.x, 20, blast.y) // Slightly above ground
                }

                scene.add(light)
                blastLights.set(blast.id, light)
            }
        })
    }, [blasts, blastsNotInMap, gridSize, assetVersion])

    // Update grid helper size and appearance
    useEffect(() => {
        if (!sceneRef.current) return

        // If map plane exists, use its dimensions; otherwise use default
        let mapWidth = 1920
        let mapHeight = 1920

        if (mapPlaneRef.current && mapPlaneRef.current.geometry instanceof THREE.PlaneGeometry) {
            mapWidth = mapPlaneRef.current.geometry.parameters.width
            mapHeight = mapPlaneRef.current.geometry.parameters.height
        } else if (!mapTexture) {
            // No map texture yet, skip grid update
            return
        } else if (mapTexture) {
            // Use texture dimensions if available
            mapWidth = mapTexture.width || 1920
            mapHeight = mapTexture.height || 1920
        }

        // Remove old grid if it exists
        const oldGrid = gridHelperRef.current
        if (oldGrid) {
            sceneRef.current.remove(oldGrid)
            oldGrid.geometry.dispose()
            // Handle both LineBasicMaterial (custom grid) and Material (GridHelper)
            if (oldGrid.material instanceof THREE.LineBasicMaterial) {
                oldGrid.material.dispose()
            } else if (oldGrid.material instanceof THREE.Material) {
                oldGrid.material.dispose()
            }
        }

        // Create grid matching map size exactly (same as PixiBoard)
        // PixiBoard draws grid from (0,0) to (mapWidth, mapHeight) with step = gridSize
        // Three.js map plane is centered at (mapWidth/2, 0, mapHeight/2) and extends from (0,0,0) to (mapWidth,0,mapHeight)
        // Grid must cover exactly from (0,0,0) to (mapWidth,0,mapHeight)

        const gridColor3D = hexToThreeColor(gridColor)
        const gridMaterial = new THREE.LineBasicMaterial({ color: gridColor3D, opacity: gridAlpha, transparent: true })

        const gridGeometry = new THREE.BufferGeometry()
        const gridVertices: number[] = []

        // Vertical lines (parallel to Z axis, varying X)
        // Draw lines at x = 0, gridSize, 2*gridSize, ..., up to mapWidth
        const numVerticalLines = Math.ceil(mapWidth / gridSize) + 1
        for (let i = 0; i < numVerticalLines; i++) {
            const x = i * gridSize
            // Always draw lines from z=0 to z=mapHeight to ensure full coverage
            gridVertices.push(x, 0.01, 0)
            gridVertices.push(x, 0.01, mapHeight)
        }
        // Ensure we have a line at the exact edge (mapWidth)
        if (mapWidth % gridSize !== 0) {
            gridVertices.push(mapWidth, 0.01, 0)
            gridVertices.push(mapWidth, 0.01, mapHeight)
        }

        // Horizontal lines (parallel to X axis, varying Z)
        // Draw lines at z = 0, gridSize, 2*gridSize, ..., up to mapHeight
        const numHorizontalLines = Math.ceil(mapHeight / gridSize) + 1
        for (let i = 0; i < numHorizontalLines; i++) {
            const z = i * gridSize
            // Always draw lines from x=0 to x=mapWidth to ensure full coverage
            gridVertices.push(0, 0.01, z)
            gridVertices.push(mapWidth, 0.01, z)
        }
        // Ensure we have a line at the exact edge (mapHeight)
        if (mapHeight % gridSize !== 0) {
            gridVertices.push(0, 0.01, mapHeight)
            gridVertices.push(mapWidth, 0.01, mapHeight)
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3))

        const gridHelper = new THREE.LineSegments(gridGeometry, gridMaterial)

        // Grid starts at (0,0,0) and extends to (mapWidth,0,mapHeight)
        // This matches PixiBoard which draws from (0,0) to (mapWidth, mapHeight)
        // No position offset needed - grid is already at correct position

        sceneRef.current.add(gridHelper)
        gridHelperRef.current = gridHelper
    }, [gridColor, gridAlpha, gridSize, mapTexture])

    // Setup CSS2D renderer for labels
    useCSS2DRenderer(containerRef, sceneRef.current, cameraRef.current, width, height)

    // Fit camera function
    useEffect(() => {
        if (!pixiOnBindFit || !cameraRef.current || !controlsRef.current || !mapPlaneRef.current) return

        const fitFn = () => {
            if (!cameraRef.current || !controlsRef.current || !mapPlaneRef.current) return

            // Get map dimensions
            let mapWidth = 1920
            let mapHeight = 1920
            if (mapPlaneRef.current.geometry instanceof THREE.PlaneGeometry) {
                mapWidth = mapPlaneRef.current.geometry.parameters.width
                mapHeight = mapPlaneRef.current.geometry.parameters.height
            } else if (mapTexture) {
                mapWidth = mapTexture.width || 1920
                mapHeight = mapTexture.height || 1920
            }

            // Calculate bounds
            const box = new THREE.Box3()
            box.setFromCenterAndSize(
                new THREE.Vector3(mapWidth / 2, 0, mapHeight / 2),
                new THREE.Vector3(mapWidth, 0, mapHeight)
            )

            // Calculate distance to fit bounds
            const size = box.getSize(new THREE.Vector3())
            const center = box.getCenter(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.z)
            const distance = maxDim / (2 * Math.tan((cameraRef.current.fov * Math.PI) / 360))

            // Position camera
            cameraRef.current.position.set(center.x, distance * 1.2, center.z + distance * 0.5)
            controlsRef.current.target.copy(center)
            controlsRef.current.update()
        }

        pixiOnBindFit(fitFn)
    }, [pixiOnBindFit, mapTexture, mapPlaneRef.current])

    // Pending movements: acceptAll and cancelAll functions
    useEffect(() => {
        if (!pixiOnBindPendingControls) return

        const cancelAllPending = () => {
            pendingIndicatorsRef.current.forEach((indicator, tokenId) => {
                const pending = pendingMovementsRef.current.get(tokenId)
                if (pending) {
                    if (session && role === 'dm') {
                        sendRejectMovementAction(tokenId)
                    }
                    // Move token back to start position
                    pixiOnTokenMove(tokenId, pending.startX, pending.startZ)
                }
                pendingAnimationsRef.current.delete(tokenId)
                indicator.cleanup()
            })
            pendingIndicatorsRef.current.clear()
            pendingMovementsRef.current.clear()
            pendingAnimationsRef.current.clear()
            setPendingMovements(new Map(pendingMovementsRef.current))
            if (onPendingCountChange) {
                onPendingCountChange(0)
            }
        }

        const acceptAllPending = () => {
            // Snapshot current pending
            const entries = Array.from(pendingMovementsRef.current.entries())

            // Schedule animations for each pending
            for (const [tokenId, pending] of entries) {
                // Reset any existing animation for this token
                pendingAnimationsRef.current.delete(tokenId)

                // Calculate total distance
                const step = gridSize
                let totalDistance = 0
                const pts = [...pending.points]
                const last = pts[pts.length - 1]
                if (!last || last.x !== pending.endX || last.z !== pending.endZ) {
                    pts.push({ x: pending.endX, z: pending.endZ })
                }
                for (let i = 1; i < pts.length; i++) {
                    const dxs = Math.abs(pts[i].x - pts[i - 1].x)
                    const dzs = Math.abs(pts[i].z - pts[i - 1].z)
                    totalDistance += Math.hypot(dxs, dzs) / step
                }
                totalDistance = Math.round(totalDistance)

                const distForMove = props.isCombatActive ? totalDistance : undefined
                const speed = Math.max(120, gridSize * 6)
                const first = pts[0]
                const second = pts[1] ?? pts[0]
                const len0 = Math.hypot(second.x - first.x, second.z - first.z)
                const mesh = tokenMeshesRef.current.get(tokenId)
                const originalRot = mesh?.rotation.y ?? 0
                pendingAnimationsRef.current.set(tokenId, {
                    points: pts,
                    currentIndex: 1,
                    segStart: first,
                    segEnd: second,
                    segLen: len0,
                    speed,
                    totalDistance: distForMove,
                    originalRot,
                    mode: 'move',
                })

                if (session && role === 'dm') {
                    sendPendingMovementAction(tokenId, {
                        ...pending,
                        points: pts,
                    })
                }
            }

            // Cleanup indicators and pending maps
            for (const [tokenId, indicator] of pendingIndicatorsRef.current.entries()) {
                indicator.cleanup()
                pendingSignaturesRef.current.delete(tokenId)
            }
            pendingIndicatorsRef.current.clear()
            pendingMovementsRef.current.clear()
            setPendingMovements(new Map(pendingMovementsRef.current))

            if (onPendingCountChange) {
                onPendingCountChange(0)
            }
        }

        pixiOnBindPendingControls(acceptAllPending, cancelAllPending)
    }, [
        pixiOnBindPendingControls,
        gridSize,
        props.isCombatActive,
        pixiOnTokenMove,
        onPendingCountChange,
        session,
        role,
        mapKey,
        sendAction,
    ])

    // Listen for pending movement events - only update refs, don't create indicators here
    useEffect(() => {
        const handlePendingMovement = (event: CustomEvent) => {
            const { tokenId, points, mapId } = event.detail

            // Only show movements for the current map
            if (mapId !== mapKey) return

            if (points.length >= 2) {
                const startPoint = points[0]
                const endPoint = points[points.length - 1]

                // Convert points from PixiJS coordinates (x, y) to Three.js coordinates (x, z)
                const threePoints = points.map((p: { x: number; y: number }) => ({ x: p.x, z: p.y }))

                const pending = {
                    startX: startPoint.x,
                    startZ: startPoint.y,
                    endX: endPoint.x,
                    endZ: endPoint.y,
                    points: threePoints,
                    fromRemotePlayer: true,
                }

                pendingMovementsRef.current.set(tokenId, pending)
                setPendingMovements(new Map(pendingMovementsRef.current))
            }
        }

        const handleCleanupPendingMovement = (event: CustomEvent) => {
            const { tokenId } = event.detail
            pendingMovementsRef.current.delete(tokenId)
            setPendingMovements(new Map(pendingMovementsRef.current))
        }

        const handlePendingMovementRejected = (event: CustomEvent) => {
            const { tokenId } = event.detail
            const pending = pendingMovementsRef.current.get(tokenId)
            if (pending) {
                // Move token back to start position
                pixiOnTokenMove(tokenId, pending.startX, pending.startZ)
                pendingMovementsRef.current.delete(tokenId)
                setPendingMovements(new Map(pendingMovementsRef.current))
            }
        }

        const handleIndicatorCancel = (event: CustomEvent) => {
            const { tokenId } = event.detail
            const pending = pendingMovementsRef.current.get(tokenId)
            if (!pending) return

            if (pending.points.length <= 2) {
                // Cancel entire movement
                pixiOnTokenMove(tokenId, pending.startX, pending.startZ)
                if (session) {
                    sendRejectMovementAction(tokenId)
                }
                pendingMovementsRef.current.delete(tokenId)
                setPendingMovements(new Map(pendingMovementsRef.current))
                return
            }

            // Remove last waypoint
            const newPoints = [...pending.points]
            newPoints.pop()
            if (newPoints.length <= 2) {
                pixiOnTokenMove(tokenId, pending.startX, pending.startZ)
                if (session) {
                    sendRejectMovementAction(tokenId)
                }
                pendingMovementsRef.current.delete(tokenId)
                setPendingMovements(new Map(pendingMovementsRef.current))
                return
            }

            // Update pending movement with trimmed waypoint list
            const newLastPoint = newPoints[newPoints.length - 1]
            const updatedPending = {
                ...pending,
                endX: newLastPoint.x,
                endZ: newLastPoint.z,
                points: newPoints,
            }
            pendingMovementsRef.current.set(tokenId, updatedPending)
            setPendingMovements(new Map(pendingMovementsRef.current))
            if (session) {
                sendPendingMovementAction(tokenId, updatedPending)
            }
        }

        window.addEventListener('pendingMovementReceived', handlePendingMovement as EventListener)
        window.addEventListener('cleanupPendingMovement', handleCleanupPendingMovement as EventListener)
        window.addEventListener('pendingMovementRejected', handlePendingMovementRejected as EventListener)
        window.addEventListener('indicatorCancel', handleIndicatorCancel as EventListener)

        return () => {
            window.removeEventListener('pendingMovementReceived', handlePendingMovement as EventListener)
            window.removeEventListener('cleanupPendingMovement', handleCleanupPendingMovement as EventListener)
            window.removeEventListener('pendingMovementRejected', handlePendingMovementRejected as EventListener)
            window.removeEventListener('indicatorCancel', handleIndicatorCancel as EventListener)
        }
    }, [mapKey, pixiOnTokenMove, session])

    // Reactively create/update pending indicators based on pendingMovements state
    useEffect(() => {
        if (!threeReady || !sceneRef.current || !cameraRef.current) return

        // Cleanup indicators that no longer exist
        for (const [tokenId, indicator] of pendingIndicatorsRef.current.entries()) {
            if (!pendingMovements.has(tokenId)) {
                indicator.cleanup()
                pendingIndicatorsRef.current.delete(tokenId)
                pendingSignaturesRef.current.delete(tokenId)
            }
        }

        // Create/update indicators for current pending movements
        pendingMovements.forEach((pending, tokenId) => {
            const token = tokens.find((t) => t.id === tokenId)
            if (!token || !sceneRef.current || !cameraRef.current) return

            const signature = `${pending.startX},${pending.startZ},${pending.endX},${pending.endZ},${
                pending.points.length
            },${pending.points[pending.points.length - 1]?.x},${pending.points[pending.points.length - 1]?.z}`
            const prevSig = pendingSignaturesRef.current.get(tokenId)

            const existingIndicator = pendingIndicatorsRef.current.get(tokenId)
            if (existingIndicator && prevSig === signature) {
                // No change; skip rebuild
                return
            }

            // If indicator exists but data changed, try update; if no update method, rebuild
            if (existingIndicator) {
                if (existingIndicator.update) {
                    existingIndicator.update({
                        startX: pending.startX,
                        startZ: pending.startZ,
                        endX: pending.endX,
                        endZ: pending.endZ,
                        points: pending.points,
                    })
                    pendingSignaturesRef.current.set(tokenId, signature)
                    return
                }
                existingIndicator.cleanup()
            }

            const getLatestPending = () => pendingMovementsRef.current.get(tokenId) ?? pending

            const indicatorObj = createThreePendingIndicator({
                id: tokenId,
                startX: pending.startX,
                startZ: pending.startZ,
                endX: pending.endX,
                endZ: pending.endZ,
                points: pending.points,
                gridSize,
                isCombatActive: props.isCombatActive,
                token,
                scene: sceneRef.current,
                camera: cameraRef.current,
                onAccept: () => {
                    const latest = getLatestPending()
                    if (!latest) return
                    const pendingData = latest

                    // Calculate total distance
                    const step = gridSize
                    let totalDistance = 0
                    const pts = [...pendingData.points]
                    const last = pts[pts.length - 1]
                    if (!last || last.x !== pendingData.endX || last.z !== pendingData.endZ) {
                        pts.push({ x: pendingData.endX, z: pendingData.endZ })
                    }
                    for (let i = 1; i < pts.length; i++) {
                        const dxs = Math.abs(pts[i].x - pts[i - 1].x)
                        const dzs = Math.abs(pts[i].z - pts[i - 1].z)
                        totalDistance += Math.hypot(dxs, dzs) / step
                    }
                    totalDistance = Math.round(totalDistance)

                    // Start animation along all segments; move state on completion
                    const distForMove = props.isCombatActive ? totalDistance : undefined
                    const speed = Math.max(120, gridSize * 6) // units per second
                    const first = pts[0]
                    const second = pts[1] ?? pts[0]
                    const len0 = Math.hypot(second.x - first.x, second.z - first.z)
                    const mesh = tokenMeshesRef.current.get(tokenId)
                    const originalRot = mesh?.rotation.y ?? 0
                    pendingAnimationsRef.current.set(tokenId, {
                        points: pts,
                        currentIndex: 1,
                        segStart: first,
                        segEnd: second,
                        segLen: len0,
                        speed,
                        totalDistance: distForMove,
                        originalRot,
                        mode: 'move',
                    })

                    if (session && role === 'dm') {
                        sendPendingMovementAction(tokenId, {
                            ...pendingData,
                            points: pts,
                        })
                    }

                    // Cleanup
                    pendingMovementsRef.current.delete(tokenId)
                    setPendingMovements(new Map(pendingMovementsRef.current))
                },
                onCancel: () => {
                    // Move token back to start position
                    const latest = getLatestPending()
                    const startX = latest?.startX ?? pending.startX
                    const startZ = latest?.startZ ?? pending.startZ
                    pixiOnTokenMove(tokenId, startX, startZ)

                    if (session && role === 'dm') {
                        sendRejectMovementAction(tokenId)
                    }

                    // Cleanup
                    pendingMovementsRef.current.delete(tokenId)
                    setPendingMovements(new Map(pendingMovementsRef.current))
                },
                endModelTemplate: tokenMeshesRef.current.get(tokenId) ?? undefined,
                isPlayerConnected: !isPlayerConnected,
                fromRemotePlayer: pending.fromRemotePlayer ?? false,
            })

            pendingIndicatorsRef.current.set(tokenId, indicatorObj)
            pendingSignaturesRef.current.set(tokenId, signature)
        })

        // Update pending count
        if (onPendingCountChange) {
            onPendingCountChange(pendingMovements.size)
        }
    }, [
        pendingMovements,
        tokens,
        gridSize,
        props.isCombatActive,
        pixiOnTokenMove,
        onPendingCountChange,
        isPlayerConnected,
        session,
        role,
        mapKey,
        sendAction,
        threeReady,
        sceneRef.current,
        cameraRef.current,
    ])

    // Cleanup pending indicators on unmount only
    useEffect(() => {
        return () => {
            for (const indicator of pendingIndicatorsRef.current.values()) {
                indicator.cleanup()
            }
            pendingIndicatorsRef.current.clear()
            pendingSignaturesRef.current.clear()
        }
    }, [])

    // Measuring tool
    useMeasureTool(measureStart, measureEnd, sceneRef.current, gridSize)

    // Blast preview — use 'cone' during rotation mode even if blastDrawMode is null
    const effectiveBlastPreviewMode: BlastType | null = rotatingConeRef.current ? 'cone' : (blastDrawMode || null)
    useBlastPreview(
        effectiveBlastPreviewMode,
        blastPreviewStart,
        blastPreviewEnd,
        sceneRef.current,
        gridSize,
        snapToGrid,
        blastTextureTemplatesRef.current
    )

    // Wall preview
    useWallPreview(
        isWallMode,
        wallDrawingShape,
        wallDrawingStart,
        wallDrawingEnd,
        sceneRef.current,
        gridSize,
        wallColor,
        wallAlpha,
        snapToGrid
    )

    // Token tooltip on hover
    useThreeTooltip(
        containerRef.current,
        sceneRef.current,
        cameraRef.current,
        tokens,
        tokenMeshesRef.current,
        width,
        height,
        isWallMode,
        isMeasuring,
        blastDrawMode
    )

    // Pending movements (placeholder for future implementation)
    // usePendingMovements(pendingMovementsRef.current, tokens, sceneRef.current, gridSize)

    // Mouse interaction for measuring and token dragging
    useEffect(() => {
        if (!containerRef.current || !cameraRef.current || !sceneRef.current) return

        const getGroundIntersection = (mouseX: number, mouseY: number): THREE.Vector3 | null => {
            const camera = cameraRef.current
            if (!camera) return null

            const raycaster = new THREE.Raycaster()
            const mouseVector = new THREE.Vector2()
            mouseVector.x = (mouseX / width) * 2 - 1
            mouseVector.y = -(mouseY / height) * 2 + 1

            raycaster.setFromCamera(mouseVector, camera)

            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
            const intersectionPoint = new THREE.Vector3()
            raycaster.ray.intersectPlane(plane, intersectionPoint)

            return intersectionPoint
        }

        // Handle token resize with Shift+Wheel and rotate with Ctrl+Wheel
        const handleShiftWheel = (e: globalThis.WheelEvent) => {
            if (!cameraRef.current || !sceneRef.current) return
            const isShift = e.shiftKey
            const isCtrl = e.ctrlKey

            // Prevent OrbitControls zoom while resizing/rotating
            if (isShift || isCtrl) {
                e.preventDefault()
                e.stopPropagation()
            }

            if (isCtrl) {
                const rect = containerRef.current?.getBoundingClientRect()
                if (!rect) return
                const mouse = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                }
                const raycaster = new THREE.Raycaster()
                const mouseVector = new THREE.Vector2()
                mouseVector.x = (mouse.x / width) * 2 - 1
                mouseVector.y = -(mouse.y / height) * 2 + 1
                raycaster.setFromCamera(mouseVector, cameraRef.current!)

                // Intersect against token meshes to allow model/texture hit
                const tokenIntersects = raycaster.intersectObjects(Array.from(tokenMeshesRef.current.values()), true)
                let hitToken: Token | null = null
                if (tokenIntersects.length > 0) {
                    const tokenHit = findTokenFromObject(tokenIntersects[0].object)
                    if (tokenHit) {
                        hitToken = tokens.find((t) => t.id === tokenHit.id) ?? null
                    }
                }

                // Fallback: use ground projection if no mesh hit
                if (!hitToken) {
                    const intersectionPoint = getGroundIntersection(mouse.x, mouse.y)
                    if (intersectionPoint) {
                        let minDist = Number.POSITIVE_INFINITY
                        for (const t of tokens) {
                            const currentRadius = t.customRadius ?? gridSize / 2
                            const d = Math.hypot(t.x - intersectionPoint.x, t.y - intersectionPoint.z)
                            if (d <= currentRadius && d < minDist) {
                                hitToken = t
                                minDist = d
                            }
                        }
                    }
                }

                if (hitToken) {
                    const delta = e.deltaY < 0 ? 45 : -45
                    const currentOrient = tokenOrientationRef.current.get(hitToken.id) ?? hitToken.orientationDeg ?? 0
                    const newOrient = (((currentOrient + delta) % 360) + 360) % 360
                    tokenOrientationRef.current.set(hitToken.id, newOrient)
                    const mesh = tokenMeshesRef.current.get(hitToken.id)
                    if (mesh) {
                        mesh.rotation.y = (newOrient * Math.PI) / 180
                    }
                    if (pixiOnTokenUpdate) {
                        pixiOnTokenUpdate(hitToken.id, { orientationDeg: newOrient })
                    }
                }
                return
            }

            if (!isShift) return
            // Prevent OrbitControls zoom while resizing
            e.preventDefault()
            e.stopPropagation()

            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const mouse = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }

            const raycaster = new THREE.Raycaster()
            const mouseVector = new THREE.Vector2()
            mouseVector.x = (mouse.x / width) * 2 - 1
            mouseVector.y = -(mouse.y / height) * 2 + 1
            raycaster.setFromCamera(mouseVector, cameraRef.current!)

            // Intersect against token meshes to allow model/texture hit
            const tokenIntersects = raycaster.intersectObjects(Array.from(tokenMeshesRef.current.values()), true)
            let hitToken: Token | null = null
            if (tokenIntersects.length > 0) {
                const tokenHit = findTokenFromObject(tokenIntersects[0].object)
                if (tokenHit) {
                    hitToken = tokens.find((t) => t.id === tokenHit.id) ?? null
                }
            }

            // Fallback: use ground projection if no mesh hit
            if (!hitToken) {
                const intersectionPoint = getGroundIntersection(mouse.x, mouse.y)
                if (intersectionPoint) {
                    let minDist = Number.POSITIVE_INFINITY
                    for (const t of tokens) {
                        const currentRadius = t.customRadius ?? gridSize / 2
                        const d = Math.hypot(t.x - intersectionPoint.x, t.y - intersectionPoint.z)
                        if (d <= currentRadius && d < minDist) {
                            hitToken = t
                            minDist = d
                        }
                    }
                }
            }

            if (hitToken && pixiOnTokenUpdate) {
                const delta = e.deltaY < 0 ? 1 : -1 // Negative deltaY means wheel up (increase size)
                const sizeIncrement = gridSize / 2
                const currentRadius = hitToken.customRadius ?? gridSize / 2
                const newRadius = Math.max(0, currentRadius + delta * sizeIncrement)

                // Update token
                pixiOnTokenUpdate(hitToken.id, {
                    customRadius: newRadius > 0 ? newRadius : undefined,
                })
            }
        }

        // Handle drop events for tokens and blasts
        const handleDrop = (e: globalThis.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const mouse = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }

            const intersectionPoint = getGroundIntersection(mouse.x, mouse.y)
            if (!intersectionPoint) return

            // Try application/json first (Pixi format), fall back to text/plain
            const data =
                e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain')
            if (!data) return

            try {
                const droppedData = JSON.parse(data)

                let finalX = intersectionPoint.x
                let finalZ = intersectionPoint.z
                if (snapToGrid) {
                    const snapped = snapToNinePoints(finalX, finalZ, gridSize, snapToGrid)
                    finalX = snapped.x
                    finalZ = snapped.y
                }

                // Check if it's a blast type (grenade, circle, square, cone)
                if (
                    droppedData?.type &&
                    ['grenade', 'circle', 'square', 'cone'].includes(droppedData.type)
                ) {
                    if (droppedData.type === 'cone') {
                        // Cone: enter rotation mode
                        const coneLength = droppedData.size ?? 6
                        rotatingConeRef.current = {
                            id: droppedData.id || globalThis.crypto?.randomUUID?.() || String(Date.now()),
                            apexX: finalX,
                            apexZ: finalZ,
                            lengthInGrids: coneLength,
                            angleRad: 0,
                        }
                        rotationReadyAtRef.current = Date.now() + 180
                        setBlastPreviewStart(new THREE.Vector3(finalX, 0, finalZ))
                        setBlastPreviewEnd(
                            new THREE.Vector3(finalX + gridSize * coneLength, 0, finalZ)
                        )
                    } else if (pixiOnBlastDrop) {
                        // Non-cone blasts: drop directly
                        pixiOnBlastDrop(droppedData, finalX, finalZ)
                    }
                } else if (droppedData?.id && pixiOnTokenDrop) {
                    // Token drop
                    pixiOnTokenDrop(droppedData.id, finalX, finalZ)
                }
            } catch (error) {
                console.error('Error handling drop:', error)
            }
        }

        const handleDragOver = (e: globalThis.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleMouseDown = (event: globalThis.MouseEvent) => {
            if (!cameraRef.current || !sceneRef.current) return

            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const mouse = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }

            const intersectionPoint = getGroundIntersection(mouse.x, mouse.y)
            if (!intersectionPoint) return

            // Handle right-click for context menus
            if (event.button === 2) {
                // Track right-click start position to detect if user is dragging to rotate camera
                rightMouseDownRef.current = { x: event.clientX, y: event.clientY }
                isRightClickDraggingRef.current = false
                // Don't prevent default here - let OrbitControls handle rotation
                // We'll check in handleMouseUp if it was a drag or a click
                return
            }

            // Ignore middle button (button === 1) for token/blast interactions
            if (event.button === 1) {
                return
            }

            // Left click handling
            if (isMeasuring) {
                // Measuring mode - check for token hit to start from token position (like Pixi)
                if (!measureStart) {
                    const raycaster = new THREE.Raycaster()
                    const mouseVector = new THREE.Vector2()
                    mouseVector.x = (mouse.x / width) * 2 - 1
                    mouseVector.y = -(mouse.y / height) * 2 + 1
                    raycaster.setFromCamera(mouseVector, cameraRef.current)
                    const tokenIntersects = raycaster.intersectObjects(
                        Array.from(tokenMeshesRef.current.values()),
                        true
                    )
                    if (tokenIntersects.length > 0) {
                        const hitObject = tokenIntersects[0].object
                        const tokenHit = findTokenFromObject(hitObject)
                        if (tokenHit) {
                            const tokenData = tokens.find((t) => t.id === tokenHit.id)
                            if (tokenData) {
                                const snapped = snapToNinePoints(tokenData.x, tokenData.y, gridSize, snapToGrid)
                                setMeasureStart(new THREE.Vector3(snapped.x, 0, snapped.y))
                                return
                            }
                        }
                    }
                    const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                    setMeasureStart(new THREE.Vector3(snapped.x, 0, snapped.y))
                } else {
                    const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                    setMeasureEnd(new THREE.Vector3(snapped.x, 0, snapped.y))
                }
            } else if (blastDrawMode) {
                // Blast drawing mode
                if (!blastPreviewStart) {
                    setBlastPreviewStart(intersectionPoint)
                } else {
                    setBlastPreviewEnd(intersectionPoint)
                }
            } else if (isWallMode && isErasingWalls) {
                // Wall eraser mode — store start point
                const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                eraseStartRef.current = { x: snapped.x, z: snapped.y }
                erasePreviewRef.current = null
            } else if (isWallMode && wallDrawingShape && !isErasingWalls) {
                // Wall drawing mode - snap start point to 9-point grid like Pixi
                if (!wallDrawingStart) {
                    const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                    setWallDrawingStart(new THREE.Vector3(snapped.x, 0, snapped.y))
                } else {
                    const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                    setWallDrawingEnd(new THREE.Vector3(snapped.x, 0, snapped.y))
                }
            } else {
                // Token drag/select mode
                const raycaster = new THREE.Raycaster()
                const mouseVector = new THREE.Vector2()
                mouseVector.x = (mouse.x / width) * 2 - 1
                mouseVector.y = -(mouse.y / height) * 2 + 1
                raycaster.setFromCamera(mouseVector, cameraRef.current)

                // Check for token click (walk up ancestor chain)
                const tokenIntersects = raycaster.intersectObjects(Array.from(tokenMeshesRef.current.values()), true)
                if (tokenIntersects.length > 0) {
                    const hitObject = tokenIntersects[0].object
                    const tokenHit = findTokenFromObject(hitObject)
                    if (tokenHit) {
                        const id = tokenHit.id
                        const tokenData = tokens.find((t) => t.id === id)
                        const inSession = !!session && connected
                        if (inSession && role === 'player' && tokenData?.owner && tokenData.owner !== displayName) {
                            return
                        }
                        pixiSetSelectedTokenId(id)
                        leftClickTokenRef.current = { id, x: event.clientX, y: event.clientY }
                        isLeftClickDraggingRef.current = false
                        setDraggedTokenId(id)
                        const pendingExisting = pendingMovementsRef.current.get(id)
                        const lastPoint =
                            pendingExisting?.points?.[pendingExisting.points.length - 1] ??
                            (pendingExisting ? { x: pendingExisting.endX, z: pendingExisting.endZ } : undefined)
                        const startX = pendingExisting
                            ? lastPoint?.x ?? pendingExisting.endX ?? tokenData?.x ?? intersectionPoint.x
                            : tokenData?.x ?? intersectionPoint.x
                        const startZ = pendingExisting
                            ? lastPoint?.z ?? pendingExisting.endZ ?? tokenData?.y ?? intersectionPoint.z
                            : tokenData?.y ?? intersectionPoint.z
                        // Mark new segment when a pending path already exists
                        isStartingNewSegmentRef.current = Boolean(pendingExisting)
                        newSegmentPreviewAddedRef.current = false
                        dragStartRef.current = { x: startX, z: startZ }
                    }
                } else {
                    // Click on blast to select or drag
                    const blastIntersects = raycaster.intersectObjects(
                        Array.from(blastMeshesRef.current.values()),
                        true
                    )
                    if (blastIntersects.length > 0) {
                        const hitObject = blastIntersects[0].object
                        for (const [id, group] of blastMeshesRef.current.entries()) {
                            if (group === hitObject || group.children.includes(hitObject)) {
                                pixiSetSelectedBlastId(id)
                                // Start dragging blast (skip if locked)
                                const blast = [...blasts, ...blastsNotInMap].find((b) => b.id === id)
                                if (blast && blast.locked) break
                                if (blast && pixiOnBlastMoveProp) {
                                    // Clear selection highlight during drag
                                    pixiSetSelectedBlastId(null)
                                    // Rotation mode for cones is set AFTER drag in mouseup
                                    setDraggedBlastId(id)
                                    dragBlastStartRef.current = { x: blast.x, z: blast.y }
                                }
                                break
                            }
                        }
                    } else {
                        // Click on empty space - deselect and clear left-click tracking
                        pixiSetSelectedTokenId(null)
                        pixiSetSelectedBlastId(null)
                        leftClickTokenRef.current = null
                        isLeftClickDraggingRef.current = false
                    }
                }
            }
        }

        const handleMouseMove = (event: PointerEventLike | globalThis.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            // Check if right mouse button is being dragged (for camera rotation)
            // If mouse moved more than 5 pixels from right-click start, consider it a drag
            if (rightMouseDownRef.current) {
                const dx = event.clientX - rightMouseDownRef.current.x
                const dy = event.clientY - rightMouseDownRef.current.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance > 5) {
                    isRightClickDraggingRef.current = true
                }
            }

            // Check if left mouse button is being dragged on a token
            // If mouse moved more than 5 pixels from left-click start, consider it a drag
            if (leftClickTokenRef.current) {
                const dx = event.clientX - leftClickTokenRef.current.x
                const dy = event.clientY - leftClickTokenRef.current.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance > 5) {
                    isLeftClickDraggingRef.current = true
                }
            }

            const mouse = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }

            const intersectionPoint = getGroundIntersection(mouse.x, mouse.y)
            if (!intersectionPoint) return

            // Cone rotation preview — update live as cursor moves
            if (rotatingConeRef.current) {
                const { apexX, apexZ, lengthInGrids } = rotatingConeRef.current
                const cdx = intersectionPoint.x - apexX
                const cdz = intersectionPoint.z - apexZ
                const angle = Math.atan2(cdz, cdx)
                const lenPx = lengthInGrids * gridSize
                // Snap endpoint to 9-point grid (like Pixi's endpointFromAngleLength)
                const rawEndX = apexX + Math.cos(angle) * lenPx
                const rawEndZ = apexZ + Math.sin(angle) * lenPx
                const snappedEnd = snapToNinePoints(rawEndX, rawEndZ, gridSize, snapToGrid)
                setBlastPreviewStart(new THREE.Vector3(apexX, 0, apexZ))
                setBlastPreviewEnd(new THREE.Vector3(snappedEnd.x, 0, snappedEnd.y))
                return
            }

            if (isMeasuring && measureStart) {
                // Update measure end point (snapped to grid)
                const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                setMeasureEnd(new THREE.Vector3(snapped.x, 0, snapped.y))
            } else if (blastDrawMode && blastPreviewStart) {
                // Update blast preview end point
                setBlastPreviewEnd(intersectionPoint)
            } else if (isWallMode && isErasingWalls && eraseStartRef.current) {
                // Update eraser preview line
                const scene = sceneRef.current
                if (scene) {
                    // Remove old preview line
                    if (eraseLineRef.current) {
                        scene.remove(eraseLineRef.current)
                        eraseLineRef.current.geometry.dispose()
                        ;(eraseLineRef.current.material as THREE.Material).dispose()
                        eraseLineRef.current = null
                    }
                    const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                    erasePreviewRef.current = { x: snapped.x, z: snapped.y }
                    const pts = [
                        new THREE.Vector3(eraseStartRef.current.x, 1, eraseStartRef.current.z),
                        new THREE.Vector3(snapped.x, 1, snapped.y),
                    ]
                    const geo = new THREE.BufferGeometry().setFromPoints(pts)
                    const mat = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 2 })
                    const line = new THREE.Line(geo, mat)
                    scene.add(line)
                    eraseLineRef.current = line

                    // Highlight intersected walls (like Pixi's red highlight)
                    const sx = eraseStartRef.current.x
                    const sz = eraseStartRef.current.z
                    const ex = snapped.x
                    const ez = snapped.y
                    const s1 = { x: sx, y: sz }
                    const s2 = { x: ex, y: ez }

                    const newHighlighted = new Set<string>()
                    for (const w of walls) {
                        const wallShape = w.shape || 'line'
                        let hit = false
                        if (wallShape === 'line') {
                            hit = segmentsIntersect(s1, s2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })
                        } else if (wallShape === 'rectangle') {
                            hit = segmentIntersectsRectangle(s1, s2, w.x1, w.y1, w.x2, w.y2)
                        } else if (wallShape === 'circle') {
                            const cdx = w.x2 - w.x1
                            const cdy = w.y2 - w.y1
                            const centerX = w.x1 + cdx / 2
                            const centerY = w.y1 + cdy / 2
                            const radius = Math.min(Math.abs(cdx), Math.abs(cdy)) / 2
                            hit = segmentHitsCircleBoundary(s1, s2, centerX, centerY, radius)
                        }
                        if (hit) newHighlighted.add(w.id)
                    }

                    // Apply/remove highlight on wall meshes
                    const wallMeshes = wallMeshesRef.current
                    for (const [id, mesh] of wallMeshes.entries()) {
                        const shouldHighlight = newHighlighted.has(id)
                        const wasHighlighted = highlightedWallIdsRef.current.has(id)
                        if (shouldHighlight && !wasHighlighted) {
                            // Add red emissive highlight
                            mesh.traverse((child) => {
                                if (child instanceof THREE.Mesh && child.material) {
                                    const m = child.material as THREE.MeshStandardMaterial
                                    if (m.emissive) {
                                        child.userData._origEmissive = m.emissive.getHex()
                                        child.userData._origEmissiveIntensity = m.emissiveIntensity
                                        m.emissive.setHex(0xff0000)
                                        m.emissiveIntensity = 2.0
                                    }
                                }
                            })
                        } else if (!shouldHighlight && wasHighlighted) {
                            // Restore original emissive
                            mesh.traverse((child) => {
                                if (child instanceof THREE.Mesh && child.material) {
                                    const m = child.material as THREE.MeshStandardMaterial
                                    if (m.emissive && child.userData._origEmissive !== undefined) {
                                        m.emissive.setHex(child.userData._origEmissive)
                                        m.emissiveIntensity = child.userData._origEmissiveIntensity ?? 1.0
                                        delete child.userData._origEmissive
                                        delete child.userData._origEmissiveIntensity
                                    }
                                }
                            })
                        }
                    }
                    highlightedWallIdsRef.current = newHighlighted
                }
            } else if (isWallMode && wallDrawingShape && !isErasingWalls && wallDrawingStart) {
                // Update wall preview end point (snapped to grid)
                const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                setWallDrawingEnd(new THREE.Vector3(snapped.x, 0, snapped.y))
            } else if (draggedBlastId && dragBlastStartRef.current) {
                // Blast dragging — move the blast mesh visually
                const snapped = snapToNinePoints(intersectionPoint.x, intersectionPoint.z, gridSize, snapToGrid)
                const blast = [...blasts, ...blastsNotInMap].find((b) => b.id === draggedBlastId)
                if (blast) {
                    const dx = snapped.x - dragBlastStartRef.current.x
                    const dz = snapped.y - dragBlastStartRef.current.z
                    const group = blastMeshesRef.current.get(draggedBlastId)
                    if (group) {
                        if (blast.type === 'cone') {
                            // Cone group is at endpoint (base/wide end), not apex
                            const x2 = blast.x2 ?? blast.x
                            const y2 = blast.y2 ?? blast.y
                            group.position.set(x2 + dx, group.position.y, y2 + dz)
                        } else {
                            group.position.set(blast.x + dx, group.position.y, blast.y + dz)
                        }
                    }
                }
            } else if (draggedTokenId && dragStartRef.current) {
                const token = tokens.find((t) => t.id === draggedTokenId)
                if (!token) return

                // Drag token - in session players build pending moves instead of moving immediately
                const inSession = !!session && connected
                const isPlayerRole = role === 'player'
                if (inSession && isPlayerRole && token.owner && token.owner !== displayName) {
                    return
                }

                const dragPoint = getGroundIntersection(mouse.x, mouse.y)
                if (dragPoint) {
                    let newX = dragPoint.x
                    let newZ = dragPoint.z

                    // Apply snap to nine points if enabled (same as PixiBoard)
                    if (snapToGrid) {
                        const snapped = snapToNinePoints(newX, newZ, gridSize, snapToGrid)
                        newX = snapped.x
                        newZ = snapped.y
                    }

                    const shouldUsePending = !session || (inSession && isPlayerRole)

                    if (shouldUsePending) {
                        const existing = pendingMovementsRef.current.get(draggedTokenId)
                        const startX =
                            isStartingNewSegmentRef.current && dragStartRef.current?.x !== undefined
                                ? dragStartRef.current.x
                                : existing?.startX ?? dragStartRef.current.x ?? token.x
                        const startZ =
                            isStartingNewSegmentRef.current && dragStartRef.current?.z !== undefined
                                ? dragStartRef.current.z
                                : existing?.startZ ?? dragStartRef.current.z ?? token.y

                        let points: { x: number; z: number }[]
                        if (existing) {
                            // If starting a new segment, append a new preview point
                            if (isStartingNewSegmentRef.current) {
                                const base = existing.points.length ? [...existing.points] : [{ x: startX, z: startZ }]

                                if (!newSegmentPreviewAddedRef.current) {
                                    // First move in new segment: append preview point
                                    points = [...base, { x: newX, z: newZ }]
                                    newSegmentPreviewAddedRef.current = true
                                } else {
                                    // Subsequent moves: replace last preview point to keep segment straight
                                    points = [...base]
                                    points[points.length - 1] = { x: newX, z: newZ }
                                }
                            } else {
                                points = [...existing.points]
                                if (points.length >= 2) {
                                    points[points.length - 1] = { x: newX, z: newZ }
                                } else {
                                    points.push({ x: newX, z: newZ })
                                }
                            }
                        } else {
                            points = [
                                { x: startX, z: startZ },
                                { x: newX, z: newZ },
                            ]
                        }

                        const prev = pendingMovementsRef.current.get(draggedTokenId)
                        const prevLast = prev?.points[prev.points.length - 1]
                        if (
                            !isStartingNewSegmentRef.current &&
                            prevLast &&
                            prevLast.x === newX &&
                            prevLast.z === newZ
                        ) {
                            return
                        }

                        const updatedPending = {
                            startX,
                            startZ,
                            endX: newX,
                            endZ: newZ,
                            points,
                            fromRemotePlayer: false,
                        }

                        pendingMovementsRef.current.set(draggedTokenId, updatedPending)
                        setPendingMovements(new Map(pendingMovementsRef.current))

                        // Broadcast locally so other views (e.g., Pixi) show the pending path immediately
                        window.dispatchEvent(
                            new CustomEvent('pendingMovementReceived', {
                                detail: {
                                    tokenId: draggedTokenId,
                                    points: updatedPending.points.map((p) => ({ x: p.x, y: p.z })),
                                    mapId: mapKey,
                                },
                            })
                        )

                        // If in session as player, stream the pending movement so the DM sees live updates
                        if (session && isPlayerRole) {
                            sendAction({
                                kind: 'PENDING_MOVEMENT',
                                tokenId: draggedTokenId,
                                points: updatedPending.points.map((p) => ({ x: p.x, y: p.z })),
                                mapId: mapKey,
                            })
                        }
                    } else {
                        // Offline/DM move tokens immediately
                        pixiOnTokenMove(draggedTokenId, newX, newZ)
                    }
                }
            }
        }

        const handleMouseUp = (event: globalThis.MouseEvent) => {
            // Handle right-click context menu (only if not dragging to rotate camera)
            if (event.button === 2 && rightMouseDownRef.current) {
                // Only show context menu if it wasn't a drag (rotation)
                if (!isRightClickDraggingRef.current) {
                    event.preventDefault()
                    event.stopPropagation()

                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect && cameraRef.current && sceneRef.current) {
                        const mouse = {
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                        }

                        const intersectionPoint = getGroundIntersection(mouse.x, mouse.y)
                        if (intersectionPoint) {
                            const raycaster = new THREE.Raycaster()
                            const mouseVector = new THREE.Vector2()
                            mouseVector.x = (mouse.x / width) * 2 - 1
                            mouseVector.y = -(mouse.y / height) * 2 + 1
                            raycaster.setFromCamera(mouseVector, cameraRef.current)

                            // Check for token click (walk ancestors)
                            const tokenIntersects = raycaster.intersectObjects(
                                Array.from(tokenMeshesRef.current.values()),
                                true
                            )
                            if (tokenIntersects.length > 0) {
                                const hitObject = tokenIntersects[0].object
                                const tokenHit = findTokenFromObject(hitObject)
                                if (tokenHit) {
                                    contextMenus.openTokenContextMenu(
                                        intersectionPoint.x,
                                        intersectionPoint.z,
                                        tokenHit.id
                                    )
                                    return
                                }
                            } else {
                                // Check for blast click
                                const blastIntersects = raycaster.intersectObjects(
                                    Array.from(blastMeshesRef.current.values()),
                                    true
                                )
                                if (blastIntersects.length > 0) {
                                    const hitObject = blastIntersects[0].object
                                    for (const [id] of blastMeshesRef.current.entries()) {
                                        const group = blastMeshesRef.current.get(id)
                                        if (group && (group === hitObject || group.children.includes(hitObject))) {
                                            const blast = [...blasts, ...blastsNotInMap].find((b) => b.id === id)
                                            if (blast) {
                                                contextMenus.openBlastContextMenu(
                                                    intersectionPoint.x,
                                                    intersectionPoint.z,
                                                    blast
                                                )
                                            }
                                            break
                                        }
                                    }
                                } else {
                                    // Click on empty space - open map context menu
                                    contextMenus.openMapContextMenu(intersectionPoint.x, intersectionPoint.z)
                                }
                            }
                        }
                    }
                }

                // Reset right-click tracking
                rightMouseDownRef.current = null
                isRightClickDraggingRef.current = false
                return
            }

            // Handle cone rotation confirmation
            if (rotatingConeRef.current && event.button === 0 && Date.now() >= rotationReadyAtRef.current) {
                const apex = rotatingConeRef.current
                // Use the already-snapped preview end position so confirm matches preview exactly
                if (blastPreviewEnd) {
                    const endX = blastPreviewEnd.x
                    const endZ = blastPreviewEnd.z

                    // Check if this is a new cone (from drawer drop) or existing cone (after move)
                    const existingBlast = [...blasts, ...blastsNotInMap].find((b) => b.id === apex.id)
                    if (!existingBlast) {
                        // New cone from template — create it with pixiOnBlastComplete
                        if (pixiOnBlastComplete) {
                            const newBlast: Blast = {
                                id: apex.id,
                                mapId: mapKey,
                                type: 'cone',
                                x: apex.apexX,
                                y: apex.apexZ,
                                x2: endX,
                                y2: endZ,
                                size: apex.lengthInGrids,
                                alpha: 0.7,
                                locked: false,
                            }
                            pixiOnBlastComplete(newBlast)
                        }
                    } else {
                        // Existing cone — update endpoint
                        if (onBlastpixiOnBlastUpdateConepdateCone) {
                            onBlastpixiOnBlastUpdateConepdateCone(apex.id, endX, endZ, apex.apexX, apex.apexZ)
                        }
                    }
                }
                // Restore visibility of the cone mesh after rotation
                const coneGroup = blastMeshesRef.current.get(apex.id)
                if (coneGroup) coneGroup.visible = true
                rotatingConeRef.current = null
                setBlastPreviewStart(null)
                setBlastPreviewEnd(null)
                setDraggedBlastId(null)
                dragBlastStartRef.current = null
                return
            }

            if (draggedTokenId) {
                isStartingNewSegmentRef.current = false
                newSegmentPreviewAddedRef.current = false
                // If player dragged a token in session, broadcast pending movement to DM
                if (isLeftClickDraggingRef.current && session && role === 'player') {
                    const pending = pendingMovementsRef.current.get(draggedTokenId)
                    if (pending) {
                        const points = pending.points.map((p) => ({ x: p.x, y: p.z }))
                        sendAction({
                            kind: 'PENDING_MOVEMENT',
                            tokenId: draggedTokenId,
                            points,
                            mapId: mapKey,
                        })
                        // Also fire local event so other views on the same client (Pixi) render the indicator
                        window.dispatchEvent(
                            new CustomEvent('pendingMovementReceived', {
                                detail: {
                                    tokenId: draggedTokenId,
                                    points,
                                    mapId: mapKey,
                                },
                            })
                        )
                    }
                } else if (isLeftClickDraggingRef.current && !session) {
                    // No session: still keep pending so local accept/cancel works
                    const pending = pendingMovementsRef.current.get(draggedTokenId)
                    if (pending) {
                        const points = pending.points.map((p) => ({ x: p.x, y: p.z }))
                        window.dispatchEvent(
                            new CustomEvent('pendingMovementReceived', {
                                detail: {
                                    tokenId: draggedTokenId,
                                    points,
                                    mapId: mapKey,
                                },
                            })
                        )
                    }
                }

                // Only open token dialog if it wasn't a drag (no movement)
                if (leftClickTokenRef.current && !isLeftClickDraggingRef.current && onOpenTokenDialog) {
                    onOpenTokenDialog(leftClickTokenRef.current.id)
                }
                // Reset left-click tracking
                leftClickTokenRef.current = null
                isLeftClickDraggingRef.current = false
                setDraggedTokenId(null)
                dragStartRef.current = null
            } else {
                // Clear left-click tracking if no drag happened
                leftClickTokenRef.current = null
                isLeftClickDraggingRef.current = false
            }

            // Wall eraser completion
            if (isWallMode && isErasingWalls && eraseStartRef.current) {
                const scene = sceneRef.current
                // Clean up preview line
                if (eraseLineRef.current && scene) {
                    scene.remove(eraseLineRef.current)
                    eraseLineRef.current.geometry.dispose()
                    ;(eraseLineRef.current.material as THREE.Material).dispose()
                    eraseLineRef.current = null
                }
                const end = erasePreviewRef.current
                if (end && pixiOnWallDraw) {
                    const s1 = { x: eraseStartRef.current.x, y: eraseStartRef.current.z }
                    const s2 = { x: end.x, y: end.z }
                    const keep: Wall[] = []
                    for (const w of walls) {
                        const wallShape = w.shape || 'line'
                        let intersects = false
                        if (wallShape === 'line') {
                            intersects = segmentsIntersect(s1, s2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })
                        } else if (wallShape === 'rectangle') {
                            intersects = segmentIntersectsRectangle(s1, s2, w.x1, w.y1, w.x2, w.y2)
                        } else if (wallShape === 'circle') {
                            const dx = w.x2 - w.x1
                            const dy = w.y2 - w.y1
                            const centerX = w.x1 + dx / 2
                            const centerY = w.y1 + dy / 2
                            const radius = Math.min(Math.abs(dx), Math.abs(dy)) / 2
                            intersects = segmentHitsCircleBoundary(s1, s2, centerX, centerY, radius)
                        }
                        if (!intersects) {
                            keep.push(w)
                        }
                    }
                    pixiOnWallDraw(keep, mapKey)
                }
                // Restore all highlighted wall materials
                const wallMeshes = wallMeshesRef.current
                for (const id of highlightedWallIdsRef.current) {
                    const mesh = wallMeshes.get(id)
                    if (mesh) {
                        mesh.traverse((child) => {
                            if (child instanceof THREE.Mesh && child.material) {
                                const m = child.material as THREE.MeshStandardMaterial
                                if (m.emissive && child.userData._origEmissive !== undefined) {
                                    m.emissive.setHex(child.userData._origEmissive)
                                    m.emissiveIntensity = child.userData._origEmissiveIntensity ?? 1.0
                                    delete child.userData._origEmissive
                                    delete child.userData._origEmissiveIntensity
                                }
                            }
                        })
                    }
                }
                highlightedWallIdsRef.current = new Set()

                eraseStartRef.current = null
                erasePreviewRef.current = null
            }

            if (draggedBlastId) {
                // Persist blast position on drag end
                const blast = [...blasts, ...blastsNotInMap].find((b) => b.id === draggedBlastId)
                if (blast && dragBlastStartRef.current && pixiOnBlastMoveProp) {
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect) {
                        const mx = event.clientX - rect.left
                        const my = event.clientY - rect.top
                        const dropPoint = getGroundIntersection(mx, my)
                        if (dropPoint) {
                            const snapped = snapToNinePoints(dropPoint.x, dropPoint.z, gridSize, snapToGrid)
                            pixiOnBlastMoveProp(draggedBlastId, snapped.x, snapped.y)

                            // For cones, enter rotation mode after move
                            if (blast.type === 'cone') {
                                const baseX2 = blast.x2 ?? blast.x
                                const baseZ2 = blast.y2 ?? blast.y
                                const lengthInGrids = Math.max(
                                    0.1,
                                    Math.hypot(baseX2 - blast.x, baseZ2 - blast.y) / gridSize
                                )
                                rotatingConeRef.current = {
                                    id: blast.id,
                                    apexX: snapped.x,
                                    apexZ: snapped.y,
                                    lengthInGrids,
                                    angleRad: Math.atan2(baseZ2 - blast.y, baseX2 - blast.x),
                                }
                                rotationReadyAtRef.current = Date.now() + 180
                                // Hide the actual cone mesh during rotation (prevent ghost)
                                const coneGroup = blastMeshesRef.current.get(blast.id)
                                if (coneGroup) coneGroup.visible = false
                                // Set initial preview so rotation is visible
                                const lenPx = lengthInGrids * gridSize
                                const initAngle = Math.atan2(baseZ2 - blast.y, baseX2 - blast.x)
                                setBlastPreviewStart(new THREE.Vector3(snapped.x, 0, snapped.y))
                                setBlastPreviewEnd(
                                    new THREE.Vector3(
                                        snapped.x + Math.cos(initAngle) * lenPx,
                                        0,
                                        snapped.y + Math.sin(initAngle) * lenPx
                                    )
                                )
                            }
                        }
                    }
                }
                setDraggedBlastId(null)
                dragBlastStartRef.current = null
            } else if (blastDrawMode && blastPreviewStart && blastPreviewEnd) {
                // Complete blast drawing — match Pixi's onBlastComplete logic
                const startX = blastPreviewStart.x
                const startZ = blastPreviewStart.z
                const endX = blastPreviewEnd.x
                const endZ = blastPreviewEnd.z
                const dx = endX - startX
                const dz = endZ - startZ

                if (dx !== 0 || dz !== 0) {
                    const newBlast: Blast = {
                        id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                        mapId: mapKey,
                        type: blastDrawMode,
                        x: 0,
                        y: 0,
                        alpha: 0.7,
                        locked: false,
                    }

                    if (blastDrawMode === 'circle') {
                        const widthInGrids = Math.abs(dx) / gridSize
                        const heightInGrids = Math.abs(dz) / gridSize
                        newBlast.x = startX + dx / 2
                        newBlast.y = startZ + dz / 2
                        newBlast.size = Math.min(widthInGrids, heightInGrids) / 2
                    } else if (blastDrawMode === 'square') {
                        const widthInGrids = Math.abs(dx) / gridSize
                        const heightInGrids = Math.abs(dz) / gridSize
                        newBlast.x = startX + dx / 2
                        newBlast.y = startZ + dz / 2
                        newBlast.size = widthInGrids
                        newBlast.sizeY = heightInGrids
                    } else if (blastDrawMode === 'cone') {
                        const distance = Math.sqrt(dx * dx + dz * dz)
                        const dirX = dx / distance
                        const dirZ = dz / distance
                        const fixedLength = 6 * gridSize
                        newBlast.x = startX
                        newBlast.y = startZ
                        let coneEndX = startX + dirX * fixedLength
                        let coneEndZ = startZ + dirZ * fixedLength
                        if (snapToGrid) {
                            const snappedEnd = snapToNinePoints(coneEndX, coneEndZ, gridSize, true)
                            coneEndX = snappedEnd.x
                            coneEndZ = snappedEnd.y
                        }
                        newBlast.x2 = coneEndX
                        newBlast.y2 = coneEndZ
                        const actualLength = Math.sqrt((coneEndX - startX) ** 2 + (coneEndZ - startZ) ** 2)
                        newBlast.size = actualLength / gridSize
                    }

                    if (pixiOnBlastComplete) {
                        pixiOnBlastComplete(newBlast)
                    }
                }

                setBlastPreviewStart(null)
                setBlastPreviewEnd(null)
            } else if (isWallMode && wallDrawingShape && wallDrawingStart && wallDrawingEnd) {
                // Values are already snapped from mousedown/mousemove — use directly
                const startX = wallDrawingStart.x
                const startZ = wallDrawingStart.z
                const endX = wallDrawingEnd.x
                const endZ = wallDrawingEnd.z

                // Prevent zero-length walls
                if (startX !== endX || startZ !== endZ) {
                    const newWall: Wall = {
                        id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                        mapId: mapKey,
                        x1: startX,
                        y1: startZ,
                        x2: endX,
                        y2: endZ,
                        shape: wallDrawingShape,
                        color: wallColor,
                        alpha: wallAlpha,
                    }

                    if (pixiOnWallDraw) {
                        const updatedWalls = [...walls, newWall]
                        pixiOnWallDraw(updatedWalls, mapKey)
                    }
                }

                setWallDrawingStart(null)
                setWallDrawingEnd(null)
            }
        }

        const container = containerRef.current
        if (container) {
            const handleContextMenu = (e: globalThis.MouseEvent) => e.preventDefault()
            container.addEventListener('mousedown', handleMouseDown)
            container.addEventListener('mousemove', handleMouseMove)
            container.addEventListener('mouseup', handleMouseUp)
            container.addEventListener('contextmenu', handleContextMenu)
            container.addEventListener('wheel', handleShiftWheel, { passive: false })
            container.addEventListener('drop', handleDrop)
            container.addEventListener('dragover', handleDragOver)
        }

        return () => {
            if (container) {
                const handleContextMenuCleanup = (e: globalThis.MouseEvent) => e.preventDefault()
                container.removeEventListener('mousedown', handleMouseDown)
                container.removeEventListener('mousemove', handleMouseMove)
                container.removeEventListener('mouseup', handleMouseUp)
                container.removeEventListener('contextmenu', handleContextMenuCleanup)
                container.removeEventListener('wheel', handleShiftWheel)
                container.removeEventListener('drop', handleDrop)
                container.removeEventListener('dragover', handleDragOver)
            }
        }
    }, [
        isMeasuring,
        measureStart,
        measureEnd,
        blastDrawMode,
        blastPreviewStart,
        blastPreviewEnd,
        isWallMode,
        wallDrawingShape,
        wallDrawingStart,
        wallDrawingEnd,
        width,
        height,
        gridSize,
        snapToGrid,
        tokens,
        walls,
        mapKey,
        wallColor,
        wallAlpha,
        draggedTokenId,
        draggedBlastId,
        pixiOnTokenMove,
        pixiOnTokenUpdate,
        pixiOnTokenDrop,
        pixiOnBlastDrop,
        pixiOnBlastMoveProp,
        pixiOnWallDraw,
        onBlastpixiOnBlastUpdateConepdateCone,
        blasts,
        blastsNotInMap,
        pixiSetSelectedTokenId,
        pixiSetSelectedBlastId,
        onOpenTokenDialog,
        contextMenus,
    ])

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

export default ThreeBoard
