import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Select, Divider, Menu, Row, Col } from 'antd'
import { InfoCircleOutlined, BookOutlined, FileImageOutlined, LoadingOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
// import { by639_1 } from 'iso-language-codes'
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
import Web3Wallet from '../../lib/web3-wallet'
import { Wallet, Signer } from 'ethers'
import { updateEntity, getEntityId } from 'dvote-js/dist/api/entity'
import { checkValidJsonFeed, JsonFeed, JsonFeedPost } from 'dvote-js/dist/models/json-feed'
import { fetchFileString } from 'dvote-js/dist/api/file'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// const { Option } = Select

// const languageCodes = Object.keys(by639_1).sort().reduce((prev, cur) => {
//   if (!prev.includes(cur)) prev.push(cur)
//   return prev
// }, [])

// MAIN COMPONENT
const PostNewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <PostNew {...context} />
}

type State = {
    dataLoading?: boolean,
    entityUpdating?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    newsPost?: JsonFeedPost,
    bootnodes?: GatewayBootNodes
}

// Stateful component
class PostNew extends Component<IAppContext, State> {
    state: State = {}

    async componentDidMount() {
        const params = location.hash.substr(2).split("/")
        if (params.length != 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const entityId = params[0]
        // const postId = params[1]

        // if readonly, show the view page
        if (getNetworkState().readOnly) {
            return Router.replace("/posts/#" + entityId)
        }

        try {
            await this.refreshMetadata()
        }
        catch (err) {
            message.error("Could not read the entity metadata")
        }
    }

    async refreshMetadata() {
        try {
            const params = location.hash.substr(2).split("/")
            if (params.length != 2) {
                message.error("The requested data is not valid")
                Router.replace("/")
                return
            }

            const entityId = params[0]
            const postId = params[1]

            this.setState({ dataLoading: true, entityId })

            const { web3Gateway, dvoteGateway } = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
            if (!entity) throw new Error()

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

            const newsPost = newsFeed.items.find(item => item.id == postId)

            this.setState({ newsPost, entity, entityId, dataLoading: false })
            this.props.setTitle(entity.name["default"])
        }
        catch (err) {
            this.setState({ dataLoading: false })
            throw err
        }
    }

    //   addMetadataToPost(post: JsonFeedPost) {
    //     const now = new Date()
    //     if (!post.id) post.id = String(Date.now())  // Timestamp
    //     if (!post.date_published) post.date_published = now.toJSON()
    //     post.date_modified = now.toJSON()
    //     return post
    // }

    // async submit() {
    //     // TODO: Make a singnature and use it for next transactions
    //     // Web3Manager.signer.signMessage("democracy")
    //     // .then(payload => {
    //     //     console.log(payload)
    //     //     let passphrase = prompt("Enter your passphrase to unlock your account")
    //     //     // console.log(passphrase)
    //     //     const digest  = utils.keccak256((Buffer.from(payload+passphrase, 'utf8').toString('hex')))
    //     //     console.log(digest)
    //     // })
    //     // const privKey = padding/trim(digest)
    //     // const data = encrypt("hello", privKey)
    //     const newPost = this.addMetadataToPost(this.state.selectedPost)

    //     // TODO: Store POST in Dexie
    //     // el Dexie es un nice to have... con esto se puede montar una DB local, però también podríamos tirar de momento son
    //     // la única pega es que si se cierra el browser, se pierde todo

    //     // TODO:  Add new post in Items (state.feed.items)
    //     let feed = this.props.feed
    //     feed.items = [newPost].concat(feed.items)  // Add as the first item

    //     try {
    //         // TODO: The following removes the last post. Tested exactly the same in 
    //         // in Dvote-js and it works. How???
    //         // feed = checkValidJsonFeed(feed) 
    //         checkValidJsonFeed(feed)
    //     }
    //     catch (err) {
    //         message.warn("The updated News Feed does not seem to have a correct format")
    //         console.error(err)
    //         return
    //     }

    //     const hideLoading = message.loading('Action in progress...', 0)

    //     try {
    //         const clients = await getGatewayClients()
    //         const state = getState()

    //         // TODO: Check why for some reason addFile doesn't work without Buffer
    //         const feedContent = Buffer.from(JSON.stringify(feed))
    //         const feedContentUri = await API.File.addFile(feedContent, `feed_${Date.now()}.json`, Web3Manager.signer as (Wallet | Signer), clients.dvoteGateway)

    //         message.success("The news feed was pinned on IPFS successfully");

    //         let entityMetadata = this.props.entityDetails
    //         entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

    //         await updateEntity(state.address, entityMetadata, Web3Manager.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
    //         hideLoading()

    //         message.success("The post has been successfully published")

    //         this.props.showList()
    //         if (this.props.refresh) this.props.refresh()
    //     }
    //     catch (err) {
    //         hideLoading()
    //         console.error("The new post could not be created", err)
    //         message.error("The new post could not be created")
    //     }
    // }

    // setNestedKey(obj, path: string[], value: any) {
    //     if (path.length === 1) {
    //         obj[path[0]] = value
    //     }
    //     else {
    //         this.setNestedKey(obj[path[0]], path.slice(1), value)
    //     }
    // }

    // getSelectedPostCopy() {
    //     return Object.assign({}, this.state.selectedPost)
    // }

    // setselectedPostField(path: string[], value: any) {
    //     let post = this.getSelectedPostCopy()
    //     this.setNestedKey(post, path, value)
    // }

    // makeEmptyPost() {
    //     let post: JsonFeedPost = {
    //         id: "",
    //         title: "",
    //         summary: "",
    //         content_text: "",
    //         content_html: "",
    //         url: "",
    //         image: "",
    //         tags: [],
    //         date_published: "",
    //         date_modified: "",
    //         author: {
    //             name: "",
    //             url: "",
    //         }
    //     }
    //     return post
    // }

    renderPostNew() {
        const { entity } = this.state

        return <div className="body-card">
            <Row justify="start">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">New post</Divider>


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
            <Menu mode="inline" style={{ width: 200 }}>
                <Menu.Item key="profile">
                    <Link href={"/entities/" + location.hash}>
                        <a>Profile</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="edit">
                    <Link href={"/entities/edit/" + location.hash}>
                        <a>Edit profile</a>
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
        return <div id="post-edit">
            {this.renderSideMenu()}
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    this.state.entity ?
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
