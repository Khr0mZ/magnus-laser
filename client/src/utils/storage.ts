import localforage from 'localforage'
import { Building, Gang } from '../graphql/types'
import { ModuleTypes } from './constants'

/**
 * Utility functions for local storage operations using IndexedDB through localForage
 */

// Storage keys
const GANGS_STORAGE_KEY = 'magnus-laser-gangs'
const BUILDINGS_STORAGE_KEY = 'magnus-laser-buildings'
const VIEW_PREFERENCES_KEY = 'magnus-laser-view-preferences'
const READER_MODE_KEY = 'magnus-laser-reader-mode'
const HUGGING_FACE_API_KEY = 'magnus-laser-huggingface-api-key'

// Event system for data changes
export const DATA_IMPORT_EVENT = 'magnus-laser-data-imported'

// Initialize localForage with custom settings
localforage.config({
    name: 'MagnusLaser',
    storeName: 'cyber_data', // The name of the IndexedDB database
    description: 'Magnus Laser Cyberpunk Generator Data',
})

/**
 * Notify all components that data has been imported
 */
export const notifyDataImported = (): void => {
    window.dispatchEvent(new CustomEvent(DATA_IMPORT_EVENT))
}

// Gangs Storage Functions

/**
 * Save gangs to IndexedDB
 * @param gangs Array of gangs to save
 */
export const saveGangs = async (gangs: Gang[]): Promise<void> => {
    try {
        await localforage.setItem(GANGS_STORAGE_KEY, gangs)
    } catch (error) {
        console.error('Error saving gangs to storage:', error)
    }
}

/**
 * Load gangs from IndexedDB
 * @returns Array of gangs or empty array if none found
 */
export const loadGangs = async (): Promise<Gang[]> => {
    try {
        const gangs = await localforage.getItem<Gang[]>(GANGS_STORAGE_KEY)
        return gangs || []
    } catch (error) {
        console.error('Error loading gangs from storage:', error)
        return []
    }
}

/**
 * Clear gangs from IndexedDB
 */
export const clearGangs = async (): Promise<void> => {
    try {
        await localforage.removeItem(GANGS_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing gangs from storage:', error)
    }
}

// Buildings Storage Functions

/**
 * Save buildings to IndexedDB
 * @param buildings Array of buildings to save
 */
export const saveBuildings = async (buildings: Building[]): Promise<void> => {
    try {
        await localforage.setItem(BUILDINGS_STORAGE_KEY, buildings)
    } catch (error) {
        console.error('Error saving buildings to storage:', error)
    }
}

/**
 * Load buildings from IndexedDB
 * @returns Array of buildings or empty array if none found
 */
export const loadBuildings = async (): Promise<Building[]> => {
    try {
        const buildings = await localforage.getItem<Building[]>(BUILDINGS_STORAGE_KEY)
        return buildings || []
    } catch (error) {
        console.error('Error loading buildings from storage:', error)
        return []
    }
}

/**
 * Clear buildings from IndexedDB
 */
export const clearBuildings = async (): Promise<void> => {
    try {
        await localforage.removeItem(BUILDINGS_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing buildings from storage:', error)
    }
}

/**
 * Save view preference (grid/table) for a specific module type
 * @param moduleType The module type
 * @param isTableView Whether the table view is selected
 */
export const saveViewPreference = async (moduleType: ModuleTypes, isTableView: boolean): Promise<void> => {
    try {
        // Get current preferences or initialize empty object
        const currentPrefs = (await localforage.getItem<Record<string, boolean>>(VIEW_PREFERENCES_KEY)) || {}

        // Update preference for the module
        currentPrefs[moduleType] = isTableView

        // Save back to storage
        await localforage.setItem(VIEW_PREFERENCES_KEY, currentPrefs)
    } catch (error) {
        console.error('Error saving view preference to storage:', error)
    }
}

/**
 * Load view preference for a specific module type
 * @param moduleType The module type
 * @returns Whether table view is preferred (true) or grid view (false)
 */
export const loadViewPreference = async (moduleType: ModuleTypes): Promise<boolean> => {
    try {
        const prefs = await localforage.getItem<Record<string, boolean>>(VIEW_PREFERENCES_KEY)

        // Return the preference if it exists, otherwise default to false (grid view)
        return prefs ? prefs[moduleType] ?? false : false
    } catch (error) {
        console.error('Error loading view preference from storage:', error)
        return false
    }
}

/**
 * Load all view preferences
 * @returns Record mapping module types to view preferences
 */
export const loadAllViewPreferences = async (): Promise<Record<ModuleTypes, boolean>> => {
    try {
        const prefs = (await localforage.getItem<Record<string, boolean>>(VIEW_PREFERENCES_KEY)) || {}

        // Initialize default preferences for all module types
        const allPrefs: Partial<Record<ModuleTypes, boolean>> = {}

        // Set defaults for all module types that use view preferences
        Object.values(ModuleTypes).forEach((moduleType) => {
            allPrefs[moduleType] = prefs[moduleType] ?? false
        })

        return allPrefs as Record<ModuleTypes, boolean>
    } catch (error) {
        console.error('Error loading all view preferences from storage:', error)

        // Return defaults (grid view) for all modules
        const defaults: Partial<Record<ModuleTypes, boolean>> = {}
        Object.values(ModuleTypes).forEach((moduleType) => {
            defaults[moduleType] = false
        })

        return defaults as Record<ModuleTypes, boolean>
    }
}

/**
 * Save reader mode preference
 * @param isReaderMode Whether reader mode is enabled
 */
export const saveReaderMode = async (isReaderMode: boolean): Promise<void> => {
    try {
        await localforage.setItem(READER_MODE_KEY, isReaderMode)
    } catch (error) {
        console.error('Error saving reader mode preference to storage:', error)
    }
}

/**
 * Load reader mode preference
 * @returns Whether reader mode is enabled
 */
export const loadReaderMode = async (): Promise<boolean> => {
    try {
        const readerMode = await localforage.getItem<boolean>(READER_MODE_KEY)
        return readerMode ?? false
    } catch (error) {
        console.error('Error loading reader mode preference from storage:', error)
        return false
    }
}

/**
 * Save Hugging Face API key to storage
 * @param apiKey The API key to save
 */
export const saveHuggingFaceApiKey = async (apiKey: string): Promise<void> => {
    try {
        await localforage.setItem(HUGGING_FACE_API_KEY, apiKey)
    } catch (error) {
        console.error('Error saving Hugging Face API key to storage:', error)
    }
}

/**
 * Load Hugging Face API key from storage
 * @returns The API key, or empty string if not found
 */
export const loadHuggingFaceApiKey = async (): Promise<string> => {
    try {
        const apiKey = await localforage.getItem<string>(HUGGING_FACE_API_KEY)
        return apiKey || ''
    } catch (error) {
        console.error('Error loading Hugging Face API key from storage:', error)
        return ''
    }
}

/**
 * Clear Hugging Face API key from storage
 */
export const clearHuggingFaceApiKey = async (): Promise<void> => {
    try {
        await localforage.removeItem(HUGGING_FACE_API_KEY)
    } catch (error) {
        console.error('Error clearing Hugging Face API key from storage:', error)
    }
}

// For initialization when async operations can't be used
// These functions allow synchronous access during component initialization

/**
 * Load reader mode preference synchronously (for initialization)
 * @returns Whether reader mode is enabled (defaults to false)
 */
export const loadReaderModeSync = (): boolean => {
    return false // Default to false, will be updated after async call completes
}

// Debug utilities - completely removed
