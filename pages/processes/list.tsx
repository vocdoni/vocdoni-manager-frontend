import { Component, ReactNode } from 'react'
import { message, Select, Row, Col, Button } from 'antd'
import { API, EntityMetadata, ProcessMetadata } from 'dvote-js'
import moment from 'moment'
import Link from 'next/link'
import { estimateDateAtBlock, getVoteMetadata, isCanceled } from 'dvote-js/dist/api/vote'

import { getGatewayClients } from '../../lib/network'
import AppContext from '../../components/app-context'
import Image from '../../components/image'
import Loading from '../../components/loading'
import If from '../../components/if'
import NotFound from '../../components/not-found'
import { PlusOutlined } from '@ant-design/icons'
import InlineCard from '../../components/inline-card'
import { main } from '../../i18n'

const { Entity } = API

type State = {
    loading?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    processes: ProcessComponentData[],
    startIndex: number,
    filter: string,
}

type ProcessComponentData = {
    id: string,
    data: ProcessMetadata,
    date: Date,
    canceled: boolean,
}

const FinishDate = (date: Date) : string => {
    const d = moment(date)
    let suffix = main.finished

    if (d.isAfter(Date.now())) {
        suffix = main.finishes
    }

    return `${suffix} ${d.fromNow()}`
}

// Stateful component
class ProcessListView extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {
        startIndex: 0,
        processes: [],
        filter: 'all',
    }

    async componentDidMount() : Promise<void> {
        await this.init()
    }

    async init() : Promise<void> {
        try {
            this.context.setMenuSelected('processes')

            const entityId = location.hash.substr(2)
            this.setState({ loading: true, entityId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            if (!entity) throw new Error()

            const processIds = [
                ...entity.votingProcesses.ended,
                ...entity.votingProcesses.active
            ] || []

            const processes = [].concat(this.state.processes)

            await Promise.all((processIds).map(id =>
                getVoteMetadata(id, gateway).then(async (data) => {
                    for (let i = 0; i < processIds.length; i++) {
                        if (processIds[i] === id) {
                            processes[i] = {
                                id,
                                data,
                                date: await estimateDateAtBlock(data.startBlock + data.numberOfBlocks, gateway),
                                canceled: await isCanceled(id, gateway),
                            }
                            break
                        }
                    }
                }).catch(err => {
                    if (err && err.message === 'Request timed out') return
                    throw new Error('failed')
                })
            ))

            // Sort by start date, in descendent order
            processes.sort((a: ProcessComponentData, b: ProcessComponentData) => {
                if (a.date < b.date) {
                    return -1
                }
                if (a.date > b.date) {
                    return 1
                }

                return 0
            }).reverse()

            this.setState({ processes })

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

            if (err && err.message === 'Request timed out')
                message.error('The list of voting processes took too long to load')
            else if (err && err.message === 'failed')
                message.error('One of the processes could not be loaded')
            else
                message.error('The list of voting processes could not be loaded')
        }
    }

    componentDidUpdate() : void {
        const entityId = location.hash.substr(2)
        if (entityId !== this.state.entityId) {
            this.init()
        }
    }

    filterProcesses(filter: string) : ProcessComponentData[] {
        if (filter === 'all') {
            return this.state.processes
        }

        const processes = this.state.entity.votingProcesses

        return this.state.processes.filter(({id}) => processes[filter].includes(id))
    }

    render() : ReactNode {
        const found = this.state.entity && this.state.processes && this.state.processes.length
        const processes = this.filterProcesses(this.state.filter) || []

        return (
            <div className='content-wrapper'>
                <Loading loading={this.state.loading} text='Loading the votes of the entity...'>
                    <If condition={!found}>
                        <NotFound />
                    </If>
                    <If condition={found}>
                        <Row className='list-header' justify='space-between' align='middle'>
                            <Col>
                                <Select
                                    defaultValue={this.state.filter}
                                    onChange={(filter) => this.setState({filter})}
                                    size='large'
                                >
                                    <Select.Option value='all'>All processes</Select.Option>
                                    <Select.Option value='active'>Only active</Select.Option>
                                    <Select.Option value='ended'>Only ended</Select.Option>
                                </Select>
                            </Col>
                            <Col>
                                <Button href={'/processes/form'} size='small' type='link'>
                                    <a><PlusOutlined /> Create new process</a>
                                </Button>
                            </Col>
                        </Row>
                        <div className='card-list'>
                            {
                                processes.map((process) => {
                                    return <InlineCard
                                        key={process.id}
                                        image={(
                                            <Link href={`/processes#/${this.state.entityId}/${process.id}`}>
                                                <a>
                                                    <Image
                                                        src={process.data.details.headerImage}
                                                        type='background'
                                                        style={{
                                                            maxWidth: 200,
                                                        }}
                                                    />
                                                </a>
                                            </Link>
                                        )}
                                        title={(
                                            <Link href={`/processes/#/${this.state.entityId}/${process.id}`}>
                                                <a>{process.data.details.title.default}</a>
                                            </Link>
                                        )}
                                    >
                                        <div className='state'>
                                            <div className={`status ${process.canceled && 'finished'}`}>
                                                {process.canceled ? main.finished : main.active}
                                            </div>
                                            <div className='date'>
                                                {FinishDate(process.date)}
                                            </div>
                                        </div>
                                    </InlineCard>
                                })
                            }
                        </div>
                    </If>
                </Loading>
            </div>
        )
    }
}

export default ProcessListView
