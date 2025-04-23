import localforage from 'localforage'
import { Building, Character, FixerJob, Gang, Item } from '../graphql/types'
import { ModuleTypes } from './constants'

localforage.config({
    name: 'magnus-laser',
    version: 1.0,
    storeName: 'magnus-laser', // Should be alphanumeric, with underscores.
    description: 'Magnus Laser data',
})

// Preferences type definition
export type AppPreferences = {
    viewPreferences: Record<ModuleTypes, boolean>
    readerMode: boolean
    animationsEnabled: boolean
    loaderEnabled: boolean
    huggingFaceApiKey: string
    openAIApiKey: string
    geminiApiKey: string
}

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
 * Storage keys
 */
export const GANGS_STORAGE_KEY = 'gangs'
export const BUILDINGS_STORAGE_KEY = 'buildings'
export const ITEMS_STORAGE_KEY = 'items'
export const CHARACTERS_STORAGE_KEY = 'characters'
export const FIXER_JOBS_STORAGE_KEY = 'fixer-jobs'
export const PREFERENCES_STORAGE_KEY = 'preferences'

// Events
export const DATA_IMPORT_EVENT = 'data-imported'
export const PREFERENCES_CHANGED_EVENT = 'preferences-changed'

// In-memory cache for loaded collections
const cache = new Map<string, unknown[]>()

/**
 * Generic loader: caches in-memory, handles errors
 */
async function loadEntities<T>(key: string): Promise<T[]> {
    if (cache.has(key)) return cache.get(key)! as T[]
    try {
        const entities = await localforage.getItem<T[]>(key)
        const result = entities ?? []
        cache.set(key, result)
        return result
    } catch (error) {
        console.warn(`Error loading ${key}:`, error)
        return []
    }
}

/**
 * Generic saver: runs optional cleanup, updates cache
 */
async function saveEntities<T>(key: string, newEntities: T[]): Promise<void> {
    try {
        await localforage.setItem(key, newEntities)
        cache.set(key, newEntities)
    } catch (error) {
        console.warn(`Error saving ${key}:`, error)
    }
}

/**
 * Merge two lists of entities (by .ID), preferring items from `incoming`
 */
const mergeEntities = <T extends { ID: string }>(existing: T[], incoming: T[]): T[] => {
    const map = new Map<string, T>()
    // First, seed with existing
    for (const e of existing) map.set(e.ID, e)
    // Then overwrite/add with incoming
    for (const entity of incoming) map.set(entity.ID, entity)
    return Array.from(map.values())
}

/**
 * Gangs
 */
export const loadGangs = (): Promise<Gang[]> => loadEntities<Gang>(GANGS_STORAGE_KEY)

export const saveGangs = (gangs: Gang[]): Promise<void> => saveEntities<Gang>(GANGS_STORAGE_KEY, gangs)

/**
 * Buildings
 */
export const loadBuildings = (): Promise<Building[]> => loadEntities<Building>(BUILDINGS_STORAGE_KEY)

export const saveBuildings = (buildings: Building[]): Promise<void> =>
    saveEntities<Building>(BUILDINGS_STORAGE_KEY, buildings)

/**
 * Items
 */
export const loadItems = (): Promise<Item[]> => loadEntities<Item>(ITEMS_STORAGE_KEY)

export const saveItems = (items: Item[]): Promise<void> => saveEntities<Item>(ITEMS_STORAGE_KEY, items)

/**
 * Characters
 */
export const loadCharacters = (): Promise<Character[]> => loadEntities<Character>(CHARACTERS_STORAGE_KEY)

export const saveCharacters = (characters: Character[]): Promise<void> =>
    saveEntities<Character>(CHARACTERS_STORAGE_KEY, characters)

/**
 * FixerJobs
 */

