import React, { Component, ReactNode } from 'react'
import { If, Else, Then } from 'react-if'

import EntityLogin from '../components/account/Login'
import EntityInfo from '../components/account/Info'
import AppContext from '../components/app-context'
import Loading from '../components/loading'
import LoginContext, { ILoginContext } from '../components/contexts/LoginContext'
import { IWallet } from '../lib/types'

type State = {
    accountSelected: IWallet,
    accountSelect?(account: string): void,
}

class IndexView extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {
        accountSelected: null,
    }

    async accountSelect(pkey: string): Promise<void> {
        localStorage.setItem('account.selected', pkey)
        let accountSelected : IWallet = null
        if (pkey) {
            try {
                accountSelected = await this.context.web3Wallet.getStoredWallet(pkey)
            } catch (err) {
                console.error(err)
            }
        }

        this.context.setTitle(accountSelected?.longName || accountSelected?.name || 'Vocdoni')
        this.setState({accountSelected})
    }

    async componentDidMount() : Promise<void> {
        this.context.setMenuVisible(false)
    }

    get loginContext () : ILoginContext {
        return {
            ...this.context,
            ...this.state,
            accountSelect: this.accountSelect.bind(this),
        }
    }

    render() : ReactNode {
        return (
            <div className='mx-auto w-4/5 sm:w-1/3 lg:w-1/4 xl:w-1/5 mt-10'>
                <LoginContext.Provider value={this.loginContext}>
                    <If condition={this.context.isEntityLoaded}>
                        <Then>
                            <EntityInfo />
                        </Then>
                        <Else>
                            <EntityLogin />
                        </Else>
                    </If>
                </LoginContext.Provider>
            </div>
        )
    }
}

export default IndexView
