import { ThemeProvider } from '@emotion/react'
import { createTheme, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavigationDrawer from './components/NavigationDrawer/NavigationDrawer'
import { ReaderModeContext } from './contexts/ReaderModeContext'
import UserProvider from './contexts/UserContext'
import './i18n' // Import i18n configuration
import './index.css'
import NavigationPaths from './navigation'
import { getDesignTokens } from './utils/theme'
import Building from './views/Building'
import Corporation from './views/Corporation'
import Dashboard from './views/Dashboard'
import FixerJob from './views/FixerJob'
import Gang from './views/Gang'
import NPC from './views/NPC'

const App = (): JSX.Element => {
    // State to track if reader mode is enabled
    const [readerMode, setReaderMode] = useState(false)
    const toggleReaderMode = () => setReaderMode((prev) => !prev)

    // Apply reader-mode class to body when reader mode changes
    useEffect(() => {
        if (readerMode) {
            document.body.classList.add('reader-mode')
        } else {
            document.body.classList.remove('reader-mode')
        }
    }, [readerMode])

    // Add cyberpunk background elements to the DOM
    useEffect(() => {
        if (readerMode) return // Don't add elements in reader mode

        // Create power lines
        const powerLine2 = document.createElement('div')
        powerLine2.className = 'cyber-power-line2'
        document.body.appendChild(powerLine2)

        // Add new green horizontal line at 250px
        const powerLine3 = document.createElement('div')
        powerLine3.className = 'cyber-power-line3'
        powerLine3.style.position = 'fixed'
        powerLine3.style.top = '250px'
        powerLine3.style.left = '0'
        powerLine3.style.width = '100%'
        powerLine3.style.height = '1px'
        powerLine3.style.backgroundColor = '#00ff8b'
        powerLine3.style.opacity = '0.3'
        powerLine3.style.boxShadow = '0 0 5px #00ff8b, 0 0 10px rgba(0, 255, 139, 0.5)'
        powerLine3.style.zIndex = '-10'
        powerLine3.style.pointerEvents = 'none'
        powerLine3.style.animation = 'powerLines 4s ease-in-out infinite'
        document.body.appendChild(powerLine3)

        // Add pink horizontal line at 432px from top with blinking effect
        const powerLine4 = document.createElement('div')
        powerLine4.className = 'cyber-power-line4'
        powerLine4.style.position = 'fixed'
        powerLine4.style.top = '432px'
        powerLine4.style.left = '0'
        powerLine4.style.width = '100%'
        powerLine4.style.height = '1px'
        powerLine4.style.backgroundColor = '#ff00ff'
        powerLine4.style.opacity = '0.3'
        powerLine4.style.boxShadow = '0 0 5px #ff00ff, 0 0 10px rgba(255, 0, 255, 0.5)'
        powerLine4.style.zIndex = '-10'
        powerLine4.style.pointerEvents = 'none'

        // Create the blinking animation directly in JavaScript
        const blinkKeyframes = `
          @keyframes powerLineBlink {
            0%, 100% {
              opacity: 0.3;
              box-shadow: 0 0 5px #ff00ff, 0 0 10px rgba(255, 0, 255, 0.5);
            }
            15%, 25% {
              opacity: 0.7;
              box-shadow: 0 0 12px #ff00ff, 0 0 25px rgba(255, 0, 255, 0.6);
            }
            30%, 35% {
              opacity: 0.1;
              box-shadow: 0 0 2px rgba(255, 0, 255, 0.4), 0 0 5px rgba(255, 0, 255, 0.3);
            }
            40%, 90% {
              opacity: 0.3;
              box-shadow: 0 0 5px #ff00ff, 0 0 10px rgba(255, 0, 255, 0.5);
            }
          }
        `
        // Create and append the style element
        const styleElement = document.createElement('style')
        styleElement.innerHTML = blinkKeyframes
        document.head.appendChild(styleElement)

        // Apply the animation
        powerLine4.style.animation = 'powerLineBlink 8s ease-out infinite'
        document.body.appendChild(powerLine4)

        // Create data streams
        const dataStream1 = document.createElement('div')
        dataStream1.className = 'cyber-data-stream'
        document.body.appendChild(dataStream1)

        const dataStream2 = document.createElement('div')
        dataStream2.className = 'cyber-data-stream2'
        document.body.appendChild(dataStream2)

        // Create additional elements
        const glitchBlock = document.createElement('div')
        glitchBlock.className = 'cyber-glitch-block'
        document.body.appendChild(glitchBlock)

        const smallGlitch = document.createElement('div')
        smallGlitch.className = 'cyber-glitch-small'
        document.body.appendChild(smallGlitch)

        const noiseOverlay = document.createElement('div')
        noiseOverlay.className = 'cyber-noise'
        document.body.appendChild(noiseOverlay)

        const flicker1 = document.createElement('div')
        flicker1.className = 'cyber-flicker'
        document.body.appendChild(flicker1)

        const flicker2 = document.createElement('div')
        flicker2.className = 'cyber-flicker2'
        document.body.appendChild(flicker2)

        // Cleanup function
        return () => {
            document.body.removeChild(powerLine2)
            document.body.removeChild(powerLine3)
            document.body.removeChild(powerLine4)
            document.head.removeChild(styleElement)
            document.body.removeChild(dataStream1)
            document.body.removeChild(dataStream2)
            document.body.removeChild(glitchBlock)
            document.body.removeChild(smallGlitch)
            document.body.removeChild(noiseOverlay)
            document.body.removeChild(flicker1)
            document.body.removeChild(flicker2)
        }
    }, [readerMode])

    return (
        <UserProvider>
            <ReaderModeContext.Provider value={{ readerMode, toggleReaderMode }}>
                <ThemeProvider theme={createTheme(getDesignTokens(readerMode ? 'light' : 'dark'))}>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={5}>
                        <BrowserRouter>
                            <Suspense fallback={<div>🥷🥷🥷🥷</div>}>
                                <NavigationDrawer />
                                <Routes>
                                    <Route path={NavigationPaths.DASHBOARD} element={<Dashboard />} />
                                    <Route path={NavigationPaths.GANG} element={<Gang />} />
                                    <Route path={NavigationPaths.CORPORATION} element={<Corporation />} />
                                    <Route path={NavigationPaths.FIXER_JOB} element={<FixerJob />} />
                                    <Route path={NavigationPaths.NPC} element={<NPC />} />
                                    <Route path={NavigationPaths.BUILDING} element={<Building />} />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </SnackbarProvider>
                </ThemeProvider>
            </ReaderModeContext.Provider>
        </UserProvider>
    )
}

export default App
