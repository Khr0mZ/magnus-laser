import { GoogleGenerativeAI } from '@google/generative-ai'
import { Alert, Box, Typography } from '@mui/material'
import { t, TFunction } from 'i18next'
import { enqueueSnackbar } from 'notistack'
import { SetStateAction } from 'react'
import { Building, Character, FixerJob, Gang, Item, ItemCondition, ItemType } from '../graphql/types'
import { ModuleTypes } from './constants'
import { IMAGE_MODEL_URL, TEXT_MODEL_URL, TextGenerationType } from './generators/constantsGenerators'
import { loadGeminiApiKey, loadHuggingFaceApiKey, loadOpenAIApiKey } from './storage'

// Function to get the Hugging Face API token (user-provided or from env)
const getHuggingFaceToken = async (): Promise<string> => {
    // Try to load from IndexedDB first
    const userToken = await loadHuggingFaceApiKey()
    if (userToken) {
        return userToken
    }
    // Fall back to env variable
    const envToken = import.meta.env.VITE_HUGGINGFACE_TOKEN || ''
    return envToken
}

// Function to get the OpenAI API token from storage or env variable
const getOpenAIToken = async (): Promise<string> => {
    // Try to load from IndexedDB first
    const userToken = await loadOpenAIApiKey()
    if (userToken) {
        return userToken
    }
    // Fall back to env variable
    const envToken = import.meta.env.VITE_OPENAI_API_KEY || ''
    return envToken
}

// Function to get the Gemini API token from storage or env variable
const getGeminiToken = async (): Promise<string> => {
    // Try to load from IndexedDB first
    const userToken = await loadGeminiApiKey()
    if (userToken) {
        return userToken
    }
    // Fall back to env variable
    const envToken = import.meta.env.VITE_GEMINI_API_KEY || ''
    return envToken
}

/**
 * Helper function to build the detailed prompt string based on the item type.
 */
const buildPromptDetails = (
    item: Building | Gang | FixerJob | { type: ItemType; condition: ItemCondition; name?: string },
    moduleType: ModuleTypes | 'Item',
    t: TFunction,
    addName: boolean
): string => {
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const building = isBuilding ? (item as Building) : null
    const isGang = moduleType === ModuleTypes.GANG
    const gang = isGang ? (item as Gang) : null
    const isFixerJob = moduleType === ModuleTypes.FIXER_JOB
    const fixerJob = isFixerJob ? (item as FixerJob) : null
    const isItem = moduleType === 'Item'
    const plotItem = isItem ? (item as { type: ItemType; condition: ItemCondition; name?: string }) : null

    if (isBuilding && building) {
        return `
            ${addName ? `Name: ${building.name}` : ''}
            IsAbandoned: ${building.isAbandoned ? 'Yes' : 'No'},
            Type: ${t(`buildings.type.${building.type}`)},
            Elevators: ${building.elevators ? 'Yes' : 'No'},
            Parking: ${building.parking ? 'Yes' : 'No'},
            Gatehouse Front Desk: ${building.gatehouseFrontDesk ? 'Yes' : 'No'},
            Emergency Exit: ${building.emergencyExit ? 'Yes' : 'No'},
            Backup Lights: ${building.backupLights ? 'Yes' : 'No'},
            Landing Pad: ${building.landingPad ? 'Yes' : 'No'},
            Secret Or Alt Entrance: ${building.secretOrAltEntrance ? 'Yes' : 'No'},
            Ownership: ${t(`buildings.ownership.${building.ownership}`)},
            Security Personnel: ${t(`buildings.securityPersonnel.${building.securityPersonnel}`)},
            Style: ${t(`buildings.style.${building.style}`)},
            Event: ${t(`buildings.event.${building.event}`)},
            Secret: ${t(`buildings.secret.${building.secret}`)}.
        `
    } else if (isGang && gang) {
        return `
            ${addName ? `Name: ${gang.name}` : ''}
            Type: ${t(`gangs.type.${gang.type}`)},
            Cyberware Quality: ${t(`gangs.cyberwareQuality.${gang.cyberwareQuality}`)},
            Skill: ${gang.skill < 11 ? 'Low' : gang.skill < 14 ? 'Medium' : 'High'},
            Weapons: ${(gang.weapons?.d6 ?? 0) < 3 ? 'Low' : (gang.weapons?.d6 ?? 0) < 5 ? 'Medium' : 'High'},
            Armor Body: ${
                gang.armor?.spb < 7
                    ? 'Low'
                    : gang.armor?.spb < 13
                    ? 'Medium'
                    : gang.armor?.spb < 16
                    ? 'High'
                    : 'Very High'
            },
            Armor Head: ${
                gang.armor?.h < 7 ? 'Low' : gang.armor?.h < 13 ? 'Medium' : gang.armor?.h < 16 ? 'High' : 'Very High'
            },
            Secretive: ${gang.secretive < 15 ? 'Low' : gang.secretive < 21 ? 'Medium' : 'High'},
            Status: ${t(`gangs.status.${gang.status}`)},
            Color: ${t(`gangs.color.${gang.color}`)},
            Sin: ${t(`gangs.sin.${gang.sin}`)},
            Known For: ${t(`gangs.knownForPart1.${gang.knownFor?.knownForPart1}`)} and ${t(
            `gangs.knownForPart2.${gang.knownFor?.knownForPart2}`
        )},
            Flaw: ${t(`gangs.flaw.${gang.flaw}`)},
            Current Attitude: ${t(`gangs.currentAttitude.${gang.currentAttitude}`)},
            News The Leader Is Receiving: ${t(`gangs.newsTheLeaderIsReceiving.${gang.newsTheLeaderIsReceiving}`)}.
        `
    } else if (isFixerJob && fixerJob) {
        // Added translations for fixer job details
        return `
            ${addName ? `Name: ${fixerJob.name}` : ''}
            Plot Verb: ${fixerJob.plot.verb ? t(`fixerJobs.plotVerbs.${fixerJob.plot.verb.value || ''}`) : ''},
            ${
                fixerJob.plot.plotSubject && fixerJob.plot.plotSubject.__typename === 'Character'
                    ? `Character Type: ${t(`fixerJobs.characterTypes.${fixerJob.plot.plotSubject.type}`)},`
                    : ''
            }
            ${
                fixerJob.plot.plotSubject && fixerJob.plot.plotSubject.__typename === 'Character'
                    ? `Character Attitude: ${t(`fixerJobs.characterAttitudes.${fixerJob.plot.plotSubject.attitude}`)},`
                    : ''
            }
            ${
                fixerJob.plot.plotBuilding
                    ? `Building: ${t(`buildings.type.${fixerJob.plot.plotBuilding.building?.type || ''}`)},`
                    : ''
            }
            ${
                fixerJob.plot.plotBuilding
                    ? `Building Complication: ${t(
                          `fixerJobs.complicationTypes.${fixerJob.plot.plotBuilding.complication?.type || ''}`
                      )},`
                    : ''
            }
            ${
                fixerJob.plot.plotComplication
                    ? `Plot Complication: ${t(
                          `fixerJobs.complicationTypes.${fixerJob.plot.plotComplication.type || ''}`
                      )},`
                    : ''
            }
        `
    } else if (isItem && plotItem) {
        return `
            ${addName && plotItem.name ? `Name: ${plotItem.name}` : ''}
            Item Type: ${t(`fixerJobs.item.${plotItem.type}`)},
            Condition: ${t(`fixerJobs.itemCondition.${plotItem.condition}`)}.
        `
    }

    return '' // Return empty string if item type is invalid
}

