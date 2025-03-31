import { keyframes } from '@emotion/react'
import GridViewIcon from '@mui/icons-material/GridView'
import TableViewIcon from '@mui/icons-material/TableView'
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { TFunction } from 'i18next'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import StorageBanner from '../components/StorageBanner'
import { ReaderModeContext } from '../contexts/ReaderModeContext'
import {
    Building as BuildingType,
    BuildingType as BuildingTypeEnum,
    Ownership,
    SecurityPersonnel,
    Style,
} from '../graphql/types'
import { JobType, getJobTypeModifier } from '../types/jobType'
import colors from '../utils/colors'
import { generateRandomBuilding } from '../utils/generators'
import { translateEnum, translateLabel } from '../utils/i18nUtils'
import { clearBuildings, loadBuildings, saveBuildings } from '../utils/storage'

// Type for our building with display properties
type DisplayBuilding = BuildingType & {
    displayName: string
    description: string
    _nameComponents?: {
        type: BuildingTypeEnum
        style: Style
        ownership: Ownership
    }
    _descriptionData?: {
        building: BuildingType
        nameComponents: {
            type: BuildingTypeEnum
            style: Style
            ownership: Ownership
        }
    }
    _jobType: string
}

// Function to generate name for the current language
const generateLocalizedBuildingName = (building: DisplayBuilding, t: TFunction): string => {
    if (!building._nameComponents) {
        return building.displayName // Fallback to stored name
    }

    const { type, style, ownership } = building._nameComponents

    // Create display name based on building properties (these are mostly proper names and don't need translation)
    // Just a simplified version of the original generator
    const corpoPrefixes = [
        'Arasaka',
        'Militech',
        'Biotechnica',
        'Petrochem',
        'Kang Tao',
        'Zetatech',
        'Night Corp',
        'Budget Arms',
        'Trauma Team',
        'Dynalar',
    ]

    const styleAdjectives: Record<Style, string[]> = {
        [Style.AUSTERE]: ['Austere', 'Sparse', 'Minimalist', 'Plain'],
        [Style.CORPORATE]: ['Corporate', 'Enterprise', 'Executive', 'Business'],
        [Style.EUROPEAN]: ['European', 'Continental', 'Classic', 'Old-World'],
        [Style.EXOTIC]: ['Exotic', 'Unusual', 'Rare', 'Foreign'],
        [Style.LUXURIOUS]: ['Luxurious', 'Opulent', 'Lavish', 'Extravagant'],
        [Style.MILITARISTIC]: ['Militaristic', 'Fortress', 'Bunker', 'Defense'],
        [Style.MODERN]: ['Modern', 'Contemporary', 'Current', 'Progressive'],
        [Style.NEON_FEST]: ['Neon', 'Glow', 'Electric', 'Luminous'],
        [Style.ORIENTAL]: ['Oriental', 'Eastern', 'Zen', 'Dynasty'],
        [Style.SOVIETIC]: ['Soviet', 'United', 'Red', 'Communist'],
        [Style.TRIBAL]: ['Tribal', 'Native', 'Indigenous', 'Ancestral'],
        [Style.URBAN_GRAFFITI]: ['Graffiti', 'Street', 'Urban', 'Tagged'],
    }

    // Use first option from arrays for consistency
    const styleAdj = styleAdjectives[style][0]

    // Generate a name based on building type - simplified from original
    switch (type) {
        case BuildingTypeEnum.SKYSCRAPER_MEGABUILDING:
            return `${styleAdj} Megabuilding H10`

        case BuildingTypeEnum.MEGACORPO_HQ:
        case BuildingTypeEnum.CORPO_BUILDING: {
            const corpo = corpoPrefixes[0]
            return ownership === Ownership.MEGA_CORPO || ownership === Ownership.CORPO
                ? `${corpo} ${styleAdj} Tower`
                : `${t('buildings.former', 'Former')} ${corpo} ${styleAdj} ${t('buildings.building', 'Building')}`
        }

        case BuildingTypeEnum.COMMERCIAL_BUILDING:
            return `Westbrook ${styleAdj} ${t('buildings.mall', 'Mall')}`

        case BuildingTypeEnum.ESTABLISHMENT:
            return `${t('common.the')} ${styleAdj} Neon ${t('buildings.dragon', 'Dragon')} ${t(
                'buildings.club',
                'Club'
            )}`

        case BuildingTypeEnum.CUBE_HOTEL_MOTEL_CARGO_CONTAINER:
            return `${styleAdj} ${t('buildings.cubeHotel', 'Cube Hotel')} 12`

        case BuildingTypeEnum.LUXURY_PENTHOUSE_MCMANSION:
            return `${styleAdj} ${t('buildings.luxury', 'Luxury')} ${t('buildings.heights', 'Heights')} 5`

        case BuildingTypeEnum.ABANDONED_BUILDING:
            return `${t('buildings.abandoned', 'Abandoned')} ${styleAdj} Neo-Plaza`

        case BuildingTypeEnum.VACANT_LOT_CONSTRUCTION_SITE:
            return `${styleAdj} ${t('buildings.constructionSite', 'Construction Site')} 101`

        default:
            return `${styleAdj} Neo-Plaza`
    }
}

