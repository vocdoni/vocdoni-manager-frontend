import EthereumManager from "./ethereum-manager"
// import { message } from 'antd'
import axios from "axios"
import { EntityMetadata, getEntityMetadata, GatewayURI, getEntityResolverContractInstance, getVotingProcessContractInstance, getEntityId, updateEntity } from "dvote-js"
import { EntityResolverContractMethods, VotingProcessContractMethods } from "dvote-solidity"
import { Contract, providers } from "ethers"

export type BootNode = { dvote: string, web3: string }
type BootNodesResponse = ({ [k: string]: BootNode })[]

const entityResolverAddress = process.env.ENTITY_RESOLVER_ADDRESS
const votingProcessAdress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const BOOTNODES_URL = process.env.BOOTNODES_URL
const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

let entityResolver: Contract & EntityResolverContractMethods = null
let votingProcess: Contract & VotingProcessContractMethods = null

// STATE DATA
let bootnodesState: { dvote: string, census: string, web3: string, pubKey?: string }[]
let accountAddressState: string
let entityState: EntityMetadata
let votingProcessesState: any[]
let newsState: { [lang: string]: any[] }

let entityLoading: boolean = false

export async function init() {
    disconnect()

    await fetchBootNodes()

    accountAddressState = await EthereumManager.getAddress()

    // CHOOSE
    // const provider = EthereumManager.provider
    const provider = new providers.JsonRpcProvider(bootnodesState[0].web3)

    // RESOLVER CONTRACT
    entityResolver = getEntityResolverContractInstance({ provider, signer: EthereumManager.signer }, entityResolverAddress)

    // React on all events (by now)
    entityResolver.on("TextChanged", () => fetchState(accountAddressState))
    entityResolver.on("ListItemChanged", () => fetchState(accountAddressState))

    // TODO:
    // PROCESS CONTRACT
    votingProcess = getVotingProcessContractInstance({ provider, signer: EthereumManager.signer }, votingProcessAdress)

    // Listen selectively
    votingProcess.on(
        votingProcess.filters.ProcessCreated(accountAddressState),
        () => fetchState(accountAddressState))
    votingProcess.on(
        votingProcess.filters.ProcessCanceled(accountAddressState),
        () => fetchState(accountAddressState))
    // votingProcess.on("RelayAdded", () => fetchState(accountAddressState))
    // votingProcess.on("BatchRegistered", () => fetchState(accountAddressState))
    // votingProcess.on("RelayDisabled", () => fetchState(accountAddressState))
    // votingProcess.on("PrivateKeyRevealed", () => fetchState(accountAddressState))

    return fetchState(accountAddressState)
}

export function disconnect() {
    if (entityResolver && entityResolver.provider) {
        entityResolver.provider.removeAllListeners("TextChanged")
        entityResolver.provider.removeAllListeners("ListItemChanged")
        if (entityResolver.provider['polling']) entityResolver.provider['polling'] = false
    }

    if (votingProcess && votingProcess.provider) {
        votingProcess.provider.removeAllListeners("ProcessCreated")
        votingProcess.provider.removeAllListeners("ProcessCanceled")
        // votingProcess.provider.removeAllListeners("RelayAdded")
        // votingProcess.provider.removeAllListeners("BatchRegistered")
        // votingProcess.provider.removeAllListeners("RelayDisabled")
        // votingProcess.provider.removeAllListeners("PrivateKeyRevealed")
        if (votingProcess.provider['polling']) votingProcess.provider['polling'] = false
    }
}

export function getBootnodes(): Promise<BootNodesResponse> {
    return axios.get<BootNodesResponse>(BOOTNODES_URL).then(res => res.data)
}

export async function fetchBootNodes(): Promise<void> {
    const bootNodesMap = await getBootnodes()
    if (!Array.isArray(bootNodesMap[ETH_NETWORK_ID])) throw new Error("Invalid bootstrap nodes")
    bootnodesState = bootNodesMap[ETH_NETWORK_ID]
}

export async function fetchState(entityAddress: string): Promise<void> {
    entityLoading = true

    if (!bootnodesState) {
        await fetchBootNodes()
    }

    for (let node of bootnodesState) {
        try {
            const gw = new GatewayURI(node.dvote, node.census, node.web3)
            const meta = await getEntityMetadata(entityAddress, entityResolverAddress, gw)
            entityState = meta
            entityLoading = false
            return
        }
        catch (err) {
            if (err && err.message == "The given entity has no metadata defined yet") {
                entityState = null
                entityLoading = false
                return
            }
            console.log(err)
            continue
        }
    }
    entityLoading = false
    throw new Error("Unable to fetch from the network")
}

// GETTERS

export function getState() {
    return {
        address: accountAddressState,
        entityMetadata: entityState,
        votingProcesses: votingProcessesState,
        news: newsState,
        bootnodes: bootnodesState,
        entityLoading
    }
}

// UPDATE OPERATIONS

export async function updateEntityValues(metadata: EntityMetadata): Promise<void> {
    if (!bootnodesState) {
        await fetchBootNodes()
    }

    for (let node of bootnodesState) {
        try {
            const gwUri = new GatewayURI(node.dvote, node.census, node.web3)
            await updateEntity(accountAddressState, entityResolverAddress, metadata, EthereumManager.signer, gwUri, node.pubKey)
            return fetchState(accountAddressState)
        }
        catch (err) {
            console.log(err)
            continue
        }
    }
    throw new Error("Unable to fetch from the network")
}
