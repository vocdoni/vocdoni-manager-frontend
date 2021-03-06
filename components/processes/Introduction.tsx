import { Button, Divider } from 'antd'
import React, { Component, ReactNode } from 'react'
import ReactPlayer from 'react-player'

import i18n from '../../i18n'
import If from '../if'
import { ViewWrapperProps } from './ViewWrapper'

type IntroductionProps = ViewWrapperProps & {
    onGoToVoteClick: () => void
}

export default class Introduction extends Component<IntroductionProps, undefined> {
    render() : ReactNode {
        if (!this.props.process) {
            return null
        }

        const { process } = this.props

        return <>
            <h1>{process.title.default}</h1>
            <Divider />
            <div
                className='process-description styled-content'
                dangerouslySetInnerHTML={{__html: process.description.default}}
            />
            <div className='process-actions'>
                <If condition={process.meta?.requestsUrl?.length}>
                    <Button
                        href={process.meta.requestsUrl}
                        type='primary'
                        target='_blank'
                        rel='noopener noreferrer nofollow'
                    >
                        {i18n.t('process.btn.requests')}
                    </Button>
                </If>
                <If condition={process.meta?.documentationUrl?.length}>
                    <Button
                        href={process.meta.documentationUrl}
                        type='primary'
                        target='_blank'
                        rel='noopener noreferrer nofollow'
                    >
                        {i18n.t('process.btn.documentation')}
                    </Button>
                </If>
                <Button
                    type='primary'
                    onClick={this.props.onGoToVoteClick.bind(this)}
                >
                    {i18n.t('process.btn.goto_vote')}
                </Button>
            </div>
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
