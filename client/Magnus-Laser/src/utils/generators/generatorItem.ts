import { TFunction } from 'i18next'
import { v4 as uuidv4 } from 'uuid'
import { Item, ItemCondition, ItemType } from '../../graphql/types'
import { blobToBase64, generateAIItemName, generateImageWithFallback } from '../apiUtils'
import { getRandomElement, getRandomInt } from '../functions'
import {
    corpoPrefixes, // Import personNames
    surnames,
} from './constantsGenerators'

// Shared lists for weapon name generation and themed suffixes
const WEAPON_ADJECTIVES = ['Neon', 'Chrome', 'Cyber', 'Plasma', 'Quantum', 'Hyper', 'Vapor']
const WEAPON_NOUNS = [
    'Medium Pistol',
    'Heavy Pistol',
    'Very Heavy Pistol',
    'Submachine Gun',
    'Heavy Submachine Gun',
    'Shotgun',
    'Assault Rifle',
    'Sniper Rifle',
    'Bow and Crossbow',
    'Grenade Launcher',
    'Rocket Launcher',
    'Light Melee Weapon',
    'Medium Melee Weapon',
    'Heavy Melee Weapon',
    'Very Heavy Melee Weapon',
    'Thrown Weapon',
]
const ITEM_NAME_THEMED_SUFFIXES = ['Mk.I', 'Mk.II', 'Series X', 'Prototype', 'Alpha', 'Omega', 'V1', 'V2']

/**
 * Generates a random Item.
 */
export const generateRandomItem = async (t: TFunction): Promise<Item> => {
    const itemType = getRandomElement(Object.values(ItemType))
    const itemCondition = getRandomElement(Object.values(ItemCondition))
    const itemName = await generateRandomItemNameWithFallback(t, itemType, itemCondition)
    try {
        const itemBlob = await generateImageWithFallback(itemName, itemType, undefined, 'Item')
        const itemImage = itemBlob ? await blobToBase64(itemBlob) : ''
        return {
            ID: uuidv4(),
            name: itemName,
            type: itemType,
            condition: itemCondition,
            image: itemImage,
        }
    } catch (error) {
        console.warn('Error generating item image:', error)
        return {
            ID: uuidv4(),
            name: itemName,
            type: itemType,
            condition: itemCondition,
            image: '',
        }
    }
}
/**
 * Generates a item name with fallback
 */
const generateRandomItemNameWithFallback = async (
    t: TFunction,
    itemType: ItemType,
    itemCondition: ItemCondition
): Promise<string> => {
    try {
        const aiName = await generateAIItemName(itemType, itemCondition, t)
        if (aiName) {
            return aiName
        }
    } catch (error) {
        console.warn('AI item name generation failed, using local fallback:', error)
    }
    // Fallback to local generation if AI fails or returns null
    return generateLocalRandomItemName(itemType)
}
/**
 * Generates a flashy cyberpunk-styled item name based on the item type.
 * Uses corpoPrefixes and surnames to add extra variety.
 */
const generateLocalRandomItemName = (itemType: ItemType): string => {
    switch (itemType) {
        case ItemType.MONEY:
            return `CredStack ${getRandomInt(100, 1000)}`
        case ItemType.WEAPONS: {
            // Use shared constants
            let name = `${getRandomElement(WEAPON_ADJECTIVES)} ${getRandomElement(WEAPON_NOUNS)} ${getRandomInt(
                100,
                999
            )}`
            const chance = Math.random()
            // 40% corporate prefix, next 20% 'by' suffix
            if (chance < 0.4) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            } else if (chance < 0.6) {
                name = `${name} by ${getRandomElement(surnames)}`
            }
            // 20% themed suffix
            if (Math.random() < 0.2) {
                name = `${name} ${getRandomElement(ITEM_NAME_THEMED_SUFFIXES)}`
            }
            return name
        }
        case ItemType.BIOLOGICAL_SAMPLES: {
            const adjectives = ['Mutant', 'Viral', 'Genomic', 'BioHack', 'Neuro', 'Synth']
            const nouns = ['Serum', 'Extract', 'Specimen', 'Culture', 'Splice']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(1, 1000)}`
        }
        case ItemType.DRUGS_ILLEGAL_CONTRABAND: {
            const adjectives = ['Synth', 'Neuro', 'Digital', 'Cyber', 'Vapor', 'Electric']
            const nouns = ['Stims', 'Narcotics', 'Bliss', 'Boost', 'Splice']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(1, 500)}`
        }
        case ItemType.CYBERWARE: {
            const adjectives = ['Neon', 'Chrome', 'Quantum', 'Cyber', 'Augmented', 'Hyper']
            const nouns = ['Uplink', 'Cortex', 'Optic Enhancement', 'Neural Interface', 'Arm Upgrade']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(1, 50)}`
            if (Math.random() < 0.4) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            }
            return name
        }
        case ItemType.DIGITAL_FILES: {
            const adjectives = ['Encrypted', 'Classified', 'Quantum', 'Cyber', 'Nano', 'Holo']
            const nouns = ['Data Packet', 'Fragment', 'Download', 'Schematic', 'Hack']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
            if (Math.random() < 0.3) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            }
            return name
        }
        case ItemType.FOOD_FUELS_SUPPLIES: {
            const adjectives = ['Synth', 'Nano', 'Cyber', 'Quantum', 'Pulse']
            const nouns = ['Rations', 'Fuel Cells', 'Med Kits', 'Ammunition', 'Supplies']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
        }
        case ItemType.VEHICLE: {
            const adjectives = ['Neo', 'Cyber', 'Chrome', 'Hyper', 'Quantum']
            const nouns = ['Runner', 'Skimmer', 'Hoverbike', 'Interceptor', 'Shadow']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
            if (Math.random() < 0.3) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            }
            return name
        }
        case ItemType.EXOTIC_ANIMAL: {
            const adjectives = ['Augmented', 'Mutant', 'Cybernetic', 'Neon']
            const nouns = [
                'Guacamayo',
                'Caracal',
                'Arapaima',
                'Capibara',
                'Suricata',
                'Quetzal',
                'Barracuda',
                'Tapir',
                'Marabú',
                'Coatí',
                'Iguana',
                'Jacana',
                'Colibrí',
                'Manatí',
                'Agutí',
                'Axolotl',
                'Pecarí',
                'Morrocoy',
                'Oropéndola',
                'Ñandú',
            ]
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
        }
        case ItemType.AI_ROBOT_DRONE: {
            const adjectives = ['Sentient', 'Cyber', 'Quantum', 'Holo', 'Neon']
            const nouns = ['Drone', 'Scout', 'Spider', 'Reaper']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
        }
        default:
            return `Artifact ${getRandomInt(100, 999)}${
                Math.random() < 0.3 ? ` ${getRandomElement(ITEM_NAME_THEMED_SUFFIXES)}` : ''
            }`
    }
}
