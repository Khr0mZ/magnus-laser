import { Apartment, Badge, BusinessCenter, Groups3, LiveHelp } from '@mui/icons-material'
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

    if (module === ModuleTypes.GANG)
        return (
            <Groups3
                sx={isNavigation ? undefined : isDashboard ? dashboardSx : backgroundSx}
                fontSize={isNavigation ? 'large' : 'inherit'}
            />
        )
    if (module === ModuleTypes.BUILDING)
        return (
            <Apartment
                sx={isNavigation ? undefined : isDashboard ? dashboardSx : smallerBackgroundSx}
                fontSize={isNavigation ? 'large' : 'inherit'}
            />
        )
    if (module === ModuleTypes.CORPORATION)
        return (
            <BusinessCenter
                sx={isNavigation ? undefined : isDashboard ? dashboardSx : smallerBackgroundSx}
                fontSize={isNavigation ? 'large' : 'inherit'}
            />
        )
    if (module === ModuleTypes.FIXER_JOB)
        return (
            <LiveHelp
                sx={isNavigation ? undefined : isDashboard ? dashboardSx : smallerBackgroundSx}
                fontSize={isNavigation ? 'large' : 'inherit'}
            />
        )
    return (
        <Badge
            sx={isNavigation ? undefined : isDashboard ? dashboardSx : smallerBackgroundSx}
            fontSize={isNavigation ? 'large' : 'inherit'}
        />
    )
}
