import { Box, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import type { StatsActions, Token } from '../utils/types'

interface TokenTooltipProps {
    token: Token
}

// Helper functions to extract display values from actions
const getActionDisplayValue = (actions: StatsActions[], type: StatsActions['type']): string => {
    const action = actions.find((a) => a.type === type)
    return action ? `${action.value}` : '0'
}

const getWeaponDisplayValue = (actions: StatsActions[], type: StatsActions['type']): string => {
    const action = actions.find((a) => a.type === type)
    if (!action || !action.damage) return '0D6'
    const dice = action.damage.d6 || 1
    return `${dice}D6`
}

const getGrenadeDisplayInfo = (actions: StatsActions[]) => {
    const grenadeAction = actions.find((a) => a.type === 'grenade')
    if (!grenadeAction || !grenadeAction.damage) return null

    const diceParts = []
    if (grenadeAction.damage.d4) diceParts.push(`${grenadeAction.damage.d4}D4`)
    if (grenadeAction.damage.d6) diceParts.push(`${grenadeAction.damage.d6}D6`)
    if (grenadeAction.damage.d8) diceParts.push(`${grenadeAction.damage.d8}D8`)

    return {
        dice: diceParts.join(' '),
    }
}

export const TokenTooltip: React.FC<TokenTooltipProps> = ({ token }) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const stats = token.stats
    const actions = stats?.actions || []

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
                    <Grid container size={{ xs: 12 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.red.default,
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
                    </Grid>
                    <Grid container size={{ xs: 12 }} spacing={1} sx={{ alignItems: 'baseline' }}>
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
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.yellow.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.combat')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {getActionDisplayValue(actions, 'melee')}
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.yellow.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.skills')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {getActionDisplayValue(actions, 'skill')}
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.blue.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.melee')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {getWeaponDisplayValue(actions, 'melee')}
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography
                            sx={{
                                color: readerMode ? colors.blues.default : colors.neons.blue.default,
                                fontWeight: 700,
                            }}
                        >
                            {t('combatSim.ranged')}:
                        </Typography>
                        <Typography
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                            }}
                        >
                            {getWeaponDisplayValue(actions, 'ranged')}
                        </Typography>
                    </Grid>
                    {(() => {
                        const grenadeInfo = getGrenadeDisplayInfo(actions)
                        return grenadeInfo ? (
                            <Grid container size={{ xs: 12 }} spacing={1} sx={{ alignItems: 'baseline' }}>
                                <Typography
                                    sx={{
                                        color: readerMode ? colors.blues.default : colors.neons.blue.default,
                                        fontWeight: 700,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t('combatSim.grenade')}:
                                </Typography>
                                <Typography
                                    sx={{
                                        color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                                    }}
                                >
                                    {grenadeInfo.dice}
                                </Typography>
                            </Grid>
                        ) : null
                    })()}
                </Grid>
            )}
        </Box>
    )
}
