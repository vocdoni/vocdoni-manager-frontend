import { useContext, Component } from 'react'
import { message, Spin, Divider, Row, Col } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import {
    EntityMetadata,
    JsonBootnodeData,
    checkValidJsonFeed,
    JsonFeed,
    JsonFeedPost,
    FileApi,
    EntityApi,
} from 'dvote-js'
import Router from 'next/router'

import { getGatewayClients } from '../../lib/network'
import AppContext, { IAppContext } from '../../components/app-context'
import Image from '../../components/image'


// MAIN COMPONENT
const PostViewPage = () => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <PostView {...context} />
}

type State = {
    dataLoading?: boolean,
    postUpdating?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    postId?: string,
    newsFeed?: JsonFeed,
    newsPost?: JsonFeedPost,
    bootnodes?: JsonBootnodeData,
    editorState?: any
}

// Stateful component
class PostView extends Component<IAppContext, State> {
    state: State = {}

    async componentDidMount() {
        await this.init()
    }

    async init() {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const entityId = params[0]
        const postId = params[1]

        this.setState({ entityId, postId }, () => this.refreshMetadata())
    }

    shouldComponentUpdate() {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const entityId = params[0]
        const postId = params[1]
        if (entityId !== this.state.entityId
        || postId !== this.state.postId) {
            this.init()
        }

        return true
    }

    async refreshMetadata() {
        try {
            this.props.setMenuSelected("new-post")

            const params = location.hash.substr(2).split("/")
            if (params.length !== 2) {
                message.error("The requested data is not valid")
                Router.replace("/")
                return
            }

            const entityId = params[0]
            const postId = params[1]

            this.setState({ dataLoading: true, entityId, postId })

            const gateway = await getGatewayClients()
            const entity = await EntityApi.getMetadata(entityId, gateway)
            if (!entity) throw new Error()

            // TODO: MULTILANGUAGE
            const newsFeedOrigin = entity.newsFeed.default
            const payload = await FileApi.fetchString(newsFeedOrigin, gateway)

            let newsFeed: JsonFeed
            try {
                newsFeed = JSON.parse(payload)
                checkValidJsonFeed(newsFeed)
            }
            catch (err) {
                message.warn("The News Feed does not seem to have a correct format")
                console.log(err);
                throw new Error()
            }

            const newsPost = newsFeed.items.find(item => item.id === postId)
            if (!newsPost) throw new Error()

            this.setState({ newsPost, newsFeed, entity, entityId, postId, dataLoading: false })
            this.props.setTitle(entity.name.default)
            this.props.setAddress(entityId)
        }
        catch (err) {
            this.setState({ dataLoading: false })
        // throw err
        }
    }

    renderPost() {
        const post = this.state.newsPost
        return <div className="body-card">
            <Row justify="space-between">
                <Col xs={24} sm={15}>
                    <Divider orientation="left">{post.title}</Divider>
                    <div className="ant-list-item-meta-description">{post.date_published ? new Date(post.date_published).toDateString() : ""}</div>
                    <br />
                    {post.content_text && post.content_text.trim() ? post.content_text : <div dangerouslySetInnerHTML={{ __html: post.content_html }} />}
                </Col>
                <Col xs={24} sm={8}>
                    <div style={{ textAlign: "center" }}>
                        <Image alt={post.title} src={post.image} />
                    </div>
                </Col>
            </Row>
        </div>
    }

    renderNotFound() {
        return <div className="not-found">
            <h4>News post not found</h4>
            <p>The post you are looking for cannot be found</p>
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
                    (this.state.entity && this.state.newsPost) ?
                        <div id="page-body">
                            {this.renderPost()}
                        </div>
                        : <div id="page-body" className="center">
                            {this.renderNotFound()}
                        </div>
            }
        </div >
    }
}

export default PostViewPage
