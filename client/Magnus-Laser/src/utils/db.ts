import Dexie, { Table } from 'dexie'
import {
    BountyRep,
    BountyStatus,
    Building,
    Character,
    Crime,
    CrimeType,
    Gang,
    Item,
    JobDifficulty,
    PlotBuildingComplicationType,
    PlotComplicationType,
} from '../graphql/types'
import { Blast, BoardMap, Image, Map, Token, Wall } from '../views/CombatSim/types'

// Normalized database types (for storage only)
export type DbBounty = {
    ID: string
    characterId: string
    crimes: Array<Crime>
    rep: BountyRep
    speciality: CrimeType
    status: BountyStatus
}

export type DbFixerJob = {
    ID: string
    description: string
    difficulty: JobDifficulty
    image: string
    name: string
    plotId: string
}

export type DbPlot = {
    ID: string
    plotBuildingId?: string
    plotComplicationId?: string
    plotSubjectId?: string
    verb: string // Stored as string, converted to enum on load
}

export type DbPlotBuilding = {
    ID: string
    buildingId: string
    complicationId?: string
}

export type DbPlotComplication = {
    ID: string
    characterId?: string
    itemId?: string
    type: PlotComplicationType
}

export type DbBuildingComplication = {
    ID: string
    characterId?: string
    itemId?: string
    type: PlotBuildingComplicationType
}

export type CustomMarker = {
    position: [number, number]
    buildingId: string
    id: string
    markerType: 'building' | 'gang' | 'contact'
}

export type AppPreferences = {
    viewPreferences: Record<string, boolean>
    readerMode: boolean
    animationsEnabled: boolean
    loaderEnabled: boolean
    huggingFaceApiKey: string
    openAIApiKey: string
    geminiApiKey: string
}

export class MagnusLaserDB extends Dexie {
    // Core entity tables (normalized)
    gangs!: Table<Gang, string>
    buildings!: Table<Building, string>
    characters!: Table<Character, string>
    items!: Table<Item, string>

    // Normalized relationship tables
    bounties!: Table<DbBounty, string>
    fixerJobs!: Table<DbFixerJob, string>
    plots!: Table<DbPlot, string>
    plotBuildings!: Table<DbPlotBuilding, string>
    plotComplications!: Table<DbPlotComplication, string>
    buildingComplications!: Table<DbBuildingComplication, string>

    // App state
    preferences!: Table<AppPreferences & { id: string }, string>
    mapMarkers!: Table<CustomMarker, string>

    // Combat Simulator tables
    boardMaps!: Table<BoardMap, string>
    tokens!: Table<Token, string>
    maps!: Table<Map, string>
    walls!: Table<Wall, string>
    images!: Table<Image, string>
    blasts!: Table<Blast, string>

    constructor() {
        super('magnus-laser')
        this.version(1).stores({
            gangs: 'ID, &name',
            buildings: 'ID, &name',
            characters: 'ID, &name',
            items: 'ID, &name',
            fixerJobs: 'ID, &name',
            bounties: 'ID',
            preferences: 'id',
            mapMarkers: 'id, buildingId',
        })
        this.version(2).stores({
            gangs: 'ID, &name',
            buildings: 'ID, &name',
            characters: 'ID, &name',
            items: 'ID, &name',
            fixerJobs: 'ID, &name',
            bounties: 'ID',
            preferences: 'id',
            mapMarkers: 'id, buildingId',
            // Combat Simulator tables
            boardMaps: 'id, &name',
            tokens: 'id, mapId',
            maps: 'id, &name',
            walls: 'id, mapId',
            images: 'id, &name',
            blasts: 'id, mapId',
        })
        // Version 4: Fixed normalized database schema with consistent ID fields
        this.version(4)
            .stores({
                // Core entity tables (normalized)
                gangs: 'ID, &name',
                buildings: 'ID, &name',
                characters: 'ID, &name',
                items: 'ID, &name',

                // Normalized relationship tables
                bounties: 'ID, characterId',
                fixerJobs: 'ID, plotId',
                plots: 'ID, plotBuildingId, plotSubjectId',
                plotBuildings: 'ID, buildingId',
                plotComplications: 'ID, characterId, itemId',
                buildingComplications: 'ID, characterId, itemId',

                // App state
                preferences: 'id',
                mapMarkers: 'id, buildingId',

                // Combat Simulator tables
                boardMaps: 'id, &name',
                tokens: 'id, mapId',
                maps: 'id, &name',
                walls: 'id, mapId',
                images: 'id, &name',
                blasts: 'id, mapId',
            })
            .upgrade(async () => {
                // Version 4: Clean schema - combat sim data is self-migrating
                // Main app data (bounties, fixerJobs) can be regenerated from generators
                console.log('Upgraded to version 4: Clean normalized schema')
            })
    }
}

export const db = new MagnusLaserDB()
