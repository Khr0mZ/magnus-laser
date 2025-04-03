import { TFunction } from 'i18next'
import { Gang, GangColor } from '../graphql/types.ts'
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

        // Skip the typename property that GraphQL adds
        if (key === '__typename') {
            return ''
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
