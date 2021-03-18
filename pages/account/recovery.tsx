import React, { Component } from 'react'
import { Trans } from 'react-i18next'

import i18n from '../../i18n'
import AppContext from '../../components/app-context'

type State = {
}

class AccountRecovery extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
    }

    componentDidMount(): void {
        if (this.context.params.length) {
            console.log('received params')
        }
        this.context.setMenuVisible(false);
    }

    render(): React.ReactNode {
        return (
            <div className='content-wrapper slim-wrapper'>
                <h1>
                    {i18n.t('account.recovery.title')}
                </h1>
                <div className='spaced-content'>
                    <p>
                        <Trans
                            i18n={i18n}
                            i18nKey='account.recovery.option_1'
                            defaults='<b>Option 1:</b> If you have a backup email, click on its link and follow the steps.'
                            components={{
                                b: <strong />,
                            }}
                        />
                    </p>
                    <div className=''>
                        <p>
                            <Trans
                                i18n={i18n}
                                i18nKey='account.recovery.option_2'
                                defaults='<b>Option 2:</b> Upload a backup file.'
                                components={{
                                    b: <strong />,
                                }}
                            />
                        </p>
                        Drag &amp; drop
                    </div>
                    <p>
                        <Trans
                            i18n={i18n}
                            i18nKey='account.recovery.option_3'
                            defaults='<b>Option 3:</b> Introduce the mnemonic seed.'
                            components={{
                                b: <strong />,
                            }}
                        />
                    </p>
                </div>
            </div>
        )
    }
}

export default AccountRecovery
