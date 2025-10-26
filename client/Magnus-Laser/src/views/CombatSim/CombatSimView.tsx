import ColorPopper from '@/views/CombatSim/components/ColorPopper'
import FloatingButtons from '@/views/CombatSim/components/FloatingButtons'
import ImageDialog from '@/views/CombatSim/components/ImageDialog'
import { toAlphaHex } from '@/views/CombatSim/pixiUtils'
import useCombatSim from '@/views/CombatSim/useCombatSim'
import { FindReplace, Upload } from '@mui/icons-material'
import Close from '@mui/icons-material/Close'
import { Box, Button, Container, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton'
import CyberpunkCheckbox from '../../components/CyberpunkCheckbox'
import CyberpunkFormControlLabel from '../../components/CyberpunkFormControlLabel'
import GenerateButton from '../../components/GenerateButton'
import { WarningDialog } from '../../components/common/WarningDialog'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { db } from '../../utils/db'
import BlastsPanel from './BlastsPanel'
import InitiativePanel from './InitiativePanel'
import PixiBoard from './PixiBoard'
import RollHistoryPanel from './RollHistoryPanel'
import TokenDetailsDialog from './TokenDetailsDialog'
import TokenPanel from './TokenPanel'
import type { Token } from './types'

const CombatSimView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const {
        maps,
        currentMap,
        sortedMaps,
        fieldSx,
        onReplaceMap,
        onUploadMap,
        onSelectMap,
        onTokenDuplicate,
        onTokenCut,
        onTokenCopy,
        getActiveMapKey,
        saveInitiativeData,
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
        hexToPixi,
        wallAlpha,
        setClearAllDialogOpen,
        handleTokenDrop,
        onBlastMove,
        onBlastComplete,
        wallColorHex,
        handleBlastDrop,
        setIsMeasuring,
        setIsWallMode,
        setIsErasingWalls,
        setIsTokenPanelOpen,
        setIsInitiativePanelOpen,
        setWallDrawingShape,
        onDeleteMap,
        onResetView,
        onDeleteToken,
        setDefaultTokens,
        setTokensNotInMap,
        onWallChange,
        onBindPendingControls,
        onBindFit,
        onTokenMove,
        onTokenClick,
        onMapDeleteAllTokens,
        onMapDeleteAllWalls,
        onMapDeleteAllBlasts,
        onMapCutAllTokens,
        onMapPasteToken,
        onMapPasteBlast,
        onBlastUpdateCone,
        sidePanelWidth,
        tokens,
        tokensNotInMap,
        mapTexture,
        images,
        pendingCount,
        deleteMapDialogOpen,
        clearAllDialogOpen,
        setDeleteMapDialogOpen,
        deleteTokenDialogOpen,
        deleteAllWallsDialogOpen,
        tokenDialogsOpen,
        gridColorAnchor,
        wallColorAnchor,
        fullscreenImage,
        pixiToCss,
        resolveImageUrl,
        onUploadImage,
        handleUpdateInitiative,
        handleMeleeAttack,
        handleRangedAttack,
        handleSkillCheck,
        handleGrenadeAttack,
        handleNextTurn,
        handleToggleCombat,
        onDeleteAllWalls,
        toggleFullscreenImage,
        onDeleteAllBlasts,
        setWallColorHex,
        setWallAlpha,
        paperRef,
        ready,
        deleteAllBlastsDialogOpen,
        setGridColorAnchor,
        setWallColorAnchor,
        setReady,
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
        setTokenDialogsOpen,
        setTokens,
        setTokenClipboard,
        setDeleteTokenDialogOpen,
        setFullscreenImage,
        setDeleteAllBlastsDialogOpen,
        initiativeRolls,
        activeTokenId,
        currentRound,
        autoRerollInitiative,
        setAutoRerollInitiative,
        isCombatActive,
        isSeriouslyWounded,
        handleUpdateTokenCurrent,
        setDeleteAllWallsDialogOpen,
        isInitiativePanelOpen,
        autoRollDamage,
        setActiveTokenId,
        isRollHistoryOpen,
        setAutoRollDamage,
        setRollHistory,
        isBlastPanelOpen,
        blastDrawMode,
        fitRef,
        setBlastDrawMode,
        setGridColorHex,
        setGridAlpha,
    } = useCombatSim()

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('combatSim.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: { xs: 1, xxl: 0 },
                        display: { xs: 'none', xl: 'flex' },
                    }}
                >
                    {t('combatSim.title')}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                        textShadow: `0 0 8px ${colors.neons.green.default}`,
                        flexGrow: 1,
                        display: { xs: 'none', xxl: 'flex' },
                    }}
                >
                    {t(`modules.${ModuleTypes.COMBAT_SIM}_DESCRIPTION`)}
                </Typography>
                <Stack
                    direction="row"
                    sx={{
                        mb: 1,
                        flexWrap: 'wrap-reverse',
                        gap: 1,
                        justifyContent: 'flex-end',
                    }}
                >
                    <ClearAllButton
                        disabled={maps.length === 0}
                        handleClearAllClick={() => document.getElementById('combatsim-replace-map')?.click()}
                        label={<FindReplace />}
                        title={t('combatSim.replaceMap')}
                    />
                    <GenerateButton
                        isGenerating={false}
                        handleGenerate={() => document.getElementById('combatsim-upload-map')?.click()}
                        label={<Upload />}
                        title={t('combatSim.addMap')}
                    />
                    <input
                        id="combatsim-replace-map"
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f)
                                onReplaceMap(f)
                                // reset value so selecting the same file again still fires change
                            ;(e.target as HTMLInputElement).value = ''
                        }}
                    />
                    <input
                        id="combatsim-upload-map"
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f)
                                onUploadMap(f)
                                // reset value so selecting the same file again still fires change
                            ;(e.target as HTMLInputElement).value = ''
                        }}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            disabled={maps.length === 0}
                            control={
                                <Select
                                    displayEmpty
                                    value={
                                        sortedMaps.find((m) => m.id === currentMap?.mapId)?.id ??
                                        sortedMaps[0]?.id ??
                                        ''
                                    }
                                    onChange={(e) => onSelectMap(String(e.target.value))}
                                    sx={{ ml: 1, width: 150, height: 36.5, ...fieldSx }}
                                    slotProps={{
                                        input: {
                                            sx: {
                                                color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default,
                                            },
                                        },
                                    }}
                                >
                                    {sortedMaps
                                        .map((a) => ({ id: a.id, name: a.name }))
                                        .map((a) => (
                                            <MenuItem key={a.id} value={a.id}>
                                                {a.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            }
                            label={t('combatSim.map')}
                            labelPlacement="start"
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                            <CyberpunkFormControlLabel
                                readerMode={readerMode}
                                labelPlacement="start"
                                control={
                                    <TextField
                                        type="number"
                                        slotProps={{
                                            input: {
                                                sx: {
                                                    width: 70,
                                                    '& input[type=number]': {
                                                        MozAppearance: 'textfield',
                                                    },
                                                    '& input[type=number]::-webkit-outer-spin-button': {
                                                        WebkitAppearance: 'none',
                                                        margin: 0,
                                                    },
                                                    '& input[type=number]::-webkit-inner-spin-button': {
                                                        WebkitAppearance: 'none',
                                                        margin: 0,
                                                    },
                                                },
                                            },
                                        }}
                                        value={gridSize}
                                        onChange={(e) => {
                                            let val = parseFloat(e.target.value)
                                            if (e.target.value === '') {
                                                val = 100
                                            }
                                            if (!Number.isNaN(val) && val > 0) setGridSize(val)
                                        }}
                                        sx={{ width: '100%', ...fieldSx }}
                                    />
                                }
                                label={t('combatSim.gridSize')}
                            />
                            <Box
                                onClick={(e) => {
                                    setGridColorAnchor((prev) => (prev ? null : e.currentTarget))
                                }}
                                sx={{
                                    cursor: 'pointer',
                                    height: '24px',
                                    width: '24px',
                                    bgcolor: `${gridColorHex}${toAlphaHex(gridAlpha)}`,
                                    borderRadius: '3px',
                                    border: `1px solid ${readerMode ? colors.neons.cyan.dark : colors.neons.cyan.dark}`,
                                }}
                                title={t('combatSim.gridColor')}
                            />
                            <CyberpunkFormControlLabel
                                readerMode={readerMode}
                                control={
                                    <CyberpunkCheckbox
                                        readerMode={readerMode}
                                        checked={snapToGrid}
                                        onChange={(e) => setSnapToGrid(e.target.checked)}
                                    />
                                }
                                label={t('combatSim.snapToGrid')}
                            />
                        </Stack>
                        <Button
                            onClick={() => {
                                setDeleteMapDialogOpen(true)
                            }}
                            disabled={maps.find((m) => m.id === currentMap?.mapId)?.name === 'Empty Map'}
                            sx={{
                                minWidth: '30px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '2px',
                                p: 0,
                                bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                border: readerMode ? '1px solid #d32f2f' : `1px solid ${colors.neons.red.default}60`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                position: 'relative',
                                fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                fontWeight: 'bold',
                                '&::before': !readerMode
                                    ? {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '1px',
                                          background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                          opacity: 0.7,
                                      }
                                    : {},
                                '&:hover': readerMode
                                    ? {
                                          bgcolor: '#f0f0f0',
                                          color: '#b71c1c',
                                      }
                                    : {
                                          bgcolor: 'rgba(60, 0, 0, 0.6)',
                                          color: colors.neons.red.light,
                                          boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                          '&::after': {
                                              opacity: 0.8,
                                              height: '100%',
                                          },
                                      },
                                '&::after': !readerMode
                                    ? {
                                          content: '""',
                                          position: 'absolute',
                                          bottom: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '0%',
                                          opacity: 0,
                                          background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                          transition: 'all 0.2s',
                                      }
                                    : {},
                            }}
                        >
                            <Close sx={{ textShadow: `0 0 5px ${colors.neons.red.default}`, zIndex: 2 }} />
                        </Button>
                    </Stack>
                </Stack>
            </Stack>

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
                {isTokenPanelOpen && (
                    <TokenPanel
                        isSidePanelOpen={isTokenPanelOpen}
                        setTokenDialogOpen={(id: string | undefined) => {
                            if (id) {
                                setTokenDialogsOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
                            }
                        }}
                        getActiveMapKey={getActiveMapKey}
                        setTokens={setTokens}
                        pixiToCss={pixiToCss}
                        resolveImageUrl={resolveImageUrl}
                        gridSize={gridSize}
                        tokens={tokens}
                        tokensNotInMap={tokensNotInMap}
                        defaultTokens={defaultTokens}
                        onTokenDelete={(id) => setDeleteTokenDialogOpen(id)}
                        onTokenDuplicate={async (id) => {
                            const token = [...defaultTokens, ...tokens, ...tokensNotInMap].find((t) => t.id === id)
                            if (token) {
                                // Check if it's a default token to apply numbering
                                const isDefaultToken = defaultTokens.some((t) => t.id === id)
                                let newName = token.name

                                if (isDefaultToken) {
                                    // Count existing copies with the same base name
                                    const baseName = token.name
                                    const existingCopies = [...tokens, ...tokensNotInMap].filter((t) => {
                                        return t.name.startsWith(baseName + ' ') || t.name === baseName
                                    })
                                    const copyNumber = existingCopies.length + 1
                                    newName = `${baseName} ${copyNumber}`
                                }

                                const newToken: Token = {
                                    ...token,
                                    name: newName,
                                    radius: Math.max(1, Math.floor(gridSize / 2)),
                                    id: globalThis.crypto?.randomUUID
                                        ? globalThis.crypto.randomUUID()
                                        : String(Date.now()),
                                    mapId: getActiveMapKey(),
                                    // Keep same position as original token
                                }
                                await db.tokens.add(newToken)
                                setTokens((prev) => [...prev, newToken])
                            }
                        }}
                        onTokenCut={async (id) => {
                            // Check in both tokens and tokensNotInMap
                            const tokenInMap = tokens.find((t) => t.id === id)
                            const tokenNotInMap = tokensNotInMap.find((t) => t.id === id)
                            const token = tokenInMap || tokenNotInMap
                            if (token) {
                                const newToken: Token = {
                                    ...token,
                                    radius: Math.max(1, Math.floor(gridSize / 2)),
                                }
                                setTokenClipboard([newToken])
                                // Cut removes the token but stores it in clipboard
                                if (tokenInMap) {
                                    setTokens((prev) => prev.filter((t) => t.id !== id))
                                } else {
                                    setTokensNotInMap((prev) => prev.filter((t) => t.id !== id))
                                }
                                await db.tokens.delete(id)
                            }
                        }}
                        onTokenCopy={(id) => {
                            const token = [...defaultTokens, ...tokens, ...tokensNotInMap].find((t) => t.id === id)
                            if (token) {
                                // Check if it's a default token to apply numbering
                                const isDefaultToken = defaultTokens.some((t) => t.id === id)
                                let newName = token.name + ' (Copy)'

                                if (isDefaultToken) {
                                    // Count existing copies with the same base name
                                    const baseName = token.name
                                    const existingCopies = [...tokens, ...tokensNotInMap].filter((t) => {
                                        return t.name.startsWith(baseName + ' ') || t.name === baseName
                                    })
                                    const copyNumber = existingCopies.length + 1
                                    newName = `${baseName} ${copyNumber}`
                                }

                                // Create a copy with new ID for clipboard
                                const clipboardToken = {
                                    ...token,
                                    name: newName,
                                    radius: Math.max(1, Math.floor(gridSize / 2)),
                                    id: globalThis.crypto?.randomUUID
                                        ? globalThis.crypto.randomUUID()
                                        : String(Date.now()),
                                }
                                setTokenClipboard([clipboardToken])
                            }
                        }}
                    />
                )}

                {isInitiativePanelOpen && (
                    <InitiativePanel
                        isSidePanelOpen={isInitiativePanelOpen}
                        tokens={tokens}
                        initiativeRolls={initiativeRolls}
                        activeTokenId={activeTokenId}
                        currentRound={currentRound}
                        autoRerollInitiative={autoRerollInitiative}
                        onSetAutoReroll={async (value: boolean) => {
                            setAutoRerollInitiative(value)
                            await saveInitiativeData(
                                activeTokenId,
                                currentRound,
                                isCombatActive,
                                value,
                                autoRollDamage,
                                initiativeRolls
                            )
                        }}
                        onTokenClick={async (tokenId: string) => {
                            setActiveTokenId(tokenId)
                            // Reset movement when token becomes active
                            const token = tokens.find((t) => t.id === tokenId)
                            if (token?.stats) {
                                handleUpdateTokenCurrent(tokenId, 'movement', token.stats.movement)
                            }
                            // Save with the new activeTokenId
                            await saveInitiativeData(
                                tokenId,
                                currentRound,
                                isCombatActive,
                                autoRerollInitiative,
                                autoRollDamage,
                                initiativeRolls
                            )
                        }}
                        onNextTurn={handleNextTurn}
                        onUpdateTokenCurrent={handleUpdateTokenCurrent}
                        onUpdateInitiative={handleUpdateInitiative}
                        onMeleeAttack={handleMeleeAttack}
                        onRangedAttack={handleRangedAttack}
                        onSkillCheck={handleSkillCheck}
                        onGrenadeAttack={handleGrenadeAttack}
                        resolveImageUrl={resolveImageUrl}
                        pixiToCss={pixiToCss}
                        isCombatActive={isCombatActive}
                        onToggleCombat={handleToggleCombat}
                        isSeriouslyWounded={isSeriouslyWounded}
                    />
                )}

                {isRollHistoryOpen && (
                    <RollHistoryPanel
                        isOpen={isRollHistoryOpen}
                        rollHistory={rollHistory}
                        autoRollDamage={autoRollDamage}
                        onSetAutoRollDamage={async (value: boolean) => {
                            setAutoRollDamage(value)
                            await saveInitiativeData(
                                activeTokenId,
                                currentRound,
                                isCombatActive,
                                autoRerollInitiative,
                                value,
                                initiativeRolls
                            )
                        }}
                        onClear={async () => {
                            setRollHistory([])
                            if (currentMap?.mapId) {
                                await db.rollHistory.where('mapId').equals(currentMap.mapId).delete()
                            }
                        }}
                        onDelete={async (id) => {
                            setRollHistory((prev) => prev.filter((entry) => entry.id !== id))
                            await db.rollHistory.delete(id)
                        }}
                        onRevealDamage={handleRevealDamage}
                    />
                )}

                {isBlastPanelOpen && (
                    <BlastsPanel
                        isSidePanelOpen={isBlastPanelOpen}
                        gridSize={gridSize}
                        blasts={blasts}
                        blastsNotInMap={blastsNotInMap}
                        blastDrawMode={blastDrawMode}
                        onActivateDrawMode={onActivateDrawMode}
                        onBlastDelete={onBlastDelete}
                        onBlastCopy={onBlastCopy}
                        onBlastCut={onBlastCut}
                        onBlastLock={onBlastLock}
                        mapKey={getActiveMapKey()}
                    />
                )}

                {/* Pixi board */}
                <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <PixiBoard
                        ready={ready}
                        setReady={setReady}
                        tokenClipboard={tokenClipboard}
                        width={dimensions.width}
                        height={dimensions.height}
                        gridSize={gridSize}
                        snapToGrid={snapToGrid}
                        isMeasuring={isMeasuring}
                        isWallMode={isWallMode}
                        wallDrawingShape={wallDrawingShape}
                        isErasingWalls={isErasingWalls}
                        isCombatActive={isCombatActive}
                        mapKey={getActiveMapKey()}
                        walls={walls}
                        onWallsChange={onWallChange}
                        onPendingCountChange={setPendingCount}
                        onBindPendingControls={onBindPendingControls}
                        onBindFit={onBindFit}
                        mapTexture={mapTexture}
                        tokens={tokens}
                        images={images}
                        onTokenMove={onTokenMove}
                        gridColor={hexToPixi(gridColorHex)}
                        gridAlpha={gridAlpha}
                        wallColor={hexToPixi(wallColorHex)}
                        wallAlpha={wallAlpha}
                        onTokenClick={onTokenClick}
                        onTokenDelete={setDeleteTokenDialogOpen}
                        onTokenDuplicate={onTokenDuplicate}
                        onTokenCut={onTokenCut}
                        onTokenCopy={onTokenCopy}
                        onMapDeleteAllTokens={onMapDeleteAllTokens}
                        onMapDeleteAllWalls={onMapDeleteAllWalls}
                        onMapDeleteAllBlasts={onMapDeleteAllBlasts}
                        onMapCutAllTokens={onMapCutAllTokens}
                        onMapPasteToken={onMapPasteToken}
                        onMapPasteBlast={onMapPasteBlast}
                        activeTokenId={activeTokenId}
                        blastClipboard={blastClipboard}
                        onTokenDrop={handleTokenDrop}
                        blasts={blasts}
                        blastsNotInMap={blastsNotInMap}
                        blastDrawMode={blastDrawMode}
                        onBlastDrop={handleBlastDrop}
                        onBlastMove={onBlastMove}
                        onBlastComplete={onBlastComplete}
                        onBlastUpdateCone={onBlastUpdateCone}
                        onBlastDelete={onBlastDelete}
                        onBlastCopy={onBlastCopy}
                        onBlastCut={onBlastCut}
                        onBlastLock={onBlastLock}
                        sidePanelWidth={sidePanelWidth}
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
            <WarningDialog
                open={deleteMapDialogOpen}
                onClose={() => setDeleteMapDialogOpen(false)}
                onConfirm={() => {
                    onDeleteMap().then(() => {
                        setDeleteMapDialogOpen(false)
                    })
                }}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteConfirmMessage', {
                    type: t(`modules.${ModuleTypes.COMBAT_SIM}`).toLowerCase(),
                })}
                moduleType={ModuleTypes.COMBAT_SIM}
                isDelete={true}
                isClearAll={false}
            />
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={() => setClearAllDialogOpen(false)}
                onConfirm={() => {
                    onResetView().then(() => {
                        setClearAllDialogOpen(false)
                    })
                }}
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
                onConfirm={() => {
                    onDeleteToken().then(() => {
                        setDeleteTokenDialogOpen(null)
                    })
                }}
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
                onConfirm={() => {
                    onDeleteAllWalls().then(() => {
                        setDeleteAllWallsDialogOpen(false)
                    })
                }}
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
                onConfirm={() => {
                    onDeleteAllBlasts().then(() => {
                        setDeleteAllBlastsDialogOpen(false)
                    })
                }}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', {
                    type: 'walls',
                })}
                moduleType={ModuleTypes.COMBAT_SIM}
                isDelete={true}
                isClearAll={true}
            />

            {/* Token dialogs */}
            {tokenDialogsOpen.map((tokenId, index) => (
                <TokenDetailsDialog
                    key={tokenId}
                    maps={sortedMaps}
                    tokenDialogOpen={tokenId}
                    setTokenDialogOpen={(id) =>
                        setTokenDialogsOpen((prev) => prev.filter((dialogId) => dialogId !== id))
                    }
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
                    onDeleteToken={(id) => setDeleteTokenDialogOpen(id)}
                    onUploadImage={onUploadImage}
                    toggleFullscreenImage={toggleFullscreenImage}
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
