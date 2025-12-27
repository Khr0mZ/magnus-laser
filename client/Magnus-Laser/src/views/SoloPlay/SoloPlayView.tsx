import FlashOn from '@mui/icons-material/FlashOn'
import Router from '@mui/icons-material/Router'
import { Box, Container, Grid, Tab, Tabs, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import QDCombatPanel from './components/QDCombatPanel'
import QDNetrunPanel from './components/QDNetrunPanel'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`solo-play-tabpanel-${index}`}
            aria-labelledby={`solo-play-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    )
}

const SoloPlayView = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [activeTab, setActiveTab] = useState(0)
    useDocumentTitle(`Magnus Laser - ${t('modules.SOLO_PLAY')}`)

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue)
    }

    const tabSx = {
        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
        '&.Mui-selected': {
            color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
        },
        minHeight: '48px',
        textTransform: 'uppercase',
        fontWeight: 600,
        letterSpacing: '0.05em',
        fontSize: '0.75rem',
    }

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <Box
                sx={{
                    position: 'relative',
                    mb: 1,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-10px',
                        left: 0,
                        width: '100%',
                        height: '1px',
                    },
                }}
            >
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('soloPlay.title')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    }}
                >
                    {t('soloPlay.title')}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                        textShadow: `0 0 8px ${colors.neons.green.default}`,
                    }}
                >
                    {t('modules.SOLO_PLAY_DESCRIPTION')}
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        },
                    }}
                >
                    <Tab icon={<FlashOn />} iconPosition="start" label={t('soloPlay.tabs.combat')} sx={tabSx} />
                    <Tab icon={<Router />} iconPosition="start" label={t('soloPlay.tabs.netrun')} sx={tabSx} />
                </Tabs>
            </Box>

            <Grid container spacing={2}>
                <Grid size={12}>
                    <TabPanel value={activeTab} index={0}>
                        <QDCombatPanel />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <QDNetrunPanel />
                    </TabPanel>
                </Grid>
            </Grid>
        </Container>
    )
}

export default SoloPlayView
