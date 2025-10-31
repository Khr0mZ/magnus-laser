import { Casino, Close } from '@mui/icons-material'
import { Box, Button, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Scrollbar from 'smooth-scrollbar'
import CustomScrollbar from '../../../../components/CustomScrollbar'
import { useUserPreferences } from '../../../../contexts/userPreferencesHooks'
import colors from '../../../../utils/colors'
import type { RollHistoryEntry } from '../../types'

interface RollHistoryPanelProps {
    isOpen: boolean
    rollHistory: RollHistoryEntry[]
    autoRollDamage: boolean
    onSetAutoRollDamage: (value: boolean) => void
    onClear: () => void
    onDelete: (id: string) => void
    onRevealDamage: (id: string) => void
    isPlayerConnected: boolean
}

const RollHistoryPanel = ({
    isOpen,
    rollHistory,
    autoRollDamage,
    onSetAutoRollDamage,
    onClear,
    onDelete,
    onRevealDamage,
    isPlayerConnected,
}: RollHistoryPanelProps) => {
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
            case 'turn-start':
                return t('combatSim.turnStart')
            case 'grenade-hit':
                return `${t('combatSim.toHit')}`
            case 'grenade-damage':
                return `${t('combatSim.grenadeAttack')} - ${t('combatSim.damage')}`
            default:
                return rollType
        }
    }

    const getRollTypeColor = (rollType: string) => {
        if (rollType.includes('melee')) return colors.neons.cyan.default
        if (rollType.includes('ranged')) return colors.neons.cyan.default
        if (rollType.includes('grenade')) return colors.neons.cyan.default
        if (rollType === 'skill') return colors.neons.cyan.default
        if (rollType === 'turn-start') return colors.neons.pink.default
        return colors.neons.green.default
    }

    const getRollTypeEmoji = (rollType: string): string => {
        if (rollType === 'initiative') return '⚔️'
        if (rollType.includes('melee')) return '🪓'
        if (rollType.includes('ranged')) return '🔫'
        if (rollType.includes('grenade')) return '💣'
        if (rollType === 'skill') return '🧩'
        if (rollType === 'turn-start') return '▶️'
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
                    {!isPlayerConnected && (
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
                    )}
                </Stack>
                {!isPlayerConnected && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={autoRollDamage}
                                onChange={(e) => onSetAutoRollDamage(e.target.checked)}
                                sx={{
                                    color: colors.neons.cyan.default,
                                    '&.Mui-checked': {
                                        color: colors.neons.cyan.light,
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography
                                variant="caption"
                                sx={{
                                    color: readerMode ? colors.grays.gray700 : colors.neons.cyan.light,
                                }}
                            >
                                {t('combatSim.autoRollDamage')}
                            </Typography>
                        }
                        sx={{ mb: 1 }}
                    />
                )}

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
                                            position: 'relative',
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
                                            '& .delete-btn': {
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                            },
                                            '&:hover .delete-btn': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        {/* Delete button - only visible on hover */}
                                        {!isPlayerConnected && (
                                            <Button
                                                className="delete-btn"
                                                title={t('combatSim.clearHistory')}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDelete(entry.id)
                                                }}
                                                disabled={rollHistory.length === 0}
                                                sx={{
                                                    zIndex: 100,
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    minWidth: '24px',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '2px',
                                                    p: 0,
                                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                                    color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                                    border: readerMode
                                                        ? '1px solid #d32f2f'
                                                        : `1px solid ${colors.neons.red.default}60`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    //position: 'relative',
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
                                                <Close
                                                    sx={{
                                                        textShadow: `0 0 5px ${colors.neons.red.default}`,
                                                        zIndex: 2,
                                                    }}
                                                />
                                            </Button>
                                        )}
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
                                                    fontSize: '20px',
                                                    lineHeight: 1,
                                                    userSelect: 'none',
                                                }}
                                            >
                                                {getRollTypeEmoji(entry.rollType)}
                                            </Typography>
                                        </Stack>

                                        {/* Roll type */}

                                        {/* Result - skip for turn-start entries */}
                                        {entry.rollType !== 'turn-start' && (
                                            <Stack spacing={1}>
                                                <Divider sx={{ height: '2px', bgcolor: colors.neons.purple.default }} />
                                                <Stack direction="row" alignItems="baseline" spacing={1}>
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
                                                    {(entry.result.fumble || entry.result.critical) && (
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontSize: '20px',
                                                            }}
                                                        >
                                                            {entry.result.fumble ? '🖕' : '💥'}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography
                                                        fontFamily={'monospace'}
                                                        variant="caption"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray700
                                                                : colors.grays.gray800,
                                                        }}
                                                    >
                                                        {entry.result.breakdown}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        )}

                                        {/* Damage result - show button if not revealed, show damage if revealed */}
                                        {entry.damageResult && !entry.damageRevealed && (
                                            <Box mt={0.5}>
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRevealDamage(entry.id)
                                                    }}
                                                    sx={{
                                                        color: getRollTypeColor(entry.rollType),
                                                        borderColor: `${getRollTypeColor(entry.rollType)}60`,
                                                        border: `1px solid ${getRollTypeColor(entry.rollType)}60`,
                                                        fontSize: '1rem',
                                                        py: 0.25,
                                                        px: 1,
                                                        minHeight: 0,
                                                        '&:hover': {
                                                            borderColor: getRollTypeColor(entry.rollType),
                                                            bgcolor: `${getRollTypeColor(entry.rollType)}20`,
                                                        },
                                                    }}
                                                    startIcon={<Casino sx={{ fontSize: 14 }} />}
                                                >
                                                    {t('combatSim.rollDamage')}
                                                </Button>
                                            </Box>
                                        )}
                                        {entry.damageResult && entry.damageRevealed && (
                                            <Box mt={0.5}>
                                                <Divider />
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: getRollTypeColor(entry.rollType),
                                                        }}
                                                    >
                                                        {t('combatSim.damage')}:
                                                    </Typography>
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
                                                </Stack>
                                                <Typography
                                                    variant="caption"
                                                    fontFamily={'monospace'}
                                                    sx={{
                                                        color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                    }}
                                                >
                                                    {entry.damageResult.breakdown}
                                                </Typography>
                                            </Box>
                                        )}
                                        {entry.damageResult?.criticalDamage && entry.damageRevealed && (
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.yellow.default,
                                                        fontWeight: 700,
                                                        display: 'block',
                                                        fontSize: '18px',
                                                    }}
                                                >
                                                    {t('combatSim.criticalDamage')}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.yellow.default,
                                                        fontWeight: 700,
                                                        display: 'block',
                                                        fontSize: '24px',
                                                    }}
                                                >
                                                    {entry.rollType === 'melee-hit' && '🦾'}
                                                    {entry.rollType === 'ranged-hit' && '🎯'}
                                                </Typography>
                                            </Stack>
                                        )}

                                        {/* Timestamp */}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: readerMode ? colors.grays.gray600 : colors.grays.gray800,
                                                display: 'block',
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
