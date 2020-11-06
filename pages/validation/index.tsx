import { useContext, Component } from 'react'
import { message, Spin, Divider, Typography, Row, Col } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { API, EntityMetadata, GatewayBootNodes } from 'dvote-js'
import QRCode from 'qrcode.react'
// import Router from 'next/router'
// import Link from 'next/link'

// import MainLayout from '../../components/layout'
import { getGatewayClients } from '../../lib/network'
import AppContext, { IAppContext } from '../../components/app-context'
import Image from '../../components/image'
// import MainLayout from '../../components/layout'
// import { main } from '../i18n'
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const { Entity } = API
// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const APP_LINKING_DOMAIN = process.env.APP_LINKING_DOMAIN

// MAIN COMPONENT
const ValidationViewPage = () => {
    // Get the global context and pass it to our stateful component
    const context: IAppContext = useContext(AppContext)

    return <ValidationView {...context} />
}

type State = {
    entityLoading?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    token?: string,
    bootnodesReadOnly?: GatewayBootNodes
}

// Stateful component
class ValidationView extends Component<IAppContext, State> {
    state: State = {}

    componentDidMount() {
        // this.props.setTitle("Loading")
        this.props.setMenuSelected(null)
        this.fetchMetadata()
    }

    async fetchMetadata() {
        try {
            const params = location.hash.substr(2).split("/")
            if (params.length < 2) throw new Error("Invalid parameters")
            this.setState({ entityLoading: true, entityId: params[0], token: params[1] })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(params[0], gateway)
            if (!entity) throw new Error()

            this.props.setTitle(entity.name.default)
            this.props.setEntityId(params[0])
            this.setState({ entity, entityLoading: false })
        }
        catch (err) {
            this.setState({ entityLoading: false })
            message.error("Could not read the entity metadata")
        }
    }

    // shouldComponentUpdate() {
    //     const entityId = location.hash.substr(2)
    //     if (entityId !== this.state.entityId) {
    //         this.fetchMetadata()
    //         return false
    //     }

    //     return true
    // }

    renderEntityInfo() {
        const params = location.hash.substr(2).split("/")
        const entityId = params[0]
        const authToken = params[1]

        const subscriptionLink = `https://${APP_LINKING_DOMAIN}/validation/${entityId}/${authToken}`
        const name = this.state.entity.name.default || this.state.entity.name[this.state.entity.languages[0]]

        return <div className="body-card">
            <Row justify="space-between">
                <Col xs={24} sm={15}>
                    <Divider orientation="left">{name}</Divider>
                    <p>{this.state.entity.description.default}</p>
                    <br />
                    <Divider orientation="left">Visit from a smartphone</Divider>
                    <p>The link you are following allows you to validate your identity using Vocdoni. This link needs to be visited from the app your smartphone.</p>
                    <p>Use your phone's camera to scan the following QR code and follow the instructions.</p>

                    <div id="qr-code">
                        <a href={subscriptionLink} style={{ cursor: "default" }}>
                            <QRCode value={subscriptionLink} size={256} />
                        </a>
                    </div>
                </Col>
                <Col xs={0} sm={8}>
                    <Divider orientation="left">Details</Divider>
                    <Image src={this.state.entity.media.avatar} className='avatar' />
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
        return <div>Loading...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() {
        return <div id="validation-view">
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
// const CustomLayout = (props: any) => <MainLayout>
//     {props.children}
// </MainLayout>
// ValidationViewPage.Layout = CustomLayout

export default ValidationViewPage
