import { createElement } from "react"
import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Avatar } from 'antd'
import { Divider, Menu, List } from 'antd'
import { EditOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, MultiLanguage } from "dvote-js"
const { Entity } = API
// import Router from 'next/router'
import Link from "next/link"
import { INewsFeed } from '../../lib/types'
import { getEntityId, updateEntity } from 'dvote-js/dist/api/entity'
import { fetchFileString } from 'dvote-js/dist/api/file'
import { checkValidJsonFeed } from 'dvote-js/dist/models/json-feed'
import { IFeedPost } from "../../lib/types"
import Web3Wallet from "../../lib/web3-wallet"
import { Wallet, Signer } from "ethers"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const PAGE_SIZE = 6

// MAIN COMPONENT
const PostViewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <PostView {...context} />
}

type State = {
  dataLoading?: boolean,
  entity?: EntityMetadata,
  entityId?: string,
  newsFeed?: INewsFeed,
  startIndex: number
}

// Stateful component
class PostView extends Component<IAppContext, State> {
  state: State = {
    startIndex: 0
  }

  async componentDidMount() {
    try {
      const entityId = location.hash.substr(2)
      this.setState({ dataLoading: true, entityId })

      const { web3Gateway, dvoteGateway } = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
      if (!entity) throw new Error()

      const newsFeedOrigin = entity.newsFeed.default
      const payload = await fetchFileString(newsFeedOrigin, dvoteGateway)

      let newsFeed
      try {
        newsFeed = JSON.parse(payload)
        checkValidJsonFeed(newsFeed)
        // newsFeed = checkValidJsonFeed(newsFeed)
      }
      catch (err) {
        message.warn("The current News Feed does not seem to have a correct format")
        console.log(err);
        throw new Error()
      }

      this.setState({ newsFeed, entity, entityId, dataLoading: false })
      this.props.setTitle(entity.name["default"])
    }
    catch (err) {
      this.setState({ dataLoading: false })
      message.error("Could not read the entity metadata")
    }
  }

  async deletePost(index: number) {
    let feed = JSON.parse(JSON.stringify(this.state.newsFeed))
    feed.items.splice(index, 1)

    const hideLoading = message.loading('Action in progress...', 0)

    try {
      const clients = await getGatewayClients()
      const state = getNetworkState()

      // TODO: Check why for some reason addFile doesn't work without Buffer
      const feedContent = Buffer.from(JSON.stringify(feed))
      const feedContentUri = await API.File.addFile(feedContent, `feed_${Date.now()}.json`, Web3Wallet.signer as (Wallet | Signer), clients.dvoteGateway)

      message.success("The news feed was pinned on IPFS successfully");

      let entityMetadata = this.state.entity
      entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

      await updateEntity(state.address, entityMetadata, Web3Wallet.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
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
    const entityId = location.hash.substr(2)
    const { readOnly, address } = getNetworkState()
    const ownEntityId = getEntityId(address)
    const hideEditControls = readOnly || entityId != ownEntityId

    let subscriptionLink = `vocdoni://vocdoni.app/entity?entityId=${entityId}&`
    const { bootnodesReadOnly } = getNetworkState()
    if (Object.keys(bootnodesReadOnly).length >= 1) {
      subscriptionLink += bootnodesReadOnly[ETH_NETWORK_ID].web3.map(n => `entryPoints[]=${n.uri}`).join("&")
    }

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
            actions={hideEditControls ? [] : [
              <Link href={`/posts/edit/#/${entityId}/${post.id}`}><a>
                <IconText icon={EditOutlined} text="Edit post" key="edit" />
              </a></Link>,
              <IconText icon={CloseCircleOutlined} text="Remove" onClick={() => this.deletePost(this.state.startIndex + idx)} key="remove" />,
            ]}
            extra={<img width={272} alt={post.title} src={post.image} />}
          >
            <List.Item.Meta
              avatar={<Avatar src={this.state.entity.media.avatar} />}
              title={post.title}
              // description={
              //   post.summary ? <span>{post.summary}<br/>{post.date_published ? new Date(post.date_published).toDateString() : ""}</span> :
              //     <span>{post.date_published ? new Date(post.date_published).toDateString() : ""}</span>
              // }
              description={post.date_published ? new Date(post.date_published).toDateString() : ""}
            />
            {post.content_text && post.content_text.trim() ? post.content_text : <div dangerouslySetInnerHTML={{ __html: post.content_html }} />}

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
    return <div>Loading the details of the entity...  <Spin size="small" /></div>
  }

  renderSideMenu() {
    const { readOnly, address } = getNetworkState()
    const ownEntityId = getEntityId(address)
    const hideEditControls = readOnly || this.state.entityId != ownEntityId

    if (hideEditControls) {
      return <div id="page-menu">
        <Menu mode="inline" defaultSelectedKeys={['feed']} style={{ width: 200 }}>
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
          <Menu.Item key="polls">
            <Link href={"/processes/" + location.hash}>
              <a>Polls</a>
            </Link>
          </Menu.Item>
        </Menu>
      </div>
    }

    return <div id="page-menu">
      <Menu mode="inline" defaultSelectedKeys={['feed']} style={{ width: 200 }}>
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
        <Menu.Item key="polls">
          <Link href={"/processes/" + location.hash}>
            <a>Polls</a>
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  }

  render() {
    return <div id="post-view">
      {this.renderSideMenu()}
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


// // Using a custom layout
// PostViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

const IconText = ({ icon, text, onClick }: { icon: any, text: string, onClick?: () => void }) => (
  <span className="icon-text" onClick={() => onClick && onClick()}>
    {createElement(icon, { style: { marginRight: 8 } })}
    {text}
  </span>
);

export default PostViewPage
