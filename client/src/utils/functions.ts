/**
 * Converts an enum value to a human-readable category name
 * @param key The property key from the object
 * @param value The enum value
 * @returns A formatted category name
 */
export const getCategoryName = (key: string): string => {
    // Map of property keys to human-readable category names
    const categoryMap: Record<string, string> = {
        // Gang properties
        type: 'Gang Type',
        color: 'Gang Colors',
        name: 'Gang Name Origin',
        quality: 'Member Quantity',
        status: 'Gang Status',
        skill: 'Skill Level',
        secretive: 'Secretive Level',
        knownFor: 'Known For',
        knownForPart1: 'Known For (Primary)',
        knownForPart2: 'Known For (Secondary)',
        currentAttitude: 'Current Attitude',
        flaw: 'Flaw',
        sin: 'Sin',
        newsTheLeaderIsReceiving: 'Latest News',
        armor: 'Armor Rating',
        weapons: 'Weapon Stats',

        // Building properties
        style: 'Architectural Style',
        ownership: 'Ownership',
        securityPersonnel: 'Security Personnel',
        event: 'Current Event',
        secret: 'Hidden Secret',
        backupLights: 'Backup Lights',
        elevators: 'Elevators',
        emergencyExit: 'Emergency Exit',
        gatehouseFrontDesk: 'Front Desk/Gatehouse',
        landingPad: 'Landing Pad',
        parking: 'Parking',
        secretOrAltEntrance: 'Secret Entrance',
    }

    return categoryMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

// Import the icons module

/**
 * Re-export getModuleIcon from functions.tsx
 * This avoids import conflicts
 */
export { getModuleIcon } from './functions.tsx'
