declare module 'file-saver' {
    export function saveAs(data: Blob, filename: string, disableAutoBOM?: boolean): void
}

declare module 'react-leaflet-draw' {
    import { EditControlProps } from 'leaflet-draw'
    import { ComponentType } from 'react'
    export const EditControl: ComponentType<EditControlProps>
}
