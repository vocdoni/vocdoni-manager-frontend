import { Component } from "react"
import Web3Manager, { AccountState } from "../util/ethereum-manager"
import { init, getState } from "../util/dvote"
import MainLayout from "../components/layout"
import { EntityMetadata } from "dvote-js"

// import PageHome from "../components/page-home"
// import PageEntityInfo from "../components/page-entity-info"
// import PagePosts from "../components/page-posts"
// import PageVotes from "../components/page-votes"
// import PageCensus from "../components/page-census"
// import PageRelays from "../components/page-relays"

import EthereumInfo from "../components/page-ethereum-info"
import { message } from "antd";

enum Page {
    Home = "Home",  // General menu
    EntityInfo = "EntityInfo",
    OfficialDiary = "OfficialDiary",
    VotingProcesses = "VotingProcesses",
    CensusService = "CensusService",
    Relays = "Relays"
}

interface State {
    accountState: AccountState,
    accountAddress: string,
    entityInfo: EntityMetadata,
    votingProcesses: any[],
    selectedPage: Page
}

export default class Main extends Component<{}, State> {
    state = {
        accountState: AccountState.Unknown,
        accountAddress: "",
        entityInfo: null,
        votingProcesses: [],
        selectedPage: Page.Home
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

        const prevAddress = this.state.accountAddress
        const prevEntityInfo = this.state.entityInfo
        const prevVotingProcesses = this.state.votingProcesses

        if (currentAccountState === AccountState.Ok) {
            // Was locked but now it's not? => connect
            if (prevAccountState !== AccountState.Ok) {
                try {
                    await init();
                }
                catch (err) {
                    return message.error("Unable to initialize the decentralized connection")
                }
            }

            // Is metadata different than it was? => sync
            const { address, entityInfo, votingProcesses } = getState();
            if (prevAddress != address || prevEntityInfo != entityInfo || prevVotingProcesses != votingProcesses) {
                this.setState({
                    accountAddress: address,
                    entityInfo,
                    votingProcesses
                })
            }
        }

        if (prevAccountState != currentAccountState) {
            this.setState({ accountState: currentAccountState })
        }
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
        //             refresh={() => { this.refreshState() }}
        //         />
        //     case Page.EntityInfo:
        //         return <PageEntityInfo
        //             entityInfo={this.state.entityInfo}
        //             currentAddress={this.state.accountAddress}
        //             refresh={() => { this.refreshState() }}
        //         />
        //     case Page.OfficialDiary:
        //         return <PagePosts
        //             entityInfo={this.state.entityInfo}
        //             currentAddress={this.state.accountAddress}
        //         />
        //     case Page.VotingProcesses:
        //         return <PageVotes
        //             entityInfo={this.state.entityInfo}
        //             currentAddress={this.state.accountAddress}
        //             processesMetadata={this.state.processesMetadata}
        //         />
        //     case Page.CensusService:
        //         return <PageCensus
        //             entityInfo={this.state.entityInfo}
        //             currentAddress={this.state.accountAddress}
        //         />
        //     case Page.Relays:
        //         return <PageRelays
        //             entityInfo={this.state.entityInfo}
        //             currentAddress={this.state.accountAddress}
        //         />
        // }

        return <div>Not found</div>
    }

    render() {
        return <MainLayout
            currentAddress={this.state.accountAddress}
            entityName={this.state.entityInfo && this.state.entityInfo["entity-name"]}
            menuClicked={(key: Page) => this.setState({ selectedPage: key })}
        >
            {this.renderPageContent()}
        </MainLayout>
    }
}