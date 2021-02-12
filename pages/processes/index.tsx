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
import { Signer, Wallet } from 'ethers'

import { getGatewayClients } from '../../lib/network'
import { appLink } from '../../lib/util'
import AppContext from '../../components/app-context'
import Image from '../../components/image'
import If from '../../components/if'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || "10", 10) || 10

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
    canceled: boolean,
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
        canceled: false,
        censusSize: 0,
    }

    refreshInterval = null

    componentDidMount() : void {
        this.init()
    }

    init() : Promise<any> {
        const [entityId, processId] = this.context.params
        if (!entityId || !processId) {
            message.error("The requested data is not valid")
            Router.replace("/")
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
                this.setState({ error: "Could not load the process status" })
            })
    }

    shouldComponentUpdate() : boolean {
        const params = location.hash.substr(2).split("/")
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
            const msg = [
                'There was an error updating the blockchain information.',
                'Refresh the page if you don\'t see changes in a while.',
            ]
            console.error(err)
            message.error(msg.join(' '))

            return
        }

        this.setState({ currentBlock, currentDate: moment() })
    }

    async refreshMetadata() : Promise<void> {
        try {
            this.context.setMenuSelected("processes-details")

            if (this.context.params.length !== 2) {
                message.error("The requested data is not valid")
                Router.replace("/")
                return
            }

            this.setState({ dataLoading: true })

            const [entityId] = this.context.params

            await this.context.refreshEntityMetadata(entityId, true)

            const gateway = await this.context.gatewayClients
            const process = await VotingApi.getProcessMetadata(this.context.processId, gateway)
            const processParams = await VotingApi.getProcessParameters(this.context.processId, gateway)
            const canceled = processParams.status.isCanceled
            const estimatedStartDate = await VotingApi.estimateDateAtBlock(processParams.startBlock, gateway)
            const estimatedEndDate = await VotingApi.estimateDateAtBlock(processParams.startBlock + processParams.blockCount, gateway)
            let censusSize = 0
            if (processParams.censusOrigin.isOffChain || processParams.censusOrigin.isOffChainWeighted) {
                censusSize = parseInt(await CensusOffChainApi.getCensusSize(processParams.censusRoot, gateway) || "0", 10)
            }

            this.setState({
                dataLoading: false,
                canceled,
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

            if (err && err.message === "Request timed out")
                message.error("The list of voting processes took too long to load")
            else
                message.error("The vote could not be loaded")
        }
    }

    async loadProcessResults() : Promise<void> {
        if (!this.context.processId || !this.state.process) return
        // NOTE: on polls it's fine, but on other process types may need to wait until the very end
        else if (!this.state.currentBlock || this.state.processParams.startBlock > this.state.currentBlock) return

        let hideLoading
        try {
            const gateway = await getGatewayClients()

            hideLoading = message.loading("Loading results...", 0)
            const totalVotes = await VotingApi.getEnvelopeHeight(this.context.processId, gateway)
            this.setState({ totalVotes })

            const resultsDigest = await VotingApi.getResultsDigest(this.context.processId, gateway)
            this.setState({ results: resultsDigest })
            hideLoading()
        }
        catch (err) {
            hideLoading()

            if (err) {
                console.error(err)
                if (err.message === "The results are not available") return
                else if (err.message === "Request timed out")
                    return message.error("The list of votes took too long to load")
                else if (err.message === "failed")
                    return message.error("One of the processes could not be loaded")
                else if (err.message === "Could not fetch the process results")
                    return message.error("Could not fetch the process results")
            }

            message.error("The list of voting processes could not be loaded")
        }
    }

    confirmMarkAsEnded() {
        const that = this;
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The process will be marked as ended and the vote scrutiny will be triggered (if necessary). Do you want to continue?",
            okText: "Mark as ended",
            okType: "primary",
            cancelText: "Not now",
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

            // Cancel if still needed
            if (!this.state.processParams.status.isCanceled) {
                await VotingApi.setStatus(processId, ProcessStatus.CANCELED, this.context.web3Wallet.getWallet() as (Wallet | Signer), gateway)
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
            await EntityApi.setMetadata(address, entityMetadata, this.context.web3Wallet.getWallet() as (Wallet | Signer), gateway)

            hideLoading()

            message.success("The process has ended successfully")
            this.componentDidMount() // reload
        }
        catch (err) {
            hideLoading()
            console.error("The process could not be ended", err)
            message.error("The process could not be ended")
        }

    }

    confirmRemoveEnded() {
        const that = this;
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The process will be permanently removed and this change cannot be undone. Do you want to continue?",
            okText: "Remove Permanently",
            okType: "primary",
            cancelText: "Not now",
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
            await EntityApi.setMetadata(address, entityMetadata, this.context.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            hideLoading()

            if (!this.state.processParams.status.isCanceled) {
                await VotingApi.setStatus(processId, ProcessStatus.CANCELED, this.context.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            }

            message.success("The process has been removed successfully")
            Router.push(`/processes/list/#/${this.context.address}`)
        }
        catch (err) {
            hideLoading()
            console.error("The process could not be removed", err)
            message.error("The process could not be removed")
        }

    }


    renderProcessesInfo() : ReactNode {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        // const entityId = params[0]
        const processId = params[1]

        const { process, censusSize, processParams } = this.state

        const startDate = moment(this.state.estimatedStartDate)
        const endDate = moment(this.state.estimatedEndDate)

        const processType: ProcessEnvelopeType = this.state.processParams.envelopeType

        const procQuestions = this.state.process.questions
        const resultQuestions = this.state.results && this.state.results.questions && this.state.results.questions || []
        const formURI = (this.state.process.meta?.formURI) ?  this.state.process.meta.formURI : null
        const explorerURI = `${EXPLORER_URL}/process/${processId.replace('0x', '')}`

        return <div className="body-card">
            <Row justify="space-between">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">Vote details</Divider>
                    <h3>{process.title.default}</h3>
                    <div dangerouslySetInnerHTML={{__html: process.description.default}} />

                    {
                        procQuestions.map((question, idx) => <div key={idx}>
                            <br />
                            <Divider orientation="left">Question {idx + 1}</Divider>
                            <h4>{question.title.default}</h4>
                            <div dangerouslySetInnerHTML={{__html: question.description.default}} />
                            <ul>
                                {question.choices.map((option, i) => <li key={i}>
                                    {option.title.default}
                                </li>)}
                            </ul>
                        </div>)
                    }

                    <br />

                    <Divider orientation="left">General</Divider>
                    <h4>Process Type</h4>
                    <p>{processType.value}</p>
                    <h4>Process ID</h4>
                    <p>
                        <pre><Text copyable={{text: processId}}>{processId.substr(0, 10)}...</Text></pre>
                    </p>
                    <p>
                        <Text ellipsis>
                            <a href={explorerURI} target='_blank' rel='noreferrer'>
                                Detailed info (explorer) <LinkOutlined />
                            </a>
                        </Text>
                    </p>
                    <If condition={censusSize > 0}>
                        <h4>Census Size</h4>
                        <p>
                            <pre>{censusSize}</pre>
                        </p>
                    </If>
                    {(formURI) ? (
                        <>
                            <h4>Form URI</h4>
                            <a
                                target='_blank'
                                rel='noreferrer'
                                href={appLink(`/processes/login/#/${this.context.address}/${processId}/${formURI}`)}
                            >
                                {formURI} <LinkOutlined />
                            </a>
                        </>
                    ) : null
                    }

                    <Divider orientation="left">Time frame</Divider>
                    <Row>
                        <Col xs={24} sm={12}>
                            <h4>Start date (estimated)</h4>
                            <p>{startDate.format("D/M/YYYY H:mm[h]")}</p>
                            <h4>Start block number</h4>
                            <p>{processParams.startBlock}</p>
                        </Col>
                        <Col xs={24} sm={12}>
                            <h4>End date (estimated)</h4>
                            <p>{endDate.format("D/M/YYYY H:mm[h]")}</p>
                            <h4>End block</h4>
                            <p>{processParams.startBlock + processParams.blockCount}</p>
                        </Col>
                    </Row>
                </Col>
                <Col xs={24} sm={8}>
                    <Divider orientation="left">Media</Divider>
                    <Image src={process.media.header} className='header-image' />
                    <If condition={!this.context.isReadOnly}>
                        <Divider orientation='left'>Actions</Divider>
                        <If condition={this.context.entity.votingProcesses.active.includes(processId)}>
                            <Button
                                onClick={this.confirmMarkAsEnded.bind(this)}
                                type='text'
                            >
                                <CloseCircleOutlined /> Mark as ended
                            </Button>
                        </If>
                        <If condition={this.context.entity.votingProcesses.ended.includes(processId)}>
                            <Button
                                onClick={this.confirmRemoveEnded.bind(this)}
                                type='text'
                            >
                                <CloseCircleOutlined /> Remove process from entity
                            </Button>
                        </If>
                    </If>

                    {this.renderStatus()}

                    {
                        resultQuestions.length ? <>
                            <Divider orientation="left">Results</Divider>
                            {
                                this.state.results.questions.map((entry, idx) => <ul key={idx}>
                                    <li>{entry.title.default}</li>
                                    <ul style={{ paddingLeft: 10, listStyle: "none" }}>
                                        {
                                            entry.voteResults.map((result, i) => <li key={i}>
                                                <Badge
                                                    overflowCount={9999999999}
                                                    count={result.votes.toNumber() || "–"}
                                                    style={{ backgroundColor: "#848484" }}
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
        if (this.state.canceled) items.push(<li key={items.length}>The process is now closed</li>)
        else if (this.state.currentBlock < this.state.processParams.startBlock) items.push(<li key={items.length}>The process is not active yet</li>)
        else if (this.state.currentBlock < (this.state.processParams.startBlock + this.state.processParams.blockCount)) items.push(<li key={items.length}>The process is active</li>)
        else items.push(<li key={items.length}>The process has ended</li>)

        if (this.state.totalVotes) items.push(<li key={items.length}>Votes received: {this.state.totalVotes}</li>)

        return <>
            <Divider orientation="left">Status</Divider>
            <ul>
                {items}
            </ul>
        </>
    }

    renderNotFound() : ReactNode {
        return <div className="not-found">
            <h4>Entity or vote not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() : ReactNode {
        return <div>Loading the vote details...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() : ReactNode {
        return <div id="process-view">
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    : this.state.error ? <div id="page-body" className="center">{this.state.error}</div> :
                        (this.context.entity && this.state.process) ?
                            <div id="page-body">
                                {this.renderProcessesInfo()}
                            </div>
                            : <div id="page-body" className="center">
                                {this.renderNotFound()}
                            </div>
            }
        </div >
    }
}

export default ProcessActiveView
