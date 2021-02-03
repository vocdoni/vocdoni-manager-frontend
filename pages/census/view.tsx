import React, { useContext, Component } from 'react'
import { Row, Col, Divider, Button, message, Descriptions, Popconfirm } from 'antd'
import Router from 'next/router'
import { DeleteOutlined } from '@ant-design/icons'

import { getNetworkState } from '../../lib/network'
import { ICensus, ITarget } from '../../lib/types'
import AppContext, { IAppContext } from '../../components/app-context'

const CensusViewPage = () => {
    const context = useContext(AppContext)
    return <CensusView {...context} />
}

type State = {
    address?: string,
    censusId?: string,
    census?: ICensus,
    censusTarget?: ITarget,
    loading: boolean,
    error?: any,
}

class CensusView extends Component<IAppContext, State> {
    state: State = {
        loading: false,
    }

    async componentDidMount() {
        if (getNetworkState().readOnly) {
            return Router.replace("/entities" + location.hash)
        }

        this.props.setMenuSelected("census")

        const [address, censusId] = this.props.params
        this.setState({ address, censusId })
        this.fetchCensus(censusId)
    }

    fetchCensus(id: string) {
        const request = {
            method: 'getCensus',
            censusId: id,
        }
        this.props.managerBackendGateway.sendRequest(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({ census: result.census, censusTarget: result.target })
            },
            (error) => {
                message.error("Could not fetch the census data")
                this.setState({error})
            })
    }

    deleteCensus() {
        const request = { method: "deleteCensus", censusId: this.state.censusId }
        this.props.managerBackendGateway.sendRequest(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not delete the census"
                    message.error(error)
                    this.setState({error})
                    return false
                }

                message.success("Census has been deleted")
                Router.replace("/census#/" + this.state.address)
            },
            (error) => {
                message.error("Could not delete the census")
                this.setState({error})
            })
    }

    render() {
        const census = this.state.census

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={40} justify="start">
                    <Col xs={{span: 24, order: 2}} lg={{span: 18, order: 1}}>
                        <Divider orientation="left">Census details</Divider>
                        {census &&
                    <Descriptions column={2} layout="vertical" colon={false}>
                        <Descriptions.Item label="Name">{census.name}</Descriptions.Item>
                        {/* <Descriptions.Item label="Target">
                        <Link href={"/targets/view#" + this.state.address + "/" + this.state.censusTarget.id}><a>{this.state.censusTarget.name}</a></Link>
                    </Descriptions.Item> */}
                        <Descriptions.Item label="Census ID">{census.id}</Descriptions.Item>
                        <Descriptions.Item label="Size">{census.size} members</Descriptions.Item>
                        <Descriptions.Item label="Merkle Root">{census.merkleRoot}</Descriptions.Item>
                        <Descriptions.Item label="Created At">{census.createdAt}</Descriptions.Item>
                        <Descriptions.Item label="Merkle Tree Origin">{census.merkleTreeUri}</Descriptions.Item>

                    </Descriptions>
                        }
                    </Col>

                    <Col xs={{span: 24, order: 1}} lg={{span: 6, order: 2}}>
                        <Row gutter={[0,24]}>
                            <Col span={24}>
                                <Divider orientation="left">Actions</Divider>
                                <Popconfirm
                                    title="Are you sure you want to delete this census?"
                                    okText="Delete"
                                    okType="primary"
                                    cancelText="Cancel"
                                    onConfirm={ () => this.deleteCensus()}
                                >
                                    <Button type="link" icon={<DeleteOutlined />}>Delete Census</Button>
                                </Popconfirm>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    }
}

export default CensusViewPage
