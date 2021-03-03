import { Card } from 'antd'
import { EntityMetadata, ProcessMetadata } from 'dvote-js'
import React, { Component, ReactChild, ReactNode } from 'react'
import { ProcessVoteViewState } from '../../pages/processes/vote'
import SinglePageLayout from '../layouts/single-page'

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

    get endOfIntroduction() : number {
        let top = 0
        if (this.endIntroRef?.current?.offsetTop) {
            top = this.endIntroRef.current.offsetTop
        }

        return top
    }

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
            <SinglePageLayout responsive={resp}>
                <Card {...card}>
                    <Introduction {...this.props} onGoToVoteClick={() => window.scrollTo(0, this.endOfIntroduction)} />
                    <div ref={this.endIntroRef} />
                    {this.props.children}
                </Card>
            </SinglePageLayout>
        )
    }
}
