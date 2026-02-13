// ============================================
// SOLO PLAY EXPANDED TABLES
// Based on Cyberpunk RED Single Player Mode
// Official data from the PDF - Additional tables
// Now powered by i18n for multilingual support
// ============================================

import i18n from '../../i18n'
import { getRandomFromArray, rollD6 } from './soloPlayTables'

// Helper to get table data from the 'tables' namespace
const tt = <T = string[]>(key: string): T =>
    i18n.t(key, { ns: 'tables', returnObjects: true }) as T

// ============================================
// SENSORY TABLES
// ============================================

export const sightsTable = () => tt('sensory.sights')
export const soundsTable = () => tt('sensory.sounds')
export const smellsTable = () => tt('sensory.smells')

// ============================================
// PLACES TO LIVE
// ============================================

export interface PlaceToLive {
    name: string
    description: string
}

export const cubeHotelsTable = () => tt<PlaceToLive[]>('places.cubeHotels')
export const cargoContainersTable = () => tt<PlaceToLive[]>('places.cargoContainers')
export const corporateConaptsTable = () => tt<PlaceToLive[]>('places.corporateConapts')
export const apartmentBuildingsTable = () => tt<PlaceToLive[]>('places.apartments')

// ============================================
// NIGHT CITY VENUES
// ============================================

export interface Venue {
    name: string
    description: string
}

export const nightCityHotspotsTable = () => tt<Venue[]>('venues.hotspots')
export const nightCityBarsTable = () => tt<Venue[]>('venues.bars')

// ============================================
// RANDOM RELATIONSHIPS & VISITORS
// ============================================

export const randomRelationshipsTable = () => tt('relationships')
export const visitorsTable = () => tt('visitors')

// ============================================
// NAMES
// ============================================

export const mascNamesTable = () => tt('names.masculine')
export const femmeNamesTable = () => tt('names.feminine')
export const nonbinaryNamesTable = () => tt('names.nonbinary')
export const handlesTable = () => tt('names.handles')

// ============================================
// ROLES & NPCs BY ROLE
// ============================================

export const rolesTable = () => tt('roles')

export interface NamedNPC {
    name: string
    notes: string
}

export const npcExecsTable = () => tt<NamedNPC[]>('npcsNamed.execs')
export const npcFixersTable = () => tt<NamedNPC[]>('npcsNamed.fixers')
export const npcLawmenTable = () => tt<NamedNPC[]>('npcsNamed.lawmen')
export const npcMediasTable = () => tt<NamedNPC[]>('npcsNamed.medias')
export const npcMedtechsTable = () => tt<NamedNPC[]>('npcsNamed.medtechs')
export const npcNetrunnersTable = () => tt<NamedNPC[]>('npcsNamed.netrunners')
export const npcNomadsTable = () => tt<NamedNPC[]>('npcsNamed.nomads')
export const npcRockerboysTable = () => tt<NamedNPC[]>('npcsNamed.rockerboys')
export const npcSolosTable = () => tt<NamedNPC[]>('npcsNamed.solos')
export const npcTechsTable = () => tt<NamedNPC[]>('npcsNamed.techs')
export const npcNoRoleTable = () => tt<NamedNPC[]>('npcsNamed.noRole')

// Map roles to their NPC tables for easy lookup
export const getNpcByRoleMap = (): Record<string, NamedNPC[]> => ({
    Exec: npcExecsTable(),
    Fixer: npcFixersTable(),
    Lawman: npcLawmenTable(),
    Media: npcMediasTable(),
    Medtech: npcMedtechsTable(),
    Netrunner: npcNetrunnersTable(),
    Nomad: npcNomadsTable(),
    Rockerboy: npcRockerboysTable(),
    Solo: npcSolosTable(),
    Tech: npcTechsTable(),
})

// ============================================
// THINGS
// ============================================

export const fashionTable = () => tt('things.fashion')
export const fashionwareTable = () => tt('things.fashionware')
export const blackIceTable = () => tt('things.blackIce')
export const firearmsTable = () => tt('things.firearms')

export interface FlavorItem {
    flavor: string
    description: string
}

export const kibbleFlavorsTable = () => tt<FlavorItem[]>('things.kibbleFlavors')
export const tritiFizzTable = () => tt<FlavorItem[]>('things.tritiFizz')

// ============================================
// CORPSE LOOT
// ============================================

export const corpseLootStreetratTable = () => tt('corpseLoot.streetrat')
export const corpseLootEdgerunnerTable = () => tt('corpseLoot.edgerunner')
export const corpseLootCorporateTable = () => tt('corpseLoot.corporate')

// ============================================
// MISSION ITEMS / MACGUFFINS
// ============================================

export const missionItemsCorporateTable = () => tt('missionItems.corporate')
export const missionItemsModerateTable = () => tt('missionItems.moderate')
export const missionItemsStreetTable = () => tt('missionItems.street')
export const missionItemsNomadTable = () => tt('missionItems.nomad')

