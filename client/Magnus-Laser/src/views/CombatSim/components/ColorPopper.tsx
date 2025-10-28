import colors from '@/utils/colors'
import { toAlphaHex } from '@/views/CombatSim/utils/pixiUtils'
import { Box, Popper } from '@mui/material'
import { Colorful } from '@uiw/react-color'

interface ColorPopperProps {
    anchorEl: HTMLElement | null
    open: boolean
    readerMode: boolean
    colorHex: string
    colorAlpha: number
    setColorHex: (hex: string) => void
    setColorAlpha: (alpha: number) => void
}

const ColorPopper = (props: ColorPopperProps) => {
    const { anchorEl, open, readerMode, colorHex, colorAlpha, setColorHex, setColorAlpha } = props
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom" sx={{ zIndex: 1300 }}>
            <Box
                sx={{
                    bgcolor: readerMode ? '#101010' : '#080808',
                    p: 1,
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 1,
                }}
            >
                <Colorful
                    color={`${colorHex}${toAlphaHex(colorAlpha)}`}
                    onChange={(c) => {
                        if (typeof c.hexa === 'string') {
                            const hexa = c.hexa as string
                            const hex = hexa.slice(0, 7)
                            const a = hexa.length === 9 ? parseInt(hexa.slice(7), 16) / 255 : 1
                            setColorHex(hex)
                            setColorAlpha(a)
                        } else if (typeof c.hex === 'string') {
                            setColorHex(c.hex)
                        }
                    }}
                />
            </Box>
        </Popper>
    )
}

export default ColorPopper
