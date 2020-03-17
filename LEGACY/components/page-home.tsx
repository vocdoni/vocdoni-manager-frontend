import { Component } from "react"
import { headerBackgroundColor } from "../lib/constants"
import { Layout, Row, Col, message, Button } from 'antd'
const { Header } = Layout
import { getState } from "../util/dvote-state"
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
import QRCode from "qrcode.react"
import { by639_1 } from 'iso-language-codes'
import { fetchDefaultBootNode, fetchFromBootNode } from "dvote-js/dist/net/gateway-bootnodes"
const BOOTNODES_URL = process.env.BOOTNODES_URL || ''
import PageEntityMeta from "./page-entity-meta"

const { getEntityId } = API.Entity
const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

interface Props {
    refresh?: () => void
}
interface State {
    accountAddress: string,
    entityMetadata: EntityMetadata,
    bootnodes: GatewayBootNodes
    createEntity: boolean
    error: boolean
    timedOut: boolean
}

export default class PageHome extends Component<Props, State> {

    state = {
        accountAddress: "",
        entityMetadata: null,
        bootnodes: {} as GatewayBootNodes,
        createEntity: false,
        error: false,
        timedOut: false
    }

    refreshInterval: any

    componentDidMount() {
        this.fetchBootnodes()
        this.refreshInterval = setInterval(() => this.refreshState(), 1000)
        this.refreshState()
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    async fetchBootnodes() {
        try {
            const bootnodes = (BOOTNODES_URL) ? await fetchFromBootNode(BOOTNODES_URL) : await fetchDefaultBootNode(process.env.ETH_NETWORK_ID as any)
            this.setState({ bootnodes })
        }
        catch (err) {
            message.error("Connection error")
        }
    }

    async refreshState() {
        const { address, entityMetadata, error, timedOut } = getState();
        this.setState({
            accountAddress: address,
            entityMetadata,
            error,
            timedOut
        })

        // Fetch if needed
        try {
            if (Object.keys(this.state.bootnodes).length == 0) {
                this.fetchBootnodes()
            }
        } catch (err) {
            console.error(err)
        }
    }

    renderNoEntity() {
        if (this.state.error && !this.state.timedOut) {
            // We consider as timeout the failure to discover the IPFS hash
            return <>
                <Header style={{ backgroundColor: headerBackgroundColor }}>
                    <h2></h2>
                </Header>

                <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                    <div style={{ padding: 30 }}>
                        <h2>An error occured</h2>
                        {/* <p>Please refresh the page (Ctrl+Shif+R)</p> */}
                        {/* <Button size='large' type='primary' onClick={() => this.setState({createEntity: true})}>Create entity</Button> */}
                    </div>
                </div>
            </>
        }
        else {
            if (this.state.createEntity) return <PageEntityMeta {...this.props} createEntity={true} />
            return <>
                <Header style={{ backgroundColor: headerBackgroundColor }}>
                    <h2></h2>
                </Header>

                <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                    <div style={{ padding: 30 }}>
                        <h2>No entity</h2>
                        <p>There is no entity registered with your account yet</p>
                        <Button size='large' type='primary' onClick={() => this.setState({ createEntity: true })}>Create entity</Button>
                    </div>
                </div>
            </>
        }
    }

    openInNewTab(url) {
        let win = window.open(url, '_blank');
        win.focus();
    }

    render() {
        const entity: EntityMetadata = this.state.entityMetadata
        if (!entity) return this.renderNoEntity()


        const entityId = getEntityId(this.state.accountAddress)
        let subscriptionLink = `vocdoni://vocdoni.app/entity?entityId=${entityId}&`
        let resultsLink = `https://visualizer.vocdoni.net/?entityId=${entityId}&networkId=${process.env.ETH_NETWORK_ID}`
        if (Object.keys(this.state.bootnodes).length >= 1) {
            subscriptionLink += this.state.bootnodes[ETH_NETWORK_ID].web3.map(n => `entryPoints[]=${n.uri}`).join("&")
        }

        // let supportedLanguages = (entity.languages || [] as any)

        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <h2>Overview</h2>
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 30 }}>
                    <Row>
                        {/* <Col xs={24} md={15}> */}
                        <h2>{entity.name[entity.languages[0]]}</h2>
                        <p>Entity ID</p>
                        <p>{entityId}</p>

                        {/* <p>Supported languages: {(entity.languages || [] as any).map(
                                (lang) => {

                                    let code = by639_1[lang]
                                    return code ? code.name : lang
                                }
                            ).join(", ")}</p> */}
                        {/* <h2>Subscription</h2> */}
                        <p><a onClick={() => this.openInNewTab(subscriptionLink)}>Subscription link</a></p>
                        <p>
                            <QRCode value={subscriptionLink} size={256} />
                        </p>


                        <p>{entity.description['default']}</p>

                        <p><a href={resultsLink}>Vote Results</a></p>
                        {/* <p>Description</p>
                            <ul>
                                {
                                    entity.languages.map(lang => <li key={lang}>
                                        {lang}: {entity.description[lang]}
                                    </li>)
                                }
                            </ul> */}
                        {/* </Col>
                        <Col xs={24} md={9}>
                            <h2>Subscription</h2>
                            <p><a href={subscriptionLink}>Subscription link</a></p>
                            <p>
                                <QRCode value={subscriptionLink} size={256} />
                            </p>
                        </Col> */}
                    </Row>

                </div>
            </div>
        </>
    }
}