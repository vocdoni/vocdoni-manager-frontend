import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../components/app-context'
import Link from 'next/link'
import { API, EntityMetadata } from 'dvote-js'
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

    storedWallets?: IWallet[],

    selectedWallet?: string,
    passphrase?: string,
}

// Stateful component
class IndexView extends Component<IAppContext, State> {
    state: State = {}

    async componentDidMount() {
        this.props.setTitle("Vocdoni")
        this.props.setMenuVisible(false)

        try {
            this.redirectToEntityIfAvailable();

            const storedWallets = await this.props.web3Wallet.getStored();
            this.setState({ storedWallets });
            if (storedWallets.length > 0) {
                this.setState({ selectedWallet: storedWallets[0].name });
            }
        }
        catch (err) {
            this.setState({ entityLoading: false })
            if (err && err.message === "The given entity has no metadata defined yet") {
                return // nothing to show
            }
            // console.log(err)
            message.error("Could not connect to the network")
        }
    }

    async redirectToEntityIfAvailable() {
        let userAddr = null
        if (this.props.web3Wallet.hasWallet()) {
            this.setState({ entityLoading: true })
            userAddr = await this.props.web3Wallet.getAddress()

            const entityId = getEntityId(userAddr)
            const gateway = await getGatewayClients()

            let entity: EntityMetadata
            const self = this
            try {
                entity = await API.Entity.getEntityMetadata(entityId, gateway)
                this.setState({ entity, entityId, entityLoading: false })
                Router.push("/entities#/" + entityId);
            } catch (e) {
                Modal.confirm({
                    title: "Entity not found",
                    icon: <ExclamationCircleOutlined />,
                    content: "It looks like your account is not linked to an existing entity. Do you want to create it now?",
                    okText: "Create Entity",
                    okType: "primary",
                    cancelText: "Not now",
                    onOk() {
                        Router.push("/entities/new")
                    },
                    onCancel() {
                        // Router.reload()
                        self.setState({ entityLoading: false })
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

    unlockWallet() {
        return this.props.web3Wallet.load(this.state.selectedWallet, this.state.passphrase)
            .then(() => {
                this.props.onNewWallet(this.props.web3Wallet.getWallet())
                this.setState({ passphrase: "" })
                return this.redirectToEntityIfAvailable()
            })
            .catch(() => message.error("Could not unlock the wallet. Please, check your password."))
    }

    renderEntityInfo() {
        return <>
            <h4>{this.state.entity.name.default}</h4>
            <p>{this.state.entity.description.default}</p>
            <p><Link href={`/entities/edit#/${this.state.entityId}`}><a><Button>Manage my entity</Button></a></Link></p>
        </>
    }

    renderGetStarted() {
        const showStored = (this.state.storedWallets && this.state.storedWallets.length > 0);
        return <>
            {showStored &&
                <>
                    <p>From this page you can create and manage your entity, publish news, manage censuses and create voting processes.</p>
                    <Select onChange={this.onWalletSelectChange} defaultValue={this.state.storedWallets[0].name} style={{ width: '100%', marginBottom: 10 }}>
                        {this.state.storedWallets.map((w) => <Select.Option key={w.name} value={w.name}>{w.name}</Select.Option>)}
                    </Select>

                    <Input.Group compact>
                        <Input onChange={val => this.onPassphraseChange(val.target.value)} onPressEnter={() => this.unlockWallet()} type="password" placeholder="Password" style={{ width: "75%" }} />
                        <Button type='primary' onClick={() => this.unlockWallet() } style={{ width: "25%" }}>Sign in</Button>
                    </Input.Group>

                    <Divider>or</Divider>

                    <div style={{ textAlign: "center" }}>
                        <Link href="/account/import"><Button>Import an Entity</Button></Link>
                    </div>
                    <Divider>or</Divider>
                </>
            }

            <div style={{ textAlign: "center" }}>
                <Link href="/account/new"><Button type="primary">Create an Entity</Button></Link>
            </div>

            {!showStored &&
                <>
                    <Divider>or</Divider>
                    <div style={{ textAlign: "center" }}>
                        <Link href="/account/import"><Button>Import an Entity</Button></Link>
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
                    <Card title="Vocdoni Manager" className="card">
                        {
                            this.state.entityLoading ? this.renderLoading() :
                                (this.state.entity ? this.renderEntityInfo() : this.renderGetStarted())
                        }
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
