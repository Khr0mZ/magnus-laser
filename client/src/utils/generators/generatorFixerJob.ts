import { TFunction } from 'i18next'
import { v4 as uuidv4 } from 'uuid'
import {
    Building,
    BuildingComplication,
    FixerJob,
    Gang,
    GangComplication,
    GangNameType,
    JobDifficulty,
    Maybe,
    Plot,
    PlotBuilding,
    PlotBuildingComplicationType,
    PlotBuildingVerb, // The complete plot object (includes verb, place, subject, complication)
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
    PlotSubject,
    PlotVerb,
} from '../../graphql/types'
import { blobToBase64, generateAIItemName, generateImageWithFallback, generateTextWithFallback } from '../apiUtils'
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

/**
 * Improved FixerJob generator with increased narrative detail.
 *
 * @param t - The translation function.
 * @param gangs - Array of existing Gang objects.
 * @param buildings - Array of existing Building objects.
 * @param fixerJob - Optional FixerJob overrides.
 * @param presetBuilding - Optional preset building for plotBuilding.
 * @param options - Optional generator options.
 * @returns A complete FixerJob object along with any newly created gangs and buildings.
 */
export const generateRandomFixerJob = async (
    t: TFunction,
    gangs: Gang[],
    buildings: Building[],
    fixerJob?: Partial<FixerJob>,
    presetBuilding?: Building,
    preferExistingBuilding?: boolean,
    preferExistingGang?: boolean,
    jobDifficulty?: JobDifficulty
): Promise<{ fixerJob: FixerJob; newGangs: Gang[]; newBuildings: Building[] }> => {
    // Arrays to collect newly created entities
    const newGangs: Gang[] = []
    const newBuildings: Building[] = []
    // Things to generate
    // - PlotBuilding
    // - Verb
    // - PlotSubject
    // - PlotComplication
    // - Name (now generated via API or locally if API fails)
    // - Description (now generated via API or locally if API fails)
    // - Image (now generated via API or locally if API fails)

    // Generate PlotBuilding
    const difficulty = jobDifficulty ?? JobDifficulty.TYPICAL
    const building =
        presetBuilding ?? preferExistingBuilding
            ? getRandomElement(buildings)
            : await generateRandomBuilding(t, getJobDifficultyModifier(difficulty), undefined)
    const buildingComplicationType = getRandomElement(Object.values(PlotBuildingComplicationType))
    let buildingComplication: BuildingComplication = {
        type: buildingComplicationType,
    }
    if (buildingComplicationType.toString().includes('CHARACTER')) {
        buildingComplication = {
            ...buildingComplication,
            character: await generateRandomCharacter(),
        }
    } else if (buildingComplicationType.toString().includes('ITEM')) {
        buildingComplication = {
            ...buildingComplication,
            item: await generateRandomItem(t),
        }
    } else if (buildingComplicationType.toString().includes('GANG')) {
        const plotGang = await generatePlotGang(t, gangs, preferExistingGang)
        // If there are no gangs, or the gang not an existing gang, add it to the array of new gangs
        if (gangs.length === 0 || (plotGang.gang && !preferExistingGang && gangs.length > 0)) {
            newGangs.push(plotGang.gang)
        }
        buildingComplication = {
            ...buildingComplication,
            gang: plotGang,
        }
    }
    // If there are no buildings, or the building is not a preset or existing building, add it to the array of new buildings
    if (buildings.length === 0 || (building && !presetBuilding && !preferExistingBuilding && buildings.length > 0)) {
        newBuildings.push(building)
    }
    const plotBuilding: PlotBuilding = {
        building,
        complication: buildingComplication,
    }

    // Generate Verb
    const verbRoll = getRandomInt(0, 3)
    let verb: PlotVerb
    switch (verbRoll) {
        case 0:
            verb = {
                __typename: 'PlotCharacterVerbWrapper',
                value: getRandomElement(Object.values(PlotCharacterVerb)),
            }
            break
        case 1:
            verb = {
                __typename: 'PlotItemVerbWrapper',
                value: getRandomElement(Object.values(PlotItemVerb)),
            }
            break
        case 2:
            verb = {
                __typename: 'PlotGangVerbWrapper',
                value: getRandomElement(Object.values(PlotGangVerb)),
            }
            break
        case 3:
        default:
            verb = {
                __typename: 'PlotBuildingVerbWrapper',
                value: getRandomElement(Object.values(PlotBuildingVerb)),
            }
            break
    }

    // Generate plot subject
    let plotSubject: Maybe<PlotSubject> = undefined
    switch (verb.__typename) {
        case 'PlotCharacterVerbWrapper':
            plotSubject = await generateRandomCharacter()
            break
        case 'PlotItemVerbWrapper':
            plotSubject = await generateRandomItem(t)
            break
        case 'PlotGangVerbWrapper':
            plotSubject = await generatePlotGang(t, gangs, preferExistingGang)
            // If there are no gangs, or the gang not an existing gang, add it to the array of new gangs
            if (gangs.length === 0 || (!preferExistingGang && gangs.length > 0)) {
                newGangs.push(plotSubject.gang)
            }
            break
        case 'PlotBuildingVerbWrapper':
        default:
            // If the verb is a building verb, the plotSubject is undefined
            break
    }

    // Generate PlotComplication
    const plotComplication: PlotComplication = {
        type: getRandomElement(Object.values(PlotComplicationType)),
    }
    if (plotComplication.type.toString().includes('CHARACTER')) {
        plotComplication.character = await generateRandomCharacter()
    } else if (plotComplication.type.toString().includes('ITEM')) {
        plotComplication.item = await generateRandomItem(t)
    } else if (plotComplication.type.toString().includes('GANG')) {
        plotComplication.gang = await generatePlotGang(t, gangs, preferExistingGang)
        if (gangs.length === 0 || (!preferExistingGang && gangs.length > 0)) {
            newGangs.push(plotComplication.gang.gang)
        }
    }

    const plot: Plot = {
        verb,
        plotBuilding,
        plotSubject, // PlotSubject
        complication: plotComplication, // PlotComplication
    }

    const newFixerJob: FixerJob = {
        ID: uuidv4(),
        name: '',
        description: '',
        plot: plot,
        image: '',
        difficulty,
        ...fixerJob,
    }

    // Generate fixer job name
    try {
        const generatedName = await generateTextWithFallback(
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

    // Generate fixer job description
    try {
        const generatedDesc = await generateTextWithFallback(
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

    // Generate fixer job image
    try {
        const imageBlob = await generateImageWithFallback(
            newFixerJob.description,
            newFixerJob.name,
            ModuleTypes.FIXER_JOB
        )
        newFixerJob.image = imageBlob ? await blobToBase64(imageBlob) : ''
    } catch (error) {
        console.error('Error generating fixer job image:', error)
        newFixerJob.image = ''
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
    const { verb, plotSubject, plotBuilding, complication } = fixerJob.plot
    const building = plotBuilding.building

    // --- Translate Core Elements ---
    const translatedVerb = t(`fixerJobs.verb.${verb.value}`)
    let subjectName = ''
    if (verb.__typename === 'PlotCharacterVerbWrapper') {
        subjectName = (plotSubject as PlotCharacter)?.name
    } else if (verb.__typename === 'PlotItemVerbWrapper') {
        subjectName = (plotSubject as PlotItem)?.name
    } else if (verb.__typename === 'PlotGangVerbWrapper') {
        subjectName = (plotSubject as PlotGang)?.gang?.name
    } else if (verb.__typename === 'PlotBuildingVerbWrapper') {
        subjectName = building.name
    }
    const buildingName = building?.name || t('fixerJobs.generator.unknownBuilding')
    const buildingStyle = building?.style ? t(`buildings.style.${building.style}`) : ''
    const buildingType = building?.type ? t(`buildings.type.${building.type}`) : ''

    // --- Translate Subject Details ---
    let subjectDetails = ''
    if (plotSubject) {
        let type = ''
        let detail = ''
        if (plotSubject.__typename === 'PlotCharacter') {
            type = t(`fixerJobs.character.${plotSubject.type}`)
            detail = t(`fixerJobs.characterAttitude.${plotSubject.attitude}`)
            subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectCharDetail']), {
                name: subjectName,
                type,
                attitude: detail,
            })
        } else if (plotSubject.__typename === 'PlotItem') {
            type = t(`fixerJobs.item.${plotSubject.type}`)
            detail = t(`fixerJobs.itemCondition.${plotSubject.condition}`)
            subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectItemDetail']), {
                name: subjectName,
                type,
                condition: detail,
            })
        } else if (plotSubject.__typename === 'PlotGang' && plotSubject.gang) {
            type = t(`gangs.type.${plotSubject.gang.type}`)
            detail = plotSubject.complication?.type
                ? t(`fixerJobs.gangComplication.${plotSubject.complication.type}`)
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
    const placeCompType = plotBuilding.complication?.type
    if (placeCompType) {
        const translatedPlaceComp = t(`fixerJobs.buildingComplication.${placeCompType}`)
        let specifics = ''
        if (plotBuilding.complication.character)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailChar']), {
                name: plotBuilding.complication.character.name,
            })
        else if (plotBuilding.complication.item)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailItem']), {
                name: plotBuilding.complication.item.name,
            })
        else if (plotBuilding.complication.gang?.gang)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailGang']), {
                name: plotBuilding.complication.gang.gang.name,
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

    const buildings = [
        t(getRandomElement(['fixerJobs.generator.buildingSentence1a', 'fixerJobs.generator.buildingSentence1b']), {
            building: buildingName,
        }),
        buildingType
            ? t(
                  getRandomElement([
                      'fixerJobs.generator.buildingSentence2a',
                      'fixerJobs.generator.buildingSentence2b',
                  ]),
                  { building: buildingName, type: buildingType }
              )
            : '',
        buildingStyle
            ? t(
                  getRandomElement([
                      'fixerJobs.generator.buildingSentence3a',
                      'fixerJobs.generator.buildingSentence3b',
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
        L: buildings,
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
            `${getRandomElement(objectives)} ${getRandomElement(buildings)} ${
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
    const verb = fixerJob.plot.verb
    const verbValue = verb.value
    const subject = fixerJob.plot.plotSubject
    const building = fixerJob.plot.plotBuilding.building
    const complicationType = fixerJob.plot.complication?.type

    // Translate relevant parts
    const translatedVerb = t(`fixerJobs.verb.${verbValue}`)
    let translatedSubjectType = ''
    if (subject) {
        if (verb.__typename === 'PlotCharacterVerbWrapper') {
            translatedSubjectType = t(`fixerJobs.character.${(subject as PlotCharacter).type}`)
        } else if (verb.__typename === 'PlotItemVerbWrapper') {
            translatedSubjectType = t(`fixerJobs.item.${(subject as PlotItem).type}`)
        } else if (verb.__typename === 'PlotGangVerbWrapper' && (subject as PlotGang).gang) {
            translatedSubjectType = t(`gangs.type.${(subject as PlotGang).gang.type}`)
        } else if (verb.__typename === 'PlotBuildingVerbWrapper') {
            translatedSubjectType = t(`buildings.type.${building.type}`)
        }
    }
    const translatedBuildingStyle = building?.style ? t(`buildings.style.${building.style}`) : ''
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

    // Patterns using building
    if (building?.name) {
        patterns.push(
            t('fixerJobs.generator.namePatternBuilding1', { verb: translatedVerb, buildingName: building.name })
        ) // The Building Verb
    }
    if (translatedBuildingStyle) {
        patterns.push(
            t('fixerJobs.generator.namePatternBuilding2', {
                buildingStyle: translatedBuildingStyle,
                verb: translatedVerb,
            })
        ) // BuildingStyle Verb
        patterns.push(
            t('fixerJobs.generator.namePatternBuilding3', { buildingStyle: translatedBuildingStyle, noun: randomNoun })
        ) // BuildingStyle Noun
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
    if (translatedBuildingStyle) {
        // Only add if building style is available
        patterns.push(
            t('fixerJobs.generator.namePatternBuildingNounVerb', {
                buildingStyle: translatedBuildingStyle,
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

/**
 * Generates a random PlotCharacter.
 */
const generateRandomCharacter = async (): Promise<PlotCharacter> => {
    const characterType = getRandomElement(Object.values(PlotCharacterType))
    const characterName = `${getRandomElement(personNames)} ${getRandomElement(surnames)}`
    const characterAttitude = getRandomElement(Object.values(PlotCharacterAttitude))
    try {
        const characterBlob = await generateImageWithFallback(characterName, characterType, undefined, 'Character')
        const characterImage = characterBlob ? await blobToBase64(characterBlob) : ''
        return {
            name: characterName,
            type: characterType,
            attitude: characterAttitude,
            image: characterImage,
        }
    } catch (error) {
        console.error('Error generating character image:', error)
        return {
            name: characterName,
            type: characterType,
            attitude: characterAttitude,
            image: '',
        }
    }
}

/**
 * Generates a random PlotItem.
 */
const generateRandomItem = async (t: TFunction): Promise<PlotItem> => {
    const itemType = getRandomElement(Object.values(PlotItemType))
    const itemCondition = getRandomElement(Object.values(PlotItemCondition))
    const itemName = await generateRandomItemNameWithFallback(t, itemType, itemCondition)
    try {
        const itemBlob = await generateImageWithFallback(itemName, itemType, undefined, 'Item')
        const itemImage = itemBlob ? await blobToBase64(itemBlob) : ''
        return {
            name: itemName,
            type: itemType,
            condition: itemCondition,
            image: itemImage,
        }
    } catch (error) {
        console.error('Error generating item image:', error)
        return {
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
    itemType: PlotItemType,
    itemCondition: PlotItemCondition
): Promise<string> => {
    try {
        const aiName = await generateAIItemName(itemType, itemCondition, t)
        if (aiName) {
            return aiName
        }
    } catch (error) {
        console.error('AI item name generation failed, using local fallback:', error)
    }
    // Fallback to local generation if AI fails or returns null
    return generateLocalRandomItemName(itemType)
}
/**
 * Generates a flashy cyberpunk-styled item name based on the item type.
 * Uses corpoPrefixes and surnames to add extra variety.
 */
const generateLocalRandomItemName = (itemType: PlotItemType): string => {
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
 * Generates a PlotGang (of type PlotGang) using existing gangs if desired.
 * Uses the imported generateRandomGang function to create a new gang if needed.
 * Returns both the PlotGang and a flag indicating if a new gang was created.
 */
const generatePlotGang = async (t: TFunction, gangs: Gang[], preferExisting: boolean = true): Promise<PlotGang> => {
    const gang = preferExisting && gangs.length > 0 ? getRandomElement(gangs) : await generateRandomGang(t)
    const complicationType = getRandomElement(Object.values(PlotGangComplicationType))
    let complication: GangComplication = {
        type: complicationType,
    }
    if (complicationType.toString().includes('CHARACTER')) {
        complication = {
            ...complication,
            character: await generateRandomCharacter(),
        }
    } else if (complicationType.toString().includes('ITEM')) {
        complication = {
            ...complication,
            item: await generateRandomItem(t),
        }
    }

    const plotGang: PlotGang = {
        gang,
        complication,
    }

    return plotGang
}
