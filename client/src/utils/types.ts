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
