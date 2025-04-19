import { useEffect, useState } from 'react'
import { LoadingStatus } from '../components/CyberpunkLoader'
import { useData } from '../contexts/dataHooks'
import { ModuleTypes } from '../utils/constants'
import {
    DATA_IMPORT_EVENT,
    loadAllViewPreferences,
    loadLoaderEnabled,
    loadReaderMode,
    saveLoaderEnabled,
    saveReaderMode,
} from '../utils/storage'

export interface AppInitializationResult {
    readerMode: boolean
    viewPreferences: Record<ModuleTypes, boolean>
    viewPrefsLoaded: boolean
    isInitialized: boolean
    isLoadingPreferences: boolean
    loadingStatus: LoadingStatus
    loaderEnabled: boolean
    toggleReaderMode: () => Promise<void>
    toggleLoader: () => Promise<void>
    updateViewPreference: (moduleType: ModuleTypes, isTableView: boolean) => void
    handleLoaderComplete: () => void
    setStorageCleanupComplete: () => void
}

export const useAppInitialization = (): AppInitializationResult => {
    const [readerMode, setReaderMode] = useState(false)
    const [loaderEnabled, setLoaderEnabled] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)
    const { isLoading } = useData()
    const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
    const [viewPreferences, setViewPreferences] = useState<Record<ModuleTypes, boolean>>(
        {} as Record<ModuleTypes, boolean>
    )
    const [viewPrefsLoaded, setViewPrefsLoaded] = useState(false)
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
        readerMode: false,
        viewPreferences: false,
        buildingsData: false,
        gangsData: false,
        fixerJobsData: false,
        systemInit: false,
        storageCleanup: false,
    })

    // Load preferences and reader mode from IndexedDB
    useEffect(() => {
        const init = async () => {
            try {
                setLoadingStatus((prev) => ({ ...prev, systemInit: true }))
                const [dbReaderMode, allViewPrefs, dbLoaderEnabled] = await Promise.all([
                    loadReaderMode(),
                    loadAllViewPreferences(),
                    loadLoaderEnabled(),
                ])

                setReaderMode(dbReaderMode)
                setViewPreferences(allViewPrefs)
                setLoaderEnabled(dbLoaderEnabled)
                setViewPrefsLoaded(true)

                setLoadingStatus((prev) => ({
                    ...prev,
                    readerMode: true,
                    viewPreferences: true,
                }))
            } catch (error) {
                console.error('Error loading preferences:', error)
            } finally {
                setIsLoadingPreferences(false)
            }
        }
        init()
    }, [])

    // Update loading status based on data context
    useEffect(() => {
        if (!isLoading) {
            setLoadingStatus((prev) => ({
                ...prev,
                buildingsData: true,
                gangsData: true,
                fixerJobsData: true,
            }))
        } else {
            setLoadingStatus((prev) => ({
                ...prev,
                buildingsData: false,
                gangsData: false,
                fixerJobsData: false,
            }))
        }
    }, [isLoading])

    // Set system init to true (already done in first effect, maybe redundant?)
    // Keeping for now based on original logic, might refactor later.
    useEffect(() => {
        setLoadingStatus((prev) => ({
            ...prev,
            systemInit: true,
        }))
    }, [])

    const toggleReaderMode = async () => {
        const newReaderMode = !readerMode
        setReaderMode(newReaderMode)
        await saveReaderMode(newReaderMode)
    }

    const toggleLoader = async () => {
        const newLoaderEnabled = !loaderEnabled
        setLoaderEnabled(newLoaderEnabled)
        await saveLoaderEnabled(newLoaderEnabled)
    }

    // Apply reader-mode class to body
    useEffect(() => {
        if (readerMode) {
            document.body.classList.add('reader-mode')
        } else {
            document.body.classList.remove('reader-mode')
        }
    }, [readerMode])

    // Listen for data import events
    useEffect(() => {
        const handleDataImport = async () => {
            try {
                const [importedReaderMode, importedViewPrefs, importedLoaderEnabled] = await Promise.all([
                    loadReaderMode(),
                    loadAllViewPreferences(),
                    loadLoaderEnabled(),
                ])
                setReaderMode(importedReaderMode)
                setViewPreferences(importedViewPrefs)
                setLoaderEnabled(importedLoaderEnabled)
            } catch (error) {
                console.error('Error reloading preferences after import:', error)
            }
        }

        window.addEventListener(DATA_IMPORT_EVENT, handleDataImport)

        return () => {
            window.removeEventListener(DATA_IMPORT_EVENT, handleDataImport)
        }
    }, [])

    const updateViewPreference = (moduleType: ModuleTypes, isTableView: boolean) => {
        setViewPreferences((prev) => ({
            ...prev,
            [moduleType]: isTableView,
        }))
        // Note: Saving the updated preference to storage is handled within the SettingsView component
        // This hook only manages the state update.
    }

    const handleLoaderComplete = () => {
        setIsInitialized(true)
    }

    const setStorageCleanupComplete = () => {
        setLoadingStatus((prev) => ({
            ...prev,
            storageCleanup: true,
        }))
    }

    return {
        readerMode,
        viewPreferences,
        viewPrefsLoaded,
        isInitialized,
        isLoadingPreferences,
        loadingStatus,
        loaderEnabled,
        toggleReaderMode,
        toggleLoader,
        updateViewPreference,
        handleLoaderComplete,
        setStorageCleanupComplete,
    }
}
