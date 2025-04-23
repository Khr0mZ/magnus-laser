import { TFunction } from 'i18next'
import { v4 as uuidv4 } from 'uuid'
import {
    Building,
    BuildingComplication, // The complete plot object (includes verb, place, subject, complication)
    Character,
    CharacterVerb,
    FixerJob,
    Gang,
    GangComplication,
    Item,
    ItemVerb,
    JobDifficulty,
    Maybe,
    Plot,
    PlotBuilding,
    PlotBuildingComplicationType,
    PlotBuildingVerb,
    PlotComplication,
    PlotComplicationType,
    PlotGang,
    PlotGangComplicationType,
    PlotGangVerb,
    PlotSubject,
    PlotVerb,
} from '../../graphql/types'
import { blobToBase64, generateImageWithFallback, generateTextWithFallback } from '../apiUtils'
import { ModuleTypes } from '../constants'
import { getJobDifficultyModifier, getRandomElement, getRandomInt } from '../functions'
import { generateRandomBuilding } from '../generators/generatorBuilding'
import { generateRandomGang } from '../generators/generatorGang'
import { TextGenerationType } from './constantsGenerators'
import { generateRandomCharacter } from './generatorCharacter'
import { generateRandomItem } from './generatorItem'

/**
 * Improved FixerJob generator with increased narrative detail.
 *
 * @param t - The translation function.
 * @param gangs - Array of existing Gang objects.
 * @param buildings - Array of existing Building objects.
 * @param fixerJob - Optional FixerJob overrides.
 * @param presetBuilding - Optional preset building for plotBuilding.
 * @param preferExistingBuilding - Optional flag to prefer existing buildings.
 * @param preferExistingGang - Optional flag to prefer existing gangs.
 * @param jobDifficulty - Optional job difficulty.
 * @param presetGang - Optional preset gang for plotSubject.
 * @returns A complete FixerJob object along with any newly created gangs, buildings, characters or items.
 */
