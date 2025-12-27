import * as THREE from 'three'
import { useEffect, useRef } from 'react'

// Type removed - not used

/**
 * Measuring tool component for 3D board
 */
export function useMeasureTool(
    start: THREE.Vector3 | null,
    end: THREE.Vector3 | null,
    scene: THREE.Scene | null,
    gridSize: number
) {
    const measureLineRef = useRef<THREE.Line | null>(null)
    const measureLabelRef = useRef<THREE.Object3D | null>(null)

    useEffect(() => {
        if (!scene) return

        // Remove existing measure line
        if (measureLineRef.current) {
            scene.remove(measureLineRef.current)
            measureLineRef.current.geometry.dispose()
            if (measureLineRef.current.material instanceof THREE.LineBasicMaterial) {
                measureLineRef.current.material.dispose()
            }
            measureLineRef.current = null
        }

        if (measureLabelRef.current) {
            scene.remove(measureLabelRef.current)
            measureLabelRef.current = null
        }

        // Create new measure line if both points exist
        if (start && end) {
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                linewidth: 2,
                transparent: true,
                opacity: 0.8,
            })
            const line = new THREE.Line(geometry, material)
            scene.add(line)
            measureLineRef.current = line

            // Calculate distance
            const distance = start.distanceTo(end)
            const gridDistance = distance / gridSize

            // Create distance label (using a simple sprite or HTML overlay)
            // For now, we'll use a simple approach with a plane texture
            // In a full implementation, you'd use CSS2DRenderer
            const labelGeometry = new THREE.PlaneGeometry(1, 0.3)
            const canvas = document.createElement('canvas')
            canvas.width = 256
            canvas.height = 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = '#00ffff'
                ctx.font = 'bold 24px Orbitron'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${gridDistance.toFixed(1)}m`, canvas.width / 2, canvas.height / 2)
            }
            const texture = new THREE.CanvasTexture(canvas)
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
            })
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
            
            // Position label at midpoint
            const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
            midpoint.y += 0.5
            labelMesh.position.copy(midpoint)
            
            // Make label face camera (billboard effect)
            labelMesh.lookAt(midpoint.clone().add(new THREE.Vector3(0, 1, 0)))
            
            scene.add(labelMesh)
            measureLabelRef.current = labelMesh
        }

        return () => {
            if (measureLineRef.current && scene) {
                scene.remove(measureLineRef.current)
                measureLineRef.current.geometry.dispose()
                if (measureLineRef.current.material instanceof THREE.LineBasicMaterial) {
                    measureLineRef.current.material.dispose()
                }
            }
            if (measureLabelRef.current && scene) {
                scene.remove(measureLabelRef.current)
                if (measureLabelRef.current instanceof THREE.Mesh) {
                    measureLabelRef.current.geometry.dispose()
                    if (measureLabelRef.current.material instanceof THREE.MeshBasicMaterial) {
                        measureLabelRef.current.material.map?.dispose()
                        measureLabelRef.current.material.dispose()
                    }
                }
            }
        }
    }, [start, end, scene, gridSize])
}

