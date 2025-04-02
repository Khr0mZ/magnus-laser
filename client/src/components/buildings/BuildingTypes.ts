import { Building as BuildingType, BuildingType as BuildingTypeEnum, Ownership, Style } from '../../graphql/types'

// Type for our building with display properties
export type DisplayBuilding = BuildingType & {
    displayName: string
    description: string
    _nameComponents?: {
        type: BuildingTypeEnum
        style: Style
        ownership: Ownership
    }
    _descriptionData?: {
        building: BuildingType
        nameComponents: {
            type: BuildingTypeEnum
            style: Style
            ownership: Ownership
        }
    }
    _jobType: string
    _forceRegenerate?: boolean
    _nameAdjectiveIndex?: number
    _corpoIndex?: number
    _randomNumber?: number
}
