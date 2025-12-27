// ============================================
// SOLO PLAY UTILITY FUNCTIONS
// Based on Cyberpunk RED Single Player Mode
// ============================================

import { v4 as uuidv4 } from 'uuid'
import type {
    BeatChartEntry,
    BeatType,
    MissionEmployer,
    MissionPayment,
    MoraleMentality,
    MoraleConfig,
    NetArchitectureSize,
    NetrunCheckType,
    OpenQuestionCategory,
    OpenQuestionResult,
    OracleAnswer,
    OracleProbability,
    OracleResult,
    QDAttackCheck,
    QDComparison,
    QDCombatSession,
    QDEdgerunner,
    QDEnemy,
    QDNetrunCheck,
    QDNetrunSession,
    SceneCheck,
    SceneEntry,
    SoloMission,
    SoloPlayClock,
    SoloPlaySession,
} from '../../types/soloPlay'
import {
    actionFocusTable,
    clueTypeTable,
    complicationTable,
    corpoNameTable,
    detailFocusTable,
    eventTable,
    fixerNameTable,
    gangNameTable,
    getRandomFromArray,
    getRandomFromWeightedArray,
    locationTypeTable,
    missionTypeTable,
    npcAppearanceTable,
    npcMoodTable,
    npcMotivationTable,
    npcOccupationTable,
    paymentTypeTable,
    rollD10,
    rollD6,
    rumorTable,
    twistTable,
    whoIsHiringTable,
} from './soloPlayTables'

// ============================================
// ORACLE SYSTEM
// Based on Closed Question Oracle table from Single Player Mode PDF
// ============================================

/**
 * Oracle probability ranges for d100
 * Each probability level has different ranges for each answer
 */
const ORACLE_RANGES: Record<OracleProbability, { no: number; noComp: number; comp: number; yesComp: number }> = {
    CERTAIN: { no: 5, noComp: 10, comp: 15, yesComp: 40 },      // 1-5, 6-10, 11-15, 16-40, 41-100
    LIKELY: { no: 15, noComp: 25, comp: 35, yesComp: 55 },      // 1-15, 16-25, 26-35, 36-55, 56-100
    FIFTY_FIFTY: { no: 20, noComp: 30, comp: 40, yesComp: 60 }, // 1-20, 21-30, 31-40, 41-60, 61-100
    UNLIKELY: { no: 40, noComp: 55, comp: 65, yesComp: 75 },    // 1-40, 41-55, 56-65, 66-75, 76-100
    IMPOSSIBLE: { no: 75, noComp: 85, comp: 90, yesComp: 95 },  // 1-75, 76-85, 86-90, 91-95, 96-100
}

/**
 * Roll a d100
 */
export const rollD100 = (): number => {
    return Math.floor(Math.random() * 100) + 1
}

/**
 * Roll the Closed Question Oracle
 * Uses d100 with probability-based ranges
 */
export const rollOracle = (
    question: string,
    probability: OracleProbability = 'FIFTY_FIFTY'
): OracleResult => {
    const roll = rollD100()
    const ranges = ORACLE_RANGES[probability]
    
    let answer: OracleAnswer
    if (roll <= ranges.no) {
        answer = 'NO'
    } else if (roll <= ranges.noComp) {
        answer = 'NO_WITH_COMPLICATION'
    } else if (roll <= ranges.comp) {
        answer = 'COMPLICATED'
    } else if (roll <= ranges.yesComp) {
        answer = 'YES_WITH_COMPLICATION'
    } else {
        answer = 'YES'
    }

    return {
        id: uuidv4(),
        timestamp: Date.now(),
        question,
        probability,
        roll,
        answer,
    }
}

/**
 * Get human-readable Oracle answer description
 */
