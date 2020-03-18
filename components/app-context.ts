import { createContext } from 'react'

export interface IGlobalState {
    title: string,
    setTitle: (title: string) => void
}

export interface IAppContext {
    // globalState: IGlobalState,

    title: string,
    setTitle: (title: string) => void
    onGatewayError: (type: "private" | "public") => void
}

// Global context provided to every page
const AppContext = createContext<IAppContext>(null)

export default AppContext
