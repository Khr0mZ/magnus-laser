// ============================================
// SOLO PLAY EXPANDED TABLES
// Based on Cyberpunk RED Single Player Mode
// Official data from the PDF - Additional tables
// ============================================

import { getRandomFromArray, rollD6 } from './soloPlayTables'

// ============================================
// SENSORY TABLES - PDF Pages 37-38
// ============================================

export const sightsTable = [
    'A shattered neon sign flickering wildly.',
    'An alley strewn with scrap and trash.',
    'A towering hologram pushing ads.',
    'A cracked window reflecting the skyline.',
    'Shadows of drones flitting across the sky.',
    'A wall covered in faintly glowing graffiti.',
    'A street vendor with a cart, selling SCOP.',
    'Rain-slick pavement reflecting neon signs.',
    'A cybernetically enhanced beggar.',
    'A pristine AV, black and chrome, takes off.',
    'Boostergangers inhaling drugs.',
    'An open manhole spewing steam.',
    'A broken billboard strobing erratically.',
    'A shattered drone sparking on the ground.',
    'A sleek Exec flanked by bodyguards.',
    'A wary Solo leaning against a street lamp.',
    'A warehouse door with keypad locks.',
    'A corporate tower shrouded in storm clouds.',
    'A bloodstain smeared on the ground.',
    'A Tech arguing with a customer.',
]

export const soundsTable = [
    'A faint hum of a distant generator.',
    'The crackle of malfunctioning neon signs.',
    'Gunfire echoing from somewhere else.',
    'A robotic voice advertising new cyberware.',
    'A scream from the other end of an alley.',
    'The whoosh of a maglev train overhead.',
    'A sizzling wire sparking nearby.',
    'The low thrum of a passing AV.',
    'The dripping of water into a toxic puddle.',
    'A street vendor hawking their wares.',
    'A tinny radio playing distorted rock.',
    'Police sirens wailing and fading away.',
    'The cheerful voice of someone\'s Agent.',
    'The buzz of a drone hovering close by.',
    'The hiss of steam vents opening suddenly.',
    'A crowd applauding a street performer.',
    'The buzzing sound of a chainblade.',
    'A growling engine revving aggressively.',
    'The deafening blast of an explosion.',
    'A voice begging for help.',
]

export const smellsTable = [
    'The acrid tang of burning plastic.',
    'The oily stench of overheated machinery.',
    'A faint whiff of decaying garbage.',
    'Metallic blood mixed with acid rainwater.',
    'Freshly welded chrome.',
    'The sharp scent of disinfectant.',
    'Stale cigarette smoke clinging to the air.',
    'A faintly sweet chemical aroma.',
    'Synthetic perfume, strong and artificial.',
    'Greasy SCOP frying on open burners.',
    'The floral scent of high-end cologne.',
    'Intense body odor in a crowded space.',
    'Damp, moldy concrete.',
    'The faintly nauseating scent of Kibble.',
    'The scent of the ocean on the breeze.',
    'KoffPop "brewing" in a rundown café.',
    'Fresh food. God, it has been so long…',
    'CHOOH2 mixed with burnt rubber.',
    'The stench of industrial chemicals.',
    'The unforgettable scent of burning flesh.',
]

// ============================================
// PLACES TO LIVE - PDF Pages 41-42
// ============================================

export interface PlaceToLive {
    name: string
    description: string
}

export const cubeHotelsTable: PlaceToLive[] = [
    { name: 'Cube-A-Rama', description: 'A cube hotel with a brick exterior in Little Europe.' },
    { name: 'McCartney Cubes', description: 'A cube hotel near McCartney Stadium in the Upper Marina.' },
    { name: 'TravlStay CityCenter', description: 'A cube hotel with paper-thin walls in the Upper Marina.' },
    { name: 'University Cubes', description: 'Cheap cube rooms for students in the University District.' },
    { name: 'Seafoam', description: 'A cube hotel near Club Atlantis in The Glen.' },
    { name: 'Unnamed Cube Hotel', description: 'No cameras. No questions. In Old Japantown.' },
    { name: 'Watson Center Cubelife', description: 'A bog standard cube hotel in the Watson Development.' },
    { name: 'Evergreen Apartments', description: 'A former big box store transformed into a cube hotel. In New Westbrook.' },
    { name: 'Zolletta', description: 'A cube hotel in a tight-knit neighborhood. In New Westbrook.' },
    { name: 'Cubeland by the Sea', description: 'A shoddy cube hotel near Playland by the Sea. In Pacifica Playground.' },
    { name: 'Scenic Cubes', description: 'A cube hotel covered in graffiti. In Pacifica Playground.' },
]

export const cargoContainersTable: PlaceToLive[] = [
    { name: 'Bridgetown', description: 'Cargo containers beneath an underpass in Little China.' },
    { name: 'The Precipice', description: 'A community near Crisis Medical Center in Old Japantown.' },
    { name: 'South Cargo Village', description: 'Just on the wrong side of the South Night City/Glen border.' },
    { name: 'University Cargo Bay', description: 'A community for university students in South Night City.' },
    { name: 'Dock Cargo Community', description: 'A waterfront community in the Port of Night City.' },
    { name: 'Ionic Semiconductor Building', description: 'Factory-turned-cargo container community in the Old Combat Zone.' },
    { name: 'North Cargo Village', description: 'Cargo containers stacked in a parking lot in New Westbrook.' },
    { name: 'The Palms', description: 'Part of the Woodland Park neighborhood in North Heywood.' },
    { name: 'Old Ironworks Building', description: 'Cargo containers stacked up on a roof in the Heywood Industrial Zone.' },
    { name: 'East Cargo Village', description: 'On the city\'s edge in Santo Domingo.' },
    { name: 'Eagle Rock Stadium', description: 'A football field piled with cargo containers. In Rancho Coronado.' },
]

export const corporateConaptsTable: PlaceToLive[] = [
    { name: 'Vertical Neighborhood', description: 'Home to Continental Brands employees. In Little Europe.' },
    { name: 'Danger Gal Facility', description: 'Home to Danger Gal employees. In Little Europe.' },
    { name: 'Hanging Gardens', description: 'Home to Ziggurat employees. In the Upper Marina.' },
    { name: 'Habitation Sphere A', description: 'Home to Biotechnica employees. In the University District.' },
    { name: 'Corporate Ops Housing', description: 'Home to Militech employees. On the NorCal Military Base.' },
    { name: 'Joint Temp Housing (Petrochem)', description: 'Home to Petrochem employees. In Watson.' },
    { name: 'Joint Temp Housing (SovOil)', description: 'Home to SovOil employees. In Watson.' },
    { name: 'Corporate Living Center', description: 'Home to Trauma Team employees. In Watson.' },
    { name: 'Westbrook Acres', description: 'Home to Net54 employees. In New Westbrook.' },
    { name: 'Innovation Hub', description: 'Home to Rocklin Augmentics employees. In New Westbrook.' },
    { name: 'Zhirafa Microvillage', description: 'Home to Zhirafa employees. In the Heywood Industrial Zone.' },
]

export const apartmentBuildingsTable: PlaceToLive[] = [
    { name: 'Camden Court', description: 'Secure apartment complex in Little Europe.' },
    { name: 'Marina FloatHomes', description: 'Small houseboats for rent in the Upper Marina.' },
    { name: 'Parkside Living', description: 'Apartments rented mostly by NCU students in the University District.' },
    { name: 'Glenlife Perfected', description: 'Looks good on the outside… not the inside. In The Glen.' },
    { name: 'Silverhand Studios', description: 'Populated mostly by musicians and artists. In South Night City.' },
    { name: 'Dock 14 Apartments', description: 'Apartments on the waterfront. In the Port of Night City.' },
    { name: "L'Ermitage", description: 'A high-end apartment complex. In Charter Hill.' },
    { name: 'The Shark', description: 'An apartment complex in Woodland Park, a neighborhood in North Heywood.' },
    { name: 'Old Ironworks Building', description: 'Converted apartments for factory workers. In the Heywood Industrial Zone.' },
    { name: 'Heywood Suites', description: 'Apartments under a noisy overpass. In Santo Domingo.' },
    { name: 'Coronado Heights', description: 'Apartments close to but not part of Pacifica Playground. In Rancho Coronado.' },
]

// ============================================
// NIGHT CITY VENUES - PDF Page 43
// ============================================

export interface Venue {
    name: string
    description: string
}

export const nightCityHotspotsTable: Venue[] = [
    { name: 'The Afterlife', description: 'The premiere edgerunner bar in Night City. In the Upper Marina.' },
    { name: 'Club Atlantis', description: 'A multi-layered club with a disorienting, avant garde style. In The Glen.' },
    { name: 'Delirium', description: 'A gothpunk virtuality club. In Downtown.' },
    { name: 'The Forlorn Hope', description: 'A venerable edgerunner bar and Night City institution. In either Little China or North Heywood.' },
    { name: 'MetalStorm', description: 'A seemingly indestructible bar popular with FBCs. In Santo Domingo.' },
    { name: 'Short Circuit', description: "Night City's premiere Tech and Netrunner bar. In Little Europe." },
    { name: 'The Slammer', description: 'Home of the Arena, a no-holds barred combat ring popular with gangers. In South Night City.' },
    { name: 'Smash/Cut', description: 'An EDM club where the chromed up go to dance, do drugs, and engage in anonymous sex. In Watson.' },
    { name: 'Totentanz', description: 'A chrome metal club and home base for Maelstrom. In the Hot Zone.' },
    { name: 'Xanadu', description: 'A roller derby rink and discotech. Home of the Muses. In North Heywood.' },
    { name: 'The XX', description: 'A dive punk bar. It serves juice instead of booze. In Pacifica Playground.' },
]

