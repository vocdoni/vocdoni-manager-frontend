import { useContext, Component, ReactText } from 'react'
import {
    Button,
    Col,
    Divider,
    Dropdown,
    Form,
    Input,
    Menu,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Table,
    Tag,
    Typography,
} from 'antd'
import {
    DashOutlined,
    DownloadOutlined,
    ExportOutlined,
} from '@ant-design/icons'
import Router from 'next/router'
import Link from 'next/link'
import { DVoteGateway } from 'dvote-js'
// import moment from 'moment'

import { getNetworkState } from '../../lib/network'
import { ITarget, IMember } from '../../lib/types'
import AppContext, { IAppContext } from '../../components/app-context'
import InviteTokens from '../../components/invite-tokens'
import InviteMember from '../../components/invite-member'
import BulkActions from '../../components/bulk-actions'
import TagsManagement from '../../components/tags-management'

const { Paragraph } = Typography;
const defaultPageSize = 50
const  validationUrlPrefix = "https://"+process.env.APP_LINKING_DOMAIN+"/validation"


const MembersPage = () => {
    const context = useContext(AppContext)
    return <Members {...context} />
}

type State = {
    targets?: ITarget[],
    tags: any[],
    selectedTarget?: string,
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
    actionsMenuOpen: any
    visibleBulkActions: boolean,
    censusLoading: boolean,
}

class Members extends Component<IAppContext, State> {
    state: State = {
        targets: [],
        tags: [],
        selectedTarget: '',
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
        actionsMenuOpen: {},
        visibleBulkActions: false,
        censusLoading: false,
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
            this.fetchTags()
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
        return this.props.managerBackendGateway.sendRequest({ method: "countMembers" } as any, this.props.web3Wallet.getWallet())
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
        this.props.fetchTargets().then((result) => {
            this.setState({ targets: result.targets })
        }, (error) => {
            message.error("Could not fetch the targets data")
            this.setState({ error })
        })
    }

