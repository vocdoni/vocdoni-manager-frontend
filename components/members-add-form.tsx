import React, { Component, ReactNode } from 'react'
import { Button, Col, Form, Input, message, Row } from 'antd'
import { Rule } from 'antd/lib/form'
import { object as toObject } from 'dot-object'

import { MemberImportData } from '../lib/types'
import { IAppContext } from './app-context'
import { DeleteOutlined } from '@ant-design/icons'

type MembersAddFormState = {
    members: MemberImportData[],
}

const MemberAddRow = (props: any) : JSX.Element => {
    const required : Rule =  {
        required: true,
        message: 'This field is required',
    }
    return (
        <Row style={{marginBottom: '.5em'}}>
            <Col span={7}>
                <Form.Item
                    name={`members[${props.index}].firstName`}
                    label='Name'
                    required
                    rules={[required]}
                >
                    <Input />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item
                    name={`members[${props.index}].lastName`}
                    label='Last name'
                    required
                    rules={[required]}
                >
                    <Input />
                </Form.Item>
            </Col>
            <Col span={9}>
                <Form.Item
                    name={`members[${props.index}].email`}
                    label='Email'
                    required
                    rules={[
                        {type: 'email', message: 'Must be a valid e-mail'},
                        required,
                    ]}
                >
                    <Input />
                </Form.Item>
            </Col>
        </Row>
    )
}

interface MembersAddFormProps extends IAppContext {
    onSave: (members: MemberImportData[]) => void
}

const emptyMember = {
    firstName: '',
    lastName: '',
    email: '',
}

class MembersAddForm extends Component<MembersAddFormProps, MembersAddFormState> {
    state = {
        members: [{...emptyMember}],
    }

    onAdd() : void {
        this.setState({
            members: [
                ...this.state.members,
                {...emptyMember},
            ],
        })
    }

    onSave(values: any) : void {
        // get rid of null values
        for (const key in values) {
            if (typeof values[key] === 'undefined') {
                delete values[key]
            }
        }
        if (!Object.values(values).length) {
            message.error('There\'s no data to be imported')
            return
        }

        this.props.onSave((toObject(values) as any).members)
    }

    onDelete(index: number) : void {
        const { members } = this.state
        members.pop()
        this.setState({
            members,
        })
    }

    render() : ReactNode {
        return (
            <Form onFinish={this.onSave.bind(this)} layout='inline'>
                {
                    this.state.members.map((member: MemberImportData, key: number) =>
                        <MemberAddRow key={key} index={key} />
                    )
                }
                <Row style={{marginTop: '1em', width: '100%'}} justify='space-between'>
                    <Col span={12}>
                        <Button type='text' onClick={this.onAdd.bind(this)}>
                            + Add a row
                        </Button>
                        <Button type='text' onClick={this.onDelete.bind(this)} disabled={this.state.members.length <= 1}>
                            - Delete row
                        </Button>
                    </Col>
                    <Col span={12} style={{textAlign: 'right'}}>
                        <Button type='primary' htmlType='submit'>Save</Button>
                    </Col>
                </Row>
            </Form>
        )
    }
}

export default MembersAddForm
