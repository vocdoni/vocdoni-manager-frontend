import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { Form, Input, Button, message } from 'antd'
import { connectClients, getGatewayClients, getNetworkState } from '../../lib/network'
import { getEntityId } from 'dvote-js/dist/api/entity'
import Router from 'next/router'


// MAIN COMPONENT
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
    Router.push("/entities/edit#/" + entityId)
  }

  render() {
    const layout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 16 },
    }
    const tailLayout = {
      wrapperCol: { offset: 6, span: 10 },
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
            <Button type="primary" htmlType="submit">Login</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  }
}

export default AccountImportPage
