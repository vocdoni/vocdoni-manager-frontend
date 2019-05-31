import { Component } from "react"
import { Button, Spin } from 'antd'
import Web3Manager, { AccountState } from "../util/ethereum-manager"
import { headerBackgroundColor } from "../lib/constants"

import { Layout, Skeleton } from 'antd'
const { Header } = Layout

interface Props {
    accountState: AccountState
}

export default class Setup extends Component<Props> {
    onClickUnlockAccount() {
        Web3Manager.unlock()
    }

    renderPleaseWait() {
        return <div style={{ paddingTop: 30, textAlign: "center" }}>
            <Skeleton active />
            <br/>
            <div>Please, wait... <Spin size="small" /></div>
        </div>
    }
    renderInstallMetaMask() {
        return <div style={{ paddingTop: 30 }}>
            <h2>Ethereum not detected</h2>
            <p>In order to connect to the blockchain, you need to run a compatible browser or use Metamask.</p>
            <div style={{ paddingTop: 30, textAlign: "center" }}>
                <Button
                    type="default"
                    size="large"
                    href={"https://metamask.io/"}>
                    Install Metamask
                </Button>
            </div>
        </div>
    }
    renderMetaMaskLogin() {
        return <div style={{ paddingTop: 30 }}>
            <h2>Metamask is locked</h2>
            <p>In order to connect to the blockchain, you need to unlock Metamask.</p>
            <div style={{ paddingTop: 30, textAlign: "center" }}>
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
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderMainContent()}
            </div>
        </>
    }
}