/**
 * Generates text description using Hugging Face API.
 * @param item - The building, gang or fixer job object.
 * @param moduleType - The type of module (Building, Gang or FixerJob).
 * @param t - The translation function.
 * @returns The generated description string or null on error.
 */
export const generateHuggingFaceText = async (
    item: Building | Gang | FixerJob | { type: ItemType; condition: ItemCondition; name?: string },
    moduleType: ModuleTypes | 'Item',
    t: TFunction,
    type: TextGenerationType
): Promise<string | null> => {
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const building = isBuilding ? (item as Building) : null
    const isGang = moduleType === ModuleTypes.GANG
    const gang = isGang ? (item as Gang) : null
    const isFixerJob = moduleType === ModuleTypes.FIXER_JOB
    const fixerJob = isFixerJob ? (item as FixerJob) : null
    const isItem = moduleType === 'Item'
    const plotItem = isItem ? (item as { type: ItemType; condition: ItemCondition; name?: string }) : null
    const HUGGINGFACE_API_TOKEN = await getHuggingFaceToken()
    const addName = type === TextGenerationType.DESCRIPTION

    if (!HUGGINGFACE_API_TOKEN) {
        return null
    }

    if ((isBuilding && !building) || (isGang && !gang) || (isFixerJob && !fixerJob) || (isItem && !plotItem)) {
        return null
    }

    const itemPrompt = buildPromptDetails(item, moduleType, t, addName)

    // Construct the prompt
    const promptContent = `Generate a cyberpunk-themed ${type} for a ${
        isBuilding ? 'building' : isGang ? 'gang' : isFixerJob ? 'fixer gig' : 'plot item'
    } using the following details:

    ${
        isBuilding && type === TextGenerationType.NAME
            ? `When generating the name for the building, use a Night City style. You may incorporate elements like street names, numbers, personal names, surnames, or corporate-sounding terms. IMPORTANT: Return ONLY the building name itself, without any introductory text like "Option 1:", quotes, or markdown formatting.`
            : ''
    }
    ${
        isGang && type === TextGenerationType.NAME
            ? `When generating the name for the gang, incorporate at least two of the following categories: adjective, animal, body part, color, neighborhood, number, place, profession, weapon, or weather phenomenon.`
            : ''
    }
    ${
        isFixerJob && type === TextGenerationType.NAME
            ? `When generating the name for the gig, use a neon-noir style.`
            : ''
    }
    ${
        isItem && type === TextGenerationType.NAME
            ? `When generating the name for the plot item, make it sound unique, potentially dangerous, valuable, or mysterious, reflecting its type and condition. Examples: 'Shard of Broken Hope' (Digital Files, Damaged), 'KX-9 Neuro-Disruptor' (Cyberware, Good), 'Crimson Viper Serum Vial' (Biological Samples, Pristine). IMPORTANT: Return ONLY the item name itself, without any introductory text like "Option 1:", quotes, or markdown formatting.`
            : ''
    }

    ${itemPrompt}`

    try {
        // Call Hugging Face Text API
        const response = await fetch(TEXT_MODEL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            },
            body: JSON.stringify({
                inputs: promptContent,
                parameters: { max_new_tokens: 150, temperature: 0.8, return_full_text: false }, // Adjusted params
                options: { wait_for_model: true },
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.warn('Hugging Face Text API Error:', response.status, errorData)
            throw new Error(`API Error: ${response.status} - ${errorData?.error || 'Unknown error'}`)
        }

        const data = await response.json()
        // HF Mistral format often returns text in data[0].generated_text
        const generatedText = data?.[0]?.generated_text?.trim()

        if (generatedText) {
            return generatedText
        } else {
            console.warn('Could not extract generated text from Hugging Face response:', data)
            throw new Error('Failed to parse generated text from HF API response.')
        }
    } catch (error) {
        console.warn('Failed to generate description via Hugging Face API:', error)
        return null // Return null on error
    }
}

/**
 * Generates text description using OpenAI API.
 * @param item - The building, gang or fixer job object.
 * @param moduleType - The type of module (Building, Gang or FixerJob).
 * @param t - The translation function.
 * @returns The generated description string or null on error.
 */
export const generateOpenAIText = async (
    item: Building | Gang | FixerJob | { type: ItemType; condition: ItemCondition; name?: string },
    moduleType: ModuleTypes | 'Item',
    t: TFunction,
    type: TextGenerationType
): Promise<string | null> => {
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const building = isBuilding ? (item as Building) : null
    const isGang = moduleType === ModuleTypes.GANG
    const gang = isGang ? (item as Gang) : null
    const isFixerJob = moduleType === ModuleTypes.FIXER_JOB
    const fixerJob = isFixerJob ? (item as FixerJob) : null
    const isItem = moduleType === 'Item'
    const plotItem = isItem ? (item as { type: ItemType; condition: ItemCondition; name?: string }) : null
    const OPENAI_API_KEY = await getOpenAIToken()
    const addName = type === TextGenerationType.DESCRIPTION

    if (!OPENAI_API_KEY) {
        return null
    }

    if ((isBuilding && !building) || (isGang && !gang) || (isFixerJob && !fixerJob) || (isItem && !plotItem)) {
        return null
    }

    // Reuse the same prompts from the Hugging Face function
    const itemPrompt = buildPromptDetails(item, moduleType, t, addName)

    // Construct the prompt content
    const promptContent = `Generate a cyberpunk-themed ${type} for a ${
        isBuilding ? 'building' : isGang ? 'gang' : isFixerJob ? 'fixer gig' : 'plot item'
    } using the following details:

    ${
        isBuilding && type === TextGenerationType.NAME
            ? `When generating the name for the building, use a Night City style. You may incorporate elements like street names, numbers, personal names, surnames, or corporate-sounding terms.`
            : ''
    }
    ${
        isGang && type === TextGenerationType.NAME
            ? `When generating the name for the gang, incorporate at least two of the following categories: adjective, animal, body part, color, neighborhood, number, place, profession, weapon, or weather phenomenon.`
            : ''
    }
    ${
        isFixerJob && type === TextGenerationType.NAME
            ? `When generating the name for the gig, use a neon-noir style.`
            : ''
    }
    ${
        isItem && type === TextGenerationType.NAME
            ? `When generating the name for the plot item, make it sound unique, potentially dangerous, valuable, or mysterious, reflecting its type and condition. Examples: 'Shard of Broken Hope' (Digital Files, Damaged), 'KX-9 Neuro-Disruptor' (Cyberware, Good), 'Crimson Viper Serum Vial' (Biological Samples, Pristine).`
            : ''
    }

    ${itemPrompt}`

    try {
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a creative cyberpunk content generator that creates vivid, detailed descriptions and names.',
                    },
                    {
                        role: 'user',
                        content: promptContent,
                    },
                ],
                max_tokens: 150,
                temperature: 0.8,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.warn('OpenAI API Error:', response.status, errorData)
            throw new Error(`API Error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`)
        }

        const data = await response.json()
        const generatedText = data?.choices?.[0]?.message?.content?.trim()

        if (generatedText) {
            return generatedText
        } else {
            console.warn('Could not extract generated text from OpenAI response:', data)
            throw new Error('Failed to parse generated text from OpenAI API response.')
        }
    } catch (error) {
        console.warn('Failed to generate description via OpenAI API:', error)
        return null // Return null on error
    }
}

