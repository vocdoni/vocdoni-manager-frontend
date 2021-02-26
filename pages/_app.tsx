import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import { message, Row, Col, Card, Button } from 'antd'
import { Wallet } from 'ethers'
import {
    CensusOffChainApi,
    DVoteGateway,
    EntityMetadata,
    EntityApi,
} from 'dvote-js'
import { ReloadOutlined } from '@ant-design/icons'
import mixpanel from 'mixpanel-browser'
import Router from 'next/router'


import MainLayout from '../components/layouts/main'
import AppContext, { ISelected } from '../components/app-context'
import GeneralError from '../components/error'
import { initNetwork, getNetworkState, getGatewayClients } from '../lib/network'
import { IAppContext } from '../components/app-context'
import { getWeb3Wallet } from '../lib/web3-wallet'
import { browserProfile, isWriteEnabled } from '../lib/util'
import i18n from '../i18n'

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
    loadingEntityMetadata: boolean,
    // STATE SHARED WITH CHILDREN
    title: string
    menuVisible: boolean
    menuSelected?: ISelected
    menuCollapsed?: boolean
    menuDisabled?: boolean
    entity?: EntityMetadata
    address?: string
    processId?: string
    urlHash?: string
    connectionError?: string
    managerBackendGateway?: DVoteGateway
    currentPage?: string
}

try {
    if (process.env.MIXPANEL_TOKEN) {
        mixpanel.init(process.env.MIXPANEL_TOKEN, {
            'api_host': 'https://api-eu.mixpanel.com',
        }, '')
    }
} catch (e) {}

class MainApp extends App<Props, State> {
    state: State = {
        isConnected: false,
        loadingEntityMetadata: false,
        title: 'Vocdoni',
        menuVisible: true,
        menuSelected: "profile",
        menuCollapsed: false,
        menuDisabled: false,
        address: '',
        processId: '',
        urlHash: '',
    }

    async componentDidMount(): Promise<void> {
        this.track = this.track.bind(this)
        Router.events.on('routeChangeComplete', this.track)
        this.track(location.pathname.replace(/\/$/, ''))

        if (window.location.pathname == "/" && !isWriteEnabled()) {
            window.location.href = process.env.FALLBACK_REDIRECT_URL
        }

        await this.connect()

        const [address] = this.params
        if (address) {
            await this.refreshEntityMetadata(address)
        }

        window.addEventListener('beforeunload', this.beforeUnload)

        this.hashChange = this.hashChange.bind(this)
        window.addEventListener('hashchange', this.hashChange)
    }

    componentWillUnmount(): void {
        window.removeEventListener('beforeunload', this.beforeUnload)
        window.removeEventListener('hashchange', this.hashChange)
        Router.events.off('routeChangeComplete', this.track)
    }

