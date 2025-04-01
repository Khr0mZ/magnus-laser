import { Gang, GangColor, GangStatus, GangType as GangTypeEnum, Quality } from '../../graphql/types'

// Custom GangName type for our implementation
export interface GangNameData {
    name: string
    adjective: string
}

// Type for display properties that extend the base Gang type
export interface DisplayGang extends Gang {
    id?: string
    displayName: string
    description: string
    nameData?: GangNameData
    descriptionData?: {
        type?: GangTypeEnum
        color?: GangColor
        memberQuantity?: number
        knownFor?: string | { [key: string]: string | Quality }
        currentAttitude?: string
        flaw?: string
        status?: GangStatus
    }
    memberQuantity?: number
}
