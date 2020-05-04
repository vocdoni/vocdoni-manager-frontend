import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../components/app-context'
import Link from "next/link"
import { API, EntityMetadata } from "dvote-js"
import { getGatewayClients, getNetworkState } from '../lib/network'
import { message, Button, Spin, Divider, Input, Select, Col, Row, Card, Modal } from 'antd'
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getEntityId } from 'dvote-js/dist/api/entity'
import { IWallet } from '../lib/types'
import Router from 'next/router'

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

  storedWallets?: Array<IWallet>,
  
  selectedWallet?: string,
  passphrase?: string,
}

// Stateful component
class IndexView extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    this.props.setTitle("Vocdoni Entities")
    this.props.setMenuVisible(false)

    try {
      this.redirectToEntityIfAvailable();

      const storedWallets = await this.props.web3Wallet.getStored();
      this.setState({ storedWallets });
      if(storedWallets.length > 0){
        this.setState({ selectedWallet: storedWallets[0].name });
      }
    }
    catch (err) {
      this.setState({ entityLoading: false })
      if (err && err.message == "The given entity has no metadata defined yet") {
        return // nothing to show
      }
      console.log(err)
      message.error("Could not connect to the network")
    }
  }

  redirectToEntityIfAvailable = async () => {
    let userAddr = null
    if (this.props.web3Wallet.isAvailable()) {
      this.setState({ entityLoading: true })
      userAddr = await this.props.web3Wallet.getAddress()
      
      const entityId = getEntityId(userAddr)
      const gateway = await getGatewayClients()

      let entity: EntityMetadata;
      try{
        entity = await API.Entity.getEntityMetadata(entityId, gateway)
        this.setState({ entity, entityId, entityLoading: false })
        Router.push("/entities/edit#/" + entityId);
      } catch (e) {
        Modal.confirm({
          title: "Oops! Entity not found!",
          icon: <ExclamationCircleOutlined />,
          content: "We couldn't find an Entity with the account data. Do you want to continue and create it?",
          okText: "Create a new Entity",
          okType: "default",
          cancelText: "No",
          onOk() {
            Router.push("/entities/new")
          },
          onCancel() {
            Router.reload();
          },
        })
      }
    }
  }

  onWalletSelectChange = (name: string) => {
    this.setState({ selectedWallet: name });
  }

  onPassphraseChange = (passphrase: string) => {
    this.setState({ passphrase });
  }

  unlockWallet = async () => {
    try {
      await this.props.web3Wallet.load(this.state.selectedWallet, this.state.passphrase);
      this.redirectToEntityIfAvailable();
    } catch(e) {
      message.error("Could not unlock the wallet. Please, check your password.");
    }
  }

  renderEntityInfo() {
    return <>
      <h4>{this.state.entity.name["default"]}</h4>
      <p>{this.state.entity.description["default"]}</p>
      <p><Link href={`/entities/edit#/${this.state.entityId}`}><a><Button>Manage my entity</Button></a></Link></p>
    </>
  }

  renderGetStarted() {
    const showStored = (this.state.storedWallets && this.state.storedWallets.length > 0);
    return <>
        {showStored &&
          <>
          <Input.Group compact>
            <Select onChange={this.onWalletSelectChange} defaultValue={this.state.storedWallets[0].name} style={{ width: '20%' }}>
              { this.state.storedWallets.map((w) => <Select.Option key={w.name} value={w.name}>{w.name}</Select.Option>) }
            </Select>
            <Input onChange={val => this.onPassphraseChange(val.target.value)} onPressEnter={this.unlockWallet} style={{ width: '60%' }} type="password" placeholder="passphrase" />
            <Button type='primary' onClick={this.unlockWallet}>Login</Button>
          </Input.Group>
          <br />
          <div style={{textAlign: "center"}}>
            <Link href="/account/import"><Button>Import an account</Button></Link>
          </div>
          <Divider>or</Divider>
          </>
        }

        <div style={{textAlign: "center"}}>
          <Link href="/account/new"><Button type="primary">Sign Up</Button></Link>
        </div>

        {!showStored &&
          <>
          <Divider>or</Divider>
          <div style={{textAlign: "center"}}>
            <Link href="/account/import"><Button>Import an account</Button></Link>
          </div>
          </>
        }
      </>;
  }

  renderLoading() {
    return <div>Please, wait... <Spin indicator={<LoadingOutlined />} /></div>
  }

  render() {
    return <div id="index">
      <Row justify="center" align="middle">
        <Col xs={24} sm={18} md={10}>
          <Card title="Welcome to Vocdoni" className="card">
            {
              this.state.entityLoading ? this.renderLoading() :
                (this.state.entity ? this.renderEntityInfo() : this.renderGetStarted())
            }

            {/* <p><Link href="/entities#/0x1234-entity-id"><a>Entity view (info, processes and news)</a></Link></p>
            <p><Link href="/entities/edit#/0x1234-entity-id"><a>Entity edit</a></Link></p>
            <p><Link href="/entities/new"><a>Entity create</a></Link></p>
            <p><Link href="/processes#/0x2345-entity-id"><a>Process view</a></Link></p>
            <p><Link href="/processes/new#/0x1234-entity-id"><a>Process create</a></Link></p>
            <p><Link href="/processes/edit#/0x2345-entity-id"><a>Process edit</a></Link></p>
            <p><Link href="/posts#/0x12345-entity-id/<idx>"><a>News post view</a></Link></p>
            <p><Link href="/posts/edit#/0x12345-entity-id/<idx>"><a>News post edit</a></Link></p>
            <p><Link href="/posts/new#/0x12345-entity-id/<idx>"><a>News post create</a></Link></p> */}
          </Card>
        </Col>
      </Row>
    </div>
  }
}

// // Custom layout example
// IndexPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default IndexPage