    async track(currentPage: string) : Promise<void> {
        if (
            (process.env.NODE_ENV !== 'production' && !process.env.FORCE_TELEMETRY) ||
            !process.env.MIXPANEL_TOKEN?.length
        ) {
            return
        }

        if (currentPage === this.state.currentPage) {
            return
        }

        this.setState({
            currentPage,
        })

        try {
            const wallet = getWeb3Wallet()
            if (wallet && wallet.getWallet() && wallet.getPublicKey().length) {
                const {uid} = await wallet.getStoredWallet(wallet.getPublicKey())
                mixpanel.identify(uid.toString())
            }
            mixpanel.track('pageView', browserProfile(currentPage))
        } catch (e) {console.error(e)}
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
            message.success(i18n.t('connected'))
            this.setState({ connectionError: null })
            this.refreshWeb3Status()
        }).catch(err => {
            message.error(i18n.t('error.cannot_connect'))
            this.setState({ connectionError: err && err.message || err })
            this.refreshWeb3Status()
        })

        const managerBackendGateway: DVoteGateway = new DVoteGateway({
            uri: process.env.MANAGER_BACKEND_URI,
            supportedApis: ['census'],
            publicKey: process.env.MANAGER_BACKEND_PUB_KEY,
        })
        managerBackendGateway.init()
        this.setState({ managerBackendGateway })
    }

    hashChange() : void {
        this.setUrlHash(location.hash.substr(2))
    }

    useNewWallet(newWallet: Wallet) : void {
        getWeb3Wallet().setWallet(newWallet)
        initNetwork().then(async () => {
            message.success(i18n.t('connected'))
            return this.refreshWeb3Status()
        }).then(() => {
            this.setState({})
        }).catch(err => {
            this.refreshWeb3Status()
            message.error(i18n.t('error.cannot_connect'))
            this.setState({ connectionError: err.message })
        })
    }

    async getEntityMetadata(id: string) : Promise<EntityMetadata> {
        return EntityApi.getMetadata(id, await getGatewayClients())
    }

    get isEntityLoaded () : boolean {
        return this.state.address?.length > 0 && this.state.entity?.name?.default?.length > 0
    }

    get isReadOnlyNetwork() : boolean {
        const { readOnly } = getNetworkState()

        return readOnly
    }

    get isReadOnly() : boolean {
        const readOnly = this.isReadOnlyNetwork
        const address = getWeb3Wallet().getAddress()

        const isReadOnly = readOnly || !address

        if (!isReadOnly) {
            return this.state.address !== address
        }

        return isReadOnly
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
    setAddress(address: string) : void {
        this.setState({ address })
    }
    setProcessId(processId: string) : void {
        this.setState({ processId })
    }
    setUrlHash(urlHash: string) : void {
        this.setState({ urlHash })
    }

    async createCensusForTarget(
        name: string,
        {id, name: targetName}: {id: string, name: string},
        ephemeral: boolean)
        : Promise<{census: string, merkleRoot: string, merkleTreeUri: string}>
    {
        const wallet = getWeb3Wallet().getWallet()

        const censusName = name || targetName + '_' + (Math.floor(Date.now() / 1000))
        const gateway = await getGatewayClients()
        const { censusId } = await CensusOffChainApi.addCensus(censusName, [wallet._signingKey().publicKey], wallet, gateway)

        const addReq = { method: 'addCensus', targetId: id, censusId, census: {name: censusName, ephemeral} }
        // We don't need the response from addCensus (in case of error should be thrown anyways)
        await this.state.managerBackendGateway.sendRequest(addReq as any, wallet)
        const dumpReq = { method: 'dumpCensus', censusId}
        const dumpCensus = await this.state.managerBackendGateway.sendRequest(dumpReq as any, wallet)
        if (!dumpCensus.claims?.length) {
            throw new Error('No claims found to export')
        }
        const claims = dumpCensus.claims.map((claim) => ({key: claim, value: ''}))
        const { censusRoot, invalidClaims } = await CensusOffChainApi.addClaimBulk(censusId, claims, true, wallet, gateway)
        if (invalidClaims.length) {
            message.warn(i18n.t('error.invalid_claims_found', {total: invalidClaims.length}))
        }
        const merkleTreeUri = await CensusOffChainApi.publishCensus(censusId, wallet, gateway)
        const census = {
            merkleRoot: censusRoot,
            merkleTreeUri,
        }
        const updReq = {
            method: 'updateCensus',
            censusId,
            census,
            invalidClaims,
        }
        // No need for the result here either
        await this.state.managerBackendGateway.sendRequest(updReq as any, wallet)

        return {
            ...census,
            census: censusId,
        }
    }

    fetchTargets() : Promise<any> {
        return this.state.managerBackendGateway.sendRequest(
            {method: 'listTargets'} as any,
            getWeb3Wallet().getWallet(),
        )
    }

    fetchCensuses() : Promise<any> {
        return this.state.managerBackendGateway.sendRequest(
            {method: 'listCensus'} as any,
            getWeb3Wallet().getWallet(),
        )
    }

    async refreshEntityMetadata(address?: string, force?: boolean) : Promise<EntityMetadata> {
        if (!address && !this.state.address) {
            address = getWeb3Wallet().getAddress()
        } else if (
            ((!address && this.state.address) ||
            (address && this.state.address && this.state.address === address)) &&
            this.state.entity && !force
        ) {
            // We already have the info stored in state and should not be changed
            return this.state.entity
        }

        console.log('dbg not cached')
        address = address ? address : this.state.address

        this.setState({ loadingEntityMetadata: true })
        let entity : EntityMetadata = null
        try {
            entity = await this.getEntityMetadata(address)
        } catch (err) {
            console.warn('could not get entity metadata', err)
        }
        if (!entity) {
            this.setState({loadingEntityMetadata: false})
            throw new Error('Entity not found')
        }

        this.setState({
            address,
            entity,
            loadingEntityMetadata: false,
            title: entity.name.default,
        })

        return entity
    }

    async refreshWeb3Status() {
        const { isConnected } = getNetworkState()
        this.setState({ isConnected })
    }

    onGatewayError() {
        // TODO: reconnect or shift
        new Promise(resolve => setTimeout(resolve, 1000 * 3))
            .then(() => initNetwork()).then(() => {
                this.refreshWeb3Status()
            }).catch(() => {
                this.refreshWeb3Status()
                message.error(i18n.t('error.cannot_connect'))
            })
    }

    componentDidCatch(error: Error) : React.ReactNode {
        console.error(error)
        return <GeneralError />
    }

    renderPleaseWait() {
        return null // The loading message will appear

        // return <div id="global-loading">
        //     <div><Spin indicator={<LoadingOutlined />} /> &nbsp;Please, wait... </div>
        // </div>
    }

    get params() : string[] {
        return window.location.hash.substr(2).split('/')
    }

    renderRetry() {
        return <div id="index">
            <Row justify="center" align="middle">
                <Col xs={24} sm={18} md={10}>
                    <Card title="Connection Error" className="card">
                        <p>{i18n.t('error.connection')}</p>
                        <div style={{ textAlign: "center" }}>
                            <Button
                                type="primary"
                                onClick={() => this.setState({ connectionError: false }, () => this.connect())}
                            >
                                <ReloadOutlined /> {i18n.t('btn.retry')}
                            </Button>
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
            gatewayClients: getGatewayClients(),
            getEntityMetadata: this.getEntityMetadata.bind(this),
            isEntityLoaded: this.isEntityLoaded,
            isWriteEnabled: isWriteEnabled(),
            isReadOnly: this.isReadOnly,
            isReadOnlyNetwork: this.isReadOnlyNetwork,
            loadingEntityMetadata: this.state.loadingEntityMetadata,
            title: this.state.title,
            setTitle: (title) => this.setTitle(title),
            web3Wallet: getWeb3Wallet(),
            onNewWallet: (wallet: Wallet) => this.useNewWallet(wallet),
            onGatewayError: this.onGatewayError,
            setAddress: (id) => this.setAddress(id),
            setProcessId: (id) => this.setProcessId(id),
            menuVisible: this.state.menuVisible,
            menuSelected: this.state.menuSelected,
            menuCollapsed: this.state.menuCollapsed,
            menuDisabled: this.state.menuDisabled,
            entity: this.state.entity,
            address: this.state.address,
            processId: this.state.processId,
            urlHash: this.state.urlHash,
            refreshEntityMetadata: this.refreshEntityMetadata.bind(this),
            setMenuVisible: (visible) => this.setMenuVisible(visible),
            setMenuSelected: (selected) => this.setMenuSelected(selected),
            setMenuCollapsed: (collapsed) => this.setMenuCollapsed(collapsed),
            setMenuDisabled: (disabled) => this.setMenuDisabled(disabled),
            setUrlHash: (hash) => this.setUrlHash(hash),
            params: this.params,
            managerBackendGateway: this.state.managerBackendGateway,
            createCensusForTarget: (name, target, ephemeral) => this.createCensusForTarget(name, target, ephemeral),
            fetchTargets: () => this.fetchTargets(),
            fetchCensuses: () => this.fetchCensuses(),
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
            <div id='app-commit-sha' style={{display: 'none'}}>
                {process.env.COMMIT_SHA}
            </div>
        </AppContext.Provider>
    }
}

export default MainApp
