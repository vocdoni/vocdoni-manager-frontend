import { useContext, Component } from 'react'
import { message, Spin, Button, Input, Form, Divider, Row, Col, Modal } from 'antd'
import { LoadingOutlined, RocketOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import {
    EntityMetadata,
    JsonBootnodeData,
    MultiLanguage,
    EntityApi,
    FileApi,
    checkValidJsonFeed,
    JsonFeed,
    JsonFeedPost,
} from 'dvote-js'
import Router from 'next/router'
import { Wallet, Signer } from 'ethers'
// import { by639_1 } from 'iso-language-codes'

import { getGatewayClients, getNetworkState } from '../../lib/network'
import { sanitizeHtml } from '../../lib/util'
import AppContext, { IAppContext } from '../../components/app-context'
import IPFSImageUpload from '../../components/ipfs-image-upload'
import Image from '../../components/image'

let Editor: any // = await import('react-draft-wysiwyg')
let EditorState, ContentState, convertToRaw
let draftToHtml: any // = await import('draftjs-to-html')
let htmlToDraft: any // = await import('html-to-draftjs')

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

// MAIN COMPONENT
const PostEditPage = () => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <PostEdit {...context} />
}

type State = {
    dataLoading?: boolean,
    postUpdating?: boolean,
    entity?: EntityMetadata,
    address?: string,
    postId?: string,
    newsFeed?: JsonFeed,
    newsPost?: JsonFeedPost,
    bootnodes?: JsonBootnodeData,
    editorState?: any
}

// Stateful component
class PostEdit extends Component<IAppContext, State> {
    state: State = {}

    async componentDidMount() {
        await this.init()
    }

    async init() {
        if (this.props.params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const [address] = this.props.params

        // if readonly, show the view page
        if (getNetworkState().readOnly) {
            return Router.replace("/posts#" + address)
        }

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

    onErrorImage() {
        this.setState({
            newsPost: {
                ...this.state.newsPost,
                image: '',
            }
        })
        return Modal.error({
            title: 'Invalid image',
            content: 'The provided image could not be loaded.',
        })
    }

    shouldComponentUpdate() {
        if (this.props.params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        const [address, postId] = this.props.params
        if (address !== this.state.address || postId !== this.state.postId) {
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

            const address = params[0]
            const postId = params[1]

            this.setState({ dataLoading: true, address: address, postId })

            const gateway = await getGatewayClients()
            const entity = await EntityApi.getMetadata(address, gateway)
            if (!entity) throw new Error()

            // TODO: MULTILANGUAGE
            const newsFeedOrigin = entity.newsFeed.default
            const payload = await FileApi.fetchString(newsFeedOrigin, gateway)

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

            const newsPost = newsFeed.items.find(item => item.id === postId)
            const html = newsPost.content_html || "<p></p>"
            const contentBlock = htmlToDraft(html)
            if (contentBlock) {
                const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
                const editorState = EditorState.createWithContent(contentState)
                this.setState({ editorState })
            }

            this.setState({ newsPost, newsFeed, entity, address, postId, dataLoading: false })
            this.props.setTitle(entity.name.default)

            this.props.setAddress(address)
        }
        catch (err) {
            this.setState({ dataLoading: false })
            throw err
        }
    }

    confirmSubmit() {
        const that = this;
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The changes to the post will become public. Do you want to continue?",
            okText: "Publish Post",
            okType: "primary",
            cancelText: "Not now",
            onOk() {
                that.submit()
            },
        })
    }

    async submit() {
        const params = location.hash.substr(2).split("/")
        if (params.length !== 2) {
            message.error("The requested data is not valid")
            Router.replace("/")
            return
        }

        // const entityId = params[0]
        const postId = params[1]


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
        const idx = newsFeed.items.findIndex(i => i.id === postId)
        if (idx < 0) return message.error("The post could not be updated")

        const post: JsonFeedPost = Object.assign({}, this.state.newsPost)
        post.date_modified = new Date().toJSON()
        newsFeed.items[idx] = post

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
            const gateway = await getGatewayClients()
            getNetworkState()

            // TODO: Check why for some reason addFile doesn't work without Buffer
            const feedContent = Buffer.from(JSON.stringify(newsFeed))
            const feedContentUri = await FileApi.add(feedContent, `feed_${this.state.newsPost.id}.json`, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)

            // message.success("The news feed was pinned on IPFS successfully");

            const entityMetadata = this.state.entity
            entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

            const address = this.props.web3Wallet.getAddress()
            await EntityApi.setMetadata(address, entityMetadata, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)
            hideLoading()
            this.setState({ postUpdating: false })

            message.success("The post has been successfully updated")
            this.refreshMetadata()
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
        const newsPost = Object.assign({}, this.state.newsPost)
        this.setNestedKey(newsPost, path, value)
        this.setState({ newsPost })
    }

    editorContentChanged(state) {
        this.setState({ editorState: state })

        const newHtml = sanitizeHtml(draftToHtml(convertToRaw(state.getCurrentContent())))
        const element = document.createElement("div")
        element.innerHTML = newHtml
        const newText = element.innerText
        this.setselectedPostField(["content_text"], newText)
        this.setselectedPostField(["content_html"], newHtml)
    }

    renderPostEdit() {
        return <div className="body-card">
            <Row justify="start">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">Edit post</Divider>

                    <Form>
                        <Form.Item>
                            <label>Header image</label>
                            <Input
                                type='text'
                                value={this.state.newsPost.image}
                                placeholder={'URL'}
                                onChange={ev => this.setselectedPostField(['image'], ev.target.value)}
                                addonAfter={
                                    <IPFSImageUpload
                                        onChange={({file}) => {
                                            let image = ''
                                            if (file.status === 'done') {
                                                image = file.response.src
                                            }
                                            this.setselectedPostField(['image'], image)
                                        }}
                                    />
                                }
                            />

                            <p style={{ marginBottom: 0 }}>
                                <a href="https://unsplash.com" target="_blank" rel="noreferrer">If you don't have images, try to find one at unsplash.com</a>
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
                            <Button type="primary" size={'large'} onClick={() => this.confirmSubmit()}>
                                <RocketOutlined /> Publish Post</Button>
                        }
                    </div>
                </Col>
                <Col xs={0} md={10} className="right-col">
                    <Divider orientation="left">Header</Divider>
                    <Image
                        className='preview'
                        src={this.state.newsPost.image}
                        onError={this.onErrorImage.bind(this)}
                    />
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
        return <div id="post-edit">
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    (this.state.entity && this.state.newsPost) ?
                        <div id="page-body">
                            {this.renderPostEdit()}
                        </div>
                        : <div id="page-body" className="center">
                            {this.renderNotFound()}
                        </div>
            }
        </div >
    }
}


// // Custom layout
// PostEditPage.Layout = props => <MainLayout>

//   <div>
//     {props.children}
//   </div>
// </MainLayout>

export default PostEditPage
