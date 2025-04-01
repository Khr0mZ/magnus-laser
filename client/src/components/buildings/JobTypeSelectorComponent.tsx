import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { JobType, getJobTypeModifier } from '../../types/jobType'
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
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
                sx={{
                    fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                    color: readerMode ? '#333333' : colors.neons.cyan.default,
                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.default}`,
                    fontSize: '0.85rem',
                }}
            >
                {t('buildings.jobType')}
            </Typography>
            <ToggleButtonGroup
                value={jobType}
                exclusive
                onChange={onJobTypeChange}
                aria-label="job difficulty"
                sx={{
                    gap: '0px',
                    background: readerMode ? 'transparent' : 'rgba(0, 20, 40, 0.7)',
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
                                  ? 'rgba(0, 255, 0, 0.2)'
                                  : jobType === JobType.DANGEROUS
                                  ? 'rgba(255, 0, 0, 0.2)'
                                  : 'rgba(255, 255, 0, 0.2)'
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
                        color: colors.difficulty.easy.dark,
                        bgcolor: 'transparent',
                        border: 'none',
                        borderColor: 'transparent',
                        px: 2,
                        py: 1,
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        letterSpacing: readerMode ? 'normal' : '1px',
                        fontSize: '0.8rem',
                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.difficulty.easy.dark}`,
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
                                  background: colors.difficulty.easy.default,
                                  transition: 'width 0.3s ease',
                                  opacity: 0,
                              }
                            : {},
                        '&:hover': readerMode
                            ? {
                                  bgcolor: '#f0f0f0',
                                  color: colors.difficulty.easy.dark,
                              }
                            : {
                                  bgcolor: 'rgba(0, 20, 0, 0.7)',
                                  color: '#FFFFFF',
                                  textShadow: `0 0 8px ${colors.difficulty.easy.default}, 0 0 12px ${colors.difficulty.easy.default}`,
                                  '&::after': {
                                      width: '80%',
                                      opacity: 1,
                                      boxShadow: `0 0 8px ${colors.difficulty.easy.default}`,
                                  },
                              },
                        '&.Mui-selected': readerMode
                            ? {
                                  bgcolor: colors.neons.green.light,
                                  color: colors.difficulty.easy.dark,
                              }
                            : {
                                  bgcolor: 'rgba(0, 30, 0, 0.9)',
                                  color: '#FFFFFF',
                                  boxShadow: `inset 0 0 10px ${colors.difficulty.easy.default}40, 0 0 8px ${colors.difficulty.easy.default}80`,
                                  textShadow: `0 0 8px ${colors.difficulty.easy.default}, 0 0 15px ${colors.difficulty.easy.default}`,
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
                                      background: `linear-gradient(90deg, transparent, ${colors.difficulty.easy.default}, transparent)`,
                                      boxShadow: `0 0 10px ${colors.difficulty.easy.default}`,
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
                                      background: colors.difficulty.easy.default,
                                      opacity: 1,
                                      boxShadow: `0 0 8px ${colors.difficulty.easy.default}`,
                                  },
                              },
                        '&.Mui-disabled': {
                            color: readerMode ? 'rgba(0, 255, 0, 0.5)' : 'rgba(0, 255, 0, 0.3)',
                        },
                        height: 32,
                    }}
                >
                    {t('buildings.jobTypes.easy')} +{getJobTypeModifier(JobType.EASY)}
                </ToggleButton>
                <ToggleButton
                    value={JobType.TYPICAL}
                    aria-label="typical job"
                    sx={{
                        color: colors.difficulty.typical.dark,
                        bgcolor: 'transparent',
                        border: 'none',
                        borderColor: 'transparent',
                        px: 2,
                        py: 1,
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        letterSpacing: readerMode ? 'normal' : '1px',
                        fontSize: '0.8rem',
                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.difficulty.typical.dark}`,
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
                                  background: colors.difficulty.typical.default,
                                  transition: 'width 0.3s ease',
                                  opacity: 0,
                              }
                            : {},
                        '&:hover': readerMode
                            ? {
                                  bgcolor: colors.neons.yellow.light,
                                  color: colors.difficulty.typical.dark,
                              }
                            : {
                                  bgcolor: 'rgba(40, 40, 0, 0.7)',
                                  color: '#FFFFFF',
                                  textShadow: `0 0 8px ${colors.difficulty.typical.default}, 0 0 12px ${colors.difficulty.typical.default}`,
                                  '&::after': {
                                      width: '80%',
                                      opacity: 1,
                                      boxShadow: `0 0 8px ${colors.difficulty.typical.default}`,
                                  },
                              },
                        '&.Mui-selected': readerMode
                            ? {
                                  bgcolor: colors.neons.yellow.light,
                                  color: colors.difficulty.typical.dark,
                              }
                            : {
                                  bgcolor: 'rgba(50, 40, 0, 0.9)',
                                  color: '#FFFFFF',
                                  boxShadow: `inset 0 0 10px ${colors.difficulty.typical.default}40, 0 0 8px ${colors.difficulty.typical.default}80`,
                                  textShadow: `0 0 8px ${colors.difficulty.typical.default}, 0 0 15px ${colors.difficulty.typical.default}`,
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
                                      background: `linear-gradient(90deg, transparent, ${colors.difficulty.typical.default}, transparent)`,
                                      boxShadow: `0 0 10px ${colors.difficulty.typical.default}`,
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
                                      background: colors.difficulty.typical.default,
                                      opacity: 1,
                                      boxShadow: `0 0 8px ${colors.difficulty.typical.default}`,
                                  },
                              },
                        '&.Mui-disabled': {
                            color: readerMode ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 0, 0.3)',
                        },
                        height: 32,
                    }}
                >
                    {t('buildings.jobTypes.typical')} +{getJobTypeModifier(JobType.TYPICAL)}
                </ToggleButton>
                <ToggleButton
                    value={JobType.DANGEROUS}
                    aria-label="dangerous job"
                    sx={{
                        color: colors.difficulty.dangerous.default,
                        bgcolor: 'transparent',
                        border: 'none',
                        borderColor: 'transparent',
                        px: 2,
                        py: 1,
                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                        letterSpacing: readerMode ? 'normal' : '1px',
                        fontSize: '0.8rem',
                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.difficulty.dangerous.dark}`,
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
                                  background: colors.difficulty.dangerous.default,
                                  transition: 'width 0.3s ease',
                                  opacity: 0,
                              }
                            : {},
                        '&:hover': readerMode
                            ? {
                                  bgcolor: colors.neons.red.light,
                                  color: colors.difficulty.dangerous.dark,
                              }
                            : {
                                  bgcolor: 'rgba(40, 0, 0, 0.7)',
                                  color: '#FFFFFF',
                                  textShadow: `0 0 8px ${colors.difficulty.dangerous.default}, 0 0 12px ${colors.difficulty.dangerous.default}`,
                                  '&::after': {
                                      width: '80%',
                                      opacity: 1,
                                      boxShadow: `0 0 8px ${colors.difficulty.dangerous.default}`,
                                  },
                              },
                        '&.Mui-selected': readerMode
                            ? {
                                  bgcolor: colors.neons.red.light,
                                  color: colors.difficulty.dangerous.dark,
                              }
                            : {
                                  bgcolor: 'rgba(50, 0, 0, 0.9)',
                                  color: '#FFFFFF',
                                  boxShadow: `inset 0 0 10px ${colors.difficulty.dangerous.default}40, 0 0 8px ${colors.difficulty.dangerous.default}80`,
                                  textShadow: `0 0 8px ${colors.difficulty.dangerous.default}, 0 0 15px ${colors.difficulty.dangerous.default}`,
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
                                      background: `linear-gradient(90deg, transparent, ${colors.difficulty.dangerous.default}, transparent)`,
                                      boxShadow: `0 0 10px ${colors.difficulty.dangerous.default}`,
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
                                      background: colors.difficulty.dangerous.default,
                                      opacity: 1,
                                      boxShadow: `0 0 8px ${colors.difficulty.dangerous.default}`,
                                  },
                              },
                        '&.Mui-disabled': {
                            color: readerMode ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.3)',
                        },
                        height: 32,
                    }}
                >
                    {t('buildings.jobTypes.dangerous')} +{getJobTypeModifier(JobType.DANGEROUS)}
                </ToggleButton>
            </ToggleButtonGroup>
        </Stack>
    )
}

export default JobTypeSelector
