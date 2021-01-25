import { useContext, Component } from 'react'
import { Row, Col, Divider, Typography } from 'antd'
import Title from 'antd/lib/typography/Title'

import AppContext, { IAppContext } from '../../components/app-context'
import ButtonShowPrivateKey from '../../components/button-show-private-key'

// MAIN COMPONENT
const AccountEditPage = () => {
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

        this.props.setMenuSelected('account-edit')

        this.props.web3Wallet.getEthBalance().then((val) => this.setState({balance: val}))
    }

    render() {
        return (
            <div id='page-body'>
                <div className='body-card'>
                    <Row>
                        <Col span={24}>
                            <section>
                                <Divider orientation='left'>Wallet</Divider>
                                <Title level={4}>Address</Title>
                                <Typography.Text ellipsis={true}>
                                    { this.props.web3Wallet.getAddress() }
                                </Typography.Text>
                                <Title level={4}>Public key</Title>
                                <Typography.Text ellipsis={true}>
                                    { this.props.web3Wallet.getPublicKey() }
                                </Typography.Text>
                                <Title level={4}>Private key</Title>
                                <Typography.Text>
                                    <ButtonShowPrivateKey {...this.props} />
                                </Typography.Text>
                                <Title level={4}>Balance</Title>
                                <Typography.Text>
                                    { this.state.balance }
                                </Typography.Text>
                            </section>
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}

export default AccountEditPage
