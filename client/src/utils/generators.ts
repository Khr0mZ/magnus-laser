// Random name components
import {
    Armor,
    Attitude,
    Building,
    BuildingType,
    Dices,
    DifficultyValue,
    Event,
    Flaw,
    Gang,
    GangColor,
    GangName,
    GangNews,
    GangStatus,
    GangType,
    KnownFor,
    KnownForPart1,
    KnownForPart2,
    Ownership,
    Quality,
    Secret,
    SecurityPersonnel,
    Sin,
    Style,
} from '../graphql/types'

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get a random element from an array
 */
const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)]
}

/**
 * Get a random enum value
 */
const getRandomEnum = <T>(enumObj: Record<string, string | number>): T => {
    const values = Object.values(enumObj).filter((v) => typeof v === 'string') as string[]
    return values[Math.floor(Math.random() * values.length)] as unknown as T
}

/**
 * Get a random integer in range (inclusive)
 */
const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// ==========================================
// Gang Generator Functions
// ==========================================

/**
 * Generate display name for a gang
 */
const generateGangDisplayName = (name: GangName, color: GangColor, type: GangType): string => {
    // Create a display name based on the gang properties
    const adjectives: Record<GangName, string[]> = {
        [GangName.ADJECTIVE]: ['Wild', 'Fierce', 'Deadly', 'Savage', 'Brutal', 'Lethal', 'Ruthless', 'Merciless'],
        [GangName.ANIMAL]: ['Wolf', 'Lion', 'Tiger', 'Snake', 'Dragon', 'Scorpion', 'Shark', 'Panther'],
        [GangName.BODY_PART]: ['Skull', 'Fist', 'Eye', 'Brain', 'Heart', 'Hand', 'Blood', 'Bone'],
        [GangName.COLOR]: [color.toLowerCase().charAt(0).toUpperCase() + color.toLowerCase().slice(1)],
        [GangName.NEIGHBORHOOD]: ['Downtown', 'Eastside', 'Westside', 'Northside', 'Southside', 'Central', 'Outskirts'],
        [GangName.NUMBER]: ['13', '7', '101', '666', '777', '187', '911', '420'],
        [GangName.PLACE]: ['Street', 'Alley', 'Avenue', 'Highway', 'Boulevard', 'District', 'Zone', 'Block'],
        [GangName.PROFESSION]: ['Techie', 'Runner', 'Fixer', 'Solo', 'Nomad', 'Medic', 'Corporate', 'Cop'],
        [GangName.WEAPON]: ['Blade', 'Gun', 'Rifle', 'Pistol', 'Shotgun', 'Knife', 'Sword', 'Katana'],
        [GangName.WEATHER_PHENOMENA]: [
            'Thunder',
            'Lightning',
            'Storm',
            'Cyclone',
            'Typhoon',
            'Hurricane',
            'Tornado',
            'Tsunami',
        ],
    }

    const suffixes: Record<GangType, string[]> = {
        [GangType.BOOSTER]: ['Demons', 'Devils', 'Killers', 'Savages', 'Warriors', 'Thugs', 'Destroyers', 'Reapers'],
        [GangType.EDGERUNNER]: ['Runners', 'Edges', 'Shadows', 'Ghosts', 'Phantoms', 'Spectres', 'Wraiths', 'Vectors'],
        [GangType.FREELANCER]: [
            'Freelancers',
            'Mercs',
            'Guns',
            'Soldiers',
            'Contractors',
            'Agents',
            'Operatives',
            'Professionals',
        ],
        [GangType.GUARDIAN_VIGILANTE]: [
            'Guardians',
            'Protectors',
            'Shields',
            'Watchers',
            'Sentinels',
            'Wardens',
            'Keepers',
            'Defenders',
        ],
        [GangType.MILITARY]: ['Command', 'Battalion', 'Squad', 'Platoon', 'Corps', 'Force', 'Division', 'Regiment'],
        [GangType.POSER]: [
            'Posers',
            'Wannabes',
            'Fakers',
            'Pretenders',
            'Imitators',
            'Copycats',
            'Followers',
            'Imposters',
        ],
        [GangType.PRANKSTER]: [
            'Jokers',
            'Tricksters',
            'Jesters',
            'Fools',
            'Clowns',
            'Pranksters',
            'Comedians',
            'Mimes',
        ],
        [GangType.RELIGIOUS]: [
            'Disciples',
            'Believers',
            'Faithful',
            'Devotees',
            'Followers',
            'Prophets',
            'Saints',
            'Angels',
        ],
        [GangType.SYNDICATE]: ['Syndicate', 'Family', 'Mob', 'Clan', 'Cartel', 'Outfit', 'Organization', 'Network'],
        [GangType.YO]: ['Boys', 'Girls', 'Crew', 'Squad', 'Homies', 'Gang', 'Posse', 'Team'],
    }

    const adjective = getRandomElement(adjectives[name])
    const suffix = getRandomElement(suffixes[type])

    return `The ${adjective} ${suffix}`
}

