import { Component } from "react"
import { Layout, Menu, Icon } from 'antd'
import Web3Manager from "../utils/web3Manager"
import { AccountState } from "../utils/accountState"
import DvoteUtil from "../utils/dvoteUtil"
import Registry from "./_list-example"
import Processes from "./processes"

enum Page {
    Processes = "Processess",
    Registry = "UserRegistry",
    Blank = "Blank"
}

interface Props {
    dvote: DvoteUtil
    accountState: AccountState,
    currentAddress: string
    processesMetadata: object
}

interface State {
    selectedProcess: string
    selectedPage: Page,
}

export default class Main extends Component<{}, State, Props> {

    state = {
        selectedPage: Page.Processes,
        selectedProcess: ""
    }

    onMenuClick = (e) => {
        this.setPage(e.key)
    }

    setPage = (page) => {
        let selectedPage = this.state.selectedPage
        let selectedProcess = ""

        if (page === Page.Processes) {
            selectedPage = Page.Processes
        }
        else if (page === Page.Registry) {
            selectedPage = Page.Registry
        }

        this.setState({ selectedProcess, selectedPage })
    }

    onClickUnlockAccount = () => {
        Web3Manager.unlock()
    }

    renderContent = () => {
        switch (this.state.selectedPage) {
            case Page.Registry:
                return <Registry dvote={this.props.dvote} />
            case Page.Processes:
                return <Processes
                    dvote={this.props.dvote}
                    processesMetadata={this.props.processesMetadata}
                />
            default:
                return null
        }
    }

    render() {
        return <Layout style={{ background: '#fff', paddingTop: 20 }}>
            <Menu
                mode="horizontal"
                defaultSelectedKeys={[Page.Processes]}
                defaultOpenKeys={[]}
                onClick={this.onMenuClick}
                style={{ height: '100%' }}
            >

                <Menu.Item key={Page.Processes} >
                    <span><Icon type="mail" />Processes</span>
                </Menu.Item>

                <Menu.Item key={Page.Registry} >
                    <span><Icon type="team" />Registry</span>
                </Menu.Item>
            </Menu>

            <Layout.Content style={{ paddingTop: '30px', minHeight: 280, minWidth: 300 }}>
                {this.renderContent()}
            </Layout.Content>
        </Layout>

    }
}
