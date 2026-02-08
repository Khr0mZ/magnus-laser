// ============================================
// CHARACTER CREATOR UTILITIES
// Functions for generating characters
// ============================================

import { v4 as uuidv4 } from 'uuid'
import type {
    Character,
    CharacterSkill,
    CharacterStats,
    CreationMethod,
    DerivedStats,
    GearItem,
    Lifepath,
    Role,
} from '../../types/characterCreator'
import {
    AFFECTATIONS,
    ALL_SKILLS,
    BASIC_SKILLS,
    CHILDHOOD_ENVIRONMENTS,
    CLOTHING_STYLES,
    CULTURAL_ORIGINS,
    FAMILY_BACKGROUNDS,
    FAMILY_CRISES,
    FEELINGS_ABOUT_PEOPLE,
    HAIRSTYLES,
    LIFE_GOALS,
    PERSONALITIES,
    ROLE_ABILITIES,
    ROLE_SKILLS,
    STAT_TEMPLATES,
    STREETRAT_SKILL_TEMPLATES,
    STARTING_GEAR,
    STARTING_CYBERWARE,
    STARTING_FASHION,
    VALUED_PERSONS,
    VALUED_POSSESSIONS,
    VALUES,
    FRIEND_TYPES,
    ENEMY_TYPES,
    ENEMY_CAUSES,
    ENEMY_RESOURCES,
    SWEET_REVENGE,
    TRAGIC_LOVE_AFFAIRS,
    calculateDerivedStats,
} from './characterCreatorData'
import type { Weapon, Armor, Cyberware } from '../../types/characterCreator'

// === DICE ROLLING ===

export const rollD10 = (): number => Math.floor(Math.random() * 10) + 1
export const rollD6 = (): number => Math.floor(Math.random() * 6) + 1

// === STAT GENERATION ===

/**
 * Generate stats using Streetrat method (roll 1d10, get predefined array)
 */
export const generateStreetratStats = (role: Role): { stats: CharacterStats; roll: number } => {
    const roll = rollD10()
    const roleTemplates = STAT_TEMPLATES.find((rt) => rt.role === role)
    if (!roleTemplates) {
        throw new Error(`No templates found for role: ${role}`)
    }
    const template = roleTemplates.templates.find((t) => t.roll === roll)
    if (!template) {
        throw new Error(`No template found for roll: ${roll}`)
    }
    return { stats: { ...template.stats }, roll }
}

/**
 * Generate starting stats for Edgerunner method.
 * Corebook: roll 1d10 for EACH stat individually on the Role's template table.
 */
export const generateEdgerunnerStats = (role: Role): CharacterStats => {
    const roleTemplates = STAT_TEMPLATES.find((rt) => rt.role === role)
    if (!roleTemplates) {
        throw new Error(`No templates found for role: ${role}`)
    }
    const templates = roleTemplates.templates
    return {
        INT: templates[Math.floor(Math.random() * templates.length)].stats.INT,
        REF: templates[Math.floor(Math.random() * templates.length)].stats.REF,
        DEX: templates[Math.floor(Math.random() * templates.length)].stats.DEX,
        TECH: templates[Math.floor(Math.random() * templates.length)].stats.TECH,
        COOL: templates[Math.floor(Math.random() * templates.length)].stats.COOL,
        WILL: templates[Math.floor(Math.random() * templates.length)].stats.WILL,
        LUCK: templates[Math.floor(Math.random() * templates.length)].stats.LUCK,
        MOVE: templates[Math.floor(Math.random() * templates.length)].stats.MOVE,
        BODY: templates[Math.floor(Math.random() * templates.length)].stats.BODY,
        EMP: templates[Math.floor(Math.random() * templates.length)].stats.EMP,
    }
}

/**
 * Calculate stat total (for Complete Package validation)
 */
export const calculateStatTotal = (stats: CharacterStats): number => {
    return (
        stats.INT +
        stats.REF +
        stats.DEX +
        stats.TECH +
        stats.COOL +
        stats.WILL +
        stats.LUCK +
        stats.MOVE +
        stats.BODY +
        stats.EMP
    )
}

/**
 * Validate stats for Complete Package method
 * - Total must equal the given points (usually 62)
 * - No stat can be higher than 8 or lower than 2
 */
