import { createContext } from 'react'
import Web3Wallet from '../lib/web3-wallet'

export type ISelected = "profile"
                | "entity-edit"
                | "feed" 
                | "new-post"
                | "processes-active"
                | "processes-ended"
                | "new-vote"
                | "processes-details"
                | "census1"
                | "census2"
                | "census3"

export interface IAppContext {
    title: string,
    web3Wallet: Web3Wallet,
    menuVisible: boolean,
    menuSelected: ISelected, 
    menuCollapsed: boolean, 
    entityId: string, 
    processId: string,
    setTitle: (title: string) => void
    onGatewayError: (type: "private" | "public") => void
    setMenuVisible: (menuVisible: boolean) => void
    setMenuSelected: (menuSelected: ISelected) => void
    setMenuCollapsed: (menuCollapsed: boolean) => void
    setEntityId: (entityId: string) => void
    setProcessId: (processId: string) => void
}

// Global context provided to every page
const AppContext = createContext<IAppContext>(null)

export default AppContext
