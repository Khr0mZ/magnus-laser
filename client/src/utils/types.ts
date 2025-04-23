import { SelectChangeEvent } from '@mui/material'
import { ChangeEvent } from 'react'

export type TableColumn = {
    key: string
    label: string
}

// Define a unified building name components structure
export type NameComponents = {
    buildingTypeWords: string[]
    styleAdjectives: string[]
    preferredPatterns: number[]
    nameModifier: (name: string, typeWord: string, suffix: string) => string
    corpoAffiliation: boolean
}
export type FieldProps = {
    value: string
    onChange: (e: SelectChangeEvent<string> | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export type ImageFieldProps = {
    image: string
    main: boolean
    canRegenerate: boolean
}