export const validateCompletePackageStats = (
    stats: CharacterStats,
    totalPoints: number = 62
): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const total = calculateStatTotal(stats)

    if (total !== totalPoints) {
        errors.push(`Total points must be ${totalPoints}. Current: ${total}`)
    }

    const statNames = ['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP'] as const
    for (const statName of statNames) {
        const value = stats[statName]
        if (value < 2) {
            errors.push(`${statName} cannot be lower than 2`)
        }
        if (value > 8) {
            errors.push(`${statName} cannot be higher than 8`)
        }
    }

    return { valid: errors.length === 0, errors }
}

// === SKILL GENERATION ===

/**
 * Get skill template for Streetrat method (uses exact levels from Corebook)
 */
export const getStreetratSkills = (role: Role): CharacterSkill[] => {
    const template = STREETRAT_SKILL_TEMPLATES[role]
    const skills: CharacterSkill[] = []

    for (const entry of template) {
        const skillDef = ALL_SKILLS.find(
            (s) => s.name === entry.name || entry.name.startsWith(s.name)
        )
        if (skillDef) {
            skills.push({
                skill: { 
                    ...skillDef, 
                    specialization: extractSpecialization(entry.name),
                    isX2: entry.isX2 || skillDef.isX2,
                },
                level: entry.level,
            })
        }
    }

    return skills
}

/**
 * Generate starting weapons for a role
 */
export const getStartingWeapons = (role: Role): Weapon[] => {
    const gear = STARTING_GEAR[role]
    return gear.weapons.map(name => ({
        name,
        type: name.includes('Pistol') ? 'Pistol' : name.includes('Rifle') ? 'Rifle' : 'Melee',
        damage: '', // Would be filled from weapon data
        rof: 2,
        cost: 0,
    }))
}

/**
 * Generate starting armor for a role
 */
export const getStartingArmor = (role: Role): Armor[] => {
    const gear = STARTING_GEAR[role]
    return gear.armor.map(name => ({
        name,
        sp: name.includes('SP11') ? 11 : 7,
        penalty: 0,
        cost: 0,
    }))
}

/**
 * Generate starting cyberware for a role with humanity loss calculated
 */
export const getStartingCyberware = (role: Role): { cyberware: Cyberware[]; totalHumanityLoss: number; empLoss: number } => {
    const data = STARTING_CYBERWARE[role]
    const cyberware: Cyberware[] = data.cyberware.map(entry => ({
        name: entry.name,
        type: 'Fashionware', // Simplified - would categorize properly
        description: entry.notes || '',
        humanityLoss: entry.humanityLoss,
        cost: 0,
    }))
    
    return {
        cyberware,
        totalHumanityLoss: data.totalHumanityLoss,
        empLoss: data.empLoss,
    }
}

/**
 * Initialize skills for Edgerunner method (all at minimum)
 */
export const initializeEdgerunnerSkills = (role: Role): CharacterSkill[] => {
    const skillNames = ROLE_SKILLS[role]
    const skills: CharacterSkill[] = []

    for (const skillName of skillNames) {
        const skillDef = ALL_SKILLS.find(
            (s) => s.name === skillName || skillName.startsWith(s.name)
        )
        if (skillDef) {
            skills.push({
                skill: { ...skillDef, specialization: extractSpecialization(skillName) },
                level: 2, // All start at 2 for Edgerunner
            })
        }
    }

    return skills
}

/**
 * Initialize skills for Complete Package method.
 * Basic Skills start at level 2 (corebook rule), all others at 0.
 * Player has 86 points to distribute, skills can go from 0 to 6 (basic: 2-6).
 */
export const initializeCompletePackageSkills = (): CharacterSkill[] => {
    const skills: CharacterSkill[] = []

    for (const skillDef of ALL_SKILLS) {
        const isBasic = BASIC_SKILLS.some((bs) => skillDef.name.startsWith(bs))
        const startLevel = isBasic ? 2 : 0
        if (skillDef.requiresSpecialization) {
            skills.push({
                skill: { ...skillDef, specialization: undefined },
                level: startLevel,
            })
        } else {
            skills.push({
                skill: { ...skillDef },
                level: startLevel,
            })
        }
    }

    return skills
}

/**
 * Calculate total skill points used
 * Skills marked as x2 cost double
 */
export const calculateSkillPointsUsed = (skills: CharacterSkill[]): number => {
    let total = 0
    for (const charSkill of skills) {
        const cost = charSkill.skill.isX2 ? 2 : 1
        total += charSkill.level * cost
    }
    return total
}

/**
 * Validate Edgerunner skills
 * - 86 total points
 * - No skill higher than 6 or lower than 2
 */
