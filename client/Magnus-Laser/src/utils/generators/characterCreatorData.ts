// ============================================
// CHARACTER CREATOR DATA
// Stats, Skills, and Lifepath tables from the Corebook
// ============================================

import type {
    CharacterStats,
    Role,
    RoleStatTemplates,
    Skill,
} from '../../types/characterCreator'

// === ROLES ===
export const ROLES: { value: Role; label: string; description: string }[] = [
    { value: 'ROCKERBOY', label: 'Rockerboy', description: 'Charismatic rockers who use performance, art, and rhetoric to fight authority.' },
    { value: 'SOLO', label: 'Solo', description: 'Corporate assassins, bodyguards, killers, and soldiers. They live and die by combat.' },
    { value: 'NETRUNNER', label: 'Netrunner', description: 'Cybernetic hackers who jack into the NET to steal data, crash systems, and fight Black ICE.' },
    { value: 'TECH', label: 'Tech', description: 'Ripperdocs, mechanics, and engineers who build and repair everything from cyberware to vehicles.' },
    { value: 'MEDTECH', label: 'Medtech', description: 'Trauma surgeons and street docs who patch up Edgerunners and save lives.' },
    { value: 'MEDIA', label: 'Media', description: 'Reporters, journalists, and influencers who dig up the truth and broadcast it to the masses.' },
    { value: 'LAWMAN', label: 'Lawman', description: 'Police, security, and corporate enforcers who maintain order—by any means necessary.' },
    { value: 'EXEC', label: 'Exec', description: 'Corporate executives and managers who wield power, money, and influence as weapons.' },
    { value: 'FIXER', label: 'Fixer', description: 'Dealmakers, info brokers, and black market entrepreneurs who make things happen on the Street.' },
    { value: 'NOMAD', label: 'Nomad', description: 'Road warriors and clan members who roam the highways in armored convoys.' },
]

// === STAT TEMPLATES (for Streetrat method) ===
// Each role has 10 pre-generated stat arrays (roll 1d10)

