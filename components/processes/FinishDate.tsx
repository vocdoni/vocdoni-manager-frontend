import { ProcessContractParameters } from 'dvote-js'
import moment from 'moment'
import { Component, ReactNode } from 'react'

import { main } from '../../i18n'

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
        let suffix = main.finished

        if (d.isAfter(Date.now())) {
            suffix = main.finishes
        }

        return `${suffix} ${d.fromNow()}`
    }
}