export const validateEdgerunnerSkills = (
    skills: CharacterSkill[],
    totalPoints: number = 86
): { valid: boolean; errors: string[]; pointsUsed: number } => {
    const errors: string[] = []
    const pointsUsed = calculateSkillPointsUsed(skills)

    if (pointsUsed !== totalPoints) {
        errors.push(`Skill points must total ${totalPoints}. Current: ${pointsUsed}`)
    }

    for (const charSkill of skills) {
        if (charSkill.level < 2) {
            errors.push(`${charSkill.skill.name} cannot be lower than 2`)
        }
        if (charSkill.level > 6) {
            errors.push(`${charSkill.skill.name} cannot be higher than 6`)
        }
    }

    return { valid: errors.length === 0, errors, pointsUsed }
}

// === LIFEPATH GENERATION ===

/**
 * Generate a complete random lifepath
 */
export const generateLifepath = (): Lifepath => {
    // Cultural Origin
    const culturalRoll = rollD10()
    const culturalOrigin = CULTURAL_ORIGINS[culturalRoll - 1]
    const language = culturalOrigin.languages[Math.floor(Math.random() * culturalOrigin.languages.length)]

    // Personality
    const personalityRoll = rollD10()
    const personality = PERSONALITIES[personalityRoll - 1]

    // Dress Style
    const clothingRoll = rollD10()
    const hairstyleRoll = rollD10()
    const dressStyle = {
        roll: clothingRoll,
        clothingStyle: CLOTHING_STYLES[clothingRoll - 1].style,
        hairstyle: HAIRSTYLES[hairstyleRoll - 1].style,
    }

    // Affectation
    const affectationRoll = rollD10()
    const affectation = {
        roll: affectationRoll,
        description: AFFECTATIONS[affectationRoll - 1].description,
    }

    // Motivation
    const valueRoll = rollD10()
    const feelingRoll = rollD10()
    const personRoll = rollD10()
    const possessionRoll = rollD10()
    const motivation = {
        roll: valueRoll,
        valueMost: VALUES[valueRoll - 1].value,
        feelAboutPeople: FEELINGS_ABOUT_PEOPLE[feelingRoll - 1].feeling,
        valuedPerson: VALUED_PERSONS[personRoll - 1].person,
        valuedPossession: VALUED_POSSESSIONS[possessionRoll - 1].possession,
    }

    // Family Background
    const familyRoll = rollD10()
    const familyBackground = {
        roll: familyRoll,
        description: FAMILY_BACKGROUNDS[familyRoll - 1].background,
    }

    // Childhood Environment
    const childhoodRoll = rollD10()
    const childhoodEnvironment = {
        roll: childhoodRoll,
        description: CHILDHOOD_ENVIRONMENTS[childhoodRoll - 1].environment,
    }

    // Family Crisis
    const crisisRoll = rollD10()
    const familyCrisis = {
        roll: crisisRoll,
        description: FAMILY_CRISES[crisisRoll - 1].crisis,
    }

    // Life Goal
    const goalRoll = rollD10()
    const lifeGoal = {
        roll: goalRoll,
        description: LIFE_GOALS[goalRoll - 1].goal,
    }

    // Life Events (1 per year of adult life, typically 3-5 for starting characters)
    const numEvents = 3 + Math.floor(Math.random() * 3) // 3-5 events
    const lifeEvents = generateLifeEvents(numEvents)

    return {
        culturalOrigin: {
            roll: culturalRoll,
            region: culturalOrigin.region,
            languages: culturalOrigin.languages,
        },
        language,
        personality: {
            roll: personalityRoll,
            description: personality.description,
        },
        dressStyle,
        affectation,
        motivation,
        familyBackground,
        childhoodEnvironment,
        familyCrisis,
        lifeGoal,
        lifeEvents,
    }
}

/**
 * Generate life events
 */
