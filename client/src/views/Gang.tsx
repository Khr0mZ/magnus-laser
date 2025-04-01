import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CompactGangView from '../components/gangs/CompactGangView'
import DetailedGangView from '../components/gangs/DetailedGangView'
import { buttonGlitch, pulseGlow, pulseGlowRed, scanlineFlow } from '../components/gangs/GangAnimations'
import { ClearAllGangsDialog, DeleteGangDialog } from '../components/gangs/GangDialogs'
import { DisplayGang } from '../components/gangs/GangTypes'
import GangViewToggle from '../components/gangs/GangViewToggle'
import StorageBanner from '../components/StorageBanner'
import { ReaderModeContext } from '../contexts/ReaderModeContext'
import colors from '../utils/colors'
import { generateRandomGang } from '../utils/generators'
import { clearGangs, loadGangs, saveGangs } from '../utils/storage'

// Add window.gangsDataLoaded declaration
declare global {
    interface Window {
        gangsDataLoaded?: boolean
    }
}

const Gang = () => {
    const { t } = useTranslation()
    useDocumentTitle(`RNG Manager - ${t('modules.GANG')}`)
    const { readerMode } = useContext(ReaderModeContext)
    const [gangs, setGangs] = useState<DisplayGang[]>([])
    const [compactView, setCompactView] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [gangToDelete, setGangToDelete] = useState<number | null>(null)
    const prevGangsRef = useRef<number>(0)
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)

    // Load gangs from local storage on component mount
    useEffect(() => {
        // Get data from local storage
        const savedGangs = loadGangs()

        // Set the initial data without triggering a save
        if (savedGangs.length > 0) {
            setGangs(savedGangs as unknown as DisplayGang[])
        }

        // Save the initial length to avoid triggering save notification for unchanged data
        prevGangsRef.current = savedGangs.length
        firstMountRef.current = false
    }, [])

    // Save gangs to local storage whenever they change, but only show notification
    // for actual data changes (add/remove items)
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) return

        // Always save the data when it exists
        if (gangs.length > 0) {
            saveGangs(gangs as DisplayGang[])
        }

        // Update length reference
        prevGangsRef.current = gangs.length
    }, [gangs])

    const handleGenerateGang = () => {
        setGangs((prevGangs) => [...prevGangs, generateRandomGang()])
        setIsSaving(true)
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = () => {
        setGangs([])
        clearGangs()
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setGangToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (gangToDelete !== null) {
            setGangs((prevGangs) => prevGangs.filter((_, i) => i !== gangToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setGangToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setGangToDelete(null)
    }

    const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView !== null) {
            setCompactView(newView === 'table')
        }
    }

    return (
        <Container maxWidth={false}>
            <StorageBanner isSaving={isSaving} onSavingDone={() => setIsSaving(false)} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography
                    variant="h1"
                    className="glitch-text"
                    data-text={t('gangs.title', 'Gang Generator')}
                    sx={{
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('gangs.title', 'Gang Generator')}
                </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateGang}
                        sx={{
                            position: 'relative',
                            bgcolor: readerMode ? '#e8f5e8' : 'rgba(20, 40, 30, 0.8)',
                            borderColor: readerMode ? '#2e7d32' : colors.neons.green.default,
                            color: readerMode ? '#1b7d2e' : colors.neons.green.default,
                            textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}`,
                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                            letterSpacing: readerMode ? 'normal' : '0.05em',
                            overflow: 'hidden',
                            padding: '6px 16px',
                            border: readerMode ? '1px solid #2e7d32' : `1px solid ${colors.neons.green.default}80`,
                            transition: 'all 0.3s',
                            animation: readerMode ? 'none' : `${pulseGlow} 3s infinite`,
                            boxShadow: readerMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                            ...(readerMode
                                ? {
                                      '&:hover': {
                                          bgcolor: '#d7edd7',
                                          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                                          transform: 'translateY(-1px)',
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
                        <span className="generate-text">{t('gangs.generateButton', 'GENERATE').toUpperCase()}</span>
                    </Button>

                    {/* View Toggle Buttons */}
                    <GangViewToggle
                        compactView={compactView}
                        onViewChange={handleViewChange}
                        disabled={gangs.length === 0}
                    />
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllClick}
                    disabled={gangs.length === 0}
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
                                      transform: 'translateY(-1px)',
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
                    <span className="button-text">{t('common.clear', 'CLEAR ALL').toUpperCase()}</span>
                </Button>
            </Stack>

            {gangs.length === 0 ? (
                <Typography
                    variant="body1"
                    sx={{
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                        fontFamily: '"Orbitron", monospace',
                        letterSpacing: '1px',
                        padding: '2rem',
                        border: `1px dashed ${colors.neons.cyan.default}40`,
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 30, 40, 0.2)',
                        display: 'inline-block',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage:
                                'linear-gradient(to right, rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            pointerEvents: 'none',
                        },
                        '&::after': {
                            content: '"> "',
                            color: colors.neons.green.default,
                            animation: `${buttonGlitch} 2s infinite`,
                            textShadow: `0 0 5px ${colors.neons.green.default}`,
                        },
                    }}
                >
                    {t('common.noItems', { type: t('modules.GANG').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <CompactGangView gangs={gangs} onDelete={handleDeleteClick} />
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {gangs.map((gang, index) => (
                        <DetailedGangView key={index} gang={gang} index={index} onDelete={handleDeleteClick} />
                    ))}
                </Grid>
            )}

            {/* Confirmation dialogs */}
            <DeleteGangDialog open={deleteDialogOpen} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} />

            <ClearAllGangsDialog open={clearAllDialogOpen} onClose={handleClearCancel} onConfirm={handleClearConfirm} />
        </Container>
    )
}

export default Gang
