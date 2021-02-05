import React, { Component, ReactChild, ReactNode } from 'react'

type InlineCardProps = {
    className?: string,
    image?: ReactNode,
    title?: ReactChild,
    children?: ReactChild,
}

export default class InlineCard extends Component<InlineCardProps, undefined> {
    render() : ReactNode {
        const classes = ['inline-card']
        if (this.props.className?.length) {
            classes.push(this.props.className)
        }

        return (
            <div className={classes.join(' ')}>
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
