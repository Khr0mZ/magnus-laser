import { Box, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import { Token } from '../types'

interface TokenTooltipProps {
    token: Token
}

export const TokenTooltip: React.FC<TokenTooltipProps> = ({ token }) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const stats = token.stats

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
                            {stats.combat}
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
                            {stats.skills}
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
                            {stats.weapons.melee.d6}D6
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
                            {stats.weapons.ranged.d6}D6
                        </Typography>
                    </Grid>
                    {((stats.weapons.grenadesOrSpecialAmmo?.d4 ?? 0) > 0 ||
                        (stats.weapons.grenadesOrSpecialAmmo?.d6 ?? 0) > 0 ||
                        (stats.weapons.grenadesOrSpecialAmmo?.d8 ?? 0) > 0) && (
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
                                {t('combatSim.grenadesOrSpecialAmmo')}:
                            </Typography>
                            <Typography
                                sx={{
                                    color: readerMode ? colors.grays.gray600 : colors.neons.cyan.default,
                                }}
                            >
                                {stats.weapons.currentGrenadesOrSpecialAmmo} /{' '}
                                {stats.weapons.grenadesOrSpecialAmmo?.d4 &&
                                    `${stats.weapons.grenadesOrSpecialAmmo?.d4}D4`}
                                {stats.weapons.grenadesOrSpecialAmmo?.d6 &&
                                    `${stats.weapons.grenadesOrSpecialAmmo?.d6}D6`}
                                {stats.weapons.grenadesOrSpecialAmmo?.d8 &&
                                    `${stats.weapons.grenadesOrSpecialAmmo?.d8}D8`}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    )
}
