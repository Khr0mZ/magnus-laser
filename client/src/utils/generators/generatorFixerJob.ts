import { TFunction } from 'i18next'
import { v4 as uuidv4 } from 'uuid'
import {
    Building,
    FixerJob,
    Gang,
    GangNameType,
    JobDifficulty,
    Plot, // The complete plot object (includes verb, place, subject, complication)
    PlotCharacter,
    PlotCharacterAttitude,
    PlotCharacterType,
    PlotCharacterVerb,
    PlotComplication,
    PlotComplicationType,
    PlotGang,
    PlotGangComplicationType,
    PlotGangVerb,
    PlotItem,
    PlotItemCondition,
    PlotItemType,
    PlotItemVerb,
    PlotPlaceComplicationType,
    PlotPlaceVerb,
    PlotVerb,
} from '../../graphql/types'
import { blobToBase64, generateHuggingFaceImage, generateHuggingFaceText } from '../apiUtils'
import { ModuleTypes } from '../constants'
import { getJobDifficultyModifier, getRandomElement, getRandomInt } from '../functions'
import { generateRandomBuilding } from '../generators/generatorBuilding'
import { generateRandomGang } from '../generators/generatorGang'
import {
    corpoPrefixes,
    gangNameCategories, // Import corpoPrefixes
    personNames, // Import personNames
    surnames, // Import surnames
    TextGenerationType,
} from './constantsGenerators'

// Define a union type for all verb enums.
type VerbUnion = PlotCharacterVerb | PlotItemVerb | PlotGangVerb | PlotPlaceVerb

// Options interface for whether to use existing building/gang data.
interface GeneratorOptions {
    preferExistingBuilding?: boolean
    preferExistingGang?: boolean
    jobDifficulty?: JobDifficulty
}

/**
 * Type guards to narrow VerbUnion.
 */
function isCharacterVerb(verb: VerbUnion): verb is PlotCharacterVerb {
    return (Object.values(PlotCharacterVerb) as string[]).includes(verb as string)
}
function isItemVerb(verb: VerbUnion): verb is PlotItemVerb {
    return (Object.values(PlotItemVerb) as string[]).includes(verb as string)
}
function isGangVerb(verb: VerbUnion): verb is PlotGangVerb {
    return (Object.values(PlotGangVerb) as string[]).includes(verb as string)
}
function isPlaceVerb(verb: VerbUnion): verb is PlotPlaceVerb {
    return (Object.values(PlotPlaceVerb) as string[]).includes(verb as string)
}

/**
 * Generates a random PlotCharacter.
 */
const generateRandomCharacter = (): PlotCharacter => ({
    name: `${getRandomElement(personNames)} ${getRandomElement(surnames)}`,
    type: getRandomElement(Object.values(PlotCharacterType)),
    attitude: getRandomElement(Object.values(PlotCharacterAttitude)),
    image: '', // Placeholder for future image generation
})

/**
 * Generates a flashy cyberpunk-styled item name based on the item type.
 * Uses corpoPrefixes and surnames to add extra variety.
 */
