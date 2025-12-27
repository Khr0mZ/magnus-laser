// ============================================
// SOLO PLAY RANDOM TABLES
// Based on Cyberpunk RED Single Player Mode
// ============================================

// === ORACLE ANSWER TABLE (2d6 + modifier) ===
// 2: Extreme No, 3-4: No And, 5-6: No, 7: Maybe, 8-9: Yes But, 10-11: Yes, 12: Extreme Yes
export const oracleAnswerTable = {
    2: 'EXTREME_NO',
    3: 'NO_AND',
    4: 'NO_AND',
    5: 'NO',
    6: 'NO',
    7: 'MAYBE',
    8: 'YES_BUT',
    9: 'YES_BUT',
    10: 'YES',
    11: 'YES',
    12: 'EXTREME_YES',
} as const

// === ACTION FOCUS TABLE (d100) ===
export const actionFocusTable = [
    'Acquire', 'Activate', 'Advance', 'Alter', 'Ambush', 'Analyze', 'Announce',
    'Attack', 'Avoid', 'Bargain', 'Betray', 'Block', 'Break', 'Build', 'Capture',
    'Challenge', 'Change', 'Chase', 'Claim', 'Close', 'Communicate', 'Compete',
    'Complete', 'Conceal', 'Confront', 'Connect', 'Control', 'Convince', 'Create',
    'Damage', 'Deceive', 'Defend', 'Delay', 'Deliver', 'Deny', 'Depart', 'Destroy',
    'Detain', 'Develop', 'Disable', 'Discover', 'Disrupt', 'Distract', 'Dominate',
    'Eliminate', 'Embrace', 'Encourage', 'End', 'Escape', 'Establish', 'Evade',
    'Examine', 'Exchange', 'Explore', 'Expose', 'Extract', 'Fight', 'Find', 'Finish',
    'Flee', 'Follow', 'Force', 'Free', 'Gather', 'Guard', 'Guide', 'Hack', 'Harm',
    'Help', 'Hide', 'Hunt', 'Identify', 'Ignore', 'Imprison', 'Improve', 'Infiltrate',
    'Influence', 'Inform', 'Injure', 'Inspect', 'Interfere', 'Interrogate', 'Intimidate',
    'Invade', 'Investigate', 'Join', 'Judge', 'Keep', 'Kill', 'Lead', 'Learn', 'Leave',
    'Lure', 'Maintain', 'Manipulate', 'Monitor', 'Move', 'Negotiate', 'Observe',
]

// === DETAIL FOCUS TABLE (d100) ===
export const detailFocusTable = [
    'Abandoned', 'Aggressive', 'Ancient', 'Armed', 'Artificial', 'Beautiful',
    'Biological', 'Bizarre', 'Blocked', 'Bloody', 'Broken', 'Burned', 'Busy',
    'Calm', 'Captured', 'Chaotic', 'Clean', 'Cold', 'Colorful', 'Common',
    'Complex', 'Concealed', 'Conflicted', 'Connected', 'Controlled', 'Corrupted',
    'Crowded', 'Cruel', 'Cybernetic', 'Damaged', 'Dangerous', 'Dark', 'Dead',
    'Deadly', 'Decaying', 'Deceptive', 'Defended', 'Desperate', 'Destroyed',
    'Different', 'Difficult', 'Dirty', 'Disguised', 'Distant', 'Divided',
    'Dominated', 'Dormant', 'Electronic', 'Elite', 'Empty', 'Encrypted',
    'Enormous', 'Exclusive', 'Expensive', 'Experimental', 'Exposed', 'Extreme',
    'Failed', 'Fake', 'Familiar', 'Famous', 'Fast', 'Feared', 'Fierce', 'Filthy',
    'Final', 'Flawed', 'Fortified', 'Fresh', 'Functional', 'Futuristic', 'Glitched',
    'Guarded', 'Haunted', 'Hazardous', 'Heavy', 'Hidden', 'High-Tech', 'Hostile',
    'Huge', 'Illegal', 'Immense', 'Important', 'Incomplete', 'Infected', 'Influential',
    'Innovative', 'Intelligent', 'Intense', 'Invisible', 'Isolated', 'Large',
    'Legendary', 'Lethal', 'Limited', 'Locked', 'Lonely', 'Lost', 'Loud', 'Low-Tech',
]

