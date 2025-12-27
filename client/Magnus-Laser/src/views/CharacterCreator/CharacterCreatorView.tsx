import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Casino from '@mui/icons-material/Casino'
import Check from '@mui/icons-material/Check'
import Person from '@mui/icons-material/Person'
import RestartAlt from '@mui/icons-material/RestartAlt'
import SaveAlt from '@mui/icons-material/SaveAlt'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGMToolsDataStore } from '../../components/GMTools/GMToolsDataStore'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import NavigationPaths from '../../navigation'
import type {
    Armor,
    Character,
    CharacterStats,
    CreationMethod,
    CreationStep,
    Cyberware,
    GearItem,
    Role,
    Weapon,
} from '../../types/characterCreator'
import colors from '../../utils/colors'
import { 
    ROLES, 
    calculateDerivedStats,
    SHOP_WEAPONS,
    SHOP_ARMOR,
    SHOP_GEAR,
    SHOP_CYBERWARE,
    type ShopWeapon,
    type ShopArmor,
    type ShopGear,
    type ShopCyberware,
} from '../../utils/generators/characterCreatorData'
import {
    createCharacter,
    generateLifepath,
    generateStreetratStats,
    recalculateDerivedStats,
} from '../../utils/generators/characterCreatorUtils'

const BASE_STEPS: CreationStep[] = [
    'METHOD_SELECTION',
    'ROLE_SELECTION',
    'STATS',
    'SKILLS',
    'LIFEPATH',
    'FINISHING',
]

const COMPLETE_PACKAGE_STEPS: CreationStep[] = [
    'METHOD_SELECTION',
    'ROLE_SELECTION',
    'STATS',
    'SKILLS',
    'GEAR_SHOPPING',
    'LIFEPATH',
    'FINISHING',
]

const BASE_STEP_LABELS = [
    'Method',
    'Role',
    'Stats',
    'Skills',
    'Lifepath',
    'Finish',
]

const COMPLETE_PACKAGE_STEP_LABELS = [
    'Method',
    'Role',
    'Stats',
    'Skills',
    'Shopping',
    'Lifepath',
    'Finish',
]

