import React, { Component } from 'react'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { AccountBackup, Random } from 'dvote-js'

import i18n from '../../i18n'
import AppContext from '../../components/app-context'
import AskForBackup from '../../components/account/New/AskForBackup'
import CreateAccountContext, { ICreateAccountContext } from '../../components/contexts/CreateAccountContext'
import Download from '../../components/account/Backup/Download'
import Email from '../../components/account/Backup/Email'
import NameAndConditions from '../../components/account/New/NameAndConditions'
import Password from '../../components/account/New/Password'
import Questions from '../../components/account/Backup/Questions'
import RecoveryForm from '../../components/account/Backup/RecoveryForm'
import VerifyEmail from '../../components/account/Backup/VerifyEmail'
import VerifyFile from '../../components/account/Backup/VerifyFile'
import { QuestionAnswer } from '../../lib/types'

type State = {
    name: string,
    terms: boolean,
    password: string,
    seed: string,
    step: string,
    questions: {[key: number]: string},
    backupAnswers: QuestionAnswer[],
}

class AccountNew extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        name: '',
        terms: false,
        password: '',
        seed: null,
        // For debugging and development purposes, you can change this to the step you wanna check.
        // Take in mind some of these steps require stuff to be in the context tho (from previous steps).
        step: 'NameAndConditions',
        backupAnswers: [],
        questions: {},
    }

    stepComponents = {
        'NameAndConditions': NameAndConditions,
        'Password': Password,
        'AskForBackup': AskForBackup,
        'Questions': Questions,
        'Download': Download,
        'Email': Email,
        'VerifyEmail': VerifyEmail,
        'VerifyFile': VerifyFile,
        'RecoveryForm': RecoveryForm,
    }

    componentDidMount(): void {
        this.context.setTitle(this.state.name || i18n.t('entity.title.new'))
        this.context.setMenuVisible(false);
    }

    setBackupAnswer(position: number, qa: QuestionAnswer): void {
        const backupAnswers = [...this.state.backupAnswers]
        backupAnswers[position] = qa

        this.setState({ backupAnswers })
    }

    setBackupQuestions(questions: {[key: number]: string}): void {
        this.setState({ questions })
    }

    setField(field: string, value: string): void {
        this.setState({ [field]: value } as any)
    }

    setTerms(e: CheckboxChangeEvent): void {
        this.setState({ terms: e.target.checked })
    }

    setStep(step: string): void {
        this.setState({ step })
    }

    async createAccount(name: string, password: string): Promise<void> {
        const seed = Random.getHex()
        await this.context.web3Wallet.store(name, seed, password)
        await this.context.web3Wallet.load(name, password)

        this.setState({ seed })
        this.context.onNewWallet(this.context.web3Wallet.getWallet())
    }

    getBackup(): Uint8Array {
        // console.log(this.state)
        if (!this.state.seed || !this.state.password.length || !this.state.name.length || !this.state.backupAnswers.length) {
            // a user should never see this error, it's just a security check in case something went terribly wrong
            // devs will probably see it more often if they mess the steps order
            throw new Error('fatal error')
        }

        const seed = Buffer.from(this.state.seed, 'ascii')
        const questions = this.state.backupAnswers.map(({ question }) => parseInt(question, 10))
        const answers = this.state.backupAnswers.map(({ answer }) => answer)

        return AccountBackup.create(this.state.name, this.state.password, seed, questions, answers)
    }

    get createAccountContext(): ICreateAccountContext {
        return {
            ...this.context,
            ...this.state,
            createAccount: this.createAccount.bind(this),
            getBackup: this.getBackup.bind(this),
            setBackupAnswers: this.setBackupAnswer.bind(this),
            setBackupQuestions: this.setBackupQuestions.bind(this),
            setName: (name: string) => this.setField('name', name),
            setPassword: (password: string) => this.setField('password', password),
            setSeed: (seed: string) => this.setState({ seed }),
            setStep: this.setStep.bind(this),
            setTerms: this.setTerms.bind(this),
        }
    }

    render(): React.ReactNode {
        const StepComponent = this.stepComponents[this.state.step]

        return (
            <div className='content-wrapper slim-wrapper'>
                <CreateAccountContext.Provider value={this.createAccountContext}>
                    <StepComponent />
                </CreateAccountContext.Provider>
            </div>
        )
    }
}

export default AccountNew