// ============================================
// RANDOM ENCOUNTERS
// ============================================

export const encounterCorpDay = () => tt('encounters.corpDay')
export const encounterCorpNight = () => tt('encounters.corpNight')
export const encounterCorpMidnight = () => tt('encounters.corpMidnight')
export const encounterModerateDay = () => tt('encounters.moderateDay')
export const encounterModerateNight = () => tt('encounters.moderateNight')
export const encounterModerateMidnight = () => tt('encounters.moderateMidnight')
export const encounterCombatZoneDay = () => tt('encounters.combatZoneDay')
export const encounterCombatZoneNight = () => tt('encounters.combatZoneNight')
export const encounterCombatZoneMidnight = () => tt('encounters.combatZoneMidnight')
export const encounterOutskirtsDay = () => tt('encounters.outskirtsDay')
export const encounterOutskirtsNight = () => tt('encounters.outskirtsNight')
export const encounterOutskirtsMidnight = () => tt('encounters.outskirtsMidnight')

export type EncounterZone = 'corporate' | 'moderate' | 'combatZone' | 'outskirts'
export type EncounterTime = 'day' | 'night' | 'midnight'

export const getEncounterTablesMap = (): Record<EncounterZone, Record<EncounterTime, string[]>> => ({
    corporate: {
        day: encounterCorpDay(),
        night: encounterCorpNight(),
        midnight: encounterCorpMidnight(),
    },
    moderate: {
        day: encounterModerateDay(),
        night: encounterModerateNight(),
        midnight: encounterModerateMidnight(),
    },
    combatZone: {
        day: encounterCombatZoneDay(),
        night: encounterCombatZoneNight(),
        midnight: encounterCombatZoneMidnight(),
    },
    outskirts: {
        day: encounterOutskirtsDay(),
        night: encounterOutskirtsNight(),
        midnight: encounterOutskirtsMidnight(),
    },
})

// ============================================
// MEDIA
// ============================================

export interface RadioStation {
    station: string
    focus: string
}

export interface TVShow {
    show: string
    notes: string
}

export const radioStationsTable = () => tt<RadioStation[]>('media.radioStations')
export const whatsOnScreenTable = () => tt<TVShow[]>('media.tvShows')
export const advertisementsTable = () => tt<{ product: string; ad: string }[]>('media.advertisements')

// ============================================
// GENERATOR FUNCTIONS
// ============================================

/** Roll a random sensory detail (sight, sound, or smell) */
export const generateSensoryDetail = (): { type: string; detail: string } => {
    const types = tt<Record<string, string>>('generator.sensoryTypes')
    const typeRoll = rollD6()
    if (typeRoll <= 2) return { type: types.sight, detail: getRandomFromArray(sightsTable()) }
    if (typeRoll <= 4) return { type: types.sound, detail: getRandomFromArray(soundsTable()) }
    return { type: types.smell, detail: getRandomFromArray(smellsTable()) }
}

/** Roll a random place to live */
export const generatePlaceToLive = (): { type: string; place: PlaceToLive } => {
    const types = tt<Record<string, string>>('generator.placeTypes')
    const typeRoll = rollD6()
    if (typeRoll <= 1) return { type: types.cubeHotel, place: getRandomFromArray(cubeHotelsTable()) }
    if (typeRoll <= 2) return { type: types.cargoContainer, place: getRandomFromArray(cargoContainersTable()) }
    if (typeRoll <= 4) return { type: types.corporateConapt, place: getRandomFromArray(corporateConaptsTable()) }
    return { type: types.apartment, place: getRandomFromArray(apartmentBuildingsTable()) }
}

/** Roll a random name by type */
export const generateRandomName = (type?: 'masc' | 'femme' | 'nonbinary'): { name: string; type: string } => {
    const types = tt<Record<string, string>>('generator.nameTypes')
    const nameType = type || (['masc', 'femme', 'nonbinary'] as const)[Math.floor(Math.random() * 3)]
    switch (nameType) {
        case 'masc': return { name: getRandomFromArray(mascNamesTable()), type: types.masc }
        case 'femme': return { name: getRandomFromArray(femmeNamesTable()), type: types.femme }
        case 'nonbinary': return { name: getRandomFromArray(nonbinaryNamesTable()), type: types.nonbinary }
    }
}

/** Roll a random handle */
export const generateHandle = (): string => getRandomFromArray(handlesTable())

/** Roll a random NPC by role */
export const generateNPCByRole = (role?: string): { role: string; npc: NamedNPC } => {
    const selectedRole = role || getRandomFromArray(rolesTable())
    const roleMap = getNpcByRoleMap()
    const table = roleMap[selectedRole] || npcNoRoleTable()
    return { role: selectedRole, npc: getRandomFromArray(table) }
}