// === NPC MOTIVATION TABLE ===
export const npcMotivationTable = [
    'Achieve power', 'Acquire wealth', 'Aid someone', 'Avoid detection',
    'Avenge a wrong', 'Build something', 'Change the system', 'Collect debts',
    'Complete a mission', 'Control territory', 'Create art', 'Destroy evidence',
    'Eliminate competition', 'Escape the past', 'Expand influence', 'Explore the unknown',
    'Find a person', 'Find answers', 'Free someone', 'Gain fame', 'Gain knowledge',
    'Get revenge', 'Guard something', 'Help the oppressed', 'Hide from enemies',
    'Improve skills', 'Infiltrate an organization', 'Investigate a crime',
    'Maintain order', 'Make a deal', 'Manipulate others', 'Obtain an item',
    'Overthrow leadership', 'Pay off debts', 'Protect family', 'Protect secrets',
    'Prove themselves', 'Pursue pleasure', 'Recruit members', 'Recover something stolen',
    'Redeem themselves', 'Repay a favor', 'Research technology', 'Restore reputation',
    'Sabotage a rival', 'Save a life', 'Seek excitement', 'Seek justice',
    'Seek truth', 'Serve a master', 'Spread ideology', 'Start a business',
    'Steal technology', 'Stop a threat', 'Survive', 'Take control', 'Track someone',
    'Trade goods', 'Uncover corruption', 'Undermine authority',
]

// === NPC MOOD/DISPOSITION TABLE ===
export const npcMoodTable = [
    'Aggressive', 'Amused', 'Annoyed', 'Anxious', 'Apathetic', 'Arrogant',
    'Bitter', 'Bored', 'Calm', 'Cautious', 'Cheerful', 'Cold', 'Confident',
    'Confused', 'Contemptuous', 'Cooperative', 'Curious', 'Cynical', 'Defensive',
    'Depressed', 'Desperate', 'Determined', 'Dismissive', 'Distracted', 'Doubtful',
    'Eager', 'Enthusiastic', 'Envious', 'Excited', 'Exhausted', 'Fearful',
    'Focused', 'Friendly', 'Frustrated', 'Greedy', 'Guilty', 'Happy', 'Hateful',
    'Helpful', 'Hesitant', 'Honest', 'Hopeful', 'Hostile', 'Humble', 'Impatient',
    'Indifferent', 'Intrigued', 'Irritated', 'Jealous', 'Joyful', 'Lonely',
    'Menacing', 'Mischievous', 'Mysterious', 'Nervous', 'Neutral', 'Obsessed',
    'Optimistic', 'Paranoid', 'Patient', 'Pessimistic', 'Proud', 'Regretful',
    'Relaxed', 'Resentful', 'Resigned', 'Restless', 'Sad', 'Sarcastic',
    'Satisfied', 'Scared', 'Secretive', 'Serious', 'Skeptical', 'Sleepy',
    'Smug', 'Somber', 'Stressed', 'Stubborn', 'Surprised', 'Suspicious',
    'Sympathetic', 'Tense', 'Thoughtful', 'Tired', 'Trusting', 'Uncomfortable',
    'Uneasy', 'Unfriendly', 'Vengeful', 'Wary', 'Weary', 'Worried',
]

