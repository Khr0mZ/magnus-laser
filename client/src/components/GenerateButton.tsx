import { Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../contexts/userPreferencesHooks.ts'
import colors from '../utils/colors'
import { buttonGlitch, pulseGlowGreen, scanlineFlow } from './common/Animations'

type GenerateButtonProps = {
    isGenerating: boolean
    handleGenerate: () => void
}

const GenerateButton = (props: GenerateButtonProps) => {
    const { isGenerating, handleGenerate } = props
    const { readerMode } = useUserPreferences()
    const { t } = useTranslation()

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            sx={{
                position: 'relative',
                bgcolor: readerMode ? '#e8f5e8' : 'rgba(20, 40, 30, 0.8)',
                borderColor: readerMode ? '#2e7d32' : colors.neons.green.default,
                color: readerMode ? '#1b7d2e' : colors.neons.green.default,
                textShadow: readerMode ? 'none' : `0 0 8px ${colors.neons.green.light}`,
                fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                letterSpacing: readerMode ? 'normal' : '0.05em',
                overflow: 'hidden',
                padding: '6px 16px',
                border: readerMode ? '1px solid #2e7d32' : `1px solid ${colors.neons.green.default}80`,
                transition: 'all 0.3s',
                animation: readerMode ? 'none' : `${pulseGlowGreen} 3s infinite`,
                boxShadow: readerMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                ...(readerMode
                    ? {
                          '&:hover': {
                              bgcolor: '#d7edd7',
                              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                          },
                          '&.Mui-disabled': {
                              bgcolor: '#f5f5f5',
                              color: 'rgba(0, 0, 0, 0.38)',
                              border: '1px solid rgba(0, 0, 0, 0.12)',
                          },
                      }
                    : {
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0.2,
                              zIndex: -1,
                              background: `linear-gradient(135deg, transparent 0%, ${colors.neons.green.default}50 50%, transparent 100%)`,
                              backgroundSize: '200% 200%',
                              animation: `${scanlineFlow} 3s ease infinite`,
                          },
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              background: 'rgba(0, 255, 0, 0.1)',
                              opacity: 0,
                              transition: 'all 0.3s',
                          },
                          '&:hover': {
                              backgroundColor: 'rgba(0, 60, 0, 0.6)',
                              transform: 'translateY(-2px) scale(1.05)',
                              boxShadow: `0 0 15px ${colors.neons.green.default}, inset 0 0 15px ${colors.neons.green.default}30`,
                              color: colors.neons.green.light,
                              textShadow: `0 0 8px ${colors.neons.green.light}`,
                              '&::after': {
                                  opacity: 0.2,
                              },
                              '.generate-text': {
                                  animation: `${buttonGlitch} 0.3s ease both`,
                              },
                          },
                      }),
            }}
        >
            {isGenerating ? t('common.generating') : t('common.generate')}
        </Button>
    )
}

export default GenerateButton
