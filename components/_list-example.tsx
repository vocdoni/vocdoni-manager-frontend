import { Component } from "react"
import { List, Avatar, Empty } from 'antd'
import DvoteUtil from "../utils/dvoteUtil";

interface State {
    users: any[]
}
interface Props {
    dvote: DvoteUtil
}

export default class registry extends Component<{}, State, Props> {

    state = {
        users: []
    }

    async componentDidMount() {
        let users = await this.props.dvote.getUsersRegisryList()
        this.setState({ users })
    }

    render() {
        if (!this.state.users || !this.state.users.length)
            return <Empty description="No users are registered yet" />

        return <List
            itemLayout="horizontal"
            dataSource={this.state.users}
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

