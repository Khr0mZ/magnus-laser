import localforage from 'localforage'
import { Building, FixerJob, Gang } from '../graphql/types'
import { ModuleTypes } from './constants'

/**
 * Utility functions for local storage operations using IndexedDB through localForage
 */

// Storage keys
const GANGS_STORAGE_KEY = 'magnus-laser-gangs'
const BUILDINGS_STORAGE_KEY = 'magnus-laser-buildings'
const FIXER_JOBS_STORAGE_KEY = 'magnus-laser-fixer-jobs'
const VIEW_PREFERENCES_KEY = 'magnus-laser-view-preferences'
const READER_MODE_KEY = 'magnus-laser-reader-mode'
const ANIMATIONS_ENABLED_KEY = 'magnus-laser-animations-enabled'
const HUGGING_FACE_API_KEY = 'magnus-laser-huggingface-api-key'
const OPENAI_API_KEY = 'magnus-laser-openai-api-key'
const GEMINI_API_KEY = 'magnus-laser-gemini-api-key'
// Image storage keys
const IMAGE_STORAGE_KEY_PREFIX = 'magnus-laser-image-'

// Event system for data changes
export const DATA_IMPORT_EVENT = 'magnus-laser-data-imported'

/**
 * Utility function to generate a unique ID for image storage
 * @returns A unique ID string
 */
const generateImageId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Save an image blob to IndexedDB and return the image ID
 * @param blob The image blob to save
 * @returns The unique ID for the saved image
 */
export const saveImageBlob = async (blob: Blob): Promise<string> => {
    try {
        const imageId = generateImageId()
        const key = `${IMAGE_STORAGE_KEY_PREFIX}${imageId}`
        await localforage.setItem(key, blob)
        return imageId
    } catch (error) {
        console.error('Error saving image blob to storage:', error)
        throw error
    }
}

/**
 * Get an image blob from IndexedDB by its ID
 * @param imageId The ID of the image to retrieve
 * @returns The image blob, or null if not found
 */
export const getImageBlob = async (imageId: string): Promise<Blob | null> => {
    try {
        const key = `${IMAGE_STORAGE_KEY_PREFIX}${imageId}`
        return await localforage.getItem<Blob>(key)
    } catch (error) {
        console.error('Error retrieving image blob from storage:', error)
        return null
    }
}

/**
 * Convert an image blob to a data URL for display
 * @param blob The image blob to convert
 * @returns A Promise that resolves to the data URL
 */
export const blobToDataUrl = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            resolve(reader.result as string)
            // Clean up reader after use
            reader.onload = null
            reader.onerror = null
        }
        reader.onerror = (error) => {
            console.error('Error converting blob to data URL:', error)
            reader.abort()
            reject(error)
        }
        reader.readAsDataURL(blob)
    })
}

/**
 * Convert a data URL to a blob
 * @param dataUrl The data URL to convert
 * @returns The blob
 */
export const dataUrlToBlob = async (dataUrl: string | Blob): Promise<Blob> => {
    // Check if it's already a blob object
    if (dataUrl instanceof Blob) return dataUrl

    // Extract content type and base64 data
    const parts = dataUrl.split(';base64,')
    if (parts.length !== 2) {
        throw new Error('Invalid data URL format')
    }

    const contentType = parts[0].split(':')[1]
    const base64 = parts[1]
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: contentType })
}

/**
 * Delete an image from storage by its ID
 * @param imageId The ID of the image to delete
 */
export const deleteImageBlob = async (imageId: string): Promise<void> => {
    try {
        const key = `${IMAGE_STORAGE_KEY_PREFIX}${imageId}`
        await localforage.removeItem(key)
    } catch (error) {
        console.error('Error deleting image from storage:', error)
    }
}

/**
 * Process entity to store images as blobs
 * This function extracts base64 images, stores them as blobs, and replaces them with imageIds
 * For FixerJobs, it also replaces Gang and Building objects with just their IDs in nested structures
 * @param entity The entity to process
 * @returns A processed entity with images replaced by imageIds
 */
