import { Component, ReactNode } from 'react'
import { message, Select, Row, Col } from 'antd'
import { ProcessContractParameters, ProcessMetadata, VotingApi } from 'dvote-js'
import Link from 'next/link'
import Router from 'next/router'

import { getGatewayClients } from '../../lib/network'
import { findHexId } from '../../lib/util'
import FinishDate from '../../components/processes/FinishDate'
import AppContext from '../../components/app-context'
import If from '../../components/if'
import Image from '../../components/image'
import Loading from '../../components/loading'
import NotFound from '../../components/not-found'
import InlineCard from '../../components/inline-card'
import Ficon from '../../components/ficon'
import i18n from '../../i18n'

type State = {
    loading?: boolean,
    processes: {
        [key: string]: ProcessComponentData,
    },
    syncedProcesses: string[],
    keys: string[],
    startIndex: number,
    filter: string,
}

type ProcessComponentData = {
    id: string,
    data: ProcessMetadata,
    params: ProcessContractParameters,
    date: Date,
}

// Stateful component
export default class ProcessListView extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {
        startIndex: 0,
        processes: {},
        syncedProcesses: [],
        keys: [],
        filter: 'all',
    }

    async componentDidMount() : Promise<void> {
        await this.init()
    }

    async init() : Promise<void> {
        try {
            this.context.setMenuSelected('processes')

            const [address, r] = this.context.params
            if (!address?.length) {
                Router.replace('/')
                return
            }

            this.setState({ loading: true })

            // An `/r` is appended when creating a process to properly refresh entity metadata
            const refresh = r && r === 'r'
            const gateway = await getGatewayClients()
            await this.context.refreshEntityMetadata(address, refresh)

            const processIds = [
                ...this.context.entity.votingProcesses.ended,
                ...this.context.entity.votingProcesses.active
            ] || []

            const processes = {...this.state.processes}
            const keys = []

            const syncedProcesses = await VotingApi.getProcessList(address, gateway)
            await Promise.all((processIds).map(async (id) => {
                const params = await VotingApi.getProcessParameters(id, gateway)
                const data = await VotingApi.getProcessMetadata(id, gateway)

                processes[id] = {
                    id,
                    params,
                    data,
                    date: await VotingApi.estimateDateAtBlock(params.startBlock + params.blockCount, gateway),
                }

                keys.push(id)
            }))

            // Sort by end date, in descendent order
            keys.sort((a: string, b: string) => {
                const ap = processes[a]
                const bp = processes[b]
                if (ap.date < bp.date) {
                    return -1
                }
                if (ap.date > bp.date) {
                    return 1
                }

                return 0
            }).reverse()

            this.setState({ processes, syncedProcesses, keys })
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

            console.error(err)
        }
    }

    componentDidUpdate() : void {
        if (!this.context.address) {
            return
        }

        const [entityId] = this.context.params
        if (entityId !== this.context.address && !this.context.loadingEntityMetadata && !this.state.loading) {
            this.init()
        }
    }

    filterProcesses(filter: string) : string[] {
        if (filter === 'all') {
            return this.state.keys
        }

        const processes = this.context.entity.votingProcesses

        return this.state.keys.filter((id) => processes[filter].includes(id))
    }

    render() : ReactNode {
        const processes = this.filterProcesses(this.state.filter) || []

        return (
            <div className='content-wrapper spaced-top'>
                <Loading loading={this.context.loadingEntityMetadata} text={i18n.t('entity.loading')}>
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
                                    <Select.Option value='all'>{i18n.t('process.all')}</Select.Option>
                                    <Select.Option value='active'>{i18n.t('process.active')}</Select.Option>
                                    <Select.Option value='ended'>{i18n.t('process.ended')}</Select.Option>
                                </Select>
                            </Col>
                            <Col>
                                <If condition={!this.context.isReadOnly}>
                                    <Link href={'/processes/new'}>
                                        <a style={{marginLeft: 10}}>
                                            <Ficon icon='Plus' /> {i18n.t('process.btn.new')}
                                        </a>
                                    </Link>
                                </If>
                            </Col>
                        </Row>
                        <Loading loading={this.state.loading} text={i18n.t('loadingProcesses')}>
                            <div className='card-list'>
                                {
                                    processes.map((id) => {
                                        const process : ProcessComponentData = this.state.processes[id]
                                        const props : {className? : string} = {}
                                        const synced = this.state.syncedProcesses.find(findHexId(id))
                                        if (!synced) {
                                            props.className = 'unsync'
                                        }

                                        return <InlineCard
                                            {...props}
                                            key={process.id}
                                            image={(
                                                <Link href={`/processes#/${this.context.address}/${process.id}`}>
                                                    <a>
                                                        <Image
                                                            src={process.data.media.header}
                                                            type='background'
                                                            style={{
                                                                maxWidth: 200,
                                                            }}
                                                        />
                                                    </a>
                                                </Link>
                                            )}
                                            title={(
                                                <Link href={`/processes/#/${this.context.address}/${process.id}`}>
                                                    <a>{process.data.title.default}</a>
                                                </Link>
                                            )}
                                        >
                                            <div className='state'>
                                                <div className={`status ${process.params.status.isCanceled && 'finished'}`}>
                                                    {process.params.status.isCanceled ? i18n.t('finished') : i18n.t('active')}
                                                    <If condition={!synced}>
                                                        <span className='unsync'>
                                                            &nbsp; (Not in sync)
                                                        </span>
                                                    </If>
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
