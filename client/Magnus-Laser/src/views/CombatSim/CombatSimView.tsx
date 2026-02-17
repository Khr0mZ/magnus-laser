import ColorPopper from '@/views/CombatSim/components/ColorPopper'
import CombatSimHeader from '@/views/CombatSim/components/CombatSimHeader'
import FloatingButtons from '@/views/CombatSim/components/FloatingButtons'
import ImageDialog from '@/views/CombatSim/components/ImageDialog'
import CombatPanels from '@/views/CombatSim/components/panels/CombatPanels'
import useCombatSim from '@/views/CombatSim/useCombatSim'
import usePixi from '@/views/CombatSim/usePixi'
import { hexToPixi } from '@/views/CombatSim/utils/pixiUtils'
import { Box, Container, Paper, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningDialog } from '../../components/common/WarningDialog'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { db } from '../../utils/db'
import TargetOverlay from './components/TargetOverlay'
import TokenDetailsDialog from './components/TokenDetailsDialog'
import PixiBoard from './componentsPixi/PixiBoard'
import ThreeBoard from './componentsThree/ThreeBoard'
import { Token } from './utils/types'

const CombatSimView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [view3D, setView3D] = useState(false)
    const {
        // MAP
        dimensions,
        paperRef,
        fitRef,
        onSelectMap,
        onReplaceMap,
        onUploadMap,
        onDeleteMap,
        getActiveMapKey,
        maps,
        sortedMaps,
        mapTexture,
        currentMap,
        // GRID
        onGridSizeChange,
        gridSize,
        onSnapToGridChange,
        snapToGrid,
        setGridColorHex,
        gridColorHex,
        setGridAlpha,
        gridAlpha,
        setGridColorAnchor,
        gridColorAnchor,
        // TOKENS, WALLS, BLASTS
        setDefaultTokens,
        defaultTokens,
        setTokens,
        tokens,
        setTokensNotInMap,
        tokensNotInMap,
        setWalls,
        walls,
        setBlasts,
        blasts,
        setBlastsNotInMap,
        blastsNotInMap,
        // DELETE DIALOGS
        setDeleteTokenDialogOpen,
        deleteTokenDialogOpen,
        setDeleteAllTokensDialogOpen,
        deleteAllTokensDialogOpen,
        setDeleteAllWallsDialogOpen,
        deleteAllWallsDialogOpen,
        setDeleteAllBlastsDialogOpen,
        deleteAllBlastsDialogOpen,
        setDeleteMapDialogOpen,
        deleteMapDialogOpen,
        // CLIPBOARDS
        setTokenClipboard,
        tokenClipboard,
        blastClipboard,
        // FLOATING BUTTONS
        setIsMeasuring,
        isMeasuring,
        setIsWallMode,
        isWallMode,
        setWallDrawingShape,
        wallDrawingShape,
        setIsErasingWalls,
        isErasingWalls,
        setWallColorHex,
        wallColorHex,
        setWallAlpha,
        wallAlpha,
        setWallColorAnchor,
        wallColorAnchor,
        setBlastDrawMode,
        blastDrawMode,
        onActivateBlastDrawMode,
        acceptAllRef,
        cancelAllRef,
        // CONTEXT MENUS
        onBlastDelete,
        onBlastCopy,
        onBlastCut,
        onBlastLock,
        onDeleteToken,
        onDeleteAllTokens,
        onDeleteAllWalls,
        onDeleteAllBlasts,
        // TOKEN DETAILS DIALOGS
        onOpenTokenDialog,
        onCloseTokenDialog,
        tokenDialogsOpen,
        onUploadImage,
        images,
        setFullscreenImage,
        fullscreenImage,
        resolveImageUrl,
        // TOKEN PANEL
        setIsTokenPanelOpen,
        isTokenPanelOpen,
        panelTokenOnDuplicate,
        panelTokenOnCut,
        panelTokenOnCopy,
        pixiOnTokenUpdate,
        setPendingCount,
        pendingCount,
        // INITIATIVE PANEL
        setIsInitiativePanelOpen,
        isInitiativePanelOpen,
        panelInitOnSetAutoReroll,
        panelInitOnSetActiveToken,
        panelInitCheckSeriouslyWounded,
        panelInitOnUpdateTokenCurrent,
        panelInitOnChangeInitiative,
        panelInitOnMeleeAttack,
        panelInitOnRangedAttack,
        panelInitOnSkillCheck,
        panelInitOnGrenadeAttack,
        panelInitOnNextTurn,
        panelInitOnToggleCombat,
        isCombatActive,
        autoRerollInitiative,
        activeTokenId,
        currentRound,
        initiativeRolls,
        // ROLL HISTORY PANEL
        setIsHistoryPanelOpen,
        isHistoryPanelOpen,
        panelHistoryOnRevealDamage,
        panelHistoryOnSetAutoRollDamage,
        panelHistoryOnClear,
        panelHistoryOnDelete,
        rollHistory,
        autoRollDamage,
        // BLAST PANEL
        setIsBlastPanelOpen,
        isBlastPanelOpen,
        // SESSION
        useSessionTables,
        session,
        getBlastsTable,
        getTokensTable,
        getWallsTable,
        isPlayerConnected,
    } = useCombatSim()

    const {
        pixiSetReady,
        pixiReady,
        pixiSetHostReady,
        pixiHostReady,
        pixiSetTokenContextMenuAnchor,
        pixiSetMapContextMenuAnchor,
        pixiSelectedTokenId,
        pixiSetSelectedTokenId,
        pixiSetBlastContextMenuAnchor,
        pixiSetSelectedBlastId,
        pixiOnTokenDrop,
        pixiOnWallDraw,
        pixiOnBindPendingControls,
        pixiOnBindFit,
        pixiOnTokenMove,
        pixiOnCutAllTokens,
        pixiOnPasteToken,
        pixiOnPasteBlast,
        pixiOnBlastMove,
        pixiOnBlastComplete,
        pixiOnBlastDrop,
        pixiOnBlastUpdateCone,
        pixiSidePanelWidth,
    } = usePixi({
        blasts,
        blastsNotInMap,
        tokens,
        setTokens,
        getActiveMapKey,
        gridSize,
        isTokenPanelOpen,
        isInitiativePanelOpen,
        isHistoryPanelOpen,
        isBlastPanelOpen,
        setBlastDrawMode,
        setTokensNotInMap,
        tokensNotInMap,
        setBlasts,
        setBlastsNotInMap,
        getBlastsTable,
        getTokensTable,
        getWallsTable,
        useSessionTables,
        session,
        setTokenClipboard,
        setWalls,
        fitRef,
        acceptAllRef,
        cancelAllRef,
    })

    // Track previous token positions for cleanup event dispatching
    const prevTokensRef = useRef<Token[]>([])

    // Dispatch cleanup events when tokens move (for session sync updates)
    useEffect(() => {
        const movedTokens = tokens.filter((token, index) => {
            const prevToken = prevTokensRef.current[index]
            return prevToken && (prevToken.x !== token.x || prevToken.y !== token.y) && prevToken.id === token.id
        })

        // Dispatch cleanup events for moved tokens
        movedTokens.forEach((token) => {
            if (typeof window !== 'undefined') {
                const cleanupEvent = new CustomEvent('cleanupPendingMovement', {
                    detail: { tokenId: token.id },
                })
                window.dispatchEvent(cleanupEvent)
            }
        })

        // Update previous tokens reference
        prevTokensRef.current = tokens.map((t) => ({ ...t }))
    }, [tokens])

    return (
        <Container
            maxWidth={false}
            sx={{
                pt: 0.5,
                // Disable text selection for all text except inputs
                '& *': {
                    userSelect: 'none',
                },
                // Re-enable text selection for inputs and form elements
                '& input, & textarea, & [role="textbox"], & [contenteditable="true"]': {
                    userSelect: 'auto',
                },
            }}
        >
            <CombatSimHeader
                isPlayerConnected={isPlayerConnected}
                maps={maps}
                currentMap={currentMap}
                sortedMaps={sortedMaps}
                onReplaceMap={onReplaceMap}
                onUploadMap={onUploadMap}
                onSelectMap={onSelectMap}
                gridSize={gridSize}
                onGridSizeChange={onGridSizeChange}
                gridColorHex={gridColorHex}
                gridAlpha={gridAlpha}
                setGridColorAnchor={setGridColorAnchor}
                snapToGrid={snapToGrid}
                onSnapToGridChange={onSnapToGridChange}
                setDeleteMapDialogOpen={setDeleteMapDialogOpen}
                view3D={view3D}
                onView3DToggle={setView3D}
            />
            <Paper
                sx={{
                    p: 0,
                    height: 'calc(100vh - 170px)',
                    width: '100%',
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    position: 'relative',
                    display: 'flex',
                    overflow: 'hidden',
                }}
                ref={paperRef}
            >
                {/* Left panels - can show both simultaneously */}
                <CombatPanels
                    isPlayerConnected={isPlayerConnected}
                    isTokenPanelOpen={isTokenPanelOpen}
                    onOpenTokenDialog={onOpenTokenDialog}
                    getActiveMapKey={getActiveMapKey}
                    setTokens={setTokens}
                    resolveImageUrl={resolveImageUrl}
                    gridSize={gridSize}
                    tokens={tokens}
                    tokensNotInMap={tokensNotInMap}
                    defaultTokens={defaultTokens}
                    setDeleteTokenDialogOpen={setDeleteTokenDialogOpen}
                    panelTokenDuplicate={panelTokenOnDuplicate}
                    panelTokenCut={panelTokenOnCut}
                    panelTokenCopy={panelTokenOnCopy}
                    isInitiativePanelOpen={isInitiativePanelOpen}
                    initiativeRolls={initiativeRolls}
                    activeTokenId={activeTokenId}
                    currentRound={currentRound}
                    autoRerollInitiative={autoRerollInitiative}
                    panelInitOnSetAutoReroll={panelInitOnSetAutoReroll}
                    panelInitOnSetActiveToken={panelInitOnSetActiveToken}
                    handleNextTurn={panelInitOnNextTurn}
                    handleUpdateTokenCurrent={panelInitOnUpdateTokenCurrent}
                    handleUpdateInitiative={panelInitOnChangeInitiative}
                    handleMeleeAttack={panelInitOnMeleeAttack}
                    handleRangedAttack={panelInitOnRangedAttack}
                    handleSkillCheck={panelInitOnSkillCheck}
                    handleGrenadeAttack={panelInitOnGrenadeAttack}
                    isCombatActive={isCombatActive}
                    handleToggleCombat={panelInitOnToggleCombat}
                    isSeriouslyWounded={panelInitCheckSeriouslyWounded}
                    isRollHistoryOpen={isHistoryPanelOpen}
                    rollHistory={rollHistory}
                    autoRollDamage={autoRollDamage}
                    panelHistoryOnSetAutoRollDamage={panelHistoryOnSetAutoRollDamage}
                    panelHistoryOnClear={panelHistoryOnClear}
                    panelHistoryOnDelete={panelHistoryOnDelete}
                    handleRevealDamage={panelHistoryOnRevealDamage}
                    isBlastPanelOpen={isBlastPanelOpen}
                    blasts={blasts}
                    blastsNotInMap={blastsNotInMap}
                    blastDrawMode={blastDrawMode}
                    onActivateBlastDrawMode={onActivateBlastDrawMode}
                    onBlastDelete={onBlastDelete}
                    onBlastCopy={onBlastCopy}
                    onBlastCut={onBlastCut}
                    onBlastLock={onBlastLock}
                />

                {/* Board - PixiJS (2D) or Three.js (3D) */}
                <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    {view3D ? (
                        <ThreeBoard
                            width={dimensions.width}
                            height={dimensions.height}
                            gridSize={gridSize}
                            snapToGrid={snapToGrid}
                            isMeasuring={isMeasuring}
                            isWallMode={isWallMode}
                            wallDrawingShape={wallDrawingShape}
                            mapKey={getActiveMapKey()}
                            mapTexture={mapTexture}
                            tokens={tokens}
                            images={images}
                            pixiOnTokenMove={pixiOnTokenMove}
                            gridColor={hexToPixi(gridColorHex)}
                            gridAlpha={gridAlpha}
                            wallColor={hexToPixi(wallColorHex)}
                            wallAlpha={wallAlpha}
                            walls={walls}
                            pixiOnWallDraw={pixiOnWallDraw}
                            isErasingWalls={isErasingWalls}
                            isCombatActive={isCombatActive}
                            activeTokenId={activeTokenId}
                            blasts={blasts}
                            blastsNotInMap={blastsNotInMap}
                            blastDrawMode={blastDrawMode}
                            pixiOnBlastDrop={pixiOnBlastDrop}
                            pixiOnBlastMove={pixiOnBlastMove}
                            pixiOnBlastComplete={pixiOnBlastComplete}
                            onBlastDelete={onBlastDelete}
                            pixiReady={pixiReady}
                            pixiSetReady={pixiSetReady}
                            pixiHostReady={pixiHostReady}
                            pixiSetHostReady={pixiSetHostReady}
                            onOpenTokenDialog={onOpenTokenDialog}
                            setDeleteTokenDialogOpen={setDeleteTokenDialogOpen}
                            panelTokenOnDuplicate={panelTokenOnDuplicate}
                            panelTokenOnCut={panelTokenOnCut}
                            panelTokenOnCopy={panelTokenOnCopy}
                            pixiOnTokenUpdate={pixiOnTokenUpdate}
                            pixiOnTokenDrop={pixiOnTokenDrop}
                            onMapDeleteAllTokens={() => setDeleteAllTokensDialogOpen(true)}
                            onMapDeleteAllWalls={() => setDeleteAllWallsDialogOpen(true)}
                            onMapDeleteAllBlasts={() => setDeleteAllBlastsDialogOpen(true)}
                            pixiOnCutAllTokens={pixiOnCutAllTokens}
                            pixiOnPasteToken={pixiOnPasteToken}
                            pixiOnPasteBlast={pixiOnPasteBlast}
                            tokenClipboard={tokenClipboard}
                            blastClipboard={blastClipboard}
                            pixiSetTokenContextMenuAnchor={pixiSetTokenContextMenuAnchor}
                            pixiSetMapContextMenuAnchor={pixiSetMapContextMenuAnchor}
                            pixiSetBlastContextMenuAnchor={pixiSetBlastContextMenuAnchor}
                            pixiSelectedTokenId={pixiSelectedTokenId}
                            pixiSetSelectedTokenId={pixiSetSelectedTokenId}
                            pixiSetSelectedBlastId={pixiSetSelectedBlastId}
                            onBlastCopy={onBlastCopy}
                            onBlastCut={onBlastCut}
                            onBlastLock={onBlastLock}
                            onBlastUpdateCone={pixiOnBlastUpdateCone}
                            onPendingCountChange={setPendingCount}
                            pixiOnBindPendingControls={pixiOnBindPendingControls}
                            pixiOnBindFit={pixiOnBindFit}
                            isPlayerConnected={isPlayerConnected}
                        />
                    ) : (
                    <PixiBoard
                        pixiReady={pixiReady}
                        pixiSetReady={pixiSetReady}
                        pixiOnTokenMove={pixiOnTokenMove}
                        pixiOnBindPendingControls={pixiOnBindPendingControls}
                        pixiOnWallDraw={pixiOnWallDraw}
                        pixiOnBindFit={pixiOnBindFit}
                        panelTokenOnDuplicate={panelTokenOnDuplicate}
                        panelTokenOnCut={panelTokenOnCut}
                        panelTokenOnCopy={panelTokenOnCopy}
                        pixiOnTokenUpdate={pixiOnTokenUpdate}
                        pixiOnCutAllTokens={pixiOnCutAllTokens}
                        pixiOnPasteToken={pixiOnPasteToken}
                        pixiOnPasteBlast={pixiOnPasteBlast}
                        pixiOnTokenDrop={pixiOnTokenDrop}
                        pixiOnBlastDrop={pixiOnBlastDrop}
                        pixiOnBlastMove={pixiOnBlastMove}
                        pixiOnBlastComplete={pixiOnBlastComplete}
                        onBlastUpdateCone={pixiOnBlastUpdateCone}
                        pixiSidePanelWidth={pixiSidePanelWidth}
                        pixiHostReady={pixiHostReady}
                        pixiSetHostReady={pixiSetHostReady}
                        pixiSetTokenContextMenuAnchor={pixiSetTokenContextMenuAnchor}
                        pixiSetMapContextMenuAnchor={pixiSetMapContextMenuAnchor}
                        pixiSelectedTokenId={pixiSelectedTokenId}
                        pixiSetSelectedTokenId={pixiSetSelectedTokenId}
                        pixiSetBlastContextMenuAnchor={pixiSetBlastContextMenuAnchor}
                        pixiSetSelectedBlastId={pixiSetSelectedBlastId}
                        mapTexture={mapTexture}
                        mapKey={getActiveMapKey()}
                        gridSize={gridSize}
                        snapToGrid={snapToGrid}
                        tokens={tokens}
                        images={images}
                        walls={walls}
                        blasts={blasts}
                        tokenClipboard={tokenClipboard}
                        width={dimensions.width}
                        height={dimensions.height}
                        isMeasuring={isMeasuring}
                        isWallMode={isWallMode}
                        wallDrawingShape={wallDrawingShape}
                        isErasingWalls={isErasingWalls}
                        isCombatActive={isCombatActive}
                        onPendingCountChange={setPendingCount}
                        gridColor={hexToPixi(gridColorHex)}
                        gridAlpha={gridAlpha}
                        wallColor={hexToPixi(wallColorHex)}
                        wallAlpha={wallAlpha}
                        onOpenTokenDialog={onOpenTokenDialog}
                        setDeleteTokenDialogOpen={setDeleteTokenDialogOpen}
                        onMapDeleteAllTokens={() => setDeleteAllTokensDialogOpen(true)}
                        onMapDeleteAllWalls={() => setDeleteAllWallsDialogOpen(true)}
                        onMapDeleteAllBlasts={() => setDeleteAllBlastsDialogOpen(true)}
                        activeTokenId={activeTokenId}
                        blastClipboard={blastClipboard}
                        blastsNotInMap={blastsNotInMap}
                        blastDrawMode={blastDrawMode}
                        onBlastDelete={onBlastDelete}
                        onBlastCopy={onBlastCopy}
                        onBlastCut={onBlastCut}
                        onBlastLock={onBlastLock}
                        isPlayerConnected={isPlayerConnected}
                    />
                    )}
                    <TargetOverlay selectedTokenId={pixiSelectedTokenId} tokens={tokens} />
                    {/* Debug info */}
                    {mapTexture && (
                        <Typography
                            sx={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                fontSize: 10,
                                opacity: 0.9,
                                color: readerMode ? colors.grays.gray900 : colors.neons.cyan.default,
                                userSelect: 'none',
                            }}
                        >
                            Grid{' '}
                            {Intl.NumberFormat('en-GB', { maximumFractionDigits: 5 }).format(
                                mapTexture.width / gridSize
                            )}
                            ×
                            {Intl.NumberFormat('en-GB', { maximumFractionDigits: 5 }).format(
                                mapTexture.height / gridSize
                            )}
                        </Typography>
                    )}
                    <FloatingButtons
                        fitRef={fitRef}
                        isMeasuring={isMeasuring}
                        setIsMeasuring={setIsMeasuring}
                        isWallMode={isWallMode}
                        setIsWallMode={setIsWallMode}
                        isErasingWalls={isErasingWalls}
                        setIsErasingWalls={setIsErasingWalls}
                        isTokenPanelOpen={isTokenPanelOpen}
                        setIsTokenPanelOpen={setIsTokenPanelOpen}
                        isInitiativePanelOpen={isInitiativePanelOpen}
                        setIsInitiativePanelOpen={setIsInitiativePanelOpen}
                        isRollHistoryOpen={isHistoryPanelOpen}
                        setIsRollHistoryOpen={setIsHistoryPanelOpen}
                        isBlastPanelOpen={isBlastPanelOpen}
                        setIsBlastPanelOpen={setIsBlastPanelOpen}
                        acceptAllRef={acceptAllRef}
                        cancelAllRef={cancelAllRef}
                        setWallColorAnchor={setWallColorAnchor}
                        setBlastDrawMode={setBlastDrawMode}
                        setWallDrawingShape={setWallDrawingShape}
                        wallDrawingShape={wallDrawingShape}
                        wallColorHex={wallColorHex}
                        wallAlpha={wallAlpha}
                        pendingCount={pendingCount}
                        isPlayerConnected={isPlayerConnected}
                    />
                </Box>
            </Paper>
            {/* Confirmation dialogs */}
            <>
                <WarningDialog
                    open={deleteMapDialogOpen}
                    onClose={() => setDeleteMapDialogOpen(false)}
                    onConfirm={onDeleteMap}
                    title={t('common.deleteConfirmTitle')}
                    message={t('common.deleteConfirmMessage', {
                        type: t(`modules.${ModuleTypes.COMBAT_SIM}`).toLowerCase(),
                    })}
                    moduleType={ModuleTypes.COMBAT_SIM}
                    isDelete={true}
                    isClearAll={false}
                />
                <WarningDialog
                    open={deleteAllTokensDialogOpen}
                    onClose={() => setDeleteAllTokensDialogOpen(false)}
                    onConfirm={onDeleteAllTokens}
                    title={t('common.clearAllConfirmTitle')}
                    message={t('common.clearAllConfirmMessage', {
                        type: t(`modules.${ModuleTypes.COMBAT_SIM}`).toLowerCase(),
                    })}
                    moduleType={ModuleTypes.COMBAT_SIM}
                    isDelete={true}
                    isClearAll={true}
                />
                <WarningDialog
                    open={deleteTokenDialogOpen !== null}
                    onClose={() => setDeleteTokenDialogOpen(null)}
                    onConfirm={onDeleteToken}
                    title={t('common.deleteConfirmTitle')}
                    message={t('common.deleteConfirmMessage', {
                        type: 'token',
                    })}
                    moduleType={ModuleTypes.COMBAT_SIM}
                    isDelete={true}
                    isClearAll={false}
                />
                <WarningDialog
                    open={deleteAllWallsDialogOpen}
                    onClose={() => setDeleteAllWallsDialogOpen(false)}
                    onConfirm={onDeleteAllWalls}
                    title={t('common.clearAllConfirmTitle')}
                    message={t('common.clearAllConfirmMessage', {
                        type: 'walls',
                    })}
                    moduleType={ModuleTypes.COMBAT_SIM}
                    isDelete={true}
                    isClearAll={true}
                />
                <WarningDialog
                    open={deleteAllBlastsDialogOpen}
                    onClose={() => setDeleteAllBlastsDialogOpen(false)}
                    onConfirm={onDeleteAllBlasts}
                    title={t('common.clearAllConfirmTitle')}
                    message={t('common.clearAllConfirmMessage', {
                        type: 'blasts',
                    })}
                    moduleType={ModuleTypes.COMBAT_SIM}
                    isDelete={true}
                    isClearAll={true}
                />
            </>
            {/* Token dialogs */}
            {tokenDialogsOpen.map((tokenId, index) => (
                <TokenDetailsDialog
                    key={tokenId}
                    tokenDialogOpen={tokenId}
                    onCloseTokenDialog={() => onCloseTokenDialog(tokenId)}
                    initialPosition={{ x: 100 + index * 50, y: 100 + index * 50 }}
                    tokens={[...defaultTokens, ...tokens, ...tokensNotInMap]}
                    images={images}
                    gridSize={gridSize}
                    onUpdateToken={async (tokenId, updates) => {
                        // Check if it's a default token
                        const isDefaultToken = defaultTokens.some((t) => t.id === tokenId)

                        if (isDefaultToken) {
                            // Update default token in state only (not persisted)
                            setDefaultTokens((prev) => prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)))
                        } else {
                            // Update regular token in state and database
                            // Try to update in tokens first
                            const isInCurrentMap = tokens.some((t) => t.id === tokenId)
                            if (isInCurrentMap) {
                                setTokens((prev) => prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)))
                                await db.tokens.update(tokenId, updates)
                            } else {
                                // Must be in tokensNotInMap
                                const updatesTyped = updates as Partial<Token>

                                setTokensNotInMap((prev) =>
                                    prev.map((t) => {
                                        if (t.id === tokenId) {
                                            // Apply all updates - if mapId is in updates, it will be used
                                            return { ...t, ...updatesTyped }
                                        }
                                        return t
                                    })
                                )
                                // Update database with all changes
                                await db.tokens.update(tokenId, updatesTyped)
                            }
                        }
                    }}
                    setDeleteTokenDialogOpen={setDeleteTokenDialogOpen}
                    onUploadImage={onUploadImage}
                    toggleFullscreenImage={setFullscreenImage}
                    resolveImageUrl={resolveImageUrl}
                />
            ))}
            {/* Grid color picker */}
            <ColorPopper
                anchorEl={gridColorAnchor}
                open={Boolean(gridColorAnchor)}
                readerMode={readerMode}
                colorHex={gridColorHex}
                colorAlpha={gridAlpha}
                setColorHex={setGridColorHex}
                setColorAlpha={setGridAlpha}
            />
            {/* Wall color picker */}
            <ColorPopper
                anchorEl={wallColorAnchor}
                open={Boolean(wallColorAnchor)}
                readerMode={readerMode}
                colorHex={wallColorHex}
                colorAlpha={wallAlpha}
                setColorHex={setWallColorHex}
                setColorAlpha={setWallAlpha}
            />
            {/* Fullscreen Image Dialog */}
            <ImageDialog image={fullscreenImage} onClose={() => setFullscreenImage('')} />
        </Container>
    )
}

export default CombatSimView
