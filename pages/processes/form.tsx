import { useContext, Component } from 'react'
import { message, Spin, Button, Input, Form, Divider, Row, Col, DatePicker, Radio, Modal, Select } from 'antd'
import { LoadingOutlined, RocketOutlined, PlusOutlined, MinusOutlined, ExclamationCircleOutlined, InboxOutlined, ConsoleSqlOutlined } from '@ant-design/icons'
import { API, EntityMetadata, GatewayBootNodes, ProcessMetadata } from 'dvote-js'
import moment from 'moment'
import Router from 'next/router'
import { getEntityId } from 'dvote-js/dist/api/entity'
import { ProcessMetadataTemplate } from 'dvote-js/dist/models/voting-process'
import { createVotingProcess, estimateBlockAtDateTime } from 'dvote-js/dist/api/vote'
import { GatewayPool } from 'dvote-js/dist/net/gateway-pool'
// import { by639_1 } from 'iso-language-codes'
// import { Wallet, Signer } from 'ethers'
// import { checkValidProcessMetadata } from 'dvote-js/dist/models/voting-process'

import AppContext, { IAppContext } from '../../components/app-context'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { getRandomUnsplashImage, extractDigestedPubKeyFromFormData, importedRowToString } from '../../lib/util'
import { VotingFormImportData } from '../../lib/types'
import { main } from '../../i18n'
import HTMLEditor from '../../components/html-editor'
import Dragger from 'antd/lib/upload/Dragger'
import { RcFile } from 'antd/lib/upload'
import { getSpreadsheetReaderForFile, getJSONFromWorksheet } from '../../lib/import-utils'
import DisabledLayer from '../../components/disabled-layer'
import { addClaimBulk, publishCensus, addCensus } from 'dvote-js/dist/api/census'
import { Wallet } from 'ethers'

const { Entity } = API
const { RangePicker } = DatePicker

// const ORACLE_CONFIRMATION_DELAY = parseInt(process.env.ORACLE_CONFIRMATION_DELAY || "180", 10)
// const BLOCK_MARGIN = 5 // extra blocks

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

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
    selectedCensusId: string,
    bootnodes?: GatewayBootNodes,
    descriptionEditorState?: any,
    startBlock: number
    startDate: moment.Moment
    numberOfBlocks: number,
    endDate: moment.Moment,
    censusData: VotingFormImportData,
    file?: RcFile,
}

// Stateful component
class ProcessNew extends Component<IAppContext, State> {
    state: State = {
        process: JSON.parse(JSON.stringify(ProcessMetadataTemplate)) as ProcessMetadata,
        startBlock: null,
        numberOfBlocks: null,
        startDate: null,
        endDate: null,
        selectedCensusId: '',
        censusData: null,
    }

    refreshInterval = null

    constructor(props) {
        super(props)

        this.state.process.details.headerImage = getRandomUnsplashImage('1500x450')
        this.state.process.details.questions[0].voteOptions.push({
            title: {
                default: main.blankVoteOption,
            },
            value: 2,
        })
    }

