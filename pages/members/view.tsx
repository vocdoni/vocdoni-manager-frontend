import React, { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { Row, Col, Divider, Button, Form, Input, message, DatePicker, Modal, Descriptions, Popconfirm} from 'antd'
import { getNetworkState } from '../../lib/network'
import Router from 'next/router'
import { UserDeleteOutlined, SaveOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { ITarget, IMember } from '../../lib/types'
import { FormInstance } from 'antd/lib/form'
import moment from 'moment'
import Paragraph from 'antd/lib/typography/Paragraph'

const validationUrlPrefix = "https://"+process.env.APP_LINKING_DOMAIN+"/validation/"

const MemberViewPage = props => {
    const context = useContext(AppContext)
    return <MemberView {...context} />
}

type State = {
  entityId?: string,
  memberId?: string,
  member?: IMember,
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
          .then((result) => {
              this.setState({ member: result.member, targets: result.targets })
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
      values.dateOfBirth = moment(values.dateOfBirth).format()
      const member = values
      const request = {
          method: 'updateMember',
          memberId: this.state.memberId,
          member
      }

      this.props.managerBackendGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
          .then((result) => {
              if (!result.ok) {
                  const error = "Could not save the member"
                  message.error(error)
                  this.setState({error})
                  return false
              }
              message.success("Member has been saved")
          },
          (error) => {
              message.error("Could not save the member")
              console.log(error)
              this.setState({error})
          })
  }

  removeMember() {
      const request = { method: "deleteMember", memberId: this.state.memberId }
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

  renderTokenInfo (validated: boolean, id: string, link: string) : JSX.Element {
      let result
      console.log(validated)
      if (!validated) {
          result =  (
              <Descriptions column={1} layout="vertical" colon={false}>
                  <Descriptions.Item label="Token">{id}</Descriptions.Item>
                  <Descriptions.Item label=""><Paragraph copyable={{ text: link  }}>Copy Validation Link</Paragraph></Descriptions.Item> 
              </Descriptions>
          )
      } else {
          result = (
              <Descriptions column={1} layout="vertical" colon={false}>
                  <Descriptions.Item label="Token">{id}</Descriptions.Item>
              </Descriptions>
          )
      }
      return result
  }

  render() {
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

      const initialValues = this.state.member
      const entityId = this.props.entityId
      if (initialValues) {
          console.log(new Date(initialValues.verified).getFullYear())
          console.log(new Date('0001').getFullYear())
      }
      const validated = (initialValues && new Date(initialValues.verified).getFullYear() == new Date('0001').getFullYear()) ? false : true 
      const link = (initialValues) ? validationUrlPrefix+'/'+entityId+'/'+initialValues.id : ''
      if (initialValues) {
          initialValues.dateOfBirth = moment(initialValues.dateOfBirth)
      }

      return <div id="page-body">
          <div className="body-card">
              <Row gutter={40} justify="start">
                  <Col xs={{span: 24, order: 2}} lg={{span: 18, order: 1}}>
                      <Divider orientation="left">Member ID</Divider> 
                      {this.renderTokenInfo(validated, entityId, link)}
                      <Divider orientation="left">Member details</Divider>
                      {this.state.member &&
                <Form
                    layout="vertical"
                    onFinish={(values) => this.onFinish(values)}
                    ref={this.formRef}
                    initialValues={initialValues}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="Name" name="firstName" rules={[{ required: true, message: 'Please input a First Name!' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Please input a Last Name' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid Email' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true, message: 'Please input a Date Of Birth' }]}>
                                <DatePicker format={'DD-MM-YYYY'} />
                            </Form.Item>
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

                  <Col xs={{span: 24, order: 1}} lg={{span: 6, order: 2}}>
                      <Row gutter={[0,24]}>
                          <Col span={24}>
                              <Divider orientation="left">Actions</Divider>
                              <Button type="link" onClick={() => this.onSaveMemberChanges()} icon={<SaveOutlined />}>Save changes</Button>
                              <Popconfirm
                                  title="Are you sure you want to delete this member?"
                                  okText="Delete"
                                  okType="primary"
                                  cancelText="Cancel"
                                  onConfirm={ () => this.removeMember()}
                              >
                                  <Button type="link" icon={<UserDeleteOutlined />}>Delete Member</Button>
                              </Popconfirm>
                          </Col>
                      </Row>
                  </Col>
              </Row>
          </div>
      </div>
  }
}

export default MemberViewPage
