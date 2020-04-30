import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { Form, Input, Button, message, Menu, Row, Col, Spin } from 'antd'
import Router from 'next/router'
import Link from 'next/link'
import { EtherUtils } from 'dvote-js'
import { LoadingOutlined } from '@ant-design/icons'


// MAIN COMPONENT
const AccountNewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <AccountNew {...context} />
}

type State = {
  creatingAccount?: boolean,
  accountConfirmedBackup?: boolean,
  accountWaitingForGas?: boolean,
  name?: string,
  passphrase?: string,
  seed?: string,
  address?: string,
}

class AccountNew extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    this.props.setTitle("New account")
  }

  createWebWallet = async (name: string, passphrase: string) => {
    const seed = EtherUtils.Signers.generateRandomHexSeed()
    await this.props.web3Wallet.store(name, seed, passphrase)
    await this.props.web3Wallet.load(name, passphrase)
    
    this.setState({ seed, address: this.props.web3Wallet.getAddress() })
  }

  onFinish = async (values) => {
    this.setState({ creatingAccount: true, name: values.name, passphrase: values.passphrase })

    const key = 'creatingWallet'
    try {
      message.loading({ content: 'Creating account, Please wait...', duration: 0, key })
      await this.createWebWallet(values.name, values.passphrase)
      message.success({ content: 'Done creating account!', key })
      this.setState({ creatingAccount: false })
    } catch (e) {
      console.log(e.message)
      message.error({ content: 'An error ocurred trying to create the account. Please, try it again', key })
      this.setState({ creatingAccount: false })
      return false
    }
  }

  onConfirmBackup = async () => {
    this.setState({ accountConfirmedBackup: true, accountWaitingForGas: true })
    try{ 
      await this.props.web3Wallet.waitForGas()
    } catch (e) {
      message.error({ content: 'Timeout waiting for user to get gas. Please, try it again' })
      this.setState({ creatingAccount: false })
      return false
    }
    this.setState({ accountWaitingForGas: false })
    Router.push("/entities/new")
  }

  renderSideMenu() {
      return <div id="page-menu">
        <Menu mode="inline" defaultSelectedKeys={['new']} style={{ width: 200 }}>
          <Menu.Item key="new">
            <Link href={"/account/new"}><a>Account details</a></Link>
          </Menu.Item>
        </Menu>
      </div>
  }

  render() {
    const layout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 18 },
    }
    const tailLayout = {
      wrapperCol: { offset: 8, span: 10 },
    }

    return <div id="entity-new">
      {this.renderSideMenu()}
      <div id="page-body">
        <div className="body-card">
          <Row>
            <Col xs={24} sm={20} md={14}>

              { !this.state.address && !this.state.accountConfirmedBackup && !this.state.accountWaitingForGas && 
                <Form {...layout} onFinish={this.onFinish}>
                  <h3>Create an account</h3>
                  <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input an account name!' }]}>
                    <Input />
                  </Form.Item>

                  <Form.Item 
                    label="Passphrase" 
                    name="passphrase" 
                    rules={[
                      { required: true, message: 'Please input a Passphrase' },
                      { pattern: RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$"), message: 'Minimum eight characters, one upper case, one lower case and one number'}
                    ]}
                    validateTrigger="onBlur">
                    <Input.Password />
                  </Form.Item>

                  <Form.Item 
                    label="Confirm Passphrase" 
                    name="passphraseConfirm" 
                    dependencies={['passphrase']} 
                    rules={[
                      {
                        required: true,
                        message: 'Please confirm your Passphrase',
                      },
                      ({ getFieldValue }) => ({
                        validator(rule, value) {
                          if (!value || getFieldValue('passphrase') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject('The two passphrases that you entered do not match!')
                        },
                      }),
                    ]}
                    validateTrigger="onBlur"
                  >
                    <Input.Password />
                  </Form.Item>

                  <Form.Item {...tailLayout}>
                    {this.state.creatingAccount ?
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                      <Button type="primary" htmlType="submit">Create</Button>
                    }
                  </Form.Item>
                </Form>
              }

              { this.state.address && !this.state.accountConfirmedBackup &&
                <>
                  <h3>Please, backup this data before proceeding:</h3>

                  <h4>Address:</h4>
                  <pre>{this.state.address}</pre>
                  <h4>Name:</h4>
                  <pre>{this.state.name}</pre>
                  <h4>Seed:</h4>
                  <pre>{this.state.seed}</pre>
                  <br />
                  <Button type="primary" onClick={this.onConfirmBackup}>I've backed up my seed and passphrase</Button>
                </>
              }

              { this.state.accountWaitingForGas &&
                <>
                  <h3>Waiting for gas:</h3>
                  <p>Please, fill your address with some gas using the <a href={`https://goerli-faucet.slock.it/?address=${this.state.address}`} target="_blank">Görli Faucet</a></p>
                  <br />
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} />
                </>
              }

              { this.state.address && 
                this.state.accountConfirmedBackup &&
                !this.state.accountWaitingForGas &&
                <>
                  <h3>Please wait...<Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /></h3>
                </>
              }

            </Col>
          </Row>
        </div>
      </div>
    </div>
  }
}

export default AccountNewPage