    async componentDidMount() {
        this.props.setMenuSelected("new-form-vote")

        const { readOnly } = getNetworkState()
        // if readonly, show the view page
        if (readOnly) {
            return Router.replace("/")
        }

        this.props.setTitle("New form process")

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

            this.setState({ entity, entityId, dataLoading: false })
            this.props.setTitle(entity.name.default)
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
            voteOptions: [{
                title: { default: "Yes" },
                value: 0,
            }, {
                title: { default: "No" },
                value: 1,
            }, {
                title: { default: main.blankVoteOption },
                value: 2,
            }]
        })
        this.setState({ process: proc })
    }

    addOption(questionIdx) {
        const process = this.state.process
        const optionCount = process.details.questions[questionIdx].voteOptions.length
        process.details.questions[questionIdx].voteOptions.push({ title: { default: "" }, value: optionCount })
        this.setState({ process })
    }

    removeQuestion(questionIdx) {
        const process = this.state.process;
        process.details.questions.splice(questionIdx, 1)
        this.setState({ process })
    }

    removeOption(questionIdx, optionIdx) {
        const process = this.state.process;
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
        const process = this.state.process
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
        let startBlock: number, endBlock: number

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

        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The process will be registered on the blockchain. Do you want to continue?",
            okText: "Create Process",
            okType: "primary",
            cancelText: "Not now",
            onOk: this.submit.bind(this),
        })
    }

    async createCensus(censusName: string, claims: string[], wallet: Wallet): Promise<{ censusId: string, merkleRoot: string, merkleTreeUri: string }> {

        const gateway = await getGatewayClients()
        const { censusId } = await addCensus(censusName, [wallet['signingKey'].publicKey], gateway, wallet)
        const { merkleRoot, invalidClaims } = await addClaimBulk(censusId, claims, true, gateway, wallet)
        if (invalidClaims.length) {
            message.warn(`Found ${invalidClaims.length} invalid claims`)
        }
        const merkleTreeUri = await publishCensus(censusId, gateway, wallet)

        return {
            censusId,
            merkleRoot,
            merkleTreeUri,
        }
    }

    async submit() {
        const gwPool = await getGatewayClients()

        const newProcess = this.state.process
        newProcess.startBlock = this.state.startBlock
        newProcess.numberOfBlocks = this.state.numberOfBlocks
        newProcess.details.entityId = this.state.entityId

        const hideLoading = message.loading('Action in progress..', 0)
        this.setState({ processCreating: true })

        const wallet = this.props.web3Wallet
        const address = wallet.getAddress()
        const balance = await wallet.getProvider().getBalance(address)
        const censusData = this.state.censusData

        if (balance.lte(0)) {
            return Modal.warning({
                title: "Not enough balance",
                icon: <ExclamationCircleOutlined />,
                content: <span>To continue with the transaction you need to get some xDAI tokens. <br />Get in touch with us and copy the following address: <code>{address}</code></span>,
                onOk: () => {
                    this.setState({ processCreating: false })
                    hideLoading()
                }
            })
        }

        const claims = this.state.censusData.digestedHexClaims
        if (claims.length == 0) {
            return Modal.warning({
                title: "No claims found",
                icon: <ExclamationCircleOutlined />,
                content: <span>To continue with the transaction you need import a valid CSV.</span>,
                onOk: () => {
                    this.setState({ processCreating: false })
                    hideLoading()
                }
            })
        }

        const censusName = newProcess.details.title.default + "_"+ (Math.floor(Date.now() / 1000)) || "form_" + (Math.floor(Date.now() / 1000))
        const { merkleRoot, merkleTreeUri } = await this.createCensus(censusName, claims, wallet.getWallet())

        newProcess.census.merkleRoot = (merkleRoot.startsWith("0x")) ? merkleRoot : `0x${merkleRoot}`
        newProcess.census.merkleTree = merkleTreeUri
        newProcess.details["formURI"] = Buffer.from(censusData.title).toString( "base64")

        try {
            const wallet = this.props.web3Wallet.getWallet()
            const processId = await createVotingProcess(newProcess, wallet, gwPool)

            message.success(
                `The voting process with ID ${processId.substr(0, 8)} has been created.`
            )

            hideLoading()

            return Router.push(`/processes/#/${this.state.entityId}/${processId}`)
        } catch (error) {
            hideLoading()
            this.setState({ processCreating: false })

            console.error("The voting process could not be created", error)
            message.error("The voting process could not be created")
        }
    }

    beforeUpload(file: RcFile) {
        this.setState({ file }, this.processImport)

        return false
    }

    async processImport(file?) {
        const raw = (file) ? file : this.state.file
        let censusData: VotingFormImportData = null

        censusData = await this.parseDataFromExcel(raw)

        if (!censusData) {
            this.setState({
                file: null,
            })

            return message.error("Unknown file format uploaded")
        }

        this.setState({ censusData })
    }
    async parseDataFromExcel(file: RcFile): Promise<VotingFormImportData> {
        try {
            const workbook = await getSpreadsheetReaderForFile(file)

            const firstSheetName = workbook.SheetNames[0]
            if (!firstSheetName) throw new Error("The document does not contain a worksheet")
            const worksheet = workbook.Sheets[firstSheetName]
            if (!worksheet) throw new Error("The document does not contain a worksheet")
            const rangeMatches = worksheet["!ref"].match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/)
            if (!rangeMatches) throw new Error("Invalid document range")

            let parsed = getJSONFromWorksheet(worksheet)
            const title = parsed.shift()
            if (!this.state.entityId || this.state.entityId.length == 0) {
                throw new Error("entity info not available")
            }
            const result: VotingFormImportData = {
                title: title.reduce((i, j) => i + "," + j),
                digestedHexClaims: []
            }

            // Remove empty rows
            parsed = parsed.filter(row => row.length > 0)

            // Throw if mismatch in number of columns between title and any row
            parsed.every(row => { if (row.length != title.length) throw new Error("found incompatible rows size") })
            result.digestedHexClaims = parsed.map(row => {
                const { digestedHexClaim } = extractDigestedPubKeyFromFormData(importedRowToString(row, this.state.entityId))
                return digestedHexClaim
            })
            console.log(result)
            return result
        } catch (err) {
            throw new Error("The Excel file can't be processed")
        }
    }

    onRemoveUpload(file) {
        this.setState({
            censusData: null,
            file: null,
        })
    }

    renderProcessNew() {
        const questions = this.state.process.details.questions

        let files = []
        if (this.state.file) {
            files = [this.state.file]
        }

        return <div className="body-card">
            <Row justify="start"></Row>
            <Col xs={24} sm={20} md={14}>
                <Row>
                    <section>
                        <Divider orientation="left">Upload CSV</Divider>
                        <p>In this section you can add new members to your organization's database. Once you upload the CSV file with the attributes of each user, an individual validation link will be generated which you will have to send to each user so that they can register in the entity. </p>
                        {/* <p>You can add new members by creating a new CSV or updating the existing one (The system will skip the existing members and only add the new ones).</p> */}
                        <br /><br />
                        <div className='dragger-fix' />
                        <Dragger
                            beforeUpload={(file) => this.beforeUpload(file)}
                            onRemove={(file) => this.onRemoveUpload(file)}
                            multiple={false}
                            fileList={files}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                            <p className="ant-upload-hint">You can upload most spreadsheet formats (csv, xls, xlsx, ods...)</p>
                        </Dragger>
                    </section>
                </Row>
            </Col>

            <DisabledLayer disabled={!(this.state.censusData)} text="Select a file to upload first">
                <Divider orientation="left">New vote</Divider>
                <Row justify="center"></Row>
                <Col xs={24} sm={20} md={14}>
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
                            <HTMLEditor
                                toolbar='reduced'
                                onContentChanged={(contents: string) =>
                                    this.setNewProcessField(['details', 'description', 'default'], contents)
                                }
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
                                <a href="https://unsplash.com/" target="_blank" rel="noreferrer">If you don't have images, try to find one at unsplash.com</a>
                            </small>
                        </Form.Item>
                        <Form.Item>
                            <label>Stream URL</label>
                            <Input
                                placeholder="https://www.youtube.com/watch?v=BO8lX3hDU30"
                                value={this.state.process.details.streamUrl}
                                onChange={ev => this.setNewProcessField(['details', 'streamUrl'], ev.target.value)}
                            />
                        </Form.Item>
                        <Form.Item>
                            <label>Vote Count Type</label>
                            <br />
                            <Radio.Group buttonStyle="solid" value={this.state.process.type} onChange={e => this.setNewProcessField(["type"], e.target.value)}>
                                <Radio.Button value="poll-vote">Real Time</Radio.Button>
                                <Radio.Button value="encrypted-poll">Secret Until the End</Radio.Button>
                            </Radio.Group>
                            {
                                // this.state.process.type === "poll-vote" ?
                                //     <p><small>On a standard poll, all votes become public as soon as they are registered. <br />Participants are not anonymous.</small></p> :
                                //     <p><small>On an encrypted poll, votes remain encrypted until the process has ended. <br />Participants are not anonymous.</small></p>
                            }
                        </Form.Item>
                    </Form>

                    <br />

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
                        <p>In this version, the time displayed for the start and end of voting processes is only indicative and may vary as it is based on blockchain blocks. We're working to achieve more reliable times.</p>
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
            </DisabledLayer>
        </div >
    }

    renderQuestionForm(questionIdx) {

        const question = this.state.process.details.questions

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
                    <HTMLEditor
                        toolbar='simple'
                        onContentChanged={(contents: string) =>
                            this.setNewProcessField(['details', 'questions', questionIdx, 'description', 'default'], contents)
                        }
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
