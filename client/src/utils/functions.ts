import { TFunction } from 'i18next'
import { Building, BuildingType, Gang, GangColor } from '../graphql/types.ts'
import colors from './colors.ts'
import { JobDifficulty } from './constants.ts'
import { translateLabel } from './i18nUtils.ts'

/**
 * Re-export getModuleIcon from functions.tsx
 * This avoids import conflicts
 */
export { getModuleIcon } from './functions.tsx'

/**
 * Get modifier value based on job type
 * @param jobDifficulty The job difficulty
 * @returns The modifier value
 */
export const getJobDifficultyModifier = (jobDifficulty: JobDifficulty): number => {
    switch (jobDifficulty) {
        case JobDifficulty.EASY:
            return 0
        case JobDifficulty.TYPICAL:
            return 1
        case JobDifficulty.DANGEROUS:
            return 2
        default:
            return 1
    }
}

/**
 * Get a random integer in range (inclusive)
 * @param min The minimum value
 * @param max The maximum value
 * @returns A random integer in range
 */
export const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Get a random element from an array
 * @param array The array to get a random element from
 * @returns A random element from the array
 */
export const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)]
}

// GANG FUNCTIONS

/**
 * Get the color value for a gang color
 * @param gangColor The gang color
 * @returns The color value
 */
export const getGangColorValue = (gangColor: GangColor): string => {
    const colorMap: Record<GangColor, string> = {
        [GangColor.BLACK]: colors.grays.gray400,
        [GangColor.BLUE]: colors.neons.blue.default,
        [GangColor.BRIGHTS]: colors.neons.cyan.default,
        [GangColor.BROWNS]: '#8B4513', // Saddle brown
        [GangColor.GREEN]: colors.neons.green.default,
        [GangColor.ORANGE]: colors.oranges.default,
        [GangColor.RED]: colors.neons.red.default,
        [GangColor.VIOLET]: colors.neons.purple.default,
        [GangColor.WHITE]: colors.grays.gray800,
        [GangColor.YELLOW]: colors.neons.yellow.default,
    }
    return colorMap[gangColor] || colors.grays.gray400
}

/**
 * Get ordered gang data for display
 * @param gang The gang data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedGangData = (gang: Gang, t: TFunction): { key: string; label: string; value: unknown }[] => {
    return [
        { key: 'name', label: translateLabel(t, 'name', 'gangs'), value: gang.name },
        { key: 'type', label: translateLabel(t, 'type', 'gangs'), value: gang.type },
        {
            key: 'cyberwareQuality',
            label: translateLabel(t, 'cyberwareQuality', 'gangs'),
            value: gang.cyberwareQuality,
        },
        { key: 'skill', label: translateLabel(t, 'skill', 'gangs'), value: gang.skill },
        { key: 'weapons', label: translateLabel(t, 'weapons', 'gangs'), value: gang.weapons },
        { key: 'armor', label: translateLabel(t, 'armor', 'gangs'), value: gang.armor },
        { key: 'secretive', label: translateLabel(t, 'secretive', 'gangs'), value: gang.secretive },
        { key: 'status', label: translateLabel(t, 'status', 'gangs'), value: gang.status },
        { key: 'color', label: translateLabel(t, 'color', 'gangs'), value: gang.color },
        { key: 'sin', label: translateLabel(t, 'sin', 'gangs'), value: gang.sin },
        { key: 'knownFor', label: translateLabel(t, 'knownFor', 'gangs'), value: gang.knownFor },
        { key: 'flaw', label: translateLabel(t, 'flaw', 'gangs'), value: gang.flaw },
        { key: 'currentAttitude', label: translateLabel(t, 'currentAttitude', 'gangs'), value: gang.currentAttitude },
        {
            key: 'newsTheLeaderIsReceiving',
            label: translateLabel(t, 'newsTheLeaderIsReceiving', 'gangs'),
            value: gang.newsTheLeaderIsReceiving,
        },
    ]
}

/**
 * Process a gang value for display
 * @param key The key of the value
 * @param value The value to process
 * @param t The translation function
 * @returns The processed value
 */
export const processGangValueForDisplay = (key: string, value: unknown, t: TFunction): string => {
    // Skip the typename property that GraphQL adds
    if (key === '__typename') {
        return ''
    }

    if (typeof value === 'object') {
        // Handle weapons
        if (key === 'weapons' && value && typeof value === 'object' && 'd6' in value) {
            return `${value.d6}d6`
        }

        // Handle armor
        if (key === 'armor' && value && typeof value === 'object' && 'spb' in value && 'h' in value) {
            return `${value.spb}/${value.h}`
        }

        // Handle knownFor object
        if (key === 'knownFor' && value && typeof value === 'object') {
            if ('knownForPart1' in value && 'knownForPart2' in value) {
                const part1 = t(`gangs.knownForPart1.${value.knownForPart1}`, String(value.knownForPart1))
                const part2 = t(`gangs.knownForPart2.${value.knownForPart2}`, String(value.knownForPart2))
                return `${part1} ${part2}`
            }
            return String(value)
        }
    }

    // Handle enum values with translations
    if (typeof value === 'string') {
        // Map key to the appropriate i18n namespace
        const namespaceMap: Record<string, string> = {
            type: 'gangs.type',
            cyberwareQuality: 'gangs.cyberwareQuality',
            status: 'gangs.status',
            color: 'gangs.color',
            sin: 'gangs.sin',
            flaw: 'gangs.flaw',
            currentAttitude: 'gangs.attitude',
            newsTheLeaderIsReceiving: 'gangs.news',
        }

        if (namespaceMap[key]) {
            // Use the exact enum key as it appears in the translation file
            return t(`${namespaceMap[key]}.${value}`, String(value))
        }
    }

    return String(value)
}

