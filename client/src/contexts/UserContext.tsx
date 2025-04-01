import React, { ReactNode, useState } from 'react'
import { UserContext } from './UserContextType'

interface UserProviderProps {
    children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true)

    return <UserContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>{children}</UserContext.Provider>
}

export default UserProvider
