import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type CameraPreset = 'top-down' | 'isometric' | 'front' | 'side' | 'custom'

export interface CameraPresetConfig {
    position: THREE.Vector3
    target: THREE.Vector3
    name: string
}

export function applyCameraPreset(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    preset: CameraPreset,
    mapSize: { width: number; height: number }
): void {
    const maxDim = Math.max(mapSize.width, mapSize.height)
    const center = new THREE.Vector3(0, 0, 0)

    switch (preset) {
        case 'top-down':
            camera.position.set(0, maxDim * 1.2, 0)
            controls.target.copy(center)
            break

        case 'isometric':
            camera.position.set(maxDim * 0.7, maxDim * 0.7, maxDim * 0.7)
            controls.target.copy(center)
            break

        case 'front':
            camera.position.set(0, maxDim * 0.5, maxDim * 1.2)
            controls.target.copy(center)
            break

        case 'side':
            camera.position.set(maxDim * 1.2, maxDim * 0.5, 0)
            controls.target.copy(center)
            break

        case 'custom':
            // Keep current position
            break
    }

    controls.update()
}

export function getCameraPresetConfig(
    preset: CameraPreset,
    mapSize: { width: number; height: number }
): CameraPresetConfig {
    const maxDim = Math.max(mapSize.width, mapSize.height)
    const center = new THREE.Vector3(0, 0, 0)

    switch (preset) {
        case 'top-down':
            return {
                position: new THREE.Vector3(0, maxDim * 1.2, 0),
                target: center,
                name: 'Top Down',
            }

        case 'isometric':
            return {
                position: new THREE.Vector3(maxDim * 0.7, maxDim * 0.7, maxDim * 0.7),
                target: center,
                name: 'Isometric',
            }

        case 'front':
            return {
                position: new THREE.Vector3(0, maxDim * 0.5, maxDim * 1.2),
                target: center,
                name: 'Front',
            }

        case 'side':
            return {
                position: new THREE.Vector3(maxDim * 1.2, maxDim * 0.5, 0),
                target: center,
                name: 'Side',
            }

        case 'custom':
            return {
                position: new THREE.Vector3(0, 0, 0),
                target: center,
                name: 'Custom',
            }
    }
}
