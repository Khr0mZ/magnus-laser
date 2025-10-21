import { glitch, neonColorCycle, neonPulse, severeGlitch } from '@/components/common/Animations'
import { useUserPreferences } from '@/contexts/userPreferencesHooks'
import type { PeerInfo, SessionInfo } from '@/types/session'
import colors from '@/utils/colors'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Card, CardContent, Chip, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Transport = 'webrtc' | 'ws' | 'none'

interface SessionHUDProps {
    session: SessionInfo
    peers: PeerInfo[]
    transport: Transport
    connected: boolean
    onLeave: () => Promise<void>
    onReconnect: () => Promise<void>
    onKickPlayer: (peerId: string, peerName: string) => void
    onEndSessionDialogOpen: () => void
    externalError?: string
    isDM: boolean
    selfId?: string
}

const transportLabels: Record<Transport, string> = {
    none: 'Offline',
    ws: 'Relay',
    webrtc: 'WebRTC',
}

const SessionHUD = ({
    session,
    peers,
    transport,
    connected,
    onLeave,
    onReconnect,
    onKickPlayer,
    onEndSessionDialogOpen,
    isDM,
    selfId,
    externalError,
}: SessionHUDProps) => {
    const { readerMode } = useUserPreferences()
    const { t } = useTranslation()
    const [error, setError] = useState<string>()
    const [notice, setNotice] = useState<string>()
    const { enqueueSnackbar } = useSnackbar()
    const displayError = error ?? externalError
    const anyRtcPeer = peers.some((peer) => peer.connected)
    const isRelayActive = transport === 'ws'
    const effectiveTransport: Transport = anyRtcPeer ? 'webrtc' : isRelayActive ? 'ws' : transport

    const transportChipColor =
        effectiveTransport === 'webrtc'
            ? colors.neons.cyan.default
            : effectiveTransport === 'ws'
            ? colors.neons.yellow.default
            : colors.neons.red.default
    const displayConnected = connected || isRelayActive || anyRtcPeer
    const connectedChipColor = displayConnected ? colors.neons.cyan.default : colors.neons.red.default
    const connectedChipLabel = displayConnected ? t('session.online') : t('session.offline')
    const isHostPeer = (peer: PeerInfo) => (session.hostId ? peer.id === session.hostId : peer.role === 'dm')
    const hostPeerInfo = peers.find((peer) => (session.hostId ? peer.id === session.hostId : peer.role === 'dm'))
    const hostReachable = Boolean(hostPeerInfo && (hostPeerInfo.connected || isRelayActive))

    const handleCopyInvite = async () => {
        if (!session.publicUrl) {
            setError(t('session.sessionNotReady'))
            return
        }
        const text = session.code
        try {
            await navigator.clipboard.writeText(text)
            setNotice(t('session.inviteCopiedToClipboard'))
            setError(undefined)
        } catch (err) {
            setError((err as Error).message)
            setNotice(undefined)
        }
    }

    const handleLeave = async () => {
        setError(undefined)
        setNotice(undefined)
        await onLeave()
    }

    const handleReconnect = async () => {
        setError(undefined)
        setNotice(undefined)
        await onReconnect()
    }

    // Show notice as snackbar
    useEffect(() => {
        if (notice) {
            enqueueSnackbar(notice, {
                variant: 'success',
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                autoHideDuration: 3000,
            })
            setNotice(undefined)
        }
    }, [notice, enqueueSnackbar])

    // Show error as snackbar
    useEffect(() => {
        if (displayError) {
            enqueueSnackbar(displayError, {
                variant: 'error',
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                autoHideDuration: 5000,
            })
            setError(undefined)
        }
    }, [displayError, enqueueSnackbar])

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
                    '& .card-title': {
                        animation: `${neonColorCycle} 3s linear infinite, ${glitch} 5s infinite`,
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}, 0 0 15px rgba(0,0,0,0.5)`,
                        fontWeight: 700,
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
                    minHeight: '200px',
                    position: 'relative',
                    zIndex: 4,
                    padding: 3,
                    backgroundColor: readerMode ? colors.neons.blue.dark + '99' : 'rgba(5, 7, 24, 0.6)',
                    backdropFilter: 'blur(5px)',
                    height: '100%',
                }}
            >
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                            <Typography
                                variant="h4"
                                fontWeight={600}
                                className="card-title"
                                data-text={t('session.hudTitle')}
                                sx={{
                                    color: colors.neons.cyan.default,
                                    transition: 'all 0.3s',
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}, 0 0 10px rgba(0,0,0,0.8)`,
                                    textAlign: 'center',
                                    fontSize: '1.7rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    position: 'relative',
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
                                {t('session.hudTitle')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {session.code}
                            </Typography>
                        </Stack>
                        <Chip
                            sx={{
                                bgcolor: transportChipColor,
                                color: colors.grays.gray000,
                            }}
                            label={transportLabels[effectiveTransport]}
                        />
                        <Chip
                            sx={{
                                bgcolor: connectedChipColor,
                                color: colors.grays.gray000,
                            }}
                            label={connectedChipLabel}
                        />
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {!isDM && (
                                <Button
                                    onClick={handleReconnect}
                                    sx={
                                        readerMode
                                            ? {
                                                  bgcolor: colors.neons.green.default,
                                                  color: '#fff',
                                                  '&:hover': {
                                                      bgcolor: colors.neons.green.dark,
                                                  },
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
                                              }
                                    }
                                >
                                    {t('session.reconnect')}
                                </Button>
                            )}
                            <Button
                                onClick={isDM ? onEndSessionDialogOpen : handleLeave}
                                sx={
                                    readerMode
                                        ? {
                                              bgcolor: colors.neons.red.default,
                                              color: '#fff',
                                              '&:hover': {
                                                  bgcolor: colors.neons.red.dark,
                                              },
                                          }
                                        : {
                                              bgcolor: 'rgba(40, 0, 0, 0.6)',
                                              color: colors.neons.red.default,
                                              border: `1px solid ${colors.neons.red.default}40`,
                                              '&:hover': {
                                                  bgcolor: 'rgba(60, 0, 0, 0.8)',
                                                  color: colors.neons.red.light,
                                                  boxShadow: `0 0 10px ${colors.neons.red.default}60`,
                                                  textShadow: `0 0 5px ${colors.neons.red.default}`,
                                                  border: `1px solid ${colors.neons.red.default}70`,
                                              },
                                          }
                                }
                            >
                                {isDM ? t('session.endSession') : t('session.leaveSession')}
                            </Button>
                        </Box>
                        {isDM && (
                            <Button
                                onClick={handleCopyInvite}
                                disabled={!session.publicUrl}
                                sx={
                                    readerMode
                                        ? {
                                              bgcolor: session.publicUrl ? colors.neons.blue.default : '#ccc',
                                              color: '#fff',
                                              '&:hover': {
                                                  bgcolor: session.publicUrl ? colors.neons.blue.dark : '#ccc',
                                              },
                                              '&:disabled': {
                                                  bgcolor: '#ccc',
                                                  color: '#666',
                                              },
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
                                          }
                                }
                            >
                                {t('session.copySessionCode')}
                            </Button>
                        )}
                    </Stack>
                </Stack>
                <Divider sx={{ my: 2, borderColor: colors.neons.cyan.default, opacity: 0.5, borderWidth: 1 }} />
                <Typography
                    variant="h4"
                    fontWeight={600}
                    className="card-title"
                    data-text={t('session.users')}
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
                    {t('session.peers')}
                </Typography>
                <Stack spacing={1}>
                    {peers.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            {t('session.waitingForPlayers')}
                        </Typography>
                    )}
                    {peers
                        .sort((a, b) => (a.name.localeCompare(b.name) && a.role === 'dm' ? -1 : 1))
                        .map((peer) => (
                            <div key={peer.id}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{
                                        border: `1px solid ${colors.neons.cyan.default}`,
                                        borderRadius: '4px',
                                        padding: 1,
                                        backgroundColor: readerMode
                                            ? colors.neons.blue.dark + '99'
                                            : 'rgba(5, 7, 24, 0.6)',
                                        backdropFilter: 'blur(5px)',
                                        boxShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                        transition: 'all 0.3s ease-in-out',
                                        '&:hover': {
                                            backgroundColor: readerMode
                                                ? colors.neons.blue.dark + '99'
                                                : colors.neons.pink.dark + '20',
                                        },
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body1">{peer.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {peer.role === 'dm' ? t('session.gameMaster') : t('session.player')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {(() => {
                                            const isSelf = peer.id === selfId
                                            const isHostEntry = isHostPeer(peer)
                                            const viaRtc =
                                                peer.connected ||
                                                (isSelf && anyRtcPeer) ||
                                                (!isDM && isHostEntry && anyRtcPeer)
                                            const viaRelay =
                                                isRelayActive &&
                                                (isDM ? peer.role === 'player' || isSelf : isHostEntry || isSelf)
                                            const viaHostBridge =
                                                !isDM && peer.role === 'player' && peer.id !== selfId && hostReachable
                                            const viaPartyBridge =
                                                !isDM &&
                                                peer.role === 'player' &&
                                                peer.id !== selfId &&
                                                displayConnected
                                            const selfConnection = isSelf && displayConnected
                                            const peerOnline =
                                                viaRtc || viaRelay || viaHostBridge || viaPartyBridge || selfConnection
                                            const tooltip = viaRtc
                                                ? t('session.dataChannelUp')
                                                : viaRelay
                                                ? t('session.relayChannelActive')
                                                : viaHostBridge
                                                ? t('session.connectedThroughHost')
                                                : viaPartyBridge
                                                ? t('session.connectedToSession')
                                                : selfConnection
                                                ? t('session.relayChannelActive')
                                                : t('session.waitingOnTransport')
                                            return (
                                                <Tooltip title={tooltip}>
                                                    <Chip
                                                        size="small"
                                                        sx={{
                                                            bgcolor: peerOnline
                                                                ? colors.neons.cyan.default
                                                                : colors.neons.red.default,
                                                            color: peerOnline
                                                                ? colors.grays.gray000
                                                                : colors.grays.gray900,
                                                        }}
                                                        label={peerOnline ? t('session.online') : t('session.pending')}
                                                    />
                                                </Tooltip>
                                            )
                                        })()}
                                        {/* Kick button - only show for DMs kicking players (not themselves) */}
                                        {isDM && peer.role === 'player' && peer.id !== selfId && (
                                            <Tooltip title={t('session.kickPlayer')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onKickPlayer(peer.id, peer.name)
                                                    }}
                                                    sx={{
                                                        ml: 2,
                                                        minWidth: '36px',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '2px',
                                                        p: 0,
                                                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                                        color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                                        border: readerMode
                                                            ? '1px solid #d32f2f'
                                                            : `1px solid ${colors.neons.red.default}60`,
                                                        '&:hover': readerMode
                                                            ? {
                                                                  bgcolor: '#f0f0f0',
                                                                  color: '#b71c1c',
                                                              }
                                                            : {
                                                                  bgcolor: 'rgba(60, 0, 0, 0.6)',
                                                                  color: colors.neons.red.light,
                                                                  boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                                              },
                                                    }}
                                                >
                                                    <CloseIcon sx={{ fontSize: '16px' }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Stack>
                                {peer.role === 'dm' && (
                                    <Divider
                                        sx={{
                                            mt: 2,
                                            mb: 1,
                                            borderColor: colors.neons.cyan.default,
                                            opacity: 0.5,
                                            borderWidth: 1,
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                </Stack>
            </CardContent>
        </Card>
    )
}

export default SessionHUD
