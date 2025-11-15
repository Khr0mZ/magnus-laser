import React, { useRef } from 'react'
import { Viewport } from 'pixi-viewport'
import { PixiBlastContextMenu } from '../PixiBlastContextMenu'
import { PixiMapContextMenu } from '../PixiMapContextMenu'
import { PixiTokenContextMenu } from '../PixiTokenContextMenu'
import type { Blast } from '../../utils/types'

interface UsePixiContextMenusProps {
    viewportRef: React.MutableRefObject<Viewport | null>
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

export const usePixiContextMenus = (props: UsePixiContextMenusProps) => {
    const tokenContextMenuRef = useRef<PixiTokenContextMenu | null>(null)
    const mapContextMenuRef = useRef<PixiMapContextMenu | null>(null)
    const blastContextMenuRef = useRef<PixiBlastContextMenu | null>(null)

    const closeAllContextMenus = () => {
        if (tokenContextMenuRef.current) {
            tokenContextMenuRef.current.close()
            tokenContextMenuRef.current = null
        }
        if (mapContextMenuRef.current) {
            mapContextMenuRef.current.close()
            mapContextMenuRef.current = null
        }
        if (blastContextMenuRef.current) {
            blastContextMenuRef.current.close()
            blastContextMenuRef.current = null
        }
    }

    const openTokenContextMenu = (x: number, y: number, tokenId: string) => {
        const viewport = props.viewportRef.current
        if (!viewport) return

        closeAllContextMenus()

        const menu = new PixiTokenContextMenu({
            x,
            y,
            viewport,
            tokenId,
            onDelete: props.setDeleteTokenDialogOpen,
            onDuplicate: (id) => props.panelTokenOnDuplicateRef.current(id),
            onCopy: (id) => props.panelTokenOnCopyRef.current(id),
            onCut: (id) => props.panelTokenOnCutRef.current(id),
            onClose: () => {
                tokenContextMenuRef.current = null
                props.pixiSetTokenContextMenuAnchor(null)
                props.pixiSetSelectedTokenId(null)
            },
        })
        tokenContextMenuRef.current = menu
        props.pixiSetTokenContextMenuAnchor({} as HTMLElement) // Keep for compatibility
        props.pixiSetSelectedTokenId(tokenId)
    }

    const openBlastContextMenu = (x: number, y: number, blast: Blast) => {
        const viewport = props.viewportRef.current
        if (!viewport) return

        closeAllContextMenus()

        const menu = new PixiBlastContextMenu({
            x,
            y,
            viewport,
            blastId: blast.id,
            isLocked: Boolean(blast.locked),
            onDelete: (id) => props.onBlastDelete?.(id),
            onCopy: (id) => props.onBlastCopyRef.current?.(id),
            onCut: (id) => props.onBlastCutRef.current?.(id),
            onLock: (id, locked) => props.onBlastLock?.(id, locked),
            onClose: () => {
                blastContextMenuRef.current = null
                props.pixiSetBlastContextMenuAnchor(null)
                props.pixiSetSelectedBlastId(null)
            },
        })
        blastContextMenuRef.current = menu
        props.pixiSetBlastContextMenuAnchor({} as HTMLElement) // Keep for compatibility
        props.pixiSetSelectedBlastId(blast.id)
    }

    const openMapContextMenu = (x: number, y: number) => {
        const viewport = props.viewportRef.current
        if (!viewport) return

        closeAllContextMenus()

        try {
            const menu = new PixiMapContextMenu({
                x,
                y,
                viewport,
                onDeleteAllTokens: props.onMapDeleteAllTokens,
                onDeleteAllWalls: props.onMapDeleteAllWalls,
                onDeleteAllBlasts: props.onMapDeleteAllBlasts,
                onCutAllTokens: () => props.pixiOnCutAllTokensRef.current(),
                onPasteToken: () => {
                    props.handleMapPasteToken(x, y)
                },
                onPasteBlast: () => {
                    props.handleMapPasteBlast(x, y)
                },
                canPasteToken: props.canPasteTokenRef.current,
                canPasteBlast: props.canPasteBlastRef.current,
                onClose: () => {
                    mapContextMenuRef.current = null
                    props.pixiSetMapContextMenuAnchor(null)
                },
            })
            mapContextMenuRef.current = menu
            props.pixiSetMapContextMenuAnchor({} as HTMLElement) // Keep for compatibility
        } catch (error) {
            console.error('Error creating map context menu:', error)
        }
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

