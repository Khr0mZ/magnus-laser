import { useEffect, useRef } from 'react'
import type { Blast, Token } from '../../utils/types'

interface UseThreeClipboardProps {
    tokenClipboard: Token[] | null
    blastClipboard: Blast[] | null
    mapKey: string
    onMapPasteToken: (tokens: Token[]) => void
    onMapPasteBlast: (blasts: Blast[]) => void
}

export const useThreeClipboard = (props: UseThreeClipboardProps) => {
    const tokenClipboardRef = useRef<Token[] | null>(null)
    const blastClipboardRef = useRef<Blast[] | null>(null)
    const mapKeyRef = useRef<string>(props.mapKey)
    const canPasteTokenRef = useRef<boolean>(false)
    const canPasteBlastRef = useRef<boolean>(false)

    useEffect(() => {
        tokenClipboardRef.current = props.tokenClipboard
        canPasteTokenRef.current = props.tokenClipboard !== null && props.tokenClipboard.length > 0
    }, [props.tokenClipboard])

    useEffect(() => {
        blastClipboardRef.current = props.blastClipboard
        canPasteBlastRef.current = props.blastClipboard !== null && props.blastClipboard.length > 0
    }, [props.blastClipboard])

    useEffect(() => {
        mapKeyRef.current = props.mapKey
    }, [props.mapKey])

    const handleMapPasteToken = (pasteX?: number, pasteY?: number) => {
        const currentClipboard = tokenClipboardRef.current
        if (!currentClipboard || currentClipboard.length === 0 || !pasteX || !pasteY) return

        const activeMapKey = mapKeyRef.current
        if (!activeMapKey) return

        // Create new tokens with new IDs, positions, and mapId
        const newTokens = currentClipboard.map((token) => ({
            ...token,
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + Math.random()),
            x: pasteX,
            y: pasteY,
            mapId: activeMapKey, // Set mapId to current map
        }))

        props.onMapPasteToken(newTokens)
        // Keep clipboard intact for multiple pastes
    }

    const handleMapPasteBlast = (pasteX?: number, pasteY?: number) => {
        const currentClipboard = blastClipboardRef.current
        if (!currentClipboard || currentClipboard.length === 0 || !pasteX || !pasteY) return

        const activeMapKey = mapKeyRef.current
        if (!activeMapKey) return

        // Calculate center of blasts
        const xs = currentClipboard.map((b) => b.x)
        const ys = currentClipboard.map((b) => b.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        // Create new blasts with new IDs, adjusted positions, and mapId
        const newBlasts = currentClipboard.map((b) => ({
            ...b,
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + Math.random()),
            x: pasteX + (b.x - centerX),
            y: pasteY + (b.y - centerY),
            x2: b.x2 !== undefined ? pasteX + (b.x2 - centerX) : undefined,
            y2: b.y2 !== undefined ? pasteY + (b.y2 - centerY) : undefined,
            mapId: activeMapKey, // Set mapId to current map
        }))

        props.onMapPasteBlast(newBlasts)
        // Keep clipboard intact for multiple pastes
    }

    return {
        tokenClipboardRef,
        blastClipboardRef,
        handleMapPasteToken,
        handleMapPasteBlast,
        canPasteTokenRef,
        canPasteBlastRef,
    }
}