/**
 * Generates text description using Gemini API.
 * @param item - The building, gang or fixer job object.
 * @param moduleType - The type of module (Building, Gang or FixerJob).
 * @param t - The translation function.
 * @returns The generated description string or null on error.
 */
export const generateGeminiText = async (
    item: Building | Gang | FixerJob | { type: ItemType; condition: ItemCondition; name?: string },
    moduleType: ModuleTypes | 'Item',
    t: TFunction,
    type: TextGenerationType
): Promise<string | null> => {
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const building = isBuilding ? (item as Building) : null
    const isGang = moduleType === ModuleTypes.GANG
    const gang = isGang ? (item as Gang) : null
    const isFixerJob = moduleType === ModuleTypes.FIXER_JOB
    const fixerJob = isFixerJob ? (item as FixerJob) : null
    const isItem = moduleType === 'Item'
    const plotItem = isItem ? (item as { type: ItemType; condition: ItemCondition; name?: string }) : null
    const GEMINI_API_KEY = await getGeminiToken()
    const addName = type === TextGenerationType.DESCRIPTION

    if (!GEMINI_API_KEY) {
        return null
    }

    if ((isBuilding && !building) || (isGang && !gang) || (isFixerJob && !fixerJob) || (isItem && !plotItem)) {
        return null
    }

    // Reuse the same prompts from the Hugging Face function
    const itemPrompt = buildPromptDetails(item, moduleType, t, addName)

    // Construct the prompt content
    let systemInstruction = `Generate a cyberpunk-themed ${type} for a ${
        isBuilding ? 'building' : isGang ? 'gang' : isFixerJob ? 'fixer gig' : 'plot item'
    } using the following details:`

    let specificInstructions = ''
    if (type === TextGenerationType.NAME) {
        systemInstruction +=
            " IMPORTANT: Respond with ONLY the generated name, nothing else. No prefixes like 'Option X:', no quotes, no markdown, no explanations."
        if (isBuilding) {
            specificInstructions =
                'When generating the name for the building, use a Night City style. You may incorporate elements like street names, numbers, personal names, surnames, or corporate-sounding terms.'
        } else if (isGang) {
            specificInstructions =
                'When generating the name for the gang, incorporate at least two of the following categories: adjective, animal, body part, color, neighborhood, number, place, profession, weapon, or weather phenomenon.'
        } else if (isFixerJob) {
            specificInstructions = 'When generating the name for the gig, use a neon-noir style.'
        } else if (isItem) {
            specificInstructions = `When generating the name for the plot item, make it sound unique, potentially dangerous, valuable, or mysterious, reflecting its type and condition. Examples: 'Shard of Broken Hope' (Digital Files, Damaged), 'KX-9 Neuro-Disruptor' (Cyberware, Good), 'Crimson Viper Serum Vial' (Biological Samples, Pristine).`
        }
    }

    const details = itemPrompt
    const promptContent = `${systemInstruction}\n\n${specificInstructions}\n\nDetails:\n${details}`

    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

        // Get the gemini-2.0-flash model (newer version that's supported)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        // Generate content with the correct format
        const result = await model.generateContent([{ text: promptContent }])

        // Check if we have a valid response
        if (result.response && result.response.text) {
            const generatedText = result.response.text()
            return generatedText
        } else {
            console.warn('Could not extract generated text from Gemini response:', result)
            throw new Error('Failed to parse generated text from Gemini API response.')
        }
    } catch (error) {
        console.warn('Failed to generate description via Gemini API:', error)
        return null // Return null on error
    }
}