export const nightCityBarsTable: Venue[] = [
    { name: 'Air', description: 'An oxygen bar for those who can afford the fresh stuff. In The Glen.' },
    { name: 'Chrome Cross', description: 'A dive bar frequented by the Red Chrome Legion. In Little China.' },
    { name: "Greta's", description: 'The best pool hall in Night City. Strong lesbian client base. In Little Europe.' },
    { name: "Jesse James' Kosher Deli", description: 'More of a saloon than a deli. In the Old Combat Zone.' },
    { name: "Kasim's", description: 'Turkish coffee and tobacco bar. Closed on Fridays. In The Glen.' },
    { name: "Maria's", description: 'A family-owned beer tent on the edge of Night City. In Santo Domingo.' },
    { name: "Rusty's Dive Shack", description: 'Rough bar. Built out of an old container sub. In the Port of Night City.' },
    { name: "Sakura's", description: 'An izakaya in Watson.' },
    { name: 'Vargtimmen', description: 'A neo-pagan mead bar in Watson.' },
    { name: 'Yewtree', description: 'A neo-hipster bar. In the University District.' },
    { name: 'Yum Seng', description: 'A host and hostess bar famous for its seafood. In Kabuki.' },
]

// ============================================
// RANDOM RELATIONSHIPS & VISITORS - PDF Page 51
// ============================================

export const randomRelationshipsTable = [
    'Acquaintance', 'Aunt/Uncle', 'Best Friend', 'Boss', 'Child',
    'Cousin', 'Coworker', 'Distant Relative', 'Employee', 'Enemy',
    'Family Friend', 'Former Friend/Ex-Lover', 'Friend', 'Lover', 'Nemesis',
    'Niece/Nephew', 'Parent', 'Rival', 'Sibling', 'Spouse',
]

export const visitorsTable = [
    'Corporate Courier', 'Criminal on the Run', 'Edgerunner on a Job',
    'Marshal on the Hunt', 'Media Pursuing a Story', 'Naive Newcomer',
    'Nomad Looking for Work', 'Nomad on a Mission', 'Prospective NCU Student',
    'Real Estate Hunter', 'Reclaimer on Supply Run', 'Returning Native',
    'Rockerboy on Tour', 'Runaway', 'Solo Looking for Work',
    'Sports Fan', 'Tech at a Conference', 'Traveling Salesperson',
    'Visiting Exec', 'Visiting Highrider',
]

// ============================================
// NAMES - PDF Pages 52-55
// ============================================

export const mascNamesTable = [
    'Adam', 'Akihiko', 'Akio', 'Alex', 'Andrew', 'Anthony', 'Arjan', 'Arthur', 'Bas', 'Benjamin',
    'Bram', 'Charles', 'Christopher', 'Daan', 'Daiki', 'Daisuke', 'Daniel', 'Dirk', 'Emil', 'Ethan',
    'Felix', 'Frank', 'Frederik', 'Gabriel', 'George', 'Haruto', 'Hendrik', 'Henry', 'Hideki', 'Hideo',
    'Hiroshi', 'Hugo', 'Isamu', 'Jack', 'Jacob', 'James', 'Jan', 'Jeroen', 'Johan', 'John',
    'Kaito', 'Kazuki', 'Kazuo', 'Kenji', 'Kenta', 'Kevin', 'Klaas', 'Koen', 'Koji', 'Lars',
    'Lucas', 'Maarten', 'Mark', 'Martijn', 'Masaki', 'Masaru', 'Matthew', 'Matthias', 'Michael', 'Minoru',
    'Nathan', 'Nico', 'Noboru', 'Oliver', 'Osamu', 'Oscar', 'Paul', 'Peter', 'Pieter', 'Richard',
    'Rick', 'Riku', 'Rowan', 'Ruben', 'Ryo', 'Ryota', 'Samuel', 'Satoshi', 'Sean', 'Shiro',
    'Sho', 'Shohei', 'Simon', 'Stefan', 'Stephen', 'Sven', 'Takumi', 'Takuya', 'Theo', 'Thijs',
    'Thomas', 'Tim', 'Toshiro', 'Victor', 'Willem', 'William', 'Yoshiaki', 'Yoshio', 'Yuki', 'Yuta',
]

export const femmeNamesTable = [
    'Abigail', 'Aiko', 'Akemi', 'Alice', 'Amber', 'Amelia', 'Anna', 'Annabelle', 'Anouk', 'Asami',
    'Ayaka', 'Ayano', 'Azumi', 'Britt', 'Celine', 'Charlotte', 'Chieko', 'Chloe', 'Claire', 'Danielle',
    'Daphne', 'Elin', 'Eline', 'Eliza', 'Emi', 'Emily', 'Emma', 'Erika', 'Esmee', 'Eva',
    'Faith', 'Femke', 'Fleur', 'Gaby', 'Grace', 'Hana', 'Hannah', 'Haruka', 'Hikari', 'Hitomi',
    'Ilse', 'Iris', 'Isabel', 'Isla', 'Jessica', 'Jolien', 'Julia', 'Kana', 'Kaori', 'Kumiko',
    'Leah', 'Lieke', 'Lotte', 'Louise', 'Lucy', 'Maartje', 'Marieke', 'Marlies', 'Mayumi', 'Megumi',
    'Mia', 'Midori', 'Milou', 'Misaki', 'Miyuki', 'Naomi', 'Natalie', 'Natsumi', 'Noa', 'Nora',
    'Olivia', 'Pauline', 'Petra', 'Rebecca', 'Rika', 'Rin', 'Rina', 'Roos', 'Rose', 'Sakura',
    'Samantha', 'Sanne', 'Sarah', 'Saskia', 'Satsuki', 'Sayuri', 'Shiori', 'Sophie', 'Sophie-Anne', 'Sophie-May',
    'Tessa', 'Tomoko', 'Vera', 'Victoria', 'Yara', 'Yoshiko', 'Yuki', 'Yumiko', 'Zara', 'Zoe',
]

export const nonbinaryNamesTable = [
    'Alec', 'Alex', 'Alexi', 'Andy', 'Arden', 'Ariel', 'Ash', 'Ashton', 'Aspen', 'August',
    'Avery', 'Ayo', 'Bailey', 'Blair', 'Blake', 'Bliss', 'Blue', 'Blue', 'Cameron', 'Casey',
    'Casey', 'Cruz', 'Dakota', 'Dani', 'December', 'Devon', 'Drew', 'Elliot', 'Ellis', 'Emerson',
    'Emery', 'Finley', 'Flynn', 'Francis', 'Ghost', 'Gray', 'Harper', 'Hawi', 'Hayden', 'Hollis',
    'Indigo', 'J.P.', 'Jahni', 'Jamey', 'Jamie', 'Jayden', 'Jayne', 'Jo', 'Jordan', 'Jules',
    'Kai', 'Kelly', 'Kennedy', 'Kieran', 'Kit', 'Landry', 'Lane', 'Lennon', 'Logan', 'London',
    'Lou', 'Lucha', 'Max', 'Micah', 'Mike', 'Morgan', 'Nico', 'Oakley', 'Parker', 'Phoenix',
    'Quinn', 'Red', 'Reese', 'Remy', 'Ren', 'Riley', 'River', 'Robin', 'Rory', 'Rowan',
    'Sage', 'Sal', 'Sam', 'Sawyer', 'Seven', 'Shiloh', 'Sidney', 'Sky', 'Skyler', 'Spenser',
    'Summer', 'Tatum', 'Taylor', 'Teagan', 'Tobi', 'Tuesday', 'Twist', 'Vick', 'Winter', 'Zo',
]

export const handlesTable = [
    'Any Animal', 'Any Color', 'Any Divination Technique', 'Any Drug', 'Any Emotion',
    'Any Feature of Nature', 'Any Gemstone', 'Any Greek Letter', 'Any Insect', 'Any Military Rank',
    'Any Mythological Creature', 'Any Natural Disaster', 'Any Number', 'Any Playing Card', 'Any Tool',
    'Any TTRPG Class', 'Any Weapon', 'Breacher', 'Bright', 'Bullet',
    'Cold', 'Crash', 'Dark', 'Data', 'Dead',
    'Demon', 'Diver', 'Final', 'Fire', 'Flare',
    'Glow', 'Go', 'Hound', 'Keeper', 'Knight',
    'Lucky', 'Nomad', 'Pistol', 'Punish', 'Rider',
    'Shred', 'Slick', 'Speed', 'Stick', 'Top',
    'Trauma', 'Vengeance', 'Warlock or Witch', 'Wheels', 'Any Color + the word "Hand"',
]

// ============================================
// ROLES & NPCs BY ROLE - PDF Pages 56-61
// ============================================

export const rolesTable = [
    'Exec', 'Fixer', 'Lawman', 'Media', 'Medtech',
    'Netrunner', 'Nomad', 'Rockerboy', 'Solo', 'Tech',
]

export interface NamedNPC {
    name: string
    notes: string
}

export const npcExecsTable: NamedNPC[] = [
    { name: 'Chanda Mishra', notes: 'Mid-level Exec at Rocklin Augmentics.' },
    { name: 'Corpse Reviver', notes: 'Boss of the Piranhas.' },
    { name: 'Fenton Miranda', notes: 'Kiroshi Optics Chief Actuary, Night City branch.' },
    { name: 'Gabriel Yang', notes: 'CEO of Yang\'s Wheels. Former nomad.' },
    { name: 'Jules Lung', notes: 'Mid-level Exec for Continental Brands.' },
    { name: 'Oscar "Bubba" Steele', notes: 'Petrochem Production Manager.' },
    { name: 'Saber', notes: 'Freelance Troubleshooter.' },
    { name: 'Sizzle Jams', notes: 'Talent agent.' },
    { name: 'Theresa Valentino', notes: 'City Manager of Santo Domingo.' },
    { name: 'Veronica Stiles', notes: 'Freelancer wrangler for Militech.' },
]

