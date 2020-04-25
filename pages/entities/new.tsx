import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Select, Divider, Menu, Row, Col } from 'antd'
import { InfoCircleOutlined, BookOutlined, FileImageOutlined, LoadingOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes, EtherUtils } from "dvote-js"

const { Entity } = API
// import { by639_1 } from 'iso-language-codes'
import Link from "next/link"
import Router from 'next/router'
import Web3Wallet from '../../lib/web3-wallet'
import { Wallet, Signer } from 'ethers'
import { updateEntity, getEntityId } from 'dvote-js/dist/api/entity'
import { EntityMetadataTemplate } from 'dvote-js/dist/models/entity'
import { isRegExp } from 'util'
// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// const { Option } = Select

// const languageCodes = Object.keys(by639_1).sort().reduce((prev, cur) => {
//     if (!prev.includes(cur)) prev.push(cur)
//     return prev
// }, [])

// MAIN COMPONENT
const EntityNewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <EntityNew {...context} />
}

type State = {
    entityLoading?: boolean,
    entityUpdating?: boolean,
    entity?: EntityMetadata,
    bootnodes?: GatewayBootNodes,
    passphrase?: string,
    seed?: string,
}

// Stateful component
class EntityNew extends Component<IAppContext, State> {
    state: State = {
        entity: EntityMetadataTemplate
    }

    async componentDidMount() {
        this.props.setTitle("New entity")

        // Redirecting if user address has already an associated entity
        if(this.props.web3Wallet.isAvailable()){
            try {
                await this.checkExistingEntity();
            }
            catch (err) {
                message.error("Could not check your account")
            }
        }
    }

    async checkExistingEntity() {
        try {
            const userAddr = await this.props.web3Wallet.getAddress();
            const entityId = getEntityId(userAddr);
            this.setState({ entityLoading: true });

            const { web3Gateway, dvoteGateway } = await getGatewayClients()
            const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
            this.setState({ entityLoading: false })

            if (entity) {
                message.warning("Your Ethereum account already has an Entity created")
                Router.push("/entities/edit/#/" + entityId)
            }
        }
        catch (err) {
            this.setState({ entityLoading: false })
            if (err && err.message == "The given entity has no metadata defined yet") {
                return // nothing to show
            }
            throw err
        }
    }

    // EVENTS
    onExistingLanguagesChange(languages) {
        const entity = Object.assign({}, this.state.entity, { languages })
        this.setState({ entity })
    }
    onExistingDefaultLanguageChange(language) {
        const defaultLang = this.state.entity.languages.filter(ln => ln == language)
        const otherLang = this.state.entity.languages.filter(ln => ln != language)
        const entity = Object.assign({}, this.state.entity, { languages: defaultLang.concat(otherLang) })
        this.setState({ entity })
    }
    onNameChange(name: string, lang: string) {
        const newName = Object.assign({}, this.state.entity.name, { [lang]: name })
        const entity = Object.assign({}, this.state.entity, { name: newName })
        this.setState({ entity })
    }
    onDescriptionChange(description: string, lang: string) {
        const newDescription = Object.assign({}, this.state.entity.description, { [lang]: description })
        const entity = Object.assign({}, this.state.entity, { description: newDescription })
        this.setState({ entity })
    }
    onFieldChange(key: string, subkey: string, value: string) {
        if (subkey === null) {
            const entity = Object.assign({}, this.state.entity, { [key]: value })
            this.setState({ entity })
        }
        else {
            const entity = Object.assign({}, this.state.entity)
            if (typeof entity[key] != "object") entity[key] = {}
            entity[key][subkey] = value
            this.setState({ entity })
        }
    }

    async onPasswordChange(passphrase: string){
        try {
            const seed = EtherUtils.Signers.generateRandomHexSeed();
            this.setState({ passphrase, seed });
        }catch (e){
            console.log(e.message);
        }
    }

