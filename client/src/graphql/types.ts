export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Armor = {
  __typename?: 'Armor';
  h: Scalars['Int']['output'];
  spb: Scalars['Int']['output'];
};

export enum Attitude {
  AGGRESSIVE = 'AGGRESSIVE',
  BRIBING = 'BRIBING',
  FEARFUL = 'FEARFUL',
  FOCUSED_ON_SOMETHING_ELSE = 'FOCUSED_ON_SOMETHING_ELSE',
  INFIGHTING = 'INFIGHTING',
  PARTING = 'PARTING',
  PLANNING = 'PLANNING',
  PROVISIONING = 'PROVISIONING',
  ROBBING_ASSAULTING = 'ROBBING_ASSAULTING'
}

export type Bounty = {
  __typename?: 'Bounty';
  ID: Scalars['ID']['output'];
  character: Character;
  crimes: Array<Crime>;
  rep: BountyRep;
  speciality: CrimeType;
};

export enum BountyRep {
  BRAGGER = 'BRAGGER',
  LOWPRO = 'LOWPRO'
}

export type BribeCrime = Crime & {
  __typename?: 'BribeCrime';
  crimeType: CrimeType;
  multiplier: Scalars['Int']['output'];
  reward: Scalars['Int']['output'];
  target: BribeTarget;
};

export enum BribeTarget {
  CITIZEN = 'CITIZEN',
  COP = 'COP',
  CORPO = 'CORPO',
  EXEC = 'EXEC',
  POLITICIAN = 'POLITICIAN'
}

export type Building = {
  __typename?: 'Building';
  ID: Scalars['ID']['output'];
  backupLights: Scalars['Boolean']['output'];
  description: Scalars['String']['output'];
  elevators: Scalars['Boolean']['output'];
  emergencyExit: Scalars['Boolean']['output'];
  event: BuildingEvent;
  gatehouseFrontDesk: Scalars['Boolean']['output'];
  image: Scalars['String']['output'];
  isAbandoned: Scalars['Boolean']['output'];
  landingPad: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  ownership: BuildingOwnership;
  parking: Scalars['Boolean']['output'];
  secret: BuildingSecret;
  secretOrAltEntrance: Scalars['Boolean']['output'];
  securityPersonnel: BuildingSecurityPersonnel;
  style: BuildingStyle;
  type: BuildingType;
};

export type BuildingComplication = {
  __typename?: 'BuildingComplication';
  character?: Maybe<Character>;
  item?: Maybe<Item>;
  type: PlotBuildingComplicationType;
};

export enum BuildingEvent {
  CRUMBLING_DEMOLITION = 'CRUMBLING_DEMOLITION',
  EDGERUNNERS_GOING_SAME_PLACE = 'EDGERUNNERS_GOING_SAME_PLACE',
  ELITE_CREW_VISITING = 'ELITE_CREW_VISITING',
  GUN_FIGHT = 'GUN_FIGHT',
  MAINTENANCE_PROBLEM = 'MAINTENANCE_PROBLEM',
  NETRUNNER_MESSING_WITH_SYSTEMS = 'NETRUNNER_MESSING_WITH_SYSTEMS',
  ONGOING_KIDNAP = 'ONGOING_KIDNAP',
  OWNERS_COLLECTING_RENT = 'OWNERS_COLLECTING_RENT',
  PRIVATE_INVESTIGATOR = 'PRIVATE_INVESTIGATOR',
  STRIKE = 'STRIKE',
  STRONG_SECURITY_PRESENCE = 'STRONG_SECURITY_PRESENCE',
  WORKERS_REMODELING = 'WORKERS_REMODELING'
}

export enum BuildingOwnership {
  BYSTANDER = 'BYSTANDER',
  CORPO = 'CORPO',
  FIXER = 'FIXER',
  GANG_MAFIA = 'GANG_MAFIA',
  GOVERNMENT = 'GOVERNMENT',
  LOCAL_GOV = 'LOCAL_GOV',
  LOW_LEVEL_GONKS = 'LOW_LEVEL_GONKS',
  MEGA_CORPO = 'MEGA_CORPO',
  MILITARISTIC_GANG = 'MILITARISTIC_GANG',
  NO_ONE_SCAVS = 'NO_ONE_SCAVS',
  POSERGANG = 'POSERGANG',
  SMALL_BUSINESS = 'SMALL_BUSINESS'
}

