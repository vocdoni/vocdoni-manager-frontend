import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Form, Divider, Menu, Row, Col, DatePicker, Radio, Modal } from 'antd'
import { LoadingOutlined, RocketOutlined, PlusOutlined, MinusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes, MultiLanguage, ProcessMetadata } from "dvote-js"
// import { by639_1 } from 'iso-language-codes'
import moment from 'moment'
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
// import { Wallet, Signer } from 'ethers'
import { getEntityId } from 'dvote-js/dist/api/entity'
// import { checkValidProcessMetadata } from 'dvote-js/dist/models/voting-process'
import { ProcessMetadataTemplate } from 'dvote-js/dist/models/voting-process'
import { createVotingProcess, estimateBlockAtDateTime } from 'dvote-js/dist/api/vote'
import { GatewayPool } from 'dvote-js/dist/net/gateway-pool'
const { RangePicker } = DatePicker

const ORACLE_CONFIRMATION_DELAY = parseInt(process.env.ORACLE_CONFIRMATION_DELAY || "180")
const BLOCK_MARGIN = 5 // extra blocks

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
    startBlock: number
    startDate: moment.Moment
    numberOfBlocks: number,
    endDate: moment.Moment
}

// Stateful component
class ProcessNew extends Component<IAppContext, State> {
    state: State = {
        process: JSON.parse(JSON.stringify(ProcessMetadataTemplate)) as ProcessMetadata,
        startBlock: null,
        numberOfBlocks: null,
        startDate: null,
        endDate: null
    }

    refreshInterval = null

