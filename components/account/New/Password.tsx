import { message } from 'antd'
import React, { Component, ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { If } from 'react-if'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

type State = {
    password: string,
    confirm: string,
    error: string,
}

export default class Password extends Component<undefined, State> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    state : State = {
        password: '',
        confirm: '',
        error: '',
    }

    setField(field: string, e: React.ChangeEvent<HTMLInputElement>) : void {
        this.setState({[field]: e.target.value} as any)
    }

    async submit() : Promise<void> {
        const {password, confirm} = this.state
        if (!password.length || !confirm.length || password !== confirm) {
            this.setState({
                error: i18n.t('account.error.password_missmatch'),
            })
            return
        }

        try {
            await this.context.createAccount(this.context.name, password)
        } catch (e) {
            const err : string = e.message
            if (err.includes('strong')) {
                this.setState({
                    error: i18n.t('error.weak_password', {
                        defaultValue: 'The password is not strong enough',
                    })
                })
                return
            }
            message.error(err)

            return
        }

        this.context.setPassword(password)

        this.context.setStep('AskForBackup')
    }

    render(): ReactNode {
        const {password, confirm, error} = this.state
        const defined = password.length && confirm.length

        return <>
            <div className='flex justify-between items-center'>
                <button onClick={() => this.context.setStep('NameAndConditions')}>
                    <Ficon icon='ArrowLeft' />
                </button>
                <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                    {i18n.t('account.set_password')}
                </h5>
            </div>

            <p className='my-4'>
                <Trans
                    i18n={i18n}
                    i18nKey='account.created_notice'
                    defaults='<b>{{name}}</b> looks like a good name'
                    values={{name: this.context.name}}
                    components={{
                        b: <strong />
                    }}
                />
            </p>
            <p className='mb-16'>
                {i18n.t('account.set_password_description')}
            </p>
            <div className='form-group'>
                <input
                    className='form-control'
                    type='password'
                    placeholder={i18n.t('password')}
                    onChange={this.setField.bind(this, 'password')}
                    value={password}
                />
            </div>
            <div className='form-group'>
                <input
                    className='form-control'
                    type='password'
                    placeholder={i18n.t('password_confirm')}
                    onChange={this.setField.bind(this, 'confirm')}
                    value={confirm}
                />
                <If condition={error}>
                    <span className='text-red-600'>
                        {error}
                    </span>
                </If>
            </div>
            <div className='flex justify-end mt-12'>
                <button
                    className='btn'
                    disabled={!defined}
                    onClick={this.submit.bind(this)}
                >
                    <Ficon icon='ArrowRight' className='mr-3' />
                    {i18n.t('next')}
                </button>
            </div>
        </>
    }
}