/**
 * Generates text with fallback strategy: tries Gemini first, then HuggingFace, then OpenAI, then falls back to local generation.
 * @param item - The building, gang or fixer job object.
 * @param moduleType - The type of module (Building, Gang or FixerJob).
 * @param t - The translation function.
 * @returns The generated description string or null on error.
 */
export const generateTextWithFallback = async (
    item: Building | Gang | FixerJob | { type: ItemType; condition: ItemCondition; name?: string },
    moduleType: ModuleTypes | 'Item',
    t: TFunction,
    type: TextGenerationType
): Promise<string | null> => {
    // Try Gemini first
    let geminiResult = await generateGeminiText(item, moduleType, t, type)

    if (geminiResult) {
        // Universal cleanup for NAME type: Prioritize bolded text extraction
        if (type === TextGenerationType.NAME) {
            let potentialName = geminiResult
            // Try to extract bolded text first
            const boldMatch = geminiResult.match(/\*\*(.*?)\*\*/)
            if (boldMatch && boldMatch[1]) {
                potentialName = boldMatch[1].trim()
            }

            // Remove common prefixes like "Option X:" or "**Option X:**" from the potential name
            potentialName = potentialName
                .replace(/^\*\*Option\s+\d+\s*(?:\(.*?\))?\s*:?\s*\*\*\s*/i, '') // Handles **Option X:...**
                .replace(/^Option\s+\d+\s*(?:\(.*?\))?\s*:?\s*/i, '') // Handles Option X:...
                .replace(/^Options\s+(?:for|emphasizing|highlighting).*?:\s*/i, '')
                .replace(/^\*\*/, '')
                .replace(/\*\*$/, '') // Remove leading/trailing ** if missed
                .trim()

            // If bold extraction and prefix removal yielded a result, use it
            if (potentialName && potentialName !== geminiResult.trim()) {
                // Check if something was actually extracted/cleaned
                geminiResult = potentialName
            } else {
                // If no bold text or prefix found/removed, apply original fallbacks to the initial result
                geminiResult = geminiResult
                    .replace(/^\*\*Option\s+\d+\s*(?:\(.*?\))?\s*:?\s*\*\*\s*/i, '') // Redundant but safe
                    .replace(/^Option\s+\d+\s*(?:\(.*?\))?\s*:?\s*/i, '')
                    .replace(/^Options\s+(?:for|emphasizing|highlighting).*?:\s*/i, '')
                    .trim()

                const nameMatch = geminiResult.match(/(?:"|'|«)([^*"'»]+)(?:"|'|»)/) // Check quotes
                if (nameMatch && nameMatch[1]) {
                    geminiResult = nameMatch[1].trim()
                } else if (geminiResult.includes(':')) {
                    // Check colon
                    const colonSplit = geminiResult.split(':')
                    if (colonSplit.length > 1) {
                        // Take the part after the *last* colon, trim whitespace
                        const lastPart = colonSplit.pop()
                        if (typeof lastPart === 'string') {
                            geminiResult = lastPart.trim()
                            // If the result is just a number (like from "Option 1"), try the segment before it
                            if (/^\d+$/.test(geminiResult) && colonSplit.length > 0) {
                                const secondLastPart = colonSplit.pop()
                                if (typeof secondLastPart === 'string') {
                                    geminiResult = secondLastPart.trim()
                                }
                            }
                        }
                    }
                } else {
                    // Final fallback: take the first line if it doesn't look like a leftover prefix
                    const firstLine = geminiResult.split('\n')[0].trim()
                    if (!/^option/i.test(firstLine)) {
                        geminiResult = firstLine
                    }
                    // If the first line *still* looks like a prefix, we might have an issue
                    // Consider leaving the (potentially messy) potentialName as a last resort? Or return null?
                    // For now, let's stick with the first line if it's not 'option...'
                }
            }
            // Final trim
            geminiResult = geminiResult.trim()
        }

        // For descriptions (any module type), remove any explanatory text at the beginning or end
        if (type === TextGenerationType.DESCRIPTION) {
            // Remove phrases like "Here is a description..." or "Based on the details provided..."
            geminiResult = geminiResult
                .replace(/^(?:here is|here's|this is|based on|i've created|i have created)[^]*?:/i, '')
                .replace(/^[^]*?description[^]*?:/i, '')
                .trim()

            // Remove explanatory notes at the end
            geminiResult = geminiResult.replace(/\n\s*(?:note|this description|feel free|i hope)[^]*$/i, '').trim()
        }

        return geminiResult
    }

    // If Gemini fails, try HuggingFace
    const huggingFaceResult = await generateHuggingFaceText(item, moduleType, t, type)
    if (huggingFaceResult) {
        return huggingFaceResult
    }

    // If HuggingFace fails, try OpenAI
    const openAIResult = await generateOpenAIText(item, moduleType, t, type)
    if (openAIResult) {
        return openAIResult
    }

    // If all API methods fail, return null (no local generation for Item)
    if (moduleType === 'Item') {
        return null
    }

    // If all fail, return null
    return null
}

