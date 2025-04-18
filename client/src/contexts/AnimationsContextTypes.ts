import { createContext, useContext } from 'react'

export interface AnimationsContextType {
    animationsEnabled: boolean
    toggleAnimations: () => Promise<void>
}

export const AnimationsContext = createContext<AnimationsContextType>({
    animationsEnabled: true,
    toggleAnimations: async () => {},
})

export const useAnimations = (): AnimationsContextType => useContext(AnimationsContext)
