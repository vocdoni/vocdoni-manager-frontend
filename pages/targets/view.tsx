import React, { useContext, Component } from 'react'
import { Row, Col, Divider, Table, Button, Form, Input, message, Select } from 'antd'
import Router from 'next/router'
import { SaveOutlined, ExportOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { FormInstance } from 'antd/lib/form'
import TextArea from 'antd/lib/input/TextArea'
import { addCensus, addClaimBulk, publishCensus } from 'dvote-js/dist/api/census'

import AppContext, { IAppContext } from '../../components/app-context'
import { IMember, ITarget } from '../../lib/types'
import { getNetworkState, getGatewayClients } from '../../lib/network'

const TargetViewPage = props => {
    const context: IAppContext = useContext(AppContext)
    return <TargetView {...context} />
}

type State = {
    entityId?: string,
    targetId?: string,
    target?: ITarget,
    data?: IMember[],
    pagination: { current: number, pageSize: number },
    loading: boolean,
    error?: any,
}

class TargetView extends Component<IAppContext, State> {
    state: State = {
        pagination: {
            current: 1,
            pageSize: 10,
        },
        loading: false,
    }

    formRef = React.createRef<FormInstance>()

    async componentDidMount() {
        if (getNetworkState().readOnly) {
            return Router.replace("/entities" + location.hash)
        }

        this.props.setMenuSelected("targets")

        const hash = location.hash.split('/')
        const entityId = hash[1]
        const targetId = hash[2]
        this.setState({ entityId, targetId }, () => this.fetch())
    }

    handleTableChange(pagination: any, filters: any, sorter: any = { field: undefined, order: undefined }) {
        this.fetch({
            listOptions: {
                skip: (pagination.current - 1) * pagination.pageSize,
                count: pagination.pageSize,
                sortBy: sorter.field,
                order: sorter.order,
            },
            filter: { ...filters },
            pagination
        })
    }

    fetch(params: any = {}) {
        this.setState({ loading: true })

        const request = {
            method: "getTarget",
            targetID: this.state.targetId,
            listOptions: { ...{ skip: (this.state.pagination.current - 1) * this.state.pagination.pageSize, count: this.state.pagination.pageSize }, ...params.listOptions },
            filter: params.filter
        }

        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({
                    loading: false,
                    target: result.target,
                    data: result.members,
                    pagination: {
                        ...params.pagination,
                        // TODO: SET THE TOTAL COUNT FROM ANOTHER CALL?
                        // total: result.totalCount,
                    },
                })
            }, (error) => {
                message.error("Could not fetch the targets data")
                this.setState({ loading: false, error })
            })
    }

    onSaveTargetChanges() {
        this.formRef.current.submit()
    }

    onFinish(values) {

        let request: {
            method: string,
            target: [],
            id?: string
        } = {
            method: 'addTarget',
            target: values,
        }

        if (this.state.targetId) {
            request = {
                method: 'updateTarget',
                id: this.state.targetId,
                target: values,
            }
        }

        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not save the target"
                    message.error(error)
                    this.setState({ error })
                    return false
                }
                message.success("Target has been saved")
            }, (error) => {
                message.error("Could not fetch the target data")
                this.setState({ error })
            })
    }

    exportTarget() {
        const request = { method: "dumpTarget", targetID: this.state.targetId }
        const wallet = this.props.web3Wallet.getWallet()
        this.props.managerBackendGateway.sendMessage(request as any, wallet)
            .then(async (result) => {
                if (!result.ok) {
                    const error = "Could not export the target"
                    message.error(error)
                    this.setState({ error })
                    return false
                }

                const censusName = this.state.target.name + '_' + (Math.floor(Date.now() / 1000));
                const gateway = await getGatewayClients()
                // tslint:disable-next-line
                const { censusId, merkleRoot } = await addCensus(censusName, [wallet["signingKey"].publicKey], gateway, wallet)
                //   console.log('censusId is', censusId)
                const { invalidClaims } = await addClaimBulk(censusId, result.claims, true, gateway, wallet)

                // TODO: Show information about found claims and invalidClaims?

                const merkleTreeUri = await publishCensus(censusId, gateway, wallet)

                this.registerCensus(censusId, censusName, merkleRoot, merkleTreeUri, this.state.targetId)
            }, (error) => {
                message.error("Could not export the target")
                this.setState({ error })
            })
    }

    async registerCensus(censusId, name, merkleRoot, merkleTreeUri, targetId) {
        const regRequest = {
            method: "addCensus",
            censusId,
            targetId,
            census: { name, merkleRoot, merkleTreeUri }
        }

        this.props.managerBackendGateway.sendMessage(regRequest as any, this.props.web3Wallet.getWallet())
            .then(async (result) => {
                if (!result.ok) {
                    const error = "Could not register the census"
                    message.error(error)
                    this.setState({ error })
                    return false
                }

                message.success("Target has been exported")
                Router.replace("/census/edit#/" + this.props.entityId)
            },
            (error) => {
                message.error("Could not register the census")
                this.setState({ error })
                console.log(error)
            })
    }

    deleteTarget() {
        const request = { method: "deleteTarget", targetID: this.state.targetId }
        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not delete the target"
                    message.error(error)
                    this.setState({ error })
                    return false
                }

                message.success("Target has been deleted")
                Router.replace("/targets#/" + this.state.entityId)
            },
            (error) => {
                message.error("Could not delete the target")
                this.setState({ error })
            })
    }

    render() {
        const columns = [
            { title: 'Name', dataIndex: 'firstName', key: 'firstName' },
            { title: 'Last Name', dataIndex: 'lastName', key: 'lastName' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
        ]

        // TODO
        // Resetting this as an array for now...
        const target = this.state.target
        if (target && Object.keys(target.filters).length === 0) {
            target.filters = []
        }

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={40} justify="start">
                    <Col xs={{ span: 24, order: 2 }} lg={{ span: 18, order: 1 }}>
                        <Divider orientation="left">Target details</Divider>
                        {this.state.target &&
                            <Form
                                layout="vertical"
                                onFinish={(values) => this.onFinish(values)}
                                ref={this.formRef}
                                initialValues={target}
                            >
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item label="Target Name" name="name" rules={[{ required: true, message: 'Please input a target name' }]}>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Please input a description' }]}>
                                            <TextArea />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <h4>Target Filters</h4>
                                        <Form.List name="filters">
                                            {(fields, { add, remove }) => {
                                                return (
                                                    <div>
                                                        {fields && fields.length > 0 && fields.map(field => (
                                                            <Row gutter={8} key={field.key}>
                                                                <Col span={8}>
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'field']}
                                                                        rules={[{ required: true, message: 'Missing field' }]}
                                                                    >
                                                                        <Select options={[
                                                                            { label: "Name", value: "name" },
                                                                            { label: "Lastname", value: "lastname" },
                                                                            { label: "Email", value: "email" },
                                                                            { label: "Date of Birth", value: "dateOfBirth" },
                                                                            { label: "Tags", value: "tags" }
                                                                        ]} />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={8}>
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'operator']}
                                                                        rules={[{ required: true, message: 'Missing operator' }]}
                                                                    >
                                                                        <Select options={[
                                                                            { label: "Contains", value: "contains" },
                                                                            { label: "Not Contains", value: "not-contains" },
                                                                            { label: "Is", value: "is" },
                                                                            { label: "Is not", value: "is-not" },
                                                                        ]} />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={7}>
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'value']}
                                                                        rules={[{ required: true, message: 'Missing value' }]}
                                                                    >
                                                                        <Input placeholder="Value" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={1} style={{ paddingTop: "5px" }}>
                                                                    <MinusCircleOutlined
                                                                        onClick={() => {
                                                                            remove(field.name);
                                                                        }}
                                                                    />
                                                                </Col>
                                                            </Row>
                                                        ))}

                                                        <Form.Item>
                                                            <Button
                                                                type="dashed"
                                                                onClick={() => {
                                                                    add();
                                                                }}
                                                                block
                                                            >
                                                                <PlusOutlined /> Add filter
                                                            </Button>
                                                        </Form.Item>
                                                    </div>
                                                );
                                            }}
                                        </Form.List>
                                    </Col>
                                </Row>
                            </Form>
                        }

                        <Divider orientation="left">Matching members</Divider>
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={this.state.data}
                            pagination={false}
                            loading={this.state.loading}
                            onChange={(pagination, filters, sorter) => this.handleTableChange(pagination, filters, sorter)}
                        />
                    </Col>

                    <Col xs={{ span: 24, order: 1 }} lg={{ span: 6, order: 2 }}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <Divider orientation="left">Actions</Divider>
                                <Button type="link" onClick={() => this.onSaveTargetChanges()} icon={<SaveOutlined />}>Save changes</Button>
                                {this.state.targetId && <Button type="link" onClick={() => this.deleteTarget()} icon={<DeleteOutlined />}>Remove the target</Button>}
                                {this.state.targetId && <Button type="link" onClick={() => this.exportTarget()} icon={<ExportOutlined />}>Export as census</Button>}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    }
}

export default TargetViewPage