export enum BuildingSecret {
  ACTIVIST_SABOTAGE = 'ACTIVIST_SABOTAGE',
  COVERT_OP_MEETING_POINT = 'COVERT_OP_MEETING_POINT',
  DATA_STORE_NETRUNNER_DEN = 'DATA_STORE_NETRUNNER_DEN',
  DRUG_LAB = 'DRUG_LAB',
  DRUG_STASH = 'DRUG_STASH',
  FIXER_ARRANGEMENT = 'FIXER_ARRANGEMENT',
  MEDIA_INVESTIGATION = 'MEDIA_INVESTIGATION',
  PARTY = 'PARTY',
  SAFE_HOUSE = 'SAFE_HOUSE',
  SECRET_SCIENCE_LAB = 'SECRET_SCIENCE_LAB',
  SOMEONE_KIDNAPPED = 'SOMEONE_KIDNAPPED',
  WEAPON_STASH = 'WEAPON_STASH'
}

export enum BuildingSecurityPersonnel {
  BORG = 'BORG',
  CITY_SEC = 'CITY_SEC',
  CORPO_SEC = 'CORPO_SEC',
  ELITE_TROOPS = 'ELITE_TROOPS',
  FAST_RESPONSE_BACKUP = 'FAST_RESPONSE_BACKUP',
  HEAVY_VEHICLES = 'HEAVY_VEHICLES',
  HEAVY_WEAPONS = 'HEAVY_WEAPONS',
  LOCALS_TENNANTS = 'LOCALS_TENNANTS',
  LOCAL_SEC_GANG = 'LOCAL_SEC_GANG',
  NONE = 'NONE',
  RESPONSE_BACKUP = 'RESPONSE_BACKUP',
  VEHICLES = 'VEHICLES'
}

export enum BuildingStyle {
  AUSTERE = 'AUSTERE',
  CORPORATE = 'CORPORATE',
  EUROPEAN = 'EUROPEAN',
  EXOTIC = 'EXOTIC',
  LUXURIOUS = 'LUXURIOUS',
  MILITARISTIC = 'MILITARISTIC',
  MODERN = 'MODERN',
  NEON_FEST = 'NEON_FEST',
  ORIENTAL = 'ORIENTAL',
  SOVIETIC = 'SOVIETIC',
  TRIBAL = 'TRIBAL',
  URBAN_GRAFFITI = 'URBAN_GRAFFITI'
}

export enum BuildingType {
  ABANDONED_BUILDING = 'ABANDONED_BUILDING',
  COMMERCIAL_BUILDING = 'COMMERCIAL_BUILDING',
  CORPO_BUILDING = 'CORPO_BUILDING',
  CUBE_HOTEL_MOTEL_CARGO_CONTAINER = 'CUBE_HOTEL_MOTEL_CARGO_CONTAINER',
  ESTABLISHMENT = 'ESTABLISHMENT',
  GOV_BUILDING = 'GOV_BUILDING',
  LUXURY_PENTHOUSE_MCMANSION = 'LUXURY_PENTHOUSE_MCMANSION',
  MEGACORPO_HQ = 'MEGACORPO_HQ',
  MULTI_STORY_BUILDING = 'MULTI_STORY_BUILDING',
  PUBLIC_SPACE = 'PUBLIC_SPACE',
  SKYSCRAPER_MEGABUILDING = 'SKYSCRAPER_MEGABUILDING',
  VACANT_LOT_CONSTRUCTION_SITE = 'VACANT_LOT_CONSTRUCTION_SITE'
}

export type Character = {
  __typename?: 'Character';
  ID: Scalars['ID']['output'];
  attitude: CharacterAttitude;
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: CharacterType;
};

