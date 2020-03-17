import { createContext } from 'react'

export interface IAppContext {
    onGatewayError: (type: "private" | "public") => void
}

// Global context provided to every page
const AppContext = createContext<IAppContext>({ onGatewayError: (_) => { } })

export default AppContext
