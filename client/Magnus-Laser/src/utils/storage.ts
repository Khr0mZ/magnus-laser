import {
    Bounty,
    BountyRep,
    BountyStatus,
    Building,
    Character,
    CrimeType,
    FixerJob,
    Gang,
    Item,
    JobDifficulty,
    PlotBuildingComplicationType,
    PlotComplicationType,
    PlotVerb,
} from '../graphql/types'
import { ModuleTypes } from './constants'
import {
    AppPreferences,
    CustomMarker,
    DbBounty,
    DbBuildingComplication,
    DbFixerJob,
    DbPlot,
    DbPlotBuilding,
    DbPlotComplication,
    db,
} from './db'

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
    language: 'en',
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
        // Load normalized bounties and join with characters
        const normalizedBounties = await db.bounties.toArray()
        const characterIds = normalizedBounties.map((b) => b.characterId).filter(Boolean)
        const characters = await db.characters.where('ID').anyOf(characterIds).toArray()
        const characterMap = new Map(characters.map((c) => [c.ID, c]))

        // Reconstruct full Bounty objects
        return normalizedBounties.map((bounty) => ({
            __typename: 'Bounty' as const,
            ID: bounty.ID,
            character: characterMap.get(bounty.characterId)!,
            crimes: bounty.crimes,
            rep: bounty.rep as BountyRep,
            speciality: bounty.speciality as CrimeType,
            status: bounty.status as BountyStatus,
        }))
    } catch (error) {
        console.warn('Error loading bounties:', error)
        return []
    }
}

