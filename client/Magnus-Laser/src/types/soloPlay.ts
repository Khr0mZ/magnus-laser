// ============================================
// SOLO PLAY TYPES - Single Player Mode System
// Based on Cyberpunk RED Single Player Mode
// ============================================

// === ORACLE SYSTEM TYPES ===
// Based on Closed Question Oracle table from Single Player Mode PDF

// Probability levels that determine the d100 ranges
export type OracleProbability =
    | 'CERTAIN'     // Very likely to be Yes
    | 'LIKELY'      // Probably Yes
    | 'FIFTY_FIFTY' // Equal chance
    | 'UNLIKELY'    // Probably No
    | 'IMPOSSIBLE'  // Very likely to be No

// The 5 possible Oracle answers
export type OracleAnswer =
    | 'NO'                  // Definite No
    | 'NO_WITH_COMPLICATION' // No, but with a twist
    | 'COMPLICATED'         // Ambiguous, conditional
    | 'YES_WITH_COMPLICATION' // Yes, but with a twist
    | 'YES'                 // Definite Yes

export interface OracleResult {
    id: string
    timestamp: number
    question: string
    probability: OracleProbability
    roll: number // d100 result
    answer: OracleAnswer
    notes?: string
}

export interface OpenQuestionResult {
    id: string
    timestamp: number
    question: string
    category: OpenQuestionCategory
    focus: string
    detail: string
    notes?: string
}

export type OpenQuestionCategory =
    | 'ACTION'
    | 'DESCRIPTION'
    | 'COMPLICATION'
    | 'NPC_ACTION'
    | 'NPC_MOOD'
    | 'LOCATION'
    | 'OBJECT'
    | 'EVENT'

// === SOLO PLAY CLOCK TYPES ===
// Based on PDF page 25 - Dice Pool system

export interface SoloPlayClock {
    id: string
    name: string
    description?: string
    // Dice Pool configuration
    initialDicePool: number // Starting number of d6s (typically 3-8)
    remainingDice: number // Current number of d6s in the pool
    // Trigger description (when to roll)
    trigger: string
    // Event that occurs when pool empties
    event: string
    // Difficulty variation
    scaleUp: boolean // If true, remove dice on 1 OR 6 (harder)
    // Roll history
    rollHistory: ClockRollResult[]
    // State
    isComplete: boolean
    createdAt: number
    completedAt?: number
}

export interface ClockRollResult {
    timestamp: number
    diceRolled: number[] // Results of each die
    diceRemoved: number // How many dice were removed (rolled 1, or 1/6 if scaleUp)
    remainingAfter: number // Remaining dice after this roll
    multipleOnesBonus: boolean // True if 2+ dice showed 1 (for Degrees of Consequence)
}

// === QUICK AND DIRTY COMBAT TYPES ===

// NPC Levels according to PDF
export type NPCLevel = 'MOOK' | 'LIEUTENANT' | 'MINI_BOSS' | 'BOSS'

// Morale mentality types
export type MoraleMentality =
    | 'LOST_TO_VIOLENCE' // 1-2 flee, 3-10 fight
    | 'EXPERIENCED' // 1-4 flee, 5-10 fight
    | 'TRAINED' // 1-6 flee, 7-10 fight
    | 'INEXPERIENCED' // 1-8 flee, 9-10 fight
    | 'UNSURE' // 1-9 flee, 10 fight

// Stress point conditions
export type StressPointType =
    | 'HALF_INCAPACITATED' // More than half incapacitated/dead
    | 'SERIOUSLY_WOUNDED' // Any enemy reaches Seriously Wounded
    | 'ROUND_5' // Combat hits Round 5
    | 'CUSTOM' // Custom condition

export interface MoraleConfig {
    stressPointType: StressPointType
    customCondition?: string
    mentality: MoraleMentality
    triggered: boolean
    result?: 'FLEE' | 'FIGHT'
    roll?: number
}

