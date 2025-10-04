import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'
import colors from '../../utils/colors'
import { matrixRain } from './Animations'

// Extended character set including Katakana for a more authentic Matrix feel
const CHARACTERS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ<>{}[]()#$*+=?;:.,\'"`~'
const NUM_COLUMNS = 80 // Reduced for performance
const COLUMN_LENGTH = 150 // Reduced for performance

// Function to generate a random string of characters
const generateRandomString = (length: number): string => {
    let result = ''
    for (let i = 0; i < length; i++) {
        result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
    }
    return result
}

interface MatrixColumn {
    id: number
    content: string
    left: string // Position percentage
    duration: string // Animation duration
    delay: string // Animation delay (will be negative)
    fontSize: string // Varying font size for depth
    opacity: number // Base opacity for glow calculation
}

const MatrixBackground = () => {
    const [columns, setColumns] = useState<MatrixColumn[]>([])

    useEffect(() => {
        const generatedColumns: MatrixColumn[] = []
        for (let i = 0; i < NUM_COLUMNS; i++) {
            const randomFontSize = Math.random() * 8 + 10 // Font size between 10px and 18px
            const durationSeconds = Math.random() * 4 + 4 // Duration 4s to 8s
            const negativeDelaySeconds = -Math.random() * durationSeconds // Negative delay

            generatedColumns.push({
                id: i,
                content: generateRandomString(COLUMN_LENGTH),
                left: `${(i / NUM_COLUMNS) * 100 + Math.random() * 0.5 - 0.25}%`, // Add slight horizontal jitter
                duration: `${durationSeconds}s`,
                delay: `${negativeDelaySeconds}s`,
                fontSize: `${randomFontSize}px`,
                opacity: Math.random() * 0.4 + 0.3, // Opacity for glow calculation
            })
        }
        setColumns(generatedColumns)
        // No cleanup needed as columns are set once
    }, [])

    return (
        <Box
            aria-hidden="true"
            sx={{
                position: 'fixed', // Covers the entire viewport
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden', // Hide parts that go off-screen
                zIndex: -2, // Position behind everything, including watermark
                pointerEvents: 'none', // Not interactive
                bgcolor: '#050718', // Ensure background is dark
            }}
        >
            {columns.map((col) => (
                <Box
                    key={col.id}
                    sx={{
                        position: 'absolute',
                        top: '-100%', // Start above viewport for animation
                        left: col.left,
                        fontFamily: 'monospace', // Essential for Matrix look
                        fontSize: col.fontSize, // Varying size
                        color: colors.neons.green.default,
                        writingMode: 'vertical-rl', // Display text vertically
                        textOrientation: 'mixed', // Allow characters to orient naturally
                        whiteSpace: 'nowrap', // Keep column characters together
                        opacity: 0, // Start hidden, animation handles appearance
                        // Glow intensity based on opacity - Reduced multiplier
                        textShadow: `0 0 5px ${colors.neons.green.default}${Math.round(col.opacity * 100) // Reduced from 150
                            .toString(16)
                            .padStart(2, '0')}`,
                        // Apply matrixRain with duration and negative delay
                        animation: `${matrixRain} ${col.duration} linear ${col.delay} infinite`,
                        userSelect: 'none', // Prevent text selection
                    }}
                >
                    {col.content}
                </Box>
            ))}
        </Box>
    )
}

export default MatrixBackground
