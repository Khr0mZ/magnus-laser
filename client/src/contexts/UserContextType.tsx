import { createContext } from 'react'

export interface UserContextType {
    isLoggedIn: boolean
    setIsLoggedIn: (loggedIn: boolean) => void
}

export const UserContext = createContext<UserContextType>({
    isLoggedIn: true, // Default to true for simplicity
    setIsLoggedIn: () => {},
})
