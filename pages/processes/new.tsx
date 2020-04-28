import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Form, Divider, Menu, Row, Col, DatePicker, Radio } from 'antd'
import { LoadingOutlined, RocketOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes, MultiLanguage, ProcessMetadata } from "dvote-js"
// import { by639_1 } from 'iso-language-codes'
import moment from 'moment'
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
import Web3Wallet from '../../lib/web3-wallet'
// import { Wallet, Signer } from 'ethers'
import { getEntityId } from 'dvote-js/dist/api/entity'
// import { checkValidProcessMetadata } from 'dvote-js/dist/models/voting-process'
import { ProcessMetadataTemplate } from 'dvote-js/dist/models/voting-process'
import { getBlockHeight, createVotingProcess } from 'dvote-js/dist/api/vote'
const { RangePicker } = DatePicker

const ORACLE_CONFIRMATION_DELAY = parseInt(process.env.ORACLE_CONFIRMATION_DELAY || "180")
const BLOCK_MARGIN = 60 // seconds

/* HTML EDITOR
let Editor: any // = await import("react-draft-wysiwyg")
let EditorState, ContentState, convertToRaw
let draftToHtml: any // = await import('draftjs-to-html')
let htmlToDraft: any // = await import('html-to-draftjs')
*/

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
// import { main } from "../i18n"

// MAIN COMPONENT
const ProcessNewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <ProcessNew {...context} />
}

type State = {
    dataLoading?: boolean,
    processCreating?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    process?: ProcessMetadata,
    bootnodes?: GatewayBootNodes,
    descriptionEditorState?: any,
    currentBlock: number
    startBlock: number
    currentDate: moment.Moment
    startDate: moment.Moment
    numberOfBlocks: number,
    endDate: moment.Moment
}

// Stateful component
class ProcessNew extends Component<IAppContext, State> {
    state: State = {
        process: ProcessMetadataTemplate,
        currentBlock: null,
        startBlock: null,
        numberOfBlocks: null,
        currentDate: moment(),
        startDate: null,
        endDate: null
    }

    refreshInterval = null

