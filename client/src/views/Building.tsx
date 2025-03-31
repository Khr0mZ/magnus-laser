import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonGlitch, pulseGlow, pulseGlowRed, scanlineFlow } from '../components/buildings/BuildingAnimations'
import { ViewToggle } from '../components/buildings/BuildingControls'
import { ClearAllBuildingsDialog, DeleteBuildingDialog } from '../components/buildings/BuildingDialogs'
import { DisplayBuilding } from '../components/buildings/BuildingTypes'
import CompactBuildingView from '../components/buildings/CompactBuildingView'
import DetailedBuildingView from '../components/buildings/DetailedBuildingView'
import JobTypeSelector from '../components/buildings/JobTypeSelectorComponent'
import StorageBanner from '../components/StorageBanner'
import { ReaderModeContext } from '../contexts/ReaderModeContext'
import { JobType, getJobTypeModifier } from '../types/jobType'
import colors from '../utils/colors'
import { generateRandomBuilding } from '../utils/generators'
import { clearBuildings, loadBuildings, saveBuildings } from '../utils/storage'

const Building = () => {
    const { t } = useTranslation()
    useDocumentTitle(`RNG Manager - ${t('modules.BUILDING')}`)
    const [buildings, setBuildings] = useState<DisplayBuilding[]>([])
    const [compactView, setCompactView] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [buildingToDelete, setBuildingToDelete] = useState<number | null>(null)
    const [jobType, setJobType] = useState<JobType>(JobType.TYPICAL)
    const prevBuildingsRef = useRef<number>(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)
    const { readerMode } = useContext(ReaderModeContext)

    // Load buildings from local storage on component mount
    useEffect(() => {
        // Get data from local storage
        const savedBuildings = loadBuildings()

        // Set the initial data without triggering a save
        if (savedBuildings.length > 0) {
            setBuildings(savedBuildings as unknown as DisplayBuilding[])

            // Only show the load notification on the first load of the app session
            if (!window.buildingsDataLoaded && savedBuildings.length > 0) {
                window.buildingsDataLoaded = true
                setIsLoading(true)
            }
        }

        // Save the initial length to avoid triggering save notification for unchanged data
        prevBuildingsRef.current = savedBuildings.length
        firstMountRef.current = false
    }, [])

    // Save buildings to local storage whenever they change, but only show notification
    // for actual data changes (add/remove items)
    useEffect(() => {
        // Skip during component initialization
        if (firstMountRef.current) return

        // Always save the data when it exists
        if (buildings.length > 0) {
            saveBuildings(buildings)
        }

        // Update length reference
        prevBuildingsRef.current = buildings.length
    }, [buildings])

    const handleJobTypeChange = (_: React.MouseEvent<HTMLElement>, newJobType: JobType | null) => {
        if (newJobType !== null) {
            setJobType(newJobType)
        }
    }

    const handleGenerateBuilding = () => {
        setBuildings((prevBuildings) => [...prevBuildings, generateRandomBuilding(getJobTypeModifier(jobType))])
        setIsSaving(true)
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = () => {
        setBuildings([])
        clearBuildings()
        setIsSaving(true)
        setClearAllDialogOpen(false)
    }

    const handleClearCancel = () => {
        setClearAllDialogOpen(false)
    }

    const handleDeleteClick = (index: number) => {
        setBuildingToDelete(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (buildingToDelete !== null) {
            setBuildings((prevBuildings) => prevBuildings.filter((_, i) => i !== buildingToDelete))
            setIsSaving(true)
            setDeleteDialogOpen(false)
            setBuildingToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setBuildingToDelete(null)
    }

    const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
        if (newView !== null) {
            setCompactView(newView === 'table')
        }
    }

    return (
        <Container maxWidth={false}>
            <StorageBanner
                isLoading={isLoading}
                isSaving={isSaving}
                onLoadingDone={() => setIsLoading(false)}
                onSavingDone={() => setIsSaving(false)}
            />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography
                    variant="h1"
                    className="glitch-text"
                    data-text={t('buildings.title', 'Building Generator')}
                    sx={{
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('buildings.title', 'Building Generator')}
                </Typography>

                <JobTypeSelector jobType={jobType} onJobTypeChange={handleJobTypeChange} />
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateBuilding}
                        disabled={isLoading || isSaving}
                        sx={{
                            position: 'relative',
                            bgcolor: 'rgba(20, 40, 30, 0.8)',
                            borderColor: colors.neons.green.default,
                            color: colors.neons.green.default,
                            textShadow: `0 0 5px ${colors.neons.green.default}`,
                            fontFamily: '"Orbitron", monospace',
                            letterSpacing: '0.05em',
                            overflow: 'hidden',
                            padding: '6px 16px',
                            border: `1px solid ${colors.neons.green.default}80`,
                            transition: 'all 0.3s',
                            animation: `${pulseGlow} 3s infinite`,
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
                        }}
                    >
                        <span className="generate-text">{t('buildings.generateButton', 'GENERATE')}</span>
                    </Button>

                    {/* View Toggle Buttons */}
                    <ViewToggle
                        compactView={compactView}
                        onViewChange={handleViewChange}
                        disabled={buildings.length === 0}
                    />
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllClick}
                    disabled={buildings.length === 0}
                    sx={{
                        position: 'relative',
                        bgcolor: 'rgba(40, 0, 0, 0.8)',
                        borderColor: colors.neons.red.default,
                        color: colors.neons.red.default,
                        textShadow: `0 0 5px ${colors.neons.red.default}`,
                        fontFamily: '"Orbitron", monospace',
                        letterSpacing: '0.05em',
                        overflow: 'hidden',
                        padding: '6px 16px',
                        border: `1px solid ${colors.neons.red.default}80`,
                        transition: 'all 0.3s',
                        animation: `${pulseGlowRed} 3s infinite`,
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
                    }}
                >
                    <span className="button-text">{t('common.clear', 'CLEAR ALL')}</span>
                </Button>
            </Stack>

            {buildings.length === 0 ? (
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
                    {t('common.noItems', { type: t('modules.BUILDING').toLowerCase() })}
                </Typography>
            ) : compactView ? (
                <CompactBuildingView buildings={buildings} onDelete={handleDeleteClick} />
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {buildings.map((building, index) => (
                        <DetailedBuildingView
                            key={index}
                            building={building}
                            index={index}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </Grid>
            )}

            {/* Confirmation dialogs */}
            <DeleteBuildingDialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />

            <ClearAllBuildingsDialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
            />
        </Container>
    )
}

export default Building
