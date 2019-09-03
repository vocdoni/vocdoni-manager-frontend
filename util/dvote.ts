import EthereumManager from "./ethereum-manager"
// import { message } from 'antd'
import { API, Wrappers, Network, EntityMetadata, GatewayBootNodes } from "dvote-js"
import { EntityResolverContractMethods, VotingProcessContractMethods } from "dvote-solidity"
import { Contract, providers } from "ethers"
import { message } from "antd"

const { getEntityMetadata, updateEntity } = API.Entity
// const {  } = API.Vote
const { GatewayInfo } = Wrappers
const { Bootnodes: { fetchDefaultBootNode }, Contracts: { getEntityResolverInstance, getVotingProcessInstance } } = Network

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
    entityResolver = await getEntityResolverInstance({ provider, signer: EthereumManager.signer })

    // React on all events (by now)
    entityResolver.on("TextChanged", () => fetchState(accountAddressState))
    entityResolver.on("ListItemChanged", () => fetchState(accountAddressState))

    // TODO:
    // PROCESS CONTRACT
    votingProcess = await getVotingProcessInstance({ provider, signer: EthereumManager.signer })

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

    return fetchState(accountAddressState).catch(err => {
        message.error("Unable to connect to a Gateway")
    })
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
    gatewaysState = await fetchDefaultBootNode(ETH_NETWORK_ID as any)
}

export async function fetchState(entityAddress: string): Promise<void> {
    entityLoading = true

    if (!gatewaysState) {
        await fetchBootNodes()
    }

    for (let i = 0; i < gatewaysState[ETH_NETWORK_ID].dvote.length; i++) {
        try {
            const dvoteLen = gatewaysState && gatewaysState[ETH_NETWORK_ID] && gatewaysState[ETH_NETWORK_ID].dvote
                && gatewaysState[ETH_NETWORK_ID].dvote.length || 0
            if (!dvoteLen) throw new Error("Could not connect to the Gateway")
            const w3Len = gatewaysState && gatewaysState[ETH_NETWORK_ID] && gatewaysState[ETH_NETWORK_ID].web3
                && gatewaysState[ETH_NETWORK_ID].web3.length || 0
            if (!w3Len) throw new Error("Could not connect to the Gateway")

            const dvGw = gatewaysState[ETH_NETWORK_ID].dvote[Math.floor(Math.random() * dvoteLen)]
            const w3Gw = gatewaysState[ETH_NETWORK_ID].web3[Math.floor(Math.random() * w3Len)]
            const gwInfo = new GatewayInfo(dvGw.uri, dvGw.apis, w3Gw.uri, dvGw.pubKey)

            const meta = await getEntityMetadata(entityAddress, gwInfo)
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
            const dvoteLen = gatewaysState && gatewaysState[ETH_NETWORK_ID] && gatewaysState[ETH_NETWORK_ID].dvote
                && gatewaysState[ETH_NETWORK_ID].dvote.length || 0
            if (!dvoteLen) throw new Error("Could not connect to the Gateway")
            const w3Len = gatewaysState && gatewaysState[ETH_NETWORK_ID] && gatewaysState[ETH_NETWORK_ID].web3
                && gatewaysState[ETH_NETWORK_ID].web3.length || 0
            if (!w3Len) throw new Error("Could not connect to the Gateway")

            const dvGw = gatewaysState[ETH_NETWORK_ID].dvote[Math.floor(Math.random() * dvoteLen)]
            const w3Gw = gatewaysState[ETH_NETWORK_ID].web3[Math.floor(Math.random() * w3Len)]
            const gwInfo = new GatewayInfo(dvGw.uri, dvGw.apis, w3Gw.uri, dvGw.pubKey)

            await updateEntity(accountAddressState, metadata, EthereumManager.signer, gwInfo)
            return fetchState(accountAddressState)
        }
        catch (err) {
            console.log(err)
            continue
        }
    }

    throw new Error("Unable to fetch from the network")
}
