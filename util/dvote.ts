import EthereumManager from "./ethereum-manager";
import { EntityResolver, VotingProcess } from "dvote-js"
import { notification } from 'antd'

const votingProcessAdress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const entityResolverAddress = process.env.ENTITY_RESOLVER_ADDRESS

let entityResolverContract: EntityResolver = null;
let votingProcessContract: VotingProcess = null;

let entityState: any;
let votingProcessesState: any[];

export async function init() {
    disconnect()

    const accountAddress = await EthereumManager.getAddress();

    entityResolverContract = new EntityResolver({ web3Provider: EthereumManager.provider });
    entityResolverContract.attach(entityResolverAddress);

    // React on all events (by now)
    entityResolverContract.contractInstance.on("TextChanged", () => this.fetchState());
    entityResolverContract.contractInstance.on("ListItemChanged", () => this.fetchState());

    votingProcessContract = new VotingProcess({ web3Provider: EthereumManager.provider });
    votingProcessContract.attach(votingProcessAdress);

    // Listen selectively
    votingProcessContract.contractInstance.on(
        votingProcessContract.contractInstance.filters.ProcessCreated(accountAddress),
        () => this.fetchState());
    votingProcessContract.contractInstance.on(
        votingProcessContract.contractInstance.filters.ProcessCanceled(accountAddress),
        () => this.fetchState());
    // votingProcessContract.contractInstance.on("RelayAdded", () => this.fetchState());
    // votingProcessContract.contractInstance.on("BatchRegistered", () => this.fetchState());
    // votingProcessContract.contractInstance.on("RelayDisabled", () => this.fetchState());
    // votingProcessContract.contractInstance.on("PrivateKeyRevealed", () => this.fetchState());
}

export function disconnect() {
    if (entityResolverContract && votingProcessContract.provider) {
        votingProcessContract.provider.removeAllListeners("TextChanged");
        votingProcessContract.provider.removeAllListeners("ListItemChanged");
    }

    if (votingProcessContract && votingProcessContract.provider) {
        votingProcessContract.provider.removeAllListeners("ProcessCreated")
        votingProcessContract.provider.removeAllListeners("ProcessCanceled")
        // votingProcessContract.provider.removeAllListeners("RelayAdded")
        // votingProcessContract.provider.removeAllListeners("BatchRegistered")
        // votingProcessContract.provider.removeAllListeners("RelayDisabled")
        // votingProcessContract.provider.removeAllListeners("PrivateKeyRevealed")
    }
}

export async function fetchState(): Promise<void> {
    // entityResolverContract.getResolverFields // TODO:
}

export function getEntity() {
    return entityState
}

export function getVotes() {
    return votingProcessesState
}
