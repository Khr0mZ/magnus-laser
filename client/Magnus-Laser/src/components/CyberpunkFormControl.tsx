import type { SxProps, Theme } from '@mui/material'
import { FormControl, InputLabel } from '@mui/material'
import type { ReactNode } from 'react'
import colors from '../utils/colors'
import { pulseGlowBlue, pulseGlowCyan } from './common/Animations'

interface CyberpunkFormControlProps {
    readerMode?: boolean
    label: string
    labelId?: string
    labelSx?: SxProps<Theme>
    children: ReactNode
    fullWidth?: boolean
    sx?: SxProps<Theme>
    shrink?: boolean
    htmlFor?: string
    disabled?: boolean
}

const CyberpunkFormControl: React.FC<CyberpunkFormControlProps> = ({
    readerMode = false,
    label,
    labelId,
    labelSx,
    children,
    fullWidth = true,
    sx,
    shrink,
    htmlFor,
    disabled = false,
}) => {
    // FormControl style with hover animations for InputLabels (unless disabled)
    const formControlStyle: SxProps<Theme> = disabled
        ? sx || {}
        : {
              '&:hover .MuiInputLabel-root': {
                  animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
              },
              '& .MuiInputBase-root.Mui-focused + .MuiInputLabel-root': {
                  animation: `${readerMode ? pulseGlowBlue : pulseGlowCyan} 2s infinite`,
              },
              ...sx,
          }

    // InputLabel style
    const inputLabelStyle: SxProps<Theme> = {
        color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
        borderRadius: '4px',
        bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
        p: 0.5,
        py: 0.25,
        border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
        ...labelSx,
    }

    return (
        <FormControl fullWidth={fullWidth} variant="outlined" sx={formControlStyle}>
            <InputLabel id={labelId} sx={inputLabelStyle} shrink={shrink} htmlFor={htmlFor}>
                {label}
            </InputLabel>
            {children}
        </FormControl>
    )
}

export default CyberpunkFormControl
