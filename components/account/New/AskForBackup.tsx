import Link from 'next/link'
import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

export default class AskForBackup extends Component<undefined, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    render(): ReactNode {
        return <>
            <h5 className='text-center text-lg font-normal text-gray-500'>
                {i18n.t('backup')}
            </h5>
            <p>
                {
                    i18n.t('uninstall_browser_notice', {
                        defaultValue: 'If you ever uninstall the browser..',
                    })
                }
            </p>
            <p>
                {
                    i18n.t('uninstall_browser_notice', {
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
            <div className='flex flex-col items-center'>
                <div className='mt-20 mb-6'>
                    <button
                        className='btn primary'
                        // onClick={this.onSubmit.bind(this)}
                    >
                        <Ficon icon='ArrowRight' className='mr-3' />
                        {i18n.t('account.btn.backup_create', {defaultValue: 'Create backup'})}
                    </button>
                </div>
                <Link href='/entities/new'>
                    <a className='font-semibold font-xs text-gray-500'>
                        {i18n.t('do_it_later', {defaultValue: 'I\'ll do it later'})}
                    </a>
                </Link>
            </div>
        </>
    }
}
