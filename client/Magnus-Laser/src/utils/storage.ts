import { Bounty, Building, Character, FixerJob, Gang, Item } from '../graphql/types'
import { db as combatDb } from '../views/CombatSim/db'
import { ModuleTypes } from './constants'
import { AppPreferences, CustomMarker, db } from './db'

// Events
export const DATA_IMPORT_EVENT = 'data-imported'
export const PREFERENCES_CHANGED_EVENT = 'preferences-changed'

// Preferences ID (we only store one preferences object)
const PREFERENCES_ID = 'app-preferences'

// Default preferences
const DEFAULT_PREFERENCES: AppPreferences = {
    viewPreferences: Object.values(ModuleTypes).reduce((acc, mod) => {
        acc[mod] = false
        return acc
    }, {} as Record<ModuleTypes, boolean>),
    readerMode: false,
    animationsEnabled: true,
    loaderEnabled: true,
    huggingFaceApiKey: '',
    openAIApiKey: '',
    geminiApiKey: '',
}

/**
 * Gangs
 */
export const loadGangs = async (): Promise<Gang[]> => {
    try {
        return await db.gangs.toArray()
    } catch (error) {
        console.warn('Error loading gangs:', error)
        return []
    }
}

export const saveGangs = async (gangs: Gang[]): Promise<void> => {
    try {
        await db.gangs.bulkPut(gangs)
    } catch (error) {
        console.warn('Error saving gangs:', error)
    }
}

export const clearGangs = async (): Promise<void> => {
    await db.gangs.clear()
}

/**
 * Buildings
 */
export const loadBuildings = async (): Promise<Building[]> => {
    try {
        return await db.buildings.toArray()
    } catch (error) {
        console.warn('Error loading buildings:', error)
        return []
    }
}

export const saveBuildings = async (buildings: Building[]): Promise<void> => {
    try {
        await db.buildings.bulkPut(buildings)
    } catch (error) {
        console.warn('Error saving buildings:', error)
    }
}

export const clearBuildings = async (): Promise<void> => {
    await db.buildings.clear()
}

/**
 * Items
 */
export const loadItems = async (): Promise<Item[]> => {
    try {
        return await db.items.toArray()
    } catch (error) {
        console.warn('Error loading items:', error)
        return []
    }
}

export const saveItems = async (items: Item[]): Promise<void> => {
    try {
        await db.items.bulkPut(items)
    } catch (error) {
        console.warn('Error saving items:', error)
    }
}

export const clearItems = async (): Promise<void> => {
    await db.items.clear()
}

/**
 * Characters
 */
export const loadCharacters = async (): Promise<Character[]> => {
    try {
        return await db.characters.toArray()
    } catch (error) {
        console.warn('Error loading characters:', error)
        return []
    }
}

export const saveCharacters = async (characters: Character[]): Promise<void> => {
    try {
        await db.characters.bulkPut(characters)
    } catch (error) {
        console.warn('Error saving characters:', error)
    }
}

export const clearCharacters = async (): Promise<void> => {
    await db.characters.clear()
}

/**
 * Bounties
 */
export const loadBounties = async (): Promise<Bounty[]> => {
    try {
        return await db.bounties.toArray()
    } catch (error) {
        console.warn('Error loading bounties:', error)
        return []
    }
}

export const saveBounties = async (bounties: Bounty[]): Promise<void> => {
    try {
        // Use transaction for atomic operation
        await db.transaction('rw', [db.bounties, db.characters], async () => {
            const characters = await db.characters.toArray()
            const newCharacters: Character[] = []

            // Extract and collect new characters
            bounties.forEach((bounty) => {
                if (typeof bounty.character === 'object' && bounty.character) {
                    const character = characters.find((c) => c.ID === bounty.character.ID)
                    if (!character) {
                        newCharacters.push(bounty.character)
                    }
                }
            })

            // Save new characters
            if (newCharacters.length > 0) {
                await db.characters.bulkPut(newCharacters)
            }

            // Save bounties
            await db.bounties.bulkPut(bounties)
        })
    } catch (error) {
        console.warn('Error saving bounties:', error)
    }
}

