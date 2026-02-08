import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { Token } from '../utils/types'
import { createFallbackTokenModel } from './loaders/ModelLoader'
import { createCyberpunkTokenMaterial } from './materials/cyberpunkMaterials'

export interface ThreePendingIndicatorProps {
    id: string
    startX: number
    startZ: number
    endX: number
    endZ: number
    points: { x: number; z: number }[]
    gridSize: number
    isCombatActive: boolean
    token: Token | undefined
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    onAccept: () => void
    onCancel: () => void
    isPlayerConnected?: boolean
    isPreview?: boolean
    fromRemotePlayer?: boolean
    endModelTemplate?: THREE.Group
}

/**
 * Three.js-based pending movement indicator helper.
 * Creates line, markers, distance label and accept/cancel buttons.
 * Returns a cleanup function to remove/dispose all artifacts.
 */
export function createThreePendingIndicator(props: ThreePendingIndicatorProps) {
    const { scene, points, endX, endZ, gridSize, isCombatActive, token, isPreview } = props

    const disposers: Array<() => void> = []

    // Calculate distance
    const step = gridSize
    let cells = 0
    const pts = points

    for (let i = 1; i < pts.length; i++) {
        const dxs = Math.abs(pts[i].x - pts[i - 1].x)
        const dzs = Math.abs(pts[i].z - pts[i - 1].z)
        cells += Math.hypot(dxs, dzs) / step
    }

    let labelX = endX
    let labelZ = endZ

    if (isPreview && pts.length > 0) {
        const last = pts[pts.length - 1]
        const dxp = Math.abs(endX - last.x)
        const dzp = Math.abs(endZ - last.z)
        cells += Math.hypot(dxp, dzp) / step
        labelX = endX
        labelZ = endZ
    }

    // Get token's current movement
    const currentMovement = token?.stats?.currentMovement ?? 0

    // Always round distance to integer
    const distanceText = `${Math.round(cells)}`

    // Show remaining movement or just distance if combat not active
    let txt: string
    let labelColor: string
    if (isCombatActive) {
        const remaining = Math.max(0, currentMovement - Math.round(cells))
        txt = `${distanceText} / ${remaining}`

        // Change label color if exceeding movement
        if (Math.round(cells) > currentMovement) {
            labelColor = '#ff3b81' // Red when exceeding
        } else {
            labelColor = '#ffffff' // White normally
        }
    } else {
        txt = distanceText
        labelColor = '#ffffff'
    }

    let line: THREE.Line | null = null
    let labelObj: CSS2DObject | null = null
    let endHandle: THREE.Object3D | null = null
    const startGhost: THREE.Object3D[] = []

    // Create path line only (no endpoint markers)
    if (pts.length > 1) {
        const linePoints = pts.map((p) => new THREE.Vector3(p.x, 0.1, p.z))
        if (isPreview) {
            linePoints.push(new THREE.Vector3(labelX, 0.1, labelZ))
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(linePoints)
        const material = new THREE.LineBasicMaterial({
            color: 0xffd166,
            transparent: true,
            opacity: 0.9,
            linewidth: 2,
        })

        line = new THREE.Line(geometry, material)
        scene.add(line)
        disposers.push(() => {
            scene.remove(line as THREE.Line)
            geometry.dispose()
            material.dispose()
            line = null
        })
    }

    // Match Pixi's logic: hide buttons for DM-triggered movements on players
    const showButtons = !(props.fromRemotePlayer && props.isPlayerConnected === false)
    const showAcceptButton = showButtons && props.isPlayerConnected !== false

    // Create label container
    const labelContainer = document.createElement('div')
    labelContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 12, 24, 0.9);
        border: 1px solid #00c6ff;
        border-radius: 6px;
        padding: 6px 10px;
        pointer-events: auto;
        user-select: none;
        box-shadow: 0 0 8px rgba(0, 198, 255, 0.6), 0 0 16px rgba(0, 198, 255, 0.25);
        backdrop-filter: blur(2px);
        flex-wrap: nowrap;
        justify-content: center;
    `

    // Pixi order: cancel | number | accept
    const distanceSpan = document.createElement('span')
    distanceSpan.textContent = txt
    distanceSpan.style.cssText = `
        display: inline-flex;
        align-items: center;
        color: ${labelColor};
        font-family: "Orbitron", monospace;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin: 0 8px;
    `

    if (showButtons) {
        const buttonSize = 18

        const cancelButton = document.createElement('button')
        cancelButton.textContent = '✕'
        cancelButton.style.cssText = `
            width: ${buttonSize}px;
            height: ${buttonSize}px;
            border: 1px solid #ff3b81;
            background: linear-gradient(180deg, rgba(120,0,50,0.8), rgba(70,0,30,0.8));
            color: #ff3b81;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-shadow: 0 0 10px rgba(255,59,129,0.4), 0 0 16px rgba(255,59,129,0.2);
            margin-right: 6px;
        `
        cancelButton.onclick = (e) => {
            e.stopPropagation()
            window.dispatchEvent(new CustomEvent('indicatorCancel', { detail: { tokenId: props.id } }))
        }
        cancelButton.onpointerdown = (e) => {
            e.stopPropagation()
            e.preventDefault()
        }
        cancelButton.onpointerup = (e) => {
            e.stopPropagation()
            e.preventDefault()
        }
        cancelButton.onmouseenter = () => {
            cancelButton.style.background = 'linear-gradient(180deg, rgba(150,0,60,0.85), rgba(90,0,40,0.85))'
        }
        cancelButton.onmouseleave = () => {
            cancelButton.style.background = 'linear-gradient(180deg, rgba(120,0,50,0.8), rgba(70,0,30,0.8))'
        }
        labelContainer.appendChild(cancelButton)

        labelContainer.appendChild(distanceSpan)

        if (showAcceptButton) {
            const acceptButton = document.createElement('button')
            acceptButton.textContent = '✔'
            acceptButton.style.cssText = `
                width: ${buttonSize}px;
                height: ${buttonSize}px;
                border: 1px solid #00ffc8;
                background: linear-gradient(180deg, rgba(0,120,80,0.8), rgba(0,70,50,0.8));
                color: #00ffc8;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                box-shadow: 0 0 10px rgba(0,255,200,0.4), 0 0 16px rgba(0,255,200,0.2);
                margin-left: 6px;
            `
            acceptButton.onclick = (e) => {
                e.stopPropagation()
                props.onAccept()
            }
            acceptButton.onpointerdown = (e) => {
                e.stopPropagation()
                e.preventDefault()
            }
            acceptButton.onpointerup = (e) => {
                e.stopPropagation()
                e.preventDefault()
            }
            acceptButton.onmouseenter = () => {
                acceptButton.style.background = 'linear-gradient(180deg, rgba(0,150,100,0.85), rgba(0,90,60,0.85))'
            }
            acceptButton.onmouseleave = () => {
                acceptButton.style.background = 'linear-gradient(180deg, rgba(0,120,80,0.8), rgba(0,70,50,0.8))'
            }
            labelContainer.appendChild(acceptButton)
        }
    } else {
        labelContainer.appendChild(distanceSpan)
    }

    labelObj = new CSS2DObject(labelContainer)
    labelObj.position.set(labelX, 0.5, labelZ)
    scene.add(labelObj)

    disposers.push(() => {
        if (labelObj) {
            scene.remove(labelObj)
        }
    })

    // Ghost at start (static) and draggable handle at end
    if (token) {
        const radius = token.customRadius ?? gridSize / 2

        // Start ghost: clone model if available, else fallback, with opacity 0.5
        const startGhostBase =
            props.endModelTemplate?.clone(true) ?? createFallbackTokenModel(token.color, radius, radius * 2)
        startGhostBase.userData = { ...(startGhostBase.userData ?? {}), tokenId: token.id, pendingGhost: true }
        startGhostBase.scale.set(0.8, 0.8, 0.8)
        // Slightly above ground for visibility but near-ground; use a tiny lift
        startGhostBase.position.set(props.startX, radius * 0.02, props.startZ)
        startGhostBase.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const mat = child.material
                if (Array.isArray(mat)) {
                    child.material = mat.map((m) => {
                        if (m instanceof THREE.Material) {
                            const nm = m.clone()
                            nm.transparent = true
                            nm.opacity = 0.5
                            return nm
                        }
                        return m
                    })
                } else if (mat instanceof THREE.Material) {
                    const nm = mat.clone()
                    nm.transparent = true
                    nm.opacity = 0.5
                    child.material = nm
                }
                child.castShadow = false
                child.receiveShadow = false
            }
        })
        scene.add(startGhostBase)
        startGhost.push(startGhostBase)
        disposers.push(() => {
            scene.remove(startGhostBase)
            startGhostBase.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose()
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m) => m.dispose?.())
                    } else if (child.material instanceof THREE.Material) {
                        child.material.dispose()
                    }
                }
            })
        })

        // End handle (draggable target) - use real model when available, otherwise fallback
        if (props.endModelTemplate) {
            const tpl = props.endModelTemplate
            tpl.userData = { ...(tpl.userData ?? {}), tokenId: token.id, pendingHandle: true }
            tpl.position.set(labelX, tpl.position.y, labelZ)
            endHandle = tpl
            // Do NOT restore position on cleanup; the animation / state update will drive the real token
            disposers.push(() => {
                // no-op restore to avoid fighting animation/state
            })
        } else {
            const fallback = createFallbackTokenModel(token.color, radius, radius * 2)
            fallback.userData = { ...(fallback.userData ?? {}), tokenId: token.id, pendingHandle: true }
            fallback.position.set(labelX, radius, labelZ)
            fallback.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = createCyberpunkTokenMaterial(token.color)
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
            scene.add(fallback)
            endHandle = fallback
            disposers.push(() => {
                scene.remove(fallback)
                fallback.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (child.geometry) child.geometry.dispose()
                        if (Array.isArray(child.material)) {
                            child.material.forEach((m) => m.dispose?.())
                        } else if (child.material instanceof THREE.Material) {
                            child.material.dispose()
                        }
                    }
                })
            })
        }
    }

    const update = (next: {
        startX: number
        startZ: number
        endX: number
        endZ: number
        points: { x: number; z: number }[]
    }) => {
        const { endX: nEndX, endZ: nEndZ, points: nPoints } = next

        // Update line
        if (line) {
            const linePoints = nPoints.map((p) => new THREE.Vector3(p.x, 0.1, p.z))
            const geom = new THREE.BufferGeometry().setFromPoints(linePoints)
            const oldGeom = line.geometry
            line.geometry = geom
            oldGeom.dispose()
        }

        // Recompute distance text
        let cells = 0
        for (let i = 1; i < nPoints.length; i++) {
            const dxs = Math.abs(nPoints[i].x - nPoints[i - 1].x)
            const dzs = Math.abs(nPoints[i].z - nPoints[i - 1].z)
            cells += Math.hypot(dxs, dzs) / gridSize
        }
        const distanceText = `${Math.round(cells)}`
        const remaining = Math.max(0, (token?.stats?.currentMovement ?? 0) - Math.round(cells))
        const txt = isCombatActive ? `${distanceText} / ${remaining}` : distanceText
        const color = isCombatActive && Math.round(cells) > (token?.stats?.currentMovement ?? 0) ? '#ff3b81' : '#ffffff'

        // Update label content and position
        if (labelObj) {
            // distance span is middle element
            const distanceNode = labelObj.element.children.length >= 2 ? labelObj.element.children[1] : null
            if (distanceNode && distanceNode instanceof HTMLElement) {
                distanceNode.textContent = txt
                distanceNode.style.color = color
            }
            labelObj.position.set(nEndX, 0.5, nEndZ)
        }

        // Update end handle position
        if (endHandle) {
            endHandle.position.set(nEndX, endHandle.position.y, nEndZ)
        }
    }

    // Return cleanup and update
    return {
        cleanup: () => {
            disposers.forEach((fn) => fn())
        },
        update,
    }
}
