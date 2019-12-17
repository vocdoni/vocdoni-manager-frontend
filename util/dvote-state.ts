import EthereumManager from "./web3-wallet"
import { API, Wrappers, Network, EntityMetadata, IDVoteGateway, IWeb3Gateway, IEntityResolverContract, IVotingProcessContract } from "dvote-js"
import { message } from "antd"

const { getEntityMetadataByAddress, updateEntity } = API.Entity
const { Gateway: { DVoteGateway, Web3Gateway }, Bootnodes: { getRandomGatewayInfo }, Contracts: { getEntityResolverInstance, getVotingProcessInstance } } = Network

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID as any

let entityResolver: IEntityResolverContract = null
let votingProcess: IVotingProcessContract = null

// STATE DATA
let dvoteGateway: IDVoteGateway
let web3Gateway: IWeb3Gateway
let accountAddressState: string
let entityState: EntityMetadata
let votingProcessesState: any[]
let newsState: { [lang: string]: any[] }

let isConnected = false
let entityLoading: boolean = false

export function init() {
    return connectClients()
}

export async function connectClients() {
    const hideLoading = message.loading("Connecting", 0)

    try {
        const gwInfos = await getRandomGatewayInfo(ETH_NETWORK_ID)
        web3Gateway = new Web3Gateway(gwInfos[ETH_NETWORK_ID])
        dvoteGateway = new DVoteGateway(gwInfos[ETH_NETWORK_ID])

        await dvoteGateway.connect()
        console.log("POST GW CONNECT")
        await dvoteGateway.getStatus()
        console.log("POST GET STATUS")

        accountAddressState = await EthereumManager.getAddress()
        console.log("POST GET STATE", accountAddressState)

        // RESOLVER CONTRACT
        entityResolver = await getEntityResolverInstance({ provider: web3Gateway.getProvider(), signer: EthereumManager.signer })

        // React on all events (by now)
        entityResolver.on("TextChanged", () => refreshMetadata(accountAddressState))
        entityResolver.on("ListItemChanged", () => refreshMetadata(accountAddressState))

        // PROCESS CONTRACT
        votingProcess = await getVotingProcessInstance({ provider: web3Gateway.getProvider(), signer: EthereumManager.signer })
    }
    catch (err) {
        hideLoading()
        throw err
    }

    // Listen selectively
    votingProcess.on(
        votingProcess.filters.ProcessCreated(accountAddressState),
        () => refreshMetadata(accountAddressState))
    votingProcess.on(
        votingProcess.filters.ProcessCanceled(accountAddressState),
        () => refreshMetadata(accountAddressState))
    // votingProcess.on("RelayAdded", () => refreshMetadata(accountAddressState))
    // votingProcess.on("BatchRegistered", () => refreshMetadata(accountAddressState))
    // votingProcess.on("RelayDisabled", () => refreshMetadata(accountAddressState))
    // votingProcess.on("PrivateKeyRevealed", () => refreshMetadata(accountAddressState))

    return refreshMetadata(accountAddressState)
        .then(() => {
            hideLoading()
            isConnected = true
        }).catch(err => {
            hideLoading()
            isConnected = false
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
    if (dvoteGateway && dvoteGateway.disconnect) dvoteGateway.disconnect()

    dvoteGateway = null
    web3Gateway = null

    isConnected = false
}

export async function refreshMetadata(entityAddress: string): Promise<void> {
    entityLoading = true

    try {
        entityState = await getEntityMetadataByAddress(entityAddress, web3Gateway, dvoteGateway)
        entityLoading = false
    }
    catch (err) {
        if (err && err.message == "The given entity has no metadata defined yet") {
            entityState = null
            entityLoading = false
            return
        }
        console.log(err)
    }
}

// GETTERS

export function getState() {
    return {
        isConnected,
        address: accountAddressState,
        entityMetadata: entityState,
        votingProcesses: votingProcessesState,
        news: newsState,
        entityLoading
    }
}

/**
 * Returns the current Gateway instances.
 * If no connection is ready, it opens one.
 */
export async function getGatewayClients() {
    if (!isConnected) await connectClients()

    return {
        dvoteGateway,
        web3Gateway
    }
}
