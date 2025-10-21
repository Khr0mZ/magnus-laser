# Combat Simulator - Current Implementation Status

## Overview

The Combat Simulator has been fully implemented with real-time sync between DM and players. Key features include:

- **Per-Map Initiative**: Each map maintains its own initiative state (active token, round, combat status, auto-settings)
- **Per-Map Roll History**: Roll history is isolated per map and sorted by timestamp
- **Real-time Sync**: Full integration with session plumbing for multiplayer support
- **Persistent Settings**: Auto-roll damage and auto-reroll initiative settings are stored per-map

## Current Implementation (Completed)

- ✅ **Database Schema**: All tables implemented with proper indexing
- ✅ **Persistence**: Initiative and roll history persist across sessions
- ✅ **Sync System**: Full integration with CombatSimSync for multiplayer
- ✅ **Per-Map State**: All combat state is properly isolated per map
- ✅ **Real-time Updates**: Changes sync immediately between DM and players

## Current State (Repo)

- ✅ **Database Schema**: Dexie includes all combat simulator tables with proper per-map indexing
- ✅ **Session Networking**: Full integration with `WireMsg` types for real-time sync
- ✅ **Combat Sim Types**: Updated with per-map initiative and roll history types
- ✅ **UI Implementation**: CombatSimView fully integrated with persistence and sync
- ✅ **CombatSimSync**: Complete implementation for DM-player synchronization
- ✅ **State Management**: Automatic loading/saving of per-map combat state

## Database Schema

Current Dexie version includes all combat simulator tables with proper indexing for per-map state isolation.

**DM Tables:**

```ts
boardMaps: "id, &name";
tokens: "id, mapId";
maps: "id, &name";
walls: "id, mapId";
images: "id, &name";
blasts: "id, mapId";
initiative: "mapId"; // Per-map initiative state
rollHistory: "id, tokenId, timestamp, mapId"; // Per-map roll history
```

**Session Tables (Players):**

```ts
sessionBoardMaps: "id, &name";
sessionTokens: "id, mapId";
sessionMaps: "id, &name";
sessionWalls: "id, mapId";
sessionImages: "id, &name";
sessionBlasts: "id, mapId";
sessionInitiative: "mapId"; // Per-map initiative state
sessionRollHistory: "id, tokenId, timestamp, mapId"; // Per-map roll history
```

**Type Definitions:**

```ts
type Initiative = {
  mapId: string; // Changed from boardMapId to mapId for per-map state
  activeTokenId: string | null;
  currentRound: number;
  isCombatActive: boolean;
  autoRerollInitiative: boolean;
  autoRollDamage: boolean; // Added per-map auto-roll damage setting
  initiativeRolls: Record<string, number>;
};

type RollHistoryEntry = {
  id: string;
  timestamp: number;
  tokenId: string;
  tokenName: string;
  rollType: RollType;
  result: RollResult;
  damageResult?: RollResult;
  damageRevealed?: boolean;
  mapId: string; // Added mapId for per-map isolation
};
```

## Network Protocol (WireMsg-aligned)

We reuse the existing `WireMsg` channel:

- Full sync: `STATE_SNAPSHOT { snapshot }` from DM to all players.
- Incremental: `STATE_PATCH { base, patch }` from DM to all players.
- Player intentions: `ACTION { id, actor, action }` from player to DM host.

Patch representation inside `GameSnapshot`:

```ts
// Extend GameSnapshot.custom for Combat Sim
interface CombatSimPatchOp {
  table:
    | "boardMaps"
    | "tokens"
    | "maps"
    | "walls"
    | "images"
    | "blasts"
    | "initiative"
    | "rollHistory";
  op: "insert" | "update" | "delete";
  record: unknown;
}

type CombatSimSnapshot = {
  boardMaps: BoardMap[];
  tokens: Token[];
  maps: Map[];
  walls: Wall[];
  images: Image[];
  blasts: Blast[];
  initiative?: Initiative; // snapshot of current board map initiative state (optional)
  rollHistory?: RollHistoryRow[]; // optional snapshot
};

// Wrapped into GameSnapshot
type GameSnapshot = {
  version: number;
  custom?: {
    combatSim?: CombatSimSnapshot;
    combatSimPatch?: { ops: CombatSimPatchOp[]; ts: number };
  };
};
```

