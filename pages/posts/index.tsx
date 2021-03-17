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
import i18n from '../../i18n'

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
            }
            catch (err) {
                message.warn(i18n.t('error.invalid_format_contents'))
                console.log(err)
                throw new Error()
            }

            this.setState({ newsFeed, entity, address, dataLoading: false })
            this.props.setTitle(entity.name.default)
            this.props.setAddress(address)
        }
        catch (err) {
            this.setState({ dataLoading: false })
            message.error(i18n.t('error.cannot_read_entity_metadata'))
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
        Modal.confirm({
            title: i18n.t('confirm'),
            icon: <ExclamationCircleOutlined />,
            content: i18n.t('news.confirm_delete'),
            okText: i18n.t('btn.remove'),
            okType: "primary",
            cancelText: i18n.t('btn.cancel'),
            onOk: () => {
                this.deletePost(index)
            },
        })
    }

    async deletePost(index: number) {
        const feed = JSON.parse(JSON.stringify(this.state.newsFeed))
        feed.items.splice(index, 1)

        const hideLoading = message.loading(i18n.t('action_in_progress'), 0)

        try {
            const gateway = await getGatewayClients()
            getNetworkState()

            // TODO: Check why for some reason addFile doesn't work without Buffer
            const feedContent = Buffer.from(JSON.stringify(feed))
            const feedContentUri = await FileApi.add(feedContent, `feed_${Date.now()}.json`, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)

            const entityMetadata = this.state.entity
            entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

            const address = this.props.web3Wallet.getAddress()
            await EntityApi.setMetadata(address, entityMetadata, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            hideLoading()

            message.success(i18n.t('news.deleted_successfuly'))
            this.componentDidMount()
        }
        catch (err) {
            hideLoading()
            console.error(i18n.t('news.delete_error'), err)
            message.error(i18n.t('news.delete_error'))
        }
    }

    renderPostsList() {
        let address = this.props.web3Wallet.getAddress()
        const { readOnly } = getNetworkState()
        let hideEditControls = readOnly || !address
        if (!hideEditControls) {
            hideEditControls = this.state.address !== address
        }
        // If read-only recover the address form the state which comes form the url
        if (hideEditControls) {
            address = this.state.address
        }
        const that = this

        return <div className="body-card">
            <Divider orientation="left">{i18n.t('news.title.feed')}</Divider>

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
            <h4>{i18n.t('entity.error.not_found')}</h4>
            <p>{i18n.t('entity.error.not_found_description')}</p>
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
    const {that, hideEditControls, address, post, idx} = props

    const actions = []
    if (!hideEditControls) {
        actions.push(
            <PostLink {...{
                hideEditControls,
                post,
                address,
            }}>
                <a><IconText icon={EditOutlined} text={i18n.t('btn.edit')} key='edit' /></a>
            </PostLink>
        )
        actions.push(
            <IconText
                icon={CloseCircleOutlined}
                text={i18n.t('btn.remove')}
                onClick={ () => that.confirmDeletePost(that.state.startIndex + idx)
                } key="remove"
            />
        )
    }

    return actions
}

export default PostViewPage
