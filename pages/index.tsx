import { Component } from "react"
import { Layout } from 'antd'
import Web3Manager from "../utils/web3Manager";
import DvoteUtil from "../utils/dvoteUtil";
import NewEntity from "../components/newEntity";
import MainLayout from "../components/layout";
import AccountStatus from "../components/accountStatus";
import Manager from "../components/manager"
import { AccountState } from "../utils/accountState";
import Setup from "../components/setup";
const { Header } = Layout;

enum Page {
    Home = "Home",
    Setup = "Setup",
    Manager = "Manager",
    NewEntity = "NewEntity",
    Registry = "Registry"
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
        selectedPage: Page.Home,
        entityDetails: null
    }

    dvote: DvoteUtil
    checkInterval: any

    votingAddress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
    entityAddress = process.env.VOTING_ENTITY_CONTRACT_ADDRESS
    censusServiceUrl = process.env.CENSUS_SERVICE_URL

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
                this.dvote.initProcess(Web3Manager.getInjectedProvider(), this.votingAddress)
                this.dvote.initEntity(Web3Manager.getInjectedProvider(), this.entityAddress)
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

        if (accountState !== AccountState.Ok)
            return Page.Setup

        else if (!this.state.entityDetails || !this.state.entityDetails.name)
            return Page.NewEntity

        else if (accountState === AccountState.Ok)
            return Page.Manager

        return Page.Home
    }

    renderPageContent() {
        if (this.state.selectedPage === Page.Home)
            return <div></div>

        if (this.state.selectedPage === Page.Setup)
            return <Setup
                accountState={this.state.accountState}
                onClickUnlockAccount={this.onClickUnlockAccount}
            />

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

    onClickUnlockAccount = () => {
        Web3Manager.unlock()
    }

    render() {
        return <MainLayout>
            <Header style={{ backgroundColor: "#173f56a3" }}>
                <AccountStatus
                    currentAddress={this.state.currentAddress}
                    entityDetails={this.state.entityDetails}
                />
            </Header>
            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderPageContent()}
            </div>

        </MainLayout>
    }
}