export const npcFixersTable: NamedNPC[] = [
    { name: '3-Piece', notes: 'Has his own Garden Patch. Co-owns Short Circuit.' },
    { name: 'Flasher', notes: 'Hawking cheap goods on the street corner.' },
    { name: 'Grease', notes: 'Street-level Fixer. Still making a name for himself.' },
    { name: 'Lowball', notes: 'Specializes in Corporate clients.' },
    { name: 'Mister Kernaghan', notes: "Night City's most powerful Fixer." },
    { name: 'Molly Anderson', notes: 'Leader of the Andersons, an aging yogang.' },
    { name: 'Ms. Mynah', notes: 'Avian Exotic Fixer who specializes in fashion.' },
    { name: 'Rex Royale', notes: 'Casino-themed Fixer. Sells weapons and combat gear.' },
    { name: 'Willy Maze', notes: 'Freelance street marketing guru and seller of random goods.' },
    { name: 'Woodchipper', notes: 'Noted nomad Fixer in Night City.' },
]

export const npcLawmenTable: NamedNPC[] = [
    { name: 'Arbiter', notes: "Leader of 6th Street's Davis Squad." },
    { name: 'Bill Mauser', notes: 'Aka Hellhound. Hunter of cyberpsychos and serial killers.' },
    { name: 'Dan Renzer', notes: 'Netwatch agent based out of Night City.' },
    { name: 'Dennis Gant', notes: 'Aka Golden Boy. Media darling and risk taker.' },
    { name: 'Judy "Pitbull" Warren', notes: 'New cop. Likes hurting people.' },
    { name: 'Marsha Lanz', notes: 'NCPD training officer.' },
    { name: 'Maxime Raunche', notes: 'Leader of the Street Queens.' },
    { name: 'Elena "Shepard" Korda', notes: 'NCPD canine unit officer.' },
    { name: 'Tearjerker', notes: 'Runs a volunteer fire department in South Night City.' },
    { name: 'Titus "Sarge" Malloy', notes: 'Veteran cop with contacts everywhere.' },
]

export const npcMediasTable: NamedNPC[] = [
    { name: 'Angie Wu 2.0', notes: 'Interviews focused on Night City history and people.' },
    { name: 'Crasher', notes: 'Freelance videographer. Keeps a secret stash of file footage.' },
    { name: 'Fiona Hayes', notes: 'Beloved Net54 reporter. Might not be the original Fiona Hayes.' },
    { name: 'Jackie McGee', notes: 'Runs the Corporate beat for Night City Today.' },
    { name: 'Jericho Hunt', notes: 'Freelancer. Secret subversive.' },
    { name: 'Jumpshot', notes: 'Freelance combat zone journalist.' },
    { name: 'Kelly Oddmeyer', notes: 'Covers entertainment and music for Night City Today.' },
    { name: 'Philip Escobar', notes: 'Interpol Agent.' },
    { name: 'Trace Santiago', notes: 'Investigative journalist. Connections to Rogue and the Aldecaldos.' },
    { name: 'Ziggy "Front" Page', notes: 'An all around journalist. Reliably published.' },
]

export const npcMedtechsTable: NamedNPC[] = [
    { name: 'Doc Mittens', notes: "Medtech for Danger Gal's Puma Squad." },
    { name: 'Doc Stoic', notes: 'House doctor at The Forlorn Hope.' },
    { name: 'Doc Salvage', notes: 'FBC Medtech in a Trauma Team Kildare body.' },
    { name: 'Leila Amani', notes: 'Assistant coroner working out of NCPD Precinct #3.' },
    { name: 'Organ Grinder', notes: 'Former surgeon, current Bozo.' },
    { name: 'The Other Doctor Bob', notes: 'Freelance surgeon. Hates poser gangs.' },
    { name: 'Phoenix Redwyne', notes: 'Owner of From the Ashes, a clinic in the Old Combat Zone.' },
    { name: 'Stick', notes: 'Trauma Team meat specialist. Member of Squad NC4-2.' },
    { name: 'Twist', notes: 'Trauma Team metal specialist. Member of Squad NC4-2.' },
    { name: 'Vesper', notes: 'Tattoo artist and fashionware installer.' },
]

export const npcNetrunnersTable: NamedNPC[] = [
    { name: 'Bobby Tables', notes: 'Freelance Netrunner. Does anti-Corp work.' },
    { name: 'Crunch', notes: 'Netrunner working for WorldSat.' },
    { name: 'Drummer', notes: 'Data sorting specialist.' },
    { name: 'Cereal', notes: 'Erratic but brilliant Netrunner. Member of Team Monster.' },
    { name: 'CrABlord', notes: 'A bit of an urban legend with a flock of CrAB drones.' },
    { name: 'Darrius', notes: 'Undercover Arasaka agent working in Night City.' },
    { name: 'Firewall', notes: 'Light/sound rigger for the Digital Divas.' },
    { name: 'Flenser', notes: 'Infiltration specialist and Maelstrom lieutenant.' },
    { name: 'Freefall', notes: 'Leader in the Zoner movement.' },
    { name: 'The Upload', notes: 'Sells decks and hardware. Netrunning snuff fetishist.' },
]

export const npcNomadsTable: NamedNPC[] = [
    { name: 'Alberto Sinclair', notes: 'Organizes civilian transport between cities. Aldecaldo.' },
    { name: 'Bly Harjo', notes: 'Station manager of 88.9 Nomad Presents Radio.' },
    { name: 'Endo', notes: 'Kind-hearted big brother type. Member of the Sightseers.' },
    { name: 'Lane Hawk', notes: 'Aerozep pilot for hire. Folk Nation.' },
    { name: 'Little Chili Pepper', notes: "Bicycle courier. Member of Fixie's Couriers." },
    { name: 'Murphy', notes: 'Deltajock smuggler. Aldecaldo.' },
    { name: 'Racer Rajavi', notes: 'Leader of the Sightseers pack. Aldecaldo.' },
    { name: 'Rockabye', notes: 'Pilot working for Trauma Team. Member of Squad NC4-2.' },
    { name: 'The Skipper', notes: 'Former sea pilot. Runs the Randy Dandy bar. Thelas.' },
    { name: 'Speed Demon', notes: 'Smuggler and racer. Helping out the Zoners. Jodes.' },
]

export const npcRockerboysTable: NamedNPC[] = [
    { name: 'Etan Sim', notes: 'Movie star. His ex-husband lives in Night City.' },
    { name: 'Gold', notes: 'PopMedia sensation. Star of Tom & Gold.' },
    { name: 'Grace Steel', notes: "Retired Solo. Leader of The Forlorn Hope's house band." },
    { name: 'Jester', notes: 'Fire-twirling member of the Bozos.' },
    { name: 'Lucius Rhyne', notes: 'Community organizer and City Manager of the Watson Development.' },
    { name: 'Mister Studd', notes: 'Artistic porn BD star. Member of the Zoners.' },
    { name: 'Nox', notes: 'Alien synth-pop artist. Member of Team Monster.' },
    { name: 'Pat Rezin', notes: 'Lead singer for the Digital Divas.' },
    { name: 'Regan "Pro" Halley', notes: 'Lead singer of Protocon.' },
    { name: 'Velvet Lux', notes: 'Model and fashion designer.' },
]

export const npcSolosTable: NamedNPC[] = [
    { name: 'Adorable', notes: 'Leader of the Princesses of Justice. Sword wielder.' },
    { name: 'Alexander Marconi', notes: 'Aka Caliber. NCPD sniper. Might be a vigilante.' },
    { name: 'Hammer', notes: 'Low-level Solo.' },
    { name: 'Derby', notes: 'Freelance Solo and roller derby jammer.' },
    { name: 'Father Kevin', notes: 'Head priest of the Holy Angels Church.' },
    { name: 'Ophelia', notes: 'War leader of the Sinful Adams.' },
    { name: 'Quake', notes: 'Maelstrom lieutenant.' },
    { name: 'Petra David', notes: 'Martial artist. Head of security for The Forlorn Hope.' },
    { name: 'Tia Puño', notes: 'Freelance combat engineer.' },
    { name: 'Tomfool', notes: 'Bozo and bloodsport fighter.' },
]

export const npcTechsTable: NamedNPC[] = [
    { name: 'Apex', notes: 'Leader of Generation Red. Distrusts adults.' },
    { name: 'Backhand', notes: 'House Tech at The Forlorn Hope.' },
    { name: 'Edith Lamarr', notes: "Chief Engineer at Yang's Wheels." },
    { name: 'Faisal Farah', notes: 'Bespoke weaponstech wunderkind.' },
    { name: 'Franklin M\'bolu', notes: 'Works for Orbital Air. In charge of Morro Rock spaceport project.' },
    { name: 'Jacqueline Sawyer', notes: 'Goes by Jack. Independent gunsmith and pool shark.' },
    { name: 'Joe Pitt', notes: 'Handyman and Tech for Maelstrom.' },
    { name: 'Patches', notes: 'Freelance Tech from Georgia.' },
    { name: 'Spooky Sue', notes: 'Street drug vendor. Looks like a Korean movie ghost.' },
    { name: 'Stefan Eklund', notes: 'Doctorate candidate at NCU. Specializes in bio-electrical programming.' },
]