// BUILDING FUNCTIONS

/**
 * Get the color value for a building type
 * @param buildingType The building type
 * @returns The color value
 */
export const getBuildingColor = (buildingType: BuildingType): string => {
    const colorMap: Record<BuildingType, string> = {
        [BuildingType.ABANDONED_BUILDING]: colors.neons.green.default,
        [BuildingType.VACANT_LOT_CONSTRUCTION_SITE]: colors.neons.green.default,
        [BuildingType.CUBE_HOTEL_MOTEL_CARGO_CONTAINER]: colors.neons.green.default,
        [BuildingType.PUBLIC_SPACE]: colors.neons.green.default,
        [BuildingType.ESTABLISHMENT]: colors.neons.yellow.default,
        [BuildingType.MULTI_STORY_BUILDING]: colors.neons.yellow.default,
        [BuildingType.SKYSCRAPER_MEGABUILDING]: colors.neons.yellow.default,
        [BuildingType.COMMERCIAL_BUILDING]: colors.neons.yellow.default,
        [BuildingType.CORPO_BUILDING]: colors.neons.red.default,
        [BuildingType.LUXURY_PENTHOUSE_MCMANSION]: colors.neons.red.default,
        [BuildingType.GOV_BUILDING]: colors.neons.red.default,
        [BuildingType.MEGACORPO_HQ]: colors.neons.red.default,
    }
    return colorMap[buildingType] || colors.grays.gray400
}

/**
 * Get ordered building data for display
 * @param building The building data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedBuildingData = (
    building: Building,
    t: TFunction
): { key: string; label: string; value: unknown }[] => {
    return [
        {
            key: 'type',
            label: translateLabel(t, 'type', 'buildings'),
            value: building.type,
        },
        { key: 'elevators', label: translateLabel(t, 'elevators', 'buildings'), value: building.elevators },
        { key: 'parking', label: translateLabel(t, 'parking', 'buildings'), value: building.parking },
        {
            key: 'gatehouseFrontDesk',
            label: translateLabel(t, 'gatehouseFrontDesk', 'buildings'),
            value: building.gatehouseFrontDesk,
        },
        {
            key: 'emergencyExit',
            label: translateLabel(t, 'emergencyExit', 'buildings'),
            value: building.emergencyExit,
        },
        {
            key: 'backupLights',
            label: translateLabel(t, 'backupLights', 'buildings'),
            value: building.backupLights,
        },
        { key: 'landingPad', label: translateLabel(t, 'landingPad', 'buildings'), value: building.landingPad },
        {
            key: 'secretOrAltEntrance',
            label: translateLabel(t, 'secretOrAltEntrance', 'buildings'),
            value: building.secretOrAltEntrance,
        },
        { key: 'ownership', label: translateLabel(t, 'ownership', 'buildings'), value: building.ownership },
        {
            key: 'securityPersonnel',
            label: translateLabel(t, 'securityPersonnel', 'buildings'),
            value: building.securityPersonnel,
        },
        { key: 'style', label: translateLabel(t, 'style', 'buildings'), value: building.style },
        { key: 'event', label: translateLabel(t, 'event', 'buildings'), value: building.event },
        { key: 'secret', label: translateLabel(t, 'secret', 'buildings'), value: building.secret },
    ]
}

/**
 * Convert a hex color string to RGB values
 * @param hex The hex color string (accepts 3-digit, 6-digit, with or without # prefix)
 * @returns A tuple containing the [r, g, b] values as numbers
 */
export const hexToRgb = (hex: string): [number, number, number] => {
    // Trim input once
    const trimmedHex = hex.trim()

    // Ensure the color has a # prefix
    const normalizedHex = trimmedHex.startsWith('#') ? trimmedHex : `#${trimmedHex}`

    // Handle both 3-digit and 6-digit hex formats
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    const fullHex = normalizedHex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)

    // If parsing fails, return a default color
    if (!result) {
        console.warn(`Invalid color format: ${hex}, using fallback color`)
        return [128, 128, 128] // Default to gray
    }

    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

/**
 * Get the complementary color for a given color
 * @param color The color string in hex format (e.g., '#ff0000', 'ff0000', '#f00', or 'f00')
 * @returns The complementary color as a hex string (e.g., '#00ffff')
 */
export const getComplementaryColor = (color: string): string => {
    try {
        const [r, g, b] = hexToRgb(color)
        const complementaryR = 255 - r
        const complementaryG = 255 - g
        const complementaryB = 255 - b

        // Convert RGB back to hex
        const complementaryHex = `#${((complementaryR << 16) | (complementaryG << 8) | complementaryB)
            .toString(16)
            .padStart(6, '0')}`
        return complementaryHex
    } catch (error) {
        console.warn(`Error calculating complementary color for: ${color}`, error)
        return '#7f7f7f' // Return a neutral gray as fallback
    }
}
