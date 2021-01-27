import { useContext, Component, createElement } from 'react'
import { message, Spin, Avatar, Modal, Divider, List } from 'antd'
import {
    LoadingOutlined,
    ExclamationCircleOutlined,
    EditOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons'
import {
    checkValidJsonFeed,
    EntityApi,
    EntityMetadata,
    FileApi,
    MultiLanguage,
} from 'dvote-js'
import Link from 'next/link'
import { Wallet, Signer } from 'ethers'

import AppContext, { IAppContext } from '../../components/app-context'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { IFeedPost, INewsFeed } from '../../lib/types'
import Image from '../../components/image'

const PAGE_SIZE = 6

// MAIN COMPONENT
const PostViewPage = () => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <PostView {...context} />
}

type State = {
    dataLoading?: boolean,
    entity?: EntityMetadata,
    address?: string,
    newsFeed?: INewsFeed,
    startIndex: number
}

// Stateful component
class PostView extends Component<IAppContext, State> {
    state: State = {
        startIndex: 0
    }

    async componentDidMount() {
        this.props.setMenuSelected("feed")
        await this.fecthMetadata()
    }

    async fecthMetadata() {
        try {
            const address = location.hash.substr(2)
            this.setState({ dataLoading: true, address })

            const gateway = await getGatewayClients()
            const entity = await EntityApi.getMetadata(address, gateway)
            if (!entity) throw new Error()

            const newsFeedOrigin = entity.newsFeed.default
            const payload = await FileApi.fetchString(newsFeedOrigin, gateway)

            let newsFeed
            try {
                newsFeed = JSON.parse(payload)
                checkValidJsonFeed(newsFeed)
                // newsFeed = checkValidJsonFeed(newsFeed)
            }
            catch (err) {
                message.warn("The current News Feed does not seem to have a correct format")
                console.log(err)
                throw new Error()
            }

            this.setState({ newsFeed, entity, address, dataLoading: false })
            this.props.setTitle(entity.name.default)
            this.props.setAddress(address)
        }
        catch (err) {
            this.setState({ dataLoading: false })
            message.error("Could not read the entity metadata")
        }
    }

    shouldComponentUpdate() {
        const [address] = this.props.params
        if (address !== this.state.address) {
            this.fecthMetadata()
        }
        return true
    }

    confirmDeletePost(index: number) {
        const that = this
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The selected post will be no longer accessible and this action cannot be undone. Do you want to continue?",
            okText: "Delete Post",
            okType: "primary",
            cancelText: "Not now",
            onOk() {
                that.deletePost(index)
            },
        })
    }

    async deletePost(index: number) {
        const feed = JSON.parse(JSON.stringify(this.state.newsFeed))
        feed.items.splice(index, 1)

        const hideLoading = message.loading('Action in progress...', 0)

        try {
            const gateway = await getGatewayClients()
            getNetworkState()

            // TODO: Check why for some reason addFile doesn't work without Buffer
            const feedContent = Buffer.from(JSON.stringify(feed))
            const feedContentUri = await FileApi.add(feedContent, `feed_${Date.now()}.json`, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)

            // message.success("The news feed was pinned on IPFS successfully")

            const entityMetadata = this.state.entity
            entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

            const address = this.props.web3Wallet.getAddress()
            await EntityApi.setMetadata(address, entityMetadata, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            hideLoading()

            message.success("The post has been deleted successfully")
            this.componentDidMount()
        }
        catch (err) {
            hideLoading()
            console.error("The post could not be deleted", err)
            message.error("The post could not be deleted")
        }
    }

    renderPostsList() {
        const address = this.props.web3Wallet.getAddress()
        const { readOnly } = getNetworkState()
        let hideEditControls = readOnly || !address
        if (!hideEditControls) {
            hideEditControls = this.state.address !== address
        }
        const that = this

        return <div className="body-card">
            <Divider orientation="left">News feed</Divider>

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
                dataSource={(this.state.newsFeed && this.state.newsFeed.items || []) as any}
                renderItem={(post: IFeedPost, idx: number) => (
                    <List.Item
                        key={idx}
                        actions={PostListActions({
                            that,
                            hideEditControls,
                            address,
                            post,
                            idx,
                        })}
                    >
                        <List.Item.Meta
                            avatar={
                                <PostLink {...{
                                    hideEditControls,
                                    address,
                                    post,
                                }}>
                                    <Avatar
                                        icon={<Image src={post.image} />}
                                        shape='square'
                                        style={{cursor: 'pointer'}}
                                    />
                                </PostLink>
                            }
                            title={
                                <PostLink {...{
                                    hideEditControls,
                                    address,
                                    post,
                                }}>
                                    {post.title}
                                </PostLink>
                            }
                            description={post.date_published ? (new Date(post.date_published).toDateString()) + '\t' + (new Date(post.date_published).toLocaleTimeString()): ""}
                        />
                    </List.Item>
                )}
            />
        </div>
    }

    renderNotFound() {
        return <div className="not-found">
            <h4>Entity not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() {
        return <div>Loading the details of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() {
        return <div id="post-view">
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    (this.state.entity && this.state.newsFeed) ?
                        <div id="page-body">
                            {this.renderPostsList()}
                        </div>
                        : <div id="page-body" className="center">
                            {this.renderNotFound()}
                        </div>
            }
        </div >
    }
}

const IconText = ({ icon, text, onClick }: { icon: any, text: string, onClick?: () => void }) => (
    <span className="icon-text" onClick={() => onClick && onClick()}>
        {createElement(icon, { style: { marginRight: 8 } })}
        {text}
    </span>
)

const PostLink = ({hideEditControls, post, address, children} : any) => {
    let link = `/posts/edit#/${address}/${post.id}`
    if (hideEditControls) {
        link = `/posts/view#/${address}/${post.id}`
    }

    return <Link href={link}>{children}</Link>
}

const PostListActions = (props: any) => {
    const {that, hideEditControls, entityId, post, idx} = props

    const actions = []
    if (!hideEditControls) {
        actions.push(
            <PostLink {...{
                hideEditControls,
                entityId,
                post,
            }}>
                <a><IconText icon={EditOutlined} text='Edit post' key='edit' /></a>
            </PostLink>
        )
        actions.push(
            <IconText
                icon={CloseCircleOutlined}
                text="Remove"
                onClick={ () => that.confirmDeletePost(that.state.startIndex + idx)
                } key="remove"
            />
        )
    }

    return actions
}

export default PostViewPage
