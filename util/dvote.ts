import EthereumManager from "./ethereum-manager";
import { EntityResolver, VotingProcess, TextRecordKeys, TextListRecordKeys } from "dvote-js"
import { message } from 'antd'
import axios from "axios"
import { EntityMetadata, EntityResolverFields } from "dvote-js"

export type BootNode = { dvote: string, web3: string }
type BootNodesResponse = ({ [k: string]: BootNode })[]

const entityResolverAddress = process.env.ENTITY_RESOLVER_ADDRESS
const votingProcessAdress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
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

    const bootNodesMap = await fetchBootnodes();
    if (!Array.isArray(bootNodesMap[ETH_NETWORK_ID])) throw new Error("Invalid bootstrap nodes")
    bootnodesState = bootNodesMap[ETH_NETWORK_ID]

    accountAddressState = await EthereumManager.getAddress();

    // RESOLVER CONTRACT
    entityResolver = new EntityResolver({ providerUrl: bootnodesState[0].web3 }); // GATEWAY PROVIDER
    // entityResolver = new EntityResolver({ provider: EthereumManager.provider }); // METAMASK PROVIDER
    entityResolver.attach(entityResolverAddress);
    entityResolver.contractInstance.connect(EthereumManager.signer)

    // React on all events (by now)
    entityResolver.contractInstance.on("TextChanged", () => this.fetchState());
    entityResolver.contractInstance.on("ListItemChanged", () => this.fetchState());

    // TODO:
    // PROCESS CONTRACT
    // votingProcess = new VotingProcess({ providerUrl: bootnodesState[0].web3 }); // GATEWAY PROVIDER
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

export async function fetchState(entityAddress: string): Promise<void> {
    for (let node of bootnodesState) {
        try {
            const meta: EntityMetadata = await entityResolver.fetchJsonMetadata(entityAddress, node.dvote);
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

export function getAllEntityFields(entityAddress: string): Promise<EntityResolverFields> {
    return entityResolver.fetchAllFields(entityAddress)
}

export function getEntityField(entityAddress: string, fieldName: string): Promise<string | string[]> {
    const entityId = EntityResolver.getEntityId(entityAddress)

    for (let k in TextListRecordKeys) {
        if (k.startsWith(fieldName)) {
            return entityResolver.contractInstance.list(entityId, fieldName)
        }
    }

    return entityResolver.contractInstance.text(entityId, fieldName)
}

export function setEntityTextField(entityAddress: string, fieldName: string, value: string) {
    const entityId = EntityResolver.getEntityId(entityAddress)
    entityResolver.contractInstance.connect(EthereumManager.signer)

    return entityResolver.contractInstance.setText(entityId, fieldName, value)
        .then(tx => tx.wait())
}

export function setEntityTextListField(entityAddress: string, fieldName: string, index: number, value: string[]) {
    const entityId = EntityResolver.getEntityId(entityAddress)

    return entityResolver.contractInstance.setListText(entityId, fieldName, index, value)
        .then(tx => tx.wait())
}

// GETTERS

export function getState() {
    return {
        address: accountAddressState,
        entityInfo: entityState,
        votingProcesses: votingProcessesState,
        news: newsState,
        bootnodes: bootnodesState
    }
}