export const STAT_TEMPLATES: RoleStatTemplates[] = [
    {
        role: 'ROCKERBOY',
        templates: [
            { roll: 1, stats: { INT: 7, REF: 6, DEX: 6, TECH: 5, COOL: 6, WILL: 8, LUCK: 7, MOVE: 7, BODY: 3, EMP: 8 } },
            { roll: 2, stats: { INT: 3, REF: 7, DEX: 7, TECH: 7, COOL: 7, WILL: 6, LUCK: 7, MOVE: 7, BODY: 5, EMP: 8 } },
            { roll: 3, stats: { INT: 4, REF: 5, DEX: 7, TECH: 7, COOL: 6, WILL: 6, LUCK: 7, MOVE: 7, BODY: 5, EMP: 8 } },
            { roll: 4, stats: { INT: 4, REF: 5, DEX: 7, TECH: 7, COOL: 6, WILL: 8, LUCK: 7, MOVE: 6, BODY: 3, EMP: 8 } },
            { roll: 5, stats: { INT: 3, REF: 7, DEX: 7, TECH: 7, COOL: 6, WILL: 8, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 6, stats: { INT: 5, REF: 6, DEX: 7, TECH: 5, COOL: 7, WILL: 8, LUCK: 5, MOVE: 7, BODY: 3, EMP: 7 } },
            { roll: 7, stats: { INT: 5, REF: 6, DEX: 6, TECH: 7, COOL: 7, WILL: 8, LUCK: 7, MOVE: 6, BODY: 3, EMP: 6 } },
            { roll: 8, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 4, EMP: 8 } },
            { roll: 9, stats: { INT: 3, REF: 5, DEX: 5, TECH: 6, COOL: 7, WILL: 8, LUCK: 7, MOVE: 5, BODY: 5, EMP: 7 } },
            { roll: 10, stats: { INT: 4, REF: 5, DEX: 6, TECH: 5, COOL: 8, WILL: 8, LUCK: 7, MOVE: 6, BODY: 4, EMP: 7 } },
        ],
    },
    {
        role: 'SOLO',
        templates: [
            { roll: 1, stats: { INT: 6, REF: 7, DEX: 7, TECH: 3, COOL: 8, WILL: 6, LUCK: 5, MOVE: 5, BODY: 6, EMP: 5 } },
            { roll: 2, stats: { INT: 7, REF: 8, DEX: 6, TECH: 3, COOL: 6, WILL: 6, LUCK: 7, MOVE: 5, BODY: 6, EMP: 6 } },
            { roll: 3, stats: { INT: 5, REF: 8, DEX: 7, TECH: 4, COOL: 7, WILL: 7, LUCK: 6, MOVE: 7, BODY: 8, EMP: 5 } },
            { roll: 4, stats: { INT: 5, REF: 8, DEX: 6, TECH: 4, COOL: 6, WILL: 7, LUCK: 6, MOVE: 5, BODY: 7, EMP: 6 } },
            { roll: 5, stats: { INT: 6, REF: 6, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 7, MOVE: 6, BODY: 8, EMP: 4 } },
            { roll: 6, stats: { INT: 7, REF: 7, DEX: 6, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 7, BODY: 7, EMP: 5 } },
            { roll: 7, stats: { INT: 7, REF: 7, DEX: 6, TECH: 5, COOL: 6, WILL: 7, LUCK: 7, MOVE: 6, BODY: 6, EMP: 6 } },
            { roll: 8, stats: { INT: 7, REF: 8, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 5, MOVE: 6, BODY: 8, EMP: 4 } },
            { roll: 9, stats: { INT: 7, REF: 7, DEX: 6, TECH: 4, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 6, EMP: 5 } },
            { roll: 10, stats: { INT: 6, REF: 6, DEX: 8, TECH: 5, COOL: 6, WILL: 6, LUCK: 5, MOVE: 6, BODY: 6, EMP: 5 } },
        ],
    },
    {
        role: 'NETRUNNER',
        templates: [
            { roll: 1, stats: { INT: 5, REF: 8, DEX: 7, TECH: 7, COOL: 7, WILL: 4, LUCK: 8, MOVE: 7, BODY: 7, EMP: 4 } },
            { roll: 2, stats: { INT: 5, REF: 6, DEX: 7, TECH: 5, COOL: 8, WILL: 3, LUCK: 8, MOVE: 7, BODY: 5, EMP: 5 } },
            { roll: 3, stats: { INT: 5, REF: 6, DEX: 8, TECH: 6, COOL: 6, WILL: 4, LUCK: 7, MOVE: 6, BODY: 7, EMP: 4 } },
            { roll: 4, stats: { INT: 5, REF: 7, DEX: 7, TECH: 7, COOL: 7, WILL: 5, LUCK: 8, MOVE: 6, BODY: 5, EMP: 5 } },
            { roll: 5, stats: { INT: 5, REF: 8, DEX: 8, TECH: 5, COOL: 7, WILL: 3, LUCK: 7, MOVE: 5, BODY: 5, EMP: 6 } },
            { roll: 6, stats: { INT: 6, REF: 6, DEX: 6, TECH: 7, COOL: 8, WILL: 4, LUCK: 7, MOVE: 7, BODY: 6, EMP: 6 } },
            { roll: 7, stats: { INT: 6, REF: 6, DEX: 6, TECH: 7, COOL: 6, WILL: 5, LUCK: 7, MOVE: 7, BODY: 7, EMP: 6 } },
            { roll: 8, stats: { INT: 5, REF: 7, DEX: 8, TECH: 6, COOL: 8, WILL: 4, LUCK: 8, MOVE: 5, BODY: 7, EMP: 4 } },
            { roll: 9, stats: { INT: 7, REF: 6, DEX: 7, TECH: 7, COOL: 6, WILL: 3, LUCK: 6, MOVE: 5, BODY: 6, EMP: 5 } },
            { roll: 10, stats: { INT: 7, REF: 8, DEX: 6, TECH: 6, COOL: 6, WILL: 4, LUCK: 7, MOVE: 7, BODY: 5, EMP: 6 } },
        ],
    },
    {
        role: 'TECH',
        templates: [
            { roll: 1, stats: { INT: 6, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 4, LUCK: 7, MOVE: 5, BODY: 4, EMP: 6 } },
            { roll: 2, stats: { INT: 6, REF: 6, DEX: 7, TECH: 7, COOL: 5, WILL: 5, LUCK: 7, MOVE: 6, BODY: 5, EMP: 6 } },
            { roll: 3, stats: { INT: 5, REF: 7, DEX: 7, TECH: 7, COOL: 6, WILL: 4, LUCK: 7, MOVE: 5, BODY: 6, EMP: 5 } },
            { roll: 4, stats: { INT: 6, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 4, LUCK: 6, MOVE: 6, BODY: 5, EMP: 6 } },
            { roll: 5, stats: { INT: 6, REF: 6, DEX: 7, TECH: 8, COOL: 5, WILL: 4, LUCK: 6, MOVE: 5, BODY: 5, EMP: 6 } },
            { roll: 6, stats: { INT: 6, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 5, LUCK: 7, MOVE: 5, BODY: 4, EMP: 6 } },
            { roll: 7, stats: { INT: 7, REF: 6, DEX: 6, TECH: 7, COOL: 5, WILL: 4, LUCK: 7, MOVE: 6, BODY: 5, EMP: 6 } },
            { roll: 8, stats: { INT: 5, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 4, LUCK: 8, MOVE: 6, BODY: 4, EMP: 6 } },
            { roll: 9, stats: { INT: 7, REF: 6, DEX: 6, TECH: 7, COOL: 5, WILL: 4, LUCK: 6, MOVE: 5, BODY: 5, EMP: 5 } },
            { roll: 10, stats: { INT: 6, REF: 7, DEX: 6, TECH: 8, COOL: 5, WILL: 4, LUCK: 6, MOVE: 5, BODY: 4, EMP: 6 } },
        ],
    },
    {
        role: 'MEDTECH',
        templates: [
            { roll: 1, stats: { INT: 6, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 4, LUCK: 7, MOVE: 5, BODY: 4, EMP: 6 } },
            { roll: 2, stats: { INT: 6, REF: 6, DEX: 7, TECH: 7, COOL: 5, WILL: 5, LUCK: 7, MOVE: 6, BODY: 5, EMP: 6 } },
            { roll: 3, stats: { INT: 5, REF: 7, DEX: 7, TECH: 7, COOL: 6, WILL: 4, LUCK: 7, MOVE: 5, BODY: 6, EMP: 5 } },
            { roll: 4, stats: { INT: 6, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 4, LUCK: 6, MOVE: 6, BODY: 5, EMP: 6 } },
            { roll: 5, stats: { INT: 6, REF: 6, DEX: 7, TECH: 8, COOL: 5, WILL: 4, LUCK: 6, MOVE: 5, BODY: 5, EMP: 6 } },
            { roll: 6, stats: { INT: 6, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 5, LUCK: 7, MOVE: 5, BODY: 4, EMP: 6 } },
            { roll: 7, stats: { INT: 7, REF: 6, DEX: 6, TECH: 7, COOL: 5, WILL: 4, LUCK: 7, MOVE: 6, BODY: 5, EMP: 6 } },
            { roll: 8, stats: { INT: 5, REF: 7, DEX: 7, TECH: 7, COOL: 5, WILL: 4, LUCK: 8, MOVE: 6, BODY: 4, EMP: 6 } },
            { roll: 9, stats: { INT: 7, REF: 6, DEX: 6, TECH: 7, COOL: 5, WILL: 4, LUCK: 6, MOVE: 5, BODY: 5, EMP: 5 } },
            { roll: 10, stats: { INT: 6, REF: 7, DEX: 6, TECH: 8, COOL: 5, WILL: 4, LUCK: 6, MOVE: 5, BODY: 4, EMP: 6 } },
        ],
    },
    {
        role: 'MEDIA',
        templates: [
            { roll: 1, stats: { INT: 7, REF: 5, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 2, stats: { INT: 7, REF: 5, DEX: 6, TECH: 4, COOL: 7, WILL: 6, LUCK: 6, MOVE: 6, BODY: 4, EMP: 7 } },
            { roll: 3, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 4, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 7, WILL: 5, LUCK: 7, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 5, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 8 } },
            { roll: 6, stats: { INT: 8, REF: 5, DEX: 5, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 3, EMP: 7 } },
            { roll: 7, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 5, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 8, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 7, WILL: 6, LUCK: 7, MOVE: 5, BODY: 3, EMP: 7 } },
            { roll: 9, stats: { INT: 8, REF: 6, DEX: 5, TECH: 4, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 4, EMP: 7 } },
            { roll: 10, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 8, WILL: 6, LUCK: 6, MOVE: 5, BODY: 3, EMP: 7 } },
        ],
    },
    {
        role: 'LAWMAN',
        templates: [
            { roll: 1, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 5, BODY: 7, EMP: 5 } },
            { roll: 2, stats: { INT: 6, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 5, MOVE: 5, BODY: 7, EMP: 5 } },
            { roll: 3, stats: { INT: 5, REF: 7, DEX: 7, TECH: 4, COOL: 7, WILL: 7, LUCK: 5, MOVE: 6, BODY: 7, EMP: 5 } },
            { roll: 4, stats: { INT: 5, REF: 8, DEX: 6, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 6, EMP: 6 } },
            { roll: 5, stats: { INT: 6, REF: 6, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 6, BODY: 7, EMP: 5 } },
            { roll: 6, stats: { INT: 6, REF: 7, DEX: 6, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 6, BODY: 6, EMP: 6 } },
            { roll: 7, stats: { INT: 6, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 6, EMP: 6 } },
            { roll: 8, stats: { INT: 6, REF: 8, DEX: 6, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 7, EMP: 5 } },
            { roll: 9, stats: { INT: 6, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 5, MOVE: 5, BODY: 7, EMP: 5 } },
            { roll: 10, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 6, BODY: 6, EMP: 6 } },
        ],
    },
    {
        role: 'EXEC',
        templates: [
            { roll: 1, stats: { INT: 7, REF: 5, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 7, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 2, stats: { INT: 7, REF: 6, DEX: 5, TECH: 4, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 5, EMP: 7 } },
            { roll: 3, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 4, stats: { INT: 7, REF: 5, DEX: 5, TECH: 5, COOL: 8, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 5, stats: { INT: 8, REF: 5, DEX: 5, TECH: 4, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 6, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 7, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 7, WILL: 6, LUCK: 7, MOVE: 5, BODY: 3, EMP: 7 } },
            { roll: 8, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 9, stats: { INT: 8, REF: 5, DEX: 5, TECH: 4, COOL: 7, WILL: 6, LUCK: 6, MOVE: 6, BODY: 4, EMP: 7 } },
            { roll: 10, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 8, WILL: 5, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
        ],
    },
    {
        role: 'FIXER',
        templates: [
            { roll: 1, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 2, stats: { INT: 7, REF: 6, DEX: 5, TECH: 4, COOL: 7, WILL: 6, LUCK: 7, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 3, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 7, WILL: 5, LUCK: 7, MOVE: 6, BODY: 4, EMP: 7 } },
            { roll: 4, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 5, stats: { INT: 8, REF: 5, DEX: 5, TECH: 4, COOL: 7, WILL: 6, LUCK: 6, MOVE: 6, BODY: 4, EMP: 7 } },
            { roll: 6, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 7, stats: { INT: 7, REF: 5, DEX: 6, TECH: 5, COOL: 8, WILL: 5, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 8, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 7, WILL: 6, LUCK: 7, MOVE: 5, BODY: 3, EMP: 7 } },
            { roll: 9, stats: { INT: 8, REF: 5, DEX: 6, TECH: 4, COOL: 7, WILL: 5, LUCK: 6, MOVE: 5, BODY: 4, EMP: 7 } },
            { roll: 10, stats: { INT: 7, REF: 6, DEX: 5, TECH: 5, COOL: 8, WILL: 6, LUCK: 6, MOVE: 5, BODY: 3, EMP: 7 } },
        ],
    },
    {
        role: 'NOMAD',
        templates: [
            { roll: 1, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 5, MOVE: 6, BODY: 7, EMP: 5 } },
            { roll: 2, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 7, EMP: 5 } },
            { roll: 3, stats: { INT: 6, REF: 7, DEX: 6, TECH: 5, COOL: 6, WILL: 7, LUCK: 5, MOVE: 6, BODY: 7, EMP: 5 } },
            { roll: 4, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 6, BODY: 6, EMP: 6 } },
            { roll: 5, stats: { INT: 6, REF: 7, DEX: 6, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 7, EMP: 5 } },
            { roll: 6, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 6, BODY: 6, EMP: 6 } },
            { roll: 7, stats: { INT: 6, REF: 6, DEX: 7, TECH: 6, COOL: 6, WILL: 6, LUCK: 6, MOVE: 5, BODY: 6, EMP: 6 } },
            { roll: 8, stats: { INT: 5, REF: 7, DEX: 7, TECH: 5, COOL: 7, WILL: 6, LUCK: 5, MOVE: 6, BODY: 7, EMP: 5 } },
            { roll: 9, stats: { INT: 6, REF: 7, DEX: 6, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 6, EMP: 6 } },
            { roll: 10, stats: { INT: 5, REF: 7, DEX: 7, TECH: 6, COOL: 6, WILL: 6, LUCK: 5, MOVE: 5, BODY: 7, EMP: 6 } },
        ],
    },
]

