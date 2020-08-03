import React, { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { Row, Col, Divider, Button, message, Descriptions } from 'antd'
import { getNetworkState } from '../../lib/network'
import Router from 'next/router'
import { DeleteOutlined } from '@ant-design/icons'
import { ICensus, ITarget } from '../../lib/types'
import Link from "next/link"

const CensusViewPage = props => {
    const context = useContext(AppContext)
    return <CensusView {...context} />
}

type State = {
  entityId?: string,
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

      const hash = location.hash.split('/')
      const entityId = hash[1]
      const censusId = hash[2]
      this.setState({ entityId, censusId })
      this.fetchCensus(censusId)
  }

  fetchCensus(id: string) {
      const request = {
          method: 'getCensus',
          censusId: id,
      }
      this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
          .then((result) => {
              this.setState({ census: result.census, censusTarget: result.target })
          },
          (error) => {
              message.error("Could not fetch the census data")
              this.setState({error})
          })
  }

  deleteCensus() {
      const request = { method: "deleteCensus", id: this.state.censusId }
      this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
          .then((result) => {
              if (!result.ok) {
                  const error = "Could not delete the census"
                  message.error(error)
                  this.setState({error})
                  return false
              }

              message.success("Census has been deleted")
              Router.replace("/census#/" + this.state.entityId)
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
                    <Link href={"/targets/view#" + this.state.entityId + "/" + this.state.censusTarget.id}><a>{this.state.censusTarget.name}</a></Link>
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
                              <Button type="link" onClick={() => this.deleteCensus()} icon={<DeleteOutlined />}>Remove the census snapshot</Button>
                          </Col>
                      </Row>
                  </Col>
              </Row>
          </div>
      </div>
  }
}

export default CensusViewPage
