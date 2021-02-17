import { Button, Divider } from 'antd'
import React, { Component, ReactNode } from 'react'
import ReactPlayer from 'react-player'

import i18n from '../../i18n'
import If from '../if'
import { ViewWrapperProps } from './ViewWrapper'

export default class Introduction extends Component<ViewWrapperProps, undefined> {
    render() : ReactNode {
        if (!this.props.process) {
            return null
        }

        const { process } = this.props

        return <>
            <h1>{process.title.default}</h1>
            <Divider />
            <div
                className='process-description'
                dangerouslySetInnerHTML={{__html: process.description.default}}
            />
            <If condition={process.meta?.requestsURL?.length}>
                <Button
                    href={process.meta.requestsURL}
                    type='primary'
                    style={{marginTop: '2em'}}
                    target='_blank'
                    rel='noopener noreferrer nofollow'
                >
                    {i18n.t('requestsButton')}
                </Button>
            </If>
            <If condition={process.media.streamUri?.length}>
                <Divider />
                <div className='player-wrapper'>
                    <ReactPlayer
                        url={process.media.streamUri}
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
