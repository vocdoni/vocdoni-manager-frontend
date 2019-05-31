import { Component } from "react"
import { getState, getAllEntityFields, getEntityField, setEntityTextField, setEntityTextListField } from "../util/dvote"
import CreateEntity from "./fragment-create-entity"
import { Row, Col, Divider, Skeleton, message, notification } from "antd"
import { EntityResolverFields } from "dvote-js"
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
    defaultLanguage: string
} & EntityResolverFields)

export default class PageEntityMeta extends Component<Props, State> {

    refreshInterval: any

    componentDidMount() {
        this.refreshInterval = setInterval(() => this.refreshAddress(), 1000)

        const { address } = getState();
        this.setState({ accountAddress: address })

        getAllEntityFields(address).then(result => {
            this.setState({ ...result })
            if (result["vnd.vocdoni.languages"]) this.setState({ defaultLanguage: result["vnd.vocdoni.languages"][0] })
        }).catch(err => {
            message.error("There was an error connecting to the network")
        })
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    // async fetchFullState() {
    //     const prevAddress = this.state.accountAddress

    //     // Changes? => sync
    //     const { address, entityInfo } = getState();
    //     if (prevAddress != address || prevEntityInfo != entityInfo) {
    //         this.setState({
    //             accountAddress: address,
    //             entityInfo
    //         })
    //     }
    // }

    async refreshAddress() {
        const prevAddress = this.state.accountAddress
        const { address } = getState();

        if (prevAddress == address) return
        this.setState({ accountAddress: address })
    }

    // EVENTS
    onTextChange(name: string, value: string) {
        if (name.match(/^vnd.vocdoni.entity-name./)) {
            const lang = name.replace("vnd.vocdoni.entity-name.", "")
            if (lang == this.state.defaultLanguage) {
                this.setState({
                    "vnd.vocdoni.entity-name": value,
                    [name]: value
                } as any)
            }
            else this.setState({ [name]: value } as any)
        }
        else if (name.match(/^vnd.vocdoni.entity-description./)) {
            const lang = name.replace("vnd.vocdoni.entity-description.", "")
            if (lang == this.state.defaultLanguage) {
                this.setState({
                    "vnd.vocdoni.entity-description": value,
                    [name]: value
                } as any)
            }
            else this.setState({ [name]: value } as any)
        }
        else if (name == "vnd.vocdoni.avatar") {
            this.setState({ [name]: value } as any)
        }
    }
    onLanguagesChange(languages) {
        this.setState({ "vnd.vocdoni.languages": languages })
    }
    onDefaultLanguageChange(language) {
        this.setState({
            defaultLanguage: language,
            "vnd.vocdoni.entity-name": this.state["vnd.vocdoni.entity-name." + language]
        })
    }
    async persistChanges() {
        if (!confirm("You are about to persist the following changes to the blockchain.\nDo you want to continue?")) return;

        try {
            // Update the languages if changed
            let key = "vnd.vocdoni.languages"

            const newLanguages = JSON.stringify(this.state[key])
            const currentLanguages = await getEntityField(this.state.accountAddress, key)
            if (currentLanguages != newLanguages) {
                await setEntityTextField(this.state.accountAddress, key, newLanguages)
            }

            // Update the name if changed
            key = "vnd.vocdoni.entity-name"

            const currentName = await getEntityField(this.state.accountAddress, key)
            if (this.state[key] && currentName != this.state[key]) {
                await setEntityTextField(this.state.accountAddress, key, this.state[key])
            }


            // GENERATE JSON

            // UPLOAD UPDATED JSON
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
                <Col xs={24} md={12}>
                    <label>Supported languages</label>
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select the supported languages"
                        value={state["vnd.vocdoni.languages"] || []}
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
                            {(state["vnd.vocdoni.languages"] || []).map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
                        </Select>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    {
                        state["vnd.vocdoni.languages"].map(lang => <div key={lang}>
                            <label>Official name ({by639_1[lang].name})</label>
                            <Input type="text"
                                value={state["vnd.vocdoni.entity-name." + lang]}
                                prefix={<Icon type="info-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Entity name"}
                                onChange={ev => this.onTextChange("vnd.vocdoni.entity-name." + lang, ev.target.value)} />
                            <br /><br />
                        </div>)
                    }
                </Col>
                <Col xs={24} md={12}>
                    {
                        state["vnd.vocdoni.languages"].map(lang => <div key={lang}>
                            <label>Description ({by639_1[lang].name})</label>
                            <Input type="text"
                                value={state["vnd.vocdoni.entity-description." + lang]}
                                prefix={<Icon type="book" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder={"Description"}
                                onChange={ev => this.onTextChange("vnd.vocdoni.entity-description." + lang, ev.target.value)} />
                            <br /><br />
                        </div>)
                    }
                </Col>
                <Col xs={24} md={12}>
                    <label>Avatar (URL)</label>
                    <Input
                        placeholder="Link to an avatar icon"
                        prefix={<Icon type="file-image" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        value={this.state["vnd.vocdoni.avatar"]}
                        onChange={ev => this.onTextChange("vnd.vocdoni.avatar", ev.target.value)}
                    />
                </Col>
            </Row>

            {/* [TextListRecordKeys.BOOT_ENTITIES] */}
            {/* [TextListRecordKeys.TRUSTED_ENTITIES] */}

            <Divider />
            <p style={{ textAlign: "center" }}>
                <small>Updating the fields above may require several transactions to the blockchain.</small>
            </p>

            <div style={{ textAlign: "center" }}>
                <Button size='large' type='primary' onClick={() => this.persistChanges()}>Persist changes</Button>
            </div>
        </div>
    }

    render() {
        const state: State = this.state

        if (!state || !state["vnd.vocdoni.entity-name"]) {
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
                <h2>{state["vnd.vocdoni.entity-name"]}</h2>
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderMainContent()}
            </div>
        </>
    }
}
