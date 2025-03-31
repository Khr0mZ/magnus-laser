import { createContext } from 'react'

// Create a context for managing reader mode
export const ReaderModeContext = createContext({
    readerMode: false,
    toggleReaderMode: () => {},
})