export enum CharacterAttitude {
  COLD_AND_PROFESSIONAL = 'COLD_AND_PROFESSIONAL',
  CONSIDERS_A_CREW_MEMBER_A_GOOD_FRIEND = 'CONSIDERS_A_CREW_MEMBER_A_GOOD_FRIEND',
  CONSIDERS_A_CREW_MEMBER_A_PARTNER = 'CONSIDERS_A_CREW_MEMBER_A_PARTNER',
  DOESN_T_TRUST_THE_CREW = 'DOESN_T_TRUST_THE_CREW',
  GENERALLY_DISLIKES_THE_CREW = 'GENERALLY_DISLIKES_THE_CREW',
  NEUTRAL_ATTITUDE_TOWARDS_THE_CREW = 'NEUTRAL_ATTITUDE_TOWARDS_THE_CREW',
  THINKS_THE_CREW_COULD_BE_POTENTIAL_ALLIES = 'THINKS_THE_CREW_COULD_BE_POTENTIAL_ALLIES',
  TRUSTS_IN_THE_CREW_S_DECISIONS = 'TRUSTS_IN_THE_CREW_S_DECISIONS',
  WANTS_A_CREW_MEMBER_DEAD = 'WANTS_A_CREW_MEMBER_DEAD',
  WORSHIPS_A_CREW_MEMBER = 'WORSHIPS_A_CREW_MEMBER'
}

export enum CharacterType {
  AVERAGE_CITIZEN_STREETRAT = 'AVERAGE_CITIZEN_STREETRAT',
  CELEBRITY = 'CELEBRITY',
  CORPORATE_EXEC = 'CORPORATE_EXEC',
  GOVERNMENT_OFFICIAL = 'GOVERNMENT_OFFICIAL',
  MERCENARY_FREELANCER_ASSASSIN = 'MERCENARY_FREELANCER_ASSASSIN',
  NETRUNNER_HACKER = 'NETRUNNER_HACKER',
  NOMAD = 'NOMAD',
  POLICE_LAWMAN = 'POLICE_LAWMAN',
  POLITICIAN = 'POLITICIAN',
  POP_STAR = 'POP_STAR',
  RELIGIOUS_FIGURE = 'RELIGIOUS_FIGURE',
  RIPPERDOC = 'RIPPERDOC',
  TECH = 'TECH',
  TERRORIST = 'TERRORIST'
}

export enum CharacterVerb {
  ESCORT = 'ESCORT',
  INTERROGATE = 'INTERROGATE',
  INTIMIDATE = 'INTIMIDATE',
  INVESTIGATE = 'INVESTIGATE',
  KILL = 'KILL',
  RECRUIT = 'RECRUIT',
  RESCUE = 'RESCUE',
  ROB = 'ROB'
}

export type CharacterVerbWrapper = Verb & {
  __typename?: 'CharacterVerbWrapper';
  value: CharacterVerb;
};

export type ContrabandCrime = Crime & {
  __typename?: 'ContrabandCrime';
  crimeType: CrimeType;
  multiplier: Scalars['Int']['output'];
  reward: Scalars['Int']['output'];
  target: ContrabandTarget;
};

export enum ContrabandTarget {
  COSTLY = 'COSTLY',
  EXPENSIVE = 'EXPENSIVE',
  LUXURY = 'LUXURY',
  PREMIUM = 'PREMIUM',
  SUPER_LUXURY = 'SUPER_LUXURY',
  VERY_EXPENSIVE = 'VERY_EXPENSIVE'
}

export type Crime = {
  crimeType: CrimeType;
  multiplier: Scalars['Int']['output'];
  reward: Scalars['Int']['output'];
};

export enum CrimeType {
  BRIBE = 'BRIBE',
  CONTRABAND = 'CONTRABAND',
  DRUG = 'DRUG',
  MURDER = 'MURDER',
  THEFT = 'THEFT'
}

export enum CyberwareQuality {
  EXCELLENT = 'EXCELLENT',
  POOR = 'POOR',
  STANDARD = 'STANDARD'
}

