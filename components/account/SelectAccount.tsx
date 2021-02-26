import Link from 'next/link'
import React, { Component, ReactNode } from 'react'

import i18n from '../../i18n'
import { IWallet } from '../../lib/types'
import LoginContext from '../contexts/LoginContext'
import Ficon from '../ficon'
import AccountAvatar from './Avatar'

type State = {
    wallets: IWallet[],
}

export default class SelectAccount extends Component<Record<string, unknown>, State> {
    static contextType = LoginContext
    context !: React.ContextType<typeof LoginContext>

    state : State = {
        wallets: [],
    }

    async componentDidMount() : Promise<void> {
        try {
            const wallets = await this.context.web3Wallet.getStored();

            this.setState({wallets})
        } catch (err) {
            console.error('error retrieving stored wallets', err)
        }
    }

    render() : ReactNode {
        return (
            <div className='account-selection'>
                <h5 className='text-center text-lg font-normal text-gray-500'>
                    {i18n.t('select_account')}
                </h5>
                <ul>
                    {
                        this.state.wallets.map((wallet, key) => (
                            <li key={key}>
                                <a
                                    className='flex flex-row items-center'
                                    onClick={this.context.accountSelect.bind(this, wallet.publicKey)}
                                >
                                    <AccountAvatar
                                        avatar={wallet.avatar}
                                        name={wallet.name}
                                    />
                                    <span>
                                        {wallet.longName || wallet.name}
                                    </span>
                                </a>
                            </li>
                        ))
                    }
                </ul>
                <ul className='flex flex-col'>
                    <li>
                        <Link href='/account/new'>
                            <a className='btn block text-center'>
                                {i18n.t('btn.new_organization')}
                            </a>
                        </Link>
                    </li>
                    <li>
                        <Link href='/account/import'>
                            <a className='btn block text-center'>
                                {i18n.t('account.recover')}
                            </a>
                        </Link>
                    </li>
                </ul>
            </div>
        )
    }
}
