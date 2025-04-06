import { Alert, Box, Typography } from '@mui/material'
import { t, TFunction } from 'i18next'
import { closeSnackbar, enqueueSnackbar } from 'notistack'
import { SetStateAction } from 'react'
import { Building, Gang } from '../graphql/types'
import { ModuleTypes } from './constants'

// Restore Hugging Face constants
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN
const TEXT_MODEL_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1' // Or your preferred HF text model
const IMAGE_MODEL_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0' // Or your preferred HF image model

// Basic check if the key exists
if (!HUGGINGFACE_API_TOKEN) {
    console.error('Hugging Face API token (VITE_HUGGINGFACE_TOKEN) is missing. Please add it to your .env file.')
}

/**
 * Generates text description using Hugging Face API.
 * @param item - The building or gang object.
 * @param moduleType - The type of module (Building or Gang).
 * @param t - The translation function.
 * @returns The generated description string or null on error.
 */
export const generateHuggingFaceDescription = async (
    item: Building | Gang,
    moduleType: ModuleTypes,
    t: TFunction
): Promise<string | null> => {
    const isBuilding = moduleType === ModuleTypes.BUILDING
    const building = isBuilding ? (item as Building) : null
    const gang = !isBuilding ? (item as Gang) : null

    if (!HUGGINGFACE_API_TOKEN) {
        console.error('Hugging Face token is missing, cannot generate description.')
        return null
    }

    if ((isBuilding && !building) || (!isBuilding && !gang)) {
        console.error('Invalid item provided for description generation.')
        return null
    }

    // Construct the prompt (same logic as before)
    const promptContent = `
    Generate a cyberpunk-themed description (max 100 words) for a ${
        isBuilding ? 'building' : 'gang'
    } with these details:
    ${
        building
            ? `
    Name: ${building.name},
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
            : gang
            ? `
    Name: ${gang.name},
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
            : ''
    }
    `

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
export const generateHuggingFaceImage = async (description: string, name: string): Promise<Blob | null> => {
    if (!HUGGINGFACE_API_TOKEN) {
        console.error('Hugging Face token is missing, cannot generate image.')
        return null
    }

    if (!description || !name) {
        console.error('Description and name are required for image generation.')
        return null
    }

    const imagePrompt = `Create a cinematic, cyberpunk-themed image of the following:
    Name: ${name},
    Description: ${description}`

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

        const reader = new FileReader()
        reader.onerror = (error) => {
            console.error('FileReader error:', error)
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
            // Alternatively, reject directly:
            // reject(new Error(`Cannot convert Blob of type ${blob.type} to Base64 Data URL.`));
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
 */
export const handleRegenerateImage = async (
    itemToRegenerate: Building | Gang,
    readerMode: boolean,
    setIsGeneratingImage: (isGenerating: boolean) => void,
    setIsSaving: (isSaving: boolean) => void,
    moduleType: ModuleTypes,
    setBuildings?: (value: SetStateAction<Building[]>) => void,
    setBuildingToEdit?: (value: SetStateAction<Building | null>) => void,
    setGangs?: (value: SetStateAction<Gang[]>) => void,
    setGangToEdit?: (value: SetStateAction<Gang | null>) => void
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

    try {
        const blob = await generateHuggingFaceImage(itemToRegenerate.description, itemToRegenerate.name)
        if (blob) {
            const base64Image = await blobToBase64(blob)
            if (moduleType === ModuleTypes.BUILDING && setBuildings && setBuildingToEdit) {
                setBuildings((prevBuildings) =>
                    prevBuildings.map((b: Building) =>
                        b.ID === itemToRegenerate.ID ? { ...b, image: base64Image } : b
                    )
                )
                setBuildingToEdit((prev) =>
                    prev && prev.ID === itemToRegenerate.ID ? { ...prev, image: base64Image } : prev
                )
            } else if (moduleType === ModuleTypes.GANG && setGangs && setGangToEdit) {
                setGangs((prevGangs) =>
                    prevGangs.map((g: Gang) => (g.ID === itemToRegenerate.ID ? { ...g, image: base64Image } : g))
                )
                setGangToEdit((prev) =>
                    prev && prev.ID === itemToRegenerate.ID ? { ...prev, image: base64Image } : prev
                )
            }
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
        } else {
            throw new Error(t('common.imageGenerationFailed'))
        }
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
        setIsGeneratingImage(false)
    }
}
