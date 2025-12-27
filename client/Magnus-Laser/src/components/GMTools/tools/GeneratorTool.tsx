import Add from '@mui/icons-material/Add'
import Close from '@mui/icons-material/Close'
import ContentCopy from '@mui/icons-material/ContentCopy'
import Edit from '@mui/icons-material/Edit'
import FastForward from '@mui/icons-material/FastForward'
import FormatListNumbered from '@mui/icons-material/FormatListNumbered'
import ViewModule from '@mui/icons-material/ViewModule'
import Visibility from '@mui/icons-material/Visibility'
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../contexts/dataHooks'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import { Bounty, BountyStatus, Building, Character, FixerJob, Gang, Item } from '../../../graphql/types'
import colors from '../../../utils/colors'
import { ModuleTypes } from '../../../utils/constants'
import {
    getBuildingColor,
    getFixerJobDifficultyColor,
    getGangColorValue,
    getOrderedBountyData,
    getOrderedBuildingData,
    getOrderedCharacterData,
    getOrderedFixerJobData,
    getOrderedGangData,
    getOrderedItemData,
    getRandomInt,
    processBountyValueForDisplay,
    processCharacterValueForDisplay,
    processFixerJobValueForDisplay,
    processGangValueForDisplay,
    processItemValueForDisplay,
} from '../../../utils/functions'
import { processBuildingValueForDisplay } from '../../../utils/functions.tsx'
import {
    baseBountyRewardPerSpeciality,
    generateRandomBounty,
    generateRandomCrime,
} from '../../../utils/generators/generatorBounty'
import { generateRandomBuilding } from '../../../utils/generators/generatorBuilding'
import { generateRandomCharacter } from '../../../utils/generators/generatorCharacter'
import { generateRandomFixerJob } from '../../../utils/generators/generatorFixerJob'
import { generateRandomGang } from '../../../utils/generators/generatorGang'
import { generateRandomItem } from '../../../utils/generators/generatorItem'
import {
    saveBounties,
    saveBuildings,
    saveCharacters,
    saveFixerJobs,
    saveGangs,
    saveItems,
} from '../../../utils/storage'
import { EditDialog } from '../../common/EditDialog/EditDialog'
import TableView from '../../common/TableView'
import TiptapEditor from '../../common/TiptapEditor'
import { WarningDialog } from '../../common/WarningDialog'
import CustomScrollbar from '../../CustomScrollbar'

interface GeneratorToolProps {
    type: 'gang' | 'building' | 'gig' | 'bounty' | 'item' | 'contact'
}

type EntityType = Gang | Building | FixerJob | Bounty | Item | Character

