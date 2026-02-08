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

// === ROLE ABILITIES ===
export const ROLE_ABILITIES: Record<Role, { name: string; description: string }> = {
    ROCKERBOY: { name: 'Charismatic Impact', description: 'Influence others through sheer personality; affect larger groups and make greater requests as rank increases' },
    SOLO: { name: 'Combat Awareness', description: 'Divide points among combat abilities when combat begins or as an Action' },
    NETRUNNER: { name: 'Interface', description: 'Allows Netrunning with cyberdecks and access to hacking/system control abilities' },
    TECH: { name: 'Maker', description: 'Fix, improve, modify, make, and invent items. Gain ranks in repairing, upgrading, fabricating, inventing' },
    MEDTECH: { name: 'Medicine', description: 'Keep people alive with knowledge, tools, and training. Specialties: surgery, pharmaceuticals, cryosystems' },
    MEDIA: { name: 'Credibility', description: 'Convince audiences of truth, reach larger audiences, access sources and information' },
    LAWMAN: { name: 'Backup', description: 'Call upon fellow officers based on Rank and conditions' },
    EXEC: { name: 'Teamwork', description: 'Build teams with visible and covert specialists' },
    FIXER: { name: 'Operator', description: 'Navigate black markets, maintain contacts/clients, source goods/favors/information' },
    NOMAD: { name: 'Moto', description: 'Vehicle combat and pack-related abilities' },
}

