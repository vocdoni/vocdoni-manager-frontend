import { message } from 'antd'
import Router from 'next/router'
import React, { Component, ReactNode } from 'react'
import { Else, If, Then } from 'react-if'

import i18n from '../../i18n'
import { makeUid } from '../../lib/util'
import LoginContext from '../contexts/LoginContext'
import Ficon from '../ficon'
import Loading from '../loading'
import { entityNotFoundModal } from '../utils'
import AccountAvatar from './Avatar'
import SelectAccount from './SelectAccount'

type State = {
    password: string,
    loading: boolean,
}

export default class EntityLogin extends Component<Record<string, unknown>, State> {
    static contextType = LoginContext
    context !: React.ContextType<typeof LoginContext>

    state : State = {
        password: '',
        loading: false,
    }

    async componentDidMount() : Promise<void> {
        const selected = localStorage.getItem('account.selected')
        this.context.accountSelect(selected)
    }

    onFieldChange(e: React.ChangeEvent<HTMLInputElement>) : void {
        this.setState({
            password: e.target.value,
        })
    }

    async onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) : Promise<void> {
        if (e.key === 'Enter') {
            await this.onSubmit()
        }
    }

    async onSubmit() : Promise<void> {
        this.setState({loading: true})

        const account = this.context.accountSelected
        try {
            await this.context.web3Wallet.load(account.name, this.state.password)

            this.context.onNewWallet(this.context.web3Wallet.getWallet())
        } catch (err) {
            console.error('could not unlock wallet', err)
            message.error(i18n.t('error.wrong_password'))
            this.setState({loading: false})

            return
        }

        const address = await this.context.web3Wallet.getAddress()

        try {
            const entity = await this.context.refreshEntityMetadata(address)
            const update : {
                uid?: number,
                avatar?: string,
                longName?: string,
            } = {}

            // Cache a random uid (telemetry purposes)
            if (!account.uid) {
                update.uid = makeUid()
            }

            // Cache stuff for login page
            if (!account.longName) {
                update.longName = entity.name.default
            }
            if (!account.avatar) {
                update.avatar = entity.media.avatar
            }

            if (Object.keys(update).length) {
                this.context.web3Wallet.updateStored(account.name, update)
            }

            Router.replace(`/entities/#/${address}`, undefined, {shallow: true});
        } catch (e) {
            console.error(e)
            entityNotFoundModal(() => {
                console.log('should remove loading status...')
                this.setState({loading: false})
            })
        }
    }

    render() : ReactNode {
        return (
            <Loading loading={this.state.loading}>
                <If condition={!this.context.accountSelected}>
                    <Then>
                        <SelectAccount />
                    </Then>
                    <Else>
                        {() => {
                            const name = this.context.accountSelected.longName || this.context.accountSelected.name

                            return (
                                <div className='login-form'>
                                    <div className='selected-account'>
                                        <AccountAvatar
                                            avatar={this.context.accountSelected.avatar}
                                            name={name}
                                        />
                                        <span>
                                            {name}
                                        </span>
                                    </div>
                                    <div className='form-group'>
                                        <input
                                            type='password'
                                            placeholder={i18n.t('password')}
                                            className='form-control'
                                            value={this.state.password}
                                            onChange={this.onFieldChange.bind(this)}
                                            onKeyDown={this.onKeyDown.bind(this)}
                                        />
                                    </div>
                                    <div className='flex flex-col sm:flex-row justify-between w-full mt-6'>
                                        <a
                                            className='btn mt-5 sm:mt-0 order-1 sm:order-none'
                                            onClick={this.context.accountSelect.bind(this, null)}
                                        >
                                            {i18n.t('btn.switch_account')}
                                        </a>
                                        <button
                                            className='btn primary'
                                            onClick={this.onSubmit.bind(this)}
                                        >
                                            <Ficon icon='ArrowRight' className='mr-3' />
                                            {i18n.t('btn.login')}
                                        </button>
                                    </div>
                                </div>
                            )
                        }}
                    </Else>
                </If>
            </Loading>
        )
    }
}
