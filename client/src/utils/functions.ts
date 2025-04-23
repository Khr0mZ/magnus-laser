import { TFunction } from 'i18next'
import { Building, BuildingType, Character, FixerJob, Gang, GangColor, Item, JobDifficulty } from '../graphql/types.ts'
import colors from './colors.ts'
import { fixerJobColumns } from './constants.ts'

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
const hexToRgb = (hex: string): [number, number, number] => {
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

// CHARACTER FUNCTIONS

/**
 * Get ordered character data for display
 * @param character The character data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedCharacterData = (
    character: Character,
    t: TFunction
): { key: string; label: string; value: unknown }[] => {
    return [
        { key: 'name', label: t('characters.labels.name'), value: character.name },
        { key: 'type', label: t('characters.labels.type'), value: character.type },
        { key: 'attitude', label: t('characters.labels.attitude'), value: character.attitude },
    ]
}

/**
 * Process a character value for display
 * @param key The key of the value
 * @param value The value to process
 * @param t The translation function
 * @returns The processed value
 */
export const processCharacterValueForDisplay = (key: string, value: unknown, t: TFunction): string => {
    if (key === 'attitude') {
        return t(`characters.attitude.${value}`, String(value))
    }
    if (key === 'type') {
        return t(`characters.type.${value}`, String(value))
    }
    return String(value)
}

// ITEM FUNCTIONS

/**
 * Get ordered item data for display
 * @param item The item data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedItemData = (item: Item, t: TFunction): { key: string; label: string; value: unknown }[] => {
    return [
        { key: 'name', label: t('items.labels.name'), value: item.name },
        { key: 'type', label: t('items.labels.type'), value: item.type },
        { key: 'condition', label: t('items.labels.condition'), value: item.condition },
    ]
}

/**
 * Process an item value for display
 * @param key The key of the value
 * @param value The value to process
 * @param t The translation function
 * @returns The processed value
 */
export const processItemValueForDisplay = (key: string, value: unknown, t: TFunction): string => {
    if (key === 'condition') {
        return t(`items.condition.${value}`, String(value))
    }
    if (key === 'type') {
        return t(`items.type.${value}`, String(value))
    }
    return String(value)
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
        { key: 'name', label: t('gangs.labels.name'), value: gang.name },
        { key: 'type', label: t('gangs.labels.type'), value: gang.type },
        {
            key: 'cyberwareQuality',
            label: t('gangs.labels.cyberwareQuality'),
            value: gang.cyberwareQuality,
        },
        { key: 'skill', label: t('gangs.labels.skill'), value: gang.skill },
        { key: 'weapons', label: t('gangs.labels.weapons'), value: gang.weapons },
        { key: 'armor', label: t('gangs.labels.armor'), value: gang.armor },
        { key: 'secretive', label: t('gangs.labels.secretive'), value: gang.secretive },
        { key: 'status', label: t('gangs.labels.status'), value: gang.status },
        { key: 'color', label: t('gangs.labels.color'), value: gang.color },
        { key: 'sin', label: t('gangs.labels.sin'), value: gang.sin },
        { key: 'knownFor', label: t('gangs.labels.knownFor'), value: gang.knownFor },
        { key: 'flaw', label: t('gangs.labels.flaw'), value: gang.flaw },
        { key: 'currentAttitude', label: t('gangs.labels.currentAttitude'), value: gang.currentAttitude },
        {
            key: 'newsTheLeaderIsReceiving',
            label: t('gangs.labels.newsTheLeaderIsReceiving'),
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
            label: t('buildings.labels.type'),
            value: building.type,
        },
        { key: 'elevators', label: t('buildings.labels.elevators'), value: building.elevators },
        { key: 'parking', label: t('buildings.labels.parking'), value: building.parking },
        {
            key: 'gatehouseFrontDesk',
            label: t('buildings.labels.gatehouseFrontDesk'),
            value: building.gatehouseFrontDesk,
        },
        {
            key: 'emergencyExit',
            label: t('buildings.labels.emergencyExit'),
            value: building.emergencyExit,
        },
        {
            key: 'backupLights',
            label: t('buildings.labels.backupLights'),
            value: building.backupLights,
        },
        { key: 'landingPad', label: t('buildings.labels.landingPad'), value: building.landingPad },
        {
            key: 'secretOrAltEntrance',
            label: t('buildings.labels.secretOrAltEntrance'),
            value: building.secretOrAltEntrance,
        },
        { key: 'ownership', label: t('buildings.labels.ownership'), value: building.ownership },
        {
            key: 'securityPersonnel',
            label: t('buildings.labels.securityPersonnel'),
            value: building.securityPersonnel,
        },
        { key: 'style', label: t('buildings.labels.style'), value: building.style },
        { key: 'event', label: t('buildings.labels.event'), value: building.event },
        { key: 'secret', label: t('buildings.labels.secret'), value: building.secret },
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
 * @param resolvers Optional object containing reference resolvers for different entity types
 * @returns Array of data items ordered for display
 */
export const getOrderedFixerJobData = (
    fixerJob: FixerJob,
    t: TFunction,
    resolvers?: {
        resolveCharacter?: (id: string) => Character | null
        resolveItem?: (id: string) => Item | null
        resolveBuilding?: (id: string) => Building | null
        resolveGang?: (id: string) => Gang | null
    }
): { key: string; label: string; value: unknown }[] => {
    // Helper function to get value by dot-notation path, optimized for our GraphQL schema
    const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
        // Edge case: empty object or path
        if (!obj || !path) return undefined

        const parts = path.split('.')
        let current: unknown = obj

        // Check for known exact path patterns that we've having trouble with
        if (path === 'plot.plotSubject.gang.name') {
            const plot = obj.plot as Record<string, unknown>
            if (!plot || typeof plot !== 'object') return undefined

            const plotSubject = plot.plotSubject
            if (!plotSubject || typeof plotSubject !== 'object') return undefined

            const gang = (plotSubject as Record<string, unknown>).gang
            if (!gang) return undefined

            if (typeof gang === 'string') {
                // Try to resolve the gang ID to an object
                if (resolvers?.resolveGang) {
                    const resolvedGang = resolvers.resolveGang(gang)
                    return resolvedGang?.name || gang
                }
                return gang
            } else if (typeof gang === 'object' && 'name' in (gang as Record<string, unknown>)) {
                return (gang as Record<string, unknown>).name
            }

            return undefined
        }

        if (path === 'plot.plotBuilding.building.name') {
            const plot = obj.plot as Record<string, unknown>
            if (!plot || typeof plot !== 'object') return undefined

            const plotBuilding = plot.plotBuilding
            if (!plotBuilding || typeof plotBuilding !== 'object') return undefined

            const building = (plotBuilding as Record<string, unknown>).building
            if (!building) return undefined

            if (typeof building === 'string') {
                // Try to resolve the building ID to an object
                if (resolvers?.resolveBuilding) {
                    const resolvedBuilding = resolvers.resolveBuilding(building)
                    return resolvedBuilding?.name || building
                }
                return building
            } else if (typeof building === 'object' && 'name' in (building as Record<string, unknown>)) {
                return (building as Record<string, unknown>).name
            }

            return undefined
        }

        // Handle character name paths in a generic way
        if (path.endsWith('.character.name')) {
            // Split into parts without the .name at the end
            const basePath = path.substring(0, path.length - 5)
            const baseValue = getValueByPath(obj, basePath)

            if (!baseValue) return undefined

            if (typeof baseValue === 'string') {
                // Try to resolve the character ID
                if (resolvers?.resolveCharacter) {
                    const resolvedChar = resolvers.resolveCharacter(baseValue)
                    return resolvedChar?.name || baseValue
                }
                return baseValue
            } else if (typeof baseValue === 'object' && 'name' in (baseValue as Record<string, unknown>)) {
                return (baseValue as Record<string, unknown>).name
            }

            return undefined
        }

        // Handle item name paths in a generic way
        if (path.endsWith('.item.name')) {
            // Split into parts without the .name at the end
            const basePath = path.substring(0, path.length - 5)
            const baseValue = getValueByPath(obj, basePath)

            if (!baseValue) return undefined

            if (typeof baseValue === 'string') {
                // Try to resolve the item ID
                if (resolvers?.resolveItem) {
                    const resolvedItem = resolvers.resolveItem(baseValue)
                    return resolvedItem?.name || baseValue
                }
                return baseValue
            } else if (typeof baseValue === 'object' && 'name' in (baseValue as Record<string, unknown>)) {
                return (baseValue as Record<string, unknown>).name
            }

            return undefined
        }

        // Standard path traversal for other paths
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]

            // Handle null/undefined values
            if (current === null || current === undefined) {
                return undefined
            }

            // Cast to Record for type safety
            const currentObj = current as Record<string, unknown>

            // Special case for verb which is a union type
            if (part === 'verb') {
                if (currentObj.verb && typeof currentObj.verb === 'object') {
                    // Move to the verb object
                    current = currentObj.verb

                    // If the next part is 'value' and we're at the end of the path,
                    // return the value directly from the verb object
                    if (i === parts.length - 2 && parts[i + 1] === 'value') {
                        const verbObj = current as Record<string, unknown>
                        return verbObj.value
                    }
                } else {
                    current = currentObj.verb
                }
                continue
            }

            // Special case for plotSubject.complication
            if (part === 'complication' && i > 0 && parts[i - 1] === 'plotSubject') {
                const complication = currentObj[part]

                // Handle direct access to complication.type (this is often missed)
                if (
                    i === parts.length - 2 &&
                    parts[i + 1] === 'type' &&
                    complication &&
                    typeof complication === 'object'
                ) {
                    return (complication as Record<string, unknown>).type
                }

                // Handle direct access to complication.character
                if (
                    i === parts.length - 2 &&
                    parts[i + 1] === 'character' &&
                    complication &&
                    typeof complication === 'object'
                ) {
                    const charRef = (complication as Record<string, unknown>).character
                    if (typeof charRef === 'string' && resolvers?.resolveCharacter) {
                        return resolvers.resolveCharacter(charRef) || charRef
                    }
                    return charRef
                }

                // Handle direct access to complication.item
                if (
                    i === parts.length - 2 &&
                    parts[i + 1] === 'item' &&
                    complication &&
                    typeof complication === 'object'
                ) {
                    const itemRef = (complication as Record<string, unknown>).item
                    if (typeof itemRef === 'string' && resolvers?.resolveItem) {
                        return resolvers.resolveItem(itemRef) || itemRef
                    }
                    return itemRef
                }

                current = complication
                continue
            }

            // Handle reference fields that could be either IDs or objects
            if (['gang', 'building', 'character', 'item'].includes(part)) {
                const reference = currentObj[part]

                // Handle string ID references with resolvers if available
                if (typeof reference === 'string' && resolvers) {
                    // If this is the last part in the path, return the resolved object or ID
                    if (i === parts.length - 1) {
                        if (part === 'character' && resolvers.resolveCharacter) {
                            const resolved = resolvers.resolveCharacter(reference)
                            return resolved || reference
                        }
                        if (part === 'item' && resolvers.resolveItem) {
                            const resolved = resolvers.resolveItem(reference)
                            return resolved || reference
                        }
                        if (part === 'building' && resolvers.resolveBuilding) {
                            const resolved = resolvers.resolveBuilding(reference)
                            return resolved || reference
                        }
                        if (part === 'gang' && resolvers.resolveGang) {
                            const resolved = resolvers.resolveGang(reference)
                            return resolved || reference
                        }
                        return reference
                    }

                    // If not the last part, try to resolve and continue traversal
                    if (part === 'character' && resolvers.resolveCharacter) {
                        current = resolvers.resolveCharacter(reference) || reference
                        continue
                    }
                    if (part === 'item' && resolvers.resolveItem) {
                        current = resolvers.resolveItem(reference) || reference
                        continue
                    }
                    if (part === 'building' && resolvers.resolveBuilding) {
                        current = resolvers.resolveBuilding(reference) || reference
                        continue
                    }
                    if (part === 'gang' && resolvers.resolveGang) {
                        current = resolvers.resolveGang(reference) || reference
                        continue
                    }
                }

                // If it's an object reference or there are no resolvers
                if (i === parts.length - 1) {
                    // If it's an object with a name, return the name or full object
                    if (reference && typeof reference === 'object' && 'name' in (reference as object)) {
                        return (reference as Record<string, unknown>).name
                    }
                    // Otherwise return the reference itself (ID string or object)
                    return reference
                }

                // Not the last part, continue traversal
                current = reference
                continue
            }

            // If this is the final part and it's 'name' or 'type', and current is still an object
            if (i === parts.length - 1 && (part === 'name' || part === 'type')) {
                // Just return the value if it exists
                return currentObj[part]
            }

            // Regular property access
            current = currentObj[part]
        }

        return current
    }

    // Extract values for all columns
    const result = fixerJobColumns.map((col) => {
        // Get the value using the path
        const value = getValueByPath(fixerJob, col.key)

        return {
            key: col.key,
            label: t(`fixerJobs.labels.${col.label}`),
            value: value,
        }
    })

    // Filter out empty values
    return result
}

