import React, { Component, ReactChild, ReactNode } from 'react'
import { message, Card, Form, Input, Button } from 'antd'
import { CardProps } from 'antd/lib/card'
import {
    EntityApi,
    EntityMetadata,
    ProcessContractParameters,
    ProcessMetadata,
    CensusOffChainApi,
    VotingApi,
} from 'dvote-js'
import { Wallet } from 'ethers'
import Router from 'next/router'

import AppContext from '../../components/app-context'
import { getGatewayClients } from '../../lib/network'
import { HEX_REGEX } from '../../lib/constants'
import HeaderImage from '../../components/processes/HeaderImage'
import If from '../../components/if'
import { extractDigestedPubKeyFromFormData, findHexId, importedRowToString } from '../../lib/util'
import ErrorCard from '../../components/error-card'
import SinglePageLayout from '../../components/layouts/single-page'
import i18n from '../../i18n'

export type ProcessVoteLoginState = {
    address?: string,
    processId?: string,
    entity?: EntityMetadata,
    process?: ProcessMetadata,
    params?: ProcessContractParameters,
    fields: string[],
    loading: boolean,
    verifying: boolean,
    error?: string,
}

class ProcessVoteLogin extends Component<undefined, ProcessVoteLoginState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    static Layout: React.FunctionComponent

    state: ProcessVoteLoginState = {
        fields: [],
        loading: false,
        verifying: false,
    }

    async componentDidMount() : Promise<void> {
        try {
            const { params } = this.context
            if (params.length !== 3 || !params[0].match(HEX_REGEX) || !params[1].match(HEX_REGEX)) {
                message.error(i18n.t('error.invalid_request'))
                Router.replace('/')
                return
            }

            const [address, processId, fields] = params

            this.setState({
                address,
                processId,
                fields: (new Buffer(fields, 'base64')).toString('utf8').split(','),
            })

            await this.refreshMetadata(address, processId)
        }
        catch (err) {
            console.error(err)
        }
    }

    async refreshMetadata(address: string, processId: string) : Promise<void> {
        try {
            this.setState({ loading: true, address, processId })

            const gateway = await getGatewayClients()
            const entity = await EntityApi.getMetadata(address, gateway)
            const processes = await VotingApi.getProcessList(address, gateway)

            const exists = processes.find(findHexId(processId))
            if (!exists) {
                throw new Error('not-found')
            }

            const process = await VotingApi.getProcessMetadata(processId, gateway)
            const params = await VotingApi.getProcessParameters(processId, gateway)

            this.setState({ entity, process, params, loading: false })
            this.context.setTitle(process.title.default)
        }
        catch (err) {
            const error = (err && err.message == 'Request timed out') ? i18n.t('process.error.timeout') : i18n.t('error.not_found')

            message.error(error)
            this.setState({
                loading: false,
                error,
            })
        }
    }

    getSortedData(values: any) : string[] {
        const result : string[] = []
        for (const field of this.state.fields) {
            if (values[field]) {
                result.push(values[field])
            }
        }
        return result
    }

    async login(values: any) : Promise<void> {
        this.setState({verifying: true})

        try {
            const {privKey, digestedHexClaim} = extractDigestedPubKeyFromFormData(
                importedRowToString(this.getSortedData(values), this.state.address)
            )

            // Just check the privKey, no need for its return
            new Wallet(privKey)

            const { address: entityId, processId } = this.state

            const gateway = await getGatewayClients()
            const merkleProof = await CensusOffChainApi.generateProof(
                this.state.params.censusRoot,
                {key: digestedHexClaim},
                true,
                gateway
            )
            if (merkleProof) {
                Router.push(`/processes/vote/#/${entityId}/${processId}/${privKey}`)

                return
            }
        } catch (error) {
            console.error(error)
        }

        message.error(i18n.t('error.invalid_spreadsheet_data'))
        this.setState({verifying: false})
    }

    render() : ReactNode {
        const card = {
            className: 'voting-page',
        } as CardProps

        if (this.state.process || this.state.entity) {
            card.cover = <HeaderImage {...this.state} />
        }

        if (this.state.error?.length) {
            return (
                <SinglePageLayout>
                    <ErrorCard>{this.state.error}</ErrorCard>
                </SinglePageLayout>
            )
        }

        return (
            <SinglePageLayout>
                <Card {...card} style={{marginBottom: '10em'}} loading={this.state.loading}>
                    <Form layout='vertical' onFinish={this.login.bind(this)}>
                        <If condition={this.state.process?.title?.default?.length}>
                            <h1>{this.state.process?.title?.default}</h1>
                        </If>
                        <h2>{i18n.t('process.login_title')}</h2>
                        {
                            this.state.fields.map((field, key) => (
                                <Form.Item label={field} name={field} key={key}>
                                    <Input />
                                </Form.Item>
                            ))
                        }
                        <Button
                            htmlType='submit'
                            type='primary'
                            disabled={this.state.verifying}
                            loading={this.state.verifying || this.state.loading}
                        >
                            {i18n.t('process.btn.login')}
                        </Button>
                    </Form>
                </Card>
            </SinglePageLayout>
        )
    }
}

ProcessVoteLogin.Layout = function ProcessLayout(props: {children: ReactChild}) {
    return <>{props.children}</>
}

export default ProcessVoteLogin
