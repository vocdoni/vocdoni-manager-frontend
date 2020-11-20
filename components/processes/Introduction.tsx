import { Button, Divider } from 'antd'
import React, { Component, ReactNode } from 'react'
import ReactPlayer from 'react-player'

import If from '../if'
import { ViewWrapperProps } from './ViewWrapper'

import styles from '../vote.module.css'

export default class Introduction extends Component<ViewWrapperProps, undefined> {
    render() : ReactNode {
        if (!this.props.process) {
            return null
        }

        const { process, entityId } = this.props

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
                        controls={true}
                        width='100%'
                        height='100%'
                        className='react-player'
                    />
                </div>
            </If>
            <If condition={entityId && entityId === '0x8b95114ee6e6f00489c8a83b302867224757fc9d1dfcf16ed07280c63acab3a7'}>
                <Divider />
                {/* Visca el hardcoding */}
                <h2>Participa a l'Assamblea telemàtica</h2>
                <p>Envia les teves preguntes i comentaris omplint el següent formulari. Et respondrem properament.</p>
                <Button
                    target='_blank'
                    href='https://forms.office.com/Pages/ResponsePage.aspx?id=UuSsAjtiHUuX0V7mJ6BRkitHe94NQgBAngyYntH7c2xUNk1COUg5V01DWTYxT1BWTFk4UUNXRFo3NS4u'
                    className={styles.btn}
                >
                    Participa-hi
                </Button>
            </If>
        </>
    }
}
