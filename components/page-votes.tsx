import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Skeleton, Spin, message, Row } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { API, ProcessMetadata, EntityMetadata } from "dvote-js"
const { getVoteMetadata } = API.Vote
import ReactMarkdown from 'react-markdown'

import { Layout } from 'antd'
import PageVoteNew from "./page-vote-new"
import Web3Manager from "../util/web3-wallet"
import { getGatewayClients, getState } from "../util/dvote-state"
import { updateEntity } from "dvote-js/dist/api/entity"
import { Wallet, Signer } from "ethers"
const { Header } = Layout

interface Props {
    refresh?: () => void
    entityDetails: EntityMetadata,
    currentAddress: string
}

interface State {
    processes: ({ id: string, data: ProcessMetadata } | string)[],
    selectedProcess: string,
    showCreate: boolean
}


export default class PageVotes extends Component<Props, State> {
    state = {
        processes: [],
        selectedProcess: "",
        showCreate: false
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        if (!Array.isArray(nextProps.entityDetails.votingProcesses.active)) return
        else if (this.props.entityDetails.votingProcesses.active.join("-") == nextProps.entityDetails.votingProcesses.active.join("-"))
            return
        this.loadActiveProcessData(nextProps.entityDetails.votingProcesses.active)
    }

    componentDidMount() {
        this.loadActiveProcessData(this.props.entityDetails.votingProcesses.active)
    }

    async loadActiveProcessData(processIds: string[]) {
        try {
            this.setState({ processes: processIds })  // set all as a string => loading Skeleton

            const clients = await getGatewayClients()

            const hideLoading = message.loading("Loading active votes...")

            await Promise.all(processIds.map(id => {
                return getVoteMetadata(id, clients.web3Gateway, clients.dvoteGateway).then(voteMetadata => {
                    const updatedProcesses: ({ id: string, data: ProcessMetadata } | string)[] = [].concat(this.state.processes)
                    for (let i = 0; i < this.state.processes.length; i++) {
                        if (typeof updatedProcesses[i] == "string" && updatedProcesses[i] == id) {
                            updatedProcesses[i] = { id, data: voteMetadata }
                            this.setState({ processes: updatedProcesses })
                            break
                        }
                    }
                }).catch(err => {
                    if (err && err.message == "Request timed out") throw err
                    throw new Error("failed")
                })
            }))
                .then(() => hideLoading())
                .catch(err => {
                    hideLoading()
                    throw err
                })
        }
        catch (err) {
            if (err && err.message == "Request timed out")
                message.error("The list of voting processes took too long to load")
            else if (err && err.message == "failed")
                message.error("One of the processes could not be loaded")
            else
                message.error("The list of voting processes could not be loaded")
        }
    }

