import { Close } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Scrollbar from 'smooth-scrollbar'
import CustomScrollbar from '../../components/CustomScrollbar'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import type { RollHistoryEntry } from './types'

interface RollHistoryPanelProps {
    isOpen: boolean
    rollHistory: RollHistoryEntry[]
    onClear: () => void
}

const RollHistoryPanel = ({ isOpen, rollHistory, onClear }: RollHistoryPanelProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new rolls are added
    useEffect(() => {
        if (rollHistory.length > 0 && containerRef.current) {
            // Delay to ensure content is fully rendered
            const scrollToBottom = () => {
                const scrollbarContainer = containerRef.current?.querySelector(
                    '.smooth-scrollbar-container'
                ) as HTMLElement
                if (scrollbarContainer) {
                    const scrollbarInstance = Scrollbar.get(scrollbarContainer)
                    if (scrollbarInstance) {
                        // Use a very large number to ensure we scroll to the absolute bottom
                        scrollbarInstance.scrollTo(0, 999999, 300) // x, y, duration in ms
                    }
                }
            }

            // Try immediately
            scrollToBottom()

            // And again after a delay to ensure all content is rendered
            setTimeout(scrollToBottom, 50)
            setTimeout(scrollToBottom, 150)
        }
    }, [rollHistory])

    const formatTimestamp = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        return `${hours}h ago`
    }

    const getRollTypeLabel = (rollType: string): string => {
        switch (rollType) {
            case 'initiative':
                return t('combatSim.initiative')
            case 'melee-hit':
                return `${t('combatSim.toHit')}`
            case 'melee-damage':
                return `${t('combatSim.meleeAttack')} - ${t('combatSim.damage')}`
            case 'ranged-hit':
                return `${t('combatSim.toHit')}`
            case 'ranged-damage':
                return `${t('combatSim.rangedAttack')} - ${t('combatSim.damage')}`
            case 'skill':
                return t('combatSim.skillCheck')
            default:
                return rollType
        }
    }

    const getRollTypeColor = (rollType: string) => {
        if (rollType.includes('melee')) return colors.neons.red.default
        if (rollType.includes('ranged')) return colors.neons.yellow.default
        if (rollType === 'skill') return colors.neons.cyan.default
        return colors.neons.green.default
    }

    const getRollTypeEmoji = (rollType: string): string => {
        if (rollType === 'initiative') return '⚔️'
        if (rollType.includes('melee')) return '🪓'
        if (rollType.includes('ranged')) return '🔫'
        if (rollType === 'skill') return '🧩'
        return '🎲'
    }

    return (
        <Box
            sx={{
                width: isOpen ? 260 : 0,
                flex: '0 0 auto',
                height: '100%',
                overflow: 'hidden',
                transition: 'width 220ms ease',
                willChange: 'width',
                borderRight: isOpen ? `1px solid ${colors.neons.cyan.dark}` : 'none',
                bgcolor: readerMode ? colors.grays.gray000 : 'rgba(0, 0, 40, 0.6)',
            }}
        >
            <Box
                sx={{
                    width: 260,
                    height: '100%',
                    background: `linear-gradient(0deg, ${colors.neons.cyan.default}30, transparent)`,
                    p: 1,
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 220ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1} sx={{ flexShrink: 0 }}>
                    <Typography
                        variant="h4"
                        className="glitch-text"
                        data-text={t('combatSim.rollHistory')}
                        sx={{
                            color: readerMode ? colors.grays.gray900 : colors.neons.pink.default,
                            fontWeight: 700,
                            textShadow: `0 0 8px ${colors.grays.gray000}`,
                        }}
                    >
                        {t('combatSim.rollHistory')}
                    </Typography>
                    <Button
                        title={t('combatSim.clearHistory')}
                        onClick={onClear}
                        disabled={rollHistory.length === 0}
                        sx={{
                            minWidth: '30px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '2px',
                            p: 0,
                            bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                            color: readerMode ? '#d32f2f' : colors.neons.red.default,
                            border: readerMode ? '1px solid #d32f2f' : `1px solid ${colors.neons.red.default}60`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            position: 'relative',
                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                            fontWeight: 'bold',
                            '&::before': !readerMode
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                      opacity: 0.7,
                                  }
                                : {},
                            '&:hover': readerMode
                                ? {
                                      bgcolor: '#f0f0f0',
                                      color: '#b71c1c',
                                  }
                                : {
                                      bgcolor: 'rgba(60, 0, 0, 0.6)',
                                      color: colors.neons.red.light,
                                      boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                      '&::after': {
                                          opacity: 0.8,
                                          height: '100%',
                                      },
                                  },
                            '&::after': !readerMode
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '0%',
                                      opacity: 0,
                                      background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                      transition: 'all 0.2s',
                                  }
                                : {},
                        }}
                    >
                        <Close sx={{ textShadow: `0 0 5px ${colors.neons.red.default}`, zIndex: 2 }} />
                    </Button>
                </Stack>

                {/* Roll history list */}
                <Box ref={containerRef} sx={{ flex: 1, overflow: 'hidden' }}>
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                        {rollHistory.length === 0 ? (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: readerMode ? colors.grays.gray600 : colors.grays.gray900,
                                    textAlign: 'center',
                                    mt: 2,
                                    fontStyle: 'italic',
                                }}
                            >
                                No rolls yet
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {[...rollHistory].reverse().map((entry) => (
                                    <Box
                                        key={entry.id}
                                        sx={{
                                            background: readerMode
                                                ? `linear-gradient(0deg, ${colors.blues.dark}, ${colors.blues.default}90)`
                                                : `linear-gradient(0deg, ${colors.neons.pink.default}30, transparent)`,
                                            borderRadius: 1,
                                            p: 1,
                                            border: `1px solid ${getRollTypeColor(entry.rollType)}40`,
                                            transition: 'all 0.2s',
                                            animation: 'fadeIn 0.3s ease-in',
                                            '@keyframes fadeIn': {
                                                from: { opacity: 0, transform: 'translateY(-10px)' },
                                                to: { opacity: 1, transform: 'translateY(0)' },
                                            },
                                        }}
                                    >
                                        {/* Token name and emoji */}
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            mb={0.5}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray900 : colors.neons.cyan.light,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {entry.tokenName}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '16px',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {getRollTypeEmoji(entry.rollType)}
                                            </Typography>
                                        </Stack>

                                        {/* Roll type */}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: getRollTypeColor(entry.rollType),
                                                display: 'block',
                                                mb: 0.5,
                                            }}
                                        >
                                            {getRollTypeLabel(entry.rollType)}
                                        </Typography>

                                        {/* Result */}
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    color: entry.result.fumble
                                                        ? colors.neons.red.default
                                                        : entry.result.critical
                                                        ? colors.neons.yellow.default
                                                        : readerMode
                                                        ? colors.grays.gray900
                                                        : colors.neons.green.default,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {entry.result.total}
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography
                                                    fontFamily={'monospace'}
                                                    variant="caption"
                                                    sx={{
                                                        color: readerMode ? colors.grays.gray700 : colors.grays.gray800,
                                                    }}
                                                >
                                                    {entry.result.breakdown}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        {/* Special indicators */}

                                        {/* Damage result if present */}
                                        {entry.damageResult && (
                                            <Box mt={0.5}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: getRollTypeColor(entry.rollType),
                                                    }}
                                                >
                                                    {t('combatSim.damage')}:
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray900
                                                                : colors.neons.green.default,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {entry.damageResult.total -
                                                            (entry.damageResult.criticalDamage ? 5 : 0)}
                                                    </Typography>
                                                    {entry.damageResult.criticalDamage && (
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                color: colors.neons.yellow.default,

                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            + 5
                                                        </Typography>
                                                    )}
                                                    <Typography
                                                        variant="caption"
                                                        fontFamily={'monospace'}
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray700
                                                                : colors.grays.gray900,
                                                        }}
                                                    >
                                                        {entry.damageResult.breakdown}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}

                                        {entry.damageResult?.criticalDamage && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: colors.neons.yellow.default,
                                                    fontWeight: 700,
                                                    display: 'block',
                                                    mt: 0.5,
                                                }}
                                            >
                                                {t('combatSim.criticalDamage')}
                                            </Typography>
                                        )}

                                        {/* Timestamp */}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: readerMode ? colors.grays.gray600 : colors.grays.gray800,
                                                display: 'block',
                                                mt: 0.5,
                                                fontSize: '0.65rem',
                                            }}
                                        >
                                            {formatTimestamp(entry.timestamp)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </CustomScrollbar>
                </Box>
            </Box>
        </Box>
    )
}

export default RollHistoryPanel
