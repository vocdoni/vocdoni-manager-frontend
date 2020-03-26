import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../components/app-context'
import Link from "next/link"
import { API, EntityMetadata } from "dvote-js"
import { getGatewayClients, getNetworkState } from '../lib/network'
import { message, Button, Spin, Divider } from 'antd'
import Web3Wallet from '../lib/web3-wallet'
import { getEntityId } from 'dvote-js/dist/api/entity'
const { Entity } = API
// import MainLayout from "../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const IndexPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <IndexView {...context} />
}

type State = {
  entityLoading?: boolean,
  entity?: EntityMetadata,
  entityId?: string,
}

// Stateful component
class IndexView extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    this.props.setTitle("Entities")

    try {
      let userAddr = null
      if (Web3Wallet.isEthereumAvailable() && Web3Wallet.isWeb3Available()) {
        this.setState({ entityLoading: true })
        userAddr = await Web3Wallet.getAddress()

        const entityId = getEntityId(userAddr)
        const { web3Gateway, dvoteGateway } = await getGatewayClients()
        const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)

        this.setState({ entity, entityId, entityLoading: false })
      }
    }
    catch (err) {
      console.log(err)
      this.setState({ entityLoading: false })
      message.error("Could not connect to the network")
    }
  }

  renderEntityInfo() {
    return <>
      <Divider />
      <h4>{this.state.entity.name["default"]}</h4>
      <p>{this.state.entity.description["default"]}</p>
      <p><Link href={`/entities/edit/#/${this.state.entityId}`}><a><Button>Manage my entity</Button></a></Link></p>
    </>
  }

  renderGetStarated() {
    if (getNetworkState().readOnly) {
      return <>
        <p>To create an entity, install Metamask on your browser and try again.</p>
        <p><a href="https://metamask.io" target="_blank"><Button>Install Metamask</Button></a></p>
      </>
    }

    return <>
      <p>You haven't created an entity yet</p>
      <p><Link href="/entities/new"><a><Button>Create an entity</Button></a></Link></p>
    </>
  }

  renderLoading() {
    return <div>Please, wait... <Spin size="small" /></div>
  }

  render() {
    return <div id="index">
      <div className="card">
        <h3>Welcome to Vocdoni</h3>

        {
          this.state.entityLoading ? this.renderLoading() :
            (this.state.entity ? this.renderEntityInfo() : this.renderGetStarated())
        }

        {/* <p><Link href="/entities/#/0x1234-entity-id"><a>Entity view (info, processes and news)</a></Link></p>
        <p><Link href="/entities/edit/#/0x1234-entity-id"><a>Entity edit</a></Link></p>
        <p><Link href="/entities/new"><a>Entity create</a></Link></p>
        <p><Link href="/processes/#/0x2345-entity-id"><a>Process view</a></Link></p>
        <p><Link href="/processes/new/#/0x1234-entity-id"><a>Process create</a></Link></p>
        <p><Link href="/processes/edit/#/0x2345-entity-id"><a>Process edit</a></Link></p>
        <p><Link href="/posts/#/0x12345-entity-id/<idx>"><a>News post view</a></Link></p>
        <p><Link href="/posts/edit/#/0x12345-entity-id/<idx>"><a>News post edit</a></Link></p>
        <p><Link href="/posts/new/#/0x12345-entity-id/<idx>"><a>News post create</a></Link></p> */}
      </div>
    </div>
  }
}

// // Custom layout example
// IndexPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default IndexPage
