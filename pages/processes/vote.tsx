import { ReloadOutlined, LoadingOutlined } from '@ant-design/icons'
import { message, notification, Spin, Modal, Divider, Button } from 'antd'
import Text from 'antd/lib/typography/Text'
import {
    CensusOffChainApi,
    EntityApi,
    EntityMetadata,
    ProcessContractParameters,
    ProcessMetadata,
    VotingApi,
} from 'dvote-js'
import { MessageType } from 'antd/lib/message'
import { Wallet } from 'ethers'
import moment from 'moment'
import Router from 'next/router'
import React, { Component, Fragment, ReactChild, ReactNode } from 'react'

import AppContext from '../../components/app-context'
import { getGatewayClients } from '../../lib/network'
import MultiLine from '../../components/multi-line-text'
import { HEX_REGEX } from '../../lib/constants'
import NotFound from '../../components/not-found'
import ViewWrapper from '../../components/processes/ViewWrapper'
import Questions from '../../components/processes/Questions'
import { areAllNumbers, findHexId } from '../../lib/util'
import i18n from '../../i18n'

const BLOCK_TIME: number = parseInt(process.env.BLOCK_TIME, 10)

export type ProcessVoteViewState = {
    loadingStatus?: boolean,
    refreshingVoteStatus?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    processId?: string,
    privateKey?: string,
    process?: ProcessMetadata,
    processParams?: ProcessContractParameters,
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

type Status = {
    loadingStatus: boolean,
    refreshingVoteStatus: boolean,
    hasVoted: boolean,
    isSubmitting: boolean,
    isCanceled: boolean,
    hasStarted: boolean,
    hasEnded: boolean,
    isInCensus: boolean,
}

// Stateful component
class ProcessVoteView extends Component<undefined, ProcessVoteViewState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    wrapperRef: React.RefObject<any>
    static Layout: React.FunctionComponent

    state: ProcessVoteViewState = {
        currentDate: moment(),
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
                message.error(i18n.t('invalidRequest'))
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
            currentBlock = await VotingApi.getBlockHeight(gateway)
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
            const entity = await EntityApi.getMetadata(entityId, gateway)
            const processes = await VotingApi.getProcessList(entityId, gateway)

            const exists = processes.find(findHexId(processId))
            if (!exists) {
                throw new Error('not-found')
            }

            const processParams = await VotingApi.getProcessParameters(processId, gateway)
            const process = await VotingApi.getProcessMetadata(processId, gateway)

            this.setState({
                entity,
                processParams,
                process,
                loadingStatus: false,
            })
            this.context.setTitle(process.title.default)
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

            const str = (err && err.message == 'Request timed out') ? i18n.t('processListLoadTimeout') : i18n.t('couldNotLoadVote')
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
            return message.error(i18n.t('invalidPrivateKey'))
        }

        try {
            this.setState({ refreshingVoteStatus: true })
            const gateway = await getGatewayClients()
            const publicKeyHash = CensusOffChainApi.digestPublicKey(wallet._signingKey().publicKey)
            const merkleProof = await CensusOffChainApi.generateProof(this.state.processParams.censusRoot, {key: publicKeyHash}, true, gateway)
            if (merkleProof) this.setState({ merkleProof })

            const nullifier = await VotingApi.getSignedVoteNullifier(wallet.address, this.state.processId)
            const { registered, date } = await VotingApi.getEnvelopeStatus(this.state.processId, nullifier, gateway)

            this.setState({
                refreshingVoteStatus: false,
                nullifier: nullifier.replace(/^0x/, ''),
                hasVoted: registered,
                hasVotedOnDate: date ? moment(date) : null,
            })
        }
        catch (err) {
            console.error(err)
            this.setState({
                refreshingVoteStatus: false,
            })

            if (err && err.message == 'The Merkle Proof could not be fetched') {
                return message.warn(i18n.t('youAreNotInTheCensus'))
            }

            message.error(i18n.t('couldNotCheckCensus'))
        }
    }

    backFromConfirmSummary() : void {
        window.scrollTo(0, this.endOfIntroduction)
        this.setState({ showConfirmChoices: false })
    }

    onContinueClicked(votes: number[]) : MessageType {
        window.scrollTo(0, this.endOfIntroduction)

        if (votes.length != this.state.process.questions.length)
            return message.error(i18n.t('pleaseChooseYourVoteForAllQuestions'))

        if (!areAllNumbers(votes))
            return message.error(i18n.t('pleaseChooseYourVoteForAllQuestions'))

        try {
            new Wallet(this.state.privateKey)
        }
        catch (err) {
            return message.error(i18n.t('invalidPrivateKey'))
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
        const { processParams } = this.state

        try {
            this.setState({ isSubmitting: true })
            const publicKeyHash = CensusOffChainApi.digestPublicKey(wallet._signingKey().publicKey)
            const censusProof = await CensusOffChainApi.generateProof(
                this.state.processParams.censusRoot,
                {key: publicKeyHash},
                true,
                gateway
            )

            // Detect encryption
            if (this.state.processParams.envelopeType.hasEncryptedVotes) {
                const keys = await VotingApi.getProcessKeys(this.state.processId, gateway)
                const { envelope, signature } = await VotingApi.packageSignedEnvelope({
                    votes,
                    censusProof,
                    censusOrigin: processParams.censusOrigin,
                    processId: this.state.processId,
                    walletOrSigner: wallet,
                    processKeys: keys,
                })
                await VotingApi.submitEnvelope(envelope, signature, gateway)
            } else {
                const { envelope, signature } = await VotingApi.packageSignedEnvelope({
                    votes,
                    censusProof,
                    censusOrigin: processParams.censusOrigin,
                    processId: this.state.processId,
                    walletOrSigner: wallet,
                })
                await VotingApi.submitEnvelope(envelope, signature, gateway)
            }

            await new Promise((resolve) => setTimeout(resolve, Math.floor(BLOCK_TIME * 1000)))

            for (let i = 0; i < 10; i++) {
                await this.refreshVoteState()
                if (this.state.hasVoted) break
                await new Promise((resolve) => setTimeout(resolve, Math.floor(BLOCK_TIME * 500)))
            }
            if (!this.state.hasVoted) throw new Error('The vote has not been registered')

            notification.success({
                message: i18n.t('voteSubmitted'),
                description: i18n.t('yourVoteHasBeenSuccessfullyRegistered')
            })
            this.setState({ isSubmitting: false })
        }
        catch (err) {
            this.setState({ isSubmitting: false })
            message.error(i18n.t('theVoteCouldNotBeSubmitted'))
        }
    }

    // This should be a component and be directly in the render
    renderStatus(status: Status) : ReactNode {
        const {
            loadingStatus,
            refreshingVoteStatus,
            hasVoted,
            isCanceled,
            isSubmitting,
            hasStarted,
            hasEnded,
            isInCensus,
        } = status

        let contents : ReactNode = null

        if (loadingStatus || refreshingVoteStatus) {
            contents = <>{i18n.t('loading')}... &nbsp; <Spin indicator={<LoadingOutlined />} /></>
        }
        else if (hasVoted) {
            if (this.state.hasVotedOnDate) {
                const strDate = this.state.hasVotedOnDate.date()
                    + '/' + (this.state.hasVotedOnDate.month() + 1)
                    + '/' + this.state.hasVotedOnDate.year()
                    + ' ' + this.state.hasVotedOnDate.hours()
                    + ':' + ('0' + this.state.hasVotedOnDate.minutes()).substr(-2)
                    + 'h'
                contents = <>
                    <p>{i18n.t('yourVoteHasBeenRegisteredOn')} {strDate}</p>
                    <p>
                        {i18n.t('nullifierNotice')} <Text copyable={{text: this.state.nullifier}}>
                            {this.state.nullifier.substr(0, 10)}...
                        </Text>
                    </p>
                </>
            }
            else {
                contents = <>{i18n.t('yourVoteIsRegistered')}</>
            }
        }
        else if (isSubmitting) {
            contents = <><Divider />{i18n.t('submittingVote')}... &nbsp; <Spin indicator={<LoadingOutlined />} /></>
        }
        else if (!hasStarted) {
            contents = <>{i18n.t('theProcessHasNotStarted')}</>
        }
        else if (isCanceled || hasEnded) {
            contents = <>{i18n.t('theProcessHasEnded')}</>
        }
        else if (isInCensus) {
            contents = <>{i18n.t('youCanVote')}</>
        }
        else {
            contents = <>{i18n.t('youAreNotInTheCensus')}</>
        }

        return <div className='vote-status'>{contents}</div>
    }

    renderReadOnlySummary(status: Status) : ReactNode {
        return (
            <>
                <Divider />
                {this.renderStatus(status)}
            </>
        )
    }

    renderConfirmSummary() : ReactNode {
        const { process, choices } = this.state
        return <>
            <Divider />
            <p className='info-text'><MultiLine text={i18n.t('theseAreYourSelections')} /></p>
            {
                process.questions.map((question, idx) => <Fragment key={idx}>
                    {
                        typeof choices[idx] != 'number' ? null : <>
                            <p>
                                <strong>{question.title.default}</strong> - {
                                    question.choices.some(o => o.value == this.state.choices[idx]) ?
                                        question.choices.find(o => o.value == this.state.choices[idx]).title.default : null
                                }
                            </p>
                        </>
                    }
                </Fragment>)
            }
            <Divider />

            <Modal
                visible={this.state.showSubmitConfirmation}
                okText={i18n.t('confirm')}
                cancelText={i18n.t('btn.back')}
                onOk={() => {
                    this.setState({ showSubmitConfirmation: false })
                    setTimeout(() => this.onSubmitVote(), 100) // wait a bit for the modal to dismiss
                }}
                onCancel={() => this.setState({ showSubmitConfirmation: false })}
            >
                <p>{i18n.t('youAreAboutToSendYourVoteConfirmContinue')}</p>
            </Modal>

            <div className='bottom-button-wrapper'>
                <Button
                    size='large'
                    onClick={() => this.backFromConfirmSummary()}
                >
                    {i18n.t('btn.back')}
                </Button>
                <Button
                    type='primary'
                    size='large'
                    onClick={() => this.setState({ showSubmitConfirmation: true })}
                >
                    {i18n.t('process.btn.cast_vote')}
                </Button>
            </div>
        </>
    }

    renderHasVotedSummary(status: Status) : ReactNode {
        return <div className='center-content'>
            <Divider />
            {this.renderStatus(status)}
            <p className='vote-status'>
                <MultiLine text={i18n.t('processDescriptionStage4')} />
            </p>
        </div>
    }

    renderProcess() : ReactNode {
        const {
            process,
            processParams: {
                startBlock,
                blockCount,
                status: {
                    isCanceled,
                },
                questionCount,
            },
            choices,
            currentBlock,
            currentDate,
            showConfirmChoices,
        } = this.state

        const allQuestionsChosen = areAllNumbers(choices) && choices.length === questionCount
        const startTimestamp = currentDate.valueOf() + (startBlock - currentBlock) * BLOCK_TIME * 1000
        const startDate = moment(startTimestamp)
        const endDate = moment(startTimestamp + blockCount * BLOCK_TIME * 1000)
        const { loadingStatus, refreshingVoteStatus, hasVoted, isSubmitting } = this.state
        const hasStarted = startDate.valueOf() <= Date.now()
        const hasEnded = endDate.valueOf() < Date.now()
        const isInCensus = !!this.state.merkleProof

        const canVote = !hasVoted && hasStarted && !hasEnded && isInCensus && !isCanceled
        const status = {
            loadingStatus,
            refreshingVoteStatus,
            hasVoted,
            isSubmitting,
            isCanceled,
            hasStarted,
            hasEnded,
            isInCensus,
        }

        let body: ReactNode
        if (!canVote) {
            if (hasVoted) {
                body = this.renderHasVotedSummary(status)
            }
            else {
                body = this.renderReadOnlySummary(status)
            }
        }
        else if (isSubmitting) {
            body = this.renderStatus(status)
        }
        else if (refreshingVoteStatus) {
            body = this.renderReadOnlySummary(status)
        }
        else if (allQuestionsChosen && showConfirmChoices) {
            body = this.renderConfirmSummary()
        }
        else {
            body = <Questions
                process={process}
                choices={this.state.choices}
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
                        {i18n.t('loading')}...  <Spin size='small' indicator={<LoadingOutlined />} />
                    </div>
                </ViewWrapper>
            )
        }
        else if ((!this.state.entity || !this.state.process) && !this.state.connectionError && !this.state.loadingStatus) {
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
                            <ReloadOutlined />{i18n.t('retryConnection')}
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

ProcessVoteView.Layout = function ProcessLayout(props: {children: ReactChild}) {
    return <>{props.children}</>
}

export default ProcessVoteView
