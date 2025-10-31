import { SessionStore } from '@/state/sessionStore'
import { sendMutation } from '@/sync/combatSimSync'
import { db } from '@/utils/db'
import { Blast, BlastType, Token, Wall } from '@/views/CombatSim/types'
import { Table } from 'dexie'
import { RefObject, useMemo, useState } from 'react'

interface UsePixiProps {
    blasts: Blast[]
    setBlasts: React.Dispatch<React.SetStateAction<Blast[]>>
    blastsNotInMap: Blast[]
    setBlastsNotInMap: React.Dispatch<React.SetStateAction<Blast[]>>
    tokens: Token[]
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>
    getActiveMapKey: () => string
    getBlastsTable: () => Table<Blast, string, Blast>
    getTokensTable: () => Table<Token, string, Token>
    getWallsTable: () => Table<Wall, string, Wall>
    useSessionTables: () => boolean
    session: SessionStore
    gridSize: number
    isTokenPanelOpen: boolean
    isInitiativePanelOpen: boolean
    isHistoryPanelOpen: boolean
    isBlastPanelOpen: boolean
    setBlastDrawMode: React.Dispatch<React.SetStateAction<BlastType | null>>
    setTokenClipboard: React.Dispatch<React.SetStateAction<Token[] | null>>
    setTokensNotInMap: React.Dispatch<React.SetStateAction<Token[]>>
    setWalls: React.Dispatch<React.SetStateAction<Wall[]>>
    fitRef: RefObject<(() => void) | null>
    acceptAllRef: RefObject<(() => void) | null>
    cancelAllRef: RefObject<(() => void) | null>
    tokensNotInMap: Token[]
}

