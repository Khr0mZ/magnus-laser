import { TableColumn } from './types'

// Module types
export enum ModuleTypes {
    GANG = 'GANG',
    BUILDING = 'BUILDING',
    CORPORATION = 'CORPORATION',
    FIXER_JOB = 'FIXER_JOB',
    NPC = 'NPC',
}

// Job difficulty
export enum JobDifficulty {
    EASY = 'EASY',
    TYPICAL = 'TYPICAL',
    DANGEROUS = 'DANGEROUS',
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
