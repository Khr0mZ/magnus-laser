import { pixiToCss } from '@/views/CombatSim/utils/pixiUtils'
import { PlayArrow, SkipNext, Stop } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Scrollbar from 'smooth-scrollbar'
import CustomScrollbar from '../../../../components/CustomScrollbar'
import { useUserPreferences } from '../../../../contexts/userPreferencesHooks'
import colors from '../../../../utils/colors'
import type { Token } from '../../utils/types'

interface InitiativePanelProps {
    isSidePanelOpen: boolean
    tokens: Token[]
    initiativeRolls: Map<string, number>
    activeTokenId: string | null
    currentRound: number
    autoRerollInitiative: boolean
    onSetAutoReroll: (value: boolean) => void
    onTokenClick: (tokenId: string) => void
    onNextTurn: () => void
    onUpdateTokenCurrent: (tokenId: string, field: 'health' | 'sph' | 'spb' | 'luck', value: number) => void
    onUpdateInitiative: (tokenId: string, value: number) => void
    onMeleeAttack: (token: Token, actionId: string) => Promise<void>
    onRangedAttack: (token: Token, actionId: string) => Promise<void>
    onSkillCheck: (token: Token, actionId: string) => Promise<void>
    onGrenadeAttack: (token: Token, actionId: string) => Promise<void>
    resolveImageUrl: (imageId: string | undefined) => string | undefined
    isCombatActive: boolean
    onToggleCombat: () => void
    isSeriouslyWounded: (token: Token) => boolean
    isPlayerConnected: boolean
}

