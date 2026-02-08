import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { useEffect, useRef } from 'react'
import type { Token } from '../utils/types'

/**
 * 3D Label component for tokens using CSS2DRenderer
 */
export function createTokenLabel(
    token: Token,
    position: THREE.Vector3,
    active: boolean = false
): THREE.Object3D {
    const div = document.createElement('div')
    div.className = 'token-label-3d'
    div.textContent = token.name
    div.style.pointerEvents = 'none'
    div.style.userSelect = 'none'
    div.style.color = active ? '#ffff00' : '#ffffff'
    div.style.fontSize = '14px'
    div.style.fontWeight = 'bold'
    div.style.textShadow = '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
    div.style.fontFamily = '"Orbitron", monospace'
    div.style.textAlign = 'center'
    div.style.whiteSpace = 'nowrap'
    div.style.transform = 'translate(-50%, -100%)'
    div.style.marginTop = '-8px'

    const label = new CSS2DObject(div)
    label.position.copy(position)
    label.position.y += 0.5 // Offset above token

    return label
}

/**
 * Hook to setup CSS2DRenderer for labels
 */
export function useCSS2DRenderer(
    containerRef: React.RefObject<HTMLDivElement | null>,
    scene: THREE.Scene | null,
    camera: THREE.Camera | null,
    width: number,
    height: number
) {
    const labelRendererRef = useRef<CSS2DRenderer | null>(null)
    const labelSceneRef = useRef<THREE.Scene | null>(null)

    useEffect(() => {
        if (!containerRef.current || !scene || !camera) return

        // Create CSS2D renderer
        const labelRenderer = new CSS2DRenderer()
        labelRenderer.setSize(width, height)
        labelRenderer.domElement.style.position = 'absolute'
        labelRenderer.domElement.style.top = '0'
        labelRenderer.domElement.style.pointerEvents = 'none'
        labelRenderer.domElement.style.zIndex = '10'
        containerRef.current.appendChild(labelRenderer.domElement)

        labelRendererRef.current = labelRenderer
        labelSceneRef.current = scene

        // Update renderer size when dimensions change
        const updateSize = () => {
            if (labelRendererRef.current && camera) {
                labelRendererRef.current.setSize(width, height)
            }
        }
        updateSize()

        return () => {
            if (labelRendererRef.current && containerRef.current) {
                containerRef.current.removeChild(labelRendererRef.current.domElement)
                labelRendererRef.current = null
            }
        }
    }, [containerRef, scene, camera, width, height])

    // Render labels
    useEffect(() => {
        if (!labelRendererRef.current || !camera || !labelSceneRef.current) return

        const render = () => {
            if (labelRendererRef.current && camera && labelSceneRef.current) {
                labelRendererRef.current.render(labelSceneRef.current, camera)
            }
        }

        // Render on each frame
        const interval = setInterval(render, 16) // ~60fps

        return () => clearInterval(interval)
    }, [camera])

    return labelRendererRef
}
