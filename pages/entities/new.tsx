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
        entity: JSON.parse(JSON.stringify(EntityMetadataTemplate)) as EntityMetadata,
        editing: false,
    }

    async componentDidMount() : Promise<void> {
        this.context.setMenuDisabled(true)
        if (this.context.isReadOnlyNetwork) {
            Router.replace('/')
        }

        // Even tho this is the create method, there may be data already stored in IPFS
        if (!this.context.entity) {
            try {
                await this.context.refreshEntityMetadata()
            } catch (e) {
                // if entity does not really exist, just ignore it
            }
        }

        if (!this.context.entity) {
            return
        }

        this.setState({
            entity: this.context.entity,
        })
    }

    async update() : Promise<void> {
        const address = this.context.web3Wallet.getAddress()
        this.context.setMenuDisabled(false)

        Router.push(`/entities/#/${address}`)
    }

    render() : ReactNode {
        return (
            <div className='content-wrapper'>
                <Edit
                    onSave={(success) => success && this.update()}
                    method='signUp'
                    entity={this.state.entity}
                />
            </div>
        )
    }
}

export default EntityNew
