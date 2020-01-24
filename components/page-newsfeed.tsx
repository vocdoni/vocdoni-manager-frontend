import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Skeleton, Spin, message, Row } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { API, ProcessMetadata, EntityMetadata, JsonFeed, MultiLanguage } from "dvote-js"
// import ReactMarkdown from 'react-markdown'

import { Layout } from 'antd'
import PageNewsFeedNew from "./page-newsfeed-new"
import { getRandomGatewayInfo } from "dvote-js/dist/net/gateway-bootnodes"
import { fetchFileString } from "dvote-js/dist/api/file"
import { checkValidJsonFeed } from "dvote-js/dist/models/json-feed"
import Web3Manager from "../util/web3-wallet"
import { getGatewayClients, getState  } from "../util/dvote-state"
import { updateEntity } from "dvote-js/dist/api/entity"
import { Wallet, Signer } from "ethers"
const { Header } = Layout

interface Props {
    refresh?: () => void
    entityDetails: EntityMetadata,
    currentAddress: string
}

interface State {
    feed?: JsonFeed,
    loading?: boolean,
    selectedPost?: any,
    showCreate?: boolean
}


export default class PageNewsFeed extends Component<Props, State> {
    state = {
        feed: null as JsonFeed,
        loading: true,
        selectedPost: null,
        showCreate: false
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        if (typeof nextProps.entityDetails.newsFeed.default != "string") return
        else if (this.props.entityDetails.newsFeed.default == nextProps.entityDetails.newsFeed.default) return

        // this.loadNewsFeed(nextProps.entityDetails.newsFeed.default)
        message.warn("There seems to be a newer version of the news feed on the blockchain", 15)
    }

    componentDidMount() {
        this.loadNewsFeed(this.props.entityDetails.newsFeed.default)
    }

    async loadNewsFeed(newsFeedOrigin: string) {
        try {
            const gwInfo = await getRandomGatewayInfo(process.env.ETH_NETWORK_ID as any)
            if (!gwInfo) throw new Error()

            const clients = await getGatewayClients()
            const payload = await fetchFileString(newsFeedOrigin, clients.dvoteGateway)

            let feed
            try {
                feed = JSON.parse(payload)
                checkValidJsonFeed(feed)
                // feed = checkValidJsonFeed(feed)
            }
            catch (err) {
                message.warn("The current News Feed does not seem to have a correct format")
                console.log(err);
            }

            this.setState({ feed, loading: false })
        }
        catch (err) {
            this.setState({ loading: false })

            if (err && err.message == "Request timed out")
                message.error("The news feed took too long to load")
            else
                message.error("The news feed could not be loaded")
        }
    }

    async deletePost() {
        let feed = JSON.parse(JSON.stringify(this.state.feed))
        let post = this.state.selectedPost
        // console.log(feed.items);
        let postId =  feed.items.findIndex(o => o.id === post)
        // console.log(postId);
        feed.items = feed.items.splice(postId,1)
        // console.log(feed.items);
        

        const hideLoading = message.loading('Action in progress...', 0)

        try {
            const clients = await getGatewayClients()
            const state = getState()

            // TODO: Check why for some reason addFile doesn't work without Buffer
            const feedContent = Buffer.from(JSON.stringify(feed))
            const feedContentUri = await API.File.addFile(feedContent, `feed_${Date.now()}.json`, Web3Manager.signer as (Wallet | Signer), clients.dvoteGateway)
            
            message.success("The news feed was pinned on IPFS successfully");

            let entityMetadata = this.props.entityDetails
            entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

            await updateEntity(state.address, entityMetadata, Web3Manager.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
            hideLoading()

            message.success("The post has been deleted successfully")
            this.setState({ feed: feed, selectedPost: null })
            if (this.props.refresh) this.props.refresh()
        }
        catch (err) {
            hideLoading()
            console.error("The post could not be deleted", err)
            message.error("The post could not be deleted")
        }

    }

    renderPleaseWait() {
        return <div style={{ paddingTop: 30, textAlign: "center" }}>
            <Skeleton active />
            <br />
            <div>Please, wait... <Spin size="small" /></div>
        </div>
    }

    renderSelectedPost() {
        const item = this.state.feed.items.find(item => item.id == this.state.selectedPost)
        if (!item || !item.title) return

        return <div style={{ padding: 30 }}>
            <style>{`
            img {
                max-width: 100%;
            }
            `}</style>
            <Row>
                {/* <Col xs={24} sm={15}> */}
                <Col xs={24} >
                    <img src={item.image} style={{ maxWidth: 200 }} />
                    <br /><br />
                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>
                </Col>
                {/* <Col xs={24} sm={9}>
                    <img src={item.image} style={{ maxWidth: 200 }} />
                </Col> */}
            </Row>
            {/* <hr style={{ marginTop: 20, marginBottom: 20 }} /> */}
            <Row>
                <Col xs={24}>
                    {/* <h3>Content (rich text)</h3> */}
                    <div dangerouslySetInnerHTML={{ __html: item.content_html }} />
                </Col>
                {/* <Col xs={24}>
                    <h3>Content (plain text)</h3>
                    <p>{item.content_text}</p>
                </Col> */}
            </Row>
        </div>
    }

    renderFeedList() {
        if (!this.state.feed || !this.state.feed.items || !this.state.feed.items.length)
            return <Empty description="No news posts" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            {/* <h3>News posts</h3> */}
            <List
                itemLayout="horizontal"
                dataSource={this.state.feed.items}
                renderItem={(item, idx) => (
                    <List.Item
                        actions={[<a key="edit-details" onClick={() => this.setState({ selectedPost: item.id })}>View details</a>]}
                    >
                        <Skeleton avatar title={false} loading={typeof item != "object"} active>
                            {(item && item.title) ?
                                <List.Item.Meta
                                    avatar={<Avatar>{idx + 1}</Avatar>}
                                    title={item.title}
                                    description={item.summary}
                                />
                                : null}
                        </Skeleton>
                    </List.Item>
                )}
            />
        </div>
    }

    render() {
        if (this.state.showCreate) return <PageNewsFeedNew {...this.props} feed={this.state.feed} showList={() => this.setState({ showCreate: false })} />
        else if (this.state.loading) return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="unordered-list"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.setState({ selectedPost: null })}>Show post list</Button>
                </div>
                <h2>News Feed</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {
                    this.renderPleaseWait()
                }
            </div>
        </>
        else if (this.state.selectedPost) return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="unordered-list"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.setState({ selectedPost: null })}>See all posts</Button>
                </div>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="minus"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.deletePost()}>Delete Post</Button>
                </div>
                <h2>Post</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {
                    this.renderSelectedPost()
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
                        onClick={() => this.setState({ showCreate: true })}>Create a post</Button>
                </div>
                <h2>News Feed</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {
                    this.renderFeedList()
                }
            </div>
        </>
    }
}
