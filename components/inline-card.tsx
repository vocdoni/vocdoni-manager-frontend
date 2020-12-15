import React, { Component, ReactChild, ReactNode } from 'react'

type InlineCardProps = {
    image?: ReactNode,
    title?: ReactChild,
    children?: ReactChild,
}

export default class InlineCard extends Component<InlineCardProps, undefined> {
    render() : ReactNode {
        return (
            <div className='inline-card'>
                <div className='inline-card-img'>
                    {this.props.image}
                </div>
                <div className='inline-card-contents'>
                    {this.props.title}
                    <div className='inline-card-body'>
                        {this.props.children}
                    </div>
                </div>
            </div>
        )
    }
}
