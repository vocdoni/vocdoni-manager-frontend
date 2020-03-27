import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Col, Row } from 'antd'
import { Divider, Menu } from 'antd'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, MultiLanguage, ProcessMetadata } from "dvote-js"
const { Entity } = API
import Router from 'next/router'
import Link from "next/link"
import { getEntityId, updateEntity } from 'dvote-js/dist/api/entity'
import { getVoteMetadata } from "dvote-js/dist/api/vote"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

// MAIN COMPONENT
const ProcessActiveViewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <ProcessActiveView {...context} />
}

type State = {
  dataLoading?: boolean,
  entity?: EntityMetadata,
  entityId?: string,
  processId?: string,
  process?: ProcessMetadata,
  startIndex: number
}

// Stateful component
class ProcessActiveView extends Component<IAppContext, State> {
  state: State = {
    startIndex: 0,
  }

  async componentDidMount() {
    try {
      const params = location.hash.substr(2).split("/")
      if (params.length != 2) {
        message.error("The requested data is not valid")
        Router.replace("/")
        return
      }

      await this.refreshMetadata()
    }
    catch (err) {
    }
  }

  async refreshMetadata() {
    try {
      const params = location.hash.substr(2).split("/")
      if (params.length != 2) {
        message.error("The requested data is not valid")
        Router.replace("/")
        return
      }

      const entityId = params[0]
      const processId = params[1]

      this.setState({ dataLoading: true, entityId, processId })

      const { web3Gateway, dvoteGateway } = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
      if (!entity) throw new Error()

      const voteMetadata = await getVoteMetadata(processId, web3Gateway, dvoteGateway)

      this.setState({ entity, process: voteMetadata, dataLoading: false })
      this.props.setTitle(entity.name["default"])
    }
    catch (err) {
      this.setState({ dataLoading: false })

      if (err && err.message == "Request timed out")
        message.error("The list of voting processes took too long to load")
      else
        message.error("The vote could not be loaded")
    }
  }

  renderProcessesInfo() {
    const params = location.hash.substr(2).split("/")
    if (params.length != 2) {
      message.error("The requested data is not valid")
      Router.replace("/")
      return
    }

    const entityId = params[0]
    const processId = params[1]
    const { process } = this.state

    return <div className="body-card">
      <Row justify="space-between">
        <Col xs={24} sm={15}>
          <Divider orientation="left">Vote details</Divider>
          <h3>{process.details.title.default}</h3>
          <p>{process.details.description.default}</p>

          {
            process.details.questions.map((question, idx) => <div key={idx}>
              <br />
              <Divider orientation="left">Question {idx + 1}</Divider>
              <h4>{question.question.default}</h4>
              <p>{question.description.default}</p>
              <ul>
                {question.voteOptions.map((option, i) => <li key={i}>
                  {option.title.default}
                </li>)}
              </ul>
            </div>)
          }

          <br />

          <Divider orientation="left">General</Divider>
          <h4>Process ID</h4>
          <pre>{processId}</pre>
          <h4>Census Merkle Root</h4>
          <pre>{process.census.merkleRoot}</pre>
          <h4>Census Merkle Tree</h4>
          <pre>{process.census.merkleTree}</pre>
          <br />

          <Divider orientation="left">Time frame</Divider>
          <Row>
            <Col xs={24} sm={12}>
              <h4>Start block number</h4>
              <p>{process.startBlock}</p>
              <h4>Start date (estimated)</h4>
              <p>-</p>
            </Col>
            {/* <Col xs={24} sm={12}>
              <h4>End block</h4>
              <p>{process.startBlock + process.numberOfBlocks}</p>
              <h4>End date (estimated)</h4>
              <p>-</p>
            </Col> */}
          </Row>

        </Col>
        <Col xs={24} sm={8}>
          <Divider orientation="left">Media</Divider>
          <img src={process.details.headerImage} className="header-image" />
        </Col>
      </Row>
    </div >
  }

  renderNotFound() {
    return <div className="not-found">
      <h4>Entity or active processes not found</h4>
      <p>The entity you are looking for cannot be found</p>
    </div>
  }

  renderLoading() {
    return <div>Loading the votes of the entity...  <Spin size="small" /></div>
  }

  renderSideMenu() {
    const params = location.hash.substr(2).split("/")
    const entityId = params[0]

    const { readOnly, address } = getNetworkState()
    const ownEntityId = getEntityId(address)
    const hideEditControls = readOnly || this.state.entityId != ownEntityId

    if (hideEditControls) {
      return <div id="page-menu">
        <Menu mode="inline" defaultSelectedKeys={['processes-details']} style={{ width: 200 }}>
          <Menu.Item key="profile">
            <Link href={"/entities/#/" + entityId}>
              <a>Profile</a>
            </Link>
          </Menu.Item>
          <Menu.Item key="feed">
            <Link href={"/posts/#/" + entityId}>
              <a>News feed</a>
            </Link>
          </Menu.Item>
          <Menu.Item key="processes-active">
            <Link href={"/processes/active/#/" + entityId}>
              <a>Active votes</a>
            </Link>
          </Menu.Item>
          <Menu.Item key="processes-ended">
            <Link href={"/processes/ended/#/" + entityId}>
              <a>Ended votes</a>
            </Link>
          </Menu.Item>
          <Menu.Item key="processes-details">
            <Link href={"/processes/#/" + entityId}>
              <a>Vote details</a>
            </Link>
          </Menu.Item>
        </Menu>
      </div>
    }

    return <div id="page-menu">
      <Menu mode="inline" defaultSelectedKeys={['processes-details']} style={{ width: 200 }}>
        <Menu.Item key="profile">
          <Link href={"/entities/#/" + entityId}>
            <a>Profile</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="edit">
          <Link href={"/entities/edit/#/" + entityId}>
            <a>Edit details</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="feed">
          <Link href={"/posts/#/" + entityId}>
            <a>News feed</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="new-post">
          <Link href={"/posts/new/"}>
            <a>Create post</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="processes-active">
          <Link href={"/processes/active/#/" + entityId}>
            <a>Active votes</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="processes-ended">
          <Link href={"/processes/ended/#/" + entityId}>
            <a>Ended votes</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="processes-details">
          <Link href={"/processes/#/" + entityId}>
            <a>Vote details</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="new-vote">
          <Link href={"/processes/new/"}>
            <a>Create vote</a>
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  }

  render() {
    return <div id="process-view">
      {this.renderSideMenu()}
      {
        this.state.dataLoading ?
          <div id="page-body" className="center">
            {this.renderLoading()}
          </div>
          :
          (this.state.entity && this.state.process) ?
            <div id="page-body">
              {this.renderProcessesInfo()}
            </div>
            : <div id="page-body" className="center">
              {this.renderNotFound()}
            </div>
      }
    </div >
  }
}

// // Using a custom layout
// ProcessActiveViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default ProcessActiveViewPage
