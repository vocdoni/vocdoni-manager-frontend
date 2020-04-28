import { createElement } from "react"
import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Avatar, Skeleton } from 'antd'
import { Divider, Menu, List } from 'antd'
import { EditOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { LoadingOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, MultiLanguage, ProcessMetadata } from "dvote-js"
const { Entity } = API
import Router from 'next/router'
import Link from "next/link"
import { INewsFeed } from '../../lib/types'
import { getEntityId, updateEntity } from 'dvote-js/dist/api/entity'
import { fetchFileString } from 'dvote-js/dist/api/file'
import { checkValidJsonFeed } from 'dvote-js/dist/models/json-feed'
import { IFeedPost } from "../../lib/types"
import Web3Wallet from "../../lib/web3-wallet"
import { Wallet, Signer } from "ethers"
import { getVoteMetadata, cancelProcess, isCanceled } from "dvote-js/dist/api/vote"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const PAGE_SIZE = 6

// MAIN COMPONENT
const ProcessActiveViewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <ProcessActiveView {...context} />
}

type State = {
    dataLoading?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    processes: ({ id: string, data: ProcessMetadata } | string)[],
    startIndex: number
}

// Stateful component
class ProcessActiveView extends Component<IAppContext, State> {
    state: State = {
        startIndex: 0,
        processes: []
    }

