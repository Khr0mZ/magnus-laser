import React, { createContext, useContext, useEffect, useState } from 'react'
import { Building, Gang } from '../graphql/types'
import { DATA_IMPORT_EVENT, loadBuildings, loadGangs } from '../utils/storage'

interface DataContextType {
    buildings: Building[]
    gangs: Gang[]
    isLoading: boolean
    setBuildings: React.Dispatch<React.SetStateAction<Building[]>>
    setGangs: React.Dispatch<React.SetStateAction<Gang[]>>
}

// Create context with default values
const DataContext = createContext<DataContextType>({
    buildings: [],
    gangs: [],
    isLoading: true,
    setBuildings: () => {},
    setGangs: () => {},
})

export const useData = () => useContext(DataContext)

interface DataProviderProps {
    children: React.ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const [buildings, setBuildings] = useState<Building[]>([])
    const [gangs, setGangs] = useState<Gang[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Initial data loading
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // Load data directly from IndexedDB
                const loadedBuildings = await loadBuildings()
                const loadedGangs = await loadGangs()

                setBuildings(loadedBuildings)
                setGangs(loadedGangs)
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    // Listen for data import events
    useEffect(() => {
        const handleDataImport = async () => {
            setIsLoading(true)
            try {
                const loadedBuildings = await loadBuildings()
                const loadedGangs = await loadGangs()

                setBuildings(loadedBuildings)
                setGangs(loadedGangs)
            } catch (error) {
                console.error('Error reloading data after import:', error)
            } finally {
                setIsLoading(false)
            }
        }

        window.addEventListener(DATA_IMPORT_EVENT, handleDataImport)
        return () => {
            window.removeEventListener(DATA_IMPORT_EVENT, handleDataImport)
        }
    }, [])

    const value = {
        buildings,
        gangs,
        isLoading,
        setBuildings,
        setGangs,
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export default DataContext
