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
    { key: 'plot.subjectIfNotPlace.name', label: 'plot.subjectIfNotPlace.name' },
    { key: 'plot.subjectIfNotPlace.type', label: 'plot.subjectIfNotPlace.type' },
    { key: 'plot.subjectIfNotPlace.attitude', label: 'plot.subjectIfNotPlace.attitude' },
    { key: 'plot.subjectIfNotPlace.condition', label: 'plot.subjectIfNotPlace.condition' },
    { key: 'plot.subjectIfNotPlace.gang.name', label: 'plot.subjectIfNotPlace.gang.name' },
    { key: 'plot.subjectIfNotPlace.gang.type', label: 'plot.subjectIfNotPlace.gang.type' },
    { key: 'plot.subjectIfNotPlace.gang.complication.type', label: 'plot.subjectIfNotPlace.gang.complication.type' },
    {
        key: 'plot.subjectIfNotPlace.gang.complication.character.name',
        label: 'plot.subjectIfNotPlace.gang.complication.character.name',
    },
    {
        key: 'plot.subjectIfNotPlace.gang.complication.item.name',
        label: 'plot.subjectIfNotPlace.gang.complication.item.name',
    },
    { key: 'plot.plotPlace.building.name', label: 'plot.plotPlace.building.name' },
    { key: 'plot.plotPlace.building.type', label: 'plot.plotPlace.building.type' },
    { key: 'plot.plotPlace.building.style', label: 'plot.plotPlace.building.style' },
    { key: 'plot.plotPlace.building.ownership', label: 'plot.plotPlace.building.ownership' },
    { key: 'plot.plotPlace.building.securityPersonnel', label: 'plot.plotPlace.building.securityPersonnel' },
    { key: 'plot.plotPlace.complication.type', label: 'plot.plotPlace.complication.type' },
    { key: 'plot.plotPlace.complication.character.name', label: 'plot.plotPlace.complication.character.name' },
    { key: 'plot.plotPlace.complication.item.name', label: 'plot.plotPlace.complication.item.name' },
    { key: 'plot.plotPlace.complication.gang.gang.name', label: 'plot.plotPlace.complication.gang.gang.name' },
    { key: 'plot.complication.type', label: 'plot.complication.type' },
    { key: 'plot.complication.character.name', label: 'plot.complication.character.name' },
    { key: 'plot.complication.character.type', label: 'plot.complication.character.type' },
    { key: 'plot.complication.item.name', label: 'plot.complication.item.name' },
    { key: 'plot.complication.item.type', label: 'plot.complication.item.type' },
    { key: 'plot.complication.gang.gang.name', label: 'plot.complication.gang.gang.name' },
]