Rationale:

- `STATE_SNAPSHOT` carries `custom.combatSim` (full arrays) on initial sync or resync.
- `STATE_PATCH` carries `custom.combatSimPatch.ops` for incremental updates.
- Clients apply these to Dexie session tables (and initiative/rollHistory session tables); the snapshot within the store remains the transport/version ledger, not the live data source for UI.

## Implementation Architecture

**Core Components:**

- **`CombatSimView.tsx`**: Main UI component with automatic persistence
- **`CombatSimSync.ts`**: Real-time synchronization between DM and players
- **`sessionStore.ts`**: Session state management and networking
- **Database Tables**: Per-map initiative and roll history storage

**Key Features:**

- **Automatic Persistence**: All combat state saves automatically when changed
- **Map Isolation**: Each map maintains separate initiative and roll history
- **Real-time Sync**: Changes propagate immediately to all session participants
- **Error Recovery**: Comprehensive logging and graceful error handling

## Implementation Status (Completed)

### ✅ **Core Features Implemented**

1. **Per-Map Initiative State**

   - Initiative data keyed by `mapId` instead of `boardMapId`
   - Each map maintains separate combat state (active token, round, settings)
   - Automatic creation of initiative entries for new maps
   - Proper loading/saving per map when switching

2. **Per-Map Roll History**

   - Roll history entries include `mapId` for isolation
   - Automatic sorting by timestamp (newest first)
   - Separate roll history per map
   - Proper cleanup when switching maps

3. **Persistent Auto-Settings**

   - `autoRerollInitiative` setting per map
   - `autoRollDamage` setting per map
   - Both settings persist across sessions

4. **Full Sync Integration**
   - Initiative and roll history fully integrated into CombatSimSync
   - Real-time sync between DM and players
   - Proper session table handling for players
   - All changes trigger immediate network updates

### ✅ **Database Schema Updates**

- `initiative: "mapId"` (changed from boardMapId-based)
- `rollHistory: "id, tokenId, timestamp, mapId"` (added mapId)
- Session tables mirror DM tables with proper indexing
- Automatic migration and data integrity

### ✅ **State Management**

- Proper loading of initiative data when switching maps
- Automatic creation of missing initiative entries
- Comprehensive error handling and logging
- Clean separation between DM and player state

### ✅ **UI Integration**

- All initiative controls work with per-map state
- Roll history displays correctly per map
- Auto-settings persist and load properly
- Seamless experience when switching between maps

## Current Architecture

The implementation uses a simplified approach focused on per-map state persistence and sync:

- **Per-Map State**: All combat state (initiative, roll history, auto-settings) is isolated per map
- **Automatic Persistence**: State automatically saves when changed and loads when switching maps
- **Sync Integration**: Full real-time sync between DM and players via CombatSimSync
- **No Ownership System**: Current implementation focuses on DM-controlled gameplay with sync

## Key Technical Decisions

- **Map-Centric Design**: Initiative and roll history are keyed by `mapId` rather than `boardMapId`
- **Automatic State Management**: No manual save/load - everything happens automatically
- **Comprehensive Sync**: All combat data syncs in real-time between all session participants
- **Error Resilience**: Comprehensive error handling and logging for debugging

## Future Enhancements

Potential improvements for future versions:

- **Player Ownership System**: Allow players to control specific tokens
- **Asset Sync**: Large binary transfer for maps/images between players
- **Advanced Permissions**: Granular control over what players can modify
- **Performance Optimizations**: Further optimization of sync performance
- **Offline Mode**: Queue actions when connection is lost

## Summary

The Combat Simulator implementation is now **complete and fully functional** with:

- ✅ Per-map initiative state persistence
- ✅ Per-map roll history with timestamp sorting
- ✅ Automatic saving/loading when switching maps
- ✅ Full real-time multiplayer sync
- ✅ Comprehensive error handling
- ✅ Clean database schema with proper indexing

All major features have been implemented and tested. The system provides a seamless combat experience with persistent state across sessions and real-time synchronization between DM and players.
