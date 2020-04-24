import { API, Wrappers, Network, EntityMetadata, IDVoteGateway, IWeb3Gateway, IEntityResolverContract, IVotingProcessContract, GatewayBootNodes } from "dvote-js"
import { message } from "antd"
import { Wallet, Signer, getDefaultProvider } from "ethers"
import { Web3Gateway } from "dvote-js/dist/net/gateway"
import Web3Wallet from "./web3-wallet"
import { fetchFromBootNode } from "dvote-js/dist/net/gateway-bootnodes"

const { Bootnodes: { getGatewaysFromBootNode }, Contracts: { getEntityResolverInstance, getVotingProcessInstance } } = Network
// const {GatewayInfo} = Wrappers

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID as any
const BOOTNODES_URL_READ_ONLY = process.env.BOOTNODES_URL_READ_ONLY
const BOOTNODES_URL_RW = process.env.BOOTNODES_URL_RW

let entityResolver: IEntityResolverContract = null
let votingProcess: IVotingProcessContract = null

// STATE DATA
let readOnly: boolean = true
let dvoteGateway: IDVoteGateway
let web3Gateway: IWeb3Gateway
let accountAddressState: string

let bootnodesReadOnly: GatewayBootNodes
let bootnodesPrivate: GatewayBootNodes

let isConnected = false
let error: boolean = false
let timedOut: boolean = false

let connecting: Promise<void>
let web3Wallet: Web3Wallet;

export async function initNetwork(wallet: Web3Wallet) {
    web3Wallet = wallet;
    await connectClients()
    await fetchBootnodes()
}

export async function connectClients() {
    if (connecting) {
        await connecting
        if (isConnected) return
    }

    const hideLoading = message.loading("Connecting to the network. Please wait...", 0)

    try {
        readOnly = !web3Wallet.isAvailable()

        const infos = await getGatewaysFromBootNode(BOOTNODES_URL_RW)
        if (!infos || !infos[ETH_NETWORK_ID]) throw new Error("Could not connect to the network")
        else if (!infos[ETH_NETWORK_ID].dvote || !infos[ETH_NETWORK_ID].dvote.length) throw new Error("Could not connect to the network")
        else if (!infos[ETH_NETWORK_ID].web3 || !infos[ETH_NETWORK_ID].web3.length) throw new Error("Could not connect to the network")

        // Get working DvoteGW
        let success = false
        for (let gw of infos[ETH_NETWORK_ID].dvote) {
            try {
                await gw.connect()
                await gw.getGatewayInfo()
                dvoteGateway = gw
                success = true
            }
            catch (err) {
                continue
            }
        }
        if (!success) throw new Error("Could not connect to the network")
        // console.log("Connected to", await dvoteGateway.getUri())

        if (readOnly) {
            // USE PUBLIC GATEWAYS
            // SKIP METAMASK

            const provider = getDefaultProvider(ETH_NETWORK_ID)
            web3Gateway = new Web3Gateway(provider)

            entityResolver = await getEntityResolverInstance({ provider })
            votingProcess = await getVotingProcessInstance({ provider })
        }
        else {
            // USE PRIVATE GATEWAYS
            // USE WALLET

            //
            // TODO: 
            // Get working Web3GW

            accountAddressState = await web3Wallet.getAddress();

            success = false
            for (let w3 of infos[ETH_NETWORK_ID].web3) {
                try {
                    // RESOLVER CONTRACT
                    entityResolver = await getEntityResolverInstance({ provider: w3.getProvider(), signer: web3Wallet.getWallet() as (Wallet | Signer) })

                    // // React on all events (by now)
                    // entityResolver.on("TextChanged", () => refreshMetadata(accountAddressState))
                    // entityResolver.on("ListItemChanged", () => refreshMetadata(accountAddressState))

                    // PROCESS CONTRACT
                    votingProcess = await getVotingProcessInstance({ provider: w3.getProvider(), signer: web3Wallet.getWallet() as (Wallet | Signer) })

                    web3Gateway = w3
                    success = true
                }
                catch (err) {
                    continue
                }
            }

            if (!success) throw new Error("Could not connect to the network")
            // console.log("Connected to", web3Gateway.getProvider())
        }
        isConnected = true
    }
    catch (err) {
        console.error(err)
        hideLoading()
        throw err
    }

    // // Listen selectively
    // votingProcess.on(
    //     votingProcess.filters.ProcessCreated(accountAddressState),
    //     () => refreshMetadata(accountAddressState))
    // votingProcess.on(
    //     votingProcess.filters.ProcessCanceled(accountAddressState),
    //     () => refreshMetadata(accountAddressState))
    // // votingProcess.on("RelayAdded", () => refreshMetadata(accountAddressState))
    // // votingProcess.on("BatchRegistered", () => refreshMetadata(accountAddressState))
    // // votingProcess.on("RelayDisabled", () => refreshMetadata(accountAddressState))
    // // votingProcess.on("PrivateKeyRevealed", () => refreshMetadata(accountAddressState))

    // return refreshMetadata(accountAddressState)
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

export async function fetchBootnodes() {
    try {
        bootnodesReadOnly = await fetchFromBootNode(BOOTNODES_URL_READ_ONLY)
        if (!readOnly) {
            bootnodesPrivate = await fetchFromBootNode(BOOTNODES_URL_RW)
        }
    }
    catch (err) {
        message.error("Connection error")
    }
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

// export async function refreshMetadata(entityAddress: string): Promise<void> {
//     entityLoading = true
//     error = false
//     timedOut = false

//     try {
//         if (Web3Wallet.isEthereumAvailable()) {
//             accountAddressState = await Web3Wallet.getAddress()
//         }
//         entityState = await getEntityMetadataByAddress(entityAddress, web3Gateway, dvoteGateway)
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
        readOnly,
        isConnected,
        address: accountAddressState,
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
    if (!isConnected) await connectClients()

    return {
        dvoteGateway,
        web3Gateway
    }
}
