import React, { Fragment, Component, ReactNode, ReactChild } from 'react'
import PropTypes from 'prop-types'

type Props = {
    condition: boolean,
    children: ReactChild | ReactChild[],
}

export default class If extends Component<Props> {
    static propTypes = {
        condition: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.oneOf([null, undefined]),
        ]).isRequired,
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