const generateLifeEvents = (count: number) => {
    const events = []
    for (let i = 0; i < count; i++) {
        const eventRoll = rollD10()
        let eventType: 'GOOD' | 'BAD' | 'FRIEND' | 'ENEMY' | 'LOVE'
        let description: string
        let details: string | undefined

        if (eventRoll <= 3) {
            eventType = 'GOOD'
            description = getGoodEvent()
        } else if (eventRoll <= 6) {
            eventType = 'BAD'
            description = getBadEvent()
        } else if (eventRoll === 7) {
            eventType = 'FRIEND'
            const friendType = FRIEND_TYPES[rollD10() - 1]
            description = `You made a friend: ${friendType.relationship}`
        } else if (eventRoll <= 9) {
            eventType = 'ENEMY'
            const enemyType = ENEMY_TYPES[rollD10() - 1]
            const enemyCause = ENEMY_CAUSES[rollD10() - 1]
            const enemyResources = ENEMY_RESOURCES[rollD10() - 1]
            const sweetRevenge = SWEET_REVENGE[rollD10() - 1]
            description = `You made an enemy: ${enemyType.who}`
            details = `Cause: ${enemyCause.cause}. They can throw: ${enemyResources.resources}. Your revenge: ${sweetRevenge.action}`
        } else {
            eventType = 'LOVE'
            const loveRoll = rollD10()
            if (loveRoll <= 4) {
                description = 'Happy love affair'
                details = 'Your lover is still around and you\'re still together.'
            } else {
                const tragedy = TRAGIC_LOVE_AFFAIRS[rollD10() - 1]
                description = 'Tragic love affair'
                details = tragedy.outcome
            }
        }

        events.push({
            roll: eventRoll,
            eventType,
            description,
            details,
        })
    }
    return events
}

const getGoodEvent = (): string => {
    const events = [
        'You made a powerful contact in the local government.',
        'You found valuable intel that earned you some eddies.',
        'You gained a useful skill from an unexpected source.',
        'A windfall of cash came your way.',
        'You recovered from a serious injury or illness.',
        'You found a mentor who taught you valuable lessons.',
        'You gained a reputation for something positive.',
        'You received a gift of cyberware from a grateful client.',
        'You discovered a secret about a powerful organization.',
        'You made a breakthrough in your personal goals.',
    ]
    return events[Math.floor(Math.random() * events.length)]
}

const getBadEvent = (): string => {
    const events = [
        'You were arrested or detained by authorities.',
        'You lost something valuable through theft or accident.',
        'You suffered a serious injury that left a mark.',
        'You were betrayed by someone you trusted.',
        'You lost a loved one to violence or illness.',
        'You fell into debt with dangerous people.',
        'You were humiliated publicly.',
        'You were forced to flee your home.',
        'You were addicted to something harmful.',
        'You made a terrible mistake that haunts you.',
    ]
    return events[Math.floor(Math.random() * events.length)]
}


// === CHARACTER CREATION ===

/**
 * Create a new character using the specified method
 */