const generateRandomItemName = (itemType: PlotItemType): string => {
    switch (itemType) {
        case PlotItemType.MONEY:
            return `CredStack ${getRandomInt(10, 99)}`
        case PlotItemType.WEAPONS: {
            const adjectives = ['Neon', 'Chrome', 'Cyber', 'Plasma', 'Quantum', 'Hyper', 'Vapor']
            const nouns = ['Pulse Rifle', 'Blade', 'Laser Rifle', 'Railgun', 'Disruptor', 'Cannon', 'Fury']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(100, 999)}`
            const chance = Math.random()
            if (chance < 0.3) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            } else if (chance < 0.5) {
                name = `${name} by ${getRandomElement(surnames)}`
            }
            return name
        }
        case PlotItemType.BIOLOGICAL_SAMPLES: {
            const adjectives = ['Mutant', 'Viral', 'Genomic', 'BioHack', 'Neuro', 'Synth']
            const nouns = ['Serum', 'Extract', 'Specimen', 'Culture', 'Splice']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(1, 1000)}`
        }
        case PlotItemType.DRUGS_ILLEGAL_CONTRABAND: {
            const adjectives = ['Synth', 'Neuro', 'Digital', 'Cyber', 'Vapor', 'Electric']
            const nouns = ['Stims', 'Narcotics', 'Bliss', 'Boost', 'Splice']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(1, 500)}`
        }
        case PlotItemType.CYBERWARE: {
            const adjectives = ['Neon', 'Chrome', 'Quantum', 'Cyber', 'Augmented', 'Hyper']
            const nouns = ['Uplink', 'Cortex', 'Optic Enhancement', 'Neural Interface', 'Arm Upgrade']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)} ${getRandomInt(1, 50)}`
            if (Math.random() < 0.4) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            }
            return name
        }
        case PlotItemType.DIGITAL_FILES: {
            const adjectives = ['Encrypted', 'Classified', 'Quantum', 'Cyber', 'Nano', 'Holo']
            const nouns = ['Data Packet', 'Fragment', 'Download', 'Schematic', 'Hack']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
            if (Math.random() < 0.3) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            }
            return name
        }
        case PlotItemType.FOOD_FUELS_SUPPLIES: {
            const adjectives = ['Synth', 'Nano', 'Cyber', 'Quantum', 'Pulse']
            const nouns = ['Rations', 'Fuel Cells', 'Med Kits', 'Ammunition', 'Supplies']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
        }
        case PlotItemType.VEHICLE: {
            const adjectives = ['Neo', 'Cyber', 'Chrome', 'Hyper', 'Quantum']
            const nouns = ['Runner', 'Skimmer', 'Hoverbike', 'Interceptor', 'Shadow']
            let name = `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
            if (Math.random() < 0.3) {
                name = `${getRandomElement(corpoPrefixes)} ${name}`
            }
            return name
        }
        case PlotItemType.EXOTIC_ANIMAL: {
            const adjectives = ['Augmented', 'Mutant', 'Cybernetic', 'Neon']
            const nouns = ['Viper', 'Beast', 'Hound', 'Stalker']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
        }
        case PlotItemType.AI_ROBOT_DRONE: {
            const adjectives = ['Sentient', 'Cyber', 'Quantum', 'Holo', 'Neon']
            const nouns = ['Drone', 'Scout', 'Spider', 'Reaper']
            return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`
        }
        default:
            return `Artifact ${getRandomInt(100, 999)}`
    }
}

/**
 * Generates a random PlotItem.
 */
const generateRandomItem = (): PlotItem => {
    const itemType = getRandomElement(Object.values(PlotItemType))
    return {
        name: generateRandomItemName(itemType),
        type: itemType,
        condition: getRandomElement(Object.values(PlotItemCondition)),
        image: '',
    }
}

// Define the PlaceComplication type more precisely
interface PlaceComplication {
    type: PlotPlaceComplicationType
    character?: PlotCharacter
    item?: PlotItem
    gang?: PlotGang
}

/**
 * Generates a PlotGang (of type PlotGang) using existing gangs if desired.
 * Uses the imported generateRandomGang function to create a new gang if needed.
 * Returns both the PlotGang and a flag indicating if a new gang was created.
 */
const generatePlotGang = async (
    t: TFunction,
    gangs: Gang[],
    preferExisting: boolean = true
): Promise<{ plotGang: PlotGang; isNewGang: boolean }> => {
    if (preferExisting && gangs.length > 0) {
        const chosenGang = getRandomElement(gangs)
        return {
            plotGang: {
                gang: chosenGang,
                complication: {
                    type: getRandomElement(Object.values(PlotGangComplicationType)),
                    character: Math.random() < 0.5 ? generateRandomCharacter() : undefined,
                    item: Math.random() < 0.5 ? generateRandomItem() : undefined,
                },
            },
            isNewGang: false,
        }
    } else {
        const newGang = await generateRandomGang(t)
        return {
            plotGang: {
                gang: newGang,
                complication: {
                    type: getRandomElement(Object.values(PlotGangComplicationType)),
                    character: Math.random() < 0.5 ? generateRandomCharacter() : undefined,
                    item: Math.random() < 0.5 ? generateRandomItem() : undefined,
                },
            },
            isNewGang: true,
        }
    }
}

