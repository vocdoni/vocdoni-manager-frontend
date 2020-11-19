import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import { message, Row, Col, Card, Button } from 'antd'
import { Wallet } from 'ethers'
import { DVoteGateway } from 'dvote-js/dist/net/gateway'
import { ReloadOutlined } from '@ant-design/icons'
import { addCensus, addClaimBulk, publishCensus } from 'dvote-js/dist/api/census'

import AppContext, { ISelected } from '../components/app-context'
import MainLayout from '../components/layout'
import GeneralError from '../components/error'
import { initNetwork, getNetworkState, getGatewayClients } from '../lib/network'
import { IAppContext } from '../components/app-context'
import { getWeb3Wallet } from '../lib/web3-wallet'
import { isWriteEnabled } from '../lib/util'

// import { } from '../lib/types'
// import { isServer } from '../lib/util'

import 'antd/dist/antd.css'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import '../styles/index.css'
// import IndexPage from '.'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

type Props = {
    managerBackendGateway: DVoteGateway
}

type State = {
    isConnected: boolean

    // STATE SHARED WITH CHILDREN
    title: string
    menuVisible: boolean
    menuSelected?: ISelected
    menuCollapsed?: boolean
    menuDisabled?: boolean
    entityId?: string
    processId?: string
    urlHash?: string
    connectionError?: string
    managerBackendGateway?: DVoteGateway
}

class MainApp extends App<Props, State> {
    state: State = {
        isConnected: false,
        title: " ",
        menuVisible: true,
        menuSelected: "profile",
        menuCollapsed: false,
        menuDisabled: false,
        entityId: '',
        processId: '',
        urlHash: '',
    }

    componentDidMount(): void {
        if (window.location.pathname == "/" && !isWriteEnabled()) {
            if (!process.env.BOOTNODES_URL_RW) window.location.href = process.env.FALLBACK_REDIRECT_URL
        }

        this.connect()

        window.addEventListener('beforeunload', this.beforeUnload)

        this.hashChange = this.hashChange.bind(this)
        window.addEventListener('hashchange', this.hashChange)
    }

    componentWillUnmount(): void {
        window.removeEventListener('beforeunload', this.beforeUnload)
        window.removeEventListener('hashchange', this.hashChange)
    }

    beforeUnload(e: BeforeUnloadEvent): void {
        if (!getNetworkState().readOnly) {
            // Cancel the event
            e.preventDefault() // If you prevent default behavior in Mozilla Firefox prompt will always be shown
            // Chrome requires returnValue to be set
            e.returnValue = ''
        }
    }

    async connect(): Promise<void> {
        await initNetwork().then(async () => {
            message.success("Connected")
            this.setState({ connectionError: null })
            this.refreshWeb3Status()
        }).catch(err => {
            message.error("Could not connect")
            this.setState({ connectionError: err && err.message || err })
            this.refreshWeb3Status()
        })

        const managerBackendGateway: DVoteGateway = new DVoteGateway({
            uri: process.env.MANAGER_BACKEND_URI,
            supportedApis: ['census'],
            publicKey: process.env.MANAGER_BACKEND_PUB_KEY,
        })
        this.setState({ managerBackendGateway })
    }

    hashChange() : void {
        this.setUrlHash(location.hash.substr(2))
    }

    useNewWallet(newWallet: Wallet) : void {
        getWeb3Wallet().setWallet(newWallet)
        initNetwork().then(async () => {
            message.success("Connected")
            return this.refreshWeb3Status()
        }).then(() => {
            this.setState({})
        }).catch(err => {
            this.refreshWeb3Status()
            message.error("Could not connect")
            this.setState({ connectionError: err.message })
        })
    }

    setTitle(title: string) : void {
        this.setState({ title })
    }
    setMenuVisible(menuVisible: boolean) : void {
        this.setState({ menuVisible })
    }
    setMenuSelected(menuSelected: ISelected) : void {
        this.setState({ menuSelected })
        this.setMenuVisible(true)
        this.setMenuDisabled(false)
    }
    setMenuCollapsed(menuCollapsed: boolean) : void {
        this.setState({ menuCollapsed })
    }
    setMenuDisabled(menuDisabled: boolean) : void {
        this.setState({ menuDisabled })
    }
    setEntityId(entityId: string) : void {
        this.setState({ entityId })
    }
    setProcessId(processId: string) : void {
        this.setState({ processId })
    }
    setUrlHash(urlHash: string) : void {
        this.setState({ urlHash })
    }

    async createCensusForTarget(
        name: string,
        {id, name: targetName}: {id: string, name: string})
        : Promise<{census: string, merkleRoot: string, merkleTreeUri: string}>
    {
        const wallet = getWeb3Wallet().getWallet()

        const censusName = name || targetName + '_' + (Math.floor(Date.now() / 1000))
        const gateway = await getGatewayClients()
        const { censusId } = await addCensus(censusName, [wallet['signingKey'].publicKey], gateway, wallet)

        const addReq = { method: 'addCensus', targetId: id, censusId, census: {name: censusName} }
        // We don't need the response from addCensus (in case of error should be thrown anyways)
        await this.state.managerBackendGateway.sendMessage(addReq as any, wallet)
        const dumpReq = { method: 'dumpCensus', censusId}
        const dumpCensus = await this.state.managerBackendGateway.sendMessage(dumpReq as any, wallet)
        if (!dumpCensus.claims?.length) {
            throw new Error('No claims found to export')
        }

        const { merkleRoot, invalidClaims } = await addClaimBulk(censusId, dumpCensus.claims, true, gateway, wallet)
        if (invalidClaims.length) {
            message.warn(`Found ${invalidClaims.length} invalid claims`)
        }
        const merkleTreeUri = await publishCensus(censusId, gateway, wallet)
        const census = {
            merkleRoot,
            merkleTreeUri,
        }
        const updReq = {
            method: 'updateCensus',
            censusId,
            census,
            invalidClaims,
        }
        // No need for the result here either
        await this.state.managerBackendGateway.sendMessage(updReq as any, wallet)

        return {
            census: censusId,
            merkleRoot,
            merkleTreeUri,
        }
    }

    fetchTargets() {
        return this.state.managerBackendGateway.sendMessage(
            {method: 'listTargets'} as any,
            getWeb3Wallet().getWallet(),
        )
    }

    async refreshWeb3Status() {
        const { isConnected } = getNetworkState()
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
            })
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

    renderRetry() {
        return <div id="index">
            <Row justify="center" align="middle">
                <Col xs={24} sm={18} md={10}>
                    <Card title="Connection Error" className="card">
                        <p>Oops! There has been a problem while connecting to our services.</p>
                        <div style={{ textAlign: "center" }}>
                            <Button type="primary" onClick={() => this.setState({ connectionError: false }, () => this.connect())}><ReloadOutlined />Retry</Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    }

    render() {
        if (!this.state.isConnected) {
            if (this.state.connectionError) {
                return this.renderRetry()
            }

            return this.renderPleaseWait()
        }

        // Main render

        // Get data from getInitialProps and provide it as the global context to children
        const { Component, pageProps } = this.props

        const injectedGlobalContext: IAppContext = {
            isWriteEnabled: isWriteEnabled(),
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
            managerBackendGateway: this.state.managerBackendGateway,
            createCensusForTarget: (name, target) => this.createCensusForTarget(name, target),
            fetchTargets: () => this.fetchTargets(),
        }

        // Does the current component want its own layout?
        const Layout = (Component as any).Layout || MainLayout
        return <AppContext.Provider value={injectedGlobalContext}>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{this.state.title}</title>
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AppContext.Provider>
    }
}

export default MainApp
