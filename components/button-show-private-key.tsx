import { useContext, Component } from 'react'
import { Typography, Button, Modal, Input, message } from 'antd'
import { EyeInvisibleOutlined, KeyOutlined } from '@ant-design/icons'
import { EtherUtils } from 'dvote-js'

import { IAppContext } from './app-context'

type PrivKeyButtonState = {
    password: string,
    key: string,
}

export default class ButtonShowPrivateKey extends Component<IAppContext, PrivKeyButtonState> {
    state = {
        password: '',
        key: '',
    }

    onShowClick() {
        Modal.confirm({
            title: 'Please confirm your password',
            content: (
                <Input.Password onChange={({target}) => this.setState({password: target.value})} />
            ),
            onOk: async (close) => {
                const wallets = await this.props.web3Wallet.getStored()
                const current = wallets.filter(({name}) => name === this.props.title).pop()
                let wallet: any = null
                try {
                    wallet = EtherUtils.Signers.walletFromSeededPassphrase(this.state.password, current.seed)
                } catch (error) {
                    message.error(error.toString())
                    // We need to throw the error to avoid the "Ok" button to get stuck
                    throw error
                }

                if (wallet.signingKey['publicKey'] !== current.publicKey) {
                    const msg = 'Password does not match with your current account'
                    message.error(msg)

                    throw new Error(msg)
                }

                this.setState({key: wallet.signingKey['privateKey']})
            }
        })
    }

    onHideClick() {
        this.setState({
            key: '',
            password: '',
        })
    }

    render() {
        if (!this.state.key.length) {
            return (
                <Button type='link' style={{padding: 0}} onClick={this.onShowClick.bind(this)}>
                    Show private key <KeyOutlined />
                </Button>
            )
        }

        return (
            <Typography.Text>
                <span className='key'>
                    {this.state.key}
                </span>
                <Button type='link' style={{padding: 0}} onClick={this.onHideClick.bind(this)}>
                    Hide <EyeInvisibleOutlined />
                </Button>
            </Typography.Text>
        )
    }
}