// ==========================================
// Building Generator Functions
// ==========================================

/**
 * Generate display name for a building
 */
const generateBuildingDisplayName = (buildingType: BuildingType, style: Style, ownership: Ownership): string => {
    // Define name parts based on building type
    const corpoPrefixes = [
        'Arasaka',
        'Militech',
        'Biotechnica',
        'Petrochem',
        'Kang Tao',
        'Zetatech',
        'Night Corp',
        'Budget Arms',
        'Trauma Team',
        'Dynalar',
    ]
    const districtPrefixes = [
        'Watson',
        'Heywood',
        'Westbrook',
        'Pacifica',
        'Santo Domingo',
        'City Center',
        'Northside',
        'Kabuki',
        'Charter Hill',
        'Arroyo',
    ]
    const generalPrefixes = ['Neo', 'Cyber', 'Night', 'Chrome', 'Silver', 'Golden', 'Steel', 'Glass', 'Metro', 'Urban']
    const generalSuffixes = [
        'Plaza',
        'Heights',
        'Center',
        'Complex',
        'Hub',
        'Spire',
        'Tower',
        'Domain',
        'Quarters',
        'Arcade',
    ]

    // Style-based adjectives to incorporate architectural style into names
    const styleAdjectives: Record<Style, string[]> = {
        [Style.AUSTERE]: ['Austere', 'Sparse', 'Minimalist', 'Plain'],
        [Style.CORPORATE]: ['Corporate', 'Enterprise', 'Executive', 'Business'],
        [Style.EUROPEAN]: ['European', 'Continental', 'Classic', 'Old-World'],
        [Style.EXOTIC]: ['Exotic', 'Unusual', 'Rare', 'Foreign'],
        [Style.LUXURIOUS]: ['Luxurious', 'Opulent', 'Lavish', 'Extravagant'],
        [Style.MILITARISTIC]: ['Militaristic', 'Fortress', 'Bunker', 'Defense'],
        [Style.MODERN]: ['Modern', 'Contemporary', 'Current', 'Progressive'],
        [Style.NEON_FEST]: ['Neon', 'Glow', 'Electric', 'Luminous'],
        [Style.ORIENTAL]: ['Oriental', 'Eastern', 'Zen', 'Dynasty'],
        [Style.SOVIETIC]: ['Soviet', 'United', 'Red', 'Communist'],
        [Style.TRIBAL]: ['Tribal', 'Native', 'Indigenous', 'Ancestral'],
        [Style.URBAN_GRAFFITI]: ['Graffiti', 'Street', 'Urban', 'Tagged'],
    }

    // Get a style-appropriate adjective
    const styleAdj = getRandomElement(styleAdjectives[style])

    // Generate a name based on building type
    switch (buildingType) {
        case BuildingType.SKYSCRAPER_MEGABUILDING:
            return `${styleAdj} Megabuilding H${getRandomInt(1, 99)}`

        case BuildingType.MEGACORPO_HQ:
        case BuildingType.CORPO_BUILDING: {
            const corpo = getRandomElement(corpoPrefixes)
            return ownership === Ownership.MEGA_CORPO || ownership === Ownership.CORPO
                ? `${corpo} ${styleAdj} Tower`
                : `Former ${corpo} ${styleAdj} Building`
        }

        case BuildingType.COMMERCIAL_BUILDING: {
            const commercial = ['Mall', 'Market', 'Shopping Center', 'Mart', 'Outlet', 'Shops', 'Stores', 'Bazaar']
            const commercialName = getRandomElement(commercial)
            return `${getRandomElement(districtPrefixes)} ${styleAdj} ${commercialName}`
        }

        case BuildingType.ESTABLISHMENT: {
            const establishments = ['Club', 'Bar', 'Restaurant', 'Lounge', 'Cafe', 'Diner', 'Joint']
            const establishmentName = getRandomElement(establishments)
            const noun = ['Dragon', 'Tiger', 'Shark', 'Wolf', 'Leopard', 'Serpent', 'Raven', 'Phoenix', 'Lion', 'Fox']

            // Use both the style adjective and a color/theme adjective for establishments
            const themeAdjectives = [
                'Neon',
                'Dark',
                'Red',
                'Blue',
                'Black',
                'Silver',
                'Golden',
                'Midnight',
                'Chrome',
                'Cyber',
            ]

            // Use both adjectives for a more colorful establishment name
            return `The ${styleAdj} ${getRandomElement(themeAdjectives)} ${getRandomElement(noun)} ${establishmentName}`
        }

        case BuildingType.CUBE_HOTEL_MOTEL_CARGO_CONTAINER:
            return `${styleAdj} Cube Hotel ${getRandomInt(1, 99)}`

        case BuildingType.LUXURY_PENTHOUSE_MCMANSION: {
            const luxuryAdjectives = [
                'Luxury',
                'Elite',
                'Opulent',
                'Prestige',
                'Premium',
                'Executive',
                'Exclusive',
                'Deluxe',
            ]
            return `${styleAdj} ${getRandomElement(luxuryAdjectives)} Heights ${getRandomInt(1, 20)}`
        }

        case BuildingType.ABANDONED_BUILDING:
            return `Abandoned ${styleAdj} ${getRandomElement(generalPrefixes)}-${getRandomElement(generalSuffixes)}`

        case BuildingType.VACANT_LOT_CONSTRUCTION_SITE:
            return `${styleAdj} Construction Site ${getRandomInt(100, 999)}`

        default:
            // For all other types, use a generic format
            return `${styleAdj} ${getRandomElement(generalPrefixes)}-${getRandomElement(generalSuffixes)}`
    }
}