/**
 * Generates an image using Hugging Face API based on description and name.
 * @param description - The item's description.
 * @param name - The item's name.
 * @returns The generated image Blob, or null on error.
 */
export const generateHuggingFaceImage = async (
    description: string,
    name: string,
    moduleType?: ModuleTypes,
    subModuleType?: subModuleType
): Promise<Blob | null> => {
    const HUGGINGFACE_API_TOKEN = await getHuggingFaceToken()
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const isGang = moduleType === ModuleTypes.GANG

    if (!HUGGINGFACE_API_TOKEN) {
        console.warn('Hugging Face token is missing, cannot generate image.')
        return null
    }

    if (!description || !name) {
        console.warn('Description and name are required for image generation.')
        return null
    }

    const imagePrompt = `Generate a cyberpunk-themed image of ${
        isBuilding
            ? 'a unique building'
            : isGang
            ? 'a gang of street operatives in a striking pose'
            : subModuleType && subModuleType === 'Character'
            ? 'a character'
            : subModuleType && subModuleType === 'Item'
            ? 'an item'
            : 'a fixer contract or gig scenario visualized as a high-tech operation'
    }.

    Name: ${name}
    Description: ${description}

    Use the description to determine visual style, setting, and mood. 
    Focus on strong composition, atmospheric details, and a believable cyberpunk world. 
    Prioritize clarity, depth, and relevant visual elements that match the subject.`

    try {
        // Call Hugging Face Image API
        const response = await fetch(IMAGE_MODEL_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'image/jpeg', // Request JPEG format
            },
            body: JSON.stringify({
                inputs: imagePrompt,
                options: { wait_for_model: true }, // Use options for wait_for_model
            }),
        })

        if (!response.ok) {
            // Try to parse error JSON, but handle cases where it might not be JSON
            let errorDetails = 'Check model status or prompt'
            try {
                const errorData = await response.json()
                errorDetails = errorData?.error || JSON.stringify(errorData)
            } catch (e) {
                console.warn(`Hugging Face API Error: ${e}`)
                // If it's not JSON, just continue
            }
            console.warn(`Hugging Face API Error: ${response.status} - ${errorDetails}`)
            throw new Error(`API Error: ${response.status} - ${errorDetails}`)
        }

        // Get the blob directly from the response
        const imageBlob = await response.blob()
        return imageBlob
    } catch (error) {
        console.warn('Failed to generate image via Hugging Face API:', error)
        return null // Return null on error
    }
}

/**
 * Generates an image using OpenAI DALL-E 3 API based on description and name.
 * @param description - The item's description.
 * @param name - The item's name.
 * @returns The generated image Blob, or null on error.
 */