export const npcNoRoleTable: NamedNPC[] = [
    { name: 'Bug', notes: 'Adopted daughter of 3-Piece and Brain.' },
    { name: 'Dawn Davis', notes: 'Inquisitor. Writes editorials about the dangers of everything.' },
    { name: 'Oliver Riddle', notes: 'Personal assistant to movie star Etan Sim.' },
    { name: 'Finale', notes: 'Bozo. His mouth is stitched shut.' },
    { name: 'Ghoul', notes: 'Newbie Maelstrom member.' },
    { name: 'Randi K', notes: 'Sex worker.' },
]

// Map roles to their NPC tables for easy lookup
export const npcByRoleMap: Record<string, NamedNPC[]> = {
    Exec: npcExecsTable,
    Fixer: npcFixersTable,
    Lawman: npcLawmenTable,
    Media: npcMediasTable,
    Medtech: npcMedtechsTable,
    Netrunner: npcNetrunnersTable,
    Nomad: npcNomadsTable,
    Rockerboy: npcRockerboysTable,
    Solo: npcSolosTable,
    Tech: npcTechsTable,
}

// ============================================
// THINGS - PDF Pages 62-64
// ============================================

export const fashionTable = [
    'Asia Pop', 'Bag Lady Chic', 'Bohemian', 'Businesswear', 'Gang Colors',
    'Generic Chic', 'High Fashion', 'Leisurewear', 'Nomad Leathers', 'Urban Flash',
]

export const fashionwareTable = [
    'Biomonitor', 'Chemskin', 'EMP Threading', 'Kill Display', 'Light Tattoo',
    'Mood Eye', 'Shift Tacts', 'Skinwatch', 'Techhair', 'Turn-On Show-Off Nails',
]

export const blackIceTable = [
    'Asp', 'Dragon (evens) or Kraken (odds)', 'Giant', 'Hellhound', 'Killer',
    'Liche', 'Raven', 'Sabertooth', 'Scorpion', 'Skunk (evens) or Wisp (odds)',
]

export const firearmsTable = [
    'Medium Pistol', 'Heavy Pistol', 'Very Heavy Pistol', 'SMG', 'Heavy SMG',
    'Shotgun', 'Assault Rifle', 'Sniper Rifle (evens) or Grenade Launcher (odds)',
    'Bow (evens) or Crossbow (odds)', 'Rocket Launcher (evens) or Exotic (odds)',
]

export interface FlavorItem {
    flavor: string
    description: string
}

export const kibbleFlavorsTable: FlavorItem[] = [
    { flavor: 'Fizzy', description: "Don't worry. The bubbling on your tongue is normal." },
    { flavor: 'Chili Lime', description: 'Acid and spice and everything nice.' },
    { flavor: 'Protein Kibble', description: 'Do you even lift, choomba?' },
    { flavor: 'Kibble SportFlakes', description: "They'rrreeeeee great (at clogging up your bowels)!" },
    { flavor: 'Extra Fluffy Pancake', description: 'Just add Continental Brands maple syrup.' },
    { flavor: 'Kibble SportMix', description: 'The official Kibble of the Night City Heat.' },
    { flavor: 'Fruit Fantasy', description: "The world's most solid fake fruit salad." },
    { flavor: 'Popcorn', description: 'With original "butter" flavor.' },
    { flavor: 'Caramel Crunch Popcorn', description: 'If you squint it looks like the real thing!' },
    { flavor: 'BacChed Dumpburger', description: 'Surprisingly popular!' },
    { flavor: 'Kiwi', description: 'Taste the tropics!' },
    { flavor: 'Cheese', description: 'Yes, they\'re supposed to glow in the dark like that.' },
    { flavor: 'Lemon Ginger', description: "Don't need to spend fancy to eat fancy!" },
    { flavor: 'Aromatic Beef', description: "We said it smelled. We didn't say like what." },
    { flavor: 'Paprika', description: 'The reddest Kibble yet!' },
    { flavor: 'Pineapple Pizza', description: 'Does pineapple belong on pizza in a Kibble bag?' },
    { flavor: 'Collagen Boost', description: 'Give yourself a lift.' },
    { flavor: 'Kibble XXL', description: 'For when you wanna eat Kibble the size of a golf ball.' },
    { flavor: 'Mystery', description: "What's the flavor? We don't know and you won't either!" },
    { flavor: 'Adobo', description: "Let's pretend there's real garlic, vinegar, and salt on these things." },
]

export const tritiFizzTable: FlavorItem[] = [
    { flavor: 'Blood Rain', description: 'The thickest flavor yet.' },
    { flavor: 'Bubble Crunch', description: 'The hard bits are just extra flavor.' },
    { flavor: 'Cherry Choomba', description: 'Paint your tongue scarlet.' },
    { flavor: 'Elflines Elixir', description: 'Nothing heals your Elf Points faster.' },
    { flavor: 'Lightning', description: 'A tingle on your taste buds!' },
    { flavor: 'Mystery', description: "Don't know what it is? Neither do we!" },
    { flavor: 'National Anthem', description: 'Patriotism in a can.' },
    { flavor: 'Pancake Dinner', description: 'Drink your breakfast.' },
    { flavor: 'Rainbow Rally', description: 'Seven distinct flavors for your belly.' },
    { flavor: 'Solar Flare', description: 'A satisfying burn in your mouth.' },
]

// ============================================
// CORPSE LOOT - PDF Pages 65-70
// ============================================

export const corpseLootStreetratTable = [
    '1d10 blank Memory Chips.',
    '1d10 rare bottlecaps, worth 10eb each.',
    '1d100 poorly counterfeited eurobucks.',
    '3d10 Basic Ammo bullets for a VHP.',
    'A 50eb Oasis gift card.',
    'A bag of Kibble.',
    'A baggie of synth gems worth 100eb.',
    'A spiked baseball bat.',
    'A blood-soaked NCPD badge.',
    'A Body Lotto ticket.',
    "An Exec's Guide to Making Minions.",
    'A bottle of cheap headache medicine.',
    "A Bozo's nose. Just the nose.",
    'A broken Poor Quality Cyberdeck.',
    'A broken Segotari RUSH Revolution.',
    'A burnt letter warning of betrayal.',
    'A can of Smash.',
    'A charred photograph of a Fixer.',
    "A child's toy covered in dried blood.",
    'A 50eb Cyberdeck program.',
    'A coded message written on a napkin.',
    'A compact with a cracked mirror.',
    'A completely destroyed credstick.',
    'A Corporate ID.',
    'A credstick with 100eb on it.',
    'A damaged cybereye.',
    'A deck of playing cards.',
    'A dose of Boost in pill form.',
    'A dummy grenade.',
    'A hand-made PQ Medium Pistol.',
    'A family photograph.',
    'A flashlight.',
    'A flask of cheap booze.',
    'A clip of AP rounds for a Heavy Pistol.',
    'A gang emblem.',
    'A gang-themed fake gold chain.',
    'A half empty can of Glow Paint.',
    'A half-full bottle of perfume.',
    'A half-written suicide note.',
    'A hand drawn map.',
    'A propeller wrapped in barbed wire.',
    'A jacket marked with gang colors.',
    'A jailbroken Agent w/ a cracked screen.',
    'A key. No clue what it goes to.',
    'A Lockpick Kit.',
    'A love letter.',
    'A Memory Chip containing a letter.',
    'A bootleg copy of Roach Race.',
    'A Memory Chip with naked photos.',
    'A Memory Chip marked "Evidence."',
    'A Memory Chip marked with a logo.',
    'A menu for a high-end restaurant.',
    'A message written in blood on a photo.',
    'An NCART pass.',
    'A necklace crudely carved from bone.',
    'A neon pink cyberdeck case.',
    'A pair of Binoculars.',
    'A pair of boots with a secret compartment.',
    'A pair of novelty shades with blinking LEDs.',
    'A pair of stolen Leisurewear shoes.',
    'A party mask.',
    'A pass for an underground Piranha-run rave.',
    'A patched up backpack.',
    'A plastic vial full of colored sand.',
    'A Poor Quality Shotgun.',
    'A pouch of cooking spices worth 50eb.',
    'Printed-out pages from a Screamsheet.',
    'A Puma Squad gatcha toy.',
    'A roll of duct tape.',
    'A rubber duck dressed as a samurai.',
    'A scrap of cloth with a gang logo on it.',
    'A scuffed credstick with 50eb on it.',
    'A self-storage locker key.',
    'A Skinwatch turned into a wearable watch.',
    'A patch containing one dose of Black Lace.',
    'A slowly thawing PrePak meal.',
    'A small plastic trophy.',
    'A Standard Cyberfinger with a ring on it.',
    'A map with several locations circled in red.',
    "A ticket stub for last month's NC Heat game.",
    "A ticket to tonight's fight at the Redline.",
    'A torn note: Meet at the docks at midnight.',
    'A Vial of Poison disguised as a pen.',
    'An Agent belonging to a missing Exec.',
    'An airhypo loaded with Synthcoke.',
    'An Armor Piercing Grenade.',
    'An Elflines Online key chain.',
    'An empty airhypo covered in dry blood.',
    'An empty medkit.',
    'An invitation to a local Night Market.',
    'An IOU signed by a known Fixer.',
    'Chewing gum.',
    'Math homework.',
    'Nomad Leather mirrorshades.',
    'Smashed drone parts.',
    'Some loose Kibble.',
    "Somebody's thumb.",
    'The battery for a Stun Baton.',
    'The elbow joint of a broken cyberarm.',
    "The pack patch from a nomad's jacket.",
]

