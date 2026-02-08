// ============================================
// CHARACTER CREATOR TYPES
// Based on Cyberpunk RED Corebook
// ============================================

// === ROLES ===
export type Role =
    | 'ROCKERBOY'
    | 'SOLO'
    | 'NETRUNNER'
    | 'TECH'
    | 'MEDTECH'
    | 'MEDIA'
    | 'LAWMAN'
    | 'EXEC'
    | 'FIXER'
    | 'NOMAD'

// === STATS ===
export interface CharacterStats {
    INT: number
    REF: number
    DEX: number
    TECH: number
    COOL: number
    WILL: number
    LUCK: number
    MOVE: number
    BODY: number
    EMP: number
}

export interface DerivedStats {
    HP: number
    HumanityMax: number
    HumanityCurrent: number
    SeriouslyWoundedThreshold: number
    DeathSave: number
}

// === SKILLS ===
export type SkillCategory =
    | 'AWARENESS'
    | 'BODY'
    | 'CONTROL'
    | 'EDUCATION'
    | 'FIGHTING'
    | 'PERFORMANCE'
    | 'RANGED_WEAPON'
    | 'SOCIAL'
    | 'TECHNIQUE'

export interface Skill {
    name: string
    stat: keyof CharacterStats
    category: SkillCategory
    isX2?: boolean // Costs 2 points per level
    requiresSpecialization?: boolean // e.g., Language, Local Expert
    specialization?: string
}

export interface CharacterSkill {
    skill: Skill
    level: number
}

// === LIFEPATH ===
export interface CulturalOrigin {
    roll: number
    region: string
    languages: string[]
}

export interface Personality {
    roll: number
    description: string
}

export interface DressStyle {
    roll: number
    clothingStyle: string
    hairstyle: string
}

export interface Affectation {
    roll: number
    description: string
}

export interface Motivation {
    roll: number
    valueMost: string
    feelAboutPeople: string
    valuedPerson: string
    valuedPossession: string
}

export interface FamilyBackground {
    roll: number
    description: string
}

export interface ChildhoodEnvironment {
    roll: number
    description: string
}

export interface FamilyCrisis {
    roll: number
    description: string
}

export interface LifeGoal {
    roll: number
    description: string
}

export interface Friend {
    relationship: string
    description: string
}

export interface Enemy {
    who: string
    whatCaused: string
    whatTheyThrewAtYou: string
    whatYouCanThrow: string
    whosSide: string
}

export interface TragicLoveAffair {
    roll: number
    description: string
}

export interface LifeEvent {
    roll: number
    eventType: 'GOOD' | 'BAD' | 'FRIEND' | 'ENEMY' | 'LOVE'
    description: string
    details?: string
}

export interface Lifepath {
    culturalOrigin: CulturalOrigin
    language: string
    personality: Personality
    dressStyle: DressStyle
    affectation: Affectation
    motivation: Motivation
    familyBackground: FamilyBackground
    childhoodEnvironment: ChildhoodEnvironment
    familyCrisis: FamilyCrisis
    lifeGoal: LifeGoal
    lifeEvents: LifeEvent[]
}

// === GEAR & CYBERWARE ===
export interface Weapon {
    name: string
    type: string
    damage: string
    rof: number
    cost: number
}

export interface Armor {
    name: string
    sp: number
    penalty: number
    cost: number
}

export interface GearItem {
    name: string
    description: string
    cost: number
}

export interface Cyberware {
    name: string
    type: string
    description: string
    humanityLoss: number | string // Can be "2d6" for example
    cost: number
    bodyBonus?: number     // Added to BODY stat (e.g., Grafted Muscle/Bone Lace +2)
    bodyOverride?: number  // Sets BODY to this value (e.g., Linear Frames set to 12/14)
}

// === CHARACTER ===
export type CreationMethod = 'STREETRAT' | 'EDGERUNNER' | 'COMPLETE_PACKAGE'

export interface Character {
    id: string
    name: string
    handle: string // Street name
    role: Role
    roleAbility: string // e.g., "Charismatic Impact"
    roleAbilityDescription: string
    roleRank: number // 1-10
    creationMethod: CreationMethod
    stats: CharacterStats
    derivedStats: DerivedStats
    skills: CharacterSkill[]
    lifepath: Lifepath
    weapons: Weapon[]
    armor: Armor[]
    gear: GearItem[]
    cyberware: Cyberware[]
    fashionItems: GearItem[]
    eurobucks: number
    fashionBudget: number // 800eb for Complete Package fashion/fashionware only
    ip: number // Improvement Points available to spend
    notes: string
    createdAt: number
    updatedAt: number
}

// === STAT TEMPLATES ===
export interface StatTemplate {
    roll: number
    stats: CharacterStats
}

export interface RoleStatTemplates {
    role: Role
    templates: StatTemplate[]
}

// === SKILL TEMPLATES ===
export interface RoleSkillTemplate {
    role: Role
    skills: { name: string; level: number; isX2?: boolean }[]
}

// === CHARACTER CREATION STATE ===
export type CreationStep =
    | 'METHOD_SELECTION'
    | 'ROLE_SELECTION'
    | 'STATS'
    | 'SKILLS'
    | 'LIFEPATH'
    | 'GEAR'
    | 'GEAR_SHOPPING'
    | 'CYBERWARE'
    | 'FINISHING'
    | 'COMPLETE'

export interface CharacterCreationState {
    currentStep: CreationStep
    method: CreationMethod | null
    character: Partial<Character>
    pointsRemaining: {
        stats: number // For Complete Package: 62 points
        skills: number // For Edgerunner/Complete: 86 points
        money: number // Starting money
    }
    validationErrors: string[]
}

