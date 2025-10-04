import { v4 as uuidv4 } from 'uuid'
import {
    Bounty,
    BountyRep,
    BountyStatus,
    BribeCrime,
    BribeTarget,
    Character,
    ContrabandCrime,
    ContrabandTarget,
    CrimeType,
    DrugCrime,
    DrugTarget,
    Maybe,
    MurderCrime,
    MurderTarget,
    TheftCrime,
    TheftTarget,
} from '../../graphql/types'
import { getRandomElement, getRandomInt } from '../functions'
import { generateRandomCharacter } from './generatorCharacter'

/**
 * Generates a random Bounty.
 * @param t - The translation function
 * @param characters - Array of existing Character objects
 * @param bounty - The bounty object with the desired properties
 * @param presetCharacter - Optional preset character for bounty.
 * @param preferExistingCharacter - Optional flag to prefer existing characters.
 * @returns A bounty object and a character object
 */
export const generateRandomBounty = async (
    bounties: Bounty[],
    characters: Character[],
    presetBounty?: Partial<Bounty>,
    presetCharacter?: Character,
    preferExistingCharacter?: boolean
): Promise<{ newBounty: Bounty; newCharacter: Maybe<Character> }> => {
    // Things to generate
    // - Speciality
    // - Character (if not preset) and make sure they are not already in a bounty
    // - Rep
    // - Initial Crime

    const speciality = getRandomElement(Object.values(CrimeType))

    let newCharacter: Maybe<Character> = undefined
    let bountyCharacter: Character = getRandomElement(characters)
    const charactersInBounties = bounties.map((b) => b.character.ID)
    if (presetCharacter) {
        bountyCharacter = presetCharacter
    } else if (
        !preferExistingCharacter ||
        characters.length === 0 ||
        charactersInBounties.length === characters.length
    ) {
        bountyCharacter = await generateRandomCharacter()
        newCharacter = bountyCharacter
    } else {
        while (charactersInBounties.includes(bountyCharacter.ID)) {
            bountyCharacter = getRandomElement(characters)
        }
    }

    const rep = presetBounty?.rep || getRandomElement(Object.values(BountyRep))

    // Initial crime is always the speciality
    const initialCrime = generateRandomCrime(speciality, rep, speciality)

    const newBounty: Bounty = {
        ID: uuidv4(),
        character: bountyCharacter,
        rep,
        crimes: [initialCrime],
        speciality,
        status: BountyStatus.ACTIVE,
        ...presetBounty,
    }

    return { newBounty, newCharacter }
}

/**
 * Generates a random target for a crime.
 * @param crimeType - The type of crime
 * @param rewardMultiplier - The reward multiplier
 * @returns An object with the target, multiplier and reward
 */