/**
 * Process a fixer job value for display
 * @param key The key of the value
 * @param target The fixer job object or a direct value
 * @param t The translation function
 * @returns The processed value as a string
 */
export const processFixerJobValueForDisplay = (key: string, target: unknown, t: TFunction): string => {
    // Skip the typename property that GraphQL adds
    if (key.includes('__typename')) {
        if (target === 'CharacterVerbWrapper') return 'Character'
        if (target === 'ItemVerbWrapper') return 'Item'
        if (target === 'PlotGangVerbWrapper') return 'Gang'
        if (target === 'PlotBuildingVerbWrapper') return 'Building'
        return String(target)
    }

    if (key === 'difficulty') {
        return t(`common.jobDifficultySelector.${String(target).toLowerCase()}`)
    }

    // If a direct value was passed instead of the full fixer job
    if (target === undefined || target === null) {
        return '—'
    }

    // Handle complication types - special check for undefined/empty values
    if (
        key === 'plot.plotComplication.type' ||
        key === 'plot.plotBuilding.complication.type' ||
        key === 'plot.plotSubject.complication.type'
    ) {
        if (target === undefined || target === null || target === '') {
            return '—'
        }

        // Handle translation based on the complication type
        if (key === 'plot.plotComplication.type') {
            return t(`fixerJobs.complication.${target}`, String(target))
        }
        if (key === 'plot.plotBuilding.complication.type') {
            return t(`fixerJobs.buildingComplication.${target}`, String(target))
        }
        if (key === 'plot.plotSubject.complication.type') {
            return t(`fixerJobs.gangComplication.${target}`, String(target))
        }
    }

    // Handle building name
    if (key === 'plot.plotBuilding.building.name') {
        if (target === undefined || target === null) return '—'
        if (typeof target === 'string') return target
        if (typeof target === 'object' && target !== null && 'name' in target) {
            return (target as { name: string }).name
        }
        return '—'
    }

    // Handle gang name
    if (key === 'plot.plotSubject.gang.name') {
        if (target === undefined || target === null) return '—'
        if (typeof target === 'string') return target
        if (typeof target === 'object' && target !== null && 'name' in target) {
            return (target as { name: string }).name
        }
        return '—'
    }

    // Handle character names in complications
    if (key.includes('.character.name')) {
        if (target === undefined || target === null) return '—'
        if (typeof target === 'string') return target
        if (typeof target === 'object' && target !== null && 'name' in target) {
            return (target as { name: string }).name
        }
        return '—'
    }

    // Handle item names in complications
    if (key.includes('.item.name')) {
        if (target === undefined || target === null) return '—'
        if (typeof target === 'string') return target
        if (typeof target === 'object' && target !== null && 'name' in target) {
            return (target as { name: string }).name
        }
        return '—'
    }

    // Handle direct character or item reference via plotSubject
    if (key === 'plot.plotSubject') {
        // Handle case where plotSubject is a string ID - return just Subject since
        // actual character/item will be in a different row
        if (typeof target === 'string') {
            return 'Subject'
        }
        // Handle object case
        if (typeof target === 'object' && target !== null) {
            // If it's a direct character or item with a name
            if ('name' in target) return target.name as string

            // If it's a gang reference
            if ('gang' in target) {
                if (typeof target.gang === 'object' && target.gang !== null && 'name' in target.gang) {
                    return (target.gang as { name: string }).name
                }
                return 'Subject (Gang)'
            }
            return 'Subject'
        }
        return '—'
    }

    // Special case for the Target column that should show the actual name
    if (key === 'Target') {
        const fixerJob = target as FixerJob
        if (!fixerJob?.plot?.plotSubject) return '—'

        const subject = fixerJob.plot.plotSubject

        // Handle character/item cases
        if (typeof subject === 'object' && 'name' in subject) {
            return subject.name as string
        }

        // Handle gang case
        if (typeof subject === 'object' && 'gang' in subject) {
            const gang = subject.gang
            if (typeof gang === 'object' && gang !== null && 'name' in gang) {
                return (gang as { name: string }).name
            }
        }

        return '—'
    }

    // Handle special cases for object references (gang, building, character, item)
    if (typeof target === 'object' && target !== null) {
        // If this is just a direct reference to a Gang, Building, Character, or Item with a name
        if ('name' in target && typeof target.name === 'string') {
            return target.name
        }

        // If it has a type field we can display
        if ('type' in target && typeof target.type === 'string') {
            const type = target.type as string
            // Determine the namespace based on the key
            if (key.includes('gang')) {
                return t(`gangs.type.${type}`, String(type))
            } else if (key.includes('building')) {
                return t(`buildings.type.${type}`, String(type))
            }
            return String(type)
        }

        // For verb objects, return the value
        if ('value' in target && typeof target.value === 'string') {
            const value = target.value as string
            if (key === 'plot.verb') {
                return t(`fixerJobs.verb.${value}`, value)
            }
            return value
        }

        // For any other objects with an ID, just return "—" so we don't clutter the display
        if ('ID' in target) {
            return '—'
        }

        // Empty or inappropriate objects
        return '—'
    }

    // Handle verb values for translation
    if (key === 'plot.verb.value' && typeof target === 'string') {
        return t(`fixerJobs.verb.${target}`, String(target))
    }

    // For direct IDs, don't display them - they'll be resolved to names in other rows
    if (
        typeof target === 'string' &&
        (key.includes('character') || key.includes('item') || key.includes('building') || key.includes('gang'))
    ) {
        return '—'
    }

    // If no special case applies, return the string value
    return String(target)
}