// ──────────────────────────────────────────────────────
// Helper: pull out nested Gang/Building objects and persist
// ──────────────────────────────────────────────────────
const extractAndSaveReferences = async (fixerJobs: FixerJob[]): Promise<void> => {
    const buildings: Building[] = []
    const gangs: Gang[] = []
    const characters: Character[] = []
    const items: Item[] = []

    fixerJobs.forEach((job) => {
        const p = job.plot
        if (!p) return

        // If plotBuilding.building is an object, hoist it out
        if (p.plotBuilding?.building && typeof p.plotBuilding.building === 'object') {
            buildings.push(p.plotBuilding.building as Building)
        }
        const subject = p.plotSubject
        if (subject && typeof subject === 'object') {
            if ('gang' in subject) {
                const maybeGang = subject['gang']
                if (typeof maybeGang === 'object' && maybeGang !== null) {
                    gangs.push(maybeGang as Gang)
                }
            }
            if ('ID' in subject && !('gang' in subject)) {
                if ('attitude' in subject) {
                    characters.push(subject as Character)
                } else if ('condition' in subject) {
                    items.push(subject as Item)
                }
            }
            if ('complication' in subject && subject.complication && typeof subject.complication === 'object') {
                const sComp = subject.complication
                if (sComp.character && typeof sComp.character === 'object') {
                    characters.push(sComp.character as Character)
                }
                if (sComp.item && typeof sComp.item === 'object') {
                    items.push(sComp.item as Item)
                }
            }
        }
        // Hoist nested Character/Item from plotComplication
        if (p.plotComplication && typeof p.plotComplication === 'object') {
            const comp = p.plotComplication
            if (comp.character && typeof comp.character === 'object') {
                characters.push(comp.character as Character)
            }
            if (comp.item && typeof comp.item === 'object') {
                items.push(comp.item as Item)
            }
        }
        // Hoist nested Character/Item from building complication
        if (p.plotBuilding?.complication && typeof p.plotBuilding.complication === 'object') {
            const bComp = p.plotBuilding.complication
            if (bComp.character && typeof bComp.character === 'object') {
                characters.push(bComp.character as Character)
            }
            if (bComp.item && typeof bComp.item === 'object') {
                items.push(bComp.item as Item)
            }
        }
    })

    if (buildings.length) {
        const existing = await loadBuildings()
        const merged = mergeEntities(existing, buildings)
        await saveBuildings(merged)
    }
    if (gangs.length) {
        const existing = await loadGangs()
        const merged = mergeEntities(existing, gangs)
        await saveGangs(merged)
    }
    if (characters.length) {
        const existing = await loadCharacters()
        const merged = mergeEntities(existing, characters)
        await saveCharacters(merged)
    }
    if (items.length) {
        const existing = await loadItems()
        const merged = mergeEntities(existing, items)
        await saveItems(merged)
    }
}

export const loadFixerJobs = (): Promise<FixerJob[]> => loadEntities<FixerJob>(FIXER_JOBS_STORAGE_KEY)

export const saveFixerJobs = async (fixerJobs: FixerJob[]): Promise<void> => {
    await extractAndSaveReferences(fixerJobs)
    const toStore: FixerJob[] = []
    for (const job of fixerJobs) {
        toStore.push(await processEntityForStorage(job))
    }
    await localforage.setItem(FIXER_JOBS_STORAGE_KEY, toStore)
    cache.set(FIXER_JOBS_STORAGE_KEY, toStore)
}

/**
 * Preferences
 */
export const loadPreferences = async (): Promise<AppPreferences> => {
    try {
        const prefs = await localforage.getItem<AppPreferences>(PREFERENCES_STORAGE_KEY)
        return prefs ?? DEFAULT_PREFERENCES
    } catch (error) {
        console.warn('Error loading preferences:', error)
        return { ...DEFAULT_PREFERENCES }
    }
}

export const savePreferences = async (preferences: AppPreferences): Promise<void> => {
    try {
        await localforage.setItem(PREFERENCES_STORAGE_KEY, preferences)
        window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
    } catch (error) {
        console.warn('Error saving preferences:', error)
    }
}

/** ===== Reference resolution for entity relationships ===== **/

/**
 * Process loaded entities: resolve nested references for gangs, buildings,
 * characters, and items. Maintains the base64 image data as-is.
 */
