import { Component } from "react"
import { List, Avatar, Empty, Button, Input } from 'antd'
import { headerBackgroundColor } from "../lib/constants"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string
}

interface State {
    processess: object[],
    selectedProcess: number
}



export default class PageVotes extends Component<Props, State> {
    state = {
        processess: [],
        selectedProcess: -1
    }

    renderProcessessList() {
        if (!this.state.processess || !this.state.processess.length)
            return <Empty description="No processess" style={{ padding: 30 }} />

        return <div style={{ padding: 30 }}>
            <List
                itemLayout="horizontal"
                dataSource={this.state.processess}
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

    onProcessClick() {

    }

    renderCreateProcess() {
        return <List>
            <label>Avatar (URL)</label>
            <Input
                placeholder="Link to an avatar icon"
                value={"hello"}
            //onChange={ev => this.onNewFieldChange("media", "avatar", ev.target.value)}
            />
        </List>
    }



    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>



            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 24 }}>
                    <Button
                        type="primary"
                        icon="plus"
                        size={'default'}
                        onClick={this.onProcessClick}>
                        New process
                        </Button>
                </div>
                {this.renderCreateProcess}
                {this.renderProcessessList()}
            </div>
        </>
    }
}
