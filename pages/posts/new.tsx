import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Form, Divider, Menu, Row, Col } from 'antd'
import { LoadingOutlined, RocketOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes, MultiLanguage } from "dvote-js"
// import { by639_1 } from 'iso-language-codes'
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
import Web3Wallet from '../../lib/web3-wallet'
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
const PostNewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <PostNew {...context} />
}

type State = {
  dataLoading?: boolean,
  postUpdating?: boolean,
  entity?: EntityMetadata,
  entityId?: string,
  newsFeed?: JsonFeed,
  newsPost?: JsonFeedPost,
  bootnodes?: GatewayBootNodes,
  editorState?: any
}

// Stateful component
class PostNew extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    const { readOnly, address } = getNetworkState()
    const entityId = getEntityId(address)

    // if readonly, show the view page
    if (readOnly) {
      return Router.replace("/posts/#" + entityId)
    }
    this.props.setTitle("New post")

    // Do the imports dynamically because `window` does not exist on SSR

    Editor = (await import('react-draft-wysiwyg')).Editor
    const DraftJS = await import('draft-js')
    EditorState = DraftJS.EditorState
    ContentState = DraftJS.ContentState
    convertToRaw = DraftJS.convertToRaw
    draftToHtml = (await import('draftjs-to-html')).default
    htmlToDraft = (await import('html-to-draftjs')).default

    this.setState({ editorState: EditorState.createEmpty() })

    try {
      await this.refreshMetadata()
    }
    catch (err) {
      message.error("Could not read the entity metadata")
    }
  }

  async refreshMetadata() {
    try {
      const { address } = getNetworkState()
      const entityId = getEntityId(address)

      this.setState({ dataLoading: true, entityId })

      const { web3Gateway, dvoteGateway } = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
      if (!entity) throw new Error()

      // TODO: MULTILANGUAGE
      const newsFeedOrigin = entity.newsFeed.default
      const payload = await fetchFileString(newsFeedOrigin, dvoteGateway)

      let newsFeed: JsonFeed
      try {
        newsFeed = JSON.parse(payload)
        checkValidJsonFeed(newsFeed)
        // newsFeed = checkValidJsonFeed(newsFeed)
      }
      catch (err) {
        message.warn("The News Feed does not seem to have a correct format")
        console.log(err);
        throw new Error()
      }

      const id = String(Date.now())
      const newsPost: JsonFeedPost = {
        id,
        title: "",
        summary: "",
        content_text: "",
        content_html: "<p>Your text goes here</p>",
        url: location.protocol + "//" + location.host + "/posts/#/" + entityId + "/" + id,
        image: "",
        tags: [],
        date_published: "",
        date_modified: "",
        author: {
          name: entity.name["default"],
          url: "",
        }
      }
      const contentBlock = htmlToDraft(newsPost.content_html)
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
        const editorState = EditorState.createWithContent(contentState)
        this.setState({ editorState })
      }

      this.setState({ newsPost, newsFeed, entity, entityId, dataLoading: false })
      this.props.setTitle(entity.name["default"])
    }
    catch (err) {
      this.setState({ dataLoading: false })
      throw err
    }
  }

  async submit() {
    // TODO: Make a singnature and use it for next transactions
    // Web3Wallet.signer.signMessage("democracy")
    // .then(payload => {
    //     console.log(payload)
    //     let passphrase = prompt("Enter your passphrase to unlock your account")
    //     // console.log(passphrase)
    //     const digest  = utils.keccak256((Buffer.from(payload+passphrase, 'utf8').toString('hex')))
    //     console.log(digest)
    // })
    // const privKey = padding/trim(digest)
    // const data = encrypt("hello", privKey)

    // TODO: Store POST in Dexie
    // el Dexie es un nice to have... con esto se puede montar una DB local, però también podríamos tirar de momento son
    // la única pega es que si se cierra el browser, se pierde todo

    const newsFeed = this.state.newsFeed

    const post: JsonFeedPost = Object.assign({}, this.state.newsPost)
    post.date_published = new Date().toJSON()
    post.date_modified = new Date().toJSON()

    newsFeed.items = [post].concat(this.state.newsFeed.items)

    try {
      // TODO: The following removes the last post. Tested exactly the same in 
      // in Dvote-js and it works. How???
      // feed = checkValidJsonFeed(feed) 
      checkValidJsonFeed(newsFeed)
    }
    catch (err) {
      message.warn("The updated News Feed does not seem to have a correct format")
      console.error(err)
      return
    }

    const hideLoading = message.loading('Action in progress...', 0)
    this.setState({ postUpdating: true })

    try {
      const clients = await getGatewayClients()
      const state = getNetworkState()

      // TODO: Check why for some reason addFile doesn't work without Buffer
      const feedContent = Buffer.from(JSON.stringify(newsFeed))
      const feedContentUri = await API.File.addFile(feedContent, `feed_${this.state.newsPost.id}.json`, Web3Wallet.signer as (Wallet | Signer), clients.dvoteGateway)

      // message.success("The news feed was pinned on IPFS successfully");

      let entityMetadata = this.state.entity
      entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

      await updateEntity(state.address, entityMetadata, Web3Wallet.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
      hideLoading()
      this.setState({ postUpdating: false })

      message.success("The post has been successfully updated")
      Router.push("/posts/#/" + this.state.entityId)
    }
    catch (err) {
      hideLoading()
      this.setState({ postUpdating: false })
      console.error("The new post could not be created", err)
      message.error("The new post could not be created")
    }
  }

  setNestedKey(obj, path: string[], value: any) {
    if (path.length === 1) {
      obj[path[0]] = value
    }
    else {
      this.setNestedKey(obj[path[0]], path.slice(1), value)
    }
  }

  setselectedPostField(path: string[], value: any) {
    let newsPost = Object.assign({}, this.state.newsPost)
    this.setNestedKey(newsPost, path, value)
    this.setState({ newsPost })
  }

  editorContentChanged(state) {
    this.setState({ editorState: state })

    const newHtml = draftToHtml(convertToRaw(state.getCurrentContent()))
    const element = document.createElement("div")
    element.innerHTML = newHtml
    const newText = element.innerText
    this.setselectedPostField(["content_text"], newText)
    this.setselectedPostField(["content_html"], newHtml)
  }

  renderPostNew() {
    return <div className="body-card">
      <Row justify="start">
        <Col xs={24} sm={20} md={14}>
          <Divider orientation="left">New post</Divider>

          <Form>
            <Form.Item>
              <label>Header image</label>
              <Input type="text"
                value={this.state.newsPost.image}
                // prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder={"URL"}
                onChange={ev => this.setselectedPostField(["image"], ev.target.value)}
              />

              <p style={{ marginBottom: 0 }}>
                <a href="https://unsplash.com" target="_blank">Browse images in Unsplash.com</a>
              </p>
            </Form.Item>

            <Form.Item>
              <label>Post title</label>
              <Input
                size="large"
                placeholder="The title"
                value={this.state.newsPost.title}
                onChange={ev => this.setselectedPostField(['title'], ev.target.value)}
              />
            </Form.Item>

            <Form.Item>
              <label>Content</label>
              {
                Editor ? <Editor
                  editorState={this.state.editorState}
                  toolbarClassName="toolbar-box"
                  wrapperClassName="wrapper-box"
                  editorClassName="editor-box"
                  onEditorStateChange={state => this.editorContentChanged(state)}
                /> : null
              }
            </Form.Item>
          </Form>

          <Divider />

          <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
            {this.state.postUpdating ?
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
              <Button type="primary" size={'large'} onClick={() => this.submit()}>
                <RocketOutlined /> Publish Post</Button>
            }
          </div>
        </Col>
        <Col xs={0} md={10} className="right-col">
          <Divider orientation="left">Header</Divider>
          {this.state.newsPost.image ?
            <img className="preview" src={this.state.newsPost.image} /> : null
          }
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
    return <div>Loading the details of the entity...  <Spin size="small" /></div>
  }

  renderSideMenu() {
    const { readOnly, address } = getNetworkState()
    const ownEntityId = getEntityId(address)
    const hideEditControls = readOnly || this.state.entityId != ownEntityId

    if (hideEditControls) {
      return null
    }

    return <div id="page-menu">
      <Menu mode="inline" defaultSelectedKeys={['new-post']} style={{ width: 200 }}>
        <Menu.Item key="profile">
          <Link href={"/entities/#/" + this.state.entityId}>
            <a>Profile</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="edit">
          <Link href={"/entities/edit/#/" + this.state.entityId}>
            <a>Edit profile</a>
          </Link>
        </Menu.Item>
        <Menu.Item key="feed">
          <Link href={"/posts/#/" + this.state.entityId}>
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
    return <div id="post-new">
      {this.renderSideMenu()}
      {
        this.state.dataLoading ?
          <div id="page-body" className="center">
            {this.renderLoading()}
          </div>
          :
          (this.state.entity && this.state.newsPost) ?
            <div id="page-body">
              {this.renderPostNew()}
            </div>
            : <div id="page-body" className="center">
              {this.renderNotFound()}
            </div>
      }
    </div >
  }
}


// // Custom layout
// PostNewPage.Layout = props => <MainLayout>

//   <div>
//     {props.children}
//   </div>
// </MainLayout>

export default PostNewPage
