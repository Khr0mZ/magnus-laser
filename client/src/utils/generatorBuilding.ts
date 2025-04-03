// Random name components
import { v4 as uuidv4 } from 'uuid'
import { Building, BuildingType, Event, Ownership, Secret, SecurityPersonnel, Style } from '../graphql/types'
import { buildingNameData, commonNameElements } from './constants'
import { getRandomElement, getRandomInt } from './functions'

/**
 * Internal function to generate a building name
 * @param type - The type of building
 * @param style - The style of the building
 * @param ownership - The ownership of the building
 * @param isAbandoned - Whether the building is abandoned
 * @returns A building name
 */
function generateBuildingName(type: BuildingType, style: Style, ownership: Ownership, isAbandoned: boolean): string {
    // Add abandoned qualifier if applicable
    const abandonedPrefix = isAbandoned
        ? `${getRandomElement(buildingNameData[BuildingType.ABANDONED_BUILDING].buildingTypeWords || [])} `
        : ''

    // Get appropriate naming patterns for this building type
    const appropriatePatterns = buildingNameData[type].preferredPatterns || [1, 2, 3]
    const namingPattern = getRandomElement(appropriatePatterns)

    // Check if this building has corporate affiliation based on type and ownership
    const hasCorpoAffiliation =
        buildingNameData[type].corpoAffiliation || buildingNameData[ownership]?.corpoAffiliation || false

    // Corpo prefix for corporate affiliated buildings
    const corpoName = hasCorpoAffiliation ? getRandomElement(commonNameElements.corpoPrefixes) : ''

    // Style-specific naming
    const styleWord = getRandomElement(buildingNameData[style].styleAdjectives || [])

    // Type-specific terminology
    const typeWord = getRandomElement(buildingNameData[type].buildingTypeWords || [])

    // Suffix options
    const buildingSuffix = getRandomElement(commonNameElements.buildingSuffixes)

    // District names for location-based naming
    const districtName = getRandomElement(commonNameElements.districtNames)

    // Numbers for addresses or building numbers
    const buildingNumber = getRandomInt(1, 999)

    // Street names
    const streetName = `${getRandomElement(commonNameElements.landmarkPrefixes)} ${getRandomInt(
        1,
        50
    )} ${getRandomElement(commonNameElements.streetSuffixes)}`

    // Name generation patterns
    let name = ''

    switch (namingPattern) {
        case 1: // Simple style + type + suffix: "Minimalist Tower Complex"
            name = `${styleWord} ${typeWord} ${buildingSuffix}`
            break
        case 2: // Corpo-owned naming: "Arasaka Executive Tower"
            name = corpoName
                ? `${corpoName} ${styleWord} ${buildingSuffix}`
                : `${styleWord} ${typeWord} ${buildingSuffix}`
            break
        case 3: // District-based naming: "Watson Heights"
            name = `${districtName} ${buildingSuffix}`
            break
        case 4: // Numbered building: "Block 403"
            name = `${typeWord} ${buildingNumber}`
            break
        case 5: // Address-style: "21 North Oak Boulevard"
            name = `${buildingNumber} ${districtName} ${getRandomElement(commonNameElements.streetSuffixes)}`
            break
        case 6: // Landmark style: "Central Plaza Hub"
            name = `${getRandomElement(commonNameElements.landmarkPrefixes)} ${typeWord} ${buildingSuffix}`
            break
        case 7: // The + adjective + suffix: "The Radiant Tower"
            name = `The ${styleWord} ${buildingSuffix}`
            break
        case 8: // Possessive naming: "Freeman's Market" or "Rodriguez Arcade"
            // For small businesses, sometimes use "Surname BusinessType" format instead of possessive
            if (ownership === Ownership.SMALL_BUSINESS && Math.random() < 0.6) {
                name = `${getRandomElement(commonNameElements.surnames)} ${typeWord}`
            } else {
                name = `${getRandomElement(commonNameElements.surnames)}'s ${typeWord}`
            }
            break
        case 9: // Compound names: "NightGlow Center"
            name = `${getRandomElement(commonNameElements.compoundPrefixes)}${getRandomElement(
                commonNameElements.compoundSuffixes
            )} ${buildingSuffix}`
            break
        case 10: // Street address: "21 North Oak Building"
            name = `${buildingNumber} ${streetName} ${buildingSuffix}`
            break
        case 11: // Style + district: "Luxury North Oak"
            name = `${styleWord} ${districtName}`
            break
        case 12: // For abandoned or construction: "Former Arasaka Research Facility"
            if (isAbandoned) {
                name = `Former ${corpoName ? corpoName + ' ' : ''}${typeWord} ${buildingSuffix}`
            } else if (type === BuildingType.VACANT_LOT_CONSTRUCTION_SITE) {
                name = `${corpoName ? corpoName + ' ' : ''}${typeWord} Site ${buildingNumber}`
            } else {
                name = `${styleWord} ${typeWord} ${buildingSuffix}`
            }
            break
        default:
            name = `${styleWord} ${typeWord} ${buildingSuffix}`
    }

    // Apply style-specific modifications to make names more natural
    const nameModifier = buildingNameData[style].nameModifier
    if (nameModifier) {
        name = nameModifier(name, typeWord, buildingSuffix)
    }

    // Add abandoned prefix if applicable
    name = abandonedPrefix + name.trim()

    // Clean up excess spaces
    name = name.replace(/\s+/g, ' ').trim()

    return name
}

