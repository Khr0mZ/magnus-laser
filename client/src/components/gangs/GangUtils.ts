import { TFunction } from 'i18next'
import colors from '../../utils/colors'
import { translateLabel } from '../../utils/i18nUtils'
import { DisplayGang } from './GangTypes'

/**
 * Generate a localized gang name based on gang data
 * @param gang The gang data
 * @param t Translation function
 * @returns Formatted gang name
 */
export const generateLocalizedGangName = (gang: DisplayGang, t: TFunction): string => {
    // If the gang has a displayName property, use that as the primary name
    if (gang.displayName) {
        return gang.displayName
    }

    // If the gang has name data with a name property, use that
    if (gang.nameData?.name) {
        return gang.nameData.name
    }

    // Fallback to constructing a name from color and type
    const colorText = t(`gangs.color.${gang.color}`, String(gang.color))
    const typeText = t(`gangs.type.${gang.type}`, String(gang.type))

    return `${gang.nameData?.adjective || ''} ${colorText} ${typeText}`.trim()
}

/**
 * Generate a localized gang description based on gang properties
 * @param gang The gang data
 * @param t Translation function
 * @returns Localized description text
 */
export const generateLocalizedGangDescription = (gang: DisplayGang, t: TFunction): string => {
    if (!gang) return t('gangs.descriptions.noDescription', 'No description available')

    let description = ''

    // Start with basic info: type, color, members and quality
    const typeText = processGangValueForDisplay('type', gang.type, t)
    const colorText = processGangValueForDisplay('color', gang.color, t)
    const qualityText = processGangValueForDisplay('quality', gang.quality, t)

    description += `${t('gangs.descriptions.a')} ${colorText} ${typeText} ${t('gangs.descriptions.gangWith')} ${t(
        'gangs.descriptions.several'
    )} ${t('gangs.descriptions.members')}. `
    description += `${t('gangs.descriptions.theyAre')} ${qualityText} ${t('gangs.descriptions.inQuality')} ${t(
        'gangs.descriptions.withSkillLevel'
    )} ${gang.skill}. `

    // Add weapons and armor details
    if (gang.weapons && gang.weapons.d6) {
        description += `${t('gangs.descriptions.theyWield')} ${gang.weapons.d6}d6 ${t('gangs.descriptions.weapons')}. `
    }

    if (gang.armor) {
        description += `${t('gangs.descriptions.theyWear')} SPB: ${gang.armor.spb}, H: ${gang.armor.h} ${t(
            'gangs.descriptions.armor'
        )}. `
    }

    // Add information about secretive level
    description += `${t('gangs.descriptions.theyAre')} ${
        gang.secretive >= 17 ? t('gangs.descriptions.verySecretive') : t('gangs.descriptions.notSecretive')
    } ${t('gangs.descriptions.inOperations')}. `

    // Add information about what they're known for
    if (gang.knownFor) {
        const knownForValue = processGangValueForDisplay('knownFor', gang.knownFor, t)
        description += `${t('gangs.descriptions.theyAreKnownFor')} ${knownForValue}. `
    }

    // Add information about their current status
    if (gang.status) {
        const statusText = processGangValueForDisplay('status', gang.status, t)
        description += `${t('gangs.descriptions.powerStructure')} ${statusText}. `
    }

    // Add their current attitude if available
    if (gang.currentAttitude) {
        const attitudeText = processGangValueForDisplay('currentAttitude', gang.currentAttitude, t)
        description += `${t('gangs.descriptions.currentAttitude')} ${attitudeText}. `
    }

    // Add info about their sin if available
    if (gang.sin) {
        const sinText = processGangValueForDisplay('sin', gang.sin, t)
        description += `${t('gangs.descriptions.theirMainSin')} ${sinText}. `
    }

    // Add info about their flaw if available
    if (gang.flaw) {
        const flawText = processGangValueForDisplay('flaw', gang.flaw, t)
        description += `${t('gangs.descriptions.mainWeakness')} ${flawText}. `
    }

    // Add latest news the leader is receiving if available
    if (gang.newsTheLeaderIsReceiving) {
        const newsText = processGangValueForDisplay('newsTheLeaderIsReceiving', gang.newsTheLeaderIsReceiving, t)
        description += `${t('gangs.descriptions.latestNews')} ${newsText}.`
    }

    return description
}

/**
 * Generate random gang name parts
 */
