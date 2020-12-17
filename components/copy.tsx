import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
import copy from 'copy-to-clipboard'
import { ReactChild, ReactNode } from 'react'
import React, { Component } from 'react'

type CopyProps = {
    text?: string,
    icon?: ReactNode,
    children: ReactChild,
}

type CopyState = {
    copied: boolean
}

export default class Copy extends Component<CopyProps, CopyState> {
    state: CopyState = {
        copied: false,
    }

    timeout

    componentWillUnmount() : void {
        window.clearTimeout(this.timeout)
    }

    onCopy() : void {
        const text = this.props.text?.length ? this.props.text : this.props.children

        copy(text as string)

        this.setState({copied: true})

        this.timeout = window.setTimeout(() => {
            this.setState({ copied: false })
        }, 3000);
    }

    render() : ReactNode {
        let icon = this.props.icon || <CopyOutlined />

        if (this.state.copied) {
            icon = <CheckOutlined style={{color: 'green'}} />
        }

        return (
            <a onClick={this.onCopy.bind(this)}>
                {icon} {this.props.children}
            </a>
        )
    }
}
