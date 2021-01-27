import {
    EntityMetadata,
    EntityMetadataTemplate,
} from 'dvote-js'
import Router from 'next/router'
import React, { Component, ReactNode } from 'react'

import AppContext from '../../components/app-context'
import Edit from '../../components/entities/Edit'


type State = {
    loading?: boolean,
    entity?: EntityMetadata,
    address?: string,
    editing: boolean,
}

class EntityNew extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        editing: false,
    }

    componentDidMount() : void {
        this.context.setMenuSelected('profile')
        if (this.context.isReadOnlyNetwork) {
            Router.replace('/')
        }
    }

    async update() : Promise<void> {
        const address = this.context.web3Wallet.getAddress()

        Router.push(`/entities/#/${address}`)
    }

    render() : ReactNode {
        return (
            <div className='content-wrapper'>
                <Edit
                    onSave={(success) => success && this.update()}
                    method='signUp'
                    entity={JSON.parse(JSON.stringify(EntityMetadataTemplate))}
                />
            </div>
        )
    }
}

export default EntityNew
