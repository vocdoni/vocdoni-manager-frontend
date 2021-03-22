import React, { Component } from 'react'

import AppContext from '../../components/app-context'
import LinkRecovery from '../../components/account/Backup/LinkRecovery'
import Recovery from '../../components/account/Backup/Recovery'

type State = {
    component: string,
}

class AccountRecovery extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        component: 'Recovery'
    }

    components = {
        LinkRecovery,
        Recovery,
    }

    componentDidMount(): void {
        this.context.setMenuVisible(false);
        if (this.context.params.length > 2) {
            this.setState({
                component: 'LinkRecovery',
            })
        }
    }

    render(): React.ReactNode {
        const StepComponent = this.components[this.state.component]
        return (
            <div className='content-wrapper slim-wrapper'>
                <StepComponent />
            </div>
        )
    }
}

export default AccountRecovery
