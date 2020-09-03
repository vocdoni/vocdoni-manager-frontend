import { useContext, Component } from 'react'
import { Form, Input, Button, message, Row, Col, Spin, Card, Divider, Checkbox } from 'antd'
import Router from 'next/router'
// import Link from 'next/link'
import { EtherUtils } from 'dvote-js'
import { LoadingOutlined, AlignLeftOutlined } from '@ant-design/icons'
import beautify from 'json-beautify'

import AppContext, { IAppContext } from '../../components/app-context'
import { downloadFileWithContents } from '../../lib/util'


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
  acceptedPolicy: boolean,
  acceptedTerms: boolean,
  backupDownloaded: boolean,
}

class AccountNew extends Component<IAppContext, State> {
    state: State = {
        acceptedPolicy: false,
        acceptedTerms: false,
        backupDownloaded: false,
    }

    async componentDidMount() {
        this.props.setTitle(this.state.name || "New Entity")
        this.props.setMenuVisible(false);
    }

    createWebWallet = async (name: string, passphrase: string) => {
        const seed = EtherUtils.Signers.generateRandomHexSeed()
        await this.props.web3Wallet.store(name, seed, passphrase)
        await this.props.web3Wallet.load(name, passphrase)
        this.props.onNewWallet(this.props.web3Wallet.getWallet())

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
            message.error({ content: 'An error ocurred trying to create the account. Please, try it again', key })
            this.setState({ creatingAccount: false })
            return false
        }
    }

    downloadBackupFile() {
        const contents = {
            seed: this.state.seed,
            public: this.state.address,
        }

        downloadFileWithContents(beautify(contents, null, 2, 100))
        this.setState({backupDownloaded: true})
    }

    onConfirmBackup = async () => {
        this.setState({ accountConfirmedBackup: true, accountWaitingForGas: true })
        try {
            await this.props.web3Wallet.waitForGas()
        } catch (e) {
            //message.error({ content: 'Timeout waiting for user to get gas. Please, try it again' })
            this.setState({ creatingAccount: false })
            return false
        }
        this.setState({ accountWaitingForGas: false })
        Router.push("/entities/new")
    }

    acceptPolicy(e) {
        this.setState({acceptedPolicy: e.target.checked})
    }

    acceptTerms(e) {
        this.setState({acceptedTerms: e.target.checked})
    }

    render() {
        const layout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 18 },
        }
        const tailLayout = {
            wrapperCol: { offset: 8, span: 10 },
        }

        const acceptedPolicy = this.state.acceptedPolicy
        const acceptedTerms = this.state.acceptedTerms

        return <div id="index">
            <Row justify="center" align="middle">
                <Col xs={24} sm={18} md={10} >
                    <Card title="Create your Entity" className="card" >
                        {!this.state.address && !this.state.accountConfirmedBackup && !this.state.accountWaitingForGas &&
                <Form {...layout} onFinish={this.onFinish} labelAlign="left">
                    <p> Welcome! In the next steps you're about to create an entity in Vocdoni.<br /> It's important to keep the password and all the information of the next page in a safe place, it is the only way to access your entity. <br /> <br />Keep in mind that everything is encrypted on your browser. If your device breaks, is lost, stolen, or has data corruption, there is no way for Vocdoni to recover your entity.</p>
                    <Form.Item label="Entity Name" name="name" rules={[{ required: true, message: 'Please input an account name!' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="passphrase"
                        rules={[
                            { required: true, message: 'Please input a Password' },
                            { pattern: RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$"), message: 'Minimum eight characters, one upper case, one lower case and one number' }
                        ]}
                        validateTrigger="onBlur">
                        <Input.Password />
                    </Form.Item>

                    <Form.Item
                        label="Confirm Password"
                        name="passphraseConfirm"
                        dependencies={['passphrase']}
                        rules={[
                            {
                                required: true,
                                message: 'Please confirm your Password',
                            },
                            ({ getFieldValue }) => ({
                                validator(rule, value) {
                                    if (!value || getFieldValue('passphrase') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject('The two passwords that you entered do not match!')
                                },
                            }),
                        ]}
                        validateTrigger="onBlur"
                    >
                        <Input.Password />
                    </Form.Item>
                    {/* <Form.Item> */}
                    <Checkbox
                        checked = {acceptedPolicy}
                        onChange = {(e)=>{this.acceptPolicy(e)}}
                    >I accept the <a href="https://vocdoni.io/privacy-policy/">Privacy Policy</a></Checkbox>
                    <br />
                    {/* </Form.Item> */}
                    {/* <Form.Item> */}
                    <Checkbox
                        checked = {acceptedTerms}
                        onChange = {(e)=>{this.acceptTerms(e)}}
                    >I accept the <a href="https://vocdoni.io/terms-of-service/">Terms of Service</a> </Checkbox>
                    {/* </Form.Item> */}
                    <Form.Item {...tailLayout}>
                        {this.state.creatingAccount ?
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                            <Button type="primary" htmlType="submit" disabled={(!acceptedPolicy) || (!acceptedTerms)}>Create</Button>
                        }
                    </Form.Item>
                </Form>
                        }

                        {this.state.address && !this.state.accountConfirmedBackup &&
                <>
                    <p>Please, make a copy of the following details before you continue</p>

                    <h4>Entity Name:</h4>
                    <pre>{this.state.name}</pre>
                    <h4>Account Backup Code:</h4>
                    <pre>{this.state.seed}</pre>
                    {/* <h4>Address:</h4> */}
                    {/* <pre>{this.state.address}</pre> */}

                    <Divider />
                    <div style={{ textAlign: "center" }}>
                        <Button
                            type="primary"
                            onClick={this.downloadBackupFile.bind(this)}
                        >
                            Download backup file
                        </Button>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <Button
                            type="primary"
                            onClick={this.onConfirmBackup}
                            disabled={!this.state.backupDownloaded}
                        >
                            I have copied my Entity details
                        </Button>
                    </div>
                </>
                        }

                        {this.state.accountWaitingForGas &&
                <>
                    {/* <h3>Activate your account</h3> */}
                    <span>
                        {/* To continue with the transaction you need to get some xDAI tokens. <br /> */}
                        To activate your account we need you to send us the name of your Entity and this identifier: <code>{this.state.address}</code> to <a href="mailto:info@vocdoni.io">info@vocdoni.io</a><br /></span>
                    <br />
                    {/* <Spin indicator={<LoadingOutlined style={{ fontSize: 22 }} />} /> */}
                </>
                        }

                        {this.state.address &&
                this.state.accountConfirmedBackup &&
                !this.state.accountWaitingForGas &&
                <>
                    <h3>Please wait... <Spin indicator={<LoadingOutlined style={{ fontSize: 22 }} />} /></h3>
                </>
                        }
                    </Card>
                </Col>
            </Row>
        </div>
    }
}

export default AccountNewPage