const GeneratorTool = ({ type }: GeneratorToolProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { enqueueSnackbar } = useSnackbar()
    const {
        gangs,
        setGangs,
        buildings,
        setBuildings,
        fixerJobs,
        setFixerJobs,
        bounties,
        setBounties,
        items,
        setItems,
        characters,
        setCharacters,
    } = useData()

    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState(0) // 0 = Generator, 1 = Datastream (for bounty)

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [itemToEdit, setItemToEdit] = useState<EntityType | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_isSaving, setIsSaving] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

    const getConfig = () => {
        switch (type) {
            case 'gang':
                return {
                    title: t('gmTools.gangGenerator'),
                    color: colors.neons.red.default,
                    items: gangs,
                    setItems: setGangs,
                    moduleType: ModuleTypes.GANG,
                    generator: async () => await generateRandomGang(t),
                    getItemName: (item: Gang) => item.name,
                    getItemColor: (item: Gang) => getGangColorValue(item.color),
                    getItemType: (item: Gang) => processGangValueForDisplay('type', item.type, t),
                    getOrderedData: (item: Gang) => getOrderedGangData(item, t),
                    processValue: (key: string, value: unknown) => processGangValueForDisplay(key, value, t),
                }
            case 'building':
                return {
                    title: t('gmTools.buildingGenerator'),
                    color: colors.neons.blue.default,
                    items: buildings,
                    setItems: setBuildings,
                    moduleType: ModuleTypes.BUILDING,
                    generator: async () => await generateRandomBuilding(t, 0),
                    getItemName: (item: Building) => item.name,
                    getItemColor: (item: Building) => getBuildingColor(item.type),
                    getItemType: (item: Building) =>
                        processBuildingValueForDisplay('type', item.type, t, item.isAbandoned),
                    getOrderedData: (item: Building) => getOrderedBuildingData(item, t),
                    processValue: (key: string, value: unknown, item: Building) =>
                        processBuildingValueForDisplay(key, value, t, item.isAbandoned),
                }
            case 'gig':
                return {
                    title: t('gmTools.gigGenerator'),
                    color: colors.neons.orange.default,
                    items: fixerJobs,
                    setItems: setFixerJobs,
                    moduleType: ModuleTypes.FIXER_JOB,
                    generator: async () => {
                        const result = await generateRandomFixerJob(
                            t,
                            gangs,
                            buildings,
                            characters,
                            items,
                            undefined,
                            false,
                            false,
                            false,
                            false
                        )
                        // Save any newly created entities
                        if (result.newGang) {
                            const updatedGangs = [...gangs, result.newGang]
                            setGangs(updatedGangs)
                            await saveGangs(updatedGangs)
                        }
                        if (result.newBuilding) {
                            const updatedBuildings = [...buildings, result.newBuilding]
                            setBuildings(updatedBuildings)
                            await saveBuildings(updatedBuildings)
                        }
                        if (result.newCharacters.length > 0) {
                            const updatedCharacters = [...characters, ...result.newCharacters]
                            setCharacters(updatedCharacters)
                            await saveCharacters(updatedCharacters)
                        }
                        if (result.newItems.length > 0) {
                            const updatedItems = [...items, ...result.newItems]
                            setItems(updatedItems)
                            await saveItems(updatedItems)
                        }
                        return result.newFixerJob
                    },
                    getItemName: (item: FixerJob) => item.name,
                    getItemColor: (item: FixerJob) => getFixerJobDifficultyColor(item.difficulty),
                    getItemType: (item: FixerJob) =>
                        processFixerJobValueForDisplay('plot.verb.value', item.plot?.verb?.value, t),
                    getOrderedData: (item: FixerJob) => getOrderedFixerJobData(item, t),
                    processValue: (key: string, value: unknown) =>
                        value !== undefined ? processFixerJobValueForDisplay(key, value, t) : '—',
                }
            case 'bounty':
                return {
                    title: t('gmTools.bountyGenerator'),
                    color: colors.neons.yellow.default,
                    items: bounties,
                    setItems: setBounties,
                    moduleType: ModuleTypes.BOUNTY,
                    generator: async () => {
                        const { newBounty, newCharacter } = await generateRandomBounty(
                            bounties,
                            characters,
                            undefined,
                            undefined,
                            false
                        )
                        // If a new character was generated, add it to the characters list and persist
                        if (newCharacter) {
                            const updatedCharacters = [newCharacter, ...characters]
                            setCharacters(updatedCharacters)
                            await saveCharacters(updatedCharacters)
                        }
                        return newBounty
                    },
                    getItemName: (item: Bounty) => {
                        const char = characters.find((c) => c.ID === item.character.ID)
                        return char?.name || 'Unknown'
                    },
                    getItemColor: () => colors.neons.yellow.default,
                    getItemType: (item: Bounty) => {
                        const totalBounty =
                            item.crimes.reduce((acc, crime) => acc + crime.reward * crime.multiplier, 0) +
                            baseBountyRewardPerSpeciality[item.speciality]
                        return `${totalBounty} eb`
                    },
                    getOrderedData: (item: Bounty) =>
                        getOrderedBountyData(item, t, {
                            resolveCharacter: (id: string) => characters.find((c) => c.ID === id) || null,
                        }),
                    processValue: (key: string, value: unknown) => processBountyValueForDisplay(key, value, t),
                }
            case 'item':
                return {
                    title: t('gmTools.itemGenerator'),
                    color: colors.neons.cyan.default,
                    items: items,
                    setItems: setItems,
                    moduleType: ModuleTypes.ITEM,
                    generator: async () => await generateRandomItem(t),
                    getItemName: (item: Item) => item.name,
                    getItemColor: () => colors.neons.cyan.default,
                    getItemType: (item: Item) => processItemValueForDisplay('type', item.type, t),
                    getOrderedData: (item: Item) => getOrderedItemData(item, t),
                    processValue: (key: string, value: unknown) => processItemValueForDisplay(key, value, t),
                }
            case 'contact':
                return {
                    title: t('gmTools.contactGenerator'),
                    color: colors.neons.purple.default,
                    items: characters,
                    setItems: setCharacters,
                    moduleType: ModuleTypes.CHARACTER,
                    generator: async () => await generateRandomCharacter(),
                    getItemName: (item: Character) => item.name,
                    getItemColor: () => colors.neons.purple.default,
                    getItemType: (item: Character) =>
                        item.type ? processCharacterValueForDisplay('type', item.type, t) : '',
                    getOrderedData: (item: Character) => getOrderedCharacterData(item, t),
                    processValue: (key: string, value: unknown) => processCharacterValueForDisplay(key, value, t),
                }
            default:
                return null
        }
    }

    const config = getConfig()
    if (!config) return null

    // Helper function to persist data to storage
    const persistData = async (updatedItems: EntityType[]) => {
        try {
            switch (type) {
                case 'gang':
                    await saveGangs(updatedItems as Gang[])
                    break
                case 'building':
                    await saveBuildings(updatedItems as Building[])
                    break
                case 'gig':
                    await saveFixerJobs(updatedItems as FixerJob[])
                    break
                case 'bounty':
                    await saveBounties(updatedItems as Bounty[])
                    break
                case 'item':
                    await saveItems(updatedItems as Item[])
                    break
                case 'contact':
                    await saveCharacters(updatedItems as Character[])
                    break
            }
            enqueueSnackbar(t('common.dataSavedToLocalStorage'), { variant: 'success', autoHideDuration: 2000 })
        } catch (err) {
            console.error('Error saving data:', err)
            enqueueSnackbar(t('common.error'), { variant: 'error' })
        }
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        setError(null)
        try {
            const newItem = await config.generator()
            const updatedItems = [newItem as EntityType, ...config.items]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config.setItems(updatedItems as any)
            setSelectedItem((newItem as { ID: string }).ID)
            // Persist to storage
            await persistData(updatedItems)
        } catch (err) {
            console.error('Generation error:', err)
            setError(t('common.error'))
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDeleteClick = (itemId: string) => {
        setItemToDelete(itemId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteByIndex = (index: number) => {
        setDeleteIndex(index)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        let updatedItems: EntityType[] = []
        if (itemToDelete) {
            updatedItems = config.items.filter((item: EntityType) => (item as { ID: string }).ID !== itemToDelete)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config.setItems(updatedItems as any)
            if (selectedItem === itemToDelete) {
                setSelectedItem(null)
            }
        } else if (deleteIndex !== null) {
            updatedItems = config.items.filter((_, i) => i !== deleteIndex)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config.setItems(updatedItems as any)
        }
        // Persist to storage
        await persistData(updatedItems)
        setDeleteDialogOpen(false)
        setItemToDelete(null)
        setDeleteIndex(null)
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setItemToDelete(null)
        setDeleteIndex(null)
    }

    const handleEditClick = (item: EntityType) => {
        setItemToEdit(item)
        setEditDialogOpen(true)
    }

    const handleEditById = (ID: string) => {
        const item = config.items.find((i: EntityType) => (i as { ID: string }).ID === ID)
        if (item) {
            setItemToEdit(item)
            setEditDialogOpen(true)
        }
    }

    const handleEditSave = async (editedItem: EntityType) => {
        const updatedItems = config.items.map((item: EntityType) =>
            (item as { ID: string }).ID === (editedItem as { ID: string }).ID ? editedItem : item
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.setItems(updatedItems as any)
        // Persist to storage
        await persistData(updatedItems)
        setEditDialogOpen(false)
        setItemToEdit(null)
        setIsSaving(true)
    }

    const handleEditCancel = () => {
        setEditDialogOpen(false)
        setItemToEdit(null)
    }

    const handleCopy = (item: EntityType) => {
        const name = config.getItemName(item as never)
        const description = 'description' in item ? item.description : ''
        const orderedData = config.getOrderedData(item as never)
        const details = orderedData
            .filter((d) => d.key !== 'name' && d.key !== 'description')
            .map((d) => `${d.label}: ${config.processValue(d.key, d.value, item as never)}`)
            .filter((s) => !s.includes('—'))
            .join('\n')
        const text = `${name}\n\n${description}\n\n${details}`
        navigator.clipboard.writeText(text)
    }

    // Advance all bounties by 1 week (adds crimes, updates status)
    const handleAdvanceBounty = async () => {
        if (type !== 'bounty') return
        setIsGenerating(true)
        try {
            const updatedBounties = bounties.map((bounty) => {
                const previousCrimes = Math.min(bounty.crimes.length, 10)
                const statusRoll = getRandomInt(0, 100) + previousCrimes
                let skip = false
                let status = bounty.status
                if (status === BountyStatus.CAPTURED) {
                    skip = getRandomInt(0, 100) <= 50 + previousCrimes
                }
                if (status === BountyStatus.DEAD) {
                    skip = true
                }
                if (!skip) {
                    if (statusRoll <= 11) {
                        if (statusRoll % 2 === 0) {
                            status = BountyStatus.DEAD
                        } else {
                            status = BountyStatus.CAPTURED
                        }
                    } else if (statusRoll >= 100) {
                        skip = true
                    } else {
                        status = BountyStatus.ACTIVE
                    }
                }

                return {
                    ...bounty,
                    crimes: skip
                        ? bounty.crimes
                        : [...bounty.crimes, generateRandomCrime(bounty.speciality, bounty.rep)],
                    status: status,
                }
            })
            setBounties(updatedBounties)
            await saveBounties(updatedBounties)
            enqueueSnackbar(t('common.dataSavedToLocalStorage'), { variant: 'success', autoHideDuration: 2000 })
        } catch (err) {
            console.error('Error advancing bounties:', err)
            enqueueSnackbar(t('common.error'), { variant: 'error' })
        } finally {
            setIsGenerating(false)
        }
    }

    const selectedItemData = config.items.find((item: EntityType) => (item as { ID: string }).ID === selectedItem)

    const renderDetailCard = (item: EntityType) => {
        const orderedData = config.getOrderedData(item as never)
        const itemColor = config.getItemColor(item as never)
        const itemName = config.getItemName(item as never)
        const itemType = config.getItemType(item as never)
        const itemImage = 'image' in item ? item.image : ''
        const itemDescription = 'description' in item ? item.description : ''

        return (
            <Card
                sx={{
                    border: 'none',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <CardContent
                    sx={{
                        p: 0,
                        position: 'relative',
                        zIndex: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: showTabs ? 'calc(100vh - 230px)' : 'calc(100vh - 180px)',
                        overflow: 'hidden',
                        '&:last-child': { pb: 0 },
                    }}
                >
                    <CustomScrollbar scrollDirection="vertical">
                        {/* Header */}
                        <Box
                            sx={{
                                //bgcolor: 'rgba(14, 22, 48, 0.9)',
                                bgcolor: 'transparent',
                                py: 0.8,
                                px: 1.5,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        fontFamily: 'Orbitron, sans-serif',
                                        color: itemColor,
                                        textShadow: `0 0 5px ${itemColor}`,
                                    }}
                                >
                                    {itemName}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        color: colors.grays.gray600,
                                    }}
                                >
                                    {itemType}
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title={t('common.edit')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditClick(item)}
                                        sx={{ color: colors.neons.cyan.default }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('common.copy')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(item)}
                                        sx={{ color: colors.grays.gray600 }}
                                    >
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('common.delete')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteClick((item as { ID: string }).ID)}
                                        sx={{ color: colors.neons.red.default }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Box>
                        {/* Image */}
                        {itemImage && (
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    maxHeight: 200,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: `${itemColor}30`,
                                    borderBottom: `1px solid ${itemColor}40`,
                                }}
                            >
                                <Avatar
                                    src={itemImage || '/logoBlackTransparentEyes.png'}
                                    variant="rounded"
                                    slotProps={{
                                        img: { style: { objectFit: 'contain' } },
                                    }}
                                    sx={{
                                        bgcolor: 'transparent',
                                        width: '100%',
                                        height: 200,
                                    }}
                                />
                            </Box>
                        )}
                        {/* Description */}
                        {itemDescription && (
                            <Box
                                sx={{
                                    bgcolor: 'rgba(14, 22, 48, 0.9)',
                                    px: 2,
                                    py: 1,
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <TiptapEditor value={itemDescription} />
                            </Box>
                        )}
                        {/* Data Table */}
                        <TableContainer
                            sx={{
                                bgcolor: 'rgba(14, 22, 48, 0.9)',
                            }}
                        >
                            <Table size="small">
                                <TableBody>
                                    {orderedData
                                        .filter((entry) => {
                                            if (!entry.label || entry.label.trim() === '') return false
                                            if (entry.key === 'name' || entry.key === 'description') return false
                                            const displayValue = config.processValue(
                                                entry.key,
                                                entry.value,
                                                item as never
                                            )
                                            return displayValue !== '—' && displayValue !== ''
                                        })
                                        .map((entry) => (
                                            <TableRow
                                                key={entry.key}
                                                sx={{
                                                    '&:nth-of-type(odd)': {
                                                        bgcolor: 'rgba(0, 15, 30, 0.4)',
                                                    },
                                                    '&:nth-of-type(even)': {
                                                        bgcolor: 'rgba(0, 20, 40, 0.2)',
                                                    },
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 255, 255, 0.1)',
                                                    },
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                        fontWeight: 'bold',
                                                        width: '40%',
                                                        color: colors.neons.cyan.default,
                                                        textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                                    }}
                                                >
                                                    <Typography variant="body2" noWrap>
                                                        {entry.label}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                        color: colors.grays.gray900,
                                                        textShadow: `0 0 5px ${colors.neons.green.dark}`,
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        {config.processValue(entry.key, entry.value, item as never)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {/* Bottom accent */}
                        <Box
                            sx={{
                                height: 2,
                                background: `linear-gradient(90deg, transparent, ${itemColor}, transparent)`,
                            }}
                        />
                    </CustomScrollbar>
                </CardContent>
            </Card>
        )
    }

    const renderGeneratorView = () => (
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            {/* Items List */}
            <Box
                sx={{
                    width: 200,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    maxHeight: showTabs ? 'calc(100vh - 230px)' : 'calc(100vh - 180px)',
                }}
            >
                <Typography variant="subtitle2" sx={{ color: colors.grays.gray600, mb: 1, flexShrink: 0 }}>
                    {t('gmTools.existingItems')} ({config.items.length})
                </Typography>
                {config.items.length === 0 ? (
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.grays.gray600,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            py: 2,
                        }}
                    >
                        {t('gmTools.noItems')}
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            minHeight: 0,
                            // Hide scrollbar but keep functionality
                            scrollbarWidth: 'none', // Firefox
                            msOverflowStyle: 'none', // IE/Edge
                            '&::-webkit-scrollbar': {
                                display: 'none', // Chrome, Safari, Opera
                            },
                        }}
                    >
                        <Stack spacing={0.5}>
                            {config.items.slice(0, 50).map((item: EntityType) => {
                                const typedItem = item as { ID: string }
                                const isSelected = selectedItem === typedItem.ID
                                const itemColor = config.getItemColor(item as never)
                                return (
                                    <Paper
                                        key={typedItem.ID}
                                        onClick={() => setSelectedItem(typedItem.ID)}
                                        sx={{
                                            p: 1,
                                            cursor: 'pointer',
                                            backgroundColor: isSelected
                                                ? `${itemColor}20`
                                                : readerMode
                                                ? 'rgba(0, 0, 0, 0.05)'
                                                : 'rgba(0, 0, 0, 0.2)',
                                            border: isSelected ? `1px solid ${itemColor}` : '1px solid transparent',
                                            borderLeft: `3px solid ${itemColor}`,
                                            '&:hover': {
                                                backgroundColor: isSelected
                                                    ? `${itemColor}30`
                                                    : readerMode
                                                    ? 'rgba(0, 0, 0, 0.08)'
                                                    : 'rgba(0, 0, 0, 0.3)',
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: isSelected ? 'bold' : 'normal',
                                                color: isSelected ? itemColor : 'inherit',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {config.getItemName(item as never)}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: colors.grays.gray500,
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {config.getItemType(item as never)}
                                        </Typography>
                                    </Paper>
                                )
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Item Details */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                {!selectedItemData ? (
                    <Card
                        sx={{
                            backgroundColor: readerMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                            textAlign: 'center',
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Box>
                            <Visibility sx={{ fontSize: 48, color: colors.grays.gray600, mb: 1 }} />
                            <Typography variant="body2" sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}>
                                {t('gmTools.selectOrGenerate')}
                            </Typography>
                        </Box>
                    </Card>
                ) : (
                    renderDetailCard(selectedItemData)
                )}
            </Box>
        </Stack>
    )

    const renderDatastreamView = () => (
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* +1 Week button for bounty datastream */}
            <Stack direction="row" justifyContent="flex-end" mb={2}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <FastForward />}
                    onClick={handleAdvanceBounty}
                    disabled={isGenerating || bounties.length === 0}
                    sx={{
                        borderColor: colors.neons.yellow.default,
                        color: readerMode ? colors.grays.gray000 : colors.neons.yellow.default,
                        '&:hover': {
                            borderColor: colors.neons.yellow.default,
                            backgroundColor: `${colors.neons.yellow.default}20`,
                        },
                        '&.Mui-disabled': {
                            borderColor: colors.grays.gray600,
                            color: colors.grays.gray600,
                        },
                    }}
                >
                    {t('bounties.labels.advance')}
                </Button>
            </Stack>
            {bounties.length === 0 ? (
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.grays.gray600,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        py: 4,
                    }}
                >
                    {t('common.noItems', { type: t('modules.BOUNTY').toLowerCase() })}
                </Typography>
            ) : (
                <TableView
                    targetArray={bounties}
                    onDelete={handleDeleteByIndex}
                    moduleType={ModuleTypes.BOUNTY}
                    onEdit={handleEditById}
                    excludeColumns={['character.type', 'speciality', 'rep']}
                />
            )}
        </Box>
    )

    // Show tabs only for bounty type
    const showTabs = type === 'bounty'

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography
                    variant="h6"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : config.color,
                        fontWeight: 'bold',
                    }}
                >
                    {config.title}
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <Add />}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    sx={{
                        backgroundColor: config.color,
                        '&:hover': { backgroundColor: `${config.color}dd` },
                    }}
                >
                    {t('common.generate')}
                </Button>
            </Stack>

            {error && (
                <Typography variant="body2" sx={{ color: colors.neons.red.default, mb: 2 }}>
                    {error}
                </Typography>
            )}

            {showTabs && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        sx={{
                            minHeight: 36,
                            '& .MuiTab-root': {
                                minHeight: 36,
                                py: 0.5,
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: readerMode ? colors.grays.gray000 : colors.neons.yellow.default,
                                boxShadow: `0 0 10px ${colors.neons.yellow.default}`,
                            },
                        }}
                    >
                        <Tab
                            icon={<ViewModule sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label={t('gmTools.generator')}
                            sx={{
                                fontSize: '0.75rem',
                                color:
                                    activeTab === 0
                                        ? readerMode
                                            ? colors.grays.gray000
                                            : colors.neons.yellow.default
                                        : colors.grays.gray600,
                            }}
                        />
                        <Tab
                            icon={<FormatListNumbered sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label={t('gmTools.datastream')}
                            sx={{
                                fontSize: '0.75rem',
                                color:
                                    activeTab === 1
                                        ? readerMode
                                            ? colors.grays.gray000
                                            : colors.neons.yellow.default
                                        : colors.grays.gray600,
                            }}
                        />
                    </Tabs>
                </Box>
            )}

            {showTabs ? (activeTab === 0 ? renderGeneratorView() : renderDatastreamView()) : renderGeneratorView()}

            {/* Edit Dialog */}
            <EditDialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                onSave={handleEditSave as (target: Gang | Building | FixerJob | Character | Item | Bounty) => void}
                target={itemToEdit}
                moduleType={config.moduleType}
                isGeneratingImage={isGeneratingImage}
                setIsGeneratingImage={setIsGeneratingImage}
                setIsSaving={setIsSaving}
                setGangs={type === 'gang' ? setGangs : undefined}
                setBuildings={type === 'building' ? setBuildings : undefined}
                setFixerJobs={type === 'gig' ? setFixerJobs : undefined}
                setItems={type === 'item' ? setItems : undefined}
                setCharacters={type === 'contact' ? setCharacters : undefined}
            />

            {/* Delete Confirmation Dialog */}
            <WarningDialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteConfirmMessage', { type: t(`modules.${config.moduleType}`).toLowerCase() })}
                moduleType={config.moduleType}
                isDelete={true}
                isClearAll={false}
            />
        </Box>
    )
}

export default GeneratorTool
