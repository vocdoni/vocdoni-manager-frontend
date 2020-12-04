import { useContext, Component, ReactNode } from 'react'
import { message, Spin, Button, Input, Divider, Row, Col, Modal } from 'antd'
import { InfoCircleOutlined, BookOutlined, FileImageOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { API, EntityMetadata, GatewayBootNodes } from 'dvote-js'
import Router from 'next/router'
import { Wallet, Signer } from 'ethers'
// import { by639_1 } from 'iso-language-codes'

import AppContext, { IAppContext } from '../../components/app-context'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { updateEntity } from 'dvote-js/dist/api/entity'
import IPFSImageUpload from '../../components/ipfs-image-upload'
import Image from '../../components/image'

// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
const { Entity } = API
// const { Option } = Select

// const languageCodes = Object.keys(by639_1).sort().reduce((prev, cur) => {
//   if (!prev.includes(cur)) prev.push(cur)
//   return prev
// }, [])

type State = {
    entityLoading?: boolean,
    entityUpdating?: boolean,
    entity?: EntityMetadata,
    entityId?: string,
    bootnodes?: GatewayBootNodes,
    email?: string,
}

// Stateful component
class EntityEdit extends Component<IAppContext, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {
        email: ""
    }

    async componentDidMount() : Promise<boolean> {
        if (getNetworkState().readOnly) {
            return Router.replace("/entities" + location.hash)
        }

        try {
            await this.fetchMetadata()
        }
        catch (err) {
            message.error("Could not read the entity metadata")
        }
    }

    async fetchMetadata() : Promise<void> {
        try {
            this.context.setMenuSelected("entity-edit")

            const entityId = location.hash.substr(2)
            this.setState({ entityLoading: true, entityId })

            const gateway = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, gateway)
            if (!entity) throw new Error()

            const req : any = {method: 'getEntity'}
            const bk = await this.context.managerBackendGateway.sendMessage(req, this.context.web3Wallet.getWallet())
            if (bk.entity.email?.length) {
                this.setState({email: bk.entity.email})
            }

            this.setState({ entity, entityId, entityLoading: false })
            this.context.setTitle(entity.name.default)
            this.context.setEntityId(entityId)
        }
        catch (err) {
            this.setState({ entityLoading: false })
            throw err
        }
    }

    shouldComponentUpdate() : boolean {
        const entityId = location.hash.substr(2)
        if (entityId !== this.state.entityId) {
            this.fetchMetadata()
        }
        return true
    }

    // EVENTS
    onExistingLanguagesChange(languages) : void {
        const entity = Object.assign({}, this.state.entity, { languages })
        this.setState({ entity })
    }
    onExistingDefaultLanguageChange(language) : void {
        const defaultLang = this.state.entity.languages.filter(ln => ln === language)
        const otherLang = this.state.entity.languages.filter(ln => ln !== language)
        const entity = Object.assign({}, this.state.entity, { languages: defaultLang.concat(otherLang) })
        this.setState({ entity })
    }
    onNameChange(name: string, lang: string) : void {
        const newName = Object.assign({}, this.state.entity.name, { [lang]: name })
        const entity = Object.assign({}, this.state.entity, { name: newName })
        this.setState({ entity })
    }
    onEmailChange(email: string) : void {
        this.setState({ email })
    }
    onDescriptionChange(description: string, lang: string) : void {
        const newDescription = Object.assign({}, this.state.entity.description, { [lang]: description })
        const entity = Object.assign({}, this.state.entity, { description: newDescription })
        this.setState({ entity })
    }
    onFieldChange(key: string, subkey: string, value: string) : void {
        if (subkey === null) {
            const entity = Object.assign({}, this.state.entity, { [key]: value })
            this.setState({ entity })
        }
        else {
            const entity = Object.assign({}, this.state.entity)
            if (typeof entity[key] !== "object") entity[key] = {}
            entity[key][subkey] = value
            this.setState({ entity })
        }
    }

    confirmUpdateMetadata() : void {
        const that = this;
        Modal.confirm({
            title: "Confirm",
            icon: <ExclamationCircleOutlined />,
            content: "The changes to the entity will become public. Do you want to continue?",
            okText: "Update Entity",
            okType: "primary",
            cancelText: "Not now",
            onOk() {
                that.updateMetadata()
            },
        })
    }

    async updateMetadata() : Promise<any> {
        this.setState({ entityUpdating: true })

        const address = this.context.web3Wallet.getAddress()
        const balance = await this.context.web3Wallet.getProvider().getBalance(address)

        if (balance.lte(0)) {
            Modal.warning({
                title: "Not enough balance",
                icon: <ExclamationCircleOutlined />,
                content: <span>To continue with the transaction you need to get some xDAI tokens. <br />Get in touch with us and copy the following address: <code>{address}</code></span>,
                onOk: () => {
                    this.setState({ entityUpdating: false })
                },
            })
            return
        }

        const entity = Object.assign({}, this.state.entity)

        const idx = entity.actions.findIndex(act => act.type === "register")
        if (idx < 0) { // add it
            entity.actions.unshift({
                type: "register",
                actionKey: "register",
                name: { default: "Sign up" },
                url: process.env.REGISTER_URL,
                visible: process.env.ACTION_VISIBILITY_URL
            })
        }
        else { // update it
            entity.actions[idx].actionKey = "register"
            entity.actions[idx].url = process.env.REGISTER_URL
            entity.actions[idx].visible = process.env.ACTION_VISIBILITY_URL
        }

        // Filter extraneous actions
        entity.actions = entity.actions.filter(meta => !!meta.actionKey)

        await this.entityBackendUpdate(entity.name[entity.languages[0]], this.state.email)

        return getGatewayClients().then(gateway => {
            const state = getNetworkState()
            return updateEntity(this.context.web3Wallet.getAddress(), entity, this.context.web3Wallet.getWallet() as (Wallet | Signer), gateway)
        }).then(newOrigin => {
            return this.fetchMetadata()
        }).then(() => {
            message.success("The entity has been updated")
            this.setState({ entityUpdating: false })
        }).catch(err => {
            message.error("The entity could not be updated")
            this.setState({ entityUpdating: false })
        })
    }

    entityBackendUpdate(entityName: string, entityEmail:string) : Promise<any> {
        const request = {
            method: "updateEntity",
            entity: {
                name : entityName,
                email: entityEmail,
            }
        }
        return this.context.managerBackendGateway.sendMessage(request as any, this.context.web3Wallet.getWallet());
    }

    // renderSupportedLanaguages(entity) {
    //   return <Row gutter={16}>
    //     <Col xs={24} md={12}>
    //       <label>Supported languages</label>
    //       <Select
    //         mode="multiple"
    //         style={{ width: '100%' }}
    //         placeholder="Select the supported languages"
    //         value={(entity.languages) || []}
    //         onChange={langs => this.onExistingLanguagesChange(langs)}
    //       >
    //         {languageCodes.map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
    //       </Select>
    //     </Col>
    //     <Col xs={24} md={12}>
    //       <label>Default language</label>
    //       <Select
    //         style={{ width: '100%' }}
    //         placeholder="Select the default language"
    //         value={entity.languages[0] || ""}
    //         onChange={lang => this.onExistingDefaultLanguageChange(lang)}
    //       >
    //         {((entity.languages) || [] as any[]).filter(lang => by639_1[lang]).map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
    //       </Select>
    //     </Col>
    //   </Row>
    // }

    renderEntityEdit() : ReactNode {
        const { entity: entity, email:email } = this.state

        return <div className="body-card">
            <Row justify="start">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">Entity Profile</Divider>
                    {/*<h2>Name</h2> */}
                    {
                        // (entity.languages).map(lang => <>
                        ['default'].map(lang => <div key={lang}>
                            {/* <label>Entity name ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                            <p>This is the public information that will appear in your entity's profile, within Vocdoni's mobile application.</p>
                            <label>Name</label>
                            <Input type="text"
                                value={entity.name[lang]}
                                prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Entity name"}
                                onChange={val => this.onNameChange(val.target.value, lang)} />
                            <br /><br />
                        </div>)
                    }
                    {
                        // (entity.languages).map(lang => <>
                        <div>
                            {/* <label>Entity name ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                            <label>Entity email</label>
                            <Input type="text"
                                value={email}
                                prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Entity email"}
                                onChange={val => this.onEmailChange(val.target.value)} />
                            <br /><br />
                        </div>
                    }
                    {/* <h2>Description</h2> */}
                    {
                        // (entity.languages).map(lang => <>
                        ['default'].map(lang => <div key={lang}>
                            {/* <label>Description ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                            <label>Description</label>
                            <Input type="text"
                                value={entity.description[lang]}
                                prefix={<BookOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Description"}
                                onChange={val => this.onDescriptionChange(val.target.value, lang)} />
                            <br /><br />
                        </div>)
                    }

                    <Divider orientation="left">Media</Divider>
                    {/* <h2>General</h2> */}
                    <label>Avatar (URL)</label>
                    <Input
                        type='text'
                        value={entity.media.avatar}
                        prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                        placeholder={'Link to an avatar icon'}
                        onChange={(ev) => this.onFieldChange('media', 'avatar', ev.target.value)}
                        addonAfter={
                            <IPFSImageUpload
                                onChange={({file}) => {
                                    let image = ''
                                    if (file.status === 'done') {
                                        image = file.response.src
                                    }

                                    this.onFieldChange('media', 'avatar', image)
                                }}
                                {...this.context}
                            />
                        }
                    />
                    <br /><br />
                    <label>Header Image (URL)</label>
                    <Input
                        type='text'
                        value={entity.media.header}
                        prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                        placeholder={'Link to a header image'}
                        onChange={(ev) => this.onFieldChange('media', 'header', ev.target.value)}
                        addonAfter={
                            <IPFSImageUpload
                                onChange={({file}) => {
                                    let image = ''
                                    if (file.status === 'done') {
                                        image = file.response.src
                                    }

                                    this.onFieldChange('media', 'header', image)
                                }}
                                {...this.context}
                            />
                        }
                    />
                    <br /><br />

                    <Divider />

                    <div style={{ textAlign: "center" }}>
                        {this.state.entityUpdating ?
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                            <Button size='large' type='primary' onClick={() => this.confirmUpdateMetadata()}>Update Profile</Button>
                        }
                    </div>
                </Col>
                <Col xs={0} md={10} className="right-col">
                    <Divider orientation="left">Media</Divider>
                    <Image
                        src={this.state.entity.media.header}
                        className='header-image'
                    />
                </Col>
            </Row>
        </div>
    }

    renderNotFound() : ReactNode {
        return <div className="not-found">
            <h4>Entity not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() : ReactNode {
        return <div>Loading the details of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() : ReactNode {
        return <div id="entity-edit">
            {
                this.state.entityLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    this.state.entity ?
                        <div id="page-body">
                            {this.renderEntityEdit()}
                        </div>
                        : <div id="page-body" className="center">
                            {this.renderNotFound()}
                        </div>
            }
        </div >
    }
}

export default EntityEdit
