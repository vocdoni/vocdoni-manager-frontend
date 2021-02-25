import { LoadingOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, message, Modal, Switch } from 'antd'
import { str } from 'dot-object'
import {
    CensusOffChainApi,
    EntityMetadata,
    IProcessCreateParams,
    ProcessCensusOrigin,
    ProcessEnvelopeType,
    ProcessMode,
    ProcessMetadata,
    ProcessMetadataTemplate,
    VotingApi,
} from 'dvote-js'
import moment from 'moment'
import Router from 'next/router'
import React, { Component, ReactNode } from 'react'

import AppContext from '../../components/app-context'
import HTMLEditor from '../../components/html-editor'
import If from '../../components/if'
import ImageAndUploader from '../../components/image-and-uploader'
import { ICensus, VotingFormImportData } from '../../lib/types'
import { getRandomUnsplashImage, range } from '../../lib/util'
import { MessageType } from 'antd/lib/message'
import ParticipantsSelector, { Census } from '../../components/processes/ParticipantsSelector'
import QuestionsForm, { LegacyQuestions } from '../../components/processes/QuestionsForm'
import i18n from '../../i18n'
import Ficon from '../../components/ficon'


export type ProcessNewState = {
    loading?: boolean,
    valid: boolean,
    creating?: boolean,
    confirmModalVisible: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    process?: Omit<Omit<IProcessCreateParams, 'metadata'>, 'questionCount'> & { metadata: ProcessMetadata },
    censuses: ICensus[],
    censusData: VotingFormImportData | Census,
    selectedCensus: string,
    startBlock: number
    startDate: moment.Moment
    blockCount: number,
    endDate: moment.Moment,
    targets: any[],
    streamingInputVisible: boolean,
    qnaInputVisible: boolean,
    webVoting: boolean,
    steps: {
        balance: boolean,
        census: boolean,
        create: boolean,
        emails: boolean,
    },
}

type CensusInfo = {
    merkleRoot: string,
    merkleTreeUri: string,
    id: string,
    formUri?: string,
}

const stepDescriptions = {
    balance: 'Check balance',
    census: 'Create census',
    create: 'Create process',
    emails: 'Send emails'
}

