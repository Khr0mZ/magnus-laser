import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import StorageBanner from '../../components/StorageBanner'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { loadHuggingFaceApiKey, saveHuggingFaceApiKey } from '../../utils/storage'

const SettingsView = () => {
    const { t } = useTranslation()
    useDocumentTitle(`Magnus Laser - ${t('common.settings')}`)
    const { readerMode } = useContext(ReaderModeContext)

    const [apiKey, setApiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Load API key on component mount
    useEffect(() => {
        const loadApiKey = async () => {
            try {
                const savedApiKey = await loadHuggingFaceApiKey()
                setApiKey(savedApiKey)
            } catch (error) {
                console.error('Error loading API key:', error)
            }
        }

        loadApiKey()
    }, [])

    const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(event.target.value)
    }

    const handleSaveApiKey = async () => {
        await saveHuggingFaceApiKey(apiKey)
        setIsSaving(true)
    }

    return (
        <Container maxWidth={false}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />

            <Typography
                variant="h1"
                className="glitch-text"
                data-text={t('common.settings')}
                sx={{
                    color: colors.neons.cyan.default,
                    textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    mb: 3,
                }}
            >
                {t('common.settings')}
            </Typography>

            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 15, 30, 0.7)',
                    borderLeft: `4px solid ${colors.neons.cyan.default}`,
                    boxShadow: `0 0 10px ${readerMode ? 'rgba(0,0,0,0.1)' : colors.neons.cyan.dark}`,
                }}
            >
                <Typography variant="h2" sx={{ mb: 2 }}>
                    {t('settings.apiKeys')}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ mb: 1 }}>
                        {t('settings.huggingFaceApiKey')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('settings.huggingFaceApiKeyDescription')}
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                        <TextField
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            label={t('settings.apiKeyLabel')}
                            placeholder={t('settings.apiKeyPlaceholder')}
                            type="password"
                            variant="outlined"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderColor: readerMode ? undefined : colors.neons.cyan.default,
                                    '&:hover fieldset': {
                                        borderColor: readerMode ? undefined : colors.neons.cyan.light,
                                    },
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveApiKey}
                            sx={{
                                bgcolor: readerMode ? '#e8f5e8' : 'rgba(20, 40, 30, 0.8)',
                                borderColor: readerMode ? '#2e7d32' : colors.neons.green.default,
                                color: readerMode ? '#1b7d2e' : colors.neons.green.default,
                                textShadow: readerMode ? 'none' : `0 0 8px ${colors.neons.green.light}`,
                                fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                border: readerMode ? '1px solid #2e7d32' : `1px solid ${colors.neons.green.default}80`,
                                letterSpacing: readerMode ? 'normal' : '0.05em',
                                padding: '6px 16px',
                                whiteSpace: 'nowrap',
                                minWidth: 120,
                            }}
                        >
                            {t('common.save')}
                        </Button>
                    </Stack>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
                    {t('settings.apiKeySecurityNote')}
                </Typography>
            </Paper>
        </Container>
    )
}

export default SettingsView