/** Roll a random encounter for a given zone and time */
export const generateRandomEncounter = (zone: EncounterZone, time: EncounterTime): string => {
    const map = getEncounterTablesMap()
    return getRandomFromArray(map[zone][time])
}

/** Roll random corpse loot by type */
export const generateCorpseLoot = (type: 'streetrat' | 'edgerunner' | 'corporate'): string => {
    switch (type) {
        case 'streetrat': return getRandomFromArray(corpseLootStreetratTable())
        case 'edgerunner': return getRandomFromArray(corpseLootEdgerunnerTable())
        case 'corporate': return getRandomFromArray(corpseLootCorporateTable())
    }
}

/** Roll a random radio station */
export const generateRadioStation = (): RadioStation => getRandomFromArray(radioStationsTable())

/** Roll what's on screen */
export const generateTVShow = (): TVShow => getRandomFromArray(whatsOnScreenTable())

/** Roll a random mission item/macguffin */
export const generateMissionItem = (zone?: 'corporate' | 'moderate' | 'street' | 'nomad'): { zone: string; item: string } => {
    const zones = tt<Record<string, string>>('generator.missionZones')
    if (!zone) {
        const zoneRoll = rollD6()
        if (zoneRoll <= 2) zone = 'corporate'
        else if (zoneRoll <= 3) zone = 'moderate'
        else if (zoneRoll <= 5) zone = 'street'
        else zone = 'nomad'
    }
    switch (zone) {
        case 'corporate': return { zone: zones.corporate, item: getRandomFromArray(missionItemsCorporateTable()) }
        case 'moderate': return { zone: zones.moderate, item: getRandomFromArray(missionItemsModerateTable()) }
        case 'street': return { zone: zones.street, item: getRandomFromArray(missionItemsStreetTable()) }
        case 'nomad': return { zone: zones.nomad, item: getRandomFromArray(missionItemsNomadTable()) }
    }
}

/** Roll a random venue (hotspot or bar) */
export const generateVenue = (): { type: string; venue: Venue } => {
    const types = tt<Record<string, string>>('generator.venueTypes')
    const isHotspot = rollD6() <= 3
    if (isHotspot) return { type: types.hotspot, venue: getRandomFromArray(nightCityHotspotsTable()) }
    return { type: types.bar, venue: getRandomFromArray(nightCityBarsTable()) }
}

/** Roll a random kibble or triti-fizz flavor */
export const generateFlavor = (): { type: string; flavor: FlavorItem } => {
    const isKibble = rollD6() <= 3
    if (isKibble) return { type: 'Kibble', flavor: getRandomFromArray(kibbleFlavorsTable()) }
    return { type: 'Triti-Fizz', flavor: getRandomFromArray(tritiFizzTable()) }
}

/** Roll a random relationship */
export const generateRelationship = (): string => getRandomFromArray(randomRelationshipsTable())

/** Roll a random visitor type */
export const generateVisitor = (): string => getRandomFromArray(visitorsTable())

/** Roll a random fashion */
export const generateFashion = (): string => getRandomFromArray(fashionTable())

/** Roll a random fashionware */
export const generateFashionware = (): string => getRandomFromArray(fashionwareTable())

/** Roll a random black ICE */
export const generateBlackIce = (): string => getRandomFromArray(blackIceTable())

/** Roll a random firearm type */
export const generateFirearm = (): string => getRandomFromArray(firearmsTable())

// === Individual table generators (split from combined generators) ===

/** Roll a random sight */
export const generateSight = (): string => getRandomFromArray(sightsTable())

/** Roll a random sound */
export const generateSound = (): string => getRandomFromArray(soundsTable())

/** Roll a random smell */
export const generateSmell = (): string => getRandomFromArray(smellsTable())

/** Roll a random hotspot */
export const generateHotspot = (): { name: string; description: string } => getRandomFromArray(nightCityHotspotsTable())

/** Roll a random bar */
export const generateBar = (): { name: string; description: string } => getRandomFromArray(nightCityBarsTable())

/** Roll a random cube hotel */
export const generateCubeHotel = (): PlaceToLive => getRandomFromArray(cubeHotelsTable())

/** Roll a random cargo container community */
export const generateCargoContainer = (): PlaceToLive => getRandomFromArray(cargoContainersTable())

/** Roll a random corporate conapt */
export const generateCorporateConapt = (): PlaceToLive => getRandomFromArray(corporateConaptsTable())

/** Roll a random apartment building */
export const generateApartment = (): PlaceToLive => getRandomFromArray(apartmentBuildingsTable())

/** Roll a random kibble flavor */
export const generateKibbleFlavor = (): FlavorItem => getRandomFromArray(kibbleFlavorsTable())

/** Roll a random triti-fizz flavor */
export const generateTritiFizz = (): FlavorItem => getRandomFromArray(tritiFizzTable())

/** Roll a random advertisement */
export const generateAdvertisement = (): { product: string; ad: string } => getRandomFromArray(advertisementsTable())
