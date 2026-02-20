import colors from '../../../utils/colors'
import {
    actionFocusTable,
    adjectivesTable,
    detailFocusTable,
    getRandomFromArray,
    nightCityDistrictsTable,
} from '../../../utils/generators/soloPlayTables'
import {
    generateAdvertisement,
    generateAiLevel,
    generateApartment,
    generateAttackerAimPerson,
    generateAttackerAimVehicle,
    generateBar,
    generateBlackIce,
    generateCargoContainer,
    generateCorporateConapt,
    generateCorpseLoot,
    generateCubeHotel,
    generateCyberpunkElement,
    generateEncounterCorpBuilding,
    generateEncounterRoad,
    generateEncounterSubway,
    generateEncounterTransport,
    generateFashion,
    generateFashionware,
    generateFirearm,
    generateHandle,
    generateHateOrganization,
    generateHighriderCareer,
    generateHollywoodOveracting,
    generateHotNightInCity,
    generateHotspot,
    generateKibbleFlavor,
    generateListeningDevice,
    generateMedicalSymptom,
    generateMissionItem,
    generateNpcAggression,
    generateNPCByRole,
    generateNpcCompetence,
    generateRadioStation,
    generateRandomJunk,
    generateRandomName,
    generateRelationship,
    generateScatter,
    generateSight,
    generateSmell,
    generateSound,
    generateSoundsInNight,
    generateSurgicalComplication,
    generateTritiFizz,
    generateTVShow,
    generateVisitor,
    generateWeatherHighSeas,
} from '../../../utils/generators/soloPlayTablesExpanded'
import {
    generateQuickClue,
    generateQuickComplication,
    generateQuickEvent,
    generateQuickLocation,
    generateQuickMood,
    generateQuickMotivation,
    generateQuickNPC,
    generateQuickRumor,
    generateQuickTwist,
} from '../../../utils/generators/soloPlayUtils'

// === Generator Types ===

export interface GeneratorDef {
    key: string
    color: string
    generator: () => unknown
}

export interface GeneratorCategory {
    key: string
    color: string
    defaultExpanded?: boolean
    generators: GeneratorDef[]
}

// === Wrapper generators for nested objects ===

const wrapNPCByRole = () => {
    const r = generateNPCByRole()
    return { role: r.role, name: r.npc.name, notes: r.npc.notes }
}

const wrapVenue = (gen: () => { name: string; description: string }) => () => {
    const r = gen()
    return { name: r.name, description: r.description }
}

const wrapPlace = (gen: () => { name: string; description: string }) => () => {
    const r = gen()
    return { name: r.name, description: r.description }
}

const wrapFlavorItem = (gen: () => { flavor: string; description: string }) => () => {
    const r = gen()
    return { flavor: r.flavor, description: r.description }
}

const wrapAiLevel = () => {
    const r = generateAiLevel()
    return { level: r.level, description: r.description }
}

// === Categories with generators ===

