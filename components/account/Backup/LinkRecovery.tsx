import { message } from 'antd'
import { AccountBackup } from 'dvote-js'
import Router from 'next/router'
import React, { Component } from 'react'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import RecoveryForm from './RecoveryForm'

export default class LinkRecovery extends Component<undefined, State> {
    static contextType = CreateAccountContext
    context!: React.ContextType<typeof CreateAccountContext>

    componentDidMount(): void {
        this.context.setMenuVisible(false);
        if (this.context.params.length < 1) {
            return
        }

        const [link] = this.context.params
        const proto = AccountBackup.deserialize(Buffer.from(link, 'hex'))
        const spec = AccountBackup.questions()
        const questions = {}
        proto.questions.forEach((qid) => {
            questions[qid] = i18n.t(`backup:${spec[qid]}`)
        })
        this.context.setBackupQuestions(questions)
    }

    async submit(): Promise<void> {
        this.setState({ loading: true })

        let seed: string = null
        try {
            seed = AccountBackup.decryptKey(this.state.proto.key, this.state.password, this.state.answers)
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

    render(): React.ReactNode {
        return (
            <div>
                <RecoveryForm />
            </div>
        )
    }
}
