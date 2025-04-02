import { TFunction } from 'i18next'
import { BuildingType as BuildingTypeEnum, Ownership } from '../../graphql/types'
import { corpoPrefixes, styleAdjectives } from '../../utils/generators'
import { translateEnum, translateLabel } from '../../utils/i18nUtils'
import { DisplayBuilding } from './BuildingTypes'

// Function to generate name for the current language
export const generateLocalizedBuildingName = (building: DisplayBuilding, t: TFunction): string => {
    if (!building._nameComponents) {
        return building.displayName // Fallback to stored name
    }

    const { type, style, ownership } = building._nameComponents

    // Use stored indices for consistency instead of generating new random values
    // If indices don't exist on the building, fallback to 0
    const styleIndex = building._nameAdjectiveIndex ?? 0
    const corpoIndex = building._corpoIndex ?? 0
    const randomNumber = building._randomNumber ?? Math.floor(Math.random() * 100)

    // Use stored index for consistency
    const styleAdj = styleAdjectives[style][styleIndex]

    // Use stored index for consistency
    const corpo = corpoPrefixes[corpoIndex]

    switch (type) {
        case BuildingTypeEnum.SKYSCRAPER_MEGABUILDING:
            return `${styleAdj} Megabuilding H${randomNumber}`

        case BuildingTypeEnum.MEGACORPO_HQ:
        case BuildingTypeEnum.CORPO_BUILDING: {
            return ownership === Ownership.MEGA_CORPO || ownership === Ownership.CORPO
                ? `${corpo} ${styleAdj} Tower`
                : `${t('buildings.former', 'Former')} ${corpo} ${styleAdj} ${t('buildings.building', 'Building')}`
        }

        case BuildingTypeEnum.COMMERCIAL_BUILDING:
            return `Westbrook ${styleAdj} ${t('buildings.mall', 'Mall')}`

        case BuildingTypeEnum.ESTABLISHMENT:
            return `${t('common.the')} ${styleAdj} Neon ${t('buildings.dragon', 'Dragon')} ${t(
                'buildings.club',
                'Club'
            )}`

        case BuildingTypeEnum.CUBE_HOTEL_MOTEL_CARGO_CONTAINER:
            return `${styleAdj} ${t('buildings.cubeHotel', 'Cube Hotel')} ${randomNumber}`

        case BuildingTypeEnum.LUXURY_PENTHOUSE_MCMANSION:
            return `${styleAdj} ${t('buildings.luxury', 'Luxury')} ${t('buildings.heights', 'Heights')} 5`

        case BuildingTypeEnum.ABANDONED_BUILDING:
            return `${t('buildings.abandoned', 'Abandoned')} ${styleAdj} Neo-Plaza`

        case BuildingTypeEnum.VACANT_LOT_CONSTRUCTION_SITE:
            return `${styleAdj} ${t('buildings.constructionSite', 'Construction Site')} ${randomNumber}`

        case BuildingTypeEnum.GOV_BUILDING:
            return `${styleAdj} ${t('buildings.govBuilding', 'Gov Building')}`

        case BuildingTypeEnum.MULTI_STORY_BUILDING:
            return `${styleAdj} ${t('buildings.multiStory', 'Hive Building')}`

        case BuildingTypeEnum.PUBLIC_SPACE:
            return `${styleAdj} ${t('buildings.publicSpace', 'Neo-Plaza')}`

        default:
            return `${styleAdj} Neo-Plaza`
    }
}

// Function to generate description for the current language
export const generateLocalizedBuildingDescription = (building: DisplayBuilding, t: TFunction): string => {
    if (!building._descriptionData?.building) {
        return building.description // Fallback to stored description
    }

    const b = building._descriptionData.building
    let description = ''

    // Generate the display name for this language
    const displayName = generateLocalizedBuildingName(building, t)

    // Start with the building type and style
    description += `${displayName} ${t('buildings.descriptions.is')} ${translateEnum(
        t,
        b.style,
        'buildings.style'
    )} ${t('buildings.descriptions.styled')} ${translateEnum(t, b.type, 'buildings.type')}. `

    // Add information about ownership
    switch (b.ownership) {
        case Ownership.CORPO:
        case Ownership.MEGA_CORPO: {
            description += `${t('buildings.descriptions.ownedBy', {
                type: b.ownership === Ownership.MEGA_CORPO ? t('buildings.descriptions.major') : '',
            })} `
            break
        }
        case Ownership.GANG_MAFIA:
        case Ownership.MILITARISTIC_GANG:
        case Ownership.POSERGANG: {
            description += `${t('buildings.descriptions.controlledBy', {
                owner: translateEnum(t, b.ownership, 'buildings.ownership'),
            })} `
            break
        }
        case Ownership.GOVERNMENT:
        case Ownership.LOCAL_GOV: {
            description += `${t('buildings.descriptions.facility', {
                owner: translateEnum(t, b.ownership, 'buildings.ownership'),
            })} `
            break
        }
        case Ownership.NO_ONE_SCAVS: {
            description += `${t('buildings.descriptions.abandoned')} `
            break
        }
        default: {
            description += `${t('buildings.descriptions.property', {
                owner: translateEnum(t, b.ownership, 'buildings.ownership'),
            })} `
        }
    }

    // Security information
    if (b.securityPersonnel === 'NONE') {
        description += `${t('buildings.descriptions.noSecurity')} `
    } else {
        description += `${t('buildings.descriptions.guardedBy', {
            security: translateEnum(t, b.securityPersonnel, 'buildings.security'),
        })} `
    }

    // Add current event information
    const eventTranslation = translateEnum(t, b.event, 'buildings.event')
    description += `${t('buildings.descriptions.currentEvent', {
        event: eventTranslation,
    })} `

    // Add secret
    const secretTranslation = translateEnum(t, b.secret, 'buildings.secret')
    description += `${t('buildings.descriptions.rumors', {
        secret: secretTranslation,
    })}`

    return description
}

// Process complex nested objects for display
export const processBuildingValueForDisplay = (key: string, value: unknown, t: TFunction): string => {
    if (value === null || value === undefined) {
        return 'N/A'
    }

    if (typeof value === 'object') {
        const valueObj = value as Record<string, unknown>
        // Handle specific nested objects with difficulty values
        if (
            key === 'backupLights' ||
            key === 'elevators' ||
            key === 'emergencyExit' ||
            key === 'gatehouseFrontDesk' ||
            key === 'landingPad' ||
            key === 'parking' ||
            key === 'secretOrAltEntrance'
        ) {
            if ('value' in valueObj && valueObj.value !== undefined) {
                return `DV${valueObj.value}`
            }
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
            type: 'buildings.type',
            ownership: 'buildings.ownership',
            securityPersonnel: 'buildings.security',
            style: 'buildings.style',
            event: 'buildings.event',
            secret: 'buildings.secret',
        }

        if (namespaceMap[key]) {
            return translateEnum(t, value, namespaceMap[key])
        }
    }

    return String(value)
}

/**
 * Get ordered building data for display
 * @param building The building data
 * @param t Translation function
 * @returns Array of data items ordered for display
 */
export const getOrderedBuildingData = (
    building: DisplayBuilding,
    t: TFunction
): { key: string; label: string; value: unknown }[] => {
    return [
        { key: 'type', label: translateLabel(t, 'type', 'buildings'), value: building.type },
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
