import { Container, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'

const CorporationView = () => {
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    useDocumentTitle(`Magnus Laser - Corporation`)

    return (
        <Container maxWidth={false} sx={{ pt: 3 }}>
            <Typography
                variant="h3"
                className="glitch-text"
                data-text={t('modules.CORPORATION')}
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    flexGrow: 1,
                }}
            >
                {t('modules.CORPORATION')}
            </Typography>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t('modules.CORPORATION_DESCRIPTION')}
            </Typography>
        </Container>
    )
}

export default CorporationView