// === ALL SKILLS ===
export const ALL_SKILLS: Skill[] = [
    // Awareness Skills (INT/WILL based)
    { name: 'Concentration', stat: 'WILL', category: 'AWARENESS' },
    { name: 'Conceal/Reveal Object', stat: 'INT', category: 'AWARENESS' },
    { name: 'Lip Reading', stat: 'INT', category: 'AWARENESS' },
    { name: 'Perception', stat: 'INT', category: 'AWARENESS' },
    { name: 'Tracking', stat: 'INT', category: 'AWARENESS' },

    // Body Skills
    { name: 'Athletics', stat: 'DEX', category: 'BODY' },
    { name: 'Contortionist', stat: 'DEX', category: 'BODY' },
    { name: 'Dance', stat: 'DEX', category: 'BODY' },
    { name: 'Endurance', stat: 'WILL', category: 'BODY' },
    { name: 'Resist Torture/Drugs', stat: 'WILL', category: 'BODY' },
    { name: 'Stealth', stat: 'DEX', category: 'BODY' },

    // Control Skills
    { name: 'Drive Land Vehicle', stat: 'REF', category: 'CONTROL' },
    { name: 'Pilot Air Vehicle', stat: 'REF', category: 'CONTROL', isX2: true },
    { name: 'Pilot Sea Vehicle', stat: 'REF', category: 'CONTROL' },
    { name: 'Riding', stat: 'REF', category: 'CONTROL' },

    // Education Skills
    { name: 'Accounting', stat: 'INT', category: 'EDUCATION' },
    { name: 'Animal Handling', stat: 'INT', category: 'EDUCATION' },
    { name: 'Bureaucracy', stat: 'INT', category: 'EDUCATION' },
    { name: 'Business', stat: 'INT', category: 'EDUCATION' },
    { name: 'Composition', stat: 'INT', category: 'EDUCATION' },
    { name: 'Criminology', stat: 'INT', category: 'EDUCATION' },
    { name: 'Cryptography', stat: 'INT', category: 'EDUCATION' },
    { name: 'Deduction', stat: 'INT', category: 'EDUCATION' },
    { name: 'Education', stat: 'INT', category: 'EDUCATION' },
    { name: 'Gamble', stat: 'INT', category: 'EDUCATION' },
    { name: 'Language', stat: 'INT', category: 'EDUCATION', requiresSpecialization: true },
    { name: 'Library Search', stat: 'INT', category: 'EDUCATION' },
    { name: 'Local Expert', stat: 'INT', category: 'EDUCATION', requiresSpecialization: true },
    { name: 'Science', stat: 'INT', category: 'EDUCATION', requiresSpecialization: true },
    { name: 'Tactics', stat: 'INT', category: 'EDUCATION' },
    { name: 'Wilderness Survival', stat: 'INT', category: 'EDUCATION' },

    // Fighting Skills
    { name: 'Brawling', stat: 'DEX', category: 'FIGHTING' },
    { name: 'Evasion', stat: 'DEX', category: 'FIGHTING' },
    { name: 'Martial Arts', stat: 'DEX', category: 'FIGHTING', isX2: true, requiresSpecialization: true },
    { name: 'Melee Weapon', stat: 'DEX', category: 'FIGHTING' },

    // Performance Skills
    { name: 'Acting', stat: 'COOL', category: 'PERFORMANCE' },
    { name: 'Play Instrument', stat: 'DEX', category: 'PERFORMANCE', requiresSpecialization: true },

    // Ranged Weapon Skills
    { name: 'Archery', stat: 'REF', category: 'RANGED_WEAPON' },
    { name: 'Autofire', stat: 'REF', category: 'RANGED_WEAPON', isX2: true },
    { name: 'Handgun', stat: 'REF', category: 'RANGED_WEAPON' },
    { name: 'Heavy Weapons', stat: 'REF', category: 'RANGED_WEAPON', isX2: true },
    { name: 'Shoulder Arms', stat: 'REF', category: 'RANGED_WEAPON' },

    // Social Skills
    { name: 'Bribery', stat: 'COOL', category: 'SOCIAL' },
    { name: 'Conversation', stat: 'EMP', category: 'SOCIAL' },
    { name: 'Human Perception', stat: 'EMP', category: 'SOCIAL' },
    { name: 'Interrogation', stat: 'COOL', category: 'SOCIAL' },
    { name: 'Persuasion', stat: 'COOL', category: 'SOCIAL' },
    { name: 'Personal Grooming', stat: 'COOL', category: 'SOCIAL' },
    { name: 'Streetwise', stat: 'COOL', category: 'SOCIAL' },
    { name: 'Trading', stat: 'COOL', category: 'SOCIAL' },
    { name: 'Wardrobe & Style', stat: 'COOL', category: 'SOCIAL' },

    // Technique Skills
    { name: 'Air Vehicle Tech', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Basic Tech', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Cybertech', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Demolitions', stat: 'TECH', category: 'TECHNIQUE', isX2: true },
    { name: 'Electronics/Security Tech', stat: 'TECH', category: 'TECHNIQUE', isX2: true },
    { name: 'First Aid', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Forgery', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Land Vehicle Tech', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Paint/Draw/Sculpt', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Paramedic', stat: 'TECH', category: 'TECHNIQUE', isX2: true },
    { name: 'Photography/Film', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Pick Lock', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Pick Pocket', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Sea Vehicle Tech', stat: 'TECH', category: 'TECHNIQUE' },
    { name: 'Weaponstech', stat: 'TECH', category: 'TECHNIQUE' },
]

// Basic Skills that all characters must have at level 2+
export const BASIC_SKILLS = [
    'Athletics',
    'Brawling',
    'Concentration',
    'Conversation',
    'Education',
    'Evasion',
    'First Aid',
    'Human Perception',
    'Language',
    'Local Expert',
    'Perception',
    'Persuasion',
    'Stealth',
]

// === STREETRAT SKILL TEMPLATES ===
// Pre-determined skill levels for Streetrat method (from Corebook pg. 86-87)
export interface StreetratSkillEntry {
    name: string
    level: number
    isX2?: boolean
}

export const STREETRAT_SKILL_TEMPLATES: Record<Role, StreetratSkillEntry[]> = {
    ROCKERBOY: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 6 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 2 }, { name: 'Education', level: 2 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 6 }, { name: 'Human Perception', level: 6 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 4 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 6 },
        { name: 'Stealth', level: 2 }, { name: 'Composition', level: 6 }, { name: 'Handgun', level: 6 },
        { name: 'Melee Weapon', level: 6 }, { name: 'Personal Grooming', level: 4 }, { name: 'Play Instrument', level: 6 },
        { name: 'Streetwise', level: 6 }, { name: 'Wardrobe & Style', level: 4 },
    ],
    SOLO: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 2 }, { name: 'Education', level: 2 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 6 }, { name: 'Human Perception', level: 2 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 6 }, { name: 'Persuasion', level: 2 },
        { name: 'Stealth', level: 2 }, { name: 'Autofire', level: 6, isX2: true }, { name: 'Handgun', level: 6 },
        { name: 'Interrogation', level: 6 }, { name: 'Melee Weapon', level: 6 }, { name: 'Resist Torture/Drugs', level: 6 },
        { name: 'Shoulder Arms', level: 6 }, { name: 'Tactics', level: 6 },
    ],
    NETRUNNER: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 2 }, { name: 'Education', level: 6 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 2 }, { name: 'Human Perception', level: 2 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 2 },
        { name: 'Stealth', level: 6 }, { name: 'Basic Tech', level: 6 }, { name: 'Conceal/Reveal Object', level: 6 },
        { name: 'Cryptography', level: 6 }, { name: 'Cybertech', level: 6 }, { name: 'Electronics/Security Tech', level: 6, isX2: true },
        { name: 'Handgun', level: 6 }, { name: 'Library Search', level: 6 },
    ],
    TECH: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 2 }, { name: 'Education', level: 6 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 6 }, { name: 'Human Perception', level: 2 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 2 },
        { name: 'Stealth', level: 2 }, { name: 'Basic Tech', level: 6 }, { name: 'Cybertech', level: 6 },
        { name: 'Electronics/Security Tech', level: 6, isX2: true }, { name: 'Land Vehicle Tech', level: 6 },
        { name: 'Shoulder Arms', level: 6 }, { name: 'Science', level: 6 }, { name: 'Weaponstech', level: 6 },
    ],
    MEDTECH: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 6 }, { name: 'Education', level: 6 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 2 }, { name: 'Human Perception', level: 6 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 2 },
        { name: 'Stealth', level: 2 }, { name: 'Basic Tech', level: 6 }, { name: 'Cybertech', level: 4 },
        { name: 'Deduction', level: 6 }, { name: 'Paramedic', level: 6, isX2: true }, { name: 'Resist Torture/Drugs', level: 4 },
        { name: 'Science', level: 6 }, { name: 'Shoulder Arms', level: 6 },
    ],
    MEDIA: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 6 }, { name: 'Education', level: 2 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 2 }, { name: 'Human Perception', level: 6 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 6 }, { name: 'Perception', level: 6 }, { name: 'Persuasion', level: 6 },
        { name: 'Stealth', level: 2 }, { name: 'Bribery', level: 6 }, { name: 'Composition', level: 6 },
        { name: 'Deduction', level: 6 }, { name: 'Handgun', level: 6 }, { name: 'Library Search', level: 4 },
        { name: 'Lip Reading', level: 4 }, { name: 'Photography/Film', level: 4 },
    ],
    LAWMAN: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 6 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 6 }, { name: 'Education', level: 2 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 2 }, { name: 'Human Perception', level: 2 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 2 },
        { name: 'Stealth', level: 2 }, { name: 'Autofire', level: 6, isX2: true }, { name: 'Criminology', level: 6 },
        { name: 'Deduction', level: 6 }, { name: 'Handgun', level: 6 }, { name: 'Interrogation', level: 6 },
        { name: 'Shoulder Arms', level: 6 }, { name: 'Tracking', level: 6 },
    ],
    EXEC: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 6 }, { name: 'Education', level: 6 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 2 }, { name: 'Human Perception', level: 6 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 6 },
        { name: 'Stealth', level: 2 }, { name: 'Accounting', level: 6 }, { name: 'Bureaucracy', level: 6 },
        { name: 'Business', level: 6 }, { name: 'Deduction', level: 6 }, { name: 'Handgun', level: 6 },
        { name: 'Lip Reading', level: 6 }, { name: 'Personal Grooming', level: 4 },
    ],
    FIXER: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 2 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 6 }, { name: 'Education', level: 2 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 2 }, { name: 'Human Perception', level: 6 }, { name: 'Language (Streetslang)', level: 4 },
        { name: 'Local Expert (Your Home)', level: 6 }, { name: 'Perception', level: 2 }, { name: 'Persuasion', level: 4 },
        { name: 'Stealth', level: 2 }, { name: 'Bribery', level: 6 }, { name: 'Business', level: 6 },
        { name: 'Forgery', level: 6 }, { name: 'Handgun', level: 6 }, { name: 'Pick Lock', level: 4 },
        { name: 'Streetwise', level: 6 }, { name: 'Trading', level: 6 },
    ],
    NOMAD: [
        { name: 'Athletics', level: 2 }, { name: 'Brawling', level: 6 }, { name: 'Concentration', level: 2 },
        { name: 'Conversation', level: 2 }, { name: 'Education', level: 2 }, { name: 'Evasion', level: 6 },
        { name: 'First Aid', level: 6 }, { name: 'Human Perception', level: 2 }, { name: 'Language (Streetslang)', level: 2 },
        { name: 'Local Expert (Your Home)', level: 2 }, { name: 'Perception', level: 4 }, { name: 'Persuasion', level: 2 },
        { name: 'Stealth', level: 6 }, { name: 'Animal Handling', level: 6 }, { name: 'Drive Land Vehicle', level: 6 },
        { name: 'Handgun', level: 6 }, { name: 'Melee Weapon', level: 6 }, { name: 'Tracking', level: 6 },
        { name: 'Trading', level: 6 }, { name: 'Wilderness Survival', level: 6 },
    ],
}

