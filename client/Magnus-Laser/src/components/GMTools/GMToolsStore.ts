import { create } from 'zustand'

export type GMToolType =
    | 'gmTables'
    | 'oracle'
    | 'clocks'
    | 'missionBuilder'
    | 'beatChart'
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
    | 'sceneTracker'
    | 'npcForms'
    | 'randomThings'
    | null

interface GMToolsState {
    isDrawerOpen: boolean
    activeTool: GMToolType
    isMenuCollapsed: boolean
    openDrawer: () => void
    closeDrawer: () => void
    toggleDrawer: () => void
    setActiveTool: (tool: GMToolType) => void
    toggleMenuCollapsed: () => void
}

export const useGMToolsStore = create<GMToolsState>((set) => ({
    isDrawerOpen: false,
    activeTool: 'oracle',
    isMenuCollapsed: false,
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false, activeTool: null }),
    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    setActiveTool: (tool) => set({ activeTool: tool, isDrawerOpen: true }),
    toggleMenuCollapsed: () => set((state) => ({ isMenuCollapsed: !state.isMenuCollapsed })),
}))

