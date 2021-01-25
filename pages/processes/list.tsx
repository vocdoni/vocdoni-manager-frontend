import { Component, ReactNode } from 'react'
import { message, Select, Row, Col } from 'antd'
import { ProcessMetadata } from 'dvote-js'
import Link from 'next/link'
import { estimateDateAtBlock, getVoteMetadata, isCanceled } from 'dvote-js/dist/api/vote'

import { getGatewayClients } from '../../lib/network'
import FinishDate from '../../components/processes/FinishDate'
import AppContext from '../../components/app-context'
import If from '../../components/if'
import Image from '../../components/image'
import Loading from '../../components/loading'
import NotFound from '../../components/not-found'
import InlineCard from '../../components/inline-card'
import { main } from '../../i18n'
import Ficon from '../../components/ficon'

type State = {
    loading?: boolean,
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

// Stateful component
export default class ProcessListView extends Component<undefined, State> {
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

            const [entityId] = this.context.params
            this.setState({ loading: true })

            const gateway = await getGatewayClients()
            await this.context.refreshEntityMetadata(entityId)

            const processIds = [
                ...this.context.entity.votingProcesses.ended,
                ...this.context.entity.votingProcesses.active
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
                loading: false,
            })
        }
        catch (err) {
            this.setState({ loading: false })

            if (err && err.message === 'Request timed out') {
                message.error('The list of voting processes took too long to load')
            }
            else if (err && err.message === 'failed') {
                message.error('One of the processes could not be loaded')
            }
            else {
                message.error('The list of voting processes could not be loaded')
            }
        }
    }

    componentDidUpdate() : void {
        if (!this.context.entityId) {
            return
        }

        const [entityId] = this.context.params
        if (entityId !== this.context.entityId && !this.context.loadingEntityMetadata && !this.state.loading) {
            this.init()
        }
    }

    filterProcesses(filter: string) : ProcessComponentData[] {
        if (filter === 'all') {
            return this.state.processes
        }

        const processes = this.context.entity.votingProcesses

        return this.state.processes.filter(({id}) => processes[filter].includes(id))
    }

    render() : ReactNode {
        const processes = this.filterProcesses(this.state.filter) || []

        return (
            <div className='content-wrapper spaced-top'>
                <Loading loading={this.context.loadingEntityMetadata} text={main.loadingEntity}>
                    <If condition={!this.context.entity}>
                        <NotFound />
                    </If>
                    <If condition={this.context.entity}>
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
                                <If condition={!this.context.isReadOnly}>
                                    <Link href={'/processes/new'}>
                                        <a style={{marginLeft: 10}}>
                                            <Ficon icon='Plus' /> New
                                        </a>
                                    </Link>
                                </If>
                            </Col>
                        </Row>
                        <Loading loading={this.state.loading} text={main.loadingProcesses}>
                            <div className='card-list'>
                                {
                                    processes.map((process) => {
                                        return <InlineCard
                                            key={process.id}
                                            image={(
                                                <Link href={`/processes#/${this.context.entityId}/${process.id}`}>
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
                                                <Link href={`/processes/#/${this.context.entityId}/${process.id}`}>
                                                    <a>{process.data.details.title.default}</a>
                                                </Link>
                                            )}
                                        >
                                            <div className='state'>
                                                <div className={`status ${process.canceled && 'finished'}`}>
                                                    {process.canceled ? main.finished : main.active}
                                                </div>
                                                <div className='date'>
                                                    <FinishDate process={process} />
                                                </div>
                                            </div>
                                        </InlineCard>
                                    })
                                }
                            </div>
                        </Loading>
                    </If>
                </Loading>
            </div>
        )
    }
}
