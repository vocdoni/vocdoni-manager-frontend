import React, { Component } from 'react'
import { Modal, Button, Form, Input } from 'antd'

export default class InviteTokens extends Component {
    handleOk = ({amount}) => {
        const tokensReq = {
            method: 'generateTokens',
            amount,
        }

        this.props.managerBackendGateway
            .sendMessage(tokensReq as any, this.props.web3Wallet.getWallet())
            .then(console.log, console.error)
    }

    render() {
        const { visible } = this.props
        return (
            <Modal
                title='Generate Invite Tokens'
                visible={visible}
                confirmLoading={false}
                closable={false}
                footer={false}
            >
                <Form onFinish={this.handleOk.bind(this)}>
                    <Form.Item label='# of tokens to be created' name='amount'>
                        <Input type='number' max='800' step='1' min='1' />
                    </Form.Item>
                    <Form.Item>
                        <Button key='back' onClick={this.props.onCancel.bind(this)}>
                            Cancel
                        </Button>
                        <Button type='primary' htmlType='submit'>
                            Generate
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        )
    }
}