const usePixi = (props: UsePixiProps) => {
    const {
        blasts,
        setBlasts,
        blastsNotInMap,
        setBlastsNotInMap,
        tokens,
        setTokens,
        getActiveMapKey,
        getBlastsTable,
        getTokensTable,
        getWallsTable,
        useSessionTables,
        session,
        gridSize,
        isTokenPanelOpen,
        isInitiativePanelOpen,
        isHistoryPanelOpen,
        isBlastPanelOpen,
        setBlastDrawMode,
        setTokenClipboard,
        setTokensNotInMap,
        setWalls,
        fitRef,
        acceptAllRef,
        cancelAllRef,
        tokensNotInMap,
    } = props
    const [pixiReady, pixiSetReady] = useState(false)
    const [pixiHostReady, pixiSetHostReady] = useState(false)
    const [pixiTokenContextMenuAnchor, pixiSetTokenContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [pixiMapContextMenuAnchor, pixiSetMapContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [pixiSelectedTokenId, pixiSetSelectedTokenId] = useState<string | null>(null)
    const [pixiBlastContextMenuAnchor, pixiSetBlastContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [pixiSelectedBlastId, pixiSetSelectedBlastId] = useState<string | null>(null)

    const pixiOnBlastDrop = async (blastData: { type: BlastType; id?: string }, worldX: number, worldY: number) => {
        const currentMapId = getActiveMapKey()

        // Check if it's a grenade template or an existing blast
        if (blastData.type === 'grenade' && !blastData.id) {
            // Create new grenade blast with auto-numbered name
            const existingGrenades = blasts.filter((b) => b.type === 'grenade')
            const grenadeNumber = existingGrenades.length + 1

            const newBlast: Blast = {
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                mapId: currentMapId,
                type: 'grenade',
                name: `Grenade ${grenadeNumber}`,
                x: worldX,
                y: worldY,
                alpha: 0.7,
                locked: false,
            }
            const blastsTable = getBlastsTable()
            await blastsTable.add(newBlast)
            setBlasts((prev) => [...prev, newBlast])

            // Send mutation for sync
            sendMutation('blasts', 'insert', newBlast, useSessionTables, session)
        } else if (blastData.type === 'cone' && !blastData.id) {
            // Create placeholder cone blast at drop position for 2-step placement process
            // PixiBoard will update it with the final orientation on confirmation
            const placeholderId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now())
            const newBlast: Blast = {
                id: placeholderId,
                mapId: currentMapId,
                type: 'cone',
                x: worldX,
                y: worldY,
                x2: worldX + 6 * gridSize, // Temporary default orientation
                y2: worldY,
                size: 6,
                alpha: 0.7,
                locked: false,
            }
            // Add numbered name
            const existingFlamers = blasts.filter((b) => b.type === 'cone')
            const flamerNumber = existingFlamers.length + 1
            newBlast.name = `Flamer ${flamerNumber}`

            const blastsTable = getBlastsTable()
            await blastsTable.add(newBlast)
            setBlasts((prev) => [...prev, newBlast])

            // Send mutation for sync
            sendMutation('blasts', 'insert', newBlast, useSessionTables, session)

            // Modify blastData to include the ID so PixiBoard knows it's an existing blast now
            blastData.id = placeholderId
            // Fall through to existing blast handling
        }
        if (blastData.id) {
            // Handle existing blasts - all go through normal move operation
            // Rotation mode for cones will be initiated by PixiBoard after movement
            const existing = [...blasts, ...blastsNotInMap].find((b) => b.id === blastData.id)
            // Move existing blast; translate cone endpoint if present
            const oldX = existing?.x ?? (blastData as unknown as Blast).x ?? worldX
            const oldY = existing?.y ?? (blastData as unknown as Blast).y ?? worldY
            const dx = worldX - oldX
            const dy = worldY - oldY

            const updatePayload: Partial<Blast> = {
                mapId: currentMapId,
                x: worldX,
                y: worldY,
            }

            const prevX2 = existing?.x2 ?? (blastData as unknown as Blast).x2
            const prevY2 = existing?.y2 ?? (blastData as unknown as Blast).y2
            let adjustedX2 = prevX2
            let adjustedY2 = prevY2

            // First apply normal translation
            if (typeof prevX2 === 'number' && typeof prevY2 === 'number') {
                adjustedX2 = prevX2 + dx
                adjustedY2 = prevY2 + dy
            }

            // Note: Cone blasts are handled by PixiBoard drop handler, so this code only runs for non-cone blasts

            if (typeof adjustedX2 === 'number' && typeof adjustedY2 === 'number') {
                updatePayload.x2 = adjustedX2
                updatePayload.y2 = adjustedY2
            }
            updatePayload.size = existing?.size || 6

            const blastsTable = getBlastsTable()
            await blastsTable.update(blastData.id, updatePayload)

            // Send mutation for sync
            sendMutation('blasts', 'update', { id: blastData.id, ...updatePayload }, useSessionTables, session)

            // Update state
            const updatedBlast: Blast = {
                ...(existing ?? (blastData as unknown as Blast)),
                ...updatePayload,
                id: blastData.id!,
                alpha: existing?.alpha ?? (blastData as unknown as Blast).alpha ?? 0.7,
                locked: existing?.locked ?? false,
            }
            setBlasts((prev) => {
                const filtered = prev.filter((b) => b.id !== blastData.id)
                return [...filtered, updatedBlast]
            })
            setBlastsNotInMap((prev) => prev.filter((b) => b.id !== blastData.id))
        }
    }
    const pixiOnBlastMove = async (blastId: string, worldX: number, worldY: number) => {
        const blast = blasts.find((b) => b.id === blastId)
        if (!blast || blast.locked) return

        const dx = worldX - blast.x
        const dy = worldY - blast.y
        const updatePayload: Partial<Blast> = { x: worldX, y: worldY }
        if (blast.type === 'cone' && typeof blast.x2 === 'number' && typeof blast.y2 === 'number') {
            updatePayload.x2 = blast.x2 + dx
            updatePayload.y2 = blast.y2 + dy
        }

        const blastsTable = getBlastsTable()
        await blastsTable.update(blastId, updatePayload)
        setBlasts((prev) => prev.map((b) => (b.id === blastId ? { ...b, ...updatePayload } : b)))

        // Send mutation for sync
        sendMutation('blasts', 'update', { id: blastId, ...updatePayload }, useSessionTables, session)
    }
    const pixiOnBlastComplete = async (blast: Blast) => {
        let blastToAdd = blast

        const blastsTable = getBlastsTable()

        // Check if this blast already exists (e.g., dragged from blastsNotInMap)
        const existingBlast = await blastsTable.get(blast.id)

        // Auto-assign names for cone blasts like grenades (only if not already named)
        if (blast.type === 'cone' && !blast.name) {
            // Find all cone blasts for this map and get the highest number used
            const allFlamers = await blastsTable
                .where('mapId')
                .equals(blast.mapId)
                .and((b) => b.type === 'cone')
                .toArray()
            const numbers = allFlamers
                .map((b) => b.name?.match(/Flamer (\d+)/)?.[1])
                .filter((n): n is string => n !== undefined)
                .map((n) => parseInt(n, 10))
            const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
            const flamerNumber = maxNumber + 1
            blastToAdd = { ...blast, name: `Flamer ${flamerNumber}` }
        }

        if (existingBlast) {
            // Blast already exists, update it
            await blastsTable.update(blast.id, blastToAdd)
            setBlasts((prev) => {
                const blastExistsInBlasts = prev.some((b) => b.id === blast.id)
                if (blastExistsInBlasts) {
                    // Update existing blast in blasts array
                    return prev.map((b) => (b.id === blast.id ? blastToAdd : b))
                } else {
                    // Blast was in blastsNotInMap, add it to blasts array
                    return [...prev, blastToAdd]
                }
            })
            // Remove from blastsNotInMap if it was there
            setBlastsNotInMap((prev) => prev.filter((b) => b.id !== blast.id))

            // Send mutation for sync
            sendMutation('blasts', 'update', blastToAdd, useSessionTables, session)
        } else {
            // Blast doesn't exist, add it
            await blastsTable.add(blastToAdd)
            setBlasts((prev) => [...prev, blastToAdd])

            // Send mutation for sync
            sendMutation('blasts', 'insert', blastToAdd, useSessionTables, session)
        }

        // Reset draw mode after completing a blast
        setBlastDrawMode(null)
    }
    const pixiOnBlastUpdateCone = async (blastId: string, x2: number, y2: number, x: number, y: number) => {
        await db.blasts.update(blastId, { x, y, x2, y2 })
        setBlasts((prev) => prev.map((b) => (b.id === blastId ? { ...b, x, y, x2, y2 } : b)))
        setBlastsNotInMap((prev) => prev.map((b) => (b.id === blastId ? { ...b, x, y, x2, y2 } : b)))
    }
    const pixiSidePanelWidth = useMemo(() => {
        return (
            (isTokenPanelOpen ? 260 : 0) +
            (isInitiativePanelOpen ? 260 : 0) +
            (isHistoryPanelOpen ? 260 : 0) +
            (isBlastPanelOpen ? 260 : 0)
        )
    }, [isTokenPanelOpen, isInitiativePanelOpen, isHistoryPanelOpen, isBlastPanelOpen])

    const pixiOnCutAllTokens = async () => {
        // Copy all current map tokens to clipboard
        const tokensWithUpdatedRadius = tokens.map((t) => ({
            ...t,
            radius: Math.max(1, Math.floor(gridSize / 2)),
        }))
        setTokenClipboard(tokensWithUpdatedRadius)
        // Delete all tokens from map
        for (const token of tokens) {
            await db.tokens.delete(token.id)
        }
        setTokens([])
    }
    const pixiOnPasteToken = async (tokens: Token[]) => {
        for (const token of tokens) {
            const newToken: Token = {
                ...token,
                radius: Math.max(1, Math.floor(gridSize / 2)),
                mapId: getActiveMapKey(),
            }
            await db.tokens.add(newToken)
            setTokens((prev) => [...prev, newToken])
        }
    }
    const pixiOnPasteBlast = async (newBlasts: Blast[]) => {
        for (const blast of newBlasts) {
            const blastToAdd: Blast = {
                ...blast,
                mapId: getActiveMapKey(),
            }
            await db.blasts.add(blastToAdd)
            setBlasts((prev) => [...prev, blastToAdd])
        }
    }
    const pixiOnTokenDuplicate = async (
        id: string,
        options: {
            allTokens?: Token[]
            existingTokens?: Token[]
            setTargetTokens?: React.Dispatch<React.SetStateAction<Token[]>>
            gridSize?: number
            getActiveMapKey?: () => string
        } = {}
    ) => {
        const {
            allTokens = tokens,
            existingTokens = tokens,
            setTargetTokens = setTokens,
            gridSize = 50,
            getActiveMapKey = () => '',
        } = options

        const token = allTokens.find((t) => t.id === id)
        if (token) {
            // Check if it's a default token to apply numbering
            let newName = token.name
            // Count existing copies with the same base name
            const baseName = token.name
            const existingCopies = existingTokens.filter((t) => {
                return t.name.startsWith(baseName + ' ') || t.name === baseName
            })
            const copyNumber = existingCopies.length + 1
            newName = `${baseName} ${copyNumber}`

            const newToken = {
                ...token,
                name: newName,
                radius: Math.max(1, Math.floor(gridSize / 2)),
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
                mapId: getActiveMapKey(),
                // Keep same position as original token
            }
            await db.tokens.add(newToken)
            setTargetTokens((prev) => [...prev, newToken])
        }
    }
    const pixiOnTokenCut = async (
        id: string,
        options: {
            allTokens?: Token[]
            setTargetTokens?: React.Dispatch<React.SetStateAction<Token[]>>
            gridSize?: number
        } = {}
    ) => {
        const { allTokens = tokens, setTargetTokens = setTokens, gridSize = 50 } = options

        const token = allTokens.find((t) => t.id === id)
        if (token) {
            const newToken = {
                ...token,
                radius: Math.max(1, Math.floor(gridSize / 2)),
            }
            setTokenClipboard([newToken])
            // Cut removes the token but stores it in clipboard
            setTargetTokens((prev) => prev.filter((t) => t.id !== id))
            await db.tokens.delete(id)
        }
    }
    const pixiOnTokenCopy = (
        id: string,
        options: {
            allTokens?: Token[]
            existingTokens?: Token[]
            gridSize?: number
        } = {}
    ) => {
        const { allTokens = tokens, existingTokens = tokens, gridSize = 50 } = options

        const token = allTokens.find((t) => t.id === id)
        if (token) {
            // Count existing copies with the same base name
            const baseName = token.name
            const existingCopies = existingTokens.filter((t) => {
                return t.name.startsWith(baseName + ' ') || t.name === baseName
            })
            const copyNumber = existingCopies.length + 1
            const newName = `${baseName} ${copyNumber}`

            // Create a copy with new ID for clipboard
            const clipboardToken = {
                ...token,
                name: newName,
                radius: Math.max(1, Math.floor(gridSize / 2)),
                id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
            }
            setTokenClipboard([clipboardToken])
        }
    }
    const pixiOnWallDraw = async (updated: Wall[], mapKey: string) => {
        setWalls(updated)
        if (!mapKey) return
        const wallsTable = getWallsTable()
        await db.transaction('rw', wallsTable, async () => {
            await wallsTable.where('mapId').equals(mapKey).delete()
            if (updated.length > 0) {
                await wallsTable.bulkAdd(updated)
                // Send mutations for new walls
                for (const wall of updated) {
                    sendMutation('walls', 'insert', wall, useSessionTables, session)
                }
            }
        })
    }
    const pixiOnBindFit = (fn: () => void) => {
        fitRef.current = fn
    }
    const pixiOnTokenMove = async (id: string, x: number, y: number, distanceTraveled?: number) => {
        setTokens((prev) =>
            prev.map((tk) => {
                if (tk.id !== id) return tk
                // If distance traveled is provided, update currentMovement
                if (distanceTraveled !== undefined && tk.stats) {
                    const newCurrentMovement = Math.max(0, tk.stats.currentMovement - distanceTraveled)
                    return {
                        ...tk,
                        x,
                        y,
                        stats: {
                            ...tk.stats,
                            currentMovement: newCurrentMovement,
                        },
                    }
                }
                return { ...tk, x, y }
            })
        )

        // Clean up any pending movement overlays for this token
        // This handles the case where DM accepts a player's pending movement
        if (typeof window !== 'undefined') {
            const cleanupEvent = new CustomEvent('cleanupPendingMovement', {
                detail: { tokenId: id },
            })
            window.dispatchEvent(cleanupEvent)
        }
        // Update database
        const tokensTable = getTokensTable()
        const token = tokens.find((t) => t.id === id)
        if (distanceTraveled !== undefined && token?.stats) {
            const newCurrentMovement = Math.max(0, token.stats.currentMovement - distanceTraveled)
            const updateData = {
                x,
                y,
                stats: {
                    ...token.stats,
                    currentMovement: newCurrentMovement,
                },
            }
            await tokensTable.update(id, updateData)

            // Send mutation for sync
            sendMutation('tokens', 'update', { id, ...updateData }, useSessionTables, session)
        } else {
            const updateData = { x, y }
            await tokensTable.update(id, updateData)

            // Send mutation for sync
            sendMutation('tokens', 'update', { id, ...updateData }, useSessionTables, session)
        }
    }
    const pixiOnBindPendingControls = (acceptAll: () => void, cancelAll: () => void) => {
        acceptAllRef.current = acceptAll
        cancelAllRef.current = cancelAll
    }
    const pixiOnTokenDrop = async (tokenId: string, worldX: number, worldY: number) => {
        const token = [...tokens, ...tokensNotInMap].find((t) => t.id === tokenId)
        if (!token) return

        const currentMapId = getActiveMapKey()

        // Update token position, map, and radius based on current grid size
        const updatedToken: Token = {
            ...token,
            mapId: currentMapId,
            x: worldX,
            y: worldY,
            radius: Math.max(1, Math.floor(gridSize / 2)),
        }

        // Update in database (only for non-default tokens)
        if (token.mapId !== '') {
            try {
                const tokensTable = getTokensTable()
                const updateData = {
                    mapId: currentMapId,
                    x: worldX,
                    y: worldY,
                    radius: Math.max(1, Math.floor(gridSize / 2)),
                }
                await tokensTable.update(tokenId, updateData)

                // Send mutation for sync
                sendMutation('tokens', 'update', { id: tokenId, ...updateData }, useSessionTables, session)
            } catch (error) {
                console.error('Error updating token:', error)
            }
        }

        // Update state
        setTokens((prev) => {
            const filtered = prev.filter((t) => t.id !== tokenId)
            return [...filtered, updatedToken]
        })

        setTokensNotInMap((prev) => prev.filter((t) => t.id !== tokenId))
    }
    return {
        pixiReady,
        pixiSetReady,
        pixiHostReady,
        pixiSetHostReady,
        pixiTokenContextMenuAnchor,
        pixiSetTokenContextMenuAnchor,
        pixiMapContextMenuAnchor,
        pixiSetMapContextMenuAnchor,
        pixiSelectedTokenId,
        pixiSetSelectedTokenId,
        pixiBlastContextMenuAnchor,
        pixiSetBlastContextMenuAnchor,
        pixiSelectedBlastId,
        pixiSetSelectedBlastId,
        pixiOnBlastDrop,
        pixiOnBlastMove,
        pixiOnBlastComplete,
        pixiOnBlastUpdateCone,
        pixiSidePanelWidth,
        pixiOnTokenMove,
        pixiOnBindFit,
        pixiOnBindPendingControls,
        pixiOnTokenDrop,
        pixiOnCutAllTokens,
        pixiOnPasteToken,
        pixiOnPasteBlast,
        pixiOnTokenDuplicate,
        pixiOnTokenCut,
        pixiOnTokenCopy,
        pixiOnWallDraw,
    }
}

export default usePixi