export const generateRandomFixerJob = async (
    t: TFunction,
    gangs: Gang[],
    buildings: Building[],
    characters: Character[],
    items: Item[],
    fixerJob?: Partial<FixerJob>,
    preferExistingBuilding?: boolean,
    preferExistingGang?: boolean,
    preferExistingCharacter?: boolean,
    preferExistingItem?: boolean,
    jobDifficulty?: JobDifficulty,
    presetBuilding?: Building,
    presetGang?: Gang,
    presetCharacter?: Character,
    presetItem?: Item
): Promise<{
    newFixerJob: FixerJob
    newGang: Maybe<Gang>
    newBuilding: Maybe<Building>
    newCharacters: Character[]
    newItems: Item[]
}> => {
    // Arrays to collect newly created entities
    let newGang: Maybe<Gang> = undefined
    let newBuilding: Maybe<Building> = undefined
    const newCharacters: Character[] = []
    const newItems: Item[] = []
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
    const plotBuilding = await generatePlotBuilding(
        t,
        buildings,
        characters,
        items,
        newCharacters,
        newItems,
        preferExistingBuilding,
        preferExistingCharacter,
        preferExistingItem,
        difficulty,
        presetBuilding,
        presetCharacter,
        presetItem
    )
    // If there are no buildings, or the building is not a preset or existing building, add it to the array of new buildings
    if (buildings.length === 0 || (!presetBuilding && !preferExistingBuilding && buildings.length > 0)) {
        newBuilding = plotBuilding.building
    }

    // Generate Verb
    const verbRoll = getRandomInt(0, 3)
    let verb: PlotVerb
    switch (verbRoll) {
        case 0:
            verb = {
                __typename: 'CharacterVerbWrapper',
                value: getRandomElement(Object.values(CharacterVerb)),
            }
            break
        case 1:
            verb = {
                __typename: 'ItemVerbWrapper',
                value: getRandomElement(Object.values(ItemVerb)),
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
        case 'CharacterVerbWrapper':
            plotSubject =
                presetCharacter ||
                (preferExistingCharacter && characters.length > 0
                    ? getRandomElement(characters)
                    : await generateRandomCharacter())
            // If there are no characters, or the character is not a preset or existing character, add it to the array of new characters
            if (characters.length === 0 || (!presetCharacter && !preferExistingCharacter && characters.length > 0)) {
                newCharacters.push(plotSubject)
            }
            break
        case 'ItemVerbWrapper':
            plotSubject =
                presetItem ||
                (preferExistingItem && items.length > 0 ? getRandomElement(items) : await generateRandomItem(t))
            // If there are no items, or the item is not a preset or existing item, add it to the array of new items
            if (items.length === 0 || (!presetItem && !preferExistingItem && items.length > 0)) {
                newItems.push(plotSubject)
            }
            break
        case 'PlotGangVerbWrapper':
            plotSubject = await generatePlotGang(
                t,
                gangs,
                characters,
                items,
                preferExistingGang,
                preferExistingCharacter,
                preferExistingItem,
                newCharacters,
                newItems,
                presetGang,
                presetCharacter,
                presetItem
            )
            // If there are no gangs, or the gang not an existing gang, add it to the array of new gangs
            if (gangs.length === 0 || (!presetGang && !preferExistingGang && gangs.length > 0)) {
                newGang = plotSubject.gang
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
        plotComplication.character =
            presetCharacter ||
            (preferExistingCharacter && characters.length > 0
                ? getRandomElement(characters)
                : await generateRandomCharacter())
        // If there are no characters, or the character is not a preset or existing character, add it to the array of new characters
        if (characters.length === 0 || (!presetCharacter && !preferExistingCharacter && characters.length > 0)) {
            newCharacters.push(plotComplication.character)
        }
    } else if (plotComplication.type.toString().includes('ITEM')) {
        plotComplication.item =
            presetItem ||
            (preferExistingItem && items.length > 0 ? getRandomElement(items) : await generateRandomItem(t))
        // If there are no items, or the item is not a preset or existing item, add it to the array of new items
        if (items.length === 0 || (!presetItem && !preferExistingItem && items.length > 0)) {
            newItems.push(plotComplication.item)
        }
    }

    const plot: Plot = {
        verb,
        plotSubject, // PlotSubject
        plotComplication, // PlotComplication
        plotBuilding,
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
        console.warn('Error generating fixer job name:', error)
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
        console.warn('Error generating fixer job description:', error)
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
        console.warn('Error generating fixer job image:', error)
        newFixerJob.image = ''
    }

    return {
        newFixerJob,
        newGang,
        newBuilding,
        newCharacters,
        newItems,
    }
}

/**
 * Fallback function to generate a more detailed and varied neon-noir styled FixerJob description.
 */
const generateLocalFixerJobDescription = (t: TFunction, fixerJob: FixerJob): string => {
    const { verb, plotSubject, plotBuilding, plotComplication } = fixerJob.plot
    const building = plotBuilding.building

    // --- Translate Core Elements ---
    const translatedVerb = t(`fixerJobs.verb.${verb.value}`)
    let subjectName = ''
    if (verb.__typename === 'CharacterVerbWrapper') {
        subjectName = (plotSubject as Character)?.name
    } else if (verb.__typename === 'ItemVerbWrapper') {
        subjectName = (plotSubject as Item)?.name
    } else if (verb.__typename === 'PlotGangVerbWrapper') {
        subjectName = (plotSubject as PlotGang)?.gang?.name
    } else if (verb.__typename === 'PlotBuildingVerbWrapper') {
        subjectName = building.name
    }
    const buildingName = building?.name || t('fixerJobs.generator.unknownBuilding')
    const buildingStyle = building?.style ? t(`buildings.style.${building.style}`) : ''
    const buildingType = building?.type ? t(`buildings.type.${building.type}`) : ''

    // --- Translate Subject Details using verb type ---
    let subjectDetails = ''
    if (verb.__typename === 'CharacterVerbWrapper' && plotSubject) {
        const character = plotSubject as Character
        const typeLabel = t(`fixerJobs.character.${character.type}`)
        const attitudeLabel = t(`fixerJobs.characterAttitude.${character.attitude}`)
        subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectCharDetail']), {
            name: subjectName,
            type: typeLabel,
            attitude: attitudeLabel,
        })
    } else if (verb.__typename === 'ItemVerbWrapper' && plotSubject) {
        const item = plotSubject as Item
        const typeLabel = t(`fixerJobs.item.${item.type}`)
        const conditionLabel = t(`fixerJobs.itemCondition.${item.condition}`)
        subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectItemDetail']), {
            name: subjectName,
            type: typeLabel,
            condition: conditionLabel,
        })
    } else if (verb.__typename === 'PlotGangVerbWrapper' && plotSubject) {
        const gangPlot = plotSubject as PlotGang
        const typeLabel = t(`gangs.type.${gangPlot.gang.type}`)
        const newsKey = gangPlot.gang.newsTheLeaderIsReceiving
        const newsLabel = newsKey ? t(`gangs.news.${newsKey}`) : ''
        subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectGangDetail']), {
            name: subjectName,
            type: typeLabel,
            news: newsLabel,
        })
    }

    // --- Translate Complication Details ---
    let mainCompDetails = ''
    const mainCompType = plotComplication?.type
    if (mainCompType) {
        const translatedMainComp = t(`fixerJobs.complication.${mainCompType}`)
        let specifics = ''
        if (plotComplication.character)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailChar']), {
                name: plotComplication.character.name,
            })
        else if (plotComplication.item)
            specifics = t(getRandomElement(['fixerJobs.generator.complicationDetailItem']), {
                name: plotComplication.item.name,
            })
        mainCompDetails = t('fixerJobs.generator.mainComplicationSentenceA', {
            complication: translatedMainComp,
            specifics,
        })
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
        placeCompDetails = t('fixerJobs.generator.placeComplicationSentenceA', {
            complication: translatedPlaceComp,
            specifics,
        })
    }

    // --- Build Sentence Components ---
    const objectives = [
        t('fixerJobs.generator.objectiveSentence1a', {
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
        t('fixerJobs.generator.buildingSentence1a', {
            building: buildingName,
            style: buildingStyle,
            type: buildingType,
        }),
        buildingType
            ? t('fixerJobs.generator.buildingSentence1a', {
                  building: buildingName,
                  type: buildingType,
                  style: buildingStyle,
              })
            : '',
        buildingStyle
            ? t('fixerJobs.generator.buildingSentence1a', {
                  building: buildingName,
                  type: buildingType,
                  style: buildingStyle,
              })
            : '',
    ].filter((s) => s)

    // Markdown formatted description reflecting all defined fields
    const mdLines: string[] = []
    // Helper to clean up extra punctuation and whitespace
    const cleanText = (s: string) =>
        s
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\.{2,}/g, '.')
            .replace(/[.?!]+$/, '')
    // Objective (take the first sentence)
    if (objectives.length) {
        const obj = cleanText(objectives[0])
        mdLines.push(`**Objective:** *${obj.trimEnd()}*`)
    }
    // Subject Details based on objective type
    if (verb.__typename === 'CharacterVerbWrapper' && plotSubject) {
        const character = plotSubject as Character
        const detail = cleanText(
            t(getRandomElement(['fixerJobs.generator.subjectCharDetail']), {
                name: subjectName,
                type: t(`fixerJobs.character.${character.type}`),
                attitude: t(`fixerJobs.characterAttitude.${character.attitude}`),
            })
        )
        mdLines.push(`- **Objective Details:** *${detail}*`)
    } else if (verb.__typename === 'ItemVerbWrapper' && plotSubject) {
        const item = plotSubject as Item
        const detail = cleanText(
            t(getRandomElement(['fixerJobs.generator.subjectItemDetail']), {
                name: subjectName,
                type: t(`fixerJobs.item.${item.type}`),
                condition: t(`fixerJobs.itemCondition.${item.condition}`),
            })
        )
        mdLines.push(`- **Objective Details:** *${detail}*`)
    } else if (verb.__typename === 'PlotGangVerbWrapper' && plotSubject) {
        const gangPlot = plotSubject as PlotGang
        const newsKey = gangPlot.gang.newsTheLeaderIsReceiving
        const newsLabel = newsKey ? t(`gangs.news.${newsKey}`) : ''
        const detail = cleanText(
            t(getRandomElement(['fixerJobs.generator.subjectGangDetail']), {
                name: subjectName,
                type: t(`gangs.type.${gangPlot.gang.type}`),
                news: newsLabel,
            })
        )
        mdLines.push(`- **Objective Details:** *${detail}*`)
    }
    // Gang Complication (if the action targets a gang)
    if (verb.__typename === 'PlotGangVerbWrapper' && plotSubject) {
        const gangPlot = plotSubject as PlotGang
        if (gangPlot.complication) {
            const compTypeKey = gangPlot.complication.type
            const translatedGC = t(`fixerJobs.gangComplication.${compTypeKey}`)
            // specifics: either character or item
            let gcSpecifics = ''
            if (gangPlot.complication.character) {
                gcSpecifics = t(getRandomElement(['fixerJobs.generator.complicationDetailChar']), {
                    name: gangPlot.complication.character.name,
                })
            } else if (gangPlot.complication.item) {
                gcSpecifics = t(getRandomElement(['fixerJobs.generator.complicationDetailItem']), {
                    name: gangPlot.complication.item.name,
                })
            }
            const fullGC = cleanText(`${translatedGC}. ${gcSpecifics}`)
            mdLines.push(`- **Objective Complication:** *${fullGC.trimEnd()}*`)
        }
    }
    // Location (pick one sentence)
    if (buildings.length) {
        const loc = cleanText(getRandomElement(buildings))
        mdLines.push(`**Location:** *${loc.trimEnd()}*`)
    }
    // Site Complication
    if (placeCompDetails) {
        const pc = cleanText(placeCompDetails)
        mdLines.push(`- **Location Complication:** *${pc.trimEnd()}*`)
    }
    // Main Complication
    if (mainCompDetails) {
        const comp = cleanText(mainCompDetails)
        mdLines.push(`**Main Complication:** *${comp.trimEnd()}*`)
    }
    // Return joined markdown lines
    return mdLines.join('\n\n')
}

