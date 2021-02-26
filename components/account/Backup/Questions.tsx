import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'

export default class AskForBackup extends Component<undefined, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    render(): ReactNode {
        return <>
            <h5 className='text-center text-lg font-normal text-gray-500'>
                {i18n.t('backup')}
            </h5>
            <p>
                Select 2...
            </p>
            <p>
                Together with...
            </p>
        </>
    }
}
