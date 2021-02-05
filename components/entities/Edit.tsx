import { ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, message, Modal, Row } from 'antd'
import { EntityApi, EntityMetadata, Gateway, GatewayPool } from 'dvote-js'
import React, { Component, ReactNode } from 'react'

import { main } from '../../i18n'
import { getGatewayClients } from '../../lib/network'
import AppContext from '../app-context'
import HTMLEditor from '../html-editor'
import HeaderImage from './HeaderImage'

const MethodSignup = 'signUp'
const MethodUpdate = 'updateEntity'

type EditProps = {
    entity: EntityMetadata,
    onSave: (success: boolean) => void,
    method: typeof MethodSignup | typeof MethodUpdate,
}

type EditFields = {
    email: string,
    name: string,
    description: string,
    avatar: string,
    header: string,
    callbackUrl: string,
    callbackSecret: string,
}

type EditState = {
    loaded: boolean,
    saving: boolean,
    fields: EditFields,
}

export default class Edit extends Component<EditProps, EditState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    backendFields : string[] = ['email', 'callbackSecret', 'callbackUrl']

    state : EditState = {
        loaded: false,
        saving: false,
        fields: {
            name : '',
            description : '',
            email :'',
            avatar: '',
            header: '',
            callbackUrl: '',
            callbackSecret: '',
        },
    }

    async componentDidMount() : Promise<void> {
        if (this.props.method === 'signUp') {
            this.setState({
                loaded: true,
            })
            this.setInitialFieldValues()

            return
        }

        try {
            const mg = await this.context.managerBackendGateway.sendRequest(
                {method: 'getEntity'} as any,
                this.context.web3Wallet.getWallet()
            )

            const backendValues = {}
            for (const field of this.backendFields) {
                if (mg.entity[field]?.length) {
                    backendValues[field] = mg.entity[field]
                }
            }

            if (Object.values(backendValues).length > 0) {
                this.setState({fields: {
                    ...this.state.fields,
                    ...backendValues,
                }})
            }

            this.setInitialFieldValues()
        } catch (error) {
            console.error(error)
            message.error(main.entityLoadError)
        }

        this.setState({
            loaded: true,
        })
    }

    setFieldValue(field: string, value: string) : void {
        this.setState({
            fields: {
                ...this.state.fields,
                [field]: value,
            }
        })
    }

    setInitialFieldValues() : void {
        this.setState({
            fields: {
                ...this.state.fields,
                name: this.props.entity.name.default,
                description: this.props.entity.description.default,
                avatar: this.props.entity.media.avatar,
                header: this.props.entity.media.header,
            },
        })
    }

    async submit() : Promise<void> {
        this.setState({saving: true})

        const values = this.state.fields
        const address = this.context.web3Wallet.getAddress()
        const balance = await this.context.web3Wallet.getProvider().getBalance(address)

        if (balance.isZero()) {
            Modal.warning({
                title: main.notEnoughBalance,
                icon: <ExclamationCircleOutlined />,
                content: <span dangerouslySetInnerHTML={{
                    __html: main.notEnoughBalanceNote.replace('{address}', address)
                }} />,
                onOk: () => {
                    this.setState({saving: false})
                },
            })
            return
        }

        const entity : EntityMetadata = {
            ...this.props.entity,
            name: {
                ...this.props.entity.name,
                default: values.name,
            },
            description: {
                ...this.props.entity.description,
                default: values.description,
            },
            media: {
                header: values.header,
                avatar: values.avatar,
            },
        }

        const idx = entity.actions.findIndex(act => act.type === 'register')
        if (idx < 0) { // add it
            entity.actions.unshift({
                type: 'register',
                actionKey: 'register',
                name: { default: 'Sign up' },
                url: process.env.REGISTER_URL,
                visible: process.env.ACTION_VISIBILITY_URL
            })
        }
        else { // update it
            entity.actions[idx].actionKey = 'register'
            entity.actions[idx].url = process.env.REGISTER_URL
            entity.actions[idx].visible = process.env.ACTION_VISIBILITY_URL
        }
        // Filter extraneous actions
        entity.actions = entity.actions.filter(meta => !!meta.actionKey)

        let success = true;
        try {
            const wallet = this.context.web3Wallet.getWallet()
            // Add/Update centralized metadata
            const request = {
                method: this.props.method,
                entity: {
                    name : values.name,
                }
            }
            for (const field of this.backendFields) {
                if (values[field]?.length) {
                    request.entity[field] = values[field]
                }
            }

            // Updated such centralized metadata
            await this.context.managerBackendGateway.sendRequest(request as any, wallet);

            // Update decentralized one
            const gateway = await getGatewayClients()
            await EntityApi.setMetadata(address, entity, wallet, (gateway as GatewayPool | Gateway))

            message.success('The entity has been updated')
        } catch (err) {
            success = false;
            console.error(err)
            message.error('The entity could not be updated')
        }

        this.setState({saving: false})

        if (this.props.onSave) {
            this.props.onSave(success)
        }
    }

    render() : ReactNode {
        // Due to how `initialValues` works, we need to avoid rendering the form
        // before having all the values (TODO: use state instead)
        if (!this.state.loaded) {
            return null
        }

        const values = this.state.fields

        return (
            <>
                <HeaderImage
                    name={values.name}
                    header={values.header}
                    avatar={values.avatar}
                    onHeaderConfirm={(image: string) => {
                        if (image.length) {
                            this.setFieldValue('header', image)
                        }
                    }}
                    onAvatarConfirm={(image: string) => {
                        if (image.length) {
                            this.setFieldValue('avatar', image)
                        }
                    }}
                    uploaderActive={true}
                />
                <Row justify='space-between'>
                    <Form onFinish={this.submit.bind(this)} initialValues={values} layout='vertical'>
                        <Col span={24}>
                            <Form.Item>
                                <Input
                                    placeholder='Organization name'
                                    size='large'
                                    value={values.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setFieldValue('name', e.target.value)
                                    }
                                />
                            </Form.Item>
                            <Form.Item>
                                <Input
                                    placeholder='Organization e-mail'
                                    value={values.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setFieldValue('email', e.target.value)
                                    }
                                />
                            </Form.Item>
                            <HTMLEditor
                                value={values.description}
                                onContentChanged={(description) =>
                                    this.setFieldValue('description', description)
                                }
                            />
                            <Form.Item label='Callback URL'>
                                <Input
                                    placeholder='https://...'
                                    value={values.callbackUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setFieldValue('callbackUrl', e.target.value)
                                    }
                                />
                            </Form.Item>
                            <Form.Item label='Callback Secret'>
                                <Input
                                    type='password'
                                    value={values.callbackSecret}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        this.setFieldValue('callbackSecret', e.target.value)
                                    }
                                />
                            </Form.Item>
                            <SaveButton saving={this.state.saving} />
                        </Col>
                    </Form>
                </Row>
            </>
        )
    }
}

const SaveButton = (props: {saving?: boolean} = {}) => {
    let text = 'Save'
    if (props.saving) {
        text = 'Saving'
    }

    return (
        <Button type='primary' htmlType='submit' disabled={props.saving} loading={props.saving}>
            <SaveOutlined /> {text}
        </Button>
    )
}
