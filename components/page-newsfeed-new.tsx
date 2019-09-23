import { Component } from "react"
import { Button, Input, Form, Select, InputNumber, message } from 'antd'
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
    // state = {
    //     selectedPost: this.makeEmptyProcess()
    // }

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

    // setselectedPostField(path, value) {
    //     let process = this.cloneselectedPost()
    //     this.setNestedKey(process, path, value)
    //     this.setState({ selectedPost: process })
    // }

    renderPostEdit() {
        return null
        // const currentPost = {}

        // return <div style={{ padding: 30 }}>
        //     <h2>General</h2>
        //     <Form {...formItemLayout} onSubmit={e => { e.preventDefault() }}>
        //         <Form.Item label="Title">
        //             <Input
        //                 style={fieldStyle}
        //                 size="large"
        //                 placeholder="Human Rights Declaration"
        //                 value={currentPost.details.title.default}
        //             // onChange={ev => this.setselectedPostField(['details', 'title', 'default'], ev.target.value)}
        //             />
        //         </Form.Item>
        //         <Form.Item label="Type">
        //             <Select
        //                 showSearch
        //                 style={{ width: 200 }}
        //                 value={currentPost.type}
        //                 placeholder="Select a process type"
        //             // onChange={value => this.setselectedPostField(['type'], value)}
        //             >
        //                 <Select.Option value="snark-vote" disabled>Anonymous Vote</Select.Option>
        //                 <Select.Option value="poll-vote">Poll</Select.Option>
        //                 <Select.Option value="petition-sign" disabled>Petition</Select.Option>
        //             </Select>
        //         </Form.Item>
        //         <Form.Item label="Description">
        //             <TextArea
        //                 style={fieldStyle}
        //                 placeholder="Description"
        //                 autosize={{ minRows: 4, maxRows: 8 }}
        //                 value={currentPost.details.description['default']}
        //             // onChange={ev => this.setselectedPostField(["details", "description", "default"], ev.target.value)}
        //             />
        //         </Form.Item>
        //         <Form.Item label="Census Merkle Root">
        //             <Input
        //                 style={fieldStyle}
        //                 size="large"
        //                 placeholder="0x123456789..."
        //                 value={currentPost.census.merkleRoot}
        //             // onChange={ev => this.setselectedPostField(['census', 'merkleRoot'], ev.target.value)}
        //             />
        //             <p style={{ marginBottom: 0 }}><small>You should find this value on Vocdoni's Census Manager or in your organization CRM</small></p>
        //         </Form.Item>
        //         <Form.Item label="Census Merkle Tree origin">
        //             <Input
        //                 style={fieldStyle}
        //                 size="large"
        //                 placeholder="ipfs://123456...!12345678"
        //                 value={currentPost.census.merkleTree}
        //             // onChange={ev => this.setselectedPostField(['census', 'merkleTree'], ev.target.value)}
        //             />
        //             <p style={{ marginBottom: 0 }}><small>You should find this value on Vocdoni's Census Manager or in your organization CRM</small></p>
        //         </Form.Item>
        //         <Form.Item label="Start block">
        //             <InputNumber
        //                 style={fieldStyle}
        //                 min={0}
        //                 placeholder="1234"
        //                 value={currentPost.startBlock}
        //             // onChange={num => this.setselectedPostField(["startBlock"], num)}
        //             />

        //         </Form.Item>
        //         <Form.Item label="Number of blocks">
        //             <InputNumber
        //                 style={fieldStyle}
        //                 min={1}
        //                 placeholder="200"
        //                 value={currentPost.numberOfBlocks}
        //             // onChange={num => this.setselectedPostField(["numberOfBlocks"], num)}
        //             />
        //         </Form.Item>

        //         <Form.Item label="Header image URI">
        //             <Input
        //                 style={fieldStyle}
        //                 placeholder="Header image Uri"
        //                 value={currentPost.details.headerImage}
        //             // onChange={ev => this.setselectedPostField(["details", "headerImage"], ev.target.value)}
        //             />
        //         </Form.Item>
        //     </Form>

        //     <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
        //         <Button
        //             style={fieldStyle}
        //             type="primary"
        //             icon="rocket"
        //             size={'large'}
        //             onClick={this.submit}>
        //             Create new process</Button>
        //     </div>
        // </div>
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
