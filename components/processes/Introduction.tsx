import { Button, Divider } from 'antd'
import React, { Component, ReactNode } from 'react'
import ReactPlayer from 'react-player'
import { main } from '../../i18n'

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
            <If condition={process.details['requestsURL']?.length}>
                <Button
                    href={process.details['requestsURL']}
                    type='primary'
                    style={{marginTop: '2em'}}
                >
                    {main.requestsButton}
                </Button>
            </If>
            <If condition={process.details.streamUrl?.length}>
                <Divider />
                <div className='player-wrapper'>
                    <ReactPlayer
                        url={process.details.streamUrl}
                        controls={true}
                        width='100%'
                        height='100%'
                        className='react-player'
                    />
                </div>
            </If>
        </>
    }
}
