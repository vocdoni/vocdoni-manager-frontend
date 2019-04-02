import { Component } from "react"
import { List, Avatar, Empty } from 'antd'
import DvoteUtil from "../utils/dvoteUtil";
import { headerBackgroundColor } from "../lib/constants"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string
}
interface State {
    posts: object[]
}

export default class PagePosts extends Component<Props, State> {
    dvote: DvoteUtil

    state = {
        posts: []
    }

    componentDidMount() {
        this.dvote = new DvoteUtil()
    }

    renderMainContent() {
        if (!this.state.posts || !this.state.posts.length)
            return <Empty description="No posts have been added yet" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            <List
                itemLayout="horizontal"
                dataSource={this.state.posts}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar>{item.name}</Avatar>}
                            title={`${item.name} ${item.lastName}`}
                            description={<span>Content here</span>}
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
