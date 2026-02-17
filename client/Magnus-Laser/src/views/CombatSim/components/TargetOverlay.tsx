import { Box, Typography } from '@mui/material'
import type { Token } from '../utils/types'

interface TargetOverlayProps {
    selectedTokenId: string | null
    tokens: Token[]
}

const TargetOverlay = ({ selectedTokenId, tokens }: TargetOverlayProps) => {
    if (!selectedTokenId) return null

    const selectedToken = tokens.find(t => t.id === selectedTokenId)
    if (!selectedToken?.targetIds?.length) return null

    const targetTokens = selectedToken.targetIds
        .map(id => tokens.find(t => t.id === id))
        .filter((t): t is Token => t !== undefined)

    if (targetTokens.length === 0) return null

    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 40,
                left: 10,
                background: 'rgba(0, 20, 40, 0.85)',
                border: '1px solid #00ffff',
                borderRadius: 1,
                padding: '8px 12px',
                zIndex: 50,
                maxWidth: 200,
                pointerEvents: 'none',
            }}
        >
            <Typography
                sx={{
                    fontSize: 11,
                    color: '#00ffff',
                    fontFamily: '"Orbitron", monospace',
                    fontWeight: 'bold',
                    letterSpacing: 0.5,
                    mb: 0.5,
                }}
            >
                TARGETS
            </Typography>
            {targetTokens.map(t => (
                <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: `#${t.color.toString(16).padStart(6, '0')}`,
                            flexShrink: 0,
                        }}
                    />
                    <Typography
                        sx={{
                            fontSize: 11,
                            color: '#ffffff',
                            fontFamily: '"Orbitron", monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {t.name}
                    </Typography>
                </Box>
            ))}
        </Box>
    )
}

export default TargetOverlay
