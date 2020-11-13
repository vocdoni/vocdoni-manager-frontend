import React, { Component, Fragment, ReactComponentElement, ReactElement, ReactNode } from 'react'
import { message, notification, Spin, Modal, Divider, Button } from 'antd'
import { API, EntityMetadata, ProcessMetadata } from 'dvote-js'
import { LoadingOutlined } from '@ant-design/icons'
import { Wallet } from 'ethers'
import moment from 'moment'
import Router from 'next/router'
import {
    getVoteMetadata,
    getBlockHeight,
    packagePollEnvelope,
    submitEnvelope,
    getEnvelopeStatus,
    getProcessKeys,
    isCanceled,
    getPollNullifier,
    getProcessList,
} from 'dvote-js/dist/api/vote'
import { digestHexClaim, generateProof } from 'dvote-js/dist/api/census'
import { ReloadOutlined } from '@ant-design/icons'
import { MessageType } from 'antd/lib/message'

import AppContext from '../../components/app-context'
import { getGatewayClients } from '../../lib/network'
import MultiLine from '../../components/multi-line-text'
import main from '../../i18n/ca'
import { HEX_REGEX } from '../../lib/constants'
import NotFound from '../../components/not-found'
import ViewWrapper from '../../components/processes/ViewWrapper'
import Questions from '../../components/processes/Questions'
import { areAllNumbers } from '../../lib/util'

const { Entity } = API

const BLOCK_TIME: number = parseInt(process.env.BLOCK_TIME, 10)

export type ProcessVoteViewState = {
    loadingStatus?: boolean,
    refreshingVoteStatus?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    processId?: string,
    privateKey?: string,
    process?: ProcessMetadata,
    isCanceled: boolean,
    currentBlock: number,
    currentDate: moment.Moment,
    merkleProof: string,
    hasVoted: boolean,
    hasVotedOnDate?: moment.Moment,
    showConfirmChoices: boolean,
    showSubmitConfirmation: boolean,
    isSubmitting: boolean,
    nullifier: string,
    connectionError?: string,
    choices: number[],
}

const timeout = (s: number) => new Promise((r) => setTimeout(r, s*1000))

