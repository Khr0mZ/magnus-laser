import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import Visibility from '@mui/icons-material/Visibility'
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGMToolsDataStore } from '../../components/GMTools/GMToolsDataStore'
import { WarningDialog } from '../../components/common/WarningDialog'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import NavigationPaths from '../../navigation'
import type { Character } from '../../types/characterCreator'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'

// Role colors for the chips
const ROLE_COLORS: Record<string, string> = {
    ROCKERBOY: colors.neons.pink.default,
    SOLO: colors.neons.red.default,
    NETRUNNER: colors.neons.cyan.default,
    TECH: colors.neons.yellow.default,
    MEDTECH: colors.neons.green.default,
    MEDIA: colors.neons.blue.default,
    LAWMAN: colors.neons.purple.default,
    EXEC: colors.neons.orange.default,
    FIXER: colors.neons.green.light,
    NOMAD: colors.neons.cyan.dark,
}

const EdgerunnersView = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    useDocumentTitle(`Magnus Laser - ${t('modules.EDGERUNNERS')}`)
    const { readerMode } = useUserPreferences()

    // Store
    const { edgerunners, deleteEdgerunner, clearEdgerunners, updateEdgerunner } = useGMToolsDataStore()

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
    const [edgerunnerToDelete, setEdgerunnerToDelete] = useState<string | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedEdgerunner, setSelectedEdgerunner] = useState<Character | null>(null)

    // Edit state
    const [editName, setEditName] = useState('')
    const [editHandle, setEditHandle] = useState('')
    const [editNotes, setEditNotes] = useState('')

    const handleCreateNew = () => {
        navigate(NavigationPaths.CHARACTER_CREATOR)
    }

    const handleViewClick = (edgerunner: Character) => {
        setSelectedEdgerunner(edgerunner)
        setViewDialogOpen(true)
    }

    const handleEditClick = (edgerunner: Character) => {
        setSelectedEdgerunner(edgerunner)
        setEditName(edgerunner.name)
        setEditHandle(edgerunner.handle)
        setEditNotes(edgerunner.notes || '')
        setEditDialogOpen(true)
    }

    const handleEditSave = () => {
        if (selectedEdgerunner) {
            updateEdgerunner(selectedEdgerunner.id, {
                name: editName,
                handle: editHandle,
                notes: editNotes,
            })
        }
        setEditDialogOpen(false)
        setSelectedEdgerunner(null)
    }

    const handleDeleteClick = (id: string) => {
        setEdgerunnerToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (edgerunnerToDelete) {
            deleteEdgerunner(edgerunnerToDelete)
        }
        setDeleteDialogOpen(false)
        setEdgerunnerToDelete(null)
    }

    const handleClearAllClick = () => {
        setClearAllDialogOpen(true)
    }

    const handleClearConfirm = () => {
        clearEdgerunners()
        setClearAllDialogOpen(false)
    }

    const getStatColor = (value: number) => {
        if (value >= 8) return colors.neons.green.default
        if (value >= 6) return colors.neons.yellow.default
        if (value >= 4) return colors.neons.orange.default
        return colors.neons.red.default
    }

    return (
        <Container maxWidth={false} sx={{ pt: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                    variant="h3"
                    className="glitch-text"
                    data-text={t('modules.EDGERUNNERS')}
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                        flexGrow: 1,
                    }}
                >
                    {t('modules.EDGERUNNERS')}
                </Typography>
            </Stack>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    mb: 1,
                }}
            >
                {t('modules.EDGERUNNERS_DESCRIPTION')}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateNew}
                    sx={{
                        backgroundColor: colors.neons.cyan.default,
                        color: colors.grays.gray900,
                        fontWeight: 'bold',
                        '&:hover': {
                            backgroundColor: colors.neons.cyan.light,
                        },
                    }}
                >
                    {t('edgerunners.createNew')}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllClick}
                    disabled={edgerunners.length === 0}
                >
                    {t('common.clearAll')}
                </Button>
            </Stack>

            {edgerunners.length === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        border: `1px dashed ${colors.neons.cyan.default}40`,
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 30, 40, 0.2)',
                    }}
                >
                    <Casino sx={{ fontSize: 64, color: colors.neons.cyan.default, mb: 2, opacity: 0.5 }} />
                    <Typography
                        variant="h6"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                            fontFamily: '"Orbitron", monospace',
                            letterSpacing: '1px',
                        }}
                    >
                        {t('edgerunners.noEdgerunners')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.grays.gray300, mt: 1 }}>
                        {t('edgerunners.createFirstHint')}
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {edgerunners.map((edgerunner) => (
                        <Grid key={edgerunner.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card
                                sx={{
                                    backgroundColor: 'rgba(0, 20, 30, 0.8)',
                                    border: `1px solid ${ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default}40`,
                                    '&:hover': {
                                        borderColor: ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default,
                                        boxShadow: `0 0 15px ${
                                            ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default
                                        }40`,
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <CardContent sx={{ pb: 1 }}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        mb={1}
                                    >
                                        <Box>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    color: colors.grays.gray000,
                                                    fontFamily: '"Orbitron", monospace',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {edgerunner.handle || edgerunner.name}
                                            </Typography>
                                            {edgerunner.handle && (
                                                <Typography variant="caption" sx={{ color: colors.grays.gray400 }}>
                                                    {edgerunner.name}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Chip
                                            label={t(`characterCreator.roles.${edgerunner.role}`)}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${ROLE_COLORS[edgerunner.role]}30`,
                                                color: ROLE_COLORS[edgerunner.role],
                                                border: `1px solid ${ROLE_COLORS[edgerunner.role]}`,
                                                fontFamily: '"Rajdhani", sans-serif',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    </Stack>

                                    {/* Stats Grid */}
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(5, 1fr)',
                                            gap: 0.5,
                                            mb: 1,
                                        }}
                                    >
                                        {Object.entries(edgerunner.stats).map(([stat, value]) => (
                                            <Tooltip key={stat} title={stat} arrow>
                                                <Box
                                                    sx={{
                                                        textAlign: 'center',
                                                        py: 0.25,
                                                        px: 0.5,
                                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${getStatColor(value)}30`,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: colors.grays.gray500,
                                                            fontSize: '0.6rem',
                                                            display: 'block',
                                                        }}
                                                    >
                                                        {stat}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: getStatColor(value),
                                                            fontWeight: 'bold',
                                                            fontFamily: '"Orbitron", monospace',
                                                        }}
                                                    >
                                                        {value}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        ))}
                                    </Box>

                                    {/* Derived Stats */}
                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                        <Chip
                                            label={`HP: ${edgerunner.derivedStats.HP}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                                color: colors.neons.red.default,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                        <Chip
                                            label={`HUM: ${edgerunner.derivedStats.HumanityCurrent}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(255, 0, 255, 0.2)',
                                                color: colors.neons.pink.default,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                        <Chip
                                            label={t(`characterCreator.methods.${edgerunner.creationMethod}`)}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                                color: colors.neons.cyan.default,
                                                fontSize: '0.65rem',
                                            }}
                                        />
                                    </Stack>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                    <Tooltip title={t('common.view')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewClick(edgerunner)}
                                            sx={{ color: colors.neons.cyan.default }}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('common.edit')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(edgerunner)}
                                            sx={{ color: colors.neons.yellow.default }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('common.delete')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(edgerunner.id)}
                                            sx={{ color: colors.neons.red.default }}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* View Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.grays.gray900,
                        border: `1px solid ${colors.neons.cyan.default}`,
                    },
                }}
            >
                {selectedEdgerunner && (
                    <>
                        <DialogTitle
                            sx={{
                                color: colors.neons.cyan.default,
                                fontFamily: '"Orbitron", monospace',
                                borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                            }}
                        >
                            {selectedEdgerunner.handle || selectedEdgerunner.name}
                            <Chip
                                label={t(`characterCreator.roles.${selectedEdgerunner.role}`)}
                                size="small"
                                sx={{
                                    ml: 2,
                                    backgroundColor: `${ROLE_COLORS[selectedEdgerunner.role]}30`,
                                    color: ROLE_COLORS[selectedEdgerunner.role],
                                    border: `1px solid ${ROLE_COLORS[selectedEdgerunner.role]}`,
                                }}
                            />
                        </DialogTitle>
                        <DialogContent sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                {/* Stats Section */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ color: colors.neons.green.default, mb: 1, fontWeight: 'bold' }}
                                    >
                                        {t('characterCreator.steps.STATS')}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(5, 1fr)',
                                            gap: 1,
                                        }}
                                    >
                                        {Object.entries(selectedEdgerunner.stats).map(([stat, value]) => (
                                            <Box
                                                key={stat}
                                                sx={{
                                                    textAlign: 'center',
                                                    py: 1,
                                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                    borderRadius: '4px',
                                                    border: `1px solid ${getStatColor(value)}50`,
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ color: colors.grays.gray400 }}>
                                                    {stat}
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: getStatColor(value),
                                                        fontWeight: 'bold',
                                                        fontFamily: '"Orbitron", monospace',
                                                    }}
                                                >
                                                    {value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>

                                {/* Derived Stats Section */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ color: colors.neons.green.default, mb: 1, fontWeight: 'bold' }}
                                    >
                                        {t('characterCreator.derivedStats')}
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Typography sx={{ color: colors.grays.gray200 }}>
                                            HP: <strong>{selectedEdgerunner.derivedStats.HP}</strong> (Seriously
                                            Wounded: {selectedEdgerunner.derivedStats.SeriouslyWoundedThreshold})
                                        </Typography>
                                        <Typography sx={{ color: colors.grays.gray200 }}>
                                            Death Save: <strong>{selectedEdgerunner.derivedStats.DeathSave}</strong>
                                        </Typography>
                                        <Typography sx={{ color: colors.grays.gray200 }}>
                                            Humanity: <strong>{selectedEdgerunner.derivedStats.HumanityCurrent}</strong>{' '}
                                            / {selectedEdgerunner.derivedStats.HumanityMax}
                                        </Typography>
                                    </Stack>
                                </Grid>

                                {/* Lifepath Section */}
                                <Grid size={12}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ color: colors.neons.green.default, mb: 1, fontWeight: 'bold' }}
                                    >
                                        {t('characterCreator.steps.LIFEPATH')}
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: colors.grays.gray400 }}>
                                                {t('characterCreator.lifepath.culturalOrigin')}
                                            </Typography>
                                            <Typography sx={{ color: colors.grays.gray200 }}>
                                                {selectedEdgerunner.lifepath.culturalOrigin.region}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: colors.grays.gray400 }}>
                                                {t('characterCreator.lifepath.personality')}
                                            </Typography>
                                            <Typography sx={{ color: colors.grays.gray200 }}>
                                                {selectedEdgerunner.lifepath.personality.description}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: colors.grays.gray400 }}>
                                                {t('characterCreator.lifepath.dressStyle')}
                                            </Typography>
                                            <Typography sx={{ color: colors.grays.gray200 }}>
                                                {selectedEdgerunner.lifepath.dressStyle.clothingStyle}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" sx={{ color: colors.grays.gray400 }}>
                                                {t('characterCreator.lifepath.lifeGoal')}
                                            </Typography>
                                            <Typography sx={{ color: colors.grays.gray200 }}>
                                                {selectedEdgerunner.lifepath.lifeGoal.description}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Notes Section */}
                                {selectedEdgerunner.notes && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ color: colors.neons.green.default, mb: 1, fontWeight: 'bold' }}
                                        >
                                            {t('common.notes')}
                                        </Typography>
                                        <Typography sx={{ color: colors.grays.gray200, whiteSpace: 'pre-wrap' }}>
                                            {selectedEdgerunner.notes}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ borderTop: `1px solid ${colors.neons.cyan.default}40`, p: 2 }}>
                            <Button onClick={() => setViewDialogOpen(false)} sx={{ color: colors.neons.cyan.default }}>
                                {t('common.close')}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.grays.gray900,
                        border: `1px solid ${colors.neons.yellow.default}`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: colors.neons.yellow.default,
                        fontFamily: '"Orbitron", monospace',
                        borderBottom: `1px solid ${colors.neons.yellow.default}40`,
                    }}
                >
                    {t('common.edit')} - {selectedEdgerunner?.handle || selectedEdgerunner?.name}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label={t('characterCreator.name')}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: colors.grays.gray000,
                                    '& fieldset': { borderColor: colors.neons.yellow.default + '50' },
                                    '&:hover fieldset': { borderColor: colors.neons.yellow.default },
                                    '&.Mui-focused fieldset': { borderColor: colors.neons.yellow.default },
                                },
                                '& .MuiInputLabel-root': { color: colors.grays.gray400 },
                            }}
                        />
                        <TextField
                            label={t('characterCreator.handle')}
                            value={editHandle}
                            onChange={(e) => setEditHandle(e.target.value)}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: colors.grays.gray000,
                                    '& fieldset': { borderColor: colors.neons.yellow.default + '50' },
                                    '&:hover fieldset': { borderColor: colors.neons.yellow.default },
                                    '&.Mui-focused fieldset': { borderColor: colors.neons.yellow.default },
                                },
                                '& .MuiInputLabel-root': { color: colors.grays.gray400 },
                            }}
                        />
                        <TextField
                            label={t('common.notes')}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            fullWidth
                            multiline
                            rows={4}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: colors.grays.gray000,
                                    '& fieldset': { borderColor: colors.neons.yellow.default + '50' },
                                    '&:hover fieldset': { borderColor: colors.neons.yellow.default },
                                    '&.Mui-focused fieldset': { borderColor: colors.neons.yellow.default },
                                },
                                '& .MuiInputLabel-root': { color: colors.grays.gray400 },
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${colors.neons.yellow.default}40`, p: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ color: colors.grays.gray400 }}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleEditSave}
                        variant="contained"
                        sx={{
                            backgroundColor: colors.neons.yellow.default,
                            color: colors.grays.gray900,
                            '&:hover': { backgroundColor: colors.neons.yellow.light },
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <WarningDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('common.deleteConfirmTitle')}
                message={t('common.deleteConfirmMessage', { type: t('modules.EDGERUNNERS').toLowerCase() })}
                moduleType={ModuleTypes.EDGERUNNERS}
                isDelete={true}
                isClearAll={false}
            />

            {/* Clear All Confirmation Dialog */}
            <WarningDialog
                open={clearAllDialogOpen}
                onClose={() => setClearAllDialogOpen(false)}
                onConfirm={handleClearConfirm}
                title={t('common.clearAllConfirmTitle')}
                message={t('common.clearAllConfirmMessage', { type: t('modules.EDGERUNNERS').toLowerCase() })}
                moduleType={ModuleTypes.EDGERUNNERS}
                isDelete={true}
                isClearAll={true}
            />
        </Container>
    )
}

export default EdgerunnersView
