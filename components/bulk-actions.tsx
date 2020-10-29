import { DeleteOutlined, DownOutlined, MailOutlined } from '@ant-design/icons'
import { Dropdown, Menu, Button, Popconfirm, message } from 'antd'
import React, { Component, CSSProperties, FunctionComponent, ReactNode } from 'react'

import { IAppContext } from './app-context'

interface BulkActionsProps extends IAppContext {
    disabled: boolean
    onDeleted?: (ids: string[]) => void
    ids?: string[]
    visible: boolean
    onVisibleChange: (visible: boolean) => void
    onActionCall?: () => void
    onActionComplete?: () => void
}

interface BulkActionsOverlayProps extends BulkActionsProps {
    onActionComplete: () => void
}

type BulkActionsState = {
    visible: boolean
    forcedClose: boolean
}

type BulkActionsOverlayState = {
    // This line jump is required by ts
}

class BulkActionsOverlay extends Component<BulkActionsOverlayProps, BulkActionsState> {
    render() : ReactNode {
        return (
            <Menu>
                <Menu.Item key='remove' danger>
                    <Popconfirm
                        title='Are you sure you want to remove these members? This action cannot be undone'
                        onConfirm={() => {
                            const req : any = {
                                method: 'deleteMembers',
                                memberIds: this.props.ids,
                            }

                            if (this.props.onActionCall) {
                                this.props.onActionCall()
                            }

                            this.props.managerBackendGateway.sendMessage(req, this.props.web3Wallet.getWallet())
                                .then((res) => {
                                    if (res.ok) {
                                        if (this.props.onDeleted) {
                                            return this.props.onDeleted(this.props.ids)
                                        }
                                        return message.success('Members successfuly removed')
                                    }
                                    message.error('There was an error removing those members')
                                    console.error(res)
                                }).catch((error) => {
                                    message.error('There was an error removing those members')
                                    console.error(error)
                                })
                        }}
                    >
                        <span><DeleteOutlined /> Remove</span>
                    </Popconfirm>
                </Menu.Item>
                <Menu.Item
                    key='validate'
                    onClick={() => {
                        const req : any = {
                            method: 'sendValidationLinks',
                            memberIds: this.props.ids,
                        }

                        if (this.props.onActionCall) {
                            this.props.onActionCall()
                        }

                        this.props.managerBackendGateway.sendMessage(req, this.props.web3Wallet.getWallet())
                            .then((res) => {
                                if (res.ok) {
                                    if (this.props.onActionComplete) {
                                        this.props.onActionComplete()
                                    }
                                    return message.success('Validation links properly sent')
                                }
                                message.error('There was an error sending those validation links')
                                console.error(res)
                            }).catch((error) => {
                                message.error('There was an error sending those validation links')
                                console.error(error)
                            })
                    }}
                >
                    <span><MailOutlined /> Send validation email</span>
                </Menu.Item>
            </Menu>
        )
    }
}

export default class BulkActions extends Component<BulkActionsProps, BulkActionsState> {
    state = {
        visible: false,
        forcedClose: false,
    }

    static getDerivedStateFromProps(props, state) {
        if (state.forcedClose) {
            return {
                ...state,
                visible: false,
                forcedClose: false,
            }
        }

        return {
            ...state,
            visible: props.visible,
        }
    }

    render() : ReactNode {
        const button : CSSProperties = {
            width: '100%',
            textAlign: 'left',
        }
        return (
            <>
                <Dropdown
                    overlay={(
                        <BulkActionsOverlay
                            onActionComplete={() => {
                                this.setState({
                                    forcedClose: true,
                                })
                            }}
                            {...this.props}
                        />
                    )}
                    trigger={['click']}
                    disabled={this.props.disabled}
                    visible={this.state.visible}
                    onVisibleChange={this.props.onVisibleChange}
                >
                    <Button onClick={e => e.preventDefault()} style={button}>
                        Bulk actions <DownOutlined />
                    </Button>
                </Dropdown>
            </>
        )
    }
}