/**
 * Generates a random PlotPlace.
 *
 * If a preset building is provided, it will be used as the location.
 * Returns both the place information and a flag indicating if a new building was created.
 */
const generateRandomPlotPlace = async (
    t: TFunction,
    presetBuilding: Building | undefined,
    buildings: Building[],
    gangs: Gang[],
    preferExistingBuilding: boolean = true,
    preferExistingGang: boolean = true,
    jobDifficultyModifier: JobDifficulty = JobDifficulty.TYPICAL
): Promise<{
    place: { building: Building; complication: PlaceComplication }
    isNewBuilding: boolean
    newGang?: Gang
}> => {
    let isNewBuilding = false
    let newGang: Gang | undefined

    const buildingObj =
        presetBuilding ||
        (preferExistingBuilding && buildings.length > 0 ? getRandomElement(buildings) : null) ||
        (await generateRandomBuilding(t, getJobDifficultyModifier(jobDifficultyModifier)))

    // If we generated a new building, mark it
    if (!presetBuilding && (!preferExistingBuilding || buildings.length === 0)) {
        isNewBuilding = true
    }

    // Generate place complication
    let gangResult
    if (Math.random() < 0.5) {
        gangResult = await generatePlotGang(t, gangs, preferExistingGang)
        if (gangResult.isNewGang) {
            newGang = gangResult.plotGang.gang
        }
    }

    const placeComplication: PlaceComplication = {
        type: getRandomElement(Object.values(PlotPlaceComplicationType)),
        character: Math.random() < 0.5 ? generateRandomCharacter() : undefined,
        item: Math.random() < 0.5 ? generateRandomItem() : undefined,
        gang: gangResult ? gangResult.plotGang : undefined,
    }

    return {
        place: {
            building: buildingObj,
            complication: placeComplication,
        },
        isNewBuilding,
        newGang,
    }
}

/**
 * Generates a random PlotComplication.
 * Also returns any newly created gangs.
 */
const generateRandomPlotComplication = async (
    t: TFunction,
    gangs: Gang[],
    preferExistingGang: boolean = true
): Promise<{ complication: PlotComplication; newGang?: Gang }> => {
    const compType = getRandomElement(Object.values(PlotComplicationType))
    let character: PlotCharacter | undefined
    let item: PlotItem | undefined
    let gang: PlotGang | undefined = undefined
    let newGang: Gang | undefined

    if (compType.toString().includes('CHARACTER')) {
        character = generateRandomCharacter()
    }
    if (compType.toString().includes('ITEM')) {
        item = generateRandomItem()
    }
    if (compType.toString().includes('GANG')) {
        const gangResult = await generatePlotGang(t, gangs, preferExistingGang)
        gang = gangResult.plotGang
        if (gangResult.isNewGang) {
            newGang = gangResult.plotGang.gang
        }
    }

    return {
        complication: {
            type: compType,
            character,
            item,
            gang,
        },
        newGang,
    }
}

/**
 * Returns a random verb wrapped in its proper object.
 * Each wrapper includes a __typename field and a value of the corresponding enum type.
 */
const getRandomVerb = (): PlotVerb => {
    const category = getRandomInt(0, 3)
    if (category === 0) {
        return {
            __typename: 'PlotCharacterVerbWrapper',
            value: getRandomElement(Object.values(PlotCharacterVerb)) as PlotCharacterVerb,
        }
    } else if (category === 1) {
        return {
            __typename: 'PlotItemVerbWrapper',
            value: getRandomElement(Object.values(PlotItemVerb)) as PlotItemVerb,
        }
    } else if (category === 2) {
        return {
            __typename: 'PlotGangVerbWrapper',
            value: getRandomElement(Object.values(PlotGangVerb)) as PlotGangVerb,
        }
    } else {
        return {
            __typename: 'PlotPlaceVerbWrapper',
            value: getRandomElement(Object.values(PlotPlaceVerb)) as PlotPlaceVerb,
        }
    }
}

