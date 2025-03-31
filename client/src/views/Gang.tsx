import { keyframes } from '@emotion/react'
import GridView from '@mui/icons-material/GridView'
import TableView from '@mui/icons-material/TableView'
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
import { GangColor, GangName, Gang as GangType, GangType as GangTypeEnum, Quality } from '../graphql/types'
import colors from '../utils/colors'
import { generateRandomGang } from '../utils/generators'
import { translateEnum, translateLabel } from '../utils/i18nUtils'
import { clearGangs, loadGangs, saveGangs } from '../utils/storage'

// Type for our gang with display properties
type DisplayGang = GangType & {
    displayName: string
    description: string
    _nameComponents?: {
        name: GangName
        color: GangColor
        type: GangTypeEnum
    }
    _descriptionData?: {
        gang: GangType
        nameComponents: {
            name: GangName
            color: GangColor
            type: GangTypeEnum
        }
    }
}

// Add global property to window object
declare global {
    interface Window {
        gangsDataLoaded?: boolean
        buildingsDataLoaded?: boolean
    }
}

// Function to generate display name for the current language
const generateLocalizedGangName = (gang: DisplayGang, t: TFunction): string => {
    if (!gang._nameComponents) {
        return gang.displayName // Fallback to stored name
    }

    const { name, color, type } = gang._nameComponents

    // These are the same in both languages
    const adjectives: Record<GangName, string[]> = {
        [GangName.ADJECTIVE]: ['Wild', 'Fierce', 'Deadly', 'Savage', 'Brutal', 'Lethal', 'Ruthless', 'Merciless'],
        [GangName.ANIMAL]: ['Wolf', 'Lion', 'Tiger', 'Snake', 'Dragon', 'Scorpion', 'Shark', 'Panther'],
        [GangName.BODY_PART]: ['Skull', 'Fist', 'Eye', 'Brain', 'Heart', 'Hand', 'Blood', 'Bone'],
        [GangName.COLOR]: [color.toLowerCase().charAt(0).toUpperCase() + color.toLowerCase().slice(1)],
        [GangName.NEIGHBORHOOD]: ['Downtown', 'Eastside', 'Westside', 'Northside', 'Southside', 'Central', 'Outskirts'],
        [GangName.NUMBER]: ['13', '7', '101', '666', '777', '187', '911', '420'],
        [GangName.PLACE]: ['Street', 'Alley', 'Avenue', 'Highway', 'Boulevard', 'District', 'Zone', 'Block'],
        [GangName.PROFESSION]: ['Techie', 'Runner', 'Fixer', 'Solo', 'Nomad', 'Medic', 'Corporate', 'Cop'],
        [GangName.WEAPON]: ['Blade', 'Gun', 'Rifle', 'Pistol', 'Shotgun', 'Knife', 'Sword', 'Katana'],
        [GangName.WEATHER_PHENOMENA]: [
            'Thunder',
            'Lightning',
            'Storm',
            'Cyclone',
            'Typhoon',
            'Hurricane',
            'Tornado',
            'Tsunami',
        ],
    }

    // These would be translated
    const suffixes: Record<GangTypeEnum, string[]> = {
        [GangTypeEnum.BOOSTER]: [
            'Demons',
            'Devils',
            'Killers',
            'Savages',
            'Warriors',
            'Thugs',
            'Destroyers',
            'Reapers',
        ],
        [GangTypeEnum.EDGERUNNER]: [
            'Runners',
            'Edges',
            'Shadows',
            'Ghosts',
            'Phantoms',
            'Spectres',
            'Wraiths',
            'Vectors',
        ],
        [GangTypeEnum.FREELANCER]: [
            'Freelancers',
            'Mercs',
            'Guns',
            'Soldiers',
            'Contractors',
            'Agents',
            'Operatives',
            'Professionals',
        ],
        [GangTypeEnum.GUARDIAN_VIGILANTE]: [
            'Guardians',
            'Protectors',
            'Shields',
            'Watchers',
            'Sentinels',
            'Wardens',
            'Keepers',
            'Defenders',
        ],
        [GangTypeEnum.MILITARY]: ['Command', 'Battalion', 'Squad', 'Platoon', 'Corps', 'Force', 'Division', 'Regiment'],
        [GangTypeEnum.POSER]: [
            'Posers',
            'Wannabes',
            'Fakers',
            'Pretenders',
            'Imitators',
            'Copycats',
            'Followers',
            'Imposters',
        ],
        [GangTypeEnum.PRANKSTER]: [
            'Jokers',
            'Tricksters',
            'Jesters',
            'Fools',
            'Clowns',
            'Pranksters',
            'Comedians',
            'Mimes',
        ],
        [GangTypeEnum.RELIGIOUS]: [
            'Disciples',
            'Believers',
            'Faithful',
            'Devotees',
            'Followers',
            'Prophets',
            'Saints',
            'Angels',
        ],
        [GangTypeEnum.SYNDICATE]: ['Syndicate', 'Family', 'Mob', 'Clan', 'Cartel', 'Outfit', 'Organization', 'Network'],
        [GangTypeEnum.YO]: ['Boys', 'Girls', 'Crew', 'Squad', 'Homies', 'Gang', 'Posse', 'Team'],
    }

    const adjective = adjectives[name][0]
    const suffix = suffixes[type][0]

    // Support "The" in different languages
    return `${t('common.the')} ${adjective} ${suffix}`
}