export const processEntityForStorage = async <T extends Record<string, unknown>>(entity: T): Promise<T> => {
    const processedEntity = { ...entity }

    // Process an object recursively to find and replace image base64 data with imageIds
    const processObject = async (obj: Record<string, unknown>, path: string = ''): Promise<void> => {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key

            // If the property is called "image" and contains a base64 data URL
            if (key === 'image' && typeof value === 'string' && value.startsWith('data:')) {
                try {
                    const blob = await dataUrlToBlob(value)
                    const imageId = await saveImageBlob(blob)
                    obj[key] = imageId
                } catch (error) {
                    console.error(`Error processing image at path ${currentPath}:`, error)
                    // Keep the original value in case of error
                }
            }
            // Handle Gang and Building objects in any property that contains them
            else if (value && typeof value === 'object' && !Array.isArray(value) && 'ID' in value) {
                // If the value is a Gang or Building with an ID and we're in a property called building or gang
                if ((key === 'building' || key === 'gang') && !path.startsWith('plot')) {
                    obj[key] = (value as { ID: string }).ID
                }
            }
            // Also handle plotBuilding building reference nested in plot
            else if (
                key === 'plotBuilding' &&
                value &&
                typeof value === 'object' &&
                'building' in value &&
                typeof (value as { building: unknown }).building === 'object' &&
                'ID' in (value as { building: Record<string, unknown> }).building
            ) {
                const plotBuilding = value as { building: { ID: string } }
                const buildingId = plotBuilding.building.ID
                ;(obj[key] as Record<string, unknown>).building = buildingId
            }
            // Handle PlotGang gang reference nested in plot complications
            else if (
                key === 'gang' &&
                value &&
                typeof value === 'object' &&
                'gang' in value &&
                typeof (value as { gang: unknown }).gang === 'object' &&
                'ID' in (value as { gang: Record<string, unknown> }).gang
            ) {
                const plotGang = value as { gang: { ID: string } }
                const gangId = plotGang.gang.ID
                ;(obj[key] as Record<string, unknown>).gang = gangId
            }
            // Handle PlotComplication gang reference nested in plot
            else if (
                key === 'complication' &&
                value &&
                typeof value === 'object' &&
                'gang' in value &&
                typeof (value as { gang: unknown }).gang === 'object'
            ) {
                const complication = value as { gang: Record<string, unknown> }
                const gangObj = complication.gang
                if (
                    'gang' in gangObj &&
                    typeof gangObj.gang === 'object' &&
                    'ID' in (gangObj.gang as Record<string, unknown>)
                ) {
                    gangObj.gang = (gangObj.gang as { ID: string }).ID
                }
            }
            // If it's a nested object, process it recursively
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                await processObject(value as Record<string, unknown>, currentPath)
            }
            // If it's an array, process each array item that is an object
            else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    if (value[i] && typeof value[i] === 'object') {
                        await processObject(value[i] as Record<string, unknown>, `${currentPath}[${i}]`)
                    }
                }
            }
        }
    }

    await processObject(processedEntity)
    return processedEntity
}

/**
 * Process entity loaded from storage to convert imageIds to data URLs for display
 * For FixerJobs, it also replaces Building and Gang IDs with the full objects in nested structures
 * @param entity The entity loaded from storage
 * @returns A processed entity with imageIds replaced by data URLs
 */
