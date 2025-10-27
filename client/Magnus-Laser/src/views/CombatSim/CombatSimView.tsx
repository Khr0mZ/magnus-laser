import CombatSimHeader from '@/views/CombatSim/CombatSimHeader'
import ColorPopper from '@/views/CombatSim/components/ColorPopper'
import FloatingButtons from '@/views/CombatSim/components/FloatingButtons'
import ImageDialog from '@/views/CombatSim/components/ImageDialog'
import CombatPanels from '@/views/CombatSim/components/panels/CombatPanels'
import { hexToPixi } from '@/views/CombatSim/pixiUtils'
import useCombatSim from '@/views/CombatSim/useCombatSim'
import { Box, Container, Paper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { WarningDialog } from '../../components/common/WarningDialog'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { db } from '../../utils/db'
import PixiBoard from './PixiBoard'
import TokenDetailsDialog from './TokenDetailsDialog'
import { Token } from './types'

const CombatSimView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const {
        maps,
        currentMap,
        sortedMaps,
        onReplaceMap,
        onUploadMap,
        onSelectMap,
        pixiOnTokenDuplicate,
        pixiOnTokenCut,
        pixiOnTokenCopy,
        getActiveMapKey,
        handleRevealDamage,
        blasts,
        blastsNotInMap,
        onActivateDrawMode,
        onBlastDelete,
        onBlastCopy,
        onBlastCut,
        onBlastLock,
        tokenClipboard,
        dimensions,
        isMeasuring,
        isWallMode,
        wallDrawingShape,
        isErasingWalls,
        walls,
        setPendingCount,
        acceptAllRef,
        cancelAllRef,
        wallAlpha,
        pixiOnTokenDrop,
        wallColorHex,
        setIsMeasuring,
        setIsWallMode,
        setIsErasingWalls,
        setIsTokenPanelOpen,
        setIsInitiativePanelOpen,
        setWallDrawingShape,
        onDeleteMap,
        onDeleteAllTokens,
        onDeleteToken,
        setDefaultTokens,
        setTokensNotInMap,
        pixiOnWallDraw,
        pixiOnBindPendingControls,
        pixiOnBindFit,
        pixiOnTokenMove,
        onTokenClick,
        openDeleteAllTokensDialog,
        openDeleteAllWallsDialog,
        openDeleteAllBlastsDialog,
        pixiOnCutAllTokens,
        pixiOnPasteToken,
        pixiOnPasteBlast,
        tokens,
        tokensNotInMap,
        mapTexture,
        images,
        pendingCount,
        deleteMapDialogOpen,
        deleteAllTokensDialogOpen,
        setDeleteMapDialogOpen,
        deleteTokenDialogOpen,
        deleteAllWallsDialogOpen,
        tokenDialogsOpen,
        gridColorAnchor,
        wallColorAnchor,
        fullscreenImage,
        resolveImageUrl,
        onUploadImage,
        handleUpdateInitiative,
        panelInitOnMeleeAttack,
        panelInitOnRangedAttack,
        panelInitOnSkillCheck,
        panelInitOnGrenadeAttack,
        panelInitOnNextTurn,
        panelInitOnToggleCombat,
        onDeleteAllWalls,
        onDeleteAllBlasts,
        setWallColorHex,
        setWallAlpha,
        paperRef,
        deleteAllBlastsDialogOpen,
        setGridColorAnchor,
        setWallColorAnchor,
        rollHistory,
        setIsRollHistoryOpen,
        setIsBlastPanelOpen,
        blastClipboard,
        defaultTokens,
        gridSize,
        setGridSize,
        gridColorHex,
        gridAlpha,
        snapToGrid,
        setSnapToGrid,
        isTokenPanelOpen,
        setTokens,
        openDeleteTokenDialog,
        closeDeleteTokenDialog,
        setFullscreenImage,
        initiativeRolls,
        activeTokenId,
        currentRound,
        autoRerollInitiative,
        isCombatActive,
        isSeriouslyWounded,
        panelInitOnUpdateTokenCurrent,
        isInitiativePanelOpen,
        autoRollDamage,
        isRollHistoryOpen,
        isBlastPanelOpen,
        blastDrawMode,
        fitRef,
        setBlastDrawMode,
        setGridColorHex,
        setGridAlpha,
        panelOnTokenDuplicate,
        panelOnTokenCut,
        panelOnTokenCopy,
        panelInitOnSetAutoReroll,
        panelInitOnSetActiveToken,
        panelHistoryOnSetAutoRollDamage,
        panelHistoryOnClear,
        panelHistoryOnDelete,
        pixiOnBlastMove,
        pixiOnBlastComplete,
        pixiOnBlastDrop,
        pixiOnBlastUpdateCone,
        pixiSidePanelWidth,
        pixiReady,
        setPixiReady,
        closeDeleteAllTokensDialog,
        closeDeleteAllWallsDialog,
        closeDeleteAllBlastsDialog,
    } = useCombatSim()

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <CombatSimHeader
                maps={maps}
                currentMap={currentMap}
                sortedMaps={sortedMaps}
                onReplaceMap={onReplaceMap}
                onUploadMap={onUploadMap}
                onSelectMap={onSelectMap}
                gridSize={gridSize}
                setGridSize={setGridSize}
                gridColorHex={gridColorHex}
                gridAlpha={gridAlpha}
                setGridColorAnchor={setGridColorAnchor}
                snapToGrid={snapToGrid}
                setSnapToGrid={setSnapToGrid}
                setDeleteMapDialogOpen={setDeleteMapDialogOpen}
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
                    isTokenPanelOpen={isTokenPanelOpen}
                    onTokenDialogOpen={onTokenClick}
                    getActiveMapKey={getActiveMapKey}
                    setTokens={setTokens}
                    resolveImageUrl={resolveImageUrl}
                    gridSize={gridSize}
                    tokens={tokens}
                    tokensNotInMap={tokensNotInMap}
                    defaultTokens={defaultTokens}
                    openDeleteTokenDialog={openDeleteTokenDialog}
                    panelTokenDuplicate={panelOnTokenDuplicate}
                    panelTokenCut={panelOnTokenCut}
                    panelTokenCopy={panelOnTokenCopy}
                    isInitiativePanelOpen={isInitiativePanelOpen}
                    initiativeRolls={initiativeRolls}
                    activeTokenId={activeTokenId}
                    currentRound={currentRound}
                    autoRerollInitiative={autoRerollInitiative}
                    panelInitOnSetAutoReroll={panelInitOnSetAutoReroll}
                    panelInitOnSetActiveToken={panelInitOnSetActiveToken}
                    handleNextTurn={panelInitOnNextTurn}
                    handleUpdateTokenCurrent={panelInitOnUpdateTokenCurrent}
                    handleUpdateInitiative={handleUpdateInitiative}
                    handleMeleeAttack={panelInitOnMeleeAttack}
                    handleRangedAttack={panelInitOnRangedAttack}
                    handleSkillCheck={panelInitOnSkillCheck}
                    handleGrenadeAttack={panelInitOnGrenadeAttack}
                    isCombatActive={isCombatActive}
                    handleToggleCombat={panelInitOnToggleCombat}
                    isSeriouslyWounded={isSeriouslyWounded}
                    isRollHistoryOpen={isRollHistoryOpen}
                    rollHistory={rollHistory}
                    autoRollDamage={autoRollDamage}
                    panelHistoryOnSetAutoRollDamage={panelHistoryOnSetAutoRollDamage}
                    panelHistoryOnClear={panelHistoryOnClear}
                    panelHistoryOnDelete={panelHistoryOnDelete}
                    handleRevealDamage={handleRevealDamage}
                    isBlastPanelOpen={isBlastPanelOpen}
                    blasts={blasts}
                    blastsNotInMap={blastsNotInMap}
                    blastDrawMode={blastDrawMode}
                    onActivateDrawMode={onActivateDrawMode}
                    onBlastDelete={onBlastDelete}
                    onBlastCopy={onBlastCopy}
                    onBlastCut={onBlastCut}
                    onBlastLock={onBlastLock}
                />

                {/* Pixi board */}
                <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <PixiBoard
                        pixiReady={pixiReady}
                        setPixiReady={setPixiReady}
                        tokenClipboard={tokenClipboard}
                        gridSize={gridSize}
                        width={dimensions.width}
                        height={dimensions.height}
                        snapToGrid={snapToGrid}
                        isMeasuring={isMeasuring}
                        isWallMode={isWallMode}
                        wallDrawingShape={wallDrawingShape}
                        isErasingWalls={isErasingWalls}
                        isCombatActive={isCombatActive}
                        mapKey={getActiveMapKey()}
                        walls={walls}
                        onWallsChange={pixiOnWallDraw}
                        onPendingCountChange={setPendingCount}
                        onBindPendingControls={pixiOnBindPendingControls}
                        onBindFit={pixiOnBindFit}
                        mapTexture={mapTexture}
                        tokens={tokens}
                        images={images}
                        onTokenMove={pixiOnTokenMove}
                        gridColor={hexToPixi(gridColorHex)}
                        gridAlpha={gridAlpha}
                        wallColor={hexToPixi(wallColorHex)}
                        wallAlpha={wallAlpha}
                        onTokenClick={onTokenClick}
                        openDeleteTokenDialog={openDeleteTokenDialog}
                        pixiOnTokenDuplicate={pixiOnTokenDuplicate}
                        pixiOnTokenCut={pixiOnTokenCut}
                        pixiOnTokenCopy={pixiOnTokenCopy}
                        onMapDeleteAllTokens={openDeleteAllTokensDialog}
                        onMapDeleteAllWalls={openDeleteAllWallsDialog}
                        onMapDeleteAllBlasts={openDeleteAllBlastsDialog}
                        onMapCutAllTokens={pixiOnCutAllTokens}
                        onMapPasteToken={pixiOnPasteToken}
                        onMapPasteBlast={pixiOnPasteBlast}
                        activeTokenId={activeTokenId}
                        blastClipboard={blastClipboard}
                        onTokenDrop={pixiOnTokenDrop}
                        blasts={blasts}
                        blastsNotInMap={blastsNotInMap}
                        blastDrawMode={blastDrawMode}
                        onBlastDrop={pixiOnBlastDrop}
                        onBlastMove={pixiOnBlastMove}
                        onBlastComplete={pixiOnBlastComplete}
                        onBlastUpdateCone={pixiOnBlastUpdateCone}
                        onBlastDelete={onBlastDelete}
                        onBlastCopy={onBlastCopy}
                        onBlastCut={onBlastCut}
                        onBlastLock={onBlastLock}
                        pixiSidePanelWidth={pixiSidePanelWidth}
                    />
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
                        isRollHistoryOpen={isRollHistoryOpen}
                        setIsRollHistoryOpen={setIsRollHistoryOpen}
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
                    onClose={closeDeleteAllTokensDialog}
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
                    onClose={closeDeleteTokenDialog}
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
                    onClose={closeDeleteAllWallsDialog}
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
                    onClose={closeDeleteAllBlastsDialog}
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
                    maps={sortedMaps}
                    tokenDialogOpen={tokenId}
                    setTokenDialogOpen={onTokenClick}
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
                    openDeleteTokenDialog={openDeleteTokenDialog}
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
