import { Building, Gang } from '../graphql/types'
import { ModuleTypes } from './constants'

/**
 * Utility functions for local storage operations
 */

// Storage keys
const GANGS_STORAGE_KEY = 'magnus-laser-gangs'
const BUILDINGS_STORAGE_KEY = 'magnus-laser-buildings'
const VIEW_PREFERENCES_KEY = 'magnus-laser-view-preferences'
const READER_MODE_KEY = 'magnus-laser-reader-mode'

// Gangs Storage Functions

/**
 * Save gangs to local storage
 * @param gangs Array of gangs to save
 */
export const saveGangs = (gangs: Gang[]): void => {
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
export const loadGangs = (): Gang[] => {
    try {
        const gangsJson = localStorage.getItem(GANGS_STORAGE_KEY)
        return gangsJson ? JSON.parse(gangsJson) : []
    } catch (error) {
        console.error('Error loading gangs from local storage:', error)
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

// Buildings Storage Functions

/**
 * Save buildings to local storage
 * @param buildings Array of buildings to save
 */
export const saveBuildings = (buildings: Building[]): void => {
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
export const loadBuildings = (): Building[] => {
    try {
        const buildingsJson = localStorage.getItem(BUILDINGS_STORAGE_KEY)
        return buildingsJson ? JSON.parse(buildingsJson) : []
    } catch (error) {
        console.error('Error loading buildings from local storage:', error)
        return []
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

/**
 * Save view preference (grid/table) for a specific module type
 * @param moduleType The module type
 * @param isTableView Whether the table view is selected
 */
export const saveViewPreference = (moduleType: ModuleTypes, isTableView: boolean): void => {
    try {
        // Get current preferences or initialize empty object
        const currentPrefsJson = localStorage.getItem(VIEW_PREFERENCES_KEY)
        const currentPrefs = currentPrefsJson ? JSON.parse(currentPrefsJson) : {}

        // Update preference for the module
        currentPrefs[moduleType] = isTableView

        // Save back to localStorage
        localStorage.setItem(VIEW_PREFERENCES_KEY, JSON.stringify(currentPrefs))
    } catch (error) {
        console.error('Error saving view preference to local storage:', error)
    }
}

/**
 * Load view preference for a specific module type
 * @param moduleType The module type
 * @returns Whether table view is preferred (true) or grid view (false)
 */
export const loadViewPreference = (moduleType: ModuleTypes): boolean => {
    try {
        const prefsJson = localStorage.getItem(VIEW_PREFERENCES_KEY)
        if (!prefsJson) return false

        const prefs = JSON.parse(prefsJson)
        // Return the preference if it exists, otherwise default to false (grid view)
        return prefs[moduleType] ?? false
    } catch (error) {
        console.error('Error loading view preference from local storage:', error)
        return false
    }
}

/**
 * Save reader mode preference
 * @param isReaderMode Whether reader mode is enabled
 */
export const saveReaderMode = (isReaderMode: boolean): void => {
    try {
        localStorage.setItem(READER_MODE_KEY, JSON.stringify(isReaderMode))
    } catch (error) {
        console.error('Error saving reader mode preference to local storage:', error)
    }
}

/**
 * Load reader mode preference
 * @returns Whether reader mode is enabled
 */
export const loadReaderMode = (): boolean => {
    try {
        const readerModeJson = localStorage.getItem(READER_MODE_KEY)
        return readerModeJson ? JSON.parse(readerModeJson) : false
    } catch (error) {
        console.error('Error loading reader mode preference from local storage:', error)
        return false
    }
}
