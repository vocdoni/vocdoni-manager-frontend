import React, { Component, ReactChild, ReactNode } from 'react'
import { message, Card, Form, Input, Button } from 'antd'
import { CardProps } from 'antd/lib/card'
import { API, EntityMetadata, ProcessMetadata } from 'dvote-js'
import { Wallet } from 'ethers'
import Router from 'next/router'
import {
    getVoteMetadata,
    isCanceled,
    getProcessList,
} from 'dvote-js/dist/api/vote'

import AppContext from '../../components/app-context'
import { getGatewayClients } from '../../lib/network'
import main from '../../i18n/ca'
import { HEX_REGEX } from '../../lib/constants'
import HeaderImage from '../../components/processes/HeaderImage'
import style from '../../components/vote.module.css'
import If from '../../components/if'
import { extractDigestedPubKeyFromFormData, importedRowToString } from '../../lib/util'
import { generateProof } from 'dvote-js/dist/api/census'
import ErrorCard from '../../components/error-card'
import SinglePageLayout from '../../components/layouts/single-page'

const { Entity } = API

export type ProcessVoteLoginState = {
    entityId?: string,
    processId?: string,
    entity?: EntityMetadata,
    process?: ProcessMetadata,
    fields: string[],
    isCanceled?: boolean,
    loading: boolean,
    verifying: boolean,
    error?: string,
}

class ProcessVoteLogin extends Component<undefined, ProcessVoteLoginState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>
    wrapperRef: React.RefObject<any>
    static Layout: React.FunctionComponent

    state: ProcessVoteLoginState = {
        fields: [],
        loading: false,
        verifying: false,
    }

    async componentDidMount() : Promise<void> {
        try {
            const params = location.hash.substr(2).split('/')
            if (params.length !== 3 || !params[0].match(HEX_REGEX) || !params[1].match(HEX_REGEX)) {
                message.error(main.invalidRequest)
                Router.replace('/')
                return
            }

            const [entityId, processId, fields] = params

            this.setState({
                entityId,
                processId,
                fields: (new Buffer(fields, 'base64')).toString('utf8').split(','),
            })

            await this.refreshMetadata(entityId, processId)
        }
        catch (err) {
            console.error(err)
        }
    }

    async refreshMetadata(entityId: string, processId: string) : Promise<void> {
        try {
            this.setState({ loading: true, entityId, processId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            const processes = await getProcessList(entityId, gateway)

            const exists = processes.find((pid: string) => `0x${pid}` === processId)
            if (!exists) {
                throw new Error('not-found')
            }

            const voteMetadata = await getVoteMetadata(processId, gateway)
            const canceled = await isCanceled(processId, gateway)

            this.setState({ entity, process: voteMetadata, isCanceled: canceled, loading: false })
            this.context.setTitle(voteMetadata.details.title.default)
        }
        catch (err) {
            const error = (err && err.message == 'Request timed out') ? main.processListLoadTimeout : main.notFound

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
                importedRowToString(this.getSortedData(values), this.state.entityId)
            )

            // Just check the privKey, no need for its return
            new Wallet(privKey)

            const { entityId, processId } = this.state

            const gateway = await getGatewayClients()
            const merkleProof = await generateProof(
                this.state.process.census.merkleRoot,
                digestedHexClaim,
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

        message.error(main.errorCSVInvalidData)
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
                        <If condition={this.state.process?.details?.title?.default?.length}>
                            <h1>{this.state.process?.details?.title?.default}</h1>
                        </If>
                        <h2>{main.titleCSVLogin}</h2>
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
                            className={style.btn}
                            disabled={this.state.verifying}
                            loading={this.state.verifying || this.state.loading}
                        >
                            {main.buttonCSVLogin}
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
