import Dexie, { Table } from 'dexie'
import { Bounty, Building, Character, FixerJob, Gang, Item } from '../graphql/types'

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
    gangs!: Table<Gang, string>
    buildings!: Table<Building, string>
    characters!: Table<Character, string>
    items!: Table<Item, string>
    fixerJobs!: Table<FixerJob, string>
    bounties!: Table<Bounty, string>
    preferences!: Table<AppPreferences & { id: string }, string>
    mapMarkers!: Table<CustomMarker, string>

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
    }
}

export const db = new MagnusLaserDB()