export const getOracleAnswerDescription = (answer: OracleAnswer): string => {
    const descriptions: Record<OracleAnswer, string> = {
        NO: 'No.',
        NO_WITH_COMPLICATION: 'No, but there\'s an unexpected twist or complication.',
        COMPLICATED: 'It\'s complicated. The answer is conditional or ambiguous.',
        YES_WITH_COMPLICATION: 'Yes, but there\'s an unexpected twist or complication.',
        YES: 'Yes.',
    }
    return descriptions[answer]
}

/**
 * Roll for an Open Question
 * Generates action + detail focus for narrative prompts
 */
export const rollOpenQuestion = (
    question: string,
    category: OpenQuestionCategory = 'ACTION'
): OpenQuestionResult => {
    let focus: string
    let detail: string

    switch (category) {
        case 'ACTION':
            focus = getRandomFromArray(actionFocusTable)
            detail = getRandomFromArray(detailFocusTable)
            break
        case 'NPC_ACTION':
            focus = getRandomFromArray(actionFocusTable)
            detail = getRandomFromArray(npcMotivationTable)
            break
        case 'NPC_MOOD':
            focus = getRandomFromArray(npcMoodTable)
            detail = getRandomFromArray(npcAppearanceTable)
            break
        case 'LOCATION':
            focus = getRandomFromArray(locationTypeTable)
            detail = getRandomFromArray(detailFocusTable)
            break
        case 'COMPLICATION':
            focus = getRandomFromArray(complicationTable)
            detail = getRandomFromArray(eventTable)
            break
        case 'EVENT':
            focus = getRandomFromArray(eventTable)
            detail = getRandomFromArray(complicationTable)
            break
        case 'OBJECT':
            focus = getRandomFromArray(clueTypeTable)
            detail = getRandomFromArray(detailFocusTable)
            break
        case 'DESCRIPTION':
        default:
            focus = getRandomFromArray(detailFocusTable)
            detail = getRandomFromArray(actionFocusTable)
            break
    }

    return {
        id: uuidv4(),
        timestamp: Date.now(),
        question,
        category,
        focus,
        detail,
    }
}

// ============================================
// SOLO PLAY CLOCKS
// Based on PDF page 25 - Dice Pool system
// ============================================

/**
 * Create a new Solo Play Clock with dice pool
 * @param name - Clock name
 * @param dicePool - Number of d6s in the pool (typically 3-8)
 * @param trigger - When to roll the pool
 * @param event - What happens when pool empties
 * @param scaleUp - If true, remove dice on 1 OR 6 (harder)
 */
export const createClock = (
    name: string,
    dicePool: number,
    trigger: string,
    event: string,
    scaleUp: boolean = false
): SoloPlayClock => {
    return {
        id: uuidv4(),
        name,
        description: '',
        initialDicePool: dicePool,
        remainingDice: dicePool,
        trigger,
        event,
        scaleUp,
        rollHistory: [],
        isComplete: false,
        createdAt: Date.now(),
    }
}

/**
 * Roll the dice pool for a clock
 * Returns the dice rolled and how many were removed
 */
export const rollClockDicePool = (
    remainingDice: number,
    scaleUp: boolean
): { diceRolled: number[]; diceRemoved: number; remainingAfter: number; multipleOnes: boolean } => {
    const diceRolled: number[] = []
    for (let i = 0; i < remainingDice; i++) {
        diceRolled.push(rollD6())
    }

    let diceRemoved = 0
    let onesCount = 0
    for (const die of diceRolled) {
        if (die === 1) {
            diceRemoved++
            onesCount++
        } else if (scaleUp && die === 6) {
            diceRemoved++
        }
    }

    return {
        diceRolled,
        diceRemoved,
        remainingAfter: Math.max(0, remainingDice - diceRemoved),
        multipleOnes: onesCount >= 2, // Degrees of Consequence
    }
}

// ============================================
// QUICK AND DIRTY COMBAT
// Based on Single Player Mode PDF pages 21-23
// ============================================