// Function to generate description for the current language
const generateLocalizedBuildingDescription = (building: DisplayBuilding, t: TFunction): string => {
    if (!building._descriptionData?.building) {
        return building.description // Fallback to stored description
    }

    const b = building._descriptionData.building
    let description = ''

    // Generate the display name for this language
    const displayName = generateLocalizedBuildingName(building, t)

    // Start with the building type and style
    description += `${displayName} ${t('buildings.descriptions.is')} ${translateEnum(
        t,
        b.style,
        'buildings.style'
    )} ${t('buildings.descriptions.styled')} ${translateEnum(t, b.type, 'buildings.type')}. `

    // Add information about ownership
    switch (b.ownership) {
        case Ownership.CORPO:
        case Ownership.MEGA_CORPO: {
            description += `${t('buildings.descriptions.ownedBy', {
                type: b.ownership === Ownership.MEGA_CORPO ? t('buildings.descriptions.major') : '',
            })} `
            break
        }
        case Ownership.GANG_MAFIA:
        case Ownership.MILITARISTIC_GANG:
        case Ownership.POSERGANG: {
            description += `${t('buildings.descriptions.controlledBy', {
                owner: translateEnum(t, b.ownership, 'buildings.ownership'),
            })} `
            break
        }
        case Ownership.GOVERNMENT:
        case Ownership.LOCAL_GOV: {
            description += `${t('buildings.descriptions.facility', {
                owner: translateEnum(t, b.ownership, 'buildings.ownership'),
            })} `
            break
        }
        case Ownership.NO_ONE_SCAVS: {
            description += `${t('buildings.descriptions.abandoned')} `
            break
        }
        default: {
            description += `${t('buildings.descriptions.property', {
                owner: translateEnum(t, b.ownership, 'buildings.ownership'),
            })} `
        }
    }

    // Security information
    if (b.securityPersonnel === SecurityPersonnel.NONE) {
        description += `${t('buildings.descriptions.noSecurity')} `
    } else {
        description += `${t('buildings.descriptions.guardedBy', {
            security: translateEnum(t, b.securityPersonnel, 'buildings.security'),
        })} `
    }

    // Add current event information
    const eventTranslation = translateEnum(t, b.event, 'buildings.event')
    description += `${t('buildings.descriptions.currentEvent', {
        event: eventTranslation,
    })} `

    // Add secret
    const secretTranslation = translateEnum(t, b.secret, 'buildings.secret')
    description += `${t('buildings.descriptions.rumors', {
        secret: secretTranslation,
    })}`

    return description
}

// Define keyframe animations for buttons
const buttonGlitch = keyframes`
  0% {
    text-shadow: 0.05em 0 0 ${colors.neons.pink.default}, -0.05em -0.025em 0 ${colors.neons.cyan.default},
      -0.025em 0.05em 0 ${colors.neons.green.default};
  }
  14% {
    text-shadow: 0.05em 0 0 ${colors.neons.pink.default}, -0.05em -0.025em 0 ${colors.neons.cyan.default},
      -0.025em 0.05em 0 ${colors.neons.green.default};
  }
  15% {
    text-shadow: -0.05em -0.025em 0 ${colors.neons.pink.default}, 0.025em 0.025em 0 ${colors.neons.cyan.default},
      -0.05em -0.05em 0 ${colors.neons.green.default};
  }
  49% {
    text-shadow: -0.05em -0.025em 0 ${colors.neons.pink.default}, 0.025em 0.025em 0 ${colors.neons.cyan.default},
      -0.05em -0.05em 0 ${colors.neons.green.default};
  }
  50% {
    text-shadow: 0.025em 0.05em 0 ${colors.neons.pink.default}, 0.05em 0 0 ${colors.neons.cyan.default},
      0 -0.05em 0 ${colors.neons.green.default};
  }
  99% {
    text-shadow: 0.025em 0.05em 0 ${colors.neons.pink.default}, 0.05em 0 0 ${colors.neons.cyan.default},
      0 -0.05em 0 ${colors.neons.green.default};
  }
  100% {
    text-shadow: -0.025em 0 0 ${colors.neons.pink.default}, -0.025em -0.025em 0 ${colors.neons.cyan.default},
      -0.025em -0.05em 0 ${colors.neons.green.default};
  }
`

const scanlineFlow = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 30px;
  }
`

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.green.default}, 0 0 20px ${colors.neons.green.default}60, 0 0 30px ${colors.neons.green.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}40;
  }
`

const pulseGlowRed = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.red.default}, 0 0 10px ${colors.neons.red.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.red.default}, 0 0 20px ${colors.neons.red.default}60, 0 0 30px ${colors.neons.red.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.red.default}, 0 0 10px ${colors.neons.red.default}40;
  }
`

const pulseGlowYellow = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.yellow.default}, 0 0 10px ${colors.neons.yellow.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.yellow.default}, 0 0 20px ${colors.neons.yellow.default}60, 0 0 30px ${colors.neons.yellow.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.yellow.default}, 0 0 10px ${colors.neons.yellow.default}40;
  }
`

const pulseGlowBlue = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.blue.default}, 0 0 10px ${colors.neons.blue.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.blue.default}, 0 0 20px ${colors.neons.blue.default}60, 0 0 30px ${colors.neons.blue.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.blue.default}, 0 0 10px ${colors.neons.blue.default}40;
  }