// Function to generate description for the current language
const generateLocalizedGangDescription = (gang: DisplayGang, t: TFunction): string => {
    if (!gang._descriptionData?.gang) {
        return gang.description // Fallback to stored description
    }

    const g = gang._descriptionData.gang
    let description = ''

    // Generate the display name for this language
    const displayName = generateLocalizedGangName(gang, t)

    // Basic information about the gang
    const typeTranslation = translateEnum(t, g.type, 'gangs.type')
    const colorTranslation = translateEnum(t, g.color, 'gangs.color')

    description += `${displayName} ${t('gangs.descriptions.is')} ${typeTranslation} ${t(
        'gangs.descriptions.knownForColors'
    )} ${colorTranslation.toLowerCase()} ${t('gangs.descriptions.colors')}. `

    // Knowledge and skill
    let memberQty
    if (g.quality === Quality.EXCELLENT) {
        memberQty = t('gangs.descriptions.largeNumber')
    } else if (g.quality === Quality.STANDARD) {
        memberQty = t('gangs.descriptions.several')
    } else {
        memberQty = t('gangs.descriptions.few')
    }

    description += `${t('gangs.descriptions.withMembers', { quality: memberQty, skill: g.skill })} `

    // Known for information
    const knownForPart1Translation = translateEnum(t, g.knownFor.knownForPart1, 'gangs.knownForPart1')
    const knownForPart2Translation = translateEnum(t, g.knownFor.knownForPart2, 'gangs.knownForPart2')

    description += `${t(
        'gangs.descriptions.theyAreKnownFor'
    )} ${knownForPart1Translation} ${knownForPart2Translation}. `

    // Current attitude
    if (g.currentAttitude) {
        const attitudeTranslation = translateEnum(t, g.currentAttitude, 'gangs.attitude')
        description += `${t('gangs.descriptions.currentAttitude')} ${attitudeTranslation}. `
    }

    // Flaw
    if (g.flaw) {
        const flawTranslation = translateEnum(t, g.flaw, 'gangs.flaw')
        description += `${t('gangs.descriptions.mainWeakness')} ${flawTranslation}. `
    }

    // Status
    const statusTranslation = translateEnum(t, g.status, 'gangs.status')
    description += `${t('gangs.descriptions.powerStructure')} ${statusTranslation}. `

    // News
    if (g.newsTheLeaderIsReceiving) {
        const newsTranslation = translateEnum(t, g.newsTheLeaderIsReceiving, 'gangs.news')
        description += `${t('gangs.descriptions.latestNews')} ${newsTranslation}.`
    }

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
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const firstMountRef = useRef(true)

    // Load gangs from local storage on component mount
    useEffect(() => {
        // Get data from local storage
        const savedGangs = loadGangs()

        // Set the initial data without triggering a save
        if (savedGangs.length > 0) {
            setGangs(savedGangs as unknown as DisplayGang[])

            // Only show the load notification on the first load of the app session
            if (!window.gangsDataLoaded && savedGangs.length > 0) {
                window.gangsDataLoaded = true
                setIsLoading(true)
            }
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
            saveGangs(gangs)
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

    // Process complex nested objects for display
    const processValueForDisplay = (key: string, value: unknown): string => {
        if (value === null || value === undefined) {
            return 'N/A'
        }

        if (typeof value === 'object') {
            const valueObj = value as Record<string, unknown>

            // Handle specific nested objects
            if (key === 'armor' && 'h' in valueObj && 'spb' in valueObj) {
                return `${valueObj.h}/${valueObj.spb}`
            }

            if (key === 'knownFor' && 'knownForPart1' in valueObj && 'knownForPart2' in valueObj) {
                const part1 = translateEnum(t, valueObj.knownForPart1 as string, 'gangs.knownForPart1')
                const part2 = translateEnum(t, valueObj.knownForPart2 as string, 'gangs.knownForPart2')
                return `${part1} ${part2}`
            }

            // For weapons or other complex objects
            if (key === 'weapons') {
                if ('d6' in valueObj) return `${valueObj.d6}d6` // Show most common dice format
                return Object.entries(valueObj)
                    .filter(([weaponKey]) => weaponKey !== '__typename')
                    .map(([weaponKey, weaponValue]) => `${weaponKey}: ${weaponValue}`)
                    .join(', ')
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
                type: 'gangs.type',
                quality: 'gangs.quality',
                status: 'gangs.status',
                color: 'gangs.color',
                name: 'gangs.name',
                sin: 'gangs.sin',
                flaw: 'gangs.flaw',
                currentAttitude: 'gangs.attitude',
                newsTheLeaderIsReceiving: 'gangs.news',
            }

            if (namespaceMap[key]) {
                return translateEnum(t, value, namespaceMap[key])
            }
        }

        return String(value)
    }

    // Get color based on gang color enum
    const getGangColorValue = (gangColor: string): string => {
        const colorMap: Record<string, string> = {
            BLACK: colors.grays.gray400,
            BLUE: colors.blues.default,
            BRIGHTS: colors.neons.cyan.default,
            BROWNS: '#8B4513', // Saddle brown
            GREEN: colors.greens.default,
            ORANGE: colors.oranges.default,
            RED: colors.reds.default,
            VIOLET: colors.purples.default,
            WHITE: colors.grays.gray800,
            YELLOW: colors.yellows.default,
        }

        return colorMap[gangColor] || colors.grays.gray400
    }

    // Priority order for display in the table, matching the reference
    const getOrderedGangData = (gang: DisplayGang) => {
        return [
            { key: 'type', label: translateLabel(t, 'type', 'gangs'), value: gang.type },
            { key: 'quality', label: translateLabel(t, 'quality', 'gangs'), value: gang.quality },
            { key: 'skill', label: translateLabel(t, 'skill', 'gangs'), value: gang.skill },
            { key: 'weapons', label: translateLabel(t, 'weapons', 'gangs'), value: gang.weapons },
            { key: 'armor', label: translateLabel(t, 'armor', 'gangs'), value: gang.armor },
            { key: 'secretive', label: translateLabel(t, 'secretive', 'gangs'), value: gang.secretive },
            { key: 'status', label: translateLabel(t, 'status', 'gangs'), value: gang.status },
            { key: 'color', label: translateLabel(t, 'color', 'gangs'), value: gang.color },
            { key: 'name', label: translateLabel(t, 'name', 'gangs'), value: gang.name },
            { key: 'sin', label: translateLabel(t, 'sin', 'gangs'), value: gang.sin },
            { key: 'knownFor', label: translateLabel(t, 'knownFor', 'gangs'), value: gang.knownFor },
            { key: 'flaw', label: translateLabel(t, 'flaw', 'gangs'), value: gang.flaw },
            {
                key: 'currentAttitude',
                label: translateLabel(t, 'currentAttitude', 'gangs'),
                value: gang.currentAttitude,
            },
            {
                key: 'newsTheLeaderIsReceiving',
                label: translateLabel(t, 'newsTheLeaderIsReceiving', 'gangs'),
                value: gang.newsTheLeaderIsReceiving,
            },
        ]
    }

    // Render the detailed view with description and table
    const renderDetailedView = (gang: DisplayGang, index: number) => {
        const gangData = getOrderedGangData(gang)

        // Generate localized name and description
        const localizedName = generateLocalizedGangName(gang, t)
        const localizedDescription = generateLocalizedGangDescription(gang, t)

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
                            background: `linear-gradient(90deg, transparent, ${getGangColorValue(
                                gang.color
                            )}, transparent)`,
                            boxShadow: `0 0 15px ${getGangColorValue(gang.color)}`,
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
                                        color: getGangColorValue(gang.color),
                                        fontFamily: 'Orbitron, sans-serif',
                                    }}
                                >
                                    {localizedName}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 'normal',
                                        color: '#aaa',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {processValueForDisplay('type', gang.type).toUpperCase()}
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
                                borderBottom: `1px solid rgba(${getGangColorValue(gang.color)
                                    .replace('#', '')
                                    .match(/.{2}/g)
                                    ?.map((hex) => parseInt(hex, 16))
                                    .join(',')}, 0.3)`,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '1px',
                                    background: `linear-gradient(90deg, transparent, ${getGangColorValue(
                                        gang.color
                                    )}, transparent)`,
                                    opacity: 0.5,
                                },
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#ddd',
                                    fontStyle: 'italic',
                                    textShadow: '0 0 2px rgba(0,0,0,0.8)',
                                    position: 'relative',
                                    zIndex: 2,
                                    ...(readerMode && {
                                        color: '#333 !important',
                                        textShadow: 'none !important',
                                        fontStyle: 'normal',
                                    }),
                                }}
                            >
                                {localizedDescription}
                            </Typography>
                        </Box>

                        {/* Data Table */}
                        <TableContainer
                            sx={{
                                bgcolor: 'rgba(10, 15, 30, 0.8)',
                                backdropFilter: 'blur(3px)',
                                position: 'relative',
                            }}
                        >
                            <Table size="small">
                                <TableBody>
                                    {gangData.map((item) => {
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

    // Render compact table view for all gangs
    const renderCompactView = () => {
        if (gangs.length === 0) return null

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
                                    color: colors.neons.cyan.default,
                                    position: 'sticky',
                                    left: 0,
                                    bgcolor: 'rgba(0, 255, 255, 0.05)',
                                    zIndex: 2,
                                    borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
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
                                {t('gangs.labels.name', 'Name')}
                            </TableCell>
                            {/* Other header cells with updated styling */}
                            {[
                                'type',
                                'quality',
                                'skill',
                                'weapons',
                                'armor',
                                'secretive',
                                'status',
                                'color',
                                'name',
                                'sin',
                                'knownFor',
                                'flaw',
                                'currentAttitude',
                                'newsTheLeaderIsReceiving',
                            ].map((key) => (
                                <TableCell
                                    key={key}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: colors.neons.cyan.default,
                                        borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                        textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
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
                                    {translateLabel(t, key, 'gangs')}
                                </TableCell>
                            ))}
                            {/* Add header cell for actions */}
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    color: colors.neons.cyan.default,
                                    borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
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
                        {gangs.map((gang, index) => {
                            // Generate localized name
                            const localizedName = generateLocalizedGangName(gang, t)

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
                                        {processValueForDisplay('type', gang.type)}
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
                                        {processValueForDisplay('quality', gang.quality)}
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
                                        {gang.skill}
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
                                        {processValueForDisplay('weapons', gang.weapons)}
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
                                        {processValueForDisplay('armor', gang.armor)}
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
                                        {gang.secretive}
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
                                        {processValueForDisplay('status', gang.status)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            ...(readerMode
                                                ? {
                                                      color: getGangColorValue(gang.color),
                                                      textShadow: 'none !important',
                                                      borderBottom: '1px solid #ddd !important',
                                                      fontWeight: 'bold',
                                                  }
                                                : {
                                                      color: getGangColorValue(gang.color),
                                                      fontWeight: 'bold',
                                                      borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                      textShadow: `0 0 5px ${getGangColorValue(gang.color)}`,
                                                  }),
                                        }}
                                        className="cell-content"
                                    >
                                        {processValueForDisplay('color', gang.color)}
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
                                        {processValueForDisplay('name', gang.name)}
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
                                        {gang.sin ? processValueForDisplay('sin', gang.sin) : '-'}
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
                                        {processValueForDisplay('knownFor', gang.knownFor)}
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
                                        {gang.flaw ? processValueForDisplay('flaw', gang.flaw) : '-'}
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
                                        {gang.currentAttitude
                                            ? processValueForDisplay('currentAttitude', gang.currentAttitude)
                                            : '-'}
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
                                        {gang.newsTheLeaderIsReceiving
                                            ? processValueForDisplay(
                                                  'newsTheLeaderIsReceiving',
                                                  gang.newsTheLeaderIsReceiving
                                              )
                                            : '-'}
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
                                                    textShadow: readerMode
                                                        ? 'none'
                                                        : `0 0 5px ${colors.neons.red.default}`,
                                                    zIndex: 2,
                                                    animation: readerMode ? 'none' : `${buttonGlitch} 5s infinite`,
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
                    className={'glitch-text'}
                    data-text={t('gangs.title')}
                    sx={{
                        color: colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        ...(readerMode && {
                            color: '#333 !important',
                            textShadow: 'none !important',
                        }),
                    }}
                >
                    {t('gangs.title')}
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
                        <span className="generate-text">{t('gangs.generateButton').toUpperCase()}</span>
                    </Button>

                    {/* View Toggle Buttons - Moved next to generate button and styled more cyberpunk */}
                    <ToggleButtonGroup
                        value={compactView ? 'table' : 'grid'}
                        exclusive
                        onChange={handleViewChange}
                        aria-label="view mode"
                        disabled={gangs.length === 0}
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
                                    bgcolor: 'rgba(0, 40, 50, 0.9)',
                                    color: '#FFFFFF',
                                    boxShadow: `inset 0 0 10px ${colors.neons.blue.default}40, 0 0 8px ${colors.neons.blue.default}80`,
                                    textShadow: `0 0 8px ${colors.neons.blue.default}, 0 0 15px ${colors.neons.blue.default}`,
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 50, 60, 0.95)',
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
                                        animation: `${pulseGlowBlue} 2s infinite`,
                                    },
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(0, 100, 255, 0.3)',
                                },
                                height: 32,
                            }}
                        >
                            <TableView sx={{ mr: 1, fontSize: '1rem' }} />
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
                                        top: '150px',
                                        left: 0,
                                        width: '100%',
                                        height: '2px',
                                        background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                        boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                        zIndex: 2,
                                        animation: `${pulseGlowCyan} 2s infinite`,
                                    },
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(0, 200, 255, 0.3)',
                                },
                                height: 32,
                            }}
                        >
                            <GridView sx={{ mr: 1, fontSize: '1rem' }} />
                            {t('common.detailedView')}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllClick}
                    disabled={gangs.length === 0}
                    sx={{
                        position: 'relative',
                        bgcolor: 'rgba(40, 20, 20, 0.8)',
                        borderColor: colors.neons.red.default,
                        color: colors.neons.red.default,
                        textShadow: `0 0 5px ${colors.neons.red.default}`,
                        fontFamily: '"Orbitron", monospace',
                        letterSpacing: '0.1em',
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
                    <span className="button-text">{t('common.clear').toUpperCase()}</span>
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
                renderCompactView()
            ) : (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {gangs.map((gang, index) => renderDetailedView(gang, index))}
                </Grid>
            )}

            {/* Dialog for deleting a single gang */}
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
                    {t('gangs.deleteConfirmation.title', 'Confirm Deletion')}
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
                            'gangs.deleteConfirmation.message',
                            'Are you sure you want to delete this gang? This action cannot be undone.'
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

            {/* Dialog for clearing all gangs */}
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
                    {t('gangs.clearConfirmation.title', 'Confirm Clear All')}
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
                            'gangs.clearConfirmation.message',
                            'Are you sure you want to clear all gangs? This action cannot be undone.'
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

export default Gang
