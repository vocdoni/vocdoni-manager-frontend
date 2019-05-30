import { Component } from "react"
import { List, Avatar, Empty } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { getState } from "../util/dvote"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    refresh?: () => void
}
interface State {
    accountAddress: string,
    news: { [lang: string]: any[] },
    selectedLang: string
}

export default class PagePosts extends Component<Props, State> {
    state = {
        accountAddress: "",
        news: {},
        selectedLang: "en"
    }

    refreshInterval: any

    componentDidMount() {
        this.refreshInterval = setInterval(() => this.refreshState(), 1000)
        this.refreshState()
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
    }

    async refreshState() {
        const prevAddress = this.state.accountAddress
        const prevNews = this.state.news

        // Changes? => sync
        const { address, news } = getState();
        if (prevAddress != address || prevNews != news) {
            this.setState({
                accountAddress: address,
                news
            })
        }
    }

    renderMainContent() {
        const langs = Object.keys(this.state.news);
        if (!langs.length)
            return <Empty description="No posts have been added yet" style={{ padding: 30 }} />


        return <div style={{ padding: 30 }}>
            <List
                itemLayout="horizontal"
                dataSource={this.state.news}
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
