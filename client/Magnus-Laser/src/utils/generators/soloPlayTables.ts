// ============================================
// SOLO PLAY RANDOM TABLES
// Based on Cyberpunk RED Single Player Mode
// Official data from the PDF
// Now powered by i18n for multilingual support
// ============================================

import i18n from '../../i18n'

// Helper to get table data from the 'tables' namespace
const tt = <T = string[]>(key: string): T =>
    i18n.t(key, { ns: 'tables', returnObjects: true }) as T

// === CORE TABLES ===
export const actionFocusTable = () => tt('core.verbs')
export const detailFocusTable = () => tt('core.nouns')
export const adjectivesTable = () => tt('core.adjectives')

// === NPC TABLES ===
export const npcMotivationTable = () => tt('npc.motivations')
export const npcMoodTable = () => tt('npc.moods')
export const npcAppearanceTable = () => tt('npc.appearances')
export const npcOccupationTable = () => tt('npc.occupations')

// === LOCATION TABLES ===
export const locationCorporateTable = () => tt('locations.corporate')
export const locationModerateTable = () => tt('locations.moderate')
export const locationStreetTable = () => tt('locations.street')
export const locationOutskirtsTable = () => tt('locations.outskirts')

export const locationTypeTable = () => [
    ...locationCorporateTable(),
    ...locationModerateTable(),
    ...locationStreetTable(),
    ...locationOutskirtsTable(),
]

// === EVENT, COMPLICATION, CLUE TABLES ===
export const eventTable = () => tt('events')
export const complicationTable = () => tt('complications')
export const twistTable = () => tt<{ twist: string; notes: string }[]>('twists')
export const clueTypeTable = () => tt('clues')
export const rumorTable = () => tt('rumors')

// === MISSION TABLES ===
export const missionTypeTable = () => tt('missions.types')

// whoIsHiring and paymentType use static weights — not translated
export const whoIsHiringTable = [
    { type: 'FIXER', weight: 30 },
    { type: 'CORPO', weight: 15 },
    { type: 'GANG', weight: 15 },
    { type: 'GOVERNMENT', weight: 5 },
    { type: 'INDEPENDENT', weight: 15 },
    { type: 'MEDIA', weight: 5 },
    { type: 'NETRUNNER', weight: 5 },
    { type: 'NOMAD', weight: 5 },
    { type: 'CIVILIAN', weight: 5 },
]

export const paymentTypeTable = [
    { type: 'EDDIES', weight: 50 },
    { type: 'FAVOR', weight: 15 },
    { type: 'INFORMATION', weight: 10 },
    { type: 'EQUIPMENT', weight: 10 },
    { type: 'CYBERWARE', weight: 5 },
    { type: 'REPUTATION', weight: 5 },
    { type: 'MIXED', weight: 5 },
]

// === PEOPLE TABLES ===
export const peopleCorporateTable = () => tt('people.corporate')
export const peopleModerateTable = () => tt('people.moderate')
export const peopleStreetTable = () => tt('people.street')
export const peopleOutskirtsTable = () => tt('people.outskirts')

// === FACTIONS ===
export const factionsTable = () => tt<{ type: string; range: string }[]>('factions.types')
export const criminalOrganizationsTable = () => tt<{ name: string; notes: string }[]>('factions.criminalOrgs')
export const lawEnforcementTable = () => tt<{ name: string; notes: string }[]>('factions.lawEnforcement')
export const nomadGroupsTable = () => tt<{ name: string; notes: string }[]>('factions.nomadGroups')

// === NIGHT CITY ===
export const nightCityDistrictsTable = () => tt('nightCity.districts')
export const corpoNameTable = () => tt<{ name: string; notes: string }[]>('nightCity.corporations')
export const gangNameTable = () => tt<{ name: string; notes: string }[]>('nightCity.gangs')

// === FIXER NAMES (proper nouns — not translated) ===
export const fixerNameTable = () => tt('names.fixers')

// === BEAT CHART TABLES ===
export const hooksTable = () => tt('beats.hooks')
export const cliffhangersTable = () => tt('beats.cliffhangers')
export const developmentsTable = () => tt('beats.developments')
export const climaxesTable = () => tt('beats.climaxes')
export const resolutionsTable = () => tt('beats.resolutions')

// === QUICK DICE ROLL HELPERS (no translation needed) ===
export const rollD6 = (): number => Math.floor(Math.random() * 6) + 1
export const rollD10 = (): number => Math.floor(Math.random() * 10) + 1
export const rollD100 = (): number => Math.floor(Math.random() * 100) + 1
export const roll2D6 = (): number => rollD6() + rollD6()

export const getRandomFromArray = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)]
}

export const getRandomFromWeightedArray = <T extends { type: string; weight: number }>(
    arr: T[]
): string => {
    const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    for (const item of arr) {
        random -= item.weight
        if (random <= 0) {
            return item.type
        }
    }
    return arr[arr.length - 1].type
}

// === RANDOM THINGS (3-20) PROBABILITY WEIGHTS ===
export const RANDOM_THINGS_WEIGHTS: Record<number, number[]> = {
    3: [33.34, 33.33, 33.33],
    4: [25, 25, 25, 25],
    5: [16.67, 16.67, 33.33, 16.67, 16.66],
    6: [16.67, 16.67, 16.67, 16.67, 16.66, 16.66],
    7: [20, 10, 10, 10, 20, 10, 20],
    8: [20, 10, 10, 10, 10, 10, 10, 20],
    9: [10, 10, 10, 10, 20, 10, 10, 10, 10],
    10: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    11: [2.78, 5.56, 8.33, 11.11, 13.89, 16.67, 13.89, 11.11, 8.33, 5.56, 2.78],
    12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 20],
    13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 15, 15],
    14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 11],
    15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 9, 8, 8],
    16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 7, 7, 7],
    17: [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 8, 7, 7, 6, 6, 6, 6],
    18: [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 7, 7, 6, 6, 5, 5, 6, 6],
    19: [1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 6, 6, 5, 5, 5, 5, 6, 6],
    20: [1, 2, 3, 4, 5, 6, 6, 6, 6, 7, 7, 6, 6, 5, 5, 5, 5, 5, 5, 5],
}

/**
 * Roll on a custom Random Things table using weighted probability.
 * Returns 0-based index of the selected item.
 */
export const rollRandomThings = (size: number): number => {
    const weights = RANDOM_THINGS_WEIGHTS[size]
    if (!weights) return Math.floor(Math.random() * size)

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    for (let i = 0; i < weights.length; i++) {
        random -= weights[i]
        if (random <= 0) return i
    }
    return weights.length - 1
}
