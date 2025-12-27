import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { WallShape } from '../utils/types'
import { createCyberpunkWallMaterial } from './materials/cyberpunkMaterials'

export function useWallPreview(
    isWallMode: boolean,
    wallShape: WallShape | undefined,
    previewStart: THREE.Vector3 | null,
    previewEnd: THREE.Vector3 | null,
    scene: THREE.Scene | null,
    gridSize: number,
    wallColor: number,
    wallAlpha: number,
    snapToGrid: boolean
) {
    const previewMeshRef = useRef<THREE.Mesh | null>(null)

    useEffect(() => {
        if (!scene || !isWallMode || !wallShape) return

        // Remove existing preview
        if (previewMeshRef.current) {
            scene.remove(previewMeshRef.current)
            previewMeshRef.current.geometry.dispose()
            if (previewMeshRef.current.material instanceof THREE.Material) {
                previewMeshRef.current.material.dispose()
            }
            previewMeshRef.current = null
        }

        if (!previewStart || !previewEnd) {
            return
        }

        const startX = previewStart.x
        const startZ = previewStart.z
        let endX = previewEnd.x
        let endZ = previewEnd.z

        // Apply grid snapping if enabled
        if (snapToGrid) {
            endX = Math.round(endX / gridSize) * gridSize
            endZ = Math.round(endZ / gridSize) * gridSize
        }

        let previewMesh: THREE.Mesh | null = null
        const material = createCyberpunkWallMaterial(wallColor, wallAlpha)
        material.opacity = wallAlpha * 0.6 // Make preview semi-transparent
        material.transparent = true

        switch (wallShape) {
            case 'line': {
                const dx = endX - startX
                const dz = endZ - startZ
                const length = Math.sqrt(dx * dx + dz * dz)
                const angle = Math.atan2(dz, dx)

                const geometry = new THREE.BoxGeometry(length, 10, 2)
                previewMesh = new THREE.Mesh(geometry, material)
                previewMesh.position.set(startX + dx / 2, 5, startZ + dz / 2)
                previewMesh.rotation.y = angle
                break
            }

            case 'rectangle': {
                const dx = endX - startX
                const dz = endZ - startZ
                const width = Math.abs(dx)
                const height = Math.abs(dz)
                const centerX = startX + dx / 2
                const centerZ = startZ + dz / 2

                const geometry = new THREE.BoxGeometry(width, 10, height)
                previewMesh = new THREE.Mesh(geometry, material)
                previewMesh.position.set(centerX, 5, centerZ)
                break
            }

            case 'circle': {
                const dx = endX - startX
                const dz = endZ - startZ
                const radius = Math.sqrt(dx * dx + dz * dz)

                const geometry = new THREE.CylinderGeometry(radius, radius, 10, 32)
                previewMesh = new THREE.Mesh(geometry, material)
                previewMesh.position.set(startX, 5, startZ)
                break
            }
        }

        if (previewMesh) {
            scene.add(previewMesh)
            previewMeshRef.current = previewMesh
        }

        return () => {
            if (previewMeshRef.current && scene) {
                scene.remove(previewMeshRef.current)
                previewMeshRef.current.geometry.dispose()
                if (previewMeshRef.current.material instanceof THREE.Material) {
                    previewMeshRef.current.material.dispose()
                }
                previewMeshRef.current = null
            }
        }
    }, [isWallMode, wallShape, previewStart, previewEnd, scene, gridSize, wallColor, wallAlpha, snapToGrid])
}
