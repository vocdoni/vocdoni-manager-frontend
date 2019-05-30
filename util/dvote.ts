import EthereumManager from "./ethereum-manager";
import { EntityResolver, VotingProcess } from "dvote-js"
import { message } from 'antd'
import axios from "axios"
import { EntityMetadata } from "dvote-js"

type BootNodesResponse = ({ [k: string]: { dvote: string, web3: string } })[]

const votingProcessAdress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const entityResolverAddress = process.env.ENTITY_RESOLVER_ADDRESS
const BOOTNODES_URL = process.env.BOOTNODES_URL
const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

let entityResolver: EntityResolver = null;
let votingProcess: VotingProcess = null;

// STATE DATA
let bootnodesState: { dvote: string, web3: string }[];
let accountAddressState: string;
let entityState: EntityMetadata;
let votingProcessesState: any[];
let newsState: { [lang: string]: any[] }

export async function init() {
    disconnect()

    accountAddressState = await EthereumManager.getAddress();

    entityResolver = new EntityResolver({ web3Provider: EthereumManager.provider });
    entityResolver.attach(entityResolverAddress);

    const bootNodesMap = await fetchBootnodes();
    if (!Array.isArray(bootNodesMap[ETH_NETWORK_ID])) throw new Error("Invalid bootstrap nodes")
    bootnodesState = bootNodesMap[ETH_NETWORK_ID]

    // React on all events (by now)
    entityResolver.contractInstance.on("TextChanged", () => this.fetchState());
    entityResolver.contractInstance.on("ListItemChanged", () => this.fetchState());

    votingProcess = new VotingProcess({ web3Provider: EthereumManager.provider });
    votingProcess.attach(votingProcessAdress);

    // Listen selectively
    votingProcess.contractInstance.on(
        votingProcess.contractInstance.filters.ProcessCreated(accountAddressState),
        () => this.fetchState(accountAddressState));
    votingProcess.contractInstance.on(
        votingProcess.contractInstance.filters.ProcessCanceled(accountAddressState),
        () => this.fetchState(accountAddressState));
    // votingProcess.contractInstance.on("RelayAdded", () => this.fetchState(accountAddressState));
    // votingProcess.contractInstance.on("BatchRegistered", () => this.fetchState(accountAddressState));
    // votingProcess.contractInstance.on("RelayDisabled", () => this.fetchState(accountAddressState));
    // votingProcess.contractInstance.on("PrivateKeyRevealed", () => this.fetchState(accountAddressState));

    await this.fetchState(accountAddressState)
}

export function disconnect() {
    if (entityResolver && votingProcess.provider) {
        votingProcess.provider.removeAllListeners("TextChanged");
        votingProcess.provider.removeAllListeners("ListItemChanged");
    }

    if (votingProcess && votingProcess.provider) {
        votingProcess.provider.removeAllListeners("ProcessCreated")
        votingProcess.provider.removeAllListeners("ProcessCanceled")
        // votingProcess.provider.removeAllListeners("RelayAdded")
        // votingProcess.provider.removeAllListeners("BatchRegistered")
        // votingProcess.provider.removeAllListeners("RelayDisabled")
        // votingProcess.provider.removeAllListeners("PrivateKeyRevealed")
    }
}

export async function fetchBootnodes(): Promise<BootNodesResponse> {
    return axios.get<BootNodesResponse>(BOOTNODES_URL).then(res => res.data)
}

export async function fetchState(address: string): Promise<void> {
    for (let node of bootnodesState) {
        try {
            const meta: EntityMetadata = await entityResolver.fetchJsonMetadata(address, node.dvote);
            entityState = meta;
            return;
        }
        catch (err) {
            console.log(err);
            continue;
        }
    }
    message.error("Unable to fetch from the network")
}

// GETTERS

export function getState() {
    return {
        address: accountAddressState,
        entityInfo: entityState,
        votingProcesses: votingProcessesState,
        news: newsState
    }
}
