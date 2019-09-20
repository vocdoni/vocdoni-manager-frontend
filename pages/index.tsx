import { Component } from "react"
import Web3Manager, { AccountState } from "../util/ethereum-manager"
import { init, getState } from "../util/dvote"
import MainLayout, { Page } from "../components/layout"
import { EntityMetadata } from "dvote-js"

import PageHome from "../components/page-home"
import PageEntityMeta from "../components/page-entity-meta"
// import PagePosts from "../components/page-posts"
import PageVotes from "../components/page-votes"
// import PageCensus from "../components/page-census"
// import PageRelays from "../components/page-relays"

import EthereumInfo from "../components/page-ethereum-info"
import { message } from "antd"

interface State {
    accountState: AccountState,
    accountAddress: string,
    entityMetadata: EntityMetadata,
    votingProcesses: any[],
    selectedPage: Page
}

export default class Main extends Component<{}, State> {
    state = {
        accountState: AccountState.Unknown,
        accountAddress: "",
        entityMetadata: null,
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
        const prevEntityMetadata = this.state.entityMetadata
        const prevVotingProcesses = this.state.votingProcesses

        if (currentAccountState === AccountState.Ok) {
            // Was locked but now it's not? => connect
            if (prevAccountState !== AccountState.Ok) {
                try {
                    await init();
                }
                catch (err) {
                    console.error(err)
                    return message.error("Unable to initialize the decentralized connection")
                }
            }

            // Is metadata different than it was? => sync
            const { address, entityMetadata, votingProcesses } = getState();
            if (prevAddress != address || prevEntityMetadata != entityMetadata || prevVotingProcesses != votingProcesses) {
                this.setState({
                    accountAddress: address,
                    entityMetadata,
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

        switch (this.state.selectedPage) {
            case Page.Home:
                return <PageHome
                    refresh={() => { this.refreshState() }}
                />
            case Page.EntityMeta:
                return <PageEntityMeta
                    refresh={() => { this.refreshState() }} />
            case Page.VotingProcesses:
                return <PageVotes
                    refresh={() => { this.refreshState() }}
                    entityDetails={this.state.entityMetadata}
                    currentAddress={this.state.accountAddress}
                />
            //     case Page.OfficialDiary:
            //         return <PagePosts
            //             entityMetadata={this.state.entityMetadata}
            //             currentAddress={this.state.accountAddress}
            //         />
            //     case Page.VotingProcesses:
            //         return <PageVotes
            //             entityMetadata={this.state.entityMetadata}
            //             currentAddress={this.state.accountAddress}
            //         />
            //     case Page.CensusService:
            //         return <PageCensus
            //             entityMetadata={this.state.entityMetadata}
            //             currentAddress={this.state.accountAddress}
            //         />
            //     case Page.Relays:
            //         return <PageRelays
            //             entityMetadata={this.state.entityMetadata}
            //             currentAddress={this.state.accountAddress}
            //         />
        }

        return <div>Not found</div>
    }

    render() {
        return <MainLayout
            currentAddress={this.state.accountAddress}
            entityName={this.state.entityMetadata && this.state.entityMetadata.name && this.state.entityMetadata.name[this.state.entityMetadata.languages[0]]}
            menuClicked={(key: Page) => this.setState({ selectedPage: key })}
        >
            {this.renderPageContent()}
        </MainLayout>
    }
}
