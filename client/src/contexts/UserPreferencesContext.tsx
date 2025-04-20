import React, { useEffect, useState } from 'react'
import { ModuleTypes } from '../utils/constants'
import {
    DATA_IMPORT_EVENT,
    PREFERENCES_CHANGED_EVENT,
    loadAllViewPreferences,
    loadAnimationsEnabled,
    loadLoaderEnabled,
    loadReaderMode,
    saveAnimationsEnabled,
    saveLoaderEnabled,
    saveReaderMode,
} from '../utils/storage'
import { UserPreferencesContext } from './userPreferencesHooks'

interface UserPreferencesProviderProps {
    children: React.ReactNode
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
    const [readerMode, setReaderMode] = useState(false)
    const [viewPreferences, setViewPreferences] = useState<Record<ModuleTypes, boolean>>(
        {} as Record<ModuleTypes, boolean>
    )
    const [viewPrefsLoaded, setViewPrefsLoaded] = useState(false)
    const [animationsEnabled, setAnimationsEnabled] = useState(true)
    const [loaderEnabled, setLoaderEnabled] = useState(true)
    const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)

    // Load all preferences from storage on init
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const [dbReaderMode, allViewPrefs, dbAnimationsEnabled, dbLoaderEnabled] = await Promise.all([
                    loadReaderMode(),
                    loadAllViewPreferences(),
                    loadAnimationsEnabled(),
                    loadLoaderEnabled(),
                ])

                setReaderMode(dbReaderMode)
                setViewPreferences(allViewPrefs)
                setAnimationsEnabled(dbAnimationsEnabled)
                setLoaderEnabled(dbLoaderEnabled)
                setViewPrefsLoaded(true)
            } catch (error) {
                console.error('Error loading preferences:', error)
            } finally {
                setIsLoadingPreferences(false)
            }
        }

        loadPreferences()
    }, [])

    // Apply UI classes based on preferences
    useEffect(() => {
        // Reader mode class
        if (readerMode) {
            document.body.classList.add('reader-mode')
        } else {
            document.body.classList.remove('reader-mode')
        }

        // Animations class
        if (!animationsEnabled) {
            document.body.classList.add('no-animations')
        } else {
            document.body.classList.remove('no-animations')
        }
    }, [readerMode, animationsEnabled])

    // Listen for preferences changes from imports or other sources
    useEffect(() => {
        const handlePreferencesChanged = async () => {
            try {
                const [updatedReaderMode, updatedViewPrefs, updatedAnimationsEnabled, updatedLoaderEnabled] =
                    await Promise.all([
                        loadReaderMode(),
                        loadAllViewPreferences(),
                        loadAnimationsEnabled(),
                        loadLoaderEnabled(),
                    ])

                setReaderMode(updatedReaderMode)
                setViewPreferences(updatedViewPrefs)
                setAnimationsEnabled(updatedAnimationsEnabled)
                setLoaderEnabled(updatedLoaderEnabled)
            } catch (error) {
                console.error('Error reloading preferences after change:', error)
            }
        }

        // Handle both preference changes and data imports
        window.addEventListener(PREFERENCES_CHANGED_EVENT, handlePreferencesChanged)
        window.addEventListener(DATA_IMPORT_EVENT, handlePreferencesChanged)

        return () => {
            window.removeEventListener(PREFERENCES_CHANGED_EVENT, handlePreferencesChanged)
            window.removeEventListener(DATA_IMPORT_EVENT, handlePreferencesChanged)
        }
    }, [])

    // Toggle functions
    const toggleReaderMode = async () => {
        const newReaderMode = !readerMode
        setReaderMode(newReaderMode)
        await saveReaderMode(newReaderMode)
    }

    const toggleAnimations = async () => {
        const newValue = !animationsEnabled
        setAnimationsEnabled(newValue)
        await saveAnimationsEnabled(newValue)
    }

    const toggleLoader = async () => {
        const newLoaderEnabled = !loaderEnabled
        setLoaderEnabled(newLoaderEnabled)
        await saveLoaderEnabled(newLoaderEnabled)
    }

    const updateViewPreference = (moduleType: ModuleTypes, isTableView: boolean) => {
        setViewPreferences((prev) => ({
            ...prev,
            [moduleType]: isTableView,
        }))
        // Note: Saving the updated preference to storage is handled within the SettingsView component
    }

    const value = {
        readerMode,
        toggleReaderMode,

        viewPreferences,
        viewPrefsLoaded,
        updateViewPreference,

        animationsEnabled,
        toggleAnimations,

        loaderEnabled,
        toggleLoader,

        isLoadingPreferences,
    }

    return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
}

export default UserPreferencesProvider
