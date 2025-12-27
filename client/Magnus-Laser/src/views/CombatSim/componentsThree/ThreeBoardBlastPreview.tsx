import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { BlastType } from '../utils/types'
import { createFallbackBlastModel } from './loaders/ModelLoader'
import { createCyberpunkBlastMaterial } from './materials/cyberpunkMaterials'

export function useBlastPreview(
    blastDrawMode: BlastType | null,
    previewStart: THREE.Vector3 | null,
    previewEnd: THREE.Vector3 | null,
    scene: THREE.Scene | null,
    gridSize: number,
    snapToGrid: boolean,
    blastTextures?: Partial<Record<BlastType, THREE.Texture>>
) {
    const previewMeshRef = useRef<THREE.Group | null>(null)
    const previewLabelRef = useRef<THREE.Object3D | null>(null)

    useEffect(() => {
        if (!scene) return

        // Remove existing preview
        if (previewMeshRef.current) {
            scene.remove(previewMeshRef.current)
            previewMeshRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose()
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose()
                    }
                }
            })
            previewMeshRef.current = null
        }

        if (previewLabelRef.current) {
            scene.remove(previewLabelRef.current)
            previewLabelRef.current = null
        }

        if (!blastDrawMode || !previewStart || !previewEnd) {
            return
        }

        // Don't show preview for grenade (instant placement)
        if (blastDrawMode === 'grenade') {
            return
        }

        const startX = previewStart.x
        const startZ = previewStart.z
        const endX = previewEnd.x
        const endZ = previewEnd.z

        // Apply grid snapping if enabled
        let snappedEndX = endX
        let snappedEndZ = endZ
        if (snapToGrid) {
            snappedEndX = Math.round(endX / gridSize) * gridSize
            snappedEndZ = Math.round(endZ / gridSize) * gridSize
        }

        let previewMesh: THREE.Group | null = null
        let sizeText = ''
        let labelPosition = new THREE.Vector3()

        switch (blastDrawMode) {
            case 'circle': {
                const dx = snappedEndX - startX
                const dz = snappedEndZ - startZ
                const centerX = startX + dx / 2
                const centerZ = startZ + dz / 2
                const width = Math.abs(dx)
                const height = Math.abs(dz)
                const radius = Math.min(width, height) / 2

                previewMesh = createFallbackBlastModel('circle', radius * 2, radius * 2)
                previewMesh.position.set(centerX, 0.1, centerZ)

                // Make preview semi-transparent
                const circleTexture = blastTextures?.circle
                previewMesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const material = createCyberpunkBlastMaterial(0.5, circleTexture)
                        child.material = material
                    }
                })

                const radiusInGrids = (radius / gridSize).toFixed(1)
                sizeText = `r=${radiusInGrids}`
                labelPosition.set(centerX, radius + 0.5, centerZ)
                break
            }

            case 'square': {
                const dx = snappedEndX - startX
                const dz = snappedEndZ - startZ
                const centerX = startX + dx / 2
                const centerZ = startZ + dz / 2
                const width = Math.abs(dx)
                const height = Math.abs(dz)

                previewMesh = createFallbackBlastModel('square', width, height)
                previewMesh.position.set(centerX, 0.1, centerZ)

                // Make preview semi-transparent
                const squareTexture = blastTextures?.square
                previewMesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const material = createCyberpunkBlastMaterial(0.5, squareTexture)
                        child.material = material
                    }
                })

                const widthInGrids = (width / gridSize).toFixed(1)
                const heightInGrids = (height / gridSize).toFixed(1)
                sizeText = `${widthInGrids}x${heightInGrids}`
                labelPosition.set(centerX, Math.max(width, height) / 2 + 0.5, centerZ)
                break
            }

            case 'cone': {
                // Calculate cone direction and fixed length
                const dx = snappedEndX - startX
                const dz = snappedEndZ - startZ
                const distance = Math.sqrt(dx * dx + dz * dz)
                const directionX = distance > 0 ? dx / distance : 1
                const directionZ = distance > 0 ? dz / distance : 0
                const fixedLength = 6 * gridSize

                let previewEndX = startX + directionX * fixedLength
                let previewEndZ = startZ + directionZ * fixedLength

                // Snap endpoint to grid if enabled
                if (snapToGrid) {
                    previewEndX = Math.round(previewEndX / gridSize) * gridSize
                    previewEndZ = Math.round(previewEndZ / gridSize) * gridSize
                }

                const actualLength = Math.sqrt(
                    (previewEndX - startX) ** 2 + (previewEndZ - startZ) ** 2
                )

                previewMesh = createFallbackBlastModel('cone', actualLength, actualLength)
                previewMesh.position.set(startX, 0.1, startZ)

                // Rotate cone to face direction
                const angle = Math.atan2(directionZ, directionX)
                previewMesh.rotation.y = angle

                // Make preview semi-transparent
                let coneTexture = blastTextures?.cone
                // Adjust cone texture to cover the entire cone surface
                if (coneTexture) {
                    coneTexture = coneTexture.clone()
                    coneTexture.rotation = -Math.PI / 2 // -90 degrees in radians
                    
                    // Calculate base radius (cone has 28° angle, so half-angle is 14°)
                    const halfAngleRad = (14 * Math.PI) / 180
                    const baseRadius = actualLength * Math.tan(halfAngleRad)
                    const baseCircumference = 2 * Math.PI * baseRadius
                    
                    // Adjust repeat to fit the cone surface properly
                    const baseTextureScale = 100 // Base scale: 1 unit = 100 pixels
                    const repeatU = baseCircumference / baseTextureScale // Horizontal repeat (around circumference)
                    const repeatV = actualLength / baseTextureScale // Vertical repeat (along cone length)
                    
                    coneTexture.wrapS = THREE.RepeatWrapping
                    coneTexture.wrapT = THREE.RepeatWrapping
                    coneTexture.repeat.set(repeatU, repeatV)
                }
                previewMesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const material = createCyberpunkBlastMaterial(0.5, coneTexture)
                        child.material = material
                    }
                })

                const lengthInGrids = (actualLength / gridSize).toFixed(1)
                sizeText = `L=${lengthInGrids} (30ft)`
                labelPosition.set((startX + previewEndX) / 2, actualLength / 2 + 0.5, (startZ + previewEndZ) / 2)
                break
            }
        }

        if (previewMesh) {
            scene.add(previewMesh)
            previewMeshRef.current = previewMesh

            // Create label using CSS2DObject directly
            if (sizeText) {
                const labelDiv = document.createElement('div')
                labelDiv.className = 'three-board-label'
                labelDiv.textContent = sizeText
                labelDiv.style.color = '#00ffff'
                labelDiv.style.fontSize = '14px'
                labelDiv.style.fontWeight = 'bold'
                labelDiv.style.pointerEvents = 'none'
                labelDiv.style.userSelect = 'none'
                labelDiv.style.textShadow = '0 0 4px rgba(0,0,0,0.8)'
                
                const label = new CSS2DObject(labelDiv)
                label.position.copy(labelPosition)
                scene.add(label)
                previewLabelRef.current = label
            }
        }

        return () => {
            if (previewMeshRef.current && scene) {
                scene.remove(previewMeshRef.current)
                previewMeshRef.current.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose()
                        if (child.material instanceof THREE.Material) {
                            child.material.dispose()
                        }
                    }
                })
                previewMeshRef.current = null
            }
            if (previewLabelRef.current && scene) {
                scene.remove(previewLabelRef.current)
                previewLabelRef.current = null
            }
        }
    }, [blastDrawMode, previewStart, previewEnd, scene, gridSize, snapToGrid, blastTextures])
}
