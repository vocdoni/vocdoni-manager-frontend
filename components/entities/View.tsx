import { EditOutlined, ShareAltOutlined } from '@ant-design/icons'
import { Button, Col, Row } from 'antd'
import { EntityMetadata } from 'dvote-js'
import QRCode from 'qrcode.react'
import React, { Component, ReactNode } from 'react'

import { APP_LINKING_DOMAIN } from '../../env-config'
import { main } from '../../i18n'
import Copy from '../copy'
import Note from '../note'
import HeaderImage from './HeaderImage'

type ViewProps = {
    entity: EntityMetadata,
    id: string,
    onEditClick: any,
}

export default class View extends Component<ViewProps, undefined> {
    render() : ReactNode {
        const { entity, id } = this.props
        const link = `https://${APP_LINKING_DOMAIN}/entities/${id}`

        const columns = {
            left: {
                sm: 24,
                md: 8,
            },
            right: {
                sm: 24,
                md: 16,
            },
        }

        return (
            <>
                <HeaderImage
                    name={entity.name.default}
                    header={entity.media.header}
                    avatar={entity.media.avatar}
                />
                <Row justify='space-between'>
                    <Col>
                        <h1>{entity.name?.default}</h1>
                    </Col>
                    <Col>
                        <Button type='link' onClick={this.props.onEditClick}>
                            <EditOutlined /> Edit
                        </Button>
                    </Col>
                    <Col span={24}>
                        <div dangerouslySetInnerHTML={{
                            __html: entity.description?.default
                        }} />
                    </Col>
                    <Col span={24} className='entity-share'>
                        <h4><ShareAltOutlined /> Share</h4>
                        <Row>
                            <Col {...columns.left} className='qr'>
                                <div className='canvas-wrapper grayed rounded'>
                                    <a href={link} target='_blank' rel='noreferrer noopener nofollow'>
                                        <QRCode value={link} size={512} />
                                    </a>
                                </div>
                            </Col>
                            <Col {...columns.right} className='description'>
                                <Row justify='space-around' style={{height: '100%'}}>
                                    <Col span={24} className='copy-link'>
                                        <Copy text={link}>Copy link</Copy>
                                    </Col>
                                    <Col span={24} className='qr-note'>
                                        <Note>
                                            {main.qrNote}
                                        </Note>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </>
        )
    }
}
