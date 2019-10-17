import { Component } from "react"
import { Button, Input, Form, Table, Select, InputNumber, message } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { JsonFeedPost, API, Network } from "dvote-js"
import EthereumManager from "../util/ethereum-manager"

import { Layout } from 'antd'
import TextArea from "antd/lib/input/TextArea";
const { Header } = Layout

interface Props {
    refresh?: () => void
    showList: () => void
    entityDetails: object,
    currentAddress: string
}

interface State {
    selectedPost: JsonFeedPost
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
         selectedPost: this.makeEmptyPost()
    }

    submit = () => {
        // let success = this.checkFields()

        // if (!success)
        //     return

        // const hideLoading = message.loading('Action in progress..', 0)

        // Network.Bootnodes.getRandomGatewayInfo("goerli").then((gws) => {
        //     return API.Vote.createVotingProcess(this.state.selectedPost, EthereumManager.signer, gws["goerli"])
        // }).then(processId => {
        //     message.success("The voting process with ID " + processId.substr(0, 8) + " has been created")
        //     hideLoading()

        //     if (this.props.refresh) this.props.refresh()
        // }).catch(err => {
        //     hideLoading()

        //     message.error("The voting process could not be created")
        // })
    }


    setNestedKey = (obj, path, value) => {
        if (path.length === 1) {
            obj[path] = value
            return
        }
        return this.setNestedKey(obj[path[0]], path.slice(1), value)
    }

    cloneselectedPost() {
        return Object.assign({}, this.state.selectedPost)
    }

    setselectedPostField(path, value) {
        let post = this.cloneselectedPost()
        this.setNestedKey(process, path, value)
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

    renderPostEdit() {
        //return null
        
        const currentPost = this.state.selectedPost

        return <div style={{ padding: 30 }}>
            <h2>General</h2>
            <Form {...formItemLayout} onSubmit={e => { e.preventDefault() }}>
                <Form.Item label="Title">
                    <Input
                        style={fieldStyle}
                        size="large"
                        placeholder="Post Title"
                        value={currentPost.title}
                        onChange={ev => this.setselectedPostField(['title'], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="Summary">
                    <TextArea
                        style={fieldStyle}
                        placeholder="Summary"
                        autosize={{ minRows: 2, maxRows: 3 }}
                        value={currentPost.summary}
                        onChange={ev => this.setselectedPostField(["summary"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="Text">
                    <TextArea
                        style={fieldStyle}
                        placeholder="Text"
                        autosize={{ minRows: 4, maxRows: 10 }}
                        value={currentPost.content_text}
                        onChange={ev => this.setselectedPostField(["content_text"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="HTML">
                    <TextArea
                        style={fieldStyle}
                        placeholder="HTML"
                        autosize={{ minRows: 4, maxRows: 10 }}
                        value={currentPost.content_html}
                        onChange={ev => this.setselectedPostField(["content_html"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="URL">
                    <Input
                        style={fieldStyle}
                        placeholder="http://link.item/1234"
                        value={currentPost.url}
                        onChange={ev => this.setselectedPostField(["url"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="Image">
                    <Input
                        style={fieldStyle}
                        placeholder="http://link.item/1234"
                        value={currentPost.image}
                        onChange={ev => this.setselectedPostField(["image"], ev.target.value)}
                    />
                </Form.Item>
                
                <Form.Item label="Tags">
                    <Input
                            style={fieldStyle}
                            placeholder="tag1;tag2;tag3"
                            value={currentPost.tags}
                            onChange={ev => this.setselectedPostField(["tags"], ev.target.value.toString().split(';'))}

                    />
                    
                </Form.Item>
                <Form.Item label="Author Name">
                    <Input
                        style={fieldStyle}
                        placeholder="Name"
                        value={currentPost.author.name}
                        onChange={ev => this.setselectedPostField(["author", "name"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="Author URL">
                    <Input
                        style={fieldStyle}
                        placeholder="http://link.item/1234"
                        value={currentPost.author.url}
                        onChange={ev => this.setselectedPostField(["author", "url"], ev.target.value)}
                    />
                </Form.Item>
            </Form>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
                <Button
                    style={fieldStyle}
                    type="primary"
                    icon="rocket"
                    size={'large'}
                    onClick={this.submit}>
                    Create new process</Button>
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
                        onClick={() => this.props.showList()}>Show vote list</Button>
                </div>
                <h2>New Voting Process</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {this.renderPostEdit()}
            </div>
        </>
    }
}
