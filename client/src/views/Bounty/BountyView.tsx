import { Container, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors.ts'

const BountyView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    useDocumentTitle(`Magnus Laser - Bounty`)

    return (
        <Container maxWidth={false} sx={{ pt: 3 }}>
            <Typography
                variant="h3"
                className="glitch-text"
                data-text={t('modules.BOUNTY')}
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    flexGrow: 1,
                }}
            >
                {t('modules.BOUNTY')}
            </Typography>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t('modules.BOUNTY_DESCRIPTION')}
            </Typography>
        </Container>
    )
}

export default BountyView