// Stateful component
class ProcessVoteView extends Component<undefined, ProcessVoteViewState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    wrapperRef: React.RefObject<any>
    static Layout: React.FunctionComponent

    state: ProcessVoteViewState = {
        currentDate: moment(),
        isCanceled: false,
        currentBlock: null,
        merkleProof: null,
        hasVoted: false,
        hasVotedOnDate: null,
        showConfirmChoices: false,
        showSubmitConfirmation: false,

        choices: [],
        isSubmitting: false,
        nullifier: '',
    }

    refreshInterval = null

    constructor(props: undefined) {
        super(props)

        this.wrapperRef = React.createRef()
    }

    get endOfIntroduction() : number {
        let top = 0
        if (this.wrapperRef.current?.endIntroRef?.current?.offsetTop) {
            top = this.wrapperRef.current.endIntroRef.current.offsetTop
        }

        return top
    }

    async componentDidMount() : Promise<void> {
        try {
            const params = location.hash.substr(2).split('/')
            if (params.length !== 3 || !params[0].match(HEX_REGEX) || !params[1].match(HEX_REGEX) || !params[2].match(HEX_REGEX)) {
                message.error(main.invalidRequest)
                Router.replace('/')
                return
            }

            const [entityId, processId, privateKey] = params

            this.setState({
                entityId,
                processId,
                privateKey,
            })

            await this.refreshBlockHeight()
            await this.refreshMetadata()
            await this.refreshVoteState()

            const interval = (parseInt(process.env.BLOCK_TIME || '10', 10) || 10) * 1000
            this.refreshInterval = setInterval(() => this.refreshBlockHeight(), interval)
        }
        catch (err) {
            console.error(err)
        }
    }

    componentWillUnmount() : void {
        clearInterval(this.refreshInterval)
    }

    async refreshBlockHeight() : Promise<void> {
        let gateway = null,
            currentBlock = this.state.currentBlock || 0
        try {
            gateway = await getGatewayClients()
            currentBlock = await getBlockHeight(gateway)
        } catch (err) {
            const msg = [
                'There was an error updating the blockchain information.',
                'Refresh the page if you don\'t see changes in a while.',
            ]
            console.error(err)
            return message.error(msg.join(' '))
        }

        this.setState({ currentBlock, currentDate: moment() })
    }

    async refreshMetadata() : Promise<void> {
        try {
            const { entityId, processId } = this.state

            this.setState({ loadingStatus: true, entityId, processId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            const processes = await getProcessList(entityId, gateway)

            const exists = processes.find((pid: string) => `0x${pid}` === processId)
            if (!exists) {
                throw new Error('not-found')
            }

            const voteMetadata = await getVoteMetadata(processId, gateway)
            const canceled = await isCanceled(processId, gateway)

            this.setState({ entity, process: voteMetadata, isCanceled: canceled, loadingStatus: false })
            this.context.setTitle(voteMetadata.details.title.default)
        }
        catch (err) {
            const notfounds = [
                'not-found',
                'The given entity has no metadata defined yet',
            ]
            if (notfounds.includes(err?.message)) {
                return this.setState({
                    loadingStatus: false,
                })
            }

            const str = (err && err.message == 'Request timed out') ? main.processListLoadTimeout : main.couldNotLoadVote
            message.error(str)
            this.setState({ connectionError: str, loadingStatus: false })
        }
    }

    async refreshVoteState() : Promise<MessageType> {
        let wallet: Wallet
        try {
            wallet = new Wallet(this.state.privateKey)
        }
        catch (err) {
            return message.error(main.invalidPrivateKey)
        }

        try {
            this.setState({ refreshingVoteStatus: true })
            const gateway = await getGatewayClients()
            const publicKeyHash = digestHexClaim(wallet['signingKey'].publicKey)
            const merkleProof = await generateProof(this.state.process.census.merkleRoot, publicKeyHash, true, gateway)
            if (merkleProof) this.setState({ merkleProof })

            const nullifier = await getPollNullifier(wallet.address, this.state.processId)
            const { registered, date } = await getEnvelopeStatus(this.state.processId, nullifier, gateway)

            this.setState({
                refreshingVoteStatus: false,
                nullifier: nullifier.replace(/^0x/, ''),
                hasVoted: registered,
                hasVotedOnDate: date ? moment(date) : null,
            })
        }
        catch (err) {
            this.setState({ refreshingVoteStatus: false })
            if (err && err.message == 'The Merkle Proof could not be fetched')
                return message.warn(main.youAreNotInTheCensus)

            message.error(main.couldNotCheckCensus)
        }
    }

    backFromConfirmSummary() : void {
        window.scrollTo(0, this.endOfIntroduction)
        this.setState({ showConfirmChoices: false })
    }

    onContinueClicked(votes: number[]) : MessageType {
        window.scrollTo(0, this.endOfIntroduction)

        if (votes.length != this.state.process.details.questions.length)
            return message.error(main.pleaseChooseYourVoteForAllQuestions)

        if (!areAllNumbers(votes))
            return message.error(main.pleaseChooseYourVoteForAllQuestions)

        try {
            new Wallet(this.state.privateKey)
        }
        catch (err) {
            return message.error(main.invalidPrivateKey)
        }

        this.setState({
            showConfirmChoices: true,
            choices: votes,
        })
    }

    async onSubmitVote() : Promise<void> {
        const votes = this.state.choices
        const wallet = new Wallet(this.state.privateKey)
        const gateway = await getGatewayClients()

        try {
            this.setState({ isSubmitting: true })
            const publicKeyHash = digestHexClaim(wallet['signingKey'].publicKey)
            const merkleProof = await generateProof(this.state.process.census.merkleRoot, publicKeyHash, true, gateway)

            // Detect encryption
            if (this.state.process.type == 'encrypted-poll') {
                const keys = await getProcessKeys(this.state.processId, gateway)
                const voteEnvelope = await packagePollEnvelope({ votes, merkleProof, processId: this.state.processId, walletOrSigner: wallet, processKeys: keys })
                await submitEnvelope(voteEnvelope, gateway)
            } else {
                const voteEnvelope = await packagePollEnvelope({ votes, merkleProof, processId: this.state.processId, walletOrSigner: wallet })
                await submitEnvelope(voteEnvelope, gateway)
            }

            await new Promise(resolve => setTimeout(resolve, Math.floor(BLOCK_TIME * 1000)))

            for (let i = 0; i < 10; i++) {
                await this.refreshVoteState()
                if (this.state.hasVoted) break
                await new Promise(resolve => setTimeout(resolve, Math.floor(BLOCK_TIME * 500)))
            }
            if (!this.state.hasVoted) throw new Error('The vote has not been registered')

            notification.success({
                message: main.voteSubmitted,
                description: main.yourVoteHasBeenSuccessfullyRegistered
            })
            this.setState({ isSubmitting: false })
        }
        catch (err) {
            this.setState({ isSubmitting: false })
            message.error(main.theVoteCouldNotBeSubmitted)
        }
    }

    renderStatus(status: {
        loadingStatus: boolean, refreshingVoteStatus: boolean, hasVoted: boolean, isSubmitting: boolean, isCanceled: boolean, hasStarted: boolean, hasEnded: boolean, isInCensus: boolean
    }) : ReactNode {
        const { loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting, isCanceled, hasStarted, hasEnded, isInCensus } = status

        if (loadingStatus || refreshingVoteStatus) return <p><span className='status muted'>{main.loading}... &nbsp; <Spin indicator={<LoadingOutlined />} /></span></p>
        else if (hasVoted) {
            if (this.state.hasVotedOnDate) {
                const strDate = this.state.hasVotedOnDate.date() + '/' + (this.state.hasVotedOnDate.month() + 1) + '/' + this.state.hasVotedOnDate.year() + ' ' + this.state.hasVotedOnDate.hours() + ':' + ('0' + this.state.hasVotedOnDate.minutes()).substr(-2) + 'h'
                return <><p><span className='status success'>{main.yourVoteHasBeenRegisteredOn} {strDate}</span></p></>
            }
            else
                return <><p><span className='status success'>{main.yourVoteIsRegistered}</span></p></>
        }
        else if (isSubmitting) return <p><span className='status muted'>{main.submittingVote}... &nbsp; <Spin indicator={<LoadingOutlined />} /></span></p>
        else if (!hasStarted) return <p><span className='status muted'>{main.theProcessHasNotStarted}</span></p>
        else if (isCanceled || hasEnded) return <p><span className='status muted'>{main.theProcessHasEnded}</span></p>
        else if (isInCensus) return <p><span className='status success'>{main.youCanVote}</span></p>
        else return <p><span className='status warning'>{main.youAreNotInTheCensus}</span></p>
    }

    // STAGE 3
    renderConfirmSummary() : ReactNode {
        const { process, choices } = this.state

        return <div className='center-content'>
            {/* <Divider>{process.details.title.default}</Divider> */}
            <Divider />
            <p style={{ marginBottom: 30 }} className='info-text'><MultiLine text={main.processDescriptionStage3} /></p>
            {
                process.details.questions.map((question, idx) => <Fragment key={idx}>
                    {
                        typeof choices[idx] != 'number' ? null : <>
                            <p>
                                <strong>{question.question.default}</strong> - {
                                    question.voteOptions.some(o => o.value == this.state.choices[idx]) ?
                                        question.voteOptions.find(o => o.value == this.state.choices[idx]).title.default : null
                                }
                            </p>
                        </>
                    }
                </Fragment>)
            }
            <Divider />

            <Modal
                visible={this.state.showSubmitConfirmation}
                okText={main.confirm}
                cancelText={main.goBack}
                onOk={() => {
                    this.setState({ showSubmitConfirmation: false })
                    setTimeout(() => this.onSubmitVote(), 100) // wait a bit for the modal to dismiss
                }}
                onCancel={() => this.setState({ showSubmitConfirmation: false })}
            >
                <p>{main.youAreAboutToSendYourVoteConfirmContinue}</p>
            </Modal>

            <div className='bottom-button-wrapper'>
                <Button size={'large'} onClick={() => this.backFromConfirmSummary()}>{main.goBack}</Button>
                <Button type='primary' size={'large'} onClick={() => this.setState({ showSubmitConfirmation: true })}>{main.castMyVote}</Button>
            </div>
        </div>
    }

    // STAGE 4
    renderSubmitting() : ReactNode {
        return <div className='center-content'>
            {/* <Divider>{main.votingStatus}</Divider> */}
            <Divider />
            <p><span className='status muted'>{main.submittingVote}... &nbsp; <Spin indicator={<LoadingOutlined />} /></span></p>
        </div>
    }

    // STAGE 5
    renderHasVotedSummary(status: {
        loadingStatus: boolean, refreshingVoteStatus: boolean, hasVoted: boolean, isSubmitting: boolean, isCanceled: boolean, hasStarted: boolean, hasEnded: boolean, isInCensus: boolean
    }) : ReactNode {
        // const { loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting, isCanceled, hasStarted, hasEnded, isInCensus } = status
        const { process } = this.state

        return <div className='center-content'>
            {/* <Divider>{process.details.title.default}</Divider> */}
            <Divider />
            {this.renderStatus(status)}
            <p className='info-text' style={{ marginBottom: 0 }}><MultiLine text={main.processDescriptionStage4} /></p>
            {/* <p>{process.details.description.default}</p> */}
        </div>
    }

    // STAGE 0/X
    renderReadOnlySummary(status: {
        loadingStatus: boolean, refreshingVoteStatus: boolean, hasVoted: boolean, isSubmitting: boolean, isCanceled: boolean, hasStarted: boolean, hasEnded: boolean, isInCensus: boolean
    }) : ReactNode {
        // const { loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting, isCanceled, hasStarted, hasEnded, isInCensus } = status
        return <div className='center-content'>
            {/* <Divider>{main.votingStatus}</Divider> */}
            <Divider />
            {this.renderStatus(status)}
        </div>
    }

    renderProcess() : any {
        const {
            process,
            choices,
            isCanceled,
            currentBlock,
            currentDate,
            showConfirmChoices,
        } = this.state

        const allQuestionsChosen = areAllNumbers(choices) && choices.length == process.details.questions.length

        const startTimestamp = currentDate.valueOf() + (process.startBlock - currentBlock) * BLOCK_TIME * 1000
        const startDate = moment(startTimestamp)
        const endDate = moment(startTimestamp + process.numberOfBlocks * BLOCK_TIME * 1000)

        const { loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting } = this.state
        const hasStarted = startDate.valueOf() <= Date.now()
        const hasEnded = endDate.valueOf() < Date.now()
        const isInCensus = !!this.state.merkleProof

        const canVote = !hasVoted && hasStarted && !hasEnded && isInCensus && !isCanceled
        // const canSubmit = allQuestionsChosen && !hasVoted && hasStarted && !hasEnded && isInCensus && !isCanceled

        let body: ReactNode
        if (!canVote) {
            if (hasVoted) {
                body = this.renderHasVotedSummary({ loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting, isCanceled, hasStarted, hasEnded, isInCensus })
            }
            else {
                body = this.renderReadOnlySummary({ loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting, isCanceled, hasStarted, hasEnded, isInCensus })
            }
        }
        else if (isSubmitting) {
            body = this.renderSubmitting()
        }
        else if (refreshingVoteStatus) {
            body = this.renderReadOnlySummary({ loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting, isCanceled, hasStarted, hasEnded, isInCensus })
        }
        else if (allQuestionsChosen && showConfirmChoices) {
            body = this.renderConfirmSummary()
        }
        else {
            body = <Questions
                process={process}
                onSubmitClick={(values) => this.onContinueClicked(values)}
            />
        }

        return body
    }

    render() : ReactNode {
        if (this.state.loadingStatus) {
            return (
                <ViewWrapper {...this.state}>
                    <div style={{ marginTop: 24 }}>
                        {main.loading}...  <Spin size='small' indicator={<LoadingOutlined />} />
                    </div>
                </ViewWrapper>
            )
        }
        else if ((!this.state.entity || !this.state.process) && !this.state.connectionError) {
            return <ViewWrapper {...this.state}>
                <NotFound />
            </ViewWrapper>
        }
        else if (this.state.connectionError) {
            return (
                <ViewWrapper {...this.state}>
                    <p>{this.state.connectionError}</p>
                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type='primary'
                            onClick={() =>
                                this.setState(
                                    {connectionError: null},
                                    () => this.refreshMetadata()
                                )
                            }
                        >
                            <ReloadOutlined />{main.retryConnection}
                        </Button>
                    </div>
                </ViewWrapper>
            )
        }

        // It would be better if we only render Viewwrapper once, but.. for the sake of ease.
        return (
            <ViewWrapper
                {...this.state}
                ref={this.wrapperRef}
            >
                {this.renderProcess()}
            </ViewWrapper>
        )
    }
}

// tslint:disable-next-line
ProcessVoteView.Layout = function ProcessLayout(props: any) {
    return <>{props.children}</>
}

export default ProcessVoteView