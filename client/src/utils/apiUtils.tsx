import { Alert, Box, Typography } from '@mui/material'
import { t, TFunction } from 'i18next'
import { closeSnackbar, enqueueSnackbar } from 'notistack'
import { SetStateAction } from 'react'
import { Building, FixerJob, Gang } from '../graphql/types'
import { ModuleTypes } from './constants'
import { IMAGE_MODEL_URL, TEXT_MODEL_URL, TextGenerationType } from './generators/constantsGenerators'
import { loadHuggingFaceApiKey } from './storage'

// Cache for API token
let cachedApiToken: string | null = null

// Function to get the Hugging Face API token (user-provided or from env)
const getHuggingFaceToken = async (): Promise<string> => {
    // Return cached token if available
    if (cachedApiToken !== null) {
        return cachedApiToken
    }

    // Try to load from IndexedDB
    const userToken = await loadHuggingFaceApiKey()
    if (userToken) {
        cachedApiToken = userToken
        return userToken
    }

    // Fall back to env variable
    const envToken = import.meta.env.VITE_HUGGINGFACE_TOKEN || ''
    cachedApiToken = envToken
    return envToken
}

/**
 * Generates text description using Hugging Face API.
 * @param item - The building, gang or fixer job object.
 * @param moduleType - The type of module (Building, Gang or FixerJob).
 * @param t - The translation function.
 * @returns The generated description string or null on error.
 */