// === LOCATION TYPE TABLE ===
export const locationTypeTable = [
    'Abandoned factory', 'Alleyway', 'Apartment complex', 'Arena', 'Back room',
    'Bar', 'Black market', 'Bodega', 'Bridge', 'Brothel', 'Bunker', 'Casino',
    'Cemetery', 'Church', 'Club', 'Combat zone', 'Construction site', 'Container yard',
    'Corporate office', 'Cyberware clinic', 'Data haven', 'Diner', 'Docks',
    'Drug den', 'Embassy', 'Factory floor', 'Fast food joint', 'Fixer hideout',
    'Garage', 'Garden', 'Gas station', 'Government building', 'Gym', 'Highway',
    'Hospital', 'Hotel lobby', 'Hotel room', 'Industrial zone', 'Junkyard',
    'Laboratory', 'Library', 'Loading dock', 'Mall', 'Mansion', 'Market stall',
    'Medical facility', 'Megabuilding floor', 'Metro station', 'Morgue', 'Museum',
    'Nightclub', 'Office building', 'Parking garage', 'Park', 'Penthouse',
    'Police station', 'Power plant', 'Prison', 'Private residence', 'Ripperdoc clinic',
    'Rooftop', 'Safe house', 'Scav hideout', 'School', 'Sewer tunnel', 'Shop',
    'Slum', 'Sports facility', 'Street corner', 'Strip club', 'Studio apartment',
    'Subway tunnel', 'Tech workshop', 'Temple', 'Theater', 'Transit hub',
    'Underground bunker', 'Underpass', 'Vacant lot', 'Vehicle', 'Warehouse',
    'Weapons shop', 'Workshop',
]

// === EVENT TABLE ===
export const eventTable = [
    'Alarm triggered', 'Ambush', 'Assassination attempt', 'AV crash nearby',
    'Blackout', 'Bomb threat', 'Braindance broadcast', 'Brawl breaks out',
    'Checkpoint', 'Chemical spill', 'Combat breaks out', 'Corporate raid',
    'Crowd gathering', 'Cyberpsycho attack', 'Data breach', 'Deal gone wrong',
    'Demonstration', 'Drone attack', 'Drug bust', 'Earthquake', 'Equipment failure',
    'Evacuation', 'Explosion', 'Fire', 'Flash flood', 'Gang fight', 'Gas leak',
    'Hacker attack', 'Heavy rain', 'Hostage situation', 'Important arrival',
    'Kidnapping in progress', 'Lockdown', 'Medical emergency', 'Meeting',
    'Netrunner attack', 'News crew arrives', 'NCPD patrol', 'Party', 'Police chase',
    'Power outage', 'Protest', 'Public execution', 'Raid', 'Reconnaissance',
    'Riot', 'Robbery', 'Scav attack', 'Shootout', 'Smuggling operation',
    'Sniper attack', 'Standoff', 'Street race', 'Supply delivery', 'Surveillance',
    'Trauma Team arrival', 'Vehicle accident', 'VIP escort', 'Weapon discharge',
]

// === COMPLICATION TABLE ===
export const complicationTable = [
    'Accomplice betrays', 'Alarm is triggered', 'Ally is captured',
    'Ally is in danger', 'Ambush incoming', 'Area is crowded', 'Area is locked down',
    'Asset is damaged', 'Asset is fake', 'Asset is missing', 'Backup arrives',
    'Betrayal revealed', 'Bystanders endangered', 'Communication blackout',
    'Contact disappears', 'Contact is dead', 'Critical item breaks', 'Deadline moves up',
    'Deal changes', 'Enemy reinforcements', 'Enemy was warned', 'Evidence discovered',
    'Extraction compromised', 'False intel', 'Gear malfunctions', 'Hidden agenda',
    'Hostages taken', 'Identity compromised', 'Innocent involved', 'Inside job',
    'Intel is wrong', 'Interference from third party', 'Item is trapped',
    'Location changed', 'Mission objective changes', 'More enemies than expected',
    'NCPD involvement', 'New enemy appears', 'No exit route', 'Objective destroyed',
    'Objective moved', 'Payment delayed', 'Personal connection', 'Price goes up',
    'Resource shortage', 'Route blocked', 'Security increased', 'Setup revealed',
    'Someone followed', 'Target escapes', 'Target has backup', 'Target is armed',
    'Target knows crew', 'Technology fails', 'Third party intervenes',
    'Time runs out', 'Trauma Team involved', 'Unexpected witness', 'Valuable destroyed',
    'Weather worsens',
]

