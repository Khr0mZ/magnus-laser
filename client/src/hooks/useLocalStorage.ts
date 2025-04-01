import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Get from local storage
    const readValue = (): T => {
        if (typeof window === 'undefined') {
            return initialValue
        }

        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    }

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(readValue)

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value

            // Save to state
            setStoredValue(valueToStore)

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
        }
    }

    useEffect(() => {
        setStoredValue(readValue())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const handleStorageChange = () => {
            setStoredValue(readValue())
        }

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return [storedValue, setValue]
}
