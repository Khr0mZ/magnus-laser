import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { WallShape } from '../utils/types'
import { createCyberpunkWallMaterial } from './materials/cyberpunkMaterials'

function createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#00ffff'
    ctx.font = 'bold 24px Orbitron, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(gridLabelScale, gridLabelScale * 0.25, 1)
    return sprite
}

// Scale for the label sprite (set once, referenced by createLabelSprite)
const gridLabelScale = 40

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
    const labelSpriteRef = useRef<THREE.Sprite | null>(null)

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

        // Remove existing label
        if (labelSpriteRef.current) {
            scene.remove(labelSpriteRef.current)
            if (labelSpriteRef.current.material instanceof THREE.SpriteMaterial) {
                labelSpriteRef.current.material.map?.dispose()
                labelSpriteRef.current.material.dispose()
            }
            labelSpriteRef.current = null
        }

        if (!previewStart || !previewEnd) {
            return
        }

        // Values are already snapped by the parent (ThreeBoard mousedown/mousemove)
        const startX = previewStart.x
        const startZ = previewStart.z
        const endX = previewEnd.x
        const endZ = previewEnd.z

        let previewMesh: THREE.Mesh | null = null
        const material = createCyberpunkWallMaterial(wallColor, wallAlpha)
        material.opacity = wallAlpha * 0.6 // Make preview semi-transparent
        material.transparent = true

        let labelText = ''
        let labelX = endX
        let labelZ = endZ

        const dx = endX - startX
        const dz = endZ - startZ

        switch (wallShape) {
            case 'line': {
                const length = Math.sqrt(dx * dx + dz * dz)
                const angle = Math.atan2(dz, dx)

                const geometry = new THREE.BoxGeometry(length, 10, 2)
                previewMesh = new THREE.Mesh(geometry, material)
                previewMesh.position.set(startX + dx / 2, 5, startZ + dz / 2)
                previewMesh.rotation.y = -angle

                const gridLength = snapToGrid
                    ? Math.round(length / gridSize)
                    : (length / gridSize).toFixed(2)
                labelText = `${gridLength}`
                break
            }

            case 'rectangle': {
                const width = Math.abs(dx)
                const height = Math.abs(dz)
                const centerX = startX + dx / 2
                const centerZ = startZ + dz / 2

                const geometry = new THREE.BoxGeometry(width, 10, height)
                previewMesh = new THREE.Mesh(geometry, material)
                previewMesh.position.set(centerX, 5, centerZ)

                const gridW = snapToGrid ? Math.round(width / gridSize) : (width / gridSize).toFixed(1)
                const gridH = snapToGrid ? Math.round(height / gridSize) : (height / gridSize).toFixed(1)
                labelText = `${gridW}x${gridH}`
                labelX = centerX
                labelZ = centerZ
                break
            }

            case 'circle': {
                const radius = Math.min(Math.abs(dx), Math.abs(dz)) / 2

                if (radius > 0) {
                    const centerX = startX + dx / 2
                    const centerZ = startZ + dz / 2
                    const geometry = new THREE.CylinderGeometry(radius, radius, 10, 32)
                    previewMesh = new THREE.Mesh(geometry, material)
                    previewMesh.position.set(centerX, 5, centerZ)

                    const gridRadius = snapToGrid
                        ? Math.round(radius / gridSize)
                        : (radius / gridSize).toFixed(1)
                    labelText = `r=${gridRadius}`
                    labelX = centerX
                    labelZ = centerZ - radius
                }
                break
            }
        }

        if (previewMesh) {
            scene.add(previewMesh)
            previewMeshRef.current = previewMesh
        }

        if (labelText) {
            const sprite = createLabelSprite(labelText)
            sprite.position.set(labelX, 15, labelZ)
            scene.add(sprite)
            labelSpriteRef.current = sprite
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
            if (labelSpriteRef.current && scene) {
                scene.remove(labelSpriteRef.current)
                if (labelSpriteRef.current.material instanceof THREE.SpriteMaterial) {
                    labelSpriteRef.current.material.map?.dispose()
                    labelSpriteRef.current.material.dispose()
                }
                labelSpriteRef.current = null
            }
        }
    }, [isWallMode, wallShape, previewStart, previewEnd, scene, gridSize, wallColor, wallAlpha, snapToGrid])
}