// === TWIST TABLE ===
export const twistTable = [
    'A hidden ally reveals themselves', 'A new threat emerges', 'A secret is revealed',
    'A third party takes the prize', 'All is not as it seems', 'Ally has been compromised',
    'An old enemy returns', 'Asset is more valuable than thought', 'Betrayal from within',
    'Client had ulterior motives', 'Connection to past mission', 'Deadline is extended',
    'Enemy becomes ally', 'Enemy is actually family', 'Enemy was right all along',
    'Everything was a test', 'False identity revealed', 'Hidden surveillance discovered',
    'It was personal all along', 'Job connects to bigger conspiracy', 'Location has history',
    'Missing person reappears', 'More at stake than realized', 'New information changes everything',
    'No one is innocent', 'NPC has secret agenda', 'Object has hidden function',
    'Opportunity arises', 'Past actions have consequences', 'Payment is not what expected',
    'Power dynamics shift', 'Prize is worthless', 'Rescue becomes capture',
    'Secret passage discovered', 'Someone else got there first', 'Target is an imposter',
    'Target is innocent', 'The dead are not dead', 'The fixer is played',
    'Third faction involved', 'Time loop', 'True employer revealed', 'Unexpected ally appears',
    'Unlikely partnership forms', 'Valuable information gained', 'Victim becomes threat',
    'Wrong person targeted',
]

// === CLUE TYPE TABLE ===
export const clueTypeTable = [
    'Audio recording', 'Bank records', 'Blackmail material', 'Blood sample',
    'Body part', 'Braindance', 'Business card', 'Camera footage', 'Chemical residue',
    'Clothing item', 'Corporate memo', 'Cyberware component', 'Data shard',
    'Diary entry', 'Digital footprint', 'DNA sample', 'Document', 'Drug sample',
    'Email chain', 'Encrypted file', 'Eyewitness', 'Financial records', 'Fingerprints',
    'Gang tag', 'GPS data', 'Hacked file', 'Hidden camera', 'Hidden compartment',
    'ID badge', 'Implant data', 'Informant tip', 'Intercepted communication',
    'Invoice', 'Key card', 'License plate', 'Location coordinates', 'Locked device',
    'Medical records', 'Meeting notes', 'Memory chip', 'Message fragment',
    'Missing person report', 'Murder weapon', 'Net trace', 'News article',
    'Personal effects', 'Phone records', 'Photo', 'Physical evidence', 'Police report',
    'Ransom note', 'Receipt', 'Recording device', 'Rumor', 'Scheduled meeting',
    'Security log', 'Shell casing', 'Surveillance data', 'Tattoo', 'Text messages',
    'Threat letter', 'Tire tracks', 'Transaction record', 'Vehicle description',
    'Video file', 'Voice message', 'Weapon serial', 'Witness statement',
]

// === RUMOR TABLE ===
export const rumorTable = [
    'A bounty was placed on someone important', 'A corpo exec went missing',
    'A data fortress was breached', 'A fixer is looking for a crew',
    'A gang is about to make a move', 'A hidden lab was discovered',
    'A major deal is going down tonight', 'A new drug is on the streets',
    'A new gang is moving in', 'A nomad convoy was attacked',
    'A powerful cyberpsycho is loose', 'A ripperdoc is offering discounts',
    'A secret meeting is scheduled', 'A smuggling route was compromised',
    'A traitor was identified', 'A valuable cargo shipment is arriving',
    'A VIP is in town', 'An AI has escaped containment',
    'An assassination is planned', 'An old legend returned to Night City',
    'Bodies are showing up in the combat zone', 'Corporate merger is happening',
    'Cyberware shortage is coming', 'Drug prices are about to spike',
    'Fixer turf war is brewing', 'Gang alliance is forming',
    'Government crackdown is coming', 'Hidden data cache was found',
    'Important person is in hiding', 'Major gang leader was killed',
    'NCPD is planning a raid', 'Netwatch is active in the area',
    'New black market opened', 'New corpo weapons are being tested',
    'Political scandal is breaking', 'Power struggle in local gang',
    'Protected witness is being moved', 'Rare cyberware is available',
    'Safe house was compromised', 'Someone is hiring for a big job',
    'Street war is coming', 'Tech prototype was stolen',
    'The fixer network is compromised', 'Underground fights are happening',
    'Valuable info is for sale', 'Witness protection failed',
]

