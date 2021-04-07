import { ProcessContractParameters } from 'dvote-js'
import moment from 'moment'
import { Component, ReactNode } from 'react'

import i18n from '../../i18n'

type FinishDateProps = {
    process: {
        params: ProcessContractParameters,
        date: Date,
    },
}

export default class FinishDate extends Component<FinishDateProps, undefined> {
    render() : ReactNode {
        const { process } = this.props

        if (process.params.status.isCanceled) {
            return null
        }

        const d = moment(process.date)
        const vars = {date: d.fromNow()}
        if (d.isAfter(Date.now())) {
            if (process.params.status.isReady || process.params.status.isPaused) {
                return i18n.t('process.status.finishes', vars)
            } else {
                return null
            }
        }

        return i18n.t('process.status.finished', vars)
    }
}