/**
 * Fallback function to generate a neon-noir styled name for a FixerJob.
 * Incorporates more job details for variety.
 */
const generateLocalFixerJobName = (t: TFunction, fixerJob: FixerJob): string => {
    const { plot } = fixerJob
    const action = t(`fixerJobs.verb.${plot.verb.value}`)
    // Building-specific patterns
    if (plot.verb.__typename === 'PlotBuildingVerbWrapper') {
        const name = plot.plotBuilding.building.name
        const buildingPatterns = [
            `${action} ${name}`,
            `Operation: ${action} ${name}`,
            `Siege of ${name}`,
            `Break-In at ${name}`,
            `Secure ${name}`,
            `Lockdown at ${name}`,
            `Extraction of ${name}`,
        ]
        return getRandomElement(buildingPatterns)
    }
    // Character, Item, or Gang patterns
    if (plot.plotSubject) {
        // @ts-expect-error: target subject or gang has name
        const name = plot.plotSubject.name || plot.plotSubject.gang?.name || ''
        // Map certain verbs to noun phrases
        const nounMap: Record<string, string> = {
            INVESTIGATE: 'Investigation',
            INFILTRATE: 'Infiltration',
            ALLY_WITH: 'Alliance',
            NEGOTIATE_WITH: 'Negotiation',
        }
        const verbKey = plot.verb.value
        const patterns: string[] = [`${action} ${name}`, `Operation: ${action} ${name}`]
        if (nounMap[verbKey]) {
            const nounPhrase = nounMap[verbKey]
            // Use 'with' for verbs ending in '_WITH', otherwise 'of'
            if (verbKey.endsWith('_WITH')) {
                patterns.push(`The ${nounPhrase} with ${name}`)
            } else {
                patterns.push(`The ${nounPhrase} of ${name}`)
            }
        }
        return getRandomElement(patterns)
    }
    // Fallback
    return action
}

