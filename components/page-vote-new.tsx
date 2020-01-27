import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Input, Form, Select, InputNumber, message } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { ProcessMetadata, MultiLanguage, API, Network } from "dvote-js"
import Web3Manager from "../util/web3-wallet"
import { Wallet, Signer } from "ethers"

import { Layout } from 'antd'
import TextArea from "antd/lib/input/TextArea";
import { getGatewayClients } from "../util/dvote-state"
const { Header } = Layout

interface Props {
    refresh?: () => void
    showList: () => void
    entityDetails: object,
    currentAddress: string
}

interface State {
    newProcess: ProcessMetadata
}


const fieldStyle = { marginTop: 8 }
/*interface Question {
        type: string,
        question: MultiLanguage<string>,
        description:MultiLanguage<string>,
        voteOptions: []
}*/

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

export default class PageVoteNew extends Component<Props, State> {
    state = {
        newProcess: this.makeEmptyProcess()
    }

    addQuestion() {
        let process = this.cloneNewProcess();
        let newQuestion = this.makeEmptyQuestion()
        process.details.questions.push(newQuestion as any)
        this.setState({ newProcess: process })
    }

    checkFields(): boolean {
        if (isNaN(this.state.newProcess.startBlock)) {
            message.error("Start block must be a number")
            return false
        }
        if (isNaN(this.state.newProcess.numberOfBlocks)) {
            message.error("Number of block must be a number")
            return false
        }

        return true
    }

