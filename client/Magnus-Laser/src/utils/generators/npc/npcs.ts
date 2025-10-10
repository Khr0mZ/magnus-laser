import { Stats } from '../../../views/CombatSim/types'

export const randomNPCs: { [key: string]: Stats } = {
    EASY: {
        combat: 8,
        skills: 8,
        initiative: 4,
        armor: {
            sph: 0,
            currentSph: 0,
            spb: 7,
            currentSpb: 7,
        },
        health: 15,
        currentHealth: 15,
        weapons: { melee: { d6: 2 }, ranged: { d6: 3 } },
    },
    TYPICAL: {
        combat: 11,
        skills: 11,
        initiative: 6,
        armor: {
            sph: 5,
            currentSph: 5,
            spb: 9,
            currentSpb: 9,
        },
        health: 25,
        currentHealth: 25,
        weapons: { melee: { d6: 3 }, ranged: { d6: 4 }, grenadesOrSpecialAmmo: { d4: 1 } },
    },
    DANGEROUS: {
        combat: 14,
        skills: 14,
        initiative: 8,
        armor: {
            sph: 11,
            currentSph: 11,
            spb: 11,
            currentSpb: 11,
        },
        health: 35,
        currentHealth: 35,
        weapons: { melee: { d6: 4 }, ranged: { d6: 5 }, grenadesOrSpecialAmmo: { d6: 1 } },
    },
    DEADLY: {
        combat: 17,
        skills: 17,
        initiative: 10,
        armor: {
            sph: 17,
            currentSph: 17,
            spb: 17,
            currentSpb: 17,
        },
        health: 55,
        currentHealth: 55,
        weapons: { melee: { d6: 5 }, ranged: { d6: 6 }, grenadesOrSpecialAmmo: { d8: 1 } },
    },
}
