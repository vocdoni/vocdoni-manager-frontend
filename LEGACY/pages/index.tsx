import { Component } from "react"
import Web3Manager, { AccountState } from "../util/web3-wallet"
import { init, getState } from "../util/dvote-state"
import MainLayout, { Page } from "../components/layout"
import { EntityMetadata } from "dvote-js"

import PageHome from "../components/page-home"
import PageEntityMeta from "../components/page-entity-meta"
// import PagePosts from "../components/page-posts"
import PageVotes from "../components/page-votes"
import PageNewsFeed from "../components/page-newsfeed"
// import PageCensus from "../components/page-census"
// import PageRelays from "../components/page-relays"

import EthereumInfo from "../components/page-ethereum-info"
import { message, Skeleton, Spin } from "antd"

interface State {
    isConnected: boolean,
    accountState: AccountState,
    accountAddress: string,
    entityMetadata: EntityMetadata,
    votingProcesses: any[],
    selectedPage: Page
}

export default class Main extends Component<{}, State> {
    state = {
        isConnected: false,
        accountState: AccountState.Unknown,
        accountAddress: "",
        entityMetadata: null,
        votingProcesses: [],
        selectedPage: Page.Home
    }

    refreshInterval: any

    componentDidMount() {
        init().then(() => {
            message.success("Connected")
        }).catch(err => {
            message.error("Could not connect")
        });

        this.refreshInterval = setInterval(() => this.refreshState(), 3500)
        this.refreshState()
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    async refreshState() {
        const currentAccountState = await Web3Manager.getAccountState()

        // Is metadata different than it was? => sync
        const { isConnected, address, entityMetadata, votingProcesses } = getState();
        this.setState({
            isConnected,
            accountAddress: address,
            entityMetadata,
            votingProcesses,
            accountState: currentAccountState
        })
    }

    renderPleaseWait() {
        return <div style={{ paddingTop: 30, textAlign: "center" }}>
            <div>Please, wait... <Spin size="small" /></div>
        </div>
    }

    renderPageContent() {
        const accountState = this.state.accountState

        if (!this.state.isConnected) {
            return this.renderPleaseWait()
        }
        else if (accountState !== AccountState.Ok) {
            return <EthereumInfo accountState={this.state.accountState} />
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
            case Page.OfficialDiary:
                return <PageNewsFeed
                    refresh={() => { this.refreshState() }}
                    entityDetails={this.state.entityMetadata}
                    currentAddress={this.state.accountAddress}
                />
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
