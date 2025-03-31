import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { JobType } from '../../types/jobType'
import colors from '../../utils/colors'
import { pulseGlow, pulseGlowRed, pulseGlowYellow } from './BuildingAnimations'

type JobTypeSelectorProps = {
    jobType: JobType
    onJobTypeChange: (event: React.MouseEvent<HTMLElement>, value: JobType | null) => void
}

const JobTypeSelector = ({ jobType, onJobTypeChange }: JobTypeSelectorProps) => {
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    return (
        <ToggleButtonGroup
            value={jobType}
            exclusive
            onChange={onJobTypeChange}
            aria-label="job difficulty"
            sx={{
                gap: '0px',
                background: readerMode ? '#f5f5f5' : 'rgba(0, 20, 40, 0.7)',
                p: '2px',
                border: readerMode
                    ? '1px solid #cccccc'
                    : `1px solid ${
                          jobType === JobType.EASY
                              ? 'rgba(0, 255, 0, 0.3)'
                              : jobType === JobType.DANGEROUS
                              ? 'rgba(255, 0, 0, 0.3)'
                              : 'rgba(255, 255, 0, 0.3)'
                      }`,
                borderRadius: '3px',
                boxShadow: readerMode
                    ? 'none'
                    : `0 0 10px ${
                          jobType === JobType.EASY
                              ? 'rgba(0, 255, 0, 0.2)'
                              : jobType === JobType.DANGEROUS
                              ? 'rgba(255, 0, 0, 0.2)'
                              : 'rgba(255, 255, 0, 0.2)'
                      }, inset 0 0 5px ${
                          jobType === JobType.EASY
                              ? 'rgba(0, 255, 0, 0.1)'
                              : jobType === JobType.DANGEROUS
                              ? 'rgba(255, 0, 0, 0.1)'
                              : 'rgba(255, 255, 0, 0.1)'
                      }`,
                position: 'relative',
                animation: readerMode
                    ? 'none'
                    : `${
                          jobType === JobType.EASY
                              ? pulseGlow
                              : jobType === JobType.DANGEROUS
                              ? pulseGlowRed
                              : pulseGlowYellow
                      } 4s infinite`,
                '&::before': !readerMode
                    ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background:
                              jobType === JobType.EASY
                                  ? 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.5), transparent)'
                                  : jobType === JobType.DANGEROUS
                                  ? 'linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.5), transparent)'
                                  : 'linear-gradient(90deg, transparent, rgba(255, 255, 0, 0.5), transparent)',
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
                          background:
                              jobType === JobType.EASY
                                  ? 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.3), transparent)'
                                  : jobType === JobType.DANGEROUS
                                  ? 'linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.3), transparent)'
                                  : 'linear-gradient(90deg, transparent, rgba(255, 255, 0, 0.3), transparent)',
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
                value={JobType.EASY}
                aria-label="easy job"
                sx={{
                    color: readerMode ? '#2e7d32' : colors.neons.green.default,
                    bgcolor: 'transparent',
                    border: 'none',
                    borderColor: 'transparent',
                    px: 2,
                    py: 1,
                    fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                    letterSpacing: readerMode ? 'normal' : '1px',
                    fontSize: '0.8rem',
                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}`,
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
                              background: colors.neons.green.default,
                              transition: 'width 0.3s ease',
                              opacity: 0,
                          }
                        : {},
                    '&:hover': readerMode
                        ? {
                              bgcolor: '#f0f0f0',
                              color: '#1b5e20',
                          }
                        : {
                              bgcolor: 'rgba(0, 20, 0, 0.7)',
                              color: '#FFFFFF',
                              textShadow: `0 0 8px ${colors.neons.green.default}, 0 0 12px ${colors.neons.green.default}`,
                              '&::after': {
                                  width: '80%',
                                  opacity: 1,
                                  boxShadow: `0 0 8px ${colors.neons.green.default}`,
                              },
                          },
                    '&.Mui-selected': readerMode
                        ? {
                              bgcolor: '#e8f5e9',
                              color: '#1b5e20',
                          }
                        : {
                              bgcolor: 'rgba(0, 30, 0, 0.9)',
                              color: '#FFFFFF',
                              boxShadow: `inset 0 0 10px ${colors.neons.green.default}40, 0 0 8px ${colors.neons.green.default}80`,
                              textShadow: `0 0 8px ${colors.neons.green.default}, 0 0 15px ${colors.neons.green.default}`,
                              '&:hover': {
                                  bgcolor: 'rgba(0, 40, 0, 0.95)',
                              },
                              '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '2px',
                                  background: `linear-gradient(90deg, transparent, ${colors.neons.green.default}, transparent)`,
                                  boxShadow: `0 0 10px ${colors.neons.green.default}`,
                                  zIndex: 2,
                                  animation: `${pulseGlow} 2s infinite`,
                              },
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '5%',
                                  width: '90%',
                                  height: '1px',
                                  background: colors.neons.green.default,
                                  opacity: 1,
                                  boxShadow: `0 0 8px ${colors.neons.green.default}`,
                              },
                          },
                    height: 32,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        fontSize: '0.7rem',
                    }}
                >
                    {t('jobTypes.EASY')}
                </Typography>
            </ToggleButton>
            <ToggleButton
                value={JobType.TYPICAL}
                aria-label="typical job"
                sx={{
                    color: readerMode ? '#f57c00' : colors.neons.yellow.default,
                    bgcolor: 'transparent',
                    border: 'none',
                    borderColor: 'transparent',
                    px: 2,
                    py: 1,
                    fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                    letterSpacing: readerMode ? 'normal' : '1px',
                    fontSize: '0.8rem',
                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.yellow.default}`,
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
                              background: colors.neons.yellow.default,
                              transition: 'width 0.3s ease',
                              opacity: 0,
                          }
                        : {},
                    '&:hover': readerMode
                        ? {
                              bgcolor: '#f0f0f0',
                              color: '#e65100',
                          }
                        : {
                              bgcolor: 'rgba(40, 40, 0, 0.7)',
                              color: '#FFFFFF',
                              textShadow: `0 0 8px ${colors.neons.yellow.default}, 0 0 12px ${colors.neons.yellow.default}`,
                              '&::after': {
                                  width: '80%',
                                  opacity: 1,
                                  boxShadow: `0 0 8px ${colors.neons.yellow.default}`,
                              },
                          },
                    '&.Mui-selected': readerMode
                        ? {
                              bgcolor: '#fff8e1',
                              color: '#e65100',
                          }
                        : {
                              bgcolor: 'rgba(50, 40, 0, 0.9)',
                              color: '#FFFFFF',
                              boxShadow: `inset 0 0 10px ${colors.neons.yellow.default}40, 0 0 8px ${colors.neons.yellow.default}80`,
                              textShadow: `0 0 8px ${colors.neons.yellow.default}, 0 0 15px ${colors.neons.yellow.default}`,
                              '&:hover': {
                                  bgcolor: 'rgba(60, 50, 0, 0.95)',
                              },
                              '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '2px',
                                  background: `linear-gradient(90deg, transparent, ${colors.neons.yellow.default}, transparent)`,
                                  boxShadow: `0 0 10px ${colors.neons.yellow.default}`,
                                  zIndex: 2,
                                  animation: `${pulseGlowYellow} 2s infinite`,
                              },
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '5%',
                                  width: '90%',
                                  height: '1px',
                                  background: colors.neons.yellow.default,
                                  opacity: 1,
                                  boxShadow: `0 0 8px ${colors.neons.yellow.default}`,
                              },
                          },
                    height: 32,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        fontSize: '0.7rem',
                    }}
                >
                    {t('jobTypes.TYPICAL')}
                </Typography>
            </ToggleButton>
            <ToggleButton
                value={JobType.DANGEROUS}
                aria-label="dangerous job"
                sx={{
                    color: readerMode ? '#d32f2f' : colors.neons.red.default,
                    bgcolor: 'transparent',
                    border: 'none',
                    borderColor: 'transparent',
                    px: 2,
                    py: 1,
                    fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                    letterSpacing: readerMode ? 'normal' : '1px',
                    fontSize: '0.8rem',
                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.red.default}`,
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
                              background: colors.neons.red.default,
                              transition: 'width 0.3s ease',
                              opacity: 0,
                          }
                        : {},
                    '&:hover': readerMode
                        ? {
                              bgcolor: '#f0f0f0',
                              color: '#b71c1c',
                          }
                        : {
                              bgcolor: 'rgba(40, 0, 0, 0.7)',
                              color: '#FFFFFF',
                              textShadow: `0 0 8px ${colors.neons.red.default}, 0 0 12px ${colors.neons.red.default}`,
                              '&::after': {
                                  width: '80%',
                                  opacity: 1,
                                  boxShadow: `0 0 8px ${colors.neons.red.default}`,
                              },
                          },
                    '&.Mui-selected': readerMode
                        ? {
                              bgcolor: '#ffebee',
                              color: '#b71c1c',
                          }
                        : {
                              bgcolor: 'rgba(50, 0, 0, 0.9)',
                              color: '#FFFFFF',
                              boxShadow: `inset 0 0 10px ${colors.neons.red.default}40, 0 0 8px ${colors.neons.red.default}80`,
                              textShadow: `0 0 8px ${colors.neons.red.default}, 0 0 15px ${colors.neons.red.default}`,
                              '&:hover': {
                                  bgcolor: 'rgba(60, 0, 0, 0.95)',
                              },
                              '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '2px',
                                  background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                  boxShadow: `0 0 10px ${colors.neons.red.default}`,
                                  zIndex: 2,
                                  animation: `${pulseGlowRed} 2s infinite`,
                              },
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '5%',
                                  width: '90%',
                                  height: '1px',
                                  background: colors.neons.red.default,
                                  opacity: 1,
                                  boxShadow: `0 0 8px ${colors.neons.red.default}`,
                              },
                          },
                    height: 32,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        fontSize: '0.7rem',
                    }}
                >
                    {t('jobTypes.DANGEROUS')}
                </Typography>
            </ToggleButton>
        </ToggleButtonGroup>
    )
}

export default JobTypeSelector