/**
 * Generate a random building
 * @param jobDifficultyModifier - The job difficulty modifier
 * @param building - The building object with the desired properties
 * @returns A building
 */
export const generateRandomBuilding = (jobDifficultyModifier: number, building?: Partial<Building>): Building => {
    // jobDifficultyModifier is a number between 0 and 2 that is used to modify all the rolls for the building properties
    // Things to generate
    // - Type
    // - Elevators
    // - Parking
    // - Gatehouse / Front Desk
    // - Emergency Exit
    // - Backup Lights
    // - Landing Pad
    // - Secret Or Alt Entrance
    // - Ownership
    // - Security Personnel
    // - Style
    // - Event
    // - Secret
    // - Name
    // TODO: - Description

    // Generate Building Type
    // If buildingTypeRoll + jobDifficultyModifier is 1, we need to roll again
    let isAbandoned = false
    let buildingTypeRoll = getRandomInt(1, 10) + jobDifficultyModifier
    while (buildingTypeRoll === 1) {
        isAbandoned = true
        buildingTypeRoll = getRandomInt(1, 10) + jobDifficultyModifier
    }
    let type: BuildingType
    switch (buildingTypeRoll) {
        case 2:
            type = BuildingType.VACANT_LOT_CONSTRUCTION_SITE
            break
        case 3:
            type = BuildingType.CUBE_HOTEL_MOTEL_CARGO_CONTAINER
            break
        case 4:
            type = BuildingType.PUBLIC_SPACE
            break
        case 5:
            type = BuildingType.ESTABLISHMENT
            break
        case 6:
            type = BuildingType.MULTI_STORY_BUILDING
            break
        case 7:
            type = BuildingType.SKYSCRAPER_MEGABUILDING
            break
        case 8:
            type = BuildingType.COMMERCIAL_BUILDING
            break
        case 9:
            type = BuildingType.CORPO_BUILDING
            break
        case 10:
            type = BuildingType.LUXURY_PENTHOUSE_MCMANSION
            break
        case 11:
            type = BuildingType.GOV_BUILDING
            break
        case 12:
            type = BuildingType.MEGACORPO_HQ
            break
        default:
            type = BuildingType.VACANT_LOT_CONSTRUCTION_SITE
            break
    }
    // Generate boolean properties based on building type
    let elevators = false
    let parking = false
    let gatehouseFrontDesk = false
    let emergencyExit = false
    let backupLights = false
    let landingPad = false
    let secretOrAltEntrance = false
    switch (buildingTypeRoll) {
        case 2:
            // Elevators DV8
            // Parking DV6
            // Gatehouse Front Desk DV8
            // Emergency Exit DV9
            // Backup Lights DV8
            // Landing Pad DV8
            // Secret Or Alt Entrance DV3
            elevators = getRandomInt(1, 10) <= 8
            parking = getRandomInt(1, 10) <= 6
            gatehouseFrontDesk = getRandomInt(1, 10) <= 8
            emergencyExit = getRandomInt(1, 10) <= 9
            backupLights = getRandomInt(1, 10) <= 8
            landingPad = getRandomInt(1, 10) <= 8
            secretOrAltEntrance = getRandomInt(1, 10) <= 3
            break
        case 3:
            // Elevators DV6
            // Parking DV6
            // Gatehouse Front Desk DV4
            // Emergency Exit DV7
            // Backup Lights DV7
            // Landing Pad DV9
            // Secret Or Alt Entrance DV6
            elevators = getRandomInt(1, 10) <= 6
            parking = getRandomInt(1, 10) <= 6
            gatehouseFrontDesk = getRandomInt(1, 10) <= 4
            emergencyExit = getRandomInt(1, 10) <= 7
            backupLights = getRandomInt(1, 10) <= 7
            landingPad = getRandomInt(1, 10) <= 9
            secretOrAltEntrance = getRandomInt(1, 10) <= 6
            break
        case 4:
            // Elevators DV8
            // Parking DV8
            // Gatehouse Front Desk DV6
            // Emergency Exit DV9
            // Backup Lights DV8
            // Landing Pad DV7
            // Secret Or Alt Entrance DV2
            elevators = getRandomInt(1, 10) <= 8
            parking = getRandomInt(1, 10) <= 8
            gatehouseFrontDesk = getRandomInt(1, 10) <= 6
            emergencyExit = getRandomInt(1, 10) <= 9
            backupLights = getRandomInt(1, 10) <= 8
            landingPad = getRandomInt(1, 10) <= 7
            secretOrAltEntrance = getRandomInt(1, 10) <= 2
            break
        case 5:
            // Elevators DV8
            // Parking DV6
            // Gatehouse Front Desk DV9
            // Emergency Exit DV8
            // Backup Lights DV7
            // Landing Pad DV9
            // Secret Or Alt Entrance DV5
            elevators = getRandomInt(1, 10) <= 8
            parking = getRandomInt(1, 10) <= 6
            gatehouseFrontDesk = getRandomInt(1, 10) <= 9
            emergencyExit = getRandomInt(1, 10) <= 8
            backupLights = getRandomInt(1, 10) <= 7
            landingPad = getRandomInt(1, 10) <= 9
            secretOrAltEntrance = getRandomInt(1, 10) <= 5
            break
        case 6:
            // Elevators DV6
            // Parking DV7
            // Gatehouse Front Desk DV8
            // Emergency Exit DV6
            // Backup Lights DV7
            // Landing Pad DV8
            // Secret Or Alt Entrance DV7
            elevators = getRandomInt(1, 10) <= 6
            parking = getRandomInt(1, 10) <= 7
            gatehouseFrontDesk = getRandomInt(1, 10) <= 8
            emergencyExit = getRandomInt(1, 10) <= 6
            backupLights = getRandomInt(1, 10) <= 7
            landingPad = getRandomInt(1, 10) <= 8
            secretOrAltEntrance = getRandomInt(1, 10) <= 7
            break
        case 7:
            // Elevators DV1
            // Parking DV5
            // Gatehouse Front Desk DV7
            // Emergency Exit DV3
            // Backup Lights DV4
            // Landing Pad DV4
            // Secret Or Alt Entrance DV5
            elevators = getRandomInt(1, 10) <= 1
            parking = getRandomInt(1, 10) <= 5
            gatehouseFrontDesk = getRandomInt(1, 10) <= 7
            emergencyExit = getRandomInt(1, 10) <= 3
            backupLights = getRandomInt(1, 10) <= 4
            landingPad = getRandomInt(1, 10) <= 4
            secretOrAltEntrance = getRandomInt(1, 10) <= 5
            break
        case 8:
            // Elevators DV6
            // Parking DV4
            // Gatehouse Front Desk DV6
            // Emergency Exit DV5
            // Backup Lights DV3
            // Landing Pad DV8
            // Secret Or Alt Entrance DV4
            elevators = getRandomInt(1, 10) <= 6
            parking = getRandomInt(1, 10) <= 4
            gatehouseFrontDesk = getRandomInt(1, 10) <= 6
            emergencyExit = getRandomInt(1, 10) <= 5
            backupLights = getRandomInt(1, 10) <= 3
            landingPad = getRandomInt(1, 10) <= 8
            secretOrAltEntrance = getRandomInt(1, 10) <= 4
            break
        case 9:
            // Elevators DV4
            // Parking DV3
            // Gatehouse Front Desk DV3
            // Emergency Exit DV4
            // Backup Lights DV2
            // Landing Pad DV2
            // Secret Or Alt Entrance DV8
            elevators = getRandomInt(1, 10) <= 4
            parking = getRandomInt(1, 10) <= 3
            gatehouseFrontDesk = getRandomInt(1, 10) <= 3
            emergencyExit = getRandomInt(1, 10) <= 4
            backupLights = getRandomInt(1, 10) <= 2
            landingPad = getRandomInt(1, 10) <= 2
            secretOrAltEntrance = getRandomInt(1, 10) <= 8
            break
        case 10:
            // Elevators DV7
            // Parking DV9
            // Gatehouse Front Desk DV4
            // Emergency Exit DV6
            // Backup Lights DV4
            // Landing Pad DV3
            // Secret Or Alt Entrance DV9
            elevators = getRandomInt(1, 10) <= 7
            parking = getRandomInt(1, 10) <= 9
            gatehouseFrontDesk = getRandomInt(1, 10) <= 4
            emergencyExit = getRandomInt(1, 10) <= 6
            backupLights = getRandomInt(1, 10) <= 4
            landingPad = getRandomInt(1, 10) <= 3
            secretOrAltEntrance = getRandomInt(1, 10) <= 9
            break
        case 11:
            // Elevators DV5
            // Parking DV3
            // Gatehouse Front Desk DV2
            // Emergency Exit DV5
            // Backup Lights DV6
            // Landing Pad DV5
            // Secret Or Alt Entrance DV7
            elevators = getRandomInt(1, 10) <= 5
            parking = getRandomInt(1, 10) <= 3
            gatehouseFrontDesk = getRandomInt(1, 10) <= 2
            emergencyExit = getRandomInt(1, 10) <= 5
            backupLights = getRandomInt(1, 10) <= 6
            landingPad = getRandomInt(1, 10) <= 5
            secretOrAltEntrance = getRandomInt(1, 10) <= 7
            break
        case 12:
            // Elevators DV1
            // Parking DV2
            // Gatehouse Front Desk DV1
            // Emergency Exit DV4
            // Backup Lights DV1
            // Landing Pad DV1
            // Secret Or Alt Entrance DV7
            elevators = true
            parking = getRandomInt(1, 10) <= 2
            gatehouseFrontDesk = true
            emergencyExit = getRandomInt(1, 10) <= 4
            backupLights = true
            landingPad = true
            secretOrAltEntrance = getRandomInt(1, 10) <= 7
            break
        default:
            break
    }
    // Generate ownership
    const ownershipRoll = getRandomInt(1, 10) + jobDifficultyModifier
    let ownership: Ownership
    switch (ownershipRoll) {
        case 1:
            ownership = Ownership.NO_ONE_SCAVS
            break
        case 2:
            ownership = Ownership.LOW_LEVEL_GONKS
            break
        case 3:
            ownership = Ownership.GANG_MAFIA
            break
        case 4:
            ownership = Ownership.POSERGANG
            break
        case 5:
            ownership = Ownership.BYSTANDER
            break
        case 6:
            ownership = Ownership.FIXER
            break
        case 7:
            ownership = Ownership.SMALL_BUSINESS
            break
        case 8:
            ownership = Ownership.LOCAL_GOV
            break
        case 9:
            ownership = Ownership.CORPO
            break
        case 10:
            ownership = Ownership.MILITARISTIC_GANG
            break
        case 11:
            ownership = Ownership.GOVERNMENT
            break
        case 12:
            ownership = Ownership.MEGA_CORPO
            break
        default:
            ownership = Ownership.NO_ONE_SCAVS
            break
    }
    // Generate security personnel based on ownership and building type
    const securityPersonnelRoll = getRandomInt(1, 10) + jobDifficultyModifier
    let securityPersonnel: SecurityPersonnel
    switch (securityPersonnelRoll) {
        case 1:
            securityPersonnel = SecurityPersonnel.NONE
            break
        case 2:
            securityPersonnel = SecurityPersonnel.LOCALS_TENNANTS
            break
        case 3:
            securityPersonnel = SecurityPersonnel.LOCAL_SEC_GANG
            break
        case 4:
            securityPersonnel = SecurityPersonnel.VEHICLES
            break
        case 5:
            securityPersonnel = SecurityPersonnel.CITY_SEC
            break
        case 6:
            securityPersonnel = SecurityPersonnel.CORPO_SEC
            break
        case 7:
            securityPersonnel = SecurityPersonnel.RESPONSE_BACKUP
            break
        case 8:
            securityPersonnel = SecurityPersonnel.HEAVY_WEAPONS
            break
        case 9:
            securityPersonnel = SecurityPersonnel.HEAVY_VEHICLES
            break
        case 10:
            securityPersonnel = SecurityPersonnel.FAST_RESPONSE_BACKUP
            break
        case 11:
            securityPersonnel = SecurityPersonnel.ELITE_TROOPS
            break
        case 12:
            securityPersonnel = SecurityPersonnel.BORG
            break
        default:
            securityPersonnel = SecurityPersonnel.NONE
            break
    }
    // Generate Style
    const styleRoll = getRandomInt(1, 10) + jobDifficultyModifier
    let style: Style
    switch (styleRoll) {
        case 1:
            style = Style.AUSTERE
            break
        case 2:
            style = Style.SOVIETIC
            break
        case 3:
            style = Style.URBAN_GRAFFITI
            break
        case 4:
            style = Style.MODERN
            break
        case 5:
            style = Style.TRIBAL
            break
        case 6:
            style = Style.NEON_FEST
            break
        case 7:
            style = Style.EUROPEAN
            break
        case 8:
            style = Style.MILITARISTIC
            break
        case 9:
            style = Style.CORPORATE
            break
        case 10:
            style = Style.ORIENTAL
            break
        case 11:
            style = Style.EXOTIC
            break
        case 12:
            style = Style.LUXURIOUS
            break
        default:
            style = Style.AUSTERE
            break
    }
    // Generate random event
    const eventRoll = getRandomInt(1, 10) + jobDifficultyModifier
    let event: Event
    switch (eventRoll) {
        case 1:
            event = Event.CRUMBLING_DEMOLITION
            break
        case 2:
            event = Event.WORKERS_REMODELING
            break
        case 3:
            event = Event.MAINTENANCE_PROBLEM
            break
        case 4:
            event = Event.STRIKE
            break
        case 5:
            event = Event.PRIVATE_INVESTIGATOR
            break
        case 6:
            event = Event.ONGOING_KIDNAP
            break
        case 7:
            event = Event.NETRUNNER_MESSING_WITH_SYSTEMS
            break
        case 8:
            event = Event.GUN_FIGHT
            break
        case 9:
            event = Event.OWNERS_COLLECTING_RENT
            break
        case 10:
            event = Event.EDGERUNNERS_GOING_SAME_PLACE
            break
        case 11:
            event = Event.STRONG_SECURITY_PRESENCE
            break
        case 12:
            event = Event.ELITE_CREW_VISITING
            break
        default:
            event = Event.CRUMBLING_DEMOLITION
            break
    }
    // Generate secret
    const secretRoll = getRandomInt(1, 10) + jobDifficultyModifier
    let secret: Secret
    switch (secretRoll) {
        case 1:
            secret = Secret.PARTY
            break
        case 2:
            secret = Secret.DRUG_STASH
            break
        case 3:
            secret = Secret.FIXER_ARRANGEMENT
            break
        case 4:
            secret = Secret.DRUG_LAB
            break
        case 5:
            secret = Secret.SOMEONE_KIDNAPPED
            break
        case 6:
            secret = Secret.WEAPON_STASH
            break
        case 7:
            secret = Secret.DATA_STORE_NETRUNNER_DEN
            break
        case 8:
            secret = Secret.MEDIA_INVESTIGATION
            break
        case 9:
            secret = Secret.ACTIVIST_SABOTAGE
            break
        case 10:
            secret = Secret.SAFE_HOUSE
            break
        case 11:
            secret = Secret.COVERT_OP_MEETING_POINT
            break
        case 12:
            secret = Secret.SECRET_SCIENCE_LAB
            break
        default:
            secret = Secret.PARTY
            break
    }

    // Generate building name
    const name = generateBuildingName(type, style, ownership, isAbandoned)

    // TODO: Generate Description
    const description = 'Description goes here'
    // Create the building object
    const newBuilding: Building = {
        ID: uuidv4(),
        name,
        description,
        type,
        isAbandoned,
        elevators,
        parking,
        gatehouseFrontDesk,
        emergencyExit,
        backupLights,
        landingPad,
        secretOrAltEntrance,
        ownership,
        securityPersonnel,
        style,
        event,
        secret,
        ...building, // Override with any provided properties
    }

    return newBuilding
}
