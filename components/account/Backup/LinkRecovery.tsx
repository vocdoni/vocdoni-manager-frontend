import { message } from 'antd'
import { BackupLink, deserializeBackupLink, Symmetric } from 'dvote-js'
import Router from 'next/router'
import React, { Component } from 'react'

import i18n from '../../../i18n'
import qfile from '../../../lib/common/backup/questions.spec.json'
import { normalizeAnswer } from '../../../lib/util'
import AppContext from '../../app-context'

type State = {
    answers: string[],
    name: string,
    password: string,
    proto: BackupLink,
    questions: string[],
    loading: boolean,
}

class LinkRecovery extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        answers: [],
        name: '',
        password: '',
        proto: null,
        questions: [],
        loading: false,
    }

    componentDidMount(): void {
        this.context.setMenuVisible(false);
        if (this.context.params.length < 3) {
            return
        }

        // we have a logical problem here: we can't know the specification without knowing the version, which is encoded
        // current behavior is following spec v1
        const [name, , link] = this.context.params
        const proto = deserializeBackupLink(Buffer.from(link, 'hex'))
        // due to the bug mentioned above, it's the same hardcoding the spec here than using `decoded.version`
        const spec = qfile.versions["1"]
        const questions = []
        proto.questions.forEach((qid) => {
            questions.push(i18n.t(`backup:${spec.questions[qid]}`))
        })
        this.setState({
            name: decodeURIComponent(name),
            proto,
            questions,
        })
    }

    async submit(): Promise<void> {
        this.setState({ loading: true })

        const answers = this.state.answers.map(normalizeAnswer).join('')

        let seed: string = null
        try {
            seed = Symmetric.decryptString(this.state.proto.key, `${this.state.password}${answers}`)
        } catch (e) {
            console.error('cannot decrypt message', e)
            message.error(i18n.t('error.wrong_password'))
            this.setState({ loading: false })

            return
        }

        try {
            await this.context.web3Wallet.store(this.state.name, seed, this.state.password)
            await this.context.web3Wallet.load(this.state.name, this.state.password)
            this.context.onNewWallet(this.context.web3Wallet.getWallet())
        } catch (e) {
            console.error('cannot import account', e)
            message.error(i18n.t('account.error.cannot_import'))
            this.setState({ loading: false })

            return
        }

        try {
            const address = this.context.web3Wallet.getAddress()
            await this.context.refreshEntityMetadata(address, true)

            Router.replace(`/entities/edit/#/${address}`)
        } catch (e) {
            Router.replace('/entities/new')
        }
    }

    setQuestionAnswer(num: number, answer: string): void {
        const answers = [...this.state.answers]
        answers[num] = answer

        this.setState({ answers })
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
                                    this.setState({ name: e.target.value })
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
                                    this.setState({ password: e.target.value })
                                }
                            />
                        </label>
                    </div>
                    {
                        this.state.questions.map((question, id) => (
                            <div key={id}>
                                <label>
                                    {question}
                                    <input
                                        type='text'
                                        className='form-control form-sm'
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            this.setQuestionAnswer(id, e.target.value)
                                        }}
                                        value={this.state.answers[id] || ''}
                                    />
                                </label>
                            </div>
                        ))
                    }
                </div>
                <button
                    className='btn primary w-full block'
                    type='submit'
                    onClick={this.submit.bind(this)}
                    disabled={this.state.loading}
                >
                    {i18n.t('btn.verify')}
                </button>
            </>
        )
    }
}

export default LinkRecovery
