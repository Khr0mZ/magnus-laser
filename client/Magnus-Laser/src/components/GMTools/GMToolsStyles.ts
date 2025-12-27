import { SxProps, Theme, keyframes } from '@mui/material'
import colors from '../../utils/colors'
import { pulseGlowBlue, pulseGlowCyan } from '../common/Animations'

// Cyberpunk animations
export const pulseGlow = keyframes`
    0%, 100% {
        box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
    }
    50% {
        box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
    }
`

export const scanlineAnimation = keyframes`
    0% {
        transform: translateY(-100%);
    }
    100% {
        transform: translateY(100%);
    }
`

export const flickerAnimation = keyframes`
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.8; }
    94% { opacity: 1; }
    95% { opacity: 0.9; }
    96% { opacity: 1; }
`

// Cyberpunk TextField styles - based on TokenDetailsDialog.tsx
export const getCyberpunkTextFieldStyle = (
    readerMode: boolean,
    accentColor: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    '& .MuiOutlinedInput-root': {
        color: readerMode ? '#333' : '#fff',
        '& fieldset': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : `${accentColor}4D`, // 30% opacity
        },
        '&:hover fieldset': {
            borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : accentColor,
        },
    },
    '& .MuiInputLabel-root': {
        color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
        borderRadius: '4px',
        bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
        p: 0.5,
        py: 0.25,
        border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${accentColor}`,
    },
    '&:hover .MuiInputLabel-root': {
        animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
    },
})

// Cyberpunk Select styles - based on TokenDetailsDialog.tsx
export const getCyberpunkSelectStyle = (
    readerMode: boolean,
    accentColor: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    color: readerMode ? '#333' : '#fff',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : `${accentColor}4D`, // 30% opacity
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : accentColor,
    },
    '& .MuiSvgIcon-root': {
        color: readerMode ? 'rgba(0, 0, 0, 0.54)' : '#fff',
    },
})

// Cyberpunk Button styles
export const getCyberpunkButtonStyle = (
    readerMode: boolean,
    accentColor: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    fontWeight: 'bold',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    backgroundColor: readerMode ? accentColor : 'transparent',
    color: readerMode ? '#fff' : accentColor,
    border: readerMode ? 'none' : `1px solid ${accentColor}`,
    boxShadow: readerMode ? 'none' : `0 0 10px ${accentColor}40, inset 0 0 10px ${accentColor}20`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': readerMode
        ? {}
        : {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
              transition: 'left 0.5s ease',
          },
    '&:hover': {
        backgroundColor: readerMode ? accentColor : `${accentColor}20`,
        boxShadow: readerMode ? 'none' : `0 0 20px ${accentColor}60, inset 0 0 15px ${accentColor}30`,
        '&::before': {
            left: '100%',
        },
    },
    '&:disabled': {
        borderColor: readerMode ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)',
        color: readerMode ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
        boxShadow: 'none',
    },
})

// Cyberpunk Tab styles
export const getCyberpunkTabsStyle = (
    readerMode: boolean,
    accentColor: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    '& .MuiTabs-indicator': {
        backgroundColor: accentColor,
        height: '3px',
        boxShadow: readerMode ? 'none' : `0 0 10px ${accentColor}, 0 0 20px ${accentColor}`,
    },
    '& .MuiTab-root': {
        fontWeight: 'bold',
        fontSize: '0.7rem',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
        transition: 'all 0.3s ease',
        '&.Mui-selected': {
            color: accentColor,
            textShadow: readerMode ? 'none' : `0 0 10px ${accentColor}`,
        },
        '&:hover': {
            color: readerMode ? colors.grays.gray000 : accentColor,
            backgroundColor: readerMode ? 'transparent' : `${accentColor}10`,
        },
    },
})

// Cyberpunk Paper/Card styles
export const getCyberpunkPaperStyle = (
    readerMode: boolean,
    accentColor: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    backgroundColor: readerMode ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 20, 40, 0.6)',
    border: readerMode ? '1px solid rgba(0, 0, 0, 0.1)' : `1px solid ${accentColor}30`,
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
    '&::before': readerMode
        ? {}
        : {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          },
    '&:hover': readerMode
        ? {}
        : {
              borderColor: `${accentColor}60`,
              boxShadow: `0 0 15px ${accentColor}20`,
          },
})

// Cyberpunk Chip styles
export const getCyberpunkChipStyle = (readerMode: boolean, accentColor: string): SxProps<Theme> => ({
    fontWeight: 'bold',
    fontSize: '0.7rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    backgroundColor: readerMode ? accentColor : `${accentColor}30`,
    color: readerMode ? '#fff' : accentColor,
    border: readerMode ? 'none' : `1px solid ${accentColor}`,
    boxShadow: readerMode ? 'none' : `0 0 5px ${accentColor}40`,
})

// Cyberpunk FormControl Label styles
export const getCyberpunkInputLabelStyle = (
    readerMode: boolean,
    accentColor: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    color: readerMode ? '#666' : `${accentColor}cc`,
    fontSize: '0.7rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    '&.Mui-focused': {
        color: accentColor,
    },
})

// Drawer header styles
export const getDrawerHeaderStyle = (readerMode: boolean): SxProps<Theme> => ({
    p: 2,
    borderBottom: `1px solid ${readerMode ? 'rgba(0, 0, 0, 0.1)' : colors.neons.cyan.default}40`,
    background: readerMode
        ? 'transparent'
        : `linear-gradient(180deg, rgba(0, 30, 50, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)`,
    position: 'relative',
    '&::after': readerMode
        ? {}
        : {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
              boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
          },
})

// Section title styles
export const getSectionTitleStyle = (
    readerMode: boolean,
    color: string = colors.neons.cyan.default
): SxProps<Theme> => ({
    color: readerMode ? colors.grays.gray000 : color,
    fontWeight: 'bold',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    textShadow: readerMode ? 'none' : `0 0 10px ${color}80`,
    mb: 2,
})