/**
 * Check if an Edgerunner is Hardened
 * An Edgerunner is Hardened if ANY of the following is true:
 * - REF 8 with Evasion Skill 6+
 * - STAT + Skill + Mod 15+ for attack
 * - WILL + BODY 16+
 * - Owns Luxury+ value weapon
 * - DEX 8 + MOV 8
 * - Autofire or Martial Arts 6+
 * - Solo Rank 4+
 */
export const isEdgerunnerHardened = (edgerunner: QDEdgerunner): boolean => {
    return (
        edgerunner.hasHighRefEvasion ||
        edgerunner.hasHighAttack ||
        edgerunner.hasHighWillBody ||
        edgerunner.hasLuxuryWeapon ||
        edgerunner.hasHighDexMov ||
        edgerunner.hasHighAutoMartial ||
        edgerunner.hasSoloRank4
    )
}

/**
 * Step 2: Make a Tactics Check
 * Opposed Tactics Check between one Edgerunner and one Enemy
 * Returns the roll totals and winner
 */
export const rollTacticsCheck = (
    edgerunnerTacticsTotal: number,
    enemyTacticsTotal: number
): { edgerunnerRoll: number; enemyRoll: number; winner: 'EDGERUNNER' | 'ENEMY' } => {
    const edgerunnerRoll = rollD10() + edgerunnerTacticsTotal
    const enemyRoll = rollD10() + enemyTacticsTotal
    
    // Ties go to defender (enemy in this case since Edgerunners are "attacking")
    const winner = edgerunnerRoll > enemyRoll ? 'EDGERUNNER' : 'ENEMY'
    
    return { edgerunnerRoll, enemyRoll, winner }
}

/**
 * Step 3: Count the Attacks for Edgerunners
 * +1 per member present
 * +1 for each Hardened member
 * +1 for each with Speedware
 * +1 if won Tactics Check
 */
export const countEdgerunnerAttacks = (
    edgerunners: QDEdgerunner[],
    wonTactics: boolean
): number => {
    let attacks = 0
    
    // +1 per member present
    attacks += edgerunners.length
    
    // +1 for each Hardened member
    attacks += edgerunners.filter(e => isEdgerunnerHardened(e)).length
    
    // +1 for each with Speedware
    attacks += edgerunners.filter(e => e.hasSpeedware).length
    
    // +1 if won Tactics Check
    if (wonTactics) attacks += 1
    
    return attacks
}

/**
 * Step 3: Count the Attacks for Enemies
 * +1 per Mook, +2 per Lieutenant, +3 per Mini-Boss, +4 per Boss
 * +1 for each Hardened
 * +1 for each with Speedware
 * +1 if won Tactics Check
 */
export const countEnemyAttacks = (
    enemies: QDEnemy[],
    wonTactics: boolean
): number => {
    let attacks = 0
    
    // Base attacks by level
    for (const enemy of enemies) {
        switch (enemy.level) {
            case 'MOOK':
                attacks += 1
                break
            case 'LIEUTENANT':
                attacks += 2
                break
            case 'MINI_BOSS':
                attacks += 3
                break
            case 'BOSS':
                attacks += 4
                break
        }
    }
    
    // +1 for each Hardened
    attacks += enemies.filter(e => e.isHardened).length
    
    // +1 for each with Speedware
    attacks += enemies.filter(e => e.hasSpeedware).length
    
    // +1 if won Tactics Check
    if (wonTactics) attacks += 1
    
    return attacks
}

/**
 * Distribute attack checks among combatants
 * Each combatant makes Attack Checks based on their contributions in Step 3
 */
export const distributeEdgerunnerAttacks = (
    edgerunners: QDEdgerunner[],
    wonTactics: boolean
): { combatant: QDEdgerunner; attackCount: number }[] => {
    const distribution: { combatant: QDEdgerunner; attackCount: number }[] = []
    
    for (const e of edgerunners) {
        let count = 1 // Base: +1 for being present
        if (isEdgerunnerHardened(e)) count += 1 // +1 for Hardened
        if (e.hasSpeedware) count += 1 // +1 for Speedware
        distribution.push({ combatant: e, attackCount: count })
    }
    
    // Add +1 for Tactics winner to the first combatant (or highest skilled)
    if (wonTactics && distribution.length > 0) {
        distribution[0].attackCount += 1
    }
    
    return distribution
}

