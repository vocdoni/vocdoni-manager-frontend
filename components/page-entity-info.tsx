import { Component } from "react"
import { getState } from "../util/dvote"
import CreateEntity from "./fragment-create-entity"
import { Row, Col, Divider } from "antd"
import { EntityMetadata } from "dvote-js"

import { headerBackgroundColor } from "../lib/constants"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    refresh?: () => void
}
interface State {
    accountAddress: string,
    entityInfo: EntityMetadata
}

export default class PageEntityInfo extends Component<Props, State> {

    state = {
        accountAddress: "",
        entityInfo: null,
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
        const prevEntityInfo = this.state.entityInfo

        // Changes? => sync
        const { address, entityInfo } = getState();
        if (prevAddress != address || prevEntityInfo != entityInfo) {
            this.setState({
                accountAddress: address,
                entityInfo
            })
        }
    }

    renderMainContent() {
        // NO ENTITY => CREATE
        if (this.state.accountAddress && (!this.state.entityInfo || !this.state.entityInfo.exists)) {
            return <div style={{ padding: 30 }}>
                <CreateEntity
                    defaultCensusRequestUrl={process.env.CENSUS_REQUEST_URL}
                    currentAddress={this.state.accountAddress}
                />
            </div>
        }

        // ENTITY => SHOW
        return <div style={{ padding: 30 }}>
            <h2>Entity</h2>
            <Row>
                <Col span={12}>
                    <h4>Name</h4>
                    <p>{this.state.entityInfo.name}</p>
                    <h4>Created</h4>
                    <p>{this.state.entityInfo.exists ? "Yes" : "No"}</p>
                </Col>
                <Col span={12}>
                    <h4>(Census req)</h4>
                    <p>{this.state.entityInfo.censusRequestUrl}</p>
                    <h4>Address</h4>
                    <p>{this.state.entityInfo.address}</p>
                </Col>
            </Row>

            <Divider />
            <pre>{JSON.stringify(this.state.entityInfo, null, 2)}</pre>
            <div>{this.state.accountAddress}</div>
        </div>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderMainContent()}
            </div>
        </>
    }
}
