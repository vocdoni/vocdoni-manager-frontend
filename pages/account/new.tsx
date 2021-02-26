import React, { Component } from 'react'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { Random } from 'dvote-js'

import NameAndConditions from '../../components/account/New/NameAndConditions'
import CreateAccountContext, { ICreateAccountContext } from '../../components/contexts/CreateAccountContext'
import AppContext from '../../components/app-context'
import i18n from '../../i18n'
import Password from '../../components/account/New/Password'
import AskForBackup from '../../components/account/New/AskForBackup'
import Questions from '../../components/account/Backup/Questions'

type State = {
    name: string,
    terms: boolean,
    password: string,
    step: string,
}

class AccountNew extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        name: '',
        terms: false,
        password: '',
        step: 'NameAndConditions',
        // step: 'AskForBackup',
    }

    stateComponents = {
        'NameAndConditions': NameAndConditions,
        'Password': Password,
        'AskForBackup': AskForBackup,
        'Questions': Questions,
    }

    async componentDidMount() : Promise<void> {
        this.context.setTitle(this.state.name || i18n.t('entity.title.new'))
        this.context.setMenuVisible(false);
    }

    setField(field: string, e: React.ChangeEvent<HTMLInputElement>) : void {
        this.setState({[field]: e.target.value} as any)
    }

    setTerms(e: CheckboxChangeEvent) : void {
        this.setState({terms: e.target.checked})
    }

    setStep(step: string) : void {
        this.setState({step})
    }

    async createAccount(name: string, password: string) : Promise<void> {
        const seed = Random.getHex()
        await this.context.web3Wallet.store(name, seed, password)
        await this.context.web3Wallet.load(name, password)

        this.context.onNewWallet(this.context.web3Wallet.getWallet())
    }

    get createAccountContext () : ICreateAccountContext {
        return {
            ...this.context,
            ...this.state,
            setTerms: this.setTerms.bind(this),
            setName: this.setField.bind(this, 'name'),
            setPassword: this.setField.bind(this, 'password'),
            setStep: this.setStep.bind(this),
            createAccount: this.createAccount.bind(this),
        }
    }

    render() : React.ReactNode {
        const StepComponent = this.stateComponents[this.state.step]

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
