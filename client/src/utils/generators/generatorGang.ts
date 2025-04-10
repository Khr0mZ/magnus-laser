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
} from '../../graphql/types'
import { blobToBase64, generateHuggingFaceImage, generateHuggingFaceText } from '../apiUtils.tsx'
import { ModuleTypes } from '../constants'
import { getRandomElement, getRandomInt } from '../functions'
import {
    gangConnectors,
    gangNameCategories,
    gangPrefixes,
    gangSuffixes,
    gangTypeNameData,
    TextGenerationType,
} from './constantsGenerators'

/**
 * Generate a random gang
 * @param t - The translation function
 * @param gang - The gang object with the desired properties
 * @returns A gang
 */
export const generateRandomGang = async (t: TFunction, gang?: Partial<Gang>): Promise<Gang> => {
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
    // - Description (now generated via API)
    // - Image (now generated via API)

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

    // Construct the base gang object
    const newGang: Gang = {
        ID: uuidv4(),
        name: '',
        description: '',
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
        image: '',
        ...gang,
    }

    // --- Generate Name using API ---
    try {
        const generatedName = await generateHuggingFaceText(newGang, ModuleTypes.GANG, t, TextGenerationType.NAME)
        if (generatedName) {
            newGang.name = generatedName
        } else {
            console.warn(`API name generation failed for gang ${newGang.name}. Using local fallback.`)
            newGang.name = generateLocalGangName(t, type, color) // Use fallback function
        }
    } catch (error) {
        console.error(`Error generating API name for gang ${newGang.name}:`, error)
        console.warn(`Using local fallback name generation for gang ${newGang.name}.`)
        newGang.name = generateLocalGangName(t, type, color) // Use fallback function
    }

    // --- Generate Description using API ---
    try {
        const generatedDesc = await generateHuggingFaceText(
            newGang,
            ModuleTypes.GANG,
            t,
            TextGenerationType.DESCRIPTION
        )
        if (generatedDesc) {
            newGang.description = generatedDesc
        } else {
            console.warn(`API description generation failed for gang ${newGang.name}. Using local fallback.`)
            newGang.description = generateLocalGangDescription(t, newGang) // Fallback
        }
    } catch (error) {
        console.error(`Error generating API description for gang ${newGang.name}:`, error)
        console.warn(`Using local fallback description generation for gang ${newGang.name}.`)
        newGang.description = generateLocalGangDescription(t, newGang) // Fallback
    }

    // --- Generate Image using API (if description exists) ---
    if (newGang.description) {
        try {
            const imageBlob = await generateHuggingFaceImage(newGang.description, newGang.name, ModuleTypes.GANG)
            if (imageBlob) {
                newGang.image = await blobToBase64(imageBlob)
            } else {
                console.warn(`API image generation returned null for gang ${newGang.name}, leaving empty.`)
                newGang.image = '' // Ensure it's an empty string on failure
            }
        } catch (error) {
            console.error(`Error generating or converting image for gang ${newGang.name}:`, error)
            newGang.image = '' // Ensure it's an empty string on error
        }
    } else {
        newGang.image = '' // Ensure image is empty if description failed
    }

    return newGang
}

/**
 * Internal function to generate a name for a gang based on its properties.
 * It is used as a fallback if the API name generation fails.
 * @param t - The translation function
 * @param type - The gang type
 * @param gangColor - The gang color
 * @returns A gang name
 */
