import { useRef } from 'react'
import * as THREE from 'three'
import type { Blast } from '../../utils/types'

interface UseThreeContextMenusProps {
    containerRef: React.RefObject<HTMLDivElement>
    cameraRef: React.RefObject<THREE.PerspectiveCamera | null>
    setDeleteTokenDialogOpen: (id: string) => void
    panelTokenOnDuplicateRef: React.MutableRefObject<(id: string) => void>
    panelTokenOnCutRef: React.MutableRefObject<(id: string) => void>
    panelTokenOnCopyRef: React.MutableRefObject<(id: string) => void>
    pixiSetTokenContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSetSelectedTokenId: (id: string | null) => void
    onMapDeleteAllTokens: () => void
    onMapDeleteAllWalls: () => void
    onMapDeleteAllBlasts: () => void
    pixiOnCutAllTokensRef: React.MutableRefObject<() => void>
    handleMapPasteToken: (x: number, y: number) => void
    handleMapPasteBlast: (x: number, y: number) => void
    canPasteTokenRef: React.MutableRefObject<boolean>
    canPasteBlastRef: React.MutableRefObject<boolean>
    pixiSetMapContextMenuAnchor: (anchor: HTMLElement | null) => void
    onBlastDelete?: (id: string) => void
    onBlastCopyRef: React.MutableRefObject<((id: string) => void) | undefined>
    onBlastCutRef: React.MutableRefObject<((id: string) => void) | undefined>
    onBlastLock?: (id: string, locked: boolean) => void
    pixiSetBlastContextMenuAnchor: (anchor: HTMLElement | null) => void
    pixiSetSelectedBlastId: (id: string | null) => void
}

