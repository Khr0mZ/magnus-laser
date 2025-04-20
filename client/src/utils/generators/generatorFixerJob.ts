import { TFunction } from 'i18next'
import { v4 as uuidv4 } from 'uuid'
import {
    Building,
    BuildingComplication,
    FixerJob,
    Gang,
    GangComplication,
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
    corpoPrefixes, // Import corpoPrefixes
    personNames, // Import personNames
    surnames, // Import surnames
    TextGenerationType,
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
 * @returns A complete FixerJob object along with any newly created gangs and buildings.
 */
export const generateRandomFixerJob = async (
    t: TFunction,
    gangs: Gang[],
    buildings: Building[],
    fixerJob?: Partial<FixerJob>,
    preferExistingBuilding?: boolean,
    preferExistingGang?: boolean,
    jobDifficulty?: JobDifficulty,
    presetBuilding?: Building,
    presetGang?: Gang
): Promise<{ newFixerJob: FixerJob; newGang: Maybe<Gang>; newBuilding: Maybe<Building> }> => {
    // Arrays to collect newly created entities
    let newGang: Maybe<Gang> = undefined
    let newBuilding: Maybe<Building> = undefined
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
    const plotBuilding = await generatePlotBuilding(t, buildings, preferExistingBuilding, difficulty, presetBuilding)
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
            plotSubject = await generatePlotGang(t, gangs, preferExistingGang, presetGang)
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
        plotComplication.character = await generateRandomCharacter()
    } else if (plotComplication.type.toString().includes('ITEM')) {
        plotComplication.item = await generateRandomItem(t)
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
        newFixerJob,
        newGang,
        newBuilding,
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

    // --- Translate Subject Details using verb type ---
    let subjectDetails = ''
    if (verb.__typename === 'PlotCharacterVerbWrapper' && plotSubject) {
        const character = plotSubject as PlotCharacter
        const typeLabel = t(`fixerJobs.character.${character.type}`)
        const attitudeLabel = t(`fixerJobs.characterAttitude.${character.attitude}`)
        subjectDetails = t(getRandomElement(['fixerJobs.generator.subjectCharDetail']), {
            name: subjectName,
            type: typeLabel,
            attitude: attitudeLabel,
        })
    } else if (verb.__typename === 'PlotItemVerbWrapper' && plotSubject) {
        const item = plotSubject as PlotItem
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
    if (verb.__typename === 'PlotCharacterVerbWrapper' && plotSubject) {
        const character = plotSubject as PlotCharacter
        const detail = cleanText(
            t(getRandomElement(['fixerJobs.generator.subjectCharDetail']), {
                name: subjectName,
                type: t(`fixerJobs.character.${character.type}`),
                attitude: t(`fixerJobs.characterAttitude.${character.attitude}`),
            })
        )
        mdLines.push(`- **Objective Details:** *${detail}*`)
    } else if (verb.__typename === 'PlotItemVerbWrapper' && plotSubject) {
        const item = plotSubject as PlotItem
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
            return `CredStack ${getRandomInt(100, 1000)}`
        case PlotItemType.WEAPONS: {
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
            return `Artifact ${getRandomInt(100, 999)}${
                Math.random() < 0.3 ? ` ${getRandomElement(ITEM_NAME_THEMED_SUFFIXES)}` : ''
            }`
    }
}

/**
 * Generates a PlotGang (of type PlotGang) using existing gangs if desired.
 * Uses the imported generateRandomGang function to create a new gang if needed.
 * Returns both the PlotGang and a flag indicating if a new gang was created.
 */
const generatePlotGang = async (
    t: TFunction,
    gangs: Gang[],
    preferExisting: boolean = true,
    presetGang?: Gang
): Promise<PlotGang> => {
    const gang =
        presetGang || (preferExisting && gangs.length > 0 ? getRandomElement(gangs) : await generateRandomGang(t))
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

/**
 * Generates a PlotBuilding (of type PlotBuilding) using existing buildings if desired.
 * Uses the imported generateRandomBuilding function to create a new building if needed.
 * Returns both the PlotBuilding and a flag indicating if a new building was created.
 */
const generatePlotBuilding = async (
    t: TFunction,
    buildings: Building[],
    preferExisting: boolean = true,
    difficulty: JobDifficulty,
    presetBuilding?: Building
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
            character: await generateRandomCharacter(),
        }
    } else if (complicationType.toString().includes('ITEM')) {
        complication = {
            ...complication,
            item: await generateRandomItem(t),
        }
    }

    const plotBuilding: PlotBuilding = {
        building,
        complication,
    }

    return plotBuilding
}
