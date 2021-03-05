import { useContext, Component } from 'react'
import { Form, Input, Button, message, Row, Col, Spin, Card, Divider, Checkbox } from 'antd'
import Router from 'next/router'
// import Link from 'next/link'
import { Random } from 'dvote-js'
import { LoadingOutlined } from '@ant-design/icons'
import beautify from 'json-beautify'
import moment from 'moment'
import { Trans } from 'react-i18next'

import AppContext, { IAppContext } from '../../components/app-context'
import { downloadFileWithContents } from '../../lib/util'
import i18n from '../../i18n'


// MAIN COMPONENT
const AccountNewPage = () => {
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
        this.props.setTitle(this.state.name || i18n.t('entity.title.new'))
        this.props.setMenuVisible(false);
    }

    createWebWallet = async (name: string, passphrase: string) => {
        const seed = Random.getHex()
        await this.props.web3Wallet.store(name, seed, passphrase)
        await this.props.web3Wallet.load(name, passphrase)
        this.props.onNewWallet(this.props.web3Wallet.getWallet())

        this.setState({ seed, address: this.props.web3Wallet.getAddress() })
    }

    onFinish = async (values) => {
        this.setState({ creatingAccount: true, name: values.name, passphrase: values.passphrase })

        const key = 'creatingWallet'
        try {
            message.loading({ content: i18n.t('account.creating'), duration: 0, key })
            await this.createWebWallet(values.name, values.passphrase)
            message.success({ content: i18n.t('account.created'), key })
            this.setState({ creatingAccount: false })
        } catch (e) {
            console.error(e)
            message.error({ content: i18n.t('account.error.cannot_create'), key })
            this.setState({ creatingAccount: false })
            return false
        }
    }

    downloadBackupFile() {
        const contents = {
            seed: this.state.seed,
            public: this.props.web3Wallet.getPublicKey(),
        }

        const date = moment(new Date()).format('yyyy-MM-DD')

        downloadFileWithContents(beautify(contents, null, 2, 100), {
            filename: `vocdoni-backup-${date}.json`,
        })
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
                    <Card title={i18n.t('entity.title.create')} className="card" >
                        {!this.state.address && !this.state.accountConfirmedBackup && !this.state.accountWaitingForGas &&
                <Form {...layout} onFinish={this.onFinish} labelAlign="left">
                    <div className='styled-content'>
                        <p dangerouslySetInnerHTML={{__html: i18n.t('entity.welcome')}} />
                        <p dangerouslySetInnerHTML={{__html: i18n.t('entity.heads-up')}} />
                    </div>
                    <Form.Item label={i18n.t('account.name')} name="name" rules={[{ required: true, message: 'Please input an account name!' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={i18n.t('password')}
                        name="passphrase"
                        rules={[
                            { required: true, message: i18n.t('account.error.missing_password') },
                            { pattern: RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$"), message: 'Minimum eight characters, one upper case, one lower case and one number' }
                        ]}
                        validateTrigger="onBlur">
                        <Input.Password />
                    </Form.Item>

                    <Form.Item
                        label={i18n.t('password_confirm')}
                        name="passphraseConfirm"
                        dependencies={['passphrase']}
                        rules={[
                            {
                                required: true,
                                message: i18n.t('account.error.missing_password'),
                            },
                            ({ getFieldValue }) => ({
                                validator(rule, value) {
                                    if (!value || getFieldValue('passphrase') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(i18n.t('account.error.password_missmatch'))
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
                    >
                        <Trans
                            i18n={i18n}
                            i18nKey='accept'
                            values={{what: i18n.t('policy')}}
                            components={{
                                l: (
                                    <a
                                        href='https://vocdoni.io/privacy-policy'
                                        target='_blank'
                                        rel='noreferrer'
                                    />
                                ),
                            }}
                        >
                            Accept (template)
                        </Trans>
                    </Checkbox>
                    <br />
                    {/* </Form.Item> */}
                    {/* <Form.Item> */}
                    <Checkbox
                        checked = {acceptedTerms}
                        onChange = {(e)=>{this.acceptTerms(e)}}
                    >
                        <Trans
                            i18n={i18n}
                            i18nKey='accept'
                            values={{what: i18n.t('tos')}}
                            components={{
                                l: (
                                    <a
                                        href='https://vocdoni.io/terms-of-service'
                                        target='_blank'
                                        rel='noreferrer'
                                    />
                                ),
                            }}
                        >
                            Accept (template)
                        </Trans>
                    </Checkbox>
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
                    <p>{i18n.t('account.please_copy_details')}</p>

                    <h4>{i18n.t('account.name')}</h4>
                    <pre>{this.state.name}</pre>
                    <h4>{i18n.t('account.seed')}</h4>
                    <pre>{this.state.seed}</pre>

                    <Divider />
                    <div className='form-bottom flex-column'>
                        <Button
                            type="primary"
                            onClick={this.downloadBackupFile.bind(this)}
                        >
                            {i18n.t('account.btn.download_backup')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={this.onConfirmBackup}
                            disabled={!this.state.backupDownloaded}
                        >
                            {i18n.t('account.btn.details_already_copied')}
                        </Button>
                    </div>
                </>
                        }

                        {this.state.accountWaitingForGas &&
                <>
                    <p>
                        <Trans
                            i18n={i18n}
                            i18nKey='account.wait_for_balance'
                            values={{address: this.state.address}}
                            components={{mailto: <a href='mailto:info@vocdoni.io' />, code: <code />}}
                        >
                            To activate your account we need you to send us the name of your Entity and this identifier:
                            <code>{this.state.address}</code> to <a href="mailto:info@vocdoni.io">info@vocdoni.io</a>
                        </Trans>
                    </p>
                    <br />
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
