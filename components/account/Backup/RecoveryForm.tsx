import React, { Component } from 'react'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'

type State = {
    loading: boolean,
}

class RecoveryForm extends Component<undefined, State> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    state: State = {
        loading: false,
    }

    render(): React.ReactNode {
        return (
            <>
                <h1>
                    {i18n.t('account.recovery.title')}
                </h1>
                <div className='spaced-content'>
                    <p>
                        {i18n.t('account.recovery.description')}
                    </p>
                    <div>
                        <label>
                            {i18n.t('account.name')}
                            <input
                                type='text'
                                className='form-control form-sm'
                                value={this.state.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.context.setName(e.target.value)
                                }
                            />
                        </label>
                    </div>
                    <div>
                        <label>
                            {i18n.t('password')}
                            <input
                                type='password'
                                className='form-control form-sm'
                                value={this.state.password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.context.setPassword(e.target.value)
                                }
                            />
                        </label>
                    </div>
                    {
                        Object.keys(this.context.questions).map((id) => {
                            const question = this.context.questions[id]
                            return (
                                <div key={id}>
                                    <label>
                                        {question}
                                        <input
                                            type='text'
                                            className='form-control form-sm'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                this.context.setBackupAnswers(id, {
                                                    answer: e.target.value,
                                                    question: id,
                                                })
                                            }}
                                            value={this.context.backupAnswers[id]?.answer || ''}
                                        />
                                    </label>
                                </div>
                            )
                        })
                    }
                </div>
                <button
                    className='btn primary w-full block'
                    type='submit'
                    // onClick={this.submit.bind(this)}
                    disabled={this.state.loading}
                >
                    {i18n.t('btn.verify')}
                </button>
            </>
        )
    }
}

export default RecoveryForm
