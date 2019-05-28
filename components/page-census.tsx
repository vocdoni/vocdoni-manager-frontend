import { Component } from "react"
import { List, Avatar, Empty } from 'antd'
import DvoteUtil from "../util/dvoteUtil";
import { headerBackgroundColor } from "../lib/constants"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string
}
interface State {
    census: object[]
}

export default class PageCensus extends Component<Props, State> {
    dvote: DvoteUtil

    state = {
        census: []
    }

    componentDidMount() {
        this.dvote = new DvoteUtil()
    }

    renderMainContent() {
        if (!this.state.census || !this.state.census.length)
            return <Empty description="No census service agents are available" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            <List
                itemLayout="horizontal"
                dataSource={this.state.census}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar>{item.name[0] + item.lastName[0]}</Avatar>}
                            title={`${item.name} ${item.lastName}`}
                            description={<span>
                                NIF: {item.nif}<br />
                                Public key: <code>{item.publicKey}</code>
                            </span>}
                        />
                    </List.Item>
                )}
            />
        </div>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderMainContent()}
            </div>
        </>
    }
}
