import { ShareAltOutlined } from '@ant-design/icons'
import { Col, Row } from 'antd'
import { Component, ReactNode } from 'react'

type NoteProps = {
    icon?: ReactNode,
}

type IconType = typeof ShareAltOutlined

export default class Note extends Component<NoteProps, undefined> {
    render() : ReactNode {
        const Icon = (this.props.icon || ShareAltOutlined) as IconType

        return (
            <Row className='note rounded-lg'>
                <Col span={3}>
                    <Icon style={{fontSize: '26px'}} />
                </Col>
                <Col span={21}>
                    {this.props.children}
                </Col>
            </Row>
        )
    }
}
