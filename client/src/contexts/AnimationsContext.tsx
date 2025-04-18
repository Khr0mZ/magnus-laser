import React, { useEffect, useState } from 'react'
import { loadAnimationsEnabled, saveAnimationsEnabled } from '../utils/storage'
import { AnimationsContext } from './AnimationsContextTypes'

interface AnimationsProviderProps {
    children: React.ReactNode
}

export const AnimationsProvider: React.FC<AnimationsProviderProps> = ({ children }) => {
    const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    // Load animations preference from storage
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const enabled = await loadAnimationsEnabled()
                setAnimationsEnabled(enabled)
            } catch (error) {
                console.error('Error loading animations preference:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadPreference()
    }, [])

    const toggleAnimations = async () => {
        try {
            const newValue = !animationsEnabled
            setAnimationsEnabled(newValue)
            await saveAnimationsEnabled(newValue)
        } catch (error) {
            console.error('Error toggling animations preference:', error)
        }
    }

    // Apply no-animations class to body
    useEffect(() => {
        if (!animationsEnabled) {
            document.body.classList.add('no-animations')
        } else {
            document.body.classList.remove('no-animations')
        }
    }, [animationsEnabled])

    // Don't render children until we've loaded the preference
    if (isLoading) return null

    return (
        <AnimationsContext.Provider value={{ animationsEnabled, toggleAnimations }}>
            {children}
        </AnimationsContext.Provider>
    )
}
