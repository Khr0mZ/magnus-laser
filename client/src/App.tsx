import { ThemeProvider } from '@emotion/react'
import { createTheme, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CustomScrollbar from './components/CustomScrollbar'
import CyberpunkLoader, { LOADER_DISPLAY_TIME, LoadingStatus } from './components/CyberpunkLoader'
import NavigationDrawer from './components/NavigationDrawer/NavigationDrawer'
import { DataProvider, useData } from './contexts/DataContext'
import { ReaderModeContext } from './contexts/ReaderModeContext'
import UserProvider from './contexts/UserContext'
import './i18n' // Import i18n configuration
import './index.css'
import NavigationPaths from './navigation'
import { ModuleTypes } from './utils/constants'
import { DATA_IMPORT_EVENT, loadAllViewPreferences, loadReaderMode, saveReaderMode } from './utils/storage'
import { getDesignTokens } from './utils/theme'
import BuildingView from './views/Building/BuildingView'
import Corporation from './views/Corporation/CorporationView'
import Dashboard from './views/Dashboard/Dashboard'
import FixerJob from './views/FixerJob/FixerJobView'
import GangView from './views/Gang/GangView'
import NPC from './views/NPC/NPCView'
import SettingsView from './views/Settings/SettingsView'

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

const AppContent = (): JSX.Element => {
    // State to track if reader mode is enabled
    const [readerMode, setReaderMode] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const { isLoading } = useData()

    // Global view preferences
    const [viewPreferences, setViewPreferences] = useState<Record<ModuleTypes, boolean>>(
        {} as Record<ModuleTypes, boolean>
    )
    const [viewPrefsLoaded, setViewPrefsLoaded] = useState(false)

    // Loading status for different data types
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
        readerMode: false,
        viewPreferences: false,
        buildingsData: false,
        gangsData: false,
        systemInit: false,
    })

    // Load data directly from IndexedDB at startup
    useEffect(() => {
        const init = async () => {
            try {
                // Update system init started
                setLoadingStatus((prev) => ({ ...prev, systemInit: true }))

                // Load everything in parallel
                const [dbReaderMode, allViewPrefs] = await Promise.all([loadReaderMode(), loadAllViewPreferences()])

                // Set states with loaded data
                setReaderMode(dbReaderMode)
                setViewPreferences(allViewPrefs)
                setViewPrefsLoaded(true)

                // Update loading status
                setLoadingStatus((prev) => ({
                    ...prev,
                    readerMode: true,
                    viewPreferences: true,
                }))
            } catch (error) {
                console.error('Error loading preferences:', error)
            } finally {
                // Show loader for at least LOADER_DISPLAY_TIME ms regardless of actual loading speed
                const minLoaderTimer = setTimeout(() => {
                    setIsInitialized(true)
                }, LOADER_DISPLAY_TIME)

                return () => clearTimeout(minLoaderTimer)
            }
        }

        init()
    }, [])

    // Update loading status when data loads
    useEffect(() => {
        if (!isLoading) {
            setLoadingStatus((prev) => ({
                ...prev,
                buildingsData: true,
                gangsData: true,
            }))
            // Add console log to verify loading status is updated
            console.log('Data loading complete: buildings and gangs data loaded')
        }
    }, [isLoading])

    // Set system init to true immediately to prevent progress resets
    // This will allow progress bars to move only forward
    useEffect(() => {
        // Mark system init as complete immediately
        setLoadingStatus((prev) => ({
            ...prev,
            systemInit: true,
        }))
        console.log('System initialization completed')
    }, [])

    const toggleReaderMode = async () => {
        const newReaderMode = !readerMode
        setReaderMode(newReaderMode)
        // Save the preference when toggled (only to IndexedDB)
        await saveReaderMode(newReaderMode)
    }

    // Apply reader-mode class to body when reader mode changes
    useEffect(() => {
        if (readerMode) {
            document.body.classList.add('reader-mode')
        } else {
            document.body.classList.remove('reader-mode')
        }
    }, [readerMode])

    // Listen for data import events to update reader mode
    useEffect(() => {
        const handleDataImport = async () => {
            try {
                // After data import, reload all preferences
                const [importedReaderMode, importedViewPrefs] = await Promise.all([
                    loadReaderMode(),
                    loadAllViewPreferences(),
                ])

                // Update all states
                setReaderMode(importedReaderMode)
                setViewPreferences(importedViewPrefs)
            } catch (error) {
                console.error('Error reloading preferences after import:', error)
            }
        }

        window.addEventListener(DATA_IMPORT_EVENT, handleDataImport)

        return () => {
            window.removeEventListener(DATA_IMPORT_EVENT, handleDataImport)
        }
    }, [])

    // Function to update a specific view preference
    const updateViewPreference = (moduleType: ModuleTypes, isTableView: boolean) => {
        setViewPreferences((prev) => ({
            ...prev,
            [moduleType]: isTableView,
        }))
    }

    // Show loading screen while initializing
    if (!isInitialized) {
        return <CyberpunkLoader loadingStatus={loadingStatus} />
    }

    return (
        <ViewPreferencesContext.Provider value={{ viewPreferences, viewPrefsLoaded, updateViewPreference }}>
            <ReaderModeContext.Provider value={{ readerMode, toggleReaderMode }}>
                <ThemeProvider theme={createTheme(getDesignTokens(readerMode ? 'light' : 'dark'))}>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={5}>
                        <BrowserRouter>
                            <NavigationDrawer />
                            <CustomScrollbar scrollDirection="vertical">
                                <Suspense fallback={<div>🥷🥷🥷🥷</div>}>
                                    <Routes>
                                        <Route path={NavigationPaths.DASHBOARD} element={<Dashboard />} />
                                        <Route path={NavigationPaths.GANG} element={<GangView />} />
                                        <Route path={NavigationPaths.CORPORATION} element={<Corporation />} />
                                        <Route path={NavigationPaths.FIXER_JOB} element={<FixerJob />} />
                                        <Route path={NavigationPaths.NPC} element={<NPC />} />
                                        <Route path={NavigationPaths.BUILDING} element={<BuildingView />} />
                                        <Route path={NavigationPaths.SETTINGS} element={<SettingsView />} />
                                    </Routes>
                                </Suspense>
                            </CustomScrollbar>
                        </BrowserRouter>
                    </SnackbarProvider>
                </ThemeProvider>
            </ReaderModeContext.Provider>
        </ViewPreferencesContext.Provider>
    )
}

const App = (): JSX.Element => {
    return (
        <UserProvider>
            <DataProvider>
                <AppContent />
            </DataProvider>
        </UserProvider>
    )
}

export default App
