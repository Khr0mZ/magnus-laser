import { FormControlLabel, styled } from '@mui/material'
import colors from '../utils/colors'

// Define interface for the custom props
interface CyberpunkProps {
    readerMode?: boolean
}

// Cyberpunk styled checkbox label
const CyberpunkFormControlLabel = styled(FormControlLabel, {
    shouldForwardProp: (prop) => prop !== 'readerMode',
})<CyberpunkProps>(({ readerMode }) => ({
    '.MuiFormControlLabel-label': {
        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.default}`,
        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
        fontSize: '0.85rem',
        letterSpacing: '0.5px',
        transition: 'all 0.3s',
    },
    '&:hover .MuiFormControlLabel-label': {
        color: readerMode ? colors.neons.pink.default : colors.neons.green.default,
        '&.Mui-disabled': {
            color: readerMode ? colors.grays.gray500 : `${colors.neons.cyan.dark}20`,
        },
        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}`,
    },
}))

export default CyberpunkFormControlLabel