export const corpseLootEdgerunnerTable = [
    '1d10 batteries for a Microwaver.',
    '1d100 Incendiary Shells for a Shotgun.',
    '1d6 Disposable Cell Phones.',
    '1d6 doses of Synthcoke in a bottle.',
    '1d6 Radio Communicators.',
    '1d6 Smoke Grenades.',
    '1d6 Techtools.',
    '500eb worth of chips for a local casino.',
    '500eb worth of Cyberdeck programs.',
    'A badly scrawled "treasure map."',
    'A bag of seeds worth 500eb.',
    'A bag of socks (none matching).',
    'A Biotoxin Grenade.',
    'A blank SIN card, ready for forging.',
    'A bloodstained letter addressed to a Fixer.',
    'Medium Armorjack helmet w/ 10 SP left.',
    'A blueprint for a factory somewhere in the city.',
    '500eb worth of cyberware parts.',
    'A box of 1d100 Food Sticks.',
    'A broken Bug Detector.',
    'A coded list of secret meeting spots.',
    'A coded message with missing pieces.',
    'A combat-oriented Skill Chip.',
    "The Enforcer's Handbook.",
    'A credstick with 100eb on it.',
    'A credstick with 500eb on it.',
    'A napkin with a meeting time and place.',
    'A designer cyberdeck case.',
    'A diary page recounting a betrayal.',
    'A digital map w/ three buildings circled.',
    'A disassembled Very Heavy Pistol.',
    'A disassembled Sniper Rifle.',
    'A full clip of Armor-Piercing Ammunition.',
    'A functional cybereye.',
    'A chain embedded with holographic images.',
    'A Grapple Gun.',
    'A half-burned map of a Combat Zone.',
    'A hotel keycard.',
    'A house key.',
    "A janitor's access badge for a building.",
    'A key chain that plays music from ELO.',
    'A Light Armorjack helmet. Never worn.',
    'LAJ body armor w/ only 2 SP remaining.',
    'A Heavy Pistol electroplated in gold.',
    'A list of names with no other context.',
    "A loving note from someone's mother.",
    'A lovingly-maintained Shoulder Arm.',
    'A matching set of pearl-handled Heavy Pistols.',
    'A Medtech Bag, fully loaded.',
    "A Media's notes loaded on a Memory Chip.",
    "A recording of a preacher's sermon.",
    'A Memory Chip w/ plans for a heist.',
    'A Memory Chip loaded w/ music.',
    'A Memory Chip labeled "DANGER."',
    'A Microwaver disguised as a flashlight.',
    'A novelty lighter shaped like a fish.',
    'A pair of Nomad Leathers boots.',
    'A pair of Smart Glasses with no implants.',
    'A pair of theater tickets.',
    'A person\'s photo. "FIND THEM" written on it.',
    'A group photo, some faces crossed out.',
    'A photo of an Exec and their family.',
    'A piece of Businesswear jewelry.',
    'A pocket full of mismatched dice.',
    'A pouch of gemstones worth 500eb.',
    "A private investigator's business card.",
    'A reservation card for a high quality spa.',
    'A rubber chicken with burn marks.',
    'A Scrambler/Descrambler.',
    'A secure but empty portable safe (DV15).',
    'Stylish Light Armorjack Body Armor.',
    'A signed t-shirt advertising a local band.',
    'A small box containing nothing.',
    'A starter pack of ELO TCG cards.',
    'A storage locker key.',
    "A ticket for next week's playoff game.",
    'A page from a diary noting "the safehouse."',
    'A vehicle key.',
    'A vial of glowing liquid.',
    'A vial of surgical nanobots worth 500eb.',
    'A VIP pass to a long-dead nightclub.',
    'A voucher for a free tattoo session.',
    'An Agent in a rugged case.',
    'An Agent, cracked in half.',
    'An Air Pistol loaded with Acid Paintballs.',
    'An EMP Grenade.',
    'An encrypted Memory Chip bearing a logo.',
    'A full season of a show on a Memory Chip.',
    'An Excellent Quality VHP.',
    'An ID card belonging to a missing Exec.',
    "An Inquisitor's hood.",
    'An uninstalled Cyberarm.',
    'An uninstalled Grapple Hand.',
    'An uninstalled Hidden Holster.',
    'An uninstalled Interface Plug.',
    'An uninstalled Kerenzikov.',
    'An uninstalled Sensor Array.',
    'An uninstalled set of Wolvers.',
    'An uninstalled Smartgun Link.',
    'Directions to a hidden weapon cache.',
]

export const corpseLootCorporateTable = [
    '1d10 pieces of tropical fruit (100eb each).',
    '1d10 pieces of Urban Flash jewelry.',
    '1d10 Vials of Biotoxin.',
    '2d10 doses of Synthcoke in baggies.',
    '500eb worth of Black ICE.',
    '500eb worth of uninstalled Fashionware.',
    'A 10-year service pin for a Corporation.',
    'A Battleglove with no options installed.',
    'A biometrically locked Kendachi Mono-Three.',
    'A biometrically locked ring box.',
    'A blueprint for a Corporate building.',
    'A bottle containing a human tongue.',
    'A bottle of shampoo from a luxury hotel.',
    'A bottle of wine worth 500eb.',
    'A box of condoms, half empty.',
    'A briefcase sealed with a biometric lock.',
    'A note indicating a safehouse location.',
    'A Businesswear wristwatch with a logo.',
    'A coded message suggesting a defection.',
    'A mug labeled "World\'s Best Boss."',
    'A corrupted Agent.',
    'A credstick loaded with 1,000eb... only good at a specific Corporate store.',
    'A credstick loaded with 1,000eb.',
    'A credstick loaded with 666eb.',
    'A damaged High Fashion hat.',
    'A deactivated panic button.',
    'A gem-studded lighter worth 500eb.',
    'A discreet tracer.',
    'A dry cleaning ticket.',
    'An EMP Grenade disguised as a baseball.',
    'A family photograph.',
    'A flask of booze laced with Biotoxin.',
    'A glass figurine with queasy lines.',
    'A gold-plated credstick. 0eb on it.',
    'A gold-plated Techtool.',
    'A heavily encrypted list of asset transfers.',
    'A High Fashion handbag.',
    'A homemade pornographic Memory Chip.',
    'A Light Melee Weapon and a Vial of Poison.',
    'A lock of hair inside a Bohemian locket.',
    'A luxury vehicle key.',
    'An NCART map with a specific spot circled.',
    "A Media's business card.",
    'A Memory Chip w/ a Corporate secret.',
    'A Memory Chip w/ a half-written apology.',
    'A Memory Chip w/ a piece of lost media.',
    "A Memory Chip w/ an Exec's contact list. Several names are struck through.",
    'A Memory Chip w/ stockbroker notes.',
    'A Memory Chip w/ meeting notes.',
    'A video of someone being beaten.',
    'A neatly folded Bodyweight Suit.',
    'A note offering thanks for a "night of wonder."',
    'A painting with 1,000eb.',
    'A phone number written on a napkin.',
    'A plastic-encased ticket for a Samurai concert.',
    'A blood-stained portrait of a family.',
    'A book page with random letters circled.',
    'A prototype energy cell.',
    'A Radio Communicator outfitted with a Scrambler/Descrambler.',
    'Recordings of unreleased songs.',
    'A real leather briefcase.',
    'A real leather shoulder holster.',
    'A receipt for an expensive purchase.',
    'A safe passcode.',
    'The name of a ship on a scrap of plastic.',
    'A set of blackmail photographs.',
    'An eyeball in a small cryobag.',
    'A set of solid silver dentures.',
    "A sex worker's business card.",
    'A shipping manifest for a yet-to-arrive ship.',
    'A small vial of an unknown liquid.',
    'A Stun Gun disguised as a pen.',
    'A synthetic cactus in a gold-plated pot.',
    'A Techscanner.',
    'A ticket to an exclusive opera with "Deliver this" scribbled on it.',
    'A torn memo about a failed hostile takeover.',
    'A note. "Meet at the docks at 8 PM."',
    'A x2 Skill Chip.',
    'An Air Swarm Drone Cloud in a bottle.',
    'An empty folder labeled "Top Secret."',
    'An empty Torrell & Chiang lingerie box.',
    'An empty, gold-plated airhypo.',
    'An Excellent Quality Cyberdeck.',
    "An Exec's office keycard.",
    'An EQ VHP with a Corporate logo carved into the handle.',
    'An Exec TT membership card (1 month left).',
    'An experimental device.',
    'An invitation to a high-end party.',
    'An invite to a high-stakes poker game.',
    'An invite to the VIP section of an exclusive club.',
    'An uninstalled Pain Editor.',
    'An unusual challenge coin.',
    'Apartment keys.',
    'Auto Level Dampening Ear Protectors.',
    'High Fashion Mirroshades.',
    'A Skill Chip (actually a cortex bomb).',
    'The contract info for a high-end Fixer.',
    'The key to an aerial vehicle.',
    'The login code for a NET Architecture.',
    'The direct line contact number for an important person\'s Agent.',
]

// ============================================
// MEDIA - PDF Page 71
// ============================================

export interface RadioStation {
    station: string
    focus: string
}

