import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Input, Form, InputNumber } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { ProcessMetadata, MultiLanguage, API, Network } from "dvote-js"
import EthereumManager from "../util/ethereum-manager"

import { Layout } from 'antd'
import TextArea from "antd/lib/input/TextArea";
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string
}

interface State {
    processess: object[],
    selectedProcess: number
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

export default class PageVotes extends Component<Props, State> {
    state = {
        processess: [],
        selectedProcess: -1,
        newProcess: this.makeEmptyProcess()
    }

    renderProcessessList() {
        if (!this.state.processess || !this.state.processess.length)
            return <Empty description="No processess" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            <List
                itemLayout="horizontal"
                dataSource={this.state.processess}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar>{item.name[0] + item.lastName[0]}</Avatar>}
                            title={`${item.name} ${item.lastName}`}
                            description={<span>
                                NIF: {item.nif}<br />
                                Public key: <code>{item.publicKey}</code>
                            </span>}
                        />
                    </List.Item>
                )}
            />
        </div>
    }

    addQuestion = () => {
        let process = this.cloneNewProcess();
        let newQuestion = this.makeEmptyQuestion()
        process.details.questions.push(newQuestion as any)
        this.setState({ newProcess: process })
    }

    randomInt(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
     }

    createProcess = () => {
        Network.Bootnodes.getRandomGatewayInfo("goerli").then((gws) => {
            API.Vote.createVotingProcess(this.state.newProcess, EthereumManager.signer, gws["goerli"])
        })

    }

    addOption = (questionIdx) => {
        let process = this.cloneNewProcess();
        let newVoteOption = this.makeEmptyVoteOption()
        process.details.questions[questionIdx].voteOptions.push(newVoteOption)
        this.setState({ newProcess: process })
    }

    removeQuestion = (questionIdx) => {
        let process = this.cloneNewProcess();
        let newVoteOption = this.makeEmptyVoteOption()
        process.details.questions.splice(questionIdx, 1)
        this.setState({ newProcess: process })
    }

    removeOption = (questionIdx, optionIdx) => {
        let process = this.cloneNewProcess();
        process.details.questions[questionIdx].voteOptions.splice(optionIdx, 1)
        this.setState({ newProcess: process })
    }

    makeEmptyProcess() {
        let process: ProcessMetadata = {
            version: "1.0",
            type: "snark-vote",
            startBlock: null,
            numberOfBlocks: null,
            census: {
                merkleRoot: "",
                merkleTree: ""
            },
            details: {
                entityId: "",
                encryptionPublicKey: "",
                title: {
                    default: ""
                },
                description: {
                    default: ""
                },
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
            voteOptions: [this.makeEmptyVoteOption(), this.makeEmptyVoteOption()]
        }
    }

    makeEmptyVoteOption() {
        return {
            title: { default: "" },
            value: ""
        };
    }

    setNestedKey = (obj, path, value) => {
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

    renderCreateProcess() {

        let questions = this.state.newProcess.details.questions

        return <div style={{ padding: 30 }}>
            <h2>General</h2>
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
                <Form.Item label="Description">
                    <TextArea
                        style={fieldStyle}
                        placeholder="Description"
                        autosize={{ minRows: 4, maxRows: 8 }}
                        value={this.state.newProcess.details.description['default']}
                        onChange={ev => this.setNewProcessField(["details", "description", "default"], ev.target.value)}
                    />

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
                    onClick={this.addQuestion}>
                    Add a question</Button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
                <Button
                    style={fieldStyle}
                    type="primary"
                    icon="rocket"
                    size={'large'}
                    onClick={this.createProcess}>
                    Create new process</Button>
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
            </Form>

            <div style={{ display: "flex", justifyContent: "flex-start", paddingTop: 8 }}>
                <Button
                    type="default"
                    icon="plus"
                    size={'default'}
                    onClick={() => this.addOption(questionIdx)}>
                </Button>
            </div>
        </div>
    }

    renderCreateOption(questionIdx, optionIdx) {

        return <Form.Item label={"Option " + (optionIdx + 1).toString()}>
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
                <h2>Process creation</h2>
            </Header>

            <div style={{ padding: 24, background: '#fff' }}>
                {this.renderCreateProcess()}
            </div>
        </>
    }
}
