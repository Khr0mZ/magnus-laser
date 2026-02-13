import Add from '@mui/icons-material/Add'
import Casino from '@mui/icons-material/Casino'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Download from '@mui/icons-material/Download'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { neonPulse, pulseGlowGreen } from '../../components/common/Animations'
import { WarningDialog } from '../../components/common/WarningDialog'
import CustomScrollbar from '../../components/CustomScrollbar'
import CyberpunkFormControl from '../../components/CyberpunkFormControl'
import { useGMToolsDataStore } from '../../components/GMTools/GMToolsDataStore'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import NavigationPaths from '../../navigation'
import type { Armor, Character, Cyberware, GearItem, SkillCategory, Weapon } from '../../types/characterCreator'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { db } from '../../utils/db'
import {
    AFFECTATIONS,
    ALL_SKILLS,
    calculateDerivedStats,
    CHILDHOOD_ENVIRONMENTS,
    CLOTHING_STYLES,
    CULTURAL_ORIGINS,
    FAMILY_BACKGROUNDS,
    FAMILY_CRISES,
    FEELINGS_ABOUT_PEOPLE,
    HAIRSTYLES,
    LIFE_GOALS,
    PERSONALITIES,
    ROLE_ABILITY_RANK_DETAILS,
    SHOP_ARMOR,
    SHOP_BORGWARE,
    SHOP_CYBERWARE,
    SHOP_FASHION,
    SHOP_GEAR,
    SHOP_WEAPONS,
    VALUED_PERSONS,
    VALUED_POSSESSIONS,
    VALUES,
    type ShopArmor,
    type ShopCyberware,
    type ShopFashion,
    type ShopGear,
    type ShopWeapon,
} from '../../utils/generators/characterCreatorData'
import { calculateCurrentEMP, getEffectiveStats } from '../../utils/generators/characterCreatorUtils'
import { characterToToken } from '../../utils/generators/edgerunnerToToken'
import { loadTokenModelPaths } from '../CombatSim/utils/modelAssets'
import type { Image as ImageRecord } from '../CombatSim/utils/types'

// Neon color swatches for token color picker
const NEON_COLOR_SWATCHES = [
    { label: 'Cyan', value: 0x00ffff },
    { label: 'Pink', value: 0xff00ff },
    { label: 'Green', value: 0x00ff8b },
    { label: 'Blue', value: 0x0099ff },
    { label: 'Purple', value: 0x9900ff },
    { label: 'Yellow', value: 0xffff00 },
    { label: 'Red', value: 0xff0055 },
    { label: 'Orange', value: 0xff5e00 },
]

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

const CYBERWARE_CATEGORIES: { type: string; label: string; description: string; color: string }[] = [
    {
        type: 'Fashionware',
        label: 'Fashionware',
        description: 'Personal adornment cyberware — 0 HL, Mall install',
        color: colors.neons.pink.default,
    },
    {
        type: 'Neuralware',
        label: 'Neuralware',
        description: 'Reflexes and mental augmentation',
        color: colors.neons.cyan.default,
    },
    {
        type: 'Cyberoptics',
        label: 'Cyberoptics',
        description: 'Visual enhancement implants',
        color: colors.neons.blue.default,
    },
    {
        type: 'Cyberaudio',
        label: 'Cyberaudio',
        description: 'Hearing and auditory implants',
        color: colors.neons.green.default,
    },
    {
        type: 'Internal',
        label: 'Internal Body Cyberware',
        description: 'Implanted organs and systemic improvements',
        color: colors.neons.orange.default,
    },
    {
        type: 'External',
        label: 'External Body Cyberware',
        description: 'Installed on or through the skin',
        color: colors.neons.yellow.default,
    },
    {
        type: 'Cyberlimbs',
        label: 'Cyberlimbs',
        description: 'Cybernetic arms and legs with options',
        color: colors.neons.red.default,
    },
    {
        type: 'Borgware',
        label: 'Borgware',
        description: 'Full body replacement cyberware',
        color: colors.neons.purple.default,
    },
]

const SKILL_CATEGORY_ORDER: SkillCategory[] = [
    'AWARENESS',
    'BODY',
    'CONTROL',
    'EDUCATION',
    'FIGHTING',
    'PERFORMANCE',
    'RANGED_WEAPON',
    'SOCIAL',
    'TECHNIQUE',
]

const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
    AWARENESS: colors.neons.cyan.default,
    BODY: colors.neons.red.default,
    CONTROL: colors.neons.orange.default,
    EDUCATION: colors.neons.blue.default,
    FIGHTING: colors.neons.red.light,
    PERFORMANCE: colors.neons.pink.default,
    RANGED_WEAPON: colors.neons.yellow.default,
    SOCIAL: colors.neons.green.default,
    TECHNIQUE: colors.neons.purple.default,
}

