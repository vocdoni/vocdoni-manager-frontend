import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, List } from 'antd'
import { Divider, Typography, Row, Col } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
import { fetchFromBootNode } from "dvote-js/dist/net/gateway-bootnodes"
const { Entity } = API
import QRCode from "qrcode.react"
// import Router from 'next/router'
// import Link from "next/link"
// import { getEntityId } from 'dvote-js/dist/api/entity'
const { Paragraph } = Typography

// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const APP_LINKING_DOMAIN = process.env.APP_LINKING_DOMAIN
const BOOTNODES_URL_READ_ONLY = process.env.BOOTNODES_URL_READ_ONLY

// MAIN COMPONENT
const EntityViewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <EntityView {...context} />
}

type State = {
    entityLoading?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    bootnodesReadOnly?: GatewayBootNodes
}

// Stateful component
class EntityView extends Component<IAppContext, State> {
    state: State = {}

    componentDidMount() {
        // this.props.setTitle("Loading")
        this.props.setMenuSelected("profile")
        this.fetchMetadata()
    }

    async fetchMetadata() {
        try {
            const entityId = location.hash.substr(2)
            this.setState({ entityLoading: true, entityId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            if (!entity) throw new Error()

            const bn = await fetchFromBootNode(BOOTNODES_URL_READ_ONLY)
            if (!bn) throw new Error()

            this.setState({ entity, entityId, entityLoading: false, bootnodesReadOnly: bn })
            this.props.setTitle(entity.name.default)
            this.props.setEntityId(entityId)
        }
        catch (err) {
            this.setState({ entityLoading: false })
            message.error("Could not read the entity metadata")
        }
    }

    shouldComponentUpdate() {
        const entityId = location.hash.substr(2)
        if (entityId !== this.state.entityId) {
            this.fetchMetadata()
        }

        return true
    }

    renderEntityInfo() {
        const entityId = location.hash.substr(2)
        const subscriptionLink = `https://${APP_LINKING_DOMAIN}/entities/${entityId}`
        // if (this.state.bootnodesReadOnly && Object.keys(this.state.bootnodesReadOnly).length >= 1) {
        // 	subscriptionLink += this.state.bootnodesReadOnly[ETH_NETWORK_ID].web3.map(n => `entryPoints[]=${n.uri}`).join("&")
        // }

        const name = this.state.entity.name.default || this.state.entity.name[this.state.entity.languages[0]]
        // const activeProcs = this.state.entity.votingProcesses.active && this.state.entity.votingProcesses.active.length || 0
        // const endedProcs = this.state.entity.votingProcesses.ended && this.state.entity.votingProcesses.ended.length || 0

        return <div className="body-card">
            <Row justify="space-between">
                <Col xs={24} sm={15}>
                    <Divider orientation="center">Details</Divider>
                    <img src={this.state.entity.media.avatar} className="avatar" />
                    <h3>{this.state.entity.name.default}</h3>
                    <p>{this.state.entity.description.default}</p>
                    <br />
                    {/* <Divider orientation="left">Participation</Divider>
                    <p>{`${name} has ${activeProcs} active processes`}</p>
                    <p>{`${name} has ${endedProcs} processes that already ended`}</p>
                </Col>
                <Col xs={24} sm={8}> 
                    <Divider orientation="left">Visit from a smartphone</Divider>*/}
                    <div style={{ textAlign: "center" }} className="canvas-wrapper">
                        <Paragraph><small>Scan the QR code from a mobile device</small></Paragraph>
                        <a href={subscriptionLink} style={{ cursor: "default" }}>
                            <QRCode value={subscriptionLink} size={256} />
                        </a>
                    </div>
                    <Divider orientation="center">Shareable link</Divider>
                    <List style={{ textAlign: "center" }}> 
                    
                        <List.Item ><Paragraph copyable={{ text: subscriptionLink  }}>Copy the link to share the entity</Paragraph></List.Item>
                    </List>
                    

                </Col>
            </Row>
        </div>
    }

    renderNotFound() {
        return <div className="not-found">
            <h4>Entity not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() {
        return <div>Loading the details of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() {
        return <div id="entity-view">
            {
                this.state.entityLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    this.state.entity ?
                        <div id="page-body">
                            {this.renderEntityInfo()}
                        </div>
                        : <div id="page-body" className="center">
                            {this.renderNotFound()}
                        </div>
            }
        </div >
    }
}


// // Using a custom layout
// EntityViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default EntityViewPage
