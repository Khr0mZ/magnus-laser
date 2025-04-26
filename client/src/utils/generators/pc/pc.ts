export const randomPCs = [
    {
        APPEARANCE: {
            Clothes: [
                'Biker leathers',
                'Blue jeans',
                'Corporate Suits',
                'Jumpsuits',
                'Miniskirts',
                'High Fashion',
                'Cammos',
                'Normal clothes',
                'Nude',
                'Bag Lady chic',
            ],
            Hairstyle: [
                'Mohawk',
                'Long & Ratty',
                'Short & Spiked',
                'Wild & all over',
                'Bald',
                'Striped',
                'Tinted',
                'Neat, short',
                'Short, curly',
                'Long, straight',
            ],
            Affectations: [
                'Tatoos',
                'Mirrorshades',
                'Ritual Scars',
                'Spiked gloves',
                'Nose Rings',
                'Earrings',
                'Long fingernails',
                'Spike heeled boots',
                'Weird Contact Lenses',
                'Fingerless gloves',
            ],
            Origins: [
                'Anglo-American (English)',
                'African (Bantu, Fante, Kongo, Ashanti, Zulu, Swahili)',
                'Japanese/Korean (Japanese or Korean)',
                'Central European/Soviet (Bulgarian, Russian, Czech, Polish, Ukranian, Slovak)',
                'Pacific Islander (Microneasian, Tagalog, Polynesian, Malayan, Sudanese, Indonesian, Hawaiian)',
                'Chinese/Southeast Asian (Burmese, Cantonese, Mandarin, Thai, Tibetan, Vietnamese)',
                'Black American (English, Blackfolk)',
                'Hispanic American (Spanish, English)',
                'Central /SouthAmerican (Spanish, Portuguese)',
                'European (French, German, English, Spanish, Italian, Greek, Danish, Dutch, Norwegian, Swedish, Finnish)',
            ],
        },
        ARMOR: [
            {
                name: 'Leathers',
                sp: 4,
            },
            {
                name: 'Kevlar',
                sp: 7,
            },
            {
                name: 'Bodyweight Suit',
                sp: 11,
            },
            {
                name: 'Light Armorjack',
                sp: 11,
            },
            {
                name: 'Heavy Armorjack',
                sp: 15,
            },
            {
                name: 'MetalGear',
                sp: 25,
            },
            {
                name: 'Cloth',
                sp: 0,
            },
        ],
        BACKGROUND: [
            'Your family lost everything through betrayal.',
            'Your family lost everything through bad management.',
            'Your family was exiled or otherwise driven from their original home/nation/Corporation.',
            'Your family is imprisoned and you alone escaped.',
            'Your family vanished. You are the only remaining member.',
            'Your family was killed and you were the only survivor.',
            'Your family is involved in a long–term conspiracy, organization, or association, such as a crime family or  revolutionary group.',
            'Your family was scattered to the winds due to misfortune.',
            'Your family is cursed with a hereditary feud that has lasted for generations.',
            ' You are the inheritor of a family debt; you must honor this debt before moving on with your life',
        ],
        CYBERWARE: [
            {
                name: 'Cyberarm',
                description: 'A Cyberweapon concealed in a cyberarm.',
            },
            {
                name: 'Cyberleg (Paired Jump Boosters)',
                description: 'You can leap 6 m/yds straight up or make a running jump of up to 8 m/yds.',
            },
            {
                name: 'Cyberaudio  (Amped Hearing)',
                description: 'Adds +1 to any sound–related Task Check.',
            },
            {
                name: 'Cyberaudio  (Radio Link)',
                description:
                    'Micro radio implant gives you the ability to talk to any receiver on the same band frequency for up to 1 mile/1.6km.',
            },
            {
                name: 'Cyberoptic  (Camera)',
                description: 'Images can be recorded on the built–in chip and downloaded to a recorder or Agent.',
            },
            {
                name: 'Cyberoptic  (Low Light)',
                description: 'You can see clearly in dim light (faint moonlight, distant street lamps).',
            },
            {
                name: 'Cyberoptic  (Targeting)',
                description: 'A built–in targeting sight allows you to add +1 to Marksmanship.',
            },
            {
                name: 'Interface Plugs',
                description: 'Sockets that allow user to interface with machines and cybertech.',
            },
            {
                name: 'Reflex Boost (Speedware)',
                description:
                    'You are boosted for five full Turns (+3 to Initiative Checks) before the boost cuts out. You must then wait 2 Turns before reboosting.',
            },
        ],
        WEAPONS: [
            {
                name: 'Cyberarm',
                data: { special: 'Melee', damage: '1d6', cyber: true },
            },
            {
                name: 'Kinfe',
                data: { special: 'Melee', damage: '1d6' },
            },
            {
                name: 'Big Knucks',
                data: { special: 'Melee', damage: '1d6', cyber: true },
            },
            {
                name: 'Medium Pistol',
                data: { damage: '2d6' },
            },
            {
                name: 'Medium SMG',
                data: { special: 'Burst', damage: '2d6' },
            },
            {
                name: 'Rippers',
                data: { special: 'Melee', damage: '2d6', cyber: true },
            },
            {
                name: 'Slice & Dice',
                data: { special: 'Melee', damage: '2d6', cyber: true },
            },
            {
                name: 'Heavy Pistol',
                data: { damage: '3d6' },
            },
            {
                name: 'Very Heavy Pistol',
                data: { damage: '4d6' },
            },
            {
                name: 'Assault Rifle',
                data: { special: 'Burst', damage: '5d6' },
            },
            {
                name: 'Shotgun',
                data: { damage: '5d6' },
            },
            {
                name: 'Missile Launcher',
                data: { special: 'Explosive', damage: '7d6' },
            },
            {
                name: 'C9 Explosive Pack',
                data: { special: 'Explosive', damage: '8d6' },
            },
        ],
        ENEMIES: [
            'Ex–friend',
            'Ex–lover',
            'Relative',
            'Childhood enemy ',
            'Person working for you',
            'Person you work for',
            'Partner or coworker ',
            'Booster gang member ',
            'Corporate Exec',
            'Government official',
        ],
        FRIENDS: [
            'Like an older sibling to you ',
            'Like a younger sibling to you ',
            'A teacher or mentor',
            'A partner or coworker ',
            'A former lover ',
            'An old enemy ',
            'Like a parent to you ',
            'An old childhood friend ',
            'A relative ',
            'Someone with a common interest',
        ],
        GOALS: [
            'Get rid of a bad reputation. ',
            'Gain power and control.',
            'Get off the street no matter what it takes.',
            'Cause pain and suffering to anyone who crosses you. ',
            'Live down your past life and try to forget it. ',
            'Hunt down those responsible for your life and make them pay. ',
            'Get what’s rightfully yours. ',
            'Save, if possible, anyone else involved in your background. ',
            'Gain fame and recognition. ',
            'Become feared and respected.',
        ],
        MOTIVATION: [
            'Money ',
            'Honor',
            'Your word',
            'Honesty ',
            'Knowledge ',
            'Vengeance ',
            'Love',
            'Power',
            'Having a good time',
            'Friendship',
        ],
        PERSONALITY: [
            'Shy and secretive ',
            'Rebellious, antisocial, violent ',
            'Arrogant, proud and aloof ',
            'Moody, rash and headstrong ',
            'Picky, fussy, and nervous ',
            'Stable and serious ',
            'Silly and fluff–headed',
            'Sneaky and deceptive ',
            'Intellectual and detached ',
            'Friendly and outgoing',
        ],
        ROLES: [
            'None',
            'Rockerboy',
            'Solo',
            'Netrunner',
            'Tech',
            'Media',
            'Lawman',
            'Exec',
            'Fixer',
            'Nomad',
            'Street Scum',
            'Booster',
            'Private Security',
        ],
        ROMANCE: [
            'Your lover died in an accident. ',
            'Your lover mysteriously vanished. ',
            'It just didn’t work out. ',
            'A personal goal or vendetta came between you and your lover. ',
            'Your lover was kidnapped. ',
            'Your lover went insane. ',
            'Your lover committed suicide.',
            'Your lover was killed in a fight.',
            'A rival cut you out of the action. ',
            'Your lover is imprisoned or exiled',
        ],
        STATS_BY_ROLE: [
            {
                name: 'Rockerboy',
                stats: [
                    {
                        int: 5,
                        ref: 8,
                        dex: 5,
                        tech: 4,
                        cool: 9,
                        will: 8,
                        luck: 6,
                        move: 6,
                        body: 10,
                        emp: 6,
                    },
                    {
                        int: 5,
                        ref: 10,
                        dex: 6,
                        tech: 3,
                        cool: 9,
                        will: 10,
                        luck: 6,
                        move: 6,
                        body: 10,
                        emp: 4,
                    },
                    {
                        int: 6,
                        ref: 10,
                        dex: 5,
                        tech: 3,
                        cool: 9,
                        will: 10,
                        luck: 7,
                        move: 5,
                        body: 8,
                        emp: 5,
                    },
                    {
                        int: 6,
                        ref: 9,
                        dex: 5,
                        tech: 6,
                        cool: 9,
                        will: 9,
                        luck: 5,
                        move: 6,
                        body: 8,
                        emp: 4,
                    },
                    {
                        int: 5,
                        ref: 10,
                        dex: 6,
                        tech: 3,
                        cool: 10,
                        will: 10,
                        luck: 6,
                        move: 6,
                        body: 8,
                        emp: 4,
                    },
                    {
                        int: 6,
                        ref: 10,
                        dex: 7,
                        tech: 4,
                        cool: 8,
                        will: 10,
                        luck: 5,
                        move: 7,
                        body: 9,
                        emp: 5,
                    },
                ],
            },
            {
                name: 'Solo',
                stats: [
                    {
                        int: 5,
                        ref: 8,
                        dex: 5,
                        tech: 4,
                        cool: 9,
                        will: 8,
                        luck: 6,
                        move: 6,
                        body: 10,
                        emp: 6,
                    },
                    {
                        int: 5,
                        ref: 10,
                        dex: 6,
                        tech: 3,
                        cool: 9,
                        will: 10,
                        luck: 6,
                        move: 6,
                        body: 10,
                        emp: 4,
                    },
                    {
                        int: 6,
                        ref: 10,
                        dex: 5,
                        tech: 3,
                        cool: 9,
                        will: 10,
                        luck: 7,
                        move: 5,
                        body: 8,
                        emp: 5,
                    },
                    {
                        int: 6,
                        ref: 9,
                        dex: 5,
                        tech: 6,
                        cool: 9,
                        will: 9,
                        luck: 5,
                        move: 6,
                        body: 8,
                        emp: 4,
                    },
                    {
                        int: 5,
                        ref: 10,
                        dex: 6,
                        tech: 3,
                        cool: 10,
                        will: 10,
                        luck: 6,
                        move: 6,
                        body: 8,
                        emp: 4,
                    },
                    {
                        int: 6,
                        ref: 10,
                        dex: 7,
                        tech: 4,
                        cool: 8,
                        will: 10,
                        luck: 5,
                        move: 7,
                        body: 9,
                        emp: 5,
                    },
                ],
            },
            {
                name: 'Netrunner',
                stats: [
                    {
                        int: 6,
                        ref: 7,
                        dex: 10,
                        tech: 7,
                        cool: 8,
                        will: 4,
                        luck: 10,
                        move: 5,
                        body: 5,
                        emp: 3,
                    },
                    {
                        int: 7,
                        ref: 10,
                        dex: 8,
                        tech: 6,
                        cool: 10,
                        will: 3,
                        luck: 10,
                        move: 7,
                        body: 6,
                        emp: 4,
                    },
                    {
                        int: 7,
                        ref: 9,
                        dex: 10,
                        tech: 7,
                        cool: 8,
                        will: 6,
                        luck: 8,
                        move: 7,
                        body: 7,
                        emp: 5,
                    },
                    {
                        int: 5,
                        ref: 10,
                        dex: 7,
                        tech: 7,
                        cool: 10,
                        will: 4,
                        luck: 7,
                        move: 7,
                        body: 5,
                        emp: 3,
                    },
                    {
                        int: 6,
                        ref: 9,
                        dex: 8,
                        tech: 6,
                        cool: 8,
                        will: 5,
                        luck: 8,
                        move: 6,
                        body: 5,
                        emp: 6,
                    },
                    {
                        int: 5,
                        ref: 9,
                        dex: 7,
                        tech: 7,
                        cool: 8,
                        will: 6,
                        luck: 7,
                        move: 6,
                        body: 5,
                        emp: 4,
                    },
                ],
            },
            {
                name: 'Tech',
                stats: [
                    {
                        int: 10,
                        ref: 10,
                        dex: 5,
                        tech: 9,
                        cool: 3,
                        will: 5,
                        luck: 7,
                        move: 6,
                        body: 5,
                        emp: 6,
                    },
                    {
                        int: 10,
                        ref: 7,
                        dex: 6,
                        tech: 9,
                        cool: 3,
                        will: 5,
                        luck: 5,
                        move: 5,
                        body: 6,
                        emp: 6,
                    },
                    {
                        int: 10,
                        ref: 7,
                        dex: 5,
                        tech: 10,
                        cool: 4,
                        will: 3,
                        luck: 7,
                        move: 5,
                        body: 7,
                        emp: 6,
                    },
                    {
                        int: 8,
                        ref: 8,
                        dex: 5,
                        tech: 10,
                        cool: 4,
                        will: 4,
                        luck: 7,
                        move: 6,
                        body: 5,
                        emp: 5,
                    },
                    {
                        int: 7,
                        ref: 7,
                        dex: 7,
                        tech: 9,
                        cool: 4,
                        will: 3,
                        luck: 6,
                        move: 6,
                        body: 6,
                        emp: 7,
                    },
                    {
                        int: 10,
                        ref: 10,
                        dex: 7,
                        tech: 8,
                        cool: 4,
                        will: 5,
                        luck: 6,
                        move: 6,
                        body: 7,
                        emp: 6,
                    },
                ],
            },
            {
                name: 'Media',
                stats: [],
            },
            {
                name: 'Lawman',
                stats: [],
            },
            {
                name: 'Exec',
                stats: [],
            },
            {
                name: 'Fixer',
                stats: [
                    {
                        int: 7,
                        ref: 6,
                        dex: 6,
                        tech: 3,
                        cool: 6,
                        will: 6,
                        luck: 7,
                        move: 5,
                        body: 6,
                        emp: 10,
                    },
                    {
                        int: 9,
                        ref: 5,
                        dex: 5,
                        tech: 5,
                        cool: 6,
                        will: 6,
                        luck: 8,
                        move: 5,
                        body: 5,
                        emp: 10,
                    },
                    {
                        int: 7,
                        ref: 5,
                        dex: 5,
                        tech: 5,
                        cool: 6,
                        will: 6,
                        luck: 10,
                        move: 5,
                        body: 5,
                        emp: 9,
                    },
                    {
                        int: 7,
                        ref: 6,
                        dex: 7,
                        tech: 7,
                        cool: 7,
                        will: 7,
                        luck: 7,
                        move: 7,
                        body: 6,
                        emp: 8,
                    },
                    {
                        int: 10,
                        ref: 5,
                        dex: 5,
                        tech: 5,
                        cool: 5,
                        will: 5,
                        luck: 10,
                        move: 6,
                        body: 5,
                        emp: 9,
                    },
                    {
                        int: 9,
                        ref: 5,
                        dex: 5,
                        tech: 5,
                        cool: 7,
                        will: 7,
                        luck: 10,
                        move: 7,
                        body: 5,
                        emp: 9,
                    },
                ],
            },
            {
                name: 'Nomad',
                stats: [
                    {
                        int: 6,
                        ref: 0,
                        dex: 9,
                        tech: 4,
                        cool: 7,
                        will: 9,
                        luck: 7,
                        move: 7,
                        body: 5,
                        emp: 6,
                    },
                    {
                        int: 5,
                        ref: 9,
                        dex: 7,
                        tech: 5,
                        cool: 9,
                        will: 9,
                        luck: 9,
                        move: 7,
                        body: 7,
                        emp: 3,
                    },
                    {
                        int: 6,
                        ref: 8,
                        dex: 8,
                        tech: 4,
                        cool: 7,
                        will: 8,
                        luck: 8,
                        move: 5,
                        body: 7,
                        emp: 4,
                    },
                    {
                        int: 7,
                        ref: 9,
                        dex: 7,
                        tech: 5,
                        cool: 8,
                        will: 8,
                        luck: 8,
                        move: 7,
                        body: 7,
                        emp: 4,
                    },
                    {
                        int: 7,
                        ref: 10,
                        dex: 9,
                        tech: 5,
                        cool: 7,
                        will: 10,
                        luck: 10,
                        move: 7,
                        body: 7,
                        emp: 4,
                    },
                    {
                        int: 6,
                        ref: 8,
                        dex: 9,
                        tech: 6,
                        cool: 8,
                        will: 7,
                        luck: 8,
                        move: 7,
                        body: 5,
                        emp: 3,
                    },
                ],
            },
            {
                name: 'Street Scum',
                stats: [
                    {
                        int: 3,
                        ref: 4,
                        dex: 7,
                        tech: 3,
                        cool: 2,
                        will: 4,
                        luck: 0,
                        move: 4,
                        body: 4,
                        emp: 2,
                    },
                ],
            },
            {
                name: 'Booster',
                stats: [
                    {
                        int: 4,
                        ref: 6,
                        dex: 8,
                        tech: 3,
                        cool: 4,
                        will: 4,
                        luck: 0,
                        move: 4,
                        body: 6,
                        emp: 3,
                    },
                ],
            },
            {
                name: 'Private Security',
                stats: [
                    {
                        int: 5,
                        ref: 6,
                        dex: 8,
                        tech: 3,
                        cool: 5,
                        will: 4,
                        luck: 0,
                        move: 4,
                        body: 5,
                        emp: 3,
                    },
                ],
            },
        ],
        SKILLS: [
            {
                stat: 'INT',
                name: 'Perception',
                description: 'Search for the Hidden; Detect Lies, Emotions',
            },
            {
                stat: 'INT',
                name: 'Tracking',
                description: 'Follow a Trail Left Behind',
            },
            {
                stat: 'INT',
                name: 'Education',
                description: 'Know Sciences, History, Trivia, Current Events',
            },
            {
                stat: 'INT',
                name: 'Local Expert',
                description: 'Know Local Area, Local Factions, Agendas —',
            },
            {
                stat: 'NET',
                name: 'Interface',
                description: 'Special “hacker” Skill available only to Netrunners',
            },
            {
                stat: 'REF',
                name: 'Marksmanship',
                description: 'Fire Ranged Weapons Accurately',
            },
            {
                stat: 'REF',
                name: 'Driving',
                description: 'Drive Vehicles Skillfully',
            },
            {
                stat: 'DEX',
                name: 'Evasion',
                description: 'Dodge Attacks You See Coming',
            },
            {
                stat: 'DEX',
                name: 'Athletics',
                description: 'Feats of Strength, General Athleticism.',
            },
            {
                stat: 'DEX',
                name: 'Stealth',
                description: 'Hiding and Moving Silently',
            },
            {
                stat: 'DEX',
                name: 'Brawling',
                description: 'Martial Fighting Using The Whole Body',
            },
            {
                stat: 'DEX',
                name: 'Melee',
                description: 'Weapon Fighting With Melee Weapons',
            },
            {
                stat: 'TECH',
                name: 'Basic Tech',
                description: 'Identify, Understand, and Repair Electronics',
            },
            {
                stat: 'TECH',
                name: 'Cybertech',
                description: 'Identify, Understand, and Repair Cybernetics',
            },
            {
                stat: 'TECH',
                name: 'First Aid',
                description: 'Patch Up Others and Yourself',
            },
            {
                stat: 'COOL',
                name: 'Bribery',
                description: 'Know When, Who and How Much to Bribe',
            },
            {
                stat: 'COOL',
                name: 'Interrogation',
                description: 'Forcibly Extract Info from People',
            },
            {
                stat: 'COOL',
                name: 'Persuasion',
                description: 'Convince, Persuade or Influence People',
            },
            {
                stat: 'WILL',
                name: 'Concentration',
                description: 'Focus, Memory, Mental Toughness',
            },
            {
                stat: 'EMP',
                name: 'Conversation',
                description: 'Extract Info Through Careful Conversation',
            },
            {
                stat: 'EMP',
                name: 'Human Perception',
                description: 'Read Faces, Bodies to Detect Lies, Emotions',
            },
            {
                stat: 'EMP',
                name: 'Play Instrument',
                description: 'Playing an Instrument and Writing Music',
            },
        ],
        GEAR: [
            {
                name: 'Agent',
                description: 'A pocket-sized machine which functions as a computer and a phone.',
            },
            {
                name: 'Guitar',
                description: 'Forty’s instrument of choice and most prized possession.',
                role: 'Rockerboy',
            },
            {
                name: '100 Eurobucks',
                description: 'A stack of unmarked bills.',
            },
            {
                name: 'Agent w/ Pseudo AI Secretary',
                description:
                    'A pocket sized machine which functions as a computer and a phone. This Agent has a secretary program.',
            },
            {
                name: 'Groundcar',
                description: 'A sedan-style ground card with enough room to hold 6 people.',
            },
            {
                name: 'Cyberdeck & Cables',
                description: 'A pocket sized machien used for Netrunning.',
                role: 'Netrunner',
            },
            {
                name: 'Programs',
                description: 'A set of programs for use with a cyberdeck',
                role: 'Netrunner',
            },
            {
                name: 'Black ICE',
                description: 'A program used with a cyberdeck.',
                role: 'Netrunner',
            },
            {
                name: 'Technical Toolbox & Tools',
                description:
                    'A large box filled with a number of tools to allow you to make repairs on basic tech & cybertech.',
            },
            {
                name: 'Motorcycle',
                description: 'A street bike with enough room to fit seat two people.',
            },

            // The clothing styles of 2020 break into five basic fashion statements:
            // Generic Chic:
            // This is the standard Streetwear, made up of colorful modular components in many colors. Belts, coats, sashes, boots predominate.
            // lelsurewear:
            // This is the equivalent of 21st century athletic wear. Padded fleece, corporate and athletic logos.
            // Buslnesswear:
            // This is the equivalent of the standard business suit; understated colors, pinstripes, real leather shoes etc. Wool and other natural fabrics are considered the proper outfitting for the up and coming Corp.
            // High Fashion:
            // Sophisticated and expensive dressing for the upper class. Designer labels like Miyake, SJ.fui Van, and Anne Calvin.
            // Urban Flash:
            // Video jackets, colorshift fabrics, cammo, leathers, metal spikes, Logowear, jeans, leather skirts, boots. The wildest and most \ltterly chilled in cyberfashion.

            // Tools
            {
                name: 'Tech scanner',
                description:
                    'A small handheld microcomp with various 1/0 connecters and probes. Techscanners run diagnostic programs, Identify and examine malfunctioning components, and display internal schematics on a small screen. ',
            },
            {
                name: 'Cutting Torch',
                description:
                    'Common oxy/acetalyne type out of a bottle. Hand held, about a foot long. More powerful models are available, up to thermite lances at 5x-15x cost. ',
            },
            {
                name: 'Tech Tool Kit',
                description: "Mixed kit of tools for repair of mechanical items, usually in a 4'x16'x2' case. ",
            },
            {
                name: 'Electronics Kit',
                description: "Mixed kit of tools for repair of electronic items, usually in a 4'x16'x2' case.",
            },
            {
                name: 'Protective Goggles',
                description: 'Protective eyewear for welding, metal machining work, chemical mixing, etc. ',
            },
            {
                name: 'Flashlight',
                description:
                    "You all know what this is. Beam range 100'-120' Can buy smaller pocket lights (1 /4 range) for half the normal price. ",
            },
            {
                name: 'Glowstik',
                description:
                    "Chemlight in a 6' plastic tube. Shake or break to activate. Soft light lasts up to 6 hours. Comes in green, blue, red. ",
            },
            {
                name: 'Flashpaint',
                description: 'Fluorescent paint gives off soft light equal to Glowstik, lasts up to 4 hours. ',
            },
            {
                name: 'Flashtape',
                description:
                    'Flourescent paint gives off soft light equal to Glowstik. Lasts 6 hours, comes in variety of widths. ',
            },
            {
                name: 'Rope',
                description: 'Braided synthetics in a variety of thicknesses and weights. Can hold up to 1,000 lbs. ',
            },
            {
                name: 'Breathing Mask',
                description:
                    "A common painter's style mask; nose and mouth coverage, with two replacable filters (1 eb per 1 0 pack) on the sides. Good for keeping out the smog. ",
            },
            {
                name: 'Personal Electronics Holo Generator',
                description:
                    "Small box (approx. 4 'x2'x6' inches) projects a holographic picture from a replacable chip. Generator is compatible with chips fcom most digital cameras. Can be linked with a digital Recorder/Player. ",
            },
            {
                name: 'Video Board',
                description:
                    "monitor using flat-LCD technology. No thicker than an Inch, most video boards are built Into TVs, but all types have Input plugs for use as a readout monitor for other electronic products. large ones (20'x100') are used as advertising signs. Videoboards are bought by the square foot. ",
            },
            {
                name: 'Datachip',
                description:
                    'The storage medium of the future for holding digital information. Usually plastic-cased, chips come in the shape of buttons, flat squares, and triangular slivers. All shapes can be read by all types of recording media by use of adapter plugs. ',
            },
            {
                name: 'Logcompass',
                description:
                    'A form of programmable inertial compassthat keeps track of your changes in direction from a fixed bearing or point. ',
            },
            {
                name: 'Digital Recorder',
                description:
                    'Audio recording device using datachip technology, most are the size of two paperback books stacked flat. Some are smaller that a pack of cards. ',
            },
            {
                name: 'Digital Camera',
                description:
                    "Still images are 'digitized' onto a chip cartridge. About the size of a pack of cigarettes. ",
            },
            {
                name: 'VideoCam',
                description:
                    'Can be mounted on a headset, a shoulder clamp, or hand-held depending on size (This affects price, size of recorded image, duration of recording time,etc. The price given is for the most inexpensive shoulder-carried model.) Sound and image are usually recorded on a tape·pak that is the size of a card deck or smaller, but you can direct-feed to a transmission device with a set of cables. ',
            },
            {
                name: 'Video/audio Tape Player',
                description: 'This device plays the videocam tape·paks, along with many older-style audio tapes. ',
            },
            {
                name: 'Video Tape',
                description:
                    'The video tape of 2020 is a high density digital media capable of handling both audio and visual images. ',
            },
            {
                name: 'Pocket TV',
                description:
                    "Uses a flat-scan screen in a package 5'x5'x3/4\" or smaller. Picks up the majority of VHF, UHF stations. ",
            },
            {
                name: 'Digital Chip Player',
                description:
                    'This plays audio- and video-recorded chips. You must plug into a video board to play the video track of a digital chip. ',
            },
            {
                name: 'Digital Music Chip',
                description:
                    '1 to 6 pop album favorites (or any other music) slapped into semiconductors and plastic. These chip are also available in a read-write format as well. ',
            },
            {
                name: 'Electric Guitar',
                description:
                    'No longer the classic "axe", it\'s now lighter, more flexible in its applications, and sometimes not even in a recognizable shape. It may have even replaced the strings and frets with a series of key banks! ',
            },
            {
                name: 'Electronic Keyboard',
                description: 'Little changed from the present, except in size and power. ',
            },
            {
                name: 'Drum Synthesizers',
                description:
                    "Common 'new-wave'music equipment; a series of percussion pads and a sound box. It will fit In a couple of suitcases and can be arranged anyway the drummer plea.ses. ",
            },
            {
                name: 'Amplifier',
                description: 'Little changed from the present, except in size and power ',
            },
            {
                name: 'Laptop Computer',
                description:
                    'The common portable, with internal hard drive, video board (detachable), and slots for data/ programming chips. These units do not have the advanced CPUs and memory spaces available in a regular computer system; they cannot be used for Netrunning. ',
            },
            {
                name: 'Pocket Computer',
                description:
                    "The classic 6'x3'x1 /2' programmable calculator with keyboard and chip slots, up to 100 pages of alphanumeric memory.",
            },
            {
                name: 'Cybermodem',
                description: 'see Netrunning section. Cellular Cybermodem',
            },
            {
                name: 'Interface Cables',
                description:
                    "Typical plug ended splicing cables going from a cyber-operated machine to a person's interface sockets. ",
            },
            {
                name: 'Low Impedance Cables',
                description:
                    'Special low-resistance/interferance cables for improved data transfer; they confer a + 1 bonus on any interfacing tasks, such as controlling cybervehicles or Netrunning.',
            },
            {
                name: 'Trode Set',
                description: "A low efficency headset for 'piggybacking' in the Net. -2 to Interface skill.",
            },
            {
                name: 'Keyboard',
                description: 'Can be accessorized to your cybermodem or other electronic equipment.',
            },
            {
                name: 'Terminal',
                description:
                    'A computer workstation including keyboard, video board, and 1/0 connectors. A terminal can be used to Netrun (making the runner immune to most Black software), but is very, very slow (-5 to Interface Skills). Terminal operators are commonly known as "net-tortoises"',
            },
            {
                name: 'Communications Mastoid Commo',
                description:
                    'All commos are radio transceivers. This one is glued to the jaw and temple; you send via subvocalization and receive with soundless vibrations. Range 10 miles. ',
            },
            {
                name: 'Pocket Commo',
                description: 'A typical small walkie-talkie. Range 10 miles. ',
            },
            {
                name: 'Binoculars',
                description: "'Nuff said.",
            },
            {
                name: 'Binoglasses',
                description:
                    'These high-tech . vision aids combine binocular effects with a laser rangefinder, and sometimes IR lenses. More expensive versions will have a digital camera built in. ',
            },
            {
                name: 'LB Goggles',
                description:
                    "Light intensification goggles boost ambient light for night vision via 'Starlite' technology. Goggles can be overwhelmed by sudden light level increase. With tuning (DIFFICULT task), they can also detect active IR beams. ",
            },
            {
                name: 'IR Goggles',
                description:
                    'These pick up hazy, background Infrared sources. Normally used with an active IR source for invisible illumination. ',
            },
            {
                name: 'IR Flashlight',
                description:
                    'These pick up hazy, background Infrared sources. UV flash is similar; also useable with the proper cyberoptic. ',
            },
            {
                name: 'Cardlock Decryptor',
                description:
                    'The probe of this device is inserted into a card lock instead of the normal card. A Decrypt or operates by adding +5 to your bas· TECH+Eiectronic Security+ 1d10 skill check against the lock. ',
            },
            {
                name: 'VocDecryptor',
                description:
                    'A vocal modulator for penetrating vocolocks. See above. A Decrypt or operates by adding +5 to your bas· TECH+Eiectronic Security+ 1d10 skill check against the lock. ',
            },
            {
                name: 'Security Scanner',
                description:
                    'This device searches out electromagnetic fields generated by various alarm systems (75% chance of location). A TECH or INT roll may be needed to identify the style of alarm encountered. ',
            },
            {
                name: 'Polson Sniffer',
                description:
                    'Can be set to check air or liquid for a specific poison(s). Otherwise, it will simply alert you to foreign substances. 85% accuracy. ',
            },
            {
                name: 'Jamming Transmitter',
                description:
                    'Usually comes in 2 or 3 large cases, but can fill an entire van. jams electromagetic transmissions in a 1 000 foot area (that includes cellular phones and some cyberware). ',
            },
            {
                name: 'Scanner Plate',
                description:
                    'A reading device for palmprint locks. Can be attached to any type of Card or Voclock to add an extra layer of security. ',
            },
            {
                name: 'Movement Sensor',
                description:
                    'A typical alarm system. Covers seismic, sonar, and fixed IR or visible light networks. Detects movement in a defined area, with a 95% reliability. The sensory processro is about the size of a pack of cigarettes. ',
            },
            {
                name: 'Passcard',
                description: 'The most common unlocking device for a cardlock. ',
            },
            {
                name: 'Tracking Device',
                description:
                    'Hand held or suitcased equipment for detecting/following tracer buttons. Range is 1 mile. ',
            },
            {
                name: 'Tracer Buttons',
                description:
                    "Can be any size from a matchbook to a pin. Uses radioactivity or constant/pulsed radio transmission to pinpoint who or what it's attached to. Some can be turned on/off remotely. Usually bought in sets of 6. ",
            },
            {
                name: 'Handcuffs',
                description:
                    'Just what it says. Probably a little stronger (a NEARLY IMPOSSIBLE task to break) due to new alloys. Often (50%) opened with a form of cardlock. ',
            },
            {
                name: 'Striptape Binders',
                description:
                    'Great for riot control. One-use-only plastic locking strips for temporary handcuffs and leg ties (VERY DIFFICULT to break). With ceramic fibers to resist cutting, and guaranteed fireproof. Come in boxes of 12. ',
            },
            {
                name: 'Dermal Stapler',
                description:
                    'This automatically pulls the sides of a wound together and sutures it with staples of a compressed organic material that dissolves after an elapsed time. ',
            },
            {
                name: 'Spray Skin',
                description:
                    "A putty-like spray gel for treatment of severe abrasions. Antiseptic and sterile, it's also air permeable and flakes off in about two weeks. ",
            },
            {
                name: 'Cryotank',
                description:
                    'An advanced refrigeration tank; the cryotank will cool a body down to preservation levels while life-support machines maintain the blood/oxygen flow. Designed to keep a dying body In relative stasis. ',
            },
            {
                name: 'Medkit',
                description:
                    "Standard doctor's or military corpsman's bag. It contains antidotes, dressings, drugs, applicators, medicines, and examining Instruments (probes, depressors, ocular light, stethoscope). ",
            },
            {
                name: 'Surgical Set',
                description:
                    "A full set of surgeon's tools (scalpel, retractor, probe, damp, tweezer, etc.}, and chemicals or equipment for maintaining a sterile operating field. ",
            },
            {
                name: 'First Aid Kit',
                description:
                    "The common household medic's box. It has bandages, antiseptics, and a simple painkiller. ",
            },
            {
                name: 'Slap Patch',
                description:
                    'A small plutic pad containing a measured amount of medicine. The pad Is applied to the skin and the mediclne Is absorbed in steady doses. See the Trouma Team section for drugs and prices. ',
            },
            {
                name: 'Airhypo',
                description:
                    "The 'Bones McCoy' uses a quick burst of compressed air to force a liquid drug through the skin. See the Trauma Team section for drugs and prices. ",
            },
            {
                name: 'Medscanner',
                description:
                    'Readouts for body temperature, heartrate, blood pressure, respiration, and blood sugar levels. A small chipped database adds a +2 to your Diagnose Skill. ',
            },
            {
                name: 'Drug Analyser',
                description:
                    'Ranging in size from a book to a briefcase, this gaget operates in a manner simular to the chemical sniffer. It will determine the purity of a drug with a known composition, or ldentfy the molecular makeup and possible effects of an unknown substance that is simular to a drug already programmed into its library. ',
            },
            {
                name: 'Scooter',
                description:
                    "This is an updated, electrically powered version of the old Riva and Vespa motorscooters of the 1990's. Top speed about 50 mph, scooters can get about 6 hours of travel per fastcharge (about 5 minutes at any service station). ",
            },
            {
                name: 'CityCar',
                description:
                    'One man (two In a pinch), three wheelers common in the Corporate Zones. Top speed about 40mph, with 4 hours travel per fastcharge. CityCars can also be rented (2· .. eb per mile) from convenient kiosks located around most corporate areas; you use your debit card to rent from the vendor, drive where you want, and drop the car off at the nearest vendor.',
            },
            {
                name: 'Small Subcompact',
                description:
                    'Usually methanol or CHOOH2 powered, these vehicles have a top speed of around 90mph, a ten gallon tank and seat four in relative comfort.',
            },
            {
                name: 'Medium Sedan',
                description:
                    'Methanol or CHOOH2 powered, these vehicles have a top speed of around 90mph, a fifteen gallon tank and seat four.',
            },
            {
                name: 'Sportscar',
                description:
                    "Almost always CHOOH2 powered (electrics /ust don't have the speed). Top speed about21 0, with a ten ga ion tank. Seats 2.",
            },
            {
                name: 'Luxury Sedan',
                description:
                    'MethanolorCHOOH2 powered, these vehicles have a top speed of around 90mph, a twenty gallon tank and seat six.',
            },
            {
                name: 'Fastcharge',
                description:
                    'Rapid (S minutes) battery-recharge for electric vehicles. Available at most service stations for 20 eb per charge.',
            },
            {
                name: 'CHOOH2',
                description:
                    'Synthetic meta-alcohol fuel. About 1 D6/3+ 1 euro per gallon (the cost fluctuates wildly due to supply, demand and ceo-terrorist activities).',
            },
            {
                name: 'Kibble',
                description:
                    'A mass-produced nutrient that satisfies most requirements for sustenance, but tends to look, smell, and tute like the dry pet food it takes its name from.',
            },
            {
                name: 'Generic Prepack',
                description:
                    "A step up from the common TV dinner, thesemealpac.kscanbemkrowavedorrelrigerateddepending on What's inside. Many come with their own chemtabs for heating or cooling. The cuisine isn't inspired, but it beats kibble.",
            },
            {
                name: 'Good Prepack',
                description:
                    "Good restaurant meals in a package. The best quality pre·made meals you're going to find. For anything better, eat out, or prep It yourself (and who really knows how to do that anymore?).",
            },
            {
                name: 'Fresh',
                description: "You know what that Is. Well, at least you've met someone who's eaten it.",
            },
        ],
    },
]
