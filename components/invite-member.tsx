import React, { Component, ReactNode } from 'react'
import { Modal, Button, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { DVoteGateway, IDvoteRequestParameters } from 'dvote-js/dist/net/gateway'

import Web3Wallet from '../lib/web3-wallet'
import If from './if'

type Props = {
    member: {
        id: string,
        email: string,
    },
    children: ReactNode,
    managerBackendGateway: DVoteGateway,
    web3Wallet: Web3Wallet,
}
export default class InviteMember extends Component<Props> {
    state = {
        loading: false,
    }
    showWarn(type, text) {
        Modal[type]({
            title: text,
        })
    }

    showConfirm(member) {
        const { email, id } = member
        const req = {
            method: 'sendValidationLink',
            memberId: id,
        }
        const wallet = this.props.web3Wallet.getWallet()
        this.setState({loading: true})

        Modal.confirm({
            title: 'Send validation e-mail',
            content: `You're about to send an e-mail to ${email}, please confirm.`,
            onOk: () => {
                this.props.managerBackendGateway.sendMessage(req as any, wallet).then((response) => {
                    const {ok} = response
                    this.setState({loading: false})
                    if (ok) {
                        return this.showWarn('success', `A registration e-mail has ben sent to ${email}`)
                    }

                    this.showWarn('error', `There was an error sending e-mail to ${email}, please try again later.`)
                }).catch((error) => {
                    this.showWarn('error', error.toString())
                    this.setState({loading: false})
                    console.error(error)
                })
            },
            onCancel: () => {
                this.setState({loading: false})
            }
        })
    }

    render() {
        const {children, member} = this.props

        return (
            <Button
                type='link'
                title='Sent validation link'
                onClick={() => {
                    this.showConfirm(member)
                }}
            >
                {children}
                <If condition={this.state.loading}>
                    <Spin indicator={
                        <LoadingOutlined style={{
                            fontSize: 14,
                            marginLeft: 10,
                        }} spin />
                    } />
                </If>
            </Button>
        )
    }
}
