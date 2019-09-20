import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Skeleton, Spin, message, Row } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { API, ProcessMetadata, EntityMetadata } from "dvote-js"
const { getVoteMetadata } = API.Vote

import { Layout } from 'antd'
import PageVoteNew from "./page-vote-new"
import { getRandomGatewayInfo } from "dvote-js/dist/net/gateway-bootnodes"
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

            const gwInfo = await getRandomGatewayInfo(process.env.ETH_NETWORK_ID as any)
            if (!gwInfo) throw new Error()

            const hideLoading = message.loading("Loading active votes...")

            await Promise.all(processIds.map(id => {
                return getVoteMetadata(id, gwInfo[process.env.ETH_NETWORK_ID]).then(voteMetadata => {
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
                <Col xs={24} sm={12}>
                    <h2>{processMeta.details.title["default"]}</h2>
                    <p>{processMeta.details.description["default"]}</p>
                </Col>
                <Col xs={24} sm={12}>
                    <img src={processMeta.details.headerImage} style={{ maxWidth: 200 }} />
                </Col>
                <Col xs={24} >
                    <h3>Census</h3>
                    <p>Merkle Root: {processMeta.census.merkleRoot}</p>
                    <p>Merkle Tree: {processMeta.census.merkleTree}</p>
                </Col>
            </Row>
            <hr style={{ marginTop: 20, marginBottom: 20 }} />
            {processMeta.details.questions.map((question) => <>
                <h3>{question.question["default"]}</h3>
                <p>{question.description["default"]}</p>
                <p>{question.type == "single-choice" ? "Single choice" : ""}</p>
                <ul>{question.voteOptions.map((option) => <li key={option.value}>{option.title["default"]}</li>)}</ul>
            </>)}
        </div>
    }

    renderProcessesList() {
        if (!this.state.processes || !this.state.processes.length)
            return <Empty description="No Voting Processes" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            <h3>Active votes</h3>
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
                                    description={(item.data.type == "snark-vote" ? "Anonymous vote" : item.data.type == "poll-vote" ? "Poll" : "Petition")}
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
                        onClick={() => this.setState({ selectedProcess: null })}>Show vote list</Button>
                </div>
                <h2>Voting processes</h2>
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
                        onClick={() => this.setState({ showCreate: true })}>Create voting process</Button>
                </div>
                <h2>Voting processes</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {
                    this.renderProcessesList()
                }
            </div>
        </>
    }
}
