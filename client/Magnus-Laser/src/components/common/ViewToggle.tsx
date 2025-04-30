import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors'
import CyberpunkFormControlLabel from '../CyberpunkFormControlLabel'
import { pulseGlowBlue, pulseGlowCyan } from './Animations'

type ViewToggleProps = {
    compactView: boolean
    onViewChange: (event: React.MouseEvent<HTMLElement>, value: string) => void
}

const ViewToggle = (props: ViewToggleProps) => {
    const { compactView, onViewChange } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    return (
        <CyberpunkFormControlLabel
            readerMode={readerMode}
            control={
                <ToggleButtonGroup
                    value={compactView ? 'table' : 'grid'}
                    exclusive
                    onChange={onViewChange}
                    sx={{
                        gap: '0px',
                        background: readerMode ? '#f5f5f5' : 'rgba(0, 20, 40, 0.7)',
                        p: '2px',
                        border: readerMode
                            ? `1px solid ${compactView ? 'rgb(0, 100, 255 )' : 'rgb(0, 200, 255)'}`
                            : `1px solid ${compactView ? 'rgba(0, 100, 255, 0.3)' : 'rgba(0, 200, 255, 0.3)'}`,
                        borderRadius: '3px',
                        boxShadow: readerMode
                            ? 'none'
                            : compactView
                            ? '0 0 10px rgba(0, 100, 255, 0.2), inset 0 0 5px rgba(0, 100, 255, 0.2)'
                            : '0 0 10px rgba(0, 200, 255, 0.2), inset 0 0 5px rgba(0, 150, 255, 0.2)',
                        position: 'relative',
                        animation: readerMode
                            ? 'none'
                            : compactView
                            ? `${pulseGlowBlue} 4s infinite`
                            : `${pulseGlowCyan} 4s infinite`,
                        '&::before': !readerMode
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '1px',
                                  background: compactView
                                      ? 'linear-gradient(90deg, transparent, rgba(0, 100, 255, 0.5), transparent)'
                                      : 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), transparent)',
                                  zIndex: 2,
                              }
                            : {},
                        '&::after': !readerMode
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: '1px',
                                  background: compactView
                                      ? 'linear-gradient(90deg, transparent, rgba(0, 100, 255, 0.3), transparent)'
                                      : 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent)',
                                  zIndex: 2,
                              }
                            : {},
                        '& .MuiToggleButtonGroup-grouped': {
                            border: 'none',
                            borderRadius: '2px',
                            position: 'relative',
                            overflow: 'hidden',
                            margin: '0',
                            '&:not(:first-of-type)': {
                                borderLeft: 'none',
                                marginLeft: '2px',
                            },
                            '&:not(:last-of-type)': {
                                borderRight: 'none',
                                borderTopRightRadius: '2px',
                                borderBottomRightRadius: '2px',
                            },
                            '&:first-of-type': {
                                borderTopLeftRadius: '2px',
                                borderBottomLeftRadius: '2px',
                            },
                        },
                    }}
                >
                    <ToggleButton
                        value="table"
                        sx={{
                            color: colors.neons.blue.dark,
                            bgcolor: 'transparent',
                            border: 'none',
                            borderColor: 'transparent',
                            px: 2,
                            py: 1,
                            letterSpacing: '1px',
                            fontSize: '0.8rem',
                            textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.blue.dark}`,
                            position: 'relative',
                            transition: 'all 0.3s',
                            '&::after': !readerMode
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '0%',
                                      height: '1px',
                                      background: colors.neons.blue.default,
                                      transition: 'width 0.3s ease',
                                      opacity: 0,
                                  }
                                : {},
                            '&:hover': readerMode
                                ? {
                                      bgcolor: colors.neons.blue.light,
                                      color: colors.neons.blue.dark,
                                  }
                                : {
                                      bgcolor: 'rgba(0, 20, 40, 0.7)',
                                      color: '#FFFFFF',
                                      textShadow: `0 0 8px ${colors.neons.blue.default}, 0 0 12px ${colors.neons.blue.default}`,
                                      '&::after': {
                                          width: '80%',
                                          opacity: 1,
                                          boxShadow: `0 0 8px ${colors.neons.blue.default}`,
                                      },
                                  },
                            '&.Mui-selected': readerMode
                                ? {
                                      bgcolor: colors.neons.blue.light,
                                      color: colors.neons.blue.dark,
                                  }
                                : {
                                      bgcolor: 'rgba(0, 30, 50, 0.9)',
                                      color: '#FFFFFF',
                                      boxShadow: `inset 0 0 10px ${colors.neons.blue.default}40, 0 0 8px ${colors.neons.blue.default}80`,
                                      textShadow: `0 0 8px ${colors.neons.blue.default}, 0 0 15px ${colors.neons.blue.default}`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 40, 60, 0.95)',
                                      },
                                      '&::before': {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '2px',
                                          background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                          boxShadow: `0 0 10px ${colors.neons.blue.default}`,
                                          zIndex: 2,
                                          animation: `${pulseGlowBlue} 2s infinite`,
                                      },
                                      '&::after': {
                                          content: '""',
                                          position: 'absolute',
                                          bottom: 0,
                                          left: '5%',
                                          width: '90%',
                                          height: '1px',
                                          background: colors.neons.blue.default,
                                          opacity: 1,
                                          boxShadow: `0 0 8px ${colors.neons.blue.default}`,
                                      },
                                  },
                            height: 32,
                        }}
                    >
                        {t('common.viewToggle.tableView')}
                    </ToggleButton>
                    <ToggleButton
                        value="grid"
                        sx={{
                            color: colors.neons.cyan.dark,
                            bgcolor: 'transparent',
                            border: 'none',
                            borderColor: 'transparent',
                            px: 2,
                            py: 1,
                            letterSpacing: '1px',
                            fontSize: '0.8rem',
                            textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                            position: 'relative',
                            transition: 'all 0.3s',
                            '&::after': !readerMode
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '10%',
                                      width: '0%',
                                      height: '1px',
                                      background: colors.neons.cyan.default,
                                      transition: 'width 0.3s ease',
                                      opacity: 0,
                                  }
                                : {},
                            '&:hover': readerMode
                                ? {
                                      bgcolor: colors.neons.cyan.light,
                                      color: colors.neons.cyan.dark,
                                  }
                                : {
                                      bgcolor: 'rgba(0, 30, 40, 0.7)',
                                      color: '#FFFFFF',
                                      textShadow: `0 0 8px ${colors.neons.cyan.default}, 0 0 12px ${colors.neons.cyan.default}`,
                                      '&::after': {
                                          width: '80%',
                                          opacity: 1,
                                          boxShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                      },
                                  },
                            '&.Mui-selected': readerMode
                                ? {
                                      bgcolor: colors.neons.cyan.light,
                                      color: colors.neons.cyan.dark,
                                  }
                                : {
                                      bgcolor: 'rgba(0, 40, 50, 0.9)',
                                      color: '#FFFFFF',
                                      boxShadow: `inset 0 0 10px ${colors.neons.cyan.default}40, 0 0 8px ${colors.neons.cyan.default}80`,
                                      textShadow: `0 0 8px ${colors.neons.cyan.default}, 0 0 15px ${colors.neons.cyan.default}`,
                                      '&:hover': {
                                          bgcolor: 'rgba(0, 50, 60, 0.95)',
                                      },
                                      '&::before': {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '2px',
                                          background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                          zIndex: 2,
                                          animation: `${pulseGlowCyan} 2s infinite`,
                                      },
                                      '&::after': {
                                          content: '""',
                                          position: 'absolute',
                                          bottom: 0,
                                          left: '5%',
                                          width: '90%',
                                          height: '1px',
                                          background: colors.neons.cyan.default,
                                          opacity: 1,
                                          boxShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                      },
                                  },
                            height: 32,
                        }}
                    >
                        {t('common.viewToggle.detailedView')}
                    </ToggleButton>
                </ToggleButtonGroup>
            }
            label={t('common.viewToggle.title')}
            labelPlacement="start"
        />
    )
}

export default ViewToggle
