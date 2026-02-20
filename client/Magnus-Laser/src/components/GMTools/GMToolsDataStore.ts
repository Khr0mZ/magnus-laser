import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character } from '../../types/characterCreator'
import type {
    BeatChartEntry,
    ClockRollResult,
    CustomRandomTable,
    InvestigationSession,
    IPTracker,
    NPCFormComplex,
    NPCFormSimple,
    NPCTrackerEntry,
    OpenQuestionResult,
    OracleResult,
    SceneEntry,
    SocialChallengeSession,
    SoloMission,
    SoloPlayClock,
} from '../../types/soloPlay'

// Beat Chart with multiple charts support
export interface BeatChart {
    id: string
    name: string
    beats: BeatChartEntry[]
    createdAt: number
}

// Random Table Result
export interface RandomTableResult {
    id: string
    type: string
    content: string
    timestamp: number
}

// History Note (text notes inserted between history cards)
export interface HistoryNote {
    id: string
    timestamp: number
    content: string
}

interface GMToolsDataState {
    // Oracle
    oracleHistory: OracleResult[]
    openQuestionHistory: OpenQuestionResult[]
    addOracleResult: (result: OracleResult) => void
    addOpenQuestionResult: (result: OpenQuestionResult) => void
    updateOracleResult: (id: string, updates: Partial<OracleResult>) => void
    updateOpenQuestionResult: (id: string, updates: Partial<OpenQuestionResult>) => void
    deleteOracleResult: (id: string) => void
    deleteOpenQuestionResult: (id: string) => void
    clearOracleHistory: () => void
    clearOpenQuestionHistory: () => void

    // Clocks
    clocks: SoloPlayClock[]
    addClock: (clock: SoloPlayClock) => void
    updateClock: (id: string, updates: Partial<SoloPlayClock>) => void
    rollClockDice: (id: string) => { diceRolled: number[]; diceRemoved: number; isComplete: boolean } | null
    addDiceBack: (id: string) => void
    useDevilsLuck: (id: string) => void
    resetClock: (id: string) => void
    deleteClock: (id: string) => void
    clearClocks: () => void

    // Missions
    missions: SoloMission[]
    currentMission: SoloMission | null
    setCurrentMission: (mission: SoloMission | null) => void
    saveMission: (mission: SoloMission) => void
    deleteMission: (id: string) => void
    clearMissions: () => void

    // Beat Charts
    beatCharts: BeatChart[]
    addBeatChart: (chart: BeatChart) => void
    updateBeatChart: (id: string, updates: Partial<BeatChart>) => void
    updateBeat: (chartId: string, beatId: string, updates: Partial<BeatChartEntry>) => void
    deleteBeatChart: (id: string) => void
    clearBeatCharts: () => void

    // Random Tables Results
    randomTableResults: RandomTableResult[]
    addRandomTableResult: (result: RandomTableResult) => void
    updateRandomTableResult: (id: string, updates: Partial<RandomTableResult>) => void
    deleteRandomTableResult: (id: string) => void
    clearRandomTableResults: () => void

    // History Notes
    historyNotes: HistoryNote[]
    addHistoryNote: (note: HistoryNote) => void
    updateHistoryNote: (id: string, updates: Partial<HistoryNote>) => void
    deleteHistoryNote: (id: string) => void
    clearHistoryNotes: () => void

    // Edgerunners (Characters)
    edgerunners: Character[]
    addEdgerunner: (character: Character) => void
    updateEdgerunner: (id: string, updates: Partial<Character>) => void
    deleteEdgerunner: (id: string) => void
    clearEdgerunners: () => void

    // Investigation Sessions
    investigationSessions: InvestigationSession[]
    addInvestigationSession: (session: InvestigationSession) => void
    updateInvestigationSession: (id: string, updates: Partial<InvestigationSession>) => void
    deleteInvestigationSession: (id: string) => void

    // Social Challenge Sessions
    socialChallengeSessions: SocialChallengeSession[]
    addSocialChallengeSession: (session: SocialChallengeSession) => void
    updateSocialChallengeSession: (id: string, updates: Partial<SocialChallengeSession>) => void
    deleteSocialChallengeSession: (id: string) => void