export const categories: GeneratorCategory[] = [
    {
        key: 'core',
        color: colors.neons.green.default,
        // defaultExpanded: true,
        generators: [
            { key: 'npc', color: colors.neons.cyan.default, generator: generateQuickNPC },
            { key: 'location', color: colors.neons.blue.default, generator: generateQuickLocation },
            { key: 'event', color: colors.neons.green.default, generator: generateQuickEvent },
            { key: 'complication', color: colors.neons.yellow.default, generator: generateQuickComplication },
            { key: 'rumor', color: colors.neons.pink.default, generator: generateQuickRumor },
            { key: 'clue', color: colors.neons.cyan.default, generator: generateQuickClue },
            { key: 'twist', color: colors.neons.red.default, generator: generateQuickTwist },
            { key: 'motivation', color: colors.neons.purple.default, generator: generateQuickMotivation },
            { key: 'mood', color: colors.neons.green.default, generator: generateQuickMood },
        ],
    },
    {
        key: 'words',
        color: colors.neons.orange.default,
        generators: [
            {
                key: 'action',
                color: colors.neons.orange.default,
                generator: () => getRandomFromArray(actionFocusTable()),
            },
            { key: 'noun', color: colors.neons.blue.default, generator: () => getRandomFromArray(detailFocusTable()) },
            {
                key: 'adjective',
                color: colors.neons.purple.default,
                generator: () => getRandomFromArray(adjectivesTable()),
            },
        ],
    },
    {
        key: 'sensory',
        color: colors.neons.purple.default,
        generators: [
            { key: 'sight', color: colors.neons.purple.default, generator: generateSight },
            { key: 'sound', color: colors.neons.blue.default, generator: generateSound },
            { key: 'smell', color: colors.neons.green.default, generator: generateSmell },
        ],
    },
    {
        key: 'names',
        color: colors.neons.cyan.default,
        generators: [
            { key: 'nameMasc', color: colors.neons.cyan.default, generator: () => generateRandomName('masc') },
            { key: 'nameFemme', color: colors.neons.pink.default, generator: () => generateRandomName('femme') },
            { key: 'nameNB', color: colors.neons.purple.default, generator: () => generateRandomName('nonbinary') },
            { key: 'handle', color: colors.neons.orange.default, generator: generateHandle },
        ],
    },
    {
        key: 'nightCity',
        color: colors.neons.blue.default,
        generators: [
            {
                key: 'district',
                color: colors.neons.blue.default,
                generator: () => getRandomFromArray(nightCityDistrictsTable()),
            },
            { key: 'hotspot', color: colors.neons.green.default, generator: wrapVenue(generateHotspot) },
            { key: 'bar', color: colors.neons.orange.default, generator: wrapVenue(generateBar) },
            { key: 'cubeHotel', color: colors.neons.yellow.default, generator: wrapPlace(generateCubeHotel) },
            { key: 'cargoContainer', color: colors.neons.cyan.default, generator: wrapPlace(generateCargoContainer) },
            {
                key: 'corporateConapt',
                color: colors.neons.purple.default,
                generator: wrapPlace(generateCorporateConapt),
            },
            { key: 'apartment', color: colors.neons.pink.default, generator: wrapPlace(generateApartment) },
        ],
    },
    {
        key: 'people',
        color: colors.neons.pink.default,
        generators: [
            { key: 'npcByRole', color: colors.neons.cyan.default, generator: wrapNPCByRole },
            { key: 'relationship', color: colors.neons.pink.default, generator: generateRelationship },
            { key: 'visitor', color: colors.neons.orange.default, generator: generateVisitor },
        ],
    },
    {
        key: 'things',
        color: colors.neons.yellow.default,
        generators: [
            { key: 'fashion', color: colors.neons.pink.default, generator: generateFashion },
            { key: 'fashionware', color: colors.neons.purple.default, generator: generateFashionware },
            { key: 'blackIce', color: colors.neons.red.default, generator: generateBlackIce },
            { key: 'firearm', color: colors.neons.orange.default, generator: generateFirearm },
            {
                key: 'kibbleFlavor',
                color: colors.neons.yellow.default,
                generator: wrapFlavorItem(generateKibbleFlavor),
            },
            { key: 'tritiFizz', color: colors.neons.green.default, generator: wrapFlavorItem(generateTritiFizz) },
        ],
    },
    {
        key: 'media',
        color: colors.neons.cyan.default,
        generators: [
            { key: 'radioStation', color: colors.neons.cyan.default, generator: generateRadioStation },
            { key: 'tvShow', color: colors.neons.blue.default, generator: generateTVShow },
            { key: 'advertisement', color: colors.neons.yellow.default, generator: generateAdvertisement },
        ],
    },
    {
        key: 'corpseLoot',
        color: colors.neons.red.default,
        generators: [
            {
                key: 'lootStreetrat',
                color: colors.neons.yellow.default,
                generator: () => generateCorpseLoot('streetrat'),
            },
            {
                key: 'lootEdgerunner',
                color: colors.neons.orange.default,
                generator: () => generateCorpseLoot('edgerunner'),
            },
            {
                key: 'lootCorporate',
                color: colors.neons.cyan.default,
                generator: () => generateCorpseLoot('corporate'),
            },
        ],
    },
    {
        key: 'mission',
        color: colors.neons.green.default,
        generators: [
            {
                key: 'missionItemCorporate',
                color: colors.neons.cyan.default,
                generator: () => generateMissionItem('corporate'),
            },
            {
                key: 'missionItemModerate',
                color: colors.neons.blue.default,
                generator: () => generateMissionItem('moderate'),
            },
            {
                key: 'missionItemStreet',
                color: colors.neons.orange.default,
                generator: () => generateMissionItem('street'),
            },
            {
                key: 'missionItemNomad',
                color: colors.neons.yellow.default,
                generator: () => generateMissionItem('nomad'),
            },
        ],
    },
    {
        key: 'spmCharacter',
        color: colors.neons.cyan.default,
        generators: [
            { key: 'npcCompetence', color: colors.neons.cyan.default, generator: generateNpcCompetence },
            { key: 'npcAggression', color: colors.neons.red.default, generator: generateNpcAggression },
            { key: 'hateOrganization', color: colors.neons.orange.default, generator: generateHateOrganization },
            { key: 'highriderCareer', color: colors.neons.blue.default, generator: generateHighriderCareer },
            { key: 'aiLevel', color: colors.neons.purple.default, generator: wrapAiLevel },
        ],
    },
    {
        key: 'spmEncounters',
        color: colors.neons.orange.default,
        generators: [
            { key: 'encounterSubway', color: colors.neons.orange.default, generator: generateEncounterSubway },
            { key: 'encounterTransport', color: colors.neons.blue.default, generator: generateEncounterTransport },
            { key: 'encounterRoad', color: colors.neons.green.default, generator: generateEncounterRoad },
            {
                key: 'encounterCorpBuilding',
                color: colors.neons.cyan.default,
                generator: generateEncounterCorpBuilding,
            },
            { key: 'weatherHighSeas', color: colors.neons.blue.default, generator: generateWeatherHighSeas },
        ],
    },
    {
        key: 'spmAtmosphere',
        color: colors.neons.purple.default,
        generators: [
            { key: 'cyberpunkElements', color: colors.neons.pink.default, generator: generateCyberpunkElement },
            { key: 'hotNightInCity', color: colors.neons.orange.default, generator: generateHotNightInCity },
            { key: 'soundsInNight', color: colors.neons.blue.default, generator: generateSoundsInNight },
            { key: 'randomJunk', color: colors.neons.yellow.default, generator: generateRandomJunk },
            { key: 'listeningDevice', color: colors.neons.green.default, generator: generateListeningDevice },
        ],
    },
    {
        key: 'spmCombat',
        color: colors.neons.red.default,
        generators: [
            { key: 'scatter', color: colors.neons.orange.default, generator: generateScatter },
            { key: 'hollywoodOveracting', color: colors.neons.pink.default, generator: generateHollywoodOveracting },
            { key: 'aimPerson', color: colors.neons.red.default, generator: generateAttackerAimPerson },
            { key: 'aimVehicle', color: colors.neons.yellow.default, generator: generateAttackerAimVehicle },
        ],
    },
    {
        key: 'spmMedical',
        color: colors.neons.green.default,
        generators: [
            { key: 'surgicalComplication', color: colors.neons.red.default, generator: generateSurgicalComplication },
            { key: 'medicalSymptom', color: colors.neons.green.default, generator: generateMedicalSymptom },
        ],
    },
]

// Build flat lookup from all categories (for reroll + color)
export const allGenerators: Record<string, GeneratorDef> = {}
for (const category of categories) {
    for (const gen of category.generators) {
        allGenerators[gen.key] = gen
    }
}
// Add encounter as special entry (handled separately but needs color lookup)
allGenerators['encounter'] = { key: 'encounter', color: colors.neons.red.default, generator: () => '' }

// Helper to capitalize first letter
const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

// Format any generator result to string
export const formatResult = (rawResult: unknown): string => {
    if (typeof rawResult === 'string') return rawResult
    if (typeof rawResult === 'object' && rawResult !== null) {
        return Object.entries(rawResult)
            .map(([key, value]) => `${capitalize(key)}: ${value}`)
            .join('\n')
    }
    return String(rawResult)
}
