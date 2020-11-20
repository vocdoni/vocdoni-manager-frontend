import { Card, Col, Row } from 'antd'
import { EntityMetadata, ProcessMetadata } from 'dvote-js'
import React, { Component, ReactChild, ReactNode } from 'react'
import { ProcessVoteViewState } from '../../pages/processes/vote'

import HeaderImage from './HeaderImage'
import Introduction from './Introduction'

export type ViewWrapperProps  = ProcessVoteViewState & {
    children: ReactChild | ReactChild[] | ReactNode | ReactNode[],
    process?: ProcessMetadata,
    entity?: EntityMetadata,
}

type CardProps = {
    className: string,
    cover?: ReactNode,
}

export default class ViewWrapper extends Component<ViewWrapperProps, undefined> {
    endIntroRef: React.RefObject<HTMLDivElement>

    constructor(props: ViewWrapperProps) {
        super(props)

        this.endIntroRef = React.createRef()
    }

    render() : ReactNode {
        const resp = {
            xs: {
                span: 24,
            },
            md: {
                span: 20,
                push: 2,
            },
            xl: {
                span: 14,
                push: 5,
            },
            xxl: {
                span: 12,
                push: 6,
            }
        }

        const card = {
            className: 'voting-page',
        } as CardProps

        if (this.props.process || this.props.entity) {
            card.cover = <HeaderImage {...this.props} />
        }

        return (
            <Row className='vote-process'>
                <Col {...resp} style={{marginTop: '1em'}}>
                    <Card {...card} style={{marginBottom: '10em'}}>
                        <Introduction {...this.props} />
                        <div ref={this.endIntroRef} />
                        {this.props.children}
                    </Card>
                </Col>
            </Row>
        )
    }
}
