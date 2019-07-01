import { Component } from "react"
import CreateEntity from "./fragment-create-entity"
import { Row, Col, Divider, Skeleton, message, notification } from "antd"
import { getState, fetchState, updateEntity } from "../lib/dvote"
import { EntityMetadata } from "dvote-js"
import { by639_1 } from 'iso-language-codes'
import { headerBackgroundColor } from "../lib/constants"
import { Layout, Button, Input, Icon, Select } from 'antd'
const { Header } = Layout
const { Option } = Select

const languageCodes = Object.keys(by639_1).sort().reduce((prev, cur) => {
    if (!prev.includes(cur)) prev.push(cur)
    return prev
}, [])

interface Props {
    refresh?: () => void
}
type State = ({
    accountAddress: string,
    entityMetadata: EntityMetadata
})

export default class PageEntityMeta extends Component<Props, State> {

    refreshInterval: any

    componentDidMount() {
        this.refreshInterval = setInterval(() => this.refreshState(), 1000)

        fetchState().then(() => {
            const { address, entityMetadata } = getState();

            this.setState({
                accountAddress: address,
                entityMetadata
            })
        }).catch(err => {
            message.error("There was an error connecting to the network")
        })
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    refreshState() {
        const prevAddress = this.state.accountAddress
        const { address, entityMetadata } = getState();

        if (prevAddress == address) return
        this.setState({
            accountAddress: address,
            entityMetadata
        })
    }

    // EVENTS
    onNameChange(lang: string, value: string) {
        const entity = this.state.entityMetadata
        entity.name = Object.assign({}, entity.name, { [lang]: value })
        this.setState({ entityMetadata: entity })
    }
    onDescriptionChange(lang: string, value: string) {
        const entity = this.state.entityMetadata
        entity.description = Object.assign({}, entity.description, { [lang]: value })
        this.setState({ entityMetadata: entity })
    }
    onFieldChange(fieldKey: string, value: string) {
        const entity = Object.assign({}, this.state.entityMetadata, { [fieldKey]: value })
        this.setState({ entityMetadata: entity })
    }

    async persistChanges() {
        if (!confirm("You are about to persist the following changes on the blockchain.\nDo you want to continue?")) return;

        try {
            await updateEntity(this.state.accountAddress, this.state.entityMetadata)
        }
        catch (err) {
            console.log(err)
            notification.error({ message: "Error", description: "The metadata could not be updated at this point" })
        }
    }

    renderMainContent() {
        const state: State = this.state

        return <div style={{ padding: 30 }}>
            <h2>General</h2>

            <Row gutter={16}>
                {/* <Col xs={24} md={12}>
                    <label>Supported languages</label>
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select the supported languages"
                        value={state.entityMetadata.languages || []}
                        onChange={langs => this.onLanguagesChange(langs)}
                    >
                        {languageCodes.map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                    </Select>
                    <br /><br />
                    <div>
                        <label>Default language</label>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Select the default language"
                            value={state.defaultLanguage || ""}
                            onChange={lang => this.onDefaultLanguageChange(lang)}
                        >
                            {(state.entityMetadata.languages || []).map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                        </Select>
                    </div>
                </Col> */}
                <Col xs={24} md={12}>
                    {
                        state.entityMetadata.languages.map(lang => <div key={lang}>
                            <label>Official name ({by639_1[lang] ? by639_1[lang].name : lang})</label>
                            <Input type="text"
                                value={state.entityMetadata.name[lang]}
                                prefix={<Icon type="info-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Entity name"}
                                onChange={ev => this.onNameChange(lang, ev.target.value)} />
                            <br /><br />
                        </div>)
                    }
                </Col>
                <Col xs={24} md={12}>
                    {
                        state.entityMetadata.languages.map(lang => <div key={lang}>
                            <label>Description ({by639_1[lang] ? by639_1[lang].name : lang})</label>
                            <Input type="text"
                                value={state.entityMetadata.description[lang]}
                                prefix={<Icon type="book" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Description"}
                                onChange={ev => this.onDescriptionChange(lang, ev.target.value)} />
                            <br /><br />
                        </div>)
                    }
                </Col>
                <Col xs={24} md={12}>
                    <label>Avatar (URL)</label>
                    <Input
                        placeholder="Link to an avatar icon"
                        prefix={<Icon type="file-image" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={this.state.entityMetadata.avatar}
                        onChange={ev => this.onFieldChange("avatar", ev.target.value)}
                    />
                </Col>
            </Row>

            {/* BOOT_ENTITIES */}
            {/* TRUSTED_ENTITIES */}

            <Divider />
            <p style={{ textAlign: "center" }}>
                <small>Updating the fields above may require signing two transactions.</small>
            </p>

            <div style={{ textAlign: "center" }}>
                <Button size='large' type='primary' onClick={() => this.persistChanges()}>Persist changes</Button>
            </div>
        </div>
    }

    render() {
        const state: State = this.state

        if (!state || !state.entityMetadata) {
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
                <h2>{state.entityMetadata.name["default"]}</h2>
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderMainContent()}
            </div>
        </>
    }
}