export const distributeEnemyAttacks = (
    enemies: QDEnemy[],
    wonTactics: boolean
): { combatant: QDEnemy; attackCount: number }[] => {
    const distribution: { combatant: QDEnemy; attackCount: number }[] = []
    
    for (const e of enemies) {
        let count = 0
        // Base by level
        switch (e.level) {
            case 'MOOK': count = 1; break
            case 'LIEUTENANT': count = 2; break
            case 'MINI_BOSS': count = 3; break
            case 'BOSS': count = 4; break
        }
        if (e.isHardened) count += 1
        if (e.hasSpeedware) count += 1
        distribution.push({ combatant: e, attackCount: count })
    }
    
    // Add +1 for Tactics winner to the first combatant
    if (wonTactics && distribution.length > 0) {
        distribution[0].attackCount += 1
    }
    
    return distribution
}

/**
 * Step 4: Make Attack Checks
 * Roll d10 + skill total for each attack
 * If roll is 1, combatant loses their next attack check
 */
export const rollAttackCheck = (
    combatant: QDEdgerunner | QDEnemy,
    isEdgerunner: boolean
): QDAttackCheck => {
    const roll = rollD10()
    const skillTotal = combatant.attackSkillTotal
    
    return {
        id: uuidv4(),
        combatantId: combatant.id,
        combatantName: combatant.name,
        isEdgerunner,
        roll,
        total: roll + skillTotal,
        fumbled: roll === 1,
        weaponUsed: combatant.weaponName,
        weaponDamage: combatant.weaponDamage,
    }
}

/**
 * Generate all attack checks for a side
 * Handles fumble logic (losing next attack)
 */
export const generateAllAttacks = (
    distribution: { combatant: QDEdgerunner | QDEnemy; attackCount: number }[],
    isEdgerunner: boolean
): QDAttackCheck[] => {
    const attacks: QDAttackCheck[] = []
    
    for (const { combatant, attackCount } of distribution) {
        let remainingAttacks = attackCount
        
        while (remainingAttacks > 0) {
            const attack = rollAttackCheck(combatant, isEdgerunner)
            attacks.push(attack)
            remainingAttacks -= 1
            
            // If fumbled (rolled 1), lose next attack
            if (attack.fumbled && remainingAttacks > 0) {
                remainingAttacks -= 1
            }
        }
    }
    
    return attacks
}

/**
 * Step 5: Compare the Results
 * Sort by total (highest first), compare one-to-one
 * Ties go to defender (enemy)
 * If Edgerunner can dodge bullets, they can negate ONE ranged attack
 */
