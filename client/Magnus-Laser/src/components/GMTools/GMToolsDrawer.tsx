import AccountBalance from '@mui/icons-material/AccountBalance'
import Assignment from '@mui/icons-material/Assignment'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import ContactPage from '@mui/icons-material/ContactPage'
import FormatListNumbered from '@mui/icons-material/FormatListNumbered'
import Forum from '@mui/icons-material/Forum'
import Groups from '@mui/icons-material/Groups'
import Inventory from '@mui/icons-material/Inventory'
import Person from '@mui/icons-material/Person'
import Psychology from '@mui/icons-material/Psychology'
import RecentActors from '@mui/icons-material/RecentActors'
import Search from '@mui/icons-material/Search'
import Stars from '@mui/icons-material/Stars'
import Theaters from '@mui/icons-material/Theaters'
import Timeline from '@mui/icons-material/Timeline'
import TrendingUp from '@mui/icons-material/TrendingUp'
import Work from '@mui/icons-material/Work'
import WorkOutline from '@mui/icons-material/WorkOutline'
import {
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import CustomScrollbar from '../CustomScrollbar'
import GMToolsContent from './GMToolsContent'
import { type GMToolType, useGMToolsStore } from './GMToolsStore'

const MENU_WIDTH = 200
const CONTENT_WIDTH = 750
const APPBAR_HEIGHT = 80

interface ToolItem {
    id: GMToolType
    icon: React.ReactNode
    labelKey: string
    color: string
}

const soloPlayTools: ToolItem[] = [
    {
        id: 'oracle',
        icon: <Psychology />,
        labelKey: 'gmTools.oracle',
        color: colors.neons.cyan.default,
    },
    {
        id: 'clocks',
        icon: <Timeline />,
        labelKey: 'gmTools.clocks',
        color: colors.neons.yellow.default,
    },
    {
        id: 'missionBuilder',
        icon: <Assignment />,
        labelKey: 'gmTools.missionBuilder',
        color: colors.neons.purple.default,
    },
    {
        id: 'beatChart',
        icon: <TrendingUp />,
        labelKey: 'gmTools.beatChart',
        color: colors.neons.pink.default,
    },
    {
        id: 'investigation',
        icon: <Search />,
        labelKey: 'gmTools.investigation',
        color: colors.neons.green.default,
    },
    {
        id: 'socialChallenge',
        icon: <Forum />,
        labelKey: 'gmTools.socialChallenge',
        color: colors.neons.purple.default,
    },
    {
        id: 'npcTracker',
        icon: <RecentActors />,
        labelKey: 'gmTools.npcTracker',
        color: colors.neons.orange.default,
    },
    {
        id: 'ipTracker',
        icon: <Stars />,
        labelKey: 'gmTools.ipTracker',
        color: colors.neons.blue.default,
    },
    {
        id: 'sceneTracker',
        icon: <Theaters />,
        labelKey: 'gmTools.sceneTracker',
        color: colors.neons.blue.default,
    },
    {
        id: 'npcForms',
        icon: <ContactPage />,
        labelKey: 'gmTools.npcForms',
        color: colors.neons.cyan.default,
    },
    {
        id: 'randomThings',
        icon: <FormatListNumbered />,
        labelKey: 'gmTools.randomThings',
        color: colors.neons.pink.default,
    },
]

const generatorTools: ToolItem[] = [
    {
        id: 'gangGenerator',
        icon: <Groups />,
        labelKey: 'modules.GANG',
        color: colors.neons.red.default,
    },
    {
        id: 'buildingGenerator',
        icon: <AccountBalance />,
        labelKey: 'modules.BUILDING',
        color: colors.neons.blue.default,
    },
    {
        id: 'gigGenerator',
        icon: <Work />,
        labelKey: 'modules.FIXER_JOB',
        color: colors.neons.orange.default,
    },
    {
        id: 'bountyGenerator',
        icon: <WorkOutline />,
        labelKey: 'modules.BOUNTY',
        color: colors.neons.yellow.default,
    },
    {
        id: 'itemGenerator',
        icon: <Inventory />,
        labelKey: 'modules.ITEM',
        color: colors.neons.cyan.default,
    },
    {
        id: 'contactGenerator',
        icon: <Person />,
        labelKey: 'modules.CHARACTER',
        color: colors.neons.purple.default,
    },
]

const GMToolsDrawer = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { isDrawerOpen, activeTool, setActiveTool, isMenuCollapsed, toggleMenuCollapsed } = useGMToolsStore()
    const menuWidth = isMenuCollapsed ? 0 : MENU_WIDTH

    const handleToolClick = (toolId: GMToolType) => {
        setActiveTool(toolId)
    }

    const renderToolList = (tools: ToolItem[]) => (
        <List dense>
            {tools.map((tool) => {
                const isSelected = activeTool === tool.id
                return (
                    <ListItemButton
                        key={tool.id}
                        selected={isSelected}
                        onClick={() => handleToolClick(tool.id)}
                        sx={{
                            mx: 1,
                            borderRadius: 0,
                            mb: 0.5,
                            position: 'relative',
                            overflow: 'hidden',
                            border: isSelected ? `1px solid ${tool.color}60` : '1px solid transparent',
                            '&::before': readerMode
                                ? {}
                                : {
                                      content: '""',
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: isSelected ? '3px' : '0px',
                                      backgroundColor: tool.color,
                                      boxShadow: isSelected ? `0 0 10px ${tool.color}` : 'none',
                                  },
                            '&.Mui-selected': {
                                backgroundColor: readerMode ? 'rgba(0, 0, 0, 0.08)' : `${tool.color}15`,
                                '&:hover': {
                                    backgroundColor: readerMode ? 'rgba(0, 0, 0, 0.12)' : `${tool.color}25`,
                                },
                            },
                            '&:hover': {
                                backgroundColor: readerMode ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                                '&::before': {
                                    width: '3px',
                                },
                            },
                        }}
                    >
                        <ListItemText
                            primary={t(tool.labelKey)}
                            slotProps={{
                                primary: {
                                    sx: {
                                        fontWeight: isSelected ? 'bold' : 500,
                                        fontSize: '0.85rem',
                                        letterSpacing: '0.5px',
                                        color: isSelected
                                            ? tool.color
                                            : readerMode
                                              ? colors.grays.gray200
                                              : colors.grays.gray700,
                                        textShadow: isSelected && !readerMode ? `0 0 8px ${tool.color}60` : 'none',
                                    },
                                },
                            }}
                        />
                    </ListItemButton>
                )
            })}
        </List>
    )

    return (
        <Drawer
            anchor="right"
            open={isDrawerOpen}
            variant="persistent"
            sx={{
                '& .MuiDrawer-paper': {
                    width: menuWidth + CONTENT_WIDTH,
                    top: `${APPBAR_HEIGHT}px`,
                    height: `calc(100% - ${APPBAR_HEIGHT}px)`,
                    backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(5, 10, 20, 0.98)',
                    borderLeft: readerMode
                        ? `1px solid ${colors.grays.gray300}`
                        : `1px solid ${colors.neons.cyan.default}40`,
                    backdropFilter: 'blur(15px)',
                    boxShadow: readerMode
                        ? '-5px 0 20px rgba(0, 0, 0, 0.1)'
                        : `-5px 0 30px rgba(0, 255, 255, 0.1), inset 1px 0 30px rgba(0, 255, 255, 0.05)`,
                    // Scanlines effect
                    '&::before': readerMode
                        ? {}
                        : {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 0,
                              pointerEvents: 'none',
                              backgroundImage: `linear-gradient(0deg, 
                            rgba(0, 255, 255, 0.02) 25%, 
                            transparent 25%, 
                            transparent 50%, 
                            rgba(0, 255, 255, 0.02) 50%, 
                            rgba(0, 255, 255, 0.02) 75%, 
                            transparent 75%, 
                            transparent)`,
                              backgroundSize: '100% 4px',
                              opacity: 0.5,
                          },
                    // Grid pattern
                    '&::after': readerMode
                        ? {}
                        : {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 0,
                              pointerEvents: 'none',
                              backgroundImage: `
                            radial-gradient(${colors.neons.cyan.default}15 1px, transparent 1px)
                        `,
                              backgroundSize: '20px 20px',
                              opacity: 0.3,
                          },
                },
            }}
        >
            <Stack direction="row" sx={{ height: '100%', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                {/* Tool Menu */}
                <Box
                    sx={{
                        width: menuWidth,
                        minWidth: menuWidth,
                        flexShrink: 0,
                        borderRight:
                            activeTool && !isMenuCollapsed
                                ? readerMode
                                    ? `1px solid ${colors.grays.gray300}`
                                    : `1px solid ${colors.neons.cyan.default}30`
                                : 'none',
                        height: '100%',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <CustomScrollbar scrollDirection="vertical">
                        {/* Header */}
                        <Box
                            sx={{
                                p: 2,
                                borderBottom: readerMode
                                    ? `1px solid ${colors.grays.gray300}`
                                    : `1px solid ${colors.neons.cyan.default}30`,
                                background: readerMode
                                    ? 'transparent'
                                    : `linear-gradient(180deg, rgba(0, 40, 60, 0.5) 0%, rgba(0, 20, 40, 0.3) 100%)`,
                                position: 'relative',
                                '&::after': readerMode
                                    ? {}
                                    : {
                                          content: '""',
                                          position: 'absolute',
                                          bottom: 0,
                                          left: '10%',
                                          right: '10%',
                                          height: '1px',
                                          background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                          boxShadow: `0 0 10px ${colors.neons.cyan.default}`,
                                      },
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 'bold',
                                    letterSpacing: '2px',
                                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                    textShadow: readerMode ? 'none' : `0 0 15px ${colors.neons.cyan.default}80`,
                                }}
                            >
                                {t('gmTools.title')}
                            </Typography>
                        </Box>

                        {/* Solo Play Tools */}
                        {renderToolList(soloPlayTools)}

                        <Divider
                            sx={{
                                my: 1,
                                mx: 2,
                                borderColor: readerMode ? colors.grays.gray300 : `${colors.neons.pink.default}30`,
                                position: 'relative',
                                '&::before': readerMode
                                    ? {}
                                    : {
                                          content: '""',
                                          position: 'absolute',
                                          left: '30%',
                                          right: '30%',
                                          top: '50%',
                                          height: '1px',
                                          background: `linear-gradient(90deg, transparent, ${colors.neons.pink.default}60, transparent)`,
                                      },
                            }}
                        />

                        {/* Generator Tools */}
                        {renderToolList(generatorTools)}
                    </CustomScrollbar>
                </Box>

                {/* Menu Toggle */}
                {activeTool && (
                    <Tooltip disableInteractive title={t(isMenuCollapsed ? 'gmTools.showMenu' : 'gmTools.hideMenu')}>
                        <IconButton
                            onClick={toggleMenuCollapsed}
                            sx={{
                                alignSelf: 'center',
                                width: 20,
                                height: 'calc(100%)',
                                borderRadius: 0,
                                color: readerMode ? colors.grays.gray400 : colors.neons.cyan.default,
                                borderRight: readerMode
                                    ? `1px solid ${colors.grays.gray300}`
                                    : `1px solid ${colors.neons.cyan.default}30`,
                                borderLeft: isMenuCollapsed
                                    ? readerMode
                                        ? `1px solid ${colors.grays.gray300}`
                                        : `1px solid ${colors.neons.cyan.default}30`
                                    : 'none',
                                '&:hover': {
                                    backgroundColor: readerMode ? 'rgba(0,0,0,0.04)' : `${colors.neons.cyan.default}15`,
                                },
                            }}
                        >
                            {isMenuCollapsed ? (
                                <ChevronLeft sx={{ fontSize: 16 }} />
                            ) : (
                                <ChevronRight sx={{ fontSize: 16 }} />
                            )}
                        </IconButton>
                    </Tooltip>
                )}

                {/* Tool Content */}
                {activeTool && (
                    <Box
                        sx={{
                            width: CONTENT_WIDTH,
                            flexShrink: 0,
                            overflow: 'hidden',
                            height: '100%',
                            background: readerMode
                                ? 'transparent'
                                : 'linear-gradient(180deg, rgba(0, 20, 35, 0.3) 0%, rgba(5, 15, 30, 0.2) 100%)',
                        }}
                    >
                        <CustomScrollbar scrollDirection="vertical">
                            <Box sx={{ p: 2 }}>
                                <GMToolsContent activeTool={activeTool} />
                            </Box>
                        </CustomScrollbar>
                    </Box>
                )}
            </Stack>
        </Drawer>
    )
}

export default GMToolsDrawer