export const processEntityForDisplay = async <T extends Record<string, unknown>>(entity: T): Promise<T> => {
    if (!entity) return entity

    const processedEntity = { ...entity }

    // Pre-load buildings and gangs if needed for reference resolution
    let buildings: Building[] | null = null
    let gangs: Gang[] | null = null

    // Check if this is a FixerJob-like entity that might need building/gang resolution
    const needsReferenceResolution = 'plot' in entity // FixerJob has nested references in plot

    if (needsReferenceResolution) {
        buildings = (await localforage.getItem<Building[]>(BUILDINGS_STORAGE_KEY)) || []
        gangs = (await localforage.getItem<Gang[]>(GANGS_STORAGE_KEY)) || []
    }

    // Helper function to find a gang by ID
    const findGangById = (gangId: string): Gang | undefined => {
        return gangs?.find((g) => g.ID === gangId)
    }

    // Process an object recursively to find and replace imageIds with data URLs
    const processObject = async (obj: Record<string, unknown>, path: string = ''): Promise<void> => {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key

            // If the property is called "image" and contains an imageId (string but not a data URL)
            if (key === 'image' && typeof value === 'string' && !value.startsWith('data:')) {
                try {
                    const blob = await getImageBlob(value)
                    if (blob) {
                        const dataUrl = await blobToDataUrl(blob)
                        obj[key] = dataUrl
                    }
                } catch (error) {
                    console.error(`Error processing image at path ${currentPath}:`, error)
                    // Keep the original value in case of error
                }
            }
            // Handle Building and Gang references in properties called building or gang
            else if (
                (key === 'building' || key === 'gang') &&
                typeof value === 'string' &&
                !path.startsWith('plot') &&
                (buildings || gangs)
            ) {
                if (key === 'building' && buildings) {
                    const buildingId = value
                    const building = buildings.find((b) => b.ID === buildingId)
                    if (building) {
                        obj[key] = await processEntityForDisplay(building)
                    }
                } else if (key === 'gang' && gangs) {
                    const gangId = value
                    const gang = gangs.find((g) => g.ID === gangId)
                    if (gang) {
                        obj[key] = await processEntityForDisplay(gang)
                    }
                }
            }
            // Handle the special case for plotSubject in plot structure
            else if (key === 'plotSubject' && value && typeof value === 'object') {
                const subject = value as Record<string, unknown>

                // Handle nested gang object in plotSubject
                if ('gang' in subject) {
                    // The gang could be an ID (string) or a partial gang object
                    if (typeof subject.gang === 'string') {
                        // If it's a gang ID, find the complete gang object
                        const gangId = subject.gang
                        const gang = findGangById(gangId)
                        if (gang) {
                            // Replace the ID with the processed gang object
                            subject.gang = await processEntityForDisplay(gang)
                        }
                    } else if (subject.gang && typeof subject.gang === 'object') {
                        // If it's already a gang object, check if it has just an ID or is complete
                        const gangObj = subject.gang as Record<string, unknown>

                        if ('ID' in gangObj && Object.keys(gangObj).length === 1) {
                            // If it's just an ID object, replace with full gang
                            const gangId = gangObj.ID as string
                            const gang = findGangById(gangId)
                            if (gang) {
                                subject.gang = await processEntityForDisplay(gang)
                            }
                        } else {
                            // It's a more complete gang object, just process it in place
                            await processObject(gangObj, `${currentPath}.gang`)
                        }
                    }
                }

                // Continue processing other properties within subject
                if (typeof subject === 'object' && !Array.isArray(subject)) {
                    await processObject(subject, currentPath)
                }
            }
            // Handle plotBuilding building reference nested in plot
            else if (
                key === 'plotBuilding' &&
                value &&
                typeof value === 'object' &&
                'building' in value &&
                typeof (value as { building: unknown }).building === 'string' &&
                buildings
            ) {
                const plotBuilding = value as Record<string, unknown>
                const buildingId = plotBuilding.building as string
                const building = buildings.find((b) => b.ID === buildingId)
                if (building) {
                    plotBuilding.building = await processEntityForDisplay(building)
                }
            }
            // Handle PlotGang gang reference nested in plot
            else if (
                key === 'gang' &&
                value &&
                typeof value === 'object' &&
                'gang' in value &&
                typeof (value as { gang: unknown }).gang === 'string' &&
                gangs
            ) {
                const plotGang = value as Record<string, unknown>
                const gangId = plotGang.gang as string
                const gang = gangs.find((g) => g.ID === gangId)
                if (gang) {
                    plotGang.gang = await processEntityForDisplay(gang)
                }
            }
            // Handle PlotComplication gang reference nested in plot
            else if (
                key === 'complication' &&
                value &&
                typeof value === 'object' &&
                'gang' in value &&
                typeof (value as { gang: unknown }).gang === 'object' &&
                'gang' in (value as { gang: Record<string, unknown> }).gang &&
                typeof (value as { gang: Record<string, unknown> }).gang.gang === 'string' &&
                gangs
            ) {
                const complication = value as Record<string, Record<string, unknown>>
                const gangObj = complication.gang
                const gangId = gangObj.gang as string
                const gang = gangs.find((g) => g.ID === gangId)
                if (gang) {
                    gangObj.gang = await processEntityForDisplay(gang)
                }
            }
            // If it's a nested object, process it recursively
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                await processObject(value as Record<string, unknown>, currentPath)
            }
            // If it's an array, process each array item that is an object
            else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    if (value[i] && typeof value[i] === 'object') {
                        await processObject(value[i] as Record<string, unknown>, `${currentPath}[${i}]`)
                    }
                }
            }
        }
    }

    await processObject(processedEntity)
    return processedEntity
}

