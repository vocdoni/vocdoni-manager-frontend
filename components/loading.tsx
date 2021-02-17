import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { SpinIndicator } from 'antd/lib/spin'
import React, { Component, ReactNode } from 'react'

import i18n from '../i18n'

type LoadingProps = {
    loading?: boolean
    text?: string
    icon?: SpinIndicator
    children: ReactNode
}

export default class Loading extends Component<LoadingProps,undefined> {
    render() : ReactNode {
        if (this.props.loading) {
            const text = this.props.text || i18n.t('loading')
            const icon = this.props.icon || <LoadingOutlined />

            return (
                <div className='loading vertically-centered'>
                    {text} <Spin indicator={icon} className='spinner' />
                </div>
            )
        }

        return this.props.children
    }
}
