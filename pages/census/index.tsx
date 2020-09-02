import { useContext, Component, ReactText } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { Row, Col, Divider, Table, Tag, Select, Space, Button, message, Modal } from 'antd'
import { DeleteRowOutlined } from '@ant-design/icons'
import { ICensus } from '../../lib/types'
import { getNetworkState } from '../../lib/network'
import Router from 'next/router'
import Link from 'next/link'

const CensusPage = props => {
    const context = useContext(AppContext)
    return <Census {...context} />
}

type State = {
  selectedRows?: any[],
  selectedRowsKeys?: ReactText[],
  data: ICensus[],
  pagination: {current: number, pageSize: number},
  total: number,
  loading: boolean,
  error?: any,
}

class Census extends Component<IAppContext, State> {
  state: State = {
      selectedRows: [],
      selectedRowsKeys: [],
      data: [],
      pagination: {
          current: 1,
          pageSize: 10,
      },
      total: 0,
      loading: false,
  }

  async componentDidMount() {
      if (getNetworkState().readOnly) {
          return Router.replace("/entities" + location.hash)
      }

      this.props.setMenuSelected("census")
      this.fetchCount()
      this.fetch()
  }

  fetchCount() {
      this.props.managerBackendGateway.sendMessage({ method: "countCensus" } as any, this.props.web3Wallet.getWallet())
          .then((result) => {
              if (!result.count) {
                Modal.warning({
                    title: "No censuses were found",
                })
              }
              this.setState({total: result.count})
          },
          (error) => {
              message.error("Could not fetch the census count")
              this.setState({error})
          })
  }

  handleTableChange(pagination: any, filters: any, sorter: any = { field: undefined, order: undefined }) {
      this.fetch({
          listOptions: {
              skip: (pagination.current - 1) * pagination.pageSize,
              count: pagination.pageSize,
              sortBy: sorter.field,
              order: sorter.order,
          },
          filter: {...filters},
          pagination
      })
  }

  fetch(params: any = {}) {
      this.setState({ loading: true })

      const request = {
          method: "listCensus",
          listOptions: { ...{ skip: (this.state.pagination.current - 1) * this.state.pagination.pageSize, count: this.state.pagination.pageSize }, ...params.listOptions },
          filter: params.filter
      }

      this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
          .then((result) => {
              this.setState({
                  loading: false,
                  data: result.censuses,
                  pagination: {
                      ...params.pagination,
                  },
              })
          },
          (error) => {
              message.error("Could not fetch the census data")
              this.setState({
                  loading: false,
                  error
              })
          }
          )
  }

  deleteCensus(record: any) {
      this.props.managerBackendGateway.sendMessage({ method: "deleteCensus", id: record.id } as any, this.props.web3Wallet.getWallet())
          .then((result) => {
              if (!result.ok) {
                  const error = "Could not delete the census"
                  message.error(error)
                  this.setState({error})
                  return false
              }

              const data = this.state.data.filter(item => item.id !== record.id)
              this.setState({ data })
          },
          (error) => {
              message.error("Could not delete the census")
              this.setState({error})
          })
  }

  removeSelected() {
      // const data = this.state.data.filter(item => !this.state.selectedRowsKeys.includes(item.id))
      // this.setState({ data })
      this.state.selectedRows.forEach((v) => this.deleteCensus(v))
  }

  onRowSelection(keys: ReactText[], rows: any[]) {
      this.setState({selectedRowsKeys: keys, selectedRows: rows})
  }

  generateLink(text, record, index) {
      return <Link href={"/census/view#/" + this.props.entityId + "/" + record.id}><a>{text}</a></Link>
  }

  render() {
      const columns = [
          { title: 'Name', dataIndex: 'name', key: 'name', render: (text, record, index) => this.generateLink(text, record, index)  },
          // { title: 'Target', dataIndex: 'targetId', key: 'targetId', render: (text, record, index) => (
          //     <Link href={"/targets/view#/" + this.props.entityId + "/" + record.targetId}><a>{record.targetId}</a></Link>
          //   )
          // },
          //{ title: 'Census Id', dataIndex: 'id', key: 'id' },
          // { title: 'MerkleRoot', dataIndex: 'id', key: 'id' },
          { title: 'Creation date', dataIndex: 'createdAt', key: 'createdAt', sorter: true,  render: (text, record, index) => this.generateLink(text, record, index)  },
          //{ title: 'Actions', key: 'action', render: (text, record, index) => (
          //    <Space size="middle">
          //        <Link href={"/census/view#/" + this.props.entityId + "/" + record.id}><a>View</a></Link>
          //        <a onClick={() => this.deleteCensus(record)}>Delete</a>
          //    </Space>)
          //},
      ]

      return <div id="page-body">
          <div className="body-card">
              <Row gutter={40} justify="start">
                  <Col xs={{span: 24, order: 2}} lg={{span: 18, order: 1}}>
                      <Divider orientation="left">Census list</Divider>
                      <Table
                          rowKey="id"
                          columns={columns}
                          dataSource={this.state.data}
                          pagination={{...this.state.pagination, ...{total: this.state.total}}}
                          loading={this.state.loading}
                          onChange={(pagination, filters, sorter) => this.handleTableChange(pagination, filters, sorter)}
                          className='scroll-x'
                      />
                  </Col>

                  <Col xs={{span: 24, order: 1}} lg={{span: 6, order: 2}}>
                      <Row gutter={[0,24]}>
                          <Col span={24}>
                              {/*
                              <Divider orientation="left">Actions</Divider>
                              <Button type="link" onClick={() => this.removeSelected()} icon={<DeleteRowOutlined />}>Remove selected</Button>
                              */}
                          </Col>
                      </Row>
                  </Col>
              </Row>
          </div>
      </div>
  }
}

export default CensusPage
