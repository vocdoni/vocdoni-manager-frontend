import { createElement } from "react"
import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Avatar, Skeleton, Modal } from 'antd'
import { Divider, Menu, List } from 'antd'
import { EditOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
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
import { Wallet, Signer } from "ethers"
import { getVoteMetadata, isCanceled, cancelProcess } from "dvote-js/dist/api/vote"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const PAGE_SIZE = 6

// MAIN COMPONENT
const ProcessEndedViewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <ProcessEndedView {...context} />
}

type State = {
    dataLoading?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    processes: ({ id: string, data: ProcessMetadata } | string)[],
    startIndex: number
}

// Stateful component
class ProcessEndedView extends Component<IAppContext, State> {
    state: State = {
        startIndex: 0,
        processes: []
    }

    async componentDidMount() {
        try {
            this.props.setMenuSelected("processes-ended")
            
            const entityId = location.hash.substr(2)
            this.setState({ dataLoading: true, entityId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            if (!entity) throw new Error()

            const processIds = entity.votingProcesses.ended || []
            this.setState({ processes: processIds })

            await Promise.all((processIds).map(id => {
                return getVoteMetadata(id, gateway).then(voteMetadata => {
                    const updatedProcesses: ({ id: string, data: ProcessMetadata } | string)[] = [].concat(this.state.processes)
                    for (let i = 0; i < this.state.processes.length; i++) {
                        if (typeof updatedProcesses[i] == "string" && updatedProcesses[i] == id) {
                            updatedProcesses[i] = { id, data: voteMetadata }
                            this.setState({ processes: updatedProcesses })
                            break
                        }
                    }
                }).catch(err => {
                    if (err && err.message == "Request timed out") return
                    throw new Error("failed")
                })
            }))

            this.setState({ entity, entityId, dataLoading: false })
            this.props.setTitle(entity.name["default"])
            this.props.setEntityId(entityId)
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

    confirmRemoveFromEnded(processId: string) {
        var that = this;
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "Are you sure you want to remove permanently this process?",
            okText: "Remove Permanently",
            okType: "primary",
            cancelText: "Not now",
            onOk() {
                that.removeFromEnded(processId)
            },
        })
    }

    async removeFromEnded(processId: string) {
        let activeProcesses = JSON.parse(JSON.stringify(this.state.entity.votingProcesses.active)).filter(id => id != processId)
        let endedProcesses = JSON.parse(JSON.stringify(this.state.entity.votingProcesses.ended)).filter(id => id != processId)

        const hideLoading = message.loading('Removing the process...', 0)

        try {
            const gateway = await getGatewayClients()
            const state = getNetworkState()

            let entityMetadata = this.state.entity
            entityMetadata.votingProcesses.active = activeProcesses
            entityMetadata.votingProcesses.ended = endedProcesses

            const address = this.props.web3Wallet.getAddress()
            await updateEntity(address, entityMetadata, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            hideLoading()

            if (!(await isCanceled(processId, gateway))) {
                await cancelProcess(processId, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            }

            message.success("The process has been removed successfully")
            this.componentDidMount() // reload process list
        }
        catch (err) {
            hideLoading()
            console.error("The process could not be removed", err)
            message.error("The process could not be removed")
        }

    }

    renderProcessesList() {
        const entityId = location.hash.substr(2)
        const address = this.props.web3Wallet.getAddress()
        const { readOnly } = getNetworkState()

        let hideEditControls = readOnly || !address
        if (!hideEditControls) {
            const ownEntityId = getEntityId(address)
            hideEditControls = this.state.entityId != ownEntityId
        }

        return <div className="body-card">
            <Divider orientation="left">Ended votes</Divider>

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
                                <IconText icon={CloseCircleOutlined} text="Remove permanently" onClick={() => this.confirmRemoveFromEnded((vote as any).id)} key="mark-as-ended" />,
                            ]}
                            extra={<img width={272} alt="Header" src={((vote as any).data as ProcessMetadata).details.headerImage} />}
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={this.state.entity.media.avatar} />}
                                title={
                                    <Link href={`/processes/#${entityId}/${(vote as any).id}`}>
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
            <h4>Entity or ended processes not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() {
        return <div>Loading the votes of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() {
        return <div id="process-view">
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
// ProcessEndedViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

const IconText = ({ icon, text, onClick }: { icon: any, text: string, onClick?: () => void }) => (
    <span className="icon-text" onClick={() => onClick && onClick()}>
        {createElement(icon, { style: { marginRight: 8 } })}
        {text}
    </span>
);

export default ProcessEndedViewPage