// === ROLE ABILITY RANK DETAILS (from Corebook) ===
export const ROLE_ABILITY_RANK_DETAILS: Record<Role, {
    mechanic: string
    ranks: { range: string; minRank: number; maxRank: number; details: string[] }[]
}> = {
    ROCKERBOY: {
        mechanic: 'Roll Charismatic Impact + 1d10. DV8: single fan, DV10: small group (up to 6), DV12: huge group.',
        ranks: [
            { range: '1-2', minRank: 1, maxRank: 2, details: [
                'Venues: Small local clubs',
                'Single fan: Small favor (buy drink, give lift)',
                'Small group: Ask for autographs, fans stop you in streets',
            ]},
            { range: '3-4', minRank: 3, maxRank: 4, details: [
                'Venues: Well-known clubs',
                'Single fan: Major favor (go to bed, put in good word)',
                'Small group: Hang out regularly, provide booze/drugs/party favors',
                'Huge group: Strong local following, fans buy merch',
            ]},
            { range: '5-6', minRank: 5, maxRank: 6, details: [
                'Venues: Large, important clubs',
                'Single fan: Commit minor crime (shoplift, help in fight)',
                'Small group: Act as personal "posse", do favors',
                'Huge group: Fans all over City, strongly loyal',
            ]},
            { range: '7-8', minRank: 7, maxRank: 8, details: [
                'Venues: Small concert halls, local video feed',
                'Single fan: Risk their life without question',
                'Small group: Commit minor crime',
                'Huge group: Rabidly loyal, fight rival fans, support info networks',
            ]},
            { range: '9', minRank: 9, maxRank: 9, details: [
                'Venues: Large concert halls, national video feed',
                'Single fan: Commit major crime (steal, beat someone up)',
                'Small group: Commit major crime',
                'Huge group: Cult-like following, will riot/destroy/kill',
            ]},
            { range: '10', minRank: 10, maxRank: 10, details: [
                'Venues: Huge stadiums, international video',
                'Single fan: Sacrifice self without question',
                'Small group: Risk their lives, act as personal protection',
                'Huge group: Worldwide cult following, private army',
            ]},
        ],
    },
    SOLO: {
        mechanic: 'Distribute Rank points among combat abilities. Reassign before combat, outside combat, or as an Action.',
        ranks: [
            { range: '1-10', minRank: 1, maxRank: 10, details: [
                'Total points = Rank (distribute among abilities below)',
                'Damage Deflection: 2/4/6/8/10 pts → reduce first damage by 1/2/3/4/5',
                'Fumble Recovery: 4 pts → ignore critical failures on attacks',
                'Initiative Reaction: 1 pt each → +1 to Initiative per point',
                'Precision Attack: 3/6/9 pts → +1/+2/+3 to attacks',
                'Spot Weakness: 1 pt each → +1 damage per point on first hit/round',
                'Threat Detection: 1 pt each → +1 Perception per point',
            ]},
        ],
    },
    NETRUNNER: {
        mechanic: 'NET Actions per turn scale with rank. Use Interface abilities to hack Architecture.',
        ranks: [
            { range: '1-3', minRank: 1, maxRank: 3, details: ['2 NET Actions per turn'] },
            { range: '4-6', minRank: 4, maxRank: 6, details: ['3 NET Actions per turn'] },
            { range: '7-9', minRank: 7, maxRank: 9, details: ['4 NET Actions per turn'] },
            { range: '10', minRank: 10, maxRank: 10, details: ['5 NET Actions per turn'] },
        ],
    },
    TECH: {
        mechanic: 'Each rank grants 2 points in any two Maker Specialties. Roll: TECH + Skill + Rank + 1d10.',
        ranks: [
            { range: '1-10', minRank: 1, maxRank: 10, details: [
                'Total specialty points = Rank × 2 (across 4 specialties)',
                'Field Expertise: Add Rank to Tech Skill checks. Jury-rig repairs (10 min/Rank)',
                'Upgrade Expertise: Improve items (lower HL, add slots, conceal, upgrade quality, +SP)',
                'Fabrication Expertise: Create items for 1 price category less in materials',
                'Invention Expertise: Invent new items/upgrades (GM assigns price, min Expensive)',
                'DV: Cheap 9, Costly 13, Premium 17, Expensive 21, V.Expensive 24, Luxury+ 29',
            ]},
        ],
    },
    MEDTECH: {
        mechanic: 'Each rank allocates 1 point to a specialty: Surgery, Pharmaceuticals (max 5), or Cryosystems (max 5).',
        ranks: [
            { range: '1-10', minRank: 1, maxRank: 10, details: [
                'Surgery: Each point → +2 to Surgery Skill (exclusive to Medtechs)',
                'Pharma (max 5): Each point → +1 Medical Tech & unlock 1 drug type',
                '  Drugs: Antibiotic (+2 HP/day), Rapidetox, Speedheal (BODY+WILL HP), Stim (ignore wounds 1h), Surge (no sleep 24h)',
                'Cryo (max 5): Each point → +1 Medical Tech & cryo equipment',
                '  Lvl 1: Cryopump | Lvl 2: Tank access | Lvl 3: Personal tank | Lvl 4-5: More tanks + charges',
            ]},
        ],
    },
    MEDIA: {
        mechanic: 'Passive rumors 2x/week (Rank + 1d10 vs DV). Publish stories to affect change. Believability roll: 1d10.',
        ranks: [
            { range: '1-2', minRank: 1, maxRank: 2, details: [
                'Sources: Local honcho, gang lord, neighborhood leadership',
                'Audience: Immediate neighborhood',
                'Believability: 2 in 10 (+ evidence bonuses)',
                'Impact: Incremental; small-time bad guys may change',
            ]},
            { range: '3-4', minRank: 3, maxRank: 4, details: [
                'Sources: City gang honcho, minor politician, Corp Exec',
                'Audience: Well-known on local screamsheet/Data Pool',
                'Believability: 3 in 10',
                'Impact: Direct; local bad guys arrested, justice served',
            ]},
            { range: '5-6', minRank: 5, maxRank: 6, details: [
                'Sources: Major City player, City politico, local celebrity',
                'Audience: Citywide; regular media contributor',
                'Believability: 4 in 10',
                'Impact: City-wide changes; higher-level criminals jailed, local laws passed',
            ]},
            { range: '7-8', minRank: 7, maxRank: 8, details: [
                'Sources: Local Corp president, mayor, City celebrity',
                'Audience: Statewide; minor celebrity',
                'Believability: 5 in 10',
                'Impact: Multi-city; mid-level corps/govts overthrown',
            ]},
            { range: '9', minRank: 9, maxRank: 9, details: [
                'Sources: Divisional Corp head, State politico, well-known celebrity',
                'Audience: National newsfeed',
                'Believability: 6 in 10',
                'Impact: National; large corps/govts toppled',
            ]},
            { range: '10', minRank: 10, maxRank: 10, details: [
                'Sources: Major world leader, major Corp head, world-famous celebrity',
                'Audience: Worldwide; people ask for autographs',
                'Believability: 7 in 10',
                'Impact: Worldwide; Megacorps fall, international laws, millions affected',
            ]},
        ],
    },
    LAWMAN: {
        mechanic: 'As Action, roll d10 ≤ Backup Rank to get response. Roll 1d6 for arrival (rounds). Rolling 6 upgrades tier.',
        ranks: [
            { range: '1-2', minRank: 1, maxRank: 2, details: [
                'Corporate Security: 4 rent-a-cops on foot',
                'Combat 8 | SP 7 | HP 20 | Heavy Pistols, Kevlar',
            ]},
            { range: '3-4', minRank: 3, maxRank: 4, details: [
                'Local Beat Cops: 4 cops in 2 Groundcars',
                'Combat 10 | SP 7 | HP 25 | Heavy Pistols, Kevlar',
            ]},
            { range: '5-7', minRank: 5, maxRank: 7, details: [
                "Sheriff's Dept: 2 County Mounties in High-Performance Groundcar",
                'Combat 14 | SP 13 | HP 35 | Heavy Pistols, Assault Rifles, Heavy Armorjack',
            ]},
            { range: '8', minRank: 8, maxRank: 8, details: [
                'Recovery Zone Marshal: 1 lone Lawman on Superbike',
                'Combat 16 | SP 15 | HP 50 | V.Heavy Pistol, Assault Rifle, Grenade Launcher, Flak',
            ]},
            { range: '9', minRank: 9, maxRank: 9, details: [
                'C-SWAT (Psycho Squad): 2 heavy hitters via AV-4',
                'Combat 15 | SP 18 | HP 35 | Assault Rifles, Rocket Launchers, Metalgear',
            ]},
            { range: '10', minRank: 10, maxRank: 10, details: [
                'National Law / Interpol / FBI / Netwatch: 2 agents via AV-4',
                'Combat 14 | SP 11 | HP 35 | V.Heavy Pistols, Assault Rifles, Light Armorjack',
                'Same 2 agents follow case. Can use Combat # for investigative skills.',
            ]},
        ],
    },
    EXEC: {
        mechanic: 'Build a team of specialists. Track team Loyalty (0-10). Loyalty Save: GM rolls 1d6 < Loyalty.',
        ranks: [
            { range: '1', minRank: 1, maxRank: 1, details: [
                'Signing Bonus: Gifted businesswear suit (jacket, top, bottom, footwear)',
            ]},
            { range: '2', minRank: 2, maxRank: 2, details: [
                'Corporate Housing: Corporate Conapt (free rent/fees)',
            ]},
            { range: '3', minRank: 3, maxRank: 3, details: [
                '1 Team Member (Bodyguard, Covert Op, Driver, Netrunner, or Technician)',
                'Starting Loyalty: 1d6 + 1',
            ]},
            { range: '5', minRank: 5, maxRank: 5, details: [
                '+1 Team Member (2 total)',
            ]},
            { range: '6', minRank: 6, maxRank: 6, details: [
                'Corporate Health Insurance: Trauma Team Silver',
            ]},
            { range: '7', minRank: 7, maxRank: 7, details: [
                'Housing Upgrade: Beaverville House in Executive Zone',
            ]},
            { range: '8', minRank: 8, maxRank: 8, details: [
                'Insurance Upgrade: Trauma Team Executive',
            ]},
            { range: '9', minRank: 9, maxRank: 9, details: [
                '+1 Team Member (3 total max)',
            ]},
            { range: '10', minRank: 10, maxRank: 10, details: [
                'Housing Upgrade: Beaverville McMansion or Luxury Penthouse',
            ]},
        ],
    },
    FIXER: {
        mechanic: 'Navigate black markets. Haggle: COOL + Trading + Rank + 1d10 vs target. Grease: blend into cultures.',
        ranks: [
            { range: '1-2', minRank: 1, maxRank: 2, details: [
                'Contacts: Local honcho, gang lord, neighborhood leadership',
                'Reach: Cheap & Everyday items (even if unavailable elsewhere)',
                'Haggle: 10% more/less than market price',
                'Grease: Know immediate neighborhood & all local gangs',
            ]},
            { range: '3-4', minRank: 3, maxRank: 4, details: [
                'Contacts: City gang honcho, minor politician, Corp Exec',
                'Reach: Up to Expensive items',
                'Haggle: Buy 5+ same item = get 1 free',
                'Grease: +1 culture (1 language at Skill 4)',
            ]},
            { range: '5-6', minRank: 5, maxRank: 6, details: [
                'Contacts: Major City player, City politico, neighborhood celebrity',
                'Reach: Up to Super Luxury (1x/month via Night Market)',
                'Haggle: Negotiate job pay +20%',
                'Grease: +2 cultures (3 total, languages at Skill 4)',
            ]},
            { range: '7-8', minRank: 7, maxRank: 8, details: [
                'Contacts: Local Corp president, mayor, local celebrity',
                'Reach: Up to Very Expensive items',
                'Haggle: Luxury/Super Luxury pay half now, half in 1 month',
                'Grease: +3 cultures (6 total, languages at Skill 4)',
            ]},
            { range: '9', minRank: 9, maxRank: 9, details: [
                'Contacts: Divisional Corp head, state politico, well-known celebrity',
                'Reach: Up to Luxury items; can set up Midnight Market',
                'Haggle: 20% more/less than market price',
                'Grease: Blend with corps/government agencies',
            ]},
            { range: '10', minRank: 10, maxRank: 10, details: [
                'Contacts: Major world leader, major Corp head, world-famous celebrity',
                'Reach: Up to Super Luxury items',
                'Haggle: Double pay per person for Dangerous Jobs',
                'Grease: Blend seamlessly with any group (secret societies, cults, exclusive clubs)',
            ]},
        ],
    },
    NOMAD: {
        mechanic: 'Add Moto Rank to Drive/Pilot/Vehicle Tech checks. Each rank: add vehicle OR upgrade existing one.',
        ranks: [
            { range: '1-4', minRank: 1, maxRank: 4, details: [
                'Vehicles: Compact Groundcar, Gyrocopter, Jetski, Roadbike',
                'Upgrades (Rank 1): Bulletproof Glass, Comms, NOS, Flamethrower, MG, Seating, Smuggling, Heavy Chassis, Melee, Spike Strip, Combat Plow, Housing',
            ]},
            { range: '5-6', minRank: 5, maxRank: 6, details: [
                'Vehicles: +Helicopter, High Performance Groundcar, Speedboat',
                'Upgrades (Rank 5): Armored Chassis (SP13), Security, Heavy Weapon Mount, Hover, Rocket Pod',
            ]},
            { range: '7-8', minRank: 7, maxRank: 8, details: [
                'Vehicles: +AV-4, Cabin Cruiser, Superbike',
                'Upgrades (Rank 7): AV-4 Engine (land vehicle gains flight)',
            ]},
            { range: '9', minRank: 9, maxRank: 9, details: [
                'Vehicles: +Aerozep, AV-9, Super Groundcar, Yacht',
            ]},
            { range: '10', minRank: 10, maxRank: 10, details: [
                'Promoted to Family leadership',
                'All Family vehicles can be out simultaneously',
                'Future vehicles at market price, upgrades 1,000eb each',
            ]},
        ],
    },
}

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

