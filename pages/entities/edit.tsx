import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Divider, Menu, Row, Col } from 'antd'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
import MainLayout from "../../components/layout"
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const EntityEditPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <EntityEdit {...context} />
}

type State = {
  entityLoading?: boolean,
  entity?: EntityMetadata,
  entityId?: string,
  bootnodes?: GatewayBootNodes
}

// Stateful component
class EntityEdit extends Component<IAppContext, State> {
  state: State = {}

  refreshInterval: any

  async componentDidMount() {
    // if readonly, show the view page
    if (getNetworkState().readOnly) {
      return Router.replace("/entities/" + location.hash)
    }
    // this.props.setTitle("Loading")

    this.refreshInterval = setInterval(() => this.refreshMetadata(), 1000 * 30)

    try {
      await this.refreshMetadata()
    }
    catch (err) {
      message.error("Could not read the entity metadata")
    }
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval)
  }

  async refreshMetadata() {
    try {
      const entityId = location.hash.substr(2)
      this.setState({ entityLoading: true, entityId })

      const { web3Gateway, dvoteGateway } = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
      if (!entity) throw new Error()

      this.setState({ entity, entityId, entityLoading: false })
      this.props.setTitle(entity.name["default"])
    }
    catch (err) {
      this.setState({ entityLoading: false })
      throw err
    }
  }

  renderEntityInfo() {
    return <>
      <img src={this.state.entity.media.avatar} className="avatar" />
      <h4>{this.state.entity.name["default"]}</h4>
      <p>{this.state.entity.description["default"]}</p>
      <pre>{JSON.stringify(this.state.entity, null, 2)}</pre>
      {/* <p><Link href={`/entities/edit/#/${this.state.entityId}`}><a><Button>Manage my entity</Button></a></Link></p> */}
    </>
  }

  renderNotFound() {
    return <>
      <h4>Entity not found</h4>
      <p>The entity you are looking for cannot be found</p>
    </>
  }

  renderLoading() {
    return <div>Please, wait... <Spin size="small" /></div>
  }

  render() {
    return <div id="entity-edit">
      {
        this.state.entityLoading ? this.renderLoading() :
          this.state.entity ? this.renderEntityInfo() : this.renderNotFound()
      }
    </div>
  }
}


// Custom layout
EntityEditPage.Layout = props => <MainLayout>

  <div>
    {props.children}
  </div>
</MainLayout>

export default EntityEditPage