export const clearBounties = async (): Promise<void> => {
    await db.bounties.clear()
}

/**
 * FixerJobs
 */
export const loadFixerJobs = async (): Promise<FixerJob[]> => {
    try {
        return await db.fixerJobs.toArray()
    } catch (error) {
        console.warn('Error loading fixer jobs:', error)
        return []
    }
}

export const saveFixerJobs = async (fixerJobs: FixerJob[]): Promise<void> => {
    try {
        // Use transaction for atomic operation
        await db.transaction('rw', [db.fixerJobs, db.gangs, db.buildings, db.characters, db.items], async () => {
            const [gangs, buildings, characters, items] = await Promise.all([
                db.gangs.toArray(),
                db.buildings.toArray(),
                db.characters.toArray(),
                db.items.toArray(),
            ])

            const newGangs: Gang[] = []
            const newBuildings: Building[] = []
            const newCharacters: Character[] = []
            const newItems: Item[] = []

            // Extract nested entities from fixer jobs
            fixerJobs.forEach((job) => {
                const p = job.plot
                if (!p) return

                // Extract building
                if (p.plotBuilding?.building && typeof p.plotBuilding.building === 'object') {
                    const building = p.plotBuilding.building as Building
                    if (!buildings.find((b) => b.ID === building.ID)) {
                        newBuildings.push(building)
                    }
                }

                // Extract gang from plotSubject
                const subject = p.plotSubject
                if (subject && typeof subject === 'object' && 'gang' in subject) {
                    const gang = subject.gang
                    if (gang && typeof gang === 'object' && 'ID' in gang) {
                        if (!gangs.find((g) => g.ID === (gang as Gang).ID)) {
                            newGangs.push(gang as Gang)
                        }
                    }
                }

                // Extract character/item from plotSubject
                if (subject && typeof subject === 'object' && 'ID' in subject && !('gang' in subject)) {
                    if ('attitude' in subject) {
                        const character = subject as Character
                        if (!characters.find((c) => c.ID === character.ID)) {
                            newCharacters.push(character)
                        }
                    } else if ('condition' in subject) {
                        const item = subject as Item
                        if (!items.find((i) => i.ID === item.ID)) {
                            newItems.push(item)
                        }
                    }
                }

                // Extract from subject complication
                if (
                    subject &&
                    'complication' in subject &&
                    subject.complication &&
                    typeof subject.complication === 'object'
                ) {
                    const sComp = subject.complication
                    if (sComp.character && typeof sComp.character === 'object') {
                        const char = sComp.character as Character
                        if (!characters.find((c) => c.ID === char.ID)) {
                            newCharacters.push(char)
                        }
                    }
                    if (sComp.item && typeof sComp.item === 'object') {
                        const item = sComp.item as Item
                        if (!items.find((i) => i.ID === item.ID)) {
                            newItems.push(item)
                        }
                    }
                }

                // Extract from plotComplication
                if (p.plotComplication && typeof p.plotComplication === 'object') {
                    const comp = p.plotComplication
                    if (comp.character && typeof comp.character === 'object') {
                        const char = comp.character as Character
                        if (!characters.find((c) => c.ID === char.ID)) {
                            newCharacters.push(char)
                        }
                    }
                    if (comp.item && typeof comp.item === 'object') {
                        const item = comp.item as Item
                        if (!items.find((i) => i.ID === item.ID)) {
                            newItems.push(item)
                        }
                    }
                }

                // Extract from building complication
                if (p.plotBuilding?.complication && typeof p.plotBuilding.complication === 'object') {
                    const bComp = p.plotBuilding.complication
                    if (bComp.character && typeof bComp.character === 'object') {
                        const char = bComp.character as Character
                        if (!characters.find((c) => c.ID === char.ID)) {
                            newCharacters.push(char)
                        }
                    }
                    if (bComp.item && typeof bComp.item === 'object') {
                        const item = bComp.item as Item
                        if (!items.find((i) => i.ID === item.ID)) {
                            newItems.push(item)
                        }
                    }
                }
            })

            // Save all new entities
            if (newGangs.length > 0) await db.gangs.bulkPut(newGangs)
            if (newBuildings.length > 0) await db.buildings.bulkPut(newBuildings)
            if (newCharacters.length > 0) await db.characters.bulkPut(newCharacters)
            if (newItems.length > 0) await db.items.bulkPut(newItems)

            // Save fixer jobs
            await db.fixerJobs.bulkPut(fixerJobs)
        })
    } catch (error) {
        console.warn('Error saving fixer jobs:', error)
    }
}

