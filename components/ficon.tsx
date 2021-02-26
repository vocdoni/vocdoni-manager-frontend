import React, { Component, ReactNode } from 'react'
import * as Feather from 'react-feather'

export interface FiconProps extends Feather.IconProps {
    icon: string,
}

export default class Ficon extends Component<FiconProps, undefined> {
    render() : ReactNode {
        const props = {...(this.props as any) as FiconProps}
        const Icon = Feather[props.icon]

        delete props.icon

        return (
            <span className='ficon'>
                <Icon size='100%' {...props} />
            </span>
        )
    }
}