export const saveBounties = async (bounties: Bounty[]): Promise<void> => {
    try {
        // Convert GraphQL bounties to normalized database format
        const normalizedBounties: DbBounty[] = bounties.map((bounty) => ({
            ID: bounty.ID,
            characterId: typeof bounty.character === 'object' ? bounty.character.ID : bounty.character,
            crimes: bounty.crimes,
            rep: bounty.rep,
            speciality: bounty.speciality,
            status: bounty.status,
        }))

        // Extract characters from nested structure if they exist
        const charactersToSave: Character[] = []
        bounties.forEach((bounty) => {
            if (typeof bounty.character === 'object' && bounty.character) {
                charactersToSave.push(bounty.character)
            }
        })

        // Save in transaction
        await db.transaction('rw', [db.bounties, db.characters], async () => {
            if (charactersToSave.length > 0) {
                await db.characters.bulkPut(charactersToSave)
            }
            await db.bounties.bulkPut(normalizedBounties)
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
        // Ensure database is open
        await db.open()

        // Check if we have the new normalized schema by checking for required tables
        const tableNames = db.tables.map((t) => t.name)
        const hasNormalizedSchema = tableNames.includes('plots') && tableNames.includes('plotBuildings')

        if (!hasNormalizedSchema) {
            console.warn('Database does not have normalized schema yet, returning empty array')
            return []
        }

        // Load all normalized data
        const normalizedJobs = await db.fixerJobs.toArray()
        const plotIds = normalizedJobs.map((j) => j.plotId).filter(Boolean)

        // If no jobs or no plot IDs, return empty array
        if (plotIds.length === 0) {
            return []
        }

        // Load all related data in parallel with error handling
        const [
            plots,
            plotBuildings,
            plotComplications,
            buildingComplications,
            allBuildings,
            allCharacters,
            allItems,
            allGangs,
        ] = await Promise.all([
            plotIds.length > 0
                ? db.plots
                      .where('ID')
                      .anyOf(plotIds)
                      .toArray()
                      .catch(() => [])
                : Promise.resolve([]),
            db.plotBuildings.toArray().catch(() => []),
            db.plotComplications.toArray().catch(() => []),
            db.buildingComplications.toArray().catch(() => []),
            db.buildings.toArray().catch(() => []),
            db.characters.toArray().catch(() => []),
            db.items.toArray().catch(() => []),
            db.gangs.toArray().catch(() => []),
        ])

        // Create lookup maps
        const plotMap = new Map(plots.map((p) => [p.ID, p]))
        const plotBuildingMap = new Map(plotBuildings.map((pb) => [pb.ID, pb]))
        const plotComplicationMap = new Map(plotComplications.map((pc) => [pc.ID, pc]))
        const buildingComplicationMap = new Map(buildingComplications.map((bc) => [bc.ID, bc]))
        const buildingMap = new Map(allBuildings.map((b) => [b.ID, b]))
        const characterMap = new Map(allCharacters.map((c) => [c.ID, c]))
        const itemMap = new Map(allItems.map((i) => [i.ID, i]))
        const gangMap = new Map(allGangs.map((g) => [g.ID, g]))

        // Reconstruct full FixerJob objects
        return normalizedJobs
            .map((job) => {
                const plot = plotMap.get(job.plotId)
                if (!plot) return null

                // Reconstruct plot building
                let plotBuilding = undefined
                if (plot.plotBuildingId) {
                    const pb = plotBuildingMap.get(plot.plotBuildingId)
                    if (pb) {
                        // Reconstruct building complication
                        let complication = undefined
                        if (pb.complicationId) {
                            const bc = buildingComplicationMap.get(pb.complicationId)
                            if (bc) {
                                complication = {
                                    __typename: 'BuildingComplication' as const,
                                    character: bc.characterId ? characterMap.get(bc.characterId) : undefined,
                                    item: bc.itemId ? itemMap.get(bc.itemId) : undefined,
                                    type: bc.type as PlotBuildingComplicationType,
                                }
                            }
                        }

                        plotBuilding = {
                            __typename: 'PlotBuilding' as const,
                            building: buildingMap.get(pb.buildingId)!,
                            complication,
                        }
                    }
                }

                // Reconstruct plot subject
                let plotSubject = undefined
                if (plot.plotSubjectId) {
                    // Could be Character, Item, or Gang - check which table has it
                    plotSubject =
                        characterMap.get(plot.plotSubjectId) ||
                        itemMap.get(plot.plotSubjectId) ||
                        gangMap.get(plot.plotSubjectId)
                }

                // Reconstruct plot complication
                let plotComplication = undefined
                if (plot.plotComplicationId) {
                    const pc = plotComplicationMap.get(plot.plotComplicationId)
                    if (pc) {
                        plotComplication = {
                            __typename: 'PlotComplication' as const,
                            character: pc.characterId ? characterMap.get(pc.characterId) : undefined,
                            item: pc.itemId ? itemMap.get(pc.itemId) : undefined,
                            type: pc.type as PlotComplicationType,
                        }
                    }
                }

                const reconstructedPlot = {
                    __typename: 'Plot' as const,
                    plotBuilding,
                    plotSubject,
                    plotComplication,
                    verb: plot.verb as unknown as PlotVerb,
                }

                return {
                    __typename: 'FixerJob' as const,
                    ID: job.ID,
                    description: job.description,
                    difficulty: job.difficulty as JobDifficulty,
                    image: job.image,
                    name: job.name,
                    plot: reconstructedPlot,
                }
            })
            .filter(Boolean) as FixerJob[]
    } catch (error) {
        console.warn('Error loading fixer jobs:', error)
        return []
    }
}

export const saveFixerJobs = async (fixerJobs: FixerJob[]): Promise<void> => {
    try {
        const normalizedJobs: DbFixerJob[] = []
        const plots: DbPlot[] = []
        const plotBuildings: DbPlotBuilding[] = []
        const plotComplications: DbPlotComplication[] = []
        const buildingComplications: DbBuildingComplication[] = []

        // Extract all entities that need to be saved
        const entitiesToSave = {
            buildings: [] as Building[],
            characters: [] as Character[],
            items: [] as Item[],
            gangs: [] as Gang[],
        }

        fixerJobs.forEach((job) => {
            const plotId = `plot_${job.ID}`
            const plot = job.plot
            if (!plot) return

            // Extract plot building
            let plotBuildingId: string | undefined
            if (plot.plotBuilding) {
                plotBuildingId = `pb_${job.ID}`

                // Extract building
                if (typeof plot.plotBuilding.building === 'object') {
                    entitiesToSave.buildings.push(plot.plotBuilding.building)
                }

                // Extract building complication
                if (plot.plotBuilding.complication) {
                    const compId = `bc_${job.ID}`
                    plotBuildings.push({
                        ID: plotBuildingId,
                        buildingId:
                            typeof plot.plotBuilding.building === 'object'
                                ? plot.plotBuilding.building.ID
                                : plot.plotBuilding.building,
                        complicationId: compId,
                    })

                    buildingComplications.push({
                        ID: compId,
                        characterId:
                            typeof plot.plotBuilding.complication.character === 'object'
                                ? plot.plotBuilding.complication.character?.ID
                                : plot.plotBuilding.complication.character,
                        itemId:
                            typeof plot.plotBuilding.complication.item === 'object'
                                ? plot.plotBuilding.complication.item?.ID
                                : plot.plotBuilding.complication.item,
                        type: plot.plotBuilding.complication.type,
                    })

                    // Extract entities from complication
                    if (
                        typeof plot.plotBuilding.complication.character === 'object' &&
                        plot.plotBuilding.complication.character
                    ) {
                        entitiesToSave.characters.push(plot.plotBuilding.complication.character)
                    }
                    if (
                        typeof plot.plotBuilding.complication.item === 'object' &&
                        plot.plotBuilding.complication.item
                    ) {
                        entitiesToSave.items.push(plot.plotBuilding.complication.item)
                    }
                } else {
                    plotBuildings.push({
                        ID: plotBuildingId,
                        buildingId:
                            typeof plot.plotBuilding.building === 'object'
                                ? plot.plotBuilding.building.ID
                                : plot.plotBuilding.building,
                        complicationId: undefined,
                    })
                }
            }

            // Extract plot subject
            let plotSubjectId: string | undefined
            if (plot.plotSubject && typeof plot.plotSubject === 'object') {
                plotSubjectId = (plot.plotSubject as Character | Item | Gang).ID

                // Determine entity type and add to appropriate array
                if ('attitude' in plot.plotSubject) {
                    entitiesToSave.characters.push(plot.plotSubject as Character)
                } else if ('condition' in plot.plotSubject) {
                    entitiesToSave.items.push(plot.plotSubject as Item)
                } else if ('gang' in plot.plotSubject) {
                    // Handle gang case
                } else {
                    // Direct gang object
                    entitiesToSave.gangs.push(plot.plotSubject as Gang)
                }
            }

            // Extract plot complication
            let plotComplicationId: string | undefined
            if (plot.plotComplication) {
                plotComplicationId = `pc_${job.ID}`

                plotComplications.push({
                    ID: plotComplicationId,
                    characterId:
                        typeof plot.plotComplication.character === 'object'
                            ? plot.plotComplication.character?.ID
                            : plot.plotComplication.character,
                    itemId:
                        typeof plot.plotComplication.item === 'object'
                            ? plot.plotComplication.item?.ID
                            : plot.plotComplication.item,
                    type: plot.plotComplication.type,
                })

                // Extract entities from complication
                if (typeof plot.plotComplication.character === 'object' && plot.plotComplication.character) {
                    entitiesToSave.characters.push(plot.plotComplication.character)
                }
                if (typeof plot.plotComplication.item === 'object' && plot.plotComplication.item) {
                    entitiesToSave.items.push(plot.plotComplication.item)
                }
            }

            // Create normalized records
            plots.push({
                ID: plotId,
                plotBuildingId,
                plotComplicationId,
                plotSubjectId,
                verb:
                    (plot.verb as { value?: string })?.value ||
                    (typeof plot.verb === 'string' ? plot.verb : 'INVESTIGATE'),
            })

            normalizedJobs.push({
                ID: job.ID,
                description: job.description,
                difficulty: job.difficulty,
                image: job.image,
                name: job.name,
                plotId,
            })
        })

        // Save all data in transaction
        await db.transaction(
            'rw',
            [
                db.fixerJobs,
                db.plots,
                db.plotBuildings,
                db.plotComplications,
                db.buildingComplications,
                db.buildings,
                db.characters,
                db.items,
                db.gangs,
            ],
            async () => {
                // Save entities
                if (entitiesToSave.buildings.length > 0) await db.buildings.bulkPut(entitiesToSave.buildings)
                if (entitiesToSave.characters.length > 0) await db.characters.bulkPut(entitiesToSave.characters)
                if (entitiesToSave.items.length > 0) await db.items.bulkPut(entitiesToSave.items)
                if (entitiesToSave.gangs.length > 0) await db.gangs.bulkPut(entitiesToSave.gangs)

                // Save normalized relationship data
                if (normalizedJobs.length > 0) await db.fixerJobs.bulkPut(normalizedJobs)
                if (plots.length > 0) await db.plots.bulkPut(plots)
                if (plotBuildings.length > 0) await db.plotBuildings.bulkPut(plotBuildings)
                if (plotComplications.length > 0) await db.plotComplications.bulkPut(plotComplications)
                if (buildingComplications.length > 0) await db.buildingComplications.bulkPut(buildingComplications)
            }
        )
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
                language: prefs.language || 'en',
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

export const loadLanguage = async (): Promise<string> => (await loadPreferences()).language || 'en'

export const saveLanguage = async (lang: string): Promise<void> => {
    const prefs = await loadPreferences()
    prefs.language = lang
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
 */
export const loadCombatSimData = async () => {
    try {
        const [boardMaps, tokens, maps, walls, images, blasts, initiative, rollHistory] = await Promise.all([
            db.boardMaps.toArray(),
            db.tokens.toArray(),
            db.maps.toArray(),
            db.walls.toArray(),
            db.images.toArray(),
            db.blasts.toArray(),
            db.initiative.toArray(),
            db.rollHistory.toArray(),
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
            blasts,
            initiative,
            rollHistory,
        }
    } catch (error) {
        console.warn('Error loading combat sim data:', error)
        return {
            boardMaps: [],
            tokens: [],
            maps: [],
            walls: [],
            images: [],
            blasts: [],
            initiative: [],
            rollHistory: [],
        }
    }
}

export const saveCombatSimData = async (data: {
    boardMaps?: Array<Record<string, unknown>>
    tokens?: Array<Record<string, unknown>>
    maps?: Array<Record<string, unknown>>
    walls?: Array<Record<string, unknown>>
    images?: Array<Record<string, unknown>>
    blasts?: Array<Record<string, unknown>>
    initiative?: Array<Record<string, unknown>>
    rollHistory?: Array<Record<string, unknown>>
}): Promise<void> => {
    try {
        // For import operations, clear existing data first to avoid constraint violations
        if (data.boardMaps && data.boardMaps.length > 0) {
            await db.boardMaps.clear()
        }
        if (data.tokens && data.tokens.length > 0) {
            await db.tokens.clear()
        }
        if (data.maps && data.maps.length > 0) {
            await db.maps.clear()
        }
        if (data.walls && data.walls.length > 0) {
            await db.walls.clear()
        }
        if (data.images && data.images.length > 0) {
            await db.images.clear()
        }
        if (data.blasts && data.blasts.length > 0) {
            await db.blasts.clear()
        }
        if (data.initiative && data.initiative.length > 0) {
            await db.initiative.clear()
        }
        if (data.rollHistory && data.rollHistory.length > 0) {
            await db.rollHistory.clear()
        }

        if (data.boardMaps && data.boardMaps.length > 0) {
            await db.boardMaps.bulkPut(data.boardMaps as never)
        }
        if (data.tokens && data.tokens.length > 0) {
            await db.tokens.bulkPut(data.tokens as never)
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
            await db.maps.bulkPut(mapsWithBlobs as never)
        }
        if (data.walls && data.walls.length > 0) {
            await db.walls.bulkPut(data.walls as never)
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
            await db.images.bulkPut(imagesWithBlobs as never)
        }
        if (data.blasts && data.blasts.length > 0) {
            await db.blasts.bulkPut(data.blasts as never)
        }
        if (data.initiative && data.initiative.length > 0) {
            await db.initiative.bulkPut(data.initiative as never)
        }
        if (data.rollHistory && data.rollHistory.length > 0) {
            await db.rollHistory.bulkPut(data.rollHistory as never)
        }
    } catch (error) {
        console.warn('Error saving combat sim data:', error)
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