/**
 * Generates a subject for the plot based on the provided verb.
 * Returns a PlotCharacter, PlotItem, or PlotGang as appropriate,
 * along with any newly created gang.
 */
const generateSubjectForVerb = async (
    t: TFunction,
    verbWrapper: PlotVerb,
    gangs: Gang[],
    preferExistingGang: boolean = true
): Promise<{ subject: PlotCharacter | PlotItem | PlotGang | undefined; newGang?: Gang }> => {
    const verbValue = verbWrapper.value
    let newGang: Gang | undefined

    if (isCharacterVerb(verbValue)) {
        return {
            subject: generateRandomCharacter(),
        }
    } else if (isItemVerb(verbValue)) {
        return {
            subject: generateRandomItem(),
        }
    } else if (isGangVerb(verbValue)) {
        const gangResult = await generatePlotGang(t, gangs, preferExistingGang)
        if (gangResult.isNewGang) {
            newGang = gangResult.plotGang.gang
        }
        return {
            subject: gangResult.plotGang,
            newGang,
        }
    } else if (isPlaceVerb(verbValue)) {
        return {
            subject: undefined,
        }
    }
    return {
        subject: undefined,
    }
}

/**
 * Helper function to extract a name from a PlotSubject.
 */
const getSubjectName = (subject: Record<string, unknown>): string => {
    if (!subject) return 'the target'
    if ('name' in subject) return subject.name as string
    if (
        'gang' in subject &&
        subject.gang &&
        typeof subject.gang === 'object' &&
        subject.gang !== null &&
        'name' in subject.gang
    ) {
        return subject.gang.name as string
    }
    return 'the target'
}

/**
 * Improved FixerJob generator with increased narrative detail.
 *
 * @param t - The translation function.
 * @param gangs - Array of existing Gang objects.
 * @param buildings - Array of existing Building objects.
 * @param fixerJob - Optional FixerJob overrides.
 * @param presetBuilding - Optional preset building for PlotPlace.
 * @param options - Optional generator options.
 * @returns A complete FixerJob object along with any newly created gangs and buildings.
 */
export const generateRandomFixerJob = async (
    t: TFunction,
    gangs: Gang[],
    buildings: Building[],
    fixerJob?: Partial<FixerJob>,
    presetBuilding?: Building,
    options?: GeneratorOptions
): Promise<{ fixerJob: FixerJob; newGangs: Gang[]; newBuildings: Building[] }> => {
    const useExistingBuilding = options?.preferExistingBuilding ?? true
    const useExistingGang = options?.preferExistingGang ?? true
    const jobDifficulty = options?.jobDifficulty ?? JobDifficulty.TYPICAL

    // Arrays to collect newly created entities
    const newGangs: Gang[] = []
    const newBuildings: Building[] = []

    const verb = getRandomVerb()

    // Generate plot place
    const plotPlaceResult = await generateRandomPlotPlace(
        t,
        presetBuilding,
        buildings,
        gangs,
        useExistingBuilding,
        useExistingGang,
        jobDifficulty
    )
    const plotPlace = plotPlaceResult.place

    // Add new building if created
    if (plotPlaceResult.isNewBuilding) {
        newBuildings.push(plotPlace.building)
    }

    // Add new gang if created in plot place
    if (plotPlaceResult.newGang) {
        newGangs.push(plotPlaceResult.newGang)
    }

    // Generate complication
    const complicationResult = await generateRandomPlotComplication(t, gangs, useExistingGang)
    const complication = complicationResult.complication

    // Add new gang if created in complication
    if (complicationResult.newGang) {
        newGangs.push(complicationResult.newGang)
    }

    // Generate subject
    const subjectResult = await generateSubjectForVerb(t, verb, gangs, useExistingGang)
    const subjectIfNotPlace = subjectResult.subject

    // Add new gang if created in subject
    if (subjectResult.newGang) {
        newGangs.push(subjectResult.newGang)
    }

    const plot: Plot = {
        verb,
        plotPlace,
        subjectIfNotPlace,
        complication,
    }

    const newFixerJob: FixerJob = {
        ID: uuidv4(),
        name: '',
        description: '',
        plot,
        image: '',
        difficulty: options?.jobDifficulty ?? JobDifficulty.TYPICAL,
        ...fixerJob,
    }

    try {
        const generatedName = await generateHuggingFaceText(
            newFixerJob,
            ModuleTypes.FIXER_JOB,
            t,
            TextGenerationType.NAME
        )
        newFixerJob.name = generatedName || generateLocalFixerJobName(t, newFixerJob)
    } catch (error) {
        console.error('Error generating fixer job name:', error)
        newFixerJob.name = generateLocalFixerJobName(t, newFixerJob)
    }

    try {
        const generatedDesc = await generateHuggingFaceText(
            newFixerJob,
            ModuleTypes.FIXER_JOB,
            t,
            TextGenerationType.DESCRIPTION
        )
        newFixerJob.description = generatedDesc || generateLocalFixerJobDescription(t, newFixerJob)
    } catch (error) {
        console.error('Error generating fixer job description:', error)
        newFixerJob.description = generateLocalFixerJobDescription(t, newFixerJob)
    }

    if (newFixerJob.description) {
        try {
            const imageBlob = await generateHuggingFaceImage(
                newFixerJob.description,
                newFixerJob.name,
                ModuleTypes.FIXER_JOB
            )
            newFixerJob.image = imageBlob ? await blobToBase64(imageBlob) : ''
        } catch (error) {
            console.error('Error generating fixer job image:', error)
            newFixerJob.image = ''
        }
    }

    return {
        fixerJob: newFixerJob,
        newGangs,
        newBuildings,
    }
}