export type Dices = {
  __typename?: 'Dices';
  d4?: Maybe<Scalars['Int']['output']>;
  d6?: Maybe<Scalars['Int']['output']>;
  d8?: Maybe<Scalars['Int']['output']>;
  d10?: Maybe<Scalars['Int']['output']>;
  d12?: Maybe<Scalars['Int']['output']>;
  d20?: Maybe<Scalars['Int']['output']>;
  d100?: Maybe<Scalars['Int']['output']>;
};

export type DrugCrime = Crime & {
  __typename?: 'DrugCrime';
  crimeType: CrimeType;
  multiplier: Scalars['Int']['output'];
  reward: Scalars['Int']['output'];
  target: DrugTarget;
};

export enum DrugTarget {
  BLACK_LACE = 'BLACK_LACE',
  BLUE_GLASS = 'BLUE_GLASS',
  BOOST = 'BOOST',
  SMASH = 'SMASH',
  SYNTHCOKE = 'SYNTHCOKE'
}

export type FixerJob = {
  __typename?: 'FixerJob';
  ID: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  difficulty: JobDifficulty;
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  plot: Plot;
};

export enum Flaw {
  AMMO_WEAPON_SHORTAGE = 'AMMO_WEAPON_SHORTAGE',
  DEBT_LACK_OF_INCOME = 'DEBT_LACK_OF_INCOME',
  DRUG_ADDICTS = 'DRUG_ADDICTS',
  ILLITERATE_UNEDUCATED = 'ILLITERATE_UNEDUCATED',
  INEXPERIENCED_NEGOTIATORS = 'INEXPERIENCED_NEGOTIATORS',
  LACKLUSTER_LEADERSHIP = 'LACKLUSTER_LEADERSHIP',
  LACK_OF_RECRUITS = 'LACK_OF_RECRUITS',
  NAIVE = 'NAIVE'
}

export type Gang = {
  __typename?: 'Gang';
  ID: Scalars['ID']['output'];
  armor: Armor;
  color: GangColor;
  currentAttitude: Attitude;
  cyberwareQuality: CyberwareQuality;
  description: Scalars['String']['output'];
  flaw: Flaw;
  image: Scalars['String']['output'];
  knownFor: KnownFor;
  name: Scalars['String']['output'];
  newsTheLeaderIsReceiving: GangNews;
  secretive: Scalars['Int']['output'];
  sin: Sin;
  skill: Scalars['Int']['output'];
  status: GangStatus;
  type: GangType;
  weapons: Dices;
};

export enum GangColor {
  BLACK = 'BLACK',
  BLUE = 'BLUE',
  BRIGHTS = 'BRIGHTS',
  BROWNS = 'BROWNS',
  GREEN = 'GREEN',
  ORANGE = 'ORANGE',
  RED = 'RED',
  VIOLET = 'VIOLET',
  WHITE = 'WHITE',
  YELLOW = 'YELLOW'
}

export type GangComplication = {
  __typename?: 'GangComplication';
  character?: Maybe<Character>;
  item?: Maybe<Item>;
  type: PlotGangComplicationType;
};

export enum GangNameType {
  ADJECTIVE = 'ADJECTIVE',
  ANIMAL = 'ANIMAL',
  BODY_PART = 'BODY_PART',
  COLOR = 'COLOR',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  NUMBER = 'NUMBER',
  PLACE = 'PLACE',
  PROFESSION = 'PROFESSION',
  WEAPON = 'WEAPON',
  WEATHER_PHENOMENA = 'WEATHER_PHENOMENA'
}

export enum GangNews {
  BEING_SABOTAGED = 'BEING_SABOTAGED',
  COP_RAIDING = 'COP_RAIDING',
  GAINED_TERRITORY = 'GAINED_TERRITORY',
  JOB_BLEW_UP = 'JOB_BLEW_UP',
  LAB_STASH_ROBBED = 'LAB_STASH_ROBBED',
  NEW_ENEMY = 'NEW_ENEMY',
  POLICE_COMING = 'POLICE_COMING',
  TEAM_RELEASED = 'TEAM_RELEASED'
}

