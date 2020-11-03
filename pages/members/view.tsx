import React, { useContext, Component } from 'react'
import moment from 'moment'
import Router from 'next/router'
import { Row, Col, Divider, Button, Form, Input, message, DatePicker, Modal, Descriptions, Popconfirm} from 'antd'
import { UserDeleteOutlined, SaveOutlined, ExclamationCircleOutlined, MailOutlined } from '@ant-design/icons'
import Paragraph from 'antd/lib/typography/Paragraph'
import { FormInstance } from 'antd/lib/form'

import AppContext, { IAppContext } from '../../components/app-context'
import InviteMember from '../../components/invite-member'
import { getNetworkState } from '../../lib/network'
import { ITarget, IMember } from '../../lib/types'
import { MOMENT_DATE_FORMAT_SQL } from '../../lib/constants'
import TagsManagement from '../../components/tags-management'

const validationUrlPrefix = "https://"+process.env.APP_LINKING_DOMAIN+"/validation"

const MemberViewPage = props => {
    const context = useContext(AppContext)
    return <MemberView {...context} />
}

type State = {
    entityId?: string,
    memberId?: string,
    member?: IMember,
    tags?: any[],
    changed: boolean
    tagsChanged: boolean
    targets?: ITarget[],
    pagination: {current: number, pageSize: number},
    loading: boolean,
    error?: any,
}

class MemberView extends Component<IAppContext, State> {
    state: State = {
        pagination: {
            current: 1,
            pageSize: 10,
        },
        loading: false,
        changed: false,
        tagsChanged: false,
    }

    formRef = React.createRef<FormInstance>()

    async componentDidMount() {
        if (getNetworkState().readOnly) {
            return Router.replace("/entities" + location.hash)
        }

        this.props.setMenuSelected("members")

        const hash = location.hash.split('/')
        const entityId = hash[1]
        const memberId = hash[2]
        this.setState({ entityId, memberId })
        this.fetchMember(memberId)
    }

    fetchMember(memberId: string) {
        const request = {
            method: 'getMember',
            memberId,
        }
        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then(({member, targets}) => {
                this.setState({
                    member,
                    targets,
                    tags : member.tags
                })
            },
            (error) => {
                message.error("Could not fetch the member data")
                this.setState({error})
            })
    }

    onSaveMemberChanges() {
        this.formRef.current.submit()
    }