    async createProcess() {
        if (!this.checkFields()) {
            return message.warn("The metadata fields are not valid")
        }

        const clients = await getGatewayClients()
        const hideLoading = message.loading('Action in progress..', 0)

        Network.Bootnodes.getRandomGatewayInfo("goerli").then((gws) => {
            return API.Vote.createVotingProcess(this.state.newProcess, Web3Manager.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
        }).then(processId => {
            message.success("The voting process with ID " + processId.substr(0, 8) + " has been created")
            hideLoading()

            if (this.props.refresh) this.props.refresh()
        }).catch(err => {
            hideLoading()

            message.error("The voting process could not be created")
        })
    }

    addOption(questionIdx) {
        let process = this.cloneNewProcess();
        let numberOfOptions = process.details.questions[questionIdx].voteOptions.length
        let newVoteOption = this.makeEmptyVoteOption(numberOfOptions.toString())
        process.details.questions[questionIdx].voteOptions.push(newVoteOption)
        this.setState({ newProcess: process })
    }

    removeQuestion(questionIdx) {
        let process = this.cloneNewProcess();
        process.details.questions.splice(questionIdx, 1)
        this.setState({ newProcess: process })
    }

    removeOption(questionIdx, optionIdx) {
        let process = this.cloneNewProcess();
        process.details.questions[questionIdx].voteOptions.splice(optionIdx, 1)
        this.setState({ newProcess: process })
    }

    makeEmptyProcess() {
        let process: ProcessMetadata = {
            version: "1.0",
            type: "poll-vote",  // use snark-vote by default
            startBlock: null,
            numberOfBlocks: null,
            census: {
                merkleRoot: "",
                merkleTree: ""
            },
            details: {
                entityId: API.Entity.getEntityId(this.props.currentAddress),
                encryptionPublicKey: "0x0",
                title: {
                    default: ""
                },
                description: {
                    default: ""
                },
                // headerImage: "https://source.unsplash.com/random/",
                headerImage: "",
                questions: [this.makeEmptyQuestion() as any]
            }
        }
        return process
    }

    makeEmptyQuestion() {
        return {
            type: "single-choice",
            question: {
                default: ""
            },
            description: {
                default: ""
            },
            voteOptions: [this.makeEmptyVoteOption("0"), this.makeEmptyVoteOption("1")]
        }
    }

    makeEmptyVoteOption(value) {
        return {
            title: { default: "" },
            value: value
        };
    }

    setNestedKey(obj, path, value) {
        if (path.length === 1) {
            obj[path] = value
            return
        }
        return this.setNestedKey(obj[path[0]], path.slice(1), value)
    }

    cloneNewProcess() {
        return Object.assign({}, this.state.newProcess)
    }

    setNewProcessField(path, value) {
        let process = this.cloneNewProcess()
        this.setNestedKey(process, path, value)
        this.setState({ newProcess: process })
    }

    openInNewTab(url) {
        let win = window.open(url, '_blank');
        win.focus();
    }

    renderCreateProcess() {

        let questions = this.state.newProcess.details.questions

        return <div style={{ padding: 30 }}>
            <Form {...formItemLayout} onSubmit={e => { e.preventDefault() }}>
                <Form.Item label="Title">
                    <Input
                        style={fieldStyle}
                        size="large"
                        placeholder="Human Rights Declaration"
                        value={this.state.newProcess.details.title.default}
                        onChange={ev => this.setNewProcessField(['details', 'title', 'default'], ev.target.value)}
                    />
                </Form.Item>
                {/* <Form.Item label="Type">
                    <Select
                        showSearch
                        style={{ width: 200 }}
                        value={this.state.newProcess.type}
                        placeholder="Select a process type"
                        onChange={value => this.setNewProcessField(['type'], value)}
                    >
                        <Select.Option value="snark-vote" disabled>Anonymous Vote</Select.Option>
                        <Select.Option value="poll-vote">Poll</Select.Option>
                        <Select.Option value="petition-sign" disabled>Petition</Select.Option>
                    </Select>
                </Form.Item> */}
                <Form.Item label="Description">
                    <TextArea
                        style={fieldStyle}
                        placeholder="Description"
                        autosize={{ minRows: 4, maxRows: 8 }}
                        value={this.state.newProcess.details.description['default']}
                        onChange={ev => this.setNewProcessField(["details", "description", "default"], ev.target.value)}
                    />
                </Form.Item>
                <Form.Item label="Census Merkle Root">
                    <Input
                        style={fieldStyle}
                        size="large"
                        placeholder="0x123456789..."
                        value={this.state.newProcess.census.merkleRoot}
                        onChange={ev => this.setNewProcessField(['census', 'merkleRoot'], ev.target.value)}
                    />
                    <p style={{ marginBottom: 0 }}><small>You can find this value in the Census-manager</small></p>
                    {/* <p style={{ marginBottom: 0 }}><small>You should find this value on Vocdoni's Census Manager or in your organization CRM</small></p> */}
                </Form.Item>
                <Form.Item label="Census Merkle Tree origin">
                    <Input
                        style={fieldStyle}
                        size="large"
                        placeholder="ipfs://123456...!12345678"
                        value={this.state.newProcess.census.merkleTree}
                        onChange={ev => this.setNewProcessField(['census', 'merkleTree'], ev.target.value)}
                    />
                    <p style={{ marginBottom: 0 }}><small>You can find this value in the Census-manager</small>
                    <Button
                    style={fieldStyle}
                    type="link"
                    // icon="rocket"
                    size={'small'}
                    onClick={() => this.openInNewTab('http://census-manager.vocdoni.net/')}>
                    Go to Census-manager</Button>
                    </p>
                    {/* <p style={{ marginBottom: 0 }}><small>You should find this value on Vocdoni's Census Manager or in your organization CRM</small></p> */}
                </Form.Item>
                <Form.Item label="Start block">
                    <InputNumber
                        style={fieldStyle}
                        min={0}
                        placeholder="1234"
                        value={this.state.newProcess.startBlock}
                        onChange={num => this.setNewProcessField(["startBlock"], num)}
                    />

                </Form.Item>
                <Form.Item label="Number of blocks">
                    <InputNumber
                        style={fieldStyle}
                        min={1}
                        placeholder="200"
                        value={this.state.newProcess.numberOfBlocks}
                        onChange={num => this.setNewProcessField(["numberOfBlocks"], num)}
                    />
                </Form.Item>

                <Form.Item label="Header image URI">
                    <Input
                        style={fieldStyle}
                        // placeholder="Header image Uri"
                        value={this.state.newProcess.details.headerImage}
                        onChange={ev => this.setNewProcessField(["details", "headerImage"], ev.target.value)}
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
            </Form>

            <h2>Questions</h2>
            {
                questions.map((question, idx) => this.renderCreateQuestion(idx))
            }
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
                <Button
                    style={fieldStyle}
                    type="default"
                    icon="plus"
                    size={'default'}
                    onClick={() => this.addQuestion()}>
                    Add a question</Button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
                <Button
                    style={fieldStyle}
                    type="primary"
                    icon="rocket"
                    size={'large'}
                    onClick={() => this.createProcess()}>
                    Publish Poll</Button>
            </div>
        </div>
    }

    renderCreateQuestion(questionIdx) {

        let options = this.state.newProcess.details.questions

        return <div key={'question' + questionIdx} style={{ paddingTop: 24 }}>

            <Form {...formItemLayout} onSubmit={e => { e.preventDefault() }}>

                <Form.Item label="Question title">
                    <div style={{ paddingTop: 8, display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
                        <Input
                            addonBefore={(questionIdx + 1).toString()}
                            // placeholder="Question"
                            size="large"
                            value={this.state.newProcess.details.questions[questionIdx].question.default}
                            onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'question', 'default'], ev.target.value)}
                        />

                        <div style={{ paddingLeft: 8 }}>
                            <Button
                                type="default"
                                icon="minus"
                                size={'large'}
                                disabled={this.state.newProcess.details.questions.length <= 1}
                                onClick={() => this.removeQuestion(questionIdx)}>
                            </Button>
                        </div>
                    </div>
                </Form.Item>

                <Form.Item label="Description">
                    <TextArea
                        style={fieldStyle}
                        // placeholder="Description"
                        autosize={{ minRows: 4, maxRows: 8 }}
                        value={this.state.newProcess.details.questions[questionIdx].description.default}
                        onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'description', 'default'], ev.target.value)}
                    />
                </Form.Item>

                <div>
                    {
                        options[questionIdx].voteOptions.map((option, optionIdx) => this.renderCreateOption(questionIdx, optionIdx))
                    }
                </div>
            

            {/* <div style={{float: "right", paddingTop: 8, paddingBottom: 24}}> */}
            <div style={{ paddingTop: 8, display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
                <Button
                    style={{ float: "right" , paddingBottom: 8, paddingTop: 8}}
                    // style={fieldStyle}
                    type="default"
                    icon="plus"
                    size={'default'}
                    onClick={() => this.addOption(questionIdx)}>
                Add Option</Button>
            </div>
            </Form>
        </div>
    }

    renderCreateOption(questionIdx, optionIdx) {

        return <Form.Item label={"Option " + (optionIdx + 1).toString()} key={optionIdx}>
            <div style={{ paddingTop: 8, display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
                <Input
                    style={{ width: "100%" }}
                    // placeholder="Option"
                    // addonBefore={(optionIdx + 1).toString()}
                    value={this.state.newProcess.details.questions[questionIdx].voteOptions[optionIdx].title.default}
                    onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'voteOptions', optionIdx, 'title', 'default'], ev.target.value)}
                />

                <Button
                    type="default"
                    icon="minus"
                    size={'default'}
                    style={{ marginLeft: 8 }}
                    disabled={this.state.newProcess.details.questions[questionIdx].voteOptions.length <= 2}
                    onClick={() => this.removeOption(questionIdx, optionIdx)}>
                </Button>

            </div>
        </Form.Item>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                <div style={{ float: "right" }}>
                    <Button
                        type="default"
                        icon="unordered-list"
                        style={{ marginLeft: 8 }}
                        onClick={() => this.props.showList()}>See all polls</Button>
                </div>
                <h2>New Poll</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {this.renderCreateProcess()}
            </div>
        </>
    }
}
