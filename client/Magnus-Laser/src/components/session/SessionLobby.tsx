import type { Role } from '@/types/session'
import {
    Alert,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors'
import {
    flicker,
    glitch,
    neonColorCycle,
    neonPulse,
    pulseGlowBlue,
    pulseGlowCyan,
    severeGlitch,
} from '../common/Animations'

interface SessionLobbyProps {
    displayName: string
    role: Role | null
    onDisplayNameChange: (value: string) => void
    onRoleChange: (role: Role) => void
    onCreateHost: () => Promise<void>
    onJoinSession: (input: { code: string; url: string }) => Promise<void>
    defaults?: { code?: string }
    busy?: boolean
    error?: string
}

const SessionLobby = ({
    displayName,
    role,
    onDisplayNameChange,
    onRoleChange,
    onCreateHost,
    onJoinSession,
    defaults,
    busy,
    error,
}: SessionLobbyProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [code, setCode] = useState(defaults?.code ?? '')
    const [localError, setLocalError] = useState<string>()
    const [serverAvailable, setServerAvailable] = useState(false)

    useEffect(() => {
        setCode(defaults?.code ?? '')
    }, [defaults?.code])

    // Check if companion server is available - poll every 3 seconds
    useEffect(() => {
        const checkServer = async () => {
            try {
                const response = await fetch('http://localhost:8080/health', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: globalThis.AbortSignal.timeout(2000), // 2 second timeout
                })
                const isAvailable = response.ok
                setServerAvailable(isAvailable)
            } catch {
                setServerAvailable(false)
            }
        }

        // Initial check
        checkServer()

        // Set up polling every 3 seconds
        const interval = setInterval(checkServer, 3000)

        // Cleanup on unmount
        return () => clearInterval(interval)
    }, [])

    const canHost =
        (typeof window !== 'undefined' &&
            typeof (window as typeof window & { __TAURI__?: { core?: { invoke?: (...args: unknown[]) => unknown } } })
                .__TAURI__?.core?.invoke === 'function') ||
        serverAvailable
    const disabledCreate = busy || !displayName || role !== 'dm' || !canHost
    const disabledJoin = busy || !displayName || role !== 'player' || !code

    const message = localError ?? error

    // Reusable TextField styles like in TokenDetailsDialog
    const textFieldOutlinedStyle = {
        '& .MuiOutlinedInput-root': {
            color: readerMode ? '#333' : '#fff',
            '& fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : 'rgba(0, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
                borderColor: readerMode ? 'rgba(0, 0, 0, 0.5)' : colors.neons.cyan.default,
            },
        },
        '& .MuiInputLabel-root': {
            color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
            borderRadius: '4px',
            bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
            p: 0.5,
            py: 0.25,
            border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
        },
        '&:hover .MuiInputLabel-root': {
            animation: readerMode ? undefined : `${pulseGlowCyan} 2s infinite`,
        },
    }

    const handleCreate = async () => {
        setLocalError(undefined)
        try {
            await onCreateHost()
        } catch (err) {
            setLocalError((err as Error).message)
        }
    }

    const handleJoin = async () => {
        setLocalError(undefined)
        try {
            const url = `https://${code}.trycloudflare.com`
            await onJoinSession({ code, url })
        } catch (err) {
            setLocalError((err as Error).message)
        }
    }

    return (
        <Card
            sx={{
                position: 'relative',
                borderRadius: '4px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                height: '100%',
                border: readerMode ? '1px solid rgba(0, 180, 180, 0.2)' : '1px solid rgba(0, 255, 255, 0.2)',
                backdropFilter: 'blur(5px)',
                boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    animation: `${neonPulse} 2s infinite`,
                    '& .card-icon': {
                        opacity: 0.4,
                        filter: `drop-shadow(0 0 ${readerMode ? '10px' : '20px'} ${colors.neons.cyan.default})`,
                        animation: `${flicker} 4s infinite, ${neonColorCycle} 5s infinite`,
                    },
                    '& .card-title': {
                        animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 15px rgba(0,0,0,0.5)`,
                        fontWeight: 700,
                    },
                    '& .card-description': {
                        color: readerMode ? colors.neons.green.dark : colors.neons.green.light,
                        textShadow: readerMode
                            ? `0 0 3px ${colors.neons.green.light}, 0 0 5px rgba(0,0,0,0.2)`
                            : `0 0 3px ${colors.neons.green.dark}, 0 0 5px rgba(0,0,0,0.9)`,
                        fontWeight: 600,
                        animation: `${neonColorCycle} 8s linear infinite`,
                    },
                    '& .card-subdescription': {
                        color: colors.grays.gray900,
                        textShadow: readerMode ? `0 0 2px rgba(0,0,0,0.2)` : `0 0 3px rgba(0,0,0,0.9)`,
                        fontWeight: 500,
                    },
                    '& .card-glitch-overlay': {
                        opacity: readerMode ? 0.1 : 0.15,
                    },
                    '& .card-scanlines': {
                        opacity: readerMode ? 0.1 : 0.3,
                    },
                    '& .data-corruption': {
                        opacity: readerMode ? 0.7 : 1,
                    },
                    '&::before': {
                        opacity: readerMode ? 0.3 : 0.5,
                        background: readerMode ? 'rgba(200, 250, 250, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    },
                },
            }}
        >
            <CardContent
                sx={{
                    minHeight: '180px',
                    position: 'relative',
                    zIndex: 4,
                    padding: 3,
                    backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                    backdropFilter: 'blur(5px)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Stack spacing={2}>
                    <Typography
                        variant="h3"
                        className="card-title"
                        data-text={t('dashboard.importData')}
                        sx={{
                            color: colors.neons.cyan.default,
                            transition: 'all 0.3s',
                            textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                            mb: 3,
                            textAlign: 'center',
                            fontSize: '1.7rem',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            position: 'relative',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: '-10px',
                                left: '25%',
                                width: '50%',
                                height: '1px',
                                background: `linear-gradient(to right, transparent, ${colors.neons.yellow.default}, transparent)`,
                                boxShadow: `0 0 5px ${colors.neons.yellow.default}`,
                            },
                            '&::before': {
                                content: 'attr(data-text)',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                color: readerMode ? colors.grays.gray900 : colors.neons.blue.default,
                                opacity: readerMode ? 1 : 0.5,
                                filter: readerMode ? 'none' : 'blur(1px)',
                                animation: readerMode ? 'none' : `${severeGlitch} 5s infinite`,
                                display: 'block',
                            },
                            '&:hover::before': {
                                opacity: readerMode ? 1 : 0.7,
                            },
                        }}
                    >
                        {t('session.title')}
                    </Typography>
                    <Stack spacing={2} direction={'row'}>
                        <TextField
                            label={t('session.displayName')}
                            value={displayName}
                            onChange={(event) => onDisplayNameChange(event.target.value)}
                            disabled={busy}
                            required
                            fullWidth
                            sx={textFieldOutlinedStyle}
                        />

                        <ToggleButtonGroup
                            value={role}
                            exclusive
                            onChange={(_event, next) => {
                                if (next) onRoleChange(next)
                            }}
                            sx={{
                                gap: '0px',
                                background: readerMode ? '#f5f5f5' : 'rgba(0, 20, 40, 0.7)',
                                p: '2px',
                                border: readerMode
                                    ? `1px solid ${
                                          role === 'dm' ? colors.neons.blue.default : colors.neons.cyan.default
                                      }`
                                    : `1px solid ${
                                          role === 'dm' ? 'rgba(0, 100, 255, 0.3)' : 'rgba(0, 200, 255, 0.3)'
                                      }`,
                                borderRadius: '3px',
                                boxShadow: readerMode
                                    ? 'none'
                                    : role === 'dm'
                                    ? '0 0 10px rgba(0, 100, 255, 0.2), inset 0 0 5px rgba(0, 100, 255, 0.2)'
                                    : '0 0 10px rgba(0, 200, 255, 0.2), inset 0 0 5px rgba(0, 150, 255, 0.2)',
                                position: 'relative',
                                animation: readerMode
                                    ? 'none'
                                    : role === 'dm'
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
                                          background:
                                              role === 'dm'
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
                                          background:
                                              role === 'dm'
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
                                height: 56,
                            }}
                        >
                            <ToggleButton
                                value="dm"
                                disabled={!canHost}
                                title={!canHost ? 'Game Master role requires server connection' : undefined}
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
                                    height: 50,
                                }}
                            >
                                {t('session.gameMaster')}
                            </ToggleButton>
                            <ToggleButton
                                value="player"
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
                                    height: 50,
                                }}
                            >
                                {t('session.player')}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                    {role === 'dm' && (
                        <Button
                            onClick={handleCreate}
                            disabled={disabledCreate}
                            fullWidth
                            title={
                                !canHost
                                    ? serverAvailable
                                        ? 'Session hosting requires the Magnus Laser desktop app'
                                        : 'Session hosting requires the Magnus Laser desktop app or companion server'
                                    : undefined
                            }
                            sx={
                                readerMode
                                    ? {
                                          bgcolor: colors.neons.blue.default,
                                          color: '#fff',
                                          '&:hover': {
                                              bgcolor: colors.neons.blue.dark,
                                          },
                                          '&:disabled': {
                                              bgcolor: '#ccc',
                                              color: '#666',
                                          },
                                          height: 56,
                                      }
                                    : {
                                          bgcolor: 'rgba(0, 20, 40, 0.6)',
                                          color: colors.neons.blue.default,
                                          border: `1px solid ${colors.neons.blue.default}40`,
                                          '&:hover': {
                                              bgcolor: 'rgba(0, 40, 60, 0.8)',
                                              color: colors.neons.blue.light,
                                              boxShadow: `0 0 10px ${colors.neons.blue.default}60`,
                                              textShadow: `0 0 5px ${colors.neons.blue.default}`,
                                              border: `1px solid ${colors.neons.blue.default}70`,
                                          },
                                          '&:disabled': {
                                              bgcolor: 'rgba(40, 40, 40, 0.4)',
                                              color: '#666',
                                              border: '1px solid rgba(100, 100, 100, 0.2)',
                                          },
                                          height: 56,
                                      }
                            }
                        >
                            {t('session.createSession')}
                        </Button>
                    )}
                    {role === 'player' && (
                        <>
                            <Stack direction={'row'} spacing={2}>
                                <TextField
                                    label={t('session.code')}
                                    placeholder="wubba-lubba-dub-dub"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value.trim())}
                                    disabled={busy}
                                    fullWidth
                                    sx={textFieldOutlinedStyle}
                                />
                                <Button
                                    onClick={handleJoin}
                                    disabled={disabledJoin}
                                    sx={
                                        readerMode
                                            ? {
                                                  bgcolor: colors.neons.green.default,
                                                  color: '#fff',
                                                  '&:hover': {
                                                      bgcolor: colors.neons.green.dark,
                                                  },
                                                  '&:disabled': {
                                                      bgcolor: '#ccc',
                                                      color: '#666',
                                                  },
                                                  height: 56,
                                              }
                                            : {
                                                  bgcolor: 'rgba(0, 20, 40, 0.6)',
                                                  color: colors.neons.green.default,
                                                  border: `1px solid ${colors.neons.green.default}40`,
                                                  '&:hover': {
                                                      bgcolor: 'rgba(0, 40, 20, 0.8)',
                                                      color: colors.neons.green.light,
                                                      boxShadow: `0 0 10px ${colors.neons.green.default}60`,
                                                      textShadow: `0 0 5px ${colors.neons.green.default}`,
                                                      border: `1px solid ${colors.neons.green.default}70`,
                                                  },
                                                  '&:disabled': {
                                                      bgcolor: 'rgba(40, 40, 40, 0.4)',
                                                      color: '#666',
                                                      border: '1px solid rgba(100, 100, 100, 0.2)',
                                                  },
                                                  height: 56,
                                              }
                                    }
                                >
                                    {t('session.joinSession')}
                                </Button>
                            </Stack>
                        </>
                    )}
                </Stack>
                {(message || busy) && (
                    <Stack spacing={1}>
                        {message && <Alert severity="error">{message}</Alert>}
                        {busy && <Alert severity="info">{t('session.workingOnIt')}</Alert>}
                    </Stack>
                )}
            </CardContent>
        </Card>
    )
}

export default SessionLobby