/**
 * Fallback function to generate a more detailed and varied neon-noir styled FixerJob description.
 */
const generateLocalFixerJobDescription = (t: TFunction, fixerJob: FixerJob): string => {
    const { verb, subjectIfNotPlace, plotPlace, complication } = fixerJob.plot
    const building = plotPlace.building

    // --- Translate Core Elements ---
    const translatedVerb = t(`fixerJobs.verb.${verb.value}`)
    const subjectName = subjectIfNotPlace ? getSubjectName(subjectIfNotPlace) : t('fixerJobs.generator.defaultSubject')
    const buildingName = building?.name || t('fixerJobs.generator.unknownBuilding')
    const buildingStyle = building?.style ? t(`buildings.style.${building.style}`) : ''
    const buildingType = building?.type ? t(`buildings.type.${building.type}`) : ''

    // --- Translate Subject Details ---
    let subjectDetails = ''
    if (subjectIfNotPlace) {
        let type = ''
        let detail = ''
        if (subjectIfNotPlace.__typename === 'PlotCharacter') {
            type = t(`fixerJobs.character.${subjectIfNotPlace.type}`)
            detail = t(`fixerJobs.characterAttitude.${subjectIfNotPlace.attitude}`)
            subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectCharDetail']), {
                name: subjectName,
                type,
                attitude: detail,
            })
        } else if (subjectIfNotPlace.__typename === 'PlotItem') {
            type = t(`fixerJobs.item.${subjectIfNotPlace.type}`)
            detail = t(`fixerJobs.itemCondition.${subjectIfNotPlace.condition}`)
            subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectItemDetail']), {
                name: subjectName,
                type,
                condition: detail,
            })
        } else if (subjectIfNotPlace.__typename === 'PlotGang' && subjectIfNotPlace.gang) {
            type = t(`gangs.type.${subjectIfNotPlace.gang.type}`)
            detail = subjectIfNotPlace.complication?.type
                ? t(`fixerJobs.gangComplication.${subjectIfNotPlace.complication.type}`)
                : ''
            subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectGangDetail']), {
                name: subjectName,
                type,
                complication: detail,
            })
        }
    }

    // --- Translate Complication Details ---
    let mainCompDetails = ''
    const mainCompType = complication?.type
    if (mainCompType) {
        const translatedMainComp = t(`fixerJobs.complication.${mainCompType}`)
        let specifics = ''
        if (complication.character)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailChar']), {
                name: complication.character.name,
            })
        else if (complication.item)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailItem']), {
                name: complication.item.name,
            })
        else if (complication.gang?.gang)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailGang']), {
                name: complication.gang.gang.name,
            })
        mainCompDetails = t(
            getRandomElement([
                'fixerJobs.generator.mainComplicationSentenceA',
                'fixerJobs.generator.mainComplicationSentenceB',
            ]),
            { complication: translatedMainComp, specifics }
        )
    }

    // --- Translate Place Complication Details ---
    let placeCompDetails = ''
    const placeCompType = plotPlace.complication?.type
    if (placeCompType) {
        const translatedPlaceComp = t(`fixerJobs.locationComplication.${placeCompType}`)
        let specifics = ''
        if (plotPlace.complication.character)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailChar']), {
                name: plotPlace.complication.character.name,
            })
        else if (plotPlace.complication.item)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailItem']), {
                name: plotPlace.complication.item.name,
            })
        else if (plotPlace.complication.gang?.gang)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailGang']), {
                name: plotPlace.complication.gang.gang.name,
            })
        placeCompDetails = t(
            getRandomElement([
                'fixerJobs.generator.placeComplicationSentenceA',
                'fixerJobs.generator.placeComplicationSentenceB',
            ]),
            { complication: translatedPlaceComp, specifics }
        )
    }

    // --- Build Sentence Components ---
    const objectives = [
        t(getRandomElement(['fixerJobs.generator.objectiveSentence1a', 'fixerJobs.generator.objectiveSentence1b']), {
            verb: translatedVerb,
            subject: subjectName,
        }),
        subjectDetails
            ? t(
                  getRandomElement([
                      'fixerJobs.generator.objectiveSentence2a',
                      'fixerJobs.generator.objectiveSentence2b',
                  ]),
                  { verb: translatedVerb, subjectDetails }
              )
            : '',
    ].filter((s) => s)

    const locations = [
        t(getRandomElement(['fixerJobs.generator.locationSentence1a', 'fixerJobs.generator.locationSentence1b']), {
            building: buildingName,
        }),
        buildingType
            ? t(
                  getRandomElement([
                      'fixerJobs.generator.locationSentence2a',
                      'fixerJobs.generator.locationSentence2b',
                  ]),
                  { building: buildingName, type: buildingType }
              )
            : '',
        buildingStyle
            ? t(
                  getRandomElement([
                      'fixerJobs.generator.locationSentence3a',
                      'fixerJobs.generator.locationSentence3b',
                  ]),
                  { building: buildingName, style: buildingStyle }
              )
            : '',
    ].filter((s) => s)

    const complications = [mainCompDetails, placeCompDetails].filter((s) => s)

    const moods = [
        t(getRandomElement(['fixerJobs.generator.moodSentence1a', 'fixerJobs.generator.moodSentence1b'])),
        t(getRandomElement(['fixerJobs.generator.moodSentence2a', 'fixerJobs.generator.moodSentence2b'])),
        t(getRandomElement(['fixerJobs.generator.moodSentence3a', 'fixerJobs.generator.moodSentence3b'])),
    ]

    const connectors = [
        t('fixerJobs.generator.connPhrase1'),
        t('fixerJobs.generator.connPhrase2'),
        t('fixerJobs.generator.connPhrase3'),
        t('fixerJobs.generator.connPhrase4'),
        t('fixerJobs.generator.connPhrase5'),
        '', // Option for no connector
    ]

    // --- Assemble Description ---
    const descriptionParts: string[] = []
    const structure = getRandomElement(['OLCM', 'LOCM', 'OCLM', 'LOMC']) // Added LOMC variation

    const sentenceMap: { [key: string]: string[] } = {
        O: objectives,
        L: locations,
        C: complications,
        M: moods,
    }

    let firstPart = true
    for (const partKey of structure) {
        const sentences = sentenceMap[partKey]
        if (sentences && sentences.length > 0) {
            let sentence = getRandomElement(sentences)
            // Add connector sometimes before non-first parts
            if (!firstPart && Math.random() > 0.4) {
                const connector = getRandomElement(connectors)
                if (connector) {
                    sentence = `${connector} ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`
                }
            }
            descriptionParts.push(sentence)
            firstPart = false
        }
    }

    // Simple fallback if assembly fails
    if (descriptionParts.length < 2) {
        return (
            `${getRandomElement(objectives)} ${getRandomElement(locations)} ${
                mainCompDetails || placeCompDetails || 'No complications reported.'
            } ${getRandomElement(moods)}`
                .replace(/\s+/g, ' ')
                .trim() + '.'
        )
    }

    return descriptionParts.join(' ').replace(/\s+/g, ' ').replace(/ \./g, '.').trim() // Join selected parts, clean whitespace and punctuation
}

