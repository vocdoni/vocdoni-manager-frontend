import React, { Component } from 'react'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { Random, serializeBackupLink, Symmetric } from 'dvote-js'
import moment from 'moment'

import qfile from '../../lib/common/backup/questions.spec.json'
import i18n from '../../i18n'
import AppContext from '../../components/app-context'
import AskForBackup from '../../components/account/New/AskForBackup'
import CreateAccountContext, { ICreateAccountContext } from '../../components/contexts/CreateAccountContext'
import Download from '../../components/account/Backup/Download'
import Email from '../../components/account/Backup/Email'
import NameAndConditions from '../../components/account/New/NameAndConditions'
import Password from '../../components/account/New/Password'
import Questions from '../../components/account/Backup/Questions'
import Verify from '../../components/account/Backup/Verify'
import { QuestionAnswer } from '../../lib/types'
import { normalizeAnswer } from '../../lib/util'

type State = {
    name: string,
    terms: boolean,
    password: string,
    seed: string,
    step: string,
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
        // step: 'Questions',
        backupAnswers: [],
    }

    stepComponents = {
        'NameAndConditions': NameAndConditions,
        'Password': Password,
        'AskForBackup': AskForBackup,
        'Questions': Questions,
        'Download': Download,
        'Email': Email,
        'Verify': Verify,
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

    setField(field: string, e: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({ [field]: e.target.value } as any)
    }

    setPassword(password: string) : void {
        this.setState({password})
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

    getBackupLink(): string {
        console.log(this.state)
        if (!this.state.seed || !this.state.password.length || !this.state.name.length || !this.state.backupAnswers.length) {
            // a user should never see this error, it's just a security check in case something went terribly wrong
            // devs will probably see it more often if they mess the steps order
            throw new Error('fatal error')
        }

        const spec = qfile.versions[process.env.BACKUP_LINK_VERSION]
        const answers = this.state.backupAnswers.map(({ answer }) => normalizeAnswer(answer)).join('')
        const key = Symmetric.encryptString(this.state.seed, `${this.state.password}${answers}`)
        const auth = Object.keys(spec.auth)[Object.values(spec.auth).findIndex((val) => val === 'pass')]

        const proto = Buffer.from(serializeBackupLink({
            version: process.env.BACKUP_LINK_VERSION,
            questions: this.state.backupAnswers.map(({ question }) => question),
            auth, // pass
            key,
        })).toString('hex')

        const parts = {
            alias: encodeURIComponent(this.state.name),
            date: moment().format('YYYY-MM-DD'),
            'encoded-link': proto,
        }

        const path = spec.linkFormat.replace(/\{([\w-]+)\}/ig, (full, varname) => {
            return parts[varname]
        })

        return `https://${process.env.APP_LINKING_DOMAIN}/${path}`
    }

    get createAccountContext(): ICreateAccountContext {
        return {
            ...this.context,
            ...this.state,
            setTerms: this.setTerms.bind(this),
            setName: this.setField.bind(this, 'name'),
            setPassword: this.setPassword.bind(this),
            setStep: this.setStep.bind(this),
            createAccount: this.createAccount.bind(this),
            setBackupAnswers: this.setBackupAnswer.bind(this),
            getBackupLink: this.getBackupLink.bind(this),
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
