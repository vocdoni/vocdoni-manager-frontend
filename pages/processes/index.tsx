import { Component, ReactNode } from 'react'
import { Divider, message, Spin, Col, Row, Badge, Button, Modal } from 'antd'
import Text from 'antd/lib/typography/Text'
import { CloseCircleOutlined, ExclamationCircleOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons'
import {
    CensusOffChainApi,
    DigestedProcessResults,
    EntityApi,
    ProcessContractParameters,
    ProcessEnvelopeType,
    ProcessMetadata,
    ProcessStatus,
    VotingApi,
} from 'dvote-js'
import moment from 'moment'
import Router from 'next/router'

import { getGatewayClients } from '../../lib/network'
import { appLink } from '../../lib/util'
import AppContext from '../../components/app-context'
import Image from '../../components/image'
import If from '../../components/if'
import i18n from '../../i18n'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || '10', 10) || 10

type State = {
    dataLoading?: boolean,
    currentBlock: number,
    currentDate: moment.Moment,
    processId?: string,
    process?: ProcessMetadata,
    processParams?: ProcessContractParameters,
    estimatedStartDate?: Date,
    estimatedEndDate?: Date,
    results: DigestedProcessResults,
    totalVotes: number,
    ended: boolean,
    censusSize: number,
    error?: string,
}

const { EXPLORER_URL } = process.env

