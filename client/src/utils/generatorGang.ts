import { v4 as uuidv4 } from 'uuid'
import {
    Armor,
    Attitude,
    CyberwareQuality,
    Dices,
    Flaw,
    Gang,
    GangColor,
    GangNameType,
    GangNews,
    GangStatus,
    GangType,
    KnownForPart1,
    KnownForPart2,
    Sin,
} from '../graphql/types'
import { getRandomElement, getRandomInt } from './functions'

const gangNameCategories: Record<GangNameType, string[]> = {
    [GangNameType.WEATHER_PHENOMENA]: [
        'Storm',
        'Thunder',
        'Lightning',
        'Hurricane',
        'Cyclone',
        'Blizzard',
        'Tornado',
        'Tempest',
        'Haze',
        'Fog',
        'Mist',
        'Rain',
        'Typhoon',
        'Smog',
        'Ash',
        'Inferno',
        'Dust',
        'Shock',
        'Sand',
        'Gale',
    ],
    [GangNameType.COLOR]: [
        'Crimson',
        'Neon',
        'Obsidian',
        'Chrome',
        'Indigo',
        'Violet',
        'Scarlet',
        'Ivory',
        'Cobalt',
        'Amber',
        'Emerald',
        'Onyx',
        'Azure',
        'Neochrome',
        'Silver',
        'Gold',
        'Copper',
        'Jade',
        'Ultraviolet',
        'Infrared',
    ],
    [GangNameType.PLACE]: [
        'Sector',
        'District',
        'Zone',
        'Hive',
        'Harbor',
        'Alley',
        'Bay',
        'Gate',
        'Sprawl',
        'Dock',
        'Underground',
        'Metro',
        'Megaplex',
        'Grid',
        'Complex',
        'Streets',
        'Core',
        'Wastes',
        'Arena',
        'Den',
    ],
    [GangNameType.WEAPON]: [
        'Blades',
        'Guns',
        'Razors',
        'Lasers',
        'Knives',
        'Rifles',
        'Bullets',
        'Daggers',
        'Axes',
        'Sabers',
        'Chains',
        'Shurikens',
        'Gauntlets',
        'Swords',
        'Pistols',
        'Cannons',
        'Railguns',
        'Arsenal',
        'Spikes',
        'Hammers',
    ],
    [GangNameType.BODY_PART]: [
        'Eyes',
        'Claws',
        'Fangs',
        'Hearts',
        'Hands',
        'Spines',
        'Skulls',
        'Veins',
        'Fists',
        'Jaws',
        'Bones',
        'Talons',
        'Knuckles',
        'Nerves',
        'Skin',
        'Muscle',
        'Blood',
        'Breath',
        'Minds',
        'Fang',
    ],
    [GangNameType.NUMBER]: [
        'Eight',
        'Sixteen',
        'Eighteen',
        'Twenty-Three',
        'Twenty-Seven',
        'Thirty-Two',
        'Thirty-Five',
        'Forty-Two',
        'Forty-Four',
        'Fifty-Three',
        'Fifty-Eight',
        'Sixty-Four',
        'Sixty-Nine',
        'Seventy-Two',
        'Eighty-One',
        'Ninety-Nine',
        'Hundred',
        'Thousand',
        'Zero',
        'Million',
    ],
    [GangNameType.ADJECTIVE]: [
        'Cyber',
        'Savage',
        'Digital',
        'Phantom',
        'Grim',
        'Iron',
        'Quantum',
        'Synthetic',
        'Virtual',
        'Rogue',
        'Neural',
        'Augmented',
        'Chromed',
        'Dystopian',
        'Radical',
        'Atomic',
        'Genetic',
        'Infamous',
        'Encrypted',
        'Toxic',
    ],
    [GangNameType.PROFESSION]: [
        'Nomads',
        'Hackers',
        'Runners',
        'Fixers',
        'Mercs',
        'Techs',
        'Netrunners',
        'Scavengers',
        'Rippers',
        'Mechanics',
        'Slicers',
        'Boosters',
        'Ronin',
        'Operatives',
        'Smugglers',
        'Hunters',
        'Dealers',
        'Enforcers',
        'Engineers',
        'Ghosts',
    ],
    [GangNameType.ANIMAL]: [
        'Wolves',
        'Ravens',
        'Jackals',
        'Sharks',
        'Vipers',
        'Cobras',
        'Panthers',
        'Falcons',
        'Rats',
        'Hornets',
        'Spiders',
        'Scorpions',
        'Wasps',
        'Hyenas',
        'Bats',
        'Mantis',
        'Serpents',
        'Leopards',
        'Locusts',
        'Dragons',
    ],
    [GangNameType.NEIGHBORHOOD]: [
        'Watson',
        'Pacifica',
        'Kabuki',
        'Chinatown',
        'Charter',
        'Heywood',
        'Glen',
        'Japantown',
        'Coronado',
        'Santo',
        'Westbrook',
        'Vista',
        'Arroyo',
        'Plaza',
        'Northside',
        'Combat',
        'Industrial',
        'University',
        'Southside',
        'Badlands',
    ],
}