// Gangs Storage Functions

/**
 * Save gangs to IndexedDB
 * @param gangs Array of gangs to save
 */
export const saveGangs = async (gangs: Gang[]): Promise<void> => {
    try {
        // Process gangs to store images as blobs
        const processedGangs = await Promise.all(gangs.map((gang) => processEntityForStorage(gang)))
        await localforage.setItem(GANGS_STORAGE_KEY, processedGangs)
    } catch (error) {
        console.error('Error saving gangs to storage:', error)
    }
}

/**
 * Load gangs from IndexedDB
 * @returns Array of gangs, or empty array if not found
 */
export const loadGangs = async (): Promise<Gang[]> => {
    try {
        const gangs = await localforage.getItem<Gang[]>(GANGS_STORAGE_KEY)
        // Process loaded gangs to convert imageIds to data URLs
        if (gangs && gangs.length > 0) {
            return await Promise.all(gangs.map((gang) => processEntityForDisplay(gang)))
        }
        return gangs || []
    } catch (error) {
        console.error('Error loading gangs from storage:', error)
        return []
    }
}

/**
 * Clear all gangs from storage
 */
export const clearGangs = async (): Promise<void> => {
    try {
        // Get current gangs to clean up their images
        const gangs = await localforage.getItem<Gang[]>(GANGS_STORAGE_KEY)
        if (gangs && gangs.length > 0) {
            // Clean up image blobs before removing gangs
            for (const gang of gangs) {
                if (gang.image && typeof gang.image === 'string' && !gang.image.startsWith('data:')) {
                    await deleteImageBlob(gang.image)
                }
                // TODO: Add recursive cleanup for nested images if needed
            }
        }

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
        // Process buildings to store images as blobs
        const processedBuildings = await Promise.all(buildings.map((building) => processEntityForStorage(building)))
        await localforage.setItem(BUILDINGS_STORAGE_KEY, processedBuildings)
    } catch (error) {
        console.error('Error saving buildings to storage:', error)
    }
}

/**
 * Load buildings from IndexedDB
 * @returns Array of buildings, or empty array if not found
 */
export const loadBuildings = async (): Promise<Building[]> => {
    try {
        const buildings = await localforage.getItem<Building[]>(BUILDINGS_STORAGE_KEY)
        // Process loaded buildings to convert imageIds to data URLs
        if (buildings && buildings.length > 0) {
            return await Promise.all(buildings.map((building) => processEntityForDisplay(building)))
        }
        return buildings || []
    } catch (error) {
        console.error('Error loading buildings from storage:', error)
        return []
    }
}

/**
 * Clear all buildings from storage
 */
