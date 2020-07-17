import React from 'react'
import classNames from 'classnames'

type Props = {
    disabled: boolean
    text?: string
    children: any
}

const DisabledLayerText = (props: Props) => {
    if (!props.text || (props.text && !props.text.length)) {
        return null
    }

    return (
        <div className='disabled-notice'>
            <p>{props.text}</p>
        </div>
    )
}

const DisabledLayer = (props: Props) => {
    const {disabled} = props

    const classes = ['disabled-layer']

    if (disabled) {
        classes.push('disabled')
    }

    return (
        <div className={classNames(classes)}>
            <DisabledLayerText {...props} />
            {props.children}
        </div>
    )
}

export default DisabledLayer
