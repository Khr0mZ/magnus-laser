import { TFunction } from 'i18next'
import { Building, BuildingType, FixerJob, Gang, GangColor, JobDifficulty } from '../graphql/types.ts'
import colors from './colors.ts'
import { fixerJobColumns } from './constants.ts'
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

// FIXER JOB FUNCTIONS

/**
 * Get the color value for a fixer job difficulty
 * @param difficulty The fixer job difficulty
 * @returns The color value
 */
export const getFixerJobDifficultyColor = (difficulty: JobDifficulty): string => {
    const colorMap: Record<JobDifficulty, string> = {
        [JobDifficulty.EASY]: colors.neons.green.default,
        [JobDifficulty.TYPICAL]: colors.neons.yellow.default,
        [JobDifficulty.DANGEROUS]: colors.neons.red.default,
    }
    return colorMap[difficulty] || colors.grays.gray400
}

/**
 * Get ordered fixer job data for display
 * @param fixerJob The fixer job data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedFixerJobData = (
    fixerJob: FixerJob,
    t: TFunction
): { key: string; label: string; value: unknown }[] => {
    // Helper function to get value by dot-notation path
    const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
        const parts = path.split('.')
        let current = obj as Record<string, unknown>

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined
            }

            // Special case for verb which is a union type
            if (part === 'verb' && current.verb && typeof current.verb === 'object' && current.verb !== null) {
                current = current.verb as Record<string, unknown>
                continue
            }

            current = current[part] as Record<string, unknown>
        }

        return current
    }

    // Extract values for all columns
    const result = fixerJobColumns.map((col) => {
        // Get the value using the path
        let value = getValueByPath(fixerJob, col.key)

        // Special case for verb which is a union type
        if (col.key === 'plot.verb.value' && !value && fixerJob.plot?.verb) {
            if ('value' in fixerJob.plot.verb) {
                value = fixerJob.plot.verb.value
            }
        }

        return {
            key: col.key,
            label: translateLabel(t, col.label, 'fixerJobs'),
            value: value,
        }
    })

    // Filter out empty values
    return result
}

/**
 * Process a fixer job value for display
 * @param key The key of the value
 * @param item The fixer job item or a direct value
 * @param t The translation function
 * @returns The processed value as a string
 */
export const processFixerJobValueForDisplay = (key: string, item: unknown, t: TFunction): string => {
    // Skip the typename property that GraphQL adds
    if (key === '__typename') {
        return ''
    }

    // If a direct value was passed instead of the full fixer job
    if (item === undefined || item === null) {
        return ''
    }

    // Simple mapping for enums
    if (typeof item === 'string') {
        // Direct mapping to namespaces based on key patterns
        const keyNamespaceMap: Record<string, string> = {
            // Verb fields
            'plot.verb.value': 'fixerJobs.verb',

            // Types for various entities
            'plot.subjectIfNotPlace.type': 'fixerJobs.character', // Default to character, special case for item below
            'plot.complication.type': 'fixerJobs.complication',
            'plot.complication.character.type': 'fixerJobs.character',
            'plot.complication.item.type': 'fixerJobs.item',
            'plot.item.type': 'fixerJobs.item',
            'plot.plotPlace.building.type': 'fixerJobs.location',
            'plot.plotPlace.complication.type': 'fixerJobs.locationComplication',

            // Attitude and condition fields
            'plot.subjectIfNotPlace.attitude': 'fixerJobs.characterAttitude',
            'plot.subjectIfNotPlace.condition': 'fixerJobs.itemCondition',

            // Building related fields
            'plot.plotPlace.building.style': 'buildings.style',
            'plot.plotPlace.building.ownership': 'buildings.ownership',
            'plot.plotPlace.building.securityPersonnel': 'buildings.securityPersonnel',
        }

        // Special case for gang types
        if (key.includes('gang.type') || key.includes('gang.gang.type')) {
            return t(`gangs.type.${item}`, String(item))
        }

        // Special case for item types (including AI_ROBOT_DRONE)
        if (
            (key === 'plot.subjectIfNotPlace.type' || key === 'plot.item.type') &&
            (item === 'AI_ROBOT_DRONE' ||
                item === 'BIOLOGICAL_SAMPLES' ||
                item === 'CYBERWARE' ||
                item === 'DIGITAL_FILES' ||
                item === 'DRUGS_ILLEGAL_CONTRABAND' ||
                item === 'EXOTIC_ANIMAL' ||
                item === 'FOOD_FUELS_SUPPLIES' ||
                item === 'MONEY' ||
                item === 'VEHICLE' ||
                item === 'WEAPONS')
        ) {
            return t(`fixerJobs.item.${item}`, String(item))
        }

        // Look up the namespace
        const namespace = keyNamespaceMap[key]
        if (namespace) {
            // Special case for plot.verb.value - directly check that we have the translation
            if (key === 'plot.verb.value') {
                const translated = t(`${namespace}.${item}`, String(item))
                return translated
            }

            return t(`${namespace}.${item}`, String(item))
        }
    }

    // If no translation found, just return the string value
    return String(item)
}