class ProcessNew extends Component<undefined, ProcessNewState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: ProcessNewState = {
        process: {
            mode: ProcessMode.make({
                autoStart: true,
                interruptible: true,
            }),
            envelopeType: ProcessEnvelopeType.ENCRYPTED_VOTES,
            censusOrigin: ProcessCensusOrigin.OFF_CHAIN_TREE,
            censusRoot: '',
            censusUri: '',
            metadata: JSON.parse(JSON.stringify(ProcessMetadataTemplate)) as ProcessMetadata,
            startBlock: 0,
            blockCount: 10000,
            maxCount: 0, // auto-filled later
            maxValue: 0, // auto-filled later
            maxTotalCost: 0,
            // Defines the exponent that will be used to compute the "cost" of the options
            // voted and compare it against `maxTotalCost`.
            // totalCost = Σ (value[i] ** costExponent) <= maxTotalCost
            costExponent: 1, // forced for now
            // How many times a vote can be replaced (only the last one counts)
            maxVoteOverwrites: 0,
            namespace: 0, // TODO: should be taken from processes contract
            paramsSignature: '0x1111111111111111111111111111111111111111111111111111111111111111',
        },
        creating: false,
        confirmModalVisible: false,
        valid: false,
        loading: true,
        startBlock: null,
        blockCount: null,
        startDate: null,
        endDate: null,
        censuses: [],
        targets: [],
        selectedCensus: '',
        censusData: {
            digestedHexClaims: [],
            title: '',
        },
        streamingInputVisible: false,
        qnaInputVisible: false,
        webVoting: false,
        steps: {
            balance: false,
            census: true,
            create: false,
            emails: false,
        },
    }


    constructor(props: undefined) {
        super(props)

        this.state.process.metadata.media.header = getRandomUnsplashImage('1500x450')
    }

    async componentDidMount() : Promise<void> {
        this.context.setMenuSelected('new-vote')
        if (this.context.isReadOnlyNetwork) {
            Router.replace('/')
            return
        }
        this.context.setTitle(i18n.t('newProcess'))

        try {
            const [entityId] = this.context.params
            await this.context.refreshEntityMetadata(entityId)

            const beginDate = moment().add(30, 'minutes')
            const endDate = moment().add(3, 'days').add(30, 'minutes')
            this.updateDateRange(beginDate, endDate)

            const { censuses } = await this.context.fetchCensuses()
            const { targets } = await this.context.fetchTargets()
            this.setState({
                targets: targets || [],
                censuses: censuses || [],
                loading: false,
                valid: true,
            })
        }
        catch (err) {
            console.error(err)
            message.error('Could not check the entity metadata')
            this.setState({ loading: false })
        }
    }

    modal() : ReactNode {
        const { creating } = this.state
        let content = <span dangerouslySetInnerHTML={{__html: i18n.t('processCreationAdvice')}} />
        if (creating) {
            content = (
                <ul className='process-steps'>
                    {
                        Object.keys(stepDescriptions).map((step) => (
                            <li key={step}>
                                <If condition={this.state.steps[step]}>
                                    <Ficon icon='Check' color='green' />
                                </If>
                                <If condition={!this.state.steps[step]}>
                                    <LoadingOutlined spin />
                                </If> {stepDescriptions[step]}
                            </li>
                        ))
                    }
                </ul>
            )
        }

        return (
            <Modal
                title={creating ? i18n.t('processCreating') : i18n.t('confirm')}
                closable={false}
                visible={this.state.confirmModalVisible}
                okText={i18n.t('processCreationConfirmButton')}
                onOk={this.submit.bind(this)}
                onCancel={() => this.setState({confirmModalVisible: false})}
                okButtonProps={{
                    disabled: creating,
                }}
                cancelButtonProps={{
                    disabled: creating,
                }}
                confirmLoading={creating}
            >
                {content}
            </Modal>
        )
    }

    async hasBalance(loading: MessageType) : Promise<boolean> {
        const address = this.context.web3Wallet.getAddress()
        const balance = await this.context.web3Wallet.getProvider().getBalance(address)

        if (balance.isZero()) {
            Modal.warning({
                title: 'Not enough balance',
                icon: <Ficon icon='AlertCircle' />,
                content: <span>To continue with the transaction you need to get some xDAI tokens. <br />Get in touch with us and copy the following address: <code>{address}</code></span>,
                onOk: () => {
                    this.setState({ creating: false })
                    loading()
                }
            })
            return false
        }

        return true
    }

    /**
     * Marks a step as done during the process creation.
     *
     * @param step The step object key
     */
    stepDone(step: 'balance' | 'census' | 'create' | 'emails') : void {
        this.setState({
            steps: {
                ...this.state.steps,
                [step]: true,
            }
        })
    }

    /**
     * Checks possible errors in the form and returns them as an array of
     * strings, or true in case there are no errors.
     */
    formErrors(): string[] | boolean {
        const { process } = this.state
        const errors = []

        if (!process.metadata.title.default.length) {
            errors.push('The process must have a title')
        }

        if (isNaN(this.state.startBlock) || isNaN(this.state.blockCount)) {
            errors.push('The dates are not valid')
        }

        const threshold = moment().add(8, 'minutes')
        if (this.state.blockCount <= 0) {
            errors.push('The start date needs to be before the end one')
        }
        if (this.state.startDate.isSameOrBefore(threshold, 'minute')) {
            errors.push('The start date needs to be at least a few minutes in the future')
        }
        if (this.state.endDate.isSameOrBefore(this.state.startDate, 'minute')) {
            errors.push('The end date needs to be after the start date')
        }

        if (errors.length) {
            return errors
        }

        return true
    }

    /**
     * Validates data and shows a confirm dialog before actually submitting it
     */
    confirm() : void {
        const validations = this.formErrors()
        if (validations !== true) {
            for (const validation of validations as string[]) {
                message.error(validation)
            }
            return
        }

        this.setState({confirmModalVisible: true})
    }

    /**
     * Determines the disabled hours & minutes for the specified date.
     *
     * @param queryDate The date to be queried
     */
    getDisabledTimes(queryDate: moment.Moment) : {
        disabledHours: () => number[],
        disabledMinutes: () => number[]
    } {
        const threshold = moment().add(8, 'minutes')

        if (!queryDate) return
        else if (!moment(queryDate).isSame(threshold, 'day')) return
        else if (moment(queryDate).isAfter(threshold, 'hours')) return
        else if (moment(queryDate).isBefore(threshold, 'hours')) {
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

    /**
     * Returns the proper census information based on the user
     * selection (either from 'file', 'all' or a specific census id)
     */
    async getProperCensus(ephemeral: boolean) : Promise<CensusInfo> {
        const wallet = this.context.web3Wallet.getWallet()
        const gateway = await this.context.gatewayClients

        switch (this.state.selectedCensus) {
            // Generates an ephemeral census from the loaded file
            case 'file': {
                const data = this.state.censusData as VotingFormImportData
                const censusName = (this.state.process.metadata.title.default || (new Date()).toDateString()) + '_' + Math.floor(Date.now() / 1000)
                const claims = data.digestedHexClaims.map((claim) => ({key: claim, value: ''}))
                const { censusId } = await CensusOffChainApi.addCensus(censusName, [wallet._signingKey().publicKey], wallet, gateway)
                const { censusRoot, invalidClaims } = await CensusOffChainApi.addClaimBulk(censusId, claims, true, wallet, gateway)
                if (invalidClaims.length) {
                    message.warn(`Found ${invalidClaims.length} invalid claims`)
                }
                const merkleTreeUri = await CensusOffChainApi.publishCensus(censusId, wallet, gateway)

                return {
                    merkleRoot: censusRoot,
                    merkleTreeUri,
                    id: censusId,
                    formUri: Buffer.from(data.title).toString('base64'),
                }
            }

            // Create a new one based on the "all" target
            case 'all': {
                const [target] = this.state.targets
                const {
                    census,
                    merkleTreeUri,
                    merkleRoot,
                } = await this.context.createCensusForTarget(null, target, ephemeral)

                return {
                    merkleRoot,
                    merkleTreeUri,
                    id: census,
                }
            }

            // Takes manually imported census uri root and uri
            case 'manual': {
                const data = this.state.censusData as Census
                if (
                    !data.uri ||
                    !data.root ||
                    !data.uri?.length ||
                    !data.root?.length
                ) {
                    throw new Error('invalid census data')
                }

                return {
                    id: null,
                    merkleRoot: data.root,
                    merkleTreeUri: data.uri,
                }
            }

            // Retrieve from the id stored in selectedCensus
            default: {
                const {
                    merkleRoot,
                    merkleTreeUri,
                    id,
                } = this.state.censuses.find((x) => x.id === this.state.selectedCensus)

                return {
                    merkleRoot,
                    merkleTreeUri,
                    id,
                }
            }
        }

        throw new Error('Error grabbing proper census')
    }

    isDisabledDate(queryDate: moment.Moment) : boolean {
        const threshold = moment().add(8, 'minutes')

        return !queryDate || queryDate.isBefore(threshold, 'day')
    }

    async updateDateRange(startDate: moment.Moment, endDate: moment.Moment) : Promise<void> {
        const pool = await this.context.gatewayClients
        const startBlock = await VotingApi.estimateBlockAtDateTime(startDate.toDate(), pool)
        const endBlock = await VotingApi.estimateBlockAtDateTime(endDate.toDate(), pool)
        const blockCount = endBlock - startBlock

        this.setState({startDate, startBlock, endDate, blockCount})
    }

    onFieldChange(field: string, {target: {value}}: React.ChangeEvent<HTMLInputElement>) : void {
        this.setProcessField(field, value)
    }

    setProcessField(field: string, value: string) : void {
        const { metadata } = this.state.process
        str(field, value, metadata)
        this.setState({
            process: {
                ...this.state.process,
                metadata,
            }
        })
    }

    setQuestions(questions: LegacyQuestions) : void {
        this.setState({
            process: {
                ...this.state.process,
                metadata: {
                    ...this.state.process.metadata,
                    questions,
                },
            },
        })
    }

    toggleProcessBitFlagField(field: string, flag: number) : void {
        this.setState({
            process: {
                ...this.state.process,
                [field]: flag ^= this.state.process.envelopeType as number,
            }
        })
    }

    setProcessBitFlagField(field: string, flag: number) : void {
        this.setState({
            process: {
                ...this.state.process,
                [field]: flag,
            }
        })
    }

    async submit() : Promise<void> {
        const { process } = this.state
        const loading = message.loading('Action in progress...', 0)
        this.setState({ creating: true })

        if (!await this.hasBalance(loading)) {
            return
        }
        this.stepDone('balance')

        let census : CensusInfo = null
        try {
            census = await this.getProperCensus(this.state.webVoting)

            process.censusRoot = census.merkleRoot
            process.censusUri = census.merkleTreeUri
            process.startBlock = this.state.startBlock
            process.blockCount = this.state.blockCount
            if (census.formUri?.length) {
                process.metadata.meta.formUri = census.formUri
            }
        } catch (e) {
            message.error(typeof e === 'string' ? e : e.message)
            console.error(e)
            this.setState({creating: false})
            loading()

            return
        }
        this.stepDone('census')

        // Auto-fill maxValue and maxCount
        let maxValue = 0, maxCount = 0
        process.metadata.questions.forEach((question) => {
            if (maxValue < question.choices.length) {
                maxValue = question.choices.length
            }
            maxCount++
        })
        process.maxValue = maxValue
        process.maxCount = maxCount

        try {
            const wallet = this.context.web3Wallet.getWallet()
            const processId = await VotingApi.newProcess(process, wallet, await this.context.gatewayClients)
            this.stepDone('create')

            let msg = `The voting process with ID ${processId.substr(0, 8)} has been created.`
            if (this.state.webVoting && this.state.selectedCensus !== 'file' && census.id) {
                const emailsReq : any = {
                    method: 'sendVotingLinks',
                    processId,
                    censusId: census.id,
                }
                // Avoid crash from e-mail sending
                try {
                    await this.context.managerBackendGateway.sendRequest(emailsReq, wallet)
                } catch (e) {
                    msg += ' There was an error sending e-mails tho.'
                }
                this.stepDone('emails')
            }

            message.success(msg)

            loading()

            Router.push(`/processes/#/${this.context.address}/${processId}`)
        } catch (error) {
            loading()
            this.setState({ creating: false })

            console.error('The voting process could not be created', error)
            message.error('The voting process could not be created')
        }
    }

    render() : ReactNode {
        const { process, loading, creating, selectedCensus, valid } = this.state

        // avoid rendering if it's in read only
        if (this.context.isReadOnly) {
            return null
        }

        return (
            <div className='content-wrapper stretched-form'>
                <header>
                    <div className='header-image'>
                        <ImageAndUploader
                            uploaderActive
                            src={process.metadata.media.header}
                            onConfirm={this.setProcessField.bind(this, 'media.header')}
                        />
                    </div>
                </header>
                <Form onFinish={this.confirm.bind(this)}>
                    <Form.Item>
                        <Input
                            size='large'
                            placeholder='Process title'
                            value={process.metadata.title.default}
                            onChange={this.onFieldChange.bind(this, 'title.default')}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='AlignLeft' /> Description</label>
                        </div>
                        <HTMLEditor
                            value={process.metadata.description.default}
                            onContentChanged={this.setProcessField.bind(this, 'description.default')}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='Calendar' /> Period</label>
                        </div>
                        <div>
                            <DatePicker.RangePicker
                                format='YYYY/MM/DD HH:mm'
                                placeholder={['Vote start', 'Vote end']}
                                disabledDate={(current) => this.isDisabledDate(current)}
                                disabledTime={(current) => this.getDisabledTimes(current)}
                                defaultValue={[moment().add(30, 'minutes'), moment().add(3, 'days').add(30, 'minutes')]}
                                onChange={(dates: moment.Moment[]) => {
                                    if (!dates || !dates.length) return
                                    this.updateDateRange(dates[0], dates[1])
                                }}
                                showTime
                            />
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='Activity' /> Real-time results</label>
                            <Switch
                                onChange={() =>
                                    this.toggleProcessBitFlagField('envelopeType', ProcessEnvelopeType.ENCRYPTED_VOTES)
                                }
                                checked={(ProcessEnvelopeType.ENCRYPTED_VOTES & process.envelopeType as number) === 0}
                            />
                        </div>
                        <div>
                            <small>Vote results can be seen before the process has ended.</small>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='Youtube' /> Live streaming</label>
                            <Switch
                                onChange={(streamingInputVisible: boolean) =>
                                    this.setState({streamingInputVisible})
                                }
                                checked={this.state.streamingInputVisible}
                            />
                        </div>
                        <div>
                            <small>Not available within the app.</small>
                            <If condition={this.state.streamingInputVisible}>
                                <Input
                                    placeholder='https://youtu.be/dQw4w9WgXcQ'
                                    onChange={this.onFieldChange.bind(this, 'media.streamUri')}
                                />
                            </If>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <ParticipantsSelector
                            loading={loading}
                            options={this.state.censuses.map(({id, name}) => ({label: name, value: id}))}
                            onChange={(selectedCensus: string, censusData: VotingFormImportData | Census) => {
                                this.setState({
                                    selectedCensus,
                                    censusData,
                                })
                                if (selectedCensus === 'file') {
                                    this.setState({
                                        webVoting: true,
                                    })
                                }
                                // For now it's forced to OFF_CHAIN_TREE by default,
                                // unless manually selected and uri being an actual url
                                if (selectedCensus === 'manual' && /^https?:\/\//.test((censusData as Census)?.uri)) {
                                    this.setProcessBitFlagField('censusOrigin', ProcessCensusOrigin.OFF_CHAIN_CA)
                                    return
                                }

                                this.setProcessBitFlagField('censusOrigin', ProcessCensusOrigin.OFF_CHAIN_TREE)
                            }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='MessageSquare' /> Questions and answers button</label>
                            <Switch
                                onChange={(qnaInputVisible: boolean) =>
                                    this.setState({qnaInputVisible})
                                }
                                checked={this.state.qnaInputVisible}
                            />
                        </div>
                        <div>
                            <small>Will show a QnA button linking to where you want.</small>
                            <If condition={this.state.qnaInputVisible}>
                                <Input
                                    placeholder='https://...'
                                    onChange={this.onFieldChange.bind(this, 'meta.requestsUrl')}
                                />
                            </If>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='HelpCircle' /> Questions</label>
                        </div>
                        <QuestionsForm
                            onChange={this.setQuestions.bind(this)}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='MousePointer' /> Voting channels</label>
                        </div>
                        <div>
                            <small>
                                Voting using the Vocdoni App is the only method
                                that currently guarantees full anonimity and
                                maximum security.<br />
                            </small>
                            <small>
                                Web voting is offered as an additional alternative when:
                                <ul>
                                    <li>
                                        Live streaming is enabled
                                    </li>
                                    <li>
                                        Access to non-registered users must be guaranteed
                                    </li>
                                    <li>
                                        Attribute authentication is selected to define participants.
                                    </li>
                                </ul>
                            </small>
                        </div>
                        <div className='label-wrapper no-icon'>
                            <label>Web voting</label>
                            <Switch
                                checked={this.state.webVoting}
                                disabled={selectedCensus === 'file'}
                                onChange={(webVoting) => this.setState({webVoting})}
                            />
                        </div>
                        <div><small>
                            Allows non-registered members to vote on a web page
                            via a voting link that will be sent via e-mail.
                            Registered members must vote using Vocdoni App anyway.
                        </small></div>
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Ficon icon='ArrowRightCircle' /> Publishing</label>
                        </div>
                        <Button
                            disabled={loading || creating || !valid}
                            type='primary'
                            size='large'
                            htmlType='submit'
                        >
                            Publish final process
                        </Button>
                    </Form.Item>
                </Form>
                {this.modal()}
            </div>
        )
    }
}

export default ProcessNew
