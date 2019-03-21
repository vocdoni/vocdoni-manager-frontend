import { Component } from "react"
import { Button, Spin } from 'antd'
import { AccountState } from "../utils/accountState"

interface Props {
    accountState: AccountState,
    onClickUnlockAccount: () => void
}

export default class Setup extends Component<Props> {
    renderPleaseWait() {
        return <div style={{ paddingTop: 30, textAlign: "center" }}>
            <p>Please, wait... <Spin size="small" /></p>
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
                    onClick={() => this.props.onClickUnlockAccount()}>
                    Log in with Metamask
            </Button>
            </div>
        </div>
    }
    render() {
        switch (this.props.accountState) {
            case AccountState.NoWeb3:
            case AccountState.NoEthereum:
                return this.renderInstallMetaMask()

            case AccountState.NoUnlocked:
                return this.renderMetaMaskLogin()

            default:
                return this.renderPleaseWait()
        }
    }
}
