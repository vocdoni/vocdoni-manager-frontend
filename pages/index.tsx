import { Component } from "react"
import { Layout, notification } from 'antd'
import Web3Manager from "../utils/web3Manager";
import DvoteUtil from "../utils/dvoteUtil";
import MainLayout from "../components/layout";

import PageHome from "../components/page-home";
import PageEntityMeta from "../components/page-entity-meta";
import PagePosts from "../components/page-posts";

import { AccountState } from "../utils/accountState";
import EthereumSetup from "../components/ethereum-setup";
const { Header } = Layout;

const votingAddress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS
const entityAddress = process.env.VOTING_ENTITY_CONTRACT_ADDRESS

enum Page {
    Home = "Home",  // General menu
    EntityMeta = "EntityMeta",
    OfficialDiary = "OfficialDiary",
    VotingProcesses = "VotingProcesses",
    CensusService = "CensusService",
    Relays = "Relays"
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

    componentDidMount() {
        this.dvote = new DvoteUtil()

        this.checkInterval = setInterval(() => this.fetchState(), 1000)
        this.fetchState()
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
                this.fetchEntityDetails(currentAddress)
            }

            if (prevAddress !== currentAddress) {
                this.fetchEntityDetails(currentAddress)
            }
        }

        this.setState({ accountState, currentAddress })
    }

    async fetchEntityDetails(organizerAddress?: string) {
        const addr = organizerAddress || this.state.currentAddress
        try {
            let entityDetails = await this.dvote.getEntityDetails(addr)
            this.setState({ entityDetails })
        }
        catch (err) {
            notification.error({ message: "Unable to fetch the entity" })
        }
    }

    renderPageContent() {
        const accountState = this.state.accountState

        if (accountState !== AccountState.Ok) {
            return <EthereumSetup
                accountState={this.state.accountState}
                onClickUnlockAccount={this.onClickUnlockAccount}
            />
        }

        switch (this.state.selectedPage) {
            case Page.Home:
                return <PageHome
                    entityDetails={this.state.entityDetails}
                    currentAddress={this.state.currentAddress}
                    refresh={() => { this.fetchEntityDetails() }}
                />
            case Page.EntityMeta:
                return <PageEntityMeta
                    entityDetails={this.state.entityDetails}
                    currentAddress={this.state.currentAddress}
                    refresh={() => { this.fetchEntityDetails() }}
                />
            case Page.OfficialDiary:
                return <PagePosts
                    entityDetails={this.state.entityDetails}
                    currentAddress={this.state.currentAddress}
                />
            case Page.VotingProcesses:
            case Page.CensusService:
            case Page.Relays:
        }

        return null
    }

    onClickUnlockAccount = () => {
        Web3Manager.unlock()
    }

    render() {
        return <MainLayout
            currentAddress={this.state.currentAddress}
            entityName={this.state.entityDetails && this.state.entityDetails.name}
            menuClicked={(key: Page) => this.setState({ selectedPage: key })}
        >
            <Header style={{ backgroundColor: "#173f56a3" }}>

            </Header>
            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderPageContent()}
            </div>

        </MainLayout>
    }
}