import React, { Component } from 'react'
import i18n from '../../i18n'
import Ficon from '../ficon'

const AvatarWrapper = ({children} : any) => <span className='account-avatar'>{children}</span>

interface AccountAvatarProps {
    name: string,
    avatar?: string
}

export default class AccountAvatar extends Component<AccountAvatarProps, undefined> {
    render() : React.ReactNode {
        const { name, avatar } = this.props

        if (!avatar) {
            return (
                <AvatarWrapper>
                    <Ficon icon='User' />
                </AvatarWrapper>
            )
        }

        return (
            <AvatarWrapper>
                <img
                    src={avatar.replace('ipfs://', process.env.IPFS_GATEWAY)}
                    alt={i18n.t('avatar_alt', {name})}
                    className='rounded-full w-full'
                />
            </AvatarWrapper>
        )
    }
}
