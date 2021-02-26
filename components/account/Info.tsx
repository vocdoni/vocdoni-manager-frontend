import React, { Component, ReactNode } from 'react'
import { Trans } from 'react-i18next'
import i18n from '../../i18n'

import AppContext from '../app-context'

type State = {
}

export default class EntityInfo extends Component<Record<string, unknown>, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {}

    render() : ReactNode {
        return (
            <p>
                <Trans
                    i18n={i18n}
                    i18nKey='account.welcome'
                    defaults='Welcome {{ name }}, redirecting you to the manager...'
                    values={{
                        name: this.context.entity?.name?.default,
                    }}
                />
            </p>
        )
    }
}