export const useThreeContextMenus = (props: UseThreeContextMenusProps) => {
    const tokenContextMenuRef = useRef<HTMLDivElement | null>(null)
    const mapContextMenuRef = useRef<HTMLDivElement | null>(null)
    const blastContextMenuRef = useRef<HTMLDivElement | null>(null)

    const closeAllContextMenus = () => {
        if (tokenContextMenuRef.current) {
            tokenContextMenuRef.current.remove()
            tokenContextMenuRef.current = null
            props.pixiSetTokenContextMenuAnchor(null)
            props.pixiSetSelectedTokenId(null)
        }
        if (mapContextMenuRef.current) {
            mapContextMenuRef.current.remove()
            mapContextMenuRef.current = null
            props.pixiSetMapContextMenuAnchor(null)
        }
        if (blastContextMenuRef.current) {
            blastContextMenuRef.current.remove()
            blastContextMenuRef.current = null
            props.pixiSetBlastContextMenuAnchor(null)
            props.pixiSetSelectedBlastId(null)
        }
    }

    const worldToScreen = (worldPos: THREE.Vector3): { x: number; y: number } | null => {
        const camera = props.cameraRef.current
        const container = props.containerRef.current
        if (!camera || !container) return null

        const vector = worldPos.clone()
        vector.project(camera)

        const rect = container.getBoundingClientRect()
        const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left
        const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top

        return { x, y }
    }

    const openTokenContextMenu = (worldX: number, worldZ: number, tokenId: string) => {
        const container = props.containerRef.current
        const camera = props.cameraRef.current
        if (!container || !camera) return

        closeAllContextMenus()

        // Convert world coordinates to screen coordinates
        const worldPos = new THREE.Vector3(worldX, 0, worldZ)
        const screenPos = worldToScreen(worldPos)
        if (!screenPos) return

        // Create menu element
        const menu = document.createElement('div')
        menu.className = 'three-context-menu'
        menu.style.cssText = `
            position: fixed;
            left: ${screenPos.x}px;
            top: ${screenPos.y}px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 8px 0;
            min-width: 152px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `

        // Menu items
        const items = [
            { label: 'Duplicate', icon: '📋', onClick: () => props.panelTokenOnDuplicateRef.current(tokenId) },
            { label: 'Copy', icon: '📄', onClick: () => props.panelTokenOnCopyRef.current(tokenId) },
            { label: 'Cut', icon: '✂️', onClick: () => props.panelTokenOnCutRef.current(tokenId) },
            { isDivider: true },
            { label: 'Delete', icon: '🗑️', color: '#ff6b6b', onClick: () => props.setDeleteTokenDialogOpen(tokenId) },
        ]

        items.forEach((item) => {
            if (item.isDivider) {
                const divider = document.createElement('div')
                divider.style.cssText = 'height: 1px; background: #333; margin: 8px 0;'
                menu.appendChild(divider)
            } else {
                const menuItem = document.createElement('div')
                menuItem.className = 'three-context-menu-item'
                menuItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: ${item.color || '#fff'};
                    font-family: "Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif;
                    font-size: 14px;
                `
                menuItem.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`
                menuItem.onmouseenter = () => {
                    menuItem.style.background = 'rgba(255, 255, 255, 0.1)'
                }
                menuItem.onmouseleave = () => {
                    menuItem.style.background = 'transparent'
                }
                menuItem.onclick = () => {
                    item.onClick?.()
                    closeAllContextMenus()
                }
                menu.appendChild(menuItem)
            }
        })

        document.body.appendChild(menu)
        tokenContextMenuRef.current = menu
        props.pixiSetTokenContextMenuAnchor(menu)
        props.pixiSetSelectedTokenId(tokenId)

        // Close on click outside
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (menu && !menu.contains(e.target as globalThis.Node)) {
                closeAllContextMenus()
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }
        setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    }

    const openBlastContextMenu = (worldX: number, worldZ: number, blast: Blast) => {
        const container = props.containerRef.current
        const camera = props.cameraRef.current
        if (!container || !camera) return

        closeAllContextMenus()

        // Convert world coordinates to screen coordinates
        const worldPos = new THREE.Vector3(worldX, 0, worldZ)
        const screenPos = worldToScreen(worldPos)
        if (!screenPos) return

        // Create menu element
        const menu = document.createElement('div')
        menu.className = 'three-context-menu'
        menu.style.cssText = `
            position: fixed;
            left: ${screenPos.x}px;
            top: ${screenPos.y}px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 8px 0;
            min-width: 152px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `

        const isLocked = Boolean(blast.locked)
        const items = [
            {
                label: isLocked ? 'Unlock' : 'Lock',
                icon: isLocked ? '🔓' : '🔒',
                onClick: () => props.onBlastLock?.(blast.id, !isLocked),
            },
            { isDivider: true },
            { label: 'Copy', icon: '📄', onClick: () => props.onBlastCopyRef.current?.(blast.id) },
            { label: 'Cut', icon: '✂️', onClick: () => props.onBlastCutRef.current?.(blast.id) },
            { isDivider: true },
            { label: 'Delete', icon: '🗑️', color: '#ff4444', onClick: () => props.onBlastDelete?.(blast.id) },
        ]

        items.forEach((item) => {
            if (item.isDivider) {
                const divider = document.createElement('div')
                divider.style.cssText = 'height: 1px; background: #333; margin: 8px 0;'
                menu.appendChild(divider)
            } else {
                const menuItem = document.createElement('div')
                menuItem.className = 'three-context-menu-item'
                menuItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: ${item.color || '#fff'};
                    font-family: "Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif;
                    font-size: 14px;
                `
                menuItem.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`
                menuItem.onmouseenter = () => {
                    menuItem.style.background = 'rgba(255, 255, 255, 0.1)'
                }
                menuItem.onmouseleave = () => {
                    menuItem.style.background = 'transparent'
                }
                menuItem.onclick = () => {
                    item.onClick?.()
                    closeAllContextMenus()
                }
                menu.appendChild(menuItem)
            }
        })

        document.body.appendChild(menu)
        blastContextMenuRef.current = menu
        props.pixiSetBlastContextMenuAnchor(menu)
        props.pixiSetSelectedBlastId(blast.id)

        // Close on click outside
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (menu && !menu.contains(e.target as globalThis.Node)) {
                closeAllContextMenus()
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }
        setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    }

    const openMapContextMenu = (worldX: number, worldZ: number) => {
        const container = props.containerRef.current
        const camera = props.cameraRef.current
        if (!container || !camera) return

        closeAllContextMenus()

        // Convert world coordinates to screen coordinates
        const worldPos = new THREE.Vector3(worldX, 0, worldZ)
        const screenPos = worldToScreen(worldPos)
        if (!screenPos) return

        // Create menu element
        const menu = document.createElement('div')
        menu.className = 'three-context-menu'
        menu.style.cssText = `
            position: fixed;
            left: ${screenPos.x}px;
            top: ${screenPos.y}px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 8px 0;
            min-width: 152px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `

        const canPasteToken = props.canPasteTokenRef.current
        const canPasteBlast = props.canPasteBlastRef.current

        const items = [
            {
                label: 'Paste Token',
                icon: '📋',
                disabled: !canPasteToken,
                onClick: () => props.handleMapPasteToken(worldX, worldZ),
            },
            {
                label: 'Paste Blast',
                icon: '📋',
                disabled: !canPasteBlast,
                onClick: () => props.handleMapPasteBlast(worldX, worldZ),
            },
            {
                label: 'Cut All Tokens',
                icon: '✂️',
                color: '#ffa500',
                onClick: () => props.pixiOnCutAllTokensRef.current(),
            },
            {
                label: 'Delete All Tokens',
                icon: '🗑️',
                color: '#ff6b6b',
                onClick: () => props.onMapDeleteAllTokens(),
            },
            {
                label: 'Delete All Walls',
                icon: '🗑️',
                color: '#ff6b6b',
                onClick: () => props.onMapDeleteAllWalls(),
            },
            {
                label: 'Delete All Blasts',
                icon: '🗑️',
                color: '#ff6b6b',
                onClick: () => props.onMapDeleteAllBlasts(),
            },
        ]

        items.forEach((item) => {
            const menuItem = document.createElement('div')
            menuItem.className = 'three-context-menu-item'
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: ${item.disabled ? 'default' : 'pointer'};
                display: flex;
                align-items: center;
                gap: 12px;
                color: ${item.disabled ? '#666' : item.color || '#fff'};
                font-family: "Orbitron", "Rajdhani", "Blender Pro", "Lexend", sans-serif;
                font-size: 14px;
                opacity: ${item.disabled ? 0.5 : 1};
            `
            menuItem.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`
            if (!item.disabled) {
                menuItem.onmouseenter = () => {
                    menuItem.style.background = 'rgba(255, 255, 255, 0.1)'
                }
                menuItem.onmouseleave = () => {
                    menuItem.style.background = 'transparent'
                }
                menuItem.onclick = () => {
                    item.onClick?.()
                    closeAllContextMenus()
                }
            }
            menu.appendChild(menuItem)
        })

        document.body.appendChild(menu)
        mapContextMenuRef.current = menu
        props.pixiSetMapContextMenuAnchor(menu)

        // Close on click outside
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (menu && !menu.contains(e.target as globalThis.Node)) {
                closeAllContextMenus()
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }
        setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    }

    return {
        tokenContextMenuRef,
        mapContextMenuRef,
        blastContextMenuRef,
        closeAllContextMenus,
        openTokenContextMenu,
        openBlastContextMenu,
        openMapContextMenu,
    }
}
