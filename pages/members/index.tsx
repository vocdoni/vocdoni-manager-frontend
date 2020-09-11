import { useContext, Component, ReactText } from 'react'
import { Row,
    Col,
    Divider,
    Table,
    Select,
    Button,
    message,
    Typography,
    Modal,
    Form,
    Input,
} from 'antd'
import { TagOutlined, DownloadOutlined, ExportOutlined, InstagramFilled } from '@ant-design/icons'
import Router from 'next/router'
import Link from 'next/link'
import { DVoteGateway } from 'dvote-js/dist/net/gateway'
// import moment from 'moment'
import { addCensus, addClaimBulk, publishCensus } from 'dvote-js/dist/api/census'

import { getNetworkState, getGatewayClients } from '../../lib/network'
import { ITarget, ITag, IMember } from '../../lib/types'
import AppContext, { IAppContext } from '../../components/app-context'
import InviteTokens from '../../components/invite-tokens'

const { Paragraph } = Typography;
const defaultPageSize = 50
const  validationUrlPrefix = "https://"+process.env.APP_LINKING_DOMAIN+"/validation"


const MembersPage = props => {
    const context = useContext(AppContext)
    return <Members {...context} />
}

type State = {
    targets?: ITarget[],
    tags?: ITag[],
    selectedTarget?: string,
    selectedTag?: string,
    selectedRows?: any[],
    selectedRowsKeys?: ReactText[],
    data: IMember[],
    pagination: { current: number, defaultPageSize?: number, pageSize?: number },
    total: number,
    loading: boolean,
    error?: any,
    inviteTokensModalVisibility: boolean,
    censusNameModalvisible: boolean,

    censusGateway: DVoteGateway,
}

class Members extends Component<IAppContext, State> {
    state: State = {
        targets: [],
        tags: [],
        selectedTarget: '',
        selectedTag: '',
        selectedRows: [],
        selectedRowsKeys: [],
        data: [],
        pagination: {
            current: 1,
            defaultPageSize: defaultPageSize,
        },
        total: 0,
        loading: false,
        censusGateway: null,
        inviteTokensModalVisibility: false,
        censusNameModalvisible: false,
    }

    async componentDidMount() {
        if (getNetworkState().readOnly) {
            return Router.replace("/entities" + location.hash)
        }

        this.props.setMenuSelected("members")

        const count  = await this.fetchCount()
        if (count) {
            this.fetch()
            this.fetchTargets()
        }
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

    fetchCount(): Promise<number>{
        return this.props.managerBackendGateway.sendMessage({ method: "countMembers" } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                const count = result.count || 0
                this.setState({ total: count})
                if (!count) {
                    message.warning("No members were found")
                }
                return Promise.resolve(count)
            }, (error) => {
                message.error("Could not fetch the members count")
                console.log(error)
                this.setState({ error })
                return Promise.resolve(0)
            })
    }

