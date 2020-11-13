import { Divider } from 'antd'
import React, { Component, ReactNode } from 'react'

import { ViewWrapperProps } from './ViewWrapper'

export default class Introduction extends Component<ViewWrapperProps, undefined> {
    render() : ReactNode {
        if (!this.props.process) {
            return null
        }

        const { process } = this.props

        return <>
            <h1>{process.details.title.default}</h1>
            <Divider />
            <div
                className='process-description'
                dangerouslySetInnerHTML={{__html: process.details.description.default}}
            />
        </>
    }
}