// === NPC APPEARANCE TABLE ===
export const npcAppearanceTable = [
    'Athletic build', 'Average height', 'Bald', 'Beard', 'Braided hair',
    'Buzz cut', 'Chrome arm', 'Chrome eyes', 'Colorful hair', 'Corporate suit',
    'Covered in tattoos', 'Cybernetic jaw', 'Dreadlocks', 'Earrings', 'Facial scars',
    'Fashionable clothes', 'Gang colors', 'Glasses', 'Glowing implants', 'Goatee',
    'Heavy build', 'Heavy cyberware', 'Hidden weapons', 'Hood', 'Jacket',
    'Leather clothes', 'Long coat', 'Long hair', 'Mask', 'Mechanical limb',
    'Military gear', 'Mohawk', 'Muscle implants', 'Nervous tic', 'Neon accents',
    'No visible cyberware', 'Old scars', 'Overweight', 'Piercings', 'Ponytail',
    'Prosthetic arm', 'Prosthetic leg', 'Robotic hand', 'Shaved sides',
    'Short hair', 'Skinny', 'Street clothes', 'Sunglasses', 'Surgical mask',
    'Tall', 'Tattoo on face', 'Tattoo on neck', 'Tech gear', 'Trench coat',
    'Underweight', 'Uniform', 'Visible weapons', 'Weathered face', 'Well-groomed',
    'Work clothes',
]

// === NPC OCCUPATION TABLE ===
export const npcOccupationTable = [
    'Bartender', 'Bodyguard', 'Bouncer', 'Bounty hunter', 'Braindance editor',
    'Braindance star', 'Business owner', 'Chef', 'Cleaner', 'Club owner',
    'Combat instructor', 'Con artist', 'Corporate agent', 'Corporate exec',
    'Courier', 'Data broker', 'Dealer', 'Doctor', 'Driver', 'Drug manufacturer',
    'Engineer', 'Exotic dancer', 'Fixer', 'Gang leader', 'Gang member',
    'Government agent', 'Gun dealer', 'Hacker', 'Hitman', 'Homeless',
    'Informant', 'Journalist', 'Lawyer', 'Mechanic', 'Media personality',
    'Mercenary', 'Musician', 'NCPD officer', 'Netrunner', 'Nomad',
    'Pilot', 'Private investigator', 'Prostitute', 'Ripperdoc', 'Rockerboy',
    'Scav', 'Scientist', 'Security guard', 'Smuggler', 'Solo', 'Street kid',
    'Street vendor', 'Surgeon', 'Tech', 'Thief', 'Trauma Team medic',
    'Vagrant', 'Weapons tech',
]

// === WHO IS HIRING TABLE ===
export const whoIsHiringTable = [
    { type: 'FIXER', weight: 30 },
    { type: 'CORPO', weight: 15 },
    { type: 'GANG', weight: 15 },
    { type: 'GOVERNMENT', weight: 5 },
    { type: 'INDEPENDENT', weight: 15 },
    { type: 'MEDIA', weight: 5 },
    { type: 'NETRUNNER', weight: 5 },
    { type: 'NOMAD', weight: 5 },
    { type: 'CIVILIAN', weight: 5 },
]

// === MISSION TYPE TABLE ===
export const missionTypeTable = [
    'Assassination', 'Bodyguard', 'Bounty hunt', 'Courier', 'Data steal',
    'Demolition', 'Escort', 'Extraction', 'Heist', 'Hostage rescue',
    'Infiltration', 'Investigation', 'Kidnapping', 'Protection', 'Recon',
    'Recovery', 'Sabotage', 'Smuggling', 'Surveillance', 'Wetwork',
]