export const createCharacter = (
    method: CreationMethod,
    role: Role,
    name: string,
    handle: string
): Character => {
    let stats: CharacterStats
    let skills: CharacterSkill[]

    switch (method) {
        case 'STREETRAT': {
            const { stats: generatedStats } = generateStreetratStats(role)
            stats = generatedStats
            skills = getStreetratSkills(role)
            break
        }
        case 'EDGERUNNER': {
            stats = generateEdgerunnerStats(role)
            skills = initializeEdgerunnerSkills(role)
            break
        }
        case 'COMPLETE_PACKAGE': {
            // Start with minimum stats
            stats = {
                INT: 2, REF: 2, DEX: 2, TECH: 2, COOL: 2,
                WILL: 2, LUCK: 2, MOVE: 2, BODY: 2, EMP: 2,
            }
            // Complete Package gets all skills starting at 0 to distribute 86 points
            skills = initializeCompletePackageSkills()
            break
        }
    }

    const derivedStatsCalc = calculateDerivedStats(stats)
    const derivedStats: DerivedStats = {
        HP: derivedStatsCalc.HP,
        HumanityMax: derivedStatsCalc.HumanityMax,
        HumanityCurrent: derivedStatsCalc.HumanityMax,
        SeriouslyWoundedThreshold: derivedStatsCalc.SeriouslyWoundedThreshold,
        DeathSave: derivedStatsCalc.DeathSave,
    }

    const lifepath = generateLifepath()

    // Role ability (Gap 6+7)
    const roleAbilityData = ROLE_ABILITIES[role]

    // Get starting gear for non-Complete Package methods
    let weapons: Weapon[] = []
    let armor: Armor[] = []
    let gear: GearItem[] = []
    let cyberware: Cyberware[] = []
    let fashionItems: GearItem[] = []
    let eurobucks = method === 'COMPLETE_PACKAGE' ? 2550 : 500
    let fashionBudget = method === 'COMPLETE_PACKAGE' ? 800 : 0

    if (method !== 'COMPLETE_PACKAGE') {
        weapons = getStartingWeapons(role)
        armor = getStartingArmor(role)
        const cyberData = getStartingCyberware(role)
        cyberware = cyberData.cyberware
        // Adjust humanity for cyberware and recalculate EMP
        derivedStats.HumanityCurrent = derivedStats.HumanityMax - cyberData.totalHumanityLoss
        const baseEMP = Math.ceil(derivedStats.HumanityMax / 10)
        stats.EMP = Math.min(baseEMP, calculateCurrentEMP(derivedStats.HumanityCurrent))

        // Starting ammunition as gear items (Gap 11)
        const startingGear = STARTING_GEAR[role]
        for (const ammo of startingGear.ammunition) {
            gear.push({ name: ammo, description: 'Starting ammunition', cost: 0 })
        }
        for (const other of startingGear.other) {
            gear.push({ name: other, description: 'Starting gear', cost: 0 })
        }

        // Starting fashion (Gap 13)
        const startingFashion = STARTING_FASHION[role]
        for (const item of startingFashion) {
            fashionItems.push({ name: item, description: 'Starting fashion', cost: 0 })
        }
    }

    // Free language skill for Complete Package (Gap 10)
    // Corebook: cultural origin language at level 4, free (not counted in 86 skill points)
    if (method === 'COMPLETE_PACKAGE') {
        const langIndex = skills.findIndex((s) => s.skill.name === 'Language')
        if (langIndex >= 0) {
            skills[langIndex] = {
                ...skills[langIndex],
                skill: {
                    ...skills[langIndex].skill,
                    specialization: lifepath.language,
                },
                level: 4,
            }
        }
    }

    return {
        id: uuidv4(),
        name,
        handle,
        role,
        roleAbility: roleAbilityData.name,
        roleAbilityDescription: roleAbilityData.description,
        roleRank: 4, // Starting role ability rank
        creationMethod: method,
        stats,
        derivedStats,
        skills,
        lifepath,
        weapons,
        armor,
        gear,
        cyberware,
        fashionItems,
        eurobucks,
        fashionBudget,
        ip: 0,
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

// === HELPER FUNCTIONS ===

const extractSpecialization = (skillName: string): string | undefined => {
    const match = skillName.match(/\(([^)]+)\)/)
    return match ? match[1] : undefined
}

/**
 * Compute effective stats considering cyberware bonuses.
 * - bodyBonus: summed bonus added to BODY (e.g., Grafted Muscle/Bone Lace +2)
 * - bodyOverride: highest override that replaces BODY entirely (e.g., Linear Frame Sigma sets to 12)
 * bodyOverride takes precedence over base BODY + bodyBonus.
 */
export const getEffectiveStats = (stats: CharacterStats, cyberware: Cyberware[]): CharacterStats => {
    let bodyBonus = 0
    let bodyOverride: number | undefined

    for (const c of cyberware) {
        if (c.bodyBonus) bodyBonus += c.bodyBonus
        if (c.bodyOverride && (!bodyOverride || c.bodyOverride > bodyOverride)) {
            bodyOverride = c.bodyOverride
        }
    }

    return {
        ...stats,
        BODY: bodyOverride ?? (stats.BODY + bodyBonus),
    }
}

/**
 * Recalculate derived stats when stats or cyberware change
 */
export const recalculateDerivedStats = (character: Character): Character => {
    const effectiveStats = getEffectiveStats(character.stats, character.cyberware)
    const derivedStatsCalc = calculateDerivedStats(effectiveStats)
    // Preserve humanity loss when HumanityMax changes (e.g. EMP stat changed)
    const humanityLoss = character.derivedStats.HumanityMax - character.derivedStats.HumanityCurrent
    const newHumanityCurrent = Math.max(0, derivedStatsCalc.HumanityMax - humanityLoss)
    return {
        ...character,
        derivedStats: {
            ...character.derivedStats,
            HP: derivedStatsCalc.HP,
            HumanityMax: derivedStatsCalc.HumanityMax,
            HumanityCurrent: newHumanityCurrent,
            SeriouslyWoundedThreshold: derivedStatsCalc.SeriouslyWoundedThreshold,
            DeathSave: derivedStatsCalc.DeathSave,
        },
        updatedAt: Date.now(),
    }
}

/**
 * Calculate current EMP based on Humanity (Gap 3).
 * Corebook: EMP drops when Humanity's tens place lowers (e.g., 44→39 = EMP 4→3).
 */
export const calculateCurrentEMP = (humanityCurrent: number): number => {
    return Math.max(0, Math.ceil(humanityCurrent / 10))
}

/**
 * Check if a character has a specific cyberware installed (for foundation requirements).
 */
export const hasCyberware = (character: Character, cyberwareName: string): boolean => {
    return character.cyberware.some((c) => c.name === cyberwareName)
}