export const generateOpenAIImage = async (
    description: string,
    name: string,
    moduleType?: ModuleTypes,
    subModuleType?: subModuleType
): Promise<Blob | null> => {
    const OPENAI_API_KEY = await getOpenAIToken()
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const isGang = moduleType === ModuleTypes.GANG

    if (!OPENAI_API_KEY) {
        console.warn('OpenAI token is missing, cannot generate image.')
        return null
    }

    if (!description || !name) {
        console.warn('Description and name are required for image generation.')
        return null
    }

    const imagePrompt = `Generate a cyberpunk-themed image of ${
        isBuilding
            ? 'a unique building'
            : isGang
            ? 'a gang of street operatives in a striking pose'
            : subModuleType && subModuleType === 'Character'
            ? 'a character'
            : subModuleType && subModuleType === 'Item'
            ? 'an item'
            : 'a fixer contract or gig scenario visualized as a high-tech operation'
    }.

    Name: ${name}
    Description: ${description}

    Use the description to determine visual style, setting, and mood. 
    Focus on strong composition, atmospheric details, and a believable cyberpunk world. 
    Prioritize clarity, depth, and relevant visual elements that match the subject.`

    try {
        // Call OpenAI Image API (DALL-E 3)
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: imagePrompt,
                n: 1,
                size: '1024x1024',
                response_format: 'url', // Use URL format to get image URL to download
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.warn('OpenAI API Error:', response.status, errorData)
            throw new Error(`API Error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`)
        }

        const data = await response.json()
        const imageUrl = data?.data?.[0]?.url

        if (!imageUrl) {
            console.warn('No image URL received from OpenAI:', data)
            throw new Error('Failed to get image URL from OpenAI API response.')
        }

        // Download the image from the provided URL
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        // Get the blob from the image response
        const imageBlob = await imageResponse.blob()
        return imageBlob
    } catch (error) {
        console.warn('Failed to generate image via OpenAI API:', error)
        return null // Return null on error
    }
}

/**
 * Generates an image using Gemini API based on description and name.
 * @param description - The item's description.
 * @param name - The item's name.
 * @returns The generated image Blob, or null on error.
 */
export const generateGeminiImage = async (
    description: string,
    name: string,
    moduleType?: ModuleTypes,
    subModuleType?: subModuleType
): Promise<Blob | null> => {
    const GEMINI_API_KEY = await getGeminiToken()
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const isGang = moduleType === ModuleTypes.GANG

    if (!GEMINI_API_KEY) {
        console.warn('Gemini token is missing, cannot generate image.')
        return null
    }

    if (!description || !name) {
        console.warn('Description and name are required for image generation.')
        return null
    }

    const imagePrompt = `Generate a cyberpunk-themed image of ${
        isBuilding
            ? 'a unique building'
            : isGang
            ? 'a gang of street operatives in a striking pose'
            : subModuleType && subModuleType === 'Character'
            ? 'a character'
            : subModuleType && subModuleType === 'Item'
            ? 'an item'
            : 'a fixer contract or gig scenario visualized as a high-tech operation'
    }.

    Name: ${name}
    Description: ${description}

    Use the description to determine visual style, setting, and mood. 
    Focus on strong composition, atmospheric details, and a believable cyberpunk world. 
    Prioritize clarity, depth, and relevant visual elements that match the subject.`

    try {
        // Call the Imagen API directly using REST - this bypasses the SDK's type limitations
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instances: [
                        {
                            prompt: imagePrompt,
                        },
                    ],
                    parameters: {
                        sampleCount: 1,
                    },
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.warn('Imagen API Error:', response.status, errorData)
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
        }

        const data = await response.json()

        // Extract the image data from the response - different format for predict API
        if (data?.predictions?.[0]?.bytesBase64Encoded) {
            const imageData = data.predictions[0].bytesBase64Encoded

            // Convert base64 to blob
            const byteCharacters = atob(imageData)
            const byteArrays = []

            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512)
                const byteNumbers = new Array(slice.length)

                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i)
                }

                const byteArray = new Uint8Array(byteNumbers)
                byteArrays.push(byteArray)
            }

            // Create blob from byte arrays
            const imageBlob = new Blob(byteArrays, { type: 'image/jpeg' })
            return imageBlob
        }

        console.warn('No image data received from Imagen API:', data)
        throw new Error('Failed to get image data from Imagen API response.')
    } catch (error) {
        console.warn('Failed to generate image via Imagen API:', error)
        return null // Return null on error
    }
}

export type subModuleType = 'Character' | 'Item'

/**
 * Generates an image with fallback strategy: tries Gemini first, then HuggingFace, then OpenAI.
 * @param description - The item's description.
 * @param name - The item's name.
 * @param moduleType - The type of module (Building, Gang, or FixerJob).
 * @param subModuleType - The type of sub-module (Character or Item).
 * @returns The generated image Blob, or null on error.
 */
export const generateImageWithFallback = async (
    description: string,
    name: string,
    moduleType?: ModuleTypes,
    subModuleType?: subModuleType
): Promise<Blob | null> => {
    // Try Gemini first
    const geminiResult = await generateGeminiImage(description, name, moduleType, subModuleType)
    if (geminiResult) {
        return geminiResult
    }

    // If Gemini fails, try HuggingFace
    const huggingFaceResult = await generateHuggingFaceImage(description, name, moduleType, subModuleType)
    if (huggingFaceResult) {
        return huggingFaceResult
    }

    // If HuggingFace fails, try OpenAI
    const openAIResult = await generateOpenAIImage(description, name, moduleType, subModuleType)
    if (openAIResult) {
        return openAIResult
    }
    return null
}

