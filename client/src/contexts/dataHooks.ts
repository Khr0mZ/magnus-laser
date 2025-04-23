import React, { createContext, useContext } from 'react'
import { Building, Character, FixerJob, Gang, Item } from '../graphql/types'

export interface DataContextType {
    buildings: Building[]
    gangs: Gang[]
    fixerJobs: FixerJob[]
    items: Item[]
    characters: Character[]
    isLoading: boolean
    setBuildings: React.Dispatch<React.SetStateAction<Building[]>>
    setGangs: React.Dispatch<React.SetStateAction<Gang[]>>
    setFixerJobs: React.Dispatch<React.SetStateAction<FixerJob[]>>
    setItems: React.Dispatch<React.SetStateAction<Item[]>>
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
}

// Create context with default values
export const DataContext = createContext<DataContextType>({
    buildings: [],
    gangs: [],
    fixerJobs: [],
    items: [],
    characters: [],
    isLoading: true,
    setBuildings: () => {},
    setGangs: () => {},
    setFixerJobs: () => {},
    setItems: () => {},
    setCharacters: () => {},
})

export const useData = () => useContext(DataContext)
