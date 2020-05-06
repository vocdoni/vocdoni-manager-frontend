import { API, Wrappers, Network, EntityMetadata, IGatewayPool, GatewayDiscoveryParameters, IEntityResolverContract, IVotingProcessContract, GatewayBootNodes } from "dvote-js"
import { message } from "antd"
import { Wallet, Signer, getDefaultProvider } from "ethers"
import Web3Wallet, { getWeb3Wallet } from "./web3-wallet"
import { fetchFromBootNode } from "dvote-js/dist/net/gateway-bootnodes"

const { Pool: { GatewayPool }, Contracts: { getEntityResolverInstance, getVotingProcessInstance } } = Network
// const {GatewayInfo} = Wrappers

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID as any
const BOOTNODES_URL_READ_ONLY = process.env.BOOTNODES_URL_READ_ONLY
const BOOTNODES_URL_RW = process.env.BOOTNODES_URL_RW

let entityResolver: IEntityResolverContract = null
let votingProcess: IVotingProcessContract = null

// STATE DATA
let readOnly: boolean = true
let gateway: IGatewayPool

let bootnodesReadOnly: GatewayBootNodes
let bootnodesPrivate: GatewayBootNodes

let isConnected = false
let error: boolean = false
let timedOut: boolean = false

let connecting: Promise<void>

export async function initNetwork() {
    if (connecting) {
        await connecting
        if (isConnected) return
    }
    const web3Wallet = getWeb3Wallet()

    const hideLoading = message.loading("Connecting to the network. Please wait...", 0)

    try {
        if (!web3Wallet.hasWallet()) {
            // USE PUBLIC GATEWAYS
            const options: GatewayDiscoveryParameters = {
                networkId: ETH_NETWORK_ID,
                bootnodesContentUri: BOOTNODES_URL_READ_ONLY,
                numberOfGateways: 2,
                race: true,
                timeout: 3000,
            }
            gateway = await GatewayPool.discover(options)

            entityResolver = await gateway.getEntityResolverInstance()
            votingProcess = await gateway.getVotingProcessInstance()
        }
        else {
            // USE PRIVATE GATEWAYS
            const options: GatewayDiscoveryParameters = {
                networkId: ETH_NETWORK_ID,
                bootnodesContentUri: BOOTNODES_URL_RW,
                numberOfGateways: 2,
                race: false,
                timeout: 3000,
            }
            gateway = await GatewayPool.discover(options)

            entityResolver = await gateway.getEntityResolverInstance(web3Wallet.getWallet())
            votingProcess = await gateway.getVotingProcessInstance(web3Wallet.getWallet())
        }
        web3Wallet.connect(gateway.getProvider())
        isConnected = true
    }
    catch (err) {
        console.error(err)
        hideLoading()
        throw err
    }

    // // Listen selectively
    // votingProcess.on(
    //     votingProcess.filters.ProcessCreated(walletAddress),
    //     () => refreshMetadata(walletAddress))
    // votingProcess.on(
    //     votingProcess.filters.ProcessCanceled(walletAddress),
    //     () => refreshMetadata(walletAddress))
    // // votingProcess.on("RelayAdded", () => refreshMetadata(walletAddress))
    // // votingProcess.on("BatchRegistered", () => refreshMetadata(walletAddress))
    // // votingProcess.on("RelayDisabled", () => refreshMetadata(walletAddress))
    // // votingProcess.on("PrivateKeyRevealed", () => refreshMetadata(walletAddress))

    // return refreshMetadata(walletAddress)
    //     .then(() => {
    //         hideLoading()
    //         isConnected = true
    //     }).catch(err => {
    //         hideLoading()
    //         isConnected = false
    //         message.error("Unable to connect to a Gateway")
    //     })

    hideLoading()
    // isConnected = true
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
    if (gateway) gateway.disconnect()

    gateway = null

    isConnected = false
}

// export async function refreshMetadata(entityAddress: string): Promise<void> {
//     entityLoading = true
//     error = false
//     timedOut = false

//     try {
//         if (Web3Wallet.isEthereumAvailable()) {
//             walletAddress = await Web3Wallet.getAddress()
//         }
//         entityState = await getEntityMetadataByAddress(entityAddress, gateway )
//         entityLoading = false
//     }
//     catch (err) {
//         if (err && err.message == "The given entity has no metadata defined yet") {
//             entityState = null
//             entityLoading = false
//             return
//         }
//         if (err && (err === "The request timed out" || err.message === "The request timed out")) {
//             timedOut = true
//             return
//         }
//         error = true
//         console.log(err)
//         return
//     }
// }

// GETTERS

export function getNetworkState() {
    return {
        readOnly: !gateway || !getWeb3Wallet().hasWallet(),
        isConnected,
        bootnodesReadOnly,
        bootnodesPrivate,
        error,
        timedOut
    }
}

/**
 * Returns the current Gateway instances.
 * If no connection is ready, it opens one.
 */
export async function getGatewayClients() {
    if (!isConnected) await initNetwork()

    return gateway
}
