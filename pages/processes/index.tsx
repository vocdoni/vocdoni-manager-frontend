import { Component, ReactNode } from 'react'
import { Divider, message, Spin, Col, Row, Badge } from 'antd'
import Text from 'antd/lib/typography/Text'
import { LinkOutlined, LoadingOutlined } from '@ant-design/icons'
import { API, EntityMetadata, ProcessMetadata, ProcessResults } from 'dvote-js'
import moment from 'moment'
import Router from 'next/router'
import { getVoteMetadata, isCanceled, estimateDateAtBlock } from 'dvote-js/dist/api/vote'

import { EXPLORER_URL } from '../../env-config'
import { getGatewayClients } from '../../lib/network'
import AppContext from '../../components/app-context'
import Image from '../../components/image'
import If from '../../components/if'
import { appLink } from '../../lib/util'
// import MainLayout from '../../components/layout'
// import { main } from '../i18n'
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const { Vote: { getBlockHeight, getEnvelopeHeight, getResultsDigest }, Entity, Census } = API
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || "10", 10) || 10

type State = {
    dataLoading?: boolean,
    currentBlock: number,
    currentDate: moment.Moment,
    entity?: EntityMetadata,
    entityId?: string,
    processId?: string,
    process?: ProcessMetadata,
    estimatedStartDate?: Date,
    estimatedEndDate?: Date,
    results: ProcessResults
    totalVotes: number,
    canceled: boolean,
    censusSize: number,
    error?: string,
}

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
        censusSize: 0
    }

    refreshInterval = null

    componentDidMount() : void {
        this.init()
    }

    init() : Promise<any> {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const entityId = params[0]
        const processId = params[1]
        this.setState({ entityId, processId })

        this.context.setEntityId(entityId)
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

    shouldComponentUpdate(nextProps, nextState) : boolean {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) return true

        if (this.state.entityId !== undefined && this.state.processId !== undefined &&
            (params[0] !== this.state.entityId || params[1] !== this.state.processId)) {
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
            currentBlock = await getBlockHeight(gateway)
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

            const params = location.hash.substr(2).split("/")
            if (params.length !== 2) {
                message.error("The requested data is not valid")
                Router.replace("/")
                return
            }

            this.setState({ dataLoading: true })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(this.state.entityId, gateway)
            if (!entity) throw new Error()

            const metadata = await getVoteMetadata(this.state.processId, gateway)
            const canceled = await isCanceled(this.state.processId, gateway)
            const estimatedStartDate = await estimateDateAtBlock(metadata.startBlock, gateway)
            const estimatedEndDate = await estimateDateAtBlock(metadata.startBlock + metadata.numberOfBlocks, gateway)

            const censusSize = parseInt(await Census.getCensusSize(metadata.census.merkleRoot, gateway) || "0", 10)

            this.setState({ entity, process: metadata, canceled, dataLoading: false, censusSize, estimatedStartDate, estimatedEndDate })
            this.context.setTitle(entity.name.default)
        }
        catch (err) {
            this.setState({ dataLoading: false })

            if (err && err.message === "Request timed out")
                message.error("The list of voting processes took too long to load")
            else
                message.error("The vote could not be loaded")
        }
    }

    async loadProcessResults() : Promise<void> {
        if (!this.state.processId || !this.state.process) return
        // NOTE: on polls it's fine, but on other process types may need to wait until the very end
        else if (!this.state.currentBlock || this.state.process.startBlock > this.state.currentBlock) return

        let hideLoading
        try {
            const gateway = await getGatewayClients()

            hideLoading = message.loading("Loading results...", 0)
            const totalVotes = await getEnvelopeHeight(this.state.processId, gateway)
            this.setState({ totalVotes })

            const resultsDigest = await getResultsDigest(this.state.processId, gateway)
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

    renderProcessesInfo() : ReactNode {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        // const entityId = params[0]
        const processId = params[1]

        const { process, censusSize } = this.state

        const startDate = moment(this.state.estimatedStartDate)
        const endDate = moment(this.state.estimatedEndDate)

        let processType: string
        switch (this.state.process.type) {
            case "poll-vote": processType = "Standard Poll"; break
            case "encrypted-poll": processType = "Encrypted Poll"; break
            case "petition-sign": processType = "Petition signing"; break
            case "snark-vote": processType = "Anonymous vote"; break
            default: processType = ""; break
        }

        const procQuestions = this.state.process.details.questions
        const resultQuestions = this.state.results && this.state.results.questions && this.state.results.questions || []
        const formURI = (this.state.process.details["formURI"]) ?  this.state.process.details["formURI"] : null
        const explorerURI = `${EXPLORER_URL}/process/${processId.replace('0x', '')}`

        return <div className="body-card">
            <Row justify="space-between">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">Vote details</Divider>
                    <h3>{process.details.title.default}</h3>
                    <div dangerouslySetInnerHTML={{__html: process.details.description.default}} />

                    {
                        procQuestions.map((question, idx) => <div key={idx}>
                            <br />
                            <Divider orientation="left">Question {idx + 1}</Divider>
                            <h4>{question.question.default}</h4>
                            <p dangerouslySetInnerHTML={{__html: question.description.default}} />
                            <ul>
                                {question.voteOptions.map((option, i) => <li key={i}>
                                    {option.title.default}
                                </li>)}
                            </ul>
                        </div>)
                    }

                    <br />

                    <Divider orientation="left">General</Divider>
                    <h4>Process Type</h4>
                    <p>{processType}</p>
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
                                href={appLink(`/processes/login/#/${process.details.entityId}/${processId}/${formURI}`)}
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
                            <p>{process.startBlock}</p>
                        </Col>
                        <Col xs={24} sm={12}>
                            <h4>End date (estimated)</h4>
                            <p>{endDate.format("D/M/YYYY H:mm[h]")}</p>
                            <h4>End block</h4>
                            <p>{process.startBlock + process.numberOfBlocks}</p>
                        </Col>
                    </Row>
                </Col>
                <Col xs={24} sm={8}>
                    <Divider orientation="left">Media</Divider>
                    <Image src={process.details.headerImage} className='header-image' />

                    {this.renderStatus()}

                    {
                        resultQuestions.length ? <>
                            <Divider orientation="left">Results</Divider>
                            {
                                this.state.results.questions.map((entry, idx) => <ul key={idx}>
                                    <li>{entry.question.default}</li>
                                    <ul style={{ paddingLeft: 10, listStyle: "none" }}>
                                        {
                                            entry.voteResults.map((result, i) => <li key={i}>
                                                <Badge
                                                    overflowCount={9999999999}
                                                    count={result.votes || "–"}
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
        else if (this.state.currentBlock < this.state.process.startBlock) items.push(<li key={items.length}>The process is not active yet</li>)
        else if (this.state.currentBlock < (this.state.process.startBlock + this.state.process.numberOfBlocks)) items.push(<li key={items.length}>The process is active</li>)
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
                        (this.state.entity && this.state.process) ?
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
