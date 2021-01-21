import { message } from 'antd'
import { EntityMetadata } from 'dvote-js'
import { getEntityMetadata } from 'dvote-js/dist/api/entity'
import { Component, ReactNode } from 'react'

import { main } from '../../i18n'
import AppContext from '../../components/app-context'
import Loading from '../../components/loading'
import { getGatewayClients } from '../../lib/network'
import If from '../../components/if'
import NotFound from '../../components/not-found'
import View from '../../components/entities/View'
import Edit from '../../components/entities/Edit'


type State = {
    loading?: boolean,
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
        await this.fetchMetadata(true)
        this.setState({
            loading: false,
            editing: false,
        })
    }

    async fetchMetadata(force = false) : Promise<void> {
        try {
            const [entityId] = this.context.params
            await this.context.refreshEntityMetadata(entityId, force)

            this.context.setTitle(this.context.entity.name.default)
        }
        catch (err) {
            this.setState({ loading: false })
            message.error('Could not read the entity metadata')
        }
    }

    shouldComponentUpdate() : boolean {
        const [entityId] = this.context.params
        if (entityId !== this.context.entityId) {
            this.fetchMetadata()
        }

        return true
    }

    render() : ReactNode {
        const { entity, entityId } = this.context
        const found = entity && Object.keys(entity).length > 0
        const loading = this.state.loading || this.context.loadingEntityMetadata

        return (
            <div className='content-wrapper'>
                <Loading loading={loading} text={main.loadingEntity}>
                    <If condition={!found}>
                        <NotFound />
                    </If>
                    <If condition={found}>
                        <If condition={!this.state.editing}>
                            <View
                                id={entityId}
                                onEditClick={() => this.setState({editing: true})}
                            />
                        </If>
                        <If condition={this.state.editing}>
                            <Edit
                                entity={entity}
                                onSave={(success) => success && this.update()}
                                method='updateEntity'
                            />
                        </If>
                    </If>
                </Loading>
            </div>
        )
    }
}

export default EntityView