export const getTarget = (crimeType: CrimeType, rewardMultiplier: number) => {
    const targetRoll = getRandomInt(1, 10)

    if (crimeType === CrimeType.THEFT) {
        switch (targetRoll) {
            case 1:
            case 2:
            case 3:
                return { target: TheftTarget.POOR_SOUL, multiplier: 1, reward: 50 * rewardMultiplier }
            case 4:
            case 5:
                return { target: TheftTarget.VENDIT, multiplier: 1, reward: 100 * rewardMultiplier }
            case 6:
            case 7:
                return { target: TheftTarget.OASIS, multiplier: 1, reward: 200 * rewardMultiplier }
            case 8:
                return { target: TheftTarget.PUBLIC_ELEMENT, multiplier: 1, reward: 350 * rewardMultiplier }
            case 9:
                return { target: TheftTarget.MINI_CORP, multiplier: 1, reward: 500 * rewardMultiplier }
            case 10:
                return { target: TheftTarget.MEGA_CORP, multiplier: 1, reward: 1000 * rewardMultiplier }
        }
    } else if (crimeType === CrimeType.MURDER) {
        const multiplier = getRandomInt(1, 10)
        switch (targetRoll) {
            case 1:
            case 2:
            case 3:
                return {
                    target: MurderTarget.GANGER,
                    multiplier: Math.max(multiplier - 5, 1),
                    reward: 20 * rewardMultiplier,
                }
            case 4:
            case 5:
                return {
                    target: MurderTarget.CITIZEN,
                    multiplier: Math.max(multiplier - 6, 1),
                    reward: 100 * rewardMultiplier,
                }
            case 6:
            case 7:
                return {
                    target: MurderTarget.CORPO,
                    multiplier: Math.max(multiplier - 6, 1),
                    reward: 200 * rewardMultiplier,
                }
            case 8:
                return {
                    target: MurderTarget.COP,
                    multiplier: Math.max(multiplier - 8, 1),
                    reward: 500 * rewardMultiplier,
                }
            case 9:
                return {
                    target: MurderTarget.EXEC,
                    multiplier: Math.max(multiplier - 8, 1),
                    reward: 700 * rewardMultiplier,
                }
            case 10:
                return {
                    target: MurderTarget.POLITICIAN,
                    multiplier: Math.max(multiplier - 9, 1),
                    reward: 1000 * rewardMultiplier,
                }
        }
    } else if (crimeType === CrimeType.CONTRABAND) {
        switch (targetRoll) {
            case 1:
            case 2:
            case 3:
                return { target: ContrabandTarget.COSTLY, multiplier: 1, reward: 50 * rewardMultiplier }
            case 4:
            case 5:
                return { target: ContrabandTarget.PREMIUM, multiplier: 1, reward: 100 * rewardMultiplier }
            case 6:
            case 7:
                return { target: ContrabandTarget.EXPENSIVE, multiplier: 1, reward: 200 * rewardMultiplier }
            case 8:
                return { target: ContrabandTarget.VERY_EXPENSIVE, multiplier: 1, reward: 400 * rewardMultiplier }
            case 9:
                return { target: ContrabandTarget.LUXURY, multiplier: 1, reward: 2000 * rewardMultiplier }
            case 10:
                return { target: ContrabandTarget.SUPER_LUXURY, multiplier: 1, reward: 4000 * rewardMultiplier }
        }
    } else if (crimeType === CrimeType.DRUG) {
        const multiplier = getRandomInt(1, 100)
        switch (targetRoll) {
            case 1:
            case 2:
            case 3:
                return { target: DrugTarget.SMASH, multiplier: multiplier, reward: 10 * rewardMultiplier }
            case 4:
            case 5:
                return { target: DrugTarget.STIM, multiplier: multiplier, reward: 10 * rewardMultiplier }
            case 6:
            case 7:
                return { target: DrugTarget.BLUE_GLASS, multiplier: multiplier, reward: 20 * rewardMultiplier }
            case 8:
                return { target: DrugTarget.SYNTHCOKE, multiplier: multiplier, reward: 20 * rewardMultiplier }
            case 9:
                return { target: DrugTarget.BOOST, multiplier: multiplier, reward: 50 * rewardMultiplier }
            case 10:
                return { target: DrugTarget.BLACK_LACE, multiplier: multiplier, reward: 50 * rewardMultiplier }
        }
    } else if (crimeType === CrimeType.BRIBE) {
        switch (targetRoll) {
            case 1:
            case 2:
            case 3:
                return { target: BribeTarget.GANGER, multiplier: 1, reward: 20 * rewardMultiplier }
            case 4:
            case 5:
                return { target: BribeTarget.CITIZEN, multiplier: 1, reward: 100 * rewardMultiplier }
            case 6:
            case 7:
                return { target: BribeTarget.CORPO, multiplier: 1, reward: 200 * rewardMultiplier }
            case 8:
                return { target: BribeTarget.COP, multiplier: 1, reward: 500 * rewardMultiplier }
            case 9:
                return { target: BribeTarget.EXEC, multiplier: 1, reward: 700 * rewardMultiplier }
            case 10:
                return { target: BribeTarget.POLITICIAN, multiplier: 1, reward: 1000 * rewardMultiplier }
        }
    }
    return { target: MurderTarget.CITIZEN, multiplier: 1, reward: 0 }
}

/**
 * Generates a random crime for a bounty.
 * @param speciality - The type of crime
 * @param rep - The rep of the bounty
 * @param presetCrimeType - Optional preset crime type
 * @returns A crime
 */
export const generateRandomCrime = (speciality: CrimeType, rep: BountyRep, presetCrimeType?: CrimeType) => {
    const crimeType = presetCrimeType || getRandomElement(Object.values(CrimeType))
    const isSpeciality = crimeType === speciality
    let rewardMultiplier = 1
    if (isSpeciality) {
        if (rep === BountyRep.BRAGGER) {
            rewardMultiplier = 2
        } else if (rep === BountyRep.LOWPRO) {
            rewardMultiplier = 0.5
        }
    }
    if (crimeType === CrimeType.THEFT) {
        const target = getTarget(CrimeType.THEFT, rewardMultiplier)
        return {
            crimeType,
            ...target,
        } as TheftCrime
    } else if (crimeType === CrimeType.MURDER) {
        const target = getTarget(CrimeType.MURDER, rewardMultiplier)
        return {
            crimeType,
            ...target,
        } as MurderCrime
    } else if (crimeType === CrimeType.CONTRABAND) {
        const target = getTarget(CrimeType.CONTRABAND, rewardMultiplier)
        return {
            crimeType,
            ...target,
        } as ContrabandCrime
    } else if (crimeType === CrimeType.DRUG) {
        const target = getTarget(CrimeType.DRUG, rewardMultiplier)
        return {
            crimeType,
            ...target,
        } as DrugCrime
    } else if (crimeType === CrimeType.BRIBE) {
        const target = getTarget(CrimeType.BRIBE, rewardMultiplier)
        return {
            crimeType,
            ...target,
        } as BribeCrime
    } else {
        throw new Error('Invalid crime type')
    }
}

export const baseBountyRewardPerSpeciality = {
    [CrimeType.THEFT]: 1000,
    [CrimeType.MURDER]: 1000,
    [CrimeType.CONTRABAND]: 4000,
    [CrimeType.DRUG]: 5000,
    [CrimeType.BRIBE]: 1000,
}