// ==========================================
// Public Generator Functions
// ==========================================

/**
 * Generate a random Gang based on GraphQL types
 * @returns A randomly generated Gang with display properties
 */
export const generateRandomGang = (): Gang & { displayName: string; description: string } => {
    // Required fields
    const armor: Armor = {
        __typename: 'Armor',
        h: getRandomInt(1, 10),
        spb: getRandomInt(1, 10),
    }

    const color = getRandomEnum<GangColor>(GangColor)

    const knownFor: KnownFor = {
        __typename: 'KnownFor',
        knownForPart1: getRandomEnum<KnownForPart1>(KnownForPart1),
        knownForPart2: getRandomEnum<KnownForPart2>(KnownForPart2),
    }

    const name = getRandomEnum<GangName>(GangName)
    const quality = getRandomEnum<Quality>(Quality)
    const secretive = getRandomInt(1, 10)
    const skill = getRandomInt(1, 10)
    const status = getRandomEnum<GangStatus>(GangStatus)
    const type = getRandomEnum<GangType>(GangType)

    const weapons: Dices = {
        __typename: 'Dices',
        d4: getRandomInt(1, 4),
        d6: getRandomInt(1, 6),
        d8: getRandomInt(1, 8),
        d10: getRandomInt(1, 10),
        d12: getRandomInt(1, 12),
        d20: getRandomInt(1, 20),
        d100: getRandomInt(1, 100),
    }

    // Optional fields (may be null)
    const currentAttitude = Math.random() > 0.2 ? getRandomEnum<Attitude>(Attitude) : null
    const flaw = Math.random() > 0.2 ? getRandomEnum<Flaw>(Flaw) : null
    const newsTheLeaderIsReceiving = Math.random() > 0.3 ? getRandomEnum<GangNews>(GangNews) : null
    const sin = Math.random() > 0.4 ? getRandomEnum<Sin>(Sin) : null

    // Generate gang object
    const gang: Gang = {
        __typename: 'Gang',
        armor,
        color,
        currentAttitude,
        flaw,
        knownFor,
        name,
        newsTheLeaderIsReceiving,
        quality,
        secretive,
        sin,
        skill,
        status,
        type,
        weapons,
    }

    // Simply store the raw display name components and suffix
    const nameComponents = {
        name,
        color,
        type,
    }

    // Store raw values for description
    const descriptionData = {
        gang,
        nameComponents,
    }

    return {
        ...gang,
        displayName: generateGangDisplayName(name, color, type),
        description: '',
        _nameComponents: nameComponents, // Add this for rendering components to use
        _descriptionData: descriptionData, // Add this for rendering components to use
    } as Gang & {
        displayName: string
        description: string
        _nameComponents: { name: GangName; color: GangColor; type: GangType }
    }
}

/**
 * Generate a random Building based on GraphQL types
 * @param jobTypeModifier Modifier to add to difficulty values (0 for easy, 1 for typical, 2 for dangerous)
 * @returns A randomly generated Building with display properties
 */