    async endProcess() {
        let activeProcesses = JSON.parse(JSON.stringify(this.props.entityDetails.votingProcesses.active))
        let endedProcesses = JSON.parse(JSON.stringify(this.props.entityDetails.votingProcesses.ended))
        // let processId =  activeProcesses.findIndex(o => o.id === post)
        let processId =  activeProcesses.indexOf(this.state.selectedProcess)
        activeProcesses.splice(processId,1)
        endedProcesses.push(this.state.selectedProcess)
        

        const hideLoading = message.loading('Action in progress...', 0)

        try {
            const clients = await getGatewayClients()
            const state = getState()

            // TODO: Check if the process has actually ended before proceeding consulting the
            // actual block number of Vochain and the finishBlock

            let entityMetadata = this.props.entityDetails
            entityMetadata.votingProcesses.active = activeProcesses
            entityMetadata.votingProcesses.ended = endedProcesses

            await updateEntity(state.address, entityMetadata, Web3Manager.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
            hideLoading()

            message.success("The process has ended successfully")
            this.setState({ selectedProcess : null })
            if (this.props.refresh) this.props.refresh()
        }
        catch (err) {
            hideLoading()
            console.error("The process could not be ended", err)
            message.error("The process could not be ended")
        }

    }

    // renderPleaseWait() {
    //     return <div style={{ paddingTop: 30, textAlign: "center" }}>
    //         <Skeleton active />
    //         <br />
    //         <div>Please, wait... <Spin size="small" /></div>
    //     </div>
    // }

    renderSelectedProcess() {
        const item = this.state.processes.find(item => item.id == this.state.selectedProcess)
        if (!item || !item.data) return
        const processMeta: ProcessMetadata = item.data

        return <div style={{ padding: 30 }}>
            <Row>
                {/*<Col xs={24} sm={12}> */}
                    <img crossOrigin="anonymous" src={processMeta.details.headerImage} style={{ maxWidth: 200 }} />
                    <br /><br />
                {/* </Col> */}
                {/* <Col xs={24} sm={12}> */}
                    <h2>{processMeta.details.title["default"]}</h2>
                    <ReactMarkdown source={processMeta.details.description["default"]} />
                {/* </Col> */}
                
            </Row>

            <hr style={{ marginTop: 20, marginBottom: 20 }} />


            {processMeta.details.questions.map((question) => <>
                <h3>{question.question["default"]}</h3>
                <ReactMarkdown source={question.description["default"]} />
                <p>{question.type == "single-choice" ? "Single choice" : ""}</p>
                <ul>{question.voteOptions.map((option) => <li key={option.value}>{option.title["default"]}</li>)}</ul>
            </>)}

            <hr style={{ marginTop: 20, marginBottom: 20 }} />

            <h3>General</h3>
            <h4>Process ID</h4>
            <p>{item.id}</p>
            <h4>Census Merkle Root</h4>
            <p>{processMeta.census.merkleRoot}</p>
            <h4>Census Merkle Tree</h4>
            <p>{processMeta.census.merkleTree}</p>

            <hr style={{ marginTop: 20, marginBottom: 20 }} />

            <h3>Timeframe</h3>
            <Row>
                <Col xs={24} sm={12}>
                    <h4>Start block number</h4>
                    <p>{processMeta.startBlock}</p>
                    <h4>Start date (estimated)</h4>
                    <p>-</p>
                </Col>
                <Col xs={24} sm={12}>
                    <h4>End block</h4>
                    <p>{processMeta.startBlock + processMeta.numberOfBlocks}</p>
                    <h4>End date (estimated)</h4>
                    <p>-</p>
                </Col>
            </Row>

        </div>
    }

    renderProcessesList() {
        if (!this.state.processes || !this.state.processes.length)
            return <Empty description="No Voting Processes" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            <List
                itemLayout="horizontal"
                dataSource={this.state.processes}
                renderItem={(item: { id: string, data: ProcessMetadata }, idx) => (
                    <List.Item
                        actions={[<a key="edit-details" onClick={() => this.setState({ selectedProcess: item.id })}>View details</a>]}
                    >
                        <Skeleton avatar title={false} loading={typeof item != "object"} active>
                            {(item && item.data && item.data.type) ?
                                <List.Item.Meta
                                    avatar={<Avatar>{idx + 1}</Avatar>}
                                    title={item.data.details && item.data.details.title && item.data.details.title["default"]}
                                    // description={(item.data.type == "snark-vote" ? "Anonymous vote" : item.data.type == "poll-vote" ? "Poll" : "Petition")}
                                    description={item.data.details && item.data.details.description && item.data.details.description["default"]}
                                />
                                : null}
                        </Skeleton>
                    </List.Item>
                )}
            />
        </div>
    }

    render() {
        if (this.state.showCreate) return <PageVoteNew {...this.props} showList={() => this.setState({ showCreate: false })} />
        else if (this.state.selectedProcess) return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="unordered-list"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.setState({ selectedProcess: null })}>See all polls</Button>
                </div>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="minus"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.endProcess()}>End Process</Button>
                </div>
                <h2>Poll</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {
                    this.renderSelectedProcess()
                }
            </div>
        </>

        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="plus"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.setState({ showCreate: true })}>New Poll</Button>
                </div>
                <h2>Polls</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {
                    this.renderProcessesList()
                }
            </div>
        </>
    }
}
