import React, { Component, ReactChild, ReactNode } from 'react'

type MultilineProps = {
    text: string,
    children?: ReactChild,
}

class Multiline extends Component<MultilineProps, undefined> {
    render() : ReactNode {
        const {
            text,
            children,
        } = this.props

        if (!text?.length && !children) {
            return null
        }

        if (!text?.length && children) {
            return children
        }

        const lines = text.trim().split('\n').filter(l => !!l)
        const result: (string | any)[] = []
        for (const line of lines) {
            result.push(<span key={line}>{line}</span>)
            result.push(<br key={line + 'br'} />)
        }
        result.pop()

        return result
    }
}

export default Multiline