export const processEntityForDisplay = async <T extends Record<string, unknown>>(
    entity: T,
    preloadedGangs?: Gang[] | null,
    preloadedBuildings?: Building[] | null,
    preloadedCharacters?: Character[] | null,
    preloadedItems?: Item[] | null
): Promise<T> => {
    if (!entity) return entity
    const processedEntity = { ...entity }
    let gangs: Gang[] | null = preloadedGangs || null
    let buildings: Building[] | null = preloadedBuildings || null
    let characters: Character[] | null = preloadedCharacters || null
    let items: Item[] | null = preloadedItems || null

    // Helper to load gangs/buildings once
    const ensureGangs = async () => {
        if (!gangs) gangs = await loadGangs()
    }
    const ensureBuildings = async () => {
        if (!buildings) buildings = await loadBuildings()
    }
    const ensureCharacters = async () => {
        if (!characters) characters = await loadCharacters()
    }
    const ensureItems = async () => {
        if (!items) items = await loadItems()
    }
    const findCharacterById = (id: string) => characters?.find((c) => c.ID === id) ?? null
    const findItemById = (id: string) => items?.find((i) => i.ID === id) ?? null
    const findGangById = (id: string) => gangs?.find((g) => g.ID === id) ?? null
    const findBuildingById = (id: string) => buildings?.find((b) => b.ID === id) ?? null

    // Recursive walker
    const processObject = async (obj: Record<string, unknown>, path = ''): Promise<void> => {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key

            // plotSubject.gang resolution
            if (currentPath.endsWith('plotSubject.gang')) {
                if (typeof value === 'string') {
                    await ensureGangs()
                    const gang = findGangById(value)
                    if (gang) obj[key] = await processEntityForDisplay(gang, gangs, buildings, characters, items)
                }
            }
            // plotBuilding.building resolution
            else if (currentPath.endsWith('plotBuilding.building')) {
                if (typeof value === 'string') {
                    await ensureBuildings()
                    const bld = findBuildingById(value)
                    if (bld) obj[key] = await processEntityForDisplay(bld, gangs, buildings, characters, items)
                }
            }
            // plotSubject resolution for Character/Item
            else if (currentPath.endsWith('plotSubject') && typeof value === 'string') {
                await ensureCharacters()
                await ensureItems()
                const char = findCharacterById(value)
                if (char) {
                    obj[key] = await processEntityForDisplay(char, gangs, buildings, characters, items)
                    continue
                }
                const itemRef = findItemById(value)
                if (itemRef) {
                    obj[key] = await processEntityForDisplay(itemRef, gangs, buildings, characters, items)
                    continue
                }
            }
            // plotComplication character resolution
            else if (currentPath.endsWith('plotComplication.character') && typeof value === 'string') {
                await ensureCharacters()
                const char = findCharacterById(value)
                if (char) {
                    obj[key] = await processEntityForDisplay(char, gangs, buildings, characters, items)
                    continue
                }
            }
            // plotComplication item resolution
            else if (currentPath.endsWith('plotComplication.item') && typeof value === 'string') {
                await ensureItems()
                const itemRef = findItemById(value)
                if (itemRef) {
                    obj[key] = await processEntityForDisplay(itemRef, gangs, buildings, characters, items)
                    continue
                }
            }
            // plotSubject complication character resolution
            else if (currentPath.endsWith('plotSubject.complication.character') && typeof value === 'string') {
                await ensureCharacters()
                const char = findCharacterById(value)
                if (char) {
                    obj[key] = await processEntityForDisplay(char, gangs, buildings, characters, items)
                    continue
                }
            }
            // plotSubject complication item resolution
            else if (currentPath.endsWith('plotSubject.complication.item') && typeof value === 'string') {
                await ensureItems()
                const itemRef = findItemById(value)
                if (itemRef) {
                    obj[key] = await processEntityForDisplay(itemRef, gangs, buildings, characters, items)
                    continue
                }
            }
            // building complication character resolution
            else if (currentPath.endsWith('plotBuilding.complication.character') && typeof value === 'string') {
                await ensureCharacters()
                const char = findCharacterById(value)
                if (char) {
                    obj[key] = await processEntityForDisplay(char, gangs, buildings, characters, items)
                    continue
                }
            }
            // building complication item resolution
            else if (currentPath.endsWith('plotBuilding.complication.item') && typeof value === 'string') {
                await ensureItems()
                const itemRef = findItemById(value)
                if (itemRef) {
                    obj[key] = await processEntityForDisplay(itemRef, gangs, buildings, characters, items)
                    continue
                }
            }
            // deep dive for nested objects/arrays
            else if (value && typeof value === 'object') {
                await processObject(value as Record<string, unknown>, currentPath)
            }
        }
    }

    await processObject(processedEntity)
    return processedEntity
}

