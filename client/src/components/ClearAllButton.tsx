import { Button } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../contexts/ReaderModeContext'
import colors from '../utils/colors'
import { buttonGlitch, pulseGlowRed, scanlineFlow } from './common/Animations'

type ClearAllButtonProps = {
    handleClearAllClick: () => void
    disabled: boolean
}

const ClearAllButton = (props: ClearAllButtonProps) => {
    const { handleClearAllClick, disabled } = props
    const { readerMode } = useContext(ReaderModeContext)
    const { t } = useTranslation()

    return (
        <Button
            variant="outlined"
            color="error"
            onClick={handleClearAllClick}
            disabled={disabled}
            className="button"
            sx={{
                position: 'relative',
                bgcolor: readerMode ? '#ffebee' : 'rgba(40, 0, 0, 0.8)',
                borderColor: readerMode ? '#c2161a' : colors.neons.red.default,
                color: readerMode ? '#a01017' : colors.neons.red.default,
                textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.red.default}`,
                fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                letterSpacing: readerMode ? 'normal' : '0.05em',
                overflow: 'hidden',
                padding: '6px 16px',
                border: readerMode ? '1px solid #c2161a' : `1px solid ${colors.neons.red.default}80`,
                transition: 'all 0.3s',
                animation: readerMode ? 'none' : `${pulseGlowRed} 3s infinite`,
                boxShadow: readerMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                ...(readerMode
                    ? {
                          '&:hover': {
                              bgcolor: '#fde2e4',
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
                              background: `linear-gradient(135deg, transparent 0%, ${colors.neons.red.default}50 50%, transparent 100%)`,
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
                              background: 'rgba(255, 0, 0, 0.1)',
                              opacity: 0,
                              transition: 'all 0.3s',
                          },
                          '&.Mui-disabled': {
                              borderColor: 'rgba(255, 0, 0, 0.3)',
                              color: 'rgba(255, 0, 0, 0.5)',
                              bgcolor: 'rgba(40, 10, 10, 0.4)',
                              animation: `${pulseGlowRed} 4s infinite`,
                              boxShadow: '0 0 8px rgba(255, 0, 0, 0.2)',
                              textShadow: `0 0 3px rgba(255, 0, 0, 0.3)`,
                              opacity: 0.8,
                              '&::before': {
                                  opacity: 0.1,
                                  animation: `${scanlineFlow} 6s ease infinite`,
                              },
                              '&::after': {
                                  opacity: 0.05,
                              },
                              '.button-text': {
                                  opacity: 0.8,
                                  textShadow: `0 0 5px rgba(255, 0, 0, 0.4)`,
                              },
                          },
                          '&:hover': {
                              borderColor: colors.neons.red.light,
                              color: colors.neons.red.light,
                              backgroundColor: 'rgba(60, 0, 0, 0.6)',
                              animation: `${buttonGlitch} 0.3s cubic-bezier(.25,.46,.45,.94) both infinite`,
                              boxShadow: `0 0 15px ${colors.neons.red.default}, inset 0 0 15px ${colors.neons.red.default}30`,
                              transform: 'translateY(-2px) scale(1.05)',
                              '&::after': {
                                  opacity: 0.2,
                              },
                              '.button-text': {
                                  animation: `${buttonGlitch} 0.3s ease infinite`,
                              },
                          },
                      }),
            }}
        >
            {t('common.clear')}
        </Button>
    )
}

export default ClearAllButton
