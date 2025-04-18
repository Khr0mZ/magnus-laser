import { Done } from '@mui/icons-material'
import { Container } from '@mui/material'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import colors from '../utils/colors'
import { cleanupOrphanedImages } from '../utils/storage'
import {
    blink,
    flicker,
    glitch,
    iconGlowFilter,
    moduleProgressCycle,
    neonColorCycle,
    pulseGlowGreen,
    textNeonPulse,
} from './common/Animations'
import MatrixBackground from './common/MatrixBackground'

// Define loading status interface for different data types
export interface LoadingStatus {
    readerMode?: boolean
    viewPreferences?: boolean
    buildingsData?: boolean
    gangsData?: boolean
    fixerJobsData?: boolean
    systemInit?: boolean
    storageCleanup?: boolean
}

// Props interface for the CyberpunkLoader component
interface CyberpunkLoaderProps {
    loadingStatus: LoadingStatus
    onLoadComplete: () => void
    readerMode: boolean
    setStorageCleanupComplete: () => void
}

interface LoadingModule {
    id: string
    name: string
    progress: number
    loadTime: number // Relative weight
}

// Define the total time the loader will be open (in milliseconds)
export const LOADER_DISPLAY_TIME = 1000

// Helper function to generate random hex values for dynamic data display
const generateRandomHex = (length: number): string => {
    const characters = '0123456789ABCDEF'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

// Helper function to format a number as a memory size
const formatMemorySize = (min: number, max: number): string => {
    const size = Math.floor(Math.random() * (max - min + 1)) + min
    const units = ['KB', 'MB', 'GB']
    const unit = units[Math.floor(Math.random() * units.length)]
    return `${size}${unit}`
}

// Helper function to generate random addresses with random values
const generateRandomDataEntry = (): string => {
    const types = [
        `  0x${generateRandomHex(8)}: Memory block initialized`,
        `  ADDR:${generateRandomHex(4)}-${generateRandomHex(4)} allocated ${formatMemorySize(32, 512)}`,
        `  [CONFIG:${generateRandomHex(4)}] Parameter set to ${generateRandomHex(2)}-${generateRandomHex(2)}`,
        `  System check: CRC-${generateRandomHex(8)} verified`,
        `  Loading module ${generateRandomHex(2)}... [${Math.floor(Math.random() * 100)}%]`,
        `  Memory signature: ${generateRandomHex(4)}-${generateRandomHex(4)}-${generateRandomHex(4)}`,
        `  #${generateRandomHex(6)} Operation completed in ${Math.floor(Math.random() * 990) + 10}ms`,
        `  Vector data: ${Math.floor(Math.random() * 10000)} elements processed`,
        `  0b${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}${Math.floor(
            Math.random() * 2
        )}${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}${Math.floor(
            Math.random() * 2
        )}${Math.floor(Math.random() * 2)} flags set`,
    ]

    return types[Math.floor(Math.random() * types.length)]
}

// Helper function for easing
const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const CyberpunkLoader = ({
    loadingStatus,
    onLoadComplete,
    readerMode,
    setStorageCleanupComplete,
}: CyberpunkLoaderProps): JSX.Element => {
    const { t } = useTranslation()
    const bootSequenceRef = useRef<HTMLDivElement>(null)
    const [isTimerElapsed, setIsTimerElapsed] = useState(false)
    const cleanupStatusUpdatedRef = useRef(false)

    // Initial loading modules state (loadTime acts as relative weight)
    const [loadingModules, setLoadingModules] = useState<LoadingModule[]>([
        { id: 'system', name: t('loader.system'), progress: 0, loadTime: 9 },
        { id: 'storageCleanup', name: t('loader.storageCleanup'), progress: 0, loadTime: 9 },
        { id: 'readerMode', name: t('loader.readerMode'), progress: 0, loadTime: 8 }, // Relative weights
        { id: 'viewPrefs', name: t('loader.viewPrefs'), progress: 0, loadTime: 6 },
        { id: 'gangs', name: t('gangs.title'), progress: 0, loadTime: 7 },
        { id: 'buildings', name: t('buildings.title'), progress: 0, loadTime: 7 },
    ])

    // Calculate actual module durations based on LOADER_DISPLAY_TIME and weights
    const moduleDurations = useMemo(() => {
        const totalWeight = loadingModules.reduce((sum, module) => sum + module.loadTime, 0)
        if (totalWeight === 0) return loadingModules.map(() => 0) // Avoid division by zero
        return loadingModules.map((module) => (module.loadTime / totalWeight) * LOADER_DISPLAY_TIME)
    }, [loadingModules]) // Recalculate if loadingModules change

    // State for sequential loading
    const [activeModuleIndex, setActiveModuleIndex] = useState(0)
    const [currentModuleStartTime, setCurrentModuleStartTime] = useState(Date.now())

    // Boot sequence text with cyberpunk-themed messages
    const bootTexts = [
        '> Initializing quantum kernel...',
        '> Establishing secure tunnel connection...',
        '> Loading neural interface modules...',
        '> Decrypting building architectural schematics...',
        '> Processing gang intelligence packets...',
        '> Calibrating holographic display matrix...',
        '> Preparing augmented reality overlays...',
        '> Verifying neural-sync protocols...',
        '> Scanning for intrusion vulnerabilities...',
        '> Compiling cyberdeck algorithms...',
        '> Activating techno-mystical routines...',
        '> Systems primed and ready for your input.',
    ]

    // Additional data entries that will appear after certain boot texts
    const dataEntries = [
        '  0x7FF4A3D8: Memory allocation successful',
        '  Connection established to local datastore',
        '  [OK] User preferences signature verified',
        '  DATA_STRUCT_0x44F2: 128 records loaded',
        '  DECRYPT_KEY: [C0DE-22AF-87B3-X95Y] validated',
        '  Running calibration sequence... Complete',
        '  Matrices initialized with 76.3MB vertex data',
        '  Neural protocols validated with 99.7% efficiency',
        '  Security scan complete - 0 critical issues found',
        '  Shader compilation successful. [673 ms]',
        '  Holographic resolution set to 6400x4800',
    ]

    // State to track displayed boot texts
    const [displayedBootTexts, setDisplayedBootTexts] = useState<{ text: string; showCursor: boolean }[]>([])

    // Calculate overall progress
    const overallProgress = loadingModules.reduce((sum, module) => sum + module.progress, 0) / loadingModules.length

    // Effect for sequential module loading
    useEffect(() => {
        // Target frame rate for progress updates
        const updateIntervalMs = 33 // ~30fps

        const intervalId = setInterval(() => {
            // Check if there are still modules to load
            if (activeModuleIndex < loadingModules.length) {
                // Use the pre-calculated duration for the current module
                const moduleDuration = moduleDurations[activeModuleIndex]
                const now = Date.now()
                const elapsed = now - currentModuleStartTime

                // Prevent duration from being zero or negative
                const safeDuration = Math.max(moduleDuration, 1)

                if (elapsed >= safeDuration) {
                    // Current module finished
                    setLoadingModules((prev) =>
                        prev.map((m, index) => (index === activeModuleIndex ? { ...m, progress: 100 } : m))
                    )

                    // Move to the next module if available
                    if (activeModuleIndex + 1 < loadingModules.length) {
                        setActiveModuleIndex((prev) => prev + 1)
                        setCurrentModuleStartTime(now) // Use current time as start for next
                    } else {
                        // Last module finished
                        clearInterval(intervalId)
                    }
                } else {
                    // Current module still loading
                    const linearProgress = elapsed / safeDuration
                    // Clamp eased progress to ensure it doesn't exceed 100
                    const easedProgress = Math.min(easeInOutQuad(linearProgress) * 100, 100)

                    setLoadingModules((prev) =>
                        prev.map((m, index) => (index === activeModuleIndex ? { ...m, progress: easedProgress } : m))
                    )
                }
            } else {
                // All modules loaded, clear interval just in case
                clearInterval(intervalId)
            }
        }, updateIntervalMs)

        // Cleanup function
        return () => {
            clearInterval(intervalId)
        }
    }, [activeModuleIndex, currentModuleStartTime, loadingModules.length, moduleDurations]) // Added moduleDurations dependency

    // Effect for boot sequence text animation (remains largely the same)
    useEffect(() => {
        let currentText = 0
        const totalBootTime = LOADER_DISPLAY_TIME // Sync text with loader time
        const textDisplayInterval = Math.floor(totalBootTime / (bootTexts.length * 1.2)) // Adjusted interval

        const textInterval = setInterval(() => {
            if (currentText < bootTexts.length) {
                setDisplayedBootTexts((prev) => {
                    const updated = [...prev]
                    updated.push({ text: bootTexts[currentText], showCursor: false })
                    if (currentText < dataEntries.length && Math.random() > 0.3) {
                        updated.push({ text: dataEntries[currentText], showCursor: false })
                    }
                    if (Math.random() > 0.3) {
                        const numEntries = Math.floor(Math.random() * 3) + 1
                        for (let i = 0; i < numEntries; i++) {
                            updated.push({ text: generateRandomDataEntry(), showCursor: false })
                        }
                    }
                    return updated
                })
                currentText++
            } else {
                clearInterval(textInterval)
            }
        }, textDisplayInterval)

        // Cleanup
        return () => {
            clearInterval(textInterval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bootTexts.length, dataEntries.length]) // Dependencies

    // Effect for scrolling boot sequence (remains the same)
    useEffect(() => {
        if (bootSequenceRef.current) {
            bootSequenceRef.current.scrollTop = bootSequenceRef.current.scrollHeight
        }
    }, [displayedBootTexts])

    // Effect to track the minimum display time
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTimerElapsed(true)
        }, LOADER_DISPLAY_TIME)

        return () => clearTimeout(timer)
    }, [])

    // Effect to check if loading is fully complete
    useEffect(() => {
        // Check if the timer has elapsed
        if (!isTimerElapsed) {
            return // Wait for the minimum display time
        }

        // Check if all loading status flags are true
        const allLoaded = Object.values(loadingStatus).every((status) => status === true)

        if (allLoaded) {
            onLoadComplete() // Signal to parent component
        }
    }, [isTimerElapsed, loadingStatus, onLoadComplete])

    // Effect to perform image cleanup
    useEffect(() => {
        const runCleanup = async () => {
            try {
                // Just run the cleanup without updating any progress displays
                await cleanupOrphanedImages()

                // Update the loadingStatus when complete
                if (!cleanupStatusUpdatedRef.current) {
                    setStorageCleanupComplete()
                    cleanupStatusUpdatedRef.current = true
                }
            } catch (error) {
                console.error('Error during storage cleanup:', error)

                // Update the loadingStatus even on error
                if (!cleanupStatusUpdatedRef.current) {
                    setStorageCleanupComplete()
                    cleanupStatusUpdatedRef.current = true
                }
            }
        }

        // Start cleanup
        runCleanup()
    }, [setStorageCleanupComplete])

    return (
        <Container maxWidth={false} sx={{ pt: 3 }}>
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: readerMode ? colors.grays.gray700 : '#050718',
                    zIndex: 9999,
                    // Use font stack from fonts.css
                    fontFamily: "'Rajdhani', 'Lexend', system-ui, sans-serif",
                    overflow: 'hidden',
                    padding: '20px',
                    boxSizing: 'border-box',
                }}
            >
                {/* Add Matrix Background Here */}
                {!readerMode && <MatrixBackground />}

                {/* --- Main Loader Content Wrapper (Centered) --- */}
                {/* This Box now takes the role of the old column 1 wrapper */}
                <Box
                    sx={{
                        height: '95%',
                        width: '80%',
                        maxWidth: '900px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        padding: '30px',
                        // Conditionally set color based on readerMode
                        color: readerMode ? '#ffffff' : colors.neons.cyan.default,
                        overflow: 'hidden',
                    }}
                >
                    {/* Glitching Logo Watermark */}
                    <Box
                        aria-hidden="true"
                        sx={{
                            position: 'absolute',
                            top: '20%',
                            left: '10%',
                            transform: 'translate(-50%, -50%)',
                            width: '80%',
                            height: '80%',
                            backgroundImage: 'url(/magnusLaserLogo.png)',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                            zIndex: -1,
                            pointerEvents: 'none',
                            mixBlendMode: 'soft-light',
                            // Disable animations in reader mode
                            animation: readerMode ? 'none' : `${flicker} 6s infinite, ${glitch} 4s infinite alternate`,
                        }}
                    />

                    {/* --- Actual Content Wrapper --- */}
                    <Box
                        sx={{
                            position: 'relative',
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        {/* Title */}
                        <Typography
                            variant="h3"
                            component="h3"
                            data-text={t('loader.title')}
                            className="glitch-text"
                            sx={{
                                textAlign: 'center',
                                color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                            }}
                        >
                            {t('loader.title')}
                        </Typography>
                        {/* Subtitle */}
                        <Typography
                            variant="h5"
                            data-text={t('loader.subtitle')}
                            sx={{
                                // Conditionally set color
                                color: readerMode ? colors.grays.gray100 : colors.neons.cyan.default,
                                //fontSize: '3rem',
                                mb: 2,
                                textAlign: 'center',
                                fontFamily: "'Orbitron', 'Rajdhani', 'Lexend', sans-serif",
                                letterSpacing: '4px',
                                fontWeight: 'bold',
                                // Remove text shadow and animation in reader mode
                                textShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.cyan.default}`,
                                position: 'relative',
                                animation: readerMode ? 'none' : `${flicker} 4s infinite`,
                                // Hide pseudo-elements causing glitch/color effects in reader mode
                                '&::before, &::after': {
                                    content: 'attr(data-text)',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    top: 0,
                                    left: 0,
                                    display: readerMode ? 'none' : 'block', // Hide in reader mode
                                },
                                '&::before': {
                                    color: colors.neons.pink.default,
                                    zIndex: -1,
                                    opacity: 0.8,
                                    textShadow: `0 0 5px ${colors.neons.pink.default}`,
                                    left: '-2px',
                                    animation: `${glitch} 3s infinite alternate`,
                                },
                                '&::after': {
                                    color: colors.neons.green.default,
                                    zIndex: -2,
                                    opacity: 0.8,
                                    textShadow: `0 0 5px ${colors.neons.green.default}`,
                                    left: '2px',
                                    animation: `${glitch} 2s infinite alternate-reverse`,
                                },
                            }}
                        >
                            {t('loader.subtitle')}
                        </Typography>

                        {/* Boot Sequence Area */}
                        <Box sx={{ position: 'relative', height: '220px', mb: '25px', width: '100%' }}>
                            <Box
                                ref={bootSequenceRef}
                                sx={{
                                    height: '200px',
                                    overflowY: 'auto',
                                    p: '10px',
                                    bgcolor: readerMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                    // Use standard border in reader mode
                                    border: readerMode
                                        ? '1px solid #cccccc'
                                        : `1px solid ${colors.neons.cyan.default}33`,
                                    borderRadius: '4px',
                                    fontFamily: '"Share Tech Mono", monospace',
                                    // Conditionally set color
                                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                                    fontSize: '0.9rem',
                                    position: 'relative',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                }}
                            >
                                {displayedBootTexts.map(({ text }, index) => (
                                    <Typography
                                        key={index}
                                        sx={{
                                            mb: '4px',
                                            // Remove text shadow in reader mode
                                            textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}80`,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {text}
                                        {index === displayedBootTexts.length - 1 && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',
                                                    ml: '4px',
                                                    fontWeight: 'bold',
                                                    animation: `${blink} 1s infinite`,
                                                }}
                                            >
                                                {' '}
                                                _{' '}
                                            </Box>
                                        )}
                                    </Typography>
                                ))}
                            </Box>
                            <Box
                                aria-hidden="true"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(to bottom, ${colors.neons.cyan.default}1A 0%, transparent 5%, transparent 95%, ${colors.neons.cyan.default}1A 100%)`,
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                    borderRadius: '4px',
                                    mixBlendMode: 'overlay',
                                }}
                            />
                        </Box>

                        {/* Total Progress Bar Area */}
                        <Box sx={{ width: '100%', position: 'relative', mb: '30px' }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    mb: '8px',
                                    fontFamily: "'Orbitron', 'Rajdhani', 'Lexend', sans-serif",
                                    // Conditionally set color, remove shadow and animation
                                    color: readerMode ? colors.grays.gray100 : colors.neons.cyan.default,
                                    fontSize: '0.9rem',
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.default}`,
                                    fontWeight: 'bold',
                                    animation: readerMode ? 'none' : `${textNeonPulse} 3s infinite alternate`,
                                }}
                            >
                                TOTAL SYSTEM INITIALIZATION
                            </Typography>
                            <Box
                                sx={{
                                    height: '24px',
                                    width: '100%',
                                    bgcolor: 'rgba(0, 20, 40, 0.5)',
                                    borderRadius: '4px',
                                    position: 'relative',
                                    // Use standard border and shadow in reader mode
                                    border: readerMode
                                        ? '1px solid #cccccc'
                                        : `1px solid ${colors.neons.cyan.default}4D`,
                                    boxShadow: readerMode ? 'none' : 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
                                    // Disable glow animation in reader mode
                                    animation:
                                        readerMode || overallProgress < 100 ? 'none' : `${pulseGlowGreen} 2s infinite`,
                                }}
                            >
                                <LinearProgress
                                    variant="determinate"
                                    value={overallProgress}
                                    sx={{
                                        height: '100%',
                                        borderRadius: '2px',
                                        backgroundColor: 'transparent',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: '2px',
                                            transition: 'transform 0.2s linear',
                                            background: `linear-gradient(to right, ${colors.neons.pink.default}B3, ${colors.neons.cyan.default}E6)`,
                                            overflow: 'hidden',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                backgroundImage: `repeating-linear-gradient(
                                                45deg,
                                                rgba(255, 255, 255, 0.1) 0px,
                                                rgba(255, 255, 255, 0.1) 4px,
                                                rgba(0, 0, 0, 0.05) 4px, 
                                                rgba(0, 0, 0, 0.05) 8px  
                                            )`,
                                                backgroundSize: '40px 40px',
                                                opacity: 1,
                                                mixBlendMode: 'hard-light',
                                            },
                                        },
                                        ...(overallProgress >= 100 && {
                                            '& .MuiLinearProgress-bar': {
                                                background: `linear-gradient(to right, ${colors.neons.pink.default}B3, ${colors.neons.pink.default}E6)`,
                                            },
                                        }),
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: '-30px',
                                        right: 0,
                                        fontFamily: "'Orbitron', 'Rajdhani', 'Lexend', sans-serif",
                                        // Conditionally set color
                                        color: readerMode ? '#ffffff' : '#d9fbfb',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {`${Math.round(overallProgress)}%`}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Modules Progress Area */}
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                            {loadingModules.map((module) => (
                                <Box key={module.id} sx={{ width: '100%' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '4px' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontSize: '0.9rem',
                                                // Conditionally set color and remove shadow
                                                color: readerMode ? colors.grays.gray100 : '#d9fbfb',
                                                textShadow: readerMode
                                                    ? 'none'
                                                    : `0 0 5px ${colors.neons.cyan.default}80`,
                                                fontFamily: "'Orbitron', 'Rajdhani', 'Lexend', sans-serif",
                                            }}
                                        >
                                            {module.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontSize: '0.9rem',
                                                // Conditionally set color
                                                color: readerMode ? colors.grays.gray100 : '#d9fbfb',
                                                fontWeight: 'bold',
                                                fontFamily: "'Orbitron', 'Rajdhani', 'Lexend', sans-serif",
                                            }}
                                        >
                                            {module.progress < 100 ? (
                                                `${Math.round(module.progress)}%`
                                            ) : (
                                                <Done
                                                    sx={{
                                                        fontSize: 'inherit',
                                                        // Use standard green and remove animation in reader mode
                                                        color: readerMode ? '#4caf50' : colors.neons.green.default,
                                                        verticalAlign: 'middle',
                                                        animation: readerMode
                                                            ? 'none'
                                                            : `${iconGlowFilter} 2s infinite`,
                                                    }}
                                                />
                                            )}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            height: '20px',
                                            bgcolor: 'rgba(0, 20, 40, 0.5)',
                                            borderRadius: '2px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            // Use standard border and shadow in reader mode
                                            border: readerMode
                                                ? '1px solid #cccccc'
                                                : `1px solid ${colors.neons.cyan.default}4D`,
                                            boxShadow: readerMode ? 'none' : 'inset 0 0 5px rgba(0, 0, 0, 0.5)',
                                            // Disable animation in reader mode
                                            animation:
                                                readerMode || module.progress < 100
                                                    ? 'none'
                                                    : `${moduleProgressCycle} 2s infinite`,
                                        }}
                                    >
                                        <LinearProgress
                                            variant="determinate"
                                            value={module.progress}
                                            sx={{
                                                height: '100%',
                                                borderRadius: '2px',
                                                backgroundColor: 'transparent',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: '2px',
                                                    transition: 'transform 0.2s linear',
                                                    background: `linear-gradient(to right, ${colors.neons.pink.default}B3, ${colors.neons.purple.default}B3, ${colors.neons.blue.default}B3, ${colors.neons.green.default}E6)`,
                                                    overflow: 'hidden',
                                                    '&::after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        backgroundImage: `repeating-linear-gradient(
                                                        45deg,
                                                        rgba(255, 255, 255, 0.1) 0px,
                                                        rgba(255, 255, 255, 0.1) 4px,
                                                        rgba(0, 0, 0, 0.05) 4px, 
                                                        rgba(0, 0, 0, 0.05) 8px  
                                                    )`,
                                                        backgroundSize: '40px 40px',
                                                        opacity: 1,
                                                        mixBlendMode: 'hard-light',
                                                    },
                                                },
                                                ...(overallProgress >= 100 && {
                                                    '& .MuiLinearProgress-bar': {
                                                        background: `linear-gradient(to right, ${colors.neons.pink.default}B3, ${colors.neons.purple.default}B3, ${colors.neons.blue.default}B3, ${colors.neons.green.default}E6)`,
                                                    },
                                                }),
                                            }}
                                        />
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* Bottom Message */}
                        <Typography
                            variant="body1"
                            sx={{
                                mt: 'auto',
                                pt: '20px',
                                textAlign: 'center',
                                fontSize: '1rem',
                                // Conditionally set color, remove shadow and animation
                                color: readerMode ? '#ffffff' : colors.neons.pink.default,
                                textShadow: readerMode ? 'none' : `0 0 8px ${colors.neons.pink.default}B3`,
                                fontStyle: 'italic',
                                letterSpacing: '1px',
                                animation: readerMode ? 'none' : `${neonColorCycle} 8s infinite alternate`,
                            }}
                        >
                            Choom, just a few more ticks. Getting everything delta for ya...
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Container>
    )
}

export default CyberpunkLoader