export const radioStationsTable: RadioStation[] = [
    { station: '87.9 Net54', focus: 'Corporate synth-pop with Net54 news blips.' },
    { station: '91.9 Royal Blue Media', focus: 'Classic jazz.' },
    { station: '92.9 Night FM', focus: 'Electronica and dance tracks.' },
    { station: '94.4 NCU Radio', focus: 'Local bands and experimental music.' },
    { station: '96.1 Fever Dream', focus: 'Reckoner sermons and melodic techno.' },
    { station: '98.6 Shiv FM', focus: 'Pop-techno.' },
    { station: '100.0 G3 Gun-Gal', focus: 'All anime soundtracks and talk shows.' },
    { station: '100.8 WNS', focus: 'Corporate-owned music and WNS news blips.' },
    { station: '101.1 Killzone', focus: 'Hard rock, rare singles, and imported music.' },
    { station: '101.9 The Dirge', focus: 'Hip hop and protest speeches.' },
    { station: '104.3 Sangre y Arena', focus: 'Spanish-language station.' },
    { station: '106.2 KCP2', focus: 'Chromatic rock.' },
    { station: '107.3 Morro Rock', focus: 'Classic rock and Neo-African pop.' },
    { station: '108.0 Counting Station', focus: 'Different voices listing numbers in various patterns.' },
]

export interface TVShow {
    show: string
    notes: string
}

export const whatsOnScreenTable: TVShow[] = [
    { show: 'Combat Cabb TNG', notes: "A new generation of fictionalized drama at Combat Cabb's HQ." },
    { show: 'Combat Zone', notes: 'The ultimate battle royale show. 50 people enter. 1 person leaves.' },
    { show: 'Cooking with Kibble', notes: 'Get the most out of your Kibble!' },
    { show: 'Puma Squad!', notes: "The animated adventures of Danger Gal's premiere team." },
    { show: 'Hot Zone Divers', notes: 'Watch people risk their lives for junk and treasure! Totally staged.' },
    { show: 'La Pasión Dorada', notes: 'An over the top telenovela about an Exec on her way up the Corporate ladder.' },
    { show: 'The News', notes: 'Evens: N54 News / Odds: WNS News' },
    { show: 'The Game', notes: '1-25: Combat Soccer / 26-50: Basketball / 51-75: Baseball / 76-100: Murderball' },
    { show: 'Crime and Punishment', notes: 'Live electrowhipping and executions at the Hall of Justice.' },
    { show: 'The ELO Chronicles', notes: 'An isekai about a Netrunner reborn into their favorite MMO.' },
    { show: 'Militech Action Hour', notes: 'An hour-long block of cartoon advertisements.' },
]

// ============================================
// MISSION ITEMS / MACGUFFINS - PDF Page 73
// ============================================

export const missionItemsCorporateTable = [
    'A valuable Exec/Tech', 'Biomedical data', 'Blackmail material',
    'Blueprints and schematics', 'Confidential data', 'Designer drugs',
    'Luxury vehicle', 'Prototype technology', 'Rare artifact', 'Valuable art',
]

export const missionItemsModerateTable = [
    "A Fixer's notes and information", 'Celebrity memorabilia', 'Cyberware cache',
    'Drone', 'Drug stash', 'Food stash',
    'Pre-4CW supply cache location', 'Valuable or beloved personal item', 'Vehicle', 'Weapon cache',
]

export const missionItemsStreetTable = [
    "A Media's notes on area Fixers", 'Cache of XBD chips', 'Crashed AV',
    'Crashed combat drone', 'Credsticks', 'Drug cache',
    'Escaped experiment subject', "Gang leader's symbol of power",
    'Graffiti by a street artist who just went big', 'Kibble cache',
    'Kidnapped NCU student', 'Knockoff fashion cache',
    'Memory Chip with important data', 'Night Market location',
    'Pre-4CW supply cache location', 'Protest/riot',
    "Ripperdoc's cyberware stash", 'Slumming Exec', 'Suitcase full of cash',
]

export const missionItemsNomadTable = [
    'Corporate convoy', 'Escaped prisoner', 'Lost drone',
    'Nomad camp', "Nomad's lucky charm", 'Pre-4CW cache',
    'Reclaimer supply cache', 'Secret meeting', 'Stolen vehicle', 'Unusual natural feature',
]

// ============================================
// RANDOM ENCOUNTERS - PDF Pages 77-84
// ============================================

// Corporate/Executive Zone
export const encounterCorpDay = [
    'An autonomous cleaning drone quietly scrubbing the sidewalk.',
    'A Corporate secretary, rushing across the plaza, drops something.',
    'A courier on a high-speed bike weaving through pedestrians, clearly in a rush.',
    'A delivery drone drops a package on the sidewalk and continues flying on.',
    'A discreet but obvious exchange between an Exec and a Fixer near a café.',
    'A group of protesters demonstrating in front of a building. They have their own security.',
    'A high-end Exec in an expensive suit haggling discreetly with a street vendor.',
    'A holo-ad malfunctioning, strobing wildly, and attracting the attention of a curious crowd.',
    'A Lawman (NCPD or private) stops the Crew and demands to see identification.',
    'A limo door opens, and someone yells for help before being yanked back inside.',
    'A luxury AV descends from the sky and disgorges someone famous.',
    'A Media recording footage with the help of a camera drone.',
    'A Netrunner leans against a wall, trying to look discreet as they infiltrate a nearby NET Architecture.',
    'A pair of Execs having a heated argument over a huge business deal.',
    'A private security team escorting an Exec through the area, scanning everyone with suspicion.',
    'A row of high-end vendits dispensing coffee, noodles, and quality items.',
    'A squad of Lawmen (NCPD or private) burst out of an armored vehicle.',
    'A street artist creating a virtuality graffiti piece.',
    'A suit-clad operative trailing someone discreetly. They notice the Crew noticing them.',
    'An expensive vehicle nearly runs someone down while driving away from a Corporate building.',
]

export const encounterCorpNight = [
    'A Corporate janitor, scrubbing a bloodstain off the sidewalk.',
    'A drone hovering over the area as it scans, looking for something.',
    'A heated argument breaks out between two Execs in the middle of the street, drawing a small crowd.',
    'A busker plays on a street corner. At their feet is a sign listing their corporate sponsor.',
    'A heavily armed operative patrolling the streets, scanning everyone for threats.',
    'A high-end holovid ad projecting a bright and loud advertisement.',
    'A limousine parked in a dimly lit alley.',
    'A luxury AV swoops down to pick up a mysterious figure wearing a holographic mask.',
    'A malfunctioning drone crashes into a parked car, causing a minor commotion.',
    'A Media tails a cop (NCPD or private), trying to get a story.',
    'A nearby building goes dark, as if its power has been cut.',
    'A nightclub queue filled with well-dressed patrons arguing over entry.',
    'A political demonstration dispersing as security forces approach, but a few stragglers resist.',
    'A small group of Corporate interns heading to a party, laughing nervously.',
    'Fashionably dressed patrons queuing up to enter a club for an exclusive event.',
    'NCPD surrounds a building. Someone on a bullhorn is trying to negotiate with whoever is inside.',
    'Private security escorts a handcuffed individual into an unmarked vehicle.',
    'Security for a highrise are subduing a courier who sought entry into the building.',
    'Someone being carried out of a nightclub by Trauma Team.',
    'Up above, one AV crashes into another.',
]

export const encounterCorpMidnight = [
    'A celebrity laughs with their entourage as their guard shoves away an adoring fan.',
    'A cleaning drone sprays disinfectant over a bloodied alley as two security guards watch.',
    'A cop patrols their beat, humming softly.',
    'A famous model argues with security after being denied entry to an exclusive party.',
    'A food cart owner setting up early.',
    'A heated argument between two fancy people outside a nightclub.',
    "A homeless person rummages through a high-end restaurant's dumpster.",
    'A lone person stands on a rooftop edge, looking down at the city, their intentions unclear.',
    'A luxury AV parked with its door ajar, its interior glowing with faint, ominous red light.',
    'A luxury car, speeding through the streets.',
    'A police AV hovers near a high-rise, shining a spotlight through a window.',
    'A rave so loud the building housing it vibrates.',
    'A security guard, sleeping at their station in front of a building.',
    'A shadowy figure plants a device on a luxury vehicle before vanishing into the darkness.',
    'A small nightclub ejects a rowdy Exec, their shouts echoing through the quiet streets.',
    'A sudden explosion rocks a nearby building, triggering alarms and lockdowns.',
    'A suspicious looking person accessing a corner Data Term.',
    'A team of edgerunners flees from a corporate tower, pursued by armed security forces.',
    'Sirens in the distance, but coming closer with every second.',
    'Two Ziggurat technicians repair a CitiNet junction box.',
]

// Moderate Zone
export const encounterModerateDay = [
    'A bodega owner advertising freshly made SCOP noodles to passersby.',
    'A bodega owner and customer arguing over counterfeit eurobucks.',
    'A broken-down car blocking traffic.',
    'A courier delivering food to a nearby conapt.',
    'A crowd of people streaming down into an NCART station.',
    'A crowd rubbernecking around a car accident.',
    'A gang member dealing drugs on the corner.',
    'A gang of kids running through the streets.',
    'A graffiti artist spray painting a mural on a wall while a few kids watch in awe.',
    'A Lawman (NCPD or private) arresting a street vendor.',
    'A neighborhood watch group/guardian gang patrolling the area, eying strangers suspiciously.',
    'A parent trying to convince a crying child to cheer up.',
    'A pickpocket caught red-handed by a salaryman, leading to a loud argument.',
    'A street performer juggling LED-lit balls, drawing a small crowd of onlookers.',
    'A vendit malfunctioning, spewing out cans of soda and snacks to a growing crowd.',
    'A vendor selling bags of an unusually flavored Kibble.',
    'A vendor selling electronics from the back of a truck.',
    'A worker repairing a busted streetlight as pedestrians complain about the obstruction.',
    'An advertisement on a large, cracked screen.',
    'An Exec sitting on a bench, talking intensely on a phone about a failed deal.',
]