    async createWebWallet(){
        try {           
            await this.props.web3Wallet.store(this.state.entity.name.default, this.state.seed, this.state.passphrase);
            await this.props.web3Wallet.load(this.state.entity.name.default, this.state.passphrase);
            
            //await this.props.web3Wallet.fillGas();
        }catch (e){
            console.log(e.message);
        }
    }

    async submitEntity() {
        await this.createWebWallet();

        this.setState({ entityUpdating: true })

        const entity = Object.assign({}, this.state.entity)

        const idx = entity.actions.findIndex(act => act.type == "register")
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

        return getGatewayClients().then(clients => {
            const state = getNetworkState()
            return updateEntity(state.address, entity, this.props.web3Wallet.getWallet() as (Wallet | Signer), clients.web3Gateway, clients.dvoteGateway)
        }).then(newOrigin => {
            return this.checkExistingEntity()
        }).then(async () => {
            return await this.props.web3Wallet.getAddress();
        }).then(userAddr => {
            const entityId = getEntityId(userAddr)
            Router.push("/entities/edit/#/" + entityId)

            message.success("The entity has been registered")
            this.setState({ entityUpdating: false })
        }).catch(err => {
            message.error("The entity could not be registered")
            this.setState({ entityUpdating: false })
        })
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

    renderEntityNew() {
        const { entity: entity } = this.state

        return <div className="body-card">
            <Row justify="start">
                <Col xs={24} sm={20} md={14}>
                    <Divider orientation="left">Your Account</Divider>
                    {
                        <>
                        <label>Password</label>
                        <Input type="password"
                            placeholder={"Your new password"}
                            onChange={val => this.onPasswordChange(val.target.value)} />
                        <br /><br />
                        </>
                    }

                    <Divider orientation="left">Profile</Divider>
                    {/*<h2>Name</h2> */}
                    {
                        // (entity.languages).map(lang => <>
                        ['default'].map(lang => <div key={lang}>
                            {/* <label>Entity name ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                            <label>Entity name</label>
                            <Input type="text"
                                value={entity.name[lang]}
                                prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Entity name"}
                                onChange={val => this.onNameChange(val.target.value, lang)} />
                            <br /><br />
                        </div>)
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
                        placeholder="Link to an avatar icon"
                        prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={entity.media && entity.media.avatar}
                        onChange={ev => this.onFieldChange("media", "avatar", ev.target.value)}
                    />
                    <br /><br />
                    <label>Header Image (URL)</label>
                    <Input
                        placeholder="Link to a header image"
                        prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={entity.media && entity.media.header}
                        onChange={ev => this.onFieldChange("media", "header", ev.target.value)}
                    />
                    <br /><br />

                    <Divider />

                    <div style={{ textAlign: "center" }}>
                        {this.state.entityUpdating ?
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                            <Button size='large' type='primary' onClick={() => this.submitEntity()}>Update metadata</Button>
                        }
                    </div>
                </Col>
            </Row>
        </div>
    }

    renderNotFound() {
        return <div className="not-found">
            <h4>Entity not found</h4>
            <p>The entity you are looking for cannot be found</p>
        </div>
    }

    renderLoading() {
        return <div>Loading the details of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
    }

    renderSideMenu() {
        return <div id="page-menu">
            <Menu mode="inline" defaultSelectedKeys={['new']} style={{ width: 200 }}>
                <Menu.Item key="new">
                    <Link href={"/entities/new/"}>
                        <a>Entity details</a>
                    </Link>
                </Menu.Item>
            </Menu>
        </div>
    }

    render() {
        return <div id="entity-new">
            {this.renderSideMenu()}
            {
                this.state.entityLoading ?
                    <div id="page-body" className="center">
                        {this.renderLoading()}
                    </div>
                    :
                    this.state.entity ?
                        <div id="page-body">
                            {this.renderEntityNew()}
                        </div>
                        : <div id="page-body" className="center">
                            {this.renderNotFound()}
                        </div>
            }
        </div >
    }
}


// // Custom layout
// EntityNewPage.Layout = props => <MainLayout>

//   <div>
//     {props.children}
//   </div>
// </MainLayout>

export default EntityNewPage
