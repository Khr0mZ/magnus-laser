import { ThemeProvider } from '@emotion/react'
import { createTheme, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CustomScrollbar from './components/CustomScrollbar'
import NavigationDrawer from './components/NavigationDrawer/NavigationDrawer'
import { ReaderModeContext } from './contexts/ReaderModeContext'
import UserProvider from './contexts/UserContext'
import './i18n' // Import i18n configuration
import './index.css'
import NavigationPaths from './navigation'
import { loadReaderMode, saveReaderMode } from './utils/storage'
import { getDesignTokens } from './utils/theme'
import BuildingView from './views/Building/BuildingView'
import Corporation from './views/Corporation/CorporationView'
import Dashboard from './views/Dashboard/Dashboard'
import FixerJob from './views/FixerJob/FixerJobView'
import GangView from './views/Gang/GangView'
import NPC from './views/NPC/NPCView'

const App = (): JSX.Element => {
    // State to track if reader mode is enabled - using function to initialize from localStorage
    const [readerMode, setReaderMode] = useState(() => loadReaderMode())

    const toggleReaderMode = () => {
        const newReaderMode = !readerMode
        setReaderMode(newReaderMode)
        // Save the preference when toggled
        saveReaderMode(newReaderMode)
    }

    // Apply reader-mode class to body when reader mode changes
    useEffect(() => {
        if (readerMode) {
            document.body.classList.add('reader-mode')
        } else {
            document.body.classList.remove('reader-mode')
        }
    }, [readerMode])

    return (
        <UserProvider>
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
                                    </Routes>
                                </Suspense>
                            </CustomScrollbar>
                        </BrowserRouter>
                    </SnackbarProvider>
                </ThemeProvider>
            </ReaderModeContext.Provider>
        </UserProvider>
    )
}

export default App
