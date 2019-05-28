import { Component } from "react"
import Web3Manager, { AccountState } from "../util/ethereum-manager"
import { init, getEntity } from "../util/dvote"
import MainLayout from "../components/layout"

// import PageHome from "../components/page-home"
// import PageEntityMeta from "../components/page-entity-meta"
// import PagePosts from "../components/page-posts"
// import PageVotes from "../components/page-votes"
// import PageCensus from "../components/page-census"
// import PageRelays from "../components/page-relays"

import EthereumInfo from "../components/page-ethereum-info"

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
    selectedPage: Page,
    entityDetails: object
}

export default class Main extends Component<{}, State> {
    state = {
        accountState: AccountState.Unknown,
        currentAddress: "",
        selectedPage: Page.Home,
        entityDetails: null
    }

    refreshInterval: any

    componentDidMount() {
        this.refreshInterval = setInterval(() => this.refreshState(), 1000)
        this.refreshState()
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    async refreshState() {
        const prevAccountState = this.state.accountState
        const currentAccountState = await Web3Manager.getAccountState()

        let currentAddress = ""
        const prevAddress = this.state.currentAddress

        if (currentAccountState === AccountState.Ok) {
            // Was locked but now it's not? => connect
            if (prevAccountState !== AccountState.Ok) {
                await init();
            }

            // Is metadata different than it was? => sync
            const entity = getEntity();
            // if(entity != ) // TODO:
            // if(prevAddress != currentAddress)
        }

        this.setState({ accountState: currentAccountState, currentAddress })
    }


    renderPageContent() {
        const accountState = this.state.accountState

        if (accountState !== AccountState.Ok) {
            return <EthereumInfo
                accountState={this.state.accountState}
            />
        }

        // switch (this.state.selectedPage) {
        //     case Page.Home:
        //         return <PageHome
        //             entityDetails={this.state.entityDetails}
        //             currentAddress={this.state.currentAddress}
        //             refresh={() => { this.getEntityDetails() }}
        //         />
        //     case Page.EntityMeta:
        //         return <PageEntityMeta
        //             entityDetails={this.state.entityDetails}
        //             currentAddress={this.state.currentAddress}
        //             refresh={() => { this.getEntityDetails() }}
        //         />
        //     case Page.OfficialDiary:
        //         return <PagePosts
        //             entityDetails={this.state.entityDetails}
        //             currentAddress={this.state.currentAddress}
        //         />
        //     case Page.VotingProcesses:
        //         return <PageVotes
        //             entityDetails={this.state.entityDetails}
        //             currentAddress={this.state.currentAddress}
        //             processesMetadata={this.state.processesMetadata}
        //         />
        //     case Page.CensusService:
        //         return <PageCensus
        //             entityDetails={this.state.entityDetails}
        //             currentAddress={this.state.currentAddress}
        //         />
        //     case Page.Relays:
        //         return <PageRelays
        //             entityDetails={this.state.entityDetails}
        //             currentAddress={this.state.currentAddress}
        //         />
        // }

        return <div>UNIMPLEMENTED</div>
    }

    render() {
        return <MainLayout
            currentAddress={this.state.currentAddress}
            entityName={this.state.entityDetails && this.state.entityDetails.name}
            menuClicked={(key: Page) => this.setState({ selectedPage: key })}
        >
            {this.renderPageContent()}
        </MainLayout>
    }
}