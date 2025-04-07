import React from 'react'
import { ModuleTypes } from '../utils/constants'

// Create a context to share view preferences across components
export interface ViewPreferencesContextType {
    viewPreferences: Record<ModuleTypes, boolean>
    viewPrefsLoaded: boolean
    updateViewPreference: (moduleType: ModuleTypes, isTableView: boolean) => void
}

export const ViewPreferencesContext = React.createContext<ViewPreferencesContextType>({
    viewPreferences: {} as Record<ModuleTypes, boolean>,
    viewPrefsLoaded: false,
    updateViewPreference: () => {},
})
