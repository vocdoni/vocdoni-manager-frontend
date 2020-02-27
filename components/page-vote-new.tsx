import { Component } from "react"
import { Button, Input, Form, message, Typography, DatePicker } from 'antd'
const { RangePicker } = DatePicker
import moment from 'moment'
import { headerBackgroundColor } from "../lib/constants"
import { ProcessMetadata, MultiLanguage, API } from "dvote-js"
const { Vote: { createVotingProcess, getBlockHeight } } = API
import Web3Manager from "../util/web3-wallet"

import { Layout } from 'antd'
import TextArea from "antd/lib/input/TextArea";
import { getGatewayClients } from "../util/dvote-state"
import { DVoteGateway } from "dvote-js/dist/net/gateway"
const { Header } = Layout

interface Props {
    refresh?: () => void
    showList: () => void
    currentAddress: string
}

interface State {
    newProcess: ProcessMetadata
    currentBlock: number
    startBlock: number
    endBlock: number
    currentDate: moment.Moment
    startDate: moment.Moment
    numberOfBlocks: number,
    endDate: moment.Moment
    allowSubmit: boolean
}

const BLOCK_TIME = Number(process.env.BLOCK_TIME)
const ORACLE_CONFIRMATION_DELAY = Number(process.env.ORACLE_CONFIRMATION_DELAY)
const BLOCK_MARGIN = 20 // 200 seconds

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
        newProcess: this.makeEmptyProcess(),
        currentBlock: null,
        startBlock: null,
        endBlock: null,
        numberOfBlocks: null,
        currentDate: moment(),
        startDate: null,
        endDate: null,
        allowSubmit: true,
    }

    async componentDidMount() {
        await this.loadTime()
    }

    async loadTime() {
        const clients = await getGatewayClients()
        const currentBlock = await getBlockHeight(clients.dvoteGateway)
        this.setState({ currentBlock })
    }

    addQuestion() {
        let process = this.cloneNewProcess();
        let newQuestion = this.makeEmptyQuestion()
        process.details.questions.push(newQuestion as any)
        this.setState({ newProcess: process })
    }

    async checkFields(dvoteGateway: DVoteGateway): Promise<boolean> {
        if (isNaN(this.state.startBlock) || isNaN(this.state.numberOfBlocks)) {
            message.error("Poll dates where not defined correctly")
            return false
        }
        // if (this.state.numberOfBlocks < 1000) {
        //     message.error(`Poll duration is too short`)
        //     return false
        // }
        if (this.state.numberOfBlocks <= 0) {
            message.error("Poll start date needs to be higher than the end one")
            return false
        }
        if (this.state.startDate.isSameOrBefore(this.state.currentDate,'minute')) {
            message.error("Poll start date needs to be higher than the current one...")
            return false
        }
        if (this.state.endDate.isSameOrBefore(this.state.startDate,'minute')) {
            message.error("Poll start date needs to be higher than the end one!")
            return false
        }

        const currentBlock = await getBlockHeight(dvoteGateway)
        const blocksOracleDelay = ORACLE_CONFIRMATION_DELAY / BLOCK_TIME
        if (this.state.startBlock <= currentBlock + BLOCK_MARGIN + blocksOracleDelay) {
            const blocksSincePageLoaded = currentBlock - this.state.currentBlock
            let delaySeconds = (blocksSincePageLoaded + blocksOracleDelay + BLOCK_MARGIN) * BLOCK_TIME
            let delayMinutes = Math.ceil(delaySeconds/60)
            message.error(`The Start time of the process needs to be more than ${delayMinutes} minutes greater than the actual time`)
            this.setState({currentBlock})
            return false
        }

        return true
    }

    async createProcess() {
        const clients = await getGatewayClients()

        if (!(await this.checkFields(clients.dvoteGateway))) {
            this.setState({ allowSubmit: false })
            return message.warn("The metadata fields are not valid")
        } else {
            this.setState({ allowSubmit: true })
        }

        let newProcess = this.cloneNewProcess();
        newProcess.startBlock = this.state.startBlock
        newProcess.numberOfBlocks = this.state.numberOfBlocks
        this.setState({ newProcess })


        const hideLoading = message.loading('Action in progress..', 0)

        return createVotingProcess(this.state.newProcess, Web3Manager.signer, clients.web3Gateway, clients.dvoteGateway)
            .then(processId => {
                message.success("The voting process with ID " + processId.substr(0, 8) + " has been created")
                hideLoading()

                if (this.props.refresh) this.props.refresh()
                this.props.showList()
            }).catch(err => {
                hideLoading()
                console.error("The voting process could not be created", err);
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

    onOpen(status) {
        if (status) {
            this.setState({ currentDate: moment() })
        }
    }

    disabledDate(current: moment.Moment) {
        return current && current.isBefore(this.state.currentDate, 'day')
    }

    range(start, end) {
        const result = [];
        for (let i = start; i < end; i++) {
            result.push(i);
        }
        return result;
    }

    disabledTime(current: moment.Moment) {
        if (!current)
            return
        if (current && moment(current).isSame(this.state.currentDate.valueOf(), 'day')) {
            if (current && moment(current).isSame(this.state.currentDate.valueOf(), 'hours')) {
                return {
                    disabledHours: () => this.range(0, this.state.currentDate.hours()),
                    disabledMinutes: () => this.range(0, this.state.currentDate.minutes()),
                }
            }
            return {
                disabledHours: () => this.range(0, this.state.currentDate.hours()),
            }
        }
    }

    onStartDateOk(startDate: moment.Moment) {
        // TODO ? If we don't need to show calculated blocks this could be moved in the checkFields function
        let startBlock = (startDate.valueOf() - this.state.currentDate.valueOf()) / 1000 / BLOCK_TIME + this.state.currentBlock
        startBlock = Math.trunc(startBlock)
        this.setState({ startDate, startBlock })
    }

    onEndDateOk(endDate: moment.Moment) {
        // TODO ? If we don't need to show calculated blocks this could be moved in the checkFields function
        let numberOfBlocks = this.state.numberOfBlocks
        numberOfBlocks = (endDate.valueOf() - this.state.startDate.valueOf()) / 1000 / BLOCK_TIME
        numberOfBlocks = Math.trunc(numberOfBlocks)
        this.setState({ endDate, numberOfBlocks })
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
                        autoSize={{ minRows: 4, maxRows: 8 }}
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
                <Form.Item label="Time" >
                    <div>
                        <DatePicker
                            disabledDate={(current) => this.disabledDate(current)}
                            disabledTime={(current) => this.disabledTime(current)}
                            showTime={{ format: 'HH:mm' }}
                            format="YYYY-MM-DD HH:mm"
                            placeholder="Start"
                            onOk={(dates) => this.onStartDateOk(dates)}
                            onChange={(dates, _) => this.onStartDateOk(dates)}
                            onOpenChange={(status) => this.onOpen(status)}
                        />
                        <DatePicker
                            disabledDate={(current) => this.disabledDate(current)}
                            disabledTime={(current) => this.disabledTime(current)}
                            showTime={{ format: 'HH:mm' }}
                            format="YYYY-MM-DD HH:mm"
                            placeholder="End"
                            onOk={(dates) => this.onEndDateOk(dates)}
                            onChange={(dates, _) => this.onEndDateOk(dates)}
                            onOpenChange={(status) => this.onOpen(status)}
                        />
                    </div>
                    <Typography.Text id="start" >Current Block: {this.state.currentBlock}  {(this.state.startBlock) ? "Estimated Start Block: " + this.state.startBlock : ""} {(this.state.startBlock && this.state.numberOfBlocks) ? "Estimated End Block: " + (this.state.startBlock + this.state.numberOfBlocks) : ""} </Typography.Text>
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
                    // disabled={!this.state.allowSubmit}
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
                        autoSize={{ minRows: 4, maxRows: 8 }}
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
                        style={{ float: "right", paddingBottom: 8, paddingTop: 8 }}
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
