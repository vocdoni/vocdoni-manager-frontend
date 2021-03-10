import { useContext, Component } from 'react'
import Router from 'next/router'
import { Form, Input, Button, message, Modal, Row, Col, Card } from 'antd'
import { RcFile } from 'antd/lib/upload'
import Dragger from 'antd/lib/upload/Dragger'
import { EntityApi } from 'dvote-js'

import { ExclamationCircleOutlined, InboxOutlined } from '@ant-design/icons'

import { FileReaderPromise } from '../../lib/file-utils'
import { getGatewayClients } from '../../lib/network'
import AppContext, { IAppContext } from '../../components/app-context'
import If from '../../components/if'
import i18n from '../../i18n'

const AccountImportPage = () => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <AccountImport {...context} />
}

type ImportFormProps = {
    values: {
        seed: string,
    },
}

const ImportFormFields = (props: ImportFormProps) => {
    const {values} = props
    const hasBackup: {seed: boolean} = {
        seed: !!(values.seed && values.seed.length),
    }

    return <>
        <If condition={!hasBackup.seed}>
            <p>{i18n.t('account.manually_set')}</p>
        </If>
        <If condition={hasBackup.seed}>
            <p>{i18n.t('account.import_finish')}</p>
        </If>

        <Form.Item label={i18n.t('account.name')} name='name' rules={[
            { required: true, message: i18n.t('account.error.missing_name') }
        ]}>
            <Input />
        </Form.Item>

        <If condition={!hasBackup.seed}>
            <Form.Item label={i18n.t('account.seed')} name='seed' rules={[
                { required: true, message: i18n.t('account.error.missing_seed') }
            ]}>
                <Input.Password />
            </Form.Item>
        </If>

        <Form.Item label={i18n.t('login.password')} name='passphrase' rules={[
            { required: true, message: i18n.t('account.error.missing_password') }
        ]}>
            <Input.Password />
        </Form.Item>
    </>
}

class AccountImport extends Component<IAppContext> {
    state = {
        seed: '',
    }

    async componentDidMount() {
        this.props.setMenuVisible(false)
    }

    async onFinish(values) {
        try {
            const vals = {...this.state, ...values}

            await this.props.web3Wallet.store(vals.name, vals.seed, vals.passphrase)
            await this.props.web3Wallet.load(vals.name, vals.passphrase)
            this.props.onNewWallet(this.props.web3Wallet.getWallet())
        } catch (e) {
            message.error(i18n.t('account.error.cannot_import'), 3)
            return false
        }

        const address = this.props.web3Wallet.getAddress()

        const gateway = await getGatewayClients()
        const self = this
        try {
            await EntityApi.getMetadata(address, gateway)
            Router.push(`/entities/edit/#/${address}`)
        } catch (e) {
            Modal.confirm({
                title: i18n.t('entity.error.not_found'),
                icon: <ExclamationCircleOutlined />,
                content: i18n.t('account.error.not_found_description'),
                okText: i18n.t('entity.btn.create'),
                okType: 'primary',
                cancelText: 'Not now',
                onOk() {
                    Router.push('/entities/new')
                },
                onCancel() {
                    self.setState({ entityLoading: false })
                },
            })
        }
    }

    beforeUpload(file: RcFile) {
        FileReaderPromise(file).then((result) => {
            const contents = JSON.parse(result.toString())
            this.setState(contents)
        })

        return false
    }

    render() {
        const layout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 },
        }
        const tailLayout = {
            wrapperCol: { offset: 8, span: 10 },
        }

        return <div id='index'>
            <Row justify='center' align='middle'>
                <Col xs={24} sm={18} md={10}>
                    <Card title={i18n.t('account.import_title')} className='card'>
                        <Form {...layout} onFinish={values => this.onFinish(values)}>
                            <If condition={!this.state.seed.length}>
                                <Dragger
                                    beforeUpload={this.beforeUpload.bind(this)}
                                    accept={'application/json'}
                                    multiple={false}
                                >
                                    <p className='ant-upload-drag-icon'>
                                        <InboxOutlined />
                                    </p>
                                    <p className='ant-upload-text'>
                                        {i18n.t('account.drag_to_import')}
                                    </p>
                                    <p className='ant-upload-hint'>
                                        {i18n.t('account.import_file_restriction')}
                                    </p>
                                </Dragger>
                                <hr style={{margin: '20px 0'}} />
                            </If>
                            <ImportFormFields {...this.props} values={this.state} />

                            <Form.Item {...tailLayout}>
                                <Button type='primary' htmlType='submit'>
                                    {i18n.t('account.btn.import')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    }
}

export default AccountImportPage
