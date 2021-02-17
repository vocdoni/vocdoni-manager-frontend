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
        let suffix = i18n.t('finished')

        if (d.isAfter(Date.now())) {
            suffix = i18n.t('finishes')
        }

        return `${suffix} ${d.fromNow()}`
    }
}
