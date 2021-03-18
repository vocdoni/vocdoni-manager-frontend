import React, { Component, ReactNode } from 'react'
import { If } from 'react-if'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

type State = {
    email: string,
    sent: boolean,
    error: string,
}

export default class Email extends Component<undefined, State> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    state: State = {
        email: '',
        error: null,
        sent: false,
    }

    onChange(e: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({ email: e.target.value })
    }

    sendEmail(): void {
        this.setState({
            error: null,
        })

        if (!this.state.email.length || !/.+@.+/.test(this.state.email)) {
            this.setState({
                error: i18n.t('error.invalid_email'),
            })
            return
        }

        const mail = {
            subject: i18n.t('backup.email_subject'),
            body: encodeURIComponent(this.context.getBackupLink()),
        }

        this.context.toggleUnloadCheck(false)
        document.location.href = `mailto:${this.state.email}?subject=${mail.subject}&body=${mail.body}`
        this.context.toggleUnloadCheck(true)

        this.setState({
            sent: true,
        })
    }

    render(): ReactNode {
        return <>
            <div className='flex justify-between items-center'>
                <button onClick={() => this.context.setStep('Questions')}>
                    <Ficon icon='ArrowLeft' />
                </button>
                <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                    {i18n.t('backup.title')}
                </h5>
            </div>
            <div className='spaced-content'>
                <p>{i18n.t('backup.email_description')}</p>
                <div className='form-group'>
                    <input
                        type='email'
                        className='form-control form-sm'
                        placeholder={i18n.t('backup.email')}
                        onChange={this.onChange.bind(this)}
                        value={this.state.email}
                    />
                    <If condition={this.state.error}>
                        <span className='text-red-600 text-xs'>
                            {this.state.error}
                        </span>
                    </If>
                </div>
                <button
                    className='btn primary w-full block'
                    onClick={this.sendEmail.bind(this)}
                >
                    {i18n.t('btn.send_to_email')}
                </button>
                <button
                    className='btn primary w-full block'
                    disabled={!this.state.sent}
                    onClick={() => this.context.setStep('Verify')}
                >
                    {i18n.t('next')}
                </button>
            </div>
        </>
    }
}
