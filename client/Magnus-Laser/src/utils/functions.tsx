import {
    Apartment,
    Badge,
    Check,
    Close,
    GpsFixed,
    Groups,
    Groups3,
    Hub,
    Nightlife,
    PersonAdd,
    Psychology,
    SatelliteAlt,
    Settings,
    SportsMma,
    Warehouse,
} from '@mui/icons-material'
import { TFunction } from 'i18next'
import { BuildingType } from '../graphql/types'
import colors from './colors'
import { ModuleTypes } from './constants'

/**
 * Get the icon for a module
 * @param module - The module to get the icon for
 * @param isNavigation - (optional) Whether the icon is for the navigation drawer
 * @param isDashboard - (optional) Whether the icon is for the dashboard cards
 * @returns The icon for the module
 */
export const getModuleIcon = (module: ModuleTypes, isNavigation?: boolean, isDashboard?: boolean) => {
    // Style for dashboard card icons
    const dashboardSx = {
        fontSize: '38px',
        color: 'inherit',
    }

    // Style for background icons
    const backgroundSx = {
        fontSize: '250px',
        color: 'inherit',
        opacity: 0.8,
    }

    // Style for smaller background icons
    const smallerBackgroundSx = {
        fontSize: '180px',
        color: 'inherit',
        opacity: 0.7,
    }

    // Style for navigation icons
    const navigationSx = {
        fontSize: { xs: '24px', lg: '30px', xl: '38px' },
        transition: 'all 0.2s',
    }

    if (module === ModuleTypes.GANG)
        return <Groups3 sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : backgroundSx} />
    if (module === ModuleTypes.BUILDING)
        return <Apartment sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.FIXER_JOB)
        return <Hub sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.BOUNTY)
        return <GpsFixed sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.CLUB)
        return <Nightlife sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.ITEM)
        return <Warehouse sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.SETTINGS)
        return <Settings sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.MAP)
        return <SatelliteAlt sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.COMBAT_SIM)
        return <SportsMma sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.SOLO_PLAY)
        return <Psychology sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.CHARACTER_CREATOR)
        return <PersonAdd sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    if (module === ModuleTypes.EDGERUNNERS)
        return <Groups sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
    return <Badge sx={isNavigation ? navigationSx : isDashboard ? dashboardSx : smallerBackgroundSx} />
}

/**
 * Process a building value for display
 * @param key The key of the value
 * @param value The value to process
 * @param t The translation function
 * @returns The processed value
 */
export const processBuildingValueForDisplay = (
    key: string,
    value: unknown,
    t: TFunction,
    isAbandoned: boolean
): React.ReactNode => {
    // Skip the typename property that GraphQL adds
    if (key === '__typename') {
        return ''
    }

    if (key === 'type') {
        if (isAbandoned) {
            return (
                t(`buildings.type.${BuildingType.ABANDONED_BUILDING}`, String(BuildingType.ABANDONED_BUILDING)) +
                ' ' +
                t(`buildings.type.${value}`, String(value))
            )
        }
        return t(`buildings.type.${value}`, String(value))
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
        return value ? (
            <Check
                sx={{ color: colors.neons.green.dark }}
                fontSize={'small'}
                className={'glitch-text'}
                data-text={true}
            />
        ) : (
            <Close
                sx={{ color: colors.neons.red.dark }}
                fontSize={'small'}
                className={'glitch-text'}
                data-text={false}
            />
        )
    }

    // Handle enum values with translations
    if (typeof value === 'string') {
        // Map key to the appropriate i18n namespace
        const namespaceMap: Record<string, string> = {
            type: 'buildings.type',
            style: 'buildings.style',
            ownership: 'buildings.ownership',
            securityPersonnel: 'buildings.securityPersonnel',
            event: 'buildings.event',
            secret: 'buildings.secret',
        }

        if (namespaceMap[key]) {
            // Use the exact enum key as it appears in the translation file
            return t(`${namespaceMap[key]}.${value}`, String(value))
        }
    }

    return value as React.ReactNode
}
