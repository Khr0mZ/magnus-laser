import { createContext, useContext } from 'react'
import { ModuleTypes } from '../utils/constants'

export interface UserPreferencesContextType {
    // Reader mode
    readerMode: boolean
    toggleReaderMode: () => Promise<void>

    // View preferences
    viewPreferences: Record<ModuleTypes, boolean>
    viewPrefsLoaded: boolean
    updateViewPreference: (moduleType: ModuleTypes, isTableView: boolean) => void

    // Animations
    animationsEnabled: boolean
    toggleAnimations: () => Promise<void>

    // Loader
    loaderEnabled: boolean
    toggleLoader: () => Promise<void>

    // Status
    isLoadingPreferences: boolean
}

export const UserPreferencesContext = createContext<UserPreferencesContextType>({
    readerMode: false,
    toggleReaderMode: async () => {},

    viewPreferences: {} as Record<ModuleTypes, boolean>,
    viewPrefsLoaded: false,
    updateViewPreference: () => {},

    animationsEnabled: true,
    toggleAnimations: async () => {},

    loaderEnabled: true,
    toggleLoader: async () => {},

    isLoadingPreferences: true,
})

export const useUserPreferences = () => useContext(UserPreferencesContext)
