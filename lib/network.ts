import { message } from 'antd'
import {
    GatewayPool,
    IEnsPublicResolverContract,
    IGatewayDiscoveryParameters,
    VocdoniEnvironment,
} from 'dvote-js'
import { getWeb3Wallet } from './web3-wallet'
import { main } from '../i18n'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID as any
const BOOTNODES_URL_READ_ONLY = process.env.BOOTNODES_URL_READ_ONLY
const BOOTNODES_URL_RW = process.env.BOOTNODES_URL_RW

let entityResolver: IEnsPublicResolverContract = null
// let votingProcess: IVotingProcessContract = null

// STATE DATA
let gateway: GatewayPool

let isConnected = false
// tslint:disable-next-line
const error = false
// tslint:disable-next-line
let connecting: Promise<void>

export async function initNetwork() {
    if (connecting) {
        await connecting
        if (isConnected) return
    }
    const web3Wallet = getWeb3Wallet()

    const hideLoading = message.loading(main.connectingWait, 0)

    try {
        if (!web3Wallet.hasWallet()) {
            // USE PUBLIC GATEWAYS
            const options: IGatewayDiscoveryParameters = {
                networkId: ETH_NETWORK_ID,
                bootnodesContentUri: BOOTNODES_URL_READ_ONLY,
                numberOfGateways: 2,
                timeout: 900,
                environment: process.env.ETH_NETWORK_ENVIRONMENT as VocdoniEnvironment,
            }
            gateway = await GatewayPool.discover(options)

            entityResolver = await gateway.getEnsPublicResolverInstance()
            // votingProcess = gateway.getVotingProcessInstance()
        }
        else {
            // USE PRIVATE GATEWAYS
            const options: IGatewayDiscoveryParameters = {
                networkId: ETH_NETWORK_ID,
                bootnodesContentUri: BOOTNODES_URL_RW,
                numberOfGateways: 2,
                timeout: 900,
                environment: process.env.ETH_NETWORK_ENVIRONMENT as VocdoniEnvironment,
            }
            gateway = await GatewayPool.discover(options)
            web3Wallet.connect(gateway.provider)

            entityResolver = await gateway.getEnsPublicResolverInstance(web3Wallet.getWallet())
            // votingProcess = gateway.getVotingProcessInstance(web3Wallet.getWallet())
        }
        await gateway.init()
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
        // tslint:disable-next-line
        if (entityResolver.provider["polling"]) entityResolver.provider["polling"] = false
    }

    // if (votingProcess && votingProcess.provider) {
    //     votingProcess.provider.removeAllListeners("ProcessCreated")
    //     votingProcess.provider.removeAllListeners("ProcessCanceled")
    //     // votingProcess.provider.removeAllListeners("RelayAdded")
    //     // votingProcess.provider.removeAllListeners("BatchRegistered")
    //     // votingProcess.provider.removeAllListeners("RelayDisabled")
    //     // votingProcess.provider.removeAllListeners("PrivateKeyRevealed")
    //     // tslint:disable-next-line
    //     if (votingProcess.provider["polling"]) votingProcess.provider["polling"] = false
    // }
    if (gateway) gateway.disconnect()

    gateway = null

    isConnected = false
}

export function getNetworkState() {
    return {
        readOnly: !gateway || !getWeb3Wallet().hasWallet(),
        isConnected,
        error
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
