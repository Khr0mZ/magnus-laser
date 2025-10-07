export const randomNPCs = {
    EASY: {
        name: 'Easy',
        combat: 8,
        skills: 8,
        initiative: 4,
        armor: {
            sph: 0,
            spb: 7,
        },
        health: 15,
        weapons: { melee: 2, ranged: 3 },
    },
    TYPICAL: {
        name: 'Typical',
        combat: 11,
        skills: 11,
        initiative: 6,
        armor: {
            sph: 5,
            spb: 9,
        },
        health: 25,
        weapons: { melee: 3, ranged: 4, grenadesOrSpecialAmmo: '1D4' },
    },
    DANGEROUS: {
        name: 'Dangerous',
        combat: 14,
        skills: 14,
        initiative: 8,
        armor: {
            sph: 11,
            spb: 11,
        },
        health: 35,
        weapons: { melee: 4, ranged: 5, grenadesOrSpecialAmmo: '1D6' },
    },
    DEADLY: {
        name: 'Deadly',
        combat: 17,
        skills: 17,
        initiative: 10,
        armor: {
            sph: 17,
            spb: 17,
        },
        health: 55,
        weapons: { melee: 5, ranged: 6, grenadesOrSpecialAmmo: '1D8' },
    },
}
