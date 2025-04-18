import { ThemeProvider } from '@emotion/react'
import { CssBaseline, createTheme as muiCreateTheme } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CustomScrollbar from './components/CustomScrollbar'
import CyberpunkLoader from './components/CyberpunkLoader'
import NavigationDrawer from './components/NavigationDrawer/NavigationDrawer'
import { AnimationsProvider } from './contexts/AnimationsContext'
import { DataProvider } from './contexts/DataContext'
import { ReaderModeContext } from './contexts/ReaderModeContext'
import UserProvider from './contexts/UserContext'
import { ViewPreferencesContext } from './contexts/ViewPreferencesContext'
import { useAppInitialization } from './hooks/useAppInitialization'
import './i18n'
import './index.css'
import NavigationPaths from './navigation'
import { getDesignTokens } from './utils/theme'
import BuildingView from './views/Building/BuildingView'
import Corporation from './views/Corporation/CorporationView'
import Dashboard from './views/Dashboard/Dashboard'
import FixerJob from './views/FixerJob/FixerJobView'
import GangView from './views/Gang/GangView'
import NPC from './views/NPC/NPCView'
import SettingsView from './views/Settings/SettingsView'

const AppContent = (): JSX.Element => {
    const {
        readerMode,
        viewPreferences,
        viewPrefsLoaded,
        isInitialized,
        isLoadingPreferences,
        loadingStatus,
        toggleReaderMode,
        updateViewPreference,
        handleLoaderComplete,
        setStorageCleanupComplete,
    } = useAppInitialization()

    // If preferences are still loading, render nothing (or a minimal placeholder)
    if (isLoadingPreferences) {
        return <></>
    }

    // Show loading screen while initializing (after preferences are loaded)
    if (!isInitialized) {
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
        <ViewPreferencesContext.Provider value={{ viewPreferences, viewPrefsLoaded, updateViewPreference }}>
            <ReaderModeContext.Provider value={{ readerMode, toggleReaderMode }}>
                <ThemeProvider theme={muiCreateTheme(getDesignTokens(readerMode ? 'light' : 'dark'))}>
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
                <AnimationsProvider>
                    <AppContent />
                </AnimationsProvider>
            </DataProvider>
        </UserProvider>
    )
}

export default App