export const compareAttacks = (
    edgerunnerAttacks: QDAttackCheck[],
    enemyAttacks: QDAttackCheck[],
    edgerunners: QDEdgerunner[]
): QDComparison[] => {
    const comparisons: QDComparison[] = []
    
    // Sort both arrays by total (highest first)
    const sortedEdgerunner = [...edgerunnerAttacks].sort((a, b) => b.total - a.total)
    const sortedEnemy = [...enemyAttacks].sort((a, b) => b.total - a.total)
    
    // Track which edgerunners have used their bullet dodge
    const bulletDodgeUsed = new Set<string>()
    
    const maxLength = Math.max(sortedEdgerunner.length, sortedEnemy.length)
    
    for (let i = 0; i < maxLength; i++) {
        const edgerunnerAtk = sortedEdgerunner[i] || null
        const enemyAtk = sortedEnemy[i] || null
        
        let winner: QDComparison['winner']
        let dodged = false
        
        if (edgerunnerAtk && enemyAtk) {
            // Both have attacks - compare
            if (edgerunnerAtk.total > enemyAtk.total) {
                winner = 'EDGERUNNER'
            } else if (enemyAtk.total > edgerunnerAtk.total) {
                // Check if edgerunner can dodge
                const targetEdgerunner = edgerunners.find(e => e.id === edgerunnerAtk.combatantId)
                if (targetEdgerunner?.canDodgeBullets && !bulletDodgeUsed.has(targetEdgerunner.id)) {
                    bulletDodgeUsed.add(targetEdgerunner.id)
                    winner = 'TIE'
                    dodged = true
                } else {
                    winner = 'ENEMY'
                }
            } else {
                // Tie goes to defender (enemy)
                winner = 'ENEMY'
            }
        } else if (edgerunnerAtk && !enemyAtk) {
            winner = 'UNOPPOSED_EDGERUNNER'
        } else if (!edgerunnerAtk && enemyAtk) {
            winner = 'UNOPPOSED_ENEMY'
        } else {
            continue // Skip if both are null
        }
        
        comparisons.push({
            edgerunnerAttack: edgerunnerAtk,
            enemyAttack: enemyAtk,
            winner,
            dodged,
        })
    }
    
    return comparisons
}

/**
 * Count hits from comparisons
 */
export const countHits = (comparisons: QDComparison[]): { edgerunnerHits: number; enemyHits: number } => {
    let edgerunnerHits = 0
    let enemyHits = 0
    
    for (const comp of comparisons) {
        if (comp.winner === 'EDGERUNNER' || comp.winner === 'UNOPPOSED_EDGERUNNER') {
            edgerunnerHits += 1
        } else if (comp.winner === 'ENEMY' || comp.winner === 'UNOPPOSED_ENEMY') {
            enemyHits += 1
        }
        // TIE and dodged don't count as hits
    }
    
    return { edgerunnerHits, enemyHits }
}

/**
 * Roll Morale Check
 * Returns whether the enemy flees or fights
 */
export const rollMoraleCheck = (mentality: MoraleMentality): { roll: number; result: 'FLEE' | 'FIGHT' } => {
    const roll = rollD10()
    
    let fleeThreshold: number
    switch (mentality) {
        case 'LOST_TO_VIOLENCE':
            fleeThreshold = 2 // 1-2 flee
            break
        case 'EXPERIENCED':
            fleeThreshold = 4 // 1-4 flee
            break
        case 'TRAINED':
            fleeThreshold = 6 // 1-6 flee
            break
        case 'INEXPERIENCED':
            fleeThreshold = 8 // 1-8 flee
            break
        case 'UNSURE':
            fleeThreshold = 9 // 1-9 flee
            break
    }
    
    return {
        roll,
        result: roll <= fleeThreshold ? 'FLEE' : 'FIGHT'
    }
}

/**
 * Parse a damage string like "3d6" and roll it
 */
export const rollDamage = (damageString: string): number => {
    const match = damageString.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i)
    if (!match) return 0
    
    const numDice = parseInt(match[1])
    const dieSize = parseInt(match[2])
    const bonus = match[3] ? parseInt(match[3]) : 0
    
    let total = bonus
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * dieSize) + 1
    }
    
    return total
}

/**
 * Create initial combat session
 */
export const createQDCombatSession = (
    name: string,
    edgerunners: Omit<QDEdgerunner, 'id'>[],
    enemies: Omit<QDEnemy, 'id'>[],
    morale: Omit<MoraleConfig, 'triggered' | 'result' | 'roll'>
): QDCombatSession => {
    return {
        id: uuidv4(),
        name,
        edgerunners: edgerunners.map(e => ({ ...e, id: uuidv4() })),
        enemies: enemies.map(e => ({ ...e, id: uuidv4() })),
        tacticsWinner: null,
        edgerunnerAttackCount: 0,
        enemyAttackCount: 0,
        edgerunnerAttacks: [],
        enemyAttacks: [],
        comparisons: [],
        edgerunnerHits: 0,
        enemyHits: 0,
        morale: { ...morale, triggered: false },
        phase: 'SETUP',
        isComplete: false,
        createdAt: Date.now(),
    }
}

