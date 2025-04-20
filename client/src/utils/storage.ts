import localforage from 'localforage'
import { Building, FixerJob, Gang } from '../graphql/types'
import { ModuleTypes } from './constants'

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
        acc[mod] = true
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
export const GANGS_STORAGE_KEY = 'magnus-laser-gangs'
export const BUILDINGS_STORAGE_KEY = 'magnus-laser-buildings'
export const FIXER_JOBS_STORAGE_KEY = 'magnus-laser-fixer-jobs'
export const PREFERENCES_STORAGE_KEY = 'magnus-laser-preferences'
export const SCHEMA_VERSION_KEY = 'magnus-laser-schema-version'
const CURRENT_SCHEMA_VERSION: number = 1

// Events
export const DATA_IMPORT_EVENT = 'magnus-laser-data-imported'
export const PREFERENCES_CHANGED_EVENT = 'magnus-laser-preferences-changed'

// In-memory cache for loaded collections
const cache = new Map<string, unknown[]>()

/**
 * Run migrations if needed
 */
async function runMigrations(): Promise<void> {
    const ver = (await localforage.getItem<number>(SCHEMA_VERSION_KEY)) || 0
    if (ver < CURRENT_SCHEMA_VERSION) {
        // future migrations go here (e.g., cleanup old keys)
        await localforage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION)
    }
}
const migrationsPromise = runMigrations().catch((err) => console.error('Migration error:', err))

/**
 * Generic loader: caches in-memory, handles errors
 */
async function loadEntities<T>(key: string, defaultValue: T[] = []): Promise<T[]> {
    await migrationsPromise
    if (cache.has(key)) return cache.get(key)! as T[]
    try {
        const items = await localforage.getItem<T[]>(key)
        const result = items ?? defaultValue
        cache.set(key, result)
        return result
    } catch (error) {
        console.error(`Error loading ${key}:`, error)
        return defaultValue
    }
}

/**
 * Generic saver: runs optional cleanup, updates cache
 */
async function saveEntities<T>(
    key: string,
    newItems: T[],
    cleanupFn?: (oldItems: T[], newItems: T[]) => Promise<void>
): Promise<void> {
    await migrationsPromise
    const oldItems = await loadEntities<T>(key, [])
    try {
        if (cleanupFn) await cleanupFn(oldItems, newItems)
        await localforage.setItem(key, newItems)
        cache.set(key, newItems)
    } catch (error) {
        console.error(`Error saving ${key}:`, error)
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
    for (const item of incoming) map.set(item.ID, item)
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
 * FixerJobs
 */

// ──────────────────────────────────────────────────────
// Helper: pull out nested Gang/Building objects and persist
// ──────────────────────────────────────────────────────
const extractAndSaveReferences = async (fixerJobs: FixerJob[]): Promise<void> => {
    const buildings: Building[] = []
    const gangs: Gang[] = []

    fixerJobs.forEach((job) => {
        const p = job.plot
        if (!p) return

        // If plotBuilding.building is an object, hoist it out
        if (p.plotBuilding?.building && typeof p.plotBuilding.building === 'object') {
            buildings.push(p.plotBuilding.building as Building)
        }
        const subject = p.plotSubject as Record<string, unknown> | undefined
        if (subject && 'gang' in subject) {
            const maybeGang = subject['gang']
            // now TS knows "gang" exists, so we can check its form
            if (typeof maybeGang === 'object' && maybeGang !== null) {
                gangs.push(maybeGang as Gang)
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
        console.error('Error loading preferences:', error)
        return { ...DEFAULT_PREFERENCES }
    }
}

export const savePreferences = async (preferences: AppPreferences): Promise<void> => {
    try {
        await localforage.setItem(PREFERENCES_STORAGE_KEY, preferences)
        window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
    } catch (error) {
        console.error('Error saving preferences:', error)
    }
}

/** ===== Image handling and cleanup (unchanged) ===== **/

/**
 * Process loaded entities: replace stored image IDs with data URLs,
 * resolve nested references for gangs and buildings.
 */
export const processEntityForDisplay = async <T extends Record<string, unknown>>(
    entity: T,
    preloadedGangs?: Gang[] | null,
    preloadedBuildings?: Building[] | null
): Promise<T> => {
    if (!entity) return entity
    const processedEntity = { ...entity }
    let gangs: Gang[] | null = preloadedGangs || null
    let buildings: Building[] | null = preloadedBuildings || null

    // Helper to load gangs/buildings once
    const ensureGangs = async () => {
        if (!gangs) gangs = await loadGangs()
    }
    const ensureBuildings = async () => {
        if (!buildings) buildings = await loadBuildings()
    }
    const findGangById = (id: string) => gangs?.find((g) => g.ID === id) ?? null
    const findBuildingById = (id: string) => buildings?.find((b) => b.ID === id) ?? null

    // Recursive walker
    const processObject = async (obj: Record<string, unknown>, path = ''): Promise<void> => {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key
            // Image field: load from IndexedDB, convert Blob→URL or use data‑URL
            if (key === 'image' && typeof value === 'string') {
                // inline data URL; leave as-is
                obj[key] = value
            }
            // plotSubject.gang resolution
            else if (currentPath.endsWith('plotSubject.gang')) {
                if (typeof value === 'string') {
                    await ensureGangs()
                    const gang = findGangById(value)
                    if (gang) obj[key] = await processEntityForDisplay(gang, gangs, buildings)
                }
            }
            // plotBuilding.building resolution
            else if (currentPath.endsWith('plotBuilding.building')) {
                if (typeof value === 'string') {
                    await ensureBuildings()
                    const bld = findBuildingById(value)
                    if (bld) obj[key] = await processEntityForDisplay(bld, gangs, buildings)
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
 * Process entities for storage: replace data URLs with image IDs,
 * generate new IDs for new images.
 */
export const processEntityForStorage = async <T extends Record<string, unknown>>(entity: T): Promise<T> => {
    const processedEntity = { ...entity }
    const processObject = async (obj: Record<string, unknown>, path = ''): Promise<void> => {
        for (const [key, value] of Object.entries(obj)) {
            const p = path ? `${path}.${key}` : key

            // strip leftover nested plot refs
            if (p === 'plot.plotSubject.gang' && value != null && typeof value === 'object' && 'ID' in value) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            if (p === 'plot.plotBuilding.building' && value != null && typeof value === 'object' && 'ID' in value) {
                obj[key] = (value as { ID: string }).ID
                continue
            }
            const currentPath = path ? `${path}.${key}` : key
            // Skip external image storage for fixer job images; keep inline base64
            if (key === 'image') {
                // leave the inline data URL as-is
            }
            // nested objects/arrays
            else if (value && typeof value === 'object') {
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

// 7) Blob ⇄ DataURL converters
export const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl)
    return res.blob()
}
