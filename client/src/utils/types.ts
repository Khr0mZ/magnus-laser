import { SelectChangeEvent } from '@mui/material'
import { ChangeEvent } from 'react'
import { BribeTarget, ContrabandTarget, DrugTarget, MurderTarget, TheftTarget } from '../graphql/types'

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

export const TheftTargetRank = {
    [TheftTarget.POOR_SOUL]: 1,
    [TheftTarget.VENDIT]: 2,
    [TheftTarget.OASIS]: 3,
    [TheftTarget.PUBLIC_ELEMENT]: 4,
    [TheftTarget.MINI_CORP]: 5,
    [TheftTarget.MEGA_CORP]: 6,
}

export const MurderTargetRank = {
    [MurderTarget.GANGER]: 1,
    [MurderTarget.CITIZEN]: 2,
    [MurderTarget.CORPO]: 3,
    [MurderTarget.COP]: 4,
    [MurderTarget.EXEC]: 5,
    [MurderTarget.POLITICIAN]: 6,
}

export const ContrabandTargetRank = {
    [ContrabandTarget.COSTLY]: 1,
    [ContrabandTarget.PREMIUM]: 2,
    [ContrabandTarget.EXPENSIVE]: 3,
    [ContrabandTarget.VERY_EXPENSIVE]: 4,
    [ContrabandTarget.LUXURY]: 5,
    [ContrabandTarget.SUPER_LUXURY]: 6,
}

export const DrugTargetRank = {
    [DrugTarget.SMASH]: 1,
    [DrugTarget.STIM]: 2,
    [DrugTarget.BLUE_GLASS]: 3,
    [DrugTarget.SYNTHCOKE]: 4,
    [DrugTarget.BOOST]: 5,
    [DrugTarget.BLACK_LACE]: 6,
}

export const BribeTargetRank = {
    [BribeTarget.GANGER]: 1,
    [BribeTarget.CITIZEN]: 2,
    [BribeTarget.CORPO]: 3,
    [BribeTarget.COP]: 4,
    [BribeTarget.EXEC]: 5,
    [BribeTarget.POLITICIAN]: 6,
}