    fetchTags() {
        return this.props.managerBackendGateway.sendRequest({ method: "listTags" } as any, this.props.web3Wallet.getWallet())
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

        return this.props.managerBackendGateway.sendRequest(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                this.setState({
                    loading: false,
                    data: result.members,
                    pagination: {
                        ...params.pagination,
                    },
                })
            }, (error) => {
                console.error(error)
                message.error("Could not fetch the members data")
                this.setState({
                    loading: false,
                    error
                })
            }
            )
    }

    deleteMember(id: string) {
        this.props.managerBackendGateway.sendRequest(
            {
                method: 'deleteMembers',
                memberIDs: [id],
            } as any,
            this.props.web3Wallet.getWallet()
        ).then((result) => {
            if (!result.ok) {
                const error = 'Could not delete the member'
                message.error(error)
                this.setState({ error })
                return false
            }

            message.success('Member has been deleted')

            const data = this.state.data.filter(item => item.id !== id)
            this.setState({ data })

            this.fetchCount()
        }, (error) => {
            message.error('Could not delete the member')
            this.setState({ error })
        })
    }

    exportTokens() {
        this.props.managerBackendGateway.sendRequest({ method: "exportTokens" } as any, this.props.web3Wallet.getWallet())
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
                        .map( entry => entry.emails + ',' + entry.tokens +',' +  validationUrlPrefix+'/'+this.props.address+'/'+entry.tokens)
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
        })
    }

    async createCensus(censusName: string, id: string, name: string) {
        this.setState({censusLoading: true})

        try {
            const {census} = await this.props.createCensusForTarget(censusName, {id, name}, false)
            const [, censusPath] = census.split('/')

            message.success('Census has been exported')
            Router.replace(`/census/view/#/${this.props.address}/${censusPath}`)

        } catch (err) {
            const error = err?.message ? err?.message : err
            message.error(error)
            this.setState({
                error,
                censusLoading: false,
            })
        }
    }

    onTagsChange(selectedTags: string[], values: any[], options: any[], tags: any[]) : void {
        let diff = []
        const adding = selectedTags.length < values.length
        if (adding) {
            diff = values.filter((t) => !selectedTags.includes(t))
        } else {
            diff = selectedTags.filter((t) => !values.includes(t))
        }
        diff = diff.map((tag) => tags.find((t) => t.name === tag).id)
        const tagID = Number(diff.pop())
        const memberIds = []
        this.state.selectedRows.forEach((row) => {
            if (!adding && !row.tags?.length) {
                // current selection actually has no tags attached, skip
                return
            }
            memberIds.push(row.id)
        })
        const req : any = {
            method: adding ? 'addTag' : 'removeTag',
            memberIds,
            tagID,
        }
        this.setState({loading: true})

        this.props.managerBackendGateway.sendRequest(req, this.props.web3Wallet.getWallet()).then((res) => {
            if (res.ok) {
                const data : IMember[] = [...this.state.data]
                data.forEach((row, key) => {
                    if (!memberIds.includes(row.id)) {
                        return
                    }
                    let tagIds : number[] = []
                    if (row.tags?.length) {
                        tagIds = row.tags
                    }
                    if (adding) {
                        tagIds.push(tagID)
                    } else {
                        tagIds = tagIds.filter((tag) => tag !== tagID)
                    }
                    data[key].tags = tagIds
                })
                return this.setState({
                    data,
                    tags,
                    loading: false,
                })
            }

            message.error("There was an error updating the members' tags")
        })
    }

    onTargetChange(target: string) {
        const pagination = { current: 1 }
        this.setState({ selectedTarget: target, pagination })
        this.handleTableChange(pagination, { target })
    }

    onRowSelection(keys: ReactText[], rows: any[]) {
        this.setState({ selectedRowsKeys: keys, selectedRows: rows })
    }

    render() {
        const actionsMenu = (record) => {
            const items = [
                <Menu.Item key='edit'>
                    <Link href={`/members/view#/${this.props.address}/${record.id}`}>
                        <a>Edit</a>
                    </Link>
                </Menu.Item>,
                <Menu.Item danger key='remove'>
                    <Popconfirm
                        title={`Are you sure you want to delete ${record.firstName} ${record.lastName}?`}
                        okText='Delete'
                        okType='primary'
                        cancelText='Cancel'
                        onConfirm={this.deleteMember.bind(this, record.id)}
                    >
                        <a>Delete</a>
                    </Popconfirm>
                </Menu.Item>
            ]

            if (!record.publicKey?.length) {
                items.unshift(
                    <Menu.Item key='invite'>
                        <InviteMember member={record} {...this.props}>
                            Send validation email
                        </InviteMember>
                    </Menu.Item>
                )
            }

            return <Menu>{items}</Menu>
        }

        const censusNameModalvisible = this.state.censusNameModalvisible
        const columns = [
            { title: 'First Name', dataIndex: 'firstName', sorter: true },
            { title: 'Last Name', dataIndex: 'lastName', sorter: true },
            { title: 'Email', dataIndex: 'email', sorter: true },
            { title: 'Validated', dataIndex: 'validated', render: (text, record) => {
                if (record?.publicKey?.length) {
                    return <span>Yes</span>
                }
                return <span>No</span>
            }},
            /*
            { title: 'id', dataIndex: 'id', sorter: false },
            { title: 'Age', dataIndex: 'dateOfBirth', render: (dateOfBirth) => (
                    <>{moment().diff(dateOfBirth, 'years', false) }</>
            )},
            */
            { title: 'Tags', dataIndex: 'tags', render: (tags: any) => (
                <>
                    { tags && tags.map((item) => {
                        if (!this.state.tags.length) {
                            return
                        }
                        const {id, name} = this.state.tags.find((t) => t.id === Number(item))
                        return <Tag color={"green"} key={id}>{name}</Tag>
                    })}
                </>
            )},

            {
                title: 'Actions', key: 'action', render: (text, record) => (
                    <Dropdown
                        overlay={actionsMenu(record)}
                        visible={this.state.actionsMenuOpen[record.id]}
                        onVisibleChange={(flag) => {
                            this.setState({
                                actionsMenuOpen: {
                                    ...this.state.actionsMenuOpen,
                                    [record.id]: flag,
                                }
                            })
                        }}
                    >
                        <a className='ant-dropdown-link' onClick={(e) => e.preventDefault()}>
                            <DashOutlined />
                        </a>
                    </Dropdown>
                )
            },
        ]

        let selectedTags = []
        if (this.state.tags?.length && this.state.selectedRows?.length) {
            this.state.selectedRows.forEach((row) => {
                if (!row.tags?.length) {
                    return
                }
                const tags = this.state.tags.filter((tag) => row.tags.includes(tag.id))
                selectedTags = Array.from(new Set([
                    ...selectedTags,
                    ...tags.map((tag) => tag.name),
                ]))
            })
        }

        const tagsCol = {
            xs: 24,
            md: 17,
            xl: 20,
        }
        const bulkCol = {
            xs: 24,
            md: 7,
            xl: 4,
        }

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={40} justify="start">
                    <Col xs={{ span: 24, order: 2 }} lg={{ span: 18, order: 1 }}>
                        <Divider orientation="left">Member list</Divider>
                        <Paragraph>
                            This is the list of members of your entity. From here
                            you can generate validation links so that they can
                            register and give them the right to vote.
                        </Paragraph>
                        <Paragraph>
                            You will be able to create censuses for voting
                            processes with those members who are registered.
                        </Paragraph>
                        <Row>
                            <Col {...tagsCol}>
                                <TagsManagement
                                    {...this.props}
                                    onChange={this.onTagsChange.bind(this, selectedTags)}
                                    onDeleted={(tags) => {
                                        this.fetch().then(() => {
                                            this.setState({
                                                tags,
                                                loading: false,
                                            })
                                        })
                                    }}
                                    onActionCall={() => {
                                        this.setState({loading: true})
                                    }}
                                    onActionComplete={() => {
                                        this.setState({loading: false})
                                    }}
                                    disabled={!this.state.selectedRows?.length}
                                    selectedTags={selectedTags}
                                />
                            </Col>
                            <Col {...bulkCol}>
                                <BulkActions
                                    disabled={!this.state.selectedRows?.length}
                                    ids={this.state.selectedRows.map((row) => row.id)}
                                    onDeleted={() => {
                                        this.fetch()
                                        this.setState({
                                            visibleBulkActions: false,
                                            loading: false,
                                        })
                                    }}
                                    visible={this.state.visibleBulkActions}
                                    onVisibleChange={(visible) => {
                                        this.setState({visibleBulkActions: visible})
                                    }}
                                    onActionCall={() => {
                                        this.setState({loading: true})
                                    }}
                                    onActionComplete={async () => {
                                        await this.fetchTags()
                                        await this.fetch()
                                        this.setState({loading: false})
                                    }}
                                    {...this.props}
                                />
                            </Col>
                        </Row>
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={this.state.data}
                            pagination={{ ...this.state.pagination, ...{ total: this.state.total } }}
                            loading={this.state.loading}
                            onChange={(pagination, filters, sorter) => this.handleTableChange(pagination, filters, sorter)}
                            className='scroll-x'
                            rowSelection={{
                                type: 'checkbox',
                                onChange: this.onRowSelection.bind(this),
                            }}
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
                            </Col>
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
                                    <Form onFinish={async (values) => {
                                        // Defaulting targets
                                        const [target] = this.state.targets
                                        const {id, name} = target

                                        return await this.createCensus(values.name, id, name)
                                    }}>
                                        <Form.Item name='name'>
                                            <Input type='text' max='800' step='1' min='1' />
                                        </Form.Item>
                                        <Form.Item>
                                            <Button
                                                key='back'
                                                onClick={() => this.setState({censusNameModalvisible: false})}
                                                disabled={this.state.censusLoading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type='primary' htmlType='submit' disabled={this.state.censusLoading}>
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