// === ROLE SKILL LISTS ===
// Skills available for each role (Edgerunner method - same skills, user assigns levels)
export const ROLE_SKILLS: Record<Role, string[]> = {
    ROCKERBOY: STREETRAT_SKILL_TEMPLATES.ROCKERBOY.map(s => s.name),
    SOLO: STREETRAT_SKILL_TEMPLATES.SOLO.map(s => s.name),
    NETRUNNER: STREETRAT_SKILL_TEMPLATES.NETRUNNER.map(s => s.name),
    TECH: STREETRAT_SKILL_TEMPLATES.TECH.map(s => s.name),
    MEDTECH: STREETRAT_SKILL_TEMPLATES.MEDTECH.map(s => s.name),
    MEDIA: STREETRAT_SKILL_TEMPLATES.MEDIA.map(s => s.name),
    LAWMAN: STREETRAT_SKILL_TEMPLATES.LAWMAN.map(s => s.name),
    EXEC: STREETRAT_SKILL_TEMPLATES.EXEC.map(s => s.name),
    FIXER: STREETRAT_SKILL_TEMPLATES.FIXER.map(s => s.name),
    NOMAD: STREETRAT_SKILL_TEMPLATES.NOMAD.map(s => s.name),
}

// === STARTING GEAR ===
// Weapons and Armor for Streetrat and Edgerunner (from Corebook pg. 98)
export interface StartingGearEntry {
    weapons: string[]
    armor: string[]
    ammunition: string[]
    other: string[]
}

