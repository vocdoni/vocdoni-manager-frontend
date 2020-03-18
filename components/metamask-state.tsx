import { Component } from "react"
import { Button, Spin } from 'antd'
import Web3Manager, { AccountState } from "../lib/web3-wallet"

import { Skeleton } from 'antd'

interface Props {
    accountState: AccountState
}

export default class MetamaskState extends Component<Props> {
    onClickUnlockAccount() {
        Web3Manager.unlock()
    }

    renderPleaseWait() {
        return <div className="main-skeleton">
            <Skeleton active />
            <br />
            <div>Please, wait... <Spin size="small" /></div>
        </div>
    }

    renderInstallMetaMask() {
        return <div className="install">
            <h2>Ethereum not detected</h2>
            <p>In order to connect to the blockchain you need to install Metamask.</p>
            <div className="main-button">
                <Button
                    type="default"
                    size="large"
                    target="_blank"
                    href={"https://metamask.io/"}>
                    Install Metamask
                </Button>
            </div>
        </div>
    }
    renderMetaMaskLogin() {
        return <div className="login">
            <h2>Metamask is locked</h2>
            <p>In order to connect to the blockchain you need to unlock Metamask.</p>
            <div className="main-button">
                <Button
                    type="default"
                    size="large"
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