    fetchTargets() {
        this.props.managerBackendGateway.sendMessage({ method: "listTargets" } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({ targets: result.targets })
            }, (error) => {
                message.error("Could not fetch the targets data")
                this.setState({ error })
            })
    }

    fetchTags() {
        this.props.managerBackendGateway.sendMessage({ method: "listTags" } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({ tags: result.tags })
            }, (error) => {
                message.error("Could not fetch the tags data")
                this.setState({ error })
            })
    }

    async fetch(params: any = {}) {
        this.setState({ loading: true })

        const request = {
            method: "listMembers",
            listOptions: { ...{ skip: (this.state.pagination.current - 1) * this.state.pagination.pageSize, count: this.state.pagination.pageSize }, ...params.listOptions },
            filter: params.filter
        }

        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                result.members.map(member => {
                    member.validated= ('publicKey' in member && member.publicKey != null) ? "Yes" : "No"
                })
                this.setState({
                    loading: false,
                    data: result.members,
                    pagination: {
                        ...params.pagination,
                    },
                })
            }, (error) => {
                message.error("Could not fetch the members data")
                this.setState({
                    loading: false,
                    error
                })
            }
            )
    }

    deleteMember(record: any) {
        this.props.managerBackendGateway.sendMessage({ method: "deleteMember", memberId: record.id } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not delete the member"
                    message.error(error)
                    this.setState({ error })
                    return false
                }

                message.success("Member has been deleted")
                const data = this.state.data.filter(item => item.id !== record.id)
                this.setState({ data })

                this.fetchCount()
            }, (error) => {
                message.error("Could not delete the member")
                this.setState({ error })
            })
    }

    exportTokens() {
        this.props.managerBackendGateway.sendMessage({ method: "exportTokens" } as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok || !result.membersTokens) {
                    const error = "Could not generate the validation links"
                    message.error(error)
                    this.setState({ error })
                    return false
                }
                let data  = result.membersTokens
                if (data.length > 0) {
                    data = data
                        .filter( x => x.emails.length>0 && x.tokens.length >0 )
                        .map( entry => entry.emails + ',' + entry.tokens +',' +  validationUrlPrefix+'/'+this.props.entityId+'/'+entry.tokens)
                }
                data = (data || []).join("\n")
                const element = document.createElement("a")
                const file = new Blob([data], { type: 'text/csv;charset=utf-8' })
                element.href = URL.createObjectURL(file)
                element.download = "invitation-links.csv"
                document.body.appendChild(element)
                element.click()
            }, (error) => {
                message.error("Could not export the tokens")
                this.setState({ error })
            })
    }

    showCensusNameModal() {
        this.setState({
            censusNameModalvisible: true,
        });

    }


    createCensus(input) {
        // Defaulting targets
        const targetId = this.state.targets[0].id
        const targetName = this.state.targets[0].name

        const request = { method: "dumpTarget", targetID: targetId }
        const wallet = this.props.web3Wallet.getWallet()
        this.props.managerBackendGateway.sendMessage(request as any, wallet)
            .then(async (result) => {
                if (!result.ok) {
                    const error = "Could not export the census"
                    message.error(error)
                    this.setState({ error })
                    return false
                }
                if (!result.claims) {
                    const error = "No claims found to export"
                    message.error(error)
                    this.setState({ error })
                    return false
                }

                //const censusName = targetName + '_' + (Math.floor(Date.now() / 1000));
                const censusName = input.name || targetName + '_' + (Math.floor(Date.now() / 1000))
                const gateway = await getGatewayClients()
                // tslint:disable-next-line
                const { censusId } = await addCensus(censusName, [wallet["signingKey"].publicKey], gateway, wallet)
                const { merkleRoot, invalidClaims } = await addClaimBulk(censusId, result.claims, true, gateway, wallet)
                if (invalidClaims.length > 0) {
                    message.warn(`Found ${invalidClaims.length} invalid claims`)
                }
                // TODO: Show information about found claims and invalidClaims?

                const merkleTreeUri = await publishCensus(censusId, gateway, wallet)

                this.registerCensus(censusId, censusName, merkleRoot, merkleTreeUri, targetId)
            }, (error) => {
                message.error("Could not export the census")
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

                message.success("Census has been exported")
                Router.replace("/census/view#/" + this.props.entityId + "/" + censusId.split('/')[1])
            }, (error) => {
                message.error("Could not register the census")
                this.setState({ error })
                console.log(error)
            })
    }

    onTargetChange(target: string) {
        const pagination = { current: 1 }
        this.setState({ selectedTarget: target, pagination })
        this.handleTableChange(pagination, { target, tag: this.state.selectedTag })
    }

    onTagChange(tag: string) {
        const pagination = { current: 1}
        this.setState({ selectedTag: tag, pagination })
        this.handleTableChange(pagination, { tag, target: this.state.selectedTarget })
    }

    onRowSelection(keys: ReactText[], rows: any[]) {
        this.setState({ selectedRowsKeys: keys, selectedRows: rows })
    }

    generateLink(text, record, index) {
        return <Link href={"/members/view#/" + this.props.entityId + "/" + record.id}><a>{text}</a></Link>
    }

    render() {
        const censusNameModalvisible = this.state.censusNameModalvisible
        const columns = [
            { title: 'First Name', dataIndex: 'firstName', sorter: true, render: (text, record, index) => this.generateLink(text, record, index)  },
            { title: 'Last Name', dataIndex: 'lastName', sorter: true, render: (text, record, index) => this.generateLink(text, record, index)  },
            { title: 'Email', dataIndex: 'email', sorter: true, render: (text, record, index) => this.generateLink(text, record, index)  },
            { title: 'Validated', dataIndex: 'validated', render: (text, record, index) => this.generateLink(text, record, index) },
            /*
                { title: 'id', dataIndex: 'id', sorter: false, render: (text, record, index) => this.generateLink(text, record, index) },
                { title: 'Age', dataIndex: 'dateOfBirth', render: (dateOfBirth) => (
                        <>{moment().diff(dateOfBirth, 'years', false) }</>
                )},
                { title: 'Tags', dataIndex: 'tags', render: (tags: any) => (
                        <>
                                { tags && tags.map((item) => {
                                        return <Tag color={"green"} key={item}>{item}</Tag>
                                })}
                        </>
                )},

            {
                title: 'Actions', key: 'action', render: (text, record, index) => (
                    <Space size="middle">
                        <Link href={"/members/view#/" + this.props.entityId + "/" + record.id}><a>View</a></Link>
                        <a onClick={() => this.deleteMember(record)}>Delete</a>
                    </Space>)
            },
            */
        ]

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={40} justify="start">
                    <Col xs={{ span: 24, order: 2 }} lg={{ span: 18, order: 1 }}>
                        <Divider orientation="left">Member list</Divider>
                        <Paragraph>This is the list of members of your entity.
                            From here you can generate validation links so that they can register and give them the right to vote. <br />
                            You will be able to create censuses for voting processes with those members who are registered.</Paragraph>
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={this.state.data}
                            pagination={{ ...this.state.pagination, ...{ total: this.state.total } }}
                            loading={this.state.loading}
                            onChange={(pagination, filters, sorter) => this.handleTableChange(pagination, filters, sorter)}
                            className='scroll-x'
                        />
                    </Col>
                    <Col xs={{ span: 24, order: 1 }} lg={{ span: 6, order: 2 }}>
                        <Row>
                            <Col span={24}>
                                {false && ((this.state.targets && this.state.targets.length > 0) || (this.state.tags && this.state.tags.length > 0)) &&
                                    <Divider orientation="left">Filters</Divider>
                                }
                                {false && this.state.targets && this.state.targets.length > 0 &&
                                    <Select
                                        onChange={(val) => this.onTargetChange(val)}
                                        defaultValue={"Select a target..."}
                                        placeholder={"Select a target..."}
                                        allowClear={true}
                                        style={{ width: '100%', marginBottom: "1em" }}
                                    >
                                        {this.state.targets.map((t) => <Select.Option key={t.name} value={t.name}>{t.name}</Select.Option>)}
                                    </Select>
                                }

                                {this.state.tags && this.state.tags.length > 0 &&
                                    <Select
                                        onChange={(val) => this.onTagChange(val)}
                                        defaultValue={"Select a tag..."}
                                        placeholder={"Select a tag..."}
                                        allowClear={true}
                                        style={{ width: '100%' }}
                                    >
                                        {this.state.tags.map((t) => <Select.Option key={t.name} value={t.name}>{t.name}</Select.Option>)}
                                    </Select>
                                }
                            </Col>
                            {this.state.selectedRows.length > 0 &&
                                <Col span={24}>
                                    <Divider orientation="left">Batch Actions</Divider>
                                    <p>You have selected {this.state.selectedRows.length} items</p>
                                    <Button type="link" icon={<TagOutlined />}>Add Tag to selection</Button>
                                </Col>
                            }
                            <Col span={24}>
                                <Divider orientation="left">Tools</Divider>
                                {/*
                                <Paragraph>explainer...</Paragraph>
                                <Button onClick={() => this.setState({inviteTokensModalVisibility: true})} block type="ghost" icon={<DownloadOutlined />}>Generate Invite Tokens</Button>
                                <br /> <br />
                                */}
                                <Paragraph>Validation links are used to register members in your organization.
                                    Download the list of links and send each member their link so they can register.</Paragraph>
                                <Button onClick={() => this.exportTokens()} block type="ghost" icon={<DownloadOutlined />}>Download Validation Links</Button>
                                <br /> <br />
                                <Paragraph>You can create censuses to give voting rights to users who have been previously validated.</Paragraph>
                                {/*
                                <Button onClick={() => this.createCensus()} block type="primary" icon={<ExportOutlined />}>Create Voting Census</Button>
                                */}
                                <Button onClick={() => this.showCensusNameModal()} block type="primary" icon={<ExportOutlined />}>Create Voting Census</Button>
                                <Modal
                                    title="Enter Census Name"
                                    visible={censusNameModalvisible}
                                    confirmLoading={false}
                                    closable={false}
                                    footer={false}
                                >
                                    <Form onFinish={this.createCensus.bind(this)}>
                                        <Form.Item name='name'>
                                            <Input type='text' max='800' step='1' min='1' />
                                        </Form.Item>
                                        <Form.Item>
                                            <Button key='back' onClick={() => this.setState({censusNameModalvisible: false})}>
                                                Cancel
                                            </Button>
                                            <Button type='primary' htmlType='submit'>
                                                Create
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </Modal>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
            <InviteTokens
                {...this.props}
                visible={this.state.inviteTokensModalVisibility}
                onCancel={() => this.setState({inviteTokensModalVisibility: false})}
                onError={(error) => {
                    message.error("Could not generate invite tokens")
                    this.setState({ error })
                }}
            />
        </div>
    }
}

export default MembersPage
