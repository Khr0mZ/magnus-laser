import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { CustomRandomTable } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import { RANDOM_THINGS_WEIGHTS, rollRandomThings } from '../../../utils/generators/soloPlayTables'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const RandomThingsTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { customTables, addCustomTable, updateCustomTable, deleteCustomTable } =
        useGMToolsDataStore()

    // Create dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [tableName, setTableName] = useState('')
    const [tableSize, setTableSize] = useState(6)
    const [tableItems, setTableItems] = useState<string[]>(Array(6).fill(''))

    // Edit dialog state
    const [editingTable, setEditingTable] = useState<CustomRandomTable | null>(null)

    // Roll result state
    const [rollResult, setRollResult] = useState<{
        tableId: string
        index: number
    } | null>(null)

    // Styles
    const accentColor = colors.neons.pink.default
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, accentColor)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, accentColor)
    const titleStyle = getSectionTitleStyle(readerMode, accentColor)

    const handleSizeChange = (_: unknown, value: number | number[]) => {
        const newSize = value as number
        setTableSize(newSize)
        setTableItems((prev) => {
            const newItems = [...prev]
            if (newSize > newItems.length) {
                return [...newItems, ...Array(newSize - newItems.length).fill('')]
            }
            return newItems.slice(0, newSize)
        })
    }

    const handleItemChange = (index: number, value: string) => {
        setTableItems((prev) => {
            const newItems = [...prev]
            newItems[index] = value
            return newItems
        })
    }

    const handleCreate = () => {
        if (!tableName.trim()) return
        const table: CustomRandomTable = {
            id: uuidv4(),
            name: tableName.trim(),
            size: tableSize,
            items: tableItems.map((item) => item.trim()),
            createdAt: Date.now(),
        }
        addCustomTable(table)
        setTableName('')
        setTableSize(6)
        setTableItems(Array(6).fill(''))
        setDialogOpen(false)
    }

    const handleRoll = (table: CustomRandomTable) => {
        const index = rollRandomThings(table.size)
        setRollResult({ tableId: table.id, index })
        // Clear result after 10 seconds
        setTimeout(() => {
            setRollResult((prev) => (prev?.tableId === table.id ? null : prev))
        }, 10000)
    }

    const handleOpenEdit = (table: CustomRandomTable) => {
        setEditingTable({ ...table, items: [...table.items] })
    }

    const handleSaveEdit = () => {
        if (!editingTable) return
        updateCustomTable(editingTable.id, {
            name: editingTable.name,
            items: editingTable.items.map((item) => item.trim()),
        })
        setEditingTable(null)
    }

    const getWeights = (size: number): number[] => {
        return RANDOM_THINGS_WEIGHTS[size] || Array(size).fill(100 / size)
    }

    const renderItemFields = (
        items: string[],
        size: number,
        onItemChange: (index: number, value: string) => void,
        tfStyle: ReturnType<typeof getCyberpunkTextFieldStyle>
    ) => {
        const weights = getWeights(size)
        return (
            <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                {items.map((item, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={`${weights[i]?.toFixed(1)}%`}
                            size="small"
                            sx={{
                                minWidth: 55,
                                backgroundColor: `${accentColor}20`,
                                color: accentColor,
                                fontFamily: '"Orbitron", sans-serif',
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                            }}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label={`${i + 1}`}
                            value={item}
                            onChange={(e) => onItemChange(i, e.target.value)}
                            placeholder={t('soloPlay.randomThings.itemPlaceholder', { n: i + 1 })}
                            sx={tfStyle}
                        />
                    </Stack>
                ))}
            </Stack>
        )
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.randomThings.title')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.randomThings.add')}
                </Button>
            </Stack>

            {customTables.length === 0 ? (
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.grays.gray600,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        fontFamily: '"Lexend", sans-serif',
                        py: 2,
                    }}
                >
                    {t('soloPlay.randomThings.noTables')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {customTables.map((table) => {
                        const weights = getWeights(table.size)
                        const isRolled = rollResult?.tableId === table.id

                        return (
                            <Paper
                                key={table.id}
                                sx={{
                                    ...getCyberpunkPaperStyle(readerMode, accentColor),
                                    p: 2,
                                }}
                            >
                                {/* Header */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray000 : accentColor,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {table.name}
                                            </Typography>
                                            <Chip
                                                label={`d${table.size}`}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${accentColor}30`,
                                                    color: accentColor,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.65rem',
                                                    height: 20,
                                                }}
                                            />
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        {/* Roll */}
                                        <Tooltip disableInteractive title={t('soloPlay.randomThings.roll')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRoll(table)}
                                                sx={{
                                                    color: colors.neons.yellow.default,
                                                    border: `1px solid ${colors.neons.yellow.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': {
                                                        backgroundColor: `${colors.neons.yellow.default}20`,
                                                        boxShadow: `0 0 10px ${colors.neons.yellow.default}40`,
                                                    },
                                                }}
                                            >
                                                <Casino fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {/* Edit */}
                                        <Tooltip disableInteractive title={t('common.edit')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEdit(table)}
                                                sx={{
                                                    color: colors.neons.purple.default,
                                                    border: `1px solid ${colors.neons.purple.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': { backgroundColor: `${colors.neons.purple.default}20` },
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {/* Delete */}
                                        <Tooltip disableInteractive title={t('common.delete')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => deleteCustomTable(table.id)}
                                                sx={{
                                                    color: colors.neons.red.default,
                                                    border: `1px solid ${colors.neons.red.default}40`,
                                                    borderRadius: 0,
                                                    '&:hover': { backgroundColor: `${colors.neons.red.default}20` },
                                                }}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>

                                {/* Items List */}
                                <Stack spacing={0.5} mt={1.5}>
                                    {table.items.map((item, i) => {
                                        const isSelected = isRolled && rollResult.index === i
                                        return (
                                            <Box
                                                key={i}
                                                sx={{
                                                    p: 0.75,
                                                    borderRadius: 1,
                                                    backgroundColor: isSelected
                                                        ? `${colors.neons.yellow.default}25`
                                                        : readerMode
                                                          ? 'rgba(0,0,0,0.03)'
                                                          : 'rgba(0,0,0,0.2)',
                                                    border: isSelected
                                                        ? `2px solid ${colors.neons.yellow.default}`
                                                        : `1px solid transparent`,
                                                    boxShadow: isSelected
                                                        ? `0 0 15px ${colors.neons.yellow.default}60`
                                                        : 'none',
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: isSelected
                                                                ? colors.neons.yellow.default
                                                                : accentColor,
                                                            fontFamily: '"Orbitron", sans-serif',
                                                            fontWeight: 'bold',
                                                            minWidth: 20,
                                                            fontSize: '0.6rem',
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: readerMode
                                                                ? colors.grays.gray400
                                                                : colors.grays.gray600,
                                                            minWidth: 40,
                                                            fontSize: '0.6rem',
                                                        }}
                                                    >
                                                        {weights[i]?.toFixed(1)}%
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: isSelected
                                                                ? colors.neons.yellow.default
                                                                : readerMode
                                                                  ? colors.grays.gray000
                                                                  : colors.grays.gray900,
                                                            fontFamily: '"Lexend", sans-serif',
                                                            fontWeight: isSelected ? 'bold' : 'normal',
                                                            textShadow: isSelected && !readerMode
                                                                ? `0 0 10px ${colors.neons.yellow.default}60`
                                                                : 'none',
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {item || (
                                                            <span style={{ fontStyle: 'italic', opacity: 0.5 }}>
                                                                {t('soloPlay.randomThings.emptyItem')}
                                                            </span>
                                                        )}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )
                                    })}
                                </Stack>
                            </Paper>
                        )
                    })}
                </Stack>
            )}

            {/* Create Table Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${accentColor}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${accentColor}40`,
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : accentColor,
                        borderBottom: `1px solid ${accentColor}40`,
                    }}
                >
                    {t('soloPlay.randomThings.create')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label={t('soloPlay.randomThings.tableName')}
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder={t('soloPlay.randomThings.namePlaceholder')}
                            sx={textFieldStyle}
                        />

                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: colors.grays.gray500,
                                    fontFamily: '"Lexend", sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                {t('soloPlay.randomThings.tableSize')}: {tableSize} {t('soloPlay.randomThings.items')}
                            </Typography>
                            <Slider
                                value={tableSize}
                                onChange={handleSizeChange}
                                min={3}
                                max={20}
                                step={1}
                                marks={[
                                    { value: 3, label: '3' },
                                    { value: 6, label: '6' },
                                    { value: 10, label: '10' },
                                    { value: 15, label: '15' },
                                    { value: 20, label: '20' },
                                ]}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: accentColor,
                                    '& .MuiSlider-markLabel': {
                                        color: colors.grays.gray600,
                                    },
                                }}
                            />
                        </Box>

                        {renderItemFields(
                            tableItems,
                            tableSize,
                            handleItemChange,
                            textFieldStyle
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}40` }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleCreate}
                        variant="outlined"
                        disabled={!tableName.trim()}
                        sx={buttonStyle}
                    >
                        {t('common.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Table Dialog */}
            <Dialog
                open={!!editingTable}
                onClose={() => setEditingTable(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: readerMode ? '#fff' : colors.cyberpunk.darkBg,
                        border: `1px solid ${colors.neons.purple.default}40`,
                        boxShadow: readerMode
                            ? '0 4px 20px rgba(0,0,0,0.15)'
                            : `0 0 30px ${colors.neons.purple.default}40`,
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: '"Orbitron", sans-serif',
                        color: readerMode ? colors.grays.gray000 : colors.neons.purple.default,
                        borderBottom: `1px solid ${colors.neons.purple.default}40`,
                    }}
                >
                    {t('soloPlay.randomThings.edit')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    {editingTable && (
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label={t('soloPlay.randomThings.tableName')}
                                value={editingTable.name}
                                onChange={(e) =>
                                    setEditingTable({ ...editingTable, name: e.target.value })
                                }
                                sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                            />
                            {renderItemFields(
                                editingTable.items,
                                editingTable.size,
                                (index, value) => {
                                    const newItems = [...editingTable.items]
                                    newItems[index] = value
                                    setEditingTable({ ...editingTable, items: newItems })
                                },
                                getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.purple.default}40` }}>
                    <Button
                        onClick={() => setEditingTable(null)}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="outlined"
                        sx={getCyberpunkButtonStyle(readerMode, colors.neons.purple.default)}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default RandomThingsTool
