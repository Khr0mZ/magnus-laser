import { ThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CustomScrollbar from './components/CustomScrollbar'
import CyberpunkLoader from './components/CyberpunkLoader'
import NavigationDrawer from './components/NavigationDrawer/NavigationDrawer'
import { DataProvider } from './contexts/DataContext'
import { useData } from './contexts/dataHooks'
import { UserPreferencesProvider } from './contexts/UserPreferencesContext'
import { useUserPreferences } from './contexts/userPreferencesHooks.ts'
import './i18n'
import './index.css'
import NavigationPaths from './navigation'
import { getDesignTokens } from './utils/theme'
import BountyView from './views/Bounty/BountyView.tsx'
import BuildingView from './views/Building/BuildingView'
import ClubView from './views/Club/ClubView.tsx'
import Dashboard from './views/Dashboard/Dashboard'
import FixerJob from './views/FixerJob/FixerJobView'
import GangView from './views/Gang/GangView'

import CharacterView from './views/Character/CharacterView.tsx'
import ItemView from './views/Item/ItemView.tsx'
import SettingsView from './views/Settings/SettingsView'

const AppContent = (): JSX.Element => {
    const { readerMode, loaderEnabled, isLoadingPreferences } = useUserPreferences()

    // Additional state for loader
    const [isInitialized, setIsInitialized] = useState(false)
    const [loadingStatus, setLoadingStatus] = useState({
        readerMode: false,
        viewPreferences: false,
        buildingsData: false,
        gangsData: false,
        fixerJobsData: false,
        systemInit: false,
        storageCleanup: false,
    })
    const { isLoading } = useData()

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

    // Set system init and preferences loaded in loading status
    useEffect(() => {
        setLoadingStatus((prev) => ({
            ...prev,
            systemInit: true,
            readerMode: true,
            viewPreferences: true,
        }))
    }, [])

    const handleLoaderComplete = () => {
        setIsInitialized(true)
    }

    const setStorageCleanupComplete = () => {
        setLoadingStatus((prev) => ({
            ...prev,
            storageCleanup: true,
        }))
    }

    // If preferences are still loading, render nothing (or a minimal placeholder)
    if (isLoadingPreferences) {
        return <></>
    }

    // Show loading screen while initializing (after preferences are loaded)
    if (!isInitialized) {
        // If loader is disabled, skip the loader and go directly to the initialized state
        if (!loaderEnabled) {
            // We need to call these to ensure the app is properly initialized
            handleLoaderComplete()
            setStorageCleanupComplete()
            return <></>
        }

        return (
            <CyberpunkLoader
                loadingStatus={loadingStatus}
                onLoadComplete={handleLoaderComplete}
                readerMode={readerMode}
                setStorageCleanupComplete={setStorageCleanupComplete}
            />
        )
    }

    return (
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
                                <Route path={NavigationPaths.FIXER_JOB} element={<FixerJob />} />
                                <Route path={NavigationPaths.CLUB} element={<ClubView />} />
                                <Route path={NavigationPaths.BOUNTY} element={<BountyView />} />
                                <Route path={NavigationPaths.CHARACTER} element={<CharacterView />} />
                                <Route path={NavigationPaths.ITEM} element={<ItemView />} />
                                <Route path={NavigationPaths.BUILDING} element={<BuildingView />} />
                                <Route path={NavigationPaths.SETTINGS} element={<SettingsView />} />
                            </Routes>
                        </Suspense>
                    </CustomScrollbar>
                </BrowserRouter>
            </SnackbarProvider>
        </ThemeProvider>
    )
}

const App = (): JSX.Element => {
    return (
        <DataProvider>
            <UserPreferencesProvider>
                <AppContent />
            </UserPreferencesProvider>
        </DataProvider>
    )
}

export default App
