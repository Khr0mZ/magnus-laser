export type RollType = 'initiative' | 'melee-hit' | 'melee-damage' | 'ranged-hit' | 'ranged-damage' | 'skill'

export interface RollResult {
    total: number
    rolls: number[]
    fumble: boolean
    critical: boolean
    criticalDamage?: boolean
    breakdown: string
}

// Roll 1d10 with fumble/critical logic
export const rollD10WithSpecial = (): { value: number; fumble: boolean; critical: boolean; rolls: number[] } => {
    const roll = Math.floor(Math.random() * 10) + 1

    if (roll === 1) {
        // Fumble: subtract another d10
        const fumbleRoll = Math.floor(Math.random() * 10) + 1
        return { value: roll - fumbleRoll, fumble: true, critical: false, rolls: [roll, -fumbleRoll] }
    } else if (roll === 10) {
        // Critical: add another d10
        const critRoll = Math.floor(Math.random() * 10) + 1
        return { value: roll + critRoll, fumble: false, critical: true, rolls: [roll, critRoll] }
    }

    return { value: roll, fumble: false, critical: false, rolls: [roll] }
}

// Roll multiple d6 for damage with critical detection
export const rollDamage = (diceCount: number): RollResult => {
    const rolls: number[] = []
    for (let i = 0; i < diceCount; i++) {
        rolls.push(Math.floor(Math.random() * 6) + 1)
    }

    const sixes = rolls.filter((r) => r === 6).length
    const criticalDamage = sixes >= 2
    const baseTotal = rolls.reduce((sum, r) => sum + r, 0)
    const total = baseTotal + (criticalDamage ? 5 : 0)

    return {
        total,
        rolls,
        fumble: false,
        critical: false,
        criticalDamage,
        breakdown: `${rolls.length}D6 [${rolls.join(', ')}]`,
    }
}

// Roll to-hit (1d10 + modifier)
export const rollToHit = (modifier: number): RollResult => {
    const { value, fumble, critical, rolls } = rollD10WithSpecial()
    const total = value + modifier

    return {
        total,
        rolls,
        fumble,
        critical,
        breakdown: `${rolls.length}D10 [${rolls.join(', ')}] + ${modifier}`,
    }
}
