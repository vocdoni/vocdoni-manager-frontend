import { message } from 'antd'
import { EntityApi, EntityMetadata } from 'dvote-js'
import { Component, ReactNode } from 'react'
import Router from 'next/router'

import AppContext from '../../components/app-context'
import Loading from '../../components/loading'
import { getGatewayClients } from '../../lib/network'
import If from '../../components/if'
import NotFound from '../../components/not-found'
import Edit from '../../components/entities/Edit'
import i18n from '../../i18n'


type State = {
    loading?: boolean,
    entity?: EntityMetadata,
    address?: string,
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

        Router.push(`/entities/#/${this.state.address}`)
    }

    async fetchMetadata() : Promise<void> {
        try {
            const [address] = this.context.params
            this.setState({ loading: true, address })

            const gateway = await getGatewayClients()
            const entity = await EntityApi.getMetadata(address, gateway)
            if (!entity) throw new Error()

            this.setState({
                entity,
                address,
                loading: false,
            })
            this.context.setTitle(entity.name.default)
            this.context.setAddress(address)
        }
        catch (err) {
            this.setState({ loading: false })
            message.error('Could not read the entity metadata')
        }
    }

    shouldComponentUpdate() : boolean {
        const [address] = this.context.params
        if (address !== this.state.address) {
            this.fetchMetadata()
        }

        return true
    }

    render() : ReactNode {
        const { entity } = this.state
        const found = entity && Object.keys(entity).length > 0

        return (
            <div className='content-wrapper'>
                <Loading loading={this.state.loading} text={i18n.t('entity.loading')}>
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