export const generateRandomBuilding = (
    jobTypeModifier: number = 0
): Building & {
    displayName: string
    description: string
    _nameComponents: { type: BuildingType; style: Style; ownership: Ownership }
    _descriptionData: {
        building: Building
        nameComponents: { type: BuildingType; style: Style; ownership: Ownership }
    }
    _jobType: string
} => {
    // Roll 1d10 for the building type
    const typeRoll = getRandomInt(1, 10) + jobTypeModifier

    // Ensure the roll stays within valid range (1-12)
    const clampedTypeRoll = Math.max(1, Math.min(12, typeRoll))

    // Map the roll to building types based on the reference table
    let type: BuildingType
    switch (clampedTypeRoll) {
        case 1:
            type = BuildingType.ABANDONED_BUILDING
            break
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
            type = BuildingType.MULTI_STORY_BUILDING // Fallback
    }

    // Fixed values from reference table for each feature
    const elevatorValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 8 },
        3: { __typename: 'DifficultyValue', value: 6 },
        4: { __typename: 'DifficultyValue', value: 8 },
        5: { __typename: 'DifficultyValue', value: 8 },
        6: { __typename: 'DifficultyValue', value: 6 },
        7: { __typename: 'DifficultyValue', value: 1 },
        8: { __typename: 'DifficultyValue', value: 6 },
        9: { __typename: 'DifficultyValue', value: 4 },
        10: { __typename: 'DifficultyValue', value: 7 },
        11: { __typename: 'DifficultyValue', value: 5 },
        12: { __typename: 'DifficultyValue', value: 1 },
    }

    const parkingValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 6 },
        3: { __typename: 'DifficultyValue', value: 6 },
        4: { __typename: 'DifficultyValue', value: 8 },
        5: { __typename: 'DifficultyValue', value: 6 },
        6: { __typename: 'DifficultyValue', value: 7 },
        7: { __typename: 'DifficultyValue', value: 5 },
        8: { __typename: 'DifficultyValue', value: 4 },
        9: { __typename: 'DifficultyValue', value: 3 },
        10: { __typename: 'DifficultyValue', value: 9 },
        11: { __typename: 'DifficultyValue', value: 3 },
        12: { __typename: 'DifficultyValue', value: 2 },
    }

    const gatehouseValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 8 },
        3: { __typename: 'DifficultyValue', value: 4 },
        4: { __typename: 'DifficultyValue', value: 6 },
        5: { __typename: 'DifficultyValue', value: 9 },
        6: { __typename: 'DifficultyValue', value: 8 },
        7: { __typename: 'DifficultyValue', value: 7 },
        8: { __typename: 'DifficultyValue', value: 6 },
        9: { __typename: 'DifficultyValue', value: 3 },
        10: { __typename: 'DifficultyValue', value: 4 },
        11: { __typename: 'DifficultyValue', value: 2 },
        12: { __typename: 'DifficultyValue', value: 1 },
    }

    const emergencyExitValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 9 },
        3: { __typename: 'DifficultyValue', value: 7 },
        4: { __typename: 'DifficultyValue', value: 9 },
        5: { __typename: 'DifficultyValue', value: 8 },
        6: { __typename: 'DifficultyValue', value: 6 },
        7: { __typename: 'DifficultyValue', value: 3 },
        8: { __typename: 'DifficultyValue', value: 5 },
        9: { __typename: 'DifficultyValue', value: 4 },
        10: { __typename: 'DifficultyValue', value: 6 },
        11: { __typename: 'DifficultyValue', value: 5 },
        12: { __typename: 'DifficultyValue', value: 4 },
    }

    const backupLightsValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 8 },
        3: { __typename: 'DifficultyValue', value: 7 },
        4: { __typename: 'DifficultyValue', value: 8 },
        5: { __typename: 'DifficultyValue', value: 7 },
        6: { __typename: 'DifficultyValue', value: 7 },
        7: { __typename: 'DifficultyValue', value: 4 },
        8: { __typename: 'DifficultyValue', value: 3 },
        9: { __typename: 'DifficultyValue', value: 2 },
        10: { __typename: 'DifficultyValue', value: 4 },
        11: { __typename: 'DifficultyValue', value: 6 },
        12: { __typename: 'DifficultyValue', value: 1 },
    }

    const landingPadValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 8 },
        3: { __typename: 'DifficultyValue', value: 9 },
        4: { __typename: 'DifficultyValue', value: 7 },
        5: { __typename: 'DifficultyValue', value: 9 },
        6: { __typename: 'DifficultyValue', value: 8 },
        7: { __typename: 'DifficultyValue', value: 4 },
        8: { __typename: 'DifficultyValue', value: 8 },
        9: { __typename: 'DifficultyValue', value: 2 },
        10: { __typename: 'DifficultyValue', value: 3 },
        11: { __typename: 'DifficultyValue', value: 5 },
        12: { __typename: 'DifficultyValue', value: 1 },
    }

    const secretEntranceValues: Record<number, DifficultyValue | null> = {
        1: null, // Special for abandoned building
        2: { __typename: 'DifficultyValue', value: 3 },
        3: { __typename: 'DifficultyValue', value: 6 },
        4: { __typename: 'DifficultyValue', value: 2 },
        5: { __typename: 'DifficultyValue', value: 5 },
        6: { __typename: 'DifficultyValue', value: 7 },
        7: { __typename: 'DifficultyValue', value: 5 },
        8: { __typename: 'DifficultyValue', value: 4 },
        9: { __typename: 'DifficultyValue', value: 8 },
        10: { __typename: 'DifficultyValue', value: 9 },
        11: { __typename: 'DifficultyValue', value: 7 },
        12: { __typename: 'DifficultyValue', value: 7 },
    }

    // Roll 1d10 for the ownership and other properties
    const ownershipRoll = getRandomInt(1, 10) + jobTypeModifier
    const clampedOwnershipRoll = Math.max(1, Math.min(12, ownershipRoll))

    // Map rolls to ownership based on second table
    let ownership: Ownership
    switch (clampedOwnershipRoll) {
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
            ownership = Ownership.LOCAL_GOV
            break
        case 8:
            ownership = Ownership.SMALL_BUSINESS
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
            ownership = Ownership.BYSTANDER // Fallback
    }

    // Map rolls to security personnel
    let securityPersonnel: SecurityPersonnel
    switch (clampedOwnershipRoll) {
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
            securityPersonnel = SecurityPersonnel.CITY_SEC // Fallback
    }

    // Map rolls to style
    let style: Style
    switch (clampedOwnershipRoll) {
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
            style = Style.MODERN // Fallback
    }

    // Map rolls to event
    let event: Event
    switch (clampedOwnershipRoll) {
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
            event = Event.WORKERS_REMODELING // Fallback
    }

    // Map rolls to secret
    let secret: Secret
    switch (clampedOwnershipRoll) {
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
            secret = Secret.PARTY // Fallback
    }

    // Special case for abandoned building (roll 1)
    const elevators = clampedTypeRoll === 1 ? null : elevatorValues[clampedTypeRoll]
    const parking = clampedTypeRoll === 1 ? null : parkingValues[clampedTypeRoll]
    const gatehouseFrontDesk = clampedTypeRoll === 1 ? null : gatehouseValues[clampedTypeRoll]
    const emergencyExit = clampedTypeRoll === 1 ? null : emergencyExitValues[clampedTypeRoll]
    const backupLights = clampedTypeRoll === 1 ? null : backupLightsValues[clampedTypeRoll]
    const landingPad = clampedTypeRoll === 1 ? null : landingPadValues[clampedTypeRoll]
    const secretOrAltEntrance = clampedTypeRoll === 1 ? null : secretEntranceValues[clampedTypeRoll]

    // Generate building object
    const building: Building = {
        __typename: 'Building',
        backupLights,
        elevators,
        emergencyExit,
        event,
        gatehouseFrontDesk,
        landingPad,
        ownership,
        parking,
        secret,
        secretOrAltEntrance,
        securityPersonnel,
        style,
        type,
    }

    // Store name components
    const nameComponents = {
        type,
        style,
        ownership,
    }

    // Store raw values for description
    const descriptionData = {
        building,
        nameComponents,
    }

    // Determine job type based on modifier
    let jobType = 'TYPICAL'
    if (jobTypeModifier === 0) {
        jobType = 'EASY'
    } else if (jobTypeModifier === 2) {
        jobType = 'DANGEROUS'
    }

    return {
        ...building,
        displayName: generateBuildingDisplayName(type, style, ownership),
        description: '',
        _nameComponents: nameComponents, // Add this for rendering components to use
        _descriptionData: descriptionData, // Add this for rendering components to use
        _jobType: jobType, // Store job type for display
    } as Building & {
        displayName: string
        description: string
        _nameComponents: { type: BuildingType; style: Style; ownership: Ownership }
        _descriptionData: {
            building: Building
            nameComponents: { type: BuildingType; style: Style; ownership: Ownership }
        }
        _jobType: string
    }
}