// === PAYMENT TYPE TABLE ===
export const paymentTypeTable = [
    { type: 'EDDIES', weight: 50 },
    { type: 'FAVOR', weight: 15 },
    { type: 'INFORMATION', weight: 10 },
    { type: 'EQUIPMENT', weight: 10 },
    { type: 'CYBERWARE', weight: 5 },
    { type: 'REPUTATION', weight: 5 },
    { type: 'MIXED', weight: 5 },
]

// === FIXER NAME TABLE ===
export const fixerNameTable = [
    'Angel', 'Blackjack', 'Blaze', 'Bones', 'Chrome', 'Cipher', 'Cobra',
    'Crimson', 'Dagger', 'Dante', 'Diamond', 'Echo', 'Eclipse', 'Edge',
    'Falcon', 'Frost', 'Ghost', 'Glitch', 'Hammer', 'Hawk', 'Hex',
    'Iron', 'Jade', 'Jet', 'Joker', 'Karma', 'Kira', 'Knight', 'Lightning',
    'Luna', 'Magnus', 'Maverick', 'Mercury', 'Mirage', 'Neon', 'Nero',
    'Nova', 'Onyx', 'Oracle', 'Phoenix', 'Pulse', 'Raven', 'Razor',
    'Rex', 'Riot', 'Ronin', 'Ruby', 'Sable', 'Shadow', 'Shark', 'Silver',
    'Slash', 'Smoke', 'Snake', 'Sparks', 'Specter', 'Spike', 'Static',
    'Steel', 'Storm', 'Striker', 'Surge', 'Talon', 'Tank', 'Tempest',
    'Titan', 'Torch', 'Trigger', 'Venom', 'Vex', 'Viper', 'Volt',
    'Whisper', 'Wolf', 'Wraith', 'Zero', 'Zigzag',
]

// === CORPO NAME TABLE ===
export const corpoNameTable = [
    'Arasaka', 'BioTechnica', 'Danger Gal', 'EBM', 'Euro Business Machines',
    'Kendachi', 'Kang Tao', 'Lazarus Group', 'Malorian Arms', 'Megacorp',
    'Microtech', 'Militech', 'Network News 54', 'Night Corp', 'Orbital Air',
    'Petrochem', 'Rocklin Augmentics', 'SovOil', 'Trauma Team', 'WorldSat',
    'Zetatech', 'Unknown corp', 'Subsidiary corp', 'Shell company', 'Front company',
]

// === GANG NAME TABLE ===
export const gangNameTable = [
    'Animals', 'Bozos', 'Brainiacs', 'Chrome Jockeys', 'Claws', 'Cobras',
    'Death Dealers', 'Dragoons', 'Fangs', 'Hoods', 'Iron Sights', 'Jackals',
    'Maelstrom', 'Mox', 'Neon Dragons', 'Night Wolves', 'Piranhas',
    'Razors', 'Red Hoods', 'Riptide', 'Scavengers', 'Steel Warriors',
    'Talons', 'The 6th Street', 'The Tyger Claws', 'The Valentinos',
    'The Voodoo Boys', 'Toxic Blades', 'Wraiths', 'Unknown gang', 'New gang',
]

// === QUICK DICE ROLL HELPERS ===
export const rollD6 = (): number => Math.floor(Math.random() * 6) + 1
export const rollD10 = (): number => Math.floor(Math.random() * 10) + 1
export const rollD100 = (): number => Math.floor(Math.random() * 100) + 1
export const roll2D6 = (): number => rollD6() + rollD6()

export const getRandomFromArray = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)]
}

export const getRandomFromWeightedArray = <T extends { type: string; weight: number }>(
    arr: T[]
): string => {
    const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    for (const item of arr) {
        random -= item.weight
        if (random <= 0) {
            return item.type
        }
    }
    return arr[arr.length - 1].type
}