/**
 * Generates a PlotGang (of type PlotGang) using existing gangs if desired.
 * Uses the imported generateRandomGang function to create a new gang if needed.
 * Returns both the PlotGang and a flag indicating if a new gang was created.
 */
const generatePlotGang = async (
    t: TFunction,
    gangs: Gang[],
    characters: Character[],
    items: Item[],
    preferExisting: boolean = true,
    preferExistingCharacter: boolean = true,
    preferExistingItem: boolean = true,
    newCharacters: Character[],
    newItems: Item[],
    presetGang?: Gang,
    presetCharacter?: Character,
    presetItem?: Item
): Promise<PlotGang> => {
    const gang =
        presetGang || (preferExisting && gangs.length > 0 ? getRandomElement(gangs) : await generateRandomGang(t))
    const complicationType = getRandomElement(Object.values(PlotGangComplicationType))
    let complication: GangComplication = {
        type: complicationType,
    }
    if (complicationType.toString().includes('CHARACTER')) {
        const character =
            presetCharacter ||
            (preferExistingCharacter && characters.length > 0
                ? getRandomElement(characters)
                : await generateRandomCharacter())
        complication = {
            ...complication,
            character,
        }
        // If there are no characters, or the character is not a preset or existing character, add it to the array of new characters
        if (
            characters.length === 0 ||
            (!presetCharacter && !preferExistingCharacter && characters.length > 0 && character)
        ) {
            newCharacters.push(character)
        }
    } else if (complicationType.toString().includes('ITEM')) {
        const item =
            presetItem ||
            (preferExistingItem && items.length > 0 ? getRandomElement(items) : await generateRandomItem(t))
        complication = {
            ...complication,
            item,
        }
        // If there are no items, or the item is not a preset or existing item, add it to the array of new items
        if (items.length === 0 || (!presetItem && !preferExistingItem && items.length > 0 && item)) {
            newItems.push(item)
        }
    }

    const plotGang: PlotGang = {
        gang,
        complication,
    }

    return plotGang
}

