import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import AppContext, { IGlobalState } from '../components/app-context'
import MainLayout from "../components/layout"
import GeneralError from '../components/error'
import { initNetwork, getNetworkState, getGatewayClients } from "../lib/network"
import { IAppContext } from "../components/app-context"
import Web3Wallet from "../lib/web3-wallet"
import { message } from "antd"
// import { } from "../lib/types"
// import { isServer } from '../lib/util'

import "../styles/index.css"
import 'antd/lib/grid/style/index.css'
import 'antd/lib/list/style/index.css'
import 'antd/lib/form/style/index.css'
import 'antd/lib/select/style/index.css'
import 'antd/lib/pagination/style/index.css'
import 'antd/lib/radio/style/index.css'
import 'antd/lib/skeleton/style/index.css'
import 'antd/lib/divider/style/index.css'
import 'antd/lib/message/style/index.css'
import 'antd/lib/button/style/index.css'
import 'antd/lib/menu/style/index.css'
import 'antd/lib/input/style/index.css'
import 'antd/lib/input-number/style/index.css'
import 'antd/lib/date-picker/style/index.css'
import 'antd/lib/spin/style/index.css'
import 'antd/lib/modal/style/index.css'

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

type Props = {
    // injectedArray: any[],
}

type State = {
    isConnected: boolean,

    // STATE SHARED WITH CHILDREN
    title: string,
    web3Wallet: Web3Wallet,
}

class MainApp extends App<Props, State> {
    state: State = {
        isConnected: false,
        title: "Entities",
        web3Wallet: new Web3Wallet(),
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

    async componentDidMount() {
        await initNetwork(this.state.web3Wallet).then(async () => {
            message.success("Connected")
            await this.refreshWeb3Status()
        }).catch(err => {
            this.refreshWeb3Status()
            message.error("Could not connect")
        })

        this.refreshInterval = setInterval(() => this.refreshWeb3Status(), 3500)

        if (!getNetworkState().readOnly) {
            window.addEventListener('beforeunload', function (e) {
                // Cancel the event
                e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
                // Chrome requires returnValue to be set
                e.returnValue = '';
            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    setTitle(title: string) {
        this.setState({ title })
    }

    async refreshWeb3Status() {
        const { isConnected } = getNetworkState();
        this.setState({ isConnected })
    }

    onGatewayError(type: "private" | "public") {
        // TODO: reconnect or shift
        new Promise(resolve => setTimeout(resolve, 1000 * 3))
            .then(() => initNetwork(this.state.web3Wallet)).then(() => {
                // message.success("Connected")
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
        //     <div><Spin indicator={<LoadingOutlined />} /> &nbsp;Please, wait... </div>
        // </div>
    }

    render() {
        if (!this.state.isConnected) {
            return this.renderPleaseWait()
        }

        // Main render

        const { Component, pageProps } = this.props

        // Get data from getInitialProps and provide it as the global context to children
        // const { injectedArray } = this.props

        const injectedGlobalContext: IAppContext = {
            title: this.state.title,
            setTitle: (title) => this.setTitle(title),
            web3Wallet: this.state.web3Wallet,
            onGatewayError: this.onGatewayError,
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
