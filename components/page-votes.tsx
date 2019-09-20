import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Skeleton, Spin, message } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { API, ProcessMetadata, EntityMetadata } from "dvote-js"
const { getVotesMetadata } = API.Vote

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
    loadingProcesses: boolean,
    processes: { id: string, data: ProcessMetadata }[],
    selectedProcess: string,
    showCreate: boolean
}


export default class PageVotes extends Component<Props, State> {
    state = {
        loadingProcesses: true,
        processes: [],
        selectedProcess: "",
        showCreate: false
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        if (this.props.entityDetails.votingProcesses.active.join("-") != nextProps.entityDetails.votingProcesses.active.join("-")) {
            this.loadActiveProcessData()
        }
    }

    componentDidMount() {
        this.loadActiveProcessData()
    }

    async loadActiveProcessData() {
        try {
            const gwInfo = await getRandomGatewayInfo(process.env.ETH_NETWORK_ID as any)
            if (!gwInfo) throw new Error()
            const ids = this.props.entityDetails.votingProcesses.active
            const votes = await getVotesMetadata(ids, gwInfo[process.env.ETH_NETWORK_ID])

            const processes: { id: string, data: ProcessMetadata }[] = []
            for (let k in ids) {
                processes.push({ id: ids[k], data: votes[k] })
            }
            this.setState({ processes, loadingProcesses: false })
        }
        catch (err) {
            if (err && err.message == "Request timed out")
                message.error("The list of voting processes took too long to load")
            else
                message.error("The list of voting processes could not be loaded")

            this.setState({ processes: [], loadingProcesses: false })
        }
    }

    renderPleaseWait() {
        return <div style={{ paddingTop: 30, textAlign: "center" }}>
            <Skeleton active />
            <br />
            <div>Please, wait... <Spin size="small" /></div>
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
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar>{idx + 1}</Avatar>}
                            title={item.data.details && item.data.details.title && item.data.details.title["default"]}
                            description={(item.data.type == "snark-vote" ? "Anonymous vote" : item.data.type == "poll-vote" ? "Poll" : "Petition")}
                        />
                    </List.Item>
                )}
            />
        </div>
    }

    render() {
        if (this.state.showCreate) return <PageVoteNew {...this.props} showList={() => this.setState({ showCreate: false })} />

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
                    this.state.loadingProcesses ?
                        this.renderPleaseWait() :
                        this.renderProcessesList()
                }
            </div>
        </>
    }
}
