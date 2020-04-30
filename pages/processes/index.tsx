import { useContext, Component, Fragment } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Col, Row } from 'antd'
import { Divider, Menu } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, MultiLanguage, ProcessMetadata, ProcessResults } from "dvote-js"
const { Vote: { getBlockHeight, getEnvelopeHeight, getResultsDigest }, Entity } = API
import moment from 'moment'
import Router from 'next/router'
import Link from "next/link"
import { getEntityId, updateEntity } from 'dvote-js/dist/api/entity'
import { getVoteMetadata } from "dvote-js/dist/api/vote"
import SideMenu from '../../components/side-menu'
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || "10") || 10

// MAIN COMPONENT
const ProcessActiveViewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <ProcessActiveView {...context} />
}

type State = {
    dataLoading?: boolean,
    currentBlock: number,
    currentDate: moment.Moment,
    entity?: EntityMetadata,
    entityId?: string,
    processId?: string,
    process?: ProcessMetadata,
    results: ProcessResults
    totalVotes: number
}

// Stateful component
class ProcessActiveView extends Component<IAppContext, State> {
    state: State = {
        currentBlock: null,
        currentDate: moment(),
        results: null,
        totalVotes: 0
    }

    refreshInterval = null

    async componentDidMount() {
        try {
            const params = location.hash.substr(2).split("/")
            if (params.length != 2) {
                message.error("The requested data is not valid")
                Router.replace("/")
                return
            }

            await this.refreshBlockHeight()
            await this.refreshMetadata()
            await this.loadProcessResults()
            const interval = BLOCK_TIME * 1000
            this.refreshInterval = setInterval(() => this.refreshBlockHeight(), interval)
        }
        catch (err) {
        }
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    async refreshBlockHeight() {
        const gateway = await getGatewayClients()
        const currentBlock = await getBlockHeight(gateway)
        this.setState({ currentBlock, currentDate: moment() })
    }

    async refreshMetadata() {
        try {
            const params = location.hash.substr(2).split("/")
            if (params.length != 2) {
                message.error("The requested data is not valid")
                Router.replace("/")
                return
            }

            const entityId = params[0]
            const processId = params[1]

            this.setState({ dataLoading: true, entityId, processId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            if (!entity) throw new Error()

            const voteMetadata = await getVoteMetadata(processId, gateway)

            this.setState({ entity, process: voteMetadata, dataLoading: false })
            this.props.setTitle(entity.name["default"])
        }
        catch (err) {
            this.setState({ dataLoading: false })

            if (err && err.message == "Request timed out")
                message.error("The list of voting processes took too long to load")
            else
                message.error("The vote could not be loaded")
        }
    }

    async loadProcessResults() {
        if (!this.state.processId) return
        // NOTE: on polls it's fine, but on other process types may need to wait until the very end
        else if (!this.state.currentBlock || this.state.process.startBlock > this.state.currentBlock) return

        try {
            const gateway = await getGatewayClients()

            const hideLoading = message.loading("Loading results...")
            const resultsDigest = await getResultsDigest(this.state.processId, gateway)
            const totalVotes = await getEnvelopeHeight(this.state.processId, gateway)
            this.setState({ results: resultsDigest, totalVotes })
            hideLoading()
        }
        catch (err) {
            if (err) {
                console.error(err)
                if (err.message == "Request timed out")
                    return message.error("The list of votes took too long to load")
                else if (err.message == "failed")
                    return message.error("One of the processes could not be loaded")
                else if (err.message == "Could not fetch the process results")
                    return message.error("Could not fetch the process results")
            }

            message.error("The list of voting processes could not be loaded")
        }
    }

    renderProcessesInfo() {
        const params = location.hash.substr(2).split("/")
        if (params.length != 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const entityId = params[0]
        const processId = params[1]

        const { process, currentBlock, currentDate } = this.state

        const startTimestamp = currentDate.valueOf() + (process.startBlock - currentBlock) * BLOCK_TIME * 1000
        const startDate = moment(startTimestamp)
        const endDate = moment(startTimestamp + process.numberOfBlocks * BLOCK_TIME * 1000)

        const procQuestions = this.state.process.details.questions
        const resultQuestions = this.state.results && this.state.results.questions && this.state.results.questions || []

        return <div className="body-card">
            <Row justify="space-between">
                <Col xs={24} sm={15}>
                    <Divider orientation="left">Vote details</Divider>
                    <h3>{process.details.title.default}</h3>
                    <p>{process.details.description.default}</p>

                    {
                        procQuestions.map((question, idx) => <div key={idx}>
                            <br />
                            <Divider orientation="left">Question {idx + 1}</Divider>
                            <h4>{question.question.default}</h4>
                            <p>{question.description.default}</p>
                            <ul>
                                {question.voteOptions.map((option, i) => <li key={i}>
                                    {option.title.default}
                                </li>)}
                            </ul>
                        </div>)
                    }

                    <br />

                    <Divider orientation="left">General</Divider>
                    <h4>Process ID</h4>
                    <pre>{processId}</pre>
                    <h4>Census Merkle Root</h4>
                    <pre>{process.census.merkleRoot}</pre>
                    <h4>Census Merkle Tree</h4>
                    <pre>{process.census.merkleTree}</pre>
                    <br />

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
                    <img src={process.details.headerImage} className="header-image" />

                    {
                        resultQuestions.length ? <>
                            <Divider orientation="left">Results</Divider>
                            {
                                this.state.results.questions.map((entry, idx) => <Fragment key={idx}>
                                    <Col xs={24}>
                                        <h4>{entry.question.default}</h4>
                                        {this.state.totalVotes ? <p>Total votes {this.state.totalVotes}</p> : null}
                                        <ul style={{ listStyleType: 'none' }}>
                                            {
                                                entry.voteResults.map((result, i) => <li key={i}>
                                                    {result.votes || 0}: {result.title.default}
                                                </li>)
                                            }
                                        </ul>
                                    </Col>
                                </Fragment>)
                            }
                        </> : null
                    }
                </Col>
            </Row>
        </div >
    }

    renderNotFound() {
        return <div className="not-found">
            <h4>Entity or vote not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() {
        return <div>Loading the vote details...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() {
        return <div id="process-view">
            <SideMenu entityId={this.state.entityId} selected="processes-details" />
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
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

// // Using a custom layout
// ProcessActiveViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default ProcessActiveViewPage