/**
 * Fallback function to generate a neon-noir styled name for a FixerJob.
 * Incorporates more job details for variety.
 */
const generateLocalFixerJobName = (t: TFunction, fixerJob: FixerJob): string => {
    const verbValue = fixerJob.plot.verb.value
    const subject = fixerJob.plot.subjectIfNotPlace
    const location = fixerJob.plot.plotPlace.building
    const complicationType = fixerJob.plot.complication?.type

    // Translate relevant parts
    const translatedVerb = t(`fixerJobs.verb.${verbValue}`)
    let translatedSubjectType = ''
    if (subject) {
        if (subject.__typename === 'PlotCharacter') {
            translatedSubjectType = t(`fixerJobs.character.${subject.type}`)
        } else if (subject.__typename === 'PlotItem') {
            translatedSubjectType = t(`fixerJobs.item.${subject.type}`)
        } else if (subject.__typename === 'PlotGang' && subject.gang) {
            translatedSubjectType = t(`gangs.type.${subject.gang.type}`)
        }
    }
    const translatedLocationStyle = location?.style ? t(`buildings.style.${location.style}`) : ''
    const translatedComplicationType = complicationType ? t(`fixerJobs.complication.${complicationType}`) : ''

    // --- New elements for added complexity ---
    const randomCorpo = getRandomElement(corpoPrefixes)
    const randomSurname = getRandomElement(surnames)
    const randomFirstName = getRandomElement(personNames)
    const relevantGangCategories = [
        GangNameType.WEAPON,
        GangNameType.ANIMAL,
        GangNameType.WEATHER_PHENOMENA,
        GangNameType.ADJECTIVE,
        GangNameType.COLOR,
        GangNameType.BODY_PART,
    ]
    const randomGangCategory = getRandomElement(relevantGangCategories)
    const randomGangWord = getRandomElement(gangNameCategories[randomGangCategory])
    // --- End new elements ---

    // Cyberpunk terms
    const cyberpunkAdjectives = [
        'Neon',
        'Chrome',
        'Quantum',
        'Ghost',
        'Shadow',
        'Data',
        'Zero-Day',
        'Cryo',
        'Bio',
        'Synth',
        'Vapor',
        'Holo',
        'Glitch',
        'Wired',
        'Street',
        'Midnight',
        'Terminal',
        'Digital',
        'Viral',
        'Augmented',
    ]
    const cyberpunkNouns = [
        'Protocol',
        'Gambit',
        'Run',
        'Interface',
        'Network',
        'Heist',
        'Requiem',
        'Algorithm',
        'Matrix',
        'Vector',
        'Echo',
        'Whisper',
        'Signal',
        'Manifest',
        'Directive',
        'Replicant',
        'Construct',
        'Payload',
        'Cipher',
        'Shard',
        'Trace',
    ]

    const randomAdjective = getRandomElement(cyberpunkAdjectives)
    const randomNoun = getRandomElement(cyberpunkNouns)

    const patterns: string[] = []

    // Basic patterns
    patterns.push(t('fixerJobs.generator.namePatternBasic1', { verb: translatedVerb })) // Operation: Verb
    patterns.push(t('fixerJobs.generator.namePatternBasic2', { adjective: randomAdjective, verb: translatedVerb })) // Adj Verb
    patterns.push(t('fixerJobs.generator.namePatternBasic3', { noun: randomNoun, verb: translatedVerb })) // The Noun Verb
    patterns.push(t('fixerJobs.generator.namePatternBasic4', { verb: translatedVerb })) // The Verb Protocol

    // Patterns using subject
    if (translatedSubjectType) {
        patterns.push(
            t('fixerJobs.generator.namePatternSubject1', { verb: translatedVerb, subjectType: translatedSubjectType })
        ) // The SubjectType Verb
        patterns.push(
            t('fixerJobs.generator.namePatternSubject2', { subjectType: translatedSubjectType, noun: randomNoun })
        ) // SubjectType Noun
    }

    // Patterns using location
    if (location?.name) {
        patterns.push(
            t('fixerJobs.generator.namePatternLocation1', { verb: translatedVerb, locationName: location.name })
        ) // The Location Verb
    }
    if (translatedLocationStyle) {
        patterns.push(
            t('fixerJobs.generator.namePatternLocation2', {
                locationStyle: translatedLocationStyle,
                verb: translatedVerb,
            })
        ) // LocationStyle Verb
        patterns.push(
            t('fixerJobs.generator.namePatternLocation3', { locationStyle: translatedLocationStyle, noun: randomNoun })
        ) // LocationStyle Noun
    }

    // Patterns using complication
    if (translatedComplicationType) {
        patterns.push(
            t('fixerJobs.generator.namePatternComplication1', {
                complicationType: translatedComplicationType,
                noun: randomNoun,
            })
        ) // The ComplicationType Noun
    }

    // --- New Complex Patterns ---
    patterns.push(t('fixerJobs.generator.namePatternCorpo1', { corpo: randomCorpo, verb: translatedVerb })) // Corpo Verb
    patterns.push(t('fixerJobs.generator.namePatternCorpo2', { corpo: randomCorpo, noun: randomNoun })) // Corpo Noun
    patterns.push(t('fixerJobs.generator.namePatternSurname1', { surname: randomSurname, noun: randomNoun })) // Surname's Noun
    patterns.push(t('fixerJobs.generator.namePatternSurname2', { surname: randomSurname, verb: translatedVerb })) // Surname's Verb
    patterns.push(
        t('fixerJobs.generator.namePatternFullName1', {
            firstName: randomFirstName,
            surname: randomSurname,
            noun: randomNoun,
        })
    ) // FirstName Surname Noun
    patterns.push(t('fixerJobs.generator.namePatternGangWord1', { gangWord: randomGangWord, verb: translatedVerb })) // GangWord Verb
    patterns.push(t('fixerJobs.generator.namePatternGangWord2', { gangWord: randomGangWord, noun: randomNoun })) // The GangWord Noun
    patterns.push(t('fixerJobs.generator.namePatternAdjNoun', { adjective: randomAdjective, noun: randomNoun })) // Adj Noun
    // --- End New Complex Patterns ---

    // --- New Three-Part Patterns ---
    patterns.push(
        t('fixerJobs.generator.namePatternAdjNounVerb', {
            adjective: randomAdjective,
            noun: randomNoun,
            verb: translatedVerb,
        })
    )
    patterns.push(
        t('fixerJobs.generator.namePatternAdjGangNoun', {
            adjective: randomAdjective,
            gangWord: randomGangWord,
            noun: randomNoun,
        })
    )
    patterns.push(
        t('fixerJobs.generator.namePatternCorpoAdjNoun', {
            corpo: randomCorpo,
            adjective: randomAdjective,
            noun: randomNoun,
        })
    )
    if (translatedLocationStyle) {
        // Only add if location style is available
        patterns.push(
            t('fixerJobs.generator.namePatternLocationNounVerb', {
                locationStyle: translatedLocationStyle,
                noun: randomNoun,
                verb: translatedVerb,
            })
        )
    }
    // --- End New Three-Part Patterns ---

    // Filter out any potentially empty strings if translations failed unexpectedly
    const validPatterns = patterns.filter((p) => p && !p.startsWith('fixerJobs.generator.'))

    // Fallback if somehow all patterns fail
    if (validPatterns.length === 0) {
        // Simple fallback with some flavor
        return `${randomAdjective} ${translatedVerb}`.trim()
    }

    return getRandomElement(validPatterns)
}
