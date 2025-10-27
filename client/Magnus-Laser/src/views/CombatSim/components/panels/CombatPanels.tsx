import { Blast, BlastType, RollHistoryEntry, Token } from '@/views/CombatSim/types'
import BlastsPanel from './BlastsPanel'
import InitiativePanel from './InitiativePanel'
import RollHistoryPanel from './RollHistoryPanel'
import TokenPanel from './TokenPanel'

interface CombatPanelsProps {
    isTokenPanelOpen: boolean
    onTokenDialogOpen: (tokenId: string | undefined) => void
    getActiveMapKey: () => string
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>
    resolveImageUrl: (imageId: string | undefined) => string | undefined
    gridSize: number
    tokens: Token[]
    tokensNotInMap: Token[]
    defaultTokens: Token[]
    openDeleteTokenDialog: (id: string) => void
    panelTokenDuplicate: (id: string) => void
    panelTokenCut: (id: string) => void
    panelTokenCopy: (id: string) => void
    isInitiativePanelOpen: boolean
    initiativeRolls: Map<string, number>
    activeTokenId: string | null
    currentRound: number
    autoRerollInitiative: boolean
    panelInitOnSetAutoReroll: (value: boolean) => void
    panelInitOnSetActiveToken: (tokenId: string) => void
    handleNextTurn: () => void
    handleUpdateTokenCurrent: (tokenId: string, field: 'health' | 'sph' | 'spb', value: number) => void
    handleUpdateInitiative: (tokenId: string, value: number) => void
    handleMeleeAttack: (token: Token) => Promise<void>
    handleRangedAttack: (token: Token) => Promise<void>
    handleSkillCheck: (token: Token) => Promise<void>
    handleGrenadeAttack: (token: Token) => Promise<void>
    isCombatActive: boolean
    handleToggleCombat: () => void
    isSeriouslyWounded: (token: Token) => boolean
    isRollHistoryOpen: boolean
    rollHistory: RollHistoryEntry[]
    autoRollDamage: boolean
    panelHistoryOnSetAutoRollDamage: (value: boolean) => void
    panelHistoryOnClear: () => void
    panelHistoryOnDelete: (id: string) => void
    handleRevealDamage: (id: string) => void
    isBlastPanelOpen: boolean
    blasts: Blast[]
    blastsNotInMap: Blast[]
    blastDrawMode: BlastType | null
    onActivateDrawMode: (type: BlastType) => void
    onBlastDelete: (id: string) => void
    onBlastCopy: (id: string) => void
    onBlastCut: (id: string) => void
    onBlastLock: (id: string, locked: boolean) => void
}

const CombatPanels = (props: CombatPanelsProps) => {
    const {
        isTokenPanelOpen,
        onTokenDialogOpen,
        getActiveMapKey,
        setTokens,
        resolveImageUrl,
        gridSize,
        tokens,
        tokensNotInMap,
        defaultTokens,
        openDeleteTokenDialog: setDeleteTokenDialogOpen,
        panelTokenDuplicate,
        panelTokenCut,
        panelTokenCopy,
        isInitiativePanelOpen,
        initiativeRolls,
        activeTokenId,
        currentRound,
        autoRerollInitiative,
        panelInitOnSetAutoReroll,
        panelInitOnSetActiveToken,
        handleNextTurn,
        handleUpdateTokenCurrent,
        handleUpdateInitiative,
        handleMeleeAttack,
        handleRangedAttack,
        handleSkillCheck,
        handleGrenadeAttack,
        isCombatActive,
        handleToggleCombat,
        isSeriouslyWounded,
        isRollHistoryOpen,
        rollHistory,
        autoRollDamage,
        panelHistoryOnSetAutoRollDamage,
        panelHistoryOnClear,
        panelHistoryOnDelete,
        handleRevealDamage,
        isBlastPanelOpen,
        blasts,
        blastsNotInMap,
        blastDrawMode,
        onActivateDrawMode,
        onBlastDelete,
        onBlastCopy,
        onBlastCut,
        onBlastLock,
    } = props
    return (
        <>
            {isTokenPanelOpen && (
                <TokenPanel
                    isSidePanelOpen={isTokenPanelOpen}
                    setTokenDialogOpen={onTokenDialogOpen}
                    getActiveMapKey={getActiveMapKey}
                    setTokens={setTokens}
                    resolveImageUrl={resolveImageUrl}
                    gridSize={gridSize}
                    tokens={tokens}
                    tokensNotInMap={tokensNotInMap}
                    defaultTokens={defaultTokens}
                    onTokenDelete={setDeleteTokenDialogOpen}
                    onTokenDuplicate={panelTokenDuplicate}
                    onTokenCut={panelTokenCut}
                    onTokenCopy={panelTokenCopy}
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
                    onSetAutoReroll={panelInitOnSetAutoReroll}
                    onTokenClick={panelInitOnSetActiveToken}
                    onNextTurn={handleNextTurn}
                    onUpdateTokenCurrent={handleUpdateTokenCurrent}
                    onUpdateInitiative={handleUpdateInitiative}
                    onMeleeAttack={handleMeleeAttack}
                    onRangedAttack={handleRangedAttack}
                    onSkillCheck={handleSkillCheck}
                    onGrenadeAttack={handleGrenadeAttack}
                    resolveImageUrl={resolveImageUrl}
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
                    onSetAutoRollDamage={panelHistoryOnSetAutoRollDamage}
                    onClear={panelHistoryOnClear}
                    onDelete={panelHistoryOnDelete}
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
        </>
    )
}

export default CombatPanels