export enum GangStatus {
  CIVIL_WAR = 'CIVIL_WAR',
  HUNTED_BY_ALL = 'HUNTED_BY_ALL',
  IGNORED_BY_ALL = 'IGNORED_BY_ALL',
  INTEGRATED_WITH_NEIGHBORS = 'INTEGRATED_WITH_NEIGHBORS',
  OUTSIDERS_INFILTRATED = 'OUTSIDERS_INFILTRATED',
  SHAKY_TRUCE = 'SHAKY_TRUCE',
  STABLE_TRUCE = 'STABLE_TRUCE',
  TURF_CONFLICT_MULTI_SIDED = 'TURF_CONFLICT_MULTI_SIDED',
  TURF_CONFLICT_TWO_SIDED = 'TURF_CONFLICT_TWO_SIDED',
  VASSAL = 'VASSAL'
}

export enum GangType {
  BOOSTER = 'BOOSTER',
  EDGERUNNER = 'EDGERUNNER',
  FREELANCER = 'FREELANCER',
  GUARDIAN_VIGILANTE = 'GUARDIAN_VIGILANTE',
  MILITARY = 'MILITARY',
  POSER = 'POSER',
  PRANKSTER = 'PRANKSTER',
  RELIGIOUS = 'RELIGIOUS',
  SYNDICATE = 'SYNDICATE',
  YO = 'YO'
}

export type Item = {
  __typename?: 'Item';
  ID: Scalars['ID']['output'];
  condition: ItemCondition;
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: ItemType;
};

export enum ItemCondition {
  AVERAGE_QUALITY = 'AVERAGE_QUALITY',
  BELOW_AVERAGE_QUALITY = 'BELOW_AVERAGE_QUALITY',
  BRAND_NEW_AND_IN_GREAT_CONDITION = 'BRAND_NEW_AND_IN_GREAT_CONDITION',
  BROKEN_AND_IN_PIECES = 'BROKEN_AND_IN_PIECES',
  COLLECTORS_ITEM_FEW_IN_EXISTENCE = 'COLLECTORS_ITEM_FEW_IN_EXISTENCE',
  ENHANCED_IN_SOME_WAY_AND_SOUGHT_AFTER = 'ENHANCED_IN_SOME_WAY_AND_SOUGHT_AFTER',
  FUNCTIONAL_AND_UTILITARIAN = 'FUNCTIONAL_AND_UTILITARIAN',
  GOOD_CONDITION_BUT_USED = 'GOOD_CONDITION_BUT_USED',
  LOW_GRADE_CHEAP_MATERIALS = 'LOW_GRADE_CHEAP_MATERIALS',
  ONE_OF_A_KIND_ITEM_TOP_QUALITY = 'ONE_OF_A_KIND_ITEM_TOP_QUALITY'
}

export enum ItemType {
  AI_ROBOT_DRONE = 'AI_ROBOT_DRONE',
  BIOLOGICAL_SAMPLES = 'BIOLOGICAL_SAMPLES',
  CYBERWARE = 'CYBERWARE',
  DIGITAL_FILES = 'DIGITAL_FILES',
  DRUGS_ILLEGAL_CONTRABAND = 'DRUGS_ILLEGAL_CONTRABAND',
  EXOTIC_ANIMAL = 'EXOTIC_ANIMAL',
  FOOD_FUELS_SUPPLIES = 'FOOD_FUELS_SUPPLIES',
  MONEY = 'MONEY',
  VEHICLE = 'VEHICLE',
  WEAPONS = 'WEAPONS'
}

export enum ItemVerb {
  DELIVER = 'DELIVER',
  DESTROY = 'DESTROY',
  HIDE = 'HIDE',
  MODIFY = 'MODIFY',
  STEAL = 'STEAL',
  TRADE = 'TRADE',
  USE = 'USE'
}

export type ItemVerbWrapper = Verb & {
  __typename?: 'ItemVerbWrapper';
  value: ItemVerb;
};

export enum JobDifficulty {
  DANGEROUS = 'DANGEROUS',
  EASY = 'EASY',
  TYPICAL = 'TYPICAL'
}

export type KnownFor = {
  __typename?: 'KnownFor';
  knownForPart1: KnownForPart1;
  knownForPart2: KnownForPart2;
};

