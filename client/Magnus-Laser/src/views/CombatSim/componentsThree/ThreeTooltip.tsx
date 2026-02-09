import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { StatsActions, Token } from '../utils/types'

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const ACTION_COLORS: Record<StatsActions['type'], string> = {
    melee: '#ff0055',
    ranged: '#ffff00',
    grenade: '#ff5e00',
    skill: '#00ffff',
}

function formatDamageDice(damage?: { d4?: number | null; d6?: number | null; d8?: number | null }): string {
    if (!damage) return ''
    const parts: string[] = []
    if (damage.d4) parts.push(`${damage.d4}D4`)
    if (damage.d6) parts.push(`${damage.d6}D6`)
    if (damage.d8) parts.push(`${damage.d8}D8`)
    return parts.join(' ')
}

function buildTooltipHTML(token: Token): string {
    const s = token.stats
    if (!s) return ''

    const isSeriouslyWounded =
        (s.currentHealth ?? s.health) < Math.ceil(s.health / 2) && !s.ignoreSeriouslyWoundedPenalty

    let html = `<div style="font-family:'Orbitron',monospace;font-size:12px;color:#00ffff;line-height:1.6">`
    html += `<div style="font-size:14px;font-weight:bold;color:#7affff;letter-spacing:0.5px;margin-bottom:6px">${escapeHtml(token.name.toUpperCase())}</div>`

    // Health + Movement row
    html += `<div style="display:flex;gap:16px">`
    html += `<span><b style="color:#fff">HP:</b> ${s.currentHealth}/${s.health}${isSeriouslyWounded ? ' \ud83e\xde78' : ''}</span>`
    html += `<span><b style="color:#9900ff">MOV:</b> ${s.currentMovement}/${s.movement}</span>`
    html += `</div>`

    // SPH + SPB row
    html += `<div style="display:flex;gap:16px">`
    html += `<span><b style="color:#00ff8b">SPH:</b> ${s.armor.currentSph}/${s.armor.sph}</span>`
    html += `<span><b style="color:#00ff8b">SPB:</b> ${s.armor.currentSpb}/${s.armor.spb}</span>`
    html += `</div>`

    // Luck (PC only)
    if (s.isPC && s.luck !== undefined) {
        html += `<div><b style="color:#ff00ff">LUCK:</b> ${s.currentLuck ?? 0}/${s.luck}</div>`
    }

    // Actions
    for (const a of s.actions || []) {
        const color = ACTION_COLORS[a.type] || '#00ffff'
        const name = escapeHtml(a.name || a.type)
        const dmg = formatDamageDice(a.damage)
        html += `<div style="display:flex;gap:16px">`
        html += `<span><b style="color:${color}">${name}:</b> ${a.value}</span>`
        if (dmg) html += `<span><b style="color:${color}">Dmg:</b> ${dmg}</span>`
        html += `</div>`
    }

    html += `</div>`
    return html
}

export function useThreeTooltip(
    container: HTMLDivElement | null,
    scene: THREE.Scene | null,
    camera: THREE.PerspectiveCamera | null,
    tokens: Token[],
    tokenMeshes: Map<string, THREE.Object3D>,
    width: number,
    height: number,
    isWallMode: boolean,
    isMeasuring: boolean,
    blastDrawMode: string | null
) {
    const tooltipRef = useRef<HTMLDivElement | null>(null)
    const hoveredTokenIdRef = useRef<string | null>(null)
    const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!container) return

        // Create tooltip div
        const tooltip = document.createElement('div')
        tooltip.style.cssText = `
            position: absolute;
            pointer-events: none;
            background: rgba(0, 20, 40, 0.9);
            border: 1px solid #00ffff;
            border-radius: 4px;
            padding: 10px;
            display: none;
            z-index: 100;
            max-width: 320px;
            box-shadow: 0 0 12px rgba(0, 255, 255, 0.3);
        `
        container.appendChild(tooltip)
        tooltipRef.current = tooltip

        return () => {
            if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
            container.removeChild(tooltip)
            tooltipRef.current = null
        }
    }, [container])

    useEffect(() => {
        if (!container || !scene || !camera || !tooltipRef.current) return

        const tooltip = tooltipRef.current

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            // Hide during special modes
            if (isWallMode || isMeasuring || blastDrawMode) {
                tooltip.style.display = 'none'
                hoveredTokenIdRef.current = null
                if (showTimeoutRef.current) {
                    clearTimeout(showTimeoutRef.current)
                    showTimeoutRef.current = null
                }
                return
            }

            const rect = container.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top

            // Raycast tokens
            const raycaster = new THREE.Raycaster()
            const mouseVec = new THREE.Vector2((mx / width) * 2 - 1, -(my / height) * 2 + 1)
            raycaster.setFromCamera(mouseVec, camera)

            const meshes = Array.from(tokenMeshes.values())
            const hits = raycaster.intersectObjects(meshes, true)

            let hitTokenId: string | null = null
            if (hits.length > 0) {
                // Walk up to find tokenId in userData
                let obj: THREE.Object3D | null = hits[0].object
                while (obj) {
                    if (obj.userData?.tokenId) {
                        hitTokenId = obj.userData.tokenId
                        break
                    }
                    obj = obj.parent
                }
            }

            if (hitTokenId !== hoveredTokenIdRef.current) {
                // Token changed
                if (showTimeoutRef.current) {
                    clearTimeout(showTimeoutRef.current)
                    showTimeoutRef.current = null
                }
                hoveredTokenIdRef.current = hitTokenId

                if (!hitTokenId) {
                    tooltip.style.display = 'none'
                } else {
                    // Show after 300ms delay
                    showTimeoutRef.current = setTimeout(() => {
                        const token = tokens.find((t) => t.id === hitTokenId)
                        if (token && token.stats) {
                            tooltip.innerHTML = buildTooltipHTML(token)
                            tooltip.style.display = 'block'
                        }
                    }, 300)
                }
            }

            // Position tooltip near cursor (clamped to container)
            if (tooltip.style.display === 'block') {
                const padding = 12
                let tx = mx + padding
                let ty = my - tooltip.offsetHeight - padding
                if (tx + tooltip.offsetWidth > width) tx = width - tooltip.offsetWidth - padding
                if (ty < 0) ty = my + padding
                if (tx < 0) tx = padding
                tooltip.style.left = `${tx}px`
                tooltip.style.top = `${ty}px`
            }
        }

        container.addEventListener('mousemove', handleMouseMove)
        return () => {
            container.removeEventListener('mousemove', handleMouseMove)
            if (showTimeoutRef.current) {
                clearTimeout(showTimeoutRef.current)
                showTimeoutRef.current = null
            }
        }
    }, [container, scene, camera, tokens, tokenMeshes, width, height, isWallMode, isMeasuring, blastDrawMode])
}
