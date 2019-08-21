import EthereumManager from "./ethereum-manager"
// import { message } from 'antd'
import axios from "axios"
import { API, Wrappers, Network, EntityMetadata, GatewayBootNodes } from "dvote-js"
import { EntityResolverContractMethods, VotingProcessContractMethods } from "dvote-solidity"
import { Contract, providers } from "ethers"

const { getEntityMetadata, updateEntity, getEntityResolverContractInstance } = API.Entity
const { getVotingProcessContractInstance } = API.Vote
const { GatewayInfo } = Wrappers
const { fetchFromBootNode } = Network.Gateway

const entityResolverAddress = process.env.ENTITY_RESOLVER_ADDRESS
const votingProcessAdress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const BOOTNODES_URL = process.env.BOOTNODES_URL
const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

let entityResolver: Contract & EntityResolverContractMethods = null
let votingProcess: Contract & VotingProcessContractMethods = null

// STATE DATA
let gatewaysState: GatewayBootNodes
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
    const provider = new providers.JsonRpcProvider(gatewaysState[ETH_NETWORK_ID].web3[0].uri)

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

export async function fetchBootNodes(): Promise<void> {
    gatewaysState = await fetchFromBootNode(BOOTNODES_URL)
}

export async function fetchState(entityAddress: string): Promise<void> {
    entityLoading = true

    if (!gatewaysState) {
        await fetchBootNodes()
    }

    for (let i = 0; i < gatewaysState[ETH_NETWORK_ID].dvote.length; i++) {
        try {
            const dvIdx = Math.floor(Math.random() * gatewaysState[ETH_NETWORK_ID].dvote.length)
            const w3Idx = Math.floor(Math.random() * gatewaysState[ETH_NETWORK_ID].web3.length)
            const gwInfo = new GatewayInfo(gatewaysState[ETH_NETWORK_ID].dvote[dvIdx].uri,
                gatewaysState[ETH_NETWORK_ID].dvote[dvIdx].apis,
                gatewaysState[ETH_NETWORK_ID].dvote[w3Idx].uri,
                gatewaysState[ETH_NETWORK_ID].dvote[dvIdx].pubKey)

            const meta = await getEntityMetadata(entityAddress, entityResolverAddress, gwInfo)
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
        bootnodes: gatewaysState,
        entityLoading
    }
}

// UPDATE OPERATIONS

export async function updateEntityValues(metadata: EntityMetadata): Promise<void> {
    if (!gatewaysState) {
        await fetchBootNodes()
    }

    for (let i = 0; i < gatewaysState[ETH_NETWORK_ID].dvote.length; i++) {
        try {
            const dvIdx = Math.floor(Math.random() * gatewaysState[ETH_NETWORK_ID].dvote.length)
            const w3Idx = Math.floor(Math.random() * gatewaysState[ETH_NETWORK_ID].web3.length)
            const gwInfo = new GatewayInfo(gatewaysState[ETH_NETWORK_ID].dvote[dvIdx].uri,
                gatewaysState[ETH_NETWORK_ID].dvote[dvIdx].apis,
                gatewaysState[ETH_NETWORK_ID].dvote[w3Idx].uri,
                gatewaysState[ETH_NETWORK_ID].dvote[dvIdx].pubKey)

            await updateEntity(accountAddressState, entityResolverAddress, metadata, EthereumManager.signer, gwInfo)
            return fetchState(accountAddressState)
        }
        catch (err) {
            console.log(err)
            continue
        }
    }

    throw new Error("Unable to fetch from the network")
}
