import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Form, Divider, Menu, Row, Col, Modal, Tag } from 'antd'
import { LoadingOutlined, RocketOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes, MultiLanguage } from "dvote-js"
// import { by639_1 } from 'iso-language-codes'
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
import { Wallet, Signer } from 'ethers'
import { updateEntity, getEntityId } from 'dvote-js/dist/api/entity'
import { checkValidJsonFeed, JsonFeed, JsonFeedPost } from 'dvote-js/dist/models/json-feed'
import { fetchFileString } from 'dvote-js/dist/api/file'

let Editor: any // = await import("react-draft-wysiwyg")
let EditorState, ContentState, convertToRaw
let draftToHtml: any // = await import('draftjs-to-html')
let htmlToDraft: any // = await import('html-to-draftjs')

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
// import { main } from "../i18n"

// MAIN COMPONENT
const PostViewPage = props => {
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
  bootnodes?: GatewayBootNodes,
  editorState?: any
}

// Stateful component
class PostView extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    await this.init()
  }

  async init(){
    const params = location.hash.substr(2).split("/")
    if (params.length != 2) {
      message.error("The requested data is not valid")
      Router.replace("/")
      return
    }

    const entityId = params[0]
    const postId = params[1]

    this.setState({ entityId, postId }, () => this.refreshMetadata())
  }

  shouldComponentUpdate(){
    const params = location.hash.substr(2).split("/")
    if (params.length != 2) {
      message.error("The requested data is not valid")
      Router.replace("/")
      return
    }

    const entityId = params[0]
    const postId = params[1]
    if(entityId != this.state.entityId
      || postId != this.state.postId){
        this.init()
    }

    return true
  }

  async refreshMetadata() {
    try {
      this.props.setMenuSelected("new-post")

      const params = location.hash.substr(2).split("/")
      if (params.length != 2) {
        message.error("The requested data is not valid")
        Router.replace("/")
        return
      }

      const entityId = params[0]
      const postId = params[1]

      this.setState({ dataLoading: true, entityId, postId })

      const gateway = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, gateway)
      if (!entity) throw new Error()

      // TODO: MULTILANGUAGE
      const newsFeedOrigin = entity.newsFeed.default
      const payload = await fetchFileString(newsFeedOrigin, gateway)

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

      const newsPost = newsFeed.items.find(item => item.id == postId)
      if (!newsPost) throw new Error()

      this.setState({ newsPost, newsFeed, entity, entityId, postId, dataLoading: false })
      this.props.setTitle(entity.name["default"])
      this.props.setEntityId(entityId)
    }
    catch (err) {
      this.setState({ dataLoading: false })
      //throw err
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
            <img width={272} alt={post.title} src={post.image} />
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
