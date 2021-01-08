import React, { Fragment, Component, ReactNode, ReactChild } from 'react'
import PropTypes from 'prop-types'

type Props = {
    condition?: any,
    children: ReactChild | ReactChild[],
}

export default class If extends Component<Props> {
    static propTypes = {
        condition: PropTypes.any,
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.node),
            PropTypes.node,
        ]).isRequired,
    }

    render() : ReactNode {
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