// ============================================
// QUICK AND DIRTY NETRUNNING
// ============================================

/**
 * Determine architecture size based on number of floors
 */
export const getArchitectureSize = (floors: number): NetArchitectureSize => {
    if (floors <= 6) return 'SMALL'
    if (floors <= 12) return 'MEDIUM'
    return 'LARGE'
}

/**
 * Determine number of checks based on floors
 */
export const getChecksForFloors = (floors: number): number => {
    if (floors <= 6) return 3
    if (floors <= 12) return 5
    return 7
}

/**
 * Create a new QD Netrun session
 */
export const createQDNetrunSession = (
    name: string,
    location: string,
    goal: string,
    floors: number
): QDNetrunSession => {
    const architectureSize = getArchitectureSize(floors)
    const numberOfChecks = getChecksForFloors(floors)

    return {
        id: uuidv4(),
        name,
        location,
        goal,
        architectureSize,
        floors,
        numberOfChecks,
        checks: [],
        currentCheck: 0,
        isComplete: false,
        success: false,
        successCount: 0,
        failureCount: 0,
        blackIceHits: 0,
        unsafeJackout: false,
        programsLost: [],
        createdAt: Date.now(),
    }
}

/**
 * Roll a QD Netrun check
 * @param checkNumber - The current check number
 * @param checkType - Type of check (PASSWORD, FILE, CONTROL_NODE, BLACK_ICE)
 * @param description - Description of the check
 * @param skillTotal - Player's skill total (INT + Interface typically)
 * @param dv - Difficulty Value for DV-based checks
 * @param opposedStat - Enemy stat for opposed checks (Black ICE)
 */
export const rollQDNetrunCheck = (
    checkNumber: number,
    checkType: NetrunCheckType,
    description: string,
    skillTotal: number,
    dv?: number,
    opposedStat?: number
): QDNetrunCheck => {
    const roll = rollD10()
    const total = roll + skillTotal

    let success: boolean
    let blackIceHit = false

    if (checkType === 'BLACK_ICE' && opposedStat !== undefined) {
        // Opposed check - need to beat enemy's roll
        const enemyRoll = rollD10() + opposedStat
        success = total > enemyRoll
        blackIceHit = !success
    } else if (dv !== undefined) {
        // DV check
        success = total >= dv
    } else {
        // Default: success on 5+ on the roll itself
        success = roll >= 5
    }

    return {
        checkNumber,
        checkType,
        description,
        dv,
        opposedStat,
        roll,
        skillTotal,
        total,
        success,
        blackIceHit,
    }
}

/**
 * Evaluate QD Netrun session outcome
 * Need majority of checks to succeed
 */
export const evaluateQDNetrunOutcome = (session: QDNetrunSession): boolean => {
    const successCount = session.checks.filter((c) => c.success).length
    return successCount > session.numberOfChecks / 2
}

// ============================================
// MISSION BUILDER
// ============================================

/**
 * Generate a random mission employer
 */
export const generateRandomEmployer = (): MissionEmployer => {
    const type = getRandomFromWeightedArray(whoIsHiringTable)
    let name: string

    switch (type) {
        case 'FIXER':
            name = getRandomFromArray(fixerNameTable)
            break
        case 'CORPO':
            name = `${getRandomFromArray(corpoNameTable)} Executive`
            break
        case 'GANG':
            name = `${getRandomFromArray(gangNameTable)} Representative`
            break
        default:
            name = `Unknown ${type.toLowerCase()}`
    }

    return {
        type: type as MissionEmployer['type'],
        name,
    }
}

/**
 * Generate random mission payment
 */
