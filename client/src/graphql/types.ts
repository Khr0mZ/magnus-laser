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
  NONE = 'NONE',
  PARTING = 'PARTING',
  PLANNING = 'PLANNING',
  PROVISIONING = 'PROVISIONING',
  ROBBING_ASSAULTING = 'ROBBING_ASSAULTING'
}

export type Building = {
  __typename?: 'Building';
  ID: Scalars['ID']['output'];
  backupLights: Scalars['Boolean']['output'];
  description: Scalars['String']['output'];
  elevators: Scalars['Boolean']['output'];
  emergencyExit: Scalars['Boolean']['output'];
  event: Event;
  gatehouseFrontDesk: Scalars['Boolean']['output'];
  landingPad: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  ownership: Ownership;
  parking: Scalars['Boolean']['output'];
  secret: Secret;
  secretOrAltEntrance: Scalars['Boolean']['output'];
  securityPersonnel: SecurityPersonnel;
  style: Style;
  type: BuildingType;
};

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

export enum Event {
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

export enum Flaw {
  AMMO_WEAPON_SHORTAGE = 'AMMO_WEAPON_SHORTAGE',
  DEBT_LACK_OF_INCOME = 'DEBT_LACK_OF_INCOME',
  DRUG_ADDICTS = 'DRUG_ADDICTS',
  ILLITERATE_UNEDUCATED = 'ILLITERATE_UNEDUCATED',
  INEXPERIENCED_NEGOTIATORS = 'INEXPERIENCED_NEGOTIATORS',
  LACKLUSTER_LEADERSHIP = 'LACKLUSTER_LEADERSHIP',
  LACK_OF_RECRUITS = 'LACK_OF_RECRUITS',
  NAIVE = 'NAIVE',
  NONE = 'NONE'
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
  NONE = 'NONE',
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

export enum Ownership {
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

export enum Secret {
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

export enum SecurityPersonnel {
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

export enum Sin {
  ENVY = 'ENVY',
  GLUTTONY = 'GLUTTONY',
  GREED = 'GREED',
  LUST = 'LUST',
  NONE = 'NONE',
  PRIDE = 'PRIDE',
  SLOTH = 'SLOTH',
  WRATH = 'WRATH'
}

export enum Style {
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
