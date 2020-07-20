import { useContext, Component } from 'react'
import { Row, Col, Divider, Typography } from 'antd'

import AppContext, { IAppContext } from '../../components/app-context'

// MAIN COMPONENT
const AccountEditPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <AccountEdit {...context} />
}

type State = {
    id?: string
    balance: string
}

// Stateful component
class AccountEdit extends Component<IAppContext, State> {
    state: State = {
        balance: '',
    }

    componentDidMount() {
        this.setState({ id: location.hash.substr(2) })

        this.props.setTitle(`Process ${location.hash.substr(2)}`)
        this.props.setMenuSelected("account-edit")

        this.props.web3Wallet.getEthBalance().then((val) => this.setState({balance: val}))
    }

    render() {
        return <div id="page-body">
            <div className="body-card">
                <Row>
                    <Col span={24}>
                        <section>
                            <Divider orientation="left">Wallet</Divider>
                            <h3>Address</h3>
                            { this.props.web3Wallet.getAddress() }
                            <h3>Public key</h3>
                            <Typography.Text ellipsis={true}>
                                { this.props.web3Wallet.getPublicKey() }
                            </Typography.Text>
                            <h3>Balance</h3>
                            { this.state.balance }
                        </section>
                    </Col>
                </Row>
            </div>
        </div>
    }
}

export default AccountEditPage
