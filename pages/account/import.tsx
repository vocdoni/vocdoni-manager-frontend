import { useContext, Component } from 'react'
import Router from 'next/router'
import AppContext, { IAppContext } from '../../components/app-context'
import { Form, Input, Button, message, Modal, Row, Col, Card } from 'antd'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
import { getEntityId } from 'dvote-js/dist/api/entity'
import { ExclamationCircleOutlined } from '@ant-design/icons'


const AccountImportPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <AccountImport {...context} />
}

class AccountImport extends Component<IAppContext> {
    async componentDidMount() {
        this.props.setTitle("Vocdoni")
        this.props.setMenuVisible(false)
    }

    async onFinish(values) {
        try {
            await this.props.web3Wallet.store(values.name, values.seed, values.passphrase)
            await this.props.web3Wallet.load(values.name, values.passphrase)
            this.props.onNewWallet(this.props.web3Wallet.getWallet())
        } catch (e) {
            message.error('An error ocurred trying import the account. Please, try it again', 3)
            return false
        }

        const address = this.props.web3Wallet.getAddress()
        const entityId = getEntityId(address)

        const gateway = await getGatewayClients()
        let entity: EntityMetadata
        const self = this
        try {
            entity = await API.Entity.getEntityMetadata(entityId, gateway)
            Router.push("/entities/edit#/" + entityId)
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

    render() {
        const layout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 },
        }
        const tailLayout = {
            wrapperCol: { offset: 8, span: 10 },
        }

        return <div id="index">
            <Row justify="center" align="middle">
                <Col xs={24} sm={18} md={10}>
                    <Card title="Import and unlock an account" className="card">
                        <Form {...layout} onFinish={values => this.onFinish(values)}>
                            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input an account name!' }]}>
                                <Input />
                            </Form.Item>

                            <Form.Item label="Account seed" name="seed" rules={[{ required: true, message: 'Please input a seed!' }]}>
                                <Input.Password />
                            </Form.Item>

                            <Form.Item label="Passphrase" name="passphrase" rules={[{ required: true, message: 'Please input a Passphrase!' }]}>
                                <Input.Password />
                            </Form.Item>

                            <Form.Item {...tailLayout}>
                                <Button type="primary" htmlType="submit">Import and log in</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    }
}

export default AccountImportPage
