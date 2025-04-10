import React, { createContext, useContext } from 'react'
import { Building, FixerJob, Gang } from '../graphql/types'

export interface DataContextType {
    buildings: Building[]
    gangs: Gang[]
    fixerJobs: FixerJob[]
    isLoading: boolean
    setBuildings: React.Dispatch<React.SetStateAction<Building[]>>
    setGangs: React.Dispatch<React.SetStateAction<Gang[]>>
    setFixerJobs: React.Dispatch<React.SetStateAction<FixerJob[]>>
}

// Create context with default values
export const DataContext = createContext<DataContextType>({
    buildings: [],
    gangs: [],
    fixerJobs: [],
    isLoading: true,
    setBuildings: () => {},
    setGangs: () => {},
    setFixerJobs: () => {},
})

export const useData = () => useContext(DataContext)
