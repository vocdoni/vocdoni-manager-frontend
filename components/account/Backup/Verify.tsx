import Link from 'next/link'
import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'

export default class Verify extends Component {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    render() : ReactNode {
        return <>
            <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                {i18n.t('backup.verify')}
            </h5>
            <div className='spaced-content'>
                <p>{i18n.t('backup.verify_description')}</p>
            </div>
            <div className='flex flex-row justify-between'>
                <Link href='/entities/new'>
                    <a className='btn'>
                        {i18n.t('do_it_later')}
                    </a>
                </Link>
            </div>
        </>
    }
}
