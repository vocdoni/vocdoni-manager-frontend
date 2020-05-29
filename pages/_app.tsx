import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import AppContext, { ISelected } from '../components/app-context'
import MainLayout from "../components/layout"
import GeneralError from '../components/error'
import { initNetwork, getNetworkState } from "../lib/network"
import { IAppContext } from "../components/app-context"
import Web3Wallet, { getWeb3Wallet } from "../lib/web3-wallet"
import { message } from "antd"
// import { } from "../lib/types"
// import { isServer } from '../lib/util'

import 'antd/dist/antd.css';
import "../styles/index.css"
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { Wallet } from 'ethers'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

type Props = {
    // injectedArray: any[],
}

type State = {
    isConnected: boolean,

    // STATE SHARED WITH CHILDREN
    title: string,
    menuVisible: boolean,
    menuSelected?: ISelected,
    menuCollapsed?: boolean,
    menuDisabled?: boolean,
    entityId?: string,
    processId?: string,
    urlHash?: string,
}

class MainApp extends App<Props, State> {
    state: State = {
        isConnected: false,
        title: "Entities",
        menuVisible: true,
        menuSelected: "profile",
        menuCollapsed: false,
        menuDisabled: false,
        entityId: '',
        processId: '',
        urlHash: '',
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
        await initNetwork().then(async () => {
            message.success("Connected")
            await this.refreshWeb3Status()
        }).catch(err => {
            this.refreshWeb3Status()
            message.error("Could not connect")
        })

        this.refreshInterval = setInterval(() => this.refreshWeb3Status(), 3500)

        window.addEventListener('beforeunload', this.beforeUnload)

        this.hashChange = this.hashChange.bind(this);
        window.addEventListener('hashchange', this.hashChange)
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
        window.removeEventListener('beforeunload', this.beforeUnload)
        window.removeEventListener('hashchange', this.hashChange)
    }

    beforeUnload(e: BeforeUnloadEvent) {
        if (!getNetworkState().readOnly) {
            // Cancel the event
            e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
            // Chrome requires returnValue to be set
            e.returnValue = '';
        }
    }

    hashChange(e: HashChangeEvent) {
        this.setUrlHash(location.hash.substr(2))
    }

    useNewWallet(newWallet: Wallet) {
        getWeb3Wallet().setWallet(newWallet)
        initNetwork().then(async () => {
            message.success("Connected")
            return this.refreshWeb3Status()
        }).then(() => {
            this.setState({})
        }).catch(err => {
            this.refreshWeb3Status()
            message.error("Could not connect")
        })
    }

    setTitle(title: string) {
        this.setState({ title })
    }
    setMenuVisible(menuVisible: boolean) {
        this.setState({ menuVisible })
    }
    setMenuSelected(menuSelected: ISelected) {
        this.setState({ menuSelected })
        this.setMenuVisible(true)
        this.setMenuDisabled(false)
    }
    setMenuCollapsed(menuCollapsed: boolean) {
        this.setState({ menuCollapsed })
    }
    setMenuDisabled(menuDisabled: boolean) {
        this.setState({ menuDisabled })
    }
    setEntityId(entityId: string) {
        this.setState({ entityId })
    }
    setProcessId(processId: string) {
        this.setState({ processId })
    }
    setUrlHash(urlHash: string) {
        this.setState({ urlHash })
    }

    async refreshWeb3Status() {
        const { isConnected } = getNetworkState();
        this.setState({ isConnected })
    }

    onGatewayError(type: "private" | "public") {
        // TODO: reconnect or shift
        new Promise(resolve => setTimeout(resolve, 1000 * 3))
            .then(() => initNetwork()).then(() => {
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
            web3Wallet: getWeb3Wallet(),
            onNewWallet: (wallet: Wallet) => this.useNewWallet(wallet),
            onGatewayError: this.onGatewayError,
            setEntityId: (id) => this.setEntityId(id),
            setProcessId: (id) => this.setProcessId(id),
            menuVisible: this.state.menuVisible,
            menuSelected: this.state.menuSelected,
            menuCollapsed: this.state.menuCollapsed,
            menuDisabled: this.state.menuDisabled,
            entityId: this.state.entityId,
            processId: this.state.processId,
            urlHash: this.state.urlHash,
            setMenuVisible: (visible) => this.setMenuVisible(visible),
            setMenuSelected: (selected) => this.setMenuSelected(selected),
            setMenuCollapsed: (collapsed) => this.setMenuCollapsed(collapsed),
            setMenuDisabled: (disabled) => this.setMenuDisabled(disabled),
            setUrlHash: (hash) => this.setUrlHash(hash),
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