// Edgerunner combatant (Crew side)
export interface QDEdgerunner {
    id: string
    name: string
    // Hardened criteria - if ANY is true, the Edgerunner is Hardened
    hasHighRefEvasion: boolean // REF 8 with Evasion 6+
    hasHighAttack: boolean // STAT + Skill + Mod 15+
    hasHighWillBody: boolean // WILL + BODY 16+
    hasLuxuryWeapon: boolean // Luxury+ value weapon
    hasHighDexMov: boolean // DEX 8 + MOV 8
    hasHighAutoMartial: boolean // Autofire or Martial Arts 6+
    hasSoloRank4: boolean // Solo Rank 4+
    hasSpeedware: boolean // Has Sandevistan, Kerenzikov, etc.
    canDodgeBullets: boolean // Can negate one ranged attack
    weaponName: string
    weaponDamage: string // e.g., "3d6" for damage roll
    attackSkillTotal: number // STAT + Skill + Mod for attack rolls
    notes?: string
}

// Enemy combatant
export interface QDEnemy {
    id: string
    name: string
    level: NPCLevel
    isHardened: boolean
    hasSpeedware: boolean
    weaponName: string
    weaponDamage: string
    attackSkillTotal: number
    notes?: string
}

// Individual attack check result
export interface QDAttackCheck {
    id: string
    combatantId: string
    combatantName: string
    isEdgerunner: boolean
    roll: number
    total: number // roll + skill total
    fumbled: boolean // rolled a 1, loses next attack
    weaponUsed: string
    weaponDamage: string
}

// Comparison result between two attack checks
export interface QDComparison {
    edgerunnerAttack: QDAttackCheck | null
    enemyAttack: QDAttackCheck | null
    winner: 'EDGERUNNER' | 'ENEMY' | 'TIE' | 'UNOPPOSED_EDGERUNNER' | 'UNOPPOSED_ENEMY'
    dodged: boolean // If edgerunner used bullet dodge
    damageDealt?: number
    criticalInjury?: boolean
}

// Full combat session
export interface QDCombatSession {
    id: string
    name: string
    // Combatants
    edgerunners: QDEdgerunner[]
    enemies: QDEnemy[]
    // Tactics check
    tacticsWinner: 'EDGERUNNER' | 'ENEMY' | null
    tacticsEdgerunnerRoll?: number
    tacticsEnemyRoll?: number
    // Attack counts (calculated from Step 3)
    edgerunnerAttackCount: number
    enemyAttackCount: number
    // Combat execution
    edgerunnerAttacks: QDAttackCheck[]
    enemyAttacks: QDAttackCheck[]
    comparisons: QDComparison[]
    // Results
    edgerunnerHits: number
    enemyHits: number
    // Morale
    morale: MoraleConfig
    // Session state
    phase: QDCombatPhase
    isComplete: boolean
    outcome?: 'EDGERUNNER_WIN' | 'ENEMY_WIN' | 'DRAW' | 'ESCAPE' | 'ENEMY_FLED' | 'ENEMY_SURRENDERED'
    createdAt: number
    completedAt?: number
    notes?: string
}

export type QDCombatPhase =
    | 'SETUP' // Setting up combatants
    | 'TACTICS' // Making tactics check
    | 'COUNTING' // Counting attacks
    | 'ATTACKING' // Making attack checks
    | 'COMPARING' // Comparing results
    | 'OUTCOME' // Determining outcome
    | 'COMPLETE' // Combat finished

// === QUICK AND DIRTY NETRUN TYPES ===
// Based on PDF pages 24-25

// NET Architecture size determines number of checks
export type NetArchitectureSize = 'SMALL' | 'MEDIUM' | 'LARGE'
// SMALL: 3-6 floors = 3 checks
// MEDIUM: 7-12 floors = 5 checks
// LARGE: 13+ floors = 7 checks

// Types of checks in a Netrun
export type NetrunCheckType =
    | 'PASSWORD' // DV check to Backdoor
    | 'FILE' // DV check to Eye-Dee
    | 'CONTROL_NODE' // DV check to take control
    | 'BLACK_ICE' // Opposed check (Slide vs Perception or Attack vs Attack)

export interface QDNetrunCheck {
    checkNumber: number
    checkType: NetrunCheckType
    description: string // "DV6 Password" or "Asp Black ICE"
    dv?: number // For DV-based checks
    opposedStat?: number // For Black ICE (enemy's Perception or Attack)
    roll: number // Player's roll
    skillTotal: number // Player's skill total (INT + Interface or relevant)
    total: number // roll + skillTotal
    success: boolean
    blackIceHit: boolean // True if failed against Black ICE
    notes?: string
}

