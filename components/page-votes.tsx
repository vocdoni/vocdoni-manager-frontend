import { Component } from "react"
import { Empty, Menu, Icon } from 'antd'
import DvoteUtil from "../util/dvoteUtil";
import { headerBackgroundColor } from "../lib/constants"
import NewProcess from "./fragment-create-process"

import { Layout } from 'antd'
const { Header, Sider, Content } = Layout

const NEW_PROCESS_KEY = "NEW_PROCESS_KEY"

interface Props {
    entityDetails: object,
    currentAddress: string,
    processesMetadata: any
}
interface State {
    selectedProcess: string
}

export default class PageVotes extends Component<Props, State> {
    dvote: DvoteUtil

    state = {
        selectedProcess: ""
    }

    renderMenu() {
        return Object.keys(this.props.processesMetadata || []).map((processId) => {
            let processMetadata = this.props.processesMetadata[processId]
            return <Menu.Item key={processMetadata.id}>{processMetadata.name}</Menu.Item>
        });
    }

    onMenuClick = (e) => {
        this.setState({ selectedProcess: e.key })
    }

    renderNoExistingProcessMessage = () => {
        return <Empty description="No exsisting votes exist for this address" style={{ padding: 30 }} />
    }

    renderEmptyPlaceholder = () => {
        return <Empty description="Select a process to display or create a new one" style={{ padding: 30 }} />
    }

    renderBody = () => {
        if (this.state.selectedProcess == NEW_PROCESS_KEY)
            return <NewProcess dvote={this.props.dvote} />

        if (!Object.keys(this.props.processesMetadata || []).length)
            return this.renderNoExistingProcessMessage()

        if (!this.state.selectedProcess)
            return this.renderEmptyPlaceholder()


        let metadata = this.props.processesMetadata[this.state.selectedProcess]

        if (!metadata)
            return this.renderEmptyPlaceholder()

        return <div>
            <h2>{metadata.name}</h2>
            <code style={{ color: "#ccc" }}>{metadata.id}</code>
            <h4 style={{ marginTop: 20 }}>{metadata.question}</h4>
            <ul>
                {metadata.votingOptions.map(option => <li key={option}>{option}</li>)}
            </ul>
        </div>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <Layout style={{ background: '#fff' }}>
                <Sider width={200} style={{backgroundColor: "white"}}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['']}
                        defaultOpenKeys={['Processes']}
                        onClick={this.onMenuClick}
                        style={{ maxHeight: "80vh", overflowY: "scroll" }}
                    >
                        <Menu.Item key={NEW_PROCESS_KEY} >
                            <span><Icon type="plus" />New process</span>
                        </Menu.Item>

                        {this.renderMenu()}
                    </Menu>
                </Sider>
                <Content style={{ margin: 30, minHeight: 280, minWidth: 300 }}>
                    {this.renderBody()}
                </Content>
            </Layout>
        </>
    }
}