export const VALUED_PERSONS = [
    { roll: 1, person: 'A parent' },
    { roll: 2, person: 'A brother or sister' },
    { roll: 3, person: 'A lover' },
    { roll: 4, person: 'A friend' },
    { roll: 5, person: 'Yourself' },
    { roll: 6, person: 'A pet' },
    { roll: 7, person: 'A teacher or mentor' },
    { roll: 8, person: 'A public figure' },
    { roll: 9, person: 'A personal hero' },
    { roll: 10, person: 'No one' },
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

// === LIFE EVENTS SUB-TABLES ===

export const FRIEND_TYPES = [
    { roll: 1, relationship: 'Like an older sibling to you' },
    { roll: 2, relationship: 'Like a younger sibling to you' },
    { roll: 3, relationship: 'A teacher or mentor' },
    { roll: 4, relationship: 'A partner or coworker' },
    { roll: 5, relationship: 'A former lover' },
    { roll: 6, relationship: 'An old enemy' },
    { roll: 7, relationship: 'Like a parent to you' },
    { roll: 8, relationship: 'An old childhood friend' },
    { roll: 9, relationship: 'Someone you know from The Street' },
    { roll: 10, relationship: 'Someone with a common interest or goal' },
]

export const ENEMY_TYPES = [
    { roll: 1, who: 'Ex-friend' },
    { roll: 2, who: 'Ex-lover' },
    { roll: 3, who: 'Estranged relative' },
    { roll: 4, who: 'Childhood enemy' },
    { roll: 5, who: 'Person working for you' },
    { roll: 6, who: 'Person you work for' },
    { roll: 7, who: 'Partner or coworker' },
    { roll: 8, who: 'Corporate exec' },
    { roll: 9, who: 'Government official' },
    { roll: 10, who: 'Boosterganger' },
]

export const ENEMY_CAUSES = [
    { roll: 1, cause: 'Caused the other to lose face or status' },
    { roll: 2, cause: 'Caused the loss of a lover, friend, or relative' },
    { roll: 3, cause: 'Caused a major public humiliation' },
    { roll: 4, cause: 'Accused the other of cowardice or a major flaw' },
    { roll: 5, cause: 'Deserted or betrayed the other' },
    { roll: 6, cause: 'Turned down the other\'s offer of job or romance' },
    { roll: 7, cause: 'You just don\'t like each other' },
    { roll: 8, cause: 'One of you was a romantic rival' },
    { roll: 9, cause: 'One of you was a business rival' },
    { roll: 10, cause: 'One of you set the other up for a crime' },
]

export const ENEMY_RESOURCES = [
    { roll: 1, resources: 'Just themselves and even they won\'t go out of their way' },
    { roll: 2, resources: 'Just themselves' },
    { roll: 3, resources: 'Themselves and a close friend' },
    { roll: 4, resources: 'Themselves and a few friends' },
    { roll: 5, resources: 'Themselves and a small group' },
    { roll: 6, resources: 'An entire gang (at least 15 people)' },
    { roll: 7, resources: 'The local cops or other Lawmen' },
    { roll: 8, resources: 'A powerful gang lord or small Corporation' },
    { roll: 9, resources: 'A powerful Corporation' },
    { roll: 10, resources: 'An entire city, government, or agency' },
]

export const SWEET_REVENGE = [
    { roll: 1, action: 'Avoid the scum' },
    { roll: 2, action: 'Avoid the scum' },
    { roll: 3, action: 'Go into a murderous rage and try to rip their face off' },
    { roll: 4, action: 'Go into a murderous rage and try to rip their face off' },
    { roll: 5, action: 'Backstab them indirectly' },
    { roll: 6, action: 'Backstab them indirectly' },
    { roll: 7, action: 'Verbally attack them' },
    { roll: 8, action: 'Verbally attack them' },
    { roll: 9, action: 'Set them up for a crime they didn\'t commit' },
    { roll: 10, action: 'Set out to murder or maim them' },
]

export const TRAGIC_LOVE_AFFAIRS = [
    { roll: 1, outcome: 'Your lover died in an accident' },
    { roll: 2, outcome: 'Your lover mysteriously vanished' },
    { roll: 3, outcome: 'It just didn\'t work out' },
    { roll: 4, outcome: 'A personal goal or vendetta came between you' },
    { roll: 5, outcome: 'Your lover was kidnapped' },
    { roll: 6, outcome: 'Your lover went insane or cyberpsycho' },
    { roll: 7, outcome: 'Your lover committed suicide' },
    { roll: 8, outcome: 'Your lover was killed in a fight' },
    { roll: 9, outcome: 'A rival cut you out of the action' },
    { roll: 10, outcome: 'Your lover is imprisoned or exiled' },
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
    // Exotic Weapons
    { name: 'Air Pistol', type: 'Exotic Pistol', damage: '0', rof: 2, cost: 100, skill: 'Handgun' },
    { name: 'Stun Baton', type: 'Exotic Melee', damage: '2d6 (non-lethal)', rof: 2, cost: 100, skill: 'Melee Weapon' },
    { name: 'Stun Gun', type: 'Exotic Pistol', damage: '3d6 (non-lethal)', rof: 2, cost: 100, skill: 'Handgun' },
    { name: 'Dartgun', type: 'Exotic Pistol', damage: '0 (poison ammo)', rof: 1, cost: 100, skill: 'Handgun' },
    { name: 'Microwaver', type: 'Exotic Pistol', damage: '0 (EMP effect)', rof: 1, cost: 500, skill: 'Handgun' },
    { name: 'Shrieker', type: 'Exotic Pistol', damage: '0 (deafen)', rof: 1, cost: 500, skill: 'Handgun' },
    { name: 'Flamethrower', type: 'Exotic Shotgun', damage: '5d6 (fire)', rof: 2, cost: 500, skill: 'Heavy Weapons' },
    { name: 'Battleglove', type: 'Exotic Melee', damage: 'varies', rof: 2, cost: 1000, skill: 'Melee Weapon' },
    { name: 'Kendachi Mono-Three', type: 'Exotic VH Melee', damage: '4d6', rof: 1, cost: 5000, skill: 'Melee Weapon' },
    { name: 'Malorian Arms 3516', type: 'Exotic VH Pistol', damage: '5d6', rof: 1, cost: 10000, skill: 'Handgun' },
    { name: 'Constitution Arms Hurricane', type: 'Exotic Shotgun', damage: '5d6', rof: 2, cost: 5000, skill: 'Shoulder Arms' },
    { name: 'Militech Cowboy U-56', type: 'Exotic Grenade Launcher', damage: '6d6', rof: 2, cost: 5000, skill: 'Heavy Weapons' },
    { name: 'Rhinemetall EMG-86 Railgun', type: 'Exotic Rifle', damage: '5d6 (ignores SP<11)', rof: 1, cost: 5000, skill: 'Heavy Weapons' },
    { name: 'Tsunami Arms Helix', type: 'Exotic Rifle', damage: '2d6 (autofire only)', rof: 1, cost: 5000, skill: 'Autofire' },
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
    // Additional Tech Gear
    { name: 'Techtool', category: 'Tech', description: 'All-in-one multitool with electrical parts, heat torch, prybars', cost: 100 },
    { name: 'Lock Picking Set', category: 'Tech', description: 'Tools for cracking mechanical locks', cost: 20 },
    { name: 'Techscanner', category: 'Tech', description: '+2 to all Tech skills (does not stack)', cost: 1000 },
    { name: 'Medscanner', category: 'Medical', description: '+2 First Aid and Paramedic (does not stack)', cost: 1000 },
    { name: 'Smart Glasses', category: 'Tech', description: '2 Cybereye option slots, always count as paired', cost: 500 },
    { name: 'Virtuality Goggles', category: 'Tech', description: 'Projects cyberspace imagery over real world. For Netrunners', cost: 100 },
    { name: 'Braindance Viewer', category: 'Tech', description: 'View braindance sensory recordings', cost: 1000 },
    { name: 'Memory Chip', category: 'Tech', description: 'Thin data storage wafer', cost: 10 },
    { name: 'Video Camera', category: 'Tech', description: 'Records 12 hours video+audio to Memory Chip', cost: 100 },
    { name: 'Audio Recorder', category: 'Tech', description: 'Records 24 hours audio to Memory Chip', cost: 100 },
    { name: 'Radio Scanner/Music Player', category: 'Tech', description: 'Scan radio bands 1 mile; play music', cost: 50 },
    { name: 'Scrambler/Descrambler', category: 'Tech', description: 'Scramble outgoing communications', cost: 500 },
    { name: 'Bug Detector', category: 'Tech', description: 'Beeps within 2m of listening device', cost: 500 },
    { name: 'Homing Tracer', category: 'Tech', description: 'Track beacon up to 1 mile; includes button tracer', cost: 500 },
    { name: 'Radar Detector', category: 'Tech', description: 'Beeps if active radar within 100m', cost: 500 },
    { name: 'Pocket Amplifier', category: 'Tech', description: 'Sound up to 100m for 6 hours, supports 2 instruments', cost: 50 },
    // Instruments
    { name: 'Electric Guitar/Instrument', category: 'Entertainment', description: 'Electric instrument, needs amplification', cost: 500 },
    { name: 'Drum Synthesizer', category: 'Entertainment', description: 'Flat pads simulating any drum type', cost: 500 },
    // Survival Gear
    { name: 'Road Flare', category: 'Survival', description: 'Lights 100m area for 1 hour, one use', cost: 10 },
    { name: 'Duct Tape', category: 'Survival', description: 'Many colors, glow-in-the-dark available', cost: 20 },
    { name: 'Glow Paint', category: 'Survival', description: 'Glow-in-the-dark spray paint', cost: 20 },
    { name: 'Glow Stick', category: 'Survival', description: 'Illuminates 4m for 10 hours, one use', cost: 10 },
    { name: 'Anti-Smog Breathing Mask', category: 'Survival', description: 'Immune to toxic gasses and inhaled dangers', cost: 20 },
    { name: 'Radiation Suit', category: 'Survival', description: 'Full body protection from radiation', cost: 1000 },
    // Food
    { name: 'Food Stick', category: 'Food', description: 'Grainy dried food bar, one meal', cost: 10 },
    { name: 'Kibble Pack', category: 'Food', description: 'Dry cereal/wafer pack, one meal', cost: 10 },
    { name: 'MRE', category: 'Food', description: 'Self-heating meal, add water, 2 min hot meal', cost: 10 },
    // Defense
    { name: 'Auto Level Dampening Ear Protectors', category: 'Personal', description: 'Immune to deafness from loud sounds', cost: 1000 },
    // Chemical
    { name: 'Vial of Poison', category: 'Chemical', description: 'On Light Melee 30 min: DV13 Resist or 2d6 dmg ignoring armor', cost: 100 },
    { name: 'Vial of Biotoxin', category: 'Chemical', description: 'On Light Melee 30 min: DV15 Resist or 3d6 dmg ignoring armor', cost: 500 },
    // Special Ammunition
    { name: 'Armor-Piercing Ammo (x10)', category: 'Ammo', description: 'Halves armor SP (round down)', cost: 100 },
    { name: 'Incendiary Ammo (x10)', category: 'Ammo', description: 'Sets target on fire on hit', cost: 100 },
    { name: 'Rubber Ammo (x10)', category: 'Ammo', description: 'Non-lethal ammunition', cost: 10 },
    { name: 'Biotoxin Ammo (x10)', category: 'Ammo', description: 'DV15 Resist or 3d6 damage ignoring armor', cost: 500 },
    { name: 'Poison Ammo (x10)', category: 'Ammo', description: 'DV13 Resist or 2d6 damage ignoring armor', cost: 100 },
    { name: 'Expansive Ammo (x10)', category: 'Ammo', description: '+1 damage die but does not ablate armor', cost: 100 },
    { name: 'Smart Ammo (x10)', category: 'Ammo', description: 'For Smartgun Link; user fires around cover', cost: 100 },
    { name: 'Grenade (Frag)', category: 'Ammo', description: 'For Grenade Launcher, 6d6 damage', cost: 100 },
    { name: 'Grenade (Smoke)', category: 'Ammo', description: 'For Grenade Launcher, creates smoke cover', cost: 50 },
    { name: 'Grenade (Flashbang)', category: 'Ammo', description: 'For Grenade Launcher, blinds and deafens', cost: 100 },
    { name: 'Grenade (Teargas)', category: 'Ammo', description: 'For Grenade Launcher, chemical irritant', cost: 50 },
    { name: 'Grenade (Incendiary)', category: 'Ammo', description: 'For Grenade Launcher, fire damage', cost: 100 },
    { name: 'Grenade (EMP)', category: 'Ammo', description: 'For Grenade Launcher, disables electronics', cost: 500 },
]

export interface ShopCyberware {
    name: string
    type: 'Fashionware' | 'Neuralware' | 'Cyberoptics' | 'Cyberaudio' | 'Internal' | 'External' | 'Cyberlimbs' | 'Borgware'
    description: string
    humanityLoss: number
    cost: number
    install: 'Mall' | 'Clinic' | 'Hospital'
    prerequisite?: string
    prerequisiteCount?: number // How many of the prerequisite are needed (default 1)
    requiresStat?: { stat: 'BODY' | 'REF' | 'INT'; min: number } // Stat requirement
    unique?: boolean  // Only one allowed per character
    maxSlots?: number  // For foundations: how many option slots they provide
    slotsUsed?: number // How many slots this option uses (default 1)
    bodyBonus?: number     // Added to BODY stat (e.g., Grafted Muscle/Bone Lace +2)
    bodyOverride?: number  // Sets BODY to this value (e.g., Linear Frames set to 12/14)
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
    { name: 'Neural Link', type: 'Neuralware', description: 'Foundational: 5 slots, required for neuralware', humanityLoss: 7, cost: 500, install: 'Clinic', maxSlots: 5 },
    { name: 'Braindance Recorder', type: 'Neuralware', description: 'Record experiences to chip', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Chipware Socket', type: 'Neuralware', description: 'Required for chipware', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Interface Plugs', type: 'Neuralware', description: 'Connect to machines', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Kerenzikov', type: 'Neuralware', description: 'Speedware: +2 Initiative', humanityLoss: 14, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Sandevistan', type: 'Neuralware', description: 'Speedware: +3 Initiative (activated)', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Skill Chip', type: 'Neuralware', description: 'Skill at Level 3', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Chipware Socket' },
    { name: 'Pain Editor', type: 'Neuralware', description: 'Ignore Seriously Wounded penalty', humanityLoss: 14, cost: 1000, install: 'Clinic', prerequisite: 'Chipware Socket' },
    { name: 'Chemical Analyzer', type: 'Neuralware', description: 'Chipware. Identify precise chemical composition of substances as an Action', humanityLoss: 3, cost: 500, install: 'Mall', prerequisite: 'Chipware Socket' },
    { name: 'Memory Chip', type: 'Neuralware', description: 'Chipware. Data storage for cyberware', humanityLoss: 0, cost: 10, install: 'Mall', prerequisite: 'Chipware Socket' },
    { name: 'Olfactory Boost', type: 'Neuralware', description: 'Chipware. Enhanced smell; use Tracking to track by scent', humanityLoss: 7, cost: 100, install: 'Mall', prerequisite: 'Chipware Socket' },
    { name: 'Tactile Boost', type: 'Neuralware', description: 'Chipware. Detect motion within 20m via touch on surface', humanityLoss: 7, cost: 100, install: 'Mall', prerequisite: 'Chipware Socket' },
    
    // Cyberoptics
    { name: 'Cybereye', type: 'Cyberoptics', description: 'Foundational: 3 slots per eye', humanityLoss: 7, cost: 100, install: 'Clinic', maxSlots: 3 },
    { name: 'Anti-Dazzle', type: 'Cyberoptics', description: 'Immune to flash effects', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Chyron', type: 'Cyberoptics', description: 'HUD display', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Image Enhance', type: 'Cyberoptics', description: '+2 Perception, Lip Reading, Conceal', humanityLoss: 3, cost: 500, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Low Light/IR/UV', type: 'Cyberoptics', description: 'See in darkness', humanityLoss: 3, cost: 500, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'MicroOptics', type: 'Cyberoptics', description: '400x magnification', humanityLoss: 2, cost: 100, install: 'Clinic', prerequisite: 'Cybereye' },
    { name: 'Targeting Scope', type: 'Cyberoptics', description: '+1 Aimed Shot', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cybereye' },
    { name: 'TeleOptics', type: 'Cyberoptics', description: 'See 800m away', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cybereye' },
    { name: 'Color Shift', type: 'Cyberoptics', description: 'Unlimited color/pattern changes to eye', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cybereye' },
    { name: 'Dartgun (Eye)', type: 'Cyberoptics', description: 'Single-shot dartgun in eye. Takes 3 option slots', humanityLoss: 2, cost: 500, install: 'Clinic', prerequisite: 'Cybereye', slotsUsed: 3 },
    { name: 'MicroVideo', type: 'Cyberoptics', description: 'Camera records video+audio to Memory Chip. Takes 2 slots', humanityLoss: 2, cost: 500, install: 'Clinic', prerequisite: 'Cybereye', slotsUsed: 2 },
    { name: 'Radiation Detector', type: 'Cyberoptics', description: 'See radiation sources within 100m as blue glow', humanityLoss: 3, cost: 1000, install: 'Clinic', prerequisite: 'Cybereye' },
    { name: 'Virtuality', type: 'Cyberoptics', description: 'Projects cyberspace imagery over real world. Requires two Cybereyes', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cybereye', prerequisiteCount: 2 },
    
    // Cyberaudio
    { name: 'Cyberaudio Suite', type: 'Cyberaudio', description: 'Foundational: 3 slots', humanityLoss: 7, cost: 500, install: 'Clinic', maxSlots: 3 },
    { name: 'Amplified Hearing', type: 'Cyberaudio', description: '+2 hearing Perception', humanityLoss: 3, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Audio Recorder', type: 'Cyberaudio', description: 'Record audio', humanityLoss: 2, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Bug Detector', type: 'Cyberaudio', description: 'Detect surveillance', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Homing Tracer', type: 'Cyberaudio', description: 'Track homing beacon', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Internal Agent', type: 'Cyberaudio', description: 'Built-in Agent computer', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Level Damper', type: 'Cyberaudio', description: 'Immune to loud sounds', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Radio Communicator', type: 'Cyberaudio', description: 'Built-in radio', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Scrambler/Descrambler', type: 'Cyberaudio', description: 'Encrypt/decrypt comms', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberaudio Suite' },
    { name: 'Voice Stress Analyzer', type: 'Cyberaudio', description: 'Detect lies', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Radio Scanner/Music Player', type: 'Cyberaudio', description: 'Scan radio bands within 1 mile; play music from Data Pool', humanityLoss: 2, cost: 50, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    { name: 'Radar Detector', type: 'Cyberaudio', description: 'Beeps if active radar within 100m', humanityLoss: 2, cost: 500, install: 'Clinic', prerequisite: 'Cyberaudio Suite' },
    
    // Internal Body Cyberware
    { name: 'Toxin Binders', type: 'Internal', description: '+2 resist poison/drugs', humanityLoss: 2, cost: 100, install: 'Mall' },
    { name: 'Nasal Filters', type: 'Internal', description: '+2 resist airborne toxins', humanityLoss: 2, cost: 100, install: 'Mall' },
    { name: 'Independent Air Supply', type: 'Internal', description: '30 min air supply', humanityLoss: 2, cost: 1000, install: 'Clinic' },
    { name: 'Cybersnake', type: 'Internal', description: 'Esophageal compartment', humanityLoss: 14, cost: 1000, install: 'Hospital' },
    { name: 'Vampyres', type: 'Internal', description: 'Fang implants (1d6 damage)', humanityLoss: 14, cost: 500, install: 'Clinic' },
    { name: 'Gills', type: 'Internal', description: 'Breathe underwater', humanityLoss: 7, cost: 1000, install: 'Hospital' },
    { name: 'Grafted Muscle/Bone Lace', type: 'Internal', description: '+2 BODY for HP only', humanityLoss: 14, cost: 1000, install: 'Hospital', bodyBonus: 2 },
    { name: 'AudioVox', type: 'Internal', description: 'Vocal synthesizer: +2 Acting and +2 Play Instrument (singing)', humanityLoss: 3, cost: 500, install: 'Clinic' },
    { name: 'Contraceptive Implant', type: 'Internal', description: 'Prevents undesired pregnancy', humanityLoss: 0, cost: 10, install: 'Mall' },
    { name: 'Enhanced Antibodies', type: 'Internal', description: 'Heal 2x BODY per rest day instead of normal rate', humanityLoss: 2, cost: 500, install: 'Mall' },
    { name: 'Midnight Lady Sexual Implant', type: 'Internal', description: 'Be a Venus, be the fire, be desire', humanityLoss: 7, cost: 100, install: 'Clinic' },
    { name: 'Mr. Studd Sexual Implant', type: 'Internal', description: 'All night, every night', humanityLoss: 7, cost: 100, install: 'Clinic' },
    { name: 'Radar/Sonar Implant', type: 'Internal', description: 'Scan terrain 50m for new moving threats; beeps with direction', humanityLoss: 7, cost: 1000, install: 'Clinic' },
    
    // External Body Cyberware
    { name: 'Subdermal Armor', type: 'External', description: '+2 Body SP (no head)', humanityLoss: 7, cost: 1000, install: 'Hospital' },
    { name: 'Subdermal Pocket', type: 'External', description: 'Hidden storage', humanityLoss: 3, cost: 100, install: 'Clinic' },
    { name: 'Hidden Holster', type: 'External', description: 'Concealed weapon slot', humanityLoss: 2, cost: 500, install: 'Clinic' },
    { name: 'Skin Weave', type: 'External', description: 'Body and head armored at SP7. Repairs 1 SP/day via nanomachines', humanityLoss: 7, cost: 500, install: 'Hospital' },
    
    // Cyberlimbs
    { name: 'Cyberarm', type: 'Cyberlimbs', description: 'Foundational: 4 slots', humanityLoss: 7, cost: 500, install: 'Hospital', maxSlots: 4 },
    { name: 'Cyberleg', type: 'Cyberlimbs', description: 'Foundational: 3 slots', humanityLoss: 7, cost: 500, install: 'Hospital', maxSlots: 3 },
    { name: 'Big Knucks', type: 'Cyberlimbs', description: 'Brawling +2d6 damage', humanityLoss: 3, cost: 100, install: 'Mall', prerequisite: 'Cyberarm' },
    { name: 'Scratchers', type: 'Cyberlimbs', description: 'Carbo-glass claws (2d6)', humanityLoss: 2, cost: 100, install: 'Mall', prerequisite: 'Cyberarm' },
    { name: 'Rippers', type: 'Cyberlimbs', description: 'Carbo-glass claws (3d6)', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Wolvers', type: 'Cyberlimbs', description: 'Carbo-glass claws (3d6)', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Tool Hand', type: 'Cyberlimbs', description: 'Built-in tools', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Popup Melee Weapon', type: 'Cyberlimbs', description: 'Concealed melee weapon (Light/Medium/Heavy). Takes 2 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 2 },
    { name: 'Popup Ranged Weapon', type: 'Cyberlimbs', description: 'Concealed one-handed ranged weapon. Takes 2 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 2 },
    { name: 'Popup Grenade Launcher', type: 'Cyberlimbs', description: 'Concealed single-shot grenade launcher. Takes 2 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 2 },
    { name: 'Popup Shield', type: 'Cyberlimbs', description: 'Concealed Bulletproof Shield in arm. Takes 3 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 3 },
    { name: 'Subdermal Grip', type: 'Cyberlimbs', description: 'Smartgun link', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Neural Link' },
    { name: 'Standard Hand', type: 'Cyberlimbs', description: 'Normal-looking hand replacement. No option slot used', humanityLoss: 2, cost: 100, install: 'Clinic', slotsUsed: 0 },
    { name: 'Grapple Hand', type: 'Cyberlimbs', description: 'Fire grapple 30m, holds 2x body weight, 10 HP line', humanityLoss: 3, cost: 100, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Medscanner (Arm)', type: 'Cyberlimbs', description: '+2 First Aid and Paramedic. Takes 2 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 2 },
    { name: 'Techscanner (Arm)', type: 'Cyberlimbs', description: '+2 all Tech skills. Takes 2 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 2 },
    { name: 'Shoulder Cam', type: 'Cyberlimbs', description: 'Popup shoulder camera, records video+audio. Takes 2 slots', humanityLoss: 7, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 2 },
    { name: 'Cyberdeck (Arm)', type: 'Cyberlimbs', description: 'Installed cyberdeck with +1 slot. Takes 3 slots. Uninstalling destroys deck', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm', slotsUsed: 3 },
    { name: 'Quick Change Mount', type: 'Cyberlimbs', description: 'Install/uninstall cyberarm as an Action', humanityLoss: 7, cost: 100, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Slice \'N Dice', type: 'Cyberlimbs', description: 'Monofilament whip in thumb (2d6, ROF 2). Concealable', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberarm' },
    { name: 'Jump Boosters', type: 'Cyberlimbs', description: 'Jump 6m high', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg' },
    { name: 'Skate Foot', type: 'Cyberlimbs', description: 'Inline skates in feet', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg' },
    { name: 'Talon Foot', type: 'Cyberlimbs', description: 'Climbing claws', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg' },
    { name: 'Standard Foot', type: 'Cyberlimbs', description: 'Normal-looking foot replacement. No option slot used', humanityLoss: 2, cost: 100, install: 'Clinic', slotsUsed: 0 },
    { name: 'Grip Foot', type: 'Cyberlimbs', description: 'Negate climbing movement penalty. Requires two Cyberlegs', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg', prerequisiteCount: 2 },
    { name: 'Web Foot', type: 'Cyberlimbs', description: 'Negate swimming movement penalty. Requires two Cyberlegs', humanityLoss: 3, cost: 500, install: 'Clinic', prerequisite: 'Cyberleg', prerequisiteCount: 2 },
    // Cyberlimb Coverings (no option slot)
    { name: 'Plastic Covering', type: 'Cyberlimbs', description: 'Plastic coating, various colors/patterns. No slot used', humanityLoss: 0, cost: 100, install: 'Mall', prerequisite: 'Cyberarm', slotsUsed: 0 },
    { name: 'Realskinn Covering', type: 'Cyberlimbs', description: 'Artificial skin coating. No slot used', humanityLoss: 0, cost: 500, install: 'Mall', prerequisite: 'Cyberarm', slotsUsed: 0 },
    { name: 'Superchrome Covering', type: 'Cyberlimbs', description: 'Shiny metallic coating, +2 Wardrobe & Style. No slot used', humanityLoss: 0, cost: 1000, install: 'Mall', prerequisite: 'Cyberarm', slotsUsed: 0 },
    { name: 'Hardened Shielding', type: 'Cyberlimbs', description: 'Cyberlimb immune to EMP and Non-Black ICE effects', humanityLoss: 3, cost: 1000, install: 'Clinic', prerequisite: 'Cyberarm' },
]

// === FASHION SHOP (for Complete Package - separate 800eb budget) ===
export interface ShopFashion {
    name: string
    type: 'clothing' | 'fashionware'
    description: string
    cost: number
    humanityLoss: number
}

export const SHOP_FASHION: ShopFashion[] = [
    // Clothing Styles
    { name: 'Generic Chic Outfit', type: 'clothing', description: 'Standard, colorful, modular', cost: 20, humanityLoss: 0 },
    { name: 'Leisurewear Outfit', type: 'clothing', description: 'Comfort, agility, athleticism', cost: 20, humanityLoss: 0 },
    { name: 'Urban Flash Outfit', type: 'clothing', description: 'Flashy, technological, streetwear', cost: 20, humanityLoss: 0 },
    { name: 'Businesswear Outfit', type: 'clothing', description: 'Leadership, presence, authority', cost: 20, humanityLoss: 0 },
    { name: 'High Fashion Outfit', type: 'clothing', description: 'Exclusive, designer, couture', cost: 100, humanityLoss: 0 },
    { name: 'Bohemian Outfit', type: 'clothing', description: 'Folksy, retro, free-spirited', cost: 20, humanityLoss: 0 },
    { name: 'Bag Lady Chic Outfit', type: 'clothing', description: 'Homeless, ragged, vagrant', cost: 20, humanityLoss: 0 },
    { name: 'Gang Colors Outfit', type: 'clothing', description: 'Dangerous, violent, rebellious', cost: 20, humanityLoss: 0 },
    { name: 'Nomad Leathers Outfit', type: 'clothing', description: 'Western, rugged, tribal', cost: 100, humanityLoss: 0 },
    { name: 'Asia Pop Outfit', type: 'clothing', description: 'Bright, costume-like, youthful', cost: 20, humanityLoss: 0 },
    // Fashionware (0 HL — also available in main cyberware catalog for gear budget)
    { name: 'Biomonitor', type: 'fashionware', description: 'Vital signs readout', cost: 100, humanityLoss: 0 },
    { name: 'Chemskin', type: 'fashionware', description: 'Permanent skin color change', cost: 100, humanityLoss: 0 },
    { name: 'EMP Threading', type: 'fashionware', description: 'Circuit pattern body lines', cost: 10, humanityLoss: 0 },
    { name: 'Light Tattoo', type: 'fashionware', description: 'Subdermal LED tattoo', cost: 100, humanityLoss: 0 },
    { name: 'Shift Tacts', type: 'fashionware', description: 'Color-changing eye lenses', cost: 100, humanityLoss: 0 },
    { name: 'Skinwatch', type: 'fashionware', description: 'Subdermal LED watch', cost: 100, humanityLoss: 0 },
    { name: 'Techhair', type: 'fashionware', description: 'Color-changing artificial hair', cost: 100, humanityLoss: 0 },
]

// === BORGWARE (for Complete Package shop) ===
export const SHOP_BORGWARE: ShopCyberware[] = [
    { name: 'Implanted Linear Frame Sigma', type: 'Borgware', description: 'BODY increases to 12 (changes HP & Death Save). Requires BODY 6 and Grafted Muscle and Bone Lace', humanityLoss: 14, cost: 1000, install: 'Hospital', prerequisite: 'Grafted Muscle/Bone Lace', requiresStat: { stat: 'BODY', min: 6 }, unique: true, bodyOverride: 12 },
    { name: 'Implanted Linear Frame Beta', type: 'Borgware', description: 'BODY increases to 14 (changes HP & Death Save). Requires BODY 8 and two Grafted Muscle and Bone Lace', humanityLoss: 14, cost: 5000, install: 'Hospital', prerequisite: 'Grafted Muscle/Bone Lace', prerequisiteCount: 2, requiresStat: { stat: 'BODY', min: 8 }, unique: true, bodyOverride: 14 },
    { name: 'Artificial Shoulder Mount', type: 'Borgware', description: 'Mount 2 Cyberarms under first set of arms. Only one allowed', humanityLoss: 14, cost: 1000, install: 'Hospital', unique: true },
    { name: 'MultiOptic Mount', type: 'Borgware', description: 'Mount up to 5 additional Cybereyes. Only one allowed', humanityLoss: 14, cost: 1000, install: 'Hospital', unique: true },
    { name: 'Sensor Array', type: 'Borgware', description: '5 additional Cyberaudio Option slots. Requires Cyberaudio Suite. Only one allowed', humanityLoss: 14, cost: 1000, install: 'Clinic', prerequisite: 'Cyberaudio Suite', unique: true },
]

// === STARTING FASHION (by role for Streetrat/Edgerunner) ===
export const STARTING_FASHION: Record<Role, string[]> = {
    ROCKERBOY: ['Urban Flash Outfit', 'Techhair'],
    SOLO: ['Nomad Leathers Outfit'],
    NETRUNNER: ['Urban Flash Outfit'],
    TECH: ['Bag Lady Chic Outfit', 'Skinwatch'],
    MEDTECH: ['Generic Chic Outfit'],
    MEDIA: ['Businesswear Outfit'],
    LAWMAN: ['Generic Chic Outfit'],
    EXEC: ['Businesswear Outfit', 'High Fashion Outfit'],
    FIXER: ['Urban Flash Outfit'],
    NOMAD: ['Nomad Leathers Outfit'],
}

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

