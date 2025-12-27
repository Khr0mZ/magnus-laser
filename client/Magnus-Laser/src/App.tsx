import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import 'leaflet/dist/leaflet.css'
import { SnackbarProvider } from 'notistack'
import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CustomScrollbar from './components/CustomScrollbar'
import CyberpunkLoader from './components/CyberpunkLoader'
import { GMToolsDrawer } from './components/GMTools'
import NavigationDrawer from './components/NavigationDrawer/NavigationDrawer'
import { DataProvider } from './contexts/DataContext'
import { useData } from './contexts/dataHooks'
import { UserPreferencesProvider } from './contexts/UserPreferencesContext'
import { useUserPreferences } from './contexts/userPreferencesHooks.ts'
import './i18n'
import './index.css'
import NavigationPaths from './navigation'
import { useSession } from './state/sessionStore'
import { initCombatSimSync } from './sync/combatSimSync'
import { getDesignTokens } from './utils/theme'
import BountyView from './views/Bounty/BountyView.tsx'
import BuildingView from './views/Building/BuildingView'
import CharacterView from './views/Character/CharacterView.tsx'
import CharacterCreatorView from './views/CharacterCreator/CharacterCreatorView'
import ClubView from './views/Club/ClubView.tsx'
import CombatSimView from './views/CombatSim/CombatSimView.tsx'
import Dashboard from './views/Dashboard/Dashboard'
import EdgerunnersView from './views/Edgerunners/EdgerunnersView'
import FixerJob from './views/FixerJob/FixerJobView'
import GangView from './views/Gang/GangView'
import ItemView from './views/Item/ItemView.tsx'
import MapView from './views/Map/MapView.tsx'
import SettingsView from './views/Settings/SettingsView'
import SoloPlayView from './views/SoloPlay/SoloPlayView'

const AppContent = () => {
    const { readerMode, loaderEnabled, isLoadingPreferences } = useUserPreferences()
    const { initAutoReconnect, role, session, clearSession } = useSession()

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
        // Initialize Combat Sim sync wiring once
        initCombatSimSync()

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
        const initializeApp = async () => {
            // Auto-reconnect players to sessions on app startup
            await initAutoReconnect()

            // Clear DM session data on app refresh/reload (since Tauri process restarts)
            // In Tauri, app refresh/reload means the session hosting process is gone
            // So DM session data must be cleared to reflect the lost backend state
            // Only clear if the session is old (created more than 30 seconds ago)
            if (role === 'dm' && session && session.createdAt < Date.now() - 30000) {
                try {
                    await clearSession()
                } catch (err) {
                    console.warn('Failed to clear stale DM session:', err)
                }
            }

            setLoadingStatus((prev) => ({
                ...prev,
                systemInit: true,
                readerMode: true,
                viewPreferences: true,
            }))
        }

        initializeApp()
    }, [initAutoReconnect, role, session, clearSession])

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
                    <GMToolsDrawer />
                    <CustomScrollbar scrollDirection="vertical">
                        <Suspense fallback={<div>🥷🥷🥷🥷</div>}>
                            <Routes>
                                <Route path={NavigationPaths.DASHBOARD} element={<Dashboard />} />
                                <Route path={NavigationPaths.MAP} element={<MapView />} />
                                <Route path={NavigationPaths.COMBAT_SIM} element={<CombatSimView />} />
                                <Route path={NavigationPaths.GANG} element={<GangView />} />
                                <Route path={NavigationPaths.FIXER_JOB} element={<FixerJob />} />
                                <Route path={NavigationPaths.CLUB} element={<ClubView />} />
                                <Route path={NavigationPaths.BOUNTY} element={<BountyView />} />
                                <Route path={NavigationPaths.CHARACTER} element={<CharacterView />} />
                                <Route path={NavigationPaths.ITEM} element={<ItemView />} />
                                <Route path={NavigationPaths.BUILDING} element={<BuildingView />} />
                                <Route path={NavigationPaths.SOLO_PLAY} element={<SoloPlayView />} />
                                <Route path={NavigationPaths.CHARACTER_CREATOR} element={<CharacterCreatorView />} />
                                <Route path={NavigationPaths.EDGERUNNERS} element={<EdgerunnersView />} />
                                <Route path={NavigationPaths.SETTINGS} element={<SettingsView />} />
                            </Routes>
                        </Suspense>
                    </CustomScrollbar>
                </BrowserRouter>
            </SnackbarProvider>
        </ThemeProvider>
    )
}

const App = () => {
    return (
        <DataProvider>
            <UserPreferencesProvider>
                <AppContent />
            </UserPreferencesProvider>
        </DataProvider>
    )
}

export default App
