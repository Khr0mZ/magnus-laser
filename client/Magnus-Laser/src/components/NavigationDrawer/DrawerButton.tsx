import { Box, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import NavigationPaths from '../../navigation'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { getModuleIcon } from '../../utils/functions.tsx'
import { flicker, glitch, neonColorCycle, severeGlitch } from '../common/Animations.tsx'
import CyberpunkFormControlLabel from '../CyberpunkFormControlLabel.tsx'

interface DrawerButtonProps {
    module: ModuleTypes
}

const DrawerButton = ({ module }: DrawerButtonProps) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { t } = useTranslation()
    const { readerMode, animationsEnabled } = useUserPreferences()

    const pickColor = (navigationPath: NavigationPaths) => {
        return pathname.startsWith(navigationPath)
            ? readerMode
                ? colors.neons.blue.default
                : colors.neons.pink.default
            : colors.grays.gray700
    }

    const isActive = (navigationPath: NavigationPaths) => {
        return pathname.startsWith(navigationPath)
    }

    const navigationPath = NavigationPaths[module]
    const active = isActive(navigationPath)

    return (
        <Button
            disableRipple
            disableFocusRipple
            size={'large'}
            onClick={active ? undefined : () => navigate(navigationPath)}
            sx={{
                width: '60px',
                height: { xs: '23px', xl: '62px' },
                boxSizing: 'content-box',
                color: pickColor(navigationPath),
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
                ...(readerMode
                    ? {
                          // Reader mode button styles
                          '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                          transition: 'all 0.2s',
                          // Apply active indicator in reader mode too
                          ...(active && {
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '10%',
                                  width: '80%',
                                  height: '2px',
                                  backgroundColor: colors.neons.pink.default,
                              },
                          }),
                      }
                    : {
                          // Cyberpunk button styles
                          '&:hover': {
                              animation: `${neonColorCycle} 3s linear infinite`,
                              ...(animationsEnabled && {
                                  '& .MuiTypography-root': {
                                      position: 'relative',
                                      animation: `${neonColorCycle} 3s linear infinite`,
                                      '&::before': {
                                          content: 'attr(data-text)',
                                          position: 'absolute',
                                          left: -2,
                                          top: 0,
                                          opacity: 0.8,
                                          animation: `${glitch} 2s ease-out infinite alternate-reverse, ${neonColorCycle} 3s linear infinite`,
                                      },
                                      '&::after': {
                                          content: 'attr(data-text)',
                                          position: 'absolute',
                                          left: 2,
                                          top: 0,
                                          opacity: 0.8,
                                          animation: `${glitch} 3s ease-in infinite alternate, ${neonColorCycle} 3s linear infinite`,
                                      },
                                  },
                              }),
                              '& .icon-glitch': {
                                  animation: `${severeGlitch} 0.5s cubic-bezier(.25,.46,.45,.94) both infinite`,
                                  '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      top: -2,
                                      left: -2,
                                      right: -2,
                                      bottom: -2,
                                      background: animationsEnabled
                                          ? `linear-gradient(45deg, ${colors.neons.pink.default}50 25%, transparent 25%, transparent 50%, ${colors.neons.cyan.default}50 50%, ${colors.neons.cyan.default}50 75%, transparent 75%, transparent)`
                                          : 'none',
                                      backgroundSize: '6px 6px',
                                      zIndex: -1,
                                      opacity: 0.5,
                                  },
                              },
                              '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '100%',
                                  left: '0',
                                  width: '100%',
                                  height: '100%',
                                  background: `linear-gradient(to top, ${colors.neons.cyan.default}20, transparent)`,
                                  transform: 'perspective(20px) rotateX(40deg)',
                                  transformOrigin: 'top',
                                  opacity: 0.4,
                                  zIndex: -1,
                                  animation: `${neonColorCycle} 3s linear infinite`,
                              },
                          },
                          transition: 'all 0.3s',
                          ...(active && {
                              textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                              animation: `${flicker} 4s infinite`,
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '10%',
                                  width: '80%',
                                  height: '2px',
                                  backgroundColor: colors.neons.yellow.default,
                                  boxShadow: `0 0 10px ${colors.neons.yellow.default}`,
                              },
                          }),
                      }),
            }}
        >
            <Box sx={{ display: { xs: 'none', xl: 'flex' } }}>
                <CyberpunkFormControlLabel
                    readerMode={readerMode}
                    noGap={true}
                    control={
                        <Box
                            className="icon-glitch"
                            sx={{
                                position: 'relative',
                            }}
                        >
                            {getModuleIcon(module, true)}
                        </Box>
                    }
                    label={t(`modules.${module}`)}
                    labelPlacement={'bottom'}
                />
            </Box>
            <Box
                className="icon-glitch"
                sx={{
                    display: { xs: 'flex', xl: 'none' },
                    position: 'relative',
                }}
            >
                {getModuleIcon(module, true)}
            </Box>
        </Button>
    )
}

export default DrawerButton