    // NPC Tracker
    npcTracker: NPCTrackerEntry[]
    addNPCEntry: (entry: NPCTrackerEntry) => void
    updateNPCEntry: (id: string, updates: Partial<NPCTrackerEntry>) => void
    deleteNPCEntry: (id: string) => void

    // IP Trackers
    ipTrackers: IPTracker[]
    addIPTracker: (tracker: IPTracker) => void
    updateIPTracker: (id: string, updates: Partial<IPTracker>) => void
    deleteIPTracker: (id: string) => void

    // Scene Tracker
    scenes: SceneEntry[]
    addScene: (scene: SceneEntry) => void
    updateScene: (id: string, updates: Partial<SceneEntry>) => void
    deleteScene: (id: string) => void

    // NPC Forms
    npcForms: (NPCFormSimple | NPCFormComplex)[]
    addNPCForm: (npc: NPCFormSimple | NPCFormComplex) => void
    updateNPCForm: (id: string, updates: Partial<NPCFormSimple | NPCFormComplex>) => void
    deleteNPCForm: (id: string) => void

    // Custom Random Tables (Random Things 3-20)
    customTables: CustomRandomTable[]
    addCustomTable: (table: CustomRandomTable) => void
    updateCustomTable: (id: string, updates: Partial<CustomRandomTable>) => void
    deleteCustomTable: (id: string) => void

    // Edgerunner dialog (opened from CombatSim TokenPanel)
    openEdgerunnerId: string | null
    setOpenEdgerunnerId: (id: string | null) => void
}

