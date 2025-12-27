import * as THREE from 'three'
import type { Token } from '../../utils/types'

/**
 * Raycasting utilities for 3D interaction
 */

export interface RaycastResult {
    object: THREE.Object3D
    point: THREE.Vector3
    distance: number
}

/**
 * Perform raycast from camera through mouse position
 */
export function raycastFromMouse(
    mouse: { x: number; y: number },
    camera: THREE.Camera,
    scene: THREE.Scene,
    width: number,
    height: number
): RaycastResult | null {
    const raycaster = new THREE.Raycaster()

    // Convert mouse position to normalized device coordinates (-1 to +1)
    const mouseVector = new THREE.Vector2()
    mouseVector.x = (mouse.x / width) * 2 - 1
    mouseVector.y = -(mouse.y / height) * 2 + 1

    raycaster.setFromCamera(mouseVector, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
        const intersect = intersects[0]
        return {
            object: intersect.object,
            point: intersect.point,
            distance: intersect.distance,
        }
    }

    return null
}

/**
 * Convert world coordinates to grid coordinates
 */
export function worldToGrid(worldX: number, worldZ: number, gridSize: number): { x: number; y: number } {
    return {
        x: Math.round(worldX / gridSize) * gridSize,
        y: Math.round(worldZ / gridSize) * gridSize,
    }
}

/**
 * Convert grid coordinates to world coordinates
 */
export function gridToWorld(gridX: number, gridY: number, gridSize: number): { x: number; z: number } {
    return {
        x: gridX * gridSize,
        z: gridY * gridSize,
    }
}

/**
 * Snap point to grid
 */
export function snapToGrid(point: THREE.Vector3, gridSize: number, snapEnabled: boolean): THREE.Vector3 {
    if (!snapEnabled) {
        return point
    }

    return new THREE.Vector3(
        Math.round(point.x / gridSize) * gridSize,
        point.y,
        Math.round(point.z / gridSize) * gridSize
    )
}

/**
 * Calculate distance between two 3D points
 */
export function calculateDistance3D(p1: THREE.Vector3, p2: THREE.Vector3): number {
    return p1.distanceTo(p2)
}

/**
 * Find token at world position
 */
export function findTokenAtPosition(tokens: Token[], position: THREE.Vector3, gridSize: number): Token | null {
    const threshold = gridSize / 2

    for (const token of tokens) {
        const tokenPos = new THREE.Vector3(token.x, 0, token.y)
        const distance = position.distanceTo(tokenPos)

        if (distance < threshold) {
            return token
        }
    }

    return null
}
