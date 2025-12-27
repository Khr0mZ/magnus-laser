import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import type { Token } from '../utils/types'
import { createPendingTokenMaterial } from './materials/cyberpunkMaterials'
import { createFallbackTokenModel } from './loaders/ModelLoader'

type PendingMovement = {
    tokenId: string
    startX: number
    startY: number
    endX: number
    endY: number
    points: { x: number; y: number }[]
}

// Type removed - not used

/**
 * Render pending movement indicators (ghost tokens)
 */
export function usePendingMovements(
    pendingMovements: Map<string, PendingMovement>,
    tokens: Token[],
    scene: THREE.Scene | null,
    gridSize: number
) {
    const pendingMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
    const pathLinesRef = useRef<Map<string, THREE.Line>>(new Map())

    useEffect(() => {
        if (!scene) return

        // Remove pending movements that no longer exist
        for (const [id, group] of pendingMeshesRef.current.entries()) {
            if (!pendingMovements.has(id)) {
                scene.remove(group)
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
                pendingMeshesRef.current.delete(id)
            }
        }

        // Remove path lines that no longer exist
        for (const [id, line] of pathLinesRef.current.entries()) {
            if (!pendingMovements.has(id)) {
                scene.remove(line)
                line.geometry.dispose()
                if (line.material instanceof THREE.LineBasicMaterial) {
                    line.material.dispose()
                }
                pathLinesRef.current.delete(id)
            }
        }

        // Add/update pending movements
        pendingMovements.forEach((pending, tokenId) => {
            const token = tokens.find((t) => t.id === tokenId)
            if (!token) return

            const radius = token.customRadius ?? gridSize / 2
            const height = radius * 2

            // Create or update ghost token at start position
            if (pendingMeshesRef.current.has(tokenId)) {
                const ghostGroup = pendingMeshesRef.current.get(tokenId)!
                ghostGroup.position.set(pending.startX, height / 2, pending.startY)
            } else {
                const ghostGroup = createFallbackTokenModel(token.color, radius, height)
                // Scale the fallback model to be smaller (0.8x0.8x0.8)
                ghostGroup.scale.set(0.8, 0.8, 0.8)
                ghostGroup.position.set(pending.startX, height / 2, pending.startY)

                // Apply pending material (semi-transparent)
                ghostGroup.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = createPendingTokenMaterial(token.color)
                        child.castShadow = false
                        child.receiveShadow = false
                    }
                })

                scene.add(ghostGroup)
                pendingMeshesRef.current.set(tokenId, ghostGroup)
            }

            // Create or update path line
            if (pending.points.length > 1) {
                const points = pending.points.map((p) => new THREE.Vector3(p.x, 0.1, p.y))
                const geometry = new THREE.BufferGeometry().setFromPoints(points)
                const material = new THREE.LineBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 2,
                })

                if (pathLinesRef.current.has(tokenId)) {
                    const line = pathLinesRef.current.get(tokenId)!
                    line.geometry.dispose()
                    line.geometry = geometry
                } else {
                    const line = new THREE.Line(geometry, material)
                    scene.add(line)
                    pathLinesRef.current.set(tokenId, line)
                }
            }
        })

        return () => {
            // Cleanup on unmount
            for (const group of pendingMeshesRef.current.values()) {
                scene.remove(group)
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
            for (const line of pathLinesRef.current.values()) {
                scene.remove(line)
                line.geometry.dispose()
                if (line.material instanceof THREE.LineBasicMaterial) {
                    line.material.dispose()
                }
            }
        }
    }, [pendingMovements, tokens, scene, gridSize])
}