const InitiativePanel = ({
    isSidePanelOpen,
    tokens,
    initiativeRolls,
    activeTokenId,
    currentRound,
    autoRerollInitiative,
    onSetAutoReroll,
    onTokenClick,
    onNextTurn,
    onUpdateTokenCurrent,
    onUpdateInitiative,
    onMeleeAttack,
    onRangedAttack,
    onSkillCheck,
    onGrenadeAttack,
    resolveImageUrl,
    isCombatActive,
    onToggleCombat,
    isSeriouslyWounded,
    isPlayerConnected,
}: InitiativePanelProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const containerRef = useRef<HTMLDivElement>(null)

    // Sort tokens by initiative (highest to lowest)
    const sortedTokens = useMemo(() => {
        return [...tokens].sort((a, b) => (initiativeRolls.get(b.id) ?? 0) - (initiativeRolls.get(a.id) ?? 0))
    }, [tokens, initiativeRolls])

    // Scroll to top when round changes
    useEffect(() => {
        if (currentRound > 1 && containerRef.current) {
            // Delay to ensure content is fully rendered
            const scrollToTop = () => {
                const scrollbarContainer = containerRef.current?.querySelector(
                    '.smooth-scrollbar-container'
                ) as HTMLElement
                if (scrollbarContainer) {
                    const scrollbarInstance = Scrollbar.get(scrollbarContainer)
                    if (scrollbarInstance) {
                        scrollbarInstance.scrollTo(0, 0, 300) // x, y, duration in ms
                    }
                }
            }

            // Try immediately
            scrollToTop()

            // And again after a delay to ensure all content is rendered
            setTimeout(scrollToTop, 50)
        }
    }, [currentRound])

    // Scroll to active token when it changes
    useEffect(() => {
        if (activeTokenId && containerRef.current) {
            const scrollToActiveToken = () => {
                const scrollbarContainer = containerRef.current?.querySelector(
                    '.smooth-scrollbar-container'
                ) as HTMLElement
                if (scrollbarContainer) {
                    const scrollbarInstance = Scrollbar.get(scrollbarContainer)
                    if (scrollbarInstance) {
                        // Find the active token element
                        const activeTokenElement = scrollbarContainer.querySelector(
                            `[data-token-id="${activeTokenId}"]`
                        ) as HTMLElement

                        if (activeTokenElement) {
                            // Calculate the position to scroll to (center the active token in view)
                            const containerHeight = scrollbarContainer.clientHeight
                            const tokenTop = activeTokenElement.offsetTop
                            const tokenHeight = activeTokenElement.offsetHeight
                            const scrollTop = tokenTop - containerHeight / 2 + tokenHeight / 2

                            scrollbarInstance.scrollTo(0, Math.max(0, scrollTop), 300)
                        }
                    }
                }
            }

            // Delay to ensure content is fully rendered
            setTimeout(scrollToActiveToken, 50)
        }
    }, [activeTokenId])

    const currentIndex = sortedTokens.findIndex((t) => t.id === activeTokenId)

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onTokenClick(sortedTokens[currentIndex - 1].id)
        }
    }

    const handleNext = () => {
        if (currentIndex === sortedTokens.length - 1) {
            onNextTurn()
        } else if (currentIndex < sortedTokens.length - 1) {
            onTokenClick(sortedTokens[currentIndex + 1].id)
        }
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                width: isSidePanelOpen ? 260 : 0,
                flex: '0 0 auto',
                height: '100%',
                overflow: 'hidden',
                transition: 'width 220ms ease',
                willChange: 'width',
                borderRight: isSidePanelOpen ? `1px solid ${colors.neons.cyan.dark}` : 'none',
                bgcolor: readerMode ? colors.grays.gray000 : 'rgba(0, 0, 40, 0.6)',
            }}
        >
            <Box
                sx={{
                    width: 260,
                    height: '100%',
                    background: `linear-gradient(0deg, ${colors.neons.cyan.default}30, transparent)`,
                    zIndex: 10,
                    p: 1,
                    opacity: isSidePanelOpen ? 1 : 0,
                    transition: 'opacity 220ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                        {!isPlayerConnected && (
                            <IconButton
                                onClick={onToggleCombat}
                                sx={{
                                    color: isCombatActive ? colors.neons.red.default : colors.neons.green.default,
                                    border: `1px solid ${
                                        isCombatActive ? colors.neons.red.dark : colors.neons.green.dark
                                    }`,
                                    borderRadius: 1,
                                    width: 36,
                                    height: 36,
                                    '&:hover': {
                                        borderColor: isCombatActive
                                            ? colors.neons.red.default
                                            : colors.neons.green.default,
                                        bgcolor: isCombatActive ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                                    },
                                }}
                                title={isCombatActive ? t('combatSim.stopCombat') : t('combatSim.startCombat')}
                            >
                                {isCombatActive ? <Stop /> : <PlayArrow />}
                            </IconButton>
                        )}
                        <Typography
                            variant="h4"
                            className="glitch-text"
                            data-text={`${t('combatSim.round')} ${currentRound}`}
                            sx={{
                                color: readerMode ? colors.grays.gray900 : colors.neons.pink.default,
                                fontWeight: 700,
                                textShadow: `0 0 8px ${colors.grays.gray000}`,
                                flex: 1,
                                textAlign: 'center',
                            }}
                        >
                            {t('combatSim.round')} {currentRound}
                        </Typography>
                        {!isPlayerConnected && (
                            <IconButton
                                onClick={onNextTurn}
                                disabled={!isCombatActive}
                                sx={{
                                    color: colors.neons.yellow.default,
                                    border: `1px solid ${colors.neons.yellow.dark}`,
                                    borderRadius: 1,
                                    width: 36,
                                    height: 36,
                                    '&:hover': {
                                        borderColor: colors.neons.yellow.default,
                                        bgcolor: 'rgba(255, 255, 0, 0.1)',
                                    },
                                    '&:disabled': {
                                        color: colors.grays.gray600,
                                        borderColor: colors.grays.gray700,
                                    },
                                }}
                                title={t('combatSim.nextRound')}
                            >
                                <SkipNext />
                            </IconButton>
                        )}
                    </Stack>
                    {!isPlayerConnected && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={autoRerollInitiative}
                                    onChange={(e) => onSetAutoReroll(e.target.checked)}
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
                                    {t('combatSim.autoRerollInitiative')}
                                </Typography>
                            }
                            sx={{ mb: 1 }}
                        />
                    )}
                </Box>

                {/* Token list */}
                <CustomScrollbar scrollDirection="vertical" height="100%">
                    <Grid container spacing={1}>
                        {sortedTokens.map((token) => {
                            const isActive = token.id === activeTokenId
                            const initiative = initiativeRolls.get(token.id) ?? 0
                            const stats = token.stats

                            return (
                                <Grid
                                    size={12}
                                    key={token.id}
                                    data-token-id={token.id}
                                    onClick={
                                        !isPlayerConnected && isCombatActive ? () => onTokenClick(token.id) : undefined
                                    }
                                    sx={{
                                        background: isActive
                                            ? readerMode
                                                ? `linear-gradient(0deg, ${colors.blues.default}, ${colors.blues.light}90)`
                                                : `linear-gradient(0deg, ${colors.neons.pink.default}40, ${colors.neons.cyan.default}30)`
                                            : readerMode
                                            ? `linear-gradient(0deg, ${colors.blues.dark}, ${colors.blues.default}90)`
                                            : `linear-gradient(0deg, ${colors.neons.cyan.default}20, transparent)`,
                                        borderRadius: 1,
                                        p: 1,
                                        cursor: !isPlayerConnected && isCombatActive ? 'pointer' : 'default',
                                        border: isActive
                                            ? `1px solid ${colors.neons.pink.default}`
                                            : `1px solid ${colors.neons.cyan.dark}40`,
                                        boxShadow: isActive ? `0 0 12px ${colors.neons.pink.default}80` : 'none',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: readerMode ? colors.blues.default : 'rgba(0, 0, 60, 0.6)',
                                            boxShadow: `0 0 8px ${colors.neons.cyan.default}60`,
                                        },
                                    }}
                                >
                                    {/* Top row: Avatar, name, initiative */}
                                    <Grid container size={12} spacing={1} alignItems="center" mb={1}>
                                        <Avatar
                                            sx={{ width: 32, height: 32, color: pixiToCss(token.color) }}
                                            src={resolveImageUrl(token.imageId)}
                                        />
                                        <Box flex={1}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: isActive
                                                        ? colors.neons.pink.light
                                                        : readerMode
                                                        ? colors.grays.gray900
                                                        : colors.neons.cyan.light,
                                                    fontWeight: isActive ? 700 : 600,
                                                }}
                                            >
                                                {token.name}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            size="small"
                                            type="tel"
                                            value={initiative}
                                            disabled={!isCombatActive}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0
                                                onUpdateInitiative(token.id, val)
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{
                                                width: 50,
                                                '& input': {
                                                    padding: '4px 8px',
                                                    fontSize: '1rem',
                                                    color: colors.neons.yellow.default,
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                },
                                                '& input:disabled': {
                                                    color: colors.grays.gray600,
                                                    WebkitTextFillColor: colors.grays.gray600,
                                                },
                                            }}
                                        />
                                    </Grid>

                                    {/* Stats row */}
                                    <Grid container size={12} spacing={0.5}>
                                        {/* Health */}
                                        <Grid size={6}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                    mr: 0.5,
                                                }}
                                            >
                                                {t('combatSim.hp')}:
                                            </Typography>
                                            <TextField
                                                size="small"
                                                type="tel"
                                                value={stats.currentHealth ?? stats.health}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    onUpdateTokenCurrent(token.id, 'health', val)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    width: 45,
                                                    '& input': {
                                                        padding: '2px 4px',
                                                        fontSize: '0.75rem',
                                                        color: readerMode
                                                            ? colors.grays.gray900
                                                            : colors.neons.red.default,
                                                        textAlign: 'center',
                                                    },
                                                    mr: 0.5,
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray700 : colors.neons.red.default,
                                                }}
                                            >
                                                / {stats.health}
                                            </Typography>
                                            {isSeriouslyWounded(token) &&
                                                !token.stats?.ignoreSeriouslyWoundedPenalty && (
                                                    <Typography
                                                        sx={{
                                                            fontSize: '14px',
                                                            lineHeight: 1,
                                                            ml: 0.5,
                                                        }}
                                                        title={t('combatSim.seriouslyWoundedTooltip')}
                                                    >
                                                        🩸
                                                    </Typography>
                                                )}
                                        </Grid>

                                        {/* Movement */}
                                        <Grid size={6} spacing={1}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                    mr: 0.5,
                                                }}
                                            >
                                                {t('combatSim.move')}:
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray900
                                                        : colors.neons.purple.default,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {stats.currentMovement} / {stats.movement}
                                            </Typography>
                                        </Grid>

                                        {/* Armor */}
                                        {/* SPH */}
                                        <Grid size={6}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                    mr: 0.5,
                                                }}
                                            >
                                                {t('combatSim.sph')}:
                                            </Typography>
                                            <TextField
                                                size="small"
                                                type="tel"
                                                value={stats.armor.currentSph ?? stats.armor.sph}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    onUpdateTokenCurrent(token.id, 'sph', val)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    width: 35,
                                                    '& input': {
                                                        padding: '2px 4px',
                                                        fontSize: '0.70rem',
                                                        color: readerMode
                                                            ? colors.grays.gray900
                                                            : colors.neons.green.default,
                                                        textAlign: 'center',
                                                    },
                                                    mr: 0.5,
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray700
                                                        : colors.neons.green.default,
                                                }}
                                            >
                                                / {stats.armor.sph}
                                            </Typography>
                                        </Grid>
                                        {/* SPB */}
                                        <Grid size={6}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                    mr: 0.5,
                                                }}
                                            >
                                                {t('combatSim.spb')}:
                                            </Typography>
                                            <TextField
                                                size="small"
                                                type="tel"
                                                value={stats.armor.currentSpb ?? stats.armor.spb}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    onUpdateTokenCurrent(token.id, 'spb', val)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    width: 35,
                                                    '& input': {
                                                        padding: '2px 4px',
                                                        fontSize: '0.70rem',
                                                        color: readerMode
                                                            ? colors.grays.gray900
                                                            : colors.neons.green.default,
                                                        textAlign: 'center',
                                                    },
                                                    mr: 0.5,
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray700
                                                        : colors.neons.green.default,
                                                }}
                                            >
                                                / {stats.armor.spb}
                                            </Typography>
                                        </Grid>

                                        {/* Luck (PC only) */}
                                        {stats.isPC && stats.luck !== undefined && (
                                            <Grid size={6}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                        mr: 0.5,
                                                    }}
                                                >
                                                    {t('combatSim.luck')}:
                                                </Typography>
                                                <TextField
                                                    size="small"
                                                    type="tel"
                                                    value={stats.currentLuck ?? 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0
                                                        onUpdateTokenCurrent(token.id, 'luck', val)
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    sx={{
                                                        width: 35,
                                                        '& input': {
                                                            padding: '2px 4px',
                                                            fontSize: '0.70rem',
                                                            color: readerMode
                                                                ? colors.grays.gray900
                                                                : colors.neons.pink.default,
                                                            textAlign: 'center',
                                                        },
                                                        mr: 0.5,
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: readerMode
                                                            ? colors.grays.gray700
                                                            : colors.neons.pink.default,
                                                    }}
                                                >
                                                    / {stats.luck}
                                                </Typography>
                                            </Grid>
                                        )}

                                        {/* Action buttons */}
                                        <Grid container size={12} spacing={1}>
                                            {token.stats.actions.map((action) => (
                                                <Grid size={6} spacing={1} key={action.id}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (action.type === 'melee') {
                                                                onMeleeAttack(token, action.id)
                                                            } else if (action.type === 'ranged') {
                                                                onRangedAttack(token, action.id)
                                                            } else if (action.type === 'grenade') {
                                                                onGrenadeAttack(token, action.id)
                                                            } else if (action.type === 'skill') {
                                                                onSkillCheck(token, action.id)
                                                            }
                                                        }}
                                                        title={action.name}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            width: '100%',
                                                            color:
                                                                action.type === 'melee'
                                                                    ? colors.neons.red.default
                                                                    : action.type === 'ranged'
                                                                    ? colors.neons.yellow.default
                                                                    : action.type === 'grenade'
                                                                    ? colors.neons.orange.default
                                                                    : colors.neons.cyan.default,
                                                            border: `1px solid ${
                                                                action.type === 'melee'
                                                                    ? colors.neons.red.dark
                                                                    : action.type === 'ranged'
                                                                    ? colors.neons.yellow.dark
                                                                    : action.type === 'grenade'
                                                                    ? colors.neons.orange.dark
                                                                    : colors.neons.cyan.dark
                                                            }`,
                                                            borderRadius: 1,
                                                            fontSize: '16px',
                                                            '&:hover': {
                                                                bgcolor:
                                                                    action.type === 'melee'
                                                                        ? 'rgba(255, 0, 0, 0.1)'
                                                                        : action.type === 'ranged'
                                                                        ? 'rgba(255, 255, 0, 0.1)'
                                                                        : action.type === 'grenade'
                                                                        ? 'rgba(255, 140, 0, 0.1)'
                                                                        : 'rgba(0, 255, 255, 0.1)',
                                                                boxShadow: `0 0 6px ${
                                                                    action.type === 'melee'
                                                                        ? colors.neons.red.default
                                                                        : action.type === 'ranged'
                                                                        ? colors.neons.yellow.default
                                                                        : action.type === 'grenade'
                                                                        ? colors.neons.orange.default
                                                                        : colors.neons.cyan.default
                                                                }60`,
                                                            },
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: readerMode
                                                                    ? colors.grays.gray700
                                                                    : colors.grays.gray900,
                                                            }}
                                                            noWrap
                                                        >
                                                            {action.name}
                                                        </Typography>
                                                        {action.type === 'melee'
                                                            ? '🪓'
                                                            : action.type === 'ranged'
                                                            ? '🔫'
                                                            : action.type === 'grenade'
                                                            ? '💣'
                                                            : '🧩'}
                                                    </IconButton>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            )
                        })}
                    </Grid>
                </CustomScrollbar>

                {/* Footer - Navigation buttons */}
                {!isPlayerConnected && (
                    <Stack direction="row" spacing={1} mt={1}>
                        <Button
                            variant="outlined"
                            onClick={handlePrevious}
                            disabled={!isCombatActive || currentIndex <= 0}
                            sx={{
                                flex: 1,
                                color: colors.neons.cyan.default,
                                borderColor: colors.neons.cyan.dark,
                                '&:hover': {
                                    borderColor: colors.neons.cyan.default,
                                    bgcolor: 'rgba(0, 255, 255, 0.1)',
                                },
                                '&:disabled': {
                                    color: colors.grays.gray600,
                                    borderColor: colors.grays.gray700,
                                },
                            }}
                        >
                            {t('combatSim.previousTurn')}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleNext}
                            disabled={!isCombatActive || sortedTokens.length === 0}
                            sx={{
                                flex: 1,
                                color: colors.neons.pink.default,
                                borderColor: colors.neons.pink.dark,
                                '&:hover': {
                                    borderColor: colors.neons.pink.default,
                                    bgcolor: 'rgba(255, 0, 255, 0.1)',
                                },
                                '&:disabled': {
                                    color: colors.grays.gray600,
                                    borderColor: colors.grays.gray700,
                                },
                            }}
                        >
                            {t('combatSim.nextTurn')}
                        </Button>
                    </Stack>
                )}
            </Box>
        </Box>
    )
}

export default InitiativePanel
