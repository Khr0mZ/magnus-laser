import Dexie, { Table } from 'dexie'
import { Blast, BoardMap, Image, Map, Token, Wall } from './types'

export class CombatSimDB extends Dexie {
    boardMaps!: Table<BoardMap, string>
    tokens!: Table<Token, string>
    maps!: Table<Map, string>
    walls!: Table<Wall, string>
    images!: Table<Image, string>
    blasts!: Table<Blast, string>

    constructor() {
        super('combat-sim')
        this.version(1).stores({
            boardMaps: 'id, &name',
            tokens: 'id, mapId',
            maps: 'id, &name',
            walls: 'id, mapId',
            images: 'id, &name',
        })
        this.version(2).stores({
            boardMaps: 'id, &name',
            tokens: 'id, mapId',
            maps: 'id, &name',
            walls: 'id, mapId',
            images: 'id, &name',
            blasts: 'id, mapId',
        })
    }
}

export const db = new CombatSimDB()