export enum KnownForPart1 {
  CHEAP = 'CHEAP',
  COLD = 'COLD',
  EXPENSIVE = 'EXPENSIVE',
  HOT = 'HOT',
  HUGE = 'HUGE',
  LOCAL = 'LOCAL',
  LUXURIOUS = 'LUXURIOUS',
  OVERRATED = 'OVERRATED',
  SHADY = 'SHADY',
  SMALL = 'SMALL'
}

export enum KnownForPart2 {
  ATTITUDE = 'ATTITUDE',
  BELIEVES = 'BELIEVES',
  BUDGET = 'BUDGET',
  EGO = 'EGO',
  EQUIPMENT = 'EQUIPMENT',
  HQ = 'HQ',
  RECRUITS = 'RECRUITS',
  TURF = 'TURF',
  VEHICLES = 'VEHICLES',
  WEAPONS = 'WEAPONS'
}

export type MurderCrime = Crime & {
  __typename?: 'MurderCrime';
  crimeType: CrimeType;
  multiplier: Scalars['Int']['output'];
  reward: Scalars['Int']['output'];
  target: MurderTarget;
};

export enum MurderTarget {
  CITIZEN = 'CITIZEN',
  COP = 'COP',
  CORPO = 'CORPO',
  EXEC = 'EXEC',
  GANGER = 'GANGER',
  NOBODY = 'NOBODY'
}

export type Plot = {
  __typename?: 'Plot';
  plotBuilding: PlotBuilding;
  plotComplication: PlotComplication;
  plotSubject?: Maybe<PlotSubject>;
  verb: PlotVerb;
};

export type PlotBuilding = {
  __typename?: 'PlotBuilding';
  building: Building;
  complication: BuildingComplication;
};

export enum PlotBuildingComplicationType {
  ACCIDENT_ZONE_INVOLVES_SHIPMENT_OF_ITEM = 'ACCIDENT_ZONE_INVOLVES_SHIPMENT_OF_ITEM',
  CCTV_POLICE_SURVEILLANCE_IS_HEAVY = 'CCTV_POLICE_SURVEILLANCE_IS_HEAVY',
  CONCERT_HOSTED_BY_CHARACTER = 'CONCERT_HOSTED_BY_CHARACTER',
  FORTIFIED_POSITIONS_BY_SECURITY_PERSONNEL_BECAUSE_OF_ITEM = 'FORTIFIED_POSITIONS_BY_SECURITY_PERSONNEL_BECAUSE_OF_ITEM',
  HEAVY_TRAFFIC = 'HEAVY_TRAFFIC',
  NEED_ID_PASSWORD_TO_GET_IN_HELD_BY_CHARACTER = 'NEED_ID_PASSWORD_TO_GET_IN_HELD_BY_CHARACTER',
  NO_GUN_ZONE = 'NO_GUN_ZONE',
  RECENTLY_TAGGED_AND_LOOTED = 'RECENTLY_TAGGED_AND_LOOTED',
  SHOOTOUT_WITH_POLICE_AND_CYBERPSYCHO_CHARACTER = 'SHOOTOUT_WITH_POLICE_AND_CYBERPSYCHO_CHARACTER',
  TRAUMA_TEAM_ON_THE_SCENE = 'TRAUMA_TEAM_ON_THE_SCENE'
}

export enum PlotBuildingVerb {
  DEFEND = 'DEFEND',
  INVESTIGATE = 'INVESTIGATE',
  LOOT = 'LOOT',
  OCCUPY = 'OCCUPY',
  VANDALIZE = 'VANDALIZE'
}

export type PlotBuildingVerbWrapper = Verb & {
  __typename?: 'PlotBuildingVerbWrapper';
  value: PlotBuildingVerb;
};

export type PlotComplication = {
  __typename?: 'PlotComplication';
  character?: Maybe<Character>;
  item?: Maybe<Item>;
  type: PlotComplicationType;
};