`

const pulseGlowCyan = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}60, 0 0 30px ${colors.neons.cyan.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
  }
`

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

    // Process complex nested objects for display
    const processValueForDisplay = (key: string, value: unknown): string => {
        if (value === null || value === undefined) {
            return 'N/A'
        }

        if (typeof value === 'object') {
            const valueObj = value as Record<string, unknown>
            // Handle specific nested objects with difficulty values
            if (
                key === 'backupLights' ||
                key === 'elevators' ||
                key === 'emergencyExit' ||
                key === 'gatehouseFrontDesk' ||
                key === 'landingPad' ||
                key === 'parking' ||
                key === 'secretOrAltEntrance'
            ) {
                if ('value' in valueObj && valueObj.value !== undefined) {
                    return `DV${valueObj.value}`
                }
            }

            // Skip the typename property that GraphQL adds
            if (key === '__typename') {
                return ''
            }

            // Return a placeholder for other complex objects
            return '[Complex Object]'
        }

        // Handle enum values with translations
        if (typeof value === 'string') {
            // Map key to the appropriate i18n namespace
            const namespaceMap: Record<string, string> = {
                type: 'buildings.type',
                ownership: 'buildings.ownership',
                securityPersonnel: 'buildings.security',
                style: 'buildings.style',
                event: 'buildings.event',
                secret: 'buildings.secret',
            }

            if (namespaceMap[key]) {
                return translateEnum(t, value, namespaceMap[key])
            }
        }

        return String(value)
    }

    // Priority order for display in the table, matching the reference
    const getOrderedBuildingData = (building: DisplayBuilding) => {
        return [
            { key: 'type', label: translateLabel(t, 'type', 'buildings'), value: building.type },
            { key: 'elevators', label: translateLabel(t, 'elevators', 'buildings'), value: building.elevators },
            { key: 'parking', label: translateLabel(t, 'parking', 'buildings'), value: building.parking },
            {
                key: 'gatehouseFrontDesk',
                label: translateLabel(t, 'gatehouseFrontDesk', 'buildings'),
                value: building.gatehouseFrontDesk,
            },
            {
                key: 'emergencyExit',
                label: translateLabel(t, 'emergencyExit', 'buildings'),
                value: building.emergencyExit,
            },
            {
                key: 'backupLights',
                label: translateLabel(t, 'backupLights', 'buildings'),
                value: building.backupLights,
            },
            { key: 'landingPad', label: translateLabel(t, 'landingPad', 'buildings'), value: building.landingPad },
            {
                key: 'secretOrAltEntrance',
                label: translateLabel(t, 'secretOrAltEntrance', 'buildings'),
                value: building.secretOrAltEntrance,
            },
            { key: 'ownership', label: translateLabel(t, 'ownership', 'buildings'), value: building.ownership },
            {
                key: 'securityPersonnel',
                label: translateLabel(t, 'securityPersonnel', 'buildings'),
                value: building.securityPersonnel,
            },
            { key: 'style', label: translateLabel(t, 'style', 'buildings'), value: building.style },
            { key: 'event', label: translateLabel(t, 'event', 'buildings'), value: building.event },
            { key: 'secret', label: translateLabel(t, 'secret', 'buildings'), value: building.secret },
        ]
    }

    // Render the detailed view with description and table
    const renderDetailedView = (building: DisplayBuilding, index: number) => {
        const buildingData = getOrderedBuildingData(building)

        // Generate localized name and description
        const localizedName = generateLocalizedBuildingName(building, t)
        const localizedDescription = generateLocalizedBuildingDescription(building, t)

        return (
            <Grid item xs={12} md={6} xl={4} key={index}>
                <Card
                    sx={{
                        bgcolor: '#0e1630',
                        border: 'none',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage:
                                'linear-gradient(to right, rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            pointerEvents: 'none',
                            zIndex: 1,
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                            boxShadow: `0 0 15px ${colors.neons.cyan.default}`,
                            zIndex: 2,
                        },
                    }}
                >
                    <CardContent sx={{ p: 0, position: 'relative', zIndex: 3 }}>
                        {/* Index number and type indicator */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: readerMode ? 0 : -56,
                                left: 0,
                                bgcolor: 'rgba(25, 28, 58, 0.9)',
                                color: '#fff',
                                py: 0.8,
                                px: 1.5,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                zIndex: 5,
                                backdropFilter: 'blur(2px)',
                            }}
                        >
                            <Box>
                                <Typography
                                    className={readerMode ? '' : 'glitch-text'}
                                    data-text={localizedName}
                                    sx={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        color: readerMode
                                            ? '#333'
                                            : building.style === 'LUXURIOUS'
                                            ? colors.neons.yellow.default
                                            : colors.neons.cyan.default,
                                        fontFamily: 'Orbitron, sans-serif',
                                        ...(readerMode && {
                                            color: '#333 !important',
                                            textShadow: 'none !important',
                                        }),
                                    }}
                                >
                                    {localizedName}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 'normal',
                                        color: readerMode ? '#555' : '#aaa',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        ...(readerMode && {
                                            color: '#555 !important',
                                        }),
                                    }}
                                >
                                    {processValueForDisplay('type', building.type)} -{' '}
                                    {processValueForDisplay('style', building.style)}
                                </Typography>
                            </Box>

                            {/* Delete Button - Updated to use confirmation */}
                            <Button
                                onClick={() => handleDeleteClick(index)}
                                sx={{
                                    minWidth: '30px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '2px',
                                    p: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                    color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                    border: readerMode
                                        ? '1px solid #d32f2f'
                                        : `1px solid ${colors.neons.red.default}60`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                    fontWeight: 'bold',
                                    '&::before': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                              opacity: 0.7,
                                          }
                                        : {},
                                    '&:hover': readerMode
                                        ? {
                                              bgcolor: '#f0f0f0',
                                              color: '#b71c1c',
                                          }
                                        : {
                                              bgcolor: 'rgba(60, 0, 0, 0.6)',
                                              color: colors.neons.red.light,
                                              transform: 'scale(1.05)',
                                              boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                              '&::after': {
                                                  opacity: 0.8,
                                                  height: '100%',
                                              },
                                          },
                                    '&::after': !readerMode
                                        ? {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '0%',
                                              opacity: 0,
                                              background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                              transition: 'all 0.2s',
                                          }
                                        : {},
                                }}
                            >
                                <span
                                    style={{
                                        textShadow: `0 0 5px ${colors.neons.red.default}`,
                                        zIndex: 2,
                                        animation: `${buttonGlitch} 5s infinite`,
                                    }}
                                >
                                    ✕
                                </span>
                            </Button>
                        </Box>

                        {/* Header Section */}
                        <Box
                            sx={{
                                bgcolor: 'rgba(14, 22, 48, 0.9)',
                                p: 2,
                                mt: 8,
                                borderBottom: `1px solid rgba(${
                                    building.style === 'LUXURIOUS'
                                        ? colors.neons.yellow.default
                                              .replace('#', '')
                                              .match(/.{2}/g)
                                              ?.map((hex) => parseInt(hex, 16))
                                              .join(',')
                                        : '0, 255, 255'
                                }, 0.3)`,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': !readerMode
                                    ? {
                                          content: '""',
                                          position: 'absolute',
                                          bottom: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '1px',
                                          background: `linear-gradient(90deg, transparent, ${
                                              building.style === 'LUXURIOUS'
                                                  ? colors.neons.yellow.default
                                                  : colors.neons.cyan.default
                                          }, transparent)`,
                                          opacity: 0.5,
                                      }
                                    : {},
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: readerMode ? '#333' : '#fff',
                                    fontStyle: readerMode ? 'normal' : 'italic',
                                    textShadow: readerMode ? 'none' : '0 0 2px rgba(0,0,0,0.8)',
                                    position: 'relative',
                                    zIndex: 2,
                                }}
                            >
                                {localizedDescription}
                            </Typography>
                        </Box>

                        {/* Data Table */}
                        <TableContainer
                            sx={{
                                p: 2,
                                bgcolor: 'rgba(10, 15, 30, 0.8)',
                                backdropFilter: 'blur(3px)',
                                position: 'relative',
                            }}
                        >
                            <Table size="small">
                                <TableBody>
                                    {buildingData.map((item) => {
                                        const displayValue = processValueForDisplay(item.key, item.value)

                                        return (
                                            <TableRow
                                                key={item.key}
                                                sx={{
                                                    position: 'relative',
                                                    ...(readerMode
                                                        ? {
                                                              '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                                                              '&:nth-of-type(even)': { bgcolor: '#fff' },
                                                              '&:hover': {
                                                                  bgcolor: '#f0f0f0',
                                                              },
                                                          }
                                                        : {
                                                              '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 15, 30, 0.4)' },
                                                              '&:nth-of-type(even)': {
                                                                  bgcolor: 'rgba(0, 20, 40, 0.2)',
                                                              },
                                                              '&:hover': {
                                                                  bgcolor: 'rgba(0, 255, 255, 0.1)',
                                                                  '& .cell-content': {
                                                                      color: colors.neons.cyan.default,
                                                                      textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                                                  },
                                                              },
                                                          }),
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        borderBottom: 'none',
                                                        color: colors.neons.cyan.default,
                                                        fontWeight: 'bold',
                                                        width: '40%',
                                                        textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                                        ...(readerMode && {
                                                            color: '#333 !important',
                                                            textShadow: 'none !important',
                                                        }),
                                                    }}
                                                    className="cell-content"
                                                >
                                                    {item.label}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                        color: '#fff',
                                                        textShadow: `0 0 5px ${colors.neons.green.dark}`,
                                                        ...(readerMode
                                                            ? {
                                                                  color: '#333 !important',
                                                                  textShadow: 'none !important',
                                                                  borderBottom: '1px solid #ddd !important',
                                                              }
                                                            : {}),
                                                    }}
                                                    className="cell-content"
                                                >
                                                    {displayValue}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        )
    }

    // Render compact table view for all buildings
    const renderCompactView = () => {
        if (buildings.length === 0) return null

        return (
            <TableContainer
                sx={{
                    mb: 4,
                    borderRadius: '4px',
                    overflowX: 'auto',
                    position: 'relative',
                    ...(readerMode
                        ? {
                              backgroundColor: '#fff !important',
                              border: '1px solid #ddd !important',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) !important',
                          }
                        : {
                              bgcolor: colors.cyberpunk.darkBg,
                              border: `1px solid ${colors.neons.cyan.dark}`,
                              boxShadow: `0 0 20px rgba(0, 255, 255, 0.15)`,
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '2px',
                                  background: `linear-gradient(to right, ${colors.neons.green.default}, ${colors.neons.cyan.default})`,
                              },
                          }),
                }}
            >
                <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow
                            sx={{
                                bgcolor: 'rgba(0, 255, 255, 0.05)',
                                position: 'relative',
                            }}
                        >
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    color: readerMode ? '#333' : colors.neons.cyan.default,
                                    position: 'sticky',
                                    left: 0,
                                    bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 255, 255, 0.05)',
                                    zIndex: 2,
                                    borderBottom: readerMode ? '1px solid #ddd' : `1px solid ${colors.neons.cyan.dark}`,
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                    ...(readerMode
                                        ? {
                                              color: '#333 !important',
                                              textShadow: 'none !important',
                                              backgroundColor: '#f5f5f5 !important',
                                              borderBottom: '1px solid #ddd !important',
                                          }
                                        : {}),
                                }}
                            >
                                {t('buildings.labels.name', 'Name')}
                            </TableCell>
                            {/* Other header cells with updated styling */}
                            {[
                                'type',
                                'elevators',
                                'parking',
                                'gatehouseFrontDesk',
                                'emergencyExit',
                                'backupLights',
                                'landingPad',
                                'secretOrAltEntrance',
                                'ownership',
                                'securityPersonnel',
                                'style',
                                'event',
                                'secret',
                            ].map((key) => (
                                <TableCell
                                    key={key}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: readerMode ? '#333' : colors.neons.cyan.default,
                                        borderBottom: readerMode
                                            ? '1px solid #ddd'
                                            : `1px solid ${colors.neons.cyan.dark}`,
                                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                        ...(readerMode
                                            ? {
                                                  color: '#333 !important',
                                                  textShadow: 'none !important',
                                                  backgroundColor: '#f5f5f5 !important',
                                                  borderBottom: '1px solid #ddd !important',
                                              }
                                            : {}),
                                    }}
                                >
                                    {translateLabel(t, key, 'buildings')}
                                </TableCell>
                            ))}
                            {/* Add header cell for actions */}
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    color: readerMode ? '#333' : colors.neons.cyan.default,
                                    borderBottom: readerMode ? '1px solid #ddd' : `1px solid ${colors.neons.cyan.dark}`,
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                    width: '60px',
                                    textAlign: 'center',
                                    ...(readerMode
                                        ? {
                                              color: '#333 !important',
                                              textShadow: 'none !important',
                                              backgroundColor: '#f5f5f5 !important',
                                              borderBottom: '1px solid #ddd !important',
                                          }
                                        : {}),
                                }}
                            >
                                {t('common.actions', 'Actions')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {buildings.map((building, index) => {
                            // Generate localized name for the table row
                            const localizedName = generateLocalizedBuildingName(building, t)

                            return (
                                <TableRow
                                    key={index}
                                    sx={{
                                        ...(readerMode
                                            ? {
                                                  '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                                                  '&:nth-of-type(even)': { bgcolor: '#fff' },
                                                  '&:hover': {
                                                      bgcolor: '#f0f0f0',
                                                  },
                                              }
                                            : {
                                                  '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 15, 30, 0.4)' },
                                                  '&:nth-of-type(even)': { bgcolor: 'rgba(0, 20, 40, 0.2)' },
                                                  '&:hover': {
                                                      bgcolor: 'rgba(0, 255, 255, 0.1)',
                                                      '& .cell-content': {
                                                          color: colors.neons.cyan.default,
                                                          textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                                      },
                                                  },
                                              }),
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            position: 'sticky',
                                            left: 0,
                                            bgcolor: index % 2 === 0 ? 'rgba(0, 15, 30, 0.4)' : 'rgba(0, 20, 40, 0.2)',
                                            zIndex: 1,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            textShadow: `0 0 5px ${colors.neons.green.dark}`,
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      backgroundColor:
                                                          index % 2 === 0 ? '#f9f9f9 !important' : '#fff !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {localizedName}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('type', building.type)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('elevators', building.elevators)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('parking', building.parking)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('gatehouseFrontDesk', building.gatehouseFrontDesk)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('emergencyExit', building.emergencyExit)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('backupLights', building.backupLights)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('landingPad', building.landingPad)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('secretOrAltEntrance', building.secretOrAltEntrance)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('ownership', building.ownership)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('securityPersonnel', building.securityPersonnel)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('style', building.style)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('event', building.event)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: colors.neons.green.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            ...(readerMode
                                                ? {
                                                      color: '#333 !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('secret', building.secret)}
                                    </TableCell>
                                    {/* Add delete button */}
                                    <TableCell
                                        sx={{
                                            color: colors.neons.red.default,
                                            borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                            textAlign: 'center',
                                            ...(readerMode
                                                ? {
                                                      color: '#d32f2f !important',
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                  }
                                                : {}),
                                        }}
                                    >
                                        <Button
                                            onClick={() => handleDeleteClick(index)}
                                            sx={{
                                                minWidth: '30px',
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '2px',
                                                p: 0,
                                                bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                                color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                                border: readerMode
                                                    ? '1px solid #d32f2f'
                                                    : `1px solid ${colors.neons.red.default}60`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                position: 'relative',
                                                fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                                fontWeight: 'bold',
                                                '&::before': !readerMode
                                                    ? {
                                                          content: '""',
                                                          position: 'absolute',
                                                          top: 0,
                                                          left: 0,
                                                          width: '100%',
                                                          height: '1px',
                                                          background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                                          opacity: 0.7,
                                                      }
                                                    : {},
                                                '&:hover': readerMode
                                                    ? {
                                                          bgcolor: '#f0f0f0',
                                                          color: '#b71c1c',
                                                      }
                                                    : {
                                                          bgcolor: 'rgba(60, 0, 0, 0.6)',
                                                          color: colors.neons.red.light,
                                                          transform: 'scale(1.05)',
                                                          boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                                          '&::after': {
                                                              opacity: 0.8,
                                                              height: '100%',
                                                          },
                                                      },
                                                '&::after': !readerMode
                                                    ? {
                                                          content: '""',
                                                          position: 'absolute',
                                                          bottom: 0,
                                                          left: 0,
                                                          width: '100%',
                                                          height: '0%',
                                                          opacity: 0,
                                                          background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                                          transition: 'all 0.2s',
                                                      }
                                                    : {},
                                            }}
                                        >
                                            <span
                                                style={{
                                                    textShadow: `0 0 5px ${colors.neons.red.default}`,
                                                    zIndex: 2,
                                                    animation: `${buttonGlitch} 5s infinite`,
                                                }}
                                            >
                                                ✕
                                            </span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        )
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

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                        sx={{
                            color: '#FFF',
                            textShadow: '0 0 5px rgba(0, 255, 255, 0.5)',
                            fontFamily: '"Orbitron", monospace',
                            mr: 1,
                            fontSize: '0.85rem',
                        }}
                    >
                        {t('buildings.jobType', 'Job type:')}
                    </Typography>
                    <ToggleButtonGroup
                        value={jobType}
                        exclusive
                        onChange={handleJobTypeChange}
                        aria-label="job type"
                        sx={{
                            gap: '0px',
                            background: 'rgba(0, 20, 40, 0.7)',
                            p: '2px',
                            border: `1px solid ${
                                jobType === JobType.EASY
                                    ? 'rgba(0, 255, 0, 0.3)'
                                    : jobType === JobType.TYPICAL
                                    ? 'rgba(255, 255, 0, 0.3)'
                                    : 'rgba(255, 0, 0, 0.3)'
                            }`,
                            borderRadius: '3px',
                            boxShadow:
                                jobType === JobType.EASY
                                    ? '0 0 10px rgba(0, 255, 0, 0.2), inset 0 0 5px rgba(0, 255, 0, 0.2)'
                                    : jobType === JobType.TYPICAL
                                    ? '0 0 10px rgba(255, 255, 0, 0.2), inset 0 0 5px rgba(255, 255, 0, 0.2)'
                                    : '0 0 10px rgba(255, 0, 0, 0.2), inset 0 0 5px rgba(255, 0, 0, 0.2)',
                            position: 'relative',
                            animation:
                                jobType === JobType.EASY
                                    ? `${pulseGlow} 4s infinite`
                                    : jobType === JobType.TYPICAL
                                    ? `${pulseGlowYellow} 4s infinite`
                                    : `${pulseGlowRed} 4s infinite`,
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                background:
                                    jobType === JobType.EASY
                                        ? 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.5), transparent)'
                                        : jobType === JobType.TYPICAL
                                        ? 'linear-gradient(90deg, transparent, rgba(255, 255, 0, 0.5), transparent)'
                                        : 'linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.5), transparent)',
                                zIndex: 2,
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                background:
                                    jobType === JobType.EASY
                                        ? 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.3), transparent)'
                                        : jobType === JobType.TYPICAL
                                        ? 'linear-gradient(90deg, transparent, rgba(255, 255, 0, 0.3), transparent)'
                                        : 'linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.3), transparent)',
                                zIndex: 2,
                            },
                        }}
                    >
                        <ToggleButton
                            value={JobType.EASY}
                            aria-label="easy"
                            sx={{
                                color: colors.neons.green.default,
                                bgcolor: 'rgba(0, 30, 0, 0.4)',
                                border: 'none',
                                borderColor: 'transparent',
                                px: 3,
                                fontFamily: '"Orbitron", monospace',
                                letterSpacing: '1px',
                                textShadow: `0 0 5px ${colors.neons.green.dark}`,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 40, 0, 0.5)',
                                    color: '#FFFFFF',
                                    textShadow: `0 0 8px ${colors.neons.green.default}, 0 0 12px ${colors.neons.green.default}`,
                                    boxShadow: `0 0 8px ${colors.neons.green.default}60`,
                                    '&::after': {
                                        opacity: 0.1,
                                        background: `linear-gradient(135deg, transparent 0%, ${colors.neons.green.default}30 50%, transparent 100%)`,
                                    },
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(0, 50, 0, 0.7)',
                                    color: '#FFFFFF',
                                    boxShadow: `0 0 10px ${colors.neons.green.default}80, inset 0 0 8px ${colors.neons.green.default}`,
                                    textShadow: `0 0 8px ${colors.neons.green.default}, 0 0 15px ${colors.neons.green.default}`,
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 60, 0, 0.8)',
                                        color: '#FFFFFF',
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
                                },
                                height: 36.5,
                            }}
                        >
                            {t('buildings.jobTypes.easy', 'EASY')}{' '}
                            <span style={{ opacity: 0.7, marginLeft: '4px' }}>+0</span>
                        </ToggleButton>
                        <ToggleButton
                            value={JobType.TYPICAL}
                            aria-label="typical"
                            sx={{
                                color: colors.neons.yellow.default,
                                bgcolor: 'rgba(30, 30, 0, 0.4)',
                                border: 'none',
                                borderColor: 'transparent',
                                px: 3,
                                fontFamily: '"Orbitron", monospace',
                                letterSpacing: '1px',
                                textShadow: `0 0 5px ${colors.neons.yellow.dark}`,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    bgcolor: 'rgba(40, 40, 0, 0.5)',
                                    color: '#FFFFFF',
                                    textShadow: `0 0 8px ${colors.neons.yellow.default}, 0 0 12px ${colors.neons.yellow.default}`,
                                    boxShadow: `0 0 8px ${colors.neons.yellow.default}60`,
                                    '&::after': {
                                        opacity: 0.1,
                                        background: `linear-gradient(135deg, transparent 0%, ${colors.neons.yellow.default}30 50%, transparent 100%)`,
                                    },
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(50, 50, 0, 0.7)',
                                    color: '#FFFFFF',
                                    boxShadow: `0 0 10px ${colors.neons.yellow.default}80, inset 0 0 8px ${colors.neons.yellow.default}`,
                                    textShadow: `0 0 8px ${colors.neons.yellow.default}, 0 0 15px ${colors.neons.yellow.default}`,
                                    '&:hover': {
                                        bgcolor: 'rgba(60, 60, 0, 0.8)',
                                        color: '#FFFFFF',
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
                                        animation: `${pulseGlow} 2s infinite`,
                                    },
                                },
                                height: 36.5,
                            }}
                        >
                            {t('buildings.jobTypes.typical', 'TYPICAL')}{' '}
                            <span style={{ opacity: 0.7, marginLeft: '4px' }}>+1</span>
                        </ToggleButton>
                        <ToggleButton
                            value={JobType.DANGEROUS}
                            aria-label="dangerous"
                            sx={{
                                color: colors.neons.red.default,
                                bgcolor: 'rgba(30, 0, 0, 0.4)',
                                border: 'none',
                                borderColor: 'transparent',
                                px: 3,
                                fontFamily: '"Orbitron", monospace',
                                letterSpacing: '1px',
                                textShadow: `0 0 5px ${colors.neons.red.dark}`,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    bgcolor: 'rgba(40, 0, 0, 0.5)',
                                    color: '#FFFFFF',
                                    textShadow: `0 0 8px ${colors.neons.red.default}, 0 0 12px ${colors.neons.red.default}`,
                                    boxShadow: `0 0 8px ${colors.neons.red.default}60`,
                                    '&::after': {
                                        opacity: 0.1,
                                        background: `linear-gradient(135deg, transparent 0%, ${colors.neons.red.default}30 50%, transparent 100%)`,
                                    },
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(50, 0, 0, 0.7)',
                                    color: '#FFFFFF',
                                    boxShadow: `0 0 10px ${colors.neons.red.default}80, inset 0 0 8px ${colors.neons.red.default}`,
                                    textShadow: `0 0 8px ${colors.neons.red.default}, 0 0 15px ${colors.neons.red.default}`,
                                    '&:hover': {
                                        bgcolor: 'rgba(60, 0, 0, 0.8)',
                                        color: '#FFFFFF',
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
                                        animation: `${pulseGlow} 2s infinite`,
                                    },
                                },
                                height: 36.5,
                            }}
                        >
                            {t('buildings.jobTypes.dangerous', 'DANGEROUS')}{' '}
                            <span style={{ opacity: 0.7, marginLeft: '4px' }}>+2</span>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
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

                    {/* View Toggle Buttons - Moved next to generate button and styled more cyberpunk */}
                    <ToggleButtonGroup
                        value={compactView ? 'table' : 'grid'}
                        exclusive
                        onChange={handleViewChange}
                        aria-label="view mode"
                        disabled={buildings.length === 0}
                        sx={{
                            gap: '0px',
                            background: 'rgba(0, 20, 40, 0.7)',
                            p: '2px',
                            border: `1px solid ${compactView ? 'rgba(0, 100, 255, 0.3)' : 'rgba(0, 200, 255, 0.3)'}`,
                            borderRadius: '3px',
                            boxShadow: compactView
                                ? '0 0 10px rgba(0, 100, 255, 0.2), inset 0 0 5px rgba(0, 100, 255, 0.2)'
                                : '0 0 10px rgba(0, 200, 255, 0.2), inset 0 0 5px rgba(0, 150, 255, 0.2)',
                            position: 'relative',
                            animation: compactView ? `${pulseGlowBlue} 4s infinite` : `${pulseGlowCyan} 4s infinite`,
                            '&::before': {
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
                            },
                            '&::after': {
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
                            },
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
                            aria-label="table view"
                            sx={{
                                color: colors.neons.blue.default,
                                bgcolor: 'transparent',
                                border: 'none',
                                borderColor: 'transparent',
                                px: 2,
                                py: 1,
                                fontFamily: '"Orbitron", monospace',
                                letterSpacing: '1px',
                                fontSize: '0.8rem',
                                textShadow: `0 0 5px ${colors.neons.blue.dark}`,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '10%',
                                    width: '0%',
                                    height: '1px',
                                    background: colors.neons.blue.default,
                                    transition: 'width 0.3s ease',
                                    opacity: 0,
                                },
                                '&:hover': {
                                    bgcolor: 'rgba(0, 20, 40, 0.7)',
                                    color: '#FFFFFF',
                                    textShadow: `0 0 8px ${colors.neons.blue.default}, 0 0 12px ${colors.neons.blue.default}`,
                                    '&::after': {
                                        width: '80%',
                                        opacity: 1,
                                        boxShadow: `0 0 8px ${colors.neons.blue.default}`,
                                    },
                                },
                                '&.Mui-selected': {
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
                                        top: '150px',
                                        left: 0,
                                        width: '100%',
                                        height: '2px',
                                        background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                        boxShadow: `0 0 10px ${colors.neons.blue.default}`,
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
                                        background: colors.neons.blue.default,
                                        opacity: 1,
                                        boxShadow: `0 0 8px ${colors.neons.blue.default}`,
                                    },
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(0, 100, 255, 0.3)',
                                },
                                height: 32,
                            }}
                        >
                            <TableViewIcon sx={{ mr: 1, fontSize: '1rem' }} />
                            {t('common.tableView')}
                        </ToggleButton>
                        <ToggleButton
                            value="grid"
                            aria-label="grid view"
                            sx={{
                                color: colors.neons.cyan.default,
                                bgcolor: 'transparent',
                                border: 'none',
                                borderColor: 'transparent',
                                px: 2,
                                py: 1,
                                fontFamily: '"Orbitron", monospace',
                                letterSpacing: '1px',
                                fontSize: '0.8rem',
                                textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '10%',
                                    width: '0%',
                                    height: '1px',
                                    background: colors.neons.cyan.default,
                                    transition: 'width 0.3s ease',
                                    opacity: 0,
                                },
                                '&:hover': {
                                    bgcolor: 'rgba(0, 30, 40, 0.7)',
                                    color: '#FFFFFF',
                                    textShadow: `0 0 8px ${colors.neons.cyan.default}, 0 0 12px ${colors.neons.cyan.default}`,
                                    '&::after': {
                                        width: '80%',
                                        opacity: 1,
                                        boxShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                    },
                                },
                                '&.Mui-selected': {
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
                                        animation: `${pulseGlow} 2s infinite`,
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
                                '&.Mui-disabled': {
                                    color: 'rgba(0, 200, 255, 0.3)',
                                },
                                height: 32,
                            }}
                        >
                            <GridViewIcon sx={{ mr: 1, fontSize: '1rem' }} />
                            {t('common.detailedView')}
                        </ToggleButton>
                    </ToggleButtonGroup>
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
                renderCompactView()
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {buildings.map((building, index) => renderDetailedView(building, index))}
                </Grid>
            )}

            {/* Add confirmation dialogs */}
            {/* Dialog for deleting a single building */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(10, 15, 30, 0.95)',
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${colors.neons.red.default}40`,
                        boxShadow: `0 0 20px ${colors.neons.red.default}40`,
                        color: '#fff',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage:
                                'linear-gradient(to right, rgba(255, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 0, 0.03) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            pointerEvents: 'none',
                            opacity: 0.5,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: colors.neons.red.default,
                        textShadow: `0 0 5px ${colors.neons.red.default}`,
                        fontFamily: '"Orbitron", monospace',
                        borderBottom: `1px solid ${colors.neons.red.default}40`,
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: '10%',
                            width: '80%',
                            height: '1px',
                            background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                        },
                    }}
                >
                    {t('buildings.deleteConfirmation.title', 'Confirm Deletion')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        sx={{
                            color: '#ddd',
                            mt: 2,
                            fontFamily: '"Rajdhani", sans-serif',
                        }}
                    >
                        {t(
                            'buildings.deleteConfirmation.message',
                            'Are you sure you want to delete this building? This action cannot be undone.'
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleDeleteCancel}
                        sx={{
                            bgcolor: 'rgba(10, 20, 30, 0.6)',
                            color: colors.neons.cyan.default,
                            border: `1px solid ${colors.neons.cyan.default}40`,
                            '&:hover': {
                                bgcolor: 'rgba(0, 30, 60, 0.8)',
                                boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                            },
                        }}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        autoFocus
                        sx={{
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
                        }}
                    >
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for clearing all buildings */}
            <Dialog
                open={clearAllDialogOpen}
                onClose={handleClearCancel}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(10, 15, 30, 0.95)',
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${colors.neons.red.default}40`,
                        boxShadow: `0 0 20px ${colors.neons.red.default}40`,
                        color: '#fff',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage:
                                'linear-gradient(to right, rgba(255, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 0, 0.03) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            pointerEvents: 'none',
                            opacity: 0.5,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: colors.neons.red.default,
                        textShadow: `0 0 5px ${colors.neons.red.default}`,
                        fontFamily: '"Orbitron", monospace',
                        borderBottom: `1px solid ${colors.neons.red.default}40`,
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: '10%',
                            width: '80%',
                            height: '1px',
                            background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                        },
                    }}
                >
                    {t('buildings.clearConfirmation.title', 'Confirm Clear All')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        sx={{
                            color: '#ddd',
                            mt: 2,
                            fontFamily: '"Rajdhani", sans-serif',
                        }}
                    >
                        {t(
                            'buildings.clearConfirmation.message',
                            'Are you sure you want to clear all buildings? This action cannot be undone.'
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleClearCancel}
                        sx={{
                            bgcolor: 'rgba(10, 20, 30, 0.6)',
                            color: colors.neons.cyan.default,
                            border: `1px solid ${colors.neons.cyan.default}40`,
                            '&:hover': {
                                bgcolor: 'rgba(0, 30, 60, 0.8)',
                                boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                            },
                        }}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleClearConfirm}
                        autoFocus
                        sx={{
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
                        }}
                    >
                        {t('common.clearAll', 'Clear All')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}

export default Building
