import { v4 as uuidv4 } from 'uuid'
import { Character, CharacterAttitude, CharacterType } from '../../graphql/types'
import { blobToBase64, generateImageWithFallback } from '../apiUtils'
import { getRandomElement } from '../functions'
import {
    personNames, // Import personNames
    surnames,
} from './constantsGenerators'

/**
 * Generates a random Character.
 */
export const generateRandomCharacter = async (): Promise<Character> => {
    const characterType = getRandomElement(Object.values(CharacterType))
    const characterName = `${getRandomElement(personNames)} ${getRandomElement(surnames)}`
    const characterAttitude = getRandomElement(Object.values(CharacterAttitude))
    try {
        const characterBlob = await generateImageWithFallback(characterName, characterType, undefined, 'Character')
        const characterImage = characterBlob ? await blobToBase64(characterBlob) : ''
        return {
            ID: uuidv4(),
            name: characterName,
            type: characterType,
            attitude: characterAttitude,
            image: characterImage,
        }
    } catch (error) {
        console.warn('Error generating character image:', error)
        return {
            ID: uuidv4(),
            name: characterName,
            type: characterType,
            attitude: characterAttitude,
            image: '',
        }
    }
}
