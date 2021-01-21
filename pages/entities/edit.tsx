import { message } from 'antd'
import { EntityMetadata } from 'dvote-js'
import { getEntityMetadata } from 'dvote-js/dist/api/entity'
import { Component, ReactNode } from 'react'
import Router from 'next/router'

import { main } from '../../i18n'
import AppContext from '../../components/app-context'
import Loading from '../../components/loading'
import { getGatewayClients } from '../../lib/network'
import If from '../../components/if'
import NotFound from '../../components/not-found'
import Edit from '../../components/entities/Edit'


type State = {
    loading?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    editing: boolean,
}

// Stateful component
class EntityView extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    state: State = {
        editing: false,
    }

    componentDidMount() : void {
        this.context.setMenuSelected('profile')
        this.fetchMetadata()
    }

    async update() : Promise<void> {
        this.setState({loading: true})
        await this.fetchMetadata()
        this.setState({
            loading: false,
            editing: false,
        })

        Router.push(`/entities/#/${this.state.entityId}`)
    }

    async fetchMetadata() : Promise<void> {
        try {
            const [entityId] = this.context.params
            this.setState({ loading: true, entityId })

            const gateway = await getGatewayClients()
            const entity = await getEntityMetadata(entityId, gateway)
            if (!entity) throw new Error()

            this.setState({
                entity,
                entityId,
                loading: false,
            })
            this.context.setTitle(entity.name.default)
            this.context.setEntityId(entityId)
        }
        catch (err) {
            this.setState({ loading: false })
            message.error('Could not read the entity metadata')
        }
    }

    shouldComponentUpdate() : boolean {
        const [entityId] = this.context.params
        if (entityId !== this.state.entityId) {
            this.fetchMetadata()
        }

        return true
    }

    render() : ReactNode {
        const { entity } = this.state
        const found = entity && Object.keys(entity).length > 0

        return (
            <div className='content-wrapper'>
                <Loading loading={this.state.loading} text={main.loadingEntity}>
                    <If condition={!found}>
                        <NotFound />
                    </If>
                    <If condition={found}>
                        <Edit
                            entity={entity}
                            onSave={(success) => success && this.update()}
                            method='updateEntity'
                        />
                    </If>
                </Loading>
            </div>
        )
    }
}

export default EntityView