export const encounterModerateNight = [
    'A courier carrying a package to a cargo container community.',
    'A food cart vendor selling Kibble cookies to a line of hungry late-night workers.',
    'A group of street kids playing with a discarded drone, trying to get it to fly again.',
    'A karaoke bar spilling music and laughter into the street.',
    'A late night, spontaneous block party.',
    'A Lawman vehicle (NCPD or private) parked on the street.',
    'A minor celebrity arguing with a street vendor about being "recognized."',
    'A Night Market in a parking lot, bustling with activity.',
    'A pickpocket working their way through the crowd.',
    'A rough crowd outside a bar sings off key.',
    'A small explosion in an alley. People stop, shrug, and move on.',
    'A street performer busking on the corner, playing a cover of a popular song.',
    'A suspicious individual scanning the crowd, clearly looking for someone or something.',
    'A trio of sex workers on a nearby corner.',
    'An edgerunner pounds on a vendit that ate their money.',
    'An Exec stumbling home drunk after a few too many.',
    'Gang members "standing guard" outside a bodega to scare off customers.',
    'Members from two rival gangs arguing over territory.',
    'Posters for a local band plastered on a wall.',
    'Two street vendors brawling in the street.',
]

export const encounterModerateMidnight = [
    'A building burning.',
    'A car being jacked by desperate-looking thieves.',
    'A drug deal going wrong.',
    'A gang of bikers roaring loudly down the street.',
    'A gang tagging a wall with graffiti, their scout watching for trouble.',
    'A group of shadowy figures loading stolen goods into an unmarked van.',
    'A group of teens trying to break into a building.',
    'A gunfight breaking out near a warehouse.',
    'A homeless person trying to sleep in a doorway.',
    'A lone police drone scanning alleys, its searchlight sweeping through the shadows.',
    'A loud argument between two individuals escalates into a fight.',
    'A manhole cover being pried open by someone with a cyberarm.',
    'A police car speeding past, sirens blaring.',
    'A preacher on the street corner insists the end is nigh.',
    'A streetlight flickering ominously as a shadowy figure lingers beneath it.',
    "A vendit's flamethrower barbecuing a would-be thief.",
    'An abandoned, overturned food cart.',
    'An armored person muttering quietly to themselves as they wander through an alley.',
    'Drunk gangers smashing car windows as they walk down the street.',
    'Drunk gangers throwing something through a shop window.',
]

// Combat Zone
export const encounterCombatZoneDay = [
    'A boarded-up store with a few hopeful signs of reopening.',
    "A gang's enforcer patrolling the street, nodding at locals while keeping an eye out for trouble.",
    'A graffiti artist tagging a wall with bright, defiant colors while their friend keeps watch.',
    'A group of locals gathered around a broken vendit, debating how to fix or rob it.',
    'A group of scavvers ripping cyberware out of a corpse.',
    'A group of young gangers arguing over turf.',
    'A group of young punks gathered around a portable speaker, blasting music and showing off gear.',
    'A local gang leader chatting with a vendor, collecting "protection fees."',
    'A makeshift repair shop set up on the sidewalk, fixing electronics for small fees.',
    'A pair of homeless individuals sharing a drink around a barrel fire.',
    "A police drone flies over the area but doesn't stop, seemingly uninterested in the chaos below.",
    "A sex worker chatting with a street vendor about last night's antics.",
    'A sidewalk stall owner chasing a shoplifter through the street.',
    'A small group of kids using a burnt-out car as their playground.',
    'A stickball game.',
    'A street performer juggling knives to entertain a small crowd of disinterested passersby.',
    'A street vendor laying out cheap, scavenged goods on a blanket.',
    'A streetrat injecting a drug into their system with an airhypo.',
    'Someone from outside the Zone being beaten and robbed.',
    'Two rival vendors arguing loudly over stall space.',
]

export const encounterCombatZoneNight = [
    'A burnt-out car reeking of CHOOH2. Charred corpses are still inside.',
    'A Fixer and their bodyguard walking into a nearby building.',
    'A gang checkpoint demanding payment or proof of allegiance to pass safely.',
    "A gang's lieutenant delivering a speech to their crew, rallying them for a night of action.",
    'A group of sex workers offering their services to anyone within earshot.',
    'A news drone hovering high overhead, filming the chaos for high-end viewers.',
    'A pair of locals trying to pry open a parked car with makeshift tools.',
    'A scavver trying to sell salvaged tech from a makeshift stall, nervously eying the crowd.',
    'A shop owner pulling down the heavy shutters on their store.',
    'A street performer balancing on a makeshift stage, trying to keep the crowd entertained and calm.',
    'A street vendor cooking SCOP in a gutter stove, drawing hungry locals.',
    'A streetlight flickering ominously as figures move in the shadows nearby.',
    'A sudden burst of gunfire nearby, followed by gang members scattering into the alleys.',
    'A trade deal between two gangs going bad.',
    'A young couple arguing loudly, attracting the attention of nearby gang members.',
    'A young punk being beaten by older gang members for disrespecting their territory.',
    'Gang members forming a circle, forcing two naked people inside to battle each other with knives.',
    'Gangers tagging a wall with their colors, their scouts watching for rival gangs.',
    'Sparks flying from a makeshift Tech workshop.',
    'Yogangers being chased by older gang members.',
]

export const encounterCombatZoneMidnight = [
    'A building blowing up.',
    'A family rushing through the streets, trying to reach their home.',
    "A family's home under attack by raiders, the sound of gunfire and screams piercing the night.",
    'A gang checkpoint stopping a nomad-driven truck.',
    'A gang lieutenant interrogating a captured rival, their crew watching with grim anticipation.',
    'A group of scavvers arguing over a haul of scrap.',
    'A heavily armed gang patrolling their turf, eying everyone who crosses their path.',
    'A heavily chromed individual suffering a cyberpsychotic incident.',
    'A local gang running through the streets, shooting anything that moves.',
    'A lone figure in the shadows, trying to sneak through the zone.',
    'A makeshift barricade blocking the street, guarded by heavily armed locals.',
    'A murder scene. No one seems to care.',
    'A mysterious art installation in an alley. No one knows how it got there.',
    'A sparking drone lying on the ground.',
    'An edgerunner, hand on gun, trying to solve a dispute peacefully.',
    'An unmarked strike force leaping out of a van, ready to grab individuals off the street.',
    'Screams. Nothing but screams.',
    'Trauma Team rocketing into the area, using suppressive fire to drive attackers away from their client.',
    'Two gang leaders holding an impromptu meeting in the middle of the road, guards surrounding them.',
    'Two rival gangs clashing in full-on warfare, gunfire lighting up the night.',
]

// Outskirts
export const encounterOutskirtsDay = [
    'A crumbling roadside attraction, its faded displays sparking faintly in the sunlight.',
    'A dead town, its empty streets echoing with the sound of wind and creaking buildings.',
    'A family stranded on the roadside, their vehicle broken down and in need of assistance.',
    'A group of scavvers picking through the wreckage of a crashed AV.',
    'A lone nomad caravan driving cautiously along the highway.',
    'A nomad trader selling salvaged tech and supplies from the back of a heavily modified truck.',
    'A road gang blocking the highway, demanding tolls from passing vehicles.',
    'A roadside diner fortified with armored walls, serving as a haven for weary travelers.',
    'A temporary town bustling with activity, its residents repairing scavenged equipment and trading.',
    'NorCal Highway Patrol Marshals riding their bikes and looking for trouble.',
]

export const encounterOutskirtsNight = [
    'A bizarre light in the sky, flickering erratically before vanishing without explanation.',
    'A camp sends up a flare, pleading for help as night raiders approach.',
    'A delta zooms overhead, angling for the airfield outside the city.',
    'A fortified roadside diner, offering sanctuary to those willing to pay for it.',
    'A lone wanderer walking along the road, their glowing cybernetics casting an eerie light.',
    'A makeshift barricade set up by road gangs, demanding a toll to let anyone pass.',
    'A heavily armed nomad convoy parked defensively along the road, their crew watching for trouble.',
    'A road battle between a pack of nomads and a Raffen Shiv group.',
    'A strange animal dashes across the road, before disappearing into the darkness.',
    'A vehicle burning as a lone family watches their life go up in flames.',
]

export const encounterOutskirtsMidnight = [
    'A cyberpsychotic Exotic attacks a vehicle, clawing at its sides before attempting to run off.',
    'A fireball explodes up from the ground in the distance.',
    "A ghost town's ruins are eerily illuminated by unknown, shifting lights in the sky.",
    'A lone nomad fires flares into the air, signaling for help.',
    'A massive, heavily modified truck speeding past, pursued by a gang of armed bikers.',
    'A violent clash at a roadblock as a convoy attempts to break through.',
    'Road spikes force a vehicle to stop; a gang emerges, weapons drawn, demanding everything.',
    'Something falls from the sky, crashing on the other side of the horizon.',
    'The vehicle is surrounded by shadowy figures wielding makeshift weapons, demanding a toll.',
    'The weather turns nasty as a dust storm rolls over the horizon.',
]

// ============================================
// ENCOUNTER LOOKUP MAP
// ============================================

export type EncounterZone = 'corporate' | 'moderate' | 'combatZone' | 'outskirts'
export type EncounterTime = 'day' | 'night' | 'midnight'

