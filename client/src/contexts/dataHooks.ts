import React, { createContext, useContext } from 'react'
import { Building, Gang } from '../graphql/types'

export interface DataContextType {
    buildings: Building[]
    gangs: Gang[]
    isLoading: boolean
    setBuildings: React.Dispatch<React.SetStateAction<Building[]>>
    setGangs: React.Dispatch<React.SetStateAction<Gang[]>>
}

// Create context with default values
export const DataContext = createContext<DataContextType>({
    buildings: [],
    gangs: [],
    isLoading: true,
    setBuildings: () => {},
    setGangs: () => {},
})

export const useData = () => useContext(DataContext)