export const generateGangNameParts = (): { name: string; adjective: string } => {
    const gangNames = [
        { name: 'Wolves', adjective: 'Savage' },
        { name: 'Dragons', adjective: 'Fierce' },
        { name: 'Vipers', adjective: 'Venomous' },
        { name: 'Ghosts', adjective: 'Phantom' },
        { name: 'Sharks', adjective: 'Razor' },
        { name: 'Devils', adjective: 'Sinister' },
        { name: 'Tigers', adjective: 'Steel' },
        { name: 'Blades', adjective: 'Chrome' },
        { name: 'Jackals', adjective: 'Dire' },
        { name: 'Scorpions', adjective: 'Toxic' },
        { name: 'Ravens', adjective: 'Obsidian' },
        { name: 'Hounds', adjective: 'Brutal' },
        { name: 'Banshees', adjective: 'Wailing' },
        { name: 'Cobras', adjective: 'Slithering' },
        { name: 'Crows', adjective: 'Silent' },
        { name: 'Reapers', adjective: 'Crimson' },
        { name: 'Sirens', adjective: 'Lethal' },
        { name: 'Hornets', adjective: 'Stinging' },
        { name: 'Widows', adjective: 'Black' },
        { name: 'Gargoyles', adjective: 'Grim' },
        { name: 'Rats', adjective: 'Filthy' },
        { name: 'Falcons', adjective: 'Sharp' },
        { name: 'Bulls', adjective: 'Iron' },
        { name: 'Basilisks', adjective: 'Petrifying' },
        { name: 'Howlers', adjective: 'Mad' },
    ]

    const gangName = {
        name: gangNames[Math.floor(Math.random() * gangNames.length)].name,
        adjective: gangNames[Math.floor(Math.random() * gangNames.length)].adjective,
    }

    return gangName
}

// Process complex nested objects for display
export const processGangValueForDisplay = (key: string, value: unknown, t: TFunction): string => {
    if (value === null || value === undefined) {
        return 'N/A'
    }

    if (typeof value === 'object') {
        // Handle weapons
        if (key === 'weapons' && value && typeof value === 'object' && 'd6' in value) {
            return `${value.d6}d6`
        }

        // Handle armor
        if (key === 'armor' && value && typeof value === 'object' && 'spb' in value && 'h' in value) {
            return `SPB: ${value.spb}, H: ${value.h}`
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

        // Return a placeholder for other complex objects
        return '[Complex Object]'
    }

    // Handle enum values with translations
    if (typeof value === 'string') {
        // Map key to the appropriate i18n namespace
        const namespaceMap: Record<string, string> = {
            type: 'gangs.type',
            quality: 'gangs.quality',
            status: 'gangs.status',
            color: 'gangs.color',
            name: 'gangs.name',
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

    // Special handling for secretive field (integer 9-24)
    if (key === 'secretive') {
        const secretiveValue = Number(value)
        if (secretiveValue >= 9 && secretiveValue <= 24) {
            return String(secretiveValue)
        }
        return String(value)
    }

    return String(value)
}

// Get color based on gang color enum
export const getGangColorValue = (gangColor: string): string => {
    const colorMap: Record<string, string> = {
        BLACK: colors.grays.gray400,
        BLUE: colors.blues.default,
        BRIGHTS: colors.neons.cyan.default,
        BROWNS: '#8B4513', // Saddle brown
        GREEN: colors.greens.default,
        ORANGE: colors.oranges.default,
        RED: colors.reds.default,
        VIOLET: colors.purples.default,
        WHITE: colors.grays.gray800,
        YELLOW: colors.yellows.default,
    }

    return colorMap[gangColor] || colors.grays.gray400
}

/**
 * Get ordered gang data for display
 * @param gang The gang data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedGangData = (
    gang: DisplayGang,
    t: TFunction
): { key: string; label: string; value: unknown }[] => {
    return [
        { key: 'name', label: translateLabel(t, 'name', 'gangs'), value: gang.name },
        { key: 'type', label: translateLabel(t, 'type', 'gangs'), value: gang.type },
        { key: 'color', label: translateLabel(t, 'color', 'gangs'), value: gang.color },
        { key: 'quality', label: translateLabel(t, 'quality', 'gangs'), value: gang.quality },
        { key: 'skill', label: translateLabel(t, 'skill', 'gangs'), value: gang.skill },
        { key: 'secretive', label: translateLabel(t, 'secretive', 'gangs'), value: gang.secretive },
        { key: 'weapons', label: translateLabel(t, 'weapons', 'gangs'), value: gang.weapons },
        { key: 'armor', label: translateLabel(t, 'armor', 'gangs'), value: gang.armor },
        { key: 'status', label: translateLabel(t, 'status', 'gangs'), value: gang.status },
        { key: 'knownFor', label: translateLabel(t, 'knownFor', 'gangs'), value: gang.knownFor },
        { key: 'sin', label: translateLabel(t, 'sin', 'gangs'), value: gang.sin },
        { key: 'flaw', label: translateLabel(t, 'flaw', 'gangs'), value: gang.flaw },
        { key: 'currentAttitude', label: translateLabel(t, 'currentAttitude', 'gangs'), value: gang.currentAttitude },
        {
            key: 'newsTheLeaderIsReceiving',
            label: translateLabel(t, 'newsTheLeaderIsReceiving', 'gangs'),
            value: gang.newsTheLeaderIsReceiving,
        },
    ]
}