export const encounterTablesMap: Record<EncounterZone, Record<EncounterTime, string[]>> = {
    corporate: {
        day: encounterCorpDay,
        night: encounterCorpNight,
        midnight: encounterCorpMidnight,
    },
    moderate: {
        day: encounterModerateDay,
        night: encounterModerateNight,
        midnight: encounterModerateMidnight,
    },
    combatZone: {
        day: encounterCombatZoneDay,
        night: encounterCombatZoneNight,
        midnight: encounterCombatZoneMidnight,
    },
    outskirts: {
        day: encounterOutskirtsDay,
        night: encounterOutskirtsNight,
        midnight: encounterOutskirtsMidnight,
    },
}

// ============================================
// GENERATOR FUNCTIONS
// ============================================

/** Roll a random sensory detail (sight, sound, or smell) */
export const generateSensoryDetail = (): { type: string; detail: string } => {
    const typeRoll = rollD6()
    if (typeRoll <= 2) return { type: 'sight', detail: getRandomFromArray(sightsTable) }
    if (typeRoll <= 4) return { type: 'sound', detail: getRandomFromArray(soundsTable) }
    return { type: 'smell', detail: getRandomFromArray(smellsTable) }
}

/** Roll a random place to live */
export const generatePlaceToLive = (): { type: string; place: PlaceToLive } => {
    const typeRoll = rollD6()
    if (typeRoll <= 1) return { type: 'Cube Hotel', place: getRandomFromArray(cubeHotelsTable) }
    if (typeRoll <= 2) return { type: 'Cargo Container', place: getRandomFromArray(cargoContainersTable) }
    if (typeRoll <= 4) return { type: 'Corporate Conapt', place: getRandomFromArray(corporateConaptsTable) }
    return { type: 'Apartment', place: getRandomFromArray(apartmentBuildingsTable) }
}

/** Roll a random name by type */
export const generateRandomName = (type?: 'masc' | 'femme' | 'nonbinary'): { name: string; type: string } => {
    const nameType = type || (['masc', 'femme', 'nonbinary'] as const)[Math.floor(Math.random() * 3)]
    switch (nameType) {
        case 'masc': return { name: getRandomFromArray(mascNamesTable), type: 'Masc' }
        case 'femme': return { name: getRandomFromArray(femmeNamesTable), type: 'Femme' }
        case 'nonbinary': return { name: getRandomFromArray(nonbinaryNamesTable), type: 'Nonbinary' }
    }
}

/** Roll a random handle */
export const generateHandle = (): string => getRandomFromArray(handlesTable)

/** Roll a random NPC by role */
export const generateNPCByRole = (role?: string): { role: string; npc: NamedNPC } => {
    const selectedRole = role || getRandomFromArray(rolesTable)
    const table = npcByRoleMap[selectedRole] || npcNoRoleTable
    return { role: selectedRole, npc: getRandomFromArray(table) }
}

/** Roll a random encounter for a given zone and time */
export const generateRandomEncounter = (zone: EncounterZone, time: EncounterTime): string => {
    return getRandomFromArray(encounterTablesMap[zone][time])
}

/** Roll random corpse loot by type */
export const generateCorpseLoot = (type: 'streetrat' | 'edgerunner' | 'corporate'): string => {
    switch (type) {
        case 'streetrat': return getRandomFromArray(corpseLootStreetratTable)
        case 'edgerunner': return getRandomFromArray(corpseLootEdgerunnerTable)
        case 'corporate': return getRandomFromArray(corpseLootCorporateTable)
    }
}

/** Roll a random radio station */
export const generateRadioStation = (): RadioStation => getRandomFromArray(radioStationsTable)

/** Roll what's on screen */
export const generateTVShow = (): TVShow => getRandomFromArray(whatsOnScreenTable)

/** Roll a random mission item/macguffin */
export const generateMissionItem = (zone?: 'corporate' | 'moderate' | 'street' | 'nomad'): { zone: string; item: string } => {
    if (!zone) {
        const zoneRoll = rollD6()
        if (zoneRoll <= 2) zone = 'corporate'
        else if (zoneRoll <= 3) zone = 'moderate'
        else if (zoneRoll <= 5) zone = 'street'
        else zone = 'nomad'
    }
    switch (zone) {
        case 'corporate': return { zone: 'Corporate/High Tech', item: getRandomFromArray(missionItemsCorporateTable) }
        case 'moderate': return { zone: 'Moderate/Community', item: getRandomFromArray(missionItemsModerateTable) }
        case 'street': return { zone: 'Street/Combat Zone', item: getRandomFromArray(missionItemsStreetTable) }
        case 'nomad': return { zone: 'Nomad/Outskirts', item: getRandomFromArray(missionItemsNomadTable) }
    }
}

/** Roll a random venue (hotspot or bar) */
export const generateVenue = (): { type: string; venue: Venue } => {
    const isHotspot = rollD6() <= 3
    if (isHotspot) return { type: 'Hotspot', venue: getRandomFromArray(nightCityHotspotsTable) }
    return { type: 'Bar', venue: getRandomFromArray(nightCityBarsTable) }
}

/** Roll a random kibble or triti-fizz flavor */
export const generateFlavor = (): { type: string; flavor: FlavorItem } => {
    const isKibble = rollD6() <= 3
    if (isKibble) return { type: 'Kibble', flavor: getRandomFromArray(kibbleFlavorsTable) }
    return { type: 'Triti-Fizz', flavor: getRandomFromArray(tritiFizzTable) }
}

/** Roll a random relationship */
export const generateRelationship = (): string => getRandomFromArray(randomRelationshipsTable)

/** Roll a random visitor type */
export const generateVisitor = (): string => getRandomFromArray(visitorsTable)

/** Roll a random fashion */
export const generateFashion = (): string => getRandomFromArray(fashionTable)

/** Roll a random fashionware */
export const generateFashionware = (): string => getRandomFromArray(fashionwareTable)

/** Roll a random black ICE */
export const generateBlackIce = (): string => getRandomFromArray(blackIceTable)

/** Roll a random firearm type */
export const generateFirearm = (): string => getRandomFromArray(firearmsTable)

// === Individual table generators (split from combined generators) ===

/** Roll a random sight */
export const generateSight = (): string => getRandomFromArray(sightsTable)

/** Roll a random sound */
export const generateSound = (): string => getRandomFromArray(soundsTable)

/** Roll a random smell */
export const generateSmell = (): string => getRandomFromArray(smellsTable)

/** Roll a random hotspot */
export const generateHotspot = (): { name: string; description: string } => getRandomFromArray(nightCityHotspotsTable)

/** Roll a random bar */
export const generateBar = (): { name: string; description: string } => getRandomFromArray(nightCityBarsTable)

/** Roll a random cube hotel */
export const generateCubeHotel = (): PlaceToLive => getRandomFromArray(cubeHotelsTable)

/** Roll a random cargo container community */
export const generateCargoContainer = (): PlaceToLive => getRandomFromArray(cargoContainersTable)

/** Roll a random corporate conapt */
export const generateCorporateConapt = (): PlaceToLive => getRandomFromArray(corporateConaptsTable)

/** Roll a random apartment building */
export const generateApartment = (): PlaceToLive => getRandomFromArray(apartmentBuildingsTable)

/** Roll a random kibble flavor */
export const generateKibbleFlavor = (): FlavorItem => getRandomFromArray(kibbleFlavorsTable)

/** Roll a random triti-fizz flavor */
export const generateTritiFizz = (): FlavorItem => getRandomFromArray(tritiFizzTable)

// === ADVERTISEMENTS TABLE (1d10) - PDF Page 64 ===
// The book contains image-based ads; these are faithful text recreations in Cyberpunk RED style

export const advertisementsTable: { product: string; ad: string }[] = [
    { product: 'Kibble SportFlakes', ad: "Start your morning like a champion! Kibble SportFlakes — fueling Night City's finest athletes since 2035. Now with 40% more protein paste!" },
    { product: 'Triti-Fizz Lightning', ad: 'A TINGLE ON YOUR TASTE BUDS! Triti-Fizz Lightning — the official drink of the Night City Heat. Crack one open after a long night in the Zone.' },
    { product: 'Trauma Team Platinum', ad: 'When seconds matter, Trauma Team delivers. Upgrade to Platinum today. Because you deserve to survive. Terms and conditions apply.' },
    { product: 'No/Brainer App', ad: 'Download No/Brainer — the app that thinks so you do not have to. Powered by GunMart. Available on all Agent devices. Your brain called. It wants a break.' },
    { product: 'Rocklin Augmentics', ad: "Chrome never looked so good. Rocklin Augmentics — where style meets cyberware. Book your consultation today. You're worth the upgrade." },
    { product: 'Oasis Convenience', ad: 'Open 24/7, 365. Oasis — everything you need, every corner you turn. Affordable snacks, ammo, and first-aid kits. Life in Night City just got easier.' },
    { product: 'Segotari GameDeck', ad: 'ESCAPE REALITY. The new Segotari GameDeck immerses you in worlds beyond the smog. Pre-order now and get a free braindance sampler!' },
    { product: 'REO Meatwagon', ad: 'Flatlining? REO Meatwagon — budget paramedics for budget prices. We show up. Usually. Plans starting at 50eb/month.' },
    { product: 'SlamDance Personal Defense', ad: 'SlamDance Inc presents the Hammerhead — a compact, concealable weapon for the discerning citizen. Because in Night City, trouble finds you first.' },
    { product: 'Continental Brands Maple Syrup', ad: "The ORIGINAL synthetic maple syrup. Continental Brands — making mornings tolerable since 2020. Pairs well with Kibble Extra Fluffy Pancake. It's almost real!" },
]

/** Roll a random advertisement */
export const generateAdvertisement = (): { product: string; ad: string } => getRandomFromArray(advertisementsTable)