    async componentDidMount() {
        this.props.setMenuSelected("new-vote")

        const { readOnly } = getNetworkState()
        // if readonly, show the view page
        if (readOnly) {
            return Router.replace("/")
        }

        this.props.setTitle("New process")

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
            await this.refreshMetadata()

            const defaultRange = [moment().add(30, 'minutes'), moment().add(3, 'days').add(30, 'minutes')]
            this.updateDateRange(defaultRange[0], defaultRange[1])
        }
        catch (err) {
            message.error("Could not check the entity metadata")
        }
    }

    async refreshMetadata() {
        try {
            const entityId = getEntityId(this.props.web3Wallet.getAddress())

            this.setState({ dataLoading: true, entityId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
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
            this.props.setEntityId(entityId)
        }
        catch (err) {
            this.setState({ dataLoading: false })
            throw err
        }
    }

    addQuestion() {
        const proc = this.state.process
        proc.details.questions.push({
            type: "single-choice",
            question: { default: "" },
            description: { default: "" },
            voteOptions: [{ title: { default: "" }, value: 0 }, { title: { default: "" }, value: 1 }]
        })
        this.setState({ process: proc })
    }

    addOption(questionIdx) {
        let process = this.state.process
        let optionCount = process.details.questions[questionIdx].voteOptions.length
        process.details.questions[questionIdx].voteOptions.push({ title: { default: "" }, value: optionCount })
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

    isDisabledDate(queryDate: moment.Moment) {
        const threshold = moment().add(8, 'minutes')

        return !queryDate || queryDate.isBefore(threshold, 'day')
    }

    getDisabledTimes(queryDate: moment.Moment) {
        const threshold = moment().add(8, 'minutes')

        if (!queryDate) return
        else if (!moment(queryDate).isSame(threshold, 'day')) return
        else if (moment(queryDate).isAfter(threshold, "hours")) return
        else if (moment(queryDate).isBefore(threshold, "hours")) {
            return {
                disabledHours: () => range(0, threshold.hours()),
                disabledMinutes: () => range(0, 60)
            }
        }
        // Same hour
        return {
            disabledHours: () => range(0, threshold.hours()),
            disabledMinutes: () => range(0, threshold.minutes()),
        }
    }

    updateDateRange(startDate: moment.Moment, endDate: moment.Moment) {
        let gwPool: GatewayPool
        var startBlock: number, endBlock: number

        return getGatewayClients().then(pool => {
            gwPool = pool

            return estimateBlockAtDateTime(startDate.toDate(), gwPool)
        }).then(block => {
            startBlock = block

            return estimateBlockAtDateTime(endDate.toDate(), gwPool)
        }).then(block => {
            endBlock = block
            const numberOfBlocks = endBlock - startBlock

            this.setState({ startDate, startBlock, endDate, numberOfBlocks })
        })
    }

    async validateFields(): Promise<boolean> {
        if (isNaN(this.state.startBlock) || isNaN(this.state.numberOfBlocks)) {
            message.error("The dates are not valid")
            return false
        }

        const threshold = moment().add(8, 'minutes')

        if (this.state.numberOfBlocks <= 0) {
            message.error("The start date needs to be before the end one")
            return false
        }
        if (this.state.startDate.isSameOrBefore(threshold, 'minute')) {
            message.error("The start date needs to be at least a few minutes in the future")
            return false
        }
        if (this.state.endDate.isSameOrBefore(this.state.startDate, 'minute')) {
            message.error("The end date needs to be after the start date")
            return false
        }

        return true
    }

    async confirmSubmit() {
        if (!(await this.validateFields())) {
            return // message.warn("The metadata fields are not valid")
        }

        var that = this
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The process will be registered on the blockchain. Do you want to continue?",
            okText: "Create Process",
            okType: "primary",
            cancelText: "Not now",
            onOk() {
                that.submit()
            },
        })
    }

    async submit() {
        const gwPool = await getGatewayClients()

        let newProcess = this.state.process
        newProcess.startBlock = this.state.startBlock
        newProcess.numberOfBlocks = this.state.numberOfBlocks
        newProcess.details.entityId = this.state.entityId

        const hideLoading = message.loading('Action in progress..', 0)
        this.setState({ processCreating: true })

        return createVotingProcess(newProcess, this.props.web3Wallet.getWallet(), gwPool)
            .then(processId => {
                message.success("The voting process with ID " + processId.substr(0, 8) + " has been created")
                hideLoading()
                this.setState({ processCreating: false })

                Router.push("/processes#/" + this.state.entityId + "/" + processId)
            }).catch(err => {
                hideLoading()
                this.setState({ processCreating: false })

                console.error("The voting process could not be created", err)
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
                                <Radio.Button value="encrypted-poll">Encrypted Poll</Radio.Button>
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

                    <br />
                    <Divider orientation="left">Time frame</Divider>

                    <p>Select the date range to allow incoming votes</p>
                    <Form>
                        <Form.Item>
                            <div>
                                <RangePicker
                                    // open
                                    format='YYYY/MM/DD HH:mm'
                                    placeholder={["Vote start", "Vote end"]}
                                    disabledDate={(current) => this.isDisabledDate(current)}
                                    disabledTime={(current) => this.getDisabledTimes(current)}
                                    defaultValue={[moment().add(30, 'minutes'), moment().add(3, 'days').add(30, 'minutes')]}
                                    onChange={(dates: moment.Moment[], _) => {
                                        if (!dates || !dates.length) return
                                        this.updateDateRange(dates[0], dates[1])
                                    }}
                                    showTime />
                            </div>
                            {/*<div>
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
                            {/* {this.state.startBlock ? <p>Estimated start block: {this.state.startBlock}</p> : null} */}
                            {/* {this.state.startBlock && this.state.numberOfBlocks ? <p>Estimated end block: {this.state.startBlock + this.state.numberOfBlocks}</p> : null} */}
                        </Form.Item>
                    </Form>

                    <Divider />

                    <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                        {this.state.processCreating ?
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                            <Button type="primary" size={'large'} onClick={() => this.confirmSubmit()}>
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

    render() {
        return <div id="process-new">
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

function range(start: number, end: number) {
    const result: number[] = []
    for (let i = start; i < end; i++) {
        result.push(i)
    }
    return result
}


// // Custom layout
// ProcessNewPage.Layout = props => <MainLayout>

//   <div>
//     {props.children}
//   </div>
// </MainLayout>

export default ProcessNewPage
