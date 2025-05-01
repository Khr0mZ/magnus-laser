import { Box, IconButton } from '@mui/material'
import React, { useEffect } from 'react'
import colors from '../utils/colors'
// Import necessary MUI icons
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank' // Maximize
import CloseIcon from '@mui/icons-material/Close'
import RemoveIcon from '@mui/icons-material/Remove' // Minimize
import { flicker, glitch } from './common/Animations'

// Add type declaration for window.__TAURI__
declare global {
    interface Window {
        __TAURI__: {
            window: {
                getCurrentWindow: () => {
                    minimize: () => Promise<void>
                    toggleMaximize: () => Promise<void>
                    close: () => Promise<void>
                }
            }
        }
    }
}

const WindowButtons: React.FC = () => {
    useEffect(() => {
        const initializeWindowControls = () => {
            try {
                const { getCurrentWindow } = window.__TAURI__.window
                const appWindow = getCurrentWindow()

                document.getElementById('titlebar-minimize')?.addEventListener('click', () => appWindow.minimize())
                document
                    .getElementById('titlebar-maximize')
                    ?.addEventListener('click', () => appWindow.toggleMaximize())
                document.getElementById('titlebar-close')?.addEventListener('click', () => appWindow.close())
            } catch (error) {
                console.error('Failed to initialize window controls:', error)
            }
        }

        initializeWindowControls()
    }, [])

    // Define common styles for reuse
    const buttonBaseStyle = {
        minWidth: '30px',
        width: '30px',
        height: '30px',
        borderRadius: '2px',
        p: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        position: 'relative',
        // Remove the img filter styles
        // '& img': {
        //     width: '16px',
        //     height: '16px',
        //     filter: 'invert(1)',
        // },
    }

    // Define common icon styles
    const iconBaseStyle = (color: string) => ({
        color: color,
        textShadow: `0 0 5px ${color}`,
        zIndex: 2,
        fontSize: '16px',
        transition: 'all 0.2s',
    })

    const buttonHoverStyle = (color: string, lightColor: string) => ({
        bgcolor: `rgba(${hexToRgb(color).r}, ${hexToRgb(color).g}, ${hexToRgb(color).b}, 0.2)`,
        color: lightColor, // This sets the icon color on hover
        boxShadow: `0 0 8px ${color}80`,
        '&::after': {
            opacity: 0.8,
            height: '100%',
        },
        // Remove hover filter for img
        // '& img': {
        //     filter: `invert(0) sepia(100%) saturate(10000%) hue-rotate(${getHueRotate(lightColor)}deg) brightness(1.2)`,
        // },
        // Directly style the icon on hover
        '& .MuiSvgIcon-root': {
            color: lightColor,
            textShadow: `0 0 8px ${lightColor}`, // Enhance shadow on hover
            filter: `drop-shadow(0 0 3px ${color})`, // Add drop shadow like ImageField
            // Apply animation based on color
            animation: `${color === colors.neons.red.default ? flicker : glitch} 2s infinite`,
        },
    })

    const buttonBeforeStyle = (color: string) => ({
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.7,
    })

    const buttonAfterStyle = (color: string) => ({
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '0%',
        opacity: 0,
        background: `linear-gradient(0deg, ${color}30, transparent)`,
        transition: 'all 0.2s',
    })

    // Remove unused helper functions
    // Helper to convert hex to RGB
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 0, g: 0, b: 0 }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', height: 'min-content' }}>
            <IconButton
                id="titlebar-minimize"
                size="small"
                title="Minimize" // Add title for accessibility
                sx={{
                    ...buttonBaseStyle,
                    bgcolor: 'rgba(0, 0, 40, 0.4)', // Keep distinct background hints
                    color: colors.neons.cyan.default,
                    border: `1px solid ${colors.neons.cyan.default}60`,
                    '&::before': buttonBeforeStyle(colors.neons.cyan.default),
                    '&:hover': buttonHoverStyle(colors.neons.cyan.default, colors.neons.cyan.dark),
                    '&::after': buttonAfterStyle(colors.neons.cyan.default),
                }}
            >
                {/* Use MUI Icon */}
                <RemoveIcon sx={iconBaseStyle(colors.neons.cyan.default)} />
            </IconButton>

            <IconButton
                id="titlebar-maximize"
                size="small"
                title="Maximize" // Add title
                sx={{
                    ...buttonBaseStyle,
                    bgcolor: 'rgba(40, 0, 40, 0.4)',
                    color: colors.neons.pink.default,
                    border: `1px solid ${colors.neons.pink.default}60`,
                    '&::before': buttonBeforeStyle(colors.neons.pink.default),
                    '&:hover': buttonHoverStyle(colors.neons.pink.default, colors.neons.pink.dark),
                    '&::after': buttonAfterStyle(colors.neons.pink.default),
                }}
            >
                {/* Use MUI Icon */}
                <CheckBoxOutlineBlankIcon sx={iconBaseStyle(colors.neons.pink.default)} />
            </IconButton>
            <IconButton
                id="titlebar-close"
                size="small"
                title="Close" // Add title
                sx={{
                    ...buttonBaseStyle,
                    bgcolor: 'rgba(40, 0, 0, 0.4)',
                    color: colors.neons.red.default,
                    border: `1px solid ${colors.neons.red.default}60`,
                    '&::before': buttonBeforeStyle(colors.neons.red.default),
                    '&::after': buttonAfterStyle(colors.neons.red.default),
                    // Special hover for close button
                    '&:hover': {
                        ...buttonHoverStyle(colors.neons.red.default, colors.neons.red.dark),
                        bgcolor: 'rgba(60, 0, 0, 0.6)',
                        '& .MuiSvgIcon-root': {
                            color: colors.neons.red.dark,
                            textShadow: `0 0 8px ${colors.neons.red.light}`,
                            filter: `drop-shadow(0 0 3px ${colors.neons.red.default})`,
                            animation: `${glitch} 2s infinite`,
                        },
                    },
                }}
            >
                {/* Use MUI Icon */}
                <CloseIcon sx={iconBaseStyle(colors.neons.red.default)} />
            </IconButton>
        </Box>
    )
}

export default WindowButtons