export interface QDNetrunSession {
    id: string
    name: string
    // Target information
    location: string
    goal: string
    architectureSize: NetArchitectureSize
    floors: number // Actual number of floors
    // Checks
    numberOfChecks: number // 3, 5, or 7 based on size
    checks: QDNetrunCheck[]
    currentCheck: number
    // Results
    isComplete: boolean
    success: boolean // True if majority of checks passed
    successCount: number
    failureCount: number
    // Black ICE consequences
    blackIceHits: number // Number of times hit by Black ICE
    unsafeJackout: boolean // True if failed and jacked out unsafely
    // Programs that might be destroyed
    programsLost: string[]
    // State
    createdAt: number
    completedAt?: number
    notes?: string
}

// === MISSION BUILDER TYPES ===

export interface SoloMission {
    id: string
    name: string
    whoIsHiring: MissionEmployer
    payment: MissionPayment
    missionSummary: string
    focusAndSpecifics: string
    twist?: string
    beats: BeatChartEntry[]
    status: MissionStatus
    notes?: string
    createdAt: number
    completedAt?: number
}

export type MissionStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABANDONED'

export interface MissionEmployer {
    type: EmployerType
    name: string
    description?: string
}

export type EmployerType =
    | 'FIXER'
    | 'CORPO'
    | 'GANG'
    | 'GOVERNMENT'
    | 'INDEPENDENT'
    | 'MEDIA'
    | 'NETRUNNER'
    | 'NOMAD'
    | 'CIVILIAN'

export interface MissionPayment {
    type: PaymentType
    amount?: number
    description: string
}

export type PaymentType =
    | 'EDDIES'
    | 'FAVOR'
    | 'INFORMATION'
    | 'EQUIPMENT'
    | 'CYBERWARE'
    | 'REPUTATION'
    | 'MIXED'

// === BEAT CHART TYPES ===

export interface BeatChartEntry {
    id: string
    beatType: BeatType
    description: string
    completed: boolean
    outcome?: string
}

export type BeatType =
    | 'HOOK'
    | 'DEVELOPMENT_1'
    | 'DEVELOPMENT_2'
    | 'DEVELOPMENT_3'
    | 'DEVELOPMENT_4'
    | 'DEVELOPMENT_5'
    | 'DEVELOPMENT_6'
    | 'DEVELOPMENT_7'
    | 'DEVELOPMENT_8'
    | 'DEVELOPMENT_9'
    | 'DEVELOPMENT_10'
    | 'CLIMAX'
    | 'RESOLUTION'

// === SCENE TRACKER TYPES ===

export interface SceneEntry {
    id: string
    sceneNumber: number
    location: string
    participants: string[]
    goal: string
    checks: SceneCheck[]
    outcome?: string
    notes?: string
    createdAt: number
}

export interface SceneCheck {
    checkNumber: number
    description: string
    success: boolean
}

// === RANDOM TABLES TYPES ===

export interface RandomTableEntry {
    id: string
    value: string
    weight?: number
}

export interface RandomTable {
    id: string
    name: string
    category: TableCategory
    entries: RandomTableEntry[]
}

export type TableCategory =
    | 'NPC'
    | 'LOCATION'
    | 'EVENT'
    | 'COMPLICATION'
    | 'MOTIVATION'
    | 'DESCRIPTOR'
    | 'OBJECT'
    | 'TWIST'
    | 'CLUE'
    | 'RUMOR'

// === IP TRACKING TYPES ===

export interface IPEntry {
    id: string
    edgerunnerName: string
    date: string
    spentOn: string
    ipAmount: number
}

export interface IPTracker {
    id: string
    edgerunnerName: string
    totalIP: number
    spentIP: number
    entries: IPEntry[]
}

// === SOLO PLAY SESSION STATE ===

export interface SoloPlaySession {
    id: string
    name: string
    createdAt: number
    lastModified: number
    oracleHistory: OracleResult[]
    openQuestionHistory: OpenQuestionResult[]
    clocks: SoloPlayClock[]
    currentMission?: SoloMission
    missions: SoloMission[]
    combatSessions: QDCombatSession[]
    netrunSessions: QDNetrunSession[]
    scenes: SceneEntry[]
    ipTrackers: IPTracker[]
    notes: string
}
