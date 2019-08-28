import { Component } from "react"
import { headerBackgroundColor } from "../lib/constants"
import { Layout, Row, Col } from 'antd'
const { Header } = Layout
import { getState } from "../util/dvote"
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
import QRCode from "qrcode.react"
import { by639_1 } from 'iso-language-codes'

const { getEntityId } = API.Entity
const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

interface Props {
    refresh?: () => void
}
interface State {
    accountAddress: string,
    entityMetadata: EntityMetadata,
    bootnodes: GatewayBootNodes
}

export default class PageHome extends Component<Props, State> {

    state = {
        accountAddress: "",
        entityMetadata: null,
        bootnodes: {} as GatewayBootNodes
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
        const prevAddress = this.state.accountAddress
        const prevEntityMetadata = this.state.entityMetadata

        // Changes? => sync
        const { address, entityMetadata, bootnodes } = getState();
        if (prevAddress != address || prevEntityMetadata != entityMetadata) {
            this.setState({
                accountAddress: address,
                entityMetadata,
                bootnodes
            })
        }
    }

    renderNoEntity() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <h2></h2>
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 30 }}>
                    <h2>No entity</h2>
                    <p>There is no entity registered with your account yet</p>
                </div>
            </div>
        </>
    }

    render() {
        const entity: EntityMetadata = this.state.entityMetadata
        if (!entity) return this.renderNoEntity()

        const entityId = getEntityId(this.state.accountAddress)
        let subscriptionLink = `vocdoni://vocdoni.app/entity?entityId=${entityId}&`
        subscriptionLink += this.state.bootnodes[ETH_NETWORK_ID].web3.map(n => `entryPoints[]=${n.uri}`).join("&")

        let supportedLanguages = (entity.languages || [] as any)
        console.log(supportedLanguages)
        // 

        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <h2>{entity.name[entity.languages[0]]}</h2>
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 30 }}>
                    <Row>
                        <Col xs={24} md={15}>
                            <h2>Entity overview</h2>
                            <p>Entity ID: {entityId}</p>

                            <p>Supported languages: {(entity.languages || [] as any).map(
                                (lang) => {

                                    let code = by639_1[lang]
                                    return code ? code.name : lang
                                }
                            ).join(", ")}</p>


                            <p>Description</p>
                            <ul>
                                {
                                    entity.languages.map(lang => <li key={lang}>
                                        {lang}: {entity.description[lang]}
                                    </li>)
                                }
                            </ul>
                        </Col>
                        <Col xs={24} md={9}>
                            <h2>Subscription</h2>
                            <p><a href={subscriptionLink}>Subscription link</a></p>
                            <p>
                                <QRCode value={subscriptionLink} size={256} />
                            </p>
                        </Col>
                    </Row>

                </div>
            </div>
        </>
    }
}