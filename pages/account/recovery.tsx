import React, { Component } from 'react'

import AppContext from '../../components/app-context'
import LinkRecovery from '../../components/account/Backup/LinkRecovery'
import Recovery from '../../components/account/Backup/Recovery'
import CreateAccountContext, { ICreateAccountContext } from '../../components/contexts/CreateAccountContext'

type State = {
    name: string,
    password: string,
    component: string,
    questions: {[key: number]: string},
    backupAnswers: QuestionAnswer[],
}

class AccountRecovery extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        component: 'Recovery',
        name: '',
        password: '',
        backupAnswers: [],
        questions: {},
    }

    components = {
        'LinkRecovery': LinkRecovery,
        'Recovery': Recovery,
    }

    componentDidMount(): void {
        this.context.setMenuVisible(false);
        const [link] = this.context.params
        if (link.length > 0) {
            this.setState({
                component: 'LinkRecovery',
            })
        }
    }

    async createAccount(name: string, password: string): Promise<void> {
        const seed = Random.getHex()
        await this.context.web3Wallet.store(name, seed, password)
        await this.context.web3Wallet.load(name, password)

        this.setState({ seed })
        this.context.onNewWallet(this.context.web3Wallet.getWallet())
    }

    setBackupAnswer(position: number, qa: QuestionAnswer): void {
        const backupAnswers = [...this.state.backupAnswers]
        backupAnswers[position] = qa

        this.setState({ backupAnswers })
    }

    setBackupQuestions(questions: {[key: number]: string}): void {
        this.setState({ questions })
    }

    get createAccountContext(): ICreateAccountContext {
        return {
            ...this.context,
            ...this.state,
            createAccount: this.createAccount.bind(this),
            setBackupAnswers: this.setBackupAnswer.bind(this),
            setBackupQuestions: this.setBackupQuestions.bind(this),
            setName: (name: string) => this.setField('name', name),
            setPassword: (password: string) => this.setField('password', password),
        }
    }

    render(): React.ReactNode {
        const StepComponent = this.components[this.state.component]

        return (
            <div className='content-wrapper slim-wrapper'>
                <CreateAccountContext.Provider value={this.createAccountContext}>
                    <StepComponent />
                </CreateAccountContext.Provider>
            </div>
        )
    }
}

export default AccountRecovery
