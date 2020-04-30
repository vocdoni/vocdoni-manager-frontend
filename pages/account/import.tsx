import { useContext, Component } from 'react'
import Router from 'next/router'
import AppContext, { IAppContext } from '../../components/app-context'
import { Form, Input, Button, message, Modal } from 'antd'
import { connectClients, getGatewayClients, getNetworkState } from '../../lib/network'
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
    this.props.setTitle("Vocdoni Entities")
  }

  onFinish = async (values) => {
    try {
      await this.props.web3Wallet.store(values.name, values.seed, values.passphrase)
      await this.props.web3Wallet.load(values.name, values.passphrase)
    } catch (e) {
      message.error('An error ocurred trying import the account. Please, try it again', 3)
      return false
    }

    const address = this.props.web3Wallet.getAddress()
    const entityId = getEntityId(address)

    const { web3Gateway, dvoteGateway } = await getGatewayClients()
    let entity: EntityMetadata;
    try{
      entity = await API.Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
      Router.push("/entities/edit#/" + entityId)
    } catch (e) {
      Modal.confirm({
        title: "Oops! Entity not found!",
        icon: <ExclamationCircleOutlined />,
        content: "We couldn't find an Entity with the imported account data. Do you want to continue and create it?",
        okText: "Create a new Entity",
        okType: "default",
        cancelText: "No",
        onOk() {
          Router.push("/entities/new")
        },
      });
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
      <div className="card">
        <h3>Import and unlock an account</h3>

        <Form {...layout} onFinish={this.onFinish}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input an account name!' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Seed" name="seed" rules={[{ required: true, message: 'Please input a seed!' }]}>
            <Input.Password />
          </Form.Item>

          <Form.Item label="Passphrase" name="passphrase" rules={[{ required: true, message: 'Please input a Passphrase!' }]}>
            <Input.Password />
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit">Import and login</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  }
}

export default AccountImportPage