/**
 * Converts a Blob to a base64 string.
 * @param blob - The Blob to convert.
 * @returns A Promise that resolves to the base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const base64String = reader.result as string
            resolve(base64String)
        }
        reader.onerror = (error) => {
            reject(error)
        }
        reader.readAsDataURL(blob)
    })
}

/**
 * Handles the regeneration of an image using the Hugging Face API.
 * @param itemToRegenerate - The item to regenerate the image for.
 * @param readerMode - Whether the reader mode is active.
 * @param setIsGeneratingImage - The function to set the generating image state.
 * @param moduleType - The type of module (Building or Gang).
 * @param setIsSaving - Optional function to set the saving state.
 * @param setBuildings - The function to set the buildings state.
 * @param setBuildingToEdit - The function to set the building to edit state.
 * @param setGangs - The function to set the gangs state.
 * @param setGangToEdit - The function to set the gang to edit state.
 * @param setFixerJobs - The function to set the fixer jobs state.
 * @param setFixerJobToEdit - The function to set the fixer job to edit state.
 * @param setCharacters - The function to set the characters state.
 * @param setCharacterToEdit - The function to set the character to edit state.
 * @param setItems - The function to set the items state.
 * @param setItemToEdit - The function to set the item to edit state.
 * @param imageFieldPath - Optional path to the specific image field to update (for nested objects).
 */
