import React, { Component, ReactNode } from 'react'
import { Trans } from 'react-i18next'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'

export default class Recovery extends Component<undefined, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    render() : ReactNode {
        return <>
            <div className='flex justify-between items-center'>
                <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                    {i18n.t('account.recovery.title')}
                </h5>
            </div>
            <div className='spaced-content'>
                <p>
                    <Trans
                        i18n={i18n}
                        i18nKey='account.recovery.option_1'
                        defaults='<b>Option 1:</b> If you have a backup email, click on its link and follow the steps.'
                        components={{
                            b: <strong />,
                        }}
                    />
                </p>
                <div className=''>
                    <p>
                        <Trans
                            i18n={i18n}
                            i18nKey='account.recovery.option_2'
                            defaults='<b>Option 2:</b> Upload a backup file.'
                            components={{
                                b: <strong />,
                            }}
                        />
                    </p>
                    Drag &amp; drop
                </div>
                <p>
                    <Trans
                        i18n={i18n}
                        i18nKey='account.recovery.option_3'
                        defaults='<b>Option 3:</b> Introduce the mnemonic seed.'
                        components={{
                            b: <strong />,
                        }}
                    />
                </p>
            </div>
        </>
    }
}