export const clearFixerJobs = async (): Promise<void> => {
    await db.fixerJobs.clear()
}

/**
 * Preferences
 */
export const loadPreferences = async (): Promise<AppPreferences> => {
    try {
        const prefs = await db.preferences.get(PREFERENCES_ID)
        if (prefs) {
            return {
                viewPreferences: prefs.viewPreferences,
                readerMode: prefs.readerMode,
                animationsEnabled: prefs.animationsEnabled,
                loaderEnabled: prefs.loaderEnabled,
                huggingFaceApiKey: prefs.huggingFaceApiKey,
                openAIApiKey: prefs.openAIApiKey,
                geminiApiKey: prefs.geminiApiKey,
            }
        }
        return { ...DEFAULT_PREFERENCES }
    } catch (error) {
        console.warn('Error loading preferences:', error)
        return { ...DEFAULT_PREFERENCES }
    }
}

export const savePreferences = async (preferences: AppPreferences): Promise<void> => {
    try {
        await db.preferences.put({ ...preferences, id: PREFERENCES_ID })
        window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
    } catch (error) {
        console.warn('Error saving preferences:', error)
    }
}

/**
 * Map Markers
 */
export const loadMapMarkers = async (): Promise<CustomMarker[]> => {
    try {
        return await db.mapMarkers.toArray()
    } catch (error) {
        console.warn('Error loading map markers:', error)
        return []
    }
}

export const saveMapMarkers = async (markers: CustomMarker[]): Promise<void> => {
    try {
        await db.mapMarkers.bulkPut(markers)
    } catch (error) {
        console.warn('Error saving map markers:', error)
    }
}

export const clearMapMarkers = async (): Promise<void> => {
    await db.mapMarkers.clear()
}

/**
 * View preference helpers
 */
export const loadAllViewPreferences = async (): Promise<Record<ModuleTypes, boolean>> => {
    const { viewPreferences } = await loadPreferences()
    return viewPreferences
}

export const saveViewPreference = async (module: ModuleTypes, value: boolean): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.viewPreferences = { ...prefs.viewPreferences, [module]: value }
    await savePreferences(prefs)
}

/**
 * Individual preference getters/setters
 */
export const loadReaderMode = async (): Promise<boolean> => (await loadPreferences()).readerMode

export const saveReaderMode = async (on: boolean): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.readerMode = on
    await savePreferences(prefs)
}

export const loadAnimationsEnabled = async (): Promise<boolean> => (await loadPreferences()).animationsEnabled

export const saveAnimationsEnabled = async (on: boolean): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.animationsEnabled = on
    await savePreferences(prefs)
}

export const loadLoaderEnabled = async (): Promise<boolean> => (await loadPreferences()).loaderEnabled

export const saveLoaderEnabled = async (on: boolean): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.loaderEnabled = on
    await savePreferences(prefs)
}

/**
 * API key getters/setters
 */
export const loadOpenAIApiKey = async (): Promise<string> => (await loadPreferences()).openAIApiKey

export const saveOpenAIApiKey = async (key: string): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.openAIApiKey = key
    await savePreferences(prefs)
}

export const loadHuggingFaceApiKey = async (): Promise<string> => (await loadPreferences()).huggingFaceApiKey

export const saveHuggingFaceApiKey = async (key: string): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.huggingFaceApiKey = key
    await savePreferences(prefs)
}

export const loadGeminiApiKey = async (): Promise<string> => (await loadPreferences()).geminiApiKey

export const saveGeminiApiKey = async (key: string): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.geminiApiKey = key
    await savePreferences(prefs)
}