export const useGMToolsDataStore = create<GMToolsDataState>()(
    persist(
        (set) => ({
            // Oracle
            oracleHistory: [],
            openQuestionHistory: [],
            addOracleResult: (result) =>
                set((state) => ({
                    oracleHistory: [result, ...state.oracleHistory].slice(0, 100),
                })),
            addOpenQuestionResult: (result) =>
                set((state) => ({
                    openQuestionHistory: [result, ...state.openQuestionHistory].slice(0, 100),
                })),
            updateOracleResult: (id, updates) =>
                set((state) => ({
                    oracleHistory: state.oracleHistory.map((r) =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                })),
            updateOpenQuestionResult: (id, updates) =>
                set((state) => ({
                    openQuestionHistory: state.openQuestionHistory.map((r) =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                })),
            deleteOracleResult: (id) =>
                set((state) => ({
                    oracleHistory: state.oracleHistory.filter((r) => r.id !== id),
                })),
            deleteOpenQuestionResult: (id) =>
                set((state) => ({
                    openQuestionHistory: state.openQuestionHistory.filter((r) => r.id !== id),
                })),
            clearOracleHistory: () => set({ oracleHistory: [] }),
            clearOpenQuestionHistory: () => set({ openQuestionHistory: [] }),

            // Clocks
            clocks: [],
            addClock: (clock) =>
                set((state) => ({
                    clocks: [...state.clocks, clock],
                })),
            updateClock: (id, updates) =>
                set((state) => ({
                    clocks: state.clocks.map((clock) =>
                        clock.id === id ? { ...clock, ...updates } : clock
                    ),
                })),
            rollClockDice: (id) => {
                const state = useGMToolsDataStore.getState()
                const clock = state.clocks.find((c) => c.id === id)
                if (!clock || clock.isComplete || clock.remainingDice <= 0) return null

                // Roll all remaining dice
                const diceRolled: number[] = []
                for (let i = 0; i < clock.remainingDice; i++) {
                    diceRolled.push(Math.floor(Math.random() * 6) + 1)
                }

                // Count dice to remove (1s, or 1s and 6s if scaleUp)
                let diceRemoved = 0
                for (const die of diceRolled) {
                    if (die === 1) {
                        diceRemoved++
                    } else if (clock.scaleUp && die === 6) {
                        diceRemoved++
                    }
                }

                // Check for multiple ones (Degrees of Consequence)
                const onesCount = diceRolled.filter((d) => d === 1).length
                const multipleOnesBonus = onesCount >= 2

                const remainingAfter = Math.max(0, clock.remainingDice - diceRemoved)
                const isComplete = remainingAfter === 0

                const rollResult: ClockRollResult = {
                    timestamp: Date.now(),
                    diceRolled,
                    diceRemoved,
                    remainingAfter,
                    multipleOnesBonus,
                }

                set((state) => ({
                    clocks: state.clocks.map((c) =>
                        c.id === id
                            ? {
                                  ...c,
                                  remainingDice: remainingAfter,
                                  rollHistory: [...c.rollHistory, rollResult],
                                  isComplete,
                                  completedAt: isComplete ? Date.now() : undefined,
                              }
                            : c
                    ),
                }))

                return { diceRolled, diceRemoved, isComplete }
            },
            addDiceBack: (id) =>
                set((state) => ({
                    clocks: state.clocks.map((clock) =>
                        clock.id === id && clock.remainingDice < clock.initialDicePool
                            ? { ...clock, remainingDice: clock.remainingDice + 1 }
                            : clock
                    ),
                })),
            useDevilsLuck: (id) =>
                set((state) => ({
                    clocks: state.clocks.map((clock) =>
                        clock.id === id && !clock.devilsLuckUsed && clock.remainingDice > 0 && !clock.isComplete
                            ? {
                                  ...clock,
                                  remainingDice: clock.remainingDice - 1,
                                  devilsLuckUsed: true,
                                  isComplete: clock.remainingDice - 1 <= 0,
                                  completedAt: clock.remainingDice - 1 <= 0 ? Date.now() : clock.completedAt,
                              }
                            : clock
                    ),
                })),
            resetClock: (id) =>
                set((state) => ({
                    clocks: state.clocks.map((clock) =>
                        clock.id === id
                            ? {
                                  ...clock,
                                  remainingDice: clock.initialDicePool,
                                  rollHistory: [],
                                  isComplete: false,
                                  completedAt: undefined,
                                  devilsLuckUsed: false,
                              }
                            : clock
                    ),
                })),
            deleteClock: (id) =>
                set((state) => ({
                    clocks: state.clocks.filter((clock) => clock.id !== id),
                })),
            clearClocks: () => set({ clocks: [] }),

            // Missions
            missions: [],
            currentMission: null,
            setCurrentMission: (mission) => set({ currentMission: mission }),
            saveMission: (mission) =>
                set((state) => ({
                    missions: [mission, ...state.missions.filter((m) => m.id !== mission.id)],
                })),
            deleteMission: (id) =>
                set((state) => ({
                    missions: state.missions.filter((m) => m.id !== id),
                    currentMission: state.currentMission?.id === id ? null : state.currentMission,
                })),
            clearMissions: () => set({ missions: [], currentMission: null }),

            // Beat Charts
            beatCharts: [],
            addBeatChart: (chart) =>
                set((state) => ({
                    beatCharts: [...state.beatCharts, chart],
                })),
            updateBeatChart: (id, updates) =>
                set((state) => ({
                    beatCharts: state.beatCharts.map((chart) =>
                        chart.id === id ? { ...chart, ...updates } : chart
                    ),
                })),
            updateBeat: (chartId, beatId, updates) =>
                set((state) => ({
                    beatCharts: state.beatCharts.map((chart) =>
                        chart.id === chartId
                            ? {
                                  ...chart,
                                  beats: chart.beats.map((beat) =>
                                      beat.id === beatId ? { ...beat, ...updates } : beat
                                  ),
                              }
                            : chart
                    ),
                })),
            deleteBeatChart: (id) =>
                set((state) => ({
                    beatCharts: state.beatCharts.filter((chart) => chart.id !== id),
                })),
            clearBeatCharts: () => set({ beatCharts: [] }),

            // Random Tables Results
            randomTableResults: [],
            addRandomTableResult: (result) =>
                set((state) => ({
                    randomTableResults: [result, ...state.randomTableResults].slice(0, 50),
                })),
            updateRandomTableResult: (id, updates) =>
                set((state) => ({
                    randomTableResults: state.randomTableResults.map((r) =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                })),
            deleteRandomTableResult: (id) =>
                set((state) => ({
                    randomTableResults: state.randomTableResults.filter((r) => r.id !== id),
                })),
            clearRandomTableResults: () => set({ randomTableResults: [] }),

            // History Notes
            historyNotes: [],
            addHistoryNote: (note) =>
                set((state) => ({
                    historyNotes: [note, ...state.historyNotes].slice(0, 30),
                })),
            updateHistoryNote: (id, updates) =>
                set((state) => ({
                    historyNotes: state.historyNotes.map((n) =>
                        n.id === id ? { ...n, ...updates } : n
                    ),
                })),
            deleteHistoryNote: (id) =>
                set((state) => ({
                    historyNotes: state.historyNotes.filter((n) => n.id !== id),
                })),
            clearHistoryNotes: () => set({ historyNotes: [] }),

            // Edgerunners (Characters)
            edgerunners: [],
            addEdgerunner: (character) =>
                set((state) => ({
                    edgerunners: [character, ...state.edgerunners],
                })),
            updateEdgerunner: (id, updates) =>
                set((state) => ({
                    edgerunners: state.edgerunners.map((c) =>
                        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
                    ),
                })),
            deleteEdgerunner: (id) =>
                set((state) => ({
                    edgerunners: state.edgerunners.filter((c) => c.id !== id),
                })),
            clearEdgerunners: () => set({ edgerunners: [] }),

            // Investigation Sessions
            investigationSessions: [],
            addInvestigationSession: (session) =>
                set((state) => ({
                    investigationSessions: [session, ...state.investigationSessions],
                })),
            updateInvestigationSession: (id, updates) =>
                set((state) => ({
                    investigationSessions: state.investigationSessions.map((s) =>
                        s.id === id ? { ...s, ...updates } : s
                    ),
                })),
            deleteInvestigationSession: (id) =>
                set((state) => ({
                    investigationSessions: state.investigationSessions.filter((s) => s.id !== id),
                })),

            // Social Challenge Sessions
            socialChallengeSessions: [],
            addSocialChallengeSession: (session) =>
                set((state) => ({
                    socialChallengeSessions: [session, ...state.socialChallengeSessions],
                })),
            updateSocialChallengeSession: (id, updates) =>
                set((state) => ({
                    socialChallengeSessions: state.socialChallengeSessions.map((s) =>
                        s.id === id ? { ...s, ...updates } : s
                    ),
                })),
            deleteSocialChallengeSession: (id) =>
                set((state) => ({
                    socialChallengeSessions: state.socialChallengeSessions.filter((s) => s.id !== id),
                })),

            // NPC Tracker
            npcTracker: [],
            addNPCEntry: (entry) =>
                set((state) => ({
                    npcTracker: [entry, ...state.npcTracker],
                })),
            updateNPCEntry: (id, updates) =>
                set((state) => ({
                    npcTracker: state.npcTracker.map((n) =>
                        n.id === id ? { ...n, ...updates } : n
                    ),
                })),
            deleteNPCEntry: (id) =>
                set((state) => ({
                    npcTracker: state.npcTracker.filter((n) => n.id !== id),
                })),

            // IP Trackers
            ipTrackers: [],
            addIPTracker: (tracker) =>
                set((state) => ({
                    ipTrackers: [...state.ipTrackers, tracker],
                })),
            updateIPTracker: (id, updates) =>
                set((state) => ({
                    ipTrackers: state.ipTrackers.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),
            deleteIPTracker: (id) =>
                set((state) => ({
                    ipTrackers: state.ipTrackers.filter((t) => t.id !== id),
                })),

            // Scene Tracker
            scenes: [],
            addScene: (scene) =>
                set((state) => ({ scenes: [...state.scenes, scene] })),
            updateScene: (id, updates) =>
                set((state) => ({
                    scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
                })),
            deleteScene: (id) =>
                set((state) => ({ scenes: state.scenes.filter((s) => s.id !== id) })),

            // NPC Forms
            npcForms: [],
            addNPCForm: (npc) =>
                set((state) => ({ npcForms: [...state.npcForms, npc] })),
            updateNPCForm: (id, updates) =>
                set((state) => ({
                    npcForms: state.npcForms.map((n) => (n.id === id ? { ...n, ...updates } : n)),
                })),
            deleteNPCForm: (id) =>
                set((state) => ({ npcForms: state.npcForms.filter((n) => n.id !== id) })),

            // Custom Random Tables
            customTables: [],
            addCustomTable: (table) =>
                set((state) => ({ customTables: [...state.customTables, table] })),
            updateCustomTable: (id, updates) =>
                set((state) => ({
                    customTables: state.customTables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                })),
            deleteCustomTable: (id) =>
                set((state) => ({ customTables: state.customTables.filter((t) => t.id !== id) })),

            // Edgerunner dialog
            openEdgerunnerId: null,
            setOpenEdgerunnerId: (id) => set({ openEdgerunnerId: id }),
        }),
        {
            name: 'gm-tools-data',
            version: 4,
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as Record<string, unknown>
                if (version === 0) {
                    // Migrate OpenQuestionResult: focus/detail/category -> verb/noun/adjective
                    const oldHistory = state.openQuestionHistory as Array<Record<string, unknown>> | undefined
                    if (oldHistory) {
                        state.openQuestionHistory = oldHistory.map((result) => {
                            if ('focus' in result && !('verb' in result)) {
                                return {
                                    id: result.id,
                                    timestamp: result.timestamp,
                                    question: result.question,
                                    verb: result.focus || '',
                                    noun: result.detail || '',
                                    adjective: '',
                                    notes: result.notes,
                                }
                            }
                            return result
                        })
                    }
                }
                if (version < 2) {
                    // Migrate edgerunners: backfill weapon.skill, armor.location, tokenColor
                    const weaponSkillMap: Record<string, string> = {
                        'Melee': 'Melee Weapon', 'Exotic Melee': 'Melee Weapon', 'Exotic VH Melee': 'Melee Weapon',
                        'Pistol': 'Handgun', 'Exotic Pistol': 'Handgun', 'Exotic VH Pistol': 'Handgun',
                        'SMG': 'Shoulder Arms', 'Shotgun': 'Shoulder Arms', 'Exotic Shotgun': 'Shoulder Arms',
                        'Rifle': 'Shoulder Arms', 'Exotic Rifle': 'Shoulder Arms',
                        'Bow': 'Archery',
                        'Heavy': 'Heavy Weapons', 'Exotic Grenade Launcher': 'Heavy Weapons',
                    }
                    const edgerunners = state.edgerunners as Array<Record<string, unknown>> | undefined
                    if (edgerunners) {
                        state.edgerunners = edgerunners.map((char) => {
                            const weapons = char.weapons as Array<Record<string, unknown>> | undefined
                            if (weapons) {
                                char.weapons = weapons.map((w) => ({
                                    ...w,
                                    skill: w.skill || weaponSkillMap[w.type as string] || 'Melee Weapon',
                                }))
                            }
                            const armor = char.armor as Array<Record<string, unknown>> | undefined
                            if (armor) {
                                char.armor = armor.map((a) => {
                                    if (a.location) return a
                                    const name = (a.name as string) || ''
                                    let location: string = 'Body'
                                    if (name.includes('(Head)')) location = 'Head'
                                    else if (name.includes('Shield')) location = 'Shield'
                                    return { ...a, location }
                                })
                            }
                            if (!char.tokenColor) char.tokenColor = 0x00ff8b
                            return char
                        })
                    }
                }
                if (version < 3) {
                    // Backfill devilsLuckUsed on existing clocks
                    const clocks = state.clocks as Array<Record<string, unknown>> | undefined
                    if (clocks) {
                        state.clocks = clocks.map((clock) => ({
                            ...clock,
                            devilsLuckUsed: clock.devilsLuckUsed ?? false,
                        }))
                    }
                }
                if (version < 4) {
                    state.historyNotes = state.historyNotes ?? []
                }
                return state as unknown as GMToolsDataState
            },
        }
    )
)