export const handleRegenerateImage = async (
    itemToRegenerate: Building | Gang | FixerJob | Character | Item,
    readerMode: boolean,
    setIsGeneratingImage: (isGenerating: boolean) => void,
    moduleType: ModuleTypes,
    setIsSaving?: (isSaving: boolean) => void,
    setBuildings?: (value: SetStateAction<Building[]>) => void,
    setBuildingToEdit?: (value: SetStateAction<Building | null>) => void,
    setGangs?: (value: SetStateAction<Gang[]>) => void,
    setGangToEdit?: (value: SetStateAction<Gang | null>) => void,
    setFixerJobs?: (value: SetStateAction<FixerJob[]>) => void,
    setFixerJobToEdit?: (value: SetStateAction<FixerJob | null>) => void,
    setCharacters?: (value: SetStateAction<Character[]>) => void,
    setCharacterToEdit?: (value: SetStateAction<Character | null>) => void,
    setItems?: (value: SetStateAction<Item[]>) => void,
    setItemToEdit?: (value: SetStateAction<Item | null>) => void,
    imageFieldPath?: string
) => {
    // Set generating state
    setIsGeneratingImage(true)

    try {
        // Use description and name for image generation
        let description = ''
        if (moduleType === ModuleTypes.CHARACTER) {
            description =
                (itemToRegenerate as Character).attitude || '' + ' ' + (itemToRegenerate as Character).type || ''
        } else if (moduleType === ModuleTypes.ITEM) {
            description = (itemToRegenerate as Item).type || '' + ' ' + (itemToRegenerate as Item).condition || ''
        } else if ('description' in itemToRegenerate) {
            description = itemToRegenerate.description || ''
        }
        const name = itemToRegenerate.name || ''

        if (!description || !name) {
            enqueueSnackbar(
                <Alert severity="error">
                    <Box>
                        <Typography variant="body2">{t('common.missingInfoForImage')}</Typography>
                    </Box>
                </Alert>,
                { persist: false, autoHideDuration: 3000 }
            )
            setIsGeneratingImage(false)
            return
        }

        // Generate image with fallback strategy
        const imageBlob = await generateImageWithFallback(description, name, moduleType)

        if (!imageBlob) {
            // Show error if image generation failed
            enqueueSnackbar(
                <Alert severity="error">
                    <Box>
                        <Typography variant="body2">{t('common.imageGenerationError')}</Typography>
                    </Box>
                </Alert>,
                { persist: false, autoHideDuration: 3000 }
            )
            setIsGeneratingImage(false)
            return
        }

        // Convert blob to base64 for display
        const base64Image = await blobToBase64(imageBlob)

        // Update the appropriate state
        const updatedItem = { ...itemToRegenerate }

        // Set saving state to true before updating states
        setIsSaving?.(true)

        // If imageFieldPath is provided, update nested property
        if (imageFieldPath) {
            const setNestedProperty = <T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T => {
                const pathArray = path.split('.')
                const currentPath = pathArray[0]
                const newObj = { ...obj }

                if (pathArray.length === 1) {
                    ;(newObj as Record<string, unknown>)[currentPath] = value
                    // Base case: directly set the property
                } else {
                    // Recursive case: continue with nested object
                    const remainingPath = pathArray.slice(1).join('.')
                    const nestedObj = ((newObj as Record<string, unknown>)[currentPath] || {}) as Record<
                        string,
                        unknown
                    >
                    ;(newObj as Record<string, unknown>)[currentPath] = setNestedProperty(
                        nestedObj,
                        remainingPath,
                        value
                    )
                }

                return newObj
            }

            // Set the image at the specified path
            const updatedWithImage = setNestedProperty(updatedItem, imageFieldPath, base64Image)

            // Update the appropriate state based on module type
            if (moduleType === ModuleTypes.BUILDING && setBuildings && setBuildingToEdit) {
                const building = updatedWithImage as Building

                // If in reader mode, update the buildings array
                if (readerMode) {
                    setBuildings((prevBuildings) => {
                        return prevBuildings.map((b) => (b.ID === building.ID ? building : b))
                    })
                } else {
                    // In edit mode, update the editingBuilding
                    setBuildingToEdit(building)
                }
            } else if (moduleType === ModuleTypes.GANG && setGangs && setGangToEdit) {
                const gang = updatedWithImage as Gang

                // If in reader mode, update the gangs array
                if (readerMode) {
                    setGangs((prevGangs) => {
                        return prevGangs.map((g) => (g.ID === gang.ID ? gang : g))
                    })
                } else {
                    // In edit mode, update the editingGang
                    setGangToEdit(gang)
                }
            } else if (moduleType === ModuleTypes.FIXER_JOB && setFixerJobs && setFixerJobToEdit) {
                const fixerJob = updatedWithImage as FixerJob

                // If in reader mode, update the fixerJobs array
                if (readerMode) {
                    setFixerJobs((prevFixerJobs) => {
                        return prevFixerJobs.map((f) => (f.ID === fixerJob.ID ? fixerJob : f))
                    })
                } else {
                    // In edit mode, update the editingFixerJob
                    setFixerJobToEdit(fixerJob)
                }
            } else if (moduleType === ModuleTypes.CHARACTER && setCharacters && setCharacterToEdit) {
                const character = updatedWithImage as Character

                // If in reader mode, update the characters array
                if (readerMode) {
                    setCharacters((prevCharacters) => {
                        return prevCharacters.map((c) => (c.ID === character.ID ? character : c))
                    })
                } else {
                    // In edit mode, update the editingCharacter
                    setCharacterToEdit(character)
                }
            } else if (moduleType === ModuleTypes.ITEM && setItems && setItemToEdit) {
                const item = updatedWithImage as Item

                // If in reader mode, update the items array
                if (readerMode) {
                    setItems((prevItems) => {
                        return prevItems.map((i) => (i.ID === item.ID ? item : i))
                    })
                } else {
                    // In edit mode, update the editingItem
                    setItemToEdit(item)
                }
            }
        } else {
            // Default behavior: set image directly on the item
            updatedItem.image = base64Image

            // Update the appropriate state based on module type
            if (moduleType === ModuleTypes.BUILDING && setBuildings && setBuildingToEdit) {
                const building = updatedItem as Building

                // If in reader mode, update the buildings array
                if (readerMode) {
                    setBuildings((prevBuildings) => {
                        return prevBuildings.map((b) => (b.ID === building.ID ? building : b))
                    })
                } else {
                    // In edit mode, update the editingBuilding
                    setBuildingToEdit(building)
                }
            } else if (moduleType === ModuleTypes.GANG && setGangs && setGangToEdit) {
                const gang = updatedItem as Gang

                // If in reader mode, update the gangs array
                if (readerMode) {
                    setGangs((prevGangs) => {
                        return prevGangs.map((g) => (g.ID === gang.ID ? gang : g))
                    })
                } else {
                    // In edit mode, update the editingGang
                    setGangToEdit(gang)
                }
            } else if (moduleType === ModuleTypes.FIXER_JOB && setFixerJobs && setFixerJobToEdit) {
                const fixerJob = updatedItem as FixerJob

                // If in reader mode, update the fixerJobs array
                if (readerMode) {
                    setFixerJobs((prevFixerJobs) => {
                        return prevFixerJobs.map((f) => (f.ID === fixerJob.ID ? fixerJob : f))
                    })
                } else {
                    // In edit mode, update the editingFixerJob
                    setFixerJobToEdit(fixerJob)
                }
            }
        }

        // Show success message
        enqueueSnackbar(
            <Alert severity="success">
                <Box>
                    <Typography variant="body2">{t('common.imageGeneratedSuccess')}</Typography>
                </Box>
            </Alert>,
            { persist: false, autoHideDuration: 3000 }
        )

        // Reset saving state after updates complete
        setTimeout(() => setIsSaving?.(false), 1000)
    } catch (error) {
        console.warn('Error during image regeneration:', error)
        // Show error message
        enqueueSnackbar(
            <Alert severity="error">
                <Box>
                    <Typography variant="body2">{t('common.imageGenerationError')}</Typography>
                </Box>
            </Alert>,
            { persist: false, autoHideDuration: 3000 }
        )
        // Reset saving state on error
        setIsSaving?.(false)
    } finally {
        // Reset generating state
        setIsGeneratingImage(false)
    }
}

/**
 * Generates a cyberpunk-themed item name using AI.
 * @param itemType - The type of the item.
 * @param itemCondition - The condition of the item.
 * @param t - The translation function.
 * @returns The generated item name string or null on error.
 */
export const generateAIItemName = async (
    itemType: ItemType,
    itemCondition: ItemCondition,
    t: TFunction
): Promise<string | null> => {
    const itemDetails = { type: itemType, condition: itemCondition }

    // Use the generateTextWithFallback mechanism for item names
    // We pass 'Item' as a temporary moduleType identifier for prompt building
    const generatedName = await generateTextWithFallback(
        itemDetails, // Pass the details object
        'Item',
        t,
        TextGenerationType.NAME
    )

    return generatedName
}
