import { Button, DatePicker, Form, Input, message, Modal, Switch } from 'antd'
import { str } from 'dot-object'
import { EntityMetadata, ProcessMetadata } from 'dvote-js'
import { createVotingProcess, estimateBlockAtDateTime } from 'dvote-js/dist/api/vote'
import { ProcessMetadataTemplate } from 'dvote-js/dist/models/voting-process'
import moment from 'moment'
import Router from 'next/router'
import React, { Component, ReactNode } from 'react'
import {
    Activity,
    AlertCircle,
    AlignLeft,
    ArrowRightCircle,
    Calendar,
    HelpCircle,
    MessageSquare,
    MousePointer,
    Youtube,
} from 'react-feather'

import AppContext from '../../components/app-context'
import HTMLEditor from '../../components/html-editor'
import If from '../../components/if'
import ImageAndUploader from '../../components/image-and-uploader'
import { POLL_TYPE_ANONYMOUS, POLL_TYPE_NORMAL } from '../../lib/constants'
import { ICensus, VotingFormImportData } from '../../lib/types'
import { getRandomUnsplashImage, range } from '../../lib/util'
import { main } from '../../i18n'
import { MessageType } from 'antd/lib/message'
import { addCensus, addClaimBulk, publishCensus } from 'dvote-js/dist/api/census'
import ParticipantsSelector from '../../components/processes/ParticipantsSelector'
import QuestionsForm, { LegacyQuestions } from '../../components/processes/QuestionsForm'

export type ProcessNewState = {
    loading?: boolean,
    creating?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    process?: ProcessMetadata,
    censuses: ICensus[],
    censusFileData: VotingFormImportData,
    selectedCensus: string,
    startBlock: number
    startDate: moment.Moment
    numberOfBlocks: number,
    endDate: moment.Moment,
    targets: any[],
    streamingInputVisible: boolean,
    qnaInputVisible: boolean,
    webVoting: boolean,
}

type CensusInfo = {
    merkleRoot: string,
    merkleTreeUri: string,
    id: string,
    formURI?: string,
}