    onFinish(values) {
        const member = {
            ...values,
            dateOfBirth: moment(values.dateOfBirth).format(),
            id: this.state.memberId,
        }
        // send tags only if their value changed
        if (this.state.tagsChanged) {
            member.tags = this.state.tags
        }
        const request = {
            method: 'updateMember',
            //   memberId: this.state.memberId,
            member,
        }

        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not save the member"
                    message.error(error)
                    this.setState({error})
                    return false
                }
                message.success("Member details have been saved")
                Router.push(`/members/#/${this.props.entityId}`)
            },
            (error) => {
                message.error("Could not save the member")
                console.log(error)
                this.setState({error})
            })
    }

    removeMember() {
        const request = { method: "deleteMember", memberIds: [this.state.memberId] }
        this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = "Could not delete the member"
                    message.error(error)
                    this.setState({error})
                    return false
                }

                message.success("Member has been deleted")
                Router.replace("/members#/" + this.state.entityId)
            },
            (error) => {
                message.error("Could not delete the member")
                this.setState({error})
            })
    }

    renderTokenInfo (validated: boolean, id: string, member: IMember) : JSX.Element {
        const result = [
            <Descriptions.Item key='token' label='Token'>{id}</Descriptions.Item>
        ]
        if (validated && member) {
            result.push(
                <Descriptions.Item key='verified' label='Validated On'>
                    {member.verified}
                </Descriptions.Item>
            )
        }
        return (
            <Descriptions column={1} layout='vertical' colon={false}>
                {result}
            </Descriptions>
        )
    }

    render() {
        const { member, memberId, tags } = this.state

        const columns = [
            {title: 'Validated', dataIndex: 'verified'},
            {/*
            { title: 'Name', dataIndex: 'name' },
            { title: 'Filters', dataIndex: 'filters', key: 'filters', render: (filters: any) => (
                <>
                    { filters && filters.length > 0 && filters.map((i, index) => {
                        return <Tag color={"gold"} key={index}>{`${i.field}:${i.operator}:${i.value}`}</Tag>
                    })}
                </>
            )},
            { title: 'Actions', key: 'action', render: (text, record, index) => ( <Space size="middle"></Space>)},
            */}
        ]

        const entityId = this.props.entityId
        const validated = (member && 'publicKey' in member && member['publicKey'] != null) ? true : false
        const link = (member) ? validationUrlPrefix+'/'+entityId+'/'+member.id : ''
        if (member) {
            member.dateOfBirth = moment(member.dateOfBirth)
        }
        let inviteActions
        if (!validated) {
            inviteActions = (
                <div>
                    <Paragraph>
                        <InviteMember {...this.props} member={this.state.member}>
                            Send validation e-mail <MailOutlined />
                        </InviteMember>
                    </Paragraph>
                    <Paragraph copyable={{ text: link  }}>
                        Copy Validation Link
                    </Paragraph>
                </div>
            )
        }

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={40} justify="start">
                    <Col xs={{span: 24, order: 2}} lg={{span: 18, order: 1}}>
                        <Divider orientation="left">Member ID</Divider>
                        {this.renderTokenInfo(validated, memberId, member)}
                        <Divider orientation="left">Member details</Divider>
                        {this.state.member &&
                    <Form
                        layout="vertical"
                        onFinish={(values) => this.onFinish(values)}
                        ref={this.formRef}
                        initialValues={member}
                        onFieldsChange={(e, values) => {
                            let changed = false
                            values.forEach((value: any) => {
                                const key = value.name.shift()
                                const val = value.value
                                if (key === 'dateOfBirth' && !changed) {
                                    changed = val.utc().format(MOMENT_DATE_FORMAT_SQL) !== member.dateOfBirth.utc().format(MOMENT_DATE_FORMAT_SQL)
                                    return
                                }
                                if (!changed && val !== member[key]) {
                                    changed = true
                                    return
                                }
                            })
                            this.setState({changed})
                        }}
                    >
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <Form.Item label="Name" name="firstName" rules={[{ required: true, message: 'Please input a First Name!' }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Please input a Last Name' }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid Email' }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true, message: 'Please input a Date Of Birth' }]}>
                                    <DatePicker format={'DD-MM-YYYY'} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <Form.Item label='Tags'>
                                    <TagsManagement
                                        {...this.props}
                                        selectedTagIds={Array.from(new Set(member.tags))}
                                        onChange={(tags, options) => {
                                            this.setState({
                                                changed: true,
                                                tagsChanged: true,
                                                tags: options.map((tag) => parseInt(tag.key, 10)),
                                            })
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={24} className='form-bottom'>
                                <Button
                                    size='large'
                                    type='primary'
                                    icon={<SaveOutlined />}
                                    onClick={this.onSaveMemberChanges.bind(this)}
                                    disabled={!this.state.changed}
                                >
                                    Save changes
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                        }
                        {/* <Divider orientation="left">Matching targets</Divider>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={this.state.targets}
                    pagination={false}
                    loading={this.state.loading}
                /> */}
                    </Col>

                    <Col xs={{span: 24, order: 1}} lg={{span: 6, order: 2}} className='detail-actions'>
                        <Row gutter={[0,24]}>
                            <Col span={24}>
                                <Divider orientation="left">Actions</Divider>
                                <Popconfirm
                                    title='Are you sure you want to delete this member?'
                                    okText='Delete'
                                    okType='primary'
                                    cancelText='Cancel'
                                    onConfirm={this.removeMember.bind(this)}
                                >
                                    <Button type='link' icon={<UserDeleteOutlined />}>
                                        Delete Member
                                    </Button>
                                </Popconfirm>
                                {inviteActions}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    }
}

export default MemberViewPage
