import { TableColumn } from './types'

// Module types
export enum ModuleTypes {
    GANG = 'GANG',
    BUILDING = 'BUILDING',
    FIXER_JOB = 'FIXER_JOB',
    BOUNTY = 'BOUNTY',
    CLUB = 'CLUB',
    CORPORATION = 'CORPORATION',
    NPC = 'NPC',
    SETTINGS = 'SETTINGS',
}

// Gang columns used in the gang table view
export const gangColumns: TableColumn[] = [
    { key: 'name', label: 'name' },
    { key: 'type', label: 'type' },
    { key: 'cyberwareQuality', label: 'cyberwareQuality' },
    { key: 'skill', label: 'skill' },
    { key: 'weapons', label: 'weapons' },
    { key: 'armor', label: 'armor' },
    { key: 'secretive', label: 'secretive' },
    { key: 'status', label: 'status' },
    { key: 'sin', label: 'sin' },
    { key: 'knownFor', label: 'knownFor' },
    { key: 'flaw', label: 'flaw' },
    { key: 'currentAttitude', label: 'currentAttitude' },
    { key: 'newsTheLeaderIsReceiving', label: 'newsTheLeaderIsReceiving' },
]

// Building columns used in the building table view
export const buildingColumns: TableColumn[] = [
    { key: 'name', label: 'name' },
    { key: 'type', label: 'type' },
    { key: 'elevators', label: 'elevators' },
    { key: 'parking', label: 'parking' },
    { key: 'gatehouseFrontDesk', label: 'gatehouseFrontDesk' },
    { key: 'emergencyExit', label: 'emergencyExit' },
    { key: 'backupLights', label: 'backupLights' },
    { key: 'landingPad', label: 'landingPad' },
    { key: 'secretOrAltEntrance', label: 'secretOrAltEntrance' },
    { key: 'ownership', label: 'ownership' },
    { key: 'securityPersonnel', label: 'securityPersonnel' },
    { key: 'style', label: 'style' },
    { key: 'event', label: 'event' },
    { key: 'secret', label: 'secret' },
]

// Fixer job columns used in the fixer job table view
export const fixerJobColumns: TableColumn[] = [
    { key: 'name', label: 'name' },
    { key: 'plot.verb.value', label: 'plot.verb.value' },
    { key: 'plot.plotSubject.name', label: 'plot.plotSubject.name' },
    { key: 'plot.plotSubject.type', label: 'plot.plotSubject.type' },
    { key: 'plot.plotSubject.attitude', label: 'plot.plotSubject.attitude' },
    { key: 'plot.plotSubject.condition', label: 'plot.plotSubject.condition' },
    { key: 'plot.plotSubject.gang.name', label: 'plot.plotSubject.gang.name' },
    { key: 'plot.plotSubject.gang.type', label: 'plot.plotSubject.gang.type' },
    { key: 'plot.plotSubject.gang.complication.type', label: 'plot.plotSubject.gang.complication.type' },
    {
        key: 'plot.plotSubject.gang.complication.character.name',
        label: 'plot.plotSubject.gang.complication.character.name',
    },
    {
        key: 'plot.plotSubject.gang.complication.item.name',
        label: 'plot.plotSubject.gang.complication.item.name',
    },
    { key: 'plot.plotBuilding.building.name', label: 'plot.plotBuilding.building.name' },
    { key: 'plot.plotBuilding.building.type', label: 'plot.plotBuilding.building.type' },
    { key: 'plot.plotBuilding.building.style', label: 'plot.plotBuilding.building.style' },
    { key: 'plot.plotBuilding.building.ownership', label: 'plot.plotBuilding.building.ownership' },
    { key: 'plot.plotBuilding.building.securityPersonnel', label: 'plot.plotBuilding.building.securityPersonnel' },
    { key: 'plot.plotBuilding.complication.type', label: 'plot.plotBuilding.complication.type' },
    { key: 'plot.plotBuilding.complication.character.name', label: 'plot.plotBuilding.complication.character.name' },
    { key: 'plot.plotBuilding.complication.item.name', label: 'plot.plotBuilding.complication.item.name' },
    { key: 'plot.plotBuilding.complication.gang.gang.name', label: 'plot.plotBuilding.complication.gang.gang.name' },
    { key: 'plot.complication.type', label: 'plot.complication.type' },
    { key: 'plot.complication.character.name', label: 'plot.complication.character.name' },
    { key: 'plot.complication.character.type', label: 'plot.complication.character.type' },
    { key: 'plot.complication.item.name', label: 'plot.complication.item.name' },
    { key: 'plot.complication.item.type', label: 'plot.complication.item.type' },
    { key: 'plot.complication.gang.gang.name', label: 'plot.complication.gang.gang.name' },
]

// Fixer job image fields
export enum ImageFields {
    // The image of the fixer job
    main = 'image',
    // The image of the plot building complication if character
    mainComplicationCharacter = 'plot.complication.character.image',
    // The image of the plot building complication if item
    mainComplicationItem = 'plot.complication.item.image',
    // The image of the plot subject if character or item
    characterOrItem = 'plot.plotSubject.image',
    // The image of the plot subject if gang
    gang = 'plot.plotSubject.gang.image',
    // The image of the plot gang complication if character
    gangComplicationCharacter = 'plot.plotSubject.gang.complication.character.image',
    // The image of the plot gang complication if item
    gangComplicationItem = 'plot.plotSubject.gang.complication.item.image',
    // The image of the plot building
    building = 'plot.plotBuilding.building.image',
    // The image of the plot building complication if character
    buildingComplicationCharacterOrItem = 'plot.plotBuilding.complication.character.image',
    // The image of the plot building complication if item
    buildingComplicationItem = 'plot.plotBuilding.complication.item.image',
}
