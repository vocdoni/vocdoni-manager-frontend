import Link from 'next/link'
import React, { Component, ReactNode } from 'react'
import { Trans } from 'react-i18next'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

export default class AskForBackup extends Component<undefined, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    render(): ReactNode {
        return <>
            <h5 className='text-center text-lg font-normal text-gray-500'>
                {i18n.t('backup.title')}
            </h5>
            <div className='spaced-content'>
                <p>
                    <Trans
                        i18n={i18n}
                        i18nKey='uninstall_browser_notice'
                        defaults='If you ever uninstall the browser <b>you will loose your organization</b>.'
                        components={{b: <strong />}}
                    />
                </p>
                <p>
                    {
                        i18n.t('backup_requirement_explanation', {
                            defaultValue: 'An account backup is also necessary to later import it to a different browser or computer',
                        })
                    }
                </p>
                <p>
                    {
                        i18n.t('confirm_create_backup', {
                            defaultValue: 'Do you want to create the backup now?',
                        })
                    }
                </p>
            </div>
            <div className='flex flex-col items-center'>
                <div className='my-5'>
                    <button
                        className='btn primary'
                        onClick={() => this.context.setStep('Questions')}
                    >
                        <Ficon icon='ArrowRight' className='mr-3' />
                        {i18n.t('account.btn.backup_create', {defaultValue: 'Create backup'})}
                    </button>
                </div>
                <Link href='/entities/new'>
                    <a className='btn'>
                        {i18n.t('do_it_later', {defaultValue: 'I\'ll do it later'})}
                    </a>
                </Link>
            </div>
        </>
    }
}
