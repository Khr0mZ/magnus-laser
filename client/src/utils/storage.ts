/**
 * Utility functions for local storage operations
 */

// Storage keys
const GANGS_STORAGE_KEY = 'cyber-manager-gangs'
const BUILDINGS_STORAGE_KEY = 'cyber-manager-buildings'

/**
 * Types for the stored data
 */
interface DisplayGang {
    displayName: string
    description: string
    [key: string]: string | number | boolean | object | null | undefined
}

interface DisplayBuilding {
    displayName: string
    description: string
    [key: string]: string | number | boolean | object | null | undefined
}

/**
 * Save gangs to local storage
 * @param gangs Array of gangs to save
 */
export const saveGangs = (gangs: DisplayGang[]): void => {
    try {
        localStorage.setItem(GANGS_STORAGE_KEY, JSON.stringify(gangs))
    } catch (error) {
        console.error('Error saving gangs to local storage:', error)
    }
}

/**
 * Load gangs from local storage
 * @returns Array of gangs or empty array if none found
 */
export const loadGangs = (): DisplayGang[] => {
    try {
        const gangsJson = localStorage.getItem(GANGS_STORAGE_KEY)
        return gangsJson ? JSON.parse(gangsJson) : []
    } catch (error) {
        console.error('Error loading gangs from local storage:', error)
        return []
    }
}

/**
 * Save buildings to local storage
 * @param buildings Array of buildings to save
 */
export const saveBuildings = (buildings: DisplayBuilding[]): void => {
    try {
        localStorage.setItem(BUILDINGS_STORAGE_KEY, JSON.stringify(buildings))
    } catch (error) {
        console.error('Error saving buildings to local storage:', error)
    }
}

/**
 * Load buildings from local storage
 * @returns Array of buildings or empty array if none found
 */
export const loadBuildings = (): DisplayBuilding[] => {
    try {
        const buildingsJson = localStorage.getItem(BUILDINGS_STORAGE_KEY)
        return buildingsJson ? JSON.parse(buildingsJson) : []
    } catch (error) {
        console.error('Error loading buildings from local storage:', error)
        return []
    }
}

/**
 * Clear all saved gangs from local storage
 */
export const clearGangs = (): void => {
    try {
        localStorage.removeItem(GANGS_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing gangs from local storage:', error)
    }
}

/**
 * Clear all saved buildings from local storage
 */
export const clearBuildings = (): void => {
    try {
        localStorage.removeItem(BUILDINGS_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing buildings from local storage:', error)
    }
}
