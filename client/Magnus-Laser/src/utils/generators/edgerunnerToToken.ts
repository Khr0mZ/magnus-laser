import { v4 as uuidv4 } from 'uuid'
import type { Character, CharacterStats } from '../../types/characterCreator'
import type { Token, StatsActions } from '../../views/CombatSim/utils/types'
import type { Dices } from '../../graphql/types'

const WEAPON_SKILL_MAP: Record<string, string> = {
    'Melee': 'Melee Weapon',
    'Exotic Melee': 'Melee Weapon',
    'Exotic VH Melee': 'Melee Weapon',
    'Pistol': 'Handgun',
    'Exotic Pistol': 'Handgun',
    'Exotic VH Pistol': 'Handgun',
    'SMG': 'Shoulder Arms',
    'Shotgun': 'Shoulder Arms',
    'Exotic Shotgun': 'Shoulder Arms',
    'Rifle': 'Shoulder Arms',
    'Exotic Rifle': 'Shoulder Arms',
    'Bow': 'Archery',
    'Heavy': 'Heavy Weapons',
    'Exotic Grenade Launcher': 'Heavy Weapons',
}

const SKILL_STAT_MAP: Record<string, keyof CharacterStats> = {
    'Melee Weapon': 'DEX',
    'Brawling': 'DEX',
    'Martial Arts': 'DEX',
    'Handgun': 'REF',
    'Shoulder Arms': 'REF',
    'Autofire': 'REF',
    'Archery': 'REF',
    'Heavy Weapons': 'REF',
}

export function inferWeaponSkill(weaponType: string): string {
    return WEAPON_SKILL_MAP[weaponType] || 'Melee Weapon'
}

export function inferArmorLocation(armorName: string): 'Body' | 'Head' | 'Shield' {
    if (armorName.includes('(Head)')) return 'Head'
    if (armorName.includes('Shield')) return 'Shield'
    return 'Body'
}

export function mapWeaponTypeToActionType(weaponType: string): 'melee' | 'ranged' | 'grenade' {
    const type = weaponType.toLowerCase()
    if (type.includes('melee')) return 'melee'
    if (type === 'heavy' || type.includes('grenade')) return 'grenade'
    return 'ranged'
}

export function parseDamageString(damage: string): Dices | undefined {
    if (!damage) return undefined
    // Match patterns like "3d6", "2d10", "1d6+1" (ignoring flat bonus)
    const match = damage.match(/(\d+)d(\d+)/)
    if (!match) return undefined
    const count = parseInt(match[1], 10)
    const sides = parseInt(match[2], 10)
    const key = `d${sides}` as keyof Dices
    if (!['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].includes(key)) return undefined
    return { [key]: count } as Dices
}

export function characterToToken(
    character: Character,
    mapId: string,
    x: number,
    y: number,
): Token {
    // Resolve armor: pick highest SP for each location
    const bodyArmors = character.armor.filter((a) => (a.location || inferArmorLocation(a.name)) !== 'Head')
    const headArmors = character.armor.filter((a) => (a.location || inferArmorLocation(a.name)) === 'Head')
    const spb = bodyArmors.length > 0 ? Math.max(...bodyArmors.map((a) => a.sp)) : 0
    const sph = headArmors.length > 0 ? Math.max(...headArmors.map((a) => a.sp)) : 0

    // Build actions from weapons with isTokenAction
    const weaponActions: StatsActions[] = character.weapons
        .filter((w) => w.isTokenAction)
        .map((weapon) => {
            const skillName = weapon.skill || inferWeaponSkill(weapon.type)
            const stat = SKILL_STAT_MAP[skillName] || 'REF'
            const charSkill = character.skills.find((s) => s.skill.name === skillName)
            const skillLevel = charSkill?.level || 0
            const value = character.stats[stat] + skillLevel

            return {
                id: uuidv4(),
                name: weapon.name,
                type: mapWeaponTypeToActionType(weapon.type),
                value,
                damage: parseDamageString(weapon.damage),
            }
        })

    // Build actions from skills with isTokenAction
    const skillActions: StatsActions[] = character.skills
        .filter((s) => s.isTokenAction && s.level > 0)
        .map((charSkill) => {
            const stat = charSkill.skill.stat
            const value = character.stats[stat] + charSkill.level

            return {
                id: uuidv4(),
                name: charSkill.skill.name,
                type: 'skill' as const,
                value,
            }
        })

    // Check for Pain Editor cyberware
    const hasPainEditor = character.cyberware.some((c) => c.name === 'Pain Editor')

    const hp = character.derivedStats.HP

    return {
        id: uuidv4(),
        name: character.handle || character.name,
        mapId,
        x,
        y,
        color: character.tokenColor ?? 0x00ff8b,
        imageId: character.tokenImageId,
        modelId: character.tokenModelId,
        stats: {
            isPC: true,
            initiative: character.stats.REF,
            health: hp,
            currentHealth: hp,
            movement: character.stats.MOVE,
            currentMovement: character.stats.MOVE,
            armor: {
                spb,
                currentSpb: spb,
                sph,
                currentSph: sph,
            },
            ignoreSeriouslyWoundedPenalty: hasPainEditor,
            actions: [...weaponActions, ...skillActions],
            luck: character.stats.LUCK,
            currentLuck: character.stats.LUCK,
        },
    }
}
