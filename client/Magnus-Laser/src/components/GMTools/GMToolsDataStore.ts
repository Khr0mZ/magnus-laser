import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character } from '../../types/characterCreator'
import type {
    BeatChartEntry,
    ClockRollResult,
    OpenQuestionResult,
    OracleResult,
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

interface GMToolsDataState {
    // Oracle
    oracleHistory: OracleResult[]
    openQuestionHistory: OpenQuestionResult[]
    addOracleResult: (result: OracleResult) => void
    addOpenQuestionResult: (result: OpenQuestionResult) => void
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

    // Edgerunners (Characters)
    edgerunners: Character[]
    addEdgerunner: (character: Character) => void
    updateEdgerunner: (id: string, updates: Partial<Character>) => void
    deleteEdgerunner: (id: string) => void
    clearEdgerunners: () => void
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
        }),
        {
            name: 'gm-tools-data',
        }
    )
)

