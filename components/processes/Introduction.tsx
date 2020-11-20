import { Divider } from 'antd'
import React, { Component, ReactNode } from 'react'
import ReactPlayer from 'react-player'

import If from '../if'
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
            <If condition={process.details.streamUrl?.length}>
                <div className='player-wrapper'>
                    <ReactPlayer
                        url={process.details.streamUrl}
                        muted={true}
                        controls={true}
                        playing={true}
                        width='100%'
                        height='100%'
                        className='react-player'
                    />
                </div>
            </If>
        </>
    }
}
