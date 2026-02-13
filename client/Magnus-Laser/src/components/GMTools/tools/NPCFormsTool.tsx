import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
    FormControlLabel,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import type { NPCFormSimple, NPCFormComplex } from '../../../types/soloPlay'
import colors from '../../../utils/colors'
import {
    generateRandomName,
    generateHandle,
    generateNPCByRole,
} from '../../../utils/generators/soloPlayTablesExpanded'
import { generateQuickMood } from '../../../utils/generators/soloPlayUtils'
import { useGMToolsDataStore } from '../GMToolsDataStore'
import {
    getCyberpunkTextFieldStyle,
    getCyberpunkButtonStyle,
    getCyberpunkPaperStyle,
    getSectionTitleStyle,
} from '../GMToolsStyles'

const STAT_NAMES = ['int', 'ref', 'dex', 'tech', 'cool', 'will', 'luck', 'move', 'body', 'emp'] as const

const isComplex = (npc: NPCFormSimple | NPCFormComplex): npc is NPCFormComplex => {
    return 'hp' in npc || 'int' in npc || 'attacks' in npc
}

const NPCFormsTool = () => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    const { npcForms, addNPCForm, updateNPCForm, deleteNPCForm } = useGMToolsDataStore()

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isComplexMode, setIsComplexMode] = useState(false)

    // Form fields
    const [name, setName] = useState('')
    const [handle, setHandle] = useState('')
    const [role, setRole] = useState('')
    const [look, setLook] = useState('')
    const [doField, setDoField] = useState('')
    const [quirk, setQuirk] = useState('')
    const [mood, setMood] = useState('')
    const [npcNotes, setNpcNotes] = useState('')

    // Complex fields
    const [stats, setStats] = useState<Record<string, number>>({})
    const [hp, setHp] = useState<number | ''>('')
    const [initiative, setInitiative] = useState<number | ''>('')
    const [reputation, setReputation] = useState<number | ''>('')
    const [importantSkills, setImportantSkills] = useState('')
    const [attacks, setAttacks] = useState('')
    const [armorHead, setArmorHead] = useState('')
    const [armorBody, setArmorBody] = useState('')
    const [gear, setGear] = useState('')
    const [cyberware, setCyberware] = useState('')

    // Edit state
    const [editingNpc, setEditingNpc] = useState<(NPCFormSimple | NPCFormComplex) | null>(null)
    const [editIsComplex, setEditIsComplex] = useState(false)

    // Styles
    const accentColor = colors.neons.cyan.default
    const textFieldStyle = getCyberpunkTextFieldStyle(readerMode, accentColor)
    const buttonStyle = getCyberpunkButtonStyle(readerMode, accentColor)
    const titleStyle = getSectionTitleStyle(readerMode, accentColor)

    const resetForm = () => {
        setName('')
        setHandle('')
        setRole('')
        setLook('')
        setDoField('')
        setQuirk('')
        setMood('')
        setNpcNotes('')
        setStats({})
        setHp('')
        setInitiative('')
        setReputation('')
        setImportantSkills('')
        setAttacks('')
        setArmorHead('')
        setArmorBody('')
        setGear('')
        setCyberware('')
        setIsComplexMode(false)
    }

    const handleCreate = () => {
        if (!name.trim()) return

        const base: NPCFormSimple = {
            id: uuidv4(),
            name: name.trim(),
            handle: handle.trim() || undefined,
            role: role.trim() || undefined,
            look: look.trim(),
            do: doField.trim(),
            quirk: quirk.trim(),
            mood: mood.trim() || undefined,
            notes: npcNotes.trim() || undefined,
            createdAt: Date.now(),
        }

        if (isComplexMode) {
            const complex: NPCFormComplex = {
                ...base,
                ...(stats.int !== undefined && { int: stats.int }),
                ...(stats.ref !== undefined && { ref: stats.ref }),
                ...(stats.dex !== undefined && { dex: stats.dex }),
                ...(stats.tech !== undefined && { tech: stats.tech }),
                ...(stats.cool !== undefined && { cool: stats.cool }),
                ...(stats.will !== undefined && { will: stats.will }),
                ...(stats.luck !== undefined && { luck: stats.luck }),
                ...(stats.move !== undefined && { move: stats.move }),
                ...(stats.body !== undefined && { body: stats.body }),
                ...(stats.emp !== undefined && { emp: stats.emp }),
                ...(hp !== '' && { hp }),
                ...(initiative !== '' && { initiative }),
                ...(reputation !== '' && { reputation }),
                ...(importantSkills.trim() && { importantSkills: importantSkills.trim() }),
                ...(attacks.trim() && { attacks: attacks.trim() }),
                ...(armorHead.trim() && { armorHead: armorHead.trim() }),
                ...(armorBody.trim() && { armorBody: armorBody.trim() }),
                ...(gear.trim() && { gear: gear.trim() }),
                ...(cyberware.trim() && { cyberware: cyberware.trim() }),
            }
            addNPCForm(complex)
        } else {
            addNPCForm(base)
        }

        resetForm()
        setDialogOpen(false)
    }

    const handleSaveEdit = () => {
        if (!editingNpc) return
        updateNPCForm(editingNpc.id, editingNpc)
        setEditingNpc(null)
    }

    const renderStatField = (
        statName: string,
        value: number | undefined,
        onChange: (val: number | undefined) => void,
        color: string
    ) => (
        <TextField
            label={statName.toUpperCase()}
            type="number"
            value={value ?? ''}
            onChange={(e) => {
                const v = e.target.value
                onChange(v === '' ? undefined : parseInt(v))
            }}
            size="small"
            inputProps={{ min: 1, max: 10 }}
            sx={{
                ...getCyberpunkTextFieldStyle(readerMode, color),
                width: '100%',
                '& .MuiOutlinedInput-input': { textAlign: 'center', py: 1 },
            }}
        />
    )

    const renderNPCCard = (npc: NPCFormSimple | NPCFormComplex) => {
        const npcIsComplex = isComplex(npc)
        const cardColor = npcIsComplex ? colors.neons.purple.default : accentColor

        return (
            <Paper
                key={npc.id}
                sx={{
                    ...getCyberpunkPaperStyle(readerMode, cardColor),
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
                                    color: readerMode ? colors.grays.gray000 : cardColor,
                                    fontFamily: '"Orbitron", sans-serif',
                                    fontWeight: 'bold',
                                }}
                            >
                                {npc.name}
                            </Typography>
                            {npc.handle && (
                                <Typography
                                    variant="caption"
                                    sx={{ color: colors.grays.gray500, fontStyle: 'italic' }}
                                >
                                    "{npc.handle}"
                                </Typography>
                            )}
                            <Chip
                                label={npcIsComplex ? t('soloPlay.npcForms.complex') : t('soloPlay.npcForms.simple')}
                                size="small"
                                sx={{
                                    backgroundColor: `${cardColor}30`,
                                    color: cardColor,
                                    fontSize: '0.6rem',
                                    height: 18,
                                }}
                            />
                        </Stack>
                        {npc.role && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: colors.neons.yellow.default,
                                    fontFamily: '"Lexend", sans-serif',
                                    display: 'block',
                                }}
                            >
                                {npc.role}
                            </Typography>
                        )}
                        {npc.look && (
                            <Typography
                                variant="caption"
                                sx={{ color: colors.grays.gray500, display: 'block' }}
                            >
                                {t('soloPlay.npcForms.look')}: {npc.look}
                            </Typography>
                        )}
                        {npc.do && (
                            <Typography
                                variant="caption"
                                sx={{ color: colors.grays.gray500, display: 'block' }}
                            >
                                {t('soloPlay.npcForms.do')}: {npc.do}
                            </Typography>
                        )}
                        {npc.quirk && (
                            <Typography
                                variant="caption"
                                sx={{ color: colors.grays.gray500, display: 'block' }}
                            >
                                {t('soloPlay.npcForms.quirk')}: {npc.quirk}
                            </Typography>
                        )}
                        {npc.mood && (
                            <Chip
                                label={npc.mood}
                                size="small"
                                sx={{
                                    mt: 0.5,
                                    backgroundColor: `${colors.neons.orange.default}30`,
                                    color: colors.neons.orange.default,
                                    fontSize: '0.6rem',
                                    height: 18,
                                }}
                            />
                        )}
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title={t('common.edit')}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEditingNpc({ ...npc })
                                    setEditIsComplex(isComplex(npc))
                                }}
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
                        <Tooltip title={t('common.delete')}>
                            <IconButton
                                size="small"
                                onClick={() => deleteNPCForm(npc.id)}
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

                {/* Complex NPC Stats */}
                {npcIsComplex && (
                    <Accordion
                        sx={{
                            mt: 1.5,
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            '&::before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore sx={{ color: colors.grays.gray500 }} />}
                            sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 0.5 } }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ color: colors.grays.gray500, textTransform: 'uppercase', letterSpacing: '1px' }}
                            >
                                {t('soloPlay.npcForms.stats')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0 }}>
                            {/* Stat Grid */}
                            <Grid container spacing={0.5} sx={{ mb: 1 }}>
                                {STAT_NAMES.map((stat) => {
                                    const val = (npc as NPCFormComplex)[stat]
                                    if (val === undefined) return null
                                    return (
                                        <Grid size={{ xs: 2.4 }} key={stat}>
                                            <Box
                                                sx={{
                                                    textAlign: 'center',
                                                    p: 0.5,
                                                    borderRadius: 1,
                                                    backgroundColor: readerMode
                                                        ? 'rgba(0,0,0,0.05)'
                                                        : 'rgba(0,0,0,0.3)',
                                                    border: `1px solid ${colors.neons.purple.default}30`,
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: colors.neons.purple.default,
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontSize: '0.55rem',
                                                        display: 'block',
                                                    }}
                                                >
                                                    {stat.toUpperCase()}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: readerMode ? colors.grays.gray000 : '#fff',
                                                        fontFamily: '"Orbitron", sans-serif',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {val}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )
                                })}
                            </Grid>

                            {/* Combat Stats */}
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1}>
                                {(npc as NPCFormComplex).hp !== undefined && (
                                    <Chip
                                        label={`${t('soloPlay.npcForms.hpLabel')}: ${(npc as NPCFormComplex).hp}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${colors.neons.red.default}30`,
                                            color: colors.neons.red.default,
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                                {(npc as NPCFormComplex).initiative !== undefined && (
                                    <Chip
                                        label={`${t('soloPlay.npcForms.initLabel')}: ${(npc as NPCFormComplex).initiative}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${colors.neons.yellow.default}30`,
                                            color: colors.neons.yellow.default,
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                                {(npc as NPCFormComplex).reputation !== undefined && (
                                    <Chip
                                        label={`${t('soloPlay.npcForms.repLabel')}: ${(npc as NPCFormComplex).reputation}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${colors.neons.green.default}30`,
                                            color: colors.neons.green.default,
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                            </Stack>

                            {/* Equipment */}
                            {(npc as NPCFormComplex).importantSkills && (
                                <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block' }}>
                                    <strong>{t('soloPlay.npcForms.skills')}:</strong> {(npc as NPCFormComplex).importantSkills}
                                </Typography>
                            )}
                            {(npc as NPCFormComplex).attacks && (
                                <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block' }}>
                                    <strong>{t('soloPlay.npcForms.attacks')}:</strong> {(npc as NPCFormComplex).attacks}
                                </Typography>
                            )}
                            {((npc as NPCFormComplex).armorHead || (npc as NPCFormComplex).armorBody) && (
                                <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block' }}>
                                    <strong>{t('soloPlay.npcForms.armor')}:</strong>{' '}
                                    {(npc as NPCFormComplex).armorHead && `${t('soloPlay.npcForms.headPrefix')}: ${(npc as NPCFormComplex).armorHead}`}
                                    {(npc as NPCFormComplex).armorHead && (npc as NPCFormComplex).armorBody && ' | '}
                                    {(npc as NPCFormComplex).armorBody && `${t('soloPlay.npcForms.bodyPrefix')}: ${(npc as NPCFormComplex).armorBody}`}
                                </Typography>
                            )}
                            {(npc as NPCFormComplex).gear && (
                                <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block' }}>
                                    <strong>{t('soloPlay.npcForms.gear')}:</strong> {(npc as NPCFormComplex).gear}
                                </Typography>
                            )}
                            {(npc as NPCFormComplex).cyberware && (
                                <Typography variant="caption" sx={{ color: colors.grays.gray500, display: 'block' }}>
                                    <strong>{t('soloPlay.npcForms.cyberware')}:</strong> {(npc as NPCFormComplex).cyberware}
                                </Typography>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Notes */}
                {npc.notes && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: colors.grays.gray600,
                            fontFamily: '"Lexend", sans-serif',
                            display: 'block',
                            mt: 1,
                            fontStyle: 'italic',
                        }}
                    >
                        {npc.notes}
                    </Typography>
                )}
            </Paper>
        )
    }

    const renderFormFields = (
        formName: string,
        formHandle: string,
        formRole: string,
        formLook: string,
        formDo: string,
        formQuirk: string,
        formMood: string,
        formNotes: string,
        setFormName: (v: string) => void,
        setFormHandle: (v: string) => void,
        setFormRole: (v: string) => void,
        setFormLook: (v: string) => void,
        setFormDo: (v: string) => void,
        setFormQuirk: (v: string) => void,
        setFormMood: (v: string) => void,
        setFormNotes: (v: string) => void,
        tfStyle: ReturnType<typeof getCyberpunkTextFieldStyle>,
        color: string
    ) => (
        <>
            {/* Name */}
            <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                    fullWidth
                    label={t('soloPlay.npcForms.name')}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t('soloPlay.npcForms.namePlaceholder')}
                    sx={tfStyle}
                />
                <Tooltip title={t('soloPlay.npcForms.randomName')}>
                    <IconButton
                        onClick={() => {
                            const result = generateRandomName()
                            setFormName(result.name)
                        }}
                        sx={{
                            color,
                            border: `1px solid ${color}40`,
                            borderRadius: 0,
                            '&:hover': { backgroundColor: `${color}20` },
                        }}
                    >
                        <Casino />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Handle */}
            <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                    fullWidth
                    label={t('soloPlay.npcForms.handle')}
                    value={formHandle}
                    onChange={(e) => setFormHandle(e.target.value)}
                    placeholder={t('soloPlay.npcForms.handlePlaceholder')}
                    sx={tfStyle}
                />
                <Tooltip title={t('soloPlay.npcForms.randomHandle')}>
                    <IconButton
                        onClick={() => setFormHandle(generateHandle())}
                        sx={{
                            color,
                            border: `1px solid ${color}40`,
                            borderRadius: 0,
                            '&:hover': { backgroundColor: `${color}20` },
                        }}
                    >
                        <Casino />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Role */}
            <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                    fullWidth
                    label={t('soloPlay.npcForms.role')}
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder={t('soloPlay.npcForms.rolePlaceholder')}
                    sx={tfStyle}
                />
                <Tooltip title={t('soloPlay.npcForms.randomRole')}>
                    <IconButton
                        onClick={() => {
                            const result = generateNPCByRole()
                            setFormRole(result.role)
                        }}
                        sx={{
                            color,
                            border: `1px solid ${color}40`,
                            borderRadius: 0,
                            '&:hover': { backgroundColor: `${color}20` },
                        }}
                    >
                        <Casino />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Look */}
            <TextField
                fullWidth
                label={t('soloPlay.npcForms.look')}
                value={formLook}
                onChange={(e) => setFormLook(e.target.value)}
                placeholder={t('soloPlay.npcForms.lookPlaceholder')}
                sx={tfStyle}
            />

            {/* Do */}
            <TextField
                fullWidth
                label={t('soloPlay.npcForms.do')}
                value={formDo}
                onChange={(e) => setFormDo(e.target.value)}
                placeholder={t('soloPlay.npcForms.doPlaceholder')}
                sx={tfStyle}
            />

            {/* Quirk */}
            <TextField
                fullWidth
                label={t('soloPlay.npcForms.quirk')}
                value={formQuirk}
                onChange={(e) => setFormQuirk(e.target.value)}
                placeholder={t('soloPlay.npcForms.quirkPlaceholder')}
                sx={tfStyle}
            />

            {/* Mood */}
            <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                    fullWidth
                    label={t('soloPlay.npcForms.mood')}
                    value={formMood}
                    onChange={(e) => setFormMood(e.target.value)}
                    placeholder={t('soloPlay.npcForms.moodPlaceholder')}
                    sx={tfStyle}
                />
                <Tooltip title={t('soloPlay.npcForms.randomMood')}>
                    <IconButton
                        onClick={() => setFormMood(generateQuickMood())}
                        sx={{
                            color,
                            border: `1px solid ${color}40`,
                            borderRadius: 0,
                            '&:hover': { backgroundColor: `${color}20` },
                        }}
                    >
                        <Casino />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Notes */}
            <TextField
                fullWidth
                label={t('soloPlay.npcForms.notes')}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t('soloPlay.npcForms.notesPlaceholder')}
                multiline
                rows={2}
                sx={tfStyle}
            />
        </>
    )

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={titleStyle}>
                    {t('soloPlay.npcForms.title')}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={buttonStyle}
                >
                    {t('soloPlay.npcForms.add')}
                </Button>
            </Stack>

            {npcForms.length === 0 ? (
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
                    {t('soloPlay.npcForms.noNPCs')}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {npcForms.map((npc) => renderNPCCard(npc))}
                </Stack>
            )}

            {/* Create NPC Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    resetForm()
                }}
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        {t('soloPlay.npcForms.create')}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isComplexMode}
                                    onChange={(e) => setIsComplexMode(e.target.checked)}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: colors.neons.purple.default,
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: colors.neons.purple.default,
                                        },
                                    }}
                                />
                            }
                            label={
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: isComplexMode ? colors.neons.purple.default : colors.grays.gray500,
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    {t('soloPlay.npcForms.complex')}
                                </Typography>
                            }
                        />
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    <Stack spacing={2}>
                        {renderFormFields(
                            name, handle, role, look, doField, quirk, mood, npcNotes,
                            setName, setHandle, setRole, setLook, setDoField, setQuirk, setMood, setNpcNotes,
                            textFieldStyle, accentColor
                        )}

                        {/* Complex Stats */}
                        {isComplexMode && (
                            <>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: colors.neons.purple.default,
                                        fontFamily: '"Orbitron", sans-serif',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        mt: 1,
                                    }}
                                >
                                    {t('soloPlay.npcForms.stats')}
                                </Typography>
                                <Grid container spacing={1}>
                                    {STAT_NAMES.map((stat) => (
                                        <Grid size={{ xs: 2.4 }} key={stat}>
                                            {renderStatField(
                                                stat,
                                                stats[stat],
                                                (val) => setStats((prev) => {
                                                    if (val === undefined) {
                                                        const next = { ...prev }
                                                        delete next[stat]
                                                        return next
                                                    }
                                                    return { ...prev, [stat]: val }
                                                }),
                                                colors.neons.purple.default
                                            )}
                                        </Grid>
                                    ))}
                                </Grid>

                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        label={t('soloPlay.npcForms.hpLabel')}
                                        type="number"
                                        value={hp}
                                        onChange={(e) => setHp(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        size="small"
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)}
                                    />
                                    <TextField
                                        label={t('soloPlay.npcForms.initLabel')}
                                        type="number"
                                        value={initiative}
                                        onChange={(e) => setInitiative(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        size="small"
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                                    />
                                    <TextField
                                        label={t('soloPlay.npcForms.repLabel')}
                                        type="number"
                                        value={reputation}
                                        onChange={(e) => setReputation(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        size="small"
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)}
                                    />
                                </Stack>

                                <TextField
                                    fullWidth
                                    label={t('soloPlay.npcForms.skills')}
                                    value={importantSkills}
                                    onChange={(e) => setImportantSkills(e.target.value)}
                                    placeholder={t('soloPlay.npcForms.skillsPlaceholder')}
                                    multiline
                                    rows={2}
                                    sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                                />
                                <TextField
                                    fullWidth
                                    label={t('soloPlay.npcForms.attacks')}
                                    value={attacks}
                                    onChange={(e) => setAttacks(e.target.value)}
                                    placeholder={t('soloPlay.npcForms.weaponsPlaceholder')}
                                    multiline
                                    rows={2}
                                    sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)}
                                />
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.npcForms.armorHead')}
                                        value={armorHead}
                                        onChange={(e) => setArmorHead(e.target.value)}
                                        placeholder={t('soloPlay.npcForms.armorHeadPlaceholder')}
                                        size="small"
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.npcForms.armorBody')}
                                        value={armorBody}
                                        onChange={(e) => setArmorBody(e.target.value)}
                                        placeholder={t('soloPlay.npcForms.armorBodyPlaceholder')}
                                        size="small"
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                                    />
                                </Stack>
                                <TextField
                                    fullWidth
                                    label={t('soloPlay.npcForms.gear')}
                                    value={gear}
                                    onChange={(e) => setGear(e.target.value)}
                                    placeholder={t('soloPlay.npcForms.gearPlaceholder')}
                                    sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)}
                                />
                                <TextField
                                    fullWidth
                                    label={t('soloPlay.npcForms.cyberware')}
                                    value={cyberware}
                                    onChange={(e) => setCyberware(e.target.value)}
                                    placeholder={t('soloPlay.npcForms.cyberwarePlaceholder')}
                                    sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)}
                                />
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}40` }}>
                    <Button
                        onClick={() => {
                            setDialogOpen(false)
                            resetForm()
                        }}
                        sx={{ color: colors.grays.gray600 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleCreate}
                        variant="outlined"
                        disabled={!name.trim()}
                        sx={buttonStyle}
                    >
                        {t('common.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit NPC Dialog */}
            <Dialog
                open={!!editingNpc}
                onClose={() => setEditingNpc(null)}
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
                    {t('soloPlay.npcForms.edit')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 1 }}>
                    {editingNpc && (
                        <Stack spacing={2}>
                            {renderFormFields(
                                editingNpc.name,
                                editingNpc.handle || '',
                                editingNpc.role || '',
                                editingNpc.look,
                                editingNpc.do,
                                editingNpc.quirk,
                                editingNpc.mood || '',
                                editingNpc.notes || '',
                                (v) => setEditingNpc({ ...editingNpc, name: v }),
                                (v) => setEditingNpc({ ...editingNpc, handle: v || undefined }),
                                (v) => setEditingNpc({ ...editingNpc, role: v || undefined }),
                                (v) => setEditingNpc({ ...editingNpc, look: v }),
                                (v) => setEditingNpc({ ...editingNpc, do: v }),
                                (v) => setEditingNpc({ ...editingNpc, quirk: v }),
                                (v) => setEditingNpc({ ...editingNpc, mood: v || undefined }),
                                (v) => setEditingNpc({ ...editingNpc, notes: v || undefined }),
                                getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default),
                                colors.neons.purple.default
                            )}

                            {editIsComplex && (
                                <>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: colors.neons.purple.default,
                                            fontFamily: '"Orbitron", sans-serif',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        {t('soloPlay.npcForms.stats')}
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {STAT_NAMES.map((stat) => (
                                            <Grid size={{ xs: 2.4 }} key={stat}>
                                                {renderStatField(
                                                    stat,
                                                    (editingNpc as NPCFormComplex)[stat],
                                                    (val) =>
                                                        setEditingNpc({
                                                            ...editingNpc,
                                                            [stat]: val,
                                                        }),
                                                    colors.neons.purple.default
                                                )}
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            label={t('soloPlay.npcForms.hpLabel')}
                                            type="number"
                                            value={(editingNpc as NPCFormComplex).hp ?? ''}
                                            onChange={(e) =>
                                                setEditingNpc({
                                                    ...editingNpc,
                                                    hp: e.target.value === '' ? undefined : parseInt(e.target.value),
                                                })
                                            }
                                            size="small"
                                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)}
                                        />
                                        <TextField
                                            label={t('soloPlay.npcForms.initLabel')}
                                            type="number"
                                            value={(editingNpc as NPCFormComplex).initiative ?? ''}
                                            onChange={(e) =>
                                                setEditingNpc({
                                                    ...editingNpc,
                                                    initiative: e.target.value === '' ? undefined : parseInt(e.target.value),
                                                })
                                            }
                                            size="small"
                                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                                        />
                                        <TextField
                                            label={t('soloPlay.npcForms.repLabel')}
                                            type="number"
                                            value={(editingNpc as NPCFormComplex).reputation ?? ''}
                                            onChange={(e) =>
                                                setEditingNpc({
                                                    ...editingNpc,
                                                    reputation: e.target.value === '' ? undefined : parseInt(e.target.value),
                                                })
                                            }
                                            size="small"
                                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)}
                                        />
                                    </Stack>
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.npcForms.skills')}
                                        value={(editingNpc as NPCFormComplex).importantSkills || ''}
                                        onChange={(e) =>
                                            setEditingNpc({ ...editingNpc, importantSkills: e.target.value || undefined })
                                        }
                                        multiline
                                        rows={2}
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.purple.default)}
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.npcForms.attacks')}
                                        value={(editingNpc as NPCFormComplex).attacks || ''}
                                        onChange={(e) =>
                                            setEditingNpc({ ...editingNpc, attacks: e.target.value || undefined })
                                        }
                                        multiline
                                        rows={2}
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.red.default)}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            fullWidth
                                            label={t('soloPlay.npcForms.armorHead')}
                                            value={(editingNpc as NPCFormComplex).armorHead || ''}
                                            onChange={(e) =>
                                                setEditingNpc({ ...editingNpc, armorHead: e.target.value || undefined })
                                            }
                                            size="small"
                                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                                        />
                                        <TextField
                                            fullWidth
                                            label={t('soloPlay.npcForms.armorBody')}
                                            value={(editingNpc as NPCFormComplex).armorBody || ''}
                                            onChange={(e) =>
                                                setEditingNpc({ ...editingNpc, armorBody: e.target.value || undefined })
                                            }
                                            size="small"
                                            sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.yellow.default)}
                                        />
                                    </Stack>
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.npcForms.gear')}
                                        value={(editingNpc as NPCFormComplex).gear || ''}
                                        onChange={(e) =>
                                            setEditingNpc({ ...editingNpc, gear: e.target.value || undefined })
                                        }
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.green.default)}
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('soloPlay.npcForms.cyberware')}
                                        value={(editingNpc as NPCFormComplex).cyberware || ''}
                                        onChange={(e) =>
                                            setEditingNpc({ ...editingNpc, cyberware: e.target.value || undefined })
                                        }
                                        sx={getCyberpunkTextFieldStyle(readerMode, colors.neons.cyan.default)}
                                    />
                                </>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neons.purple.default}40` }}>
                    <Button
                        onClick={() => setEditingNpc(null)}
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

export default NPCFormsTool