function generateLocalGangName(t: TFunction, type: GangType, gangColor: GangColor): string {
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
 * Internal function to generate a description for a gang based on its properties.
 * It is used as a fallback if the API description generation fails.
 * @param t - The translation function
 * @param gang - The gang object
 * @returns A natural language description of the gang
 */
const generateLocalGangDescription = (t: TFunction, gang: Gang): string => {
    const {
        name,
        type,
        cyberwareQuality,
        skill,
        weapons,
        armor,
        secretive,
        status,
        color,
        sin,
        knownFor,
        flaw,
        currentAttitude,
        newsTheLeaderIsReceiving,
    } = gang

    // Choose a description pattern randomly based on gang type
    const descriptionPattern = getRandomInt(1, 6)

    // Element variables for description building
    let identityDesc = ''
    let appearanceDesc = ''
    let reputationDesc = ''
    let activityDesc = ''
    let strengthDesc = ''
    let weaknessDesc = ''
    let newsDesc = ''
    let atmosphereDesc = ''
    let secretiveDesc = ''

    // Generate identity description based on gang type
    switch (type) {
        case GangType.BOOSTER:
            identityDesc = getRandomElement([
                `${name} is a notorious boostergang that ${t('gangs.description.boosterIdentity')}`,
                `Known as ${name}, this boostergang ${t('gangs.description.boosterIdentityAlt')}`,
                `The streets whisper of ${name}, a boostergang that ${t('gangs.description.boosterIdentityAlt2')}`,
            ])
            break
        case GangType.POSER:
            identityDesc = getRandomElement([
                `${name} is a flashy posergang that ${t('gangs.description.poserIdentity')}`,
                `The posers of ${name} ${t('gangs.description.poserIdentityAlt')}`,
                `Styled as ${name}, this posergang ${t('gangs.description.poserIdentityAlt2')}`,
            ])
            break
        case GangType.SYNDICATE:
            identityDesc = getRandomElement([
                `${name} operates as a syndicate that ${t('gangs.description.syndicateIdentity')}`,
                `The syndicate known as ${name} ${t('gangs.description.syndicateIdentityAlt')}`,
                `${name} is a well-structured syndicate that ${t('gangs.description.syndicateIdentityAlt2')}`,
            ])
            break
        case GangType.FREELANCER:
            identityDesc = getRandomElement([
                `${name} is a group of freelancers who ${t('gangs.description.freelancerIdentity')}`,
                `The freelancers of ${name} ${t('gangs.description.freelancerIdentityAlt')}`,
                `Operating as ${name}, these freelancers ${t('gangs.description.freelancerIdentityAlt2')}`,
            ])
            break
        case GangType.MILITARY:
            identityDesc = getRandomElement([
                `${name} is a militaristic gang that ${t('gangs.description.militaryIdentity')}`,
                `The paramilitary group ${name} ${t('gangs.description.militaryIdentityAlt')}`,
                `${name} runs operations like a military unit, ${t('gangs.description.militaryIdentityAlt2')}`,
            ])
            break
        default:
            identityDesc = `${name} ${t('gangs.description.defaultIdentity')}`
    }

    // Generate appearance description
    let cyberwareDesc = ''
    switch (cyberwareQuality) {
        case CyberwareQuality.POOR:
            cyberwareDesc = getRandomElement([
                t('gangs.description.poorCyberware'),
                t('gangs.description.poorCyberwareAlt'),
                t('gangs.description.poorCyberwareAlt2'),
            ])
            break
        case CyberwareQuality.STANDARD:
            cyberwareDesc = getRandomElement([
                t('gangs.description.standardCyberware'),
                t('gangs.description.standardCyberwareAlt'),
                t('gangs.description.standardCyberwareAlt2'),
            ])
            break
        case CyberwareQuality.EXCELLENT:
            cyberwareDesc = getRandomElement([
                t('gangs.description.excellentCyberware'),
                t('gangs.description.excellentCyberwareAlt'),
                t('gangs.description.excellentCyberwareAlt2'),
            ])
            break
    }

    const skillDesc =
        skill <= 10
            ? getRandomElement([
                  t('gangs.description.inexperiencedSkill'),
                  t('gangs.description.inexperiencedSkillAlt'),
                  t('gangs.description.inexperiencedSkillAlt2'),
              ])
            : skill <= 14
            ? getRandomElement([
                  t('gangs.description.capableSkill'),
                  t('gangs.description.capableSkillAlt'),
                  t('gangs.description.capableSkillAlt2'),
              ])
            : getRandomElement([
                  t('gangs.description.highlySkillSkill'),
                  t('gangs.description.highlySkillSkillAlt'),
                  t('gangs.description.highlySkillSkillAlt2'),
              ])

    const armorDesc =
        armor.spb <= 4 && armor.h <= 4
            ? getRandomElement([
                  t('gangs.description.minimalArmor'),
                  t('gangs.description.minimalArmorAlt'),
                  t('gangs.description.minimalArmorAlt2'),
              ])
            : armor.spb >= 13 || armor.h >= 13
            ? getRandomElement([
                  t('gangs.description.heavyArmor'),
                  t('gangs.description.heavyArmorAlt'),
                  t('gangs.description.heavyArmorAlt2'),
              ])
            : getRandomElement([
                  t('gangs.description.moderateArmor'),
                  t('gangs.description.moderateArmorAlt'),
                  t('gangs.description.moderateArmorAlt2'),
              ])

    const weaponPower = weapons?.d6 || 0
    const weaponDesc =
        weaponPower <= 2
            ? t('gangs.description.lightlyArmed')
            : weaponPower <= 5
            ? t('gangs.description.wellArmed')
            : t('gangs.description.heavilyArmed')

    // Generate secretive description based on the secretive value
    if (secretive) {
        // Higher values indicate more secretive gangs
        if (secretive >= 20) {
            secretiveDesc = getRandomElement([
                t('gangs.description.highlySecretive'),
                t('gangs.description.extremelySecretive'),
                t('gangs.description.paranoidSecrecy'),
            ])
        } else if (secretive >= 15) {
            secretiveDesc = getRandomElement([
                t('gangs.description.verySecretive'),
                t('gangs.description.carefullyGuarded'),
                t('gangs.description.wellHidden'),
            ])
        } else if (secretive >= 10) {
            secretiveDesc = getRandomElement([
                t('gangs.description.moderatelySecretive'),
                t('gangs.description.cautious'),
                t('gangs.description.discreet'),
            ])
        } else {
            secretiveDesc = getRandomElement([
                t('gangs.description.minimallySecretive'),
                t('gangs.description.somewhatOpen'),
                t('gangs.description.barelyHidden'),
            ])
        }
    }

    // Build appearance description with different patterns
    const appearancePatterns = [
        // Pattern 1: General appearance first, then specific details
        `${t('gangs.description.appearanceGeneral', { skillDesc })} ${cyberwareDesc} ${armorDesc}`,
        // Pattern 2: Focus on weapons and armor first
        `${weaponDesc} ${armorDesc} ${cyberwareDesc}`,
        // Pattern 3: Focus on skill and cybernetics
        `${t('gangs.description.appearanceSkill', { skillDesc, cyberwareDesc })}`,
    ]

    appearanceDesc = getRandomElement(appearancePatterns)

    // Add color information if present
    if (color) {
        const colorPatterns = [
            t('gangs.description.color', { color: t(`gangs.color.${color}`) }),
            t('gangs.description.colorAlt', { color: t(`gangs.color.${color}`) }),
            t('gangs.description.colorAlt2', { color: t(`gangs.color.${color}`) }),
        ]
        appearanceDesc += getRandomElement(colorPatterns)
    }

    // Build reputation section with different patterns
    const statusDesc = t(`gangs.status.${status}`).toLowerCase()
    const reputationPatterns = [
        t('gangs.description.reputation', { status: statusDesc }),
        t('gangs.description.reputationAlt', { status: statusDesc }),
        t('gangs.description.reputationAlt2', { status: statusDesc }),
    ]

    reputationDesc = getRandomElement(reputationPatterns)

    // Add known for info with varying patterns
    if (knownFor.knownForPart1 && knownFor.knownForPart2) {
        const knownForPart1Text = t(`gangs.knownForPart1.${knownFor.knownForPart1}`).toLowerCase()
        const knownForPart2Text = t(`gangs.knownForPart2.${knownFor.knownForPart2}`).toLowerCase()

        const knownForPatterns = [
            t('gangs.description.knownFor', { knownForPart1: knownForPart1Text, knownForPart2: knownForPart2Text }),
            t('gangs.description.knownForAlt', { knownForPart1: knownForPart1Text, knownForPart2: knownForPart2Text }),
            t('gangs.description.knownForEmphasis', {
                knownForPart1: knownForPart1Text,
                knownForPart2: knownForPart2Text,
            }),
        ]

        reputationDesc += getRandomElement(knownForPatterns)
    }

    // Add sin information if present
    if (sin && sin !== Sin.NONE) {
        const sinText = t(`gangs.sin.${sin}`).toLowerCase()
        const sinPatterns = [
            t('gangs.description.sin', { sin: sinText }),
            t('gangs.description.sinAlt', { sin: sinText }),
            t('gangs.description.sinEmphasis', { sin: sinText }),
        ]

        reputationDesc += getRandomElement(sinPatterns)
    }

    // Add flaw information if present
    if (flaw && flaw !== Flaw.NONE) {
        const flawText = t(`gangs.flaw.${flaw}`).toLowerCase()
        weaknessDesc = getRandomElement([
            t('gangs.description.flaw', { flaw: flawText }),
            t('gangs.description.flawAlt', { flaw: flawText }),
            t('gangs.description.flawHidden', { flaw: flawText }),
        ])
    }

    // Build current activities section
    if (currentAttitude && currentAttitude !== Attitude.NONE) {
        const attitudeText = t(`gangs.attitude.${currentAttitude}`).toLowerCase()
        activityDesc = getRandomElement([
            t('gangs.description.currentAttitude', { attitude: attitudeText }),
            t('gangs.description.currentAttitudeAlt', { attitude: attitudeText }),
            t('gangs.description.currentAttitudeRumor', { attitude: attitudeText }),
        ])
    }

    // Add news if present
    if (newsTheLeaderIsReceiving && newsTheLeaderIsReceiving !== GangNews.NONE) {
        const newsText = t(`gangs.news.${newsTheLeaderIsReceiving}`).toLowerCase()
        newsDesc = getRandomElement([
            t('gangs.description.news', { news: newsText }),
            t('gangs.description.newsUrgent', { news: newsText }),
            t('gangs.description.newsRumor', { news: newsText }),
        ])
    }

    // Generate random atmospheric details based on gang type and status
    const atmosphereOptions = [
        t('gangs.atmosphere.feared'),
        t('gangs.atmosphere.respected'),
        t('gangs.atmosphere.infamous'),
        t('gangs.atmosphere.mysterious'),
        t('gangs.atmosphere.volatile'),
    ]
    atmosphereDesc = getRandomElement(atmosphereOptions)

    // Combine elements based on the chosen pattern
    let finalDescription = ''

    switch (descriptionPattern) {
        case 1: // Traditional pattern: identity, appearance, reputation, current state
            finalDescription = `${identityDesc} ${appearanceDesc} ${
                secretiveDesc ? secretiveDesc + ' ' : ''
            }${reputationDesc}${weaknessDesc ? ' ' + weaknessDesc : ''}. ${activityDesc ? activityDesc : ''}${
                newsDesc ? ' ' + newsDesc : ''
            }`
            break

        case 2: // Start with reputation, then identity and appearance
            finalDescription = `${reputationDesc} ${identityDesc} ${appearanceDesc} ${
                secretiveDesc ? secretiveDesc + ' ' : ''
            }${weaknessDesc ? ' ' + weaknessDesc : ''}. ${activityDesc ? activityDesc : ''}${
                newsDesc ? ' ' + newsDesc : ''
            }`
            break

        case 3: // Start with current activity, then identity and details
            if (activityDesc || newsDesc) {
                finalDescription = `${activityDesc ? activityDesc : ''}${
                    newsDesc ? ' ' + newsDesc : ''
                } ${identityDesc} ${appearanceDesc} ${secretiveDesc ? secretiveDesc + ' ' : ''}${reputationDesc}${
                    weaknessDesc ? ' ' + weaknessDesc : ''
                }.`
            } else {
                // Fall back to traditional pattern if no activity/news
                finalDescription = `${identityDesc} ${appearanceDesc} ${
                    secretiveDesc ? secretiveDesc + ' ' : ''
                }${reputationDesc}${weaknessDesc ? ' ' + weaknessDesc : ''}.`
            }
            break

        case 4: // Atmospheric opening
            finalDescription = `${atmosphereDesc} ${identityDesc} ${
                secretiveDesc ? secretiveDesc + ' ' : ''
            }${appearanceDesc} ${reputationDesc}${weaknessDesc ? ' ' + weaknessDesc : ''}. ${
                activityDesc ? activityDesc : ''
            }${newsDesc ? ' ' + newsDesc : ''}`
            break

        case 5: // Focus on strengths and weaknesses, including secretiveness
            strengthDesc = `They are known for their ${skillDesc
                .replace(/They are |They have /g, '')
                .trim()} and ${cyberwareDesc.replace(/They sport |They use |They have /g, '').trim()}.`
            finalDescription = `${identityDesc} ${strengthDesc} ${secretiveDesc ? secretiveDesc + ' ' : ''}${
                weaknessDesc ? weaknessDesc + ' ' : ''
            }${reputationDesc} ${activityDesc ? activityDesc : ''}${newsDesc ? ' ' + newsDesc : ''}`
            break

        case 6: // Lead with secretiveness if it's a highly secretive gang
            if (secretive && secretive >= 15) {
                finalDescription = `${secretiveDesc} ${identityDesc} ${appearanceDesc} ${reputationDesc}${
                    weaknessDesc ? ' ' + weaknessDesc : ''
                }. ${activityDesc ? activityDesc : ''}${newsDesc ? ' ' + newsDesc : ''}`
            } else {
                finalDescription = `${identityDesc} ${appearanceDesc} ${
                    secretiveDesc ? secretiveDesc + ' ' : ''
                }${reputationDesc}. ${activityDesc ? activityDesc : ''}${newsDesc ? ' ' + newsDesc : ''}`
            }
            break

        default: // Default to simplest pattern
            finalDescription = `${identityDesc} ${appearanceDesc} ${
                secretiveDesc ? secretiveDesc + ' ' : ''
            }${reputationDesc}. ${activityDesc ? activityDesc : ''}${newsDesc ? ' ' + newsDesc : ''}`
    }

    // Clean up extra spaces and fix sentence structure
    finalDescription = finalDescription
        .replace(/\s+/g, ' ')
        .replace(/\.\s+\./g, '.')
        .replace(/\s+\./g, '.')
        .replace(/\.\s*$/g, '.') // Ensure description ends with a period
        .trim()

    if (!finalDescription.endsWith('.')) {
        finalDescription += '.'
    }

    return finalDescription
}
