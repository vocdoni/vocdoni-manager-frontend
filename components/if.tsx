import React, { Fragment, Component, ReactNode } from 'react'
import PropTypes from 'prop-types'

type Props = {
    condition: boolean,
    children: ReactNode,
}

export default class If extends Component<Props> {
    static propTypes = {
        condition: PropTypes.bool.isRequired,
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.node),
            PropTypes.node,
        ]).isRequired,
    }

    render() {
        const { condition, children } = this.props

        if (!condition) {
            return null
        }

        return (
            <Fragment>
                { children }
            </Fragment>
        )
    }
}
