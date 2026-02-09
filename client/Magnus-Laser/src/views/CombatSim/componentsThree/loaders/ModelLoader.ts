import * as THREE from 'three'
import { TextureLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// Asset cache
const modelCache = new Map<string, THREE.Group>()
const animationClipsCache = new Map<string, THREE.AnimationClip[]>()
const textureCache = new Map<string, THREE.Texture>()

// Loaders
const gltfLoader = new GLTFLoader()
const textureLoader = new TextureLoader()

export interface LoadProgress {
    loaded: number
    total: number
    percentage: number
}

export type ProgressCallback = (progress: LoadProgress) => void

/**
 * Load a GLTF/GLB model
 */
export async function loadModel(path: string, onProgress?: ProgressCallback): Promise<THREE.Group> {
    // Check cache first
    const cached = modelCache.get(path)
    if (cached) {
        return skeletonClone(cached) as THREE.Group
    }

    return new Promise((resolve, reject) => {
        gltfLoader.load(
            path,
            (gltf) => {
                const model = gltf.scene
                // Cache the original
                modelCache.set(path, model)
                // Cache animation clips if present
                if (gltf.animations && gltf.animations.length > 0) {
                    animationClipsCache.set(path, gltf.animations)
                }
                // Return a clone for use (skeletonClone preserves SkinnedMesh bone refs)
                resolve(skeletonClone(model) as THREE.Group)
            },
            (progress) => {
                if (onProgress && progress.total > 0) {
                    onProgress({
                        loaded: progress.loaded,
                        total: progress.total,
                        percentage: (progress.loaded / progress.total) * 100,
                    })
                }
            },
            (error) => {
                console.error(`Failed to load model: ${path}`, error)
                reject(error)
            }
        )
    })
}

/**
 * Load a texture
 */
export async function loadTexture(path: string): Promise<THREE.Texture> {
    // Check cache first
    const cached = textureCache.get(path)
    if (cached) {
        return cached.clone()
    }

    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                textureCache.set(path, texture)
                resolve(texture.clone())
            },
            undefined,
            (error) => {
                console.error(`Failed to load texture: ${path}`, error)
                reject(error)
            }
        )
    })
}

/**
 * Preload multiple models
 */
export async function preloadModels(paths: string[], onProgress?: ProgressCallback): Promise<THREE.Group[]> {
    const total = paths.length
    let loaded = 0

    const models = await Promise.all(
        paths.map(async (path) => {
            const model = await loadModel(path, (progress) => {
                if (onProgress) {
                    // Calculate overall progress
                    const overallProgress = (loaded + progress.percentage / 100) / total
                    onProgress({
                        loaded: Math.floor(overallProgress * total),
                        total,
                        percentage: overallProgress * 100,
                    })
                }
            })
            loaded++
            return model
        })
    )

    return models
}

/**
 * Get animation clips for a model path
 */
export function getAnimationClips(path: string): THREE.AnimationClip[] {
    return animationClipsCache.get(path) ?? []
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
    // Dispose models
    for (const model of modelCache.values()) {
        model.traverse((child) => {
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
    modelCache.clear()
    animationClipsCache.clear()

    // Dispose textures
    for (const texture of textureCache.values()) {
        texture.dispose()
    }
    textureCache.clear()
}

/**
 * Create a simple procedural token model as fallback
 */
export function createFallbackTokenModel(color: number, radius: number, height: number): THREE.Group {
    const group = new THREE.Group()

    // Base/platform - positioned so bottom is at Y=0
    const baseHeight = height * 0.1
    const baseGeometry = new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, baseHeight, 16)
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2,
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    // CylinderGeometry centers by default, so position at half height to put bottom at Y=0
    base.position.y = baseHeight / 2
    group.add(base)

    // Main token body - starts above the base
    const bodyGeometry = new THREE.CylinderGeometry(radius, radius, height, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.5,
        roughness: 0.5,
        emissive: new THREE.Color(color).multiplyScalar(0.2),
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    // Body starts at baseHeight (top of base) and extends upward
    body.position.y = baseHeight + height / 2
    group.add(body)

    // Neon edge ring - at the top of the body
    const ringGeometry = new THREE.TorusGeometry(radius * 1.05, radius * 0.05, 8, 16)
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: new THREE.Color(color).multiplyScalar(0.8),
        transparent: true,
        opacity: 0.7,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    // Ring at the top of the body
    ring.position.y = baseHeight + height
    ring.rotation.x = Math.PI / 2
    group.add(ring)

    return group
}

/**
 * Create a simple procedural blast model as fallback
 */
export function createFallbackBlastModel(
    type: 'grenade' | 'circle' | 'square' | 'cone',
    size: number,
    color: number = 0xff0000
): THREE.Group {
    const group = new THREE.Group()

    switch (type) {
        case 'grenade':
        case 'circle': {
            const geometry = new THREE.SphereGeometry(size, 16, 16)
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: new THREE.Color(color).multiplyScalar(0.5),
                transparent: true,
                opacity: 0.7,
            })
            const mesh = new THREE.Mesh(geometry, material)
            group.add(mesh)
            break
        }
        case 'square': {
            // size represents the width/depth in world units
            // In PixiBoard: width = gridSize * blast.size, height = gridSize * (blast.sizeY || blast.size)
            // For fallback, we use size for both width and depth (square), height is 0.4 * size (double the previous 0.2)
            // BoxGeometry centers by default, so we keep it centered at origin (Y=0)
            // This way half is above and half is below, matching circles
            const height = size * 0.4 // Double the height (was 0.2)
            const geometry = new THREE.BoxGeometry(size, height, size)
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: new THREE.Color(color).multiplyScalar(0.5),
                transparent: true,
                opacity: 0.7,
            })
            const mesh = new THREE.Mesh(geometry, material)
            // BoxGeometry centers at origin by default, so mesh is already centered at Y=0
            // No position adjustment needed - half above, half below
            group.add(mesh)
            break
        }
        case 'cone': {
            // Cone with 28° angle (same as PixiBoard)
            // For a cone with apex angle of 28°, half-angle is 14°
            // baseWidth = length * tan(14°) * 2 ≈ length * 0.499
            // We'll create a cone with height = length and radius = length * tan(14°)
            const halfAngleRad = (14 * Math.PI) / 180 // 14 degrees in radians
            const baseRadius = size * Math.tan(halfAngleRad) // radius = length * tan(14°)
            // openEnded = false means include base cap
            const geometry = new THREE.ConeGeometry(baseRadius, size, 8, 1, false)
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: new THREE.Color(color).multiplyScalar(0.5),
                transparent: true,
                opacity: 0.7,
            })
            const mesh = new THREE.Mesh(geometry, material)
            // Cone geometry: apex at top (y=size/2), base at bottom (y=-size/2)
            // Rotate -90° around X axis so cone points along +Z axis (forward, like +X in PixiBoard)
            mesh.rotation.x = -Math.PI / 2
            // After rotation: apex is at (0, size/2, 0), base is at (0, -size/2, 0)
            // We want apex at origin (0,0,0) in local coordinates
            // So we move it: apex was at y=size/2, now at z=size/2 after rotation
            // Move back by size/2 along Z to put apex at origin
            mesh.position.z = -size / 2
            group.add(mesh)
            break
        }
    }

    return group
}