    async componentDidMount() {
        try {
            const entityId = location.hash.substr(2)
            this.setState({ dataLoading: true, entityId })

            const { web3Gateway, dvoteGateway } = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
            if (!entity) throw new Error()

            const processIds = entity.votingProcesses.active || []
            this.setState({ processes: processIds })

            await Promise.all((processIds).map(id => {
                return getVoteMetadata(id, web3Gateway, dvoteGateway).then(voteMetadata => {
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

            this.setState({ entity, entityId, dataLoading: false })
            this.props.setTitle(entity.name["default"])
        }
        catch (err) {
            this.setState({ dataLoading: false })

            if (err && err.message == "Request timed out")
                message.error("The list of voting processes took too long to load")
            else if (err && err.message == "failed")
                message.error("One of the processes could not be loaded")
            else
                message.error("The list of voting processes could not be loaded")
        }
    }

    async markAsEnded(processId: string) {
        let activeProcesses = JSON.parse(JSON.stringify(this.state.entity.votingProcesses.active))
        let endedProcesses = JSON.parse(JSON.stringify(this.state.entity.votingProcesses.ended))
        activeProcesses = activeProcesses.filter(id => id != processId)
        endedProcesses.unshift(processId)

        const hideLoading = message.loading('Ending the process...', 0)

        try {
            const clients = await getGatewayClients()
            const state = getNetworkState()

            // TODO: Check if the process has actually ended before proceeding consulting the
            // actual block number of Vochain and the finishBlock

            let entityMetadata = this.state.entity
            entityMetadata.votingProcesses.active = activeProcesses
            entityMetadata.votingProcesses.ended = endedProcesses

            await updateEntity(state.address, entityMetadata, Web3Wallet.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
            hideLoading()

            if (!(await isCanceled(processId, clients.web3Gateway))) {
                await cancelProcess(processId, Web3Wallet.signer as (Wallet | Signer), clients.web3Gateway)
            }

            message.success("The process has ended successfully")
            this.componentDidMount() // reload process list
        }
        catch (err) {
            hideLoading()
            console.error("The process could not be ended", err)
            message.error("The process could not be ended")
        }

    }

    renderProcessesList() {
        const entityId = location.hash.substr(2)
        const { readOnly, address } = getNetworkState()
        let hideEditControls = readOnly || !address
        if (!hideEditControls) {
            const ownEntityId = getEntityId(address)
            hideEditControls = this.state.entityId != ownEntityId
        }

        return <div className="body-card">
            <Divider orientation="left">Active votes</Divider>

            <List
                itemLayout="vertical"
                size="large"
                pagination={{
                    onChange: page => {
                        this.setState({ startIndex: (page - 1) * PAGE_SIZE })
                        window.scrollTo({ top: 0 })
                    },
                    pageSize: PAGE_SIZE
                }}
                dataSource={(this.state.processes || []) as any}
                renderItem={(vote: ({ id: string, data: ProcessMetadata } | string), idx: number) => (
                    <Skeleton avatar title={false} loading={typeof vote != "object"} active>
                        <List.Item
                            key={idx}
                            actions={hideEditControls ? [] : [
                                <IconText icon={CloseCircleOutlined} text="Mark as ended" onClick={() => this.markAsEnded((vote as any).id)} key="mark-as-ended" />,
                            ]}
                            extra={<img width={272} alt="Header not found" src={((vote as any).data as ProcessMetadata).details.headerImage} />}
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={this.state.entity.media.avatar} />}
                                title={
                                    <Link href={`/processes/#/${entityId}/${(vote as any).id}`}>
                                        <a>{((vote as any).data as ProcessMetadata).details.title["default"]}</a>
                                    </Link>
                                }
                                description={((vote as any).data as ProcessMetadata).details.description["default"]}
                            />
                        </List.Item>
                    </Skeleton>
                )}
            />
        </div>
    }

    renderNotFound() {
        return <div className="not-found">
            <h4>Entity or active processes not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() {
        return <div>Loading the votes of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    renderSideMenu() {
        const { readOnly, address } = getNetworkState()
        let hideEditControls = readOnly || !address
        if (!hideEditControls) {
            const ownEntityId = getEntityId(address)
            hideEditControls = this.state.entityId != ownEntityId
        }

        if (hideEditControls) {
            return <div id="page-menu">
                <Menu mode="inline" defaultSelectedKeys={['processes-active']} style={{ width: 200 }}>
                    <Menu.Item key="profile">
                        <Link href={"/entities/" + location.hash}>
                            <a>Profile</a>
                        </Link>
                    </Menu.Item>
                    <Menu.Item key="feed">
                        <Link href={"/posts/" + location.hash}>
                            <a>News feed</a>
                        </Link>
                    </Menu.Item>
                    <Menu.Item key="processes-active">
                        <Link href={"/processes/active/" + location.hash}>
                            <a>Active votes</a>
                        </Link>
                    </Menu.Item>
                    <Menu.Item key="processes-ended">
                        <Link href={"/processes/ended/" + location.hash}>
                            <a>Ended votes</a>
                        </Link>
                    </Menu.Item>
                </Menu>
            </div>
        }

        return <div id="page-menu">
            <Menu mode="inline" defaultSelectedKeys={['processes-active']} style={{ width: 200 }}>
                <Menu.Item key="profile">
                    <Link href={"/entities/" + location.hash}>
                        <a>Profile</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="edit">
                    <Link href={"/entities/edit/" + location.hash}>
                        <a>Edit details</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="feed">
                    <Link href={"/posts/" + location.hash}>
                        <a>News feed</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="new-post">
                    <Link href={"/posts/new/"}>
                        <a>Create post</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="processes-active">
                    <Link href={"/processes/active/" + location.hash}>
                        <a>Active votes</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="processes-ended">
                    <Link href={"/processes/ended/" + location.hash}>
                        <a>Ended votes</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="new-vote">
                    <Link href={"/processes/new/"}>
                        <a>Create vote</a>
                    </Link>
                </Menu.Item>
            </Menu>
        </div>
    }

    render() {
        return <div id="process-view">
            {this.renderSideMenu()}
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    (this.state.entity && this.state.processes && this.state.processes.length) ?
                        <div id="page-body">
                            {this.renderProcessesList()}
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

const IconText = ({ icon, text, onClick }: { icon: any, text: string, onClick?: () => void }) => (
    <span className="icon-text" onClick={() => onClick && onClick()}>
        {createElement(icon, { style: { marginRight: 8 } })}
        {text}
    </span>
);

export default ProcessActiveViewPage
