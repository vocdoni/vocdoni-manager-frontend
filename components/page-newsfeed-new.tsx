import { Component } from "react"
import { Button, Input, Form, Table, Select, InputNumber, message } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { JsonFeed, JsonFeedPost, EntityMetadata, API, Network, MultiLanguage } from "dvote-js"
import { checkValidJsonFeed } from "dvote-js/dist/models/json-feed"
const { Buffer } = require("buffer/")
import Web3Manager from "../util/web3-wallet"
import { Wallet, Signer } from "ethers"

import { Layout } from 'antd'
import TextArea from "antd/lib/input/TextArea";
import { getGatewayClients, getState } from "../util/dvote-state"
import { updateEntity } from "dvote-js/dist/api/entity"
const { Header } = Layout

interface Props {
    refresh?: () => void,
    showList: () => void,
    feed: JsonFeed,
    entityDetails: EntityMetadata,
}

interface State {
    selectedPost: JsonFeedPost,
}

const fieldStyle = { marginTop: 8 }

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 },
    },
}

export default class PageNewsFeedNew extends Component<Props, State> {
    state = {
        selectedPost: this.makeEmptyPost(),
    }

    addMetadataToPost(post: JsonFeedPost) {
        const now = new Date()
        if (!post.id) post.id = String(Date.now())  // Timestamp
        if (!post.date_published) post.date_published = now.toJSON()
        post.date_modified = now.toJSON()
        return post
    }

    async submit() {
        // TODO: Make a singnature and use it for next transactions
        // Web3Manager.signer.signMessage("democracy")
        // .then(payload => {
        //     console.log(payload)
        //     let passphrase = prompt("Enter your passphrase to unlock your account")
        //     // console.log(passphrase)
        //     const digest  = utils.keccak256((Buffer.from(payload+passphrase, 'utf8').toString('hex')))
        //     console.log(digest)
        // })
        // const privKey = padding/trim(digest)
        // const data = encrypt("hello", privKey)
        const newPost = this.addMetadataToPost(this.state.selectedPost)

        // TODO: Store POST in Dexie
        // el Dexie es un nice to have... con esto se puede montar una DB local, però también podríamos tirar de momento son
        // la única pega es que si se cierra el browser, se pierde todo

        // TODO:  Add new post in Items (state.feed.items)
        let feed = this.props.feed
        feed.items = [newPost].concat(feed.items)  // Add as the first item

        try {
            // TODO: The following removes the last post. Tested exactly the same in 
            // in Dvote-js and it works. How???
            // feed = checkValidJsonFeed(feed) 
            checkValidJsonFeed(feed)
        }
        catch (err) {
            message.warn("The updated News Feed does not seem to have a correct format")
            console.log(err)
            return
        }

        const hideLoading = message.loading('Action in progress...', 0)

        try {
            const clients = await getGatewayClients()
            const state = getState()

            // TODO: Check why for some reason addFile doesn't work without Buffer
            const feedContent = Buffer.from(JSON.stringify(feed))
            const feedContentUri = await API.File.addFile(feedContent, `feed_${Date.now()}.json`, Web3Manager.signer as any, clients.dvoteGateway)

            message.success("The news feed was pinned on IPFS successfully");

            let entityMetadata = this.props.entityDetails
            entityMetadata.newsFeed = { default: feedContentUri } as MultiLanguage<string>

            await updateEntity(state.address, entityMetadata, Web3Manager.signer as any, clients.web3Gateway, clients.dvoteGateway)
            hideLoading()

            message.success("The post has been successfully published")

            this.props.showList()
            if (this.props.refresh) this.props.refresh()
        }
        catch (err) {
            hideLoading()
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

    getSelectedPostCopy() {
        return Object.assign({}, this.state.selectedPost)
    }

    setselectedPostField(path: string[], value: any) {
        let post = this.getSelectedPostCopy()
        this.setNestedKey(post, path, value)
        this.setState({ selectedPost: post })
    }

    makeEmptyPost() {
        let post: JsonFeedPost = {
            id: "",
            title: "",
            summary: "",
            content_text: "",
            content_html: "",
            url: "",
            image: "",
            tags: [],
            date_published: "",
            date_modified: "",
            author: {
                name: "",
                url: "",
            }
        }
        return post
    }

    openInNewTab(url) {
        let win = window.open(url, '_blank');
        win.focus();
    }

    renderPostEditor() {
        const currentPost = this.state.selectedPost

        return <div style={{ padding: 30 }}>
            <Form {...formItemLayout} onSubmit={e => { e.preventDefault() }}>
                <Form.Item label="Header Image URI">
                    <Input
                        style={fieldStyle}
                        // placeholder="http://link.item/1234"
                        value={currentPost.image}
                        onChange={ev => this.setselectedPostField(["image"], ev.target.value)}
                    />
                <p style={{ marginBottom: 0 }}>
                <Button
                    style={fieldStyle}
                    type="link"
                    // icon="rocket"
                    size={'small'}
                    onClick={() => this.openInNewTab('https://unsplash.com/')}>
                    Browse images in Unsplash.com</Button>
                </p>
                </Form.Item>
                <Form.Item label="Title">
                    <Input
                        style={fieldStyle}
                        size="large"
                        placeholder="Post Title"
                        value={currentPost.title}
                        onChange={ev => this.setselectedPostField(['title'], ev.target.value)}
                    />
                </Form.Item>
                {/* <Form.Item label="Summary">
                    <TextArea
                        style={fieldStyle}
                        placeholder="A brief summary, containing the key purpose of the post described below."
                        autosize={{ minRows: 2, maxRows: 3 }}
                        value={currentPost.summary}
                        onChange={ev => this.setselectedPostField(["summary"], ev.target.value)}
                    />
                </Form.Item> */}
                {/* <Form.Item label="Content (plain text)">
                    <TextArea
                        style={fieldStyle}
                        placeholder="Your text goes here"
                        autosize={{ minRows: 4, maxRows: 10 }}
                        value={currentPost.content_text}
                        onChange={ev => this.setselectedPostField(["content_text"], ev.target.value)}
                    />
                </Form.Item> */}
                <Form.Item label="Content (HTML)">
                    <TextArea
                        style={fieldStyle}
                        placeholder="<p>Your text goes here</p>"
                        autosize={{ minRows: 4, maxRows: 10 }}
                        value={currentPost.content_html}
                        onChange={ev => this.setselectedPostField(["content_html"], ev.target.value)}
                    />
                </Form.Item>
                {/* <Form.Item label="Tags">
                    <Input
                        style={fieldStyle}
                        placeholder="tag1;tag2;tag3"
                        value={currentPost.tags}
                        onChange={ev => this.setselectedPostField(["tags"], ev.target.value.toString().split(';'))}
                    />

                </Form.Item>
                <Form.Item label="Author">
                    <Input
                        style={fieldStyle}
                        placeholder="John Smith"
                        value={currentPost.author.name}
                        onChange={ev => this.setselectedPostField(["author", "name"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="Author (URL)">
                    <Input
                        style={fieldStyle}
                        placeholder="http://link.item/1234"
                        value={currentPost.author.url}
                        onChange={ev => this.setselectedPostField(["author", "url"], ev.target.value)}
                    />
                </Form.Item> */}
            </Form>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
                <Button
                    style={fieldStyle}
                    type="primary"
                    icon="rocket"
                    size={'large'}
                    onClick={() => this.submit()}>
                    Publish Post</Button>
            </div>
        </div>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="unordered-list"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.props.showList()}>Show post list</Button>
                </div>
                <h2>New Post</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {this.renderPostEditor()}
            </div>
        </>
    }
}
