import { Checkbox, message } from 'antd'
import Link from 'next/link'
import React, { Component, ReactNode } from 'react'
import { Trans } from 'react-i18next'
import i18n from '../../../i18n'

import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

export default class NameAndConditions extends Component<undefined, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    onSubmit(): void {
        let error = false
        // check for name and terms
        if (!this.context.name.length) {
            message.error(i18n.t('account.error.missing_name'))
            error = true
        }

        if (!this.context.terms) {
            message.error(i18n.t('account.error.missing_terms'))
            error = true
        }

        if (error) {
            return
        }

        this.context.setStep('Password')
    }

    render(): ReactNode {
        const defined = this.context.name.length && this.context.terms === true

        return <>
            <div className='mb-4 flex justify-center'>
                Placheolder image
            </div>
            <div className='form-group'>
                <input
                    type='text'
                    className='form-control'
                    placeholder={i18n.t('account.placeholder.name')}
                    onChange={this.context.setName}
                    value={this.context.name}
                />
            </div>

            <label className='text-xs text-gray-500'>
                <Checkbox
                    className='mr-2'
                    checked={this.context.terms}
                    onChange={this.context.setTerms}
                />
                <Trans
                    i18n={i18n}
                    i18nKey='agree'
                    defaults='I agree with the <tos>{{ tos }}</tos> and <privacy>{{ privacy }}</privacy>'
                    values={{
                        privacy: i18n.t('policy'),
                        tos: i18n.t('tos'),
                    }}
                    components={{
                        tos: (
                            <a
                                href='https://vocdoni.io/terms-of-service'
                                target='_blank'
                                rel='noreferrer'
                                className='text-blue-400'
                            />
                        ),
                        privacy: (
                            <a
                                href='https://vocdoni.io/privacy-policy'
                                target='_blank'
                                rel='noreferrer'
                                className='text-blue-400'
                            />
                        ),
                    }}
                />
            </label>
            <div className='flex flex-col items-center'>
                <div className='mt-20 mb-6'>
                    <button
                        className='btn primary'
                        onClick={this.onSubmit.bind(this)}
                        disabled={!defined}
                    >
                        <Ficon icon='ArrowRight' className='mr-3' />
                        {i18n.t('account.btn.create')}
                    </button>
                </div>
                <Link href='/account/import'>
                    <a className='font-semibold font-xs text-gray-500'>
                        {i18n.t('account.recover')}
                    </a>
                </Link>
            </div>
        </>
    }
}
