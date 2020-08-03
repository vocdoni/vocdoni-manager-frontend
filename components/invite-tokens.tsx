import React, { Component } from 'react'
import { Modal, Button, Form, Input } from 'antd'
import { DVoteGateway } from 'dvote-js/dist/net/gateway'
import Web3Wallet from '../lib/web3-wallet'

const  validationUrlPrefix = "https://"+process.env.APP_LINKING_DOMAIN+"/validation/"

type Props = {
    entityId: string,
    managerBackendGateway: DVoteGateway,
    web3Wallet: Web3Wallet,
    visible: boolean,
    onCancel: ()=>  void,
    onError: (any) => any,
}
export default class InviteTokens extends Component<Props> {
    handleOk = ({amount}) => {
        const tokensReq = {
            method: 'generateTokens',
            amount: parseInt(amount, 10),
        }

        this.props.managerBackendGateway
            .sendMessage(tokensReq as any, this.props.web3Wallet.getWallet())
            .then(this.downloadTokens, this.props.onError)
    }

    downloadTokens = (result) => {
        if (!result.ok) {
            return this.props.onError("Could not generate the tokens")
        }
        let data =result.tokens
        if (data.length > 0) {
            data = data.map( token => token+","+validationUrlPrefix+this.props.entityId+'/'+token)
        }
        data = (data || []).join("\n")
        const element = document.createElement("a")
        const file = new Blob([data], { type: 'text/csv;charset=utf-8' })
        element.href = URL.createObjectURL(file)
        element.download = "new-member-tokens.csv"
        document.body.appendChild(element)
        element.click()
    }

    render() {
        const { visible } = this.props
        return (
            <Modal
                title='Generate New User Tokens'
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
