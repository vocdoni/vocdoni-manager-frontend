import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Input } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { ProcessMetadata, MultiLanguage } from "dvote-js"

import { Layout } from 'antd'
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

/*interface Question {
        type: string,
        question: MultiLanguage<string>,
        description:MultiLanguage<string>,
        voteOptions: []
}*/

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

    onProcessClick = () => {

    }

    onAddQuestionClick = () => {
        let process = this.cloneNewProcess();
        let newQuestion = this.makeEmptyQuestion()
        process.details.questions.push(newQuestion as any)
        this.setState({ newProcess: process })
    }

    onAddVotingOptionClick = (questionIdx) => {
        let process = this.cloneNewProcess();
        let newVoteOption = this.makeEmptyVoteOption()
        process.details.questions[questionIdx].voteOptions.push(newVoteOption)
        this.setState({ newProcess: process })
    }

    setData(process, fields, value) {
        if (process[fields[0]] == null)
            process[fields[0]] = {}
    }

    makeEmptyProcess() {
        let process: ProcessMetadata = {
            version: "1.0",
            type: "snark-vote",
            startBlock: null,
            numberOfBlocks: null,
            census: {
                censusMerkleRoot: "",
                censusMerkleTree: ""
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
                questions: []
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
            voteOptions: []
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

        let questions = this.state.newProcess.details.questions.map((question, idx) => this.renderCreateQuestion(idx))
        return <Col xs={24} md={12}>
            <Input
                placeholder="Name"
                value={this.state.newProcess.details.title.default}
                onChange={ev => this.setNewProcessField(['details', 'title', 'default'], ev.target.value)}
            />

            <Input
                placeholder="Description"
                value={this.state.newProcess.details.description['default']}
                onChange={ev => this.setNewProcessField(["details", "description", "default"], ev.target.value)}
            />

            <Input
                placeholder="Starting block"
                value={this.state.newProcess.startBlock}
                onChange={ev => this.setNewProcessField(["startBlock"], ev.target.value)}
            />

            <Input
                placeholder="Number of blocks"
                value={this.state.newProcess.numberOfBlocks}
                onChange={ev => this.setNewProcessField(["numberOfBlocks"], ev.target.value)}

            />

            {questions}

            <Button
                type="default"
                icon="plus"
                size={'default'}
                onClick={this.onAddQuestionClick}>
                Add question
                        </Button>
        </Col>
    }

    renderCreateQuestion(questionIdx) {

        let options = this.state.newProcess.details.questions[questionIdx].voteOptions.map((option, optionIdx) => this.renderCreateOption(questionIdx, optionIdx))

        return <div key={'question' + questionIdx}>

            <Input

                placeholder="Question"
                value={this.state.newProcess.details.questions[questionIdx].question.default}
                onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'question', 'default'], ev.target.value)}
            />

            <Input
                placeholder="Description"
                value={this.state.newProcess.details.questions[questionIdx].description.default}
                onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'description', 'default'], ev.target.value)}
            />

            <Button
                type="default"
                icon="plus"
                size={'default'}
                onClick={() => this.onAddVotingOptionClick(questionIdx)}>
                Add option
            </Button>
            {options}

        </div>
    }

    renderCreateOption(questionIdx, optionIndex) {

        return <div key={"option"+optionIndex}>

            <Input
                placeholder="Option"
                value={this.state.newProcess.details.questions[questionIdx].voteOptions[optionIndex].title.default}
                onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'voteOptions', optionIndex, 'title', 'default'], ev.target.value)}
            />

        </div>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 24 }}>
                    <Button
                        type="primary"
                        icon="plus"
                        size={'default'}
                        onClick={this.onProcessClick}>
                        New process
                        </Button>
                </div>
                {this.renderCreateProcess()}
                {this.renderProcessessList()}
            </div>
        </>
    }
}