/**
 * Process entities for storage: converts nested entity objects to ID references.
 * Base64 image data is kept as-is without any transformation.
 */
export const processEntityForStorage = async <T extends Record<string, unknown>>(entity: T): Promise<T> => {
    const processedEntity = { ...entity }
    const processObject = async (obj: Record<string, unknown>, path = ''): Promise<void> => {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key

            // strip leftover nested plot refs for gang/building
            if (
                currentPath === 'plot.plotSubject.gang' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            if (
                currentPath === 'plot.plotBuilding.building' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            // strip nested Character/Item from plotSubject
            if (currentPath === 'plot.plotSubject' && value != null && typeof value === 'object' && 'ID' in value) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            // strip nested Character/Item from plotComplication
            if (
                currentPath === 'plot.plotComplication.character' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            if (
                currentPath === 'plot.plotComplication.item' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            // strip nested Character/Item from building complication
            if (
                currentPath === 'plot.plotBuilding.complication.character' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            if (
                currentPath === 'plot.plotBuilding.complication.item' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            // strip nested Character/Item from PlotGang complication
            if (
                currentPath === 'plot.plotSubject.complication.character' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            if (
                currentPath === 'plot.plotSubject.complication.item' &&
                value != null &&
                typeof value === 'object' &&
                'ID' in value
            ) {
                obj[key] = (value as { ID: string }).ID
                continue
            }

            // nested objects/arrays
            if (value && typeof value === 'object') {
                await processObject(value as Record<string, unknown>, currentPath)
            }
        }
    }
    await processObject(processedEntity)
    return processedEntity
}

// 2) Dispatch events so components can listen
export const notifyDataImported = (): void => {
    window.dispatchEvent(new Event(DATA_IMPORT_EVENT))
}

export const notifyPreferencesChanged = (): void => {
    window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
}

// 3) "Clear" helpers that wipe storage + cache
export const clearGangs = async (): Promise<void> => {
    cache.delete(GANGS_STORAGE_KEY)
    await localforage.removeItem(GANGS_STORAGE_KEY)
}

export const clearBuildings = async (): Promise<void> => {
    cache.delete(BUILDINGS_STORAGE_KEY)
    await localforage.removeItem(BUILDINGS_STORAGE_KEY)
}

export const clearFixerJobs = async (): Promise<void> => {
    cache.delete(FIXER_JOBS_STORAGE_KEY)
    await localforage.removeItem(FIXER_JOBS_STORAGE_KEY)
}

export const clearItems = async (): Promise<void> => {
    cache.delete(ITEMS_STORAGE_KEY)
    await localforage.removeItem(ITEMS_STORAGE_KEY)
}

export const clearCharacters = async (): Promise<void> => {
    cache.delete(CHARACTERS_STORAGE_KEY)
    await localforage.removeItem(CHARACTERS_STORAGE_KEY)
}

// 4) View‑preference helpers
export const loadAllViewPreferences = async (): Promise<Record<ModuleTypes, boolean>> => {
    const { viewPreferences } = await loadPreferences()
    return viewPreferences
}

export const saveViewPreference = async (module: ModuleTypes, value: boolean): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.viewPreferences = { ...prefs.viewPreferences, [module]: value }
    await savePreferences(prefs)
}

// 5) Individual preference getters/setters
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

// 6) API‑key getters/setters
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
