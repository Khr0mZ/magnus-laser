import Dexie, { Table } from 'dexie'
import { BoardMap, Image, Map, Token, Wall } from './types'

export class CombatSimDB extends Dexie {
    boardMaps!: Table<BoardMap, string>
    tokens!: Table<Token, string>
    maps!: Table<Map, string>
    walls!: Table<Wall, string>
    images!: Table<Image, string>

    constructor() {
        super('combat-sim')
        this.version(1).stores({
            boardMaps: 'id, &name',
            tokens: 'id, mapId',
            maps: 'id, &name',
            walls: 'id, mapId',
            images: 'id, &name',
        })
    }
}

export const db = new CombatSimDB()
