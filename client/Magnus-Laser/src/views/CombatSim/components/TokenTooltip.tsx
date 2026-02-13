import { Box, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import type { StatsActions, Token } from '../utils/types'

interface TokenTooltipProps {
    token: Token
}

// Helper function to format damage dice
const formatDamageDice = (damage?: { d4?: number | null; d6?: number | null; d8?: number | null }): string => {
    if (!damage) return ''
    const diceParts = []
    if (damage.d4) diceParts.push(`${damage.d4}D4`)
    if (damage.d6) diceParts.push(`${damage.d6}D6`)
    if (damage.d8) diceParts.push(`${damage.d8}D8`)
    return diceParts.join(' ')
}

// Helper function to get color for action type
const getActionTypeColor = (type: StatsActions['type'], readerMode: boolean): string => {
    if (readerMode) return colors.blues.default

    switch (type) {
        case 'melee':
            return colors.neons.red.default
        case 'ranged':
            return colors.neons.yellow.default
        case 'grenade':
            return colors.neons.orange.default
        case 'skill':
            return colors.neons.cyan.default
        default:
            return colors.neons.cyan.default
    }
}

export const TokenTooltip: React.FC<TokenTooltipProps> = ({ token }) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const stats = token.stats
    const actions = stats?.actions || []

    // Check if token is seriously wounded (current HP < half of max HP)
    const isSeriouslyWounded = stats ? (stats.currentHealth ?? stats.health) < Math.ceil(stats.health / 2) : false
    const showSeriouslyWoundedIndicator = isSeriouslyWounded && !stats?.ignoreSeriouslyWoundedPenalty

    return (
        <Box
            sx={{
                bgcolor: readerMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 20, 40, 0.8)',
                border: `1px solid ${readerMode ? colors.blues.default : colors.neons.cyan.default}`,
                borderRadius: 1,
                p: 1.5,
                minWidth: 200,
                maxWidth: 300,
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    color: readerMode ? colors.blues.dark : colors.neons.cyan.light,
                    fontWeight: 700,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}
            >
                {token.name}
            </Typography>

            {stats && (
                <Grid container>
                    <Grid container size={{ xs: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : '#FFFFFF',
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.health')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {stats.currentHealth}/ {stats.health}
                        </Typography>
                        {showSeriouslyWoundedIndicator && (
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
                    <Grid container size={{ xs: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.purple.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.movement')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {stats.currentMovement} / {stats.movement}
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.green.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.sph')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {stats.armor.currentSph} / {stats.armor.sph}
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.green.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.spb')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {stats.armor.currentSpb} / {stats.armor.spb}
                        </Typography>
                    </Grid>
                    {stats.isPC && stats.luck !== undefined && (
                        <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                            <Typography
                                sx={{
                                    color: readerMode ? colors.blues.default : colors.neons.pink.default,
                                    fontWeight: 700,
                                }}
                            >
                                {t('combatSim.luck')}:
                            </Typography>
                            <Typography
                                sx={{
                                    color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                                }}
                            >
                                {stats.currentLuck ?? 0} / {stats.luck}
                            </Typography>
                        </Grid>
                    )}
                    {/* Actions List */}
                    {actions.length > 0 &&
                        actions.map((action) => {
                            const hasDamage =
                                action.damage && (action.damage.d4 || action.damage.d6 || action.damage.d8)

                            if (hasDamage) {
                                // 6-6 grid layout for actions with damage
                                return (
                                    <Grid
                                        key={action.id}
                                        container
                                        size={{ xs: 12 }}
                                        spacing={1}
                                        sx={{ alignItems: 'baseline' }}
                                    >
                                        <Grid container size={{ xs: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                                            <Typography
                                                sx={{
                                                    color: getActionTypeColor(action.type, readerMode),
                                                    fontWeight: 700,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {action.name || t(`combatSim.${action.type}`)}:
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray600
                                                        : colors.neons.cyan.default,
                                                }}
                                            >
                                                {action.value}
                                            </Typography>
                                        </Grid>
                                        <Grid container size={{ xs: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                                            <Typography
                                                sx={{
                                                    color: getActionTypeColor(action.type, readerMode),
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Dmg:
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray600
                                                        : colors.neons.cyan.default,
                                                }}
                                            >
                                                {formatDamageDice(action.damage)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                )
                            } else {
                                // Full width for actions without damage
                                return (
                                    <Grid
                                        key={action.id}
                                        container
                                        size={{ xs: 12 }}
                                        spacing={1}
                                        sx={{ alignItems: 'baseline' }}
                                    >
                                        <Typography
                                            sx={{
                                                color: getActionTypeColor(action.type, readerMode),
                                                fontWeight: 700,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {action.name || t(`combatSim.${action.type}`)}:
                                        </Typography>
                                        <Typography
                                            sx={{
                                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                                            }}
                                        >
                                            {action.value}
                                        </Typography>
                                    </Grid>
                                )
                            }
                        })}
                </Grid>
            )}
        </Box>
    )
}