const allCyberware = [...SHOP_CYBERWARE, ...SHOP_BORGWARE]

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
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [viewTab, setViewTab] = useState(0)
    const [editedEdgerunner, setEditedEdgerunner] = useState<Character | null>(null)
    const [shoppingTab, setShoppingTab] = useState<'weapons' | 'armor' | 'gear' | 'cyberware' | 'fashion'>('weapons')

    // Combat tab state (token image blob URLs)
    const [tokenImageUrls, setTokenImageUrls] = useState<Record<string, string>>({})

    // Combat tab state (image select / model select — same as TokenDetailsDialog)
    const [combatImages, setCombatImages] = useState<ImageRecord[]>([])
    const [modelOptions, setModelOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Aleatorio (por ID)' },
    ])
    const [modelViewerReady, setModelViewerReady] = useState(false)

    // Load images from DB and model paths when detail dialog opens
    useEffect(() => {
        if (!detailDialogOpen) return
        db.images.toArray().then((imgs) => setCombatImages(imgs as ImageRecord[]))
        loadTokenModelPaths()
            .then((paths) => {
                const mapped = paths.map((f) => {
                    const name = f.split('/').pop() || f
                    const base = name.replace(/\.(glb|gltf)$/i, '')
                    return { value: f, label: base }
                })
                setModelOptions([{ value: '', label: 'Aleatorio (por ID)' }, ...mapped])
            })
            .catch(() => setModelOptions([{ value: '', label: 'Aleatorio (por ID)' }]))
        // Load model-viewer script
        const hasScript = document.querySelector('script[src*="model-viewer"]')
        if (!hasScript) {
            const script = document.createElement('script')
            script.type = 'module'
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js'
            script.onload = () => setModelViewerReady(true)
            document.head.appendChild(script)
        } else {
            setModelViewerReady(true)
        }
    }, [detailDialogOpen])

    const sortedCombatImages = useMemo(() => {
        const arr = [...combatImages]
        arr.sort((a, b) => a.name.localeCompare(b.name))
        return arr
    }, [combatImages])

    const resolveCombatImageUrl = (imageId: string | undefined): string | undefined => {
        if (!imageId) return undefined
        // First check cached blob URLs
        if (tokenImageUrls[imageId]) return tokenImageUrls[imageId]
        // Fallback: find in loaded images
        const img = combatImages.find((i) => i.id === imageId)
        if (img?.blob) {
            const url = URL.createObjectURL(img.blob)
            setTokenImageUrls((prev) => ({ ...prev, [imageId]: url }))
            return url
        }
        return undefined
    }

    // IP tab state
    const [stagedImprovements, setStagedImprovements] = useState<
        {
            type: 'skill' | 'role'
            skillName?: string
            fromLevel: number
            toLevel: number
            cost: number
            isX2: boolean
        }[]
    >([])
    const [showAllSkillsIP, setShowAllSkillsIP] = useState(false)

    // IP cost functions
    const getSkillIPCost = (targetLevel: number, isX2: boolean): number => targetLevel * (isX2 ? 40 : 20)
    const getRoleIPCost = (targetRank: number): number => targetRank * 60

    const getEffectiveSkillLevel = (skillName: string): number => {
        if (!editedEdgerunner) return 0
        const charSkill = editedEdgerunner.skills.find((s) => s.skill.name === skillName)
        const baseLevel = charSkill?.level ?? 0
        const stagedCount = stagedImprovements.filter((s) => s.type === 'skill' && s.skillName === skillName).length
        return baseLevel + stagedCount
    }

    const getEffectiveRoleRank = (): number => {
        if (!editedEdgerunner) return 0
        const stagedCount = stagedImprovements.filter((s) => s.type === 'role').length
        return editedEdgerunner.roleRank + stagedCount
    }

    const totalStagedCost = stagedImprovements.reduce((sum, s) => sum + s.cost, 0)
    const availableIP = (editedEdgerunner?.ip ?? 0) - totalStagedCost

    const handleStageSkillImprovement = (skillName: string, isX2: boolean) => {
        if (!editedEdgerunner) return
        const effectiveLevel = getEffectiveSkillLevel(skillName)
        if (effectiveLevel >= 10) return
        const targetLevel = effectiveLevel + 1
        const cost = getSkillIPCost(targetLevel, isX2)
        if (cost > availableIP) return
        setStagedImprovements([
            ...stagedImprovements,
            { type: 'skill', skillName, fromLevel: effectiveLevel, toLevel: targetLevel, cost, isX2 },
        ])
    }

    const handleStageRoleImprovement = () => {
        if (!editedEdgerunner) return
        const effectiveRank = getEffectiveRoleRank()
        if (effectiveRank >= 10) return
        const targetRank = effectiveRank + 1
        const cost = getRoleIPCost(targetRank)
        if (cost > availableIP) return
        setStagedImprovements([
            ...stagedImprovements,
            { type: 'role', fromLevel: effectiveRank, toLevel: targetRank, cost, isX2: false },
        ])
    }

    const handleUnstageImprovement = (index: number) => {
        const removed = stagedImprovements[index]
        let newStaged = [...stagedImprovements]
        newStaged.splice(index, 1)
        if (removed.type === 'skill') {
            newStaged = newStaged.filter(
                (s) => !(s.type === 'skill' && s.skillName === removed.skillName && s.toLevel > removed.fromLevel)
            )
        }
        if (removed.type === 'role') {
            newStaged = newStaged.filter((s) => !(s.type === 'role' && s.toLevel > removed.fromLevel))
        }
        setStagedImprovements(newStaged)
    }

    const handleApplyImprovements = () => {
        if (!editedEdgerunner || stagedImprovements.length === 0) return
        let newSkills = [...editedEdgerunner.skills]
        let newRoleRank = editedEdgerunner.roleRank
        for (const improvement of stagedImprovements) {
            if (improvement.type === 'skill' && improvement.skillName) {
                const existingIndex = newSkills.findIndex((s) => s.skill.name === improvement.skillName)
                if (existingIndex >= 0) {
                    newSkills[existingIndex] = { ...newSkills[existingIndex], level: improvement.toLevel }
                } else {
                    const skillDef = ALL_SKILLS.find((s) => s.name === improvement.skillName)
                    if (skillDef) newSkills.push({ skill: skillDef, level: improvement.toLevel })
                }
            } else if (improvement.type === 'role') {
                newRoleRank = improvement.toLevel
            }
        }
        setEditedEdgerunner({
            ...editedEdgerunner,
            skills: newSkills,
            roleRank: Math.min(10, newRoleRank),
            ip: editedEdgerunner.ip - totalStagedCost,
        })
        setStagedImprovements([])
    }

    const handleCreateNew = () => {
        navigate(NavigationPaths.CHARACTER_CREATOR)
    }

    const handleCardClick = async (edgerunner: Character) => {
        setEditedEdgerunner({ ...edgerunner, ip: edgerunner.ip ?? 0 })
        setViewTab(0)
        setShoppingTab('weapons')
        setStagedImprovements([])
        setDetailDialogOpen(true)
        // Load token image URLs from IndexedDB
        const urls: Record<string, string> = {}
        for (const imageId of [edgerunner.tokenImageId, edgerunner.tokenModelId]) {
            if (imageId) {
                try {
                    const img = await db.images.get(imageId)
                    if (img?.blob) urls[imageId] = URL.createObjectURL(img.blob)
                } catch {
                    /* ignore */
                }
            }
        }
        setTokenImageUrls(urls)
    }

    // Export character as JSON (Gap 20)
    const handleExportCharacter = (edgerunner: Character) => {
        const dataStr = JSON.stringify(edgerunner, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${edgerunner.handle || edgerunner.name}_character.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleDetailSave = async () => {
        if (editedEdgerunner) {
            updateEdgerunner(editedEdgerunner.id, editedEdgerunner)
            // Sync associated combat token if it exists
            const tokenId = `er-${editedEdgerunner.id}`
            const existingToken = await db.tokens.get(tokenId)
            if (existingToken) {
                const fresh = characterToToken(editedEdgerunner, existingToken.mapId, existingToken.x, existingToken.y)
                fresh.id = tokenId
                fresh.stats.currentHealth = existingToken.stats.currentHealth
                fresh.stats.currentMovement = existingToken.stats.currentMovement
                fresh.stats.armor.currentSpb = existingToken.stats.armor.currentSpb
                fresh.stats.armor.currentSph = existingToken.stats.armor.currentSph
                fresh.stats.currentLuck = existingToken.stats.currentLuck
                await db.tokens.put(fresh)
            }
        }
        setDetailDialogOpen(false)
        setEditedEdgerunner(null)
        setStagedImprovements([])
    }

    const handleDetailClose = () => {
        setDetailDialogOpen(false)
        setEditedEdgerunner(null)
        setStagedImprovements([])
    }

    const updateEditedField = <K extends keyof Character>(field: K, value: Character[K]) => {
        if (!editedEdgerunner) return
        setEditedEdgerunner({ ...editedEdgerunner, [field]: value })
    }

    const updateEditedStat = (stat: string, value: number) => {
        if (!editedEdgerunner) return
        const clamped = Math.max(1, Math.min(10, value))
        const newStats = { ...editedEdgerunner.stats, [stat]: clamped }
        // Recalculate derived stats preserving humanity loss
        const effectiveStats = getEffectiveStats(newStats, editedEdgerunner.cyberware)
        const derived = calculateDerivedStats(effectiveStats)
        const humanityLoss = editedEdgerunner.derivedStats.HumanityMax - editedEdgerunner.derivedStats.HumanityCurrent
        const newHumanityCurrent = Math.max(0, derived.HumanityMax - humanityLoss)
        setEditedEdgerunner({
            ...editedEdgerunner,
            stats: newStats,
            derivedStats: {
                ...editedEdgerunner.derivedStats,
                HP: derived.HP,
                HumanityMax: derived.HumanityMax,
                HumanityCurrent: newHumanityCurrent,
                SeriouslyWoundedThreshold: derived.SeriouslyWoundedThreshold,
                DeathSave: derived.DeathSave,
            },
        })
    }

    const updateSkillLevel = (skillName: string, newLevel: number) => {
        if (!editedEdgerunner) return
        const clamped = Math.max(0, Math.min(10, newLevel))
        const existingIndex = editedEdgerunner.skills.findIndex((s) => s.skill.name === skillName)
        let newSkills = [...editedEdgerunner.skills]
        if (existingIndex >= 0) {
            if (clamped === 0) {
                newSkills = newSkills.filter((_, i) => i !== existingIndex)
            } else {
                newSkills[existingIndex] = { ...newSkills[existingIndex], level: clamped }
            }
        } else if (clamped > 0) {
            const skillDef = ALL_SKILLS.find((s) => s.name === skillName)
            if (skillDef) {
                newSkills.push({ skill: skillDef, level: clamped })
            }
        }
        setEditedEdgerunner({ ...editedEdgerunner, skills: newSkills })
    }

    const updateLifepathField = (path: string, value: string) => {
        if (!editedEdgerunner) return
        const lp = { ...editedEdgerunner.lifepath }
        switch (path) {
            case 'culturalOrigin.region':
                lp.culturalOrigin = { ...lp.culturalOrigin, region: value }
                break
            case 'language':
                lp.language = value
                break
            case 'personality.description':
                lp.personality = { ...lp.personality, description: value }
                break
            case 'dressStyle.clothingStyle':
                lp.dressStyle = { ...lp.dressStyle, clothingStyle: value }
                break
            case 'dressStyle.hairstyle':
                lp.dressStyle = { ...lp.dressStyle, hairstyle: value }
                break
            case 'affectation.description':
                lp.affectation = { ...lp.affectation, description: value }
                break
            case 'motivation.valueMost':
                lp.motivation = { ...lp.motivation, valueMost: value }
                break
            case 'motivation.feelAboutPeople':
                lp.motivation = { ...lp.motivation, feelAboutPeople: value }
                break
            case 'motivation.valuedPerson':
                lp.motivation = { ...lp.motivation, valuedPerson: value }
                break
            case 'motivation.valuedPossession':
                lp.motivation = { ...lp.motivation, valuedPossession: value }
                break
            case 'familyBackground.description':
                lp.familyBackground = { ...lp.familyBackground, description: value }
                break
            case 'childhoodEnvironment.description':
                lp.childhoodEnvironment = { ...lp.childhoodEnvironment, description: value }
                break
            case 'familyCrisis.description':
                lp.familyCrisis = { ...lp.familyCrisis, description: value }
                break
            case 'lifeGoal.description':
                lp.lifeGoal = { ...lp.lifeGoal, description: value }
                break
        }
        setEditedEdgerunner({ ...editedEdgerunner, lifepath: lp })
    }

    // === Shopping handlers ===
    const handleBuyWeapon = (shopWeapon: ShopWeapon) => {
        if (!editedEdgerunner || editedEdgerunner.eurobucks < shopWeapon.cost) return
        const newWeapon: Weapon = {
            name: shopWeapon.name,
            type: shopWeapon.type,
            damage: shopWeapon.damage,
            rof: shopWeapon.rof,
            cost: shopWeapon.cost,
            skill: shopWeapon.skill,
        }
        setEditedEdgerunner({
            ...editedEdgerunner,
            weapons: [...editedEdgerunner.weapons, newWeapon],
            eurobucks: editedEdgerunner.eurobucks - shopWeapon.cost,
        })
    }

    const handleSellWeapon = (index: number) => {
        if (!editedEdgerunner) return
        const weapon = editedEdgerunner.weapons[index]
        const refund = Math.floor(weapon.cost / 2)
        setEditedEdgerunner({
            ...editedEdgerunner,
            weapons: editedEdgerunner.weapons.filter((_, i) => i !== index),
            eurobucks: editedEdgerunner.eurobucks + refund,
        })
    }

    const handleBuyArmor = (shopArmor: ShopArmor) => {
        if (!editedEdgerunner || editedEdgerunner.eurobucks < shopArmor.cost) return
        const newArmor: Armor = {
            name: shopArmor.name,
            sp: shopArmor.sp,
            penalty: shopArmor.penalty,
            cost: shopArmor.cost,
            location: shopArmor.location,
        }
        setEditedEdgerunner({
            ...editedEdgerunner,
            armor: [...editedEdgerunner.armor, newArmor],
            eurobucks: editedEdgerunner.eurobucks - shopArmor.cost,
        })
    }

    const handleSellArmor = (index: number) => {
        if (!editedEdgerunner) return
        const armor = editedEdgerunner.armor[index]
        const refund = Math.floor(armor.cost / 2)
        setEditedEdgerunner({
            ...editedEdgerunner,
            armor: editedEdgerunner.armor.filter((_, i) => i !== index),
            eurobucks: editedEdgerunner.eurobucks + refund,
        })
    }

    const handleBuyGear = (shopGear: ShopGear) => {
        if (!editedEdgerunner || editedEdgerunner.eurobucks < shopGear.cost) return
        const newGear: GearItem = {
            name: shopGear.name,
            description: shopGear.description,
            cost: shopGear.cost,
        }
        setEditedEdgerunner({
            ...editedEdgerunner,
            gear: [...editedEdgerunner.gear, newGear],
            eurobucks: editedEdgerunner.eurobucks - shopGear.cost,
        })
    }

    const handleSellGear = (index: number) => {
        if (!editedEdgerunner) return
        const item = editedEdgerunner.gear[index]
        const refund = Math.floor(item.cost / 2)
        setEditedEdgerunner({
            ...editedEdgerunner,
            gear: editedEdgerunner.gear.filter((_, i) => i !== index),
            eurobucks: editedEdgerunner.eurobucks + refund,
        })
    }

    const getFoundationSlotUsage = (foundationName: string): { used: number; max: number } => {
        if (!editedEdgerunner) return { used: 0, max: 0 }
        const foundation = allCyberware.find((c) => c.name === foundationName)
        const max = foundation?.maxSlots ?? 0
        let used = 0
        for (const owned of editedEdgerunner.cyberware) {
            const shopItem = allCyberware.find((c) => c.name === owned.name && c.prerequisite === foundationName)
            if (shopItem) {
                used += shopItem.slotsUsed ?? 1
            }
        }
        return { used, max }
    }

    const isSlotsFull = (shopCyber: ShopCyberware): boolean => {
        if (!shopCyber.prerequisite) return false
        const foundation = allCyberware.find((c) => c.name === shopCyber.prerequisite && c.maxSlots !== undefined)
        if (!foundation) return false
        const { used, max } = getFoundationSlotUsage(shopCyber.prerequisite)
        return used + (shopCyber.slotsUsed ?? 1) > max
    }

    const getCyberwareBlockReason = (shopCyber: ShopCyberware): string | null => {
        if (!editedEdgerunner) return null
        if (shopCyber.prerequisite) {
            const count = editedEdgerunner.cyberware.filter((c) => c.name === shopCyber.prerequisite).length
            const needed = shopCyber.prerequisiteCount ?? 1
            if (count < needed) {
                return needed > 1
                    ? `Requires ${needed}x ${shopCyber.prerequisite} (have ${count})`
                    : `Requires ${shopCyber.prerequisite}`
            }
        }
        if (shopCyber.requiresStat) {
            const { stat, min } = shopCyber.requiresStat
            const effective = getEffectiveStats(editedEdgerunner.stats, editedEdgerunner.cyberware)
            if (effective[stat] < min) {
                return `Requires ${stat} ${min}+ (current: ${effective[stat]})`
            }
        }
        if (shopCyber.unique && editedEdgerunner.cyberware.some((c) => c.name === shopCyber.name)) {
            return 'Already installed (only one allowed)'
        }
        if (isSlotsFull(shopCyber)) {
            return `No slots available in ${shopCyber.prerequisite}`
        }
        return null
    }

    const handleBuyCyberware = (shopCyber: ShopCyberware) => {
        if (!editedEdgerunner || editedEdgerunner.eurobucks < shopCyber.cost) return
        if (getCyberwareBlockReason(shopCyber)) return
        const newCyberware: Cyberware = {
            name: shopCyber.name,
            type: shopCyber.type,
            description: shopCyber.description,
            humanityLoss: shopCyber.humanityLoss,
            cost: shopCyber.cost,
            ...(shopCyber.bodyBonus && { bodyBonus: shopCyber.bodyBonus }),
            ...(shopCyber.bodyOverride && { bodyOverride: shopCyber.bodyOverride }),
        }
        const newHumanity = editedEdgerunner.derivedStats.HumanityCurrent - shopCyber.humanityLoss
        const baseEMP = Math.ceil(editedEdgerunner.derivedStats.HumanityMax / 10)
        const newEMP = Math.min(baseEMP, calculateCurrentEMP(newHumanity))
        const newCyberwareList = [...editedEdgerunner.cyberware, newCyberware]
        const newStats = { ...editedEdgerunner.stats, EMP: newEMP }
        const effectiveStats = getEffectiveStats(newStats, newCyberwareList)
        const derivedStatsCalc = calculateDerivedStats(effectiveStats)
        setEditedEdgerunner({
            ...editedEdgerunner,
            cyberware: newCyberwareList,
            eurobucks: editedEdgerunner.eurobucks - shopCyber.cost,
            stats: newStats,
            derivedStats: {
                ...editedEdgerunner.derivedStats,
                HP: derivedStatsCalc.HP,
                SeriouslyWoundedThreshold: derivedStatsCalc.SeriouslyWoundedThreshold,
                DeathSave: derivedStatsCalc.DeathSave,
                HumanityCurrent: newHumanity,
            },
        })
    }

    const handleSellCyberware = (index: number) => {
        if (!editedEdgerunner) return
        const cyber = editedEdgerunner.cyberware[index]
        const refund = Math.floor(cyber.cost / 2)
        const hlRefund = typeof cyber.humanityLoss === 'number' ? cyber.humanityLoss : 0
        const newHumanity = Math.min(
            editedEdgerunner.derivedStats.HumanityCurrent + hlRefund,
            editedEdgerunner.derivedStats.HumanityMax
        )
        const baseEMP = Math.ceil(editedEdgerunner.derivedStats.HumanityMax / 10)
        const newEMP = Math.min(baseEMP, calculateCurrentEMP(newHumanity))
        const newCyberwareList = editedEdgerunner.cyberware.filter((_, i) => i !== index)
        const newStats = { ...editedEdgerunner.stats, EMP: newEMP }
        const effectiveStats = getEffectiveStats(newStats, newCyberwareList)
        const derivedStatsCalc = calculateDerivedStats(effectiveStats)
        setEditedEdgerunner({
            ...editedEdgerunner,
            cyberware: newCyberwareList,
            eurobucks: editedEdgerunner.eurobucks + refund,
            stats: newStats,
            derivedStats: {
                ...editedEdgerunner.derivedStats,
                HP: derivedStatsCalc.HP,
                SeriouslyWoundedThreshold: derivedStatsCalc.SeriouslyWoundedThreshold,
                DeathSave: derivedStatsCalc.DeathSave,
                HumanityCurrent: newHumanity,
            },
        })
    }

    const handleBuyFashion = (shopFashion: ShopFashion) => {
        if (!editedEdgerunner || editedEdgerunner.fashionBudget < shopFashion.cost) return
        const newItem: GearItem = {
            name: shopFashion.name,
            description: shopFashion.description,
            cost: shopFashion.cost,
        }
        setEditedEdgerunner({
            ...editedEdgerunner,
            fashionItems: [...editedEdgerunner.fashionItems, newItem],
            fashionBudget: editedEdgerunner.fashionBudget - shopFashion.cost,
        })
    }

    const handleSellFashion = (index: number) => {
        if (!editedEdgerunner) return
        const item = editedEdgerunner.fashionItems[index]
        const refund = Math.floor(item.cost / 2)
        setEditedEdgerunner({
            ...editedEdgerunner,
            fashionItems: editedEdgerunner.fashionItems.filter((_, i) => i !== index),
            fashionBudget: editedEdgerunner.fashionBudget + refund,
        })
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

    const getSkillLevelColor = (level: number) => {
        if (level >= 8) return colors.neons.green.default
        if (level >= 6) return colors.neons.cyan.default
        if (level >= 4) return colors.neons.yellow.default
        if (level >= 2) return colors.neons.orange.default
        return colors.grays.gray500
    }

    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case 'GOOD':
                return colors.neons.green.default
            case 'BAD':
                return colors.neons.red.default
            case 'FRIEND':
                return colors.neons.cyan.default
            case 'ENEMY':
                return colors.neons.orange.default
            case 'LOVE':
                return colors.neons.pink.default
            default:
                return colors.grays.gray600
        }
    }

    // Autocomplete styling helpers
    const autocompleteSx = {
        '& .MuiInput-input': { color: colors.grays.gray800 },
        '& .MuiInputLabel-root': { color: colors.grays.gray600 },
        '& .MuiInput-underline:before': { borderColor: `${colors.neons.cyan.default}30` },
        '& .MuiInput-underline:after': { borderColor: colors.neons.cyan.default },
    }
    const autocompletePaperSx = {
        backgroundColor: 'rgba(10, 15, 30, 0.95)',
        border: `1px solid ${colors.neons.cyan.default}40`,
        '& .MuiAutocomplete-option': {
            color: colors.grays.gray800,
            '&:hover': { backgroundColor: `${colors.neons.cyan.default}20` },
            '&[aria-selected="true"]': { backgroundColor: `${colors.neons.cyan.default}30` },
        },
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
                        color: colors.neons.orange.default,
                        fontWeight: 'bold',
                        '&:hover': {
                            backgroundColor: colors.neons.cyan.light,
                            color: colors.neons.orange.dark,
                            boxShadow: `0 0 15px ${colors.neons.cyan.default}60`,
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
                    sx={{
                        '&:hover': {
                            boxShadow: `0 0 10px ${colors.neons.red.default}40`,
                        },
                    }}
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
                        backdropFilter: 'blur(5px)',
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
                                onClick={() => handleCardClick(edgerunner)}
                                sx={{
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(0, 20, 30, 0.8)',
                                    border: `1px solid ${ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default}40`,
                                    backdropFilter: 'blur(5px)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '2px',
                                        background: `linear-gradient(90deg, transparent, ${ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default}, transparent)`,
                                    },
                                    '&:hover': {
                                        borderColor: ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default,
                                        boxShadow: `0 0 15px ${
                                            ROLE_COLORS[edgerunner.role] || colors.neons.cyan.default
                                        }40`,
                                        transform: 'translateY(-4px) scale(1.01)',
                                        animation: `${neonPulse} 2s infinite`,
                                    },
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
                                                    color: colors.grays.gray900,
                                                    fontFamily: '"Orbitron", monospace',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {edgerunner.handle || edgerunner.name}
                                            </Typography>
                                            {edgerunner.handle && (
                                                <Typography variant="caption" sx={{ color: colors.grays.gray600 }}>
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
                                    <Tooltip title={t('edgerunners.exportJson')}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleExportCharacter(edgerunner)
                                            }}
                                            sx={{ color: colors.neons.green.default }}
                                        >
                                            <Download fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('common.delete')}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteClick(edgerunner.id)
                                            }}
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

            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleDetailClose}
                maxWidth="md"
                fullWidth
                slotProps={{
                    paper: {
                        sx: readerMode
                            ? {
                                  bgcolor: '#ffffff',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                  color: '#333',
                              }
                            : {
                                  bgcolor: 'rgba(10, 15, 30, 0.95)',
                                  backdropFilter: 'blur(4px)',
                                  border: `1px solid ${colors.neons.cyan.default}40`,
                                  boxShadow: `0 0 20px ${colors.neons.cyan.default}40`,
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
                                          'linear-gradient(to right, rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
                                      backgroundSize: '20px 20px',
                                      pointerEvents: 'none',
                                      opacity: 0.5,
                                  },
                              },
                    },
                }}
            >
                {editedEdgerunner && (
                    <>
                        <DialogTitle
                            sx={
                                readerMode
                                    ? {
                                          color: '#0097a7',
                                          borderBottom: '1px solid #eee',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                      }
                                    : {
                                          color: colors.neons.cyan.default,
                                          textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                          fontFamily: '"Orbitron", monospace',
                                          borderBottom: `1px solid ${colors.neons.cyan.default}40`,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                          position: 'relative',
                                          '&::after': {
                                              content: '""',
                                              position: 'absolute',
                                              bottom: 0,
                                              left: '10%',
                                              width: '80%',
                                              height: '1px',
                                              background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                                          },
                                      }
                            }
                        >
                            <Stack sx={{ flexGrow: 1 }} spacing={0.5}>
                                <TextField
                                    value={editedEdgerunner.handle}
                                    onChange={(e) => updateEditedField('handle', e.target.value)}
                                    placeholder={t('characterCreator.handle')}
                                    variant="standard"
                                    size="small"
                                    sx={{
                                        '& .MuiInput-input': {
                                            color: readerMode ? '#0097a7' : colors.neons.cyan.default,
                                            fontFamily: '"Orbitron", monospace',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                        },
                                        '& .MuiInput-underline:before': { borderColor: 'transparent' },
                                        '& .MuiInput-underline:hover:before': {
                                            borderColor: readerMode
                                                ? 'rgba(0,0,0,0.2)'
                                                : `${colors.neons.cyan.default}40 !important`,
                                        },
                                        '& .MuiInput-underline:after': { borderColor: colors.neons.cyan.default },
                                    }}
                                />
                                <TextField
                                    value={editedEdgerunner.name}
                                    onChange={(e) => updateEditedField('name', e.target.value)}
                                    placeholder={t('characterCreator.name')}
                                    variant="standard"
                                    size="small"
                                    sx={{
                                        '& .MuiInput-input': {
                                            color: readerMode ? '#666' : colors.grays.gray600,
                                            fontSize: '0.85rem',
                                        },
                                        '& .MuiInput-underline:before': { borderColor: 'transparent' },
                                        '& .MuiInput-underline:hover:before': {
                                            borderColor: readerMode
                                                ? 'rgba(0,0,0,0.2)'
                                                : `${colors.neons.cyan.default}40 !important`,
                                        },
                                        '& .MuiInput-underline:after': { borderColor: colors.neons.cyan.default },
                                    }}
                                />
                            </Stack>
                            <Chip
                                label={t(`characterCreator.roles.${editedEdgerunner.role}`)}
                                size="small"
                                sx={{
                                    backgroundColor: `${ROLE_COLORS[editedEdgerunner.role]}30`,
                                    color: ROLE_COLORS[editedEdgerunner.role],
                                    border: `1px solid ${ROLE_COLORS[editedEdgerunner.role]}`,
                                }}
                            />
                            <Chip
                                label={t(`characterCreator.methods.${editedEdgerunner.creationMethod}`)}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                    color: colors.neons.cyan.default,
                                    fontSize: '0.65rem',
                                }}
                            />
                        </DialogTitle>

                        {/* Tabs */}
                        <Tabs
                            value={viewTab}
                            onChange={(_, v) => setViewTab(v)}
                            sx={{
                                borderBottom: `1px solid ${colors.neons.cyan.default}30`,
                                '& .MuiTab-root': {
                                    color: colors.grays.gray600,
                                    minHeight: 42,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        color: colors.neons.cyan.light,
                                        textShadow: `0 0 5px ${colors.neons.cyan.default}40`,
                                    },
                                },
                                '& .Mui-selected': {
                                    color: colors.neons.cyan.default,
                                    textShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: colors.neons.cyan.default,
                                    boxShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                },
                            }}
                        >
                            <Tab label={t('edgerunners.tabs.overview')} />
                            <Tab label={t('edgerunners.tabs.skills')} />
                            <Tab label={t('edgerunners.tabs.equipment')} />
                            <Tab label={t('edgerunners.tabs.lifepath')} />
                            <Tab label={t('edgerunners.tabs.ip')} />
                            <Tab label={t('edgerunners.tabs.notes')} />
                            <Tab label={t('edgerunners.tabs.combat')} />
                        </Tabs>

                        <DialogContent sx={{ p: 0 }}>
                            <CustomScrollbar height="60vh">
                                <Box sx={{ px: 3, py: 2 }}>
                                    {/* === TAB 0: OVERVIEW === */}
                                    {viewTab === 0 && (
                                        <Grid container spacing={2}>
                                            {/* Stats */}
                                            <Grid size={12}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        mb: 1,
                                                        fontWeight: 'bold',
                                                    }}
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
                                                    {Object.entries(editedEdgerunner.stats).map(([stat, value]) => (
                                                        <Box
                                                            key={stat}
                                                            sx={{
                                                                textAlign: 'center',
                                                                py: 0.5,
                                                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                                borderRadius: '4px',
                                                                border: `1px solid ${getStatColor(value)}50`,
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: colors.grays.gray600,
                                                                    textAlign: 'center',
                                                                    display: 'block',
                                                                }}
                                                            >
                                                                {stat}
                                                            </Typography>
                                                            <TextField
                                                                type="tel"
                                                                value={value}
                                                                onChange={(e) =>
                                                                    updateEditedStat(
                                                                        stat,
                                                                        parseInt(e.target.value) || 0
                                                                    )
                                                                }
                                                                variant="standard"
                                                                slotProps={{
                                                                    htmlInput: {
                                                                        min: 1,
                                                                        max: 10,
                                                                        style: { textAlign: 'center', padding: 0 },
                                                                    },
                                                                }}
                                                                sx={{
                                                                    width: 40,
                                                                    mx: 'auto',
                                                                    display: 'block',
                                                                    '& .MuiInput-input': {
                                                                        color: getStatColor(value),
                                                                        fontWeight: 'bold',
                                                                        fontFamily: '"Orbitron", monospace',
                                                                        fontSize: '1.15rem',
                                                                    },
                                                                    '& .MuiInput-underline:before': {
                                                                        borderColor: 'transparent',
                                                                    },
                                                                    '& .MuiInput-underline:hover:before': {
                                                                        borderColor: `${getStatColor(value)}40 !important`,
                                                                    },
                                                                    '& .MuiInput-underline:after': {
                                                                        borderColor: getStatColor(value),
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Grid>

                                            {/* Derived Stats */}
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        mb: 1,
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {t('characterCreator.derivedStats')}
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                                        <Chip
                                                            label={`HP: ${editedEdgerunner.derivedStats.HP}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                                                color: colors.neons.red.default,
                                                            }}
                                                        />
                                                        <Chip
                                                            label={`Seriously Wounded: ${editedEdgerunner.derivedStats.SeriouslyWoundedThreshold}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 100, 0, 0.2)',
                                                                color: colors.neons.orange.default,
                                                            }}
                                                        />
                                                        <Chip
                                                            label={`Death Save: ${editedEdgerunner.derivedStats.DeathSave}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 0, 0, 0.15)',
                                                                color: colors.neons.red.default,
                                                            }}
                                                        />
                                                    </Stack>
                                                    <Stack direction="row" spacing={1}>
                                                        <Chip
                                                            label={`Humanity: ${editedEdgerunner.derivedStats.HumanityCurrent} / ${editedEdgerunner.derivedStats.HumanityMax}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor:
                                                                    editedEdgerunner.derivedStats.HumanityCurrent <= 0
                                                                        ? 'rgba(255, 0, 0, 0.4)'
                                                                        : editedEdgerunner.derivedStats
                                                                                .HumanityCurrent < 20
                                                                          ? 'rgba(255, 0, 0, 0.2)'
                                                                          : 'rgba(255, 0, 255, 0.2)',
                                                                color:
                                                                    editedEdgerunner.derivedStats.HumanityCurrent < 20
                                                                        ? colors.neons.red.default
                                                                        : colors.neons.pink.default,
                                                            }}
                                                        />
                                                        <Chip
                                                            label={`EMP: ${editedEdgerunner.stats.EMP}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(0, 200, 255, 0.15)',
                                                                color: colors.neons.cyan.default,
                                                            }}
                                                        />
                                                    </Stack>
                                                </Stack>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{ color: colors.neons.yellow.default }}
                                                    >
                                                        Eurobucks:
                                                    </Typography>
                                                    <TextField
                                                        type="tel"
                                                        value={editedEdgerunner.eurobucks}
                                                        onChange={(e) =>
                                                            updateEditedField(
                                                                'eurobucks',
                                                                Math.max(0, parseInt(e.target.value) || 0)
                                                            )
                                                        }
                                                        variant="standard"
                                                        size="small"
                                                        slotProps={{
                                                            htmlInput: {
                                                                min: 0,
                                                                style: { textAlign: 'center', padding: 0 },
                                                            },
                                                        }}
                                                        sx={{
                                                            width: 80,
                                                            '& .MuiInput-input': {
                                                                color: colors.neons.yellow.default,
                                                                fontWeight: 'bold',
                                                                fontFamily: '"Orbitron", monospace',
                                                            },
                                                            '& .MuiInput-underline:before': {
                                                                borderColor: 'transparent',
                                                            },
                                                            '& .MuiInput-underline:hover:before': {
                                                                borderColor: `${colors.neons.yellow.default}40 !important`,
                                                            },
                                                            '& .MuiInput-underline:after': {
                                                                borderColor: colors.neons.yellow.default,
                                                            },
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{ color: colors.neons.yellow.default }}
                                                    >
                                                        eb
                                                    </Typography>
                                                </Stack>
                                            </Grid>

                                            {/* Role Ability */}
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        mb: 1,
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    Role Ability
                                                </Typography>
                                                <Paper
                                                    sx={{
                                                        p: 1.5,
                                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                        border: `1px solid ${ROLE_COLORS[editedEdgerunner.role]}40`,
                                                    }}
                                                >
                                                    {/* Header: Name + Rank */}
                                                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                                        <Typography
                                                            sx={{
                                                                color: ROLE_COLORS[editedEdgerunner.role],
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            {editedEdgerunner.roleAbility || '—'}
                                                        </Typography>
                                                        <Chip
                                                            label={`Rank ${editedEdgerunner.roleRank}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: `${ROLE_COLORS[editedEdgerunner.role]}25`,
                                                                color: ROLE_COLORS[editedEdgerunner.role],
                                                                fontWeight: 'bold',
                                                                fontSize: '0.7rem',
                                                            }}
                                                        />
                                                    </Stack>

                                                    {/* Mechanic description */}
                                                    {ROLE_ABILITY_RANK_DETAILS[editedEdgerunner.role] && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: colors.grays.gray500,
                                                                display: 'block',
                                                                mb: 1,
                                                                fontStyle: 'italic',
                                                            }}
                                                        >
                                                            {ROLE_ABILITY_RANK_DETAILS[editedEdgerunner.role].mechanic}
                                                        </Typography>
                                                    )}

                                                    {/* Current rank details */}
                                                    {(() => {
                                                        const roleDetails =
                                                            ROLE_ABILITY_RANK_DETAILS[editedEdgerunner.role]
                                                        if (!roleDetails) return null
                                                        const currentRankInfo = roleDetails.ranks.find(
                                                            (r) =>
                                                                editedEdgerunner.roleRank >= r.minRank &&
                                                                editedEdgerunner.roleRank <= r.maxRank
                                                        )
                                                        if (!currentRankInfo) return null
                                                        return (
                                                            <Box
                                                                sx={{
                                                                    backgroundColor: `${ROLE_COLORS[editedEdgerunner.role]}10`,
                                                                    border: `1px solid ${ROLE_COLORS[editedEdgerunner.role]}25`,
                                                                    borderRadius: '4px',
                                                                    p: 1,
                                                                    mb: 1,
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: ROLE_COLORS[editedEdgerunner.role],
                                                                        fontWeight: 'bold',
                                                                        display: 'block',
                                                                        mb: 0.5,
                                                                    }}
                                                                >
                                                                    Current (Rank {currentRankInfo.range})
                                                                </Typography>
                                                                {currentRankInfo.details.map((detail, i) => (
                                                                    <Typography
                                                                        key={i}
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.grays.gray700,
                                                                            display: 'block',
                                                                            pl: detail.startsWith('  ') ? 1.5 : 0,
                                                                            lineHeight: 1.5,
                                                                        }}
                                                                    >
                                                                        {detail.startsWith('  ')
                                                                            ? detail
                                                                            : `• ${detail}`}
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        )
                                                    })()}

                                                    {/* All ranks accordion */}
                                                    {ROLE_ABILITY_RANK_DETAILS[editedEdgerunner.role] && (
                                                        <Accordion
                                                            sx={{
                                                                backgroundColor: 'transparent',
                                                                boxShadow: 'none',
                                                                '&::before': { display: 'none' },
                                                                border: `1px solid ${colors.grays.gray300}`,
                                                                borderRadius: '4px !important',
                                                            }}
                                                        >
                                                            <AccordionSummary
                                                                expandIcon={
                                                                    <ExpandMore
                                                                        sx={{
                                                                            color: colors.grays.gray500,
                                                                            fontSize: 16,
                                                                        }}
                                                                    />
                                                                }
                                                                sx={{
                                                                    minHeight: 28,
                                                                    '& .MuiAccordionSummary-content': { my: 0.3 },
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: colors.grays.gray500,
                                                                        fontSize: '0.7rem',
                                                                    }}
                                                                >
                                                                    All Ranks
                                                                </Typography>
                                                            </AccordionSummary>
                                                            <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                {ROLE_ABILITY_RANK_DETAILS[
                                                                    editedEdgerunner.role
                                                                ].ranks.map((rankInfo) => {
                                                                    const isCurrent =
                                                                        editedEdgerunner.roleRank >= rankInfo.minRank &&
                                                                        editedEdgerunner.roleRank <= rankInfo.maxRank
                                                                    return (
                                                                        <Box
                                                                            key={rankInfo.range}
                                                                            sx={{
                                                                                mb: 1,
                                                                                pb: 0.5,
                                                                                borderBottom: `1px solid ${colors.grays.gray300}`,
                                                                                '&:last-child': {
                                                                                    borderBottom: 'none',
                                                                                    mb: 0,
                                                                                },
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="caption"
                                                                                sx={{
                                                                                    color: isCurrent
                                                                                        ? ROLE_COLORS[
                                                                                              editedEdgerunner.role
                                                                                          ]
                                                                                        : colors.grays.gray500,
                                                                                    fontWeight: isCurrent
                                                                                        ? 'bold'
                                                                                        : 'normal',
                                                                                    display: 'block',
                                                                                    mb: 0.3,
                                                                                }}
                                                                            >
                                                                                Rank {rankInfo.range}
                                                                                {isCurrent && ' ●'}
                                                                            </Typography>
                                                                            {rankInfo.details.map((detail, i) => (
                                                                                <Typography
                                                                                    key={i}
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        color: isCurrent
                                                                                            ? colors.grays.gray700
                                                                                            : colors.grays.gray500,
                                                                                        display: 'block',
                                                                                        fontSize: '0.68rem',
                                                                                        pl: detail.startsWith('  ')
                                                                                            ? 1.5
                                                                                            : 0.5,
                                                                                        lineHeight: 1.4,
                                                                                    }}
                                                                                >
                                                                                    {detail.startsWith('  ')
                                                                                        ? detail
                                                                                        : `• ${detail}`}
                                                                                </Typography>
                                                                            ))}
                                                                        </Box>
                                                                    )
                                                                })}
                                                            </AccordionDetails>
                                                        </Accordion>
                                                    )}
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    )}

                                    {/* === TAB 1: SKILLS === */}
                                    {viewTab === 1 && (
                                        <Box>
                                            {SKILL_CATEGORY_ORDER.map((category) => {
                                                const categorySkills = ALL_SKILLS.filter((s) => s.category === category)
                                                const catColor = SKILL_CATEGORY_COLORS[category]
                                                const assignedCount = categorySkills.filter((s) => {
                                                    const cs = editedEdgerunner.skills.find(
                                                        (cs) => cs.skill.name === s.name
                                                    )
                                                    return cs && cs.level > 0
                                                }).length
                                                return (
                                                    <Accordion
                                                        key={category}
                                                        defaultExpanded={false}
                                                        sx={{
                                                            backgroundColor: 'transparent',
                                                            boxShadow: 'none',
                                                            '&::before': { display: 'none' },
                                                            border: `1px solid ${catColor}30`,
                                                            borderRadius: '4px !important',
                                                            mb: 1,
                                                        }}
                                                    >
                                                        <AccordionSummary
                                                            expandIcon={<ExpandMore sx={{ color: catColor }} />}
                                                            sx={{
                                                                minHeight: 36,
                                                                '& .MuiAccordionSummary-content': { my: 0.5 },
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    sx={{ color: catColor, fontWeight: 'bold' }}
                                                                >
                                                                    {category.replace('_', ' ')}
                                                                </Typography>
                                                                <Chip
                                                                    label={`${assignedCount}/${categorySkills.length}`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.65rem',
                                                                        backgroundColor: `${catColor}20`,
                                                                        color: catColor,
                                                                    }}
                                                                />
                                                            </Stack>
                                                        </AccordionSummary>
                                                        <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                            {/* Header row */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    py: 0.3,
                                                                    px: 1,
                                                                    mb: 0.5,
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: colors.grays.gray500,
                                                                        flex: 1,
                                                                        fontSize: '0.7rem',
                                                                    }}
                                                                >
                                                                    Skill
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: colors.grays.gray500,
                                                                        width: 35,
                                                                        textAlign: 'center',
                                                                        fontSize: '0.7rem',
                                                                    }}
                                                                >
                                                                    Stat
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: colors.grays.gray500,
                                                                        width: 35,
                                                                        textAlign: 'center',
                                                                        fontSize: '0.7rem',
                                                                    }}
                                                                >
                                                                    {t('edgerunners.lvl')}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: colors.grays.gray500,
                                                                        width: 30,
                                                                        textAlign: 'center',
                                                                        fontSize: '0.7rem',
                                                                    }}
                                                                >
                                                                    {t('edgerunners.total')}
                                                                </Typography>
                                                                <Tooltip title={t('edgerunners.combatAction')} arrow>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.grays.gray500,
                                                                            width: 28,
                                                                            textAlign: 'center',
                                                                            fontSize: '0.6rem',
                                                                        }}
                                                                    >
                                                                        {t('edgerunners.act')}
                                                                    </Typography>
                                                                </Tooltip>
                                                            </Box>
                                                            {categorySkills.map((skillDef) => {
                                                                const charSkill = editedEdgerunner.skills.find(
                                                                    (cs) => cs.skill.name === skillDef.name
                                                                )
                                                                const level = charSkill?.level ?? 0
                                                                const statBase =
                                                                    editedEdgerunner.stats[skillDef.stat] ?? 0
                                                                const total = statBase + level
                                                                return (
                                                                    <Box
                                                                        key={skillDef.name}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            py: 0.3,
                                                                            px: 1,
                                                                            borderBottom: `1px solid ${colors.grays.gray300}`,
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color:
                                                                                    level > 0
                                                                                        ? colors.grays.gray800
                                                                                        : colors.grays.gray500,
                                                                                fontSize: '0.8rem',
                                                                                flex: 1,
                                                                            }}
                                                                        >
                                                                            {skillDef.name}
                                                                            {skillDef.isX2 && (
                                                                                <Typography
                                                                                    component="span"
                                                                                    sx={{
                                                                                        color: colors.neons.yellow
                                                                                            .default,
                                                                                        fontSize: '0.65rem',
                                                                                        ml: 0.5,
                                                                                    }}
                                                                                >
                                                                                    x2
                                                                                </Typography>
                                                                            )}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: colors.grays.gray500,
                                                                                width: 35,
                                                                                textAlign: 'center',
                                                                            }}
                                                                        >
                                                                            {skillDef.stat}
                                                                        </Typography>
                                                                        <TextField
                                                                            type="tel"
                                                                            value={level}
                                                                            onChange={(e) =>
                                                                                updateSkillLevel(
                                                                                    skillDef.name,
                                                                                    parseInt(e.target.value) || 0
                                                                                )
                                                                            }
                                                                            variant="standard"
                                                                            slotProps={{
                                                                                htmlInput: {
                                                                                    min: 0,
                                                                                    max: 10,
                                                                                    style: {
                                                                                        textAlign: 'center',
                                                                                        padding: 0,
                                                                                        width: 30,
                                                                                    },
                                                                                },
                                                                            }}
                                                                            sx={{
                                                                                width: 35,
                                                                                '& .MuiInput-input': {
                                                                                    color: getSkillLevelColor(level),
                                                                                    fontWeight: 'bold',
                                                                                    fontFamily: '"Orbitron", monospace',
                                                                                    fontSize: '0.85rem',
                                                                                },
                                                                                '& .MuiInput-underline:before': {
                                                                                    borderColor: 'transparent',
                                                                                },
                                                                                '& .MuiInput-underline:after': {
                                                                                    borderColor: catColor,
                                                                                },
                                                                            }}
                                                                        />
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color:
                                                                                    total > 0
                                                                                        ? colors.neons.green.default
                                                                                        : colors.grays.gray500,
                                                                                fontWeight: 'bold',
                                                                                fontFamily: '"Orbitron", monospace',
                                                                                width: 30,
                                                                                textAlign: 'center',
                                                                            }}
                                                                        >
                                                                            {total}
                                                                        </Typography>
                                                                        <Checkbox
                                                                            size="small"
                                                                            checked={!!charSkill?.isTokenAction}
                                                                            disabled={level === 0}
                                                                            onChange={() => {
                                                                                if (!charSkill) return
                                                                                setEditedEdgerunner({
                                                                                    ...editedEdgerunner,
                                                                                    skills: editedEdgerunner.skills.map(
                                                                                        (s) =>
                                                                                            s.skill.name ===
                                                                                            skillDef.name
                                                                                                ? {
                                                                                                      ...s,
                                                                                                      isTokenAction:
                                                                                                          !s.isTokenAction,
                                                                                                  }
                                                                                                : s
                                                                                    ),
                                                                                })
                                                                            }}
                                                                            sx={{
                                                                                p: 0,
                                                                                width: 28,
                                                                                color: colors.neons.cyan.dark,
                                                                                '&.Mui-checked': {
                                                                                    color: colors.neons.cyan.default,
                                                                                },
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                )
                                                            })}
                                                        </AccordionDetails>
                                                    </Accordion>
                                                )
                                            })}
                                        </Box>
                                    )}

                                    {/* === TAB 2: EQUIPMENT (Night Market) === */}
                                    {viewTab === 2 && (
                                        <Box>
                                            {/* Header */}
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                mb={1}
                                            >
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        color: colors.neons.yellow.default,
                                                        fontWeight: 'bold',
                                                        fontFamily: '"Orbitron", sans-serif',
                                                    }}
                                                >
                                                    Night Market
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Chip
                                                        label={`${editedEdgerunner.eurobucks}eb`}
                                                        sx={{
                                                            backgroundColor: `${colors.neons.yellow.default}20`,
                                                            color: colors.neons.yellow.default,
                                                            fontFamily: '"Orbitron", sans-serif',
                                                            fontWeight: 'bold',
                                                            border: `1px solid ${colors.neons.yellow.default}40`,
                                                        }}
                                                    />
                                                    <Chip
                                                        label={`Fashion: ${editedEdgerunner.fashionBudget}eb`}
                                                        sx={{
                                                            backgroundColor: `${colors.neons.pink.default}20`,
                                                            color: colors.neons.pink.default,
                                                            fontFamily: '"Orbitron", sans-serif',
                                                            fontSize: '0.85rem',
                                                            border: `1px solid ${colors.neons.pink.default}40`,
                                                        }}
                                                    />
                                                </Stack>
                                            </Stack>

                                            {/* Humanity warnings */}
                                            {editedEdgerunner.derivedStats.HumanityCurrent <= 0 && (
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        mb: 2,
                                                        backgroundColor: `${colors.neons.red.default}20`,
                                                        border: `2px solid ${colors.neons.red.default}`,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: colors.neons.red.default, fontWeight: 'bold' }}
                                                    >
                                                        CYBERPSYCHOSIS — This character has lost their humanity!
                                                    </Typography>
                                                </Paper>
                                            )}
                                            {editedEdgerunner.derivedStats.HumanityCurrent > 0 &&
                                                editedEdgerunner.derivedStats.HumanityCurrent < 20 && (
                                                    <Paper
                                                        sx={{
                                                            p: 1,
                                                            mb: 2,
                                                            backgroundColor: `${editedEdgerunner.derivedStats.HumanityCurrent < 10 ? colors.neons.red.default : colors.neons.yellow.default}15`,
                                                            border: `1px solid ${editedEdgerunner.derivedStats.HumanityCurrent < 10 ? colors.neons.red.default : colors.neons.yellow.default}60`,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color:
                                                                    editedEdgerunner.derivedStats.HumanityCurrent < 10
                                                                        ? colors.neons.red.default
                                                                        : colors.neons.yellow.default,
                                                            }}
                                                        >
                                                            Warning: Humanity critically low (
                                                            {editedEdgerunner.derivedStats.HumanityCurrent})
                                                        </Typography>
                                                    </Paper>
                                                )}

                                            {/* Shopping Tabs */}
                                            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={0.5}>
                                                {[
                                                    { key: 'weapons' as const, label: 'Weapons' },
                                                    { key: 'armor' as const, label: 'Armor' },
                                                    { key: 'gear' as const, label: 'Gear' },
                                                    { key: 'cyberware' as const, label: 'Cyberware' },
                                                    { key: 'fashion' as const, label: 'Fashion' },
                                                ].map((tab) => (
                                                    <Button
                                                        key={tab.key}
                                                        variant={shoppingTab === tab.key ? 'contained' : 'outlined'}
                                                        size="small"
                                                        onClick={() => setShoppingTab(tab.key)}
                                                        sx={{
                                                            backgroundColor:
                                                                shoppingTab === tab.key
                                                                    ? colors.neons.cyan.default
                                                                    : 'transparent',
                                                            borderColor: colors.neons.cyan.default,
                                                            color:
                                                                shoppingTab === tab.key
                                                                    ? colors.grays.gray000
                                                                    : colors.neons.cyan.default,
                                                            '&:hover': {
                                                                bgcolor:
                                                                    shoppingTab === tab.key
                                                                        ? colors.neons.cyan.dark
                                                                        : 'rgba(0, 30, 60, 0.8)',
                                                                boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                                            },
                                                        }}
                                                    >
                                                        {tab.label}
                                                    </Button>
                                                ))}
                                            </Stack>

                                            {/* Two-column layout */}
                                            <Grid container spacing={2}>
                                                {/* Left: Catalog */}
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            backgroundColor: 'rgba(10, 15, 25, 0.95)',
                                                            border: `1px solid ${colors.neons.cyan.default}30`,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: colors.neons.cyan.default,
                                                                mb: 1,
                                                                display: 'block',
                                                            }}
                                                        >
                                                            Available Items
                                                        </Typography>
                                                        <CustomScrollbar height="300px">
                                                            <Stack spacing={0.5}>
                                                                {shoppingTab === 'weapons' &&
                                                                    SHOP_WEAPONS.map((item, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                p: 0.75,
                                                                                border: `1px solid ${colors.grays.gray300}30`,
                                                                                borderRadius: 1,
                                                                            }}
                                                                        >
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {item.name}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{ color: colors.grays.gray600 }}
                                                                                >
                                                                                    {item.damage} | ROF {item.rof} |{' '}
                                                                                    {item.skill}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                onClick={() => handleBuyWeapon(item)}
                                                                                disabled={
                                                                                    editedEdgerunner.eurobucks <
                                                                                    item.cost
                                                                                }
                                                                                sx={{
                                                                                    borderColor:
                                                                                        colors.neons.green.default,
                                                                                    color: colors.neons.green.default,
                                                                                    minWidth: 70,
                                                                                    fontSize: '0.75rem',
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(0, 30, 0, 0.6)',
                                                                                        boxShadow: `0 0 10px ${colors.neons.green.default}40`,
                                                                                    },
                                                                                }}
                                                                            >
                                                                                {item.cost}eb
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                {shoppingTab === 'armor' &&
                                                                    SHOP_ARMOR.map((item, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                p: 0.75,
                                                                                border: `1px solid ${colors.grays.gray300}30`,
                                                                                borderRadius: 1,
                                                                            }}
                                                                        >
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {item.name}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{ color: colors.grays.gray600 }}
                                                                                >
                                                                                    SP {item.sp}
                                                                                    {item.penalty !== 0
                                                                                        ? ` | Penalty ${item.penalty}`
                                                                                        : ''}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                onClick={() => handleBuyArmor(item)}
                                                                                disabled={
                                                                                    editedEdgerunner.eurobucks <
                                                                                    item.cost
                                                                                }
                                                                                sx={{
                                                                                    borderColor:
                                                                                        colors.neons.green.default,
                                                                                    color: colors.neons.green.default,
                                                                                    minWidth: 70,
                                                                                    fontSize: '0.75rem',
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(0, 30, 0, 0.6)',
                                                                                        boxShadow: `0 0 10px ${colors.neons.green.default}40`,
                                                                                    },
                                                                                }}
                                                                            >
                                                                                {item.cost}eb
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                {shoppingTab === 'gear' &&
                                                                    SHOP_GEAR.map((item, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                p: 0.75,
                                                                                border: `1px solid ${colors.grays.gray300}30`,
                                                                                borderRadius: 1,
                                                                            }}
                                                                        >
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {item.name}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{ color: colors.grays.gray600 }}
                                                                                >
                                                                                    {item.description}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                onClick={() => handleBuyGear(item)}
                                                                                disabled={
                                                                                    editedEdgerunner.eurobucks <
                                                                                    item.cost
                                                                                }
                                                                                sx={{
                                                                                    borderColor:
                                                                                        colors.neons.green.default,
                                                                                    color: colors.neons.green.default,
                                                                                    minWidth: 70,
                                                                                    fontSize: '0.75rem',
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(0, 30, 0, 0.6)',
                                                                                        boxShadow: `0 0 10px ${colors.neons.green.default}40`,
                                                                                    },
                                                                                }}
                                                                            >
                                                                                {item.cost}eb
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                {shoppingTab === 'cyberware' &&
                                                                    CYBERWARE_CATEGORIES.map((cat) => {
                                                                        const categoryItems = allCyberware.filter(
                                                                            (item) => item.type === cat.type
                                                                        )
                                                                        if (categoryItems.length === 0) return null
                                                                        return (
                                                                            <Accordion
                                                                                key={cat.type}
                                                                                defaultExpanded={false}
                                                                                sx={{
                                                                                    backgroundColor: 'transparent',
                                                                                    boxShadow: 'none',
                                                                                    '&::before': { display: 'none' },
                                                                                    border: `1px solid ${cat.color}30`,
                                                                                    borderRadius: '4px !important',
                                                                                    mb: 0.5,
                                                                                }}
                                                                            >
                                                                                <AccordionSummary
                                                                                    expandIcon={
                                                                                        <ExpandMore
                                                                                            sx={{ color: cat.color }}
                                                                                        />
                                                                                    }
                                                                                    sx={{
                                                                                        minHeight: 36,
                                                                                        '& .MuiAccordionSummary-content':
                                                                                            { my: 0.5 },
                                                                                        borderBottom: `1px solid ${cat.color}20`,
                                                                                    }}
                                                                                >
                                                                                    <Stack
                                                                                        direction="row"
                                                                                        spacing={1}
                                                                                        alignItems="center"
                                                                                        sx={{ width: '100%' }}
                                                                                    >
                                                                                        <Typography
                                                                                            variant="subtitle2"
                                                                                            sx={{
                                                                                                color: cat.color,
                                                                                                fontWeight: 'bold',
                                                                                                fontSize: '0.8rem',
                                                                                            }}
                                                                                        >
                                                                                            {cat.label}
                                                                                        </Typography>
                                                                                        <Chip
                                                                                            label={`${categoryItems.length}`}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 16,
                                                                                                fontSize: '0.6rem',
                                                                                                backgroundColor: `${cat.color}20`,
                                                                                                color: cat.color,
                                                                                            }}
                                                                                        />
                                                                                    </Stack>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails
                                                                                    sx={{ p: 0.5, pt: 0 }}
                                                                                >
                                                                                    <Stack spacing={0.5}>
                                                                                        {categoryItems.map(
                                                                                            (item, i) => {
                                                                                                const blockReason =
                                                                                                    getCyberwareBlockReason(
                                                                                                        item
                                                                                                    )
                                                                                                const isBlocked =
                                                                                                    !!blockReason
                                                                                                const isFoundation =
                                                                                                    item.maxSlots !==
                                                                                                    undefined
                                                                                                const foundationSlots =
                                                                                                    isFoundation
                                                                                                        ? getFoundationSlotUsage(
                                                                                                              item.name
                                                                                                          )
                                                                                                        : null
                                                                                                const hasPrereq =
                                                                                                    !!item.prerequisite
                                                                                                const prereqInstalled =
                                                                                                    hasPrereq &&
                                                                                                    editedEdgerunner.cyberware.filter(
                                                                                                        (c) =>
                                                                                                            c.name ===
                                                                                                            item.prerequisite
                                                                                                    ).length >=
                                                                                                        (item.prerequisiteCount ??
                                                                                                            1)
                                                                                                return (
                                                                                                    <Box
                                                                                                        key={i}
                                                                                                        sx={{
                                                                                                            display:
                                                                                                                'flex',
                                                                                                            justifyContent:
                                                                                                                'space-between',
                                                                                                            alignItems:
                                                                                                                'center',
                                                                                                            p: 0.75,
                                                                                                            border: `1px solid ${isBlocked ? colors.grays.gray300 + '20' : `${cat.color}30`}`,
                                                                                                            borderRadius: 1,
                                                                                                            opacity:
                                                                                                                isBlocked
                                                                                                                    ? 0.5
                                                                                                                    : 1,
                                                                                                        }}
                                                                                                    >
                                                                                                        <Box
                                                                                                            sx={{
                                                                                                                flex: 1,
                                                                                                                minWidth: 0,
                                                                                                            }}
                                                                                                        >
                                                                                                            <Typography
                                                                                                                variant="body2"
                                                                                                                sx={{
                                                                                                                    color: colors
                                                                                                                        .grays
                                                                                                                        .gray800,
                                                                                                                    fontSize:
                                                                                                                        '0.8rem',
                                                                                                                }}
                                                                                                            >
                                                                                                                {
                                                                                                                    item.name
                                                                                                                }
                                                                                                                {isFoundation && (
                                                                                                                    <Chip
                                                                                                                        label={`Foundation ${foundationSlots ? `${foundationSlots.used}/${item.maxSlots}` : ''}`}
                                                                                                                        size="small"
                                                                                                                        sx={{
                                                                                                                            ml: 0.5,
                                                                                                                            fontSize:
                                                                                                                                '0.55rem',
                                                                                                                            height: 16,
                                                                                                                            backgroundColor:
                                                                                                                                colors
                                                                                                                                    .neons
                                                                                                                                    .cyan
                                                                                                                                    .default +
                                                                                                                                '30',
                                                                                                                            color: colors
                                                                                                                                .neons
                                                                                                                                .cyan
                                                                                                                                .default,
                                                                                                                        }}
                                                                                                                    />
                                                                                                                )}
                                                                                                                {item.unique && (
                                                                                                                    <Chip
                                                                                                                        label={t('edgerunners.unique')}
                                                                                                                        size="small"
                                                                                                                        sx={{
                                                                                                                            ml: 0.5,
                                                                                                                            fontSize:
                                                                                                                                '0.55rem',
                                                                                                                            height: 16,
                                                                                                                            backgroundColor:
                                                                                                                                colors
                                                                                                                                    .neons
                                                                                                                                    .purple
                                                                                                                                    .default +
                                                                                                                                '20',
                                                                                                                            color: colors
                                                                                                                                .neons
                                                                                                                                .purple
                                                                                                                                .default,
                                                                                                                        }}
                                                                                                                    />
                                                                                                                )}
                                                                                                            </Typography>
                                                                                                            <Typography
                                                                                                                variant="caption"
                                                                                                                sx={{
                                                                                                                    color: colors
                                                                                                                        .grays
                                                                                                                        .gray600,
                                                                                                                    display:
                                                                                                                        'block',
                                                                                                                    fontSize:
                                                                                                                        '0.7rem',
                                                                                                                }}
                                                                                                            >
                                                                                                                {
                                                                                                                    item.description
                                                                                                                }
                                                                                                            </Typography>
                                                                                                            {hasPrereq && (
                                                                                                                <Typography
                                                                                                                    variant="caption"
                                                                                                                    sx={{
                                                                                                                        color: prereqInstalled
                                                                                                                            ? colors
                                                                                                                                  .neons
                                                                                                                                  .green
                                                                                                                                  .default
                                                                                                                            : colors
                                                                                                                                  .neons
                                                                                                                                  .red
                                                                                                                                  .default,
                                                                                                                        display:
                                                                                                                            'block',
                                                                                                                        fontSize:
                                                                                                                            '0.7rem',
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Requires:{' '}
                                                                                                                    {
                                                                                                                        item.prerequisite
                                                                                                                    }{' '}
                                                                                                                    {prereqInstalled
                                                                                                                        ? '(installed)'
                                                                                                                        : '(missing)'}
                                                                                                                </Typography>
                                                                                                            )}
                                                                                                            {item.requiresStat &&
                                                                                                                (() => {
                                                                                                                    const effective =
                                                                                                                        getEffectiveStats(
                                                                                                                            editedEdgerunner.stats,
                                                                                                                            editedEdgerunner.cyberware
                                                                                                                        )
                                                                                                                    return (
                                                                                                                        <Typography
                                                                                                                            variant="caption"
                                                                                                                            sx={{
                                                                                                                                color:
                                                                                                                                    effective[
                                                                                                                                        item
                                                                                                                                            .requiresStat!
                                                                                                                                            .stat
                                                                                                                                    ] >=
                                                                                                                                    item
                                                                                                                                        .requiresStat!
                                                                                                                                        .min
                                                                                                                                        ? colors
                                                                                                                                              .neons
                                                                                                                                              .green
                                                                                                                                              .default
                                                                                                                                        : colors
                                                                                                                                              .neons
                                                                                                                                              .red
                                                                                                                                              .default,
                                                                                                                                display:
                                                                                                                                    'block',
                                                                                                                                fontSize:
                                                                                                                                    '0.7rem',
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            Requires{' '}
                                                                                                                            {
                                                                                                                                item
                                                                                                                                    .requiresStat!
                                                                                                                                    .stat
                                                                                                                            }{' '}
                                                                                                                            {
                                                                                                                                item
                                                                                                                                    .requiresStat!
                                                                                                                                    .min
                                                                                                                            }

                                                                                                                            +
                                                                                                                            (current:{' '}
                                                                                                                            {
                                                                                                                                effective[
                                                                                                                                    item
                                                                                                                                        .requiresStat!
                                                                                                                                        .stat
                                                                                                                                ]
                                                                                                                            }

                                                                                                                            )
                                                                                                                        </Typography>
                                                                                                                    )
                                                                                                                })()}
                                                                                                            <Typography
                                                                                                                variant="caption"
                                                                                                                sx={{
                                                                                                                    color: colors
                                                                                                                        .neons
                                                                                                                        .pink
                                                                                                                        .default,
                                                                                                                    display:
                                                                                                                        'block',
                                                                                                                    fontSize:
                                                                                                                        '0.7rem',
                                                                                                                }}
                                                                                                            >
                                                                                                                HL:{' '}
                                                                                                                {
                                                                                                                    item.humanityLoss
                                                                                                                }{' '}
                                                                                                                |{' '}
                                                                                                                {
                                                                                                                    item.install
                                                                                                                }
                                                                                                            </Typography>
                                                                                                        </Box>
                                                                                                        <Button
                                                                                                            size="small"
                                                                                                            variant="outlined"
                                                                                                            onClick={() =>
                                                                                                                handleBuyCyberware(
                                                                                                                    item
                                                                                                                )
                                                                                                            }
                                                                                                            disabled={
                                                                                                                editedEdgerunner.eurobucks <
                                                                                                                    item.cost ||
                                                                                                                isBlocked
                                                                                                            }
                                                                                                            sx={{
                                                                                                                borderColor:
                                                                                                                    colors
                                                                                                                        .neons
                                                                                                                        .green
                                                                                                                        .default,
                                                                                                                color: colors
                                                                                                                    .neons
                                                                                                                    .green
                                                                                                                    .default,
                                                                                                                minWidth: 70,
                                                                                                                fontSize:
                                                                                                                    '0.75rem',
                                                                                                                '&:hover':
                                                                                                                    {
                                                                                                                        bgcolor:
                                                                                                                            'rgba(0, 30, 0, 0.6)',
                                                                                                                        boxShadow: `0 0 10px ${colors.neons.green.default}40`,
                                                                                                                    },
                                                                                                            }}
                                                                                                        >
                                                                                                            {item.cost}
                                                                                                            eb
                                                                                                        </Button>
                                                                                                    </Box>
                                                                                                )
                                                                                            }
                                                                                        )}
                                                                                    </Stack>
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )
                                                                    })}
                                                                {shoppingTab === 'fashion' &&
                                                                    SHOP_FASHION.map((item, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                p: 0.75,
                                                                                border: `1px solid ${colors.grays.gray300}30`,
                                                                                borderRadius: 1,
                                                                            }}
                                                                        >
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {item.name}
                                                                                    <Chip
                                                                                        label={item.type}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            ml: 0.5,
                                                                                            fontSize: '0.55rem',
                                                                                            height: 16,
                                                                                            backgroundColor:
                                                                                                item.type ===
                                                                                                'fashionware'
                                                                                                    ? colors.neons
                                                                                                          .purple
                                                                                                          .default +
                                                                                                      '30'
                                                                                                    : colors.neons.pink
                                                                                                          .default +
                                                                                                      '30',
                                                                                            color:
                                                                                                item.type ===
                                                                                                'fashionware'
                                                                                                    ? colors.neons
                                                                                                          .purple
                                                                                                          .default
                                                                                                    : colors.neons.pink
                                                                                                          .default,
                                                                                        }}
                                                                                    />
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{ color: colors.grays.gray600 }}
                                                                                >
                                                                                    {item.description}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                onClick={() => handleBuyFashion(item)}
                                                                                disabled={
                                                                                    editedEdgerunner.fashionBudget <
                                                                                    item.cost
                                                                                }
                                                                                sx={{
                                                                                    borderColor:
                                                                                        colors.neons.pink.default,
                                                                                    color: colors.neons.pink.default,
                                                                                    minWidth: 70,
                                                                                    fontSize: '0.75rem',
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(40, 0, 40, 0.6)',
                                                                                        boxShadow: `0 0 10px ${colors.neons.pink.default}40`,
                                                                                    },
                                                                                }}
                                                                            >
                                                                                {item.cost}eb
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                            </Stack>
                                                        </CustomScrollbar>
                                                    </Paper>
                                                </Grid>

                                                {/* Right: Inventory */}
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            backgroundColor: 'rgba(10, 15, 25, 0.95)',
                                                            border: `1px solid ${colors.neons.yellow.default}30`,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: colors.neons.yellow.default,
                                                                mb: 1,
                                                                display: 'block',
                                                            }}
                                                        >
                                                            Your Inventory
                                                        </Typography>
                                                        <CustomScrollbar height="300px">
                                                            {editedEdgerunner.weapons.length > 0 && (
                                                                <Box mb={1.5}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.neons.red.default,
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        WEAPONS
                                                                    </Typography>
                                                                    {editedEdgerunner.weapons.map((w, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                py: 0.3,
                                                                            }}
                                                                        >
                                                                            <Stack
                                                                                direction="row"
                                                                                alignItems="center"
                                                                                spacing={0}
                                                                            >
                                                                                <Tooltip title={t('edgerunners.combatAction')} arrow>
                                                                                    <Checkbox
                                                                                        size="small"
                                                                                        checked={!!w.isTokenAction}
                                                                                        onChange={() => {
                                                                                            setEditedEdgerunner({
                                                                                                ...editedEdgerunner,
                                                                                                weapons:
                                                                                                    editedEdgerunner.weapons.map(
                                                                                                        (ww, wi) =>
                                                                                                            wi === i
                                                                                                                ? {
                                                                                                                      ...ww,
                                                                                                                      isTokenAction:
                                                                                                                          !ww.isTokenAction,
                                                                                                                  }
                                                                                                                : ww
                                                                                                    ),
                                                                                            })
                                                                                        }}
                                                                                        sx={{
                                                                                            p: 0.25,
                                                                                            color: colors.neons.red
                                                                                                .dark,
                                                                                            '&.Mui-checked': {
                                                                                                color: colors.neons.red
                                                                                                    .default,
                                                                                            },
                                                                                        }}
                                                                                    />
                                                                                </Tooltip>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {w.name}
                                                                                </Typography>
                                                                            </Stack>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => handleSellWeapon(i)}
                                                                                sx={{
                                                                                    color: colors.neons.red.default,
                                                                                    fontSize: '0.7rem',
                                                                                    minWidth: 50,
                                                                                }}
                                                                            >
                                                                                Sell ({Math.floor(w.cost / 2)}eb)
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                            {editedEdgerunner.armor.length > 0 && (
                                                                <Box mb={1.5}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.neons.blue.default,
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        ARMOR
                                                                    </Typography>
                                                                    {editedEdgerunner.armor.map((a, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                py: 0.3,
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    color: colors.grays.gray800,
                                                                                    fontSize: '0.8rem',
                                                                                }}
                                                                            >
                                                                                {a.name} (SP{a.sp})
                                                                            </Typography>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => handleSellArmor(i)}
                                                                                sx={{
                                                                                    color: colors.neons.red.default,
                                                                                    fontSize: '0.7rem',
                                                                                    minWidth: 50,
                                                                                }}
                                                                            >
                                                                                Sell ({Math.floor(a.cost / 2)}eb)
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                            {editedEdgerunner.gear.length > 0 && (
                                                                <Box mb={1.5}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.neons.green.default,
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        GEAR
                                                                    </Typography>
                                                                    {editedEdgerunner.gear.map((g, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                py: 0.3,
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    color: colors.grays.gray800,
                                                                                    fontSize: '0.8rem',
                                                                                }}
                                                                            >
                                                                                {g.name}
                                                                            </Typography>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => handleSellGear(i)}
                                                                                sx={{
                                                                                    color: colors.neons.red.default,
                                                                                    fontSize: '0.7rem',
                                                                                    minWidth: 50,
                                                                                }}
                                                                            >
                                                                                Sell ({Math.floor(g.cost / 2)}eb)
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                            {editedEdgerunner.cyberware.length > 0 && (
                                                                <Box mb={1.5}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.neons.purple.default,
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        CYBERWARE
                                                                    </Typography>
                                                                    {editedEdgerunner.cyberware.map((c, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                py: 0.3,
                                                                            }}
                                                                        >
                                                                            <Box>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {c.name}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        color: colors.neons.pink
                                                                                            .default,
                                                                                        fontSize: '0.65rem',
                                                                                    }}
                                                                                >
                                                                                    -{c.humanityLoss} HL
                                                                                </Typography>
                                                                            </Box>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => handleSellCyberware(i)}
                                                                                sx={{
                                                                                    color: colors.neons.red.default,
                                                                                    fontSize: '0.7rem',
                                                                                    minWidth: 50,
                                                                                }}
                                                                            >
                                                                                Sell
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                            {editedEdgerunner.fashionItems.length > 0 && (
                                                                <Box mb={1.5}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: colors.neons.pink.default,
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        FASHION
                                                                    </Typography>
                                                                    {editedEdgerunner.fashionItems.map((f, i) => (
                                                                        <Box
                                                                            key={i}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                py: 0.3,
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    color: colors.grays.gray800,
                                                                                    fontSize: '0.8rem',
                                                                                }}
                                                                            >
                                                                                {f.name}
                                                                            </Typography>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => handleSellFashion(i)}
                                                                                sx={{
                                                                                    color: colors.neons.red.default,
                                                                                    fontSize: '0.7rem',
                                                                                    minWidth: 50,
                                                                                }}
                                                                            >
                                                                                Sell ({Math.floor(f.cost / 2)}eb)
                                                                            </Button>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                            {editedEdgerunner.weapons.length === 0 &&
                                                                editedEdgerunner.armor.length === 0 &&
                                                                editedEdgerunner.gear.length === 0 &&
                                                                editedEdgerunner.cyberware.length === 0 &&
                                                                editedEdgerunner.fashionItems.length === 0 && (
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: colors.grays.gray600,
                                                                            fontStyle: 'italic',
                                                                        }}
                                                                    >
                                                                        Your inventory is empty.
                                                                    </Typography>
                                                                )}
                                                        </CustomScrollbar>
                                                    </Paper>

                                                    {/* Humanity tracker */}
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            mt: 1,
                                                            backgroundColor: `${colors.neons.pink.default}10`,
                                                            border: `1px solid ${colors.neons.pink.default}40`,
                                                        }}
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ color: colors.neons.pink.default }}
                                                            >
                                                                Humanity
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    color: colors.neons.pink.default,
                                                                    fontFamily: '"Orbitron", sans-serif',
                                                                }}
                                                            >
                                                                {editedEdgerunner.derivedStats.HumanityCurrent} /{' '}
                                                                {editedEdgerunner.derivedStats.HumanityMax}
                                                            </Typography>
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* === TAB 3: LIFEPATH === */}
                                    {viewTab === 3 && (
                                        <Grid container spacing={2}>
                                            {/* Cultural Origin & Language */}
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.culturalOrigin.region}
                                                    options={CULTURAL_ORIGINS.map((co) => co.region)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('culturalOrigin.region', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.culturalOrigin')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.language}
                                                    options={
                                                        CULTURAL_ORIGINS.find(
                                                            (co) =>
                                                                co.region ===
                                                                editedEdgerunner.lifepath.culturalOrigin.region
                                                        )?.languages ?? []
                                                    }
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('language', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('edgerunners.language')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>

                                            {/* Personality & Style */}
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.personality.description}
                                                    options={PERSONALITIES.map((p) => p.description)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('personality.description', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.personality')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.dressStyle.clothingStyle}
                                                    options={CLOTHING_STYLES.map((cs) => cs.style)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('dressStyle.clothingStyle', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('edgerunners.clothingStyle')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.dressStyle.hairstyle}
                                                    options={HAIRSTYLES.map((h) => h.style)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('dressStyle.hairstyle', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('edgerunners.hairstyle')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.affectation.description}
                                                    options={AFFECTATIONS.map((a) => a.description)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('affectation.description', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.affectation')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>

                                            {/* Motivation */}
                                            <Grid size={12}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        fontWeight: 'bold',
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {t('characterCreator.lifepath.motivation')}
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <Autocomplete
                                                            freeSolo
                                                            value={editedEdgerunner.lifepath.motivation.valueMost}
                                                            options={VALUES.map((v) => v.value)}
                                                            onInputChange={(_, newValue) =>
                                                                updateLifepathField('motivation.valueMost', newValue)
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label={t('edgerunners.valueMost')}
                                                                    variant="standard"
                                                                    sx={autocompleteSx}
                                                                    slotProps={{
                                                                        input: {
                                                                            sx: {
                                                                                px: 1.5,
                                                                            },
                                                                        },
                                                                    }}
                                                                />
                                                            )}
                                                            slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <Autocomplete
                                                            freeSolo
                                                            value={editedEdgerunner.lifepath.motivation.feelAboutPeople}
                                                            options={FEELINGS_ABOUT_PEOPLE.map((f) => f.feeling)}
                                                            onInputChange={(_, newValue) =>
                                                                updateLifepathField(
                                                                    'motivation.feelAboutPeople',
                                                                    newValue
                                                                )
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label={t('edgerunners.feelAboutPeople')}
                                                                    variant="standard"
                                                                    sx={autocompleteSx}
                                                                    slotProps={{
                                                                        input: {
                                                                            sx: {
                                                                                px: 1.5,
                                                                            },
                                                                        },
                                                                    }}
                                                                />
                                                            )}
                                                            slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <Autocomplete
                                                            freeSolo
                                                            value={
                                                                editedEdgerunner.lifepath.motivation.valuedPerson || ''
                                                            }
                                                            options={VALUED_PERSONS.map((vp) => vp.person)}
                                                            onInputChange={(_, newValue) =>
                                                                updateLifepathField('motivation.valuedPerson', newValue)
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label={t('edgerunners.valuedPerson')}
                                                                    variant="standard"
                                                                    sx={autocompleteSx}
                                                                    slotProps={{
                                                                        input: {
                                                                            sx: {
                                                                                px: 1.5,
                                                                            },
                                                                        },
                                                                    }}
                                                                />
                                                            )}
                                                            slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <Autocomplete
                                                            freeSolo
                                                            value={
                                                                editedEdgerunner.lifepath.motivation.valuedPossession
                                                            }
                                                            options={VALUED_POSSESSIONS.map((vp) => vp.possession)}
                                                            onInputChange={(_, newValue) =>
                                                                updateLifepathField(
                                                                    'motivation.valuedPossession',
                                                                    newValue
                                                                )
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label={t('edgerunners.valuedPossession')}
                                                                    variant="standard"
                                                                    sx={autocompleteSx}
                                                                    slotProps={{
                                                                        input: {
                                                                            sx: {
                                                                                px: 1.5,
                                                                            },
                                                                        },
                                                                    }}
                                                                />
                                                            )}
                                                            slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Grid>

                                            {/* Background */}
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.familyBackground.description}
                                                    options={FAMILY_BACKGROUNDS.map((fb) => fb.background)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('familyBackground.description', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.familyBackground')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.childhoodEnvironment.description}
                                                    options={CHILDHOOD_ENVIRONMENTS.map((ce) => ce.environment)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField(
                                                            'childhoodEnvironment.description',
                                                            newValue
                                                        )
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.childhoodEnvironment')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.familyCrisis.description}
                                                    options={FAMILY_CRISES.map((fc) => fc.crisis)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('familyCrisis.description', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.familyCrisis')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Autocomplete
                                                    freeSolo
                                                    value={editedEdgerunner.lifepath.lifeGoal.description}
                                                    options={LIFE_GOALS.map((lg) => lg.goal)}
                                                    onInputChange={(_, newValue) =>
                                                        updateLifepathField('lifeGoal.description', newValue)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={t('characterCreator.lifepath.lifeGoal')}
                                                            variant="standard"
                                                            sx={autocompleteSx}
                                                            slotProps={{
                                                                input: {
                                                                    sx: {
                                                                        px: 1.5,
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    slotProps={{ paper: { sx: autocompletePaperSx } }}
                                                />
                                            </Grid>

                                            {/* Life Events (read-only) */}
                                            {editedEdgerunner.lifepath.lifeEvents &&
                                                editedEdgerunner.lifepath.lifeEvents.length > 0 && (
                                                    <Grid size={12}>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                color: colors.neons.green.default,
                                                                fontWeight: 'bold',
                                                                mb: 1,
                                                            }}
                                                        >
                                                            Life Events
                                                        </Typography>
                                                        <Stack spacing={0.5}>
                                                            {editedEdgerunner.lifepath.lifeEvents.map((event, i) => (
                                                                <Paper
                                                                    key={i}
                                                                    sx={{
                                                                        p: 1,
                                                                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                                                        border: `1px solid ${getEventTypeColor(event.eventType)}30`,
                                                                    }}
                                                                >
                                                                    <Stack
                                                                        direction="row"
                                                                        alignItems="center"
                                                                        spacing={1}
                                                                    >
                                                                        <Chip
                                                                            label={event.eventType}
                                                                            size="small"
                                                                            sx={{
                                                                                backgroundColor: `${getEventTypeColor(event.eventType)}20`,
                                                                                color: getEventTypeColor(
                                                                                    event.eventType
                                                                                ),
                                                                                fontWeight: 'bold',
                                                                                fontSize: '0.65rem',
                                                                                minWidth: 60,
                                                                            }}
                                                                        />
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ color: colors.grays.gray800 }}
                                                                        >
                                                                            {event.description}
                                                                        </Typography>
                                                                    </Stack>
                                                                    {event.details && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: colors.grays.gray600,
                                                                                ml: 9,
                                                                                display: 'block',
                                                                            }}
                                                                        >
                                                                            {event.details}
                                                                        </Typography>
                                                                    )}
                                                                </Paper>
                                                            ))}
                                                        </Stack>
                                                    </Grid>
                                                )}
                                        </Grid>
                                    )}

                                    {/* === TAB 4: IMPROVEMENT POINTS === */}
                                    {viewTab === 4 && (
                                        <Box>
                                            {/* IP Pool Header */}
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                sx={{
                                                    mb: 2,
                                                    pb: 1.5,
                                                    borderBottom: `1px solid ${colors.neons.green.default}30`,
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        color: colors.neons.green.default,
                                                        fontWeight: 'bold',
                                                        fontFamily: '"Orbitron", sans-serif',
                                                    }}
                                                >
                                                    Improvement Points
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <TextField
                                                        type="tel"
                                                        value={editedEdgerunner.ip}
                                                        onChange={(e) =>
                                                            updateEditedField(
                                                                'ip',
                                                                Math.max(0, parseInt(e.target.value) || 0)
                                                            )
                                                        }
                                                        variant="standard"
                                                        slotProps={{
                                                            htmlInput: {
                                                                min: 0,
                                                                style: {
                                                                    textAlign: 'center',
                                                                    padding: 0,
                                                                    width: 60,
                                                                },
                                                            },
                                                        }}
                                                        sx={{
                                                            '& .MuiInput-input': {
                                                                color: colors.neons.green.default,
                                                                fontWeight: 'bold',
                                                                fontFamily: '"Orbitron", monospace',
                                                                fontSize: '1.1rem',
                                                            },
                                                            '& .MuiInput-underline:before': {
                                                                borderColor: `${colors.neons.green.default}40`,
                                                            },
                                                            '& .MuiInput-underline:after': {
                                                                borderColor: colors.neons.green.default,
                                                            },
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{
                                                            color: colors.neons.green.default,
                                                            fontFamily: '"Orbitron", sans-serif',
                                                        }}
                                                    >
                                                        IP
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            <Grid container spacing={2}>
                                                {/* Left Panel: Available Improvements */}
                                                <Grid size={{ xs: 12, md: 7 }}>
                                                    {/* Role Ability */}
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            mb: 2,
                                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                            border: `1px solid ${ROLE_COLORS[editedEdgerunner.role]}40`,
                                                        }}
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Box>
                                                                <Stack
                                                                    direction="row"
                                                                    alignItems="center"
                                                                    spacing={1}
                                                                    mb={0.5}
                                                                >
                                                                    <Typography
                                                                        variant="subtitle2"
                                                                        sx={{
                                                                            color: ROLE_COLORS[editedEdgerunner.role],
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        {editedEdgerunner.roleAbility || 'Role Ability'}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={`Rank ${getEffectiveRoleRank()}`}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 18,
                                                                            fontSize: '0.65rem',
                                                                            backgroundColor: `${ROLE_COLORS[editedEdgerunner.role]}25`,
                                                                            color: ROLE_COLORS[editedEdgerunner.role],
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    />
                                                                </Stack>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ color: colors.grays.gray500 }}
                                                                >
                                                                    {getEffectiveRoleRank() < 10
                                                                        ? `Next: Rank ${getEffectiveRoleRank() + 1} = ${getRoleIPCost(getEffectiveRoleRank() + 1)} IP`
                                                                        : 'Max Rank'}
                                                                </Typography>
                                                            </Box>
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleStageRoleImprovement}
                                                                disabled={
                                                                    getEffectiveRoleRank() >= 10 ||
                                                                    getRoleIPCost(getEffectiveRoleRank() + 1) >
                                                                        availableIP
                                                                }
                                                                sx={{
                                                                    color: colors.neons.green.default,
                                                                    border: `1px solid ${colors.neons.green.default}60`,
                                                                    '&:hover': {
                                                                        backgroundColor: `${colors.neons.green.default}20`,
                                                                        boxShadow: `0 0 8px ${colors.neons.green.default}40`,
                                                                    },
                                                                    '&.Mui-disabled': {
                                                                        color: colors.grays.gray400,
                                                                        borderColor: colors.grays.gray300,
                                                                    },
                                                                }}
                                                            >
                                                                <Add fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </Paper>

                                                    {/* Toggle show all skills */}
                                                    <Stack
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        sx={{ mb: 1 }}
                                                    >
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                color: colors.neons.cyan.default,
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            Skills
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setShowAllSkillsIP(!showAllSkillsIP)}
                                                            sx={{
                                                                color: colors.grays.gray500,
                                                                fontSize: '0.7rem',
                                                                textTransform: 'none',
                                                            }}
                                                        >
                                                            {showAllSkillsIP ? 'Show trained only' : 'Show all skills'}
                                                        </Button>
                                                    </Stack>

                                                    {/* Skills by Category */}
                                                    {SKILL_CATEGORY_ORDER.map((category) => {
                                                        const categorySkills = ALL_SKILLS.filter(
                                                            (s) => s.category === category
                                                        )
                                                        const catColor = SKILL_CATEGORY_COLORS[category]
                                                        const visibleSkills = showAllSkillsIP
                                                            ? categorySkills
                                                            : categorySkills.filter((s) => {
                                                                  const cs = editedEdgerunner.skills.find(
                                                                      (cs) => cs.skill.name === s.name
                                                                  )
                                                                  const hasStaged = stagedImprovements.some(
                                                                      (si) =>
                                                                          si.type === 'skill' && si.skillName === s.name
                                                                  )
                                                                  return (cs && cs.level > 0) || hasStaged
                                                              })
                                                        if (visibleSkills.length === 0) return null
                                                        return (
                                                            <Accordion
                                                                key={category}
                                                                defaultExpanded={!showAllSkillsIP}
                                                                sx={{
                                                                    backgroundColor: 'transparent',
                                                                    boxShadow: 'none',
                                                                    '&::before': { display: 'none' },
                                                                    border: `1px solid ${catColor}30`,
                                                                    borderRadius: '4px !important',
                                                                    mb: 1,
                                                                }}
                                                            >
                                                                <AccordionSummary
                                                                    expandIcon={<ExpandMore sx={{ color: catColor }} />}
                                                                    sx={{
                                                                        minHeight: 36,
                                                                        '& .MuiAccordionSummary-content': {
                                                                            my: 0.5,
                                                                        },
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="subtitle2"
                                                                        sx={{
                                                                            color: catColor,
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        {category.replace('_', ' ')}
                                                                    </Typography>
                                                                </AccordionSummary>
                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                    {/* Header row */}
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            py: 0.3,
                                                                            px: 1,
                                                                            mb: 0.5,
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: colors.grays.gray500,
                                                                                flex: 1,
                                                                                fontSize: '0.7rem',
                                                                            }}
                                                                        >
                                                                            Skill
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: colors.grays.gray500,
                                                                                width: 30,
                                                                                textAlign: 'center',
                                                                                fontSize: '0.7rem',
                                                                            }}
                                                                        >
                                                                            Lvl
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: colors.grays.gray500,
                                                                                width: 55,
                                                                                textAlign: 'center',
                                                                                fontSize: '0.7rem',
                                                                            }}
                                                                        >
                                                                            Cost
                                                                        </Typography>
                                                                        <Box sx={{ width: 30 }} />
                                                                    </Box>
                                                                    {visibleSkills.map((skillDef) => {
                                                                        const effectiveLevel = getEffectiveSkillLevel(
                                                                            skillDef.name
                                                                        )
                                                                        const nextLevel = effectiveLevel + 1
                                                                        const nextCost =
                                                                            effectiveLevel < 10
                                                                                ? getSkillIPCost(
                                                                                      nextLevel,
                                                                                      !!skillDef.isX2
                                                                                  )
                                                                                : 0
                                                                        return (
                                                                            <Box
                                                                                key={skillDef.name}
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    py: 0.3,
                                                                                    px: 1,
                                                                                    borderBottom: `1px solid ${colors.grays.gray300}`,
                                                                                    gap: 1,
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color:
                                                                                            effectiveLevel > 0
                                                                                                ? colors.grays.gray800
                                                                                                : colors.grays.gray500,
                                                                                        fontSize: '0.8rem',
                                                                                        flex: 1,
                                                                                    }}
                                                                                >
                                                                                    {skillDef.name}
                                                                                    {skillDef.isX2 && (
                                                                                        <Typography
                                                                                            component="span"
                                                                                            sx={{
                                                                                                color: colors.neons
                                                                                                    .yellow.default,
                                                                                                fontSize: '0.65rem',
                                                                                                ml: 0.5,
                                                                                            }}
                                                                                        >
                                                                                            x2
                                                                                        </Typography>
                                                                                    )}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: getSkillLevelColor(
                                                                                            effectiveLevel
                                                                                        ),
                                                                                        fontWeight: 'bold',
                                                                                        fontFamily:
                                                                                            '"Orbitron", monospace',
                                                                                        fontSize: '0.85rem',
                                                                                        width: 30,
                                                                                        textAlign: 'center',
                                                                                    }}
                                                                                >
                                                                                    {effectiveLevel}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        color: colors.neons.yellow
                                                                                            .default,
                                                                                        fontFamily:
                                                                                            '"Orbitron", monospace',
                                                                                        fontSize: '0.7rem',
                                                                                        width: 55,
                                                                                        textAlign: 'center',
                                                                                    }}
                                                                                >
                                                                                    {effectiveLevel < 10
                                                                                        ? `${nextCost} IP`
                                                                                        : 'MAX'}
                                                                                </Typography>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() =>
                                                                                        handleStageSkillImprovement(
                                                                                            skillDef.name,
                                                                                            !!skillDef.isX2
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        effectiveLevel >= 10 ||
                                                                                        nextCost > availableIP
                                                                                    }
                                                                                    sx={{
                                                                                        color: colors.neons.green
                                                                                            .default,
                                                                                        p: 0.3,
                                                                                        '&:hover': {
                                                                                            backgroundColor: `${colors.neons.green.default}20`,
                                                                                        },
                                                                                        '&.Mui-disabled': {
                                                                                            color: colors.grays.gray400,
                                                                                        },
                                                                                    }}
                                                                                >
                                                                                    <Add sx={{ fontSize: 16 }} />
                                                                                </IconButton>
                                                                            </Box>
                                                                        )
                                                                    })}
                                                                </AccordionDetails>
                                                            </Accordion>
                                                        )
                                                    })}
                                                </Grid>

                                                {/* Right Panel: Staged Improvements */}
                                                <Grid size={{ xs: 12, md: 5 }}>
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                            border: `1px solid ${colors.neons.yellow.default}30`,
                                                            position: 'sticky',
                                                            top: 0,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                color: colors.neons.yellow.default,
                                                                fontWeight: 'bold',
                                                                mb: 1,
                                                            }}
                                                        >
                                                            Staged Improvements
                                                        </Typography>

                                                        {stagedImprovements.length === 0 ? (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: colors.grays.gray500,
                                                                    fontStyle: 'italic',
                                                                    textAlign: 'center',
                                                                    py: 3,
                                                                }}
                                                            >
                                                                Stage improvements from the left panel
                                                            </Typography>
                                                        ) : (
                                                            <>
                                                                <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                                                                    {stagedImprovements.map((item, idx) => (
                                                                        <Box
                                                                            key={idx}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                py: 0.5,
                                                                                px: 1,
                                                                                borderRadius: '4px',
                                                                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                                                border: `1px solid ${colors.grays.gray300}`,
                                                                            }}
                                                                        >
                                                                            <Box sx={{ flex: 1 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        color: colors.grays.gray800,
                                                                                        fontSize: '0.8rem',
                                                                                    }}
                                                                                >
                                                                                    {item.type === 'role'
                                                                                        ? editedEdgerunner.roleAbility ||
                                                                                          'Role Ability'
                                                                                        : item.skillName}
                                                                                    {item.isX2 && (
                                                                                        <Typography
                                                                                            component="span"
                                                                                            sx={{
                                                                                                color: colors.neons
                                                                                                    .yellow.default,
                                                                                                fontSize: '0.6rem',
                                                                                                ml: 0.5,
                                                                                            }}
                                                                                        >
                                                                                            x2
                                                                                        </Typography>
                                                                                    )}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        color: colors.grays.gray500,
                                                                                        fontSize: '0.65rem',
                                                                                    }}
                                                                                >
                                                                                    {item.fromLevel} → {item.toLevel}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    color: colors.neons.yellow.default,
                                                                                    fontFamily: '"Orbitron", monospace',
                                                                                    fontSize: '0.75rem',
                                                                                    fontWeight: 'bold',
                                                                                    mx: 1,
                                                                                }}
                                                                            >
                                                                                {item.cost} IP
                                                                            </Typography>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() =>
                                                                                    handleUnstageImprovement(idx)
                                                                                }
                                                                                sx={{
                                                                                    color: colors.neons.red.default,
                                                                                    p: 0.3,
                                                                                    '&:hover': {
                                                                                        backgroundColor: `${colors.neons.red.default}20`,
                                                                                    },
                                                                                }}
                                                                            >
                                                                                <DeleteOutline sx={{ fontSize: 16 }} />
                                                                            </IconButton>
                                                                        </Box>
                                                                    ))}
                                                                </Stack>

                                                                {/* Summary */}
                                                                <Box
                                                                    sx={{
                                                                        borderTop: `1px solid ${colors.neons.yellow.default}40`,
                                                                        pt: 1,
                                                                        mt: 1,
                                                                    }}
                                                                >
                                                                    <Stack
                                                                        direction="row"
                                                                        justifyContent="space-between"
                                                                        sx={{ mb: 0.5 }}
                                                                    >
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color: colors.grays.gray600,
                                                                            }}
                                                                        >
                                                                            Total Cost
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color: colors.neons.yellow.default,
                                                                                fontWeight: 'bold',
                                                                                fontFamily: '"Orbitron", monospace',
                                                                            }}
                                                                        >
                                                                            {totalStagedCost} IP
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Stack
                                                                        direction="row"
                                                                        justifyContent="space-between"
                                                                    >
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color: colors.grays.gray600,
                                                                            }}
                                                                        >
                                                                            Remaining
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color:
                                                                                    availableIP >= 0
                                                                                        ? colors.neons.green.default
                                                                                        : colors.neons.red.default,
                                                                                fontWeight: 'bold',
                                                                                fontFamily: '"Orbitron", monospace',
                                                                            }}
                                                                        >
                                                                            {availableIP} IP
                                                                        </Typography>
                                                                    </Stack>
                                                                </Box>

                                                                {/* Actions */}
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                    justifyContent="flex-end"
                                                                    sx={{ mt: 2 }}
                                                                >
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() => setStagedImprovements([])}
                                                                        sx={{
                                                                            color: colors.neons.red.default,
                                                                            fontSize: '0.75rem',
                                                                            '&:hover': {
                                                                                backgroundColor: `${colors.neons.red.default}15`,
                                                                            },
                                                                        }}
                                                                    >
                                                                        Clear All
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        onClick={handleApplyImprovements}
                                                                        disabled={
                                                                            stagedImprovements.length === 0 ||
                                                                            availableIP < 0
                                                                        }
                                                                        sx={{
                                                                            backgroundColor: colors.neons.green.default,
                                                                            color: colors.grays.gray900,
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.75rem',
                                                                            animation: `${pulseGlowGreen} 2s ease-in-out infinite`,
                                                                            '&:hover': {
                                                                                backgroundColor:
                                                                                    colors.neons.green.light,
                                                                                boxShadow: `0 0 15px ${colors.neons.green.default}60`,
                                                                            },
                                                                            '&.Mui-disabled': {
                                                                                animation: 'none',
                                                                            },
                                                                        }}
                                                                    >
                                                                        {t('edgerunners.applyChanges')}
                                                                    </Button>
                                                                </Stack>
                                                            </>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* === TAB 5: NOTES === */}
                                    {viewTab === 5 && (
                                        <Box>
                                            <TextField
                                                value={editedEdgerunner.notes || ''}
                                                onChange={(e) => updateEditedField('notes', e.target.value)}
                                                placeholder={t('edgerunners.addNotesPlaceholder')}
                                                fullWidth
                                                multiline
                                                minRows={6}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        color: readerMode ? '#333' : colors.grays.gray800,
                                                        '& fieldset': {
                                                            borderColor: readerMode
                                                                ? 'rgba(0,0,0,0.23)'
                                                                : `${colors.neons.cyan.default}30`,
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: readerMode
                                                                ? 'rgba(0,0,0,0.5)'
                                                                : `${colors.neons.cyan.default}60`,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: colors.neons.cyan.default,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {/* === TAB 6: COMBAT === */}
                                    {viewTab === 6 && (
                                        <Box>
                                            {/* Token Color */}
                                            <Typography
                                                variant="subtitle2"
                                                sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                            >
                                                TOKEN COLOR
                                            </Typography>
                                            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                                                {NEON_COLOR_SWATCHES.map((swatch) => (
                                                    <Box
                                                        key={swatch.value}
                                                        onClick={() =>
                                                            setEditedEdgerunner({
                                                                ...editedEdgerunner,
                                                                tokenColor: swatch.value,
                                                            })
                                                        }
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '50%',
                                                            bgcolor: `#${swatch.value.toString(16).padStart(6, '0')}`,
                                                            cursor: 'pointer',
                                                            border:
                                                                (editedEdgerunner.tokenColor ?? 0x00ff8b) ===
                                                                swatch.value
                                                                    ? `3px solid ${colors.grays.gray000}`
                                                                    : '3px solid transparent',
                                                            boxShadow:
                                                                (editedEdgerunner.tokenColor ?? 0x00ff8b) ===
                                                                swatch.value
                                                                    ? `0 0 12px #${swatch.value.toString(16).padStart(6, '0')}`
                                                                    : 'none',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.15)',
                                                                boxShadow: `0 0 10px #${swatch.value.toString(16).padStart(6, '0')}80`,
                                                            },
                                                        }}
                                                    />
                                                ))}
                                            </Stack>

                                            {/* Custom color hex input */}
                                            <TextField
                                                label={t('edgerunners.customHex')}
                                                size="small"
                                                value={`#${(editedEdgerunner.tokenColor ?? 0x00ff8b).toString(16).padStart(6, '0')}`}
                                                onChange={(e) => {
                                                    const hex = e.target.value.replace('#', '')
                                                    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
                                                        setEditedEdgerunner({
                                                            ...editedEdgerunner,
                                                            tokenColor: parseInt(hex, 16),
                                                        })
                                                    }
                                                }}
                                                sx={{
                                                    mb: 3,
                                                    width: 140,
                                                    '& .MuiOutlinedInput-root': {
                                                        color: colors.grays.gray800,
                                                        '& fieldset': { borderColor: `${colors.neons.cyan.default}30` },
                                                        '&:hover fieldset': {
                                                            borderColor: `${colors.neons.cyan.default}60`,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: colors.neons.cyan.default,
                                                        },
                                                    },
                                                    '& .MuiInputLabel-root': { color: colors.grays.gray500 },
                                                }}
                                            />

                                            {/* 2D Image - Select + Preview */}
                                            <Typography
                                                variant="subtitle2"
                                                sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                            >
                                                2D IMAGE
                                            </Typography>
                                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                                <Grid size={8}>
                                                    <CyberpunkFormControl
                                                        readerMode={readerMode}
                                                        label={t('combatSim.selectImage')}
                                                    >
                                                        <Select
                                                            value={editedEdgerunner.tokenImageId ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value as string
                                                                setEditedEdgerunner({
                                                                    ...editedEdgerunner,
                                                                    tokenImageId: val === '' ? undefined : val,
                                                                })
                                                            }}
                                                            label={t('combatSim.selectImage')}
                                                            sx={{
                                                                color: readerMode
                                                                    ? colors.grays.gray900
                                                                    : colors.neons.cyan.default,
                                                                borderColor: readerMode
                                                                    ? undefined
                                                                    : colors.neons.cyan.default,
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return t('combatSim.noImage')
                                                                const img = combatImages.find((i) => i.id === selected)
                                                                return img ? img.name : t('combatSim.noImage')
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>{t('combatSim.noImage')}</em>
                                                            </MenuItem>
                                                            {sortedCombatImages.map((img) => (
                                                                <MenuItem key={img.id} value={img.id}>
                                                                    {img.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </CyberpunkFormControl>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        component="label"
                                                        sx={{
                                                            mt: 1,
                                                            borderColor: colors.neons.cyan.default,
                                                            color: colors.neons.cyan.default,
                                                            '&:hover': {
                                                                bgcolor: 'rgba(0, 30, 60, 0.6)',
                                                                boxShadow: `0 0 8px ${colors.neons.cyan.default}40`,
                                                            },
                                                        }}
                                                    >
                                                        {t('common.uploadImage')}
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]
                                                                if (!file) return
                                                                const img =
                                                                    await new Promise<globalThis.HTMLImageElement>(
                                                                        (resolve) => {
                                                                            const i = new globalThis.Image()
                                                                            i.onload = () => resolve(i)
                                                                            i.src = URL.createObjectURL(file)
                                                                        }
                                                                    )
                                                                const imageId = globalThis.crypto?.randomUUID
                                                                    ? globalThis.crypto.randomUUID()
                                                                    : String(Date.now())
                                                                const newImg = {
                                                                    id: imageId,
                                                                    name: file.name,
                                                                    mimeType: file.type,
                                                                    width: img.width,
                                                                    height: img.height,
                                                                    blob: file,
                                                                }
                                                                await db.images.put(newImg)
                                                                setCombatImages((prev) => [
                                                                    ...prev,
                                                                    newImg as ImageRecord,
                                                                ])
                                                                const url = URL.createObjectURL(file)
                                                                setTokenImageUrls((prev) => ({
                                                                    ...prev,
                                                                    [imageId]: url,
                                                                }))
                                                                setEditedEdgerunner({
                                                                    ...editedEdgerunner,
                                                                    tokenImageId: imageId,
                                                                })
                                                                e.target.value = ''
                                                            }}
                                                        />
                                                    </Button>
                                                </Grid>
                                                <Grid size={4}>
                                                    <CyberpunkFormControl
                                                        readerMode={readerMode}
                                                        label={t('combatSim.tokenImage')}
                                                        labelSx={{
                                                            top: -25,
                                                            lineHeight: '1 !important',
                                                            py: '0 !important',
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: '100%',
                                                                aspectRatio: '1 / 1',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: readerMode
                                                                    ? colors.grays.gray900
                                                                    : 'rgba(0, 0, 0, 0.5)',
                                                                border: `2px solid ${readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'}`,
                                                                borderRadius: '4px',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            {editedEdgerunner.tokenImageId ? (
                                                                <Avatar
                                                                    src={resolveCombatImageUrl(
                                                                        editedEdgerunner.tokenImageId
                                                                    )}
                                                                    variant="rounded"
                                                                    slotProps={{
                                                                        img: {
                                                                            style: {
                                                                                objectFit: 'contain',
                                                                                width: '100%',
                                                                                height: '100%',
                                                                            },
                                                                        },
                                                                    }}
                                                                    sx={{
                                                                        bgcolor: 'transparent',
                                                                        width: '100%',
                                                                        height: '100%',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: readerMode
                                                                            ? colors.grays.gray200
                                                                            : colors.neons.cyan.default,
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        textAlign: 'center',
                                                                        px: 1,
                                                                    }}
                                                                >
                                                                    {t('common.noImageFound')}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </CyberpunkFormControl>
                                                </Grid>
                                            </Grid>

                                            {/* 3D Model - Select + Preview */}
                                            <Typography
                                                variant="subtitle2"
                                                sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                            >
                                                3D MODEL
                                            </Typography>
                                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                                <Grid size={8}>
                                                    <CyberpunkFormControl
                                                        readerMode={readerMode}
                                                        label={t('combatSim.tokenModel') ?? '3D Model'}
                                                    >
                                                        <Select
                                                            value={editedEdgerunner.tokenModelId ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value as string
                                                                setEditedEdgerunner({
                                                                    ...editedEdgerunner,
                                                                    tokenModelId: val === '' ? undefined : val,
                                                                })
                                                            }}
                                                            displayEmpty
                                                            sx={{
                                                                color: readerMode
                                                                    ? colors.grays.gray900
                                                                    : colors.neons.cyan.default,
                                                                borderColor: readerMode
                                                                    ? undefined
                                                                    : colors.neons.cyan.default,
                                                            }}
                                                        >
                                                            {modelOptions.map((opt) => (
                                                                <MenuItem key={opt.value || 'random'} value={opt.value}>
                                                                    {opt.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </CyberpunkFormControl>
                                                </Grid>
                                                <Grid size={4}>
                                                    <CyberpunkFormControl
                                                        readerMode={readerMode}
                                                        label={t('combatSim.tokenModel') ?? '3D Model'}
                                                        labelSx={{
                                                            top: -25,
                                                            lineHeight: '1 !important',
                                                            py: '0 !important',
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: '100%',
                                                                aspectRatio: '1 / 1',
                                                                borderRadius: '4px',
                                                                border: `2px solid ${readerMode ? colors.grays.gray800 : colors.neons.cyan.default + '80'}`,
                                                                bgcolor: readerMode
                                                                    ? colors.grays.gray900
                                                                    : 'rgba(0,0,0,0.6)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            {editedEdgerunner.tokenModelId && modelViewerReady ? (
                                                                <model-viewer
                                                                    src={editedEdgerunner.tokenModelId}
                                                                    style={{ width: '100%', height: '100%' }}
                                                                    camera-controls
                                                                    disable-zoom
                                                                    interaction-prompt="none"
                                                                    autoplay
                                                                    exposure="1"
                                                                    shadow-intensity="0.5"
                                                                    camera-orbit="0deg 65deg auto"
                                                                    auto-rotate
                                                                />
                                                            ) : (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: readerMode
                                                                            ? colors.grays.gray200
                                                                            : colors.neons.cyan.default,
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        fontSize: '14px',
                                                                        textAlign: 'center',
                                                                        px: 1,
                                                                    }}
                                                                >
                                                                    {modelOptions[0]?.label ?? 'Aleatorio'}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </CyberpunkFormControl>
                                                </Grid>
                                            </Grid>

                                            {/* Token Preview */}
                                            <Typography
                                                variant="subtitle2"
                                                sx={{ color: colors.neons.pink.default, fontWeight: 'bold', mb: 1 }}
                                            >
                                                TOKEN PREVIEW
                                            </Typography>
                                            <Stack direction="row" spacing={3} alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: '50%',
                                                        bgcolor: `#${(editedEdgerunner.tokenColor ?? 0x00ff8b).toString(16).padStart(6, '0')}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden',
                                                        boxShadow: `0 0 16px #${(editedEdgerunner.tokenColor ?? 0x00ff8b).toString(16).padStart(6, '0')}80`,
                                                        border: `2px solid #${(editedEdgerunner.tokenColor ?? 0x00ff8b).toString(16).padStart(6, '0')}`,
                                                    }}
                                                >
                                                    {editedEdgerunner.tokenImageId ? (
                                                        <img
                                                            src={
                                                                resolveCombatImageUrl(editedEdgerunner.tokenImageId) ||
                                                                ''
                                                            }
                                                            alt="Preview"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography
                                                            sx={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}
                                                        >
                                                            {(editedEdgerunner.handle || editedEdgerunner.name)
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Typography
                                                        sx={{ color: colors.grays.gray800, fontWeight: 'bold' }}
                                                    >
                                                        {editedEdgerunner.handle || editedEdgerunner.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: colors.grays.gray500 }}>
                                                        HP: {editedEdgerunner.derivedStats.HP} | MOV:{' '}
                                                        {editedEdgerunner.stats.MOVE} | Init:{' '}
                                                        {editedEdgerunner.stats.REF}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    )}
                                </Box>
                            </CustomScrollbar>
                        </DialogContent>

                        <DialogActions sx={{ borderTop: `1px solid ${colors.neons.cyan.default}40`, p: 2 }}>
                            <Button
                                startIcon={<Download />}
                                onClick={() => handleExportCharacter(editedEdgerunner)}
                                sx={
                                    readerMode
                                        ? { color: '#2e7d32' }
                                        : {
                                              color: colors.neons.green.default,
                                              '&:hover': {
                                                  bgcolor: 'rgba(0, 30, 0, 0.6)',
                                                  boxShadow: `0 0 10px ${colors.neons.green.default}40`,
                                              },
                                          }
                                }
                            >
                                Export JSON
                            </Button>
                            <Box sx={{ flexGrow: 1 }} />
                            <Button
                                onClick={handleDetailClose}
                                sx={
                                    readerMode
                                        ? { color: '#666' }
                                        : {
                                              color: colors.neons.cyan.default,
                                              '&:hover': {
                                                  bgcolor: 'rgba(0, 30, 60, 0.8)',
                                                  boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                              },
                                          }
                                }
                            >
                                {t('common.close')}
                            </Button>
                            <Button
                                onClick={handleDetailSave}
                                variant="contained"
                                sx={
                                    readerMode
                                        ? {
                                              backgroundColor: '#0097a7',
                                              color: '#fff',
                                              '&:hover': { backgroundColor: '#00acc1' },
                                          }
                                        : {
                                              backgroundColor: colors.neons.cyan.default,
                                              color: colors.neons.orange.default,
                                              fontWeight: 'bold',
                                              '&:hover': {
                                                  backgroundColor: colors.neons.cyan.light,
                                                  color: colors.neons.orange.dark,
                                                  boxShadow: `0 0 15px ${colors.neons.cyan.default}60`,
                                              },
                                          }
                                }
                            >
                                {t('common.save')}
                            </Button>
                        </DialogActions>
                    </>
                )}
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
