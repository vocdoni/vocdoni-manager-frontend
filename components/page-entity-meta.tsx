import { Component } from "react"
import { getState, getGatewayClients, connectClients } from "../util/dvote-state"
import { Row, Col, Divider, Skeleton, message, Layout, Button, Input, Spin, Icon, Select } from "antd"
import { EntityMetadata, API, Models, Network } from "dvote-js"
import { by639_1 } from 'iso-language-codes'
import { headerBackgroundColor } from "../lib/constants"
import Web3Manager from "../util/web3-wallet"
const { Header } = Layout
const { Option } = Select
import { Wallet, Signer } from "ethers"

const { EntityMetadataTemplate } = Models.Entity
const { getEntityId, updateEntity } = API.Entity

const languageCodes = Object.keys(by639_1).sort().reduce((prev, cur) => {
    if (!prev.includes(cur)) prev.push(cur)
    return prev
}, [])

interface Props {
    refresh?: () => void
}
type State = {
    entityLoading: boolean,
    entityUpdating: boolean,
    accountAddress: string,
    entityMetadata: EntityMetadata,
    newEntity: EntityMetadata
}

export default class PageEntityMeta extends Component<Props, State> {

    refreshInterval: any
    state = {
        entityLoading: false,
        entityUpdating: false,
        accountAddress: null,
        entityMetadata: null as EntityMetadata,
        newEntity: EntityMetadataTemplate
    }

