import { Component } from "react"
import Web3Manager from "../utils/web3Manager";
import DvoteUtil from "../utils/dvoteUtil";
import NewEntity from "./fragment-create-entity";
import Manager from "./_fragment-manager"
import { AccountState } from "../utils/accountState";

const votingAddress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const entityAddress = process.env.VOTING_ENTITY_CONTRACT_ADDRESS
// const censusServiceUrl = process.env.CENSUS_SERVICE_URL

enum Page {
    Manager = "Manager",
    NewEntity = "NewEntity"
}

interface State {
    accountState: AccountState,
    currentAddress: string
    processesMetadata: object
    selectedProcess: string
    selectedPage: Page,
    entityDetails: object
}

export default class Main extends Component<{}, State> {

    state = {
        accountState: AccountState.Unknown,
        currentAddress: "",
        processesMetadata: {},
        selectedProcess: "",
        selectedPage: Page.Manager,
        entityDetails: null
    }

    dvote: DvoteUtil
    checkInterval: any

    componentDidMount() {
        this.dvote = new DvoteUtil()
        this.dvote.initCensus(process.env.CENSUS_SERVICE_URL)

        this.checkInterval = setInterval(() => this.fetchState(), 1000)
        this.fetchState()
        const selectedPage = this.getPageForState()
        this.setState({ selectedPage })
    }

    componentWillUnmount() {
        clearInterval(this.checkInterval)
    }

    async fetchState() {
        let prevAccountState = this.state.accountState
        let prevAddress = this.state.currentAddress

        let currentAddress = ""
        let accountState = await Web3Manager.getBrowserAccountState()

        if (accountState === AccountState.Ok) {
            currentAddress = await Web3Manager.getAccount()

            if (prevAccountState !== AccountState.Ok) {
                this.dvote.initProcess(Web3Manager.getInjectedProvider(), votingAddress)
                this.dvote.initEntity(Web3Manager.getInjectedProvider(), entityAddress)
                this.fetchProcesses(currentAddress)
                this.fetchEntityDetails(currentAddress)
            }

            if (prevAddress !== currentAddress) {
                this.fetchProcesses(currentAddress)
                this.fetchEntityDetails(currentAddress)
            }
        }

        const selectedPage = this.getPageForState()
        this.setState({ accountState, currentAddress, selectedPage })
    }

    async fetchProcesses(organizerAddress: string) {
        let processesMetadata = await this.dvote.getProcessess(organizerAddress)
        const selectedPage = this.getPageForState()
        this.setState({ processesMetadata, selectedPage })
    }

    async fetchEntityDetails(organizerAddress: string) {
        let entityDetails = await this.dvote.getEntityDetails(organizerAddress)
        const selectedPage = this.getPageForState()
        this.setState({ entityDetails, selectedPage })
    }

    getPageForState(): Page {
        const accountState = this.state.accountState
        if (!this.state.entityDetails || !this.state.entityDetails.name)
            return Page.NewEntity

        else if (accountState === AccountState.Ok)
            return Page.Manager

        return Page.Manager
    }

    onClickUnlockAccount = () => {
        Web3Manager.unlock()
    }

    render() {
        if (this.state.selectedPage === Page.NewEntity)
            return <NewEntity
                dvote={this.dvote}
                defaultCensusRequestUrl={process.env.CENSUS_REQUEST_URL}
                currentAddress={this.state.currentAddress}
                accountState={this.state.accountState}
            />
        if (this.state.selectedPage === Page.Manager)
            return <Manager
                dvote={this.dvote}
                currentAddress={this.state.currentAddress}
                accountState={this.state.accountState}
                processesMetadata={this.state.processesMetadata}
                selectedProcess={this.state.selectedProcess}
            />

        return null
    }
}