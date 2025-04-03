import { TFunction } from 'i18next'
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
import { gangConnectors, gangNameCategories, gangPrefixes, gangSuffixes, gangTypeNameData } from './constants'
import { getRandomElement, getRandomInt } from './functions'

/**
 * Internal function to generate a gang name
 * @param t - The translation function
 * @param type - The gang type
 * @param gangColor - The gang color
 * @returns A gang name
 */
function generateGangName(t: TFunction, type: GangType, gangColor: GangColor): string {
    // Get appropriate naming patterns for this gang type
    const appropriatePatterns = gangTypeNameData[type].preferredPatterns || [1, 2, 3, 4, 5]
    const namingPattern = getRandomElement(appropriatePatterns)

    // Define all the elements we might need
    const adjective = getRandomElement(gangNameCategories[GangNameType.ADJECTIVE])
    const animal = getRandomElement(gangNameCategories[GangNameType.ANIMAL])
    const bodyPart = getRandomElement(gangNameCategories[GangNameType.BODY_PART])
    const color = getRandomElement(gangNameCategories[GangNameType.COLOR])
    const neighborhood = getRandomElement(gangNameCategories[GangNameType.NEIGHBORHOOD])
    const number = getRandomElement(gangNameCategories[GangNameType.NUMBER])
    const place = getRandomElement(gangNameCategories[GangNameType.PLACE])
    const profession = getRandomElement(gangNameCategories[GangNameType.PROFESSION])
    const weapon = getRandomElement(gangNameCategories[GangNameType.WEAPON])
    const weather = getRandomElement(gangNameCategories[GangNameType.WEATHER_PHENOMENA])

    const prefix = getRandomElement(gangPrefixes)
    const suffix = getRandomElement(gangSuffixes)
    const connector = getRandomElement(gangConnectors)

    // Generate a random number for numeric patterns
    const randomNum = getRandomInt(1, 99).toString()

    // Name generation patterns
    let name = ''

    switch (namingPattern) {
        case 1: // Classic pattern: "The Chrome Wolves"
            name = `${t('common.the')} ${adjective} ${animal}`
            break
        case 2: // Compound with suffix: "Crimson Dragons Crew"
            name = `${color} ${animal} ${suffix}`
            break
        case 3: // Location-based: "Westbrook Rippers"
            name = `${neighborhood} ${profession}`
            break
        case 4: // Body parts: "Iron Fists"
            name = `${adjective} ${bodyPart}`
            break
        case 5: // Weapons focus: "Phantom Blades"
            name = `${adjective} ${weapon}`
            break
        case 6: // Numbered gangs: "18th Street Vipers"
            name = `${randomNum}${getRandomInt(1, 3) === 1 ? 'th' : ''} ${place} ${animal}`
            break
        case 7: // Weather elements: "Thunder Jackals"
            name = `${weather} ${animal}`
            break
        case 8: // Military style: "Chrome Strike Force"
            name = `${color} Strike ${profession}`
            break
        case 9: // Connector phrases: "Wolves of the Wasteland"
            name = `${animal} ${connector} ${place}`
            break
        case 10: // Enhanced Short and punchy: "The Steel Razors" instead of just "The Razors"
            name = `${t('common.the')} ${adjective} ${weapon}`
            break
        case 11: // Profession focused: "Rogue Netrunners"
            name = `${adjective} ${profession}`
            break
        case 12: // Number gang with more elements: "Sixty-Nine Elite Crew" instead of just "Sixty-Nine Crew"
            name = `${number} ${adjective} ${suffix}`
            break
        case 13: // Syndicate style with more detail: "Cobalt Shadow Syndicate" instead of just "Cobalt Syndicate"
            name = `${color} ${adjective} ${suffix}`
            break
        case 14: // Religious/vigilante: "Brotherhood of Steel"
            name = `${suffix} ${connector} ${adjective}`
            break
        case 15: // Quirky poser: "Los Chrome Boys"
            name = `${prefix} ${color} ${profession}`
            break
        default:
            name = `${t('common.the')} ${adjective} ${animal}`
    }

    // Add color influence for certain patterns if not already using color
    if (gangColor && !name.includes(color) && [2, 6, 8, 13, 15].includes(namingPattern)) {
        const colorText = gangNameCategories[GangNameType.COLOR][Object.values(GangColor).indexOf(gangColor)]
        if (colorText && Math.random() > 0.7) {
            if (namingPattern === 13) {
                name = `${colorText} ${adjective} ${suffix}`
            } else if (namingPattern === 15) {
                name = `${prefix} ${colorText} ${profession}`
            } else if (Math.random() > 0.5) {
                name = name.replace(adjective, colorText)
            }
        }
    }

    // Add "The" to names that don't already have it or a prefix
    if (!name.startsWith('The ') && !gangPrefixes.some((p) => name.startsWith(p)) && Math.random() > 0.6) {
        name = `${t('common.the')} ${name}`
    }

    return name
}

/**
 * Generate a random gang
 * @param t - The translation function
 * @param gang - The gang object with the desired properties
 * @returns A gang
 */
export const generateRandomGang = (t: TFunction, gang?: Partial<Gang>): Gang => {
    // Things to generate
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
    // - Name
    // TODO: - Description

    // Generate Gang Type
    const type = getRandomElement(Object.values(GangType))
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

    // Generate Gang Name using the new generator
    const name = generateGangName(t, type, color)

    // TODO: Generate Description
    const description = 'Description goes here!'
    // Create the gang object
    const newGang: Gang = {
        ID: uuidv4(),
        name,
        description,
        type,
        cyberwareQuality,
        skill,
        weapons,
        armor,
        secretive,
        status,
        color,
        sin,
        knownFor: {
            knownForPart1,
            knownForPart2,
        },
        flaw,
        currentAttitude,
        newsTheLeaderIsReceiving,
        ...gang, // Override with any provided properties
    }
    return newGang
}
