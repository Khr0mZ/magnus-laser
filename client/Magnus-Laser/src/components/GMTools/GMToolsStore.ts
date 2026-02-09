import { create } from 'zustand'

export type GMToolType =
    | 'oracle'
    | 'clocks'
    | 'missionBuilder'
    | 'beatChart'
    | 'randomTables'
    | 'investigation'
    | 'socialChallenge'
    | 'npcTracker'
    | 'ipTracker'
    | 'gangGenerator'
    | 'buildingGenerator'
    | 'gigGenerator'
    | 'bountyGenerator'
    | 'itemGenerator'
    | 'contactGenerator'
    | null

interface GMToolsState {
    isDrawerOpen: boolean
    activeTool: GMToolType
    openDrawer: () => void
    closeDrawer: () => void
    toggleDrawer: () => void
    setActiveTool: (tool: GMToolType) => void
}

export const useGMToolsStore = create<GMToolsState>((set) => ({
    isDrawerOpen: false,
    activeTool: null,
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false, activeTool: null }),
    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    setActiveTool: (tool) => set({ activeTool: tool, isDrawerOpen: true }),
}))

