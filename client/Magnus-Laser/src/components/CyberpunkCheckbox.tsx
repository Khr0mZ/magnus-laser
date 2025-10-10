import { Checkbox, styled } from '@mui/material'
import colors from '../utils/colors'
import { pulseGlowGreen } from './common/Animations'

// Define interface for the custom props
interface CyberpunkProps {
    readerMode?: boolean
}

// Custom cyberpunk styled checkbox
const CyberpunkCheckbox = styled(Checkbox, {
    shouldForwardProp: (prop) => prop !== 'readerMode',
})<CyberpunkProps>(({ readerMode }) => ({
    height: 30,
    width: 30,
    color: readerMode ? colors.neons.pink.default : colors.neons.cyan.default,
    '&.Mui-disabled': {
        color: readerMode ? 'unset' : `${colors.neons.cyan.dark}50`,
    },
    '&.Mui-checked': {
        color: readerMode ? colors.neons.pink.default : colors.neons.green.default,
    },
    '&:hover': {
        backgroundColor: readerMode ? 'rgba(46, 125, 50, 0.04)' : `${colors.neons.cyan.default}20`,
    },
    '& .MuiSvgIcon-root': {
        filter: readerMode ? 'none' : `drop-shadow(0 0 2px ${colors.neons.cyan.default})`,
        transition: 'all 0.3s',
    },
    '&.Mui-checked .MuiSvgIcon-root': {
        filter: readerMode ? 'none' : `drop-shadow(0 0 3px ${colors.neons.green.default})`,
        animation: readerMode ? 'none' : `${pulseGlowGreen} 3s infinite`,
    },
}))

export default CyberpunkCheckbox