/**
 * Helper function to convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            resolve(base64String)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * Helper function to convert base64 string to Blob
 */
const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64)
    return await response.blob()
}

/**
 * Combat Simulator Data
 * Note: Combat sim uses a separate database
 */
export const loadCombatSimData = async () => {
    try {
        // Use static import for combat sim database

        const [boardMaps, tokens, maps, walls, images] = await Promise.all([
            combatDb.boardMaps.toArray(),
            combatDb.tokens.toArray(),
            combatDb.maps.toArray(),
            combatDb.walls.toArray(),
            combatDb.images.toArray(),
        ])

        // Convert blobs to base64 for export
        const mapsWithBase64 = await Promise.all(
            maps.map(async (map) => ({
                ...map,
                blobData: await blobToBase64(map.blob),
                blob: undefined, // Remove the blob property
            }))
        )

        const imagesWithBase64 = await Promise.all(
            images.map(async (image) => ({
                ...image,
                blobData: await blobToBase64(image.blob),
                blob: undefined, // Remove the blob property
            }))
        )

        return {
            boardMaps,
            tokens,
            maps: mapsWithBase64,
            walls,
            images: imagesWithBase64,
        }
    } catch (error) {
        console.warn('Error loading combat sim data:', error)
        return { boardMaps: [], tokens: [], maps: [], walls: [], images: [] }
    }
}

export const saveCombatSimData = async (data: {
    boardMaps?: Array<Record<string, unknown>>
    tokens?: Array<Record<string, unknown>>
    maps?: Array<Record<string, unknown>>
    walls?: Array<Record<string, unknown>>
    images?: Array<Record<string, unknown>>
}): Promise<void> => {
    try {
        // Use static import for combat sim database

        if (data.boardMaps && data.boardMaps.length > 0) {
            await combatDb.boardMaps.bulkPut(data.boardMaps as never)
        }
        if (data.tokens && data.tokens.length > 0) {
            await combatDb.tokens.bulkPut(data.tokens as never)
        }
        if (data.maps && data.maps.length > 0) {
            // Convert base64 back to blobs for maps
            const mapsWithBlobs = await Promise.all(
                data.maps.map(async (map: Record<string, unknown>) => {
                    if (map.blobData && !map.blob) {
                        const blob = await base64ToBlob(map.blobData as string)
                        return {
                            ...map,
                            blob,
                            blobData: undefined, // Remove the base64 data
                        }
                    }
                    return map
                })
            )
            await combatDb.maps.bulkPut(mapsWithBlobs as never)
        }
        if (data.walls && data.walls.length > 0) {
            await combatDb.walls.bulkPut(data.walls as never)
        }
        if (data.images && data.images.length > 0) {
            // Convert base64 back to blobs for images
            const imagesWithBlobs = await Promise.all(
                data.images.map(async (image: Record<string, unknown>) => {
                    if (image.blobData && !image.blob) {
                        const blob = await base64ToBlob(image.blobData as string)
                        return {
                            ...image,
                            blob,
                            blobData: undefined, // Remove the base64 data
                        }
                    }
                    return image
                })
            )
            await combatDb.images.bulkPut(imagesWithBlobs as never)
        }
    } catch (error) {
        console.warn('Error saving combat sim data:', error)
    }
}

export const clearCombatSimData = async (): Promise<void> => {
    try {
        // Use static import for combat sim database
        await Promise.all([
            combatDb.boardMaps.clear(),
            combatDb.tokens.clear(),
            combatDb.maps.clear(),
            combatDb.walls.clear(),
            combatDb.images.clear(),
            combatDb.blasts.clear(),
        ])
    } catch (error) {
        console.warn('Error clearing combat sim data:', error)
    }
}

/**
 * Event dispatchers
 */
export const notifyDataImported = (): void => {
    window.dispatchEvent(new Event(DATA_IMPORT_EVENT))
}

export const notifyPreferencesChanged = (): void => {
    window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
}

// Export types for backward compatibility
export type { AppPreferences, CustomMarker }