/**
 * Generates a PlotBuilding (of type PlotBuilding) using existing buildings if desired.
 * Uses the imported generateRandomBuilding function to create a new building if needed.
 * Returns both the PlotBuilding and a flag indicating if a new building was created.
 */
const generatePlotBuilding = async (
    t: TFunction,
    buildings: Building[],
    characters: Character[],
    items: Item[],
    newCharacters: Character[],
    newItems: Item[],
    preferExisting: boolean = true,
    preferExistingCharacter: boolean = true,
    preferExistingItem: boolean = true,
    difficulty: JobDifficulty,
    presetBuilding?: Building,
    presetCharacter?: Character,
    presetItem?: Item
): Promise<PlotBuilding> => {
    const building =
        presetBuilding ||
        (preferExisting && buildings.length > 0
            ? getRandomElement(buildings)
            : await generateRandomBuilding(t, getJobDifficultyModifier(difficulty)))
    const complicationType = getRandomElement(Object.values(PlotBuildingComplicationType))
    let complication: BuildingComplication = {
        type: complicationType,
    }
    if (complicationType.toString().includes('CHARACTER')) {
        complication = {
            ...complication,
            character:
                presetCharacter ||
                (preferExistingCharacter && characters.length > 0
                    ? getRandomElement(characters)
                    : await generateRandomCharacter()),
        }
        // If there are no characters, or the character is not a preset or existing character, add it to the array of new characters
        if (characters.length === 0 || (!presetCharacter && !preferExistingCharacter && characters.length > 0)) {
            newCharacters.push(complication.character!)
        }
    } else if (complicationType.toString().includes('ITEM')) {
        complication = {
            ...complication,
            item:
                presetItem ||
                (preferExistingItem && items.length > 0 ? getRandomElement(items) : await generateRandomItem(t)),
        }
        // If there are no items, or the item is not a preset or existing item, add it to the array of new items
        if (items.length === 0 || (!presetItem && !preferExistingItem && items.length > 0)) {
            newItems.push(complication.item!)
        }
    }

    const plotBuilding: PlotBuilding = {
        building,
        complication,
    }

    return plotBuilding
}