const CharacterCreatorView = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { readerMode } = useUserPreferences()
    const { addEdgerunner } = useGMToolsDataStore()

    // Creation state
    const [currentStep, setCurrentStep] = useState<number>(0)
    const [method, setMethod] = useState<CreationMethod | null>(null)
    const [role, setRole] = useState<Role | null>(null)
    const [character, setCharacter] = useState<Character | null>(null)
    const [characterName, setCharacterName] = useState('')
    const [characterHandle, setCharacterHandle] = useState('')

    // Dialog state
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    
    // Shopping tab state
    const [shoppingTab, setShoppingTab] = useState<'weapons' | 'armor' | 'gear' | 'cyberware'>('weapons')
    
    // Dynamic steps based on method
    const STEPS = method === 'COMPLETE_PACKAGE' ? COMPLETE_PACKAGE_STEPS : BASE_STEPS
    const STEP_LABELS = method === 'COMPLETE_PACKAGE' ? COMPLETE_PACKAGE_STEP_LABELS : BASE_STEP_LABELS

    const handleMethodSelect = (selectedMethod: CreationMethod) => {
        setMethod(selectedMethod)
        setCurrentStep(1)
    }

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole)
        // Create initial character
        const newCharacter = createCharacter(
            method!,
            selectedRole,
            characterName || 'New Character',
            characterHandle || 'Handle'
        )
        setCharacter(newCharacter)
        setCurrentStep(2)
    }

    const handleRerollStats = () => {
        if (!character || !role) return
        const { stats } = generateStreetratStats(role)
        const updatedCharacter = {
            ...character,
            stats,
        }
        setCharacter(recalculateDerivedStats(updatedCharacter))
    }

    const handleRerollLifepath = () => {
        if (!character) return
        const newLifepath = generateLifepath()
        setCharacter({
            ...character,
            lifepath: newLifepath,
            updatedAt: Date.now(),
        })
    }

    const handleStatChange = (stat: keyof CharacterStats, value: number) => {
        if (!character) return
        const updatedCharacter = {
            ...character,
            stats: {
                ...character.stats,
                [stat]: value,
            },
        }
        setCharacter(recalculateDerivedStats(updatedCharacter))
    }

    const handleSkillChange = (skillIndex: number, value: number) => {
        if (!character) return
        const updatedSkills = [...character.skills]
        updatedSkills[skillIndex] = {
            ...updatedSkills[skillIndex],
            level: value,
        }
        setCharacter({
            ...character,
            skills: updatedSkills,
            updatedAt: Date.now(),
        })
    }

    // Shopping functions for Complete Package
    const handleBuyWeapon = (shopWeapon: ShopWeapon) => {
        if (!character || character.eurobucks < shopWeapon.cost) return
        const newWeapon: Weapon = {
            name: shopWeapon.name,
            type: shopWeapon.type,
            damage: shopWeapon.damage,
            rof: shopWeapon.rof,
            cost: shopWeapon.cost,
        }
        setCharacter({
            ...character,
            weapons: [...character.weapons, newWeapon],
            eurobucks: character.eurobucks - shopWeapon.cost,
            updatedAt: Date.now(),
        })
    }

    const handleSellWeapon = (index: number) => {
        if (!character) return
        const weapon = character.weapons[index]
        const refund = Math.floor(weapon.cost / 2) // 50% refund
        setCharacter({
            ...character,
            weapons: character.weapons.filter((_, i) => i !== index),
            eurobucks: character.eurobucks + refund,
            updatedAt: Date.now(),
        })
    }

    const handleBuyArmor = (shopArmor: ShopArmor) => {
        if (!character || character.eurobucks < shopArmor.cost) return
        const newArmor: Armor = {
            name: shopArmor.name,
            sp: shopArmor.sp,
            penalty: shopArmor.penalty,
            cost: shopArmor.cost,
        }
        setCharacter({
            ...character,
            armor: [...character.armor, newArmor],
            eurobucks: character.eurobucks - shopArmor.cost,
            updatedAt: Date.now(),
        })
    }

    const handleSellArmor = (index: number) => {
        if (!character) return
        const armor = character.armor[index]
        const refund = Math.floor(armor.cost / 2)
        setCharacter({
            ...character,
            armor: character.armor.filter((_, i) => i !== index),
            eurobucks: character.eurobucks + refund,
            updatedAt: Date.now(),
        })
    }

    const handleBuyGear = (shopGear: ShopGear) => {
        if (!character || character.eurobucks < shopGear.cost) return
        const newGear: GearItem = {
            name: shopGear.name,
            description: shopGear.description,
            cost: shopGear.cost,
        }
        setCharacter({
            ...character,
            gear: [...character.gear, newGear],
            eurobucks: character.eurobucks - shopGear.cost,
            updatedAt: Date.now(),
        })
    }

    const handleSellGear = (index: number) => {
        if (!character) return
        const item = character.gear[index]
        const refund = Math.floor(item.cost / 2)
        setCharacter({
            ...character,
            gear: character.gear.filter((_, i) => i !== index),
            eurobucks: character.eurobucks + refund,
            updatedAt: Date.now(),
        })
    }

    const handleBuyCyberware = (shopCyber: ShopCyberware) => {
        if (!character || character.eurobucks < shopCyber.cost) return
        const newCyberware: Cyberware = {
            name: shopCyber.name,
            type: shopCyber.type,
            description: shopCyber.description,
            humanityLoss: shopCyber.humanityLoss,
            cost: shopCyber.cost,
        }
        setCharacter({
            ...character,
            cyberware: [...character.cyberware, newCyberware],
            eurobucks: character.eurobucks - shopCyber.cost,
            derivedStats: {
                ...character.derivedStats,
                HumanityCurrent: character.derivedStats.HumanityCurrent - shopCyber.humanityLoss,
            },
            updatedAt: Date.now(),
        })
    }

    const handleSellCyberware = (index: number) => {
        if (!character) return
        const cyber = character.cyberware[index]
        const refund = Math.floor(cyber.cost / 2)
        const hlRefund = typeof cyber.humanityLoss === 'number' ? cyber.humanityLoss : 0
        setCharacter({
            ...character,
            cyberware: character.cyberware.filter((_, i) => i !== index),
            eurobucks: character.eurobucks + refund,
            derivedStats: {
                ...character.derivedStats,
                HumanityCurrent: Math.min(
                    character.derivedStats.HumanityCurrent + hlRefund,
                    character.derivedStats.HumanityMax
                ),
            },
            updatedAt: Date.now(),
        })
    }

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleReset = () => {
        setCurrentStep(0)
        setMethod(null)
        setRole(null)
        setCharacter(null)
        setCharacterName('')
        setCharacterHandle('')
    }

    const handleSaveCharacter = () => {
        if (!character) return
        const finalCharacter = {
            ...character,
            name: characterName || character.name,
            handle: characterHandle || character.handle,
            updatedAt: Date.now(),
        }
        addEdgerunner(finalCharacter)
        setShowSaveDialog(true)
    }

    const handleSaveDialogClose = () => {
        setShowSaveDialog(false)
        navigate(NavigationPaths.EDGERUNNERS)
    }

    const calculateSkillPoints = (): { used: number; total: number } => {
        if (!character) return { used: 0, total: 86 }
        let used = 0
        const isCompletePackage = method === 'COMPLETE_PACKAGE'
        
        for (const skill of character.skills) {
            const multiplier = skill.skill.isX2 ? 2 : 1
            if (isCompletePackage) {
                // Complete Package: all levels count from 0
                used += skill.level * multiplier
            } else {
                // Edgerunner: levels above 2 count
                if (skill.level > 2) {
                    used += (skill.level - 2) * multiplier
                }
            }
        }
        
        // Edgerunner starts with skills at 2, so base cost is 2 * num_skills
        if (!isCompletePackage) {
            const baseCost = character.skills.reduce((acc, s) => acc + 2 * (s.skill.isX2 ? 2 : 1), 0)
            used += baseCost
        }
        
        return { used, total: 86 }
    }

    const calculateStatPoints = (): { used: number; total: number } => {
        if (!character) return { used: 0, total: 62 }
        const stats = character.stats
        const used = stats.INT + stats.REF + stats.DEX + stats.TECH + stats.COOL +
                    stats.WILL + stats.LUCK + stats.MOVE + stats.BODY + stats.EMP
        return { used, total: 62 }
    }

    // Styles
    const cardStyle = {
        backgroundColor: readerMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 15, 25, 0.95)',
        border: `1px solid ${colors.neons.cyan.default}30`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
            borderColor: colors.neons.cyan.default,
            boxShadow: `0 0 20px ${colors.neons.cyan.default}30`,
            transform: 'translateY(-2px)',
        },
    }

    const selectedCardStyle = {
        ...cardStyle,
        borderColor: colors.neons.cyan.default,
        boxShadow: `0 0 20px ${colors.neons.cyan.default}50`,
    }

    const renderMethodSelection = () => (
        <Box>
            <Typography
                variant="h5"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    fontFamily: '"Orbitron", sans-serif',
                    textAlign: 'center',
                    mb: 4,
                }}
            >
                Choose Your Creation Method
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card
                        sx={method === 'STREETRAT' ? selectedCardStyle : cardStyle}
                        onClick={() => handleMethodSelect('STREETRAT')}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: colors.neons.yellow.default,
                                    fontFamily: '"Orbitron", sans-serif',
                                    mb: 1,
                                }}
                            >
                                STREETRAT
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.grays.gray500, mb: 2 }}>
                                Template-based
                            </Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                The fastest way to create a character. Roll 1d10 and get a pre-generated 
                                stat array and skill set. Perfect for new players or quick sessions.
                            </Typography>
                            <Chip
                                label="Beginner Friendly"
                                size="small"
                                sx={{ mt: 2, backgroundColor: colors.neons.green.default }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card
                        sx={method === 'EDGERUNNER' ? selectedCardStyle : cardStyle}
                        onClick={() => handleMethodSelect('EDGERUNNER')}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: colors.neons.cyan.default,
                                    fontFamily: '"Orbitron", sans-serif',
                                    mb: 1,
                                }}
                            >
                                EDGERUNNER
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.grays.gray500, mb: 2 }}>
                                Fast and Dirty
                            </Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                Get a stat template but distribute 86 skill points yourself. 
                                A balance between speed and customization.
                            </Typography>
                            <Chip
                                label="Recommended"
                                size="small"
                                sx={{ mt: 2, backgroundColor: colors.neons.cyan.default }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card
                        role="button"
                        tabIndex={0}
                        aria-label="Complete Package - Calculated creation method"
                        sx={method === 'COMPLETE_PACKAGE' ? selectedCardStyle : cardStyle}
                        onClick={() => handleMethodSelect('COMPLETE_PACKAGE')}
                        onKeyDown={(e) => e.key === 'Enter' && handleMethodSelect('COMPLETE_PACKAGE')}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: colors.neons.purple.default,
                                    fontFamily: '"Orbitron", sans-serif',
                                    mb: 1,
                                }}
                            >
                                COMPLETE PACKAGE
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.grays.gray500, mb: 2 }}>
                                Calculated
                            </Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                Full control: 62 points for stats, 86 for skills, 2,550eb for gear. 
                                Build exactly the character you want.
                            </Typography>
                            <Chip
                                label="Advanced"
                                size="small"
                                sx={{ mt: 2, backgroundColor: colors.neons.purple.default }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )

    const renderRoleSelection = () => (
        <Box>
            <Typography
                variant="h5"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    fontFamily: '"Orbitron", sans-serif',
                    textAlign: 'center',
                    mb: 4,
                }}
            >
                Choose Your Role
            </Typography>
            <Grid container spacing={2}>
                {ROLES.map((r) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r.value}>
                        <Card
                            role="button"
                            tabIndex={0}
                            aria-label={`Select ${r.label} role`}
                            sx={role === r.value ? selectedCardStyle : cardStyle}
                            onClick={() => handleRoleSelect(r.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRoleSelect(r.value)}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: colors.neons.cyan.default,
                                        fontFamily: '"Orbitron", sans-serif',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {r.label}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: colors.grays.gray600,
                                        fontSize: '0.75rem',
                                        mt: 1,
                                    }}
                                >
                                    {r.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )

    const renderStats = () => {
        if (!character) return null
        const derived = calculateDerivedStats(character.stats)
        const statPoints = calculateStatPoints()
        const isCompletePackage = method === 'COMPLETE_PACKAGE'

        return (
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            fontFamily: '"Orbitron", sans-serif',
                        }}
                    >
                        Character Stats
                    </Typography>
                    {!isCompletePackage && (
                        <Button
                            variant="outlined"
                            startIcon={<Casino />}
                            onClick={handleRerollStats}
                            sx={{
                                borderColor: colors.neons.yellow.default,
                                color: colors.neons.yellow.default,
                            }}
                        >
                            Reroll Stats
                        </Button>
                    )}
                </Stack>

                {isCompletePackage && (
                    <Paper
                        sx={{
                            p: 2,
                            mb: 3,
                            backgroundColor: `${colors.neons.purple.default}10`,
                            border: `1px solid ${colors.neons.purple.default}40`,
                        }}
                    >
                        <Typography variant="body2">
                            Points: {statPoints.used} / {statPoints.total}
                            {statPoints.used !== statPoints.total && (
                                <span style={{ color: colors.neons.red.default }}>
                                    {' '}({statPoints.total - statPoints.used} remaining)
                                </span>
                            )}
                        </Typography>
                    </Paper>
                )}

                <Grid container spacing={2}>
                    {(['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP'] as const).map(
                        (stat) => (
                            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={stat}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        backgroundColor: readerMode
                                            ? 'rgba(255,255,255,0.9)'
                                            : 'rgba(10, 15, 25, 0.95)',
                                        border: `1px solid ${colors.neons.cyan.default}30`,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: colors.neons.cyan.default,
                                            fontFamily: '"Orbitron", sans-serif',
                                            display: 'block',
                                        }}
                                    >
                                        {stat}
                                    </Typography>
                                    {isCompletePackage ? (
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleStatChange(stat, Math.max(2, character.stats[stat] - 1))}
                                                disabled={character.stats[stat] <= 2}
                                            >
                                                -
                                            </IconButton>
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    minWidth: 40,
                                                }}
                                            >
                                                {character.stats[stat]}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleStatChange(stat, Math.min(8, character.stats[stat] + 1))}
                                                disabled={character.stats[stat] >= 8}
                                            >
                                                +
                                            </IconButton>
                                        </Stack>
                                    ) : (
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: readerMode ? colors.grays.gray000 : colors.grays.gray900,
                                                fontFamily: '"Orbitron", sans-serif',
                                            }}
                                        >
                                            {character.stats[stat]}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        )
                    )}
                </Grid>

                {/* Derived Stats */}
                <Typography
                    variant="h6"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.yellow.default,
                        fontFamily: '"Orbitron", sans-serif',
                        mt: 4,
                        mb: 2,
                    }}
                >
                    Derived Stats
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: `${colors.neons.red.default}10`, border: `1px solid ${colors.neons.red.default}40` }}>
                            <Typography variant="caption" sx={{ color: colors.neons.red.default }}>HP</Typography>
                            <Typography variant="h5" sx={{ color: colors.neons.red.default, fontFamily: '"Orbitron", sans-serif' }}>
                                {derived.HP}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: `${colors.neons.yellow.default}10`, border: `1px solid ${colors.neons.yellow.default}40` }}>
                            <Typography variant="caption" sx={{ color: colors.neons.yellow.default }}>Seriously Wounded</Typography>
                            <Typography variant="h5" sx={{ color: colors.neons.yellow.default, fontFamily: '"Orbitron", sans-serif' }}>
                                {derived.SeriouslyWoundedThreshold}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: `${colors.neons.purple.default}10`, border: `1px solid ${colors.neons.purple.default}40` }}>
                            <Typography variant="caption" sx={{ color: colors.neons.purple.default }}>Humanity</Typography>
                            <Typography variant="h5" sx={{ color: colors.neons.purple.default, fontFamily: '"Orbitron", sans-serif' }}>
                                {derived.HumanityMax}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: `${colors.neons.cyan.default}10`, border: `1px solid ${colors.neons.cyan.default}40` }}>
                            <Typography variant="caption" sx={{ color: colors.neons.cyan.default }}>Death Save</Typography>
                            <Typography variant="h5" sx={{ color: colors.neons.cyan.default, fontFamily: '"Orbitron", sans-serif' }}>
                                {derived.DeathSave}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        )
    }

    const renderSkills = () => {
        if (!character) return null
        const skillPoints = calculateSkillPoints()
        const isStreetrat = method === 'STREETRAT'
        const isCompletePackage = method === 'COMPLETE_PACKAGE'
        const minLevel = isCompletePackage ? 0 : 2

        return (
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            fontFamily: '"Orbitron", sans-serif',
                        }}
                    >
                        Skills
                    </Typography>
                    {!isStreetrat && (
                        <Chip
                            label={`Points: ${skillPoints.used} / ${skillPoints.total}`}
                            sx={{
                                backgroundColor:
                                    skillPoints.used === skillPoints.total
                                        ? colors.neons.green.default
                                        : skillPoints.used > skillPoints.total
                                        ? colors.neons.red.default
                                        : colors.neons.yellow.default,
                            }}
                        />
                    )}
                </Stack>

                {isCompletePackage && (
                    <Paper
                        sx={{
                            p: 2,
                            mb: 3,
                            backgroundColor: `${colors.neons.purple.default}10`,
                            border: `1px solid ${colors.neons.purple.default}40`,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: colors.grays.gray600 }}>
                            Distribute 86 skill points. Skills marked (x2) cost double. No skill can exceed level 6.
                            {skillPoints.used !== skillPoints.total && (
                                <span style={{ color: colors.neons.yellow.default, marginLeft: 8 }}>
                                    ({skillPoints.total - skillPoints.used} points remaining)
                                </span>
                            )}
                        </Typography>
                    </Paper>
                )}

                <Grid container spacing={1}>
                    {character.skills.map((charSkill, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                            <Paper
                                sx={{
                                    p: 1.5,
                                    backgroundColor: readerMode
                                        ? 'rgba(255,255,255,0.9)'
                                        : 'rgba(10, 15, 25, 0.95)',
                                    border: `1px solid ${charSkill.level > 0 ? colors.neons.cyan.default + '40' : colors.grays.gray700}`,
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: readerMode ? colors.grays.gray100 : colors.grays.gray800,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {charSkill.skill.name}
                                            {charSkill.skill.specialization && ` (${charSkill.skill.specialization})`}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>
                                            {charSkill.skill.stat}
                                            {charSkill.skill.isX2 && ' (x2)'}
                                        </Typography>
                                    </Box>
                                    {isStreetrat ? (
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: colors.neons.cyan.default,
                                                fontFamily: '"Orbitron", sans-serif',
                                            }}
                                        >
                                            {charSkill.level}
                                        </Typography>
                                    ) : (
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleSkillChange(index, Math.max(minLevel, charSkill.level - 1))}
                                                disabled={charSkill.level <= minLevel}
                                            >
                                                -
                                            </IconButton>
                                            <Typography
                                                sx={{
                                                    color: charSkill.level > 0 ? colors.neons.cyan.default : colors.grays.gray600,
                                                    fontFamily: '"Orbitron", sans-serif',
                                                    minWidth: 24,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {charSkill.level}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleSkillChange(index, Math.min(6, charSkill.level + 1))}
                                                disabled={charSkill.level >= 6}
                                            >
                                                +
                                            </IconButton>
                                        </Stack>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        )
    }

    const renderGearShopping = () => {
        if (!character) return null

        const tabs = [
            { key: 'weapons' as const, label: 'Weapons' },
            { key: 'armor' as const, label: 'Armor' },
            { key: 'gear' as const, label: 'Gear' },
            { key: 'cyberware' as const, label: 'Cyberware' },
        ]

        return (
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.yellow.default,
                            fontFamily: '"Orbitron", sans-serif',
                        }}
                    >
                        Night Market
                    </Typography>
                    <Chip
                        label={`${character.eurobucks}eb`}
                        sx={{
                            backgroundColor: colors.neons.yellow.default,
                            color: colors.grays.gray900,
                            fontFamily: '"Orbitron", sans-serif',
                            fontSize: '1rem',
                            px: 2,
                        }}
                    />
                </Stack>

                <Typography variant="body2" sx={{ color: colors.grays.gray600, mb: 2 }}>
                    Spend your 2,550eb on weapons, armor, gear, and cyberware. Humanity lost from cyberware is deducted automatically.
                </Typography>

                {/* Tab Navigation */}
                <Stack direction="row" spacing={1} mb={3}>
                    {tabs.map((tab) => (
                        <Button
                            key={tab.key}
                            variant={shoppingTab === tab.key ? 'contained' : 'outlined'}
                            onClick={() => setShoppingTab(tab.key)}
                            sx={{
                                backgroundColor: shoppingTab === tab.key ? colors.neons.cyan.default : 'transparent',
                                borderColor: colors.neons.cyan.default,
                                color: shoppingTab === tab.key ? colors.grays.gray900 : colors.neons.cyan.default,
                            }}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </Stack>

                {/* Shopping Content */}
                <Grid container spacing={2}>
                    {/* Left: Shop Catalog */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.cyan.default}30`, maxHeight: 400, overflow: 'auto' }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.cyan.default, mb: 2 }}>Available Items</Typography>
                            <Stack spacing={1}>
                                {shoppingTab === 'weapons' && SHOP_WEAPONS.map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: `1px solid ${colors.grays.gray700}`, borderRadius: 1 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{item.name}</Typography>
                                            <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>{item.damage} | ROF {item.rof} | {item.skill}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleBuyWeapon(item)}
                                            disabled={character.eurobucks < item.cost}
                                            sx={{ borderColor: colors.neons.green.default, color: colors.neons.green.default, minWidth: 80 }}
                                        >
                                            {item.cost}eb
                                        </Button>
                                    </Box>
                                ))}
                                {shoppingTab === 'armor' && SHOP_ARMOR.map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: `1px solid ${colors.grays.gray700}`, borderRadius: 1 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{item.name}</Typography>
                                            <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>SP {item.sp}{item.penalty !== 0 ? ` | Penalty ${item.penalty}` : ''}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleBuyArmor(item)}
                                            disabled={character.eurobucks < item.cost}
                                            sx={{ borderColor: colors.neons.green.default, color: colors.neons.green.default, minWidth: 80 }}
                                        >
                                            {item.cost}eb
                                        </Button>
                                    </Box>
                                ))}
                                {shoppingTab === 'gear' && SHOP_GEAR.map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: `1px solid ${colors.grays.gray700}`, borderRadius: 1 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{item.name}</Typography>
                                            <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>{item.description}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleBuyGear(item)}
                                            disabled={character.eurobucks < item.cost}
                                            sx={{ borderColor: colors.neons.green.default, color: colors.neons.green.default, minWidth: 80 }}
                                        >
                                            {item.cost}eb
                                        </Button>
                                    </Box>
                                ))}
                                {shoppingTab === 'cyberware' && SHOP_CYBERWARE.map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: `1px solid ${colors.grays.gray700}`, borderRadius: 1 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{item.name}</Typography>
                                            <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>{item.description}</Typography>
                                            <Typography variant="caption" sx={{ color: colors.neons.pink.default, display: 'block' }}>HL: {item.humanityLoss}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleBuyCyberware(item)}
                                            disabled={character.eurobucks < item.cost}
                                            sx={{ borderColor: colors.neons.green.default, color: colors.neons.green.default, minWidth: 80 }}
                                        >
                                            {item.cost}eb
                                        </Button>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Right: Owned Items */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.yellow.default}30`, maxHeight: 400, overflow: 'auto' }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.yellow.default, mb: 2 }}>Your Inventory</Typography>
                            
                            {/* Weapons */}
                            {character.weapons.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="caption" sx={{ color: colors.neons.red.default }}>WEAPONS</Typography>
                                    {character.weapons.map((w, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{w.name}</Typography>
                                            <Button size="small" onClick={() => handleSellWeapon(i)} sx={{ color: colors.neons.red.default, minWidth: 60 }}>
                                                Sell ({Math.floor(w.cost / 2)}eb)
                                            </Button>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Armor */}
                            {character.armor.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="caption" sx={{ color: colors.neons.blue.default }}>ARMOR</Typography>
                                    {character.armor.map((a, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{a.name} (SP{a.sp})</Typography>
                                            <Button size="small" onClick={() => handleSellArmor(i)} sx={{ color: colors.neons.red.default, minWidth: 60 }}>
                                                Sell ({Math.floor(a.cost / 2)}eb)
                                            </Button>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Gear */}
                            {character.gear.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="caption" sx={{ color: colors.neons.green.default }}>GEAR</Typography>
                                    {character.gear.map((g, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{g.name}</Typography>
                                            <Button size="small" onClick={() => handleSellGear(i)} sx={{ color: colors.neons.red.default, minWidth: 60 }}>
                                                Sell ({Math.floor(g.cost / 2)}eb)
                                            </Button>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Cyberware */}
                            {character.cyberware.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="caption" sx={{ color: colors.neons.purple.default }}>CYBERWARE</Typography>
                                    {character.cyberware.map((c, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{c.name}</Typography>
                                                <Typography variant="caption" sx={{ color: colors.neons.pink.default }}>-{c.humanityLoss} HL</Typography>
                                            </Box>
                                            <Button size="small" onClick={() => handleSellCyberware(i)} sx={{ color: colors.neons.red.default, minWidth: 60 }}>
                                                Sell
                                            </Button>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {character.weapons.length === 0 && character.armor.length === 0 && character.gear.length === 0 && character.cyberware.length === 0 && (
                                <Typography variant="body2" sx={{ color: colors.grays.gray600, fontStyle: 'italic' }}>
                                    Your inventory is empty. Browse the catalog to purchase items.
                                </Typography>
                            )}
                        </Paper>

                        {/* Humanity Tracker for Cyberware */}
                        <Paper sx={{ p: 2, mt: 2, backgroundColor: `${colors.neons.pink.default}10`, border: `1px solid ${colors.neons.pink.default}40` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" sx={{ color: colors.neons.pink.default }}>Humanity</Typography>
                                <Typography variant="h6" sx={{ color: colors.neons.pink.default, fontFamily: '"Orbitron", sans-serif' }}>
                                    {character.derivedStats.HumanityCurrent} / {character.derivedStats.HumanityMax}
                                </Typography>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        )
    }

    const renderLifepath = () => {
        if (!character) return null
        const lp = character.lifepath

        return (
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                            fontFamily: '"Orbitron", sans-serif',
                        }}
                    >
                        Lifepath
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Casino />}
                        onClick={handleRerollLifepath}
                        sx={{
                            borderColor: colors.neons.yellow.default,
                            color: colors.neons.yellow.default,
                        }}
                    >
                        Reroll Lifepath
                    </Button>
                </Stack>

                <Grid container spacing={2}>
                    {/* Cultural Origin */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.cyan.default}30` }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.cyan.default }}>Cultural Origin</Typography>
                            <Typography variant="body1" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{lp.culturalOrigin.region}</Typography>
                            <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>Language: {lp.language}</Typography>
                        </Paper>
                    </Grid>

                    {/* Personality */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.yellow.default}30` }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.yellow.default }}>Personality</Typography>
                            <Typography variant="body1" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>{lp.personality.description}</Typography>
                        </Paper>
                    </Grid>

                    {/* Style */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.purple.default}30` }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.purple.default }}>Style</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>Clothing: {lp.dressStyle.clothingStyle}</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>Hairstyle: {lp.dressStyle.hairstyle}</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>Affectation: {lp.affectation.description}</Typography>
                        </Paper>
                    </Grid>

                    {/* Motivation */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.green.default}30` }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.green.default }}>Motivation</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>Values: {lp.motivation.valueMost}</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>People: {lp.motivation.feelAboutPeople}</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>Possession: {lp.motivation.valuedPossession}</Typography>
                        </Paper>
                    </Grid>

                    {/* Background */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.orange.default}30` }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.orange.default }}>Background</Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800, mb: 1 }}>
                                <strong>Family:</strong> {lp.familyBackground.description}
                            </Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800, mb: 1 }}>
                                <strong>Childhood:</strong> {lp.childhoodEnvironment.description}
                            </Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800, mb: 1 }}>
                                <strong>Crisis:</strong> {lp.familyCrisis.description}
                            </Typography>
                            <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                <strong>Goal:</strong> {lp.lifeGoal.description}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Life Events */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)', border: `1px solid ${colors.neons.red.default}30` }}>
                            <Typography variant="subtitle2" sx={{ color: colors.neons.red.default, mb: 1 }}>Life Events</Typography>
                            <Stack spacing={1}>
                                {lp.lifeEvents.map((event, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={event.eventType}
                                            size="small"
                                            sx={{
                                                backgroundColor:
                                                    event.eventType === 'GOOD' ? colors.neons.green.default :
                                                    event.eventType === 'BAD' ? colors.neons.red.default :
                                                    event.eventType === 'FRIEND' ? colors.neons.cyan.default :
                                                    event.eventType === 'ENEMY' ? colors.neons.orange.default :
                                                    colors.neons.purple.default,
                                                color: '#fff',
                                                fontSize: '0.65rem',
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                            {event.description}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        )
    }

    const renderFinishing = () => {
        if (!character) return null
        const isCompletePackage = method === 'COMPLETE_PACKAGE'

        return (
            <Box>
                <Typography
                    variant="h5"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        fontFamily: '"Orbitron", sans-serif',
                        textAlign: 'center',
                        mb: 4,
                    }}
                >
                    Finishing Touches
                </Typography>

                <Grid container spacing={3}>
                    {/* Name and Handle */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Character Name"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Handle (Street Name)"
                            value={characterHandle}
                            onChange={(e) => setCharacterHandle(e.target.value)}
                        />
                    </Grid>

                    {/* Character Summary */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper
                            sx={{
                                p: 3,
                                backgroundColor: readerMode
                                    ? 'rgba(255,255,255,0.9)'
                                    : 'rgba(10, 15, 25, 0.95)',
                                border: `1px solid ${colors.neons.cyan.default}40`,
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                                <Person sx={{ color: colors.neons.cyan.default, fontSize: 48 }} />
                                <Box>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                            fontFamily: '"Orbitron", sans-serif',
                                        }}
                                    >
                                        {characterName || 'New Character'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: colors.grays.gray600 }}>
                                        "{characterHandle || 'Handle'}" - {role} ({method})
                                    </Typography>
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <Chip label={`HP: ${character.derivedStats.HP}`} size="small" sx={{ backgroundColor: colors.neons.red.default }} />
                                <Chip label={`HUM: ${character.derivedStats.HumanityCurrent}/${character.derivedStats.HumanityMax}`} size="small" sx={{ backgroundColor: colors.neons.pink.default }} />
                                <Chip label={`${character.eurobucks}eb`} size="small" sx={{ backgroundColor: colors.neons.yellow.default, color: colors.grays.gray900 }} />
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Weapons */}
                    {!isCompletePackage && character.weapons.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                sx={{
                                    p: 2,
                                    backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)',
                                    border: `1px solid ${colors.neons.red.default}40`,
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: colors.neons.red.default, mb: 1 }}>
                                    Starting Weapons
                                </Typography>
                                <Stack spacing={0.5}>
                                    {character.weapons.map((weapon, i) => (
                                        <Typography key={i} variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                            • {weapon.name}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    )}

                    {/* Armor */}
                    {!isCompletePackage && character.armor.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                sx={{
                                    p: 2,
                                    backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)',
                                    border: `1px solid ${colors.neons.blue.default}40`,
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: colors.neons.blue.default, mb: 1 }}>
                                    Starting Armor
                                </Typography>
                                <Stack spacing={0.5}>
                                    {character.armor.map((armor, i) => (
                                        <Typography key={i} variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                            • {armor.name}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    )}

                    {/* Cyberware */}
                    {!isCompletePackage && character.cyberware.length > 0 && (
                        <Grid size={12}>
                            <Paper
                                sx={{
                                    p: 2,
                                    backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)',
                                    border: `1px solid ${colors.neons.purple.default}40`,
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: colors.neons.purple.default, mb: 1 }}>
                                    Starting Cyberware (Humanity already deducted)
                                </Typography>
                                <Grid container spacing={1}>
                                    {character.cyberware.map((cyber, i) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                                    {cyber.name}
                                                </Typography>
                                                <Chip 
                                                    label={`-${cyber.humanityLoss} HL`} 
                                                    size="small" 
                                                    sx={{ 
                                                        backgroundColor: Number(cyber.humanityLoss) > 0 ? colors.neons.pink.default + '40' : 'transparent',
                                                        color: colors.neons.pink.default,
                                                        fontSize: '0.65rem',
                                                    }} 
                                                />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                    )}

                    {/* Complete Package Note */}
                    {isCompletePackage && (
                        <Grid size={12}>
                            <Paper
                                sx={{
                                    p: 2,
                                    backgroundColor: readerMode ? 'rgba(255,255,255,0.9)' : 'rgba(10, 15, 25, 0.95)',
                                    border: `1px solid ${colors.neons.yellow.default}40`,
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: colors.neons.yellow.default, mb: 1 }}>
                                    Complete Package - Buy Your Gear
                                </Typography>
                                <Typography variant="body2" sx={{ color: readerMode ? colors.grays.gray100 : colors.grays.gray800 }}>
                                    As a Complete Package character, you start with {character.eurobucks}eb to purchase your own weapons, armor, gear, and cyberware from the Night Market. 
                                    No starting equipment is provided - you have full control over your loadout!
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<SaveAlt />}
                        onClick={handleSaveCharacter}
                        sx={{
                            backgroundColor: colors.neons.green.default,
                            '&:hover': { backgroundColor: colors.neons.green.dark },
                            fontFamily: '"Orbitron", sans-serif',
                            px: 4,
                            py: 1.5,
                        }}
                    >
                        Save Character
                    </Button>
                </Box>
            </Box>
        )
    }

    const renderCurrentStep = () => {
        switch (STEPS[currentStep]) {
            case 'METHOD_SELECTION':
                return renderMethodSelection()
            case 'ROLE_SELECTION':
                return renderRoleSelection()
            case 'STATS':
                return renderStats()
            case 'SKILLS':
                return renderSkills()
            case 'GEAR_SHOPPING':
                return renderGearShopping()
            case 'LIFEPATH':
                return renderLifepath()
            case 'FINISHING':
                return renderFinishing()
            default:
                return null
        }
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography
                    variant="h3"
                    sx={{
                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                        fontFamily: '"Orbitron", sans-serif',
                        textShadow: readerMode ? 'none' : `0 0 20px ${colors.neons.cyan.default}`,
                        mb: 1,
                    }}
                >
                    CHARACTER CREATOR
                </Typography>
                <Typography variant="body1" sx={{ color: colors.grays.gray600 }}>
                    Build your Edgerunner for the streets of Night City
                </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
                {STEP_LABELS.map((label, index) => (
                    <Step key={label} completed={index < currentStep}>
                        <StepLabel
                            sx={{
                                '& .MuiStepLabel-label': {
                                    color: colors.grays.gray600,
                                    '&.Mui-active': { color: colors.neons.cyan.default },
                                    '&.Mui-completed': { color: colors.neons.green.default },
                                },
                                '& .MuiStepIcon-root': {
                                    color: colors.grays.gray700,
                                    '&.Mui-active': { color: colors.neons.cyan.default },
                                    '&.Mui-completed': { color: colors.neons.green.default },
                                },
                            }}
                        >
                            {label}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Content */}
            <Box sx={{ minHeight: 400 }}>{renderCurrentStep()}</Box>

            {/* Navigation */}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                    variant="outlined"
                    startIcon={<RestartAlt />}
                    onClick={handleReset}
                    sx={{ borderColor: colors.grays.gray600, color: colors.grays.gray600 }}
                >
                    Start Over
                </Button>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        sx={{
                            borderColor: colors.neons.cyan.default,
                            color: colors.neons.cyan.default,
                        }}
                    >
                        Back
                    </Button>
                    {currentStep < STEPS.length - 1 && (
                        <Button
                            variant="contained"
                            endIcon={<ArrowForward />}
                            onClick={handleNext}
                            disabled={currentStep === 0 && !method}
                            sx={{
                                backgroundColor: colors.neons.cyan.default,
                                '&:hover': { backgroundColor: colors.neons.cyan.dark },
                            }}
                        >
                            Next
                        </Button>
                    )}
                </Stack>
            </Stack>

            {/* Save Dialog */}
            <Dialog
                open={showSaveDialog}
                onClose={handleSaveDialogClose}
                PaperProps={{
                    sx: {
                        backgroundColor: colors.grays.gray900,
                        border: `1px solid ${colors.neons.green.default}`,
                    },
                }}
            >
                <DialogTitle sx={{ color: colors.neons.green.default, fontFamily: '"Orbitron", monospace' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Check />
                        <span>{t('common.saved')}</span>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: colors.grays.gray200 }}>
                        {t('characterCreator.savedMessage', { name: characterName || characterHandle || 'New Character' })}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${colors.neons.green.default}30`, p: 2 }}>
                    <Button onClick={handleSaveDialogClose} sx={{ color: colors.neons.green.default }}>
                        {t('edgerunners.viewEdgerunners')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowSaveDialog(false)
                            handleReset()
                        }}
                        sx={{ backgroundColor: colors.neons.cyan.default, color: colors.grays.gray900 }}
                    >
                        {t('characterCreator.createAnother')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}

export default CharacterCreatorView