export const STARTING_GEAR: Record<Role, StartingGearEntry> = {
    ROCKERBOY: {
        weapons: ['Very Heavy Pistol'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic VH Pistol Ammunition x50'],
        other: ['Heavy Melee Weapon OR Flashbang Grenade', 'Teargas Grenade x2'],
    },
    SOLO: {
        weapons: ['Assault Rifle', 'Very Heavy Pistol', 'Heavy Melee Weapon OR Bulletproof Shield'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic VH Pistol Ammunition x30', 'Basic Rifle Ammunition x70'],
        other: [],
    },
    NETRUNNER: {
        weapons: ['Very Heavy Pistol'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic VH Pistol Ammunition x30'],
        other: [],
    },
    TECH: {
        weapons: ['Shotgun OR Assault Rifle'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic Shotgun Shell Ammunition x100 OR Basic Rifle Ammunition x100'],
        other: ['Flashbang Grenade'],
    },
    MEDTECH: {
        weapons: ['Shotgun OR Assault Rifle'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)', 'Bulletproof Shield'],
        ammunition: ['Basic Shotgun Shell Ammunition x100 OR Basic Rifle Ammunition x100', 'Incendiary Ammunition x10'],
        other: ['Smoke Grenade x2'],
    },
    MEDIA: {
        weapons: ['Heavy Pistol OR Very Heavy Pistol'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic H Pistol Ammunition x50 OR Basic VH Pistol Ammunition x50'],
        other: [],
    },
    LAWMAN: {
        weapons: ['Assault Rifle OR Shotgun', 'Heavy Pistol'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic Rifle Ammunition x100 OR Basic Shotgun Shell Ammunition x100', 'Basic H Pistol Ammunition x30'],
        other: ['Bulletproof Shield OR Smoke Grenade x2'],
    },
    EXEC: {
        weapons: ['Very Heavy Pistol'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic VH Pistol Ammunition x50'],
        other: [],
    },
    FIXER: {
        weapons: ['Heavy Pistol OR Very Heavy Pistol', 'Heavy Pistol OR Very Heavy Pistol', 'Light Melee Weapon'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic H Pistol Ammunition x100 OR Basic VH Pistol Ammunition x100'],
        other: [],
    },
    NOMAD: {
        weapons: ['Heavy Pistol OR Very Heavy Pistol', 'Heavy Melee Weapon OR Heavy Pistol'],
        armor: ['Light Armorjack Body Armor (SP11)', 'Light Armorjack Head Armor (SP11)'],
        ammunition: ['Basic H Pistol Ammunition x100 OR Basic VH Pistol Ammunition x100'],
        other: [],
    },
}

// === STARTING CYBERWARE ===
// Cyberware for Streetrat and Edgerunner (from Corebook pg. 117)
export interface StartingCyberwareEntry {
    name: string
    humanityLoss: number
    notes?: string
}

export const STARTING_CYBERWARE: Record<Role, { cyberware: StartingCyberwareEntry[]; totalHumanityLoss: number; empLoss: number }> = {
    ROCKERBOY: {
        cyberware: [
            { name: 'Biomonitor', humanityLoss: 0 },
            { name: 'Cybereye', humanityLoss: 2 },
            { name: 'Nasal Filters OR Toxin Binders', humanityLoss: 2 },
            { name: 'TeleOptics', humanityLoss: 2 },
            { name: 'Audio Recorder', humanityLoss: 2 },
            { name: 'Chemskin', humanityLoss: 0 },
            { name: 'Cyberaudio Suite', humanityLoss: 2 },
            { name: 'Techhair', humanityLoss: 0 },
        ],
        totalHumanityLoss: 9,
        empLoss: 1,
    },
    SOLO: {
        cyberware: [
            { name: 'Biomonitor', humanityLoss: 0 },
            { name: 'Neural Link', humanityLoss: 2 },
            { name: 'Sandevistan Speedware OR Wolvers', humanityLoss: 7, notes: 'Sandevistan: 7 HL, Wolvers: 7 HL' },
            { name: 'Interface Plugs', humanityLoss: 2 },
        ],
        totalHumanityLoss: 14,
        empLoss: 2,
    },
    NETRUNNER: {
        cyberware: [
            { name: 'Neural Link', humanityLoss: 2 },
            { name: 'Shift Tacts', humanityLoss: 2 },
            { name: 'Cybereye', humanityLoss: 2 },
            { name: 'MicroOptics', humanityLoss: 2 },
            { name: 'Interface Plugs', humanityLoss: 2 },
        ],
        totalHumanityLoss: 14,
        empLoss: 2,
    },
    TECH: {
        cyberware: [
            { name: 'Cybereye', humanityLoss: 2 },
            { name: 'MicroOptics', humanityLoss: 2 },
            { name: 'Skinwatch', humanityLoss: 0 },
            { name: 'Tool Hand', humanityLoss: 3 },
        ],
        totalHumanityLoss: 12,
        empLoss: 2,
    },
    MEDTECH: {
        cyberware: [
            { name: 'Cybereye', humanityLoss: 2 },
            { name: 'MicroOptics', humanityLoss: 2 },
            { name: 'Skinwatch', humanityLoss: 0 },
            { name: 'Tool Hand', humanityLoss: 3 },
        ],
        totalHumanityLoss: 12,
        empLoss: 2,
    },
    MEDIA: {
        cyberware: [
            { name: 'Interface Plugs OR Wolvers', humanityLoss: 5, notes: 'Plugs: 2 HL, Wolvers: 7 HL' },
            { name: 'Neural Link', humanityLoss: 2 },
            { name: 'Amplified Hearing OR Voice Stress Analyzer', humanityLoss: 3 },
            { name: 'Cyberaudio Suite', humanityLoss: 2 },
            { name: 'Light Tattoo', humanityLoss: 0 },
        ],
        totalHumanityLoss: 10,
        empLoss: 2,
    },
    LAWMAN: {
        cyberware: [
            { name: 'Hidden Holster', humanityLoss: 2 },
            { name: 'Subdermal Pocket', humanityLoss: 3 },
            { name: 'Biomonitor OR Techhair', humanityLoss: 0 },
            { name: 'Cyberaudio Suite', humanityLoss: 2 },
            { name: 'Internal Agent', humanityLoss: 3 },
        ],
        totalHumanityLoss: 10,
        empLoss: 2,
    },
    EXEC: {
        cyberware: [
            { name: 'Toxin Binders OR Nasal Filters', humanityLoss: 2 },
            { name: 'Cyberaudio Suite', humanityLoss: 2 },
            { name: 'Internal Agent', humanityLoss: 3 },
            { name: 'Subdermal Pocket', humanityLoss: 3 },
            { name: 'Voice Stress Analyzer OR Amplified Hearing', humanityLoss: 3 },
        ],
        totalHumanityLoss: 16,
        empLoss: 2,
    },
    FIXER: {
        cyberware: [
            { name: 'Cyberaudio Suite', humanityLoss: 2 },
            { name: 'Internal Agent', humanityLoss: 3 },
            { name: 'Subdermal Pocket', humanityLoss: 3 },
            { name: 'Voice Stress Analyzer OR Amplified Hearing', humanityLoss: 3 },
        ],
        totalHumanityLoss: 16,
        empLoss: 2,
    },
    NOMAD: {
        cyberware: [
            { name: 'Interface Plugs', humanityLoss: 2 },
            { name: 'Neural Link', humanityLoss: 2 },
            { name: 'Cyberaudio Suite', humanityLoss: 2 },
            { name: 'Internal Agent', humanityLoss: 3 },
            { name: 'Subdermal Pocket', humanityLoss: 3 },
        ],
        totalHumanityLoss: 14,
        empLoss: 2,
    },
}

// === LIFEPATH DATA ===

export const CULTURAL_ORIGINS = [
    { roll: 1, region: 'North American', languages: ['Chinese', 'Cree', 'Creole', 'English', 'French', 'Navajo', 'Spanish'] },
    { roll: 2, region: 'South/Central American', languages: ['Creole', 'English', 'German', 'Guarani', 'Mayan', 'Portuguese', 'Quechua', 'Spanish'] },
    { roll: 3, region: 'Western European', languages: ['Dutch', 'English', 'French', 'German', 'Italian', 'Norwegian', 'Portuguese', 'Spanish'] },
    { roll: 4, region: 'Eastern European', languages: ['English', 'Finnish', 'Polish', 'Romanian', 'Russian', 'Ukrainian'] },
    { roll: 5, region: 'Middle Eastern/North African', languages: ['Arabic', 'Berber', 'English', 'Farsi', 'French', 'Hebrew', 'Turkish'] },
    { roll: 6, region: 'Sub-Saharan African', languages: ['Arabic', 'English', 'French', 'Hausa', 'Lingala', 'Oromo', 'Portuguese', 'Swahili', 'Twi', 'Yoruba'] },
    { roll: 7, region: 'South Asian', languages: ['Bengali', 'Dari', 'English', 'Hindi', 'Nepali', 'Sinhalese', 'Tamil', 'Urdu'] },
    { roll: 8, region: 'South East Asian', languages: ['Arabic', 'Burmese', 'English', 'Filipino', 'Hindi', 'Indonesian', 'Khmer', 'Malayan', 'Vietnamese'] },
    { roll: 9, region: 'East Asian', languages: ['Cantonese Chinese', 'English', 'Japanese', 'Korean', 'Mandarin Chinese', 'Mongolian'] },
    { roll: 10, region: 'Oceania/Pacific Islander', languages: ['English', 'French', 'Hawaiian', 'Maori', 'Pama-Nyungan', 'Tahitian'] },
]

export const PERSONALITIES = [
    { roll: 1, description: 'Shy and secretive' },
    { roll: 2, description: 'Rebellious, antisocial, and violent' },
    { roll: 3, description: 'Arrogant, proud, and aloof' },
    { roll: 4, description: 'Moody, rash, and headstrong' },
    { roll: 5, description: 'Picky, fussy, and nervous' },
    { roll: 6, description: 'Stable and serious' },
    { roll: 7, description: 'Silly and fluff-headed' },
    { roll: 8, description: 'Sneaky and deceptive' },
    { roll: 9, description: 'Intellectual and detached' },
    { roll: 10, description: 'Friendly and outgoing' },
]

export const CLOTHING_STYLES = [
    { roll: 1, style: 'Generic Chic', description: 'Standard, Colorful, Modular' },
    { roll: 2, style: 'Leisurewear', description: 'Comfort, Agility, Athleticism' },
    { roll: 3, style: 'Urban Flash', description: 'Flashy, Technological, Streetwear' },
    { roll: 4, style: 'Businesswear', description: 'Leadership, Presence, Authority' },
    { roll: 5, style: 'High Fashion', description: 'Exclusive, Designer, Couture' },
    { roll: 6, style: 'Bohemian', description: 'Folksy, Retro, Free-spirited' },
    { roll: 7, style: 'Bag Lady Chic', description: 'Homeless, Ragged, Vagrant' },
    { roll: 8, style: 'Gang Colors', description: 'Dangerous, Violent, Rebellious' },
    { roll: 9, style: 'Nomad Leathers', description: 'Western, Rugged, Tribal' },
    { roll: 10, style: 'Asia Pop', description: 'Bright, Costume-like, Youthful' },
]

export const HAIRSTYLES = [
    { roll: 1, style: 'Mohawk' },
    { roll: 2, style: 'Long and ratty' },
    { roll: 3, style: 'Short and spiked' },
    { roll: 4, style: 'Wild and all over' },
    { roll: 5, style: 'Bald' },
    { roll: 6, style: 'Striped' },
    { roll: 7, style: 'Wild colors' },
    { roll: 8, style: 'Neat and short' },
    { roll: 9, style: 'Short and curly' },
    { roll: 10, style: 'Long and straight' },
]

export const AFFECTATIONS = [
    { roll: 1, description: 'Tattoos' },
    { roll: 2, description: 'Mirrorshades' },
    { roll: 3, description: 'Ritual scars' },
    { roll: 4, description: 'Spiked gloves' },
    { roll: 5, description: 'Nose rings' },
    { roll: 6, description: 'Tongue or other piercings' },
    { roll: 7, description: 'Strange fingernail implants' },
    { roll: 8, description: 'Spiked boots or heels' },
    { roll: 9, description: 'Fingerless gloves' },
    { roll: 10, description: 'Strange contacts' },
]

export const VALUES = [
    { roll: 1, value: 'Money' },
    { roll: 2, value: 'Honor' },
    { roll: 3, value: 'Your word' },
    { roll: 4, value: 'Honesty' },
    { roll: 5, value: 'Knowledge' },
    { roll: 6, value: 'Vengeance' },
    { roll: 7, value: 'Love' },
    { roll: 8, value: 'Power' },
    { roll: 9, value: 'Family' },
    { roll: 10, value: 'Friendship' },
]

export const FEELINGS_ABOUT_PEOPLE = [
    { roll: 1, feeling: 'I stay neutral.' },
    { roll: 2, feeling: 'I stay neutral.' },
    { roll: 3, feeling: 'I like almost everyone.' },
    { roll: 4, feeling: 'I hate almost everyone.' },
    { roll: 5, feeling: 'People are tools. Use them for your own goals then discard them.' },
    { roll: 6, feeling: 'Every person is a valuable individual.' },
    { roll: 7, feeling: 'People are obstacles to be destroyed if they cross me.' },
    { roll: 8, feeling: 'People are untrustworthy. Don\'t depend on anyone.' },
    { roll: 9, feeling: 'Wipe \'em all out and let the cockroaches take over.' },
    { roll: 10, feeling: 'People are wonderful!' },
]

export const VALUED_POSSESSIONS = [
    { roll: 1, possession: 'A weapon' },
    { roll: 2, possession: 'A tool' },
    { roll: 3, possession: 'A piece of clothing' },
    { roll: 4, possession: 'A photograph' },
    { roll: 5, possession: 'A book or diary' },
    { roll: 6, possession: 'A recording' },
    { roll: 7, possession: 'A musical instrument' },
    { roll: 8, possession: 'A piece of jewelry' },
    { roll: 9, possession: 'A toy' },
    { roll: 10, possession: 'A letter' },
]

export const FAMILY_BACKGROUNDS = [
    { roll: 1, background: 'Corporate Execs: Wealthy, powerful, with servants, luxury, and privilege.' },
    { roll: 2, background: 'Corporate Managers: Well-to-do, with large home, nice cars, some servants.' },
    { roll: 3, background: 'Corporate Technicians: Comfortable, with decent home and car.' },
    { roll: 4, background: 'Nomad Pack: Wandering, with a large family and convoy.' },
    { roll: 5, background: 'Ganger Family: Dangerous, with criminal ties and street connections.' },
    { roll: 6, background: 'Combat Zoners: Tough, with survival skills and combat experience.' },
    { roll: 7, background: 'Urban Homeless: Poor, with nothing but the clothes on their backs.' },
    { roll: 8, background: 'Megastructure Warren Rats: Cramped, with recycled air and artificial light.' },
    { roll: 9, background: 'Reclaimers: Pioneers, with newly cleared land and fresh starts.' },
    { roll: 10, background: 'Edgerunners: Dangerous, with a legacy of the Edge and the Street.' },
]

export const CHILDHOOD_ENVIRONMENTS = [
    { roll: 1, environment: 'Ran on The Street with no adult supervision' },
    { roll: 2, environment: 'Spent in a safe Corporate Suburbia' },
    { roll: 3, environment: 'In a Nomad Pack moving from place to place' },
    { roll: 4, environment: 'In a decaying, once-rich Urban Area' },
    { roll: 5, environment: 'In a Megastructure warren (multi-level Arcology)' },
    { roll: 6, environment: 'In the heart of the Combat Zone' },
    { roll: 7, environment: 'In a small Village or Town far from the City' },
    { roll: 8, environment: 'In a Pirate Fleet based on ships or oil rigs' },
    { roll: 9, environment: 'On a Family Farm' },
    { roll: 10, environment: 'In a Reclaimer Commune' },
]

export const FAMILY_CRISES = [
    { roll: 1, crisis: 'Your family lost everything through betrayal.' },
    { roll: 2, crisis: 'Your family lost everything through bad management.' },
    { roll: 3, crisis: 'Your family was exiled or otherwise driven from their former home/nation/group.' },
    { roll: 4, crisis: 'Your family was imprisoned and you alone escaped.' },
    { roll: 5, crisis: 'Your family vanished. You are the only remaining member.' },
    { roll: 6, crisis: 'Your family was killed and you were the only survivor.' },
    { roll: 7, crisis: 'Your family is scattered to the winds due to misfortune.' },
    { roll: 8, crisis: 'Your family is cursed with a hereditary feud that has lasted for generations.' },
    { roll: 9, crisis: 'You are the inheritor of a family debt; you must honor this debt before moving on.' },
    { roll: 10, crisis: 'Your family is involved in a long-term conspiracy, organization, or plan.' },
]

export const LIFE_GOALS = [
    { roll: 1, goal: 'Get rid of a bad reputation' },
    { roll: 2, goal: 'Gain power and control' },
    { roll: 3, goal: 'Get off The Street no matter what it takes' },
    { roll: 4, goal: 'Cause pain and suffering to anyone who crosses you' },
    { roll: 5, goal: 'Live down your past' },
    { roll: 6, goal: 'Hunt down those responsible for your misfortune and make them pay' },
    { roll: 7, goal: 'Get what\'s rightfully yours' },
    { roll: 8, goal: "Save, if possible, anyone else's life who suffers the way you have" },
    { roll: 9, goal: 'Get revenge on those who ruined your life' },
    { roll: 10, goal: 'Acquire the best of the best in everything' },
]

// === SHOPPING CATALOGS (for Complete Package) ===

// Price Categories: Cheap (10eb), Everyday (20eb), Costly (50eb), Premium (100eb), 
// Expensive (500eb), V. Expensive (1000eb), Luxury (5000eb), Super Luxury (10000eb)

export interface ShopWeapon {
    name: string
    type: string
    damage: string
    rof: number
    cost: number
    skill: string
}

export const SHOP_WEAPONS: ShopWeapon[] = [
    // Melee Weapons
    { name: 'Light Melee Weapon', type: 'Melee', damage: '1d6', rof: 2, cost: 50, skill: 'Melee Weapon' },
    { name: 'Medium Melee Weapon', type: 'Melee', damage: '2d6', rof: 2, cost: 50, skill: 'Melee Weapon' },
    { name: 'Heavy Melee Weapon', type: 'Melee', damage: '3d6', rof: 2, cost: 100, skill: 'Melee Weapon' },
    { name: 'Very Heavy Melee Weapon', type: 'Melee', damage: '4d6', rof: 1, cost: 500, skill: 'Melee Weapon' },
    // Pistols
    { name: 'Medium Pistol', type: 'Pistol', damage: '2d6', rof: 2, cost: 50, skill: 'Handgun' },
    { name: 'Heavy Pistol', type: 'Pistol', damage: '3d6', rof: 2, cost: 100, skill: 'Handgun' },
    { name: 'Very Heavy Pistol', type: 'Pistol', damage: '4d6', rof: 1, cost: 100, skill: 'Handgun' },
    // SMGs
    { name: 'SMG', type: 'SMG', damage: '2d6', rof: 1, cost: 100, skill: 'Handgun' },
    { name: 'Heavy SMG', type: 'SMG', damage: '3d6', rof: 1, cost: 100, skill: 'Handgun' },
    // Shoulder Arms
    { name: 'Shotgun', type: 'Shotgun', damage: '5d6', rof: 1, cost: 500, skill: 'Shoulder Arms' },
    { name: 'Assault Rifle', type: 'Rifle', damage: '5d6', rof: 1, cost: 500, skill: 'Shoulder Arms' },
    { name: 'Sniper Rifle', type: 'Rifle', damage: '5d6', rof: 1, cost: 500, skill: 'Shoulder Arms' },
    // Archery
    { name: 'Bow / Crossbow', type: 'Bow', damage: '4d6', rof: 1, cost: 100, skill: 'Archery' },
    // Heavy Weapons
    { name: 'Grenade Launcher', type: 'Heavy', damage: '6d6', rof: 1, cost: 500, skill: 'Heavy Weapons' },
    { name: 'Rocket Launcher', type: 'Heavy', damage: '8d6', rof: 1, cost: 500, skill: 'Heavy Weapons' },
]

export interface ShopArmor {
    name: string
    location: 'Body' | 'Head' | 'Shield'
    sp: number
    penalty: number
    cost: number
}

export const SHOP_ARMOR: ShopArmor[] = [
    // Body Armor
    { name: 'Leathers (Body)', location: 'Body', sp: 4, penalty: 0, cost: 20 },
    { name: 'Kevlar (Body)', location: 'Body', sp: 7, penalty: 0, cost: 50 },
    { name: 'Light Armorjack (Body)', location: 'Body', sp: 11, penalty: 0, cost: 100 },
    { name: 'Bodyweight Suit (Body)', location: 'Body', sp: 11, penalty: 0, cost: 1000 },
    { name: 'Medium Armorjack (Body)', location: 'Body', sp: 12, penalty: -2, cost: 100 },
    { name: 'Heavy Armorjack (Body)', location: 'Body', sp: 13, penalty: -2, cost: 500 },
    { name: 'Flak (Body)', location: 'Body', sp: 15, penalty: -4, cost: 500 },
    { name: 'Metalgear (Body)', location: 'Body', sp: 18, penalty: -4, cost: 5000 },
    // Head Armor
    { name: 'Leathers (Head)', location: 'Head', sp: 4, penalty: 0, cost: 20 },
    { name: 'Kevlar (Head)', location: 'Head', sp: 7, penalty: 0, cost: 50 },
    { name: 'Light Armorjack (Head)', location: 'Head', sp: 11, penalty: 0, cost: 100 },
    { name: 'Bodyweight Suit (Head)', location: 'Head', sp: 11, penalty: 0, cost: 1000 },
    { name: 'Medium Armorjack (Head)', location: 'Head', sp: 12, penalty: -2, cost: 100 },
    { name: 'Heavy Armorjack (Head)', location: 'Head', sp: 13, penalty: -2, cost: 500 },
    { name: 'Flak (Head)', location: 'Head', sp: 15, penalty: -4, cost: 500 },
    { name: 'Metalgear (Head)', location: 'Head', sp: 18, penalty: -4, cost: 5000 },
    // Shield
    { name: 'Bulletproof Shield', location: 'Shield', sp: 10, penalty: 0, cost: 100 },
]

export interface ShopGear {
    name: string
    description: string
    cost: number
    category: string
}

export const SHOP_GEAR: ShopGear[] = [
    // Survival Gear
    { name: 'Flashlight', category: 'Survival', description: 'Portable light source', cost: 20 },
    { name: 'Binoculars', category: 'Survival', description: '20x magnification', cost: 50 },
    { name: 'Tent & Camping Equipment', category: 'Survival', description: 'Shelter and basic camping gear', cost: 50 },
    { name: 'Inflatable Bed & Sleeping Bag', category: 'Survival', description: 'Comfortable sleep outdoors', cost: 20 },
    { name: 'Rope (60m)', category: 'Survival', description: 'Durable climbing/utility rope', cost: 20 },
    { name: 'Grapple Gun', category: 'Survival', description: 'Fires grappling hook, holds 200kg', cost: 100 },
    // Tech Gear
    { name: 'Agent', category: 'Tech', description: 'Personal computer/phone device', cost: 100 },
    { name: 'Disposable Cell Phone', category: 'Tech', description: 'Untraceable, single-use phone', cost: 50 },
    { name: 'Radio Communicator', category: 'Tech', description: '1 mile range two-way radio', cost: 100 },
    { name: 'Computer', category: 'Tech', description: 'Desktop computing station', cost: 50 },
    { name: 'Cyberdeck', category: 'Tech', description: 'Required for Netrunning', cost: 500 },
    { name: 'Tech Bag', category: 'Tech', description: 'Basic tech tools', cost: 100 },
    // Medical
    { name: 'Medtech Bag', category: 'Medical', description: 'Medical supplies for First Aid and Paramedic', cost: 100 },
    { name: 'Airhypo', category: 'Medical', description: 'Drug injector, holds 6 doses', cost: 50 },
    { name: 'Cryopump', category: 'Medical', description: 'Stabilizes mortally wounded', cost: 500 },
    { name: 'Cryotank', category: 'Medical', description: 'Full body medical stasis', cost: 1000 },
    // Personal
    { name: 'Personal CarePak', category: 'Personal', description: 'Hygiene essentials', cost: 20 },
    { name: 'Carryall', category: 'Personal', description: 'Large carrying bag', cost: 20 },
    { name: 'Handcuffs', category: 'Personal', description: 'Restraints', cost: 50 },
    // Ammunition (per 10 rounds)
    { name: 'Basic Pistol Ammo (x10)', category: 'Ammo', description: 'Standard pistol rounds', cost: 10 },
    { name: 'Basic Rifle Ammo (x10)', category: 'Ammo', description: 'Standard rifle rounds', cost: 10 },
    { name: 'Basic Shotgun Shells (x10)', category: 'Ammo', description: 'Standard shotgun shells', cost: 10 },
    { name: 'Arrows (x10)', category: 'Ammo', description: 'Standard arrows', cost: 10 },
    // Grenades
    { name: 'Flashbang Grenade', category: 'Grenades', description: 'Blinds and deafens targets', cost: 100 },
    { name: 'Smoke Grenade', category: 'Grenades', description: 'Creates smoke cover', cost: 50 },
    { name: 'Teargas Grenade', category: 'Grenades', description: 'Chemical irritant', cost: 50 },
    { name: 'Frag Grenade', category: 'Grenades', description: '6d6 damage, 5m radius', cost: 100 },
    { name: 'Incendiary Grenade', category: 'Grenades', description: 'Fire damage, 5m radius', cost: 100 },
    { name: 'EMP Grenade', category: 'Grenades', description: 'Disables electronics', cost: 500 },
]

export interface ShopCyberware {
    name: string
    type: 'Fashionware' | 'Neuralware' | 'Cyberoptics' | 'Cyberaudio' | 'Internal' | 'External' | 'Cyberlimbs' | 'Borgware'
    description: string
    humanityLoss: number
    cost: number
    install: 'Mall' | 'Clinic' | 'Hospital'
    prerequisite?: string
}

export const SHOP_CYBERWARE: ShopCyberware[] = [
    // Fashionware (0 HL, Mall Install)
    { name: 'Biomonitor', type: 'Fashionware', description: 'Vital signs readout', humanityLoss: 0, cost: 100, install: 'Mall' },
    { name: 'Chemskin', type: 'Fashionware', description: 'Permanent skin color change', humanityLoss: 0, cost: 100, install: 'Mall' },
    { name: 'EMP Threading', type: 'Fashionware', description: 'Circuit pattern body lines', humanityLoss: 0, cost: 10, install: 'Mall' },
    { name: 'Light Tattoo', type: 'Fashionware', description: 'Subdermal LED tattoo', humanityLoss: 0, cost: 100, install: 'Mall' },
    { name: 'Shift Tacts', type: 'Fashionware', description: 'Color-changing eye lenses', humanityLoss: 0, cost: 100, install: 'Mall' },
    { name: 'Skinwatch', type: 'Fashionware', description: 'Subdermal LED watch', humanityLoss: 0, cost: 100, install: 'Mall' },
    { name: 'Techhair', type: 'Fashionware', description: 'Color-changing artificial hair', humanityLoss: 0, cost: 100, install: 'Mall' },
    
    // Neuralware
    { name: 'Neural Link', type: 'Neuralware', description: 'Foundational: 5 slots, required for neuralware', humanityLoss: 7, cost: 500, install: 'Clinic' },
    { name: 'Braindance Recorder', type: 'Neuralware', description: 'Record experiences to chip', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Chipware Socket', type: 'Neuralware', description: 'Required for chipware', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Interface Plugs', type: 'Neuralware', description: 'Connect to machines', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Kerenzikov', type: 'Neuralware', description: 'Speedware: +2 Initiative', humanityLoss: 14, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Sandevistan', type: 'Neuralware', description: 'Speedware: +3 Initiative (activated)', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Skill Chip', type: 'Neuralware', description: 'Skill at Level 3', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Chipware Socket' },
    { name: 'Pain Editor', type: 'Neuralware', description: 'Ignore Seriously Wounded penalty', humanityLoss: 14, cost: 1000, install: 'Clinic', prerequisite: 'Chipware Socket' },
    
    // Cyberoptics
    { name: 'Cybereye', type: 'Cyberoptics', description: 'Foundational: 3 slots per eye', humanityLoss: 7, cost: 100, install: 'Clinic' },
    { name: 'Anti-Dazzle', type: 'Cyberoptics', description: 'Immune to flash effects', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Chyron', type: 'Cyberoptics', description: 'HUD display', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Image Enhance', type: 'Cyberoptics', description: '+2 Perception, Lip Reading, Conceal', humanityLoss: 3, cost: 500, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Low Light/IR/UV', type: 'Cyberoptics', description: 'See in darkness', humanityLoss: 3, cost: 500, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'MicroOptics', type: 'Cyberoptics', description: '400x magnification', humanityLoss: 2, cost: 100, install: 'Clinic', prerequisite: 'Cybereye' },
    { name: 'Targeting Scope', type: 'Cyberoptics', description: '+1 Aimed Shot', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cybereye' },
    { name: 'TeleOptics', type: 'Cyberoptics', description: 'See 800m away', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cybereye' },
    
    // Cyberaudio
    { name: 'Cyberaudio Suite', type: 'Cyberaudio', description: 'Foundational: 3 slots', humanityLoss: 7, cost: 500, install: 'Clinic' },
    { name: 'Amplified Hearing', type: 'Cyberaudio', description: '+2 hearing Perception', humanityLoss: 3, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Audio Recorder', type: 'Cyberaudio', description: 'Record audio', humanityLoss: 2, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Bug Detector', type: 'Cyberaudio', description: 'Detect surveillance', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Homing Tracer', type: 'Cyberaudio', description: 'Track homing beacon', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Internal Agent', type: 'Cyberaudio', description: 'Built-in Agent computer', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Level Damper', type: 'Cyberaudio', description: 'Immune to loud sounds', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Radio Communicator', type: 'Cyberaudio', description: 'Built-in radio', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Scrambler/Descrambler', type: 'Cyberaudio', description: 'Encrypt/decrypt comms', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Voice Stress Analyzer', type: 'Cyberaudio', description: 'Detect lies', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    
    // Internal Body Cyberware
    { name: 'Toxin Binders', type: 'Internal', description: '+2 resist poison/drugs', humanityLoss: 2, cost: 100, install: 'Mall' },
    { name: 'Nasal Filters', type: 'Internal', description: '+2 resist airborne toxins', humanityLoss: 2, cost: 100, install: 'Mall' },
    { name: 'Independent Air Supply', type: 'Internal', description: '30 min air supply', humanityLoss: 2, cost: 1000, install: 'Clinic' },
    { name: 'Cybersnake', type: 'Internal', description: 'Esophageal compartment', humanityLoss: 14, cost: 1000, install: 'Hospital' },
    { name: 'Vampyres', type: 'Internal', description: 'Fang implants (1d6 damage)', humanityLoss: 14, cost: 500, install: 'Clinic' },
    { name: 'Gills', type: 'Internal', description: 'Breathe underwater', humanityLoss: 7, cost: 1000, install: 'Hospital' },
    { name: 'Grafted Muscle/Bone Lace', type: 'Internal', description: '+2 BODY for HP only', humanityLoss: 14, cost: 1000, install: 'Hospital' },
    
    // External Body Cyberware
    { name: 'Subdermal Armor', type: 'External', description: '+2 Body SP (no head)', humanityLoss: 7, cost: 1000, install: 'Hospital' },
    { name: 'Subdermal Pocket', type: 'External', description: 'Hidden storage', humanityLoss: 3, cost: 100, install: 'Clinic' },
    { name: 'Hidden Holster', type: 'External', description: 'Concealed weapon slot', humanityLoss: 2, cost: 500, install: 'Clinic' },
    
    // Cyberlimbs
    { name: 'Cyberarm', type: 'Cyberlimbs', description: 'Foundational: 4 slots', humanityLoss: 7, cost: 500, install: 'Hospital' },
    { name: 'Cyberleg', type: 'Cyberlimbs', description: 'Foundational: 3 slots', humanityLoss: 7, cost: 500, install: 'Hospital' },
    { name: 'Big Knucks', type: 'Cyberlimbs', description: 'Brawling +2d6 damage', humanityLoss: 3, cost: 100, install: 'Mall', prerequisite: 'Cyberarm' },
    { name: 'Scratchers', type: 'Cyberlimbs', description: 'Carbo-glass claws (2d6)', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberarm' },
    { name: 'Rippers', type: 'Cyberlimbs', description: 'Carbo-glass claws (3d6)', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Wolvers', type: 'Cyberlimbs', description: 'Carbo-glass claws (3d6)', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Tool Hand', type: 'Cyberlimbs', description: 'Built-in tools', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Popup Weapon', type: 'Cyberlimbs', description: 'Concealed weapon in arm (Light/Medium)', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Subdermal Grip', type: 'Cyberlimbs', description: 'Smartgun link', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Jump Boosters', type: 'Cyberlimbs', description: 'Jump 6m high', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg' },
    { name: 'Skate Foot', type: 'Cyberlimbs', description: 'Inline skates in feet', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg' },
    { name: 'Talon Foot', type: 'Cyberlimbs', description: 'Climbing claws', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg' },
]

// === HELPER FUNCTIONS ===

export const getStatTemplateForRole = (role: Role, roll: number): CharacterStats | null => {
    const roleTemplates = STAT_TEMPLATES.find((rt) => rt.role === role)
    if (!roleTemplates) return null
    const template = roleTemplates.templates.find((t) => t.roll === roll)
    return template ? template.stats : null
}

export const getSkillsForRole = (role: Role): string[] => {
    return ROLE_SKILLS[role] || []
}

export const calculateDerivedStats = (
    stats: CharacterStats
): { HP: number; HumanityMax: number; SeriouslyWoundedThreshold: number; DeathSave: number } => {
    // HP = 10 + 5 × ((BODY + WILL) / 2, rounded up)
    const bodyWillAvg = Math.ceil((stats.BODY + stats.WILL) / 2)
    const HP = 10 + 5 * bodyWillAvg

    // Humanity = EMP × 10
    const HumanityMax = stats.EMP * 10

    // Seriously Wounded = HP / 2, rounded up
    const SeriouslyWoundedThreshold = Math.ceil(HP / 2)

    // Death Save = BODY
    const DeathSave = stats.BODY

    return { HP, HumanityMax, SeriouslyWoundedThreshold, DeathSave }
}

