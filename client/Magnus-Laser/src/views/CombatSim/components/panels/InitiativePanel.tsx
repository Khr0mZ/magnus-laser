import { pixiToCss } from '@/views/CombatSim/utils/pixiUtils'
import { PlayArrow, SkipNext, Stop } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
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
import type { Token } from '../../types'

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
    onUpdateTokenCurrent: (tokenId: string, field: 'health' | 'sph' | 'spb', value: number) => void
    onUpdateInitiative: (tokenId: string, value: number) => void
    onMeleeAttack: (token: Token) => Promise<void>
    onRangedAttack: (token: Token) => Promise<void>
    onSkillCheck: (token: Token) => Promise<void>
    onGrenadeAttack: (token: Token) => Promise<void>
    resolveImageUrl: (imageId: string | undefined) => string | undefined
    isCombatActive: boolean
    onToggleCombat: () => void
    isSeriouslyWounded: (token: Token) => boolean
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
                        <IconButton
                            onClick={onToggleCombat}
                            sx={{
                                color: isCombatActive ? colors.neons.red.default : colors.neons.green.default,
                                border: `1px solid ${isCombatActive ? colors.neons.red.dark : colors.neons.green.dark}`,
                                borderRadius: 1,
                                width: 36,
                                height: 36,
                                '&:hover': {
                                    borderColor: isCombatActive ? colors.neons.red.default : colors.neons.green.default,
                                    bgcolor: isCombatActive ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                                },
                            }}
                            title={isCombatActive ? t('combatSim.stopCombat') : t('combatSim.startCombat')}
                        >
                            {isCombatActive ? <Stop /> : <PlayArrow />}
                        </IconButton>
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
                    </Stack>
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
                </Box>

                {/* Token list */}
                <CustomScrollbar scrollDirection="vertical" height="100%">
                    <Stack spacing={1}>
                        {sortedTokens.map((token) => {
                            const isActive = token.id === activeTokenId
                            const initiative = initiativeRolls.get(token.id) ?? 0
                            const stats = token.stats

                            return (
                                <Box
                                    key={token.id}
                                    data-token-id={token.id}
                                    onClick={() => onTokenClick(token.id)}
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
                                        cursor: 'pointer',
                                        border: isActive
                                            ? `2px solid ${colors.neons.pink.default}`
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
                                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
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
                                    </Stack>

                                    {/* Stats row */}
                                    {stats && (
                                        <Box>
                                            {/* Health */}
                                            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                        minWidth: 35,
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
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: readerMode
                                                            ? colors.grays.gray700
                                                            : colors.neons.red.default,
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
                                                            title="Seriously Wounded (-2 to hit/skill rolls)"
                                                        >
                                                            🩸
                                                        </Typography>
                                                    )}
                                            </Stack>

                                            {/* Movement */}
                                            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: readerMode ? colors.grays.gray700 : colors.grays.gray900,
                                                        minWidth: 35,
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
                                            </Stack>

                                            {/* Armor */}
                                            <Stack direction="row" spacing={1} mb={0.5}>
                                                {/* SPH */}
                                                <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray700
                                                                : colors.grays.gray900,
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
                                                        /{stats.armor.sph}
                                                    </Typography>
                                                </Stack>

                                                {/* SPB */}
                                                <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray700
                                                                : colors.grays.gray900,
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
                                                        /{stats.armor.spb}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            {/* Action buttons */}
                                            <Stack direction="row" spacing={0.5}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onMeleeAttack(token)
                                                    }}
                                                    sx={{
                                                        flex: 1,
                                                        color: colors.neons.red.default,
                                                        border: `1px solid ${colors.neons.red.dark}`,
                                                        borderRadius: 1,
                                                        fontSize: '16px',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255, 0, 0, 0.1)',
                                                            boxShadow: `0 0 6px ${colors.neons.red.default}60`,
                                                        },
                                                    }}
                                                    title={t('combatSim.meleeAttack')}
                                                >
                                                    🪓
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRangedAttack(token)
                                                    }}
                                                    sx={{
                                                        flex: 1,
                                                        color: colors.neons.yellow.default,
                                                        border: `1px solid ${colors.neons.yellow.dark}`,
                                                        borderRadius: 1,
                                                        fontSize: '16px',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255, 255, 0, 0.1)',
                                                            boxShadow: `0 0 6px ${colors.neons.yellow.default}60`,
                                                        },
                                                    }}
                                                    title={t('combatSim.rangedAttack')}
                                                >
                                                    🔫
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const isDisabled =
                                                            !isCombatActive ||
                                                            (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0) <=
                                                                0
                                                        if (isDisabled) return
                                                        onGrenadeAttack(token)
                                                    }}
                                                    sx={{
                                                        flex: 1,
                                                        color:
                                                            !isCombatActive ||
                                                            (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0) <=
                                                                0
                                                                ? colors.grays.gray600
                                                                : '#ff8c00',
                                                        border: `1px solid ${
                                                            !isCombatActive ||
                                                            (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0) <=
                                                                0
                                                                ? colors.grays.gray700
                                                                : '#cc7000'
                                                        }`,
                                                        borderRadius: 1,
                                                        fontSize: '12px',
                                                        cursor:
                                                            !isCombatActive ||
                                                            (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0) <=
                                                                0
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                        '&:hover': {
                                                            bgcolor:
                                                                !isCombatActive ||
                                                                (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ??
                                                                    0) <= 0
                                                                    ? 'transparent'
                                                                    : 'rgba(255, 140, 0, 0.1)',
                                                            boxShadow:
                                                                !isCombatActive ||
                                                                (token.stats?.weapons?.currentGrenadesOrSpecialAmmo ??
                                                                    0) <= 0
                                                                    ? 'none'
                                                                    : `0 0 6px #ff8c0060`,
                                                        },
                                                    }}
                                                    title={t('combatSim.grenadeAttack')}
                                                >
                                                    {token.stats?.weapons?.currentGrenadesOrSpecialAmmo ?? 0} 💣
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onSkillCheck(token)
                                                    }}
                                                    sx={{
                                                        flex: 1,
                                                        color: colors.neons.cyan.default,
                                                        border: `1px solid ${colors.neons.cyan.dark}`,
                                                        borderRadius: 1,
                                                        fontSize: '16px',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0, 255, 255, 0.1)',
                                                            boxShadow: `0 0 6px ${colors.neons.cyan.default}60`,
                                                        },
                                                    }}
                                                    title={t('combatSim.skillCheck')}
                                                >
                                                    🧩
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    )}
                                </Box>
                            )
                        })}
                    </Stack>
                </CustomScrollbar>

                {/* Footer - Navigation buttons */}
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
            </Box>
        </Box>
    )
}

export default InitiativePanel