export const generateRandomGang = (gang?: Partial<Gang>): Gang => {
    // Things to generate
    // - Name
    // TODO: - Description
    // - Type
    // - Cyberware Quality
    // - Skill
    // - Weapons
    // - Armor
    // - Secretive
    // - Status
    // - Color
    // - Sin
    // - Known For
    // - Flaw
    // - Current Attitude
    // - News The Leader Is Receiving

    // Generate Gang Name
    const nameCategory1 = getRandomElement(Object.values(GangNameType))
    let nameCategory2 = getRandomElement(Object.values(GangNameType))
    // Reroll nameCategory2 if it's COLOR or ADJECTIVE
    while (nameCategory2 === GangNameType.COLOR || nameCategory2 === GangNameType.ADJECTIVE) {
        nameCategory2 = getRandomElement(Object.values(GangNameType))
    }
    const category1Array = gangNameCategories[nameCategory1]
    const category2Array = gangNameCategories[nameCategory2]
    const term1 = getRandomElement(category1Array)
    let term2 = getRandomElement(category2Array)
    // Reroll term2 if it's the same as term1
    if (nameCategory1 === nameCategory2) {
        while (term1 === term2) {
            term2 = getRandomElement(category2Array)
        }
    }
    const gangName = `The ${term1} ${term2}`
    // Generate Gang Type
    const gangType = getRandomElement(Object.values(GangType))
    // Generate Cyberware Quality
    const cyberwareQualityRoll = getRandomInt(1, 10)
    let cyberwareQuality: CyberwareQuality
    if (cyberwareQualityRoll <= 5) {
        cyberwareQuality = CyberwareQuality.POOR
    } else if (cyberwareQualityRoll <= 8) {
        cyberwareQuality = CyberwareQuality.STANDARD
    } else {
        cyberwareQuality = CyberwareQuality.EXCELLENT
    }
    // Generate Skill
    const skillRoll = getRandomInt(1, 10)
    let skill: number
    switch (skillRoll) {
        case 1:
            skill = 8
            break
        case 2:
        case 3:
        case 4:
        case 5:
            skill = 10
            break
        case 6:
        case 7:
        case 8:
            skill = 12
            break
        case 9:
            skill = 14
            break
        case 10:
            skill = 16
            break
        default:
            skill = 0
            break
    }
    // Generate Weapons
    const weaponsRoll = getRandomInt(1, 10)
    let weapons: Dices
    switch (weaponsRoll) {
        case 1:
            weapons = {
                d4: 0,
                d6: 1,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        case 2:
            weapons = {
                d4: 0,
                d6: 2,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        case 3:
        case 4:
        case 5:
            weapons = {
                d4: 0,
                d6: 3,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        case 6:
        case 7:
            weapons = {
                d4: 0,
                d6: 4,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        case 8:
            weapons = {
                d4: 0,
                d6: 5,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        case 9:
            weapons = {
                d4: 0,
                d6: 6,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        case 10:
            weapons = {
                d4: 0,
                d6: 8,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
        default:
            weapons = {
                d4: 0,
                d6: 0,
                d8: 0,
                d10: 0,
                d12: 0,
                d20: 0,
            }
            break
    }
    // Generate Armor
    const armorRoll = getRandomInt(1, 10)
    let armor: Armor
    switch (armorRoll) {
        case 1:
            armor = {
                spb: 0,
                h: 0,
            }
            break
        case 2:
            armor = {
                spb: 4,
                h: 0,
            }
            break
        case 3:
            armor = {
                spb: 7,
                h: 0,
            }
            break
        case 4:
            armor = {
                spb: 7,
                h: 4,
            }
            break
        case 5:
            armor = {
                spb: 7,
                h: 7,
            }
            break
        case 6:
            armor = {
                spb: 11,
                h: 0,
            }
            break
        case 7:
        case 8:
            armor = {
                spb: 11,
                h: 11,
            }
            break
        case 9:
            armor = {
                spb: 13,
                h: 13,
            }
            break
        case 10:
            armor = {
                spb: 16,
                h: 16,
            }
            break
        default:
            armor = {
                spb: 0,
                h: 0,
            }
            break
    }
    // Generate Secretive
    const secretiveRoll = getRandomInt(1, 10)
    let secretive: number
    switch (secretiveRoll) {
        case 1:
        case 2:
        case 3:
            secretive = 9
            break
        case 4:
        case 5:
            secretive = 13
            break
        case 6:
        case 7:
            secretive = 15
            break
        case 8:
            secretive = 17
            break
        case 9:
            secretive = 21
            break
        case 10:
            secretive = 24
            break
        default:
            secretive = 0
            break
    }
    // Generate Status
    const status = getRandomElement(Object.values(GangStatus))
    // Generate Color
    const color = getRandomElement(Object.values(GangColor))
    // Generate Sin
    const sinRoll = getRandomInt(1, 10)
    let sin: Sin
    switch (sinRoll) {
        case 1:
            sin = Sin.LUST
            break
        case 2:
            sin = Sin.GLUTTONY
            break
        case 3:
            sin = Sin.GREED
            break
        case 4:
            sin = Sin.SLOTH
            break
        case 5:
            sin = Sin.WRATH
            break
        case 6:
            sin = Sin.ENVY
            break
        case 7:
            sin = Sin.PRIDE
            break
        case 8:
        case 9:
        case 10:
            sin = Sin.NONE
            break
        default:
            sin = Sin.NONE
            break
    }
    // Generate Known For
    const knownForPart1 = getRandomElement(Object.values(KnownForPart1))
    const knownForPart2 = getRandomElement(Object.values(KnownForPart2))
    // Generate Flaw
    const flawRoll = getRandomInt(1, 10)
    let flaw: Flaw
    switch (flawRoll) {
        case 1:
            flaw = Flaw.LACKLUSTER_LEADERSHIP
            break
        case 2:
            flaw = Flaw.DRUG_ADDICTS
            break
        case 3:
            flaw = Flaw.DEBT_LACK_OF_INCOME
            break
        case 4:
            flaw = Flaw.LACK_OF_RECRUITS
            break
        case 5:
            flaw = Flaw.AMMO_WEAPON_SHORTAGE
            break
        case 6:
            flaw = Flaw.NAIVE
            break
        case 7:
            flaw = Flaw.ILLITERATE_UNEDUCATED
            break
        case 8:
            flaw = Flaw.INEXPERIENCED_NEGOTIATORS
            break
        case 9:
        case 10:
            flaw = Flaw.NONE
            break
        default:
            flaw = Flaw.NONE
            break
    }
    // Generate Current Attitude
    const currentAttitudeRoll = getRandomInt(1, 10)
    let currentAttitude: Attitude
    switch (currentAttitudeRoll) {
        case 1:
            currentAttitude = Attitude.FOCUSED_ON_SOMETHING_ELSE
            break
        case 2:
            currentAttitude = Attitude.FEARFUL
            break
        case 3:
            currentAttitude = Attitude.INFIGHTING
            break
        case 4:
            currentAttitude = Attitude.PLANNING
            break
        case 5:
            currentAttitude = Attitude.PROVISIONING
            break
        case 6:
            currentAttitude = Attitude.ROBBING_ASSAULTING
            break
        case 7:
            currentAttitude = Attitude.BRIBING
            break
        case 8:
            currentAttitude = Attitude.PARTING
            break
        case 9:
            currentAttitude = Attitude.NONE
            break
        case 10:
            currentAttitude = Attitude.AGGRESSIVE
            break
        default:
            currentAttitude = Attitude.NONE
            break
    }
    // Generate News The Leader Is Receiving
    const newsTheLeaderIsReceivingRoll = getRandomInt(1, 10)
    let newsTheLeaderIsReceiving: GangNews
    switch (newsTheLeaderIsReceivingRoll) {
        case 1:
            newsTheLeaderIsReceiving = GangNews.POLICE_COMING
            break
        case 2:
            newsTheLeaderIsReceiving = GangNews.TEAM_RELEASED
            break
        case 3:
            newsTheLeaderIsReceiving = GangNews.LAB_STASH_ROBBED
            break
        case 4:
            newsTheLeaderIsReceiving = GangNews.GAINED_TERRITORY
            break
        case 5:
            newsTheLeaderIsReceiving = GangNews.BEING_SABOTAGED
            break
        case 6:
            newsTheLeaderIsReceiving = GangNews.COP_RAIDING
            break
        case 7:
            newsTheLeaderIsReceiving = GangNews.JOB_BLEW_UP
            break
        case 8:
            newsTheLeaderIsReceiving = GangNews.NEW_ENEMY
            break
        case 9:
        case 10:
            newsTheLeaderIsReceiving = GangNews.NONE
            break
        default:
            newsTheLeaderIsReceiving = GangNews.NONE
            break
    }

    const newGang: Gang = {
        ID: uuidv4(),
        name: gangName,
        description: 'Description goes here!',
        type: gangType,
        cyberwareQuality: cyberwareQuality,
        skill: skill,
        weapons: weapons,
        armor: armor,
        secretive: secretive,
        status: status,
        color: color,
        sin: sin,
        knownFor: {
            knownForPart1: knownForPart1 as KnownForPart1,
            knownForPart2: knownForPart2 as KnownForPart2,
        },
        flaw: flaw,
        currentAttitude: currentAttitude,
        newsTheLeaderIsReceiving: newsTheLeaderIsReceiving,
        ...gang,
    }
    return newGang
}