    async componentDidMount() {
        const { readOnly } = getNetworkState()
        // if readonly, show the view page
        if (readOnly) {
            return Router.replace("/")
        }

        this.props.setTitle("New vote")

        /* HTML EDITOR
        // Do the imports dynamically because `window` does not exist on SSR
    
        Editor = (await import('react-draft-wysiwyg')).Editor
        const DraftJS = await import('draft-js')
        EditorState = DraftJS.EditorState
        ContentState = DraftJS.ContentState
        convertToRaw = DraftJS.convertToRaw
        draftToHtml = (await import('draftjs-to-html')).default
        htmlToDraft = (await import('html-to-draftjs')).default
        
        this.setState({ descriptionEditorState: EditorState.createEmpty() })
       */

        try {
            await this.refreshBlockHeight()
            await this.refreshMetadata()
            this.setDateRange(moment().add(1, 'days'), moment().add(3, 'days'))

            const interval = (parseInt(process.env.BLOCK_TIME || "10") || 10) * 1000
            this.refreshInterval = setInterval(() => this.refreshBlockHeight(), interval)
        }
        catch (err) {
            message.error("Could not check the entity metadata")
        }
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    async refreshBlockHeight() {
        const clients = await getGatewayClients()
        const currentBlock = await getBlockHeight(clients.dvoteGateway)
        this.setState({ currentBlock, currentDate: moment() })
    }

    async refreshMetadata() {
        try {
            const { address } = getNetworkState()
            const entityId = getEntityId(address)

            this.setState({ dataLoading: true, entityId })

            const { web3Gateway, dvoteGateway } = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
            if (!entity) throw new Error()

            /* HTML EDITOR
            const contentBlock = htmlToDraft("<p></p>")
            if (contentBlock) {
              const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
              const descriptionEditorState = EditorState.createWithContent(contentState)
              this.setState({ descriptionEditorState })
            }
            */

            this.setState({ entity, entityId, dataLoading: false })
            this.props.setTitle(entity.name["default"])
        }
        catch (err) {
            this.setState({ dataLoading: false })
            throw err
        }
    }

    addQuestion() {
        const emptyQuestion = {
            type: "single-choice",
            question: { default: "" },
            description: { default: "" },
            voteOptions: [{ title: { default: "" }, value: "0" }, { title: { default: "" }, value: "1" }]
        }
        const proc = this.state.process
        proc.details.questions.push(emptyQuestion as any)
        this.setState({ process: proc })
    }

    addOption(questionIdx) {
        let process = this.state.process
        let optionCount = process.details.questions[questionIdx].voteOptions.length
        let newVoteOption = { title: { default: "" }, value: optionCount.toString() }
        process.details.questions[questionIdx].voteOptions.push(newVoteOption)
        this.setState({ process })
    }

    removeQuestion(questionIdx) {
        let process = this.state.process;
        process.details.questions.splice(questionIdx, 1)
        this.setState({ process })
    }

    removeOption(questionIdx, optionIdx) {
        let process = this.state.process;
        process.details.questions[questionIdx].voteOptions.splice(optionIdx, 1)
        this.setState({ process })
    }

    setNestedKey(obj, path, value) {
        if (path.length === 1) {
            obj[path] = value
            return
        }
        return this.setNestedKey(obj[path[0]], path.slice(1), value)
    }

    setNewProcessField(path, value) {
        let process = this.state.process
        this.setNestedKey(process, path, value)
        this.setState({ process })
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

    setDateRange(startDate: moment.Moment, endDate: moment.Moment) {
        // TODO ? If we don't need to show calculated blocks this could be moved in the checkFields function
        let startBlock = (startDate.valueOf() - this.state.currentDate.valueOf()) / 1000 / parseInt(process.env.BLOCK_TIME) + this.state.currentBlock
        startBlock = Math.trunc(startBlock)

        let numberOfBlocks = (endDate.valueOf() - startDate.valueOf()) / 1000 / parseInt(process.env.BLOCK_TIME)
        numberOfBlocks = Math.trunc(numberOfBlocks)

        this.setState({ startDate, startBlock, endDate, numberOfBlocks })
    }

    async checkFields(): Promise<boolean> {
        const { dvoteGateway } = await getGatewayClients()

        if (isNaN(this.state.startBlock) || isNaN(this.state.numberOfBlocks)) {
            message.error("Poll dates where not defined correctly")
            return false
        }
        // if (this.state.numberOfBlocks < 1000) {
        //     message.error(`The duration is too short`)
        //     return false
        // }
        if (this.state.numberOfBlocks <= 0) {
            message.error("The vote start date needs to be higher than the end one")
            return false
        }
        if (this.state.startDate.isSameOrBefore(this.state.currentDate, 'minute')) {
            message.error("The vote start date needs to be higher than the current one")
            return false
        }
        if (this.state.endDate.isSameOrBefore(this.state.startDate, 'minute')) {
            message.error("The vote start date needs to be higher than the end one!")
            return false
        }

        const currentBlock = await getBlockHeight(dvoteGateway)
        const blocksOracleDelay = ORACLE_CONFIRMATION_DELAY / parseInt(process.env.BLOCK_TIME)
        if (this.state.startBlock <= currentBlock + BLOCK_MARGIN + blocksOracleDelay) {
            const blocksSincePageLoaded = currentBlock - this.state.currentBlock
            let delaySeconds = (blocksSincePageLoaded + blocksOracleDelay + BLOCK_MARGIN) * parseInt(process.env.BLOCK_TIME)
            let delayMinutes = Math.ceil(delaySeconds / 60)
            message.error(`The Start time of the process needs to be ${delayMinutes} minutes after the current time or more`)
            this.setState({ currentBlock })
            return false
        }

        return true
    }

    async submit() {
        const clients = await getGatewayClients()

        if (!(await this.checkFields())) {
            return message.warn("The metadata fields are not valid")
        }

        let newProcess = this.state.process
        newProcess.startBlock = this.state.startBlock
        newProcess.numberOfBlocks = this.state.numberOfBlocks
        newProcess.details.entityId = this.state.entityId
        newProcess.details.encryptionPublicKey = "0x0"

        const hideLoading = message.loading('Action in progress..', 0)
        this.setState({ processCreating: true })

        return createVotingProcess(newProcess, Web3Wallet.signer, clients.web3Gateway, clients.dvoteGateway)
            .then(processId => {
                message.success("The voting process with ID " + processId.substr(0, 8) + " has been created")
                hideLoading()
                this.setState({ processCreating: false })

                Router.push("/processes/#/" + this.state.entityId + "/" + processId)
            }).catch(err => {
                hideLoading()
                this.setState({ processCreating: false })

                console.error("The voting process could not be created", err);
                message.error("The voting process could not be created")
            })
    }

    // editorContentChanged(state) {
    //   this.setState({ descriptionEditorState: state })

    //   const newHtml = draftToHtml(convertToRaw(state.getCurrentContent()))
    //   const element = document.createElement("div")
    //   element.innerHTML = newHtml
    //   const newText = element.innerText
    //   this.setselectedPostField(["content_text"], newText)
    //   this.setselectedPostField(["content_html"], newHtml)
    // }

    renderProcessNew() {
        let questions = this.state.process.details.questions

        return <div className="body-card">
            <Row justify="start">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">New vote</Divider>

                    <Form>
                        <Form.Item>
                            <label>Title</label>
                            <Input
                                size="large"
                                placeholder="Human Rights Declaration"
                                value={this.state.process.details.title.default}
                                onChange={ev => this.setNewProcessField(['details', 'title', 'default'], ev.target.value)}
                            />
                        </Form.Item>
                        <Form.Item>
                            <label>Description</label>
                            <Input.TextArea
                                placeholder="Description"
                                autoSize={{ minRows: 4, maxRows: 8 }}
                                value={this.state.process.details.description['default']}
                                onChange={ev => this.setNewProcessField(["details", "description", "default"], ev.target.value)}
                            />
                        </Form.Item>
                        <Form.Item>
                            <label>Header image URL</label>
                            <Input
                                // placeholder="Header image Uri"
                                value={this.state.process.details.headerImage}
                                onChange={ev => this.setNewProcessField(["details", "headerImage"], ev.target.value)}
                            />
                            <small style={{ lineHeight: "35px" }}>
                                <a href="https://unsplash.com/" target="_blank">Browse images in Unsplash.com</a>
                            </small>
                        </Form.Item>
                        <Form.Item>
                            <label>Process type</label>
                            <br />
                            <Radio.Group buttonStyle="solid" value={this.state.process.type} onChange={e => this.setNewProcessField(["type"], e.target.value)}>
                                <Radio.Button value="poll-vote">Public Poll</Radio.Button>
                                <Radio.Button value="encrypted-poll-vote">Encrypted Poll</Radio.Button>
                            </Radio.Group>
                            {
                                this.state.process.type == "poll-vote" ?
                                    <p><small>On a standard poll, all votes become public as soon as they are registered. <br />Participants are not anonymous.</small></p> :
                                    <p><small>On an encrypted poll, votes remain encrypted until the process has ended. <br />Participants are not anonymous.</small></p>
                            }
                        </Form.Item>
                    </Form>

                    <br />
                    <Divider orientation="left">Census</Divider>

                    <Form>
                        <Form.Item>
                            <label>Census Merkle Root</label>
                            <Input
                                size="large"
                                placeholder="0x123456789..."
                                value={this.state.process.census.merkleRoot}
                                onChange={ev => this.setNewProcessField(['census', 'merkleRoot'], ev.target.value)}
                            />
                            <small style={{ lineHeight: "35px" }}>
                                <a href="https://census-manager.vocdoni.net/" target="_blank">You can find the value on the Census Manager</a>
                            </small>
                        </Form.Item>
                        <Form.Item>
                            <label>Census Merkle Tree origin</label>
                            <Input
                                size="large"
                                placeholder="ipfs://123456...!12345678"
                                value={this.state.process.census.merkleTree}
                                onChange={ev => this.setNewProcessField(['census', 'merkleTree'], ev.target.value)}
                            />

                            <small style={{ lineHeight: "35px" }}>
                                <a href="https://census-manager.vocdoni.net/" target="_blank">You can find the value on the Census Manager</a>
                            </small>
                        </Form.Item>
                    </Form>

                    <br />
                    <Divider orientation="left">Time frame</Divider>

                    <Form>
                        <Form.Item>
                            <label>Starting and ending dates</label>
                            <div>
                                <RangePicker
                                    // open
                                    format='YYYY/MM/DD HH:mm'
                                    placeholder={["Vote start", "Vote end"]}
                                    disabledDate={(current) => this.disabledDate(current)}
                                    disabledTime={(current) => this.disabledTime(current)}
                                    defaultValue={[moment().add(1, 'days'), moment().add(3, 'days')]}
                                    onChange={(dates: moment.Moment[], _) => {
                                        if (!dates || !dates.length) return
                                        this.setDateRange(dates[0], dates[1])
                                    }}
                                    showTime />
                            </div>
                            {/* 
              <div>
                <DatePicker
                  disabledDate={(current) => this.disabledDate(current)}
                  disabledTime={(current) => this.disabledTime(current)}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Start"
                  onOk={(dates) => this.setStartDate(dates)}
                  onChange={(dates, _) => this.setStartDate(dates)}
                  onOpenChange={(status) => this.onOpen(status)}
                />
                &nbsp;&nbsp;
                <DatePicker
                  disabledDate={(current) => this.disabledDate(current)}
                  disabledTime={(current) => this.disabledTime(current)}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="End"
                  onOk={(dates) => this.setEndDate(dates)}
                  onChange={(dates, _) => this.setEndDate(dates)}
                  onOpenChange={(status) => this.onOpen(status)}
                />
              </div> */}
                            <p>Current Block: {this.state.currentBlock}</p>
                            {this.state.startBlock ? <p>Estimated start block: {this.state.startBlock}</p> : null}
                            {this.state.startBlock && this.state.numberOfBlocks ? <p>Estimated end block: {this.state.startBlock + this.state.numberOfBlocks}</p> : null}
                        </Form.Item>
                    </Form>

                    {/* <h2>Questions</h2> */}
                    {
                        questions.map((_, idx) => this.renderQuestionForm(idx))
                    }

                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
                        <Button
                            type="default"
                            icon={<PlusOutlined />}
                            onClick={() => this.addQuestion()}>
                            Add a question</Button>
                    </div>

                    <Divider />

                    <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                        {this.state.processCreating ?
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                            <Button type="primary" size={'large'} onClick={() => this.submit()}>
                                <RocketOutlined /> Create process</Button>
                        }
                    </div>
                </Col>
                <Col xs={0} md={10} className="right-col">
                    <Divider orientation="left">Header</Divider>
                    {this.state.process.details.headerImage ?
                        <img className="preview" src={this.state.process.details.headerImage} /> : null
                    }
                </Col>
            </Row>
        </div>
    }

    renderQuestionForm(questionIdx) {

        let question = this.state.process.details.questions

        return <div key={'question' + questionIdx} style={{ paddingTop: 24 }}>
            <Divider orientation="left">Question {questionIdx + 1}</Divider>

            <Form>
                <Form.Item>
                    <label>Question title</label>
                    <div style={{ paddingTop: 8, display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
                        <Input
                            addonBefore={(questionIdx + 1).toString()}
                            // placeholder="Question"
                            size="large"
                            value={this.state.process.details.questions[questionIdx].question.default}
                            onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'question', 'default'], ev.target.value)}
                        />

                        <Button
                            type="default"
                            icon={<MinusOutlined />}
                            size={'large'}
                            disabled={this.state.process.details.questions.length <= 1}
                            onClick={() => this.removeQuestion(questionIdx)}>
                        </Button>
                    </div>
                </Form.Item>

                <Form.Item>
                    <label>Description</label>
                    <Input.TextArea
                        placeholder="Description"
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        value={this.state.process.details.questions[questionIdx].description.default}
                        onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'description', 'default'], ev.target.value)}
                    />
                </Form.Item>

                <div>
                    {
                        question[questionIdx].voteOptions.map((option, optionIdx) => this.renderOptionForm(questionIdx, optionIdx))
                    }
                </div>


                {/* <div style={{float: "right", paddingTop: 8, paddingBottom: 24}}> */}
                <div style={{ paddingTop: 8, display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
                    <Button
                        type="default"
                        icon={<PlusOutlined />}
                        onClick={() => this.addOption(questionIdx)}>
                        Add Option</Button>
                </div>
            </Form>
        </div>
    }

    renderOptionForm(questionIdx: number, optionIdx: number) {
        return <Form.Item key={optionIdx}>
            <label>Option {(optionIdx + 1).toString()}</label>
            <div style={{ paddingTop: 8, display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
                <Input
                    style={{ width: "100%" }}
                    // placeholder="Option"
                    // addonBefore={(optionIdx + 1).toString()}
                    value={this.state.process.details.questions[questionIdx].voteOptions[optionIdx].title.default}
                    onChange={ev => this.setNewProcessField(['details', 'questions', questionIdx, 'voteOptions', optionIdx, 'title', 'default'], ev.target.value)}
                />

                <Button
                    type="default"
                    icon={<MinusOutlined />}
                    style={{ marginLeft: 8 }}
                    disabled={this.state.process.details.questions[questionIdx].voteOptions.length <= 2}
                    onClick={() => this.removeOption(questionIdx, optionIdx)}>
                </Button>
            </div>
        </Form.Item>
    }

    renderLoading() {
        return <div>Loading the details of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    renderSideMenu() {
        const { readOnly, address } = getNetworkState()
        let hideEditControls = readOnly || !address
        if (!hideEditControls) {
            const ownEntityId = getEntityId(address)
            hideEditControls = this.state.entityId != ownEntityId
        }

        if (hideEditControls) {
            return null
        }

        return <div id="page-menu">
            <Menu mode="inline" defaultSelectedKeys={['process-new']} style={{ width: 200 }}>
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
                    <Link href={"/processes/active/#/" + this.state.entityId}>
                        <a>Active votes</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="processes-ended">
                    <Link href={"/processes/ended/#/" + this.state.entityId}>
                        <a>Ended votes</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="process-new">
                    <Link href={"/processes/new/"}>
                        <a>Create vote</a>
                    </Link>
                </Menu.Item>
            </Menu>
        </div>
    }

    render() {
        return <div id="process-new">
            {this.renderSideMenu()}
            {
                this.state.dataLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    (this.state.entity && this.state.process) ?
                        <div id="page-body">
                            {this.renderProcessNew()}
                        </div>
                        : null
            }
        </div >
    }
}


// // Custom layout
// ProcessNewPage.Layout = props => <MainLayout>

//   <div>
//     {props.children}
//   </div>
// </MainLayout>

export default ProcessNewPage