export const generateRandomPayment = (): MissionPayment => {
    const type = getRandomFromWeightedArray(paymentTypeTable)
    const baseAmount = (rollD6() + rollD6()) * 100 // 200-1200 eb base

    let description: string
    let amount: number | undefined

    switch (type) {
        case 'EDDIES':
            amount = baseAmount * (rollD6())
            description = `${amount} eb on completion`
            break
        case 'FAVOR':
            description = 'A significant favor to be called in later'
            break
        case 'INFORMATION':
            description = 'Valuable information about ' + getRandomFromArray(rumorTable)
            break
        case 'EQUIPMENT':
            description = 'High-quality equipment valued at approximately ' + (baseAmount * 2) + ' eb'
            break
        case 'CYBERWARE':
            description = 'Installation of premium cyberware'
            break
        case 'REPUTATION':
            description = 'Significant boost to street cred with connected parties'
            break
        case 'MIXED':
            amount = baseAmount
            description = `${amount} eb plus a favor`
            break
        default:
            amount = baseAmount
            description = `${amount} eb`
    }

    return {
        type: type as MissionPayment['type'],
        amount,
        description,
    }
}

/**
 * Generate a random mission summary
 */
export const generateMissionSummary = (): string => {
    const missionType = getRandomFromArray(missionTypeTable)
    const location = getRandomFromArray(locationTypeTable)
    const target = getRandomFromArray([
        'a corporate executive',
        'a gang leader',
        'valuable data',
        'a prototype weapon',
        'a missing person',
        'an informant',
        'a package',
        'a witness',
        'a hacker',
        'a rogue AI',
    ])

    return `${missionType} involving ${target} at ${location.toLowerCase()}`
}

/**
 * Generate focus and specifics for a mission
 */
export const generateMissionFocus = (): string => {
    const action = getRandomFromArray(actionFocusTable)
    const detail = getRandomFromArray(detailFocusTable)
    const complication = getRandomFromArray(complicationTable)

    return `${action} ${detail.toLowerCase()} objectives. Potential complication: ${complication.toLowerCase()}`
}

/**
 * Generate a mission twist
 */
export const generateMissionTwist = (): string => {
    return getRandomFromArray(twistTable)
}

/**
 * Generate a complete random mission
 */
export const generateRandomMission = (): SoloMission => {
    return {
        id: uuidv4(),
        name: `Mission ${Date.now().toString(36).toUpperCase()}`,
        whoIsHiring: generateRandomEmployer(),
        payment: generateRandomPayment(),
        missionSummary: generateMissionSummary(),
        focusAndSpecifics: generateMissionFocus(),
        twist: Math.random() > 0.5 ? generateMissionTwist() : undefined,
        beats: generateEmptyBeatChart(),
        status: 'PLANNING',
        createdAt: Date.now(),
    }
}

// ============================================
// BEAT CHART
// ============================================

/**
 * Generate an empty beat chart with customizable number of development beats
 * @param developmentCount Number of development beats (default: 6)
 */
export const generateEmptyBeatChart = (developmentCount: number = 6): BeatChartEntry[] => {
    const beatTypes: BeatType[] = ['HOOK']

    for (let i = 1; i <= developmentCount; i++) {
        beatTypes.push(`DEVELOPMENT_${i}` as BeatType)
    }

    beatTypes.push('CLIMAX', 'RESOLUTION')

    return beatTypes.map((beatType) => ({
        id: uuidv4(),
        beatType,
        description: '',
        completed: false,
    }))
}

/**
 * Generate a random beat description
 */