export const generateHuggingFaceText = async (
    item: Building | Gang | FixerJob,
    moduleType: ModuleTypes,
    t: TFunction,
    type: TextGenerationType
): Promise<string | null> => {
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const building = isBuilding ? (item as Building) : null
    const isGang = moduleType === ModuleTypes.GANG
    const gang = isGang ? (item as Gang) : null
    const isFixerJob = moduleType === ModuleTypes.FIXER_JOB
    const fixerJob = isFixerJob ? (item as FixerJob) : null
    const HUGGINGFACE_API_TOKEN = await getHuggingFaceToken()
    const addName = type === TextGenerationType.DESCRIPTION

    if (!HUGGINGFACE_API_TOKEN) {
        console.error('Hugging Face token is missing, cannot generate description.')
        return null
    }

    if ((isBuilding && !building) || (isGang && !gang) || (isFixerJob && !fixerJob)) {
        console.error('Invalid item provided for description generation.')
        return null
    }

    const buildingPrompt =
        building &&
        `
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
    const gangPrompt =
        gang &&
        `
    ${addName ? `Name: ${gang.name}` : ''}
    Type: ${t(`gangs.type.${gang.type}`)},
    Cyberware Quality: ${t(`gangs.cyberwareQuality.${gang.cyberwareQuality}`)},
    Skill: ${gang.skill < 11 ? 'Low' : gang.skill < 14 ? 'Medium' : 'High'},
    Weapons: ${(gang.weapons?.d6 ?? 0) < 3 ? 'Low' : (gang.weapons?.d6 ?? 0) < 5 ? 'Medium' : 'High'},
    Armor Body: ${
        gang.armor?.spb < 7 ? 'Low' : gang.armor?.spb < 13 ? 'Medium' : gang.armor?.spb < 16 ? 'High' : 'Very High'
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
    // FIXME: the fixer job prompt is not complete
    const fixerJobPrompt =
        fixerJob &&
        `
${addName ? `Name: ${fixerJob.name}` : ''}
Plot Verb: ${fixerJob.plot.verb ? fixerJob.plot.verb.value || '' : ''},
${
    fixerJob.plot.subjectIfNotPlace && fixerJob.plot.subjectIfNotPlace.__typename === 'PlotCharacter'
        ? `Character Type: ${fixerJob.plot.subjectIfNotPlace.type},`
        : ''
}
${
    fixerJob.plot.subjectIfNotPlace && fixerJob.plot.subjectIfNotPlace.__typename === 'PlotCharacter'
        ? `Character Attitude: ${fixerJob.plot.subjectIfNotPlace.attitude},`
        : ''
}
${fixerJob.plot.plotPlace ? `Location: ${fixerJob.plot.plotPlace.building?.type || ''},` : ''}
${fixerJob.plot.plotPlace ? `Location Complication: ${fixerJob.plot.plotPlace.complication?.type || ''},` : ''}
${fixerJob.plot.complication ? `Plot Complication: ${fixerJob.plot.complication.type || ''},` : ''}
`

    // Construct the prompt
    const promptContent = `Generate a cyberpunk-themed ${type} for a ${
        isBuilding ? 'building' : isGang ? 'gang' : 'fixer gig'
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

    ${building ? buildingPrompt : gang ? gangPrompt : fixerJob ? fixerJobPrompt : ''}`

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
            console.error('Hugging Face Text API Error:', response.status, errorData)
            throw new Error(`API Error: ${response.status} - ${errorData?.error || 'Unknown error'}`)
        }

        const data = await response.json()
        // HF Mistral format often returns text in data[0].generated_text
        const generatedText = data?.[0]?.generated_text?.trim()

        if (generatedText) {
            return generatedText
        } else {
            console.error('Could not extract generated text from Hugging Face response:', data)
            throw new Error('Failed to parse generated text from HF API response.')
        }
    } catch (error) {
        console.error('Failed to generate description via Hugging Face API:', error)
        return null // Return null on error
    }
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
    moduleType: ModuleTypes
): Promise<Blob | null> => {
    const HUGGINGFACE_API_TOKEN = await getHuggingFaceToken()
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const isGang = moduleType === ModuleTypes.GANG

    if (!HUGGINGFACE_API_TOKEN) {
        console.error('Hugging Face token is missing, cannot generate image.')
        return null
    }

    if (!description || !name) {
        console.error('Description and name are required for image generation.')
        return null
    }

    const imagePrompt = `Generate a cyberpunk-themed image of ${
        isBuilding
            ? 'a unique building'
            : isGang
            ? 'a gang of street operatives in a striking pose'
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
                console.error('Error data:', e)
                errorDetails = await response.text() // Fallback to text response
            }
            console.error('Hugging Face Image API Error:', response.status, errorDetails)
            throw new Error(`API Error: ${response.status} - ${errorDetails}`)
        }

        // Expecting a blob directly for image responses
        const imageBlob = await response.blob()
        if (imageBlob.type !== 'image/jpeg') {
            console.warn(`Received unexpected content type: ${imageBlob.type}`)
            // Optional: Handle non-image blobs if necessary, otherwise it might fail later
        }
        return imageBlob
    } catch (error) {
        console.error('Failed to generate image via Hugging Face API:', error)
        return null // Return null on error
    }
}

/**
 * Converts a Blob object to a Base64 Data URL string.
 * @param blob - The Blob object to convert.
 * @returns A Promise that resolves with the Base64 Data URL string, or rejects on error.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Ensure blob is not null or undefined
        if (!blob) {
            return reject(new Error('Blob cannot be null or undefined.'))
        }

        // Check if blob is too large (>5MB)
        if (blob.size > 5 * 1024 * 1024) {
            console.warn('Large image detected, consider compressing before storage', blob.size)
        }

        const reader = new FileReader()
        reader.onerror = (error) => {
            console.error('FileReader error:', error)
            reader.abort() // Explicitly abort on error
            reject(error)
        }
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
            } else {
                // Handle cases where result is ArrayBuffer or null
                console.error('FileReader result is not a string:', reader.result)
                reject(new Error('Failed to read blob as Base64 string.'))
            }
            // Clean up reader after use
            reader.onload = null
            reader.onerror = null
        }
        // Check if blob type indicates it's likely readable as Data URL
        if (
            blob.type &&
            (blob.type.startsWith('image/') || blob.type === 'application/json' || blob.type === 'text/plain')
        ) {
            reader.readAsDataURL(blob)
        } else {
            console.warn(`Attempting to read blob of type ${blob.type} as Data URL. This might not be intended.`)
            reader.readAsDataURL(blob) // Proceed but warn
        }
    })
}

/**
 * Handles the regeneration of an image using the Hugging Face API.
 * @param itemToRegenerate - The item to regenerate the image for.
 * @param readerMode - Whether the reader mode is active.
 * @param setIsGeneratingImage - The function to set the generating image state.
 * @param setIsSaving - The function to set the saving state.
 * @param moduleType - The type of module (Building or Gang).
 * @param setBuildings - The function to set the buildings state.
 * @param setBuildingToEdit - The function to set the building to edit state.
 * @param setGangs - The function to set the gangs state.
 * @param setGangToEdit - The function to set the gang to edit state.
 * @param setFixerJobs - The function to set the fixer jobs state.
 * @param setFixerJobToEdit - The function to set the fixer job to edit state.
 * @param imageFieldPath - Optional path to the specific image field to update (for nested objects).
 */
export const handleRegenerateImage = async (
    itemToRegenerate: Building | Gang | FixerJob,
    readerMode: boolean,
    setIsGeneratingImage: (isGenerating: boolean) => void,
    setIsSaving: (isSaving: boolean) => void,
    moduleType: ModuleTypes,
    setBuildings?: (value: SetStateAction<Building[]>) => void,
    setBuildingToEdit?: (value: SetStateAction<Building | null>) => void,
    setGangs?: (value: SetStateAction<Gang[]>) => void,
    setGangToEdit?: (value: SetStateAction<Gang | null>) => void,
    setFixerJobs?: (value: SetStateAction<FixerJob[]>) => void,
    setFixerJobToEdit?: (value: SetStateAction<FixerJob | null>) => void,
    imageFieldPath?: string
) => {
    if (!itemToRegenerate.description || !itemToRegenerate.name) {
        enqueueSnackbar('', {
            variant: 'warning',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
            content: (key) => (
                <Alert
                    severity="warning"
                    sx={{
                        bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                        color: readerMode ? '#333' : '#fff',
                        borderLeft: '4px solid',
                        borderColor: 'warning.main',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    onClose={() => closeSnackbar(key)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{t('common.missingInfoForImage')}</Typography>
                    </Box>
                </Alert>
            ),
        })
        return
    }

    setIsGeneratingImage(true)
    let generatedBlob: Blob | null = null

    try {
        generatedBlob = await generateHuggingFaceImage(itemToRegenerate.description, itemToRegenerate.name, moduleType)
        if (!generatedBlob) {
            throw new Error(t('common.imageGenerationFailed'))
        }

        const base64Image = await blobToBase64(generatedBlob)

        // Helper function to set a nested property by path string
        const setNestedProperty = <T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T => {
            if (!path) return { ...obj, image: value } as T // Default to main image if no path

            const parts = path.split('.')
            const result = { ...obj }
            let current = result as Record<string, unknown>

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i]
                if (!(part in current)) {
                    current[part] = {}
                } else {
                    current[part] = { ...(current[part] as Record<string, unknown>) }
                }
                current = current[part] as Record<string, unknown>
            }

            current[parts[parts.length - 1]] = value
            return result
        }

        // Update the appropriate state based on the module type
        if (setBuildings && moduleType === ModuleTypes.BUILDING) {
            setBuildings((prevBuildings) =>
                prevBuildings.map((b) =>
                    b.ID === itemToRegenerate.ID ? setNestedProperty(b, imageFieldPath || 'image', base64Image) : b
                )
            )

            if (setBuildingToEdit) {
                setBuildingToEdit((prev) =>
                    prev && prev.ID === itemToRegenerate.ID
                        ? setNestedProperty(prev, imageFieldPath || 'image', base64Image)
                        : prev
                )
            }
        } else if (setGangs && moduleType === ModuleTypes.GANG) {
            setGangs((prevGangs) =>
                prevGangs.map((g) =>
                    g.ID === itemToRegenerate.ID ? setNestedProperty(g, imageFieldPath || 'image', base64Image) : g
                )
            )

            if (setGangToEdit) {
                setGangToEdit((prev) =>
                    prev && prev.ID === itemToRegenerate.ID
                        ? setNestedProperty(prev, imageFieldPath || 'image', base64Image)
                        : prev
                )
            }
        } else if (setFixerJobs && moduleType === ModuleTypes.FIXER_JOB) {
            setFixerJobs((prevFixerJobs) =>
                prevFixerJobs.map((j) =>
                    j.ID === itemToRegenerate.ID ? setNestedProperty(j, imageFieldPath || 'image', base64Image) : j
                )
            )

            if (setFixerJobToEdit) {
                setFixerJobToEdit((prev) =>
                    prev && prev.ID === itemToRegenerate.ID
                        ? setNestedProperty(prev, imageFieldPath || 'image', base64Image)
                        : prev
                )
            }
        }

        // Clear references to free memory
        generatedBlob = null

        enqueueSnackbar('', {
            variant: 'success',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
            content: (key) => (
                <Alert
                    severity="success"
                    sx={{
                        bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                        color: readerMode ? '#333' : '#fff',
                        borderLeft: '4px solid',
                        borderColor: 'success.main',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    onClose={() => closeSnackbar(key)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{t('common.imageGeneratedSuccess')}</Typography>
                    </Box>
                </Alert>
            ),
        })

        setIsSaving(true)
    } catch (error: unknown) {
        console.error('Error regenerating image:', error)
        const errorMessage = error instanceof Error ? error.message : t('common.imageGenerationError')

        enqueueSnackbar('', {
            variant: 'error',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
            content: (key) => (
                <Alert
                    severity="error"
                    sx={{
                        bgcolor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.9)',
                        color: readerMode ? '#333' : '#fff',
                        borderLeft: '4px solid',
                        borderColor: 'error.main',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    onClose={() => closeSnackbar(key)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{errorMessage}</Typography>
                    </Box>
                </Alert>
            ),
        })
    } finally {
        // Clean up
        generatedBlob = null
        setIsGeneratingImage(false)
    }
}
