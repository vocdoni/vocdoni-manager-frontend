import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin } from 'antd'
import { Divider, Menu, Row, Col } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata } from "dvote-js"
const { Entity } = API
import QRCode from "qrcode.react"
// import Router from 'next/router'
import Link from "next/link"
import { getEntityId } from 'dvote-js/dist/api/entity'
import SideMenu from '../../components/side-menu'
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

// MAIN COMPONENT
const EntityViewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <EntityView {...context} />
}

type State = {
  entityLoading?: boolean,
  entity?: EntityMetadata,
  entityId?: string
}

// Stateful component
class EntityView extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    // this.props.setTitle("Loading")

    try {
      const entityId = location.hash.substr(2)
      this.setState({ entityLoading: true, entityId })

      const gateway = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, gateway)
      if (!entity) throw new Error()

      this.setState({ entity, entityId, entityLoading: false })
      this.props.setTitle(entity.name["default"])
    }
    catch (err) {
      this.setState({ entityLoading: false })
      message.error("Could not read the entity metadata")
    }
  }

  renderEntityInfo() {
    const entityId = location.hash.substr(2)
    let subscriptionLink = `vocdoni://vocdoni.app/entity?entityId=${entityId}&`
    const { bootnodesReadOnly } = getNetworkState()
    if (Object.keys(bootnodesReadOnly).length >= 1) {
      subscriptionLink += bootnodesReadOnly[ETH_NETWORK_ID].web3.map(n => `entryPoints[]=${n.uri}`).join("&")
    }

    const name = this.state.entity.name["default"] || this.state.entity.name[this.state.entity.languages[0]]
    const activeProcs = this.state.entity.votingProcesses.active && this.state.entity.votingProcesses.active.length || 0
    const endedProcs = this.state.entity.votingProcesses.ended && this.state.entity.votingProcesses.ended.length || 0

    return <div className="body-card">
      <Row justify="space-between">
        <Col xs={24} sm={15}>
          <Divider orientation="left">Details</Divider>
          <img src={this.state.entity.media.avatar} className="avatar" />
          <h3>{this.state.entity.name["default"]}</h3>
          <p>{this.state.entity.description["default"]}</p>
          <br />
          <Divider orientation="left">Participation</Divider>
          <p>{`${name} has ${activeProcs} active processes`}</p>
          <p>{`${name} has ${endedProcs} processes that already ended`}</p>
        </Col>
        <Col xs={24} sm={8}>
          <Divider orientation="left">Subscription code</Divider>
          <QRCode value={subscriptionLink} size={256} />
          <br />
          <br />
          <Divider orientation="left">Subscription link</Divider>
          <a href={subscriptionLink}>{"Subscribe to " + name}</a>
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
      <SideMenu entityId={this.state.entityId} selected="profile" />
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
