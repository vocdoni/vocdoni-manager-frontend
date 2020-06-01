import { createContext } from 'react'
import { Wallet } from "ethers"
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
    onNewWallet: (wallet: Wallet) => any,
    menuVisible: boolean,
    menuSelected: ISelected,
    menuCollapsed: boolean,
    menuDisabled: boolean,
    entityId: string,
    processId: string,
    urlHash: string,
    setTitle: (title: string) => void
    onGatewayError: (type: "private" | "public") => void
    setMenuVisible: (menuVisible: boolean) => void
    setMenuSelected: (menuSelected: ISelected) => void
    setMenuCollapsed: (menuCollapsed: boolean) => void
    setMenuDisabled: (menuDisabled: boolean) => void
    setEntityId: (entityId: string) => void
    setProcessId: (processId: string) => void
    setUrlHash: (urlHash: string) => void
}

// Global context provided to every page
const AppContext = createContext<IAppContext>(null)

export default AppContext
