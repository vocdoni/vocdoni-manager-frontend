import { Component } from "react"
import { List, Avatar, Empty } from 'antd'
import DvoteUtil from "../utils/dvoteUtil";

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

    render() {
        if (!this.state.posts || !this.state.posts.length)
            return <Empty description="No posts have been added yet" style={{ padding: 30 }}/>

        return <List
            itemLayout="horizontal"
            style={{ padding: 30 }}
            dataSource={this.state.posts}
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
    }
}
