import { createContext } from 'react'
import { Wallet } from 'ethers'
import { EntityMetadata } from 'dvote-js'
import { DVoteGateway } from 'dvote-js/dist/net/gateway'
import { GatewayPool } from 'dvote-js/dist/net/gateway-pool'

import Web3Wallet from '../lib/web3-wallet'

export type ISelected = 'profile'
    | 'entity-edit'
    | 'feed'
    | 'new-post'
    | 'processes'
    | 'new-vote'
    | 'new-form-vote'
    | 'processes-details'
    | 'members'
    | 'targets'
    | 'census'
    | 'members-import'
    | 'account-edit'

export interface IAppContext {
    getEntityMetadata: (id: string) => Promise<EntityMetadata>
    gatewayClients: Promise<GatewayPool>,
    isWriteEnabled: boolean,
    isReadOnly: boolean,
    isReadOnlyNetwork: boolean,
    title: string,
    web3Wallet: Web3Wallet,
    onNewWallet: (wallet: Wallet) => any,
    menuVisible: boolean,
    menuSelected: ISelected,
    menuCollapsed: boolean,
    menuDisabled: boolean,
    entity: EntityMetadata,
    entityId: string,
    processId: string,
    urlHash: string,
    params: string[],
    setTitle: (title: string) => void
    onGatewayError: (type: 'private' | 'public') => void
    refreshEntityMetadata: () => Promise<void>,
    setMenuVisible: (menuVisible: boolean) => void
    setMenuSelected: (menuSelected: ISelected) => void
    setMenuCollapsed: (menuCollapsed: boolean) => void
    setMenuDisabled: (menuDisabled: boolean) => void
    setEntityId: (entityId: string) => void
    setProcessId: (processId: string) => void,
    managerBackendGateway: DVoteGateway,
    setUrlHash: (urlHash: string) => void,
    createCensusForTarget: (name: string, target: {id: string, name: string}, ephemeral?: boolean) =>
        Promise<{census: string, merkleRoot: string, merkleTreeUri: string}>,
    fetchTargets: () => Promise<any>,
    fetchCensuses: () => Promise<any>,
}

// Global context provided to every page
const AppContext = createContext<IAppContext>(null)

export default AppContext
