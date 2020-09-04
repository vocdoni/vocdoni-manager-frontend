import React, { useContext, Component, ReactText } from 'react'
import { Row, Col, Divider, Table, Button, Space, Form, Input, message, Tag } from 'antd'
import Router from 'next/router'
import { AimOutlined, DeleteRowOutlined } from '@ant-design/icons'
import Link from 'next/link'

import { getNetworkState } from '../../lib/network'
import { ITarget } from '../../lib/types'
import AppContext, { IAppContext } from '../../components/app-context'

const TargetsPage = props => {
    const context = useContext(AppContext)
    return <Targets {...context} />
}

type State = {
    entityId?: string,
    selectedRows?: any[],
    selectedRowsKeys?: ReactText[],
    data?: ITarget[],
    pagination: {current: number, pageSize: number},
    total: number,
    loading: boolean,
    error?: any,
}

class Targets extends Component<IAppContext, State> {
    state: State = {
        pagination: {
            current: 1,
            pageSize: 10,
        },
        total:0,
        loading: false,
        selectedRows: [],
        selectedRowsKeys: [],
    }

    async componentDidMount() {
        if (getNetworkState().readOnly) {
            return Router.replace("/entities" + location.hash)
        }

        this.props.setMenuSelected("targets")

        const hash = location.hash.split('/')
        const entityId = hash[1]
        this.setState({ entityId })

        this.fetchCount()
        this.fetch()
    }

    fetch(params: any = {}) {
        this.setState({ loading: true })

        const request = {
            method: "listTargets",
            listOptions: { ...{ skip: (this.state.pagination.current - 1) * this.state.pagination.pageSize, count: this.state.pagination.pageSize }, ...params.listOptions },
            filter: params.filter
        }

        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({
                    loading: false,
                    data: result.targets,
                    pagination: {
                        ...params.pagination,
                    },
                })
            },
            (error) => {
                message.error("Could not fetch the targets data")
                this.setState({loading: false, error})
            })
    }

    fetchCount() {
        this.props.managerBackendGateway.sendMessage({ method: "countTargets" } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({total: result.count})
            },
            (error) => {
                message.error("Could not fetch the targets count")
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

    deleteTarget(record: any) {
        this.props.managerBackendGateway.sendMessage({ method: "deleteTarget", id: record.id } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not delete the target"
                    message.error(error)
                    this.setState({error})
                    return false
                }

                const data = this.state.data.filter(item => item.id !== record.id)
                this.setState({ data })
            },
            (error) => {
                message.error("Could not delete the target")
                this.setState({error})
            })
    }

    onRowSelection(keys: ReactText[], rows: any[]) {
        this.setState({selectedRowsKeys: keys, selectedRows: rows})
    }

    removeSelected() {
        // const data = this.state.data.filter(item => !this.state.selectedRowsKeys.includes(item.id))
        // this.setState({ data })
        this.state.selectedRows.forEach((v) => this.deleteTarget(v))
    }

    render() {
        const columns = [
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Filters', dataIndex: 'filters', key: 'filters', render: (filters: any) => (
                <>
                    { filters && filters.length > 0 && filters.map((i, index) => {
                        return <Tag color={"gold"} key={index}>{`${i.field}:${i.operator}:${i.value}`}</Tag>
                    })}
                </>
            )},
            { title: 'Actions', key: 'action', render: (text, record, index) => (
                <Space size="middle">
                    <Link href={"/targets/view#/" + this.props.entityId + "/" + record.id}><a>View</a></Link>
                    <a onClick={() => this.deleteTarget(record)}>Delete</a>
                </Space>)},
        ]

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={40} justify="start">
                    <Col xs={{span: 24, order: 2}} lg={{span: 18, order: 1}}>
                        <Divider orientation="left">Target list</Divider>
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={this.state.data}
                            pagination={{...this.state.pagination, ...{total: this.state.total}}}
                            loading={this.state.loading}
                            rowSelection={{
                                type: 'checkbox',
                                onChange: (keys, rows) => this.onRowSelection(keys, rows)
                            }}
                        />
                    </Col>

                    <Col xs={{span: 24, order: 1}} lg={{span: 6, order: 2}}>
                        <Row gutter={[0,24]}>
                            <Col span={24}>
                                <Divider orientation="left">Actions</Divider>
                                <Link href={"/targets/view#/" + this.props.entityId}>
                                    <Button type="link" icon={<AimOutlined />}>Add a new target</Button>
                                </Link>
                                <Button type="link" onClick={() => this.removeSelected()} icon={<DeleteRowOutlined />}>Remove selected</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    }
}

export default TargetsPage