export const generateBeatDescription = (beatType: BeatType): string => {
    switch (beatType) {
        case 'HOOK':
            return getRandomFromArray([
                `Contacted by ${getRandomFromArray(fixerNameTable)} with an urgent job`,
                `Witness to ${getRandomFromArray(eventTable).toLowerCase()}`,
                `Discovered ${getRandomFromArray(clueTypeTable).toLowerCase()}`,
                `Approached by ${getRandomFromArray(npcOccupationTable).toLowerCase()} in need`,
            ])
        case 'CLIMAX':
            return getRandomFromArray([
                'Final confrontation with the main threat',
                'The truth is finally revealed',
                'Everything comes together for the final push',
                'Time to make the ultimate choice',
            ])
        case 'RESOLUTION':
            return getRandomFromArray([
                'Collect payment and assess the fallout',
                'Deal with the consequences of your actions',
                'New opportunities arise from completed mission',
                'Tie up loose ends and move on',
            ])
        default:
            // Development beats
            return getRandomFromArray([
                `${getRandomFromArray(actionFocusTable)} at ${getRandomFromArray(locationTypeTable).toLowerCase()}`,
                `Encounter with ${getRandomFromArray(npcOccupationTable).toLowerCase()}`,
                `Complication: ${getRandomFromArray(complicationTable).toLowerCase()}`,
                `Discovery: ${getRandomFromArray(clueTypeTable).toLowerCase()}`,
            ])
    }
}

// ============================================
// SCENE TRACKER
// ============================================

/**
 * Create a new scene
 */
export const createScene = (
    sceneNumber: number,
    location: string,
    participants: string[],
    goal: string
): SceneEntry => {
    return {
        id: uuidv4(),
        sceneNumber,
        location,
        participants,
        goal,
        checks: [],
        createdAt: Date.now(),
    }
}

/**
 * Add a check to a scene
 */
export const addSceneCheck = (
    description: string,
    success: boolean,
    checkNumber: number
): SceneCheck => {
    return {
        checkNumber,
        description,
        success,
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create a new Solo Play session
 */
export const createSoloPlaySession = (name: string): SoloPlaySession => {
    return {
        id: uuidv4(),
        name,
        createdAt: Date.now(),
        lastModified: Date.now(),
        oracleHistory: [],
        openQuestionHistory: [],
        clocks: [],
        missions: [],
        combatSessions: [],
        netrunSessions: [],
        scenes: [],
        ipTrackers: [],
        notes: '',
    }
}

// ============================================
// RANDOM GENERATORS FOR QUICK USE
// ============================================

/**
 * Generate a random NPC quickly
 */
export const generateQuickNPC = (): {
    occupation: string
    mood: string
    motivation: string
    appearance: string
} => {
    return {
        occupation: getRandomFromArray(npcOccupationTable),
        mood: getRandomFromArray(npcMoodTable),
        motivation: getRandomFromArray(npcMotivationTable),
        appearance: getRandomFromArray(npcAppearanceTable),
    }
}

/**
 * Generate a random location quickly
 */
export const generateQuickLocation = (): {
    type: string
    descriptor: string
    event: string
} => {
    return {
        type: getRandomFromArray(locationTypeTable),
        descriptor: getRandomFromArray(detailFocusTable),
        event: getRandomFromArray(eventTable),
    }
}

/**
 * Generate a random rumor
 */
export const generateRumor = (): string => {
    return getRandomFromArray(rumorTable)
}

/**
 * Generate a random clue
 */
export const generateClue = (): string => {
    return `${getRandomFromArray(detailFocusTable)} ${getRandomFromArray(clueTypeTable).toLowerCase()}`
}

/**
 * Generate a random event
 */
export const generateEvent = (): string => {
    return getRandomFromArray(eventTable)
}

/**
 * Generate a random complication
 */
export const generateComplication = (): string => {
    return getRandomFromArray(complicationTable)
}

// Alias functions for RandomTablesTool compatibility
export const generateQuickEvent = (): string => generateEvent()
export const generateQuickComplication = (): string => generateComplication()
export const generateQuickRumor = (): string => generateRumor()
export const generateQuickClue = (): string => generateClue()
export const generateQuickTwist = (): string => getRandomFromArray(twistTable)
export const generateQuickMotivation = (): string => getRandomFromArray(npcMotivationTable)
export const generateQuickMood = (): string => getRandomFromArray(npcMoodTable)

