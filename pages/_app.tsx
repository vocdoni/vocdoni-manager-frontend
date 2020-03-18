import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import AppContext from '../components/app-context'
import MainLayout from "../components/layout"
import GeneralError from '../components/error'
import { init, getState } from "../lib/gateways"
import { IAppContext } from "../components/app-context"
import Web3Manager, { AccountState } from "../lib/web3-wallet"
import { message, Spin } from "antd"
// import { } from "../lib/types"
// import { isServer } from '../lib/util'

import "../styles/index.css"
import 'antd/lib/message/style/index.css'
import 'antd/lib/input/style/index.css'
import 'antd/lib/input-number/style/index.css'
import 'antd/lib/date-picker/style/index.css'
import 'antd/lib/spin/style/index.css'
import 'antd/lib/skeleton/style/index.css'
import MetamaskState from '../components/metamask-state'

type Props = {
    // injectedArray: any[],
}

interface State {
    isConnected: boolean,
    accountState: AccountState
}

class MainApp extends App<Props, State> {
    state: State = {
        isConnected: false,
        accountState: AccountState.Unknown
    }

    refreshInterval: any

    // static async getInitialProps(appContext) {
    //     // calls page's `getInitialProps` and fills `appProps.pageProps`
    //     const appProps = await App.getInitialProps(appContext)
    //
    //     // Fetch data and provide it on the first render
    //     const injectedArray = []
    //
    //     return { injectedArray, ...appProps }
    // }

    componentDidMount() {
        // TODO: Handle public and private GW's
        init().then(() => {
            message.success("Connected")
            this.refreshState()
        }).catch(err => {
            this.refreshState()
            message.error("Could not connect")
        });

        this.refreshInterval = setInterval(() => this.refreshState(), 3500)
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


    onGatewayError(type: "private" | "public") {
        // TODO: reconnect or shift
        init().then(() => {
            message.success("Connected")
            this.refreshState()
        }).catch(err => {
            this.refreshState()
            message.error("Could not connect")
        });
    }

    componentDidCatch(error: Error, _errorInfo: any/*ErrorInfo*/) {
        console.error(error)
        return <GeneralError />
    }

    renderPleaseWait() {
        return <div className="please-wait">
            <div>Please, wait... <Spin size="small" /></div>
        </div>
    }

    render() {
        const accountState = this.state.accountState

        if (!this.state.isConnected) {
            return this.renderPleaseWait()
        }
        else if (accountState !== AccountState.Ok) {
            return <MetamaskState accountState={this.state.accountState} />
        }

        // Main render

        const { Component, pageProps } = this.props

        // Get data from getInitialProps and provide it as the global context to children
        // const { injectedArray } = this.props

        const injectedGlobalContext: IAppContext = {
            onGatewayError: this.onGatewayError
        }


        // Does the current component want its own layout?
        const Layout = (Component as any).Layout || MainLayout
        return <AppContext.Provider value={injectedGlobalContext}>
            <Head>
                <title>Vocdoni</title>
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AppContext.Provider>
    }
}

export default MainApp