class ProcessNew extends Component<undefined, ProcessNewState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: ProcessNewState = {
        process: JSON.parse(JSON.stringify(ProcessMetadataTemplate)) as ProcessMetadata,
        creating: false,
        loading: true,
        startBlock: null,
        numberOfBlocks: null,
        startDate: null,
        endDate: null,
        censuses: [],
        targets: [],
        selectedCensus: '',
        censusFileData: {
            digestedHexClaims: [],
            title: '',
        },
        streamingInputVisible: false,
        qnaInputVisible: false,
        webVoting: false,
    }


    constructor(props: undefined) {
        super(props)

        this.state.process.details.headerImage = getRandomUnsplashImage('1500x450')
        this.state.process.type = 'encrypted-poll'
    }

    async componentDidMount() : Promise<void> {
        this.context.setMenuSelected('new-vote')
        if (this.context.isReadOnlyNetwork) {
            Router.replace('/')
            return
        }
        this.context.setTitle(main.newProcess)

        try {
            await this.context.refreshEntityMetadata()

            const beginDate = moment().add(30, 'minutes')
            const endDate = moment().add(3, 'days').add(30, 'minutes')
            this.updateDateRange(beginDate, endDate)

            const { censuses } = await this.context.fetchCensuses()
            const { targets } = await this.context.fetchTargets()
            this.setState({
                targets: targets || [],
                censuses: censuses || [],
                loading: false,
            })
        }
        catch (err) {
            console.error(err)
            message.error('Could not check the entity metadata')
            this.setState({ loading: false })
        }
    }

    async hasBalance(loading: MessageType) : Promise<boolean> {
        const address = this.context.web3Wallet.getAddress()
        const balance = await this.context.web3Wallet.getProvider().getBalance(address)

        if (balance.lte(0)) {
            Modal.warning({
                title: 'Not enough balance',
                icon: <AlertCircle />,
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
     * Checks possible errors in the form and returns them as an array of
     * strings, or true in case there are no errors.
     */
    formErrors(): string[] | boolean {
        const { process } = this.state
        const errors = []

        if (!process.details.title.default.length) {
            errors.push('The process must have a title')
        }

        if (isNaN(this.state.startBlock) || isNaN(this.state.numberOfBlocks)) {
            errors.push('The dates are not valid')
        }

        const threshold = moment().add(8, 'minutes')
        if (this.state.numberOfBlocks <= 0) {
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
            for (const validation of validations) {
                message.error(validation)
            }
            return
        }

        Modal.confirm({
            title: main.confirm,
            icon: <AlertCircle />,
            content: <span dangerouslySetInnerHTML={{__html: main.processCreationAdvice}} />,
            okText: main.processCreationConfirmButton,
            okType: 'primary',
            cancelText: main.processCreationCancelButton,
            onOk: this.submit.bind(this),
        })
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
                const censusName = (this.state.process.details.title.default || (new Date()).toDateString()) + '_' + Math.floor(Date.now() / 1000)
                const claims = this.state.censusFileData.digestedHexClaims
                const { censusId } = await addCensus(censusName, [wallet['signingKey'].publicKey], gateway, wallet)
                const { merkleRoot, invalidClaims } = await addClaimBulk(censusId, claims, true, gateway, wallet)
                if (invalidClaims.length) {
                    message.warn(`Found ${invalidClaims.length} invalid claims`)
                }
                const merkleTreeUri = await publishCensus(censusId, gateway, wallet)

                return {
                    merkleRoot,
                    merkleTreeUri,
                    id: censusId,
                    formURI: Buffer.from(this.state.censusFileData.title).toString('base64'),
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
        const startBlock = await estimateBlockAtDateTime(startDate.toDate(), pool)
        const endBlock = await estimateBlockAtDateTime(endDate.toDate(), pool)
        const numberOfBlocks = endBlock - startBlock

        this.setState({startDate, startBlock, endDate, numberOfBlocks})
    }

    onFieldChange(field: string, {target: {value}}: React.ChangeEvent<HTMLInputElement>) : void {
        this.setProcessField(field, value)
    }

    setProcessField(field: string, value: string) : void {
        const { process } = this.state
        str(field, value, process)
        this.setState({process})
    }

    setQuestions(questions: LegacyQuestions) : void {
        this.setState({
            process: {
                ...this.state.process,
                details: {
                    ...this.state.process.details,
                    questions,
                }
            }
        })
    }

    async submit() : Promise<void> {
        const { process } = this.state
        const loading = message.loading('Action in progress...', 0)
        this.setState({ creating: true })

        let census : CensusInfo = null

        try {
            census = await this.getProperCensus(this.state.webVoting)

            process.census.merkleRoot = census.merkleRoot
            process.census.merkleTree = census.merkleTreeUri
            process.startBlock = this.state.startBlock
            process.numberOfBlocks = this.state.numberOfBlocks
            process.details.entityId = this.context.entityId
            if (census.formURI?.length) {
                process.details['formURI'] = census.formURI
            }
        } catch (e) {
            message.error(e)
            this.setState({creating: false})
            loading()

            return
        }

        if (!await this.hasBalance(loading)) {
            return
        }

        try {
            const wallet = this.context.web3Wallet.getWallet()
            const processId = await createVotingProcess(process, wallet, await this.context.gatewayClients)

            let msg = `The voting process with ID ${processId.substr(0, 8)} has been created.`
            if (this.state.webVoting) {
                const emailsReq : any = {
                    method: 'sendVotingLinks',
                    processId,
                    censusId: census.id,
                }
                // Avoid crash from e-mail sending
                try {
                    await this.context.managerBackendGateway.sendMessage(emailsReq, wallet)
                } catch (e) {
                    msg += ' There was an error sending e-mails tho.'
                }
            }

            message.success(msg)

            loading()

            Router.push(`/processes/#/${this.context.entityId}/${processId}`)
        } catch (error) {
            loading()
            this.setState({ creating: false })

            console.error('The voting process could not be created', error)
            message.error('The voting process could not be created')
        }
    }

    render() : ReactNode {
        const { process, loading, creating, selectedCensus } = this.state

        return (
            <div className='content-wrapper stretched-form'>
                <header>
                    <div className='header-image'>
                        <ImageAndUploader
                            uploaderActive
                            src={process.details.headerImage}
                            onConfirm={this.setProcessField.bind(this, 'details.headerImage')}
                        />
                    </div>
                </header>
                <Form onFinish={this.confirm.bind(this)}>
                    <Form.Item>
                        <Input
                            size='large'
                            placeholder='Process title'
                            value={process.details.title.default}
                            onChange={this.onFieldChange.bind(this, 'details.title.default')}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><AlignLeft /> Description</label>
                        </div>
                        <HTMLEditor
                            value={process.details.description.default}
                            onContentChanged={this.setProcessField.bind(this, 'details.description.default')}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Calendar /> Period</label>
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
                            <label><Activity /> Real-time results</label>
                            <Switch
                                onChange={(checked: boolean) =>
                                    this.setProcessField('type', checked ? POLL_TYPE_ANONYMOUS : POLL_TYPE_NORMAL)
                                }
                                checked={process.type === POLL_TYPE_ANONYMOUS}
                            />
                        </div>
                        <div>
                            <small>Vote results can be seen before the process has ended.</small>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><Youtube /> Live streaming</label>
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
                                />
                            </If>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <ParticipantsSelector
                            loading={loading}
                            options={this.state.censuses.map(({id, name}) => ({label: name, value: id}))}
                            onChange={(selectedCensus: string, censusFileData: VotingFormImportData) => {
                                this.setState({
                                    selectedCensus,
                                    censusFileData
                                })
                                if (selectedCensus === 'file') {
                                    this.setState({
                                        webVoting: true,
                                    })
                                }
                            }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><MessageSquare /> Questions and answers button</label>
                            <Switch
                                onChange={(qnaInputVisible: boolean) =>
                                    this.setState({qnaInputVisible})
                                }
                                checked={this.state.qnaInputVisible}
                            />
                        </div>
                        <div>
                            <If condition={this.state.qnaInputVisible}>
                                <Input placeholder='https://...' />
                            </If>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><HelpCircle /> Questions</label>
                        </div>
                        <QuestionsForm
                            onChange={this.setQuestions.bind(this)}
                        />
                    </Form.Item>
                    <Form.Item>
                        <div className='label-wrapper'>
                            <label><MousePointer /> Voting channels</label>
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
                                disabled={selectedCensus.startsWith('0x')}
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
                            <label><ArrowRightCircle /> Publishing</label>
                        </div>
                        <Button
                            disabled={loading || creating}
                            type='primary'
                            size='large'
                            htmlType='submit'
                        >
                            Publish final process
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        )
    }
}

export default ProcessNew