export const clearBuildings = async (): Promise<void> => {
    try {
        // Get current buildings to clean up their images
        const buildings = await localforage.getItem<Building[]>(BUILDINGS_STORAGE_KEY)
        if (buildings && buildings.length > 0) {
            // Clean up image blobs before removing buildings
            for (const building of buildings) {
                if (building.image && typeof building.image === 'string' && !building.image.startsWith('data:')) {
                    await deleteImageBlob(building.image)
                }
                // Orphaned images are deleted by the cleanupOrphanedImages function while loader is running
            }
        }

        await localforage.removeItem(BUILDINGS_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing buildings from storage:', error)
    }
}

// Fixer Jobs Storage Functions

/**
 * Save fixer jobs to IndexedDB
 * Also saves any referenced buildings and gangs that don't exist yet
 * @param fixerJobs Array of fixer jobs to save
 */
export const saveFixerJobs = async (fixerJobs: FixerJob[]): Promise<void> => {
    try {
        // Extract buildings and gangs from fixer jobs before processing
        await extractAndSaveReferences(fixerJobs)

        // Process fixer jobs to store images as blobs
        const processedFixerJobs = await Promise.all(fixerJobs.map((job) => processEntityForStorage(job)))
        await localforage.setItem(FIXER_JOBS_STORAGE_KEY, processedFixerJobs)
    } catch (error) {
        console.error('Error saving fixer jobs to storage:', error)
    }
}

/**
 * Extract and save buildings and gangs referenced in fixer jobs
 * @param fixerJobs The fixer jobs to extract references from
 */
const extractAndSaveReferences = async (fixerJobs: FixerJob[]): Promise<void> => {
    // Collect all buildings and gangs from the fixer jobs
    const buildings: Building[] = []
    const gangs: Gang[] = []

    // Extract buildings and gangs from plot structure
    fixerJobs.forEach((job) => {
        // Extract from plot structure if it exists
        if (job.plot) {
            // Extract from plotBuilding
            if (
                job.plot.plotBuilding &&
                job.plot.plotBuilding.building &&
                typeof job.plot.plotBuilding.building === 'object'
            ) {
                buildings.push(job.plot.plotBuilding.building as Building)
            }

            // Extract from complication if it exists
            if (job.plot.complication) {
                // Extract gang from complication
                if (
                    job.plot.complication.gang &&
                    job.plot.complication.gang.gang &&
                    typeof job.plot.complication.gang.gang === 'object'
                ) {
                    gangs.push(job.plot.complication.gang.gang as Gang)
                }
            }

            // Extract from PlaceComplication if exists
            if (
                job.plot.plotBuilding &&
                job.plot.plotBuilding.complication &&
                job.plot.plotBuilding.complication.gang &&
                job.plot.plotBuilding.complication.gang.gang &&
                typeof job.plot.plotBuilding.complication.gang.gang === 'object'
            ) {
                gangs.push(job.plot.plotBuilding.complication.gang.gang as Gang)
            }

            // Extract from plotSubject if it exists and is a PlotGang
            if (
                job.plot.plotSubject &&
                'gang' in job.plot.plotSubject &&
                job.plot.plotSubject.gang &&
                typeof job.plot.plotSubject.gang === 'object'
            ) {
                gangs.push(job.plot.plotSubject.gang as Gang)
            }
        }
    })

    // If we found buildings or gangs, merge them with existing ones and save
    if (buildings.length > 0) {
        const existingBuildings = await loadBuildings()
        const uniqueBuildings = mergeEntities(existingBuildings, buildings)
        await saveBuildings(uniqueBuildings)
    }

    if (gangs.length > 0) {
        const existingGangs = await loadGangs()
        const uniqueGangs = mergeEntities(existingGangs, gangs)
        await saveGangs(uniqueGangs)
    }
}

/**
 * Merge existing entities with new ones, avoiding duplicates by ID
 * @param existing Existing entities
 * @param newEntities New entities to merge
 * @returns Merged list with duplicates removed (newer versions preferred)
 */
const mergeEntities = <T extends { ID: string }>(existing: T[], newEntities: T[]): T[] => {
    const merged = [...existing]
    const existingIds = new Set(existing.map((e) => e.ID))

    for (const entity of newEntities) {
        if (!existingIds.has(entity.ID)) {
            merged.push(entity)
            existingIds.add(entity.ID)
        }
    }

    return merged
}

/**
 * Load fixer jobs from IndexedDB
 * @returns Array of fixer jobs, or empty array if not found
 */
export const loadFixerJobs = async (): Promise<FixerJob[]> => {
    try {
        const fixerJobs = await localforage.getItem<FixerJob[]>(FIXER_JOBS_STORAGE_KEY)
        // Process loaded fixer jobs to convert imageIds to data URLs
        if (fixerJobs && fixerJobs.length > 0) {
            return await Promise.all(fixerJobs.map((job) => processEntityForDisplay(job)))
        }
        return fixerJobs || []
    } catch (error) {
        console.error('Error loading fixer jobs from storage:', error)
        return []
    }
}

/**
 * Clear all fixer jobs from storage
 */
export const clearFixerJobs = async (): Promise<void> => {
    try {
        // Get current fixer jobs to clean up their images
        const fixerJobs = await localforage.getItem<FixerJob[]>(FIXER_JOBS_STORAGE_KEY)
        if (fixerJobs && fixerJobs.length > 0) {
            // Clean up image blobs before removing jobs
            for (const job of fixerJobs) {
                if (job.image && typeof job.image === 'string' && !job.image.startsWith('data:')) {
                    await deleteImageBlob(job.image)
                }
                // TODO: Add recursive cleanup for nested images if needed
            }
        }

        await localforage.removeItem(FIXER_JOBS_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing fixer jobs from storage:', error)
    }
}

// View Preferences Storage Functions

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
 * Save animations enabled preference
 * @param enabled Whether animations are enabled
 */
export const saveAnimationsEnabled = async (enabled: boolean): Promise<void> => {
    try {
        await localforage.setItem(ANIMATIONS_ENABLED_KEY, enabled)
    } catch (error) {
        console.error('Error saving animations enabled preference to storage:', error)
    }
}

/**
 * Load animations enabled preference
 * @returns Whether animations are enabled
 */
export const loadAnimationsEnabled = async (): Promise<boolean> => {
    try {
        const animationsEnabled = await localforage.getItem<boolean>(ANIMATIONS_ENABLED_KEY)
        return animationsEnabled ?? true // Default to true if not set
    } catch (error) {
        console.error('Error loading animations enabled preference from storage:', error)
        return true
    }
}

/**
 * Save Hugging Face API key to IndexedDB
 * @param apiKey The API key to save
 */
export const saveHuggingFaceApiKey = async (apiKey: string): Promise<void> => {
    try {
        await localforage.setItem(HUGGING_FACE_API_KEY, apiKey)
    } catch (error) {
        console.error('Error saving Hugging Face API key:', error)
    }
}

/**
 * Load Hugging Face API key from IndexedDB
 * @returns The API key if found, empty string otherwise
 */
export const loadHuggingFaceApiKey = async (): Promise<string> => {
    try {
        const apiKey = await localforage.getItem<string>(HUGGING_FACE_API_KEY)
        return apiKey || ''
    } catch (error) {
        console.error('Error loading Hugging Face API key:', error)
        return ''
    }
}

/**
 * Save OpenAI API key to IndexedDB
 * @param apiKey The API key to save
 */
export const saveOpenAIApiKey = async (apiKey: string): Promise<void> => {
    try {
        await localforage.setItem(OPENAI_API_KEY, apiKey)
    } catch (error) {
        console.error('Error saving OpenAI API key:', error)
    }
}

/**
 * Load OpenAI API key from IndexedDB
 * @returns The API key if found, empty string otherwise
 */
export const loadOpenAIApiKey = async (): Promise<string> => {
    try {
        const apiKey = await localforage.getItem<string>(OPENAI_API_KEY)
        return apiKey || ''
    } catch (error) {
        console.error('Error loading OpenAI API key:', error)
        return ''
    }
}

/**
 * Save Gemini API key to IndexedDB
 * @param apiKey The API key to save
 */
export const saveGeminiApiKey = async (apiKey: string): Promise<void> => {
    try {
        await localforage.setItem(GEMINI_API_KEY, apiKey)
    } catch (error) {
        console.error('Error saving Gemini API key:', error)
    }
}

/**
 * Load Gemini API key from IndexedDB
 * @returns The API key if found, empty string otherwise
 */
export const loadGeminiApiKey = async (): Promise<string> => {
    try {
        const apiKey = await localforage.getItem<string>(GEMINI_API_KEY)
        return apiKey || ''
    } catch (error) {
        console.error('Error loading Gemini API key:', error)
        return ''
    }
}

/**
 * Triggers a data import event to notify components of data changes
 */
export const notifyDataImported = (): void => {
    window.dispatchEvent(new Event(DATA_IMPORT_EVENT))
}

/**
 * Migrate existing base64 images to blobs
 * This function can be called to convert existing data
 */
export const migrateImagesToBlobs = async (): Promise<void> => {
    try {
        // Migrate buildings
        let buildings = await localforage.getItem<Building[]>(BUILDINGS_STORAGE_KEY)
        if (buildings && buildings.length > 0) {
            buildings = await Promise.all(buildings.map((b) => processEntityForStorage(b)))
            await localforage.setItem(BUILDINGS_STORAGE_KEY, buildings)
        }

        // Migrate gangs
        let gangs = await localforage.getItem<Gang[]>(GANGS_STORAGE_KEY)
        if (gangs && gangs.length > 0) {
            gangs = await Promise.all(gangs.map((g) => processEntityForStorage(g)))
            await localforage.setItem(GANGS_STORAGE_KEY, gangs)
        }

        // Migrate fixer jobs
        let fixerJobs = await localforage.getItem<FixerJob[]>(FIXER_JOBS_STORAGE_KEY)
        if (fixerJobs && fixerJobs.length > 0) {
            fixerJobs = await Promise.all(fixerJobs.map((j) => processEntityForStorage(j)))
            await localforage.setItem(FIXER_JOBS_STORAGE_KEY, fixerJobs)
        }
    } catch (error) {
        console.error('Error during image migration:', error)
    }
}

/**
 * Clean up orphaned images from storage
 * This function scans all entities to identify which images are in use,
 * then deletes any image blobs that aren't referenced by any entity.
 */
export const cleanupOrphanedImages = async (): Promise<void> => {
    try {
        // Step 1: Collect all entities that might contain image references
        const buildings = (await localforage.getItem<Building[]>(BUILDINGS_STORAGE_KEY)) || []
        const gangs = (await localforage.getItem<Gang[]>(GANGS_STORAGE_KEY)) || []
        const fixerJobs = (await localforage.getItem<FixerJob[]>(FIXER_JOBS_STORAGE_KEY)) || []

        // Step 2: Create a set of all image IDs in use
        const usedImageIds = new Set<string>()

        // Helper function to extract image IDs from an entity
        const collectImageIds = (entity: Record<string, unknown>) => {
            // Process an object recursively to find all image IDs
            const processObject = (obj: Record<string, unknown>) => {
                for (const [key, value] of Object.entries(obj)) {
                    // If the property is called "image" and contains an imageId (string but not a data URL)
                    if (key === 'image' && typeof value === 'string' && !value.startsWith('data:') && value !== '') {
                        usedImageIds.add(value)
                    }
                    // If it's a nested object, process it recursively
                    else if (value && typeof value === 'object' && !Array.isArray(value)) {
                        processObject(value as Record<string, unknown>)
                    }
                    // If it's an array, process each array item that is an object
                    else if (Array.isArray(value)) {
                        for (const item of value) {
                            if (item && typeof item === 'object') {
                                processObject(item as Record<string, unknown>)
                            }
                        }
                    }
                }
            }

            processObject(entity)
        }

        // Process all entities to collect used image IDs
        buildings.forEach(collectImageIds)
        gangs.forEach(collectImageIds)
        fixerJobs.forEach(collectImageIds)

        // Step 3: Find all image keys in the storage
        const allKeys: string[] = []
        await localforage.iterate((_, key) => {
            if (key.startsWith(IMAGE_STORAGE_KEY_PREFIX)) {
                allKeys.push(key)
            }
        })

        // Step 4: Delete all images that aren't in use
        for (const key of allKeys) {
            const imageId = key.replace(IMAGE_STORAGE_KEY_PREFIX, '')
            if (!usedImageIds.has(imageId)) {
                await localforage.removeItem(key)
            }
        }
    } catch (error) {
        console.error('Error during image cleanup:', error)
    }
}