    componentDidMount() {
        this.refreshInterval = setInterval(() => this.checkAddressChanged(), 1000)

        this.refreshEntityData()
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    checkAddressChanged() {
        const prevAddress = this.state.accountAddress
        const { address } = getState()
        if (prevAddress == address) return
        this.refreshEntityData()
    }

    refreshEntityData() {
        const { address, entityMetadata, entityLoading } = getState()
        this.setState({
            accountAddress: address,
            entityMetadata,
            entityLoading
        })
    }

    // EVENTS (EXISTING ENTITY)
    onExistingLanguagesChange(languages) {
        const entityMetadata = Object.assign({}, this.state.entityMetadata, { languages })
        this.setState({ entityMetadata })
    }
    onExistingDefaultLanguageChange(language) {
        const defaultLang = this.state.entityMetadata.languages.filter(ln => ln == language)
        const otherLang = this.state.entityMetadata.languages.filter(ln => ln != language)
        const entityMetadata = Object.assign({}, this.state.entityMetadata, { languages: defaultLang.concat(otherLang) })
        this.setState({ entityMetadata })
    }
    onExistingNameChange(name: string, lang: string) {
        const newName = Object.assign({}, this.state.entityMetadata.name, { [lang]: name })
        const entityMetadata = Object.assign({}, this.state.entityMetadata, { name: newName })
        this.setState({ entityMetadata })
    }
    onExistingDescriptionChange(description: string, lang: string) {
        const newDescription = Object.assign({}, this.state.entityMetadata.description, { [lang]: description })
        const entityMetadata = Object.assign({}, this.state.entityMetadata, { description: newDescription })
        this.setState({ entityMetadata })
    }
    onExistingFieldChange(key: string, subkey: string, value: string) {
        if (subkey === null) {
            const entityMetadata = Object.assign({}, this.state.entityMetadata, { [key]: value })
            this.setState({ entityMetadata })
        }
        else {
            const entityMetadata = Object.assign({}, this.state.entityMetadata)
            if (typeof entityMetadata[key] != "object") entityMetadata[key] = {}
            entityMetadata[key][subkey] = value
            this.setState({ entityMetadata })
        }
    }

    registerEntity() {
        this.setState({ entityUpdating: true })

        // Ensure register action has appropriate Entity ID
        const newEntity = this.state.newEntity

        const idx = newEntity.actions.findIndex(act => act.type == "register")
        if (idx < 0) { // add it
            newEntity.actions.push({
                type: "register",
                actionKey: "register",
                name: { default: "Sign up" },
                url: process.env.REGISTER_URL,
                visible: process.env.ACTION_VISIBILITY_URL
            })
        }
        else { // update it
            newEntity.actions[idx].url = process.env.REGISTER_URL
            newEntity.actions[idx].visible = process.env.ACTION_VISIBILITY_URL
        }

        return getGatewayClients().then(clients => {
            const state = getState()
            return updateEntity(state.address, newEntity, Web3Manager.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
        }).then(newOrigin => {
            this.props.refresh()

            message.success("The entity has been registered!")
            this.setState({ entityUpdating: false })
        }).catch(err => {
            message.error("The entity could not be registered")
            this.setState({ entityUpdating: false })
        })
    }

    updateMetadata() {
        this.setState({ entityUpdating: true })

        const entityMetadata = Object.assign({}, this.state.newEntity, this.state.entityMetadata)

        const idx = entityMetadata.actions.findIndex(act => act.type == "register")
        if (idx < 0) { // add it
            entityMetadata.actions.unshift({
                type: "register",
                actionKey: "register",
                name: { default: "Sign up" },
                url: process.env.REGISTER_URL,
                visible: process.env.ACTION_VISIBILITY_URL
            })
        }
        else { // update it
            entityMetadata.actions[idx].actionKey = "register"
            entityMetadata.actions[idx].url = process.env.REGISTER_URL
            entityMetadata.actions[idx].visible = process.env.ACTION_VISIBILITY_URL
        }

        // Filter extraneous actions
        entityMetadata.actions = entityMetadata.actions.filter(meta => !!meta.actionKey)

        return getGatewayClients().then(clients => {
            const state = getState()
            return updateEntity(state.address, entityMetadata, Web3Manager.signer as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
        }).then(newOrigin => {
            this.props.refresh()

            message.success("The entity has been updated")
            this.setState({ entityUpdating: false })
        }).catch(err => {
            message.error("The entity could not be updated")
            this.setState({ entityUpdating: false })
        })
    }

    // EVENTS (NEW ENTITY)
    onNewLanguagesChange(languages) {
        const newEntity = Object.assign({}, this.state.newEntity, { languages })
        this.setState({ newEntity })
    }
    onNewDefaultLanguageChange(language) {
        const defaultLang = this.state.newEntity.languages.filter(ln => ln == language)
        const otherLang = this.state.newEntity.languages.filter(ln => ln != language)
        const newEntity = Object.assign({}, this.state.newEntity, { languages: defaultLang.concat(otherLang) })
        this.setState({ newEntity })
    }
    onNewNameChange(name: string, lang: string) {
        const newName = Object.assign({}, this.state.newEntity.name, { [lang]: name })
        const newEntity = Object.assign({}, this.state.newEntity, { name: newName })
        this.setState({ newEntity })
    }
    onNewDescriptionChange(description: string, lang: string) {
        const newDescription = Object.assign({}, this.state.newEntity.description, { [lang]: description })
        const newEntity = Object.assign({}, this.state.newEntity, { description: newDescription })
        this.setState({ newEntity })
    }
    onNewFieldChange(key: string, subkey: string, value: string) {
        if (subkey === null) {
            const newEntity = Object.assign({}, this.state.newEntity, { [key]: value })
            this.setState({ newEntity })
        }
        else {
            const newEntity = Object.assign({}, this.state.newEntity)
            if (typeof newEntity[key] != "object") newEntity[key] = {}
            newEntity[key][subkey] = value
            this.setState({ newEntity })
        }
    }
    renderSupportedLanaguages(entity) {
        return <Row gutter={16}>
            <Col xs={24} md={12}>
                <label>Supported languages</label>
                <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Select the supported languages"
                    value={(entity.languages) || []}
                    onChange={langs => this.onExistingLanguagesChange(langs)}
                >
                    {languageCodes.map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                </Select>
            </Col>
            <Col xs={24} md={12}>
                <label>Default language</label>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Select the default language"
                    value={entity.languages[0] || ""}
                    onChange={lang => this.onExistingDefaultLanguageChange(lang)}
                >
                    {((entity.languages) || [] as any[]).filter(lang => by639_1[lang]).map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                </Select>
            </Col>
        </Row>
    }

    renderEntityEdit() {
        const { entityMetadata: entity } = this.state

        return <div style={{ padding: 30 }}>
            {/* <h2>General</h2>

            this.renderSupportedLanaguages(entity)
            <br />

            <h2>Name</h2> */}
            <Row gutter={16}>
                {
                    // (entity.languages).map(lang => <Col xs={24} md={12} key={lang}>
                    ['default'].map(lang => <Col xs={24} md={12} key={lang}>
                        {/* <label>Entity name ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                        <label>Entity name</label>
                        <Input type="text"
                            value={entity.name[lang]}
                            prefix={<Icon type="info-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder={"Entity name"}
                            onChange={val => this.onExistingNameChange(val.target.value, lang)} />
                        <br /><br />
                    </Col>)
                }
            </Row>
            {/* <h2>Description</h2> */}
            <Row gutter={16}>
                {
                    // (entity.languages).map(lang => <Col xs={24} md={12} key={lang}>
                    ['default'].map(lang => <Col xs={24} md={12} key={lang}>
                        {/* <label>Description ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                        <label>Description</label>
                        <Input type="text"
                            value={entity.description[lang]}
                            prefix={<Icon type="book" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder={"Description"}
                            onChange={val => this.onExistingDescriptionChange(val.target.value, lang)} />
                        <br /><br />
                    </Col>)
                }
            </Row>

            {/* <h2>General</h2> */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <label>Avatar (URL)</label>
                    <Input
                        placeholder="Link to an avatar icon"
                        prefix={<Icon type="file-image" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={entity.media && entity.media.avatar}
                        onChange={ev => this.onExistingFieldChange("media", "avatar", ev.target.value)}
                    />
                    <br /><br />
                </Col>
            </Row>
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <label>Header Image (URL)</label>
                    <Input
                        placeholder="Link to a header image"
                        prefix={<Icon type="file-image" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={entity.media && entity.media.header}
                        onChange={ev => this.onExistingFieldChange("media", "header", ev.target.value)}
                    />
                    <br /><br />
                </Col>
            </Row>

            <Divider />

            <div style={{ textAlign: "center" }}>
                {this.state.entityUpdating ?
                    <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} /> :
                    <Button size='large' type='primary' onClick={() => this.updateMetadata()}>Update metadata</Button>
                }
            </div>
        </div>
    }

    renderCreateEntity() {
        const { newEntity: entity } = this.state

        return <div style={{ padding: 30 }}>
            <h2>General</h2>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <label>Supported languages</label>
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select the supported languages"
                        value={(entity.languages) || []}
                        onChange={langs => this.onNewLanguagesChange(langs)}
                    >
                        {languageCodes.map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                    </Select>
                </Col>
                <Col xs={24} md={12}>
                    <label>Default language</label>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Select the default language"
                        value={entity.languages[0] || ""}
                        onChange={lang => this.onNewDefaultLanguageChange(lang)}
                    >
                        {((entity.languages) || [] as any[]).filter(lang => by639_1[lang]).map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                    </Select>
                </Col>
            </Row>
            <br />

            <h2>Name</h2>
            <Row gutter={16}>
                {
                    (entity.languages).map(lang => <Col xs={24} md={12} key={lang}>
                        <label>Entity name ({by639_1[lang] ? by639_1[lang].name : lang})</label>
                        <Input type="text"
                            value={entity.name[lang]}
                            prefix={<Icon type="info-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder={"Entity name"}
                            onChange={val => this.onNewNameChange(val.target.value, lang)} />
                        <br /><br />
                    </Col>)
                }
            </Row>

            <h2>Description</h2>
            <Row gutter={16}>
                {
                    (entity.languages).map(lang => <Col xs={24} md={12} key={lang}>
                        <label>Description ({by639_1[lang] ? by639_1[lang].name : lang})</label>
                        <Input type="text"
                            value={entity.description[lang]}
                            prefix={<Icon type="book" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder={"Description"}
                            onChange={val => this.onNewDescriptionChange(val.target.value, lang)} />
                        <br /><br />
                    </Col>)
                }
            </Row>

            <h2>General</h2>
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <label>Avatar (URL)</label>
                    <Input
                        placeholder="Link to an avatar icon"
                        prefix={<Icon type="file-image" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={entity.media && entity.media.avatar}
                        onChange={ev => this.onNewFieldChange("media", "avatar", ev.target.value)}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <label>Header (URL)</label>
                    <Input
                        placeholder="Link to aheader image"
                        prefix={<Icon type="file-image" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={entity.media && entity.media.header}
                        onChange={ev => this.onNewFieldChange("media", "header", ev.target.value)}
                    />
                </Col>
            </Row>

            <Divider />

            <div style={{ textAlign: "center" }}>
                {this.state.entityUpdating ?
                    <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} /> :
                    <Button size='large' type='primary' onClick={() => this.registerEntity()}>Register entity</Button>
                }
            </div>
        </div>
    }

    render() {
        const { entityMetadata, entityLoading } = this.state

        if (entityLoading) {
            return <>
                <Header style={{ backgroundColor: headerBackgroundColor }}>
                    <h2></h2>
                </Header>

                <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                    <div style={{ padding: 30 }}>
                        <Skeleton />
                    </div>
                </div>
            </>
        }

        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                {/* <h2>{entityMetadata ? entityMetadata.name[entityMetadata.languages[0]] : "Register an Entity"}</h2> */}
                <h2>{entityMetadata ? "Profile" : "Register an Entity"}</h2>
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {
                    entityMetadata ? this.renderEntityEdit() : this.renderCreateEntity()
                }
            </div>
        </>
    }
}