export enum PlotComplicationType {
  AREA_IS_A_COMMON_DRUG_SALE_ZONE = 'AREA_IS_A_COMMON_DRUG_SALE_ZONE',
  AREA_IS_PATROLLED_BY_POLICE = 'AREA_IS_PATROLLED_BY_POLICE',
  AREA_SUFFERS_A_POWER_OUTAGE = 'AREA_SUFFERS_A_POWER_OUTAGE',
  CHARACTER_HUNTING_CREW = 'CHARACTER_HUNTING_CREW',
  FLASH_FLOOD_HEAVY_RAIN_HEAVY_FOG = 'FLASH_FLOOD_HEAVY_RAIN_HEAVY_FOG',
  HEAVY_WELL_ARMED_SECURITY_FOR_ITEM = 'HEAVY_WELL_ARMED_SECURITY_FOR_ITEM',
  INNOCENT_BYSTANDERS = 'INNOCENT_BYSTANDERS',
  THEY_KNOW_THE_CREW_IS_COMING = 'THEY_KNOW_THE_CREW_IS_COMING',
  THE_CREW_DOESN_T_GET_PAID_STIFFED = 'THE_CREW_DOESN_T_GET_PAID_STIFFED',
  THE_CREW_IS_ON_THEIR_OWN = 'THE_CREW_IS_ON_THEIR_OWN'
}

export type PlotGang = {
  __typename?: 'PlotGang';
  complication: GangComplication;
  gang: Gang;
};

export enum PlotGangComplicationType {
  BEING_SABOTAGED_BY_CHARACTER = 'BEING_SABOTAGED_BY_CHARACTER',
  BLACKMAILED_BY_CHARACTER = 'BLACKMAILED_BY_CHARACTER',
  BUILT_AROUND_CHARACTER = 'BUILT_AROUND_CHARACTER',
  LEADER_IS_CHARACTER = 'LEADER_IS_CHARACTER',
  POLICE_RAIDING = 'POLICE_RAIDING',
  RECENTLY_LOST_CONTROL = 'RECENTLY_LOST_CONTROL',
  REVERES_AI_CONTAINED_IN_ITEM_AS_RELIGIOUS_SYMBOL = 'REVERES_AI_CONTAINED_IN_ITEM_AS_RELIGIOUS_SYMBOL',
  RUNNING_SMUGGLING_FOR_ITEM = 'RUNNING_SMUGGLING_FOR_ITEM',
  SPLIT_OVER_IDEOLOGY_PUSHED_BY_CHARACTER = 'SPLIT_OVER_IDEOLOGY_PUSHED_BY_CHARACTER'
}

export enum PlotGangVerb {
  ALLY_WITH = 'ALLY_WITH',
  CHALLENGE = 'CHALLENGE',
  INFILTRATE = 'INFILTRATE',
  INVESTIGATE = 'INVESTIGATE',
  NEGOTIATE_WITH = 'NEGOTIATE_WITH',
  SABOTAGE = 'SABOTAGE'
}

export type PlotGangVerbWrapper = Verb & {
  __typename?: 'PlotGangVerbWrapper';
  value: PlotGangVerb;
};

export type PlotSubject = Character | Item | PlotGang;

export type PlotVerb = CharacterVerbWrapper | ItemVerbWrapper | PlotBuildingVerbWrapper | PlotGangVerbWrapper;

export enum Sin {
  ENVY = 'ENVY',
  GLUTTONY = 'GLUTTONY',
  GREED = 'GREED',
  LUST = 'LUST',
  PRIDE = 'PRIDE',
  SLOTH = 'SLOTH',
  WRATH = 'WRATH'
}

export type TheftCrime = Crime & {
  __typename?: 'TheftCrime';
  crimeType: CrimeType;
  multiplier: Scalars['Int']['output'];
  reward: Scalars['Int']['output'];
  target: TheftTarget;
};

export enum TheftTarget {
  MEGA_CORP = 'MEGA_CORP',
  MINI_CORP = 'MINI_CORP',
  OASIS = 'OASIS',
  POOR_SOUL = 'POOR_SOUL',
  PUBLIC_ELEMENT = 'PUBLIC_ELEMENT',
  VENDIT = 'VENDIT'
}

export type Verb = {
  value: Scalars['String']['output'];
};
