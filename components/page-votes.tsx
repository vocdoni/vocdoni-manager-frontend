import { Component } from "react"
import { Col, List, Avatar, Empty, Button, Input } from 'antd'
import { headerBackgroundColor } from "../lib/constants"
import { ProcessMetadata } from "dvote-js"


import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string
}

interface State {
    processess: object[],
    selectedProcess: number
    newProcess: ProcessMetadata
}



export default class PageVotes extends Component<Props, State> {
    state = {
        processess: [],
        selectedProcess: -1,
        newProcess: this.makeEmptyProcess()
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

    setData(process, fields, value) {
        if (process[fields[0]] == null)
            process[fields[0]] = {}
    }

    makeEmptyProcess() {
        let process: ProcessMetadata = {
            version: "1.0",
            type: "snark-vote",
            startBlock: 0,
            numberOfBlocks: 0,
            census: {
                censusMerkleRoot: "",
                censusMerkleTree: ""
            },
            details: {
                entityId: "",
                encryptionPublicKey: "",
                title: {
                    default: ""
                },
                description: {
                    default: ""
                },
                headerImage: "",
                questions: []
            }
        }
        return process
    }

    /*onNewFieldChange(key: string, subkey: string, subsubkey: string, value: string) {
        console.log(value)
        if (subkey === null) {
            const newProcess = Object.assign({}, this.state.newProcess, { [key]: value })
            this.setState({ newProcess: newProcess })
        }

        else {
            const newProcess = Object.assign({}, this.state.newProcess)
            if (subkey != null) {
                if (typeof newProcess[key] != "object") newProcess[key] = {}
                newProcess[key][subkey] = value

            }
            if (subsubkey != null) {
                if (typeof newProcess[key][subkey] != "object") newProcess[key][subkey] = {}
                newProcess[key][subkey][subsubkey] = value
            }

            this.setState({ newProcess })
        }
    }

}*/

    setNestedKey = (obj, path, value) => {
        if (path.length === 1) {
            obj[path] = value
            return
        }
        return this.setNestedKey(obj[path[0]], path.slice(1), value)
    }

    setNewProcessField(path, value) {
        let process = this.setNestedKey(this.state.newProcess, path, value)
        this.setState({ newProcess: process })
    }


    renderCreateProcess() {
        return <Col xs={24} md={12}>
            <Input
                placeholder="Name"
                value={this.state.newProcess.details.title.default}
                onChange={ev => this.setNewProcessField(['title', 'default'], ev.target.value)}
            />

            <Input
                placeholder="Description"
                value={this.state.newProcess.details.description['default']}
            //onChange={ev => this.onNewFieldChange("media", "avatar", ev.target.value)}
            />

            <Input
                placeholder="Starting block"
                value={this.state.newProcess.startBlock}
            //onChange={ev => this.onNewFieldChange("media", "avatar", ev.target.value)}
            />


            <Input
                placeholder="Number of blocks"
                value={this.state.newProcess.numberOfBlocks}
            //onChange={ev => this.onNewFieldChange("media", "avatar", ev.target.value)}
            />

        </Col>
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
                {this.renderCreateProcess()}
                {this.renderProcessessList()}
            </div>
        </>
    }
}
