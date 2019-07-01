import EthereumManager from "./ethereum-manager";
import { EntityResolver, VotingProcess, EntityMetadataTemplate } from "dvote-js"
import { message } from 'antd'
import axios from "axios"
import { EntityMetadata } from "dvote-js"

export type BootNode = { dvote: string, web3: string }
type BootNodesResponse = ({ [k: string]: BootNode })[]

const entityResolverAddress = process.env.ENTITY_RESOLVER_ADDRESS
const votingProcessAdress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const BOOTNODES_URL = process.env.BOOTNODES_URL
const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

let entityResolver: EntityResolver = null;
let votingProcess: VotingProcess = null;

// STATE DATA
let availableGateways: { dvote: string, web3: string }[];
let accountAddressState: string;
let entityMetadataState: EntityMetadata;
let votingProcessesState: any[];
let newsState: { [lang: string]: any[] }

export async function init() {
    disconnect()

    const bootNodesMap = await fetchBootnodes();
    if (!Array.isArray(bootNodesMap[ETH_NETWORK_ID])) throw new Error("Invalid bootstrap nodes")
    availableGateways = bootNodesMap[ETH_NETWORK_ID]

    accountAddressState = await EthereumManager.getAddress();

    // RESOLVER CONTRACT
    entityResolver = new EntityResolver({ providerUrl: availableGateways[0].web3 }); // GATEWAY PROVIDER
    // entityResolver = new EntityResolver({ provider: EthereumManager.provider }); // METAMASK PROVIDER
    entityResolver.attach(entityResolverAddress);
    entityResolver.contractInstance.connect(EthereumManager.signer as any)

    // React on all events (by now)
    entityResolver.contractInstance.on("TextChanged", () => this.fetchState());
    entityResolver.contractInstance.on("ListItemChanged", () => this.fetchState());

    // TODO:
    // PROCESS CONTRACT
    // votingProcess = new VotingProcess({ providerUrl: availableGateways[0].web3 }); // GATEWAY PROVIDER
    // // votingProcess = new VotingProcess({ provider: EthereumManager.provider }); // GATEWAY PROVIDER
    // votingProcess.attach(votingProcessAdress);
    // votingProcess.contractInstance.connect(EthereumManager.signer)

    // // Listen selectively
    // votingProcess.contractInstance.on(
    //     votingProcess.contractInstance.filters.ProcessCreated(accountAddressState),
    //     () => this.fetchState(accountAddressState));
    // votingProcess.contractInstance.on(
    //     votingProcess.contractInstance.filters.ProcessCanceled(accountAddressState),
    //     () => this.fetchState(accountAddressState));
    // // votingProcess.contractInstance.on("RelayAdded", () => this.fetchState(accountAddressState));
    // // votingProcess.contractInstance.on("BatchRegistered", () => this.fetchState(accountAddressState));
    // // votingProcess.contractInstance.on("RelayDisabled", () => this.fetchState(accountAddressState));
    // // votingProcess.contractInstance.on("PrivateKeyRevealed", () => this.fetchState(accountAddressState));

    return fetchState(accountAddressState)
}

export function disconnect() {
    if (entityResolver && entityResolver.provider) {
        entityResolver.provider.removeAllListeners("TextChanged");
        entityResolver.provider.removeAllListeners("ListItemChanged");
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

export async function fetchBootnodes(): Promise<BootNodesResponse> {
    return axios.get<BootNodesResponse>(BOOTNODES_URL).then(res => res.data)
}

export async function fetchState(entityAddress: string = accountAddressState): Promise<void> {
    shuffleGateways()
    for (let node of availableGateways) {
        try {
            const meta: EntityMetadata = await entityResolver.getMetadata(entityAddress, node.dvote);
            entityMetadataState = meta;
            return;
        }
        catch (err) {
            console.log(err);
            continue;
        }
    }
    message.error("Unable to fetch from the network")
}

export function updateEntity(entityAddress: string, entityMetadata: EntityMetadata) {
    // override any missing field of the given state with safe defaults
    const payload: EntityMetadata = Object.assign({}, EntityMetadataTemplate, entityMetadata)

    // local resolver
    const entityResolver = new EntityResolver({ web3Provider: EthereumManager.provider as any }); // METAMASK PROVIDER
    entityResolver.attach(entityResolverAddress);
    entityResolver.contractInstance.connect(EthereumManager.signer as any)

    // shuffleGateways()
    // for (let node of availableGateways) {
    //     try {
    //         await entityResolver.updateEntity(entityAddress, payload, node.dvote)
    //         return // it worked
    //     }
    //     catch (err) {
    //         console.log(err)
    //         continue
    //     }
    // }

    debugger // TODO: use the shuffled loop above
    return entityResolver.updateEntity(entityAddress, payload, availableGateways[0].dvote)
    message.error("Unable to connect to a gateway")
}

// GETTERS

export function getState() {
    return {
        address: accountAddressState,
        entityMetadata: entityMetadataState,
        votingProcesses: votingProcessesState,
        news: newsState,
        bootnodes: availableGateways
    }
}

// INTERNAL

function shuffleGateways() {
    availableGateways.sort(() => Math.random() * 2 - 1)
}