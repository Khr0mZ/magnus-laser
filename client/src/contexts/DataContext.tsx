import React, { useEffect, useState } from 'react'
import { Bounty, Building, Character, FixerJob, Gang, Item } from '../graphql/types'
import {
    DATA_IMPORT_EVENT,
    loadBounties,
    loadBuildings,
    loadCharacters,
    loadFixerJobs,
    loadGangs,
    loadItems,
} from '../utils/storage'
import { DataContext } from './dataHooks'

interface DataProviderProps {
    children: React.ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const [buildings, setBuildings] = useState<Building[]>([])
    const [gangs, setGangs] = useState<Gang[]>([])
    const [fixerJobs, setFixerJobs] = useState<FixerJob[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [characters, setCharacters] = useState<Character[]>([])
    const [bounties, setBounties] = useState<Bounty[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Initial data loading
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // Load data directly from IndexedDB
                const loadedBuildings = await loadBuildings()
                const loadedGangs = await loadGangs()
                const loadedFixerJobs = await loadFixerJobs()
                const loadedItems = await loadItems()
                const loadedCharacters = await loadCharacters()
                const loadedBounties = await loadBounties()
                setBuildings(loadedBuildings)
                setGangs(loadedGangs)
                setFixerJobs(loadedFixerJobs)
                setItems(loadedItems)
                setCharacters(loadedCharacters)
                setBounties(loadedBounties)
            } catch (error) {
                console.warn('Error loading data:', error)
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
                const loadedFixerJobs = await loadFixerJobs()
                const loadedItems = await loadItems()
                const loadedCharacters = await loadCharacters()
                const loadedBounties = await loadBounties()
                setBuildings(loadedBuildings)
                setGangs(loadedGangs)
                setFixerJobs(loadedFixerJobs)
                setItems(loadedItems)
                setCharacters(loadedCharacters)
                setBounties(loadedBounties)
            } catch (error) {
                console.warn('Error reloading data after import:', error)
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
        fixerJobs,
        items,
        characters,
        bounties,
        isLoading,
        setBuildings,
        setGangs,
        setFixerJobs,
        setItems,
        setCharacters,
        setBounties,
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export default DataProvider
