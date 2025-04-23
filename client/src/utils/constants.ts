import { TableColumn } from './types'

// Module types
export enum ModuleTypes {
    GANG = 'GANG',
    BUILDING = 'BUILDING',
    FIXER_JOB = 'FIXER_JOB',
    BOUNTY = 'BOUNTY',
    CLUB = 'CLUB',
    ITEM = 'ITEM',
    CHARACTER = 'CHARACTER',
    SETTINGS = 'SETTINGS',
}

// Item columns used in the item table view
export const itemColumns: TableColumn[] = [
    { key: 'name', label: 'name' },
    { key: 'type', label: 'type' },
    { key: 'condition', label: 'condition' },
]

// Character columns used in the character table view
export const characterColumns: TableColumn[] = [
    { key: 'name', label: 'name' },
    { key: 'type', label: 'type' },
    { key: 'attitude', label: 'attitude' },
]

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
    { key: 'isAbandoned', label: 'isAbandoned' },
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
    { key: 'difficulty', label: 'difficulty' },
    { key: 'plot.verb.value', label: 'verb' },
    { key: 'plot.verb.__typename', label: 'subjectCategory' },

    // Only these fields are needed for subject display
    { key: 'plot.plotSubject', label: 'plotCategory.target' },
    // { key: 'plot.plotSubject.gang.name', label: 'plotCategory.gang' },
    { key: 'plot.plotSubject.complication.type', label: 'gangComplication' },
    { key: 'plot.plotSubject.complication.character.name', label: 'plotCategory.character' },
    { key: 'plot.plotSubject.complication.item.name', label: 'plotCategory.item' },

    // Building - only show name and complication
    { key: 'plot.plotBuilding.building.name', label: 'plotCategory.building' },
    { key: 'plot.plotBuilding.complication.type', label: 'buildingComplication' },
    { key: 'plot.plotBuilding.complication.character.name', label: 'plotCategory.character' },
    { key: 'plot.plotBuilding.complication.item.name', label: 'plotCategory.item' },

    // Main complication
    { key: 'plot.plotComplication.type', label: 'mainComplication' },
    { key: 'plot.plotComplication.character.name', label: 'plotCategory.character' },
    { key: 'plot.plotComplication.item.name', label: 'plotCategory.item' },
]

// Fixer job image fields
export enum ImageFields {
    main = 'image',
    mainComplicationCharacter = 'plot.plotComplication.character.image',
    mainComplicationItem = 'plot.plotComplication.item.image',

    building = 'plot.plotBuilding.building.image',
    buildingComplicationCharacter = 'plot.plotBuilding.complication.character.image',
    buildingComplicationItem = 'plot.plotBuilding.complication.item.image',
    characterOrItem = 'plot.plotSubject.image',
    gang = 'plot.plotSubject.gang.image',
    gangComplicationCharacter = 'plot.plotSubject.complication.character.image',
    gangComplicationItem = 'plot.plotSubject.complication.item.image',
}