// Stateful component
class ProcessActiveView extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {
        currentBlock: null,
        currentDate: moment(),
        results: null,
        totalVotes: 0,
        ended: false,
        censusSize: 0,
    }

    refreshInterval = null

    componentDidMount() : void {
        this.init()
    }

    init() : Promise<any> {
        const [entityId, processId] = this.context.params
        if (!entityId || !processId) {
            message.error(i18n.t('error.invalid_request'))
            Router.replace('/')
            return
        }

        this.context.setAddress(entityId)
        this.context.setProcessId(processId)

        return this.refreshBlockHeight()
            .then(() => this.refreshMetadata())
            .then(() => this.loadProcessResults())
            .then(() => {
                const interval = BLOCK_TIME * 1000
                if (!this.refreshInterval) {
                    this.refreshInterval = setInterval(() =>
                        this.refreshBlockHeight()
                    , interval)
                }
            }).catch(err => {
                console.error(err)
                this.setState({ error: i18n.t('process.error.status') })
            })
    }

    shouldComponentUpdate() : boolean {
        const params = location.hash.substr(2).split('/')
        if (params.length !== 2) return true

        if (this.context.address !== undefined && this.context.processId !== undefined &&
            (params[0] !== this.context.address || params[1] !== this.context.processId)) {
            this.init()
        }

        return true
    }

    componentWillUnmount() : void {
        clearInterval(this.refreshInterval)
    }

    async refreshBlockHeight() : Promise<void> {
        let gateway = null,
            currentBlock = this.state.currentBlock || 0
        try {
            gateway = await getGatewayClients()
            currentBlock = await VotingApi.getBlockHeight(gateway)
        } catch (err) {
            console.error(err)
            message.error(i18n.t('error.update'))

            return
        }

        this.setState({ currentBlock, currentDate: moment() })
    }

    async refreshMetadata() : Promise<void> {
        try {
            this.context.setMenuSelected('processes-details')

            if (this.context.params.length !== 2) {
                message.error(i18n.t('error.invalid_request'))
                Router.replace('/')
                return
            }

            this.setState({ dataLoading: true })

            const [entityId] = this.context.params

            await this.context.refreshEntityMetadata(entityId, true)

            const gateway = await this.context.gatewayClients
            const process = await VotingApi.getProcessMetadata(this.context.processId, gateway)
            const processParams = await VotingApi.getProcessParameters(this.context.processId, gateway)
            const ended = processParams.status.isEnded
            const estimatedStartDate = await VotingApi.estimateDateAtBlock(processParams.startBlock, gateway)
            const estimatedEndDate = await VotingApi.estimateDateAtBlock(processParams.startBlock + processParams.blockCount, gateway)
            let censusSize = 0
            if (processParams.censusOrigin.isOffChain || processParams.censusOrigin.isOffChainWeighted) {
                censusSize = parseInt(await CensusOffChainApi.getCensusSize(processParams.censusRoot, gateway) || '0', 10)
            }

            this.setState({
                dataLoading: false,
                ended,
                process,
                processParams,
                censusSize,
                estimatedStartDate,
                estimatedEndDate,
            })
        }
        catch (err) {
            console.error(err)
            this.setState({ dataLoading: false })

            if (err && err.message === 'Request timed out')
                message.error('The list of voting processes took too long to load')
            else
                message.error('The vote could not be loaded')
        }
    }

    async loadProcessResults() : Promise<void> {
        if (!this.context.processId || !this.state.process) return
        // NOTE: on polls it's fine, but on other process types may need to wait until the very end
        else if (!this.state.currentBlock || this.state.processParams.startBlock > this.state.currentBlock) return

        let hideLoading
        try {
            const gateway = await getGatewayClients()

            hideLoading = message.loading(i18n.t('process.loading_results'), 0)
            const totalVotes = await VotingApi.getEnvelopeHeight(this.context.processId, gateway)
            this.setState({ totalVotes })

            const resultsDigest = await VotingApi.getResultsDigest(this.context.processId, gateway)
            this.setState({ results: resultsDigest })
            hideLoading()
        }
        catch (err) {
            console.error(err)
            hideLoading()

            if (err) {
                if (err.message === 'The results are not available') return
                else if (err.message === 'Request timed out')
                    return message.error('The list of votes took too long to load')
                else if (err.message === 'failed')
                    return message.error('One of the processes could not be loaded')
                else return message.error(err.message)
            }

            message.error('The list of voting processes could not be loaded')
        }
    }

    confirmMarkAsEnded() {
        const that = this;
        Modal.confirm({
            title: i18n.t('confirm'),
            icon: <ExclamationCircleOutlined />,
            content: i18n.t('process.confirm_mark_ended'),
            okText: i18n.t('process.btn.mark_ended'),
            okType: 'primary',
            cancelText: i18n.t('btn.cancel'),
            onOk() {
                that.markAsEnded()
            },
        })
    }

    async markAsEnded() {
        const hideLoading = message.loading('Ending the process...', 0)
        const processId = this.context.processId
        try {
            const gateway = await this.context.gatewayClients

            // End if still needed
            if (!this.state.processParams.status.isEnded) {
                await VotingApi.setStatus(processId, ProcessStatus.ENDED, this.context.web3Wallet.getWallet(), gateway)
            }

            // Relist
            let activeProcesses = JSON.parse(JSON.stringify(this.context.entity.votingProcesses.active))
            const endedProcesses = JSON.parse(JSON.stringify(this.context.entity.votingProcesses.ended))
            activeProcesses = activeProcesses.filter(id => id !== processId)
            endedProcesses.unshift(processId)

            const entityMetadata = this.context.entity
            entityMetadata.votingProcesses.active = activeProcesses
            entityMetadata.votingProcesses.ended = endedProcesses

            const address = this.context.web3Wallet.getAddress()
            await EntityApi.setMetadata(address, entityMetadata, this.context.web3Wallet.getWallet(), gateway)

            hideLoading()

            message.success('The process has ended successfully')
            this.componentDidMount() // reload
        }
        catch (err) {
            hideLoading()
            console.error('The process could not be ended', err)
            message.error('The process could not be ended')
        }

    }

    confirmRemoveEnded() {
        const that = this;
        Modal.confirm({
            title: 'Confirm',
            icon: <ExclamationCircleOutlined />,
            content: 'The process will be permanently removed and this change cannot be undone. Do you want to continue?',
            okText: 'Remove Permanently',
            okType: 'primary',
            cancelText: 'Not now',
            onOk() {
                that.removeFromEnded()
            },
        })
    }

    async removeFromEnded() {
        const processId = this.context.processId
        const endedProcesses = JSON.parse(JSON.stringify(this.context.entity.votingProcesses.ended)).filter(id => id !== processId)
        const hideLoading = message.loading('Removing the process...', 0)

        try {
            const gateway = await this.context.gatewayClients

            const entityMetadata = this.context.entity
            entityMetadata.votingProcesses.ended = endedProcesses

            const address = this.context.web3Wallet.getAddress()
            await EntityApi.setMetadata(address, entityMetadata, this.context.web3Wallet.getWallet(), gateway)
            hideLoading()

            if (!this.state.processParams.status.isCanceled) {
                await VotingApi.setStatus(processId, ProcessStatus.CANCELED, this.context.web3Wallet.getWallet(), gateway)
            }

            message.success('The process has been removed successfully')
            Router.push(`/processes/list/#/${this.context.address}`)
        }
        catch (err) {
            hideLoading()
            console.error('The process could not be removed', err)
            message.error('The process could not be removed')
        }

    }


    renderProcessesInfo() : ReactNode {
        if (this.context.params.length !== 2) {
            message.error('The requested data is not valid')
            Router.replace('/')
            return
        }

        const [,processId] = this.context.params
        const { process, censusSize, processParams } = this.state
        const startDate = moment(this.state.estimatedStartDate)
        const endDate = moment(this.state.estimatedEndDate)

        const processType: ProcessEnvelopeType = this.state.processParams.envelopeType

        const procQuestions = this.state.process.questions
        const resultQuestions = this.state.results && this.state.results.questions && this.state.results.questions || []
        const formUri = (this.state.process.meta?.formUri) ?  this.state.process.meta.formUri : null
        const explorerURI = `${EXPLORER_URL}/process/${processId.replace('0x', '')}`

        return <div className='body-card'>
            <Row justify='space-between'>
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation='left'>{i18n.t('process.details')}</Divider>
                    <h3>{process.title.default}</h3>
                    <div className='styled-content' dangerouslySetInnerHTML={{__html: process.description.default}} />

                    {
                        procQuestions.map((question, idx) => <div key={idx}>
                            <br />
                            <Divider orientation='left'>
                                {i18n.t('process.question_number', {num: idx + 1})}
                            </Divider>
                            <h4>{question.title.default}</h4>
                            <div className='styled-content' dangerouslySetInnerHTML={{__html: question.description.default}} />
                            <ul>
                                {question.choices.map((option, i) => <li key={i}>
                                    {option.title.default}
                                </li>)}
                            </ul>
                        </div>)
                    }

                    <br />

                    <Divider orientation='left'>{i18n.t('process.general')}</Divider>
                    <h4>{i18n.t('process.type')}</h4>
                    <p>{processType.value}</p>
                    <h4>{i18n.t('process.id')}</h4>
                    <pre>
                        <Text copyable={{text: processId}}>{processId.substr(0, 10)}...</Text>
                    </pre>
                    <p>
                        <Text ellipsis>
                            <a href={explorerURI} target='_blank' rel='noreferrer'>
                                {i18n.t('process.detailed_info')} <LinkOutlined />
                            </a>
                        </Text>
                    </p>
                    <If condition={censusSize > 0}>
                        <h4>{i18n.t('process.census_size')}</h4>
                        <pre>{censusSize}</pre>
                    </If>
                    {(formUri) ? (
                        <>
                            <h4>{i18n.t('process.login_uri')}</h4>
                            <a
                                target='_blank'
                                rel='noreferrer'
                                href={appLink(`/processes/login/#/${this.context.address}/${processId}/${formUri}`)}
                            >
                                {formUri} <LinkOutlined />
                            </a>
                        </>
                    ) : null
                    }

                    <Divider orientation='left'>{i18n.t('process.time_frame')}</Divider>
                    <Row>
                        <Col xs={24} sm={12}>
                            <h4>{i18n.t('process.start_date')}</h4>
                            <p>{startDate.format('D/M/YYYY H:mm[h]')}</p>
                            <h4>{i18n.t('process.start_block')}</h4>
                            <p>{processParams.startBlock}</p>
                        </Col>
                        <Col xs={24} sm={12}>
                            <h4>{i18n.t('process.end_date')}</h4>
                            <p>{endDate.format('D/M/YYYY H:mm[h]')}</p>
                            <h4>{i18n.t('process.end_block')}</h4>
                            <p>{processParams.startBlock + processParams.blockCount}</p>
                        </Col>
                    </Row>
                </Col>
                <Col xs={24} sm={8}>
                    <Divider orientation='left'>{i18n.t('process.media')}</Divider>
                    <Image src={process.media.header} className='header-image' />
                    <If condition={!this.context.isReadOnly}>
                        <Divider orientation='left'>{i18n.t('process.actions')}</Divider>
                        <If condition={this.context.entity.votingProcesses.active.includes(processId)}>
                            <Button
                                onClick={this.confirmMarkAsEnded.bind(this)}
                                type='text'
                            >
                                <CloseCircleOutlined /> {i18n.t('process.btn.mark_ended')}
                            </Button>
                        </If>
                        <If condition={this.context.entity.votingProcesses.ended.includes(processId)}>
                            <Button
                                onClick={this.confirmRemoveEnded.bind(this)}
                                type='text'
                            >
                                <CloseCircleOutlined /> {i18n.t('process.btn.remove')}
                            </Button>
                        </If>
                    </If>

                    {this.renderStatus()}

                    {
                        resultQuestions.length ? <>
                            <Divider orientation='left'>{i18n.t('process.results')}</Divider>
                            {
                                this.state.results.questions.map((entry, idx) => <ul key={idx}>
                                    <li>{entry.title.default}</li>
                                    <ul style={{ paddingLeft: 10, listStyle: 'none' }}>
                                        {
                                            entry.voteResults.map((result, i) => <li key={i}>
                                                <Badge
                                                    overflowCount={9999999999}
                                                    count={result.votes.toNumber() || '–'}
                                                    style={{ backgroundColor: '#848484' }}
                                                />
                                                &nbsp;{result.title.default}
                                            </li>)
                                        }
                                    </ul>
                                </ul>)
                            }
                        </> : null
                    }
                </Col>
            </Row>
        </div >
    }

    renderStatus() : ReactNode {
        if (!this.state.currentBlock || !this.state.process) return null

        const items: ReactNode[] = []
        if (this.state.ended) items.push(<li key={items.length}>{i18n.t('process.status.closed')}</li>)
        else if (this.state.currentBlock < this.state.processParams.startBlock) items.push(<li key={items.length}>{i18n.t('process.status.inactive')}</li>)
        else if (this.state.currentBlock < (this.state.processParams.startBlock + this.state.processParams.blockCount)) items.push(<li key={items.length}>{i18n.t('process.status.active')}</li>)
        else items.push(<li key={items.length}>{i18n.t('process.status.finished')}</li>)

        if (this.state.totalVotes) items.push(<li key={items.length}>{i18n.t('process.votes_received', {total: this.state.totalVotes})}</li>)

        return <>
            <Divider orientation='left'>{i18n.t('process.status.title')}</Divider>
            <ul>
                {items}
            </ul>
        </>
    }

    renderNotFound() : ReactNode {
        return (
            <div className='not-found'>
                <h4>{i18n.t('process.error.not_found')}</h4>
                <p>{i18n.t('process.error.not_found_description')}</p>
            </div>
        )
    }

    renderLoading() : ReactNode {
        return <div>{i18n.t('process.loading')}  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() : ReactNode {
        return <div id='process-view'>
            {
                this.state.dataLoading ?
                    <div id='page-body' className='center'>
                        {this.renderLoading()}
                    </div>
                    : this.state.error ? <div id='page-body' className='center'>{this.state.error}</div> :
                        (this.context.entity && this.state.process) ?
                            <div id='page-body'>
                                {this.renderProcessesInfo()}
                            </div>
                            : <div id='page-body' className='center'>
                                {this.renderNotFound()}
                            </div>
            }
        </div >
    }
}

export default ProcessActiveView
