import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import AppContext, { IGlobalState } from '../components/app-context'
import MainLayout from "../components/layout"
import GeneralError from '../components/error'
import { initNetwork, getNetworkState, getGatewayClients } from "../lib/network"
import { IAppContext } from "../components/app-context"
import Web3Wallet, { AccountState } from "../lib/web3-wallet"
import MetamaskState from '../components/metamask-state'
import { message, Spin } from "antd"
// import { } from "../lib/types"
// import { isServer } from '../lib/util'

import "../styles/index.css"
import 'antd/lib/message/style/index.css'
import 'antd/lib/button/style/index.css'
import 'antd/lib/menu/style/index.css'
import 'antd/lib/input/style/index.css'
import 'antd/lib/input-number/style/index.css'
import 'antd/lib/date-picker/style/index.css'
import 'antd/lib/spin/style/index.css'
import 'antd/lib/divider/style/index.css'
import 'antd/lib/skeleton/style/index.css'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

type Props = {
    // injectedArray: any[],
}

type State = {
    isConnected: boolean,
    accountState: AccountState,
    networkName: string,

    // STATE SHARED WITH CHILDREN
    title: string,
}

class MainApp extends App<Props, State> {
    state: State = {
        isConnected: false,
        accountState: AccountState.Unknown,
        title: "Entities",
        networkName: null
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
        initNetwork().then(() => {
            message.success("Connected")
            this.refreshWeb3Status()
        }).catch(err => {
            this.refreshWeb3Status()
            message.error("Could not connect")
        });

        this.refreshInterval = setInterval(() => this.refreshWeb3Status(), 3500)
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    setTitle(title: string) {
        this.setState({ title })
    }

    async refreshWeb3Status() {
        const currentAccountState = await Web3Wallet.getAccountState()
        const { web3Gateway } = await getGatewayClients()
        const networkName = (await web3Gateway.getProvider().getNetwork()).name

        const { isConnected } = getNetworkState();
        this.setState({
            isConnected,
            accountState: currentAccountState,
            networkName
        })
    }

    onGatewayError(type: "private" | "public") {
        // TODO: reconnect or shift
        initNetwork().then(() => {
            message.success("Connected")
            this.refreshWeb3Status()
        }).catch(err => {
            this.refreshWeb3Status()
            message.error("Could not connect")
        });
    }

    componentDidCatch(error: Error, _errorInfo: any/*ErrorInfo*/) {
        console.error(error)
        return <GeneralError />
    }

    renderPleaseWait() {
        return null // The loading message will appear

        // return <div id="global-loading">
        //     <div><Spin size="small" /> &nbsp;Please, wait... </div>
        // </div>
    }

    renderMetamaskState() {
        return <MainLayout>
            <MetamaskState accountState={this.state.accountState} />
        </MainLayout>
    }

    render() {
        const accountState = this.state.accountState

        if (!this.state.isConnected) {
            return this.renderPleaseWait()
        }
        else if (Web3Wallet.isAvailable()) {
            if (accountState !== AccountState.Ok) {
                return this.renderMetamaskState()
            }
            else if (Web3Wallet.isAvailable() && Web3Wallet.getNetworkName() != ETH_NETWORK_ID) {
                return <GeneralError message={"Please, switch Metamask to the " + ETH_NETWORK_ID + " network"} />
            }
        }



        // Main render

        const { Component, pageProps } = this.props

        // Get data from getInitialProps and provide it as the global context to children
        // const { injectedArray } = this.props

        const injectedGlobalContext: IAppContext = {
            title: this.state.title,
            setTitle: (title) => this.setTitle(title),
            onGatewayError: this.onGatewayError
        }


        // Does the current component want its own layout?
        const Layout = (Component as any).Layout || MainLayout
        return <AppContext.Provider value={injectedGlobalContext}>
            <Head>
                <title>Vocdoni Entities</title>
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AppContext.Provider>
    }
}

export default MainApp
