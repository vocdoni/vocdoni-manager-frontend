import { Component } from "react"
import { Button, Spin } from 'antd'
import Web3Wallet, { AccountState } from "../lib/web3-wallet"

import { Skeleton } from 'antd'

interface Props {
    accountState: AccountState
}

export default class MetamaskState extends Component<Props> {
    onClickUnlockAccount() {
        Web3Wallet.unlock()
    }

    renderPleaseWait() {
        return <div className="card main-skeleton">
            <Skeleton active />
            <br />
            <div>Please, wait... <Spin size="small" /></div>
        </div>
    }

    renderInstallMetaMask() {
        return <div className="card install">
            <h2>Ethereum not detected</h2>
            <p>In order to connect to the blockchain you need to install Metamask.</p>
            <div className="main-button">
                <a href="https://metamask.io" target="_blank">
                    <Button type="default">
                        Install Metamask
                </Button>
                </a>
            </div>
        </div >
    }
    renderMetaMaskLogin() {
        return <div className="card login">
            <h2>Metamask is locked</h2>
            <p>In order to connect to the blockchain you need to unlock Metamask.</p>
            <div className="main-button">
                <Button
                    type="default"
                    onClick={() => this.onClickUnlockAccount()}>
                    Log in with Metamask
                </Button>
            </div>
        </div>
    }

    renderMainContent() {
        switch (this.props.accountState) {
            case AccountState.NoWeb3:
            case AccountState.NoEthereum:
                return this.renderInstallMetaMask()

            case AccountState.Locked:
                return this.renderMetaMaskLogin()

            default:
                return this.renderPleaseWait()
        }
    }

    render() {
        return <>
            <div id="metamask-state">
                {this.renderMainContent()}
            </div>
        </>
    }
}